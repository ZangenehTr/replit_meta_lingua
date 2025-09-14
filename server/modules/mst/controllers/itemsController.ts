/**
 * MST Items Controller
 * Manages item bank loading and selection
 */

import { Item, Skill, Stage, CEFRLevel } from '../schemas/itemSchema';
import { getListeningResponseTime, getWritingCompositionTime, getSpeakingRecordTime } from '../utils/timers';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class MstItemsController {
  private itemBank: Map<string, Item[]> = new Map();
  private initialized = false;

  constructor(private itemBankPath: string = 'data/mst_item_bank.json') {}

  /**
   * Initialize item bank from JSON files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load items for each skill
      const skills: Skill[] = ['listening', 'reading', 'speaking', 'writing'];
      
      for (const skill of skills) {
        const items = await this.loadSkillItems(skill);
        this.itemBank.set(skill, items);
      }
      
      this.initialized = true;
      console.log(`✅ MST Item Bank initialized with ${this.getTotalItemCount()} items`);
    } catch (error) {
      console.error('❌ Failed to initialize MST item bank:', error);
      // Create minimal fallback items
      this.createFallbackItems();
      this.initialized = true;
    }
  }

  /**
   * Load items for a specific skill from main JSON file
   */
  private async loadSkillItems(skill: Skill): Promise<Item[]> {
    const items: Item[] = [];

    try {
      // Load from main item bank JSON file
      if (existsSync(this.itemBankPath)) {
        const fileContent = readFileSync(this.itemBankPath, 'utf-8');
        const itemBank = JSON.parse(fileContent);
        
        if (itemBank.skills && itemBank.skills[skill]) {
          const skillData = itemBank.skills[skill];
          
          // Load S1 (core) items
          if (skillData.S1) {
            items.push(...skillData.S1);
          }
          
          // Load S2 items (upper, stay, down)
          if (skillData.S2_up) {
            items.push(...skillData.S2_up);
          }
          if (skillData.S2_stay) {
            items.push(...skillData.S2_stay);
          }
          if (skillData.S2_down) {
            items.push(...skillData.S2_down);
          }
          
          // Load S3 items (A1 level)
          if (skillData.S3_down) {
            items.push(...skillData.S3_down);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load items for ${skill}:`, error);
    }

    // If no items loaded, create fallback items
    if (items.length === 0) {
      items.push(...this.createFallbackItemsForSkill(skill));
    }

    return items;
  }

  /**
   * Get item by skill and stage
   */
  getItem(skill: Skill, stage: Stage, cefr?: CEFRLevel, excludedSuffixes?: Set<string>): Item | null {
    const items = this.itemBank.get(skill) || [];
    
    // Filter by stage and optionally by CEFR level
    let filteredItems = items.filter(item => item.stage === stage);
    
    if (cefr) {
      filteredItems = filteredItems.filter(item => item.cefr === cefr);
    }
    
    // Filter out items with excluded suffixes (for preventing duplicate content)
    if (excludedSuffixes && excludedSuffixes.size > 0) {
      filteredItems = filteredItems.filter(item => {
        const suffix = item.id.split('-').pop();
        return !excludedSuffixes.has(suffix || '');
      });
    }
    
    if (filteredItems.length === 0) {
      console.warn(`⚠️ No items found for ${skill} ${stage} ${cefr || ''} after filtering`);
      // If no items after filtering, try without suffix filter as fallback
      if (excludedSuffixes && excludedSuffixes.size > 0) {
        filteredItems = items.filter(item => item.stage === stage);
        if (cefr) {
          filteredItems = filteredItems.filter(item => item.cefr === cefr);
        }
      }
      if (filteredItems.length === 0) {
        // Return any item from the skill as fallback
        return items[0] || null;
      }
    }
    
    // Return random item from filtered set
    const randomIndex = Math.floor(Math.random() * filteredItems.length);
    return filteredItems[randomIndex];
  }

  /**
   * Get all items for a skill
   */
  getSkillItems(skill: Skill): Item[] {
    return this.itemBank.get(skill) || [];
  }

  /**
   * Check if item bank is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get total item count
   */
  getTotalItemCount(): number {
    let total = 0;
    for (const items of this.itemBank.values()) {
      total += items.length;
    }
    return total;
  }

  /**
   * Create minimal fallback items for testing
   */
  private createFallbackItems(): void {
    const skills: Skill[] = ['listening', 'reading', 'speaking', 'writing'];
    
    for (const skill of skills) {
      const items = this.createFallbackItemsForSkill(skill);
      this.itemBank.set(skill, items);
    }
  }

  /**
   * Create fallback items for a specific skill
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
              maxAnswerSec: getListeningResponseTime(level) // Level-specific response time AFTER audio
            },
            metadata: { domain: 'general' },
            assets: {
              audio: '/assets/fallback/listening_sample.mp3',
              transcript: 'This is a sample listening passage for placement testing.'
            },
            questions: [{
              type: 'mcq_single',
              stem: 'What is the main topic of the audio?',
              options: ['Education', 'Travel', 'Food', 'Weather'],
              answerIndex: 0
            }]
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
              passage: 'Learning languages is an important skill in today\'s globalized world. It opens up new opportunities for communication, travel, and career advancement. Many people find that learning a second language improves their cognitive abilities and cultural understanding.'
            },
            questions: [{
              type: 'mcq_single',
              stem: 'According to the passage, learning languages is:',
              options: ['Difficult', 'Important', 'Expensive', 'Boring'],
              answerIndex: 1
            }]
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
              maxAnswerSec: 10 + getSpeakingRecordTime(level) 
            },
            metadata: { domain: 'general' },
            assets: {
              prompt: 'Describe your favorite hobby and explain why you enjoy it.',
              keywords: ['hobby', 'enjoy', 'because', 'interesting']
            }
          } as any);
          break;

        case 'writing':
          items.push({
            id: `W-${level}-fallback-${stage}`,
            skill: 'writing',
            stage,
            cefr: level,
            timing: { maxAnswerSec: getWritingCompositionTime(level) }, // Single question with adequate time
            metadata: { domain: 'general' },
            assets: {
              prompt: 'Do you think social media has a positive or negative impact on society? Give your opinion with reasons.',
              minWords: 100, // Increased for single comprehensive question
              maxWords: 200,
              taskType: 'opinion'
            }
          } as any);
          break;
      }
    }

    return items;
  }
}