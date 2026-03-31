/**
 * MST Items Controller
 * Manages item bank loading and selection.
 * Primary source: placement_test_questions table (where mst_item_id IS NOT NULL)
 * Fallback per cell (skill+cefr+stage <3 items): data/mst_item_bank.json static file
 */

import {
  Item, Skill, Stage, CEFRLevel,
  ListeningItem, ReadingItem, SpeakingItem, WritingItem,
} from '../schemas/itemSchema';
import { getListeningResponseTime, getWritingCompositionTime, getSpeakingRecordTime } from '../utils/timers';
import { readFileSync, existsSync } from 'fs';
import { Pool } from 'pg';

// Minimum items required per (skill, cefr, stage) cell before supplementing from JSON
const MIN_ITEMS_PER_CELL = 3;

// Lazy-import the shared pool to avoid circular deps at module load time
let _pool: Pool | null = null;
async function getPool(): Promise<Pool> {
  if (!_pool) {
    const { pool } = await import('../../../db.js');
    _pool = pool as Pool;
  }
  return _pool;
}

export class MstItemsController {
  private itemBank: Map<string, Item[]> = new Map();
  private initialized = false;

  constructor(private itemBankPath: string = 'data/mst_item_bank.json') {}

  /**
   * Initialize item bank — tries DB first with cell-level JSON fallback supplement.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const skills: Skill[] = ['listening', 'reading', 'speaking', 'writing'];

      for (const skill of skills) {
        const items = await this.loadSkillItemsWithCellFallback(skill);
        this.itemBank.set(skill, items);
      }

      this.initialized = true;
      console.log(`✅ MST Item Bank initialized with ${this.getTotalItemCount()} items`);
    } catch (error) {
      console.error('❌ Failed to initialize MST item bank:', error);
      this.createFallbackItems();
      this.initialized = true;
    }
  }

  /**
   * Load items for a skill from DB, then supplement any sparse cells from JSON.
   * A "cell" is a unique (skill, cefr_level, stage) triple.
   */
  private async loadSkillItemsWithCellFallback(skill: Skill): Promise<Item[]> {
    const dbItems = await this.loadSkillItemsFromDB(skill);
    const jsonItems = this.loadSkillItemsFromJSONFile(skill);

    // Index DB items by cell key
    const cellCounts: Record<string, number> = {};
    for (const item of dbItems) {
      const key = `${item.cefr}:${item.stage}`;
      cellCounts[key] = (cellCounts[key] ?? 0) + 1;
    }

    const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const stages: Stage[] = ['core', 'upper', 'lower'];
    const supplemented: Item[] = [];

    for (const cefr of cefrLevels) {
      for (const stage of stages) {
        const key = `${cefr}:${stage}`;
        const dbCount = cellCounts[key] ?? 0;
        if (dbCount < MIN_ITEMS_PER_CELL) {
          // Supplement from JSON: items matching this cefr+stage that aren't in DB already
          const dbIds = new Set(dbItems.filter(i => i.cefr === cefr && i.stage === stage).map(i => i.id));
          const candidates = jsonItems.filter(i => i.cefr === cefr && i.stage === stage && !dbIds.has(i.id));
          supplemented.push(...candidates.slice(0, MIN_ITEMS_PER_CELL - dbCount));
        }
      }
    }

    const combined = [...dbItems, ...supplemented];
    if (supplemented.length > 0) {
      console.log(`📂 MST: supplemented ${supplemented.length} ${skill} items from JSON (cell-level top-up)`);
    }

    // Final fallback: if still zero items for the skill, use minimal hardcoded items
    if (combined.length === 0) {
      console.warn(`⚠️  MST: no items for ${skill} in DB or JSON, using hardcoded fallback`);
      return this.createFallbackItemsForSkill(skill);
    }

    return combined;
  }

  /**
   * Load items for a skill from the DB (placement_test_questions).
   */
  private async loadSkillItemsFromDB(skill: Skill): Promise<Item[]> {
    try {
      const pool = await getPool();
      const result = await pool.query(
        `SELECT content, stage, cefr_level, difficulty, discrimination, mst_item_id
           FROM placement_test_questions
          WHERE skill = $1
            AND mst_item_id IS NOT NULL
            AND is_active = true
          ORDER BY mst_item_id`,
        [skill]
      );

      if (!result.rows || result.rows.length === 0) return [];

      const items: Item[] = [];
      let malformed = 0;
      for (const row of result.rows) {
        try {
          const raw: unknown = typeof row.content === 'string'
            ? JSON.parse(row.content)
            : row.content;

          if (!raw || typeof raw !== 'object') {
            malformed++;
            continue;
          }

          // Merge DB-stored IRT values back onto the item.
          // Use Number.isFinite() so calibrated 0.0 (B1 core) is preserved.
          const diffVal = parseFloat(row.difficulty as string);
          const discVal = parseFloat(row.discrimination as string);
          const item = {
            ...(raw as Record<string, unknown>),
            irtDifficulty:     Number.isFinite(diffVal) ? diffVal : undefined,
            irtDiscrimination: Number.isFinite(discVal) ? discVal : undefined,
          } as Item;
          items.push(item);
        } catch {
          malformed++;
        }
      }

      if (malformed > 0) {
        console.warn(`⚠️  MST DB: ${malformed} malformed content row(s) skipped for skill=${skill}`);
      }
      console.log(`🗄️  MST DB: loaded ${items.length} ${skill} items`);
      return items;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  MST DB query failed for ${skill}:`, msg);
      return [];
    }
  }

  /** Load items for a skill from the static JSON file (fallback supplement). */
  private loadSkillItemsFromJSONFile(skill: Skill): Item[] {
    const items: Item[] = [];
    try {
      if (!existsSync(this.itemBankPath)) return items;
      const fileContent = readFileSync(this.itemBankPath, 'utf-8');
      const itemBank: unknown = JSON.parse(fileContent);

      if (!itemBank || typeof itemBank !== 'object') return items;
      const skills = (itemBank as Record<string, unknown>).skills;
      if (!skills || typeof skills !== 'object') return items;

      const skillData = (skills as Record<string, unknown>)[skill];
      if (!skillData || typeof skillData !== 'object') return items;

      const sd = skillData as Record<string, unknown>;
      const groups = ['S1', 'S2_up', 'S2_stay', 'S2_down', 'S3_down'];
      for (const g of groups) {
        const group = sd[g];
        if (Array.isArray(group)) {
          items.push(...(group as Item[]));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️  MST JSON load failed for ${skill}:`, msg);
    }
    return items;
  }

  /**
   * Get item by skill, stage, optional CEFR level, and excluded suffixes.
   * CEFR filtering is applied when provided; stage filtering is always applied.
   */
  getItem(skill: Skill, stage: Stage, cefr?: CEFRLevel, excludedSuffixes?: Set<string>): Item | null {
    const items = this.itemBank.get(skill) ?? [];

    let pool = items.filter(item => item.stage === stage);

    if (cefr) {
      const withCefr = pool.filter(item => item.cefr === cefr);
      // Keep CEFR filter only if it doesn't empty the result
      if (withCefr.length > 0) pool = withCefr;
    }

    if (excludedSuffixes && excludedSuffixes.size > 0) {
      const withExclusion = pool.filter(item => {
        const suffix = item.id.split('-').pop() ?? '';
        return !excludedSuffixes.has(suffix);
      });
      // Only apply suffix exclusion if it doesn't empty the pool
      if (withExclusion.length > 0) pool = withExclusion;
    }

    if (pool.length === 0) {
      console.warn(`⚠️  No items for ${skill}/${stage}/${cefr ?? '*'} after filtering`);
      // Final fallback: any item in this skill
      const fallback = items[0] ?? null;
      return fallback;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Get all items for a skill.
   */
  getSkillItems(skill: Skill): Item[] {
    return this.itemBank.get(skill) ?? [];
  }

  /**
   * Check if item bank is ready.
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get total item count.
   */
  getTotalItemCount(): number {
    let total = 0;
    for (const items of this.itemBank.values()) {
      total += items.length;
    }
    return total;
  }

  /**
   * Create minimal hardcoded fallback items for all skills (last resort).
   */
  private createFallbackItems(): void {
    const skills: Skill[] = ['listening', 'reading', 'speaking', 'writing'];
    for (const skill of skills) {
      this.itemBank.set(skill, this.createFallbackItemsForSkill(skill));
    }
  }

  /**
   * Create minimal hardcoded fallback items for a specific skill.
   */
  private createFallbackItemsForSkill(skill: Skill): Item[] {
    const stageMap: Array<{ stage: Stage; cefr: CEFRLevel }> = [
      { stage: 'core',  cefr: 'B1' },
      { stage: 'upper', cefr: 'B2' },
      { stage: 'lower', cefr: 'A2' },
    ];

    switch (skill) {
      case 'listening':
        return stageMap.map(({ stage, cefr }): ListeningItem => ({
          id: `L-${cefr}-fallback-${stage}`,
          skill: 'listening',
          stage,
          cefr,
          timing: {
            audioSec: 30,
            maxAnswerSec: getListeningResponseTime(cefr),
          },
          metadata: { domain: 'general' },
          assets: {
            audio: '/assets/fallback/listening_sample.mp3',
            transcript: 'This is a sample listening passage for placement testing.',
          },
          questions: [{
            type: 'mcq_single',
            stem: 'What is the main topic of the audio?',
            options: ['Education', 'Travel', 'Food', 'Weather'],
            answerIndex: 0,
          }],
        }));

      case 'reading':
        return stageMap.map(({ stage, cefr }): ReadingItem => ({
          id: `R-${cefr}-fallback-${stage}`,
          skill: 'reading',
          stage,
          cefr,
          timing: { maxAnswerSec: 90 },
          metadata: { domain: 'general' },
          assets: {
            passage: 'Learning languages is an important skill in today\'s globalized world. ' +
              'It opens up new opportunities for communication, travel, and career advancement. ' +
              'Many people find that learning a second language improves their cognitive abilities.',
          },
          questions: [{
            type: 'mcq_single',
            stem: 'According to the passage, learning languages is:',
            options: ['Difficult', 'Important', 'Expensive', 'Boring'],
            answerIndex: 1,
          }],
        }));

      case 'speaking':
        return stageMap.map(({ stage, cefr }): SpeakingItem => ({
          id: `S-${cefr}-fallback-${stage}`,
          skill: 'speaking',
          stage,
          cefr,
          timing: {
            prepSec: 10,
            recordSec: getSpeakingRecordTime(cefr),
            maxAnswerSec: 10 + getSpeakingRecordTime(cefr),
          },
          metadata: { domain: 'general' },
          assets: {
            prompt: 'Describe your favorite hobby and explain why you enjoy it.',
            keywords: ['hobby', 'enjoy', 'because', 'interesting'],
          },
        }));

      case 'writing':
        return stageMap.map(({ stage, cefr }): WritingItem => ({
          id: `W-${cefr}-fallback-${stage}`,
          skill: 'writing',
          stage,
          cefr,
          timing: { maxAnswerSec: getWritingCompositionTime(cefr) },
          metadata: { domain: 'general' },
          assets: {
            prompt: 'Do you think social media has a positive or negative impact on society? Give your opinion with reasons.',
            minWords: 100,
            maxWords: 200,
            taskType: 'opinion',
          },
        }));
    }
  }
}
