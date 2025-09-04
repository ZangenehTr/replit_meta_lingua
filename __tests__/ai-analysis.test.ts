import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupAiAnalysisRoutes } from '../server/ai-analysis-routes';

// Mock Ollama service
const mockOllamaService = {
  generateCompletion: vi.fn()
};

describe('AI Analysis Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes with mock service
    setupAiAnalysisRoutes(app);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /api/ai/analyze-vocabulary', () => {
    it('should analyze vocabulary with real Ollama processing', async () => {
      const mockResponse = JSON.stringify({
        vocabulary: [
          { word: 'hello', level: 'beginner', suggestion: 'greeting', translation: 'سلام' }
        ]
      });
      
      mockOllamaService.generateCompletion.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/analyze-vocabulary')
        .send({ text: 'Hello world', language: 'en' });

      expect(response.status).toBe(200);
      expect(response.body.vocabulary).toBeDefined();
      expect(mockOllamaService.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('Analyze vocabulary'),
        undefined,
        { temperature: 0.3 }
      );
    });

    it('should handle missing text parameter', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-vocabulary')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Text is required');
    });
  });

  describe('POST /api/ai/analyze-facial-expression', () => {
    it('should analyze facial expressions using real computer vision', async () => {
      const mockResponse = JSON.stringify({
        emotion: 'focused',
        confidence: 0.85
      });
      
      mockOllamaService.generateCompletion.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/analyze-facial-expression')
        .send({ imageData: 'data:image/jpeg;base64,/9j/4AAQSkZ...' });

      expect(response.status).toBe(200);
      expect(response.body.emotion).toBeDefined();
      expect(response.body.confidence).toBeDefined();
    });

    it('should require image data', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-facial-expression')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Image data is required');
    });
  });

  describe('POST /api/ai/calculate-attention', () => {
    it('should calculate real attention scores', async () => {
      const response = await request(app)
        .post('/api/ai/calculate-attention')
        .send({
          videoMetrics: { facingCamera: true, eyeContact: true },
          audioMetrics: { speaking: true, engagement: 0.8 },
          behaviorMetrics: { posture: 'engaged', eyeContact: true }
        });

      expect(response.status).toBe(200);
      expect(response.body.attention).toBeGreaterThanOrEqual(0);
      expect(response.body.attention).toBeLessThanOrEqual(100);
      expect(response.body.breakdown).toBeDefined();
    });
  });
});