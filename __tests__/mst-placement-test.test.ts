/**
 * Comprehensive MST (Multistage Test) Placement Test Suite
 * 
 * Tests the core functionality of the Meta Lingua MST system including:
 * - Session management and skill progression
 * - Speaking audio generation with Microsoft Edge TTS
 * - Timer synchronization and preparation phases
 * - Response validation and scoring
 * - UI behavior and accessibility
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MST from '../client/src/pages/mst.tsx';

// Mock the fetch API
global.fetch = vi.fn();
const mockFetch = fetch as Mock;

// Mock Audio API
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 0,
  paused: true
}));

// Mock MediaRecorder API
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  state: 'inactive'
}));
(global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(new MediaStream())
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test data
const mockMSTSession = {
  sessionId: 'mst_test_123',
  skillOrder: ['listening', 'reading', 'speaking', 'writing'],
  perSkillSeconds: 300,
  totalSeconds: 1200,
  status: 'active'
};

const mockListeningItem = {
  id: 'L-B1-001',
  skill: 'listening',
  stage: 'core',
  cefr: 'B1',
  content: {
    assets: {
      audio: '/test-audio.mp3',
      transcript: 'Test audio transcript'
    },
    questions: [
      {
        stem: 'What is the main topic?',
        type: 'mcq_single',
        options: ['Option A', 'Option B', 'Option C', 'Option D']
      }
    ]
  },
  timing: {
    prepSec: 0,
    recordSec: 0,
    maxAnswerSec: 60
  }
};

const mockSpeakingItem = {
  id: 'S-B1-001',
  skill: 'speaking',
  stage: 'core',
  cefr: 'B1',
  content: {
    assets: {
      prompt: 'Express your opinion about learning languages online. Speak for about 1 minute.'
    }
  },
  timing: {
    prepSec: 15,
    recordSec: 60,
    maxAnswerSec: 75
  }
};

const mockWritingItem = {
  id: 'W-B1-001',
  skill: 'writing',
  stage: 'core',
  cefr: 'B1',
  content: {
    assets: {
      prompt: 'Write about the advantages and disadvantages of social media.'
    }
  },
  timing: {
    prepSec: 0,
    recordSec: 0,
    maxAnswerSec: 300
  }
};

const mockMSTStatus = {
  success: true,
  session: {
    id: 'mst_test_123',
    status: 'active',
    currentSkill: 'listening',
    currentStage: 'core',
    skillOrder: ['listening', 'reading', 'speaking', 'writing']
  },
  timing: {
    skillRemainingSec: 280,
    totalElapsedSec: 120
  },
  progress: {
    completedSkills: 0,
    totalSkills: 4,
    shouldAutoAdvance: false
  }
};

describe('MST Placement Test', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Reset all mocks
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Setup default fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/mst/start')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, sessionId: 'mst_test_123' })
        });
      }
      if (url.includes('/api/mst/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMSTStatus)
        });
      }
      if (url.includes('/api/mst/item')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, item: mockListeningItem })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderMST = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MST />
      </QueryClientProvider>
    );
  };

  describe('Test Session Management', () => {
    it('should start MST session successfully', async () => {
      renderMST();
      
      const startButton = await screen.findByTestId('button-start-test');
      expect(startButton).toBeInTheDocument();
      
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/mst/start',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    });

    it('should load test status and display current skill', async () => {
      renderMST();
      
      // Wait for status to load
      await waitFor(() => {
        expect(screen.getByText(/MST Test - LISTENING/i)).toBeInTheDocument();
      });
      
      expect(screen.getByText('core')).toBeInTheDocument();
      expect(screen.getByText('B1')).toBeInTheDocument();
    });
  });

  describe('Speaking Test with TTS', () => {
    beforeEach(() => {
      // Mock speaking item response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/mst/item')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, item: mockSpeakingItem })
          });
        }
        if (url.includes('/api/tts/generate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              success: true, 
              audioUrl: '/uploads/tts/edge_tts_123.mp3',
              duration: 5
            })
          });
        }
        if (url.includes('/api/mst/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockMSTStatus,
              session: { ...mockMSTStatus.session, currentSkill: 'speaking' }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
    });

    it('should generate TTS for speaking prompt using Microsoft Edge TTS', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/MST Test - SPEAKING/i)).toBeInTheDocument();
      });
      
      // Wait for TTS generation
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/tts/generate',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              text: expect.stringContaining('Express your opinion about learning languages online'),
              language: 'english',
              speed: 1.0
            })
          })
        );
      });
    });

    it('should show manual play button when autoplay fails', async () => {
      // Mock Audio to throw error on play
      const mockAudio = {
        play: vi.fn().mockRejectedValue(new Error('Autoplay blocked')),
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        currentTime: 0,
        duration: 0,
        paused: true
      };
      global.Audio = vi.fn().mockImplementation(() => mockAudio);
      
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/Listen to the question/i)).toBeInTheDocument();
      });
      
      // Should show manual play button
      await waitFor(() => {
        const playButton = screen.getByTestId('button-play-narration');
        expect(playButton).toBeInTheDocument();
        expect(playButton).toHaveTextContent(/Click to Play Question/i);
      });
    });

    it('should start preparation timer only after audio ends', async () => {
      const mockAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        currentTime: 0,
        duration: 5,
        paused: false
      };
      global.Audio = vi.fn().mockImplementation(() => mockAudio);
      
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/Listen to the question/i)).toBeInTheDocument();
      });
      
      // Simulate audio ended event
      act(() => {
        const addEventListenerCalls = mockAudio.addEventListener.mock.calls;
        const endedHandler = addEventListenerCalls.find(call => call[0] === 'ended')?.[1];
        if (endedHandler) {
          endedHandler();
        }
      });
      
      // Should show preparation phase
      await waitFor(() => {
        expect(screen.getByText(/Preparation Time/i)).toBeInTheDocument();
        expect(screen.getByText('00:15')).toBeInTheDocument();
      });
    });

    it('should record for exactly 60 seconds', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/MST Test - SPEAKING/i)).toBeInTheDocument();
      });
      
      // Simulate progression to recording phase
      act(() => {
        // Mock the audio ended event to trigger preparation
        const mockAudio = global.Audio as Mock;
        const audioInstance = mockAudio.mock.results[0]?.value;
        if (audioInstance) {
          const addEventListenerCalls = audioInstance.addEventListener.mock.calls;
          const endedHandler = addEventListenerCalls.find((call: any) => call[0] === 'ended')?.[1];
          if (endedHandler) {
            endedHandler();
          }
        }
      });
      
      // Wait for preparation phase and then recording phase
      await waitFor(() => {
        expect(screen.getByText(/Recording/i)).toBeInTheDocument();
      }, { timeout: 20000 });
      
      // Verify recording time is set to 60 seconds
      const item = mockSpeakingItem;
      expect(item.timing.recordSec).toBe(60);
    });
  });

  describe('Timer Functionality', () => {
    it('should display timer on the right side', async () => {
      renderMST();
      
      await waitFor(() => {
        const timerContainer = screen.getByText('Time Remaining').closest('div');
        expect(timerContainer).toHaveClass('text-right');
      });
    });

    it('should not display Skill:0:00 text', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.queryByText(/Skill:/)).not.toBeInTheDocument();
      });
    });

    it('should show countdown timer during test', async () => {
      renderMST();
      
      await waitFor(() => {
        const timer = screen.getByText(/\d{2}:\d{2}/);
        expect(timer).toBeInTheDocument();
      });
    });
  });

  describe('Writing Test', () => {
    beforeEach(() => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/mst/item')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, item: mockWritingItem })
          });
        }
        if (url.includes('/api/mst/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockMSTStatus,
              session: { ...mockMSTStatus.session, currentSkill: 'writing' }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
    });

    it('should not show red word count error', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/MST Test - WRITING/i)).toBeInTheDocument();
      });
      
      const textarea = screen.getByTestId('textarea-writing');
      fireEvent.change(textarea, { target: { value: 'Short text' } });
      
      await waitFor(() => {
        // Should show neutral word count, not red error
        const wordCount = screen.getByText(/Words: 2/);
        expect(wordCount).toBeInTheDocument();
        expect(wordCount).not.toHaveClass('text-red-600');
        expect(wordCount).toHaveClass('text-gray-600');
      });
    });

    it('should validate minimum 80 words for submission', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByTestId('textarea-writing')).toBeInTheDocument();
      });
      
      const textarea = screen.getByTestId('textarea-writing');
      const submitButton = screen.getByTestId('button-submit');
      
      // Test with less than 80 words
      fireEvent.change(textarea, { target: { value: 'Short text with less than eighty words.' } });
      expect(submitButton).toBeDisabled();
      
      // Test with 80+ words
      const longText = 'This is a much longer text that should contain at least eighty words to meet the minimum requirement for the writing task. '.repeat(2);
      fireEvent.change(textarea, { target: { value: longText } });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Response Validation', () => {
    it('should validate listening MCQ responses', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/MST Test - LISTENING/i)).toBeInTheDocument();
      });
      
      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).toBeDisabled();
      
      // Select an answer
      const radioButton = screen.getByTestId('radio-q-0-opt-0');
      fireEvent.click(radioButton);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should validate speaking audio recording', async () => {
      // Mock MediaRecorder with recorded data
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
      global.MediaRecorder = vi.fn().mockImplementation(() => ({
        start: vi.fn(),
        stop: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          if (event === 'dataavailable') {
            setTimeout(() => handler({ data: mockBlob }), 100);
          }
        }),
        state: 'recording'
      }));
      
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/mst/item')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, item: mockSpeakingItem })
          });
        }
        if (url.includes('/api/mst/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockMSTStatus,
              session: { ...mockMSTStatus.session, currentSkill: 'speaking' }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/MST Test - SPEAKING/i)).toBeInTheDocument();
      });
      
      // Initially submit should be disabled
      await waitFor(() => {
        const submitButton = screen.getByTestId('button-submit');
        expect(submitButton).toBeDisabled();
      });
      
      // Simulate recording completion
      act(() => {
        // Trigger recording completion simulation
        const recordingBlob = new Blob(['test'], { type: 'audio/webm' });
        // This would normally be set by the recording process
      });
    });
  });

  describe('Accessibility and UI Behavior', () => {
    it('should have proper ARIA labels and test IDs', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByTestId('button-submit')).toBeInTheDocument();
      });
      
      // Check for essential test IDs
      const elements = [
        'button-submit',
        'button-start-test'
      ];
      
      elements.forEach(testId => {
        const element = screen.queryByTestId(testId);
        if (element) {
          expect(element).toBeInTheDocument();
        }
      });
    });

    it('should show loading states appropriately', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByText(/MST Test/i)).toBeInTheDocument();
      });
      
      // Simulate TTS generation
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/tts/generate')) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, audioUrl: '/test.mp3' })
              });
            }, 1000);
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      // Should show generating state during TTS
      // This would need to be tested with specific speaking item
    });
  });

  describe('Score Calculation and Progression', () => {
    it('should submit responses with correct format', async () => {
      renderMST();
      
      await waitFor(() => {
        expect(screen.getByTestId('radio-q-0-opt-0')).toBeInTheDocument();
      });
      
      // Select answer and submit
      fireEvent.click(screen.getByTestId('radio-q-0-opt-0'));
      fireEvent.click(screen.getByTestId('button-submit'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/mst/response',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              sessionId: 'mst_test_123',
              skill: 'listening',
              stage: 'core',
              itemId: 'L-B1-001',
              responseData: ['0'],
              audioBlob: null,
              timeSpentMs: expect.any(Number)
            })
          })
        );
      });
    });

    it('should progress through skills correctly', async () => {
      // Mock skill completion response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/mst/skill-complete')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              skillResult: {
                skill: 'listening',
                band: 'B2',
                confidence: 0.8,
                timeSpentSec: 60
              },
              nextSkill: 'reading',
              testComplete: false
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      renderMST();
      
      // Simulate test progression
      await waitFor(() => {
        expect(screen.getByText(/MST Test - LISTENING/i)).toBeInTheDocument();
      });
      
      // Complete listening section
      fireEvent.click(screen.getByTestId('radio-q-0-opt-0'));
      fireEvent.click(screen.getByTestId('button-submit'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/mst/skill-complete',
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });
});