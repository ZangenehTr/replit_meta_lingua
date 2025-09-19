import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { globalLexiService, type LearningAnalytics, type ActivityContext } from '../../client/src/services/global-lexi-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('Global Lexi Service - Frontend Integration', () => {
  const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-auth-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Activity Tracking', () => {
    it('should track homework activities correctly', async () => {
      const context: ActivityContext = {
        module: 'homework',
        activityType: 'assignment_start',
        metadata: {
          assignmentId: 'hw-grammar-unit-3',
          difficulty: 'intermediate'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tracked: true })
      } as Response);

      const result = await globalLexiService.trackActivity(context);

      expect(result).toEqual({ success: true, tracked: true });
      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/track-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify(context)
      });
    });

    it('should track flashcard study sessions', async () => {
      const context: ActivityContext = {
        module: 'flashcards',
        activityType: 'vocabulary_practice',
        metadata: {
          cardId: 'business-vocab-15',
          correct: true,
          timeSpent: 45
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tracked: true })
      } as Response);

      await globalLexiService.trackActivity(context);

      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/track-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify(context)
      });
    });

    it('should track CallerN video sessions', async () => {
      const context: ActivityContext = {
        module: 'callern',
        activityType: 'video_session_active',
        metadata: {
          sessionId: 'call-789',
          tutor: 'teacher-456',
          topic: 'conversation-practice',
          duration: 1800 // 30 minutes
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, tracked: true })
      } as Response);

      await globalLexiService.trackActivity(context);

      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/track-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify(context)
      });
    });

    it('should handle activity tracking errors', async () => {
      const context: ActivityContext = {
        module: 'tests',
        activityType: 'quiz_attempt',
        metadata: { quizId: 'grammar-test-1' }
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(globalLexiService.trackActivity(context)).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      const context: ActivityContext = {
        module: 'homework',
        activityType: 'assignment_submit',
        metadata: { assignmentId: 'invalid' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid assignment' })
      } as Response);

      await expect(globalLexiService.trackActivity(context)).rejects.toThrow('HTTP error! status: 400');
    });
  });

  describe('Contextual AI Responses', () => {
    it('should get contextual responses for homework help', async () => {
      const expectedResponse = {
        content: 'I understand homework can be challenging. Let me help you break it down.',
        emotion: 'encouraging',
        suggestions: ['Start with easier questions', 'Take breaks', 'Review examples'],
        culturalTip: 'In Iranian culture, seeking help shows wisdom.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedResponse
      } as Response);

      const result = await globalLexiService.getContextualResponse(
        'This homework is too difficult',
        {
          module: 'homework',
          activityType: 'grammar_exercise',
          metadata: { difficulty: 'advanced' }
        },
        'intermediate'
      );

      expect(result).toEqual(expectedResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/contextual-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify({
          message: 'This homework is too difficult',
          context: {
            module: 'homework',
            activityType: 'grammar_exercise',
            metadata: { difficulty: 'advanced' }
          },
          studentLevel: 'intermediate'
        })
      });
    });

    it('should get contextual responses for CallerN nervousness', async () => {
      const expectedResponse = {
        content: 'It\'s completely normal to feel nervous during video calls!',
        emotion: 'encouraging',
        culturalTip: 'In Iranian culture, showing vulnerability is seen as wisdom.',
        suggestions: ['Practice pronunciation', 'Prepare common phrases', 'Use gestures']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedResponse
      } as Response);

      const result = await globalLexiService.getContextualResponse(
        'I feel nervous speaking on video',
        {
          module: 'callern',
          activityType: 'video_call_start',
          metadata: { isFirstCall: true }
        },
        'beginner'
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should get contextual responses for flashcard memory issues', async () => {
      const expectedResponse = {
        content: 'Memory techniques can help! Try creating stories or associations.',
        emotion: 'thinking',
        culturalTip: 'Persian poetry uses beautiful metaphors - connect new words to imagery!',
        suggestions: ['Use visual associations', 'Practice spaced repetition', 'Connect to experiences']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedResponse
      } as Response);

      const result = await globalLexiService.getContextualResponse(
        'I keep forgetting new vocabulary words',
        {
          module: 'flashcards',
          activityType: 'vocabulary_review',
          metadata: { difficulty: 'advanced' }
        },
        'intermediate'
      );

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Learning Insights', () => {
    it('should fetch learning insights with recommendations', async () => {
      const expectedInsights = {
        weeklyProgress: 75,
        currentFocus: 'intensive study sessions',
        recommendations: [
          'Try to study at least 4 days per week',
          'Practice speaking with CallerN tutors',
          'Complete more lessons to accelerate progress'
        ],
        encouragement: 'Amazing consistency! You\'re building excellent study habits.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedInsights
      } as Response);

      const result = await globalLexiService.getInsights();

      expect(result).toEqual(expectedInsights);
      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/insights', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token'
        }
      });
    });

    it('should handle insights fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(globalLexiService.getInsights()).rejects.toThrow('Service unavailable');
    });
  });

  describe('Statistics', () => {
    it('should fetch Lexi companion statistics', async () => {
      const expectedStats = {
        conversations: 15,
        helpfulTips: 12,
        encouragements: 20,
        totalInteractions: 47,
        weeklyEngagement: 8
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => expectedStats
      } as Response);

      const result = await globalLexiService.getStats();

      expect(result).toEqual(expectedStats);
      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/stats', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-auth-token'
        }
      });
    });
  });

  describe('Interaction Recording', () => {
    it('should record Lexi interactions for analytics', async () => {
      const interaction = {
        message: 'How can I improve my speaking skills?',
        response: 'Practice daily conversations and focus on pronunciation.',
        context: {
          module: 'callern',
          activityType: 'skill_improvement_question'
        },
        emotion: 'helpful',
        culturalTip: 'Regular practice builds confidence.',
        pronunciation: { word: 'pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃn/' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, recorded: true })
      } as Response);

      const result = await globalLexiService.recordInteraction(interaction);

      expect(result).toEqual({ success: true, recorded: true });
      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify(interaction)
      });
    });
  });

  describe('Authentication', () => {
    it('should handle missing authentication token', async () => {
      // Mock localStorage to return null
      (window.localStorage.getItem as vi.Mock).mockReturnValue(null);

      const context: ActivityContext = {
        module: 'homework',
        activityType: 'test',
        metadata: {}
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Access token required' })
      } as Response);

      await expect(globalLexiService.trackActivity(context)).rejects.toThrow('HTTP error! status: 401');

      expect(mockFetch).toHaveBeenCalledWith('/api/lexi/track-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null' // null token should be handled
        },
        body: JSON.stringify(context)
      });
    });

    it('should include authorization header in all requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      } as Response);

      await globalLexiService.getStats();
      await globalLexiService.getInsights();

      // Check that all calls include Authorization header
      expect(mockFetch).toHaveBeenCalledTimes(2);
      mockFetch.mock.calls.forEach(([, options]) => {
        expect(options?.headers).toHaveProperty('Authorization', 'Bearer mock-auth-token');
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      await expect(globalLexiService.getStats()).rejects.toThrow('Network connection failed');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      await expect(globalLexiService.getStats()).rejects.toThrow('Invalid JSON');
    });

    it('should handle HTTP error status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response);

      await expect(globalLexiService.getInsights()).rejects.toThrow('HTTP error! status: 500');
    });
  });
});