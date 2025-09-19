import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActivityTracker, type LearningAnalytics } from '../../server/activity-tracker';
import { db } from '../../server/db';
import { learningActivities, skillAssessments, users } from '../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';

// Mock the database
vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    from: vi.fn()
  }
}));

describe('ActivityTracker - Global Lexi Activity Tracking', () => {
  let activityTracker: ActivityTracker;
  const mockUserId = 123;

  beforeEach(() => {
    activityTracker = new ActivityTracker();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Activity Recording', () => {
    it('should record learning activities correctly', async () => {
      // Mock database insert response
      const mockActivity = {
        id: 1,
        userId: mockUserId,
        activityType: 'homework',
        courseId: 1,
        durationMinutes: 30,
        completionRate: 0.85,
        metadata: { assignment: 'Unit 3 - Grammar' }
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockActivity])
      };

      (db.insert as any).mockReturnValue(mockInsert);

      // Mock the update for user study time
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined)
      };
      (db.update as any).mockReturnValue(mockUpdate);

      const result = await activityTracker.recordActivity(
        mockUserId,
        'homework',
        1,
        30,
        { completionRate: 0.85, assignment: 'Unit 3 - Grammar' }
      );

      expect(db.insert).toHaveBeenCalledWith(learningActivities);
      expect(mockInsert.values).toHaveBeenCalledWith({
        userId: mockUserId,
        activityType: 'homework',
        courseId: 1,
        durationMinutes: 30,
        completionRate: 0.85,
        skillPoints: {},
        metadata: { completionRate: 0.85, assignment: 'Unit 3 - Grammar' }
      });
      expect(result).toEqual(mockActivity);
    });

    it('should handle errors during activity recording', async () => {
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error('Database error'))
      };

      (db.insert as any).mockReturnValue(mockInsert);

      await expect(
        activityTracker.recordActivity(mockUserId, 'test', null, 10)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Learning Analytics Generation', () => {
    it('should generate comprehensive learning analytics', async () => {
      // Mock getActivityHistory
      const mockActivities = [
        {
          id: 1,
          userId: mockUserId,
          activityType: 'homework',
          durationMinutes: 30,
          completionRate: 0.8,
          createdAt: new Date(),
          metadata: { assignment: 'Unit 3' }
        },
        {
          id: 2,
          userId: mockUserId,
          activityType: 'flashcard',
          durationMinutes: 15,
          completionRate: 0.9,
          createdAt: new Date(),
          metadata: { cardId: 'vocab-1' }
        },
        {
          id: 3,
          userId: mockUserId,
          activityType: 'callern',
          durationMinutes: 45,
          completionRate: 0.75,
          createdAt: new Date(),
          metadata: { sessionId: 'call-123' }
        }
      ];

      // Mock database queries for different analytics components
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };

      (db.select as any).mockReturnValue(mockSelect);

      // Mock getActivityHistory
      vi.spyOn(activityTracker, 'getActivityHistory').mockResolvedValue(mockActivities);
      
      // Mock getWeeklyStudyTime
      vi.spyOn(activityTracker, 'getWeeklyStudyTime').mockResolvedValue(180);

      const analytics = await activityTracker.generateLearningAnalytics(mockUserId);

      expect(analytics).toBeDefined();
      expect(analytics.studyTime).toBeDefined();
      expect(analytics.homeworkCompletion).toBeDefined();
      expect(analytics.flashcardPerformance).toBeDefined();
      expect(analytics.weakPoints).toBeDefined();
      expect(analytics.strongPoints).toBeDefined();
      expect(analytics.callerNSessions).toBeDefined();
      
      // Verify that study time includes weekly data
      expect(typeof analytics.studyTime.weekly).toBe('number');
      expect(typeof analytics.studyTime.streak).toBe('number');
    });

    it('should calculate homework completion correctly', async () => {
      const mockHomeworkActivities = [
        {
          id: 1,
          userId: mockUserId,
          activityType: 'homework',
          completionRate: 0.8,
          createdAt: new Date()
        },
        {
          id: 2,
          userId: mockUserId,
          activityType: 'homework',
          completionRate: 0.9,
          createdAt: new Date()
        }
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockHomeworkActivities)
      };

      (db.select as any).mockReturnValue(mockSelect);

      const analytics = await activityTracker.generateLearningAnalytics(mockUserId);

      expect(analytics.homeworkCompletion.completed).toBeGreaterThan(0);
      expect(analytics.homeworkCompletion.averageScore).toBeGreaterThan(0);
      expect(analytics.homeworkCompletion.averageScore).toBeLessThanOrEqual(100);
    });

    it('should analyze flashcard performance accurately', async () => {
      const mockActivities = [
        {
          id: 1,
          userId: mockUserId,
          activityType: 'flashcard',
          completionRate: 0.95,
          metadata: { cardId: 'easy-card-1' }
        },
        {
          id: 2,
          userId: mockUserId,
          activityType: 'flashcard',
          completionRate: 0.45,
          metadata: { cardId: 'difficult-card-1' }
        },
        {
          id: 3,
          userId: mockUserId,
          activityType: 'vocabulary',
          completionRate: 0.92,
          metadata: { cardId: 'vocab-card-1' }
        }
      ];

      vi.spyOn(activityTracker, 'getActivityHistory').mockResolvedValue(mockActivities);

      const analytics = await activityTracker.generateLearningAnalytics(mockUserId);

      expect(analytics.flashcardPerformance.cardsStudied).toBe(3);
      expect(analytics.flashcardPerformance.accuracyRate).toBeGreaterThan(0);
      expect(analytics.flashcardPerformance.difficultCards).toContain('difficult-card-1');
      expect(analytics.flashcardPerformance.masteredCards).toContain('easy-card-1');
      expect(analytics.flashcardPerformance.masteredCards).toContain('vocab-card-1');
    });
  });

  describe('Study Time Calculations', () => {
    it('should calculate weekly study time correctly', async () => {
      const mockResult = [{ totalMinutes: 240 }];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult)
      };

      (db.select as any).mockReturnValue(mockSelect);

      const weeklyTime = await activityTracker.getWeeklyStudyTime(mockUserId);

      expect(weeklyTime).toBe(240);
      expect(db.select).toHaveBeenCalled();
    });

    it('should calculate weekly progress with meaningful metrics', async () => {
      const mockResult = [{
        totalMinutes: 300,
        activeDays: 5,
        completedLessons: 8
      }];

      const mockUserResult = [{ weeklyStudyHours: 10 }];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResult)
      };

      const mockUserSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUserResult)
      };

      (db.select as any)
        .mockReturnValueOnce(mockSelect)
        .mockReturnValueOnce(mockUserSelect);

      const progress = await activityTracker.getWeeklyProgress(mockUserId);

      expect(progress.studyTimeMinutes).toBe(300);
      expect(progress.activeDays).toBe(5);
      expect(progress.completedLessons).toBe(8);
      expect(progress.progressPercentage).toBeGreaterThan(0);
      expect(progress.progressPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Skill Assessment Recording', () => {
    it('should record skill assessments correctly', async () => {
      const mockAssessment = {
        id: 1,
        userId: mockUserId,
        skillType: 'speaking',
        score: '85.5',
        activityType: 'conversation',
        assessedAt: new Date()
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAssessment])
      };

      (db.insert as any).mockReturnValue(mockInsert);

      // Mock updateProgressSnapshot (which queries skillAssessments)
      const mockSkillSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockResolvedValue([])
      };
      (db.select as any).mockReturnValue(mockSkillSelect);

      const result = await activityTracker.recordSkillAssessment(
        mockUserId,
        'speaking',
        85.5,
        'conversation'
      );

      expect(db.insert).toHaveBeenCalledWith(skillAssessments);
      expect(mockInsert.values).toHaveBeenCalledWith({
        userId: mockUserId,
        skillType: 'speaking',
        score: '85.5',
        activityType: 'conversation'
      });
      expect(result).toEqual(mockAssessment);
    });
  });

  describe('Error Handling', () => {
    it('should return default analytics when database fails', async () => {
      // Mock database failure
      vi.spyOn(activityTracker, 'getActivityHistory').mockRejectedValue(new Error('DB Error'));

      const analytics = await activityTracker.generateLearningAnalytics(mockUserId);

      // Should return default structure even when DB fails
      expect(analytics).toBeDefined();
      expect(analytics.studyTime.daily).toBe(0);
      expect(analytics.studyTime.weekly).toBe(0);
      expect(analytics.studyTime.streak).toBe(0);
      expect(analytics.homeworkCompletion.completed).toBe(0);
      expect(analytics.flashcardPerformance.cardsStudied).toBe(0);
    });

    it('should handle getWeeklyStudyTime failures gracefully', async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await activityTracker.getWeeklyStudyTime(mockUserId);
      expect(result).toBe(0);
    });
  });

  describe('Learning Pattern Identification', () => {
    it('should identify weak and strong points from skill assessments', async () => {
      const mockSkillAssessments = [
        { skillType: 'speaking', score: '45', assessedAt: new Date() }, // Weak
        { skillType: 'listening', score: '85', assessedAt: new Date() }, // Strong
        { skillType: 'grammar', score: '55', assessedAt: new Date() }, // Weak
        { skillType: 'vocabulary', score: '90', assessedAt: new Date() }, // Strong
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockSkillAssessments)
      };

      (db.select as any).mockReturnValue(mockSelect);
      vi.spyOn(activityTracker, 'getActivityHistory').mockResolvedValue([]);

      const analytics = await activityTracker.generateLearningAnalytics(mockUserId);

      // Should identify speaking as weak and listening as strong
      expect(analytics.weakPoints.skills).toContain('speaking');
      expect(analytics.strongPoints.skills).toContain('listening');
    });
  });
});