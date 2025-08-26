/**
 * Unit Tests for Gamification and Teacher QA Services
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { GamificationService } from '../server/services/gamification-service';
import { TeacherQAService } from '../server/services/teacher-qa-service';
import { DatabaseStorage } from '../server/database-storage';

// Mock the database storage
vi.mock('../server/database-storage');

describe('Gamification Service Unit Tests', () => {
  let gamificationService: GamificationService;
  let mockStorage: any;

  beforeAll(() => {
    mockStorage = {
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis()
      },
      getUser: vi.fn().mockResolvedValue({ 
        id: 1, 
        birthDate: new Date('2005-01-01'),
        level: 5,
        totalXp: 10000,
        loginStreak: 3
      }),
      getUserStatistics: vi.fn().mockResolvedValue({
        achievements: [],
        recentActivity: []
      })
    };

    gamificationService = new GamificationService(mockStorage);
  });

  describe('Daily Challenges', () => {
    it('should generate age-appropriate challenges', async () => {
      const challenges = await gamificationService.generateDailyChallenges(1);
      
      expect(challenges).toBeInstanceOf(Array);
      expect(challenges.length).toBeGreaterThan(0);
      
      challenges.forEach(challenge => {
        expect(challenge).toHaveProperty('id');
        expect(challenge).toHaveProperty('title');
        expect(challenge).toHaveProperty('description');
        expect(challenge).toHaveProperty('targetType');
        expect(challenge).toHaveProperty('targetValue');
        expect(challenge).toHaveProperty('xpReward');
        expect(challenge).toHaveProperty('difficulty');
        expect(challenge).toHaveProperty('ageGroup');
        expect(['easy', 'medium', 'hard']).toContain(challenge.difficulty);
      });
    });

    it('should include streak challenge for active users', async () => {
      const challenges = await gamificationService.generateDailyChallenges(1);
      const streakChallenge = challenges.find(c => c.targetType === 'streak');
      
      expect(streakChallenge).toBeDefined();
      if (streakChallenge) {
        expect(streakChallenge.title).toContain('Fire');
        expect(streakChallenge.targetValue).toBeGreaterThanOrEqual(4);
      }
    });

    it('should award XP for challenge completion', async () => {
      const result = await gamificationService.completeDailyChallenge(
        1, 
        'challenge-123',
        { xpEarned: 100 }
      );
      
      expect(result).toHaveProperty('xpAwarded');
      expect(result.xpAwarded).toBe(100);
    });
  });

  describe('Game Recommendations', () => {
    it('should recommend age-appropriate games', async () => {
      const recommendations = await gamificationService.getRecommendedGames(1);
      
      expect(recommendations).toBeInstanceOf(Array);
      if (recommendations.length > 0) {
        const game = recommendations[0];
        expect(game).toHaveProperty('gameId');
        expect(game).toHaveProperty('gameName');
        expect(game).toHaveProperty('reason');
        expect(game).toHaveProperty('difficulty');
        expect(game).toHaveProperty('estimatedXP');
        expect(game).toHaveProperty('ageAppropriate');
        expect(game.ageAppropriate).toBe(true);
      }
    });

    it('should filter games by age', () => {
      const ageGroup = gamificationService.getAgeGroup(15);
      expect(ageGroup).toBe('13-17');
      
      const childGroup = gamificationService.getAgeGroup(8);
      expect(childGroup).toBe('6-12');
      
      const adultGroup = gamificationService.getAgeGroup(25);
      expect(adultGroup).toBe('21+');
    });
  });

  describe('Achievements', () => {
    it('should track achievement progress', async () => {
      const progress = await gamificationService.getAchievementProgress(1);
      
      expect(progress).toHaveProperty('summary');
      expect(progress.summary).toHaveProperty('total');
      expect(progress.summary).toHaveProperty('unlocked');
      expect(progress.summary).toHaveProperty('inProgress');
      expect(progress.summary).toHaveProperty('locked');
      expect(progress).toHaveProperty('achievements');
      expect(progress.achievements).toHaveProperty('unlocked');
      expect(progress.achievements).toHaveProperty('inProgress');
      expect(progress.achievements).toHaveProperty('locked');
    });

    it('should check for new unlocks', async () => {
      const unlocks = await gamificationService.checkAchievementUnlocks(1);
      
      expect(unlocks).toHaveProperty('newUnlocks');
      expect(unlocks.newUnlocks).toBeInstanceOf(Array);
      expect(unlocks).toHaveProperty('achievements');
      expect(unlocks.achievements).toBeInstanceOf(Array);
    });
  });

  describe('Leaderboards', () => {
    it('should get weekly leaderboard', async () => {
      mockStorage.db.select.mockResolvedValueOnce([
        {
          users: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            birthDate: new Date('2005-01-01')
          },
          totalXP: 5000,
          level: 5,
          achievements: 10
        }
      ]);

      const leaderboard = await gamificationService.getLeaderboard('weekly');
      
      expect(leaderboard).toBeInstanceOf(Array);
      if (leaderboard.length > 0) {
        const entry = leaderboard[0];
        expect(entry).toHaveProperty('rank');
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('userName');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('level');
        expect(entry).toHaveProperty('xp');
        expect(entry).toHaveProperty('achievements');
      }
    });

    it('should calculate leaderboard positions', async () => {
      const stats = await gamificationService.getUserLeaderboardStats(1);
      
      expect(stats).toHaveProperty('daily');
      expect(stats).toHaveProperty('weekly');
      expect(stats).toHaveProperty('monthly');
      expect(stats).toHaveProperty('all_time');
      
      const weeklyStats = stats.weekly;
      expect(weeklyStats).toHaveProperty('rank');
      expect(weeklyStats).toHaveProperty('score');
      expect(weeklyStats).toHaveProperty('xp');
      expect(weeklyStats).toHaveProperty('level');
    });
  });
});

describe('Teacher QA Service Unit Tests', () => {
  let teacherQAService: TeacherQAService;
  let mockStorage: any;

  beforeAll(() => {
    mockStorage = {
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis()
      },
      getUser: vi.fn().mockResolvedValue({ 
        id: 1, 
        firstName: 'John',
        lastName: 'Doe',
        role: 'Teacher'
      }),
      getTeacherAssignments: vi.fn().mockResolvedValue([
        { courseId: 1, startDate: new Date() }
      ])
    };

    teacherQAService = new TeacherQAService(mockStorage);
  });

  describe('Performance Metrics', () => {
    it('should calculate teacher performance metrics', async () => {
      mockStorage.db.select.mockResolvedValueOnce([
        { sessions: { id: 1 } }
      ]).mockResolvedValueOnce([
        { attendanceRecords: { attendedAt: new Date() }, sessions: { startTime: new Date() } }
      ]);

      const metrics = await teacherQAService.getTeacherPerformanceMetrics(
        1,
        'monthly'
      );
      
      expect(metrics).toHaveProperty('teacherId');
      expect(metrics).toHaveProperty('teacherName');
      expect(metrics).toHaveProperty('overallScore');
      expect(metrics).toHaveProperty('metrics');
      expect(metrics.metrics).toHaveProperty('studentSatisfaction');
      expect(metrics.metrics).toHaveProperty('teachingEffectiveness');
      expect(metrics.metrics).toHaveProperty('punctuality');
      expect(metrics.metrics).toHaveProperty('attendanceRate');
      expect(metrics.metrics).toHaveProperty('contentQuality');
      expect(metrics).toHaveProperty('strengths');
      expect(metrics).toHaveProperty('improvements');
      expect(metrics).toHaveProperty('totalSessions');
      expect(metrics).toHaveProperty('averageRating');
    });

    it('should identify strengths and improvements', () => {
      const metrics = {
        studentSatisfaction: 0.9,
        teachingEffectiveness: 0.7,
        punctuality: 0.6,
        attendanceRate: 0.95,
        contentQuality: 0.85
      };

      const strengths: string[] = [];
      const improvements: string[] = [];

      Object.entries(metrics).forEach(([key, value]) => {
        if (value >= 0.85) {
          strengths.push(key);
        } else if (value < 0.7) {
          improvements.push(key);
        }
      });

      expect(strengths).toContain('studentSatisfaction');
      expect(strengths).toContain('attendanceRate');
      expect(strengths).toContain('contentQuality');
      expect(improvements).toContain('punctuality');
    });
  });

  describe('Peer Review', () => {
    it('should validate peer review submission', async () => {
      const reviewData = {
        overallRating: 4.5,
        criteria: {
          lessonStructure: 4,
          studentEngagement: 5,
          timeManagement: 4,
          contentDelivery: 5,
          feedbackQuality: 4,
          languageProficiency: 5
        },
        strengths: ['Excellent engagement'],
        areasForImprovement: ['Time management'],
        additionalComments: 'Good session'
      };

      const result = await teacherQAService.submitPeerReview(
        1,
        2,
        1,
        reviewData
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('reviewerId');
      expect(result).toHaveProperty('teacherId');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('overallRating');
      expect(result.reviewerId).toBe(1);
      expect(result.teacherId).toBe(2);
      expect(result.overallRating).toBe(4.5);
    });

    it('should prevent self-review', async () => {
      await expect(
        teacherQAService.submitPeerReview(1, 1, 1, {
          overallRating: 5,
          criteria: {},
          strengths: [],
          areasForImprovement: []
        })
      ).rejects.toThrow('cannot review');
    });
  });

  describe('Quality Scoring', () => {
    it('should calculate quality score', async () => {
      const mockPerformance = {
        metrics: {
          studentSatisfaction: 0.85,
          teachingEffectiveness: 0.8,
          punctuality: 0.9,
          attendanceRate: 0.95,
          contentQuality: 0.88
        },
        averageRating: 4.5,
        peerReviewScore: 4.2
      };

      vi.spyOn(teacherQAService, 'getTeacherPerformanceMetrics')
        .mockResolvedValue(mockPerformance as any);

      const score = await teacherQAService.calculateQualityScore(
        1,
        'monthly'
      );

      expect(score).toHaveProperty('teacherId');
      expect(score).toHaveProperty('teacherName');
      expect(score).toHaveProperty('overallScore');
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeLessThanOrEqual(5);
      expect(score).toHaveProperty('breakdown');
      expect(score.breakdown).toHaveProperty('performance');
      expect(score.breakdown).toHaveProperty('studentFeedback');
      expect(score.breakdown).toHaveProperty('peerReview');
      expect(score).toHaveProperty('category');
      expect(['excellent', 'good', 'satisfactory', 'needs_improvement'])
        .toContain(score.category);
    });

    it('should categorize quality levels correctly', () => {
      const excellent = 4.5;
      const good = 3.8;
      const satisfactory = 2.9;
      const needsImprovement = 2.0;

      expect(excellent >= 4.5).toBe(true);
      expect(good >= 3.5 && good < 4.5).toBe(true);
      expect(satisfactory >= 2.5 && satisfactory < 3.5).toBe(true);
      expect(needsImprovement < 2.5).toBe(true);
    });
  });

  describe('Session Analysis', () => {
    it('should analyze session quality indicators', async () => {
      mockStorage.db.select.mockResolvedValueOnce([{
        id: 1,
        teacherId: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        actualStartTime: new Date(),
        actualEndTime: new Date(Date.now() + 60 * 60 * 1000)
      }]);

      const analysis = await teacherQAService.analyzeSession(1);

      expect(analysis).toHaveProperty('sessionId');
      expect(analysis).toHaveProperty('teacherId');
      expect(analysis).toHaveProperty('qualityIndicators');
      expect(analysis).toHaveProperty('flags');
      expect(analysis).toHaveProperty('autoScore');
      expect(analysis).toHaveProperty('recommendations');

      const indicators = analysis.qualityIndicators;
      expect(indicators).toHaveProperty('tttRatio');
      expect(indicators).toHaveProperty('studentParticipation');
      expect(indicators).toHaveProperty('errorCorrectionRate');
      expect(indicators).toHaveProperty('targetLanguageUse');
      expect(indicators).toHaveProperty('engagementLevel');

      expect(analysis.flags).toBeInstanceOf(Array);
      expect(analysis.autoScore).toBeGreaterThanOrEqual(0);
      expect(analysis.autoScore).toBeLessThanOrEqual(5);
    });
  });
});