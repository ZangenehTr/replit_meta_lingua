// ============================================================================
// COMPREHENSIVE TEST SETUP FOR ANALYTICS TESTING SUITE
// ============================================================================
// Enhanced setup for unit tests, integration tests, UI tests, and health monitoring

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';

// ============================================================================
// GLOBAL TEST ENVIRONMENT SETUP
// ============================================================================

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.OLLAMA_API_URL = 'http://localhost:11434';
process.env.OPENAI_API_KEY = 'test-openai-key';

// ============================================================================
// ENHANCED API MOCKING
// ============================================================================

// Enhanced fetch mock for comprehensive API testing
interface MockFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

const createMockResponse = (data: any, status = 200): MockFetchResponse => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Headers({
    'Content-Type': 'application/json',
    'X-RateLimit-Remaining': '95',
    'X-RateLimit-Limit': '100'
  }),
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data))
});

// Store original fetch for conditional mocking
const originalFetch = global.fetch;

// Export utility functions for conditional mocking
export const mockFetch = (mockImplementation?: any) => {
  global.fetch = vi.fn(mockImplementation || (() => Promise.resolve(createMockResponse({ error: 'Not found' }, 404))));
};

export const restoreFetch = () => {
  global.fetch = originalFetch;
};

// Global fetch mock with intelligent response handling (can be disabled per test)
global.fetch = vi.fn().mockImplementation((url: string | URL, options?: RequestInit) => {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Health monitoring endpoints
  if (urlString.includes('/health')) {
    return Promise.resolve(createMockResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: [],
      uptime: 12345
    }));
  }
  
  // Analytics endpoints
  if (urlString.includes('/analytics/')) {
    return Promise.resolve(createMockResponse({
      success: true,
      data: {
        totalLessons: 25,
        completionRate: 0.85,
        averageScore: 78.5,
        progressTrend: 'improving'
      }
    }));
  }
  
  // AI insights endpoints
  if (urlString.includes('/insights/')) {
    return Promise.resolve(createMockResponse({
      success: true,
      data: {
        summary: 'Student shows good progress',
        strengths: ['vocabulary', 'listening'],
        recommendations: ['focus on grammar']
      }
    }));
  }
  
  // Ollama service check
  if (urlString.includes('localhost:11434')) {
    return Promise.resolve(createMockResponse({ models: ['llama2'] }));
  }
  
  // Default fallback
  return Promise.resolve(createMockResponse({ error: 'Not found' }, 404));
});

// ============================================================================
// ENHANCED SERVICE MOCKING
// ============================================================================

// Mock OpenAI with comprehensive error handling
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
                feedback: 'Good language proficiency demonstrated',
                insights: {
                  strengths: ['vocabulary', 'pronunciation'],
                  improvements: ['grammar', 'fluency'],
                  recommendations: ['Practice daily conversation', 'Focus on complex sentence structures']
                }
              })
            }
          }]
        })
      }
    }
  }
}));

// Enhanced Ollama service mock
vi.mock('../server/ollama-service', () => ({
  ollamaService: {
    async generateResponse(prompt: string) {
      return JSON.stringify({
        level: 'B2',
        score: 75 + Math.floor(Math.random() * 20),
        confidence: 0.8,
        evaluation: 'Good response quality',
        analysis: {
          fluency: 78,
          vocabulary: 82,
          grammar: 71,
          pronunciation: 75
        }
      });
    },
    async isServiceAvailable() { return true; },
    async isAvailable() { return true; },
    async generateStudentInsights(data: any, language: string) {
      return {
        summary: `Student demonstrates ${language === 'fa' ? 'پیشرفت خوبی' : 'good progress'} in language learning`,
        strengths: ['vocabulary building', 'listening comprehension'],
        improvementAreas: ['grammar accuracy', 'speaking fluency'],
        culturalContext: language === 'fa' ? 'iranian' : 'general'
      };
    }
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

// Mock AI Insights Service
vi.mock('../server/ai-insights-service', () => ({
  AIInsightsService: class MockAIInsightsService {
    constructor() {}
    
    async initialize() {
      return true;
    }
    
    async generateStudentProgressInsights(data: any, language: string = 'en') {
      return {
        summary: 'Student shows strong progress in vocabulary but needs improvement in grammar',
        strengths: ['Vocabulary building', 'Pronunciation', 'Listening comprehension'],
        improvementAreas: ['Grammar rules', 'Writing skills', 'Speaking fluency'],
        recommendations: [
          {
            priority: 'high',
            action: 'Focus on grammar exercises',
            rationale: 'Low grammar scores indicate need for structured practice'
          },
          {
            priority: 'medium',
            action: 'Increase speaking practice',
            rationale: 'Speaking confidence can be improved through regular practice'
          }
        ],
        language,
        confidenceScore: 0.85,
        culturalContext: language === 'fa' ? 'iranian' : 'general'
      };
    }
    
    async assessStudentRiskLevel(factors: any) {
      return {
        riskLevel: factors.engagementLevel < 50 ? 'high' : 'low',
        riskScore: Math.max(0, 100 - factors.engagementLevel),
        riskFactors: [
          { factor: 'engagement_level', severity: 'medium', impact: 0.6 }
        ],
        interventionRecommendations: [
          {
            type: 'motivational',
            priority: 'high',
            description: 'Schedule motivational session with mentor'
          }
        ],
        confidenceLevel: 0.8
      };
    }
  }
}));

// ============================================================================
// WEB APIs MOCKING
// ============================================================================

// Local storage mock
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => {
      const storage: Record<string, string> = {
        'auth-token': 'mock-token',
        'user-preferences': JSON.stringify({ theme: 'light', language: 'en' })
      };
      return storage[key] || null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  },
  writable: true
});

// Performance API mock
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  },
  writable: true
});

// ============================================================================
// TEST LIFECYCLE HOOKS
// ============================================================================

// Global test setup
beforeAll(() => {
  console.log('🧪 Setting up comprehensive testing environment...');
  
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = originalConsole.error; // Keep errors visible
  
  // Store original for restoration
  (global as any).originalConsole = originalConsole;
});

// Reset between tests
beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as any).mockClear();
  cleanup();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global cleanup
afterAll(() => {
  vi.restoreAllMocks();
  
  // Restore console
  const originalConsole = (global as any).originalConsole;
  if (originalConsole) {
    Object.assign(console, originalConsole);
  }
  
  console.log('✅ Test environment cleanup completed');
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

export const testUtils = {
  // Create a fresh QueryClient for each test
  createTestQueryClient: () => new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0, staleTime: 0 },
      mutations: { retry: false }
    }
  }),
  
  // Mock authentication token
  mockAuthToken: 'test-jwt-token-for-analytics-testing',
  
  // Test data generators
  generateMockStudent: (id = 1) => ({
    id,
    name: `Test Student ${id}`,
    email: `student${id}@test.com`,
    nativeLanguage: 'fa',
    targetLanguage: 'en',
    level: 'B1'
  }),
  
  // Create mock analytics data
  createMockAnalyticsData: () => ({
    totalLessons: 25,
    completedLessons: 20,
    completionRate: 0.8,
    averageScore: 78.5,
    streak: 5,
    skillBreakdown: {
      speaking: 75,
      listening: 80,
      reading: 82,
      writing: 70,
      grammar: 78,
      vocabulary: 85
    },
    progressTrend: 'improving',
    lastActivity: new Date().toISOString()
  }),
  
  // Wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
};

// Make test utils globally available
(global as any).testUtils = testUtils;

console.log('🚀 Comprehensive test setup initialized successfully!');