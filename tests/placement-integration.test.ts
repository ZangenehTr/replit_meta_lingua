import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index';
import type { Server } from 'http';

describe('Placement Test Integration Tests', () => {
  let server: Server;
  let authToken: string;

  beforeAll(async () => {
    server = await createServer();
    
    // Create test user
    const authResponse = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'integration.test@example.com',
        password: 'testpass123',
        firstName: 'Integration',
        lastName: 'Tester',
        role: 'Student'
      });
    
    authToken = `Bearer ${authResponse.body.token}`;
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('End-to-End Placement Test Flow', () => {
    it('should complete full placement test workflow and generate roadmap', async () => {
      // 1. Start placement test
      const startResponse = await request(server)
        .post('/api/placement-test/start')
        .set('Authorization', authToken)
        .send({
          targetLanguage: 'english',
          learningGoal: 'business',
          timeAvailability: 10
        });

      expect(startResponse.status).toBe(200);
      const sessionId = startResponse.body.session.id;

      // 2. Complete test with realistic responses
      const responses = [
        {
          text: "I have been working in international business for several years, and I believe that effective communication across cultures is absolutely essential for success. In my experience, companies that invest in language training for their employees tend to perform better in global markets."
        },
        {
          text: "The global economy has become increasingly interconnected, which presents both opportunities and challenges. While businesses can now reach customers worldwide, they also face more intense competition and must navigate complex regulatory environments."
        },
        {
          text: "Digital transformation has revolutionized how we conduct business. From e-commerce platforms to remote collaboration tools, technology has enabled companies to operate more efficiently and reach new markets that were previously inaccessible."
        },
        {
          text: "Sustainability has become a critical consideration in modern business strategy. Companies are realizing that environmental responsibility is not just ethically important, but also financially beneficial in the long term."
        }
      ];

      let currentResponse = 0;
      let testCompleted = false;
      let attempts = 0;
      const maxAttempts = 15;

      while (!testCompleted && attempts < maxAttempts) {
        const questionResponse = await request(server)
          .get(`/api/placement-test/sessions/${sessionId}/next-question`)
          .set('Authorization', authToken);

        if (questionResponse.body.testCompleted) {
          testCompleted = true;
          break;
        }

        const question = questionResponse.body.question;
        if (!question) break;

        const userResponse = responses[currentResponse % responses.length];
        currentResponse++;

        const submitResponse = await request(server)
          .post(`/api/placement-test/sessions/${sessionId}/responses`)
          .set('Authorization', authToken)
          .send({
            questionId: question.id,
            userResponse
          });

        expect(submitResponse.status).toBe(200);
        
        if (submitResponse.body.testCompleted) {
          testCompleted = true;
        }

        attempts++;
      }

      expect(testCompleted).toBe(true);

      // 3. Get comprehensive results
      const resultsResponse = await request(server)
        .get(`/api/placement-test/sessions/${sessionId}/results`)
        .set('Authorization', authToken);

      expect(resultsResponse.status).toBe(200);
      const results = resultsResponse.body.results;
      
      expect(results.overallLevel).toMatch(/^[ABC][12]$/);
      expect(results.scores.overall).toBeGreaterThanOrEqual(50);
      expect(results.analysis.recommendations.length).toBeGreaterThan(0);

      // 4. Generate AI roadmap based on results
      const roadmapResponse = await request(server)
        .post(`/api/placement-test/sessions/${sessionId}/generate-roadmap`)
        .set('Authorization', authToken)
        .send({
          learningGoals: ['business', 'presentation_skills'],
          timeAvailability: 10,
          preferredPace: 'normal',
          focusAreas: ['speaking', 'writing']
        });

      expect(roadmapResponse.status).toBe(200);
      expect(roadmapResponse.body.success).toBe(true);
      
      const roadmap = roadmapResponse.body.roadmap;
      expect(roadmap.id).toBeDefined();
      expect(roadmap.title).toContain('Business');
      expect(roadmap.estimatedWeeks).toBeGreaterThan(8);
      expect(roadmap.weeklyHours).toBe(10);
      
      const milestones = roadmapResponse.body.milestones;
      expect(milestones.length).toBeGreaterThanOrEqual(4);
      expect(milestones.length).toBeLessThanOrEqual(8);

      // Verify business focus
      const businessMilestones = milestones.filter((m: any) => 
        m.title.toLowerCase().includes('business') || 
        m.description.toLowerCase().includes('business')
      );
      expect(businessMilestones.length).toBeGreaterThan(0);

      console.log('✅ Full placement test workflow completed successfully');
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Overall Level: ${results.overallLevel}`);
      console.log(`   Overall Score: ${results.scores.overall}%`);
      console.log(`   Roadmap ID: ${roadmap.id}`);
      console.log(`   Milestones Created: ${milestones.length}`);
    });

    it('should handle multiple placement tests for same user', async () => {
      // Create second placement test for different goal
      const startResponse = await request(server)
        .post('/api/placement-test/start')
        .set('Authorization', authToken)
        .send({
          targetLanguage: 'english',
          learningGoal: 'ielts',
          timeAvailability: 6
        });

      expect(startResponse.status).toBe(200);
      const sessionId = startResponse.body.session.id;

      // Quick completion with focused IELTS responses
      const ieltsResponses = [
        {
          text: "In my opinion, the advantages of studying abroad significantly outweigh the disadvantages. Firstly, students gain exposure to different cultures and perspectives, which broadens their worldview. Secondly, they develop independence and problem-solving skills that are valuable throughout their lives."
        },
        {
          text: "The graph shows a clear upward trend in renewable energy adoption from 2010 to 2020. Solar power experienced the most dramatic increase, rising from 15% to 45% of total renewable capacity. Wind power also grew substantially, while hydroelectric power remained relatively stable."
        }
      ];

      let attempts = 0;
      let testCompleted = false;
      const maxAttempts = 10;

      while (!testCompleted && attempts < maxAttempts) {
        const questionResponse = await request(server)
          .get(`/api/placement-test/sessions/${sessionId}/next-question`)
          .set('Authorization', authToken);

        if (questionResponse.body.testCompleted) {
          testCompleted = true;
          break;
        }

        const question = questionResponse.body.question;
        if (!question) break;

        const userResponse = ieltsResponses[attempts % ieltsResponses.length];

        const submitResponse = await request(server)
          .post(`/api/placement-test/sessions/${sessionId}/responses`)
          .set('Authorization', authToken)
          .send({
            questionId: question.id,
            userResponse: { text: userResponse.text }
          });

        if (submitResponse.body.testCompleted) {
          testCompleted = true;
        }

        attempts++;
      }

      expect(testCompleted).toBe(true);

      // Generate IELTS-focused roadmap
      const roadmapResponse = await request(server)
        .post(`/api/placement-test/sessions/${sessionId}/generate-roadmap`)
        .set('Authorization', authToken)
        .send({
          learningGoals: ['ielts', 'academic_writing'],
          timeAvailability: 6,
          preferredPace: 'normal',
          focusAreas: ['writing', 'reading']
        });

      expect(roadmapResponse.status).toBe(200);
      const roadmap = roadmapResponse.body.roadmap;
      
      expect(roadmap.title.toUpperCase()).toContain('IELTS');
      expect(roadmap.weeklyHours).toBe(6);

      // Verify user has multiple test sessions in history
      const historyResponse = await request(server)
        .get('/api/placement-test/history')
        .set('Authorization', authToken);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.sessions.length).toBeGreaterThanOrEqual(2);

      const businessSession = historyResponse.body.sessions.find((s: any) => s.learningGoal === 'business');
      const ieltsSession = historyResponse.body.sessions.find((s: any) => s.learningGoal === 'ielts');

      expect(businessSession).toBeDefined();
      expect(ieltsSession).toBeDefined();
      expect(businessSession.generatedRoadmapId).toBeDefined();
      expect(ieltsSession.generatedRoadmapId).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid session access', async () => {
      const invalidSessionId = 99999;

      const response = await request(server)
        .get(`/api/placement-test/sessions/${invalidSessionId}/next-question`)
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/placement-test/start', body: {} },
        { method: 'get', path: '/api/placement-test/sessions/1/next-question' },
        { method: 'post', path: '/api/placement-test/sessions/1/responses', body: {} },
        { method: 'get', path: '/api/placement-test/sessions/1/results' },
        { method: 'post', path: '/api/placement-test/sessions/1/generate-roadmap', body: {} },
        { method: 'get', path: '/api/placement-test/history' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(server)[endpoint.method](endpoint.path).send(endpoint.body || {});
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('token required');
      }
    });

    it('should validate request data', async () => {
      // Test invalid start request
      const invalidStartResponse = await request(server)
        .post('/api/placement-test/start')
        .set('Authorization', authToken)
        .send({
          targetLanguage: '', // Invalid empty language
          timeAvailability: 0 // Invalid time
        });

      expect(invalidStartResponse.status).toBe(400);

      // Test with valid data for comparison
      const validStartResponse = await request(server)
        .post('/api/placement-test/start')
        .set('Authorization', authToken)
        .send({
          targetLanguage: 'english',
          learningGoal: 'general',
          timeAvailability: 5
        });

      expect(validStartResponse.status).toBe(200);
    });
  });
});