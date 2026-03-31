#!/usr/bin/env tsx

/**
 * MST Question Bank Seeder — AI-generated items
 *
 * Generates MST items for all skill × CEFR × stage cells using
 * Ollama (primary) with OpenAI as fallback. Upserts into
 * placement_test_questions with stage/IRT columns populated.
 *
 * Usage:
 *   npx tsx server/scripts/seed-mst-question-bank.ts
 *   npx tsx server/scripts/seed-mst-question-bank.ts --count 5
 *   npx tsx server/scripts/seed-mst-question-bank.ts --count 3 --dry-run
 *   npx tsx server/scripts/seed-mst-question-bank.ts --skill listening --cefr B1
 */

import { Pool } from 'pg';

const COUNT = (() => {
  const idx = process.argv.indexOf('--count');
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) || 3 : 3;
})();
const DRY_RUN   = process.argv.includes('--dry-run');
const SKILL_FILTER = (() => {
  const idx = process.argv.indexOf('--skill');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();
const CEFR_FILTER = (() => {
  const idx = process.argv.indexOf('--cefr');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// Full matrix
const SKILLS  = ['listening', 'reading', 'speaking', 'writing'] as const;
const CEFRS   = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const STAGES  = ['core', 'upper', 'lower'] as const;

type Skill  = typeof SKILLS[number];
type CEFR   = typeof CEFRS[number];
type Stage  = typeof STAGES[number];

// IRT parameter mapping (2PL model) — stage delta ±0.30
const IRT_BY_CEFR: Record<CEFR, { difficulty: number; discrimination: number }> = {
  A1: { difficulty: -2.0, discrimination: 0.80 },
  A2: { difficulty: -1.0, discrimination: 1.00 },
  B1: { difficulty:  0.0, discrimination: 1.20 },
  B2: { difficulty:  1.0, discrimination: 1.40 },
  C1: { difficulty:  2.0, discrimination: 1.60 },
  C2: { difficulty:  3.0, discrimination: 1.80 },
};
const STAGE_DELTA: Record<Stage, number> = { upper: 0.30, core: 0.00, lower: -0.30 };

function deriveIRT(cefr: CEFR, stage: Stage) {
  const base = IRT_BY_CEFR[cefr];
  return {
    difficulty:     Math.max(-3, Math.min(3, base.difficulty + STAGE_DELTA[stage])),
    discrimination: base.discrimination,
  };
}

function getQuestionType(skill: Skill): string {
  switch (skill) {
    case 'listening': return 'listening_comprehension';
    case 'reading':   return 'reading_comprehension';
    case 'speaking':  return 'spoken_response';
    case 'writing':   return 'written_response';
  }
}

function getResponseType(skill: Skill): string {
  if (skill === 'speaking') return 'audio';
  if (skill === 'writing')  return 'text';
  return 'mcq';
}

function getExpectedDuration(skill: Skill, cefr: CEFR): number {
  const base = { A1: 30, A2: 45, B1: 60, B2: 80, C1: 100, C2: 120 }[cefr];
  if (skill === 'listening') return base;
  if (skill === 'reading')   return base * 1.5;
  if (skill === 'speaking')  return 30 + base;
  if (skill === 'writing')   return base * 3;
  return 60;
}

// ─── AI generation ───────────────────────────────────────────────────────────

async function callOllama(prompt: string): Promise<string | null> {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  try {
    const res = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { response?: string };
    return json.response || null;
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function generateWithAI(prompt: string): Promise<string | null> {
  const ollamaResult = await callOllama(prompt);
  if (ollamaResult) return ollamaResult;
  return callOpenAI(prompt);
}

function extractJSON(text: string): Record<string, unknown> | null {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Try to find JSON block within the text
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { return null; }
    }
    return null;
  }
}

// ─── Item generation per skill/cefr/stage ────────────────────────────────────

interface GeneratedItem {
  mstItemId: string;
  title: string;
  prompt: string;
  content: Record<string, unknown>;
  tags: string[];
}

async function generateListeningItem(cefr: CEFR, stage: Stage, idx: number): Promise<GeneratedItem> {
  const prompt = `Generate a CEFR ${cefr} English listening comprehension test item for an MST placement test.
Stage: ${stage}. Item index: ${idx + 1}.

Return valid JSON only:
{
  "transcript": "A 2-4 sentence passage appropriate for ${cefr} level",
  "question": "A comprehension question about the passage",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "answerIndex": 0,
  "accent": "genAm",
  "domain": "social"
}`;

  const raw = await generateWithAI(prompt);
  const data = raw ? extractJSON(raw) : null;

  const transcript = (data?.transcript as string) || `A ${cefr} level listening passage for ${stage} stage assessment.`;
  const question   = (data?.question as string)   || 'What is the main idea of the passage?';
  const options    = (data?.options as string[])  || ['Option A', 'Option B', 'Option C', 'Option D'];
  const answerIdx  = typeof data?.answerIndex === 'number' ? data.answerIndex : 0;
  const accent     = (data?.accent as string)     || 'genAm';
  const domain     = (data?.domain as string)     || 'general';

  const id = `L-${cefr}-${stage.substring(0, 1).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`;
  return {
    mstItemId: id,
    title: `Listening ${cefr} (${stage}) #${idx + 1}`,
    prompt: `[Listen to the audio] ${transcript.substring(0, 200)}`,
    content: {
      id, skill: 'listening', stage, cefr,
      assets: { transcript, audio: '' },
      timing: { audioSec: 30, maxAnswerSec: getExpectedDuration('listening', cefr) },
      questions: [{ type: 'mcq_single', stem: question, options, answerIndex: answerIdx }],
      metadata: { domain, accent },
    },
    tags: ['listening', cefr, stage, 'mst', domain],
  };
}

async function generateReadingItem(cefr: CEFR, stage: Stage, idx: number): Promise<GeneratedItem> {
  const prompt = `Generate a CEFR ${cefr} English reading comprehension test item for an MST placement test.
Stage: ${stage}. Item index: ${idx + 1}.

Return valid JSON only:
{
  "passage": "A 3-5 sentence passage appropriate for ${cefr} level",
  "question": "A comprehension question",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "answerIndex": 0,
  "domain": "academic"
}`;

  const raw = await generateWithAI(prompt);
  const data = raw ? extractJSON(raw) : null;

  const passage  = (data?.passage as string)  || `A ${cefr} level reading passage for ${stage} stage placement assessment.`;
  const question = (data?.question as string) || 'What is the main idea of the passage?';
  const options  = (data?.options as string[])|| ['Option A', 'Option B', 'Option C', 'Option D'];
  const answerIdx = typeof data?.answerIndex === 'number' ? data.answerIndex : 0;
  const domain   = (data?.domain as string)   || 'general';

  const id = `R-${cefr}-${stage.substring(0, 1).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`;
  return {
    mstItemId: id,
    title: `Reading ${cefr} (${stage}) #${idx + 1}`,
    prompt: passage,
    content: {
      id, skill: 'reading', stage, cefr,
      assets: { passage },
      timing: { maxAnswerSec: getExpectedDuration('reading', cefr) },
      questions: [{ type: 'mcq_single', stem: question, options, answerIndex: answerIdx }],
      metadata: { domain },
    },
    tags: ['reading', cefr, stage, 'mst', domain],
  };
}

async function generateSpeakingItem(cefr: CEFR, stage: Stage, idx: number): Promise<GeneratedItem> {
  const prompt = `Generate a CEFR ${cefr} English speaking test prompt for an MST placement test.
Stage: ${stage}. Item index: ${idx + 1}.

Return valid JSON only:
{
  "prompt": "A speaking task prompt appropriate for ${cefr} level (1-2 sentences)",
  "keywords": ["word1", "word2", "word3"],
  "structure": "Brief outline of expected response structure"
}`;

  const raw = await generateWithAI(prompt);
  const data = raw ? extractJSON(raw) : null;

  const spPrompt  = (data?.prompt as string)    || `Describe a personal experience relevant to your ${cefr} level proficiency.`;
  const keywords  = (data?.keywords as string[])|| ['describe', 'explain', 'opinion'];
  const structure = (data?.structure as string) || 'Introduction, main point, conclusion';

  const duration = getExpectedDuration('speaking', cefr);
  const id = `S-${cefr}-${stage.substring(0, 1).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`;
  return {
    mstItemId: id,
    title: `Speaking ${cefr} (${stage}) #${idx + 1}`,
    prompt: spPrompt,
    content: {
      id, skill: 'speaking', stage, cefr,
      assets: { prompt: spPrompt, keywords, structure },
      timing: { prepSec: 15, recordSec: duration, maxAnswerSec: 15 + duration },
      metadata: { domain: 'general' },
    },
    tags: ['speaking', cefr, stage, 'mst'],
  };
}

async function generateWritingItem(cefr: CEFR, stage: Stage, idx: number): Promise<GeneratedItem> {
  const prompt = `Generate a CEFR ${cefr} English writing test prompt for an MST placement test.
Stage: ${stage}. Item index: ${idx + 1}.

Return valid JSON only:
{
  "prompt": "A writing task prompt appropriate for ${cefr} level",
  "taskType": "opinion",
  "minWords": 80,
  "maxWords": 150
}`;

  const raw = await generateWithAI(prompt);
  const data = raw ? extractJSON(raw) : null;

  const wPrompt  = (data?.prompt as string)   || `Write about a topic appropriate for ${cefr} level proficiency.`;
  const taskType = (data?.taskType as string) || 'opinion';
  const minWords = typeof data?.minWords === 'number' ? data.minWords : 80;
  const maxWords = typeof data?.maxWords === 'number' ? data.maxWords : 150;

  const duration = getExpectedDuration('writing', cefr);
  const id = `W-${cefr}-${stage.substring(0, 1).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`;
  return {
    mstItemId: id,
    title: `Writing ${cefr} (${stage}) #${idx + 1}`,
    prompt: wPrompt,
    content: {
      id, skill: 'writing', stage, cefr,
      assets: { prompt: wPrompt, minWords, maxWords, taskType },
      timing: { maxAnswerSec: duration },
      metadata: { domain: 'general' },
    },
    tags: ['writing', cefr, stage, 'mst', taskType],
  };
}

async function generateItem(skill: Skill, cefr: CEFR, stage: Stage, idx: number): Promise<GeneratedItem> {
  switch (skill) {
    case 'listening': return generateListeningItem(cefr, stage, idx);
    case 'reading':   return generateReadingItem(cefr, stage, idx);
    case 'speaking':  return generateSpeakingItem(cefr, stage, idx);
    case 'writing':   return generateWritingItem(cefr, stage, idx);
  }
}

// ─── DB upsert ───────────────────────────────────────────────────────────────

async function upsertItem(pool: Pool, skill: Skill, cefr: CEFR, stage: Stage, item: GeneratedItem): Promise<'inserted' | 'updated' | 'skipped'> {
  const irt = deriveIRT(cefr, stage);
  const questionType = getQuestionType(skill);
  const responseType = getResponseType(skill);
  const duration = getExpectedDuration(skill, cefr);

  try {
    const existing = await pool.query(
      'SELECT id FROM placement_test_questions WHERE mst_item_id = $1',
      [item.mstItemId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE placement_test_questions SET
          skill=$1, cefr_level=$2, question_type=$3, title=$4, prompt=$5,
          content=$6, response_type=$7, expected_duration_seconds=$8,
          scoring_criteria=$9, stage=$10, difficulty=$11, discrimination=$12,
          tags=$13, estimated_completion_minutes=$14, is_active=true, updated_at=NOW()
         WHERE mst_item_id=$15`,
        [
          skill, cefr, questionType, item.title, item.prompt,
          JSON.stringify(item.content), responseType, duration,
          JSON.stringify({ type: responseType, cefr, stage }),
          stage, irt.difficulty, irt.discrimination,
          item.tags, Math.ceil(duration / 60), item.mstItemId,
        ]
      );
      return 'updated';
    }

    await pool.query(
      `INSERT INTO placement_test_questions
        (skill, cefr_level, question_type, title, prompt, content, response_type,
         expected_duration_seconds, scoring_criteria, max_score, stage, difficulty,
         discrimination, mst_item_id, tags, estimated_completion_minutes, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)`,
      [
        skill, cefr, questionType, item.title, item.prompt,
        JSON.stringify(item.content), responseType, duration,
        JSON.stringify({ type: responseType, cefr, stage }), 100,
        stage, irt.difficulty, irt.discrimination, item.mstItemId,
        item.tags, Math.ceil(duration / 60),
      ]
    );
    return 'inserted';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ DB error for ${item.mstItemId}:`, msg);
    return 'skipped';
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌱 MST Question Bank Seeder (AI-generated)`);
  console.log(`   Items per cell: ${COUNT}${DRY_RUN ? ' [DRY RUN]' : ''}`);
  if (SKILL_FILTER) console.log(`   Skill filter:  ${SKILL_FILTER}`);
  if (CEFR_FILTER)  console.log(`   CEFR filter:   ${CEFR_FILTER}`);

  const skills = SKILL_FILTER ? [SKILL_FILTER as Skill] : [...SKILLS];
  const cefrs  = CEFR_FILTER  ? [CEFR_FILTER as CEFR]  : [...CEFRS];

  const totalCells = skills.length * cefrs.length * STAGES.length;
  const totalItems = totalCells * COUNT;
  console.log(`   Total cells:   ${totalCells}  (${skills.length} skills × ${cefrs.length} CEFRs × ${STAGES.length} stages)`);
  console.log(`   Total items:   ${totalItems}\n`);

  // Verify AI availability
  const testResult = await generateWithAI('Say "ready" in one word.');
  if (!testResult) {
    console.warn('⚠️  Neither Ollama nor OpenAI responded. Items will use template fallback content.');
  } else {
    const provider = await callOllama('Say "ready"') ? 'Ollama' : 'OpenAI';
    console.log(`✅ AI provider: ${provider}\n`);
  }

  if (DRY_RUN) {
    for (const skill of skills) {
      for (const cefr of cefrs) {
        for (const stage of STAGES) {
          const irt = deriveIRT(cefr, stage);
          for (let i = 0; i < COUNT; i++) {
            const id = `${skill[0].toUpperCase()}-${cefr}-${stage[0].toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
            console.log(`  [DRY] ${id}  difficulty=${irt.difficulty.toFixed(2)}  discrimination=${irt.discrimination.toFixed(2)}`);
          }
        }
      }
    }
    console.log('\n✅ Dry run complete — no changes made');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  let inserted = 0, updated = 0, skipped = 0;

  for (const skill of skills) {
    for (const cefr of cefrs) {
      for (const stage of STAGES) {
        // Check existing count for this cell
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM placement_test_questions
            WHERE skill=$1 AND cefr_level=$2 AND stage=$3 AND mst_item_id IS NOT NULL AND is_active=true`,
          [skill, cefr, stage]
        );
        const existing = parseInt(countRes.rows[0].count, 10);
        const needed = Math.max(0, COUNT - existing);

        if (needed === 0) {
          console.log(`  ✓ ${skill}/${cefr}/${stage}: already has ${existing} items (target: ${COUNT})`);
          continue;
        }

        console.log(`  📝 ${skill}/${cefr}/${stage}: ${existing} items → generating ${needed} more…`);

        for (let i = existing; i < existing + needed; i++) {
          process.stdout.write(`     [${i + 1}/${existing + needed}] generating… `);
          const item = await generateItem(skill, cefr, stage, i);
          const outcome = await upsertItem(pool, skill, cefr, stage, item);
          console.log(`${outcome} (${item.mstItemId})`);
          if (outcome === 'inserted') inserted++;
          else if (outcome === 'updated') updated++;
          else skipped++;
          // Small delay to avoid rate limits
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }
  }

  await pool.end();

  const total = inserted + updated + skipped;
  console.log(`\n🎉 Seeding complete!`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   🔄 Updated:  ${updated}`);
  console.log(`   ❌ Skipped:  ${skipped}`);
  console.log(`   📊 Total:    ${total}`);

  // Final cell coverage report
  const coveragePool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  const coverageRes = await coveragePool.query(
    `SELECT skill, cefr_level, stage, COUNT(*) as cnt
       FROM placement_test_questions
      WHERE mst_item_id IS NOT NULL AND is_active=true
      GROUP BY skill, cefr_level, stage
      ORDER BY skill, cefr_level, stage`
  );
  await coveragePool.end();

  console.log(`\n📊 DB cell coverage:`);
  for (const row of coverageRes.rows) {
    const adequate = parseInt(row.cnt, 10) >= COUNT ? '✅' : '⚠️ ';
    console.log(`   ${adequate} ${row.skill}/${row.cefr_level}/${row.stage}: ${row.cnt} items`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
