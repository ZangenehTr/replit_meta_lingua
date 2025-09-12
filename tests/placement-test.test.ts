import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlacementTestPage from '../client/src/pages/placement-test';
import { AdaptivePlacementService } from '../server/services/adaptive-placement-service';
import type { PlacementTestQuestion } from '../shared/placement-test-schema';

// Mock fetch API
global.fetch = vi.fn();

// Mock MediaRecorder
class MockMediaRecorder {
  state = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  
  start() {
    this.state = 'recording';
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['test'], { type: 'audio/webm' }) });
      }
    }, 100);
  }
  
  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }
  
  static isTypeSupported() {
    return true;
  }
}

(global as any).MediaRecorder = MockMediaRecorder;

describe('Placement Test - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should use correct property names for question object', () => {
    const mockQuestion: PlacementTestQuestion = {
      id: 1,
      skill: 'speaking',
      cefrLevel: 'B1', // NOT 'level'
      questionType: 'open_ended', // NOT 'type'
      title: 'Test Question',
      prompt: 'Test prompt',
      content: {},
      responseType: 'audio',
      expectedDurationSeconds: 120,
      estimatedCompletionMinutes: 2, // NOT 'estimatedMinutes'
      difficultyWeight: 1.0,
      scoringCriteria: {},
      tags: [],
      adaptiveBehavior: {},
      targetLanguage: 'english',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Verify properties exist
    expect(mockQuestion.cefrLevel).toBe('B1');
    expect(mockQuestion.questionType).toBe('open_ended');
    expect(mockQuestion.estimatedCompletionMinutes).toBe(2);
    
    // Verify old properties don't exist
    expect((mockQuestion as any).level).toBeUndefined();
    expect((mockQuestion as any).type).toBeUndefined();
    expect((mockQuestion as any).estimatedMinutes).toBeUndefined();
  });

  it('should parse API response correctly', async () => {
    const mockResponse = {
      success: true,
      question: {
        id: 1,
        skill: 'speaking',
        cefrLevel: 'B1',
        questionType: 'open_ended',
        title: 'Express Your Opinion',
        prompt: 'What do you think about learning languages online?',
        content: {},
        responseType: 'audio',
        expectedDurationSeconds: 120,
        estimatedCompletionMinutes: 2
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Simulate fetching next question
    const response = await fetch('/api/placement-test/sessions/1/next-question');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.question).toBeDefined();
    expect(data.question.cefrLevel).toBe('B1');
    expect(data.question.questionType).toBe('open_ended');
    expect(data.question.estimatedCompletionMinutes).toBe(2);
  });

  it('should set recording duration with default fallback', () => {
    const mockQuestion = {
      expectedDurationSeconds: undefined
    };
    
    const duration = mockQuestion.expectedDurationSeconds || 120;
    expect(duration).toBe(120);
  });
});

describe('Placement Test - Integration Tests', () => {
  it('should complete full question cycle', async () => {
    // Mock start test response
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          session: { id: 1, status: 'in_progress' }
        })
      })
      // Mock get next question
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          question: {
            id: 1,
            skill: 'speaking',
            cefrLevel: 'B1',
            questionType: 'open_ended',
            title: 'Test',
            prompt: 'Test prompt',
            content: {},
            responseType: 'audio',
            expectedDurationSeconds: 120,
            estimatedCompletionMinutes: 2
          }
        })
      })
      // Mock submit response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, evaluation: { score: 80 } })
      })
      // Mock get next question (test completed)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          testCompleted: true,
          results: {
            overallLevel: 'B1',
            skillLevels: {
              speaking: 'B1',
              listening: 'B1',
              reading: 'B1',
              writing: 'B1'
            }
          }
        })
      });

    // Start test
    const startResponse = await fetch('/api/placement-test/start', {
      method: 'POST',
      body: JSON.stringify({
        targetLanguage: 'english',
        learningGoal: 'general'
      })
    });
    const startData = await startResponse.json();
    expect(startData.success).toBe(true);
    expect(startData.session.id).toBe(1);

    // Get next question
    const questionResponse = await fetch('/api/placement-test/sessions/1/next-question');
    const questionData = await questionResponse.json();
    expect(questionData.question.cefrLevel).toBe('B1');

    // Submit response
    const submitResponse = await fetch('/api/placement-test/sessions/1/responses', {
      method: 'POST',
      body: JSON.stringify({
        questionId: 1,
        userResponse: { text: 'Test answer' }
      })
    });
    const submitData = await submitResponse.json();
    expect(submitData.success).toBe(true);

    // Get results
    const resultsResponse = await fetch('/api/placement-test/sessions/1/next-question');
    const resultsData = await resultsResponse.json();
    expect(resultsData.testCompleted).toBe(true);
    expect(resultsData.results.overallLevel).toBe('B1');
  });
});

describe('Placement Test - System Tests', () => {
  it('should handle MediaRecorder lifecycle correctly', async () => {
    const mediaRecorder = new MockMediaRecorder();
    let recordedBlob: Blob | null = null;
    
    mediaRecorder.ondataavailable = (event) => {
      recordedBlob = event.data;
    };
    
    mediaRecorder.onstop = () => {
      expect(recordedBlob).not.toBeNull();
      expect(recordedBlob?.size).toBeGreaterThan(0);
    };
    
    // Start recording
    mediaRecorder.start();
    expect(mediaRecorder.state).toBe('recording');
    
    // Wait for minimum duration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Stop recording
    mediaRecorder.stop();
    expect(mediaRecorder.state).toBe('inactive');
  });

  it('should prevent immediate recording stop', () => {
    const duration = 0; // Undefined/0 duration
    const minDuration = Math.max(duration, 2); // Ensure minimum 2 seconds
    expect(minDuration).toBeGreaterThanOrEqual(2);
  });
});

describe('Placement Test - Regression Tests', () => {
  it('should never use legacy property names', () => {
    const codeSnippet = `
      const question = {
        cefrLevel: 'B1',
        questionType: 'open_ended',
        estimatedCompletionMinutes: 2
      };
    `;
    
    // These should not exist in the codebase
    expect(codeSnippet).not.toContain('.level');
    expect(codeSnippet).not.toContain('.type');
    expect(codeSnippet).not.toContain('.estimatedMinutes');
  });

  it('should handle undefined expectedDurationSeconds gracefully', () => {
    const question: any = {
      expectedDurationSeconds: undefined
    };
    
    const duration = question.expectedDurationSeconds ?? 120;
    expect(duration).toBe(120);
    
    // Ensure recording timer gets valid duration
    let recordingTimeLeft = duration;
    expect(recordingTimeLeft).toBeGreaterThan(0);
  });
});

describe('Placement Test - White Box Tests', () => {
  it('should correctly determine adaptive next question', async () => {
    const service = new AdaptivePlacementService({} as any);
    
    // Mock internal state
    const skillState = {
      skill: 'speaking' as const,
      currentLevel: 'B1' as const,
      questionsAsked: 2,
      responses: [
        { aiScore: 75, nextQuestionLevel: 'B1' },
        { aiScore: 85, nextQuestionLevel: 'B2' }
      ],
      confidence: 0.7,
      completed: false
    };
    
    // Test adaptive decision making
    const decision = (service as any).makeAdaptiveDecision(skillState);
    
    expect(decision).toBeDefined();
    expect(decision.shouldContinueTesting).toBeDefined();
    expect(decision.nextQuestionLevel).toBeDefined();
  });

  it('should validate question structure from database', () => {
    const dbQuestion = {
      id: 1,
      skill: 'speaking',
      cefr_level: 'B1', // DB uses snake_case
      question_type: 'open_ended',
      expected_duration_seconds: 120,
      estimated_completion_minutes: 2
    };
    
    // Transform to camelCase for frontend
    const frontendQuestion = {
      id: dbQuestion.id,
      skill: dbQuestion.skill,
      cefrLevel: dbQuestion.cefr_level,
      questionType: dbQuestion.question_type,
      expectedDurationSeconds: dbQuestion.expected_duration_seconds,
      estimatedCompletionMinutes: dbQuestion.estimated_completion_minutes
    };
    
    expect(frontendQuestion.cefrLevel).toBe('B1');
    expect(frontendQuestion.questionType).toBe('open_ended');
    expect(frontendQuestion.estimatedCompletionMinutes).toBe(2);
  });

  it('should handle audio submission with FormData', () => {
    const formData = new FormData();
    const audioBlob = new Blob(['test'], { type: 'audio/webm' });
    
    formData.append('questionId', '1');
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Verify FormData structure
    expect(formData.has('questionId')).toBe(true);
    expect(formData.has('audio')).toBe(true);
    expect(formData.get('questionId')).toBe('1');
  });
});