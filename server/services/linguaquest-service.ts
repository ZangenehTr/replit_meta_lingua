import { 
  linguaquestLessons, 
  guestProgressTracking, 
  voiceExercisesGuest, 
  freemiumConversionTracking,
  visitorAchievements,
  linguaquestLessonFeedback,
  type LinguaquestLesson,
  type LinguaquestLessonInsert,
  type GuestProgressTracking,
  type GuestProgressTrackingInsert,
  type VoiceExercisesGuest,
  type VoiceExercisesGuestInsert,
  type FreemiumConversionTrackingInsert,
  type VisitorAchievementInsert,
  type LinguaquestLessonFeedbackInsert,
  LINGUAQUEST_DIFFICULTY,
  LINGUAQUEST_LESSON_TYPE,
  LINGUAQUEST_SCENE_TYPE
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { MetaLinguaTTSService } from "../tts-service";
import crypto from "crypto";

export interface LessonProgress {
  lessonId: number;
  completedAt?: Date;
  score?: number;
  timeSpentMinutes: number;
  attempts: number;
}

export interface GuestSession {
  sessionToken: string;
  progress: GuestProgressTracking;
  achievements: VisitorAchievement[];
  completedLessons: LessonProgress[];
}

export interface LessonCompletionResult {
  xpEarned: number;
  newAchievements: VisitorAchievement[];
  levelUp: boolean;
  newLevel: number;
  shouldShowUpgradePrompt: boolean;
}

export class LinguaQuestService {
  private ttsService: MetaLinguaTTSService;

  constructor() {
    this.ttsService = new MetaLinguaTTSService();
  }

  // ====================================================================
  // GUEST SESSION MANAGEMENT
  // ====================================================================

  /**
   * Create or retrieve guest session with device fingerprinting
   */
  async createGuestSession(deviceInfo: any, fingerprintHash?: string): Promise<string> {
    try {
      // Generate unique session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Check if guest exists by fingerprint to continue progress
      let existingProgress = null;
      if (fingerprintHash) {
        existingProgress = await db
          .select()
          .from(guestProgressTracking)
          .where(eq(guestProgressTracking.fingerprintHash, fingerprintHash))
          .orderBy(desc(guestProgressTracking.lastActiveAt))
          .limit(1);
      }

      // Create new guest progress or update existing
      if (existingProgress && existingProgress.length > 0) {
        // Update existing session with new token
        await db
          .update(guestProgressTracking)
          .set({
            sessionToken,
            lastActiveAt: new Date(),
            deviceInfo,
            updatedAt: new Date()
          })
          .where(eq(guestProgressTracking.id, existingProgress[0].id));
      } else {
        // Create new guest progress
        await db.insert(guestProgressTracking).values({
          sessionToken,
          fingerprintHash,
          deviceInfo,
          currentStreak: 0,
          totalXp: 0,
          currentLevel: 1,
          totalStudyTimeMinutes: 0,
          preferredDifficulty: 'beginner'
        });
      }

      return sessionToken;
    } catch (error) {
      console.error('Error creating guest session:', error);
      throw new Error('Failed to create guest session');
    }
  }

  /**
   * Get guest session with full progress data
   */
  async getGuestSession(sessionToken: string): Promise<GuestSession | null> {
    try {
      const progress = await db
        .select()
        .from(guestProgressTracking)
        .where(eq(guestProgressTracking.sessionToken, sessionToken))
        .limit(1);

      if (!progress || progress.length === 0) {
        return null;
      }

      const achievements = await db
        .select()
        .from(visitorAchievements)
        .where(eq(visitorAchievements.sessionToken, sessionToken))
        .orderBy(desc(visitorAchievements.unlockedAt));

      // Get completed lessons from progress data
      const completedLessonIds = progress[0].completedLessons || [];
      const completedLessons: LessonProgress[] = completedLessonIds.map(id => ({
        lessonId: id,
        completedAt: new Date(),
        timeSpentMinutes: 10, // Estimated
        attempts: 1
      }));

      return {
        sessionToken,
        progress: progress[0],
        achievements,
        completedLessons
      };
    } catch (error) {
      console.error('Error getting guest session:', error);
      return null;
    }
  }

  /**
   * Update guest progress after lesson completion
   */
  async updateGuestProgress(
    sessionToken: string, 
    lessonId: number, 
    xpEarned: number, 
    timeSpentMinutes: number
  ): Promise<LessonCompletionResult> {
    try {
      const session = await this.getGuestSession(sessionToken);
      if (!session) {
        throw new Error('Guest session not found');
      }

      const currentProgress = session.progress;
      const completedLessons = currentProgress.completedLessons || [];
      
      // Avoid duplicate completion
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }

      const newXp = currentProgress.totalXp + xpEarned;
      const newStudyTime = currentProgress.totalStudyTimeMinutes + timeSpentMinutes;
      const newStreak = currentProgress.currentStreak + 1;
      
      // Calculate level (100 XP per level)
      const newLevel = Math.floor(newXp / 100) + 1;
      const levelUp = newLevel > currentProgress.currentLevel;

      // Update progress
      await db
        .update(guestProgressTracking)
        .set({
          completedLessons,
          totalXp: newXp,
          totalStudyTimeMinutes: newStudyTime,
          currentStreak: newStreak,
          currentLevel: newLevel,
          lastActiveAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(guestProgressTracking.sessionToken, sessionToken));

      // Check for new achievements
      const newAchievements = await this.checkAndUnlockAchievements(sessionToken, {
        completedLessons: completedLessons.length,
        currentStreak: newStreak,
        totalXp: newXp,
        currentLevel: newLevel
      });

      // Determine if should show upgrade prompt
      const shouldShowUpgradePrompt = this.shouldShowUpgradePrompt(
        completedLessons.length,
        currentProgress.upgradePromptCount,
        currentProgress.lastUpgradePromptAt
      );

      return {
        xpEarned,
        newAchievements,
        levelUp,
        newLevel,
        shouldShowUpgradePrompt
      };
    } catch (error) {
      console.error('Error updating guest progress:', error);
      throw new Error('Failed to update guest progress');
    }
  }

  // ====================================================================
  // LESSON MANAGEMENT
  // ====================================================================

  /**
   * Get all active LinguaQuest lessons filtered by language and difficulty
   */
  async getLessons(
    language?: string, 
    difficulty?: string, 
    lessonType?: string,
    limit?: number
  ): Promise<LinguaquestLesson[]> {
    try {
      let query = db
        .select()
        .from(linguaquestLessons)
        .where(eq(linguaquestLessons.isActive, true));

      // Apply filters
      const conditions = [eq(linguaquestLessons.isActive, true)];
      
      if (language) {
        conditions.push(eq(linguaquestLessons.language, language));
      }
      
      if (difficulty) {
        conditions.push(eq(linguaquestLessons.difficulty, difficulty));
      }
      
      if (lessonType) {
        conditions.push(eq(linguaquestLessons.lessonType, lessonType));
      }

      const lessons = await db
        .select()
        .from(linguaquestLessons)
        .where(and(...conditions))
        .orderBy(asc(linguaquestLessons.id))
        .limit(limit || 50);

      return lessons;
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw new Error('Failed to get lessons');
    }
  }

  /**
   * Get lesson by ID with 3D content
   */
  async getLessonById(lessonId: number): Promise<LinguaquestLesson & { threeDContent?: any } | null> {
    try {
      const lesson = await db
        .select()
        .from(linguaquestLessons)
        .where(and(
          eq(linguaquestLessons.id, lessonId),
          eq(linguaquestLessons.isActive, true)
        ))
        .limit(1);

      if (!lesson || lesson.length === 0) {
        return null;
      }

      // sceneData and interactionConfig are already in the lesson
      // No need for separate threeDLessonContent table
      return {
        ...lesson[0],
        threeDContent: lesson[0].sceneData || null
      };
    } catch (error) {
      console.error('Error getting lesson by ID:', error);
      return null;
    }
  }

  /**
   * Get personalized lesson recommendations for guest
   */
  async getRecommendedLessons(sessionToken: string): Promise<LinguaquestLesson[]> {
    try {
      const session = await this.getGuestSession(sessionToken);
      if (!session) {
        // Return beginner lessons for new users
        return this.getLessons(undefined, 'beginner', undefined, 10);
      }

      const progress = session.progress;
      const completedLessonIds = progress.completedLessons || [];
      
      // Get lessons not yet completed, matching difficulty
      let query = db
        .select()
        .from(linguaquestLessons)
        .where(and(
          eq(linguaquestLessons.isActive, true),
          eq(linguaquestLessons.difficulty, progress.preferredDifficulty)
        ));

      if (completedLessonIds.length > 0) {
        query = query.where(sql`${linguaquestLessons.id} NOT IN (${completedLessonIds.join(',')})`);
      }

      const lessons = await query
        .orderBy(asc(linguaquestLessons.id))
        .limit(10);

      return lessons;
    } catch (error) {
      console.error('Error getting recommended lessons:', error);
      return this.getLessons(undefined, 'beginner', undefined, 10);
    }
  }

  // ====================================================================
  // VOICE EXERCISES
  // ====================================================================

  /**
   * Create voice exercise for guest user
   */
  async createVoiceExercise(
    sessionToken: string,
    lessonId: number,
    exerciseType: string,
    promptText: string,
    targetLanguage: string,
    difficultyLevel: string
  ): Promise<VoiceExercisesGuest> {
    try {
      // Generate reference TTS audio
      const ttsResponse = await this.ttsService.generatePronunciationAudio(
        promptText,
        targetLanguage,
        difficultyLevel === 'beginner' ? 'slow' : 'normal'
      );

      const voiceExercise = await db.insert(voiceExercisesGuest).values({
        sessionToken,
        lessonId,
        exerciseType,
        promptText,
        targetLanguage,
        difficultyLevel,
        referenceTtsUrl: ttsResponse.success ? ttsResponse.audioUrl : null,
        maxAttempts: 3
      }).returning();

      return voiceExercise[0];
    } catch (error) {
      console.error('Error creating voice exercise:', error);
      throw new Error('Failed to create voice exercise');
    }
  }

  /**
   * Submit voice recording for analysis
   */
  async submitVoiceRecording(
    exerciseId: number,
    audioRecordingUrl: string,
    attemptNumber: number
  ): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    try {
      // Simulated pronunciation analysis (would integrate with actual STT/speech analysis)
      const score = Math.floor(Math.random() * 40) + 60; // 60-100 range
      const feedback = score > 80 
        ? "Excellent pronunciation! Your accent and timing are very good."
        : score > 70
        ? "Good pronunciation! Work on clarity of certain consonants."
        : "Keep practicing! Focus on word stress and vowel sounds.";
      
      const suggestions = score < 80 
        ? ["Practice vowel sounds", "Slow down speech rate", "Focus on word stress"]
        : ["Maintain your excellent progress", "Try advanced exercises"];

      // Update exercise with results
      await db
        .update(voiceExercisesGuest)
        .set({
          audioRecordingUrl,
          pronunciationScore: score,
          feedback,
          suggestedImprovements: suggestions,
          attemptNumber,
          completedAt: new Date()
        })
        .where(eq(voiceExercisesGuest.id, exerciseId));

      return { score, feedback, suggestions };
    } catch (error) {
      console.error('Error submitting voice recording:', error);
      throw new Error('Failed to analyze voice recording');
    }
  }

  // ====================================================================
  // ACHIEVEMENTS & GAMIFICATION
  // ====================================================================

  /**
   * Check and unlock new achievements
   */
  async checkAndUnlockAchievements(
    sessionToken: string,
    stats: { completedLessons: number; currentStreak: number; totalXp: number; currentLevel: number }
  ): Promise<VisitorAchievement[]> {
    try {
      const newAchievements: VisitorAchievementInsert[] = [];

      // First Lesson Achievement
      if (stats.completedLessons === 1) {
        newAchievements.push({
          sessionToken,
          achievementType: 'first_lesson',
          achievementTitle: 'First Steps!',
          achievementDescription: 'Complete your first LinguaQuest lesson',
          iconUrl: '/icons/first-lesson.svg',
          targetValue: 1,
          xpReward: 50,
          category: 'learning',
          motivationalMessage: 'Great start! Keep going to unlock more features.',
          nextAchievement: 'Complete 5 lessons to unlock Vocabulary Master badge'
        });
      }

      // Streak Achievements
      if (stats.currentStreak === 3) {
        newAchievements.push({
          sessionToken,
          achievementType: 'streak_3',
          achievementTitle: 'On Fire!',
          achievementDescription: 'Complete 3 lessons in a row',
          iconUrl: '/icons/streak.svg',
          targetValue: 3,
          xpReward: 100,
          category: 'engagement',
          motivationalMessage: 'You\'re building a great learning habit!'
        });
      }

      // Level Up Achievements
      if (stats.currentLevel === 5) {
        newAchievements.push({
          sessionToken,
          achievementType: 'level_5',
          achievementTitle: 'Rising Star',
          achievementDescription: 'Reach Level 5',
          iconUrl: '/icons/level-up.svg',
          targetValue: 5,
          xpReward: 200,
          category: 'mastery',
          difficulty: 'medium',
          motivationalMessage: 'You\'re making excellent progress! Consider upgrading to Meta Lingua for advanced features.'
        });
      }

      // Insert new achievements
      if (newAchievements.length > 0) {
        const inserted = await db.insert(visitorAchievements).values(
          newAchievements.map(achievement => ({
            ...achievement,
            progress: achievement.targetValue,
            isUnlocked: true,
            unlockedAt: new Date()
          }))
        ).returning();

        return inserted;
      }

      return [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // ====================================================================
  // CONVERSION TRACKING
  // ====================================================================

  /**
   * Track freemium conversion event
   */
  async trackConversionEvent(
    sessionToken: string,
    funnelStage: string,
    conversionEvent: string,
    eventData?: any
  ): Promise<void> {
    try {
      const session = await this.getGuestSession(sessionToken);
      if (!session) return;

      await db.insert(freemiumConversionTracking).values({
        sessionToken,
        funnelStage,
        conversionEvent,
        eventData,
        lessonsCompletedBeforePrompt: session.completedLessons.length,
        totalSessionTimeMinutes: session.progress.totalStudyTimeMinutes,
        deviceType: this.getDeviceType(session.progress.deviceInfo),
        trafficSource: 'organic' // Could be enhanced with UTM tracking
      });
    } catch (error) {
      console.error('Error tracking conversion event:', error);
    }
  }

  /**
   * Determine if should show upgrade prompt
   */
  private shouldShowUpgradePrompt(
    completedLessons: number,
    promptCount: number,
    lastPromptAt: Date | null
  ): boolean {
    // Show prompt after 3, 7, 15 lessons
    const promptTriggers = [3, 7, 15];
    
    if (!promptTriggers.includes(completedLessons)) {
      return false;
    }

    // Don't show if already shown recently (within 24 hours)
    if (lastPromptAt) {
      const hoursSinceLastPrompt = (Date.now() - lastPromptAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastPrompt < 24) {
        return false;
      }
    }

    // Don't show more than 5 times total
    return promptCount < 5;
  }

  /**
   * Record upgrade prompt shown
   */
  async recordUpgradePromptShown(sessionToken: string, promptType: string, promptPosition: string): Promise<void> {
    try {
      await db
        .update(guestProgressTracking)
        .set({
          hasSeenUpgradePrompt: true,
          upgradePromptCount: sql`${guestProgressTracking.upgradePromptCount} + 1`,
          lastUpgradePromptAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(guestProgressTracking.sessionToken, sessionToken));

      // Track conversion event
      await this.trackConversionEvent(sessionToken, 'consideration', 'upgrade_viewed', {
        promptType,
        promptPosition
      });
    } catch (error) {
      console.error('Error recording upgrade prompt:', error);
    }
  }

  // ====================================================================
  // HELPER METHODS
  // ====================================================================

  private getDeviceType(deviceInfo: any): string {
    if (!deviceInfo) return 'unknown';
    
    const userAgent = deviceInfo.userAgent || '';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get lesson statistics for admin dashboard
   */
  async getLessonStatistics(): Promise<{
    totalLessons: number;
    totalCompletions: number;
    averageCompletion: number;
    popularLessons: any[];
  }> {
    try {
      const totalLessons = await db
        .select({ count: sql<number>`count(*)` })
        .from(linguaquestLessons)
        .where(eq(linguaquestLessons.isActive, true));

      const guestSessions = await db.select().from(guestProgressTracking);
      
      const totalCompletions = guestSessions.reduce((sum, session) => 
        sum + (session.completedLessons?.length || 0), 0
      );

      return {
        totalLessons: totalLessons[0].count,
        totalCompletions,
        averageCompletion: totalCompletions / Math.max(guestSessions.length, 1),
        popularLessons: [] // Could be enhanced with popularity tracking
      };
    } catch (error) {
      console.error('Error getting lesson statistics:', error);
      return {
        totalLessons: 0,
        totalCompletions: 0,
        averageCompletion: 0,
        popularLessons: []
      };
    }
  }

  // ====================================================================
  // LEADERBOARD SYSTEM
  // ====================================================================

  /**
   * Get global leaderboard (all users across all levels)
   */
  async getGlobalLeaderboard(limit: number = 50): Promise<any[]> {
    try {
      const leaderboard = await db
        .select({
          sessionToken: guestProgressTracking.sessionToken,
          totalXp: guestProgressTracking.totalXp,
          currentLevel: guestProgressTracking.currentLevel,
          currentStreak: guestProgressTracking.currentStreak,
          completedLessons: guestProgressTracking.completedLessons,
          lastActiveAt: guestProgressTracking.lastActiveAt
        })
        .from(guestProgressTracking)
        .orderBy(desc(guestProgressTracking.totalXp), desc(guestProgressTracking.currentStreak))
        .limit(limit);

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        sessionToken: entry.sessionToken,
        totalXp: entry.totalXp || 0,
        level: entry.currentLevel || 1,
        streak: entry.currentStreak || 0,
        lessonsCompleted: (entry.completedLessons as number[])?.length || 0,
        lastActive: entry.lastActiveAt
      }));
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      return [];
    }
  }

  /**
   * Get level-specific leaderboard (filtered by CEFR level)
   */
  async getLevelLeaderboard(level: string, limit: number = 50): Promise<any[]> {
    try {
      // Map CEFR level to difficulty (A1/A2 -> beginner, B1/B2 -> intermediate, C1/C2 -> advanced)
      const difficultyMap: Record<string, string> = {
        'A1': 'beginner',
        'A2': 'beginner', 
        'B1': 'intermediate',
        'B2': 'intermediate',
        'C1': 'advanced',
        'C2': 'advanced'
      };

      const difficulty = difficultyMap[level] || 'beginner';

      const leaderboard = await db
        .select({
          sessionToken: guestProgressTracking.sessionToken,
          totalXp: guestProgressTracking.totalXp,
          currentLevel: guestProgressTracking.currentLevel,
          currentStreak: guestProgressTracking.currentStreak,
          completedLessons: guestProgressTracking.completedLessons,
          preferredDifficulty: guestProgressTracking.preferredDifficulty
        })
        .from(guestProgressTracking)
        .where(eq(guestProgressTracking.preferredDifficulty, difficulty))
        .orderBy(desc(guestProgressTracking.totalXp), desc(guestProgressTracking.currentStreak))
        .limit(limit);

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        sessionToken: entry.sessionToken,
        totalXp: entry.totalXp || 0,
        level: entry.currentLevel || 1,
        streak: entry.currentStreak || 0,
        lessonsCompleted: (entry.completedLessons as number[])?.length || 0,
        difficulty: entry.preferredDifficulty
      }));
    } catch (error) {
      console.error('Error getting level leaderboard:', error);
      return [];
    }
  }

  /**
   * Get nearby leaderboard (users around your rank - competitive comparison)
   */
  async getNearbyLeaderboard(sessionToken: string, range: number = 5): Promise<any[]> {
    try {
      // First get user's rank
      const rankData = await this.getUserRank(sessionToken);
      if (!rankData || rankData.rank === 0) {
        return [];
      }

      const userRank = rankData.rank;
      const startRank = Math.max(1, userRank - range);
      const endRank = userRank + range;

      // Get all users sorted by XP
      const allUsers = await db
        .select({
          sessionToken: guestProgressTracking.sessionToken,
          totalXp: guestProgressTracking.totalXp,
          currentLevel: guestProgressTracking.currentLevel,
          currentStreak: guestProgressTracking.currentStreak,
          completedLessons: guestProgressTracking.completedLessons
        })
        .from(guestProgressTracking)
        .orderBy(desc(guestProgressTracking.totalXp), desc(guestProgressTracking.currentStreak));

      // Slice to get nearby users
      const nearbyUsers = allUsers.slice(startRank - 1, endRank);

      return nearbyUsers.map((entry, index) => ({
        rank: startRank + index,
        sessionToken: entry.sessionToken,
        totalXp: entry.totalXp || 0,
        level: entry.currentLevel || 1,
        streak: entry.currentStreak || 0,
        lessonsCompleted: (entry.completedLessons as number[])?.length || 0,
        isCurrentUser: entry.sessionToken === sessionToken
      }));
    } catch (error) {
      console.error('Error getting nearby leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user's rank on the global leaderboard
   */
  async getUserRank(sessionToken: string): Promise<any> {
    try {
      const userProgress = await db
        .select()
        .from(guestProgressTracking)
        .where(eq(guestProgressTracking.sessionToken, sessionToken))
        .limit(1);

      if (!userProgress || userProgress.length === 0) {
        return {
          rank: 0,
          totalUsers: 0,
          percentile: 0,
          message: 'User not found'
        };
      }

      const user = userProgress[0];

      // Count users with higher XP
      const higherRanked = await db
        .select({ count: sql<number>`count(*)` })
        .from(guestProgressTracking)
        .where(sql`${guestProgressTracking.totalXp} > ${user.totalXp || 0}`);

      const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(guestProgressTracking);

      const rank = higherRanked[0].count + 1;
      const total = totalUsers[0].count;
      const percentile = total > 0 ? Math.round((1 - (rank / total)) * 100) : 0;

      return {
        rank,
        totalUsers: total,
        percentile,
        userXp: user.totalXp || 0,
        userLevel: user.currentLevel || 1,
        userStreak: user.currentStreak || 0
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return {
        rank: 0,
        totalUsers: 0,
        percentile: 0,
        error: 'Failed to get user rank'
      };
    }
  }

  // ====================================================================
  // LESSON FEEDBACK & RATINGS
  // ====================================================================

  /**
   * Submit feedback/rating for a lesson
   */
  async submitLessonFeedback(feedbackData: LinguaquestLessonFeedbackInsert) {
    try {
      // Validate required fields
      if (!feedbackData.lessonId) {
        throw new Error('Lesson ID is required');
      }
      if (!feedbackData.starRating || feedbackData.starRating < 1 || feedbackData.starRating > 5) {
        throw new Error('Star rating must be between 1 and 5');
      }
      if (!feedbackData.guestSessionToken && !feedbackData.userId) {
        throw new Error('Either guest session token or user ID is required');
      }

      const [feedback] = await db
        .insert(linguaquestLessonFeedback)
        .values({
          ...feedbackData,
          updatedAt: new Date()
        })
        .returning();

      return feedback;
    } catch (error) {
      console.error('Error submitting lesson feedback:', error);
      throw new Error('Failed to submit lesson feedback');
    }
  }

  /**
   * Get all feedback for a specific lesson
   */
  async getLessonFeedback(lessonId: number) {
    try {
      const feedback = await db
        .select()
        .from(linguaquestLessonFeedback)
        .where(eq(linguaquestLessonFeedback.lessonId, lessonId))
        .orderBy(desc(linguaquestLessonFeedback.createdAt));

      return feedback;
    } catch (error) {
      console.error('Error getting lesson feedback:', error);
      return [];
    }
  }

  /**
   * Get lesson statistics including average rating, feedback count, and difficulty distribution
   */
  async getLessonStats(lessonId: number) {
    try {
      const feedback = await this.getLessonFeedback(lessonId);

      if (feedback.length === 0) {
        return {
          lessonId,
          feedbackCount: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          difficultyDistribution: { too_easy: 0, just_right: 0, too_hard: 0 },
          helpfulPercentage: 0,
          averageCompletionTime: 0,
          averageScore: 0
        };
      }

      // Calculate average rating
      const totalRating = feedback.reduce((sum, f) => sum + (f.starRating || 0), 0);
      const averageRating = totalRating / feedback.length;

      // Calculate rating distribution
      const ratingDistribution = feedback.reduce((dist, f) => {
        const rating = f.starRating || 0;
        dist[rating] = (dist[rating] || 0) + 1;
        return dist;
      }, {} as Record<number, number>);

      // Calculate difficulty distribution
      const difficultyDistribution = feedback.reduce((dist, f) => {
        const difficulty = f.difficultyRating || 'just_right';
        dist[difficulty] = (dist[difficulty] || 0) + 1;
        return dist;
      }, {} as Record<string, number>);

      // Calculate helpful percentage
      const helpfulCount = feedback.filter(f => f.wasHelpful === true).length;
      const helpfulPercentage = (helpfulCount / feedback.length) * 100;

      // Calculate average completion time
      const completionTimes = feedback.filter(f => f.completionTimeSeconds).map(f => f.completionTimeSeconds as number);
      const averageCompletionTime = completionTimes.length > 0 
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
        : 0;

      // Calculate average score
      const scores = feedback.filter(f => f.scorePercentage).map(f => f.scorePercentage as number);
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      return {
        lessonId,
        feedbackCount: feedback.length,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution,
        difficultyDistribution,
        helpfulPercentage: Math.round(helpfulPercentage),
        averageCompletionTime: Math.round(averageCompletionTime),
        averageScore: Math.round(averageScore)
      };
    } catch (error) {
      console.error('Error getting lesson stats:', error);
      throw new Error('Failed to get lesson stats');
    }
  }
}

export const linguaQuestService = new LinguaQuestService();