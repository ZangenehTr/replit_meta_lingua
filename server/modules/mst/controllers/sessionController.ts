/**
 * MST Session Controller
 * Manages MST test sessions, timing, and flow
 */

import { MstSession, MstResult, SkillResult } from '../schemas/resultSchema';
import { SessionTimer, createSessionTimer, getSessionRemainingTime, isSessionTimeUp, getSessionElapsedTime } from '../utils/timers';
import { calculateOverallLevel } from '../routing/router';

export class MstSessionController {
  private sessions: Map<string, MstSession> = new Map();
  private timers: Map<string, SessionTimer> = new Map();
  private skillResults: Map<string, SkillResult[]> = new Map();
  private sessionItems: Map<string, Map<string, any>> = new Map(); // sessionId -> itemKey -> item
  private usedItemIds: Map<string, Set<string>> = new Map(); // sessionId -> Set of used item IDs

  /**
   * Start a new MST session
   */
  async startSession(userId: number): Promise<{
    sessionId: string;
    skillOrder: string[];
    perSkillSeconds: number;
  }> {
    const sessionId = `mst_${userId}_${Date.now()}`;
    
    // Default skill order (can be randomized later)
    const skillOrder = ['listening', 'reading', 'speaking', 'writing'];
    const perSkillSeconds = 60; // 1 minute for speaking (first question), adjustable per skill
    
    const session: MstSession = {
      sessionId,
      userId,
      skillOrder: skillOrder as any,
      perSkillSeconds,
      startedAt: new Date(),
      status: 'in_progress'
    };
    
    this.sessions.set(sessionId, session);
    this.timers.set(sessionId, createSessionTimer());
    this.skillResults.set(sessionId, []);
    this.sessionItems.set(sessionId, new Map());
    this.usedItemIds.set(sessionId, new Set());
    
    return {
      sessionId,
      skillOrder,
      perSkillSeconds
    };
  }

  /**
   * Get current session
   */
  getSession(sessionId: string): MstSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session status
   */
  updateSession(sessionId: string, updates: Partial<MstSession>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    Object.assign(session, updates);
    this.sessions.set(sessionId, session);
    return true;
  }

  /**
   * Get session timer
   */
  getTimer(sessionId: string): SessionTimer | null {
    return this.timers.get(sessionId) || null;
  }

  /**
   * Get session remaining time
   */
  getSessionRemainingTime(sessionId: string): number {
    const timer = this.timers.get(sessionId);
    if (!timer) return 0;
    return getSessionRemainingTime(timer);
  }

  /**
   * Check if session time is up
   */
  isSessionTimeUp(sessionId: string): boolean {
    const timer = this.timers.get(sessionId);
    if (!timer) return true;
    return isSessionTimeUp(timer);
  }

  /**
   * Add skill result
   */
  addSkillResult(sessionId: string, result: SkillResult): void {
    const results = this.skillResults.get(sessionId) || [];
    results.push(result);
    this.skillResults.set(sessionId, results);
  }

  /**
   * Get skill results
   */
  getSkillResults(sessionId: string): SkillResult[] {
    return this.skillResults.get(sessionId) || [];
  }

  /**
   * Check if session should auto-advance to next skill
   */
  shouldAutoAdvance(sessionId: string): boolean {
    const timer = this.getTimer(sessionId);
    const session = this.getSession(sessionId);
    
    if (!timer || !session) return false;
    
    // Check global timeout
    if (isSessionTimeUp(timer)) {
      return true;
    }
    
    // Skill-specific timing is now handled per question
    // Auto-advance logic simplified
    
    return false;
  }

  /**
   * Get next skill in order
   */
  getNextSkill(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const currentIndex = session.currentSkill 
      ? session.skillOrder.indexOf(session.currentSkill as any)
      : -1;
    
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= session.skillOrder.length) {
      return null; // Test completed
    }
    
    return session.skillOrder[nextIndex];
  }

  /**
   * Complete session and calculate final results
   */
  async finalizeSession(sessionId: string): Promise<MstResult> {
    const session = this.getSession(sessionId);
    const skillResults = this.getSkillResults(sessionId);
    const timer = this.getTimer(sessionId);
    
    if (!session || !timer) {
      throw new Error('Session not found');
    }
    
    // Update session status
    this.updateSession(sessionId, { status: 'completed' });
    
    // Calculate overall level
    const skillBands = skillResults.map(result => result.band);
    console.log(`🔄 Finalizing session: skillResults count=${skillResults.length}`);
    console.log(`📊 Individual skill bands:`, skillBands);
    const overallBand = calculateOverallLevel(skillBands);
    console.log(`📈 Final overall band: ${overallBand}`);
    
    // Calculate overall confidence (average of skill confidences)
    const overallConfidence = skillResults.length > 0 
      ? skillResults.reduce((sum, result) => sum + result.confidence, 0) / skillResults.length
      : 0;
    
    const result: MstResult = {
      sessionId,
      overallBand,
      overallConfidence,
      skills: skillResults,
      totalTimeMin: getSessionElapsedTime(timer) / 60,
      completedAt: new Date(),
      recommendations: this.generateRecommendations(skillResults)
    };
    
    return result;
  }

  /**
   * Generate learning recommendations based on results
   */
  private generateRecommendations(skillResults: SkillResult[]): string[] {
    const recommendations: string[] = [];
    
    // Find weakest skills
    const sortedByConfidence = [...skillResults].sort((a, b) => a.confidence - b.confidence);
    const weakestSkill = sortedByConfidence[0];
    
    if (weakestSkill && weakestSkill.confidence < 0.6) {
      recommendations.push(`Focus on improving your ${weakestSkill.skill} skills`);
    }
    
    // Check for consistent low performance
    const lowPerformingSkills = skillResults.filter(result => 
      result.band.includes('-') || ['A1', 'A2'].includes(result.band.replace(/[+-]/, ''))
    );
    
    if (lowPerformingSkills.length >= 2) {
      recommendations.push('Consider starting with fundamental language courses');
    }
    
    // Check for high performance
    const highPerformingSkills = skillResults.filter(result => 
      result.band.includes('+') || ['B2', 'C1', 'C2'].includes(result.band.replace(/[+-]/, ''))
    );
    
    if (highPerformingSkills.length >= 3) {
      recommendations.push('You are ready for advanced language courses');
    }
    
    return recommendations;
  }

  /**
   * Store item for session
   */
  setSessionItem(sessionId: string, skill: string, stage: string, item: any): void {
    const sessionItems = this.sessionItems.get(sessionId);
    const usedIds = this.usedItemIds.get(sessionId);
    if (sessionItems && usedIds) {
      const itemKey = `${skill}_${stage}`;
      sessionItems.set(itemKey, item);
      // Track used item ID to prevent duplicates
      if (item?.id) {
        usedIds.add(item.id);
      }
    }
  }

  /**
   * Get stored item for session
   */
  getSessionItem(sessionId: string, skill: string, stage: string): any {
    const sessionItems = this.sessionItems.get(sessionId);
    if (sessionItems) {
      const itemKey = `${skill}_${stage}`;
      return sessionItems.get(itemKey);
    }
    return null;
  }
  
  /**
   * Get used item IDs for session
   */
  getUsedItemIds(sessionId: string): Set<string> {
    return this.usedItemIds.get(sessionId) || new Set();
  }
  
  /**
   * Check if an item suffix has been used
   */
  hasUsedItemSuffix(sessionId: string, itemId: string): boolean {
    const usedIds = this.getUsedItemIds(sessionId);
    const suffix = itemId.split('-').pop(); // Get the suffix (e.g., '002' from 'S-B1-002')
    
    // Check if any used item has the same suffix
    for (const usedId of usedIds) {
      if (usedId.split('-').pop() === suffix) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clean up old sessions (call periodically)
   */
  cleanupSessions(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions) {
      if (session.startedAt < cutoffTime) {
        this.sessions.delete(sessionId);
        this.timers.delete(sessionId);
        this.skillResults.delete(sessionId);
        this.sessionItems.delete(sessionId);
        this.usedItemIds.delete(sessionId);
      }
    }
  }
}