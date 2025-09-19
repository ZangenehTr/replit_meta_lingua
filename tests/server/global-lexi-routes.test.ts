import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { registerGlobalLexiRoutes } from '../../server/routes/global-lexi-routes';
import { ActivityTracker } from '../../server/activity-tracker';

// Mock the ActivityTracker
vi.mock('../../server/activity-tracker', () => ({
  ActivityTracker: vi.fn().mockImplementation(() => ({
    recordActivity: vi.fn(),
    generateLearningAnalytics: vi.fn(),
    getWeeklyStudyTime: vi.fn(),
    getWeeklyProgress: vi.fn()
  }))
}));

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn()
  }
}));

describe('Global Lexi API Routes - Activity Tracking & Insights', () => {
  let app: express.Express;
  let mockStorage: any;
  let mockActivityTracker: any;

  const validToken = 'valid-jwt-token';
  const mockUser = {
    id: 123,
    email: 'student@test.com',
    role: 'Student',
    firstName: 'Test Student'
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockStorage = {
      getUser: vi.fn().mockResolvedValue(mockUser)
    };

    // Mock JWT verification
    (jwt.verify as any).mockReturnValue({
      userId: mockUser.id,
      email: mockUser.email,
      role: mockUser.role
    });

    // Set up JWT secret
    process.env.JWT_SECRET = 'test-secret';

    // Create router and register routes
    const router = express.Router();
    registerGlobalLexiRoutes(router, mockStorage);
    app.use(router);

    // Get the mocked ActivityTracker instance
    mockActivityTracker = new ActivityTracker();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('POST /api/lexi/track-activity', () => {
    it('should track learner activity successfully', async () => {
      const activityData = {
        module: 'homework',
        activityType: 'assignment_start',
        courseId: 1,
        lessonId: 5,
        metadata: {
          assignmentId: 'hw-unit-3',
          difficulty: 'intermediate'
        }
      };

      mockActivityTracker.recordActivity.mockResolvedValue({ id: 1, ...activityData });

      const response = await request(app)
        .post('/api/lexi/track-activity')
        .set('Authorization', `Bearer ${validToken}`)
        .send(activityData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        tracked: true
      });

      expect(mockActivityTracker.recordActivity).toHaveBeenCalledWith(
        mockUser.id,
        'lexi_homework_assignment_start',
        1,
        1,
        {
          module: 'homework',
          lessonId: 5,
          assignmentId: 'hw-unit-3',
          difficulty: 'intermediate'
        }
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/lexi/track-activity')
        .send({
          module: 'homework',
          activityType: 'assignment_start'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Access token required');
    });

    it('should validate activity context schema', async () => {
      const invalidData = {
        module: 'invalid-module',
        activityType: 'test'
      };

      const response = await request(app)
        .post('/api/lexi/track-activity')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to track activity');
    });

    it('should track flashcard activities', async () => {
      const flashcardActivity = {
        module: 'flashcards',
        activityType: 'card_study',
        metadata: {
          cardId: 'vocab-advanced-1',
          correct: true,
          timeSpent: 15
        }
      };

      mockActivityTracker.recordActivity.mockResolvedValue({ id: 2 });

      const response = await request(app)
        .post('/api/lexi/track-activity')
        .set('Authorization', `Bearer ${validToken}`)
        .send(flashcardActivity);

      expect(response.status).toBe(200);
      expect(mockActivityTracker.recordActivity).toHaveBeenCalledWith(
        mockUser.id,
        'lexi_flashcards_card_study',
        null,
        1,
        {
          module: 'flashcards',
          cardId: 'vocab-advanced-1',
          correct: true,
          timeSpent: 15
        }
      );
    });

    it('should track CallerN video session activities', async () => {
      const callerNActivity = {
        module: 'callern',
        activityType: 'video_session_start',
        courseId: 2,
        metadata: {
          sessionId: 'call-session-456',
          tutor: 'teacher-123',
          topic: 'business-english'
        }
      };

      mockActivityTracker.recordActivity.mockResolvedValue({ id: 3 });

      const response = await request(app)
        .post('/api/lexi/track-activity')
        .set('Authorization', `Bearer ${validToken}`)
        .send(callerNActivity);

      expect(response.status).toBe(200);
      expect(mockActivityTracker.recordActivity).toHaveBeenCalledWith(
        mockUser.id,
        'lexi_callern_video_session_start',
        2,
        1,
        {
          module: 'callern',
          sessionId: 'call-session-456',
          tutor: 'teacher-123',
          topic: 'business-english'
        }
      );
    });
  });

  describe('POST /api/lexi/contextual-response', () => {
    it('should provide contextual AI responses based on activity', async () => {
      const contextualRequest = {
        message: 'I need help with grammar',
        context: {
          module: 'homework',
          activityType: 'grammar_exercise',
          courseId: 1
        },
        studentLevel: 'intermediate'
      };

      mockActivityTracker.recordActivity.mockResolvedValue({ id: 4 });

      const response = await request(app)
        .post('/api/lexi/contextual-response')
        .set('Authorization', `Bearer ${validToken}`)
        .send(contextualRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('emotion');
      expect(response.body.content).toContain('Test Student'); // Should use user's name
      
      // Should record the interaction
      expect(mockActivityTracker.recordActivity).toHaveBeenCalledWith(
        mockUser.id,
        'lexi_interaction_homework',
        1,
        1,
        expect.objectContaining({
          message: 'I need help with grammar',
          context: contextualRequest.context
        })
      );
    });

    it('should provide CallernN-specific responses', async () => {
      const callerNRequest = {
        message: 'I am nervous about speaking',
        context: {
          module: 'callern',
          activityType: 'video_call_active'
        },
        studentLevel: 'beginner'
      };

      const response = await request(app)
        .post('/api/lexi/contextual-response')
        .set('Authorization', `Bearer ${validToken}`)
        .send(callerNRequest);

      expect(response.status).toBe(200);
      expect(response.body.content).toContain('nervous');
      expect(response.body.emotion).toBe('encouraging');
      expect(response.body).toHaveProperty('culturalTip');
      expect(response.body).toHaveProperty('suggestions');
    });

    it('should provide flashcard-specific responses', async () => {
      const flashcardRequest = {
        message: 'I keep forgetting these words',
        context: {
          module: 'flashcards',
          activityType: 'vocabulary_review'
        },
        studentLevel: 'intermediate'
      };

      const response = await request(app)
        .post('/api/lexi/contextual-response')
        .set('Authorization', `Bearer ${validToken}`)
        .send(flashcardRequest);

      expect(response.status).toBe(200);
      expect(response.body.content).toContain('Memory');
      expect(response.body).toHaveProperty('culturalTip');
      expect(response.body.suggestions).toContain('Use visual associations');
    });

    it('should handle errors gracefully', async () => {
      // Make storage.getUser fail
      mockStorage.getUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/lexi/contextual-response')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          message: 'test',
          context: { module: 'general', activityType: 'test' }
        });

      expect(response.status).toBe(500);
      expect(response.body.content).toBe("I'm here to help! Please try again.");
      expect(response.body.emotion).toBe('encouraging');
    });
  });

  describe('GET /api/lexi/insights', () => {
    it('should provide learning insights based on activity patterns', async () => {
      const mockWeeklyProgress = {
        studyTimeMinutes: 180,
        goalMinutes: 300,
        progressPercentage: 60,
        activeDays: 4,
        completedLessons: 6
      };

      mockActivityTracker.getWeeklyStudyTime.mockResolvedValue(180);
      mockActivityTracker.getWeeklyProgress.mockResolvedValue(mockWeeklyProgress);

      const response = await request(app)
        .get('/api/lexi/insights')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weeklyProgress');
      expect(response.body).toHaveProperty('currentFocus');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('encouragement');

      expect(response.body.weeklyProgress).toBeGreaterThan(0);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.encouragement).toContain('Test Student');
    });

    it('should provide relevant recommendations based on study patterns', async () => {
      const lowActivityProgress = {
        studyTimeMinutes: 30,
        goalMinutes: 300,
        progressPercentage: 10,
        activeDays: 1,
        completedLessons: 1
      };

      mockActivityTracker.getWeeklyStudyTime.mockResolvedValue(30);
      mockActivityTracker.getWeeklyProgress.mockResolvedValue(lowActivityProgress);

      const response = await request(app)
        .get('/api/lexi/insights')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      
      // Should recommend more study time and consistency
      const recommendations = response.body.recommendations;
      expect(recommendations.some((rec: string) => rec.includes('study at least 4 days'))).toBe(true);
      expect(recommendations.some((rec: string) => rec.includes('1 hour of study time'))).toBe(true);
    });

    it('should handle insights generation errors', async () => {
      mockActivityTracker.getWeeklyStudyTime.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/lexi/insights')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.weeklyProgress).toBe(0);
      expect(response.body.currentFocus).toBe('general learning');
      expect(response.body.recommendations).toContain('Keep practicing daily!');
    });
  });

  describe('GET /api/lexi/stats', () => {
    it('should return Lexi companion statistics', async () => {
      const response = await request(app)
        .get('/api/lexi/stats')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('helpfulTips');
      expect(response.body).toHaveProperty('encouragements');
      expect(response.body).toHaveProperty('totalInteractions');
      expect(response.body).toHaveProperty('weeklyEngagement');
      
      // All stats should be numbers
      Object.values(response.body).forEach(value => {
        expect(typeof value).toBe('number');
      });
    });

    it('should handle stats retrieval errors', async () => {
      mockStorage.getUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/lexi/stats')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      
      // Should return default stats structure
      expect(response.body.conversations).toBe(0);
      expect(response.body.helpfulTips).toBe(0);
      expect(response.body.encouragements).toBe(0);
      expect(response.body.totalInteractions).toBe(0);
      expect(response.body.weeklyEngagement).toBe(0);
    });
  });

  describe('POST /api/lexi/interactions', () => {
    it('should record Lexi interactions for analytics', async () => {
      const interaction = {
        message: 'How do I improve my pronunciation?',
        response: 'Practice with native speakers and use pronunciation tools',
        context: {
          module: 'callern',
          activityType: 'pronunciation_help'
        },
        emotion: 'helpful',
        culturalTip: 'In Persian culture...',
        pronunciation: { word: 'pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃn/' }
      };

      mockActivityTracker.recordActivity.mockResolvedValue({ id: 5 });

      const response = await request(app)
        .post('/api/lexi/interactions')
        .set('Authorization', `Bearer ${validToken}`)
        .send(interaction);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        recorded: true
      });

      expect(mockActivityTracker.recordActivity).toHaveBeenCalledWith(
        mockUser.id,
        'lexi_interaction',
        null,
        1,
        expect.objectContaining({
          message: interaction.message,
          response: interaction.response,
          context: interaction.context,
          emotion: interaction.emotion,
          culturalTip: interaction.culturalTip,
          pronunciation: interaction.pronunciation
        })
      );
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without valid JWT token', async () => {
      const response = await request(app)
        .get('/api/lexi/stats');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject requests with invalid JWT token', async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/lexi/stats')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should handle missing JWT_SECRET', async () => {
      delete process.env.JWT_SECRET;

      const response = await request(app)
        .get('/api/lexi/stats')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
});