/**
 * Global Lexi Service - Omnipresent AI Mentor System
 * Tracks all learning activities across CallerN, homework, flashcards, and other modules
 */

import { apiRequest } from '@/lib/queryClient';

interface LexiActivityContext {
  module: 'callern' | 'homework' | 'flashcards' | 'virtual-mall' | 'courses' | 'tests' | 'general';
  activityType: string;
  sessionId?: string;
  courseId?: number;
  lessonId?: number;
  metadata?: any;
}

interface LexiInteraction {
  id: string;
  userId: number;
  message: string;
  response: string;
  context: LexiActivityContext;
  timestamp: Date;
  emotion?: 'happy' | 'excited' | 'encouraging' | 'thinking' | 'celebrating';
  culturalTip?: string;
  pronunciation?: string;
}

export class GlobalLexiService {
  private static instance: GlobalLexiService;
  
  public static getInstance(): GlobalLexiService {
    if (!GlobalLexiService.instance) {
      GlobalLexiService.instance = new GlobalLexiService();
    }
    return GlobalLexiService.instance;
  }

  /**
   * Track user activity across all learning modules
   */
  async trackActivity(context: LexiActivityContext): Promise<void> {
    try {
      await apiRequest('/api/lexi/track-activity', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(context)
      });
    } catch (error) {
      console.error('Failed to track Lexi activity:', error);
    }
  }

  /**
   * Get contextual AI response based on current activity
   */
  async getContextualResponse(
    message: string, 
    context: LexiActivityContext,
    studentLevel: string = 'intermediate'
  ): Promise<{
    content: string;
    emotion?: string;
    culturalTip?: string;
    pronunciation?: string;
    suggestions?: string[];
  }> {
    try {
      const response = await apiRequest('/api/lexi/contextual-response', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message,
          context,
          studentLevel
        })
      });
      return response;
    } catch (error) {
      console.error('Failed to get Lexi contextual response:', error);
      return {
        content: "I'm here to help! Please try again.",
        emotion: 'encouraging'
      };
    }
  }

  /**
   * Get Lexi's current insights based on user's learning journey
   */
  async getCurrentInsights(): Promise<{
    weeklyProgress: number;
    currentFocus: string;
    recommendations: string[];
    encouragement: string;
  }> {
    try {
      const response = await apiRequest('/api/lexi/insights', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to get Lexi insights:', error);
      return {
        weeklyProgress: 0,
        currentFocus: 'general learning',
        recommendations: ['Keep practicing daily!'],
        encouragement: 'You\'re doing great! Keep up the excellent work.'
      };
    }
  }

  /**
   * Record Lexi interaction for learning analytics
   */
  async recordInteraction(interaction: Omit<LexiInteraction, 'id' | 'timestamp'>): Promise<void> {
    try {
      await apiRequest('/api/lexi/interactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...interaction,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to record Lexi interaction:', error);
    }
  }

  /**
   * Get Lexi companion stats
   */
  async getCompanionStats(): Promise<{
    conversations: number;
    helpfulTips: number;
    encouragements: number;
    totalInteractions: number;
    weeklyEngagement: number;
  }> {
    try {
      const response = await apiRequest('/api/lexi/stats', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to get Lexi stats:', error);
      return {
        conversations: 0,
        helpfulTips: 0,
        encouragements: 0,
        totalInteractions: 0,
        weeklyEngagement: 0
      };
    }
  }
}

// Export singleton instance
export const globalLexiService = GlobalLexiService.getInstance();