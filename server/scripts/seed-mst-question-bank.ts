#!/usr/bin/env tsx

/**
 * MST Question Bank Seeder — AI-generated items (Ollama primary, OpenAI fallback)
 *
 * Generates MST items for every skill × CEFR × stage × question-type cell, upserts
 * into placement_test_questions with stage/IRT columns populated.
 *
 * Usage:
 *   npx tsx server/scripts/seed-mst-question-bank.ts
 *   npx tsx server/scripts/seed-mst-question-bank.ts --count 5
 *   npx tsx server/scripts/seed-mst-question-bank.ts --count 3 --dry-run
 *   npx tsx server/scripts/seed-mst-question-bank.ts --skill listening --cefr B1
 */

import { Pool } from 'pg';

// ─── CLI args ────────────────────────────────────────────────────────────────

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? (process.argv[idx + 1] ?? null) : null;
}

const COUNT       = parseInt(getArg('--count') ?? '3', 10);
const DRY_RUN     = process.argv.includes('--dry-run');
const SKILL_FILTER = getArg('--skill') as Skill | null;
const CEFR_FILTER  = getArg('--cefr') as CEFRLevel | null;

// ─── Types & constants ───────────────────────────────────────────────────────

type Skill      = 'listening' | 'reading' | 'speaking' | 'writing';
type CEFRLevel  = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type Stage      = 'core' | 'upper' | 'lower';
// Productive multi-type coverage across all 4 skills:
//   Listening/Reading: receptive types (MCQ, multi-select, short-answer, ordering, fill-in)
//   Speaking: 3 productive task variants (free speech, role-play, picture description)
//   Writing:  4 productive task variants (opinion, description, comparison, argument)
type QuestionType =
  | 'mcq_single' | 'mcq_multi' | 'short_answer' | 'fill_in' | 'ordering'
  | 'spoken_free' | 'spoken_roleplay' | 'spoken_picture'
  | 'written_opinion' | 'written_description' | 'written_comparison' | 'written_argument';

const SKILLS:  Skill[]     = ['listening', 'reading', 'speaking', 'writing'];
const CEFRS:   CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const STAGES:  Stage[]     = ['core', 'upper', 'lower'];

// Question types per skill — all skills have 3+ distinct types
const QTYPES_BY_SKILL: Record<Skill, QuestionType[]> = {
  listening: ['mcq_single', 'mcq_multi', 'short_answer', 'ordering'],
  reading:   ['mcq_single', 'mcq_multi', 'fill_in',      'ordering'],
  speaking:  ['spoken_free', 'spoken_roleplay', 'spoken_picture'],
  writing:   ['written_opinion', 'written_description', 'written_comparison', 'written_argument'],
};

// IRT mapping
const IRT_BY_CEFR: Record<CEFRLevel, { difficulty: number; discrimination: number }> = {
  A1: { difficulty: -2.0, discrimination: 0.80 },
  A2: { difficulty: -1.0, discrimination: 1.00 },
  B1: { difficulty:  0.0, discrimination: 1.20 },
  B2: { difficulty:  1.0, discrimination: 1.40 },
  C1: { difficulty:  2.0, discrimination: 1.60 },
  C2: { difficulty:  3.0, discrimination: 1.80 },
};
const STAGE_DELTA: Record<Stage, number> = { upper: 0.30, core: 0.00, lower: -0.30 };

function deriveIRT(cefr: CEFRLevel, stage: Stage) {
  const base = IRT_BY_CEFR[cefr];
  return {
    difficulty:     Math.max(-3, Math.min(3, base.difficulty + STAGE_DELTA[stage])),
    discrimination: base.discrimination,
  };
}

function dbQuestionType(qtype: QuestionType): string {
  switch (qtype) {
    case 'mcq_single':         return 'multiple_choice';
    case 'mcq_multi':          return 'multiple_select';
    case 'short_answer':       return 'short_answer';
    case 'fill_in':            return 'fill_in_blank';
    case 'ordering':           return 'ordering';
    case 'spoken_free':        return 'spoken_free_response';
    case 'spoken_roleplay':    return 'spoken_role_play';
    case 'spoken_picture':     return 'spoken_picture_desc';
    case 'written_opinion':    return 'written_opinion';
    case 'written_description': return 'written_description';
    case 'written_comparison': return 'written_comparison';
    case 'written_argument':   return 'written_argument';
  }
}

function dbResponseType(qtype: QuestionType): string {
  if (qtype.startsWith('spoken_'))  return 'audio';
  if (qtype.startsWith('written_')) return 'text';
  return 'mcq';
}

function expectedDuration(skill: Skill, cefr: CEFRLevel): number {
  const base = { A1: 30, A2: 45, B1: 60, B2: 80, C1: 100, C2: 120 }[cefr];
  if (skill === 'listening') return base;
  if (skill === 'reading')   return Math.round(base * 1.5);
  if (skill === 'speaking')  return 30 + base;
  if (skill === 'writing')   return base * 3;
  return 60;
}

// ─── AI generation ───────────────────────────────────────────────────────────

async function callOllama(prompt: string): Promise<string | null> {
  const host  = process.env.OLLAMA_HOST  ?? 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL ?? 'llama3.2:3b';
  try {
    const res = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { response?: string };
    return json.response ?? null;
  } catch { return null; }
}

async function callOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      'gpt-4o-mini',
        messages:   [{ role: 'user', content: prompt }],
        max_tokens: 900,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function generateWithAI(prompt: string): Promise<string | null> {
  return (await callOllama(prompt)) ?? callOpenAI(prompt);
}

function extractJSON(text: string): Record<string, unknown> | null {
  try   { return JSON.parse(text); }
  catch {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
    if (m) { try { return JSON.parse(m[1]); } catch { return null; } }
    return null;
  }
}

// ─── Question generators ─────────────────────────────────────────────────────

interface GeneratedItem {
  mstItemId: string;
  title: string;
  prompt: string;
  content: Record<string, unknown>;
  tags: string[];
}

/** Unique 2-char abbreviation per question type for use in item IDs */
function qtypeAbbr(qtype: QuestionType): string {
  const map: Record<QuestionType, string> = {
    mcq_single:           'MS',
    mcq_multi:            'MM',
    short_answer:         'SA',
    fill_in:              'FI',
    ordering:             'OR',
    spoken_free:          'SF',
    spoken_roleplay:      'SR',
    spoken_picture:       'SP',
    written_opinion:      'WO',
    written_description:  'WD',
    written_comparison:   'WC',
    written_argument:     'WA',
  };
  return map[qtype] ?? qtype.substring(0, 2).toUpperCase();
}

async function genListening(cefr: CEFRLevel, stage: Stage, qtype: QuestionType, suffix: string): Promise<GeneratedItem> {
  const id = `L-${cefr}-${stage[0].toUpperCase()}-${qtypeAbbr(qtype)}-${suffix}`;

  let questionBlock: Record<string, unknown>;
  let raw: string | null = null;

  if (qtype === 'ordering') {
    raw = await generateWithAI(
      `Generate a CEFR ${cefr} English listening ordering task for an MST placement test. Stage: ${stage}.\n` +
      `Return JSON only: {"transcript":"3-4 sentences describing a sequence of events","question":"Order these events as they happened","items":["Event A","Event B","Event C","Event D"],"correctOrder":[2,0,3,1],"domain":"social"}`
    );
    const d = raw ? extractJSON(raw) : null;
    questionBlock = {
      type: 'ordering',
      stem: String(d?.question ?? 'Order the events as you heard them.'),
      items: (d?.items as string[]) ?? ['First event', 'Second event', 'Third event', 'Fourth event'],
      correctOrder: (d?.correctOrder as number[]) ?? [0, 1, 2, 3],
    };
    const parsed2 = raw ? extractJSON(raw) : null;
    const transcript2 = String(parsed2?.transcript ?? `A ${cefr} level listening passage for ${stage} ordering task.`);
    return {
      mstItemId: id,
      title: `Listening ${cefr} ${stage} ordering ${suffix}`,
      prompt: `[Listen and order] ${transcript2.substring(0, 200)}`,
      content: {
        id, skill: 'listening', stage, cefr,
        assets: { transcript: transcript2, audio: '' },
        timing: { audioSec: 30, maxAnswerSec: expectedDuration('listening', cefr) },
        questions: [questionBlock],
        metadata: { domain: String(parsed2?.domain ?? 'general') },
      },
      tags: ['listening', cefr, stage, 'mst', 'ordering'],
    };
  } else if (qtype === 'mcq_single') {
    raw = await generateWithAI(
      `Generate a CEFR ${cefr} English listening MCQ for an MST placement test. Stage: ${stage}.\n` +
      `Return JSON only: {"transcript":"2-4 sentences","question":"stem","options":["A)...","B)...","C)...","D)..."],"answerIndex":0,"accent":"genAm","domain":"social"}`
    );
    const d = raw ? extractJSON(raw) : null;
    questionBlock = {
      type: 'mcq_single',
      stem: String(d?.question ?? 'What is the main idea of the audio?'),
      options: (d?.options as string[]) ?? ['Option A', 'Option B', 'Option C', 'Option D'],
      answerIndex: typeof d?.answerIndex === 'number' ? d.answerIndex : 0,
    };
  } else if (qtype === 'mcq_multi') {
    raw = await generateWithAI(
      `Generate a CEFR ${cefr} English listening multiple-select MCQ for an MST placement test. Stage: ${stage}.\n` +
      `Return JSON only: {"transcript":"2-4 sentences","question":"stem","options":["A)...","B)...","C)...","D)..."],"answerIndices":[0,2],"domain":"workplace"}`
    );
    const d = raw ? extractJSON(raw) : null;
    questionBlock = {
      type: 'mcq_multi',
      stem: String(d?.question ?? 'Which statements are correct?'),
      options: (d?.options as string[]) ?? ['Option A', 'Option B', 'Option C', 'Option D'],
      answerIndices: (d?.answerIndices as number[]) ?? [0],
    };
  } else {
    raw = await generateWithAI(
      `Generate a CEFR ${cefr} English listening short-answer for an MST placement test. Stage: ${stage}.\n` +
      `Return JSON only: {"transcript":"2-4 sentences","question":"stem","correctAnswers":["answer1","answer2"],"domain":"academic"}`
    );
    const d = raw ? extractJSON(raw) : null;
    questionBlock = {
      type: 'short_answer',  // listening short-answer: free text response
      stem: String(d?.question ?? 'What does the speaker mention?'),
      correctAnswers: (d?.correctAnswers as string[]) ?? ['answer'],
      maxWords: 10,
    };
  }

  const parsed = raw ? extractJSON(raw) : null;
  const transcript = String(parsed?.transcript ?? `A ${cefr} level listening passage for ${stage} stage.`);

  return {
    mstItemId: id,
    title: `Listening ${cefr} ${stage} ${qtype} ${suffix}`,
    prompt: `[Listen] ${transcript.substring(0, 200)}`,
    content: {
      id, skill: 'listening', stage, cefr,
      assets: { transcript, audio: '' },
      timing: { audioSec: 30, maxAnswerSec: expectedDuration('listening', cefr) },
      questions: [questionBlock],
      metadata: { domain: String(parsed?.domain ?? 'general'), accent: String(parsed?.accent ?? 'genAm') },
    },
    tags: ['listening', cefr, stage, 'mst', qtype],
  };
}

async function genReading(cefr: CEFRLevel, stage: Stage, qtype: QuestionType, suffix: string): Promise<GeneratedItem> {
  const id = `R-${cefr}-${stage[0].toUpperCase()}-${qtypeAbbr(qtype)}-${suffix}`;

  let questionBlock: Record<string, unknown>;
  let passage: string;

  if (qtype === 'ordering') {
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English reading ordering task for an MST placement test. Stage: ${stage}.\n` +
      `Return JSON only: {"passage":"3-5 sentences describing a process or sequence","question":"Order these steps as described in the passage","items":["Step A","Step B","Step C","Step D"],"correctOrder":[1,3,0,2],"domain":"academic"}`
    );
    const d = raw ? extractJSON(raw) : null;
    passage = String(d?.passage ?? `A ${cefr} level passage describing a sequence for ${stage} ordering task.`);
    questionBlock = {
      type: 'ordering',
      stem: String(d?.question ?? 'Order these steps as they appear in the passage.'),
      items: (d?.items as string[]) ?? ['Step A', 'Step B', 'Step C', 'Step D'],
      correctOrder: (d?.correctOrder as number[]) ?? [0, 1, 2, 3],
    };
    return {
      mstItemId: id,
      title: `Reading ${cefr} ${stage} ordering ${suffix}`,
      prompt: passage,
      content: {
        id, skill: 'reading', stage, cefr,
        assets: { passage },
        timing: { maxAnswerSec: expectedDuration('reading', cefr) },
        questions: [questionBlock],
        metadata: { domain: String(d?.domain ?? 'academic') },
      },
      tags: ['reading', cefr, stage, 'mst', 'ordering'],
    };
  } else if (qtype === 'mcq_single') {
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English reading MCQ for an MST placement test. Stage: ${stage}.\n` +
      `Return JSON only: {"passage":"3-5 sentences","question":"stem","options":["A)...","B)...","C)...","D)..."],"answerIndex":1,"domain":"academic"}`
    );
    const d = raw ? extractJSON(raw) : null;
    passage = String(d?.passage ?? `A ${cefr} reading passage for ${stage} stage assessment.`);
    questionBlock = {
      type: 'mcq_single',
      stem: String(d?.question ?? 'What is the main idea?'),
      options: (d?.options as string[]) ?? ['Option A', 'Option B', 'Option C', 'Option D'],
      answerIndex: typeof d?.answerIndex === 'number' ? d.answerIndex : 0,
    };
  } else if (qtype === 'mcq_multi') {
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English reading multiple-select MCQ. Stage: ${stage}.\n` +
      `Return JSON only: {"passage":"3-5 sentences","question":"stem","options":["A)...","B)...","C)...","D)..."],"answerIndices":[0,2],"domain":"social"}`
    );
    const d = raw ? extractJSON(raw) : null;
    passage = String(d?.passage ?? `A ${cefr} reading passage for ${stage}.`);
    questionBlock = {
      type: 'mcq_multi',
      stem: String(d?.question ?? 'Which points are mentioned?'),
      options: (d?.options as string[]) ?? ['Option A', 'Option B', 'Option C', 'Option D'],
      answerIndices: (d?.answerIndices as number[]) ?? [0],
    };
  } else {
    // fill_in
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English fill-in-the-blank reading item. Stage: ${stage}.\n` +
      `Return JSON only: {"passage":"3 sentences with __BLANK__ placeholder","stem":"Fill in the blank","correctAnswers":["word1","word2"],"domain":"academic"}`
    );
    const d = raw ? extractJSON(raw) : null;
    passage = String(d?.passage ?? `Complete this ${cefr} passage: The result was __BLANK__.`);
    questionBlock = {
      type: 'fill_in',  // reading fill-in-blank: matches UI/scorer 'fill_in'|'fill_in_blank'
      stem: String(d?.stem ?? 'Fill in the blank'),
      correctAnswers: (d?.correctAnswers as string[]) ?? ['answer'],
      maxWords: 5,
    };
  }

  return {
    mstItemId: id,
    title: `Reading ${cefr} ${stage} ${qtype} ${suffix}`,
    prompt: passage,
    content: {
      id, skill: 'reading', stage, cefr,
      assets: { passage },
      timing: { maxAnswerSec: expectedDuration('reading', cefr) },
      questions: [questionBlock],
      metadata: { domain: 'general' },
    },
    tags: ['reading', cefr, stage, 'mst', qtype],
  };
}

async function genSpeaking(cefr: CEFRLevel, stage: Stage, qtype: QuestionType, suffix: string): Promise<GeneratedItem> {
  const id = `S-${cefr}-${stage[0].toUpperCase()}-${qtypeAbbr(qtype)}-${suffix}`;
  const dur = expectedDuration('speaking', cefr);

  let spPrompt: string;
  let keywords: string[];
  let structure: string;
  let imageUrl: string | undefined;

  if (qtype === 'spoken_roleplay') {
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English speaking role-play scenario for MST. Stage: ${stage}.\n` +
      `Return JSON only: {"prompt":"Describe the role-play scenario in 2 sentences","role":"student role (e.g. customer)","partnerRole":"partner role (e.g. shopkeeper)","keywords":["word1","word2"]}`
    );
    const d = raw ? extractJSON(raw) : null;
    spPrompt = String(d?.prompt ?? `Role-play: You are a ${cefr} level English speaker in a common daily situation.`);
    keywords = (d?.keywords as string[]) ?? ['greeting', 'request', 'polite'];
    structure = `Role: ${String(d?.role ?? 'student')} / Partner: ${String(d?.partnerRole ?? 'interlocutor')}`;
  } else if (qtype === 'spoken_picture') {
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English picture description speaking task for MST. Stage: ${stage}.\n` +
      `Return JSON only: {"prompt":"Describe what you see in this picture in 1 sentence","sceneDescription":"a vivid 1-sentence scene description for the image","keywords":["word1","word2"]}`
    );
    const d = raw ? extractJSON(raw) : null;
    spPrompt = String(d?.prompt ?? `Describe the picture you see. Speak for at least ${Math.round(dur / 2)} seconds.`);
    keywords = (d?.keywords as string[]) ?? ['describe', 'picture', 'scene'];
    structure = `Scene: ${String(d?.sceneDescription ?? 'A busy street market with various vendors.')}`;
    imageUrl = undefined; // Real image generated separately via TTS/image pipeline
  } else {
    // spoken_free — default free speech prompt
    const raw = await generateWithAI(
      `Generate a CEFR ${cefr} English speaking task for MST placement. Stage: ${stage}.\n` +
      `Return JSON only: {"prompt":"1-2 sentence task prompt","keywords":["word1","word2"],"structure":"brief outline"}`
    );
    const d = raw ? extractJSON(raw) : null;
    spPrompt = String(d?.prompt ?? `Talk about your experience with English at ${cefr} level.`);
    keywords = (d?.keywords as string[]) ?? ['describe', 'explain'];
    structure = String(d?.structure ?? 'Introduction, main point, conclusion');
  }

  return {
    mstItemId: id,
    title: `Speaking ${cefr} ${stage} ${qtype} ${suffix}`,
    prompt: spPrompt,
    content: {
      id, skill: 'speaking', stage, cefr,
      assets: { prompt: spPrompt, keywords, structure, ...(imageUrl ? { imageUrl } : {}) },
      timing: { prepSec: 15, recordSec: dur, maxAnswerSec: 15 + dur },
      metadata: { domain: 'general', variant: qtype },
    },
    tags: ['speaking', cefr, stage, 'mst', qtype],
  };
}

async function genWriting(cefr: CEFRLevel, stage: Stage, qtype: QuestionType, suffix: string): Promise<GeneratedItem> {
  const id = `W-${cefr}-${stage[0].toUpperCase()}-${qtypeAbbr(qtype)}-${suffix}`;

  // Map qtype to the writing task variant label
  const taskTypeMap: Partial<Record<QuestionType, string>> = {
    written_opinion: 'opinion', written_description: 'description',
    written_comparison: 'comparison', written_argument: 'argument',
  };
  const taskType = taskTypeMap[qtype] ?? 'opinion';

  const raw = await generateWithAI(
    `Generate a CEFR ${cefr} English ${taskType} writing prompt for MST. Stage: ${stage}.\n` +
    `Return JSON only: {"prompt":"1-2 sentence task","minWords":80,"maxWords":150}`
  );
  const d = raw ? extractJSON(raw) : null;
  const wPrompt  = String(d?.prompt   ?? `Write a ${taskType} essay appropriate for ${cefr} level.`);
  const minWords = typeof d?.minWords === 'number' ? d.minWords : 80;
  const maxWords = typeof d?.maxWords === 'number' ? d.maxWords : 150;
  const dur = expectedDuration('writing', cefr);

  return {
    mstItemId: id,
    title: `Writing ${cefr} ${stage} ${taskType} ${suffix}`,
    prompt: wPrompt,
    content: {
      id, skill: 'writing', stage, cefr,
      assets: { prompt: wPrompt, minWords, maxWords, taskType },
      timing: { maxAnswerSec: dur },
      metadata: { domain: 'general', variant: qtype },
    },
    tags: ['writing', cefr, stage, 'mst', taskType],
  };
}

async function generateItem(
  skill: Skill, cefr: CEFRLevel, stage: Stage, qtype: QuestionType, suffix: string
): Promise<GeneratedItem> {
  switch (skill) {
    case 'listening': return genListening(cefr, stage, qtype, suffix);
    case 'reading':   return genReading(cefr, stage, qtype, suffix);
    case 'speaking':  return genSpeaking(cefr, stage, qtype, suffix);
    case 'writing':   return genWriting(cefr, stage, qtype, suffix);
  }
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

/**
 * Find the count and next available suffix for a specific (skill, cefr, stage, qtype) subcell.
 * Uses the unique mst_item_id prefix (e.g. "L-B1-C-MS-") to scope the query.
 */
async function cellStatus(
  pool: Pool, skill: Skill, cefr: CEFRLevel, stage: Stage, qtype: QuestionType
): Promise<{ count: number; nextSuffix: number }> {
  const prefix = `${skill[0].toUpperCase()}-${cefr}-${stage[0].toUpperCase()}-${qtypeAbbr(qtype)}-`;
  const res = await pool.query(
    `SELECT mst_item_id FROM placement_test_questions
      WHERE skill=$1 AND cefr_level=$2 AND stage=$3
        AND mst_item_id LIKE $4 AND mst_item_id IS NOT NULL`,
    [skill, cefr, stage, `${prefix}%`]
  );
  let maxN = 0;
  for (const row of (res.rows as { mst_item_id: string }[])) {
    const m = row.mst_item_id.match(/(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxN) maxN = n;
    }
  }
  return { count: res.rows.length, nextSuffix: maxN + 1 };
}

async function upsertItem(
  pool: Pool, skill: Skill, cefr: CEFRLevel, stage: Stage, qtype: QuestionType, item: GeneratedItem
): Promise<'inserted' | 'updated' | 'skipped'> {
  const irt = deriveIRT(cefr, stage);
  const qtypeStr = dbQuestionType(qtype);
  const respType = dbResponseType(qtype);
  const dur      = expectedDuration(skill, cefr);

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
          skill, cefr, qtypeStr, item.title, item.prompt,
          JSON.stringify(item.content), respType, dur,
          JSON.stringify({ type: respType, cefr, stage }),
          stage, irt.difficulty, irt.discrimination,
          item.tags, Math.ceil(dur / 60), item.mstItemId,
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
        skill, cefr, qtypeStr, item.title, item.prompt,
        JSON.stringify(item.content), respType, dur,
        JSON.stringify({ type: respType, cefr, stage }), 100,
        stage, irt.difficulty, irt.discrimination, item.mstItemId,
        item.tags, Math.ceil(dur / 60),
      ]
    );
    return 'inserted';
  } catch (err: unknown) {
    console.error(`  ❌ DB error for ${item.mstItemId}:`, err instanceof Error ? err.message : String(err));
    return 'skipped';
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌱 MST Question Bank Seeder (AI-generated, Ollama/OpenAI)`);
  console.log(`   Items per cell:  ${COUNT}${DRY_RUN ? ' [DRY RUN]' : ''}`);
  if (SKILL_FILTER) console.log(`   Skill filter:   ${SKILL_FILTER}`);
  if (CEFR_FILTER)  console.log(`   CEFR filter:    ${CEFR_FILTER}`);

  const skills = SKILL_FILTER ? [SKILL_FILTER] : [...SKILLS];
  const cefrs  = CEFR_FILTER  ? [CEFR_FILTER]  : [...CEFRS];

  const totalCells = skills.reduce((s, sk) => s + QTYPES_BY_SKILL[sk].length * cefrs.length * STAGES.length, 0);
  console.log(`   Total cells:    ${totalCells}  (skill × qtype × CEFR × stage)\n`);

  // Probe AI
  const testResult = await generateWithAI('Reply with exactly "ready".');
  if (!testResult) {
    console.warn('⚠️  No AI provider available (Ollama/OpenAI). Items will use template content.');
  } else {
    const provider = (await callOllama('ready')) ? 'Ollama' : 'OpenAI';
    console.log(`✅ AI provider: ${provider}\n`);
  }

  // Dry-run: just print what would be generated
  if (DRY_RUN) {
    for (const skill of skills) {
      for (const cefr of cefrs) {
        for (const stage of STAGES) {
          for (const qtype of QTYPES_BY_SKILL[skill]) {
            const irt = deriveIRT(cefr, stage);
            for (let i = 0; i < COUNT; i++) {
              const suffix = String(i + 1).padStart(3, '0');
              const id = `${skill[0].toUpperCase()}-${cefr}-${stage[0].toUpperCase()}-${qtypeAbbr(qtype)}-${suffix}`;
              console.log(`  [DRY] ${id}  diff=${irt.difficulty.toFixed(2)}  disc=${irt.discrimination.toFixed(2)}`);
            }
          }
        }
      }
    }
    console.log('\n✅ Dry run complete — no changes made');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  let inserted = 0, updated = 0, skipped = 0;

  for (const skill of skills) {
    const qtypes = QTYPES_BY_SKILL[skill];
    for (const cefr of cefrs) {
      for (const stage of STAGES) {
        for (const qtype of qtypes) {
          // Query count + next suffix scoped to this exact (skill,cefr,stage,qtype) subcell
          const { count: existingCount, nextSuffix: suffixBase } =
            await cellStatus(pool, skill, cefr, stage, qtype);
          const needed = Math.max(0, COUNT - existingCount);

          if (needed === 0) {
            console.log(`  ✓ ${skill}/${cefr}/${stage}/${qtype}: ${existingCount}/${COUNT} items`);
            continue;
          }

          console.log(`  📝 ${skill}/${cefr}/${stage}/${qtype}: ${existingCount} → +${needed}`);

          for (let i = 0; i < needed; i++) {
            const suffix = String(suffixBase + i).padStart(3, '0');
            process.stdout.write(`     [${i + 1}/${needed}] … `);
            const item = await generateItem(skill, cefr, stage, qtype, suffix);
            const outcome = await upsertItem(pool, skill, cefr, stage, qtype, item);
            console.log(`${outcome} (${item.mstItemId})`);
            if (outcome === 'inserted')      inserted++;
            else if (outcome === 'updated')  updated++;
            else                             skipped++;
            await new Promise(r => setTimeout(r, 150));
          }
        }
      }
    }
  }

  await pool.end();

  console.log(`\n🎉 Seeding complete!  inserted=${inserted}  updated=${updated}  skipped=${skipped}`);

  // Cell coverage report
  const coverPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  const covRes = await coverPool.query(
    `SELECT skill, cefr_level, stage, COUNT(*) as cnt
       FROM placement_test_questions
      WHERE mst_item_id IS NOT NULL AND is_active=true
      GROUP BY skill, cefr_level, stage
      ORDER BY skill, cefr_level, stage`
  );
  await coverPool.end();

  console.log('\n📊 DB cell coverage:');
  for (const row of (covRes.rows as Array<{ skill: string; cefr_level: string; stage: string; cnt: string }>)) {
    const ok = parseInt(row.cnt, 10) >= COUNT ? '✅' : '⚠️ ';
    console.log(`   ${ok} ${row.skill}/${row.cefr_level}/${row.stage}: ${row.cnt} items`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
