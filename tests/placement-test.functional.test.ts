import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';
import type { Server } from 'http';

describe('Placement Test Functional Tests', () => {
  let server: Server;
  let authToken: string;
  let testSessionId: number;

  beforeAll(async () => {
    server = await createServer();
    
    // Create a test user and get auth token
    const authResponse = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'placement.test@example.com',
        password: 'testpass123',
        firstName: 'Placement',
        lastName: 'Tester',
        role: 'Student'
      });
    
    expect(authResponse.status).toBe(201);
    authToken = `Bearer ${authResponse.body.token}`;
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('Test 1: Placement Test Start and Adaptive Question Flow', () => {
    it('should successfully start a placement test session', async () => {
      const response = await request(server)
        .post('/api/placement-test/start')
        .set('Authorization', authToken)
        .send({
          targetLanguage: 'english',
          learningGoal: 'ielts',
          timeAvailability: 8
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.session).toMatchObject({
        id: expect.any(Number),
        status: 'in_progress',
        currentSkill: 'speaking',
        maxDurationMinutes: 10
      });
      
      testSessionId = response.body.session.id;
    });

    it('should provide first speaking question with adaptive difficulty', async () => {
      const response = await request(server)
        .get(`/api/placement-test/sessions/${testSessionId}/next-question`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.question).toMatchObject({
        id: expect.any(Number),
        skill: 'speaking',
        level: expect.stringMatching(/^[ABC][12]$/), // CEFR level format
        type: expect.any(String),
        title: expect.any(String),
        prompt: expect.any(String),
        responseType: expect.oneOf(['audio', 'text', 'multiple_choice']),
        expectedDurationSeconds: expect.any(Number),
        estimatedMinutes: expect.any(Number)
      });
    });

    it('should adapt question difficulty based on speaking response', async () => {
      // Get first question
      const firstQuestionResponse = await request(server)
        .get(`/api/placement-test/sessions/${testSessionId}/next-question`)
        .set('Authorization', authToken);

      const firstQuestion = firstQuestionResponse.body.question;
      
      // Submit a high-quality speaking response
      const highQualityResponse = {
        questionId: firstQuestion.id,
        userResponse: {
          text: "I believe that technology has fundamentally transformed the way we communicate and interact with each other. While it has certainly brought many benefits, such as enabling us to connect with people across the globe instantly, I also think it has created some challenges. For instance, many people now prefer texting over face-to-face conversations, which can sometimes lead to misunderstandings. However, I would argue that the advantages outweigh the disadvantages, particularly in terms of educational opportunities and global collaboration."
        }
      };

      const responseSubmission = await request(server)
        .post(`/api/placement-test/sessions/${testSessionId}/responses`)
        .set('Authorization', authToken)
        .send(highQualityResponse);

      expect(responseSubmission.status).toBe(200);
      expect(responseSubmission.body.success).toBe(true);
      expect(responseSubmission.body.evaluation).toMatchObject({
        score: expect.any(Number),
        level: expect.stringMatching(/^[ABC][12]$/),
        confidence: expect.any(Number)
      });

      // Verify next question adapts to higher difficulty
      if (responseSubmission.body.nextQuestion) {
        const adaptedQuestion = responseSubmission.body.nextQuestion;
        expect(adaptedQuestion.skill).toBe('speaking');
        // Should maintain or increase difficulty based on good performance
        expect(['B2', 'C1', 'C2']).toContain(adaptedQuestion.level);
      }
    });
  });

  describe('Test 2: Response Submission and CEFR Evaluation', () => {
    it('should properly evaluate speaking responses using CEFR criteria', async () => {
      // Get current question
      const questionResponse = await request(server)
        .get(`/api/placement-test/sessions/${testSessionId}/next-question`)
        .set('Authorization', authToken);

      if (!questionResponse.body.question) {
        // Test might be completed, skip this test
        return;
      }

      const question = questionResponse.body.question;
      
      // Submit a B2-level speaking response
      const b2LevelResponse = {
        questionId: question.id,
        userResponse: {
          text: "In my opinion, environmental protection is one of the most important challenges we face today. I think governments should implement stricter regulations on carbon emissions, and individuals should also take responsibility by recycling more and using public transportation. Although some people argue that economic growth is more important, I believe we need to find a balance between development and sustainability."
        }
      };

      const response = await request(server)
        .post(`/api/placement-test/sessions/${testSessionId}/responses`)
        .set('Authorization', authToken)
        .send(b2LevelResponse);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const evaluation = response.body.evaluation;
      expect(evaluation).toMatchObject({
        score: expect.any(Number),
        level: expect.stringMatching(/^[ABC][12]$/),
        confidence: expect.any(Number),
        feedback: expect.any(String)
      });

      // B2 level response should score appropriately
      expect(evaluation.score).toBeGreaterThanOrEqual(60);
      expect(evaluation.score).toBeLessThanOrEqual(100);
      expect(evaluation.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle different response types (text, audio, multiple choice)', async () => {
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const questionResponse = await request(server)
          .get(`/api/placement-test/sessions/${testSessionId}/next-question`)
          .set('Authorization', authToken);

        if (questionResponse.body.testCompleted) {
          break;
        }

        const question = questionResponse.body.question;
        let userResponse: any;

        // Handle different response types
        switch (question.responseType) {
          case 'text':
            userResponse = {
              text: "This is a sample text response demonstrating my language proficiency."
            };
            break;
          case 'multiple_choice':
            userResponse = {
              selectedOption: question.content?.options?.[0] || "Option A"
            };
            break;
          case 'audio':
            userResponse = {
              audioUrl: "mock-audio-url",
              transcript: "This is a transcribed audio response."
            };
            break;
          default:
            userResponse = { text: "Default response" };
        }

        const response = await request(server)
          .post(`/api/placement-test/sessions/${testSessionId}/responses`)
          .set('Authorization', authToken)
          .send({
            questionId: question.id,
            userResponse
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.evaluation).toBeDefined();

        if (response.body.testCompleted) {
          break;
        }

        attempts++;
      }
    });
  });

  describe('Test 3: Test Completion and Comprehensive Results', () => {
    it('should complete the placement test and provide comprehensive results', async () => {
      // Continue submitting responses until test completes
      let completed = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!completed && attempts < maxAttempts) {
        const questionResponse = await request(server)
          .get(`/api/placement-test/sessions/${testSessionId}/next-question`)
          .set('Authorization', authToken);

        if (questionResponse.body.testCompleted) {
          completed = true;
          
          // Verify comprehensive results structure
          const results = questionResponse.body.results;
          expect(results).toMatchObject({
            overallLevel: expect.stringMatching(/^[ABC][12]$/),
            skillLevels: {
              speaking: expect.stringMatching(/^[ABC][12]$/),
              listening: expect.stringMatching(/^[ABC][12]$/),
              reading: expect.stringMatching(/^[ABC][12]$/),
              writing: expect.stringMatching(/^[ABC][12]$/)
            },
            scores: {
              overall: expect.any(Number),
              speaking: expect.any(Number),
              listening: expect.any(Number),
              reading: expect.any(Number),
              writing: expect.any(Number)
            },
            strengths: expect.any(Array),
            recommendations: expect.any(Array),
            confidence: expect.any(Number)
          });

          // Verify all scores are within valid range
          Object.values(results.scores).forEach(score => {
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          });

          break;
        }

        const question = questionResponse.body.question;
        if (!question) break;

        // Submit response to continue test
        const response = await request(server)
          .post(`/api/placement-test/sessions/${testSessionId}/responses`)
          .set('Authorization', authToken)
          .send({
            questionId: question.id,
            userResponse: { text: "Sample response to continue test progression" }
          });

        if (response.body.testCompleted) {
          completed = true;
        }

        attempts++;
      }

      expect(completed).toBe(true);
    });

    it('should provide detailed results when queried separately', async () => {
      const response = await request(server)
        .get(`/api/placement-test/sessions/${testSessionId}/results`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const results = response.body.results;
      expect(results).toMatchObject({
        sessionId: testSessionId,
        completedAt: expect.any(String),
        overallLevel: expect.stringMatching(/^[ABC][12]$/),
        skillLevels: expect.objectContaining({
          speaking: expect.any(String),
          listening: expect.any(String),
          reading: expect.any(String),
          writing: expect.any(String)
        }),
        scores: expect.objectContaining({
          overall: expect.any(Number),
          speaking: expect.any(Number),
          listening: expect.any(Number),
          reading: expect.any(Number),
          writing: expect.any(Number)
        }),
        analysis: expect.objectContaining({
          strengths: expect.any(Array),
          weaknesses: expect.any(Array),
          recommendations: expect.any(Array),
          confidenceScore: expect.any(Number)
        }),
        testDuration: expect.any(Number)
      });

      // Verify confidence score is reasonable
      expect(results.analysis.confidenceScore).toBeGreaterThanOrEqual(30);
      expect(results.analysis.confidenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Test 4: AI Roadmap Generation from Placement Results', () => {
    it('should generate personalized AI roadmap based on placement results', async () => {
      const roadmapRequest = {
        sessionId: testSessionId,
        learningGoals: ['ielts', 'academic_writing', 'business_communication'],
        timeAvailability: 8,
        preferredPace: 'normal' as const,
        focusAreas: ['writing', 'speaking']
      };

      const response = await request(server)
        .post(`/api/placement-test/sessions/${testSessionId}/generate-roadmap`)
        .set('Authorization', authToken)
        .send(roadmapRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const roadmapData = response.body.roadmap;
      expect(roadmapData).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        estimatedWeeks: expect.any(Number),
        weeklyHours: roadmapRequest.timeAvailability,
        totalMilestones: expect.any(Number),
        totalSteps: expect.any(Number),
        estimatedCompletion: expect.any(String),
        personalizedRecommendations: expect.any(Array)
      });

      // Verify milestones structure
      const milestones = response.body.milestones;
      expect(milestones).toBeInstanceOf(Array);
      expect(milestones.length).toBeGreaterThan(0);
      
      milestones.forEach((milestone: any) => {
        expect(milestone).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String),
          weekNumber: expect.any(Number),
          primarySkill: expect.oneOf(['speaking', 'listening', 'reading', 'writing']),
          secondarySkills: expect.any(Array)
        });
      });

      // Verify roadmap considers placement test weaknesses
      expect(roadmapData.personalizedRecommendations.length).toBeGreaterThan(0);
      expect(roadmapData.estimatedWeeks).toBeGreaterThan(0);
      expect(roadmapData.totalMilestones).toBeGreaterThanOrEqual(4);
      expect(roadmapData.totalSteps).toBeGreaterThan(roadmapData.totalMilestones);
    });

    it('should create user enrollment in generated roadmap', async () => {
      // Verify the user is enrolled in the roadmap
      const userResponse = await request(server)
        .get('/api/users/profile')
        .set('Authorization', authToken);

      expect(userResponse.status).toBe(200);
      
      // Check placement test session has roadmap ID
      const resultsResponse = await request(server)
        .get(`/api/placement-test/sessions/${testSessionId}/results`)
        .set('Authorization', authToken);

      expect(resultsResponse.body.results.generatedRoadmapId).toBeDefined();
      expect(typeof resultsResponse.body.results.generatedRoadmapId).toBe('number');
    });

    it('should adapt roadmap based on different learning preferences', async () => {
      // Test with different preferences
      const fastPaceRequest = {
        sessionId: testSessionId,
        learningGoals: ['general'],
        timeAvailability: 15, // More intensive
        preferredPace: 'fast' as const,
        focusAreas: ['speaking']
      };

      const response = await request(server)
        .post(`/api/placement-test/sessions/${testSessionId}/generate-roadmap`)
        .set('Authorization', authToken)
        .send(fastPaceRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const roadmap = response.body.roadmap;
      
      // Fast pace with more time should result in shorter completion time
      expect(roadmap.weeklyHours).toBe(15);
      expect(roadmap.estimatedWeeks).toBeGreaterThan(0);
      
      // Should prioritize speaking based on focus areas
      const milestones = response.body.milestones;
      const speakingMilestones = milestones.filter((m: any) => m.primarySkill === 'speaking');
      expect(speakingMilestones.length).toBeGreaterThan(0);
    });

    it('should provide placement test history for user', async () => {
      const response = await request(server)
        .get('/api/placement-test/history')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const sessions = response.body.sessions;
      expect(sessions).toBeInstanceOf(Array);
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      
      const currentSession = sessions.find((s: any) => s.id === testSessionId);
      expect(currentSession).toBeDefined();
      expect(currentSession).toMatchObject({
        id: testSessionId,
        targetLanguage: 'english',
        learningGoal: expect.any(String),
        status: 'completed',
        startedAt: expect.any(String),
        completedAt: expect.any(String),
        overallLevel: expect.stringMatching(/^[ABC][12]$/),
        overallScore: expect.any(Number),
        generatedRoadmapId: expect.any(Number)
      });
    });
  });
});