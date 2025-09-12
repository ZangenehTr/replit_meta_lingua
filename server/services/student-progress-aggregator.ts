/**
 * Student Progress Aggregator Service
 * Computes real student progress metrics from database instead of hardcoded values
 */

import { DatabaseStorage } from '../database-storage';

export interface StudentProgressMetrics {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: number;
  averageScore: number;
  totalStudyHours: number;
  skillProgress: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  recentActivity: {
    lastActive: Date | null;
    lessonsThisWeek: number;
    hoursThisWeek: number;
  };
}

export class StudentProgressAggregator {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Compute comprehensive student progress metrics from real database data
   */
  async getStudentProgressMetrics(userId: number): Promise<StudentProgressMetrics> {
    try {
      // Get user basic info
      const user = await this.storage.getUser(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get all video course enrollments for this student
      const allEnrollments = await this.storage.getEnrollments();
      const enrollments = allEnrollments.filter((enrollment: any) => enrollment.studentId === userId);
      
      // Get video lesson progress
      const videoProgress = await this.storage.getStudentVideoProgress(userId);
      
      // Get placement test sessions for skill progress
      let placementSessions: any[] = [];
      try {
        placementSessions = await this.storage.getUserPlacementTestSessions(userId);
      } catch (error) {
        console.error('Error getting placement sessions:', error);
      }
      const latestPlacement = placementSessions.length > 0 
        ? placementSessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      // Calculate total and completed lessons
      const totalLessons = await this.calculateTotalLessons(enrollments);
      const completedLessons = await this.calculateCompletedLessons(userId, videoProgress);

      // Calculate current streak
      const currentStreak = await this.calculateCurrentStreak(userId);

      // Calculate total XP (from completed lessons, streaks, achievements)
      const totalXP = await this.calculateTotalXP(userId, completedLessons, currentStreak);

      // Calculate current level based on XP
      const currentLevel = this.calculateLevel(totalXP);

      // Calculate average score
      const averageScore = await this.calculateAverageScore(userId, videoProgress);

      // Calculate total study hours
      const totalStudyHours = await this.calculateTotalStudyHours(userId, videoProgress);

      // Calculate skill progress from latest placement test
      const skillProgress = this.calculateSkillProgress(latestPlacement);

      // Calculate recent activity
      const recentActivity = await this.calculateRecentActivity(userId);

      return {
        totalLessons,
        completedLessons,
        currentStreak,
        totalXP,
        currentLevel,
        averageScore,
        totalStudyHours,
        skillProgress,
        recentActivity
      };

    } catch (error) {
      console.error(`Error calculating progress for user ${userId}:`, error);
      
      // Return sensible defaults based on user data only
      const user = await this.storage.getUser(userId);
      return {
        totalLessons: 0,
        completedLessons: user?.totalLessons || 0,
        currentStreak: user?.streakDays || 0,
        totalXP: user?.totalCredits || 0,
        currentLevel: 1,
        averageScore: 0,
        totalStudyHours: 0,
        skillProgress: {
          speaking: 0,
          listening: 0,
          reading: 0,
          writing: 0
        },
        recentActivity: {
          lastActive: null,
          lessonsThisWeek: 0,
          hoursThisWeek: 0
        }
      };
    }
  }

  /**
   * Calculate total lessons available to student based on enrollments
   */
  private async calculateTotalLessons(enrollments: any[]): Promise<number> {
    let totalLessons = 0;

    for (const enrollment of enrollments) {
      try {
        const course = await this.storage.getCourse(enrollment.courseId);
        if (course) {
          const lessons = await this.storage.getVideoLessonsByCourse(course.id);
          totalLessons += lessons?.length || 0;
        }
      } catch (error) {
        console.error(`Error getting course ${enrollment.courseId} lessons:`, error);
      }
    }

    return totalLessons;
  }

  /**
   * Calculate completed lessons from video progress
   */
  private async calculateCompletedLessons(userId: number, videoProgress: any[]): Promise<number> {
    // Count lessons that are completed (based on completed field or 100% watchTime)
    const completedLessons = videoProgress.filter(vp => 
      vp.completed || (vp.watchTime && vp.totalDuration && vp.watchTime >= vp.totalDuration * 0.9)
    ).length;
    return completedLessons;
  }

  /**
   * Calculate current study streak
   */
  private async calculateCurrentStreak(userId: number): Promise<number> {
    try {
      // Get user learning activities sorted by date descending
      const activities = await this.storage.getLearningActivities(userId);
      
      if (!activities || activities.length === 0) {
        return 0;
      }

      // Calculate streak from consecutive days with activity
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(today);
      
      // Check each day going backwards
      for (let i = 0; i < 365; i++) { // Maximum 365 day streak check
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const hasActivity = activities.some(activity => {
          const activityDate = new Date(activity.createdAt);
          return activityDate >= dayStart && activityDate <= dayEnd;
        });
        
        if (hasActivity) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error(`Error calculating streak for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate total XP from various sources
   */
  private async calculateTotalXP(userId: number, completedLessons: number, currentStreak: number): Promise<number> {
    let totalXP = 0;
    
    // XP from completed lessons (50 XP per lesson)
    totalXP += completedLessons * 50;
    
    // XP from streak bonus (10 XP per streak day)
    totalXP += currentStreak * 10;
    
    // XP from achievements
    try {
      const achievements = await this.storage.getUserAchievements(userId);
      totalXP += achievements.reduce((sum: number, achievement: any) => sum + (achievement.xpReward || 0), 0);
    } catch (error) {
      console.error(`Error getting achievements for user ${userId}:`, error);
    }
    
    return totalXP;
  }

  /**
   * Calculate level from total XP
   */
  private calculateLevel(totalXP: number): number {
    // Level calculation: Level = floor(XP / 200) + 1
    // Every 200 XP = 1 level, starting at level 1
    return Math.max(1, Math.floor(totalXP / 200) + 1);
  }

  /**
   * Calculate average score from video progress
   */
  private async calculateAverageScore(userId: number, videoProgress: any[]): Promise<number> {
    const completedWithScores = videoProgress.filter(vp => vp.progress >= 100 && vp.lastScore != null);
    
    if (completedWithScores.length === 0) {
      return 0;
    }
    
    const totalScore = completedWithScores.reduce((sum, vp) => sum + vp.lastScore, 0);
    return Math.round(totalScore / completedWithScores.length);
  }

  /**
   * Calculate total study hours from video progress and activities
   */
  private async calculateTotalStudyHours(userId: number, videoProgress: any[]): Promise<number> {
    let totalMinutes = 0;
    
    // Sum up time spent from video progress (use watchTime as timeSpent)
    totalMinutes += videoProgress.reduce((sum, vp) => sum + (vp.watchTime || 0), 0);
    
    // Add time from learning activities
    try {
      const activities = await this.storage.getLearningActivities(userId);
      totalMinutes += activities.reduce((sum: number, activity: any) => sum + (activity.duration || 0), 0);
    } catch (error) {
      console.error(`Error getting activities for user ${userId}:`, error);
    }
    
    return Math.round((totalMinutes / 60) * 10) / 10; // Convert to hours, round to 1 decimal
  }

  /**
   * Calculate skill progress from placement test results
   */
  private calculateSkillProgress(latestPlacement: any) {
    if (!latestPlacement) {
      return {
        speaking: 0,
        listening: 0,
        reading: 0,
        writing: 0
      };
    }

    // Convert CEFR levels to progress percentages
    const cefrToProgress = (level: string) => {
      switch (level) {
        case 'A1': return 20;
        case 'A2': return 35;
        case 'B1': return 50;
        case 'B2': return 70;
        case 'C1': return 85;
        case 'C2': return 100;
        default: return 0;
      }
    };

    return {
      speaking: cefrToProgress(latestPlacement.speakingLevel),
      listening: cefrToProgress(latestPlacement.listeningLevel),
      reading: cefrToProgress(latestPlacement.readingLevel),
      writing: cefrToProgress(latestPlacement.writingLevel)
    };
  }

  /**
   * Calculate recent activity metrics
   */
  private async calculateRecentActivity(userId: number) {
    try {
      const activities = await this.storage.getLearningActivities(userId);
      const videoProgress = await this.storage.getStudentVideoProgress(userId);
      
      if (!activities || activities.length === 0) {
        return {
          lastActive: null,
          lessonsThisWeek: 0,
          hoursThisWeek: 0
        };
      }

      // Get most recent activity
      const lastActive = new Date(Math.max(...activities.map(a => new Date(a.createdAt).getTime())));

      // Calculate this week's metrics
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of this week
      weekStart.setHours(0, 0, 0, 0);

      const thisWeekActivities = activities.filter(a => new Date(a.createdAt) >= weekStart);
      const thisWeekProgress = videoProgress.filter(vp => new Date(vp.updatedAt) >= weekStart);

      const lessonsThisWeek = thisWeekProgress.filter(vp => vp.completed).length;
      const hoursThisWeek = Math.round(
        (thisWeekProgress.reduce((sum, vp) => sum + (vp.watchTime || 0), 0) / 60) * 10
      ) / 10;

      return {
        lastActive,
        lessonsThisWeek,
        hoursThisWeek
      };
    } catch (error) {
      console.error(`Error calculating recent activity for user ${userId}:`, error);
      return {
        lastActive: null,
        lessonsThisWeek: 0,
        hoursThisWeek: 0
      };
    }
  }

  /**
   * Get progress summary for multiple students (for teacher/admin views)
   */
  async getMultipleStudentsProgress(userIds: number[]): Promise<Map<number, StudentProgressMetrics>> {
    const progressMap = new Map<number, StudentProgressMetrics>();
    
    // Process in parallel for better performance
    const promises = userIds.map(async (userId) => {
      try {
        const progress = await this.getStudentProgressMetrics(userId);
        progressMap.set(userId, progress);
      } catch (error) {
        console.error(`Error getting progress for student ${userId}:`, error);
        // Set minimal progress data for failed cases
        progressMap.set(userId, {
          totalLessons: 0,
          completedLessons: 0,
          currentStreak: 0,
          totalXP: 0,
          currentLevel: 1,
          averageScore: 0,
          totalStudyHours: 0,
          skillProgress: { speaking: 0, listening: 0, reading: 0, writing: 0 },
          recentActivity: { lastActive: null, lessonsThisWeek: 0, hoursThisWeek: 0 }
        });
      }
    });
    
    await Promise.all(promises);
    return progressMap;
  }
}