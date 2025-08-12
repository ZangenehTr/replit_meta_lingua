import { db } from './db';
import { learningActivities, progressSnapshots, skillAssessments, users } from '../shared/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export class ActivityTracker {
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
          completedLessons: sql<number>`COUNT(CASE WHEN ${learningActivities.completionRate} >= 0.9 THEN 1 END)`
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

      // Check if snapshot exists for today
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
    } catch (error) {
      console.error('Error getting skill progression:', error);
      return [];
    }
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker();