import type { Express } from "express";
import { z } from "zod";
import { linguaQuestService } from "../services/linguaquest-service";
import { 
  insertLinguaquestLessonSchema,
  insertGuestProgressTrackingSchema,
  insertVoiceExercisesGuestSchema,
  insertFreemiumConversionTrackingSchema,
  insertVisitorAchievementSchema
} from "@shared/schema";

/**
 * LinguaQuest Free Learning Platform API Routes
 * Handles guest sessions, 3D lessons, voice exercises, and conversion tracking
 */
export function registerLinguaQuestRoutes(app: Express) {
  console.log('✅ Registering LinguaQuest Free Learning Platform routes...');

  // ====================================================================
  // GUEST SESSION MANAGEMENT
  // ====================================================================

  /**
   * Create new guest session with device fingerprinting
   * POST /api/linguaquest/session
   */
  app.post('/api/linguaquest/session', async (req, res) => {
    try {
      const { deviceInfo, fingerprintHash } = req.body;
      
      // Use default device info if not provided
      const defaultDeviceInfo = {
        userAgent: req.headers['user-agent'] || 'unknown',
        platform: 'web',
        language: req.headers['accept-language']?.split(',')[0] || 'en',
        timestamp: new Date().toISOString()
      };

      const sessionToken = await linguaQuestService.createGuestSession(
        deviceInfo || defaultDeviceInfo, 
        fingerprintHash
      );
      
      res.json({ 
        success: true, 
        sessionToken,
        message: 'Guest session created successfully'
      });
    } catch (error) {
      console.error('Error creating guest session:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create guest session' 
      });
    }
  });

  /**
   * Get guest session data with progress
   * GET /api/linguaquest/session/:sessionToken
   */
  app.get('/api/linguaquest/session/:sessionToken', async (req, res) => {
    try {
      const { sessionToken } = req.params;
      
      const session = await linguaQuestService.getGuestSession(sessionToken);
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Guest session not found' 
        });
      }

      res.json({ 
        success: true, 
        session 
      });
    } catch (error) {
      console.error('Error getting guest session:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get guest session' 
      });
    }
  });

  // ====================================================================
  // LESSON MANAGEMENT
  // ====================================================================

  /**
   * Get all LinguaQuest lessons with filters
   * GET /api/linguaquest/lessons
   */
  app.get('/api/linguaquest/lessons', async (req, res) => {
    try {
      const { language, difficulty, lessonType, limit } = req.query;
      
      const lessons = await linguaQuestService.getLessons(
        language as string,
        difficulty as string,
        lessonType as string,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json({ 
        success: true, 
        lessons,
        count: lessons.length
      });
    } catch (error) {
      console.error('Error getting lessons:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get lessons' 
      });
    }
  });

  /**
   * Get specific lesson by ID with 3D content
   * GET /api/linguaquest/lessons/:lessonId
   */
  app.get('/api/linguaquest/lessons/:lessonId', async (req, res) => {
    try {
      const { lessonId } = req.params;
      
      const lesson = await linguaQuestService.getLessonById(parseInt(lessonId));
      
      if (!lesson) {
        return res.status(404).json({ 
          success: false, 
          error: 'Lesson not found' 
        });
      }

      res.json({ 
        success: true, 
        lesson 
      });
    } catch (error) {
      console.error('Error getting lesson:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get lesson' 
      });
    }
  });

  /**
   * Get personalized lesson recommendations for guest
   * GET /api/linguaquest/recommendations/:sessionToken
   */
  app.get('/api/linguaquest/recommendations/:sessionToken', async (req, res) => {
    try {
      const { sessionToken } = req.params;
      
      const lessons = await linguaQuestService.getRecommendedLessons(sessionToken);
      
      res.json({ 
        success: true, 
        lessons,
        message: 'Personalized recommendations based on your progress'
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get recommendations' 
      });
    }
  });

  /**
   * Complete a lesson and update guest progress
   * POST /api/linguaquest/lessons/:lessonId/complete
   */
  app.post('/api/linguaquest/lessons/:lessonId/complete', async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { sessionToken, timeSpentMinutes = 10, xpEarned = 50 } = req.body;
      
      if (!sessionToken) {
        return res.status(400).json({ 
          success: false, 
          error: 'Session token required' 
        });
      }

      const result = await linguaQuestService.updateGuestProgress(
        sessionToken,
        parseInt(lessonId),
        xpEarned,
        timeSpentMinutes
      );
      
      // Track completion event
      await linguaQuestService.trackConversionEvent(
        sessionToken,
        'engagement', 
        'lesson_completed',
        { lessonId: parseInt(lessonId), xpEarned, timeSpentMinutes }
      );

      res.json({ 
        success: true, 
        result,
        message: result.levelUp ? 'Congratulations! You leveled up!' : 'Lesson completed successfully!'
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to complete lesson' 
      });
    }
  });

  // ====================================================================
  // VOICE EXERCISES
  // ====================================================================

  /**
   * Create voice exercise for guest
   * POST /api/linguaquest/voice-exercises
   */
  app.post('/api/linguaquest/voice-exercises', async (req, res) => {
    try {
      const { 
        sessionToken, 
        lessonId, 
        exerciseType, 
        promptText, 
        targetLanguage, 
        difficultyLevel 
      } = req.body;
      
      if (!sessionToken || !promptText || !targetLanguage) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields for voice exercise' 
        });
      }

      const exercise = await linguaQuestService.createVoiceExercise(
        sessionToken,
        lessonId,
        exerciseType,
        promptText,
        targetLanguage,
        difficultyLevel
      );
      
      res.json({ 
        success: true, 
        exercise,
        message: 'Voice exercise created successfully'
      });
    } catch (error) {
      console.error('Error creating voice exercise:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create voice exercise' 
      });
    }
  });

  /**
   * Submit voice recording for analysis
   * POST /api/linguaquest/voice-exercises/:exerciseId/submit
   */
  app.post('/api/linguaquest/voice-exercises/:exerciseId/submit', async (req, res) => {
    try {
      const { exerciseId } = req.params;
      const { audioRecordingUrl, attemptNumber = 1 } = req.body;
      
      if (!audioRecordingUrl) {
        return res.status(400).json({ 
          success: false, 
          error: 'Audio recording URL required' 
        });
      }

      const result = await linguaQuestService.submitVoiceRecording(
        parseInt(exerciseId),
        audioRecordingUrl,
        attemptNumber
      );
      
      res.json({ 
        success: true, 
        result,
        message: 'Voice recording analyzed successfully'
      });
    } catch (error) {
      console.error('Error submitting voice recording:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to analyze voice recording' 
      });
    }
  });

  // ====================================================================
  // ACHIEVEMENTS & GAMIFICATION
  // ====================================================================

  /**
   * Get guest achievements
   * GET /api/linguaquest/achievements/:sessionToken
   */
  app.get('/api/linguaquest/achievements/:sessionToken', async (req, res) => {
    try {
      const { sessionToken } = req.params;
      
      const session = await linguaQuestService.getGuestSession(sessionToken);
      
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Guest session not found' 
        });
      }

      res.json({ 
        success: true, 
        achievements: session.achievements,
        totalAchievements: session.achievements.length,
        unlockedCount: session.achievements.filter(a => a.isUnlocked).length
      });
    } catch (error) {
      console.error('Error getting achievements:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get achievements' 
      });
    }
  });

  // ====================================================================
  // CONVERSION TRACKING & ANALYTICS
  // ====================================================================

  /**
   * Track conversion event
   * POST /api/linguaquest/track-event
   */
  app.post('/api/linguaquest/track-event', async (req, res) => {
    try {
      const { sessionToken, funnelStage, conversionEvent, eventData } = req.body;
      
      if (!sessionToken || !funnelStage || !conversionEvent) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required tracking parameters' 
        });
      }

      await linguaQuestService.trackConversionEvent(
        sessionToken,
        funnelStage,
        conversionEvent,
        eventData
      );
      
      res.json({ 
        success: true, 
        message: 'Event tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking conversion event:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to track event' 
      });
    }
  });

  /**
   * Record upgrade prompt shown to guest
   * POST /api/linguaquest/upgrade-prompt
   */
  app.post('/api/linguaquest/upgrade-prompt', async (req, res) => {
    try {
      const { sessionToken, promptType, promptPosition } = req.body;
      
      if (!sessionToken || !promptType || !promptPosition) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required prompt parameters' 
        });
      }

      await linguaQuestService.recordUpgradePromptShown(
        sessionToken,
        promptType,
        promptPosition
      );
      
      res.json({ 
        success: true, 
        message: 'Upgrade prompt recorded successfully'
      });
    } catch (error) {
      console.error('Error recording upgrade prompt:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to record upgrade prompt' 
      });
    }
  });

  /**
   * Get LinguaQuest analytics for admin dashboard
   * GET /api/linguaquest/analytics
   */
  app.get('/api/linguaquest/analytics', async (req, res) => {
    try {
      const stats = await linguaQuestService.getLessonStatistics();
      
      res.json({ 
        success: true, 
        analytics: stats,
        message: 'LinguaQuest analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting LinguaQuest analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get analytics' 
      });
    }
  });

  // ====================================================================
  // LESSON CONTENT MANAGEMENT (For Admins)
  // ====================================================================

  /**
   * Create new LinguaQuest lesson (Admin only)
   * POST /api/linguaquest/admin/lessons
   */
  app.post('/api/linguaquest/admin/lessons', async (req, res) => {
    try {
      // Validate lesson data
      const lessonData = insertLinguaquestLessonSchema.parse(req.body);
      
      // For now, return success message - actual implementation would create lesson
      res.json({ 
        success: true, 
        message: 'Lesson creation endpoint ready - admin implementation pending',
        lessonData
      });
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create lesson' 
      });
    }
  });

  // ====================================================================
  // LEADERBOARD SYSTEM
  // ====================================================================

  /**
   * Get global leaderboard (all users, all levels)
   * GET /api/linguaquest/leaderboard/global
   */
  app.get('/api/linguaquest/leaderboard/global', async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      
      const leaderboard = await linguaQuestService.getGlobalLeaderboard(parseInt(limit as string));
      
      res.json({ 
        success: true, 
        leaderboard,
        message: 'Global leaderboard retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get global leaderboard' 
      });
    }
  });

  /**
   * Get level-specific leaderboard (filtered by CEFR level)
   * GET /api/linguaquest/leaderboard/level/:level
   */
  app.get('/api/linguaquest/leaderboard/level/:level', async (req, res) => {
    try {
      const { level } = req.params;
      const { limit = '50' } = req.query;
      
      const leaderboard = await linguaQuestService.getLevelLeaderboard(
        level.toUpperCase(),
        parseInt(limit as string)
      );
      
      res.json({ 
        success: true, 
        leaderboard,
        level: level.toUpperCase(),
        message: `${level.toUpperCase()} leaderboard retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting level leaderboard:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get level leaderboard' 
      });
    }
  });

  /**
   * Get nearby leaderboard (users around your rank - "friends" equivalent for guest system)
   * GET /api/linguaquest/leaderboard/nearby/:sessionToken
   */
  app.get('/api/linguaquest/leaderboard/nearby/:sessionToken', async (req, res) => {
    try {
      const { sessionToken } = req.params;
      const { range = '5' } = req.query; // Show +/- N ranks around user
      
      const nearby = await linguaQuestService.getNearbyLeaderboard(sessionToken, parseInt(range as string));
      
      res.json({ 
        success: true, 
        leaderboard: nearby,
        message: 'Nearby leaderboard retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting nearby leaderboard:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get nearby leaderboard' 
      });
    }
  });

  /**
   * Get user rank and position on leaderboard
   * GET /api/linguaquest/leaderboard/rank/:sessionToken
   */
  app.get('/api/linguaquest/leaderboard/rank/:sessionToken', async (req, res) => {
    try {
      const { sessionToken } = req.params;
      
      const rank = await linguaQuestService.getUserRank(sessionToken);
      
      res.json({ 
        success: true, 
        rank,
        message: 'User rank retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting user rank:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get user rank' 
      });
    }
  });

  /**
   * Health check endpoint for LinguaQuest service
   * GET /api/linguaquest/health
   */
  app.get('/api/linguaquest/health', (req, res) => {
    res.json({ 
      success: true, 
      service: 'LinguaQuest Free Learning Platform',
      version: '1.0.0',
      status: 'healthy',
      features: [
        'Guest Sessions',
        '3D Interactive Lessons', 
        'Voice Exercises',
        'Achievement System',
        'Conversion Tracking',
        'Analytics',
        'Leaderboards'
      ]
    });
  });

  console.log('✅ LinguaQuest Free Learning Platform routes registered successfully');
}