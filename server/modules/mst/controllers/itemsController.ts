/**
 * MST Items Controller
 * Manages item bank loading and selection.
 * Primary source: placement_test_questions table (where mst_item_id IS NOT NULL)
 * Fallback:       data/mst_item_bank.json static file
 */

import { Item, Skill, Stage, CEFRLevel } from '../schemas/itemSchema';
import { getListeningResponseTime, getWritingCompositionTime, getSpeakingRecordTime } from '../utils/timers';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Lazy-import the shared pool to avoid circular deps at module load time
let _pool: any = null;
async function getPool() {
  if (!_pool) {
    const { pool } = await import('../../../db.js');
    _pool = pool;
  }
  return _pool;
}

export class MstItemsController {
  private itemBank: Map<string, Item[]> = new Map();
  private initialized = false;

  constructor(private itemBankPath: string = 'data/mst_item_bank.json') {}

  /**
   * Initialize item bank — tries DB first, falls back to JSON file.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const skills: Skill[] = ['listening', 'reading', 'speaking', 'writing'];

      for (const skill of skills) {
        let items = await this.loadSkillItemsFromDB(skill);

        if (items.length === 0) {
          console.log(`📂 MST DB empty for ${skill}, loading from JSON file…`);
          items = await this.loadSkillItemsFromJSON(skill);
        }

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
   * Load items for a skill from the DB (placement_test_questions).
   */
  private async loadSkillItemsFromDB(skill: Skill): Promise<Item[]> {
    try {
      const pool = await getPool();
      const result = await pool.query(
        `SELECT content, stage, difficulty, discrimination, mst_item_id
           FROM placement_test_questions
          WHERE skill = $1
            AND mst_item_id IS NOT NULL
            AND is_active = true
          ORDER BY mst_item_id`,
        [skill]
      );

      if (!result.rows || result.rows.length === 0) return [];

      const items: Item[] = [];
      for (const row of result.rows) {
        try {
          const raw = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
          // Merge DB-stored IRT values back onto the item
          const item = {
            ...raw,
            irtDifficulty:     parseFloat(row.difficulty)     || undefined,
            irtDiscrimination: parseFloat(row.discrimination) || undefined,
          } as Item;
          items.push(item);
        } catch {
          // Skip malformed rows silently
        }
      }

      console.log(`🗄️  MST DB: loaded ${items.length} ${skill} items`);
      return items;
    } catch (err: any) {
      console.warn(`⚠️  MST DB query failed for ${skill}:`, err.message);
      return [];
    }
  }

  /**
   * Load items for a skill from the static JSON file.
   */
  private async loadSkillItemsFromJSON(skill: Skill): Promise<Item[]> {
    const items: Item[] = [];

    try {
      if (existsSync(this.itemBankPath)) {
        const fileContent = readFileSync(this.itemBankPath, 'utf-8');
        const itemBank = JSON.parse(fileContent);

        if (itemBank.skills && itemBank.skills[skill]) {
          const skillData = itemBank.skills[skill];

          if (skillData.S1)      items.push(...skillData.S1);
          if (skillData.S2_up)   items.push(...skillData.S2_up);
          if (skillData.S2_stay) items.push(...skillData.S2_stay);
          if (skillData.S2_down) items.push(...skillData.S2_down);
          if (skillData.S3_down) items.push(...skillData.S3_down);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load JSON items for ${skill}:`, error);
    }

    if (items.length === 0) {
      items.push(...this.createFallbackItemsForSkill(skill));
    }

    return items;
  }

  /**
   * Get item by skill and stage.
   */
  getItem(skill: Skill, stage: Stage, cefr?: CEFRLevel, excludedSuffixes?: Set<string>): Item | null {
    const items = this.itemBank.get(skill) || [];

    let filteredItems = items.filter(item => item.stage === stage);

    if (cefr) {
      filteredItems = filteredItems.filter(item => item.cefr === cefr);
    }

    if (excludedSuffixes && excludedSuffixes.size > 0) {
      filteredItems = filteredItems.filter(item => {
        const suffix = item.id.split('-').pop();
        return !excludedSuffixes.has(suffix || '');
      });
    }

    if (filteredItems.length === 0) {
      console.warn(`⚠️ No items found for ${skill} ${stage} ${cefr || ''} after filtering`);
      // Relax suffix filter if it caused empty result
      if (excludedSuffixes && excludedSuffixes.size > 0) {
        filteredItems = items.filter(item => item.stage === stage);
        if (cefr) {
          filteredItems = filteredItems.filter(item => item.cefr === cefr);
        }
      }
      if (filteredItems.length === 0) {
        return items[0] || null;
      }
    }

    const randomIndex = Math.floor(Math.random() * filteredItems.length);
    return filteredItems[randomIndex];
  }

  /**
   * Get all items for a skill.
   */
  getSkillItems(skill: Skill): Item[] {
    return this.itemBank.get(skill) || [];
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
   * Create minimal fallback items for all skills.
   */
  private createFallbackItems(): void {
    const skills: Skill[] = ['listening', 'reading', 'speaking', 'writing'];
    for (const skill of skills) {
      this.itemBank.set(skill, this.createFallbackItemsForSkill(skill));
    }
  }

  /**
   * Create fallback items for a specific skill.
   */
  private createFallbackItemsForSkill(skill: Skill): Item[] {
    const items: Item[] = [];
    const stages: Stage[] = ['core', 'upper', 'lower'];
    const levels: CEFRLevel[] = ['A2', 'B1', 'B2'];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const level = levels[i];

      switch (skill) {
        case 'listening':
          items.push({
            id: `L-${level}-fallback-${stage}`,
            skill: 'listening',
            stage,
            cefr: level,
            timing: {
              audioSec: 30,
              maxAnswerSec: getListeningResponseTime(level),
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
          } as any);
          break;

        case 'reading':
          items.push({
            id: `R-${level}-fallback-${stage}`,
            skill: 'reading',
            stage,
            cefr: level,
            timing: { maxAnswerSec: 90 },
            metadata: { domain: 'general' },
            assets: {
              passage: 'Learning languages is an important skill in today\'s globalized world. It opens up new opportunities for communication, travel, and career advancement. Many people find that learning a second language improves their cognitive abilities and cultural understanding.',
            },
            questions: [{
              type: 'mcq_single',
              stem: 'According to the passage, learning languages is:',
              options: ['Difficult', 'Important', 'Expensive', 'Boring'],
              answerIndex: 1,
            }],
          } as any);
          break;

        case 'speaking':
          items.push({
            id: `S-${level}-fallback-${stage}`,
            skill: 'speaking',
            stage,
            cefr: level,
            timing: {
              prepSec: 10,
              recordSec: getSpeakingRecordTime(level),
              maxAnswerSec: 10 + getSpeakingRecordTime(level),
            },
            metadata: { domain: 'general' },
            assets: {
              prompt: 'Describe your favorite hobby and explain why you enjoy it.',
              keywords: ['hobby', 'enjoy', 'because', 'interesting'],
            },
          } as any);
          break;

        case 'writing':
          items.push({
            id: `W-${level}-fallback-${stage}`,
            skill: 'writing',
            stage,
            cefr: level,
            timing: { maxAnswerSec: getWritingCompositionTime(level) },
            metadata: { domain: 'general' },
            assets: {
              prompt: 'Do you think social media has a positive or negative impact on society? Give your opinion with reasons.',
              minWords: 100,
              maxWords: 200,
              taskType: 'opinion',
            },
          } as any);
          break;
      }
    }

    return items;
  }
}
