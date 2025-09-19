import { db } from './db';
import { learningActivities, skillAssessments, users } from '../shared/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

// Enhanced activity tracking with comprehensive learning analytics
// Track homework completion, study time, weak/strong points, flashcard memorization
// This is the core intelligence system for Global Lexi to understand learner patterns

export interface ActivityContext {
  module: 'callern' | 'homework' | 'flashcards' | 'virtual-mall' | 'courses' | 'tests' | 'general';
  activityType: string;
  metadata: Record<string, any>;
}

// Comprehensive learning analytics for Global Lexi AI mentor
export interface LearningAnalytics {
  studyTime: {
    daily: number; // minutes per day
    weekly: number; // total weekly minutes
    streak: number; // consecutive days
  };
  homeworkCompletion: {
    completed: number;
    total: number;
    averageScore: number;
    latestCompletionTime: string;
  };
  flashcardPerformance: {
    cardsStudied: number;
    accuracyRate: number; // percentage
    difficultCards: string[]; // card IDs that need more practice
    masteredCards: string[]; // card IDs that are well learned
  };
  weakPoints: {
    grammar: string[]; // areas needing improvement
    vocabulary: string[]; // word categories to focus on
    pronunciation: string[]; // sounds/words to practice
    skills: string[]; // reading, writing, listening, speaking
  };
  strongPoints: {
    grammar: string[]; // mastered grammar areas
    vocabulary: string[]; // strong vocabulary categories
    pronunciation: string[]; // well-pronounced sounds
    skills: string[]; // strongest language skills
  };
  callerNSessions: {
    totalSessions: number;
    averageRating: number;
    improvementAreas: string[];
    achievements: string[];
  };
}

export class ActivityTracker {
  
  // Generate comprehensive learning analytics for Global Lexi
  async generateLearningAnalytics(userId: number): Promise<LearningAnalytics> {
    try {
      // Get all activities for this user
      const activities = await this.getActivityHistory(userId, 30);
      
      // Calculate study time patterns
      const studyTime = await this.calculateStudyTimePatterns(userId);
      
      // Analyze homework completion patterns
      const homeworkCompletion = await this.analyzeHomeworkCompletion(userId);
      
      // Evaluate flashcard performance
      const flashcardPerformance = await this.analyzeFlashcardPerformance(userId, activities);
      
      // Identify weak and strong points
      const { weakPoints, strongPoints } = await this.identifyLearningPatterns(userId, activities);
      
      // Analyze CallerN video session data
      const callerNSessions = await this.analyzeCallerNSessions(userId, activities);
      
      return {
        studyTime,
        homeworkCompletion,
        flashcardPerformance,
        weakPoints,
        strongPoints,
        callerNSessions
      };
    } catch (error) {
      console.error('Error generating learning analytics:', error);
      // Return default analytics structure
      return this.getDefaultAnalytics();
    }
  }

  private async calculateStudyTimePatterns(userId: number): Promise<LearningAnalytics['studyTime']> {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Get today's study time
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayActivities = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${learningActivities.durationMinutes}), 0)`
      })
      .from(learningActivities)
      .where(
        and(
          eq(learningActivities.userId, userId),
          gte(learningActivities.createdAt, todayStart)
        )
      );
    
    const dailyStudyTime = todayActivities[0]?.totalMinutes || 0;
    
    // Get weekly study time
    const weeklyStudyTime = await this.getWeeklyStudyTime(userId);
    
    // Calculate study streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now.getTime() - i * oneDay);
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayActivities = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(learningActivities)
        .where(
          and(
            eq(learningActivities.userId, userId),
            gte(learningActivities.createdAt, dayStart),
            lte(learningActivities.createdAt, dayEnd)
          )
        );
      
      if ((dayActivities[0]?.count || 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return { daily: dailyStudyTime, weekly: weeklyStudyTime, streak };
  }

  private async analyzeHomeworkCompletion(userId: number): Promise<LearningAnalytics['homeworkCompletion']> {
    try {
      // Get homework-related activities
      const homeworkActivities = await db
        .select()
        .from(learningActivities)
        .where(
          and(
            eq(learningActivities.userId, userId),
            eq(learningActivities.activityType, 'homework')
          )
        )
        .orderBy(desc(learningActivities.createdAt));
      
      const completed = homeworkActivities.length;
      const total = Math.max(completed, 10); // Assume at least 10 assignments available
      
      // Calculate average completion rate as score
      const averageScore = homeworkActivities.length > 0 
        ? homeworkActivities.reduce((sum, activity) => sum + (activity.completionRate || 0), 0) / homeworkActivities.length
        : 0;
      
      const latestCompletionTime = homeworkActivities[0]?.createdAt?.toISOString() || '';
      
      return {
        completed,
        total,
        averageScore: Math.round(averageScore * 100) / 100,
        latestCompletionTime
      };
    } catch (error) {
      console.error('Error analyzing homework completion:', error);
      return { completed: 0, total: 0, averageScore: 0, latestCompletionTime: '' };
    }
  }

  private async analyzeFlashcardPerformance(userId: number, activities: any[]): Promise<LearningAnalytics['flashcardPerformance']> {
    try {
      // Get flashcard-specific activities
      const flashcardActivities = activities.filter(activity => 
        activity.activityType === 'flashcard' || activity.activityType === 'vocabulary'
      );
      
      const cardsStudied = flashcardActivities.length;
      
      // Calculate accuracy from completion rates
      const accuracyRate = flashcardActivities.length > 0
        ? flashcardActivities.reduce((sum, activity) => sum + (activity.completionRate || 0), 0) / flashcardActivities.length * 100
        : 0;
      
      // Identify difficult and mastered cards from metadata
      const difficultCards: string[] = [];
      const masteredCards: string[] = [];
      
      flashcardActivities.forEach(activity => {
        if (activity.metadata?.cardId) {
          if ((activity.completionRate || 0) < 0.6) {
            difficultCards.push(activity.metadata.cardId);
          } else if ((activity.completionRate || 0) >= 0.9) {
            masteredCards.push(activity.metadata.cardId);
          }
        }
      });
      
      return {
        cardsStudied,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        difficultCards: [...new Set(difficultCards)],
        masteredCards: [...new Set(masteredCards)]
      };
    } catch (error) {
      console.error('Error analyzing flashcard performance:', error);
      return { cardsStudied: 0, accuracyRate: 0, difficultCards: [], masteredCards: [] };
    }
  }

  private async identifyLearningPatterns(userId: number, activities: any[]): Promise<{ weakPoints: LearningAnalytics['weakPoints'], strongPoints: LearningAnalytics['strongPoints'] }> {
    try {
      // Get skill assessments to identify patterns
      const assessments = await db
        .select()
        .from(skillAssessments)
        .where(eq(skillAssessments.userId, userId))
        .orderBy(desc(skillAssessments.createdAt));
      
      const weakPoints: LearningAnalytics['weakPoints'] = {
        grammar: [],
        vocabulary: [],
        pronunciation: [],
        skills: []
      };
      
      const strongPoints: LearningAnalytics['strongPoints'] = {
        grammar: [],
        vocabulary: [],
        pronunciation: [],
        skills: []
      };
      
      // Analyze skill assessments
      assessments.forEach(assessment => {
        const score = parseFloat(assessment.score);
        const skillType = assessment.skillType;
        
        if (score < 60) {
          // Weak point
          if (['speaking', 'listening', 'reading', 'writing'].includes(skillType)) {
            weakPoints.skills.push(skillType);
          } else if (skillType.includes('grammar')) {
            weakPoints.grammar.push(skillType);
          } else if (skillType.includes('vocab')) {
            weakPoints.vocabulary.push(skillType);
          } else if (skillType.includes('pronunciation')) {
            weakPoints.pronunciation.push(skillType);
          }
        } else if (score >= 80) {
          // Strong point
          if (['speaking', 'listening', 'reading', 'writing'].includes(skillType)) {
            strongPoints.skills.push(skillType);
          } else if (skillType.includes('grammar')) {
            strongPoints.grammar.push(skillType);
          } else if (skillType.includes('vocab')) {
            strongPoints.vocabulary.push(skillType);
          } else if (skillType.includes('pronunciation')) {
            strongPoints.pronunciation.push(skillType);
          }
        }
      });
      
      // Remove duplicates
      Object.keys(weakPoints).forEach(key => {
        weakPoints[key as keyof typeof weakPoints] = [...new Set(weakPoints[key as keyof typeof weakPoints])];
      });
      
      Object.keys(strongPoints).forEach(key => {
        strongPoints[key as keyof typeof strongPoints] = [...new Set(strongPoints[key as keyof typeof strongPoints])];
      });
      
      return { weakPoints, strongPoints };
    } catch (error) {
      console.error('Error identifying learning patterns:', error);
      return {
        weakPoints: { grammar: [], vocabulary: [], pronunciation: [], skills: [] },
        strongPoints: { grammar: [], vocabulary: [], pronunciation: [], skills: [] }
      };
    }
  }

  private async analyzeCallerNSessions(userId: number, activities: any[]): Promise<LearningAnalytics['callerNSessions']> {
    try {
      // Get CallerN-specific activities
      const callerNActivities = activities.filter(activity => 
        activity.activityType === 'callern' || activity.activityType.includes('video')
      );
      
      const totalSessions = callerNActivities.length;
      
      // Calculate average rating from completion rates
      const averageRating = callerNActivities.length > 0
        ? callerNActivities.reduce((sum, activity) => sum + (activity.completionRate || 0), 0) / callerNActivities.length * 5
        : 0;
      
      // Extract improvement areas and achievements from metadata
      const improvementAreas: string[] = [];
      const achievements: string[] = [];
      
      callerNActivities.forEach(activity => {
        if (activity.metadata?.improvementAreas) {
          improvementAreas.push(...activity.metadata.improvementAreas);
        }
        if (activity.metadata?.achievements) {
          achievements.push(...activity.metadata.achievements);
        }
        
        // Infer improvement areas based on completion rates
        if ((activity.completionRate || 0) < 0.7) {
          improvementAreas.push('session-engagement');
        }
        if ((activity.completionRate || 0) >= 0.9) {
          achievements.push('excellent-participation');
        }
      });
      
      return {
        totalSessions,
        averageRating: Math.round(averageRating * 100) / 100,
        improvementAreas: [...new Set(improvementAreas)],
        achievements: [...new Set(achievements)]
      };
    } catch (error) {
      console.error('Error analyzing CallerN sessions:', error);
      return { totalSessions: 0, averageRating: 0, improvementAreas: [], achievements: [] };
    }
  }

  private getDefaultAnalytics(): LearningAnalytics {
    return {
      studyTime: { daily: 0, weekly: 0, streak: 0 },
      homeworkCompletion: { completed: 0, total: 0, averageScore: 0, latestCompletionTime: '' },
      flashcardPerformance: { cardsStudied: 0, accuracyRate: 0, difficultCards: [], masteredCards: [] },
      weakPoints: { grammar: [], vocabulary: [], pronunciation: [], skills: [] },
      strongPoints: { grammar: [], vocabulary: [], pronunciation: [], skills: [] },
      callerNSessions: { totalSessions: 0, averageRating: 0, improvementAreas: [], achievements: [] }
    };
  }
  /**
   * Record a learning activity with real time tracking
   */
  async recordActivity(
    userId: number,
    activityType: string,
    courseId: number | null,
    durationMinutes: number,
    metadata?: any
  ) {
    try {
      // Insert the learning activity
      const [activity] = await db.insert(learningActivities).values({
        userId,
        activityType,
        courseId,
        durationMinutes,
        completionRate: metadata?.completionRate || 0,
        skillPoints: metadata?.skillPoints || {},
        metadata: metadata || {}
      }).returning();

      // Update user's total study time
      await this.updateUserStudyTime(userId, durationMinutes);

      return activity;
    } catch (error) {
      console.error('Error recording activity:', error);
      throw error;
    }
  }

  /**
   * Get real weekly study time for a user
   */
  async getWeeklyStudyTime(userId: number): Promise<number> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const activities = await db
        .select({
          totalMinutes: sql<number>`COALESCE(SUM(${learningActivities.durationMinutes}), 0)`
        })
        .from(learningActivities)
        .where(
          and(
            eq(learningActivities.userId, userId),
            gte(learningActivities.createdAt, oneWeekAgo)
          )
        );

      return activities[0]?.totalMinutes || 0;
    } catch (error) {
      console.error('Error getting weekly study time:', error);
      return 0;
    }
  }

  /**
   * Get weekly progress percentage based on goals and actual study
   */
  async getWeeklyProgress(userId: number): Promise<{
    studyTimeMinutes: number;
    goalMinutes: number;
    progressPercentage: number;
    activeDays: number;
    completedLessons: number;
  }> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get total study time for the week
      const studyTimeResult = await db
        .select({
          totalMinutes: sql<number>`COALESCE(SUM(${learningActivities.durationMinutes}), 0)`,
          activeDays: sql<number>`COUNT(DISTINCT DATE(${learningActivities.createdAt}))`,
          completedLessons: sql<number>`COUNT(CASE WHEN ${learningActivities.activityType} = 'lesson' THEN 1 END)`
        })
        .from(learningActivities)
        .where(
          and(
            eq(learningActivities.userId, userId),
            gte(learningActivities.createdAt, oneWeekAgo)
          )
        );

      const studyTimeMinutes = studyTimeResult[0]?.totalMinutes || 0;
      const activeDays = studyTimeResult[0]?.activeDays || 0;
      const completedLessons = studyTimeResult[0]?.completedLessons || 0;

      // Get user's weekly goal (default 600 minutes = 10 hours)
      const userProfile = await db
        .select({ weeklyStudyHours: users.totalLessons })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const goalMinutes = (userProfile[0]?.weeklyStudyHours || 10) * 60;
      const progressPercentage = Math.min(100, Math.round((studyTimeMinutes / goalMinutes) * 100));

      return {
        studyTimeMinutes,
        goalMinutes,
        progressPercentage,
        activeDays,
        completedLessons
      };
    } catch (error) {
      console.error('Error calculating weekly progress:', error);
      return {
        studyTimeMinutes: 0,
        goalMinutes: 600,
        progressPercentage: 0,
        activeDays: 0,
        completedLessons: 0
      };
    }
  }

  /**
   * Update user's total study time
   */
  private async updateUserStudyTime(userId: number, additionalMinutes: number) {
    try {
      await db
        .update(users)
        .set({
          totalLessons: sql`${users.totalLessons} + ${Math.round(additionalMinutes / 30)}`, // Convert to lesson units
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user study time:', error);
    }
  }

  /**
   * Record skill assessment from activities
   */
  async recordSkillAssessment(
    userId: number,
    skillType: string,
    score: number,
    activityType: string,
    activityId?: number,
    metadata?: any
  ) {
    try {
      const [assessment] = await db.insert(skillAssessments).values({
        userId,
        skillType,
        score: score.toString(),
        activityType,
        activityId,
        metadata
      }).returning();

      // Update progress snapshot if needed
      await this.updateProgressSnapshot(userId);

      return assessment;
    } catch (error) {
      console.error('Error recording skill assessment:', error);
      throw error;
    }
  }

  /**
   * Update or create progress snapshot
   */
  private async updateProgressSnapshot(userId: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get latest skill assessments
      const skills = await db
        .select({
          skillType: skillAssessments.skillType,
          avgScore: sql<number>`AVG(CAST(${skillAssessments.score} AS DECIMAL))`
        })
        .from(skillAssessments)
        .where(eq(skillAssessments.userId, userId))
        .groupBy(skillAssessments.skillType);

      // Build skill scores object
      const skillScores: any = {
        speaking: 0,
        listening: 0,
        reading: 0,
        writing: 0,
        grammar: 0,
        vocabulary: 0
      };

      skills.forEach(skill => {
        if (skill.skillType in skillScores) {
          skillScores[skill.skillType] = Math.round(skill.avgScore || 0);
        }
      });

      // Calculate average and level
      const avgScore = Object.values(skillScores).reduce((sum: any, val: any) => sum + val, 0) / 6;
      const overallLevel = this.calculateLevel(avgScore);

      // TODO: Check if snapshot exists for today when progressSnapshots table is created
      /*
      const existingSnapshot = await db
        .select()
        .from(progressSnapshots)
        .where(
          and(
            eq(progressSnapshots.userId, userId),
            eq(progressSnapshots.snapshotDate, today.toISOString().split('T')[0])
          )
        )
        .limit(1);

      if (existingSnapshot.length === 0) {
        // Create new snapshot
        await db.insert(progressSnapshots).values({
          userId,
          skillScores,
          overallLevel,
          averageScore: avgScore.toString(),
          snapshotDate: today.toISOString().split('T')[0]
        });
      }
      */
    } catch (error) {
      console.error('Error updating progress snapshot:', error);
    }
  }

  /**
   * Calculate proficiency level based on score
   */
  private calculateLevel(score: number): string {
    if (score >= 90) return 'C2';
    if (score >= 80) return 'C1';
    if (score >= 70) return 'B2';
    if (score >= 60) return 'B1';
    if (score >= 50) return 'A2';
    return 'A1';
  }

  /**
   * Get detailed activity history
   */
  async getActivityHistory(userId: number, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await db
        .select()
        .from(learningActivities)
        .where(
          and(
            eq(learningActivities.userId, userId),
            gte(learningActivities.createdAt, startDate)
          )
        )
        .orderBy(desc(learningActivities.createdAt));

      return activities;
    } catch (error) {
      console.error('Error getting activity history:', error);
      return [];
    }
  }

  /**
   * Get skill progression over time
   */
  async getSkillProgression(userId: number, months: number = 6) {
    try {
      // Return empty array for now - progress snapshots table will be added later
      return [];
      
      // TODO: Implement when progress_snapshots table is created
      /*
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const snapshots = await db
        .select()
        .from(progressSnapshots)
        .where(
          and(
            eq(progressSnapshots.userId, userId),
            gte(progressSnapshots.createdAt, startDate)
          )
        )
        .orderBy(progressSnapshots.snapshotDate);

      return snapshots;
      */
    } catch (error) {
      console.error('Error getting skill progression:', error);
      return [];
    }
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();