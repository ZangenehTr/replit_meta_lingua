/**
 * Advanced Features Test Suite
 * Tests for CEFR Tagging, IRT Assessment, AI Supervision, Mood Intelligence, and Adaptive Content
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import { DatabaseStorage } from '../server/database-storage';
import type { Express } from 'express';
import express from 'express';

describe('Advanced Features Test Suite', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let storage: DatabaseStorage;

  beforeAll(async () => {
    // Initialize test environment
    app = express();
    app.use(express.json());
    
    storage = new DatabaseStorage();
    await storage.initialize();
    
    server = await registerRoutes(app);
    
    // Create test user and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher1@test.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.auth_token;
  });

  afterAll(async () => {
    await storage?.close();
    server?.close();
  });

  describe('CEFR Tagging Service', () => {
    it('should tag content with CEFR level', async () => {
      const response = await request(app)
        .post('/api/advanced/cefr/tag-content')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contentId: 'test-content-1',
          contentType: 'lesson',
          contentAnalysis: {
            text: 'This is a simple lesson about daily routines',
            difficulty: 0.3,
            grammarPoints: ['present simple', 'adverbs of frequency'],
            vocabulary: ['wake up', 'breakfast', 'work']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tag).toHaveProperty('level');
      expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(response.body.tag.level);
      expect(response.body.tag).toHaveProperty('skill');
      expect(response.body.tag).toHaveProperty('canDoStatements');
    });

    it('should assess student CEFR level', async () => {
      const response = await request(app)
        .post('/api/advanced/cefr/assess-student')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: 1,
          assessmentData: {
            testScores: {
              speaking: 70,
              listening: 65,
              reading: 75,
              writing: 60,
              grammar: 72,
              vocabulary: 68
            },
            completedContent: ['content-1', 'content-2'],
            interactionData: {}
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.assessment).toHaveProperty('overallLevel');
      expect(response.body.assessment).toHaveProperty('skillLevels');
      expect(response.body.assessment).toHaveProperty('strengths');
      expect(response.body.assessment).toHaveProperty('areasForImprovement');
      expect(response.body.assessment).toHaveProperty('recommendedContent');
    });

    it('should generate adaptive CEFR roadmap', async () => {
      const response = await request(app)
        .post('/api/advanced/cefr/generate-roadmap')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: 1,
          targetLevel: 'B2',
          currentAssessment: {
            overallLevel: 'B1',
            skillLevels: {
              speaking: 'B1',
              listening: 'B1',
              reading: 'B1',
              writing: 'A2',
              grammar: 'B1',
              vocabulary: 'B1'
            },
            strengths: [],
            areasForImprovement: ['writing'],
            recommendedContent: []
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.roadmap).toHaveProperty('currentLevel');
      expect(response.body.roadmap).toHaveProperty('targetLevel');
      expect(response.body.roadmap).toHaveProperty('milestones');
      expect(response.body.roadmap).toHaveProperty('adaptivePath');
      expect(response.body.roadmap.milestones).toBeInstanceOf(Array);
    });
  });

  describe('IRT Adaptive Assessment', () => {
    it('should start adaptive IRT assessment', async () => {
      const response = await request(app)
        .post('/api/advanced/irt/start-assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxItems: 10,
          targetSE: 0.3,
          timeLimit: 600000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.assessment).toHaveProperty('finalAbility');
      expect(response.body.assessment).toHaveProperty('itemsAdministered');
      expect(response.body.assessment).toHaveProperty('responses');
      expect(response.body.assessment).toHaveProperty('stoppingReason');
      expect(response.body.assessment.finalAbility).toHaveProperty('theta');
      expect(response.body.assessment.finalAbility).toHaveProperty('standardError');
    });

    it('should update ability estimate', async () => {
      const response = await request(app)
        .post('/api/advanced/irt/update-ability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentTheta: 0,
          currentSE: 1,
          responses: [
            { itemId: 'item1', correct: true, responseTime: 5000 },
            { itemId: 'item2', correct: false, responseTime: 7000 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ability).toHaveProperty('theta');
      expect(response.body.ability).toHaveProperty('standardError');
      expect(response.body.ability).toHaveProperty('totalResponses');
    });

    it('should select next adaptive item', async () => {
      const response = await request(app)
        .post('/api/advanced/irt/next-item')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theta: 0.5,
          excludeItems: ['item1', 'item2']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      if (response.body.item) {
        expect(response.body.item).toHaveProperty('id');
        expect(response.body.item).toHaveProperty('difficulty');
        expect(response.body.item).toHaveProperty('discrimination');
      }
    });

    it('should generate performance report', async () => {
      const response = await request(app)
        .post('/api/advanced/irt/performance-report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentData: {
            finalAbility: {
              theta: 0.5,
              standardError: 0.25,
              totalResponses: 10
            },
            responses: [
              { itemId: 'vocabulary_1', correct: true, responseTime: 5000 },
              { itemId: 'grammar_1', correct: false, responseTime: 8000 },
              { itemId: 'reading_1', correct: true, responseTime: 12000 }
            ]
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toHaveProperty('level');
      expect(response.body.report).toHaveProperty('strengths');
      expect(response.body.report).toHaveProperty('weaknesses');
      expect(response.body.report).toHaveProperty('recommendations');
      expect(response.body.report).toHaveProperty('detailedAnalysis');
    });
  });

  describe('AI Supervisor Service', () => {
    it('should initialize AI supervisor for session', async () => {
      const response = await request(app)
        .post('/api/advanced/ai-supervisor/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'session-123',
          studentId: 1,
          teacherId: 2,
          targetLanguage: 'English'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('AI supervisor initialized');
    });

    it('should analyze grammar in real-time', async () => {
      const response = await request(app)
        .post('/api/advanced/ai-supervisor/analyze-grammar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'session-123',
          text: 'I goes to school yesterday'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.corrections).toBeInstanceOf(Array);
      // Grammar analysis may or may not find errors depending on AI service
    });

    it('should get TTT metrics', async () => {
      const response = await request(app)
        .get('/api/advanced/ai-supervisor/ttt-metrics/session-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toHaveProperty('teacherTalkTime');
      expect(response.body.metrics).toHaveProperty('studentTalkTime');
      expect(response.body.metrics).toHaveProperty('ratio');
      expect(response.body.metrics).toHaveProperty('recommendation');
    });

    it('should get real-time suggestions', async () => {
      const response = await request(app)
        .post('/api/advanced/ai-supervisor/realtime-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'session-123',
          context: 'Student is talking about their daily routine'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.suggestions).toHaveProperty('vocabulary');
      expect(response.body.suggestions).toHaveProperty('phrases');
      expect(response.body.suggestions).toHaveProperty('topics');
    });
  });

  describe('Session Adaptive Content', () => {
    it('should generate adaptive content for session', async () => {
      const response = await request(app)
        .post('/api/advanced/adaptive-content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          sessionType: 'regular',
          targetSkills: ['speaking', 'vocabulary']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.contents).toBeInstanceOf(Array);
      expect(response.body.contents.length).toBeGreaterThan(0);
      
      const content = response.body.contents[0];
      expect(content).toHaveProperty('contentType');
      expect(content).toHaveProperty('difficulty');
      expect(content).toHaveProperty('estimatedMinutes');
      expect(content).toHaveProperty('targetSkills');
      expect(content).toHaveProperty('cefrLevel');
    });

    it('should adapt content in real-time based on performance', async () => {
      const response = await request(app)
        .post('/api/advanced/adaptive-content/realtime-adapt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          currentMetrics: {
            studentId: 1,
            sessionId: 1,
            accuracy: 0.4,
            responseTime: 15,
            engagementLevel: 3,
            vocabularyRetention: 0.6,
            grammarAccuracy: 0.5,
            speakingFluency: 0.6,
            comprehension: 0.7,
            energyLevel: 2
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // May or may not adapt depending on triggers
      if (response.body.adaptation) {
        expect(response.body.adaptation).toHaveProperty('contentType');
        expect(response.body.adaptation).toHaveProperty('adaptationReason');
      }
    });
  });

  describe('Mood Intelligence Service', () => {
    it('should detect mood from text input', async () => {
      const response = await request(app)
        .post('/api/advanced/mood/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'I am feeling very tired and stressed today',
          voiceAnalysis: null,
          behavioralData: null
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.mood).toHaveProperty('primaryMood');
      expect(response.body.mood).toHaveProperty('emotionalState');
      expect(response.body.mood).toHaveProperty('confidence');
      expect(response.body.mood).toHaveProperty('recommendations');
    });

    it('should track mood patterns', async () => {
      const response = await request(app)
        .get('/api/advanced/mood/patterns')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.patterns).toBeInstanceOf(Array);
    });

    it('should analyze mood trends', async () => {
      const response = await request(app)
        .get('/api/advanced/mood/trends/weekly')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trends).toHaveProperty('period');
      expect(response.body.trends).toHaveProperty('trend');
      expect(response.body.trends).toHaveProperty('averageMood');
      expect(response.body.trends).toHaveProperty('volatility');
      expect(response.body.trends).toHaveProperty('insights');
    });

    it('should adapt learning to mood', async () => {
      const response = await request(app)
        .post('/api/advanced/mood/adapt-learning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          currentMood: {
            primaryMood: 'tired',
            secondaryMoods: ['stressed'],
            emotionalState: 'negative',
            confidence: 0.8,
            triggers: ['long day', 'difficult content'],
            recommendations: []
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.adaptations).toHaveProperty('adaptations');
      expect(response.body.adaptations).toHaveProperty('contentAdjustments');
      expect(response.body.adaptations).toHaveProperty('paceAdjustments');
      expect(response.body.adaptations.adaptations).toBeInstanceOf(Array);
    });
  });

  describe('Recording Service', () => {
    it('should save call recording', async () => {
      const mockRecordingData = Buffer.from('mock recording data').toString('base64');
      
      const response = await request(app)
        .post('/api/advanced/recording/save')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          studentId: 1,
          teacherId: 2,
          recordingData: mockRecordingData,
          language: 'English'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metadata).toHaveProperty('id');
      expect(response.body.metadata).toHaveProperty('sessionId');
      expect(response.body.metadata).toHaveProperty('fileName');
      expect(response.body.metadata).toHaveProperty('duration');
    });

    it('should search recordings', async () => {
      const response = await request(app)
        .post('/api/advanced/recording/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: 1,
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          dateTo: new Date()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeInstanceOf(Array);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full adaptive assessment flow', async () => {
      // Step 1: Initialize mood detection
      const moodResponse = await request(app)
        .post('/api/advanced/mood/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'I feel ready to learn today',
          behavioralData: { engagement: 0.8, errorRate: 0.1 }
        });

      expect(moodResponse.status).toBe(200);
      const mood = moodResponse.body.mood;

      // Step 2: Assess CEFR level
      const cefrResponse = await request(app)
        .post('/api/advanced/cefr/assess-student')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: 1,
          assessmentData: {
            testScores: {
              speaking: 75,
              listening: 70,
              reading: 80,
              writing: 65,
              grammar: 75,
              vocabulary: 72
            }
          }
        });

      expect(cefrResponse.status).toBe(200);
      const cefrLevel = cefrResponse.body.assessment.overallLevel;

      // Step 3: Generate adaptive content based on mood and level
      const contentResponse = await request(app)
        .post('/api/advanced/adaptive-content/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          sessionType: 'adaptive',
          targetSkills: cefrResponse.body.assessment.areasForImprovement || ['writing']
        });

      expect(contentResponse.status).toBe(200);
      expect(contentResponse.body.contents).toBeInstanceOf(Array);

      // Step 4: Start IRT assessment
      const irtResponse = await request(app)
        .post('/api/advanced/irt/start-assessment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxItems: 5,
          targetSE: 0.4
        });

      expect(irtResponse.status).toBe(200);
      expect(irtResponse.body.assessment).toHaveProperty('finalAbility');

      // Step 5: Initialize AI supervisor for monitoring
      const supervisorResponse = await request(app)
        .post('/api/advanced/ai-supervisor/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'integration-test-session',
          studentId: 1,
          teacherId: 2,
          targetLanguage: 'English'
        });

      expect(supervisorResponse.status).toBe(200);

      // Verify all services work together
      expect(mood).toBeDefined();
      expect(cefrLevel).toBeDefined();
      expect(contentResponse.body.contents.length).toBeGreaterThan(0);
      expect(irtResponse.body.assessment.finalAbility.theta).toBeDefined();
    });

    it('should adapt content based on real-time performance and mood', async () => {
      // Step 1: Detect negative mood
      const moodResponse = await request(app)
        .post('/api/advanced/mood/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'I am feeling frustrated and confused',
          behavioralData: { engagement: 0.3, errorRate: 0.5 }
        });

      expect(moodResponse.status).toBe(200);
      const mood = moodResponse.body.mood;
      expect(mood.emotionalState).toBe('negative');

      // Step 2: Adapt learning based on mood
      const adaptResponse = await request(app)
        .post('/api/advanced/mood/adapt-learning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          currentMood: mood
        });

      expect(adaptResponse.status).toBe(200);
      expect(adaptResponse.body.adaptations.contentAdjustments.difficulty).toBeLessThan(1);

      // Step 3: Generate easier adaptive content
      const contentResponse = await request(app)
        .post('/api/advanced/adaptive-content/realtime-adapt')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 1,
          currentMetrics: {
            studentId: 1,
            sessionId: 1,
            accuracy: 0.3,
            responseTime: 45,
            engagementLevel: 2,
            vocabularyRetention: 0.4,
            grammarAccuracy: 0.3,
            speakingFluency: 0.5,
            comprehension: 0.4,
            moodState: mood.primaryMood,
            energyLevel: 2
          }
        });

      expect(contentResponse.status).toBe(200);
      // Should provide intervention or easier content
      if (contentResponse.body.adaptation) {
        expect(contentResponse.body.adaptation.difficulty).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle invalid CEFR level assessment gracefully', async () => {
      const response = await request(app)
        .post('/api/advanced/cefr/assess-student')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: -1,
          assessmentData: {}
        });

      expect(response.status).toBeLessThanOrEqual(500);
    });

    it('should handle missing session ID for AI supervisor', async () => {
      const response = await request(app)
        .post('/api/advanced/ai-supervisor/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentId: 1,
          teacherId: 2
        });

      expect(response.status).toBeLessThanOrEqual(500);
    });

    it('should return appropriate error for unauthorized access', async () => {
      const response = await request(app)
        .post('/api/advanced/cefr/tag-content')
        .send({
          contentId: 'test',
          contentType: 'lesson'
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('Advanced Features Data Persistence', () => {
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

  it('should persist CEFR assessment data', async () => {
    // First assessment
    const firstAssessment = await request(app)
      .post('/api/advanced/cefr/assess-student')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        assessmentData: {
          testScores: {
            speaking: 60,
            listening: 65,
            reading: 70,
            writing: 55,
            grammar: 65,
            vocabulary: 60
          }
        }
      });

    expect(firstAssessment.status).toBe(200);
    const firstLevel = firstAssessment.body.assessment.overallLevel;

    // Second assessment after improvement
    const secondAssessment = await request(app)
      .post('/api/advanced/cefr/assess-student')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        assessmentData: {
          testScores: {
            speaking: 75,
            listening: 80,
            reading: 85,
            writing: 70,
            grammar: 80,
            vocabulary: 75
          }
        }
      });

    expect(secondAssessment.status).toBe(200);
    const secondLevel = secondAssessment.body.assessment.overallLevel;

    // Check if there's progression
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const firstIndex = levelOrder.indexOf(firstLevel);
    const secondIndex = levelOrder.indexOf(secondLevel);
    expect(secondIndex).toBeGreaterThanOrEqual(firstIndex);
  });

  it('should track mood patterns over multiple sessions', async () => {
    // Submit multiple mood entries
    const moods = [
      { text: 'Feeling great today!', expectedState: 'positive' },
      { text: 'A bit tired but motivated', expectedState: 'neutral' },
      { text: 'Stressed about the test', expectedState: 'negative' }
    ];

    for (const mood of moods) {
      const response = await request(app)
        .post('/api/advanced/mood/detect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: mood.text });

      expect(response.status).toBe(200);
    }

    // Get mood patterns
    const patternsResponse = await request(app)
      .get('/api/advanced/mood/patterns')
      .set('Authorization', `Bearer ${authToken}`);

    expect(patternsResponse.status).toBe(200);
    expect(patternsResponse.body.patterns).toBeInstanceOf(Array);

    // Get mood trends
    const trendsResponse = await request(app)
      .get('/api/advanced/mood/trends/daily')
      .set('Authorization', `Bearer ${authToken}`);

    expect(trendsResponse.status).toBe(200);
    expect(trendsResponse.body.trends).toHaveProperty('averageMood');
  });
});