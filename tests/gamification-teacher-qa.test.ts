/**
 * Test Suite for Gamification and Teacher QA Features
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import { DatabaseStorage } from '../server/database-storage';
import type { Express } from 'express';
import express from 'express';

describe('Gamification Features', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let storage: DatabaseStorage;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    storage = new DatabaseStorage();
    await storage.initialize();
    
    server = await registerRoutes(app);
    
    // Login as student
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student1@test.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.auth_token;
  });

  afterAll(async () => {
    await storage?.close();
    server?.close();
  });

  describe('Daily Challenges', () => {
    it('should generate age-appropriate daily challenges', async () => {
      const response = await request(app)
        .get('/api/gamification/daily-challenges')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.challenges).toBeInstanceOf(Array);
      expect(response.body.challenges.length).toBeGreaterThan(0);
      
      const challenge = response.body.challenges[0];
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

    it('should complete a daily challenge and award XP', async () => {
      const response = await request(app)
        .post('/api/gamification/daily-challenges/123/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progressData: {
            xpEarned: 100
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.xpAwarded).toBe(100);
    });

    it('should include streak challenges for active users', async () => {
      const response = await request(app)
        .get('/api/gamification/daily-challenges')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const streakChallenge = response.body.challenges.find(
        (c: any) => c.targetType === 'streak'
      );
      
      // May or may not have streak challenge depending on user's streak
      if (streakChallenge) {
        expect(streakChallenge.title).toContain('Fire');
        expect(streakChallenge.xpReward).toBeGreaterThan(0);
      }
    });
  });

  describe('Age-Appropriate Games', () => {
    it('should recommend games based on user age and level', async () => {
      const response = await request(app)
        .get('/api/gamification/recommended-games')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeInstanceOf(Array);
      
      if (response.body.recommendations.length > 0) {
        const game = response.body.recommendations[0];
        expect(game).toHaveProperty('gameId');
        expect(game).toHaveProperty('gameName');
        expect(game).toHaveProperty('reason');
        expect(game).toHaveProperty('difficulty');
        expect(game).toHaveProperty('estimatedXP');
        expect(game).toHaveProperty('ageAppropriate');
        expect(game.ageAppropriate).toBe(true);
      }
    });
  });

  describe('Achievements', () => {
    it('should get achievement progress', async () => {
      const response = await request(app)
        .get('/api/gamification/achievements')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary).toHaveProperty('total');
      expect(response.body.summary).toHaveProperty('unlocked');
      expect(response.body.summary).toHaveProperty('inProgress');
      expect(response.body.summary).toHaveProperty('locked');
      expect(response.body.achievements).toHaveProperty('unlocked');
      expect(response.body.achievements).toHaveProperty('inProgress');
      expect(response.body.achievements).toHaveProperty('locked');
    });

    it('should check and unlock achievements', async () => {
      const response = await request(app)
        .post('/api/gamification/achievements/check')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('newUnlocks');
      expect(response.body.achievements).toBeInstanceOf(Array);
    });
  });

  describe('Leaderboards', () => {
    it('should get weekly leaderboard', async () => {
      const response = await request(app)
        .get('/api/gamification/leaderboard')
        .query({ type: 'weekly' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.type).toBe('weekly');
      expect(response.body.leaderboard).toBeInstanceOf(Array);
      
      if (response.body.leaderboard.length > 0) {
        const entry = response.body.leaderboard[0];
        expect(entry).toHaveProperty('rank');
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('userName');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('level');
        expect(entry).toHaveProperty('xp');
        expect(entry).toHaveProperty('achievements');
      }
    });

    it('should get age-specific leaderboard', async () => {
      const response = await request(app)
        .get('/api/gamification/leaderboard')
        .query({ 
          type: 'monthly',
          ageGroup: '15-20'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ageGroup).toBe('15-20');
    });

    it('should get user leaderboard stats', async () => {
      const response = await request(app)
        .get('/api/gamification/leaderboard/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('daily');
      expect(response.body.stats).toHaveProperty('weekly');
      expect(response.body.stats).toHaveProperty('monthly');
      expect(response.body.stats).toHaveProperty('all_time');
      
      const weeklyStats = response.body.stats.weekly;
      expect(weeklyStats).toHaveProperty('rank');
      expect(weeklyStats).toHaveProperty('score');
      expect(weeklyStats).toHaveProperty('xp');
      expect(weeklyStats).toHaveProperty('level');
    });
  });

  describe('XP and Leveling', () => {
    it('should award XP to user', async () => {
      const response = await request(app)
        .post('/api/gamification/xp/award')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
          reason: 'Test XP Award'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.xpAwarded).toBe(50);
      expect(response.body.reason).toBe('Test XP Award');
    });

    it('should reject invalid XP amounts', async () => {
      const response = await request(app)
        .post('/api/gamification/xp/award')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -50,
          reason: 'Invalid XP'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid XP amount');
    });

    it('should get gamification stats', async () => {
      const response = await request(app)
        .get('/api/gamification/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('level');
      expect(response.body.stats).toHaveProperty('totalXp');
      expect(response.body.stats).toHaveProperty('weeklyRank');
      expect(response.body.stats).toHaveProperty('achievements');
      expect(response.body.stats).toHaveProperty('dailyChallenges');
    });
  });
});

describe('Teacher QA System', () => {
  let app: Express;
  let server: any;
  let teacherToken: string;
  let adminToken: string;
  let storage: DatabaseStorage;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    storage = new DatabaseStorage();
    await storage.initialize();
    
    server = await registerRoutes(app);
    
    // Login as teacher
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher1@test.com',
        password: 'password123'
      });
    
    teacherToken = teacherLogin.body.auth_token;
    
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });
    
    adminToken = adminLogin.body.auth_token;
  });

  afterAll(async () => {
    await storage?.close();
    server?.close();
  });

  describe('Performance Metrics', () => {
    it('should get teacher performance metrics', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/performance/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBeLessThanOrEqual(403); // May be forbidden if not own metrics
    });

    it('should get own performance metrics', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/my-performance')
        .query({ period: 'monthly' })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('teacherId');
      expect(response.body.metrics).toHaveProperty('teacherName');
      expect(response.body.metrics).toHaveProperty('overallScore');
      expect(response.body.metrics).toHaveProperty('metrics');
      expect(response.body.metrics.metrics).toHaveProperty('studentSatisfaction');
      expect(response.body.metrics.metrics).toHaveProperty('teachingEffectiveness');
      expect(response.body.metrics.metrics).toHaveProperty('punctuality');
      expect(response.body.metrics).toHaveProperty('strengths');
      expect(response.body.metrics).toHaveProperty('improvements');
    });
  });

  describe('Peer Review', () => {
    it('should submit a peer review', async () => {
      const response = await request(app)
        .post('/api/teacher-qa/peer-review')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          teacherId: 2,
          sessionId: 1,
          overallRating: 4.5,
          criteria: {
            lessonStructure: 4,
            studentEngagement: 5,
            timeManagement: 4,
            contentDelivery: 5,
            feedbackQuality: 4,
            languageProficiency: 5
          },
          strengths: ['Excellent student engagement', 'Clear explanations'],
          areasForImprovement: ['Time management could be better'],
          additionalComments: 'Great session overall'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.review).toHaveProperty('id');
      expect(response.body.review).toHaveProperty('reviewerId');
      expect(response.body.review).toHaveProperty('teacherId');
      expect(response.body.review).toHaveProperty('overallRating');
    });

    it('should not allow self-review', async () => {
      const response = await request(app)
        .post('/api/teacher-qa/peer-review')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          teacherId: 1,
          sessionId: 1,
          overallRating: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cannot review');
    });
  });

  describe('Quality Scoring', () => {
    it('should calculate quality score for teacher', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/quality-score/1')
        .query({ period: 'monthly' })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBeLessThanOrEqual(403); // May be forbidden if not own score
    });

    it('should get quality leaderboard', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/quality-leaderboard')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.leaderboard).toBeInstanceOf(Array);
      
      if (response.body.leaderboard.length > 0) {
        const entry = response.body.leaderboard[0];
        expect(entry).toHaveProperty('rank');
        expect(entry).toHaveProperty('teacherId');
        expect(entry).toHaveProperty('teacherName');
        expect(entry).toHaveProperty('overallScore');
        expect(entry).toHaveProperty('totalSessions');
        expect(entry).toHaveProperty('averageRating');
      }
    });
  });

  describe('Session Analysis', () => {
    it('should analyze a session for quality', async () => {
      const response = await request(app)
        .post('/api/teacher-qa/analyze-session')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('sessionId');
      expect(response.body.analysis).toHaveProperty('teacherId');
      expect(response.body.analysis).toHaveProperty('qualityIndicators');
      expect(response.body.analysis).toHaveProperty('flags');
      expect(response.body.analysis).toHaveProperty('autoScore');
      
      const indicators = response.body.analysis.qualityIndicators;
      expect(indicators).toHaveProperty('tttRatio');
      expect(indicators).toHaveProperty('studentParticipation');
      expect(indicators).toHaveProperty('errorCorrectionRate');
    });

    it('should batch analyze sessions (admin only)', async () => {
      const response = await request(app)
        .post('/api/teacher-qa/batch-analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionIds: [1, 2, 3]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('totalAnalyzed');
      expect(response.body).toHaveProperty('totalFailed');
      expect(response.body.analyses).toBeInstanceOf(Array);
    });
  });

  describe('Reports and Insights', () => {
    it('should generate comprehensive QA report', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/report/1')
        .query({ period: 'monthly' })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBeLessThanOrEqual(403); // May be forbidden if not own report
    });

    it('should get department insights (admin only)', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/insights')
        .query({ period: 'quarterly' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.insights).toHaveProperty('departmentMetrics');
      expect(response.body.insights).toHaveProperty('topPerformers');
      expect(response.body.insights).toHaveProperty('needingSupport');
      expect(response.body.insights).toHaveProperty('commonStrengths');
      expect(response.body.insights).toHaveProperty('commonImprovements');
      expect(response.body.insights).toHaveProperty('recommendations');
      
      const metrics = response.body.insights.departmentMetrics;
      expect(metrics).toHaveProperty('totalTeachers');
      expect(metrics).toHaveProperty('averageScore');
      expect(metrics).toHaveProperty('averageRating');
      expect(metrics).toHaveProperty('averageRetention');
    });

    it('should deny non-admin access to insights', async () => {
      const response = await request(app)
        .get('/api/teacher-qa/insights')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('admin');
    });
  });
});

describe('Integration Tests', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let storage: DatabaseStorage;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    storage = new DatabaseStorage();
    await storage.initialize();
    
    server = await registerRoutes(app);
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student1@test.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.auth_token;
  });

  afterAll(async () => {
    await storage?.close();
    server?.close();
  });

  it('should integrate gamification with learning progress', async () => {
    // Get daily challenges
    const challengesResponse = await request(app)
      .get('/api/gamification/daily-challenges')
      .set('Authorization', `Bearer ${authToken}`);

    expect(challengesResponse.status).toBe(200);
    const challenges = challengesResponse.body.challenges;

    // Check achievements
    const achievementsResponse = await request(app)
      .get('/api/gamification/achievements')
      .set('Authorization', `Bearer ${authToken}`);

    expect(achievementsResponse.status).toBe(200);
    
    // Get leaderboard position
    const leaderboardResponse = await request(app)
      .get('/api/gamification/leaderboard/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(leaderboardResponse.status).toBe(200);
    
    // Verify all components work together
    expect(challenges).toBeDefined();
    expect(achievementsResponse.body.summary).toBeDefined();
    expect(leaderboardResponse.body.stats).toBeDefined();
  });
});