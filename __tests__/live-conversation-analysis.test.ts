import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { CallernSupervisorHandlers } from '../server/callern-supervisor-handlers';

// Mock Ollama service
const mockOllamaService = {
  generateCompletion: vi.fn(),
  isAvailable: vi.fn().mockReturnValue(true)
};

// Mock OpenAI service  
const mockOpenAIService = {
  generateCompletion: vi.fn(),
  analyzeConversation: vi.fn(),
  isAvailable: vi.fn().mockReturnValue(true)
};

describe('Live Conversation Analysis & Activity Generation', () => {
  let io: Server;
  let mockSocket: any;
  let supervisorHandlers: CallernSupervisorHandlers;

  beforeEach(() => {
    const httpServer = createServer();
    io = new Server(httpServer);
    
    mockSocket = {
      id: 'test-socket',
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      join: vi.fn(),
      leave: vi.fn()
    };

    supervisorHandlers = new CallernSupervisorHandlers(io, mockOllamaService, mockOpenAIService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Real-time Conversation Processing', () => {
    it('should analyze conversation transcript and generate contextual activities', async () => {
      const conversationData = {
        roomId: 'test-room',
        speaker: 'student' as const,
        text: 'I love traveling to different countries and experiencing new cultures',
        timestamp: Date.now()
      };

      await supervisorHandlers.handleConversationTranscript(mockSocket, conversationData);

      // Should emit live activity suggestion
      expect(mockSocket.emit).toHaveBeenCalledWith('live-activity-suggestion', expect.objectContaining({
        type: 'word-selection',
        content: expect.objectContaining({
          title: 'Choose the Travel Word',
          sentence: expect.stringContaining('[CHOOSE]'),
          options: expect.arrayContaining(['visit']),
          correct: 'visit'
        }),
        context: expect.stringContaining('traveling')
      }));
    });

    it('should generate weather-related activities from weather conversation', async () => {
      const weatherConversation = {
        roomId: 'test-room',
        speaker: 'teacher' as const,
        text: 'What do you think about today\'s sunny weather?',
        timestamp: Date.now()
      };

      await supervisorHandlers.handleConversationTranscript(mockSocket, weatherConversation);

      expect(mockSocket.emit).toHaveBeenCalledWith('live-activity-suggestion', expect.objectContaining({
        type: 'vocabulary-game',
        content: expect.objectContaining({
          type: 'matching',
          title: 'Weather Vocabulary Match',
          items: expect.arrayContaining([
            expect.objectContaining({ word: 'sunny', match: expect.stringContaining('bright') }),
            expect.objectContaining({ word: 'rainy', match: expect.stringContaining('water') })
          ])
        })
      }));
    });

    it('should create restaurant activities from food-related conversation', async () => {
      const foodConversation = {
        roomId: 'test-room',
        speaker: 'student' as const,
        text: 'I want to eat at a nice restaurant tonight',
        timestamp: Date.now()
      };

      await supervisorHandlers.handleConversationTranscript(mockSocket, foodConversation);

      expect(mockSocket.emit).toHaveBeenCalledWith('live-activity-suggestion', expect.objectContaining({
        type: 'gap-fill',
        content: expect.objectContaining({
          title: 'Restaurant Conversation',
          sentence: expect.stringContaining('____'),
          options: expect.arrayContaining(['book', 'reserve']),
          correct: 'book'
        })
      }));
    });

    it('should generate work-related polls from career conversation', async () => {
      const workConversation = {
        roomId: 'test-room',
        speaker: 'teacher' as const,
        text: 'Tell me about your job and career goals',
        timestamp: Date.now()
      };

      await supervisorHandlers.handleConversationTranscript(mockSocket, workConversation);

      expect(mockSocket.emit).toHaveBeenCalledWith('live-activity-suggestion', expect.objectContaining({
        type: 'poll',
        content: expect.objectContaining({
          question: expect.stringContaining('job'),
          options: expect.arrayContaining(['Good salary', 'Work-life balance']),
          anonymous: true
        })
      }));
    });

    it('should handle multiple conversation topics in sequence', async () => {
      const conversations = [
        { text: 'I work in an office downtown', topic: 'work' },
        { text: 'But I love traveling on weekends', topic: 'travel' },
        { text: 'The weather has been great for trips', topic: 'weather' }
      ];

      for (const conv of conversations) {
        await supervisorHandlers.handleConversationTranscript(mockSocket, {
          roomId: 'test-room',
          speaker: 'student' as const,
          text: conv.text,
          timestamp: Date.now()
        });
      }

      // Should have generated 3 different activities
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
      expect(mockSocket.emit).toHaveBeenNthCalledWith(1, 'live-activity-suggestion', expect.objectContaining({ type: 'poll' }));
      expect(mockSocket.emit).toHaveBeenNthCalledWith(2, 'live-activity-suggestion', expect.objectContaining({ type: 'word-selection' }));
      expect(mockSocket.emit).toHaveBeenNthCalledWith(3, 'live-activity-suggestion', expect.objectContaining({ type: 'vocabulary-game' }));
    });
  });

  describe('Context-Aware AI Response Generation', () => {
    it('should provide contextual word suggestions based on conversation hesitation', async () => {
      const hesitationContext = {
        roomId: 'test-room',
        context: 'I need help expressing myself',
        targetLanguage: 'English'
      };

      await supervisorHandlers.handleWordSuggestions(mockSocket, hesitationContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('word-suggestions', expect.arrayContaining([
        expect.objectContaining({
          word: 'actually',
          translation: 'در واقع',
          usage: expect.stringContaining('Actually')
        }),
        expect.objectContaining({
          word: 'specifically',
          translation: 'به طور خاص',
          usage: expect.stringContaining('specifically')
        })
      ]));
    });

    it('should generate conversation-starting vocabulary', async () => {
      const conversationStart = {
        roomId: 'test-room',
        context: 'conversation starting',
        targetLanguage: 'English'
      };

      await supervisorHandlers.handleWordSuggestions(mockSocket, conversationStart);

      expect(mockSocket.emit).toHaveBeenCalledWith('word-suggestions', expect.arrayContaining([
        expect.objectContaining({
          word: 'introduce',
          translation: 'معرفی کردن',
          usage: expect.stringContaining('introduce myself')
        })
      ]));
    });

    it('should adapt suggestions based on conversation difficulty level', async () => {
      const beginnerContext = {
        roomId: 'test-room',
        context: 'hesitation',
        difficulty: 'beginner' as const
      };

      const advancedContext = {
        roomId: 'test-room',
        context: 'hesitation', 
        difficulty: 'advanced' as const
      };

      await supervisorHandlers.handleWordSuggestions(mockSocket, beginnerContext);
      const beginnerCall = mockSocket.emit.mock.calls[0];

      mockSocket.emit.mockClear();

      await supervisorHandlers.handleWordSuggestions(mockSocket, advancedContext);
      const advancedCall = mockSocket.emit.mock.calls[0];

      // Advanced suggestions should have more sophisticated vocabulary
      expect(beginnerCall[1]).toEqual(expect.arrayContaining([
        expect.objectContaining({ word: expect.not.stringMatching(/furthermore|nonetheless|particularly/) })
      ]));

      expect(advancedCall[1]).toEqual(expect.arrayContaining([
        expect.objectContaining({ word: expect.stringMatching(/however|therefore|furthermore/) })
      ]));
    });
  });

  describe('Real-time Speech Pattern Analysis', () => {
    it('should detect speech patterns and trigger appropriate responses', async () => {
      // Mock speech patterns that indicate need for help
      const speechPatterns = [
        'um... I mean... how do I say...',
        'I want to... uh... what\'s the word...',
        'Can you help me... I don\'t know how to...'
      ];

      for (const pattern of speechPatterns) {
        await supervisorHandlers.handleConversationTranscript(mockSocket, {
          roomId: 'test-room',
          speaker: 'student' as const,
          text: pattern,
          timestamp: Date.now()
        });
      }

      // Should have triggered word help suggestions
      expect(mockSocket.emit).toHaveBeenCalledWith(
        expect.stringMatching(/word-help|suggestions/),
        expect.any(Object)
      );
    });

    it('should analyze talk-time ratio and provide feedback', async () => {
      const mockSession = {
        roomId: 'test-room',
        studentTalkTime: 180, // 3 minutes
        teacherTalkTime: 120, // 2 minutes
        totalDuration: 300    // 5 minutes
      };

      const talkTimeAnalysis = supervisorHandlers.analyzeTalkTimeRatio(mockSession);

      expect(talkTimeAnalysis).toEqual(expect.objectContaining({
        studentRatio: 60, // 180/300 * 100
        teacherRatio: 40, // 120/300 * 100
        feedback: expect.stringContaining('Good balance')
      }));
    });

    it('should detect when student needs more speaking time', async () => {
      const mockSession = {
        roomId: 'test-room',
        studentTalkTime: 60,  // 1 minute
        teacherTalkTime: 240, // 4 minutes
        totalDuration: 300    // 5 minutes
      };

      const talkTimeAnalysis = supervisorHandlers.analyzeTalkTimeRatio(mockSession);

      expect(talkTimeAnalysis.feedback).toContain('student should speak more');
      expect(talkTimeAnalysis.studentRatio).toBeLessThan(30);
    });
  });

  describe('Dynamic Activity Difficulty Adjustment', () => {
    it('should adjust activity complexity based on student performance', async () => {
      const studentProfile = {
        level: 'A2',
        recentPerformance: 85,
        strengths: ['vocabulary'],
        weaknesses: ['grammar']
      };

      const activityGeneration = await supervisorHandlers.generateAdaptiveActivity({
        roomId: 'test-room',
        studentProfile,
        conversationTopic: 'travel',
        previousActivities: []
      });

      expect(activityGeneration).toEqual(expect.objectContaining({
        type: expect.any(String),
        difficulty: 'A2',
        focusArea: 'grammar', // Should focus on weakness
        content: expect.any(Object)
      }));
    });

    it('should avoid repetitive activity types', async () => {
      const previousActivities = [
        { type: 'gap-fill', timestamp: Date.now() - 60000 },
        { type: 'gap-fill', timestamp: Date.now() - 120000 }
      ];

      const newActivity = await supervisorHandlers.generateAdaptiveActivity({
        roomId: 'test-room',
        studentProfile: { level: 'B1' },
        conversationTopic: 'weather',
        previousActivities
      });

      expect(newActivity.type).not.toBe('gap-fill');
      expect(['poll', 'word-selection', 'matching', 'vocabulary-game']).toContain(newActivity.type);
    });
  });
});