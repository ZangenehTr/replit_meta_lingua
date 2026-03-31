#!/usr/bin/env tsx

/**
 * Seed MST Items into placement_test_questions table
 * Reads from data/mst_item_bank.json and upserts into DB
 *
 * Usage: npx tsx server/scripts/seed-mst-items.ts [--dry-run]
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes('--dry-run');

// IRT parameter baseline per CEFR level (2PL model)
const IRT_BY_CEFR: Record<string, { difficulty: number; discrimination: number }> = {
  A1: { difficulty: -2.0, discrimination: 0.80 },
  A2: { difficulty: -1.0, discrimination: 1.00 },
  B1: { difficulty:  0.0, discrimination: 1.20 },
  B2: { difficulty:  1.0, discrimination: 1.40 },
  C1: { difficulty:  2.0, discrimination: 1.60 },
  C2: { difficulty:  3.0, discrimination: 1.80 },
};

// Small variation per stage so upper items are harder than core which is harder than lower
const STAGE_DELTA: Record<string, number> = {
  upper:  0.30,
  core:   0.00,
  lower: -0.30,
};

function deriveIRT(cefr: string, stage: string): { difficulty: number; discrimination: number } {
  const base = IRT_BY_CEFR[cefr] ?? IRT_BY_CEFR['B1'];
  const delta = STAGE_DELTA[stage] ?? 0;
  return {
    difficulty: Math.max(-3, Math.min(3, base.difficulty + delta)),
    discrimination: Math.max(0.5, Math.min(2.5, base.discrimination)),
  };
}

function getQuestionType(skill: string): string {
  switch (skill) {
    case 'listening': return 'listening_comprehension';
    case 'reading':   return 'reading_comprehension';
    case 'speaking':  return 'spoken_response';
    case 'writing':   return 'written_response';
    default:          return 'mixed';
  }
}

function getResponseType(skill: string): string {
  switch (skill) {
    case 'listening': return 'mcq';
    case 'reading':   return 'mcq';
    case 'speaking':  return 'audio';
    case 'writing':   return 'text';
    default:          return 'mcq';
  }
}

/** Minimal typed shape for items read from the JSON item bank */
interface RawMSTItem {
  id: string;
  skill: string;
  cefr: string;
  stage: string;
  timing?: { maxAnswerSec?: number; prepSec?: number; recordSec?: number };
  assets?: { prompt?: string; passage?: string; transcript?: string; audio?: string };
  questions?: unknown[];
  metadata?: Record<string, unknown>;
}

/** Shape of the JSON item bank file */
interface RawItemBank {
  skills: Record<string, Record<string, RawMSTItem[]>>;
}

function buildTitle(item: RawMSTItem): string {
  const { skill, cefr, stage, id } = item;
  return `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${cefr} (${stage}) — ${id}`;
}

function buildPrompt(item: RawMSTItem): string {
  if (item.skill === 'speaking' && item.assets?.prompt) {
    return item.assets.prompt;
  }
  if (item.skill === 'writing' && item.assets?.prompt) {
    return item.assets.prompt;
  }
  if (item.skill === 'reading' && item.assets?.passage) {
    return item.assets.passage;
  }
  if (item.skill === 'listening' && item.assets?.transcript) {
    return `[Listen to the audio] ${item.assets.transcript.substring(0, 200)}`;
  }
  return `Assessment item for ${item.skill} at ${item.cefr} level`;
}

function getExpectedDuration(item: RawMSTItem): number {
  const timing = item.timing ?? {};
  if (timing.maxAnswerSec) return timing.maxAnswerSec;
  if (timing.recordSec)    return (timing.prepSec ?? 0) + timing.recordSec;
  return 60;
}

async function main() {
  console.log(`🌱 MST Item Bank Seeder${isDryRun ? ' (DRY RUN)' : ''}`);

  const itemBankPath = join(__dirname, '../../data/mst_item_bank.json');
  if (!existsSync(itemBankPath)) {
    console.error('❌ Item bank not found:', itemBankPath);
    process.exit(1);
  }

  const itemBank = JSON.parse(readFileSync(itemBankPath, 'utf-8')) as RawItemBank;

  // Collect all items from all skills/stages
  const allItems: RawMSTItem[] = [];
  for (const [skill, stages] of Object.entries(itemBank.skills ?? {})) {
    for (const [_stageBucket, items] of Object.entries(stages)) {
      for (const item of items) {
        allItems.push({ ...item, skill } as RawMSTItem);
      }
    }
  }

  console.log(`📦 Found ${allItems.length} items in item bank`);

  if (isDryRun) {
    for (const item of allItems) {
      const irt = deriveIRT(item.cefr, item.stage);
      console.log(`  [DRY] ${item.id} skill=${item.skill} cefr=${item.cefr} stage=${item.stage} difficulty=${irt.difficulty} discrimination=${irt.discrimination}`);
    }
    console.log('✅ Dry run complete — no changes made');
    return;
  }

  // Connect to DB
  const { neonConfig } = await import('@neondatabase/serverless');
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of allItems) {
    const irt = deriveIRT(item.cefr, item.stage);
    const prompt = buildPrompt(item);
    const title = buildTitle(item);
    const questionType = getQuestionType(item.skill);
    const responseType = getResponseType(item.skill);
    const expectedDuration = getExpectedDuration(item);
    const estimatedMins = Math.ceil(expectedDuration / 60);

    // Content stores the full item structure for retrieval
    const content = {
      id: item.id,
      skill: item.skill,
      stage: item.stage,
      cefr: item.cefr,
      assets: item.assets,
      timing: item.timing,
      questions: item.questions,
      metadata: item.metadata,
    };

    const scoringCriteria = {
      type: responseType,
      cefr: item.cefr,
      stage: item.stage,
    };

    const tags: string[] = [item.skill, item.cefr, item.stage, 'mst'];
    if (item.metadata?.domain) tags.push(item.metadata.domain);

    try {
      const existing = await pool.query(
        'SELECT id FROM placement_test_questions WHERE mst_item_id = $1',
        [item.id]
      );

      if (existing.rows.length > 0) {
        // Update existing record
        await pool.query(
          `UPDATE placement_test_questions SET
            skill = $1, cefr_level = $2, question_type = $3, title = $4, prompt = $5,
            content = $6, response_type = $7, expected_duration_seconds = $8,
            scoring_criteria = $9, stage = $10, difficulty = $11, discrimination = $12,
            tags = $13, estimated_completion_minutes = $14, is_active = true, updated_at = NOW()
           WHERE mst_item_id = $15`,
          [
            item.skill, item.cefr, questionType, title, prompt,
            JSON.stringify(content), responseType, expectedDuration,
            JSON.stringify(scoringCriteria), item.stage, irt.difficulty, irt.discrimination,
            tags, estimatedMins, item.id,
          ]
        );
        updated++;
        console.log(`  🔄 Updated: ${item.id}`);
      } else {
        // Insert new record
        await pool.query(
          `INSERT INTO placement_test_questions
            (skill, cefr_level, question_type, title, prompt, content, response_type,
             expected_duration_seconds, scoring_criteria, max_score, stage, difficulty,
             discrimination, mst_item_id, tags, estimated_completion_minutes, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)`,
          [
            item.skill, item.cefr, questionType, title, prompt,
            JSON.stringify(content), responseType, expectedDuration,
            JSON.stringify(scoringCriteria), 100,
            item.stage, irt.difficulty, irt.discrimination, item.id,
            tags, estimatedMins,
          ]
        );
        inserted++;
        console.log(`  ✅ Inserted: ${item.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Error seeding ${item.id}:`, msg);
      skipped++;
    }
  }

  await pool.end();

  console.log(`\n🎉 Seeding complete!`);
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  🔄 Updated:  ${updated}`);
  console.log(`  ❌ Skipped:  ${skipped}`);
  console.log(`  📊 Total:    ${allItems.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
