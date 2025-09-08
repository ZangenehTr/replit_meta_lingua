import { vi, beforeEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock OpenAI to prevent browser environment issues
vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor() {}
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                level: 'B2',
                score: 75,
                confidence: 0.8,
                feedback: 'Good language proficiency demonstrated'
              })
            }
          }]
        })
      }
    }
  }
}));

// Mock Ollama service for placement tests
vi.mock('../server/ollama-service', () => ({
  ollamaService: {
    async generateResponse() {
      return JSON.stringify({
        level: 'B2',
        score: 75,
        confidence: 0.8,
        evaluation: 'Good response quality'
      });
    },
    async isServiceAvailable() { return true; },
    async isAvailable() { return true; }
  },
  OllamaService: class MockOllamaService {
    constructor() {}
    async generateResponse() {
      return JSON.stringify({
        level: 'B2',
        score: 75,
        confidence: 0.8,
        evaluation: 'Good response quality'
      });
    }
    async isServiceAvailable() { return true; }
    async isAvailable() { return true; }
  }
}));

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks();
});