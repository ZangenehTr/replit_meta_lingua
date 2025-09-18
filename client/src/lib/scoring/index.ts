/**
 * Client-Side MST Scoring Library
 * Fast browser-based scoring to reduce server load by 80-95%
 */

export { scoreSpeaking, validateSpeakingResponse } from './speakingQuickscore';
export { 
  scoreWriting, 
  validateWritingResponse, 
  mapScoreToLevel, 
  getLevelJustification 
} from './writingQuickscore';
export type { 
  SpeakingResponse, 
  WritingResponse, 
  SpeakingItem, 
  WritingItem, 
  QuickscoreResult,
  ClientScoringItem,
  ClientScoringResponse
} from './types';

/**
 * Main client-side scoring function
 * Routes to appropriate scorer based on item type
 */
export function scoreResponse(
  item: { skill: string },
  response: any
): any {
  switch (item.skill) {
    case 'speaking':
      const { scoreSpeaking } = require('./speakingQuickscore');
      return scoreSpeaking(item, response);
    case 'writing':
      const { scoreWriting } = require('./writingQuickscore');
      return scoreWriting(item, response);
    default:
      throw new Error(`Client-side scoring not implemented for skill: ${item.skill}`);
  }
}

/**
 * Validate response format for any skill
 */
export function validateResponse(item: { skill: string }, response: any): boolean {
  switch (item.skill) {
    case 'speaking':
      const { validateSpeakingResponse } = require('./speakingQuickscore');
      return validateSpeakingResponse(item, response);
    case 'writing':
      const { validateWritingResponse } = require('./writingQuickscore');
      return validateWritingResponse(item, response);
    default:
      return false;
  }
}

/**
 * Performance tracking for client-side scoring
 */
export class ScoringPerformanceTracker {
  private scores: Array<{ skill: string; computeTimeMs: number; timestamp: number }> = [];
  
  recordScore(skill: string, computeTimeMs: number) {
    this.scores.push({
      skill,
      computeTimeMs,
      timestamp: Date.now()
    });
  }
  
  getAverageTime(skill?: string): number {
    const relevantScores = skill 
      ? this.scores.filter(s => s.skill === skill)
      : this.scores;
      
    if (relevantScores.length === 0) return 0;
    
    return relevantScores.reduce((sum, s) => sum + s.computeTimeMs, 0) / relevantScores.length;
  }
  
  getTotalServerLoadReduction(): number {
    // Estimate: each client-side score saves ~500ms of server processing
    const estimatedServerTimeMs = this.scores.length * 500;
    const actualClientTimeMs = this.scores.reduce((sum, s) => sum + s.computeTimeMs, 0);
    
    return estimatedServerTimeMs > 0 
      ? ((estimatedServerTimeMs - actualClientTimeMs) / estimatedServerTimeMs) * 100
      : 0;
  }
  
  getStats() {
    return {
      totalScores: this.scores.length,
      averageClientTime: this.getAverageTime(),
      estimatedServerLoadReduction: this.getTotalServerLoadReduction(),
      scoresBySkill: {
        speaking: this.scores.filter(s => s.skill === 'speaking').length,
        writing: this.scores.filter(s => s.skill === 'writing').length,
      }
    };
  }
}

// Global performance tracker instance
export const performanceTracker = new ScoringPerformanceTracker();