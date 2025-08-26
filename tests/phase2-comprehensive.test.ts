import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../server/db';
import { aiCallInsights, leads, communicationLogs } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { persianNLPService } from '../server/persian-nlp-service';
import { realtimeCallProcessor } from '../server/realtime-call-processor';
import { knowledgeBaseService } from '../server/knowledge-base-service';
import { ollamaService } from '../server/ollama-service';

describe('Phase 2: Persian Language & Real-time Processing Tests', () => {
  let app: express.Application;
  
  beforeEach(async () => {
    // Clean up test data
    await db.delete(aiCallInsights).execute();
    await db.delete(communicationLogs).execute();
    
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Mock auth middleware for testing
    app.use((req: any, res, next) => {
      req.user = { id: 1, email: 'test@example.com' };
      next();
    });
    
    // Register Phase 2 routes
    const { registerPhase2AIRoutes } = await import('../server/ai-phase2-routes');
    registerPhase2AIRoutes(app);
  });
  
  afterEach(async () => {
    // Clean up test data
    await db.delete(aiCallInsights).execute();
    await db.delete(communicationLogs).execute();
    
    // Clean up active sessions
    realtimeCallProcessor.destroy();
  });
  
  describe('Persian NLP Service Tests', () => {
    describe('Language Detection', () => {
      it('should detect Persian language correctly', () => {
        const persianText = 'سلام من دنبال یادگیری زبان انگلیسی هستم';
        const result = persianNLPService.detectLanguage(persianText);
        expect(result).toBe('fa');
      });
      
      it('should detect English language correctly', () => {
        const englishText = 'Hello I want to learn Persian language';
        const result = persianNLPService.detectLanguage(englishText);
        expect(result).toBe('en');
      });
      
      it('should detect mixed language correctly', () => {
        const mixedText = 'سلام I need help with IELTS آیا می‌توانید کمک کنید؟';
        const result = persianNLPService.detectLanguage(mixedText);
        expect(result).toBe('mixed');
      });
    });
    
    describe('Entity Extraction', () => {
      it('should extract Iranian phone numbers', () => {
        const text = 'شماره من 09121234567 است و شماره دفتر +989351234567 می‌باشد';
        const entities = persianNLPService.extractEntities(text);
        
        expect(entities.phoneNumbers).toHaveLength(2);
        expect(entities.phoneNumbers).toContain('09121234567');
        expect(entities.phoneNumbers).toContain('+989351234567');
      });
      
      it('should extract emails', () => {
        const text = 'ایمیل من test@example.com است. لطفا به info@metalingua.ir ایمیل بزنید';
        const entities = persianNLPService.extractEntities(text);
        
        expect(entities.emails).toHaveLength(2);
        expect(entities.emails).toContain('test@example.com');
        expect(entities.emails).toContain('info@metalingua.ir');
      });
      
      it('should extract language mentions in Persian', () => {
        const text = 'من می‌خواهم انگلیسی و فرانسه یاد بگیرم. آلمانی هم جالب است';
        const entities = persianNLPService.extractEntities(text);
        
        expect(entities.languages).toContain('انگلیسی');
        expect(entities.languages).toContain('فرانسه');
        expect(entities.languages).toContain('آلمانی');
      });
      
      it('should extract course types in Persian', () => {
        const text = 'برای آیلتس نیاز دارم و همچنین کلاس مکالمه و گرامر';
        const entities = persianNLPService.extractEntities(text);
        
        expect(entities.courses).toContain('آیلتس');
        expect(entities.courses).toContain('مکالمه');
        expect(entities.courses).toContain('گرامر');
      });
      
      it('should extract levels in Persian', () => {
        const text = 'من مبتدی هستم و می‌خواهم به سطح متوسط برسم';
        const entities = persianNLPService.extractEntities(text);
        
        expect(entities.levels).toContain('beginner');
        expect(entities.levels).toContain('intermediate');
      });
    });
    
    describe('Intent Detection', () => {
      it('should detect enrollment intent in Persian', () => {
        const text = 'می‌خواهم ثبت نام کنم برای دوره انگلیسی';
        const intent = persianNLPService.detectIntent(text);
        expect(intent).toBe('enrollment');
      });
      
      it('should detect information seeking intent', () => {
        const text = 'قیمت کلاس‌ها چقدر است؟ اطلاعات بیشتر می‌خواهم';
        const intent = persianNLPService.detectIntent(text);
        expect(intent).toBe('information');
      });
      
      it('should detect payment intent', () => {
        const text = 'چطور می‌توانم پرداخت کنم؟ آیا تخفیف دارید؟';
        const intent = persianNLPService.detectIntent(text);
        expect(intent).toBe('payment');
      });
      
      it('should detect schedule intent', () => {
        const text = 'زمان کلاس‌ها چه روزهایی است؟ برنامه هفتگی را می‌خواهم';
        const intent = persianNLPService.detectIntent(text);
        expect(intent).toBe('schedule');
      });
    });
    
    describe('Text Analysis', () => {
      it('should analyze Persian text comprehensively', async () => {
        const text = 'سلام، من علاقه‌مند به یادگیری زبان انگلیسی هستم. آیا دوره‌های آیلتس دارید؟ قیمت چقدر است؟';
        const analysis = await persianNLPService.analyzeText(text);
        
        expect(analysis.language).toBe('fa');
        expect(analysis.intent).toBe('information');
        expect(analysis.entities.languages).toContain('انگلیسی');
        expect(analysis.entities.courses).toContain('آیلتس');
        expect(analysis.keywords).toHaveLength(10);
        expect(analysis.summary).toBeTruthy();
      });
      
      it('should analyze English text', async () => {
        const text = 'I want to enroll in IELTS preparation course. When do classes start?';
        const analysis = await persianNLPService.analyzeText(text);
        
        expect(analysis.language).toBe('en');
        expect(analysis.intent).toBe('enrollment');
        expect(analysis.entities.courses).toContain('IELTS');
      });
    });
    
    describe('Lead Scoring', () => {
      it('should score high for positive engagement in Persian', async () => {
        const conversationText = `سلام، من خیلی علاقه‌مند هستم که ثبت نام کنم.
        می‌خواهم هرچه زودتر شروع کنم. این هفته می‌توانم بیایم.
        قیمت مشکلی نیست. لطفاً اطلاعات ثبت نام را بفرستید.`;
        
        const score = await persianNLPService.scoreLead(conversationText, {
          callDuration: 300,
          previousInteractions: 2
        });
        
        expect(score.overallScore).toBeGreaterThan(70);
        expect(score.recommendation).toMatch(/hot|warm/);
        expect(score.purchaseIntent).toBeGreaterThan(60);
        expect(score.urgency).toBeGreaterThan(60);
      });
      
      it('should score lower for hesitant leads', async () => {
        const conversationText = `نمی‌دانم. باید فکر کنم. 
        قیمت کمی گران است. شاید بعداً.`;
        
        const score = await persianNLPService.scoreLead(conversationText);
        
        expect(score.overallScore).toBeLessThan(50);
        expect(score.recommendation).toMatch(/nurture|cold/);
        expect(score.budget).toBeLessThan(50);
      });
      
      it('should consider call duration in scoring', async () => {
        const text = 'می‌خواهم اطلاعات بیشتری بگیرم';
        
        const shortCallScore = await persianNLPService.scoreLead(text, {
          callDuration: 60
        });
        
        const longCallScore = await persianNLPService.scoreLead(text, {
          callDuration: 600
        });
        
        expect(longCallScore.engagementLevel).toBeGreaterThan(shortCallScore.engagementLevel);
      });
    });
  });
  
  describe('Real-time Call Processing Tests', () => {
    describe('Session Management', () => {
      it('should start a new call session', async () => {
        // Create test lead
        const testLead = await db.insert(leads).values({
          firstName: 'محمد',
          lastName: 'رضایی',
          phoneNumber: '+989121234567',
          email: 'mohammad@example.com',
          source: 'test',
          status: 'new',
          priority: 'medium',
          level: 'beginner',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        const session = await realtimeCallProcessor.startSession({
          sessionId: 'test-session-1',
          callId: 'test-call-1',
          leadId: testLead.id,
          agentId: 1
        });
        
        expect(session.sessionId).toBe('test-session-1');
        expect(session.status).toBe('active');
        expect(session.language).toBe('fa');
        expect(session.leadId).toBe(testLead.id);
      });
      
      it('should process audio chunks', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'علی',
          lastName: 'احمدی',
          phoneNumber: '+989351234567',
          email: 'ali@example.com',
          source: 'test',
          status: 'new',
          priority: 'medium',
          level: 'intermediate',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        const session = await realtimeCallProcessor.startSession({
          sessionId: 'test-session-2',
          callId: 'test-call-2',
          leadId: testLead.id,
          agentId: 1
        });
        
        // Simulate audio chunks
        const audioChunk = {
          sessionId: 'test-session-2',
          data: Buffer.from('fake-audio-data'),
          timestamp: Date.now(),
          speaker: 'lead' as const
        };
        
        await realtimeCallProcessor.processAudioChunk(audioChunk);
        
        const activeSession = realtimeCallProcessor.getSession('test-session-2');
        expect(activeSession).toBeDefined();
        expect(activeSession?.status).toBe('active');
      });
      
      it('should end session and calculate final score', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'سارا',
          lastName: 'محمدی',
          phoneNumber: '+989121111111',
          email: 'sara@example.com',
          source: 'test',
          status: 'new',
          priority: 'low',
          level: 'advanced',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        const session = await realtimeCallProcessor.startSession({
          sessionId: 'test-session-3',
          callId: 'test-call-3',
          leadId: testLead.id,
          agentId: 1
        });
        
        // End session
        await realtimeCallProcessor.endSession('test-session-3');
        
        // Verify session is no longer active
        const endedSession = realtimeCallProcessor.getSession('test-session-3');
        expect(endedSession).toBeUndefined();
        
        // Check if AI insights were stored
        const insights = await db.select()
          .from(aiCallInsights)
          .where(eq(aiCallInsights.callId, 'test-call-3'));
        
        expect(insights).toHaveLength(1);
        expect(insights[0].leadId).toBe(testLead.id);
      });
    });
    
    describe('Real-time Insights', () => {
      it('should generate real-time insights during call', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'مریم',
          lastName: 'کریمی',
          phoneNumber: '+989122222222',
          email: 'maryam@example.com',
          source: 'test',
          status: 'new',
          priority: 'medium',
          level: 'beginner',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        const session = await realtimeCallProcessor.startSession({
          sessionId: 'test-session-insights',
          callId: 'test-call-insights',
          leadId: testLead.id,
          agentId: 1
        });
        
        expect(session.insights).toBeDefined();
        expect(session.insights.currentSentiment).toBe('neutral');
        expect(session.insights.engagementLevel).toBe(50);
        expect(session.insights.leadScore).toBe(50);
        expect(session.insights.nextBestAction).toBeTruthy();
      });
    });
  });
  
  describe('Knowledge Base RAG Tests', () => {
    describe('Document Management', () => {
      it('should add document to knowledge base', async () => {
        const doc = {
          id: 'test-doc-1',
          title: 'تست مدرک',
          content: 'این یک مدرک تستی برای بررسی سیستم RAG است',
          language: 'fa' as const,
          category: 'test',
          tags: ['تست', 'RAG'],
          metadata: {
            source: 'test',
            author: 'test-suite',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        
        await knowledgeBaseService.addDocument(doc);
        
        const retrieved = knowledgeBaseService.getDocument('test-doc-1');
        expect(retrieved).toBeDefined();
        expect(retrieved?.title).toBe('تست مدرک');
        expect(retrieved?.language).toBe('fa');
      });
      
      it('should search documents in Persian', async () => {
        // Add test documents
        await knowledgeBaseService.addDocument({
          id: 'search-test-1',
          title: 'دوره آیلتس',
          content: 'آموزش جامع آیلتس برای دانشجویان',
          language: 'fa',
          category: 'courses',
          tags: ['آیلتس', 'آزمون'],
          metadata: {
            source: 'test',
            author: 'test',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        const results = await knowledgeBaseService.searchDocuments('آیلتس', {
          language: 'fa',
          limit: 5
        });
        
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].document.title).toContain('آیلتس');
        expect(results[0].score).toBeGreaterThan(0);
        expect(results[0].snippet).toBeTruthy();
      });
      
      it('should search documents in English', async () => {
        const results = await knowledgeBaseService.searchDocuments('IELTS preparation', {
          language: 'en',
          limit: 5
        });
        
        // Knowledge base has pre-loaded English documents
        expect(results.length).toBeGreaterThan(0);
      });
      
      it('should filter by category', async () => {
        const results = await knowledgeBaseService.searchDocuments('course', {
          category: 'courses',
          limit: 10
        });
        
        results.forEach(result => {
          expect(result.document.category).toBe('courses');
        });
      });
    });
    
    describe('RAG Response Generation', () => {
      it('should generate RAG response in Persian', async () => {
        const response = await knowledgeBaseService.generateRAGResponse(
          'قیمت دوره آیلتس چقدر است؟',
          { preferredLanguage: 'fa' }
        );
        
        expect(response.language).toBe('fa');
        expect(response.answer).toBeTruthy();
        expect(response.confidence).toBeGreaterThan(0);
        expect(response.sources).toBeDefined();
      });
      
      it('should generate RAG response in English', async () => {
        const response = await knowledgeBaseService.generateRAGResponse(
          'What is the Callern service?',
          { preferredLanguage: 'en' }
        );
        
        expect(response.language).toBe('en');
        expect(response.answer).toBeTruthy();
        expect(response.sources.length).toBeGreaterThan(0);
      });
      
      it('should handle queries with no matching documents', async () => {
        const response = await knowledgeBaseService.generateRAGResponse(
          'موضوع کاملاً نامربوط که در پایگاه دانش وجود ندارد',
          { preferredLanguage: 'fa' }
        );
        
        expect(response.confidence).toBeLessThan(0.5);
        expect(response.answer).toContain('متأسفانه');
      });
    });
  });
  
  describe('API Endpoint Tests', () => {
    describe('Persian NLP API', () => {
      it('should analyze text via API', async () => {
        const response = await request(app)
          .post('/api/ai/analyze-text')
          .send({ text: 'سلام، من می‌خواهم انگلیسی یاد بگیرم' });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.analysis.language).toBe('fa');
        expect(response.body.analysis.entities).toBeDefined();
      });
      
      it('should score lead via API', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'API',
          lastName: 'Test',
          phoneNumber: '+989123456789',
          email: 'api@test.com',
          source: 'api-test',
          status: 'new',
          priority: 'medium',
          level: 'beginner',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        const response = await request(app)
          .post('/api/ai/score-lead')
          .send({
            conversationText: 'می‌خواهم فوری ثبت نام کنم',
            leadId: testLead.id,
            callDuration: 180
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.scoring.overallScore).toBeDefined();
        expect(response.body.leadUpdated).toBe(true);
      });
      
      it('should detect language via API', async () => {
        const response = await request(app)
          .post('/api/ai/detect-language')
          .send({ text: 'این متن به زبان فارسی است' });
        
        expect(response.status).toBe(200);
        expect(response.body.language).toBe('fa');
        expect(response.body.confidence).toBeGreaterThan(0.8);
      });
    });
    
    describe('Real-time Call API', () => {
      it('should start session via API', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'RT',
          lastName: 'API',
          phoneNumber: '+989120000000',
          email: 'rt@api.com',
          source: 'api-test',
          status: 'new',
          priority: 'high',
          level: 'intermediate',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        const response = await request(app)
          .post('/api/ai/realtime/start-session')
          .send({
            sessionId: 'api-session-1',
            callId: 'api-call-1',
            leadId: testLead.id
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.session.sessionId).toBe('api-session-1');
        expect(response.body.session.status).toBe('active');
      });
      
      it('should process audio via API', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'Audio',
          lastName: 'Test',
          phoneNumber: '+989129999999',
          email: 'audio@test.com',
          source: 'api-test',
          status: 'new',
          priority: 'medium',
          level: 'beginner',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        // Start session first
        await realtimeCallProcessor.startSession({
          sessionId: 'audio-session',
          callId: 'audio-call',
          leadId: testLead.id,
          agentId: 1
        });
        
        const response = await request(app)
          .post('/api/ai/realtime/process-audio')
          .send({
            sessionId: 'audio-session',
            audioData: Buffer.from('test-audio').toString('base64'),
            speaker: 'agent'
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should get session status via API', async () => {
        const testLead = await db.insert(leads).values({
          firstName: 'Status',
          lastName: 'Check',
          phoneNumber: '+989128888888',
          email: 'status@check.com',
          source: 'api-test',
          status: 'new',
          priority: 'low',
          level: 'advanced',
          assignedTo: 1,
          createdAt: new Date()
        }).returning().then(rows => rows[0]);
        
        await realtimeCallProcessor.startSession({
          sessionId: 'status-session',
          callId: 'status-call',
          leadId: testLead.id,
          agentId: 1
        });
        
        const response = await request(app)
          .get('/api/ai/realtime/session/status-session');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.session.sessionId).toBe('status-session');
        expect(response.body.session.insights).toBeDefined();
      });
    });
    
    describe('Knowledge Base API', () => {
      it('should search knowledge base via API', async () => {
        const response = await request(app)
          .post('/api/ai/knowledge/search')
          .send({
            query: 'Callern',
            language: 'fa',
            limit: 3
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.results).toBeDefined();
        expect(Array.isArray(response.body.results)).toBe(true);
      });
      
      it('should get RAG answer via API', async () => {
        const response = await request(app)
          .post('/api/ai/knowledge/ask')
          .send({
            question: 'سرویس Callern چیست؟',
            preferredLanguage: 'fa'
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.answer).toBeTruthy();
        expect(response.body.language).toBe('fa');
        expect(response.body.confidence).toBeDefined();
      });
      
      it('should get document by ID via API', async () => {
        // First add a test document
        await knowledgeBaseService.addDocument({
          id: 'api-test-doc',
          title: 'API Test Document',
          content: 'Test content for API',
          language: 'en',
          category: 'test',
          tags: ['api', 'test'],
          metadata: {
            source: 'test',
            author: 'api-test',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        const response = await request(app)
          .get('/api/ai/knowledge/document/api-test-doc');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.document.id).toBe('api-test-doc');
        expect(response.body.document.title).toBe('API Test Document');
      });
      
      it('should add document via API', async () => {
        const response = await request(app)
          .post('/api/ai/knowledge/document')
          .send({
            title: 'دوره جدید',
            content: 'محتوای دوره جدید آموزش زبان',
            language: 'fa',
            category: 'courses',
            tags: ['جدید', 'دوره']
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.documentId).toBeTruthy();
      });
    });
  });
  
  describe('Integration Tests', () => {
    it('should handle complete call flow with Persian conversation', async () => {
      // Create lead
      const lead = await db.insert(leads).values({
        firstName: 'کامل',
        lastName: 'تست',
        phoneNumber: '+989127777777',
        email: 'complete@test.com',
        source: 'integration-test',
        status: 'new',
        priority: 'medium',
        level: 'beginner',
        assignedTo: 1,
        createdAt: new Date()
      }).returning().then(rows => rows[0]);
      
      // Start session
      const sessionResponse = await request(app)
        .post('/api/ai/realtime/start-session')
        .send({
          sessionId: 'integration-session',
          callId: 'integration-call',
          leadId: lead.id
        });
      
      expect(sessionResponse.status).toBe(200);
      
      // Process audio (simulated)
      const audioResponse = await request(app)
        .post('/api/ai/realtime/process-audio')
        .send({
          sessionId: 'integration-session',
          audioData: Buffer.from('audio').toString('base64'),
          speaker: 'lead'
        });
      
      expect(audioResponse.status).toBe(200);
      
      // End session
      const endResponse = await request(app)
        .post('/api/ai/realtime/end-session')
        .send({ sessionId: 'integration-session' });
      
      expect(endResponse.status).toBe(200);
      
      // Verify AI insights were created
      const insights = await db.select()
        .from(aiCallInsights)
        .where(eq(aiCallInsights.callId, 'integration-call'));
      
      expect(insights).toHaveLength(1);
      expect(insights[0].leadId).toBe(lead.id);
      
      // Verify communication log was created
      const logs = await db.select()
        .from(communicationLogs)
        .where(eq(communicationLogs.toParentId, lead.id));
      
      expect(logs.length).toBeGreaterThan(0);
    });
    
    it('should use NLP analysis to enhance RAG responses', async () => {
      const query = 'می‌خواهم برای آیلتس ثبت نام کنم. قیمت و زمان کلاس‌ها چگونه است؟';
      
      // First analyze the query
      const analysisResponse = await request(app)
        .post('/api/ai/analyze-text')
        .send({ text: query });
      
      expect(analysisResponse.body.analysis.entities.courses).toContain('آیلتس');
      expect(analysisResponse.body.analysis.intent).toBe('enrollment');
      
      // Then get RAG response
      const ragResponse = await request(app)
        .post('/api/ai/knowledge/ask')
        .send({
          question: query,
          preferredLanguage: 'fa'
        });
      
      expect(ragResponse.body.answer).toBeTruthy();
      expect(ragResponse.body.sources.length).toBeGreaterThan(0);
      
      // Sources should include relevant documents
      const relevantSource = ragResponse.body.sources.find(
        (s: any) => s.title.includes('آیلتس') || s.title.includes('قیمت')
      );
      expect(relevantSource).toBeDefined();
    });
    
    it('should update lead priority based on real-time scoring', async () => {
      // Create low priority lead
      const lead = await db.insert(leads).values({
        firstName: 'Priority',
        lastName: 'Update',
        phoneNumber: '+989126666666',
        email: 'priority@update.com',
        source: 'test',
        status: 'new',
        priority: 'low',
        level: 'beginner',
        assignedTo: 1,
        createdAt: new Date()
      }).returning().then(rows => rows[0]);
      
      // Score lead with high-intent conversation
      const scoringResponse = await request(app)
        .post('/api/ai/score-lead')
        .send({
          conversationText: `خیلی عجله دارم برای شروع.
          می‌خواهم همین امروز ثبت نام کنم.
          قیمت مهم نیست، فقط بهترین مدرس را می‌خواهم.
          لطفاً فوری ترتیب کلاس را بدهید.`,
          leadId: lead.id,
          callDuration: 420
        });
      
      expect(scoringResponse.body.scoring.overallScore).toBeGreaterThan(75);
      expect(scoringResponse.body.scoring.recommendation).toMatch(/hot|warm/);
      
      // Verify lead priority was updated
      const updatedLead = await db.select()
        .from(leads)
        .where(eq(leads.id, lead.id))
        .then(rows => rows[0]);
      
      expect(updatedLead.priority).toBe('high');
    });
  });
  
  describe('Error Handling Tests', () => {
    it('should handle missing required fields gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-text')
        .send({}); // Missing text field
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
    
    it('should handle invalid session ID', async () => {
      const response = await request(app)
        .get('/api/ai/realtime/session/non-existent-session');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
    
    it('should handle Ollama service unavailability', async () => {
      // Mock Ollama being unavailable
      vi.spyOn(ollamaService, 'isServiceAvailable').mockResolvedValue(false);
      
      const response = await request(app)
        .post('/api/ai/analyze-text')
        .send({ text: 'Test text when Ollama is down' });
      
      // Should still work with fallback
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      vi.restoreAllMocks();
    });
    
    it('should handle database errors gracefully', async () => {
      // Try to score a non-existent lead
      const response = await request(app)
        .post('/api/ai/score-lead')
        .send({
          conversationText: 'Test conversation',
          leadId: 999999, // Non-existent lead
          callDuration: 60
        });
      
      // Should handle the error gracefully
      expect(response.status).toBe(500);
      expect(response.body.error).toBeTruthy();
    });
  });
  
  describe('Performance Tests', () => {
    it('should process multiple concurrent sessions', async () => {
      const leads = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          return db.insert(leads).values({
            firstName: `Concurrent${i}`,
            lastName: 'Test',
            phoneNumber: `+98912000000${i}`,
            email: `concurrent${i}@test.com`,
            source: 'performance-test',
            status: 'new',
            priority: 'medium',
            level: 'beginner',
            assignedTo: 1,
            createdAt: new Date()
          }).returning().then(rows => rows[0]);
        })
      );
      
      // Start multiple sessions concurrently
      const sessionPromises = leads.map((lead, i) => 
        realtimeCallProcessor.startSession({
          sessionId: `perf-session-${i}`,
          callId: `perf-call-${i}`,
          leadId: lead.id,
          agentId: 1
        })
      );
      
      const sessions = await Promise.all(sessionPromises);
      
      expect(sessions).toHaveLength(5);
      sessions.forEach(session => {
        expect(session.status).toBe('active');
      });
      
      // Get all active sessions
      const activeSessions = realtimeCallProcessor.getActiveSessions();
      expect(activeSessions.length).toBeGreaterThanOrEqual(5);
    });
    
    it('should handle rapid text analysis requests', async () => {
      const texts = [
        'سلام من می‌خواهم انگلیسی یاد بگیرم',
        'Hello I want to learn Persian',
        'آیا کلاس آنلاین دارید؟',
        'What are your prices?',
        'می‌خواهم ثبت نام کنم'
      ];
      
      const analysisPromises = texts.map(text =>
        persianNLPService.analyzeText(text)
      );
      
      const results = await Promise.all(analysisPromises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.language).toBeDefined();
        expect(result.sentiment).toBeDefined();
        expect(result.intent).toBeDefined();
      });
    });
    
    it('should efficiently search large knowledge base', async () => {
      const startTime = Date.now();
      
      // Perform multiple searches
      const searchPromises = [
        knowledgeBaseService.searchDocuments('آیلتس', { limit: 10 }),
        knowledgeBaseService.searchDocuments('قیمت', { limit: 10 }),
        knowledgeBaseService.searchDocuments('Callern', { limit: 10 }),
        knowledgeBaseService.searchDocuments('enrollment', { limit: 10 }),
        knowledgeBaseService.searchDocuments('schedule', { limit: 10 })
      ];
      
      const results = await Promise.all(searchPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
      
      // Should complete within reasonable time (5 seconds for all searches)
      expect(duration).toBeLessThan(5000);
    });
  });
});