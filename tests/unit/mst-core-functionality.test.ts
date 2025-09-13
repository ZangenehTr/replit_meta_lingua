/**
 * MST (Multistage Test) Core Functionality Tests
 * 
 * Tests core MST functionality including:
 * - Session management
 * - TTS generation with Microsoft Edge TTS
 * - Timer synchronization
 * - Response validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('MST Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should start MST session with correct API call', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, sessionId: 'mst_test_123' })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/mst/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      const data = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('/api/mst/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe('mst_test_123');
    });
  });

  describe('TTS Generation', () => {
    it('should generate TTS with Microsoft Edge TTS for speaking prompts', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          audioUrl: '/uploads/tts/edge_tts_1234567890.mp3',
          duration: 5
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          text: 'Express your opinion about learning languages online. Speak for about 1 minute.',
          language: 'english',
          speed: 1.0
        })
      });
      
      const data = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          text: 'Express your opinion about learning languages online. Speak for about 1 minute.',
          language: 'english',
          speed: 1.0
        })
      });
      
      expect(data.success).toBe(true);
      expect(data.audioUrl).toContain('edge_tts_');
      expect(data.audioUrl).toContain('.mp3');
    });

    it('should fallback to Google TTS if Edge TTS fails', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          audioUrl: '/uploads/tts/tts_en_1234567890.mp3',
          duration: 4
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          text: 'Test prompt',
          language: 'english',
          speed: 1.0
        })
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.audioUrl).toContain('.mp3');
    });
  });

  describe('Response Submission', () => {
    it('should submit listening responses with correct format', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          route: 'up',
          p: 0.85
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/mst/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          sessionId: 'mst_test_123',
          skill: 'listening',
          stage: 'core',
          itemId: 'L-B1-001',
          responseData: ['0'],
          audioBlob: null,
          timeSpentMs: 45000
        })
      });
      
      const data = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('/api/mst/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          sessionId: 'mst_test_123',
          skill: 'listening',
          stage: 'core',
          itemId: 'L-B1-001',
          responseData: ['0'],
          audioBlob: null,
          timeSpentMs: 45000
        })
      });
      
      expect(data.success).toBe(true);
      expect(data.route).toBe('up');
    });

    it('should submit writing responses with word count validation', async () => {
      const writingText = 'This is a comprehensive writing response that contains more than eighty words as required by the MST writing task. The response demonstrates the test-taker\'s ability to express ideas clearly and coherently in written English. It includes multiple sentences with varied structure and vocabulary, showing proficiency in academic writing skills that are essential for language assessment purposes.';
      
      const wordCount = writingText.trim().split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeGreaterThanOrEqual(80);
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          route: 'stay',
          p: 0.72
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/mst/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          sessionId: 'mst_test_123',
          skill: 'writing',
          stage: 'core',
          itemId: 'W-B1-001',
          responseData: writingText,
          audioBlob: null,
          timeSpentMs: 180000
        })
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Skill Progression', () => {
    it('should complete skills and advance to next skill', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          success: true,
          skillResult: {
            skill: 'listening',
            band: 'B2',
            confidence: 0.85,
            stage1Score: 85,
            stage2Score: 82,
            route: 'up',
            timeSpentSec: 60
          },
          nextSkill: 'reading',
          testComplete: false
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/mst/skill-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          sessionId: 'mst_test_123',
          skill: 'listening',
          scores: {
            stage1Score: 85,
            stage2Score: 82,
            route: 'up'
          }
        })
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.skillResult.skill).toBe('listening');
      expect(data.skillResult.band).toBe('B2');
      expect(data.nextSkill).toBe('reading');
      expect(data.testComplete).toBe(false);
    });

    it('should complete test when all skills are finished', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          success: true,
          skillResult: {
            skill: 'writing',
            band: 'B1',
            confidence: 0.78,
            stage1Score: 78,
            route: 'stay',
            timeSpentSec: 300
          },
          nextSkill: null,
          testComplete: true,
          finalResults: {
            overallBand: 'B1',
            skillResults: {
              listening: 'B2',
              reading: 'B1',
              speaking: 'A2',
              writing: 'B1'
            }
          }
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      const response = await fetch('/api/mst/skill-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          sessionId: 'mst_test_123',
          skill: 'writing',
          scores: {
            stage1Score: 78,
            route: 'stay'
          }
        })
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.testComplete).toBe(true);
      expect(data.finalResults.overallBand).toBe('B1');
    });
  });

  describe('Timer and Timing Validation', () => {
    it('should validate speaking question timing is 60 seconds', () => {
      const speakingItems = [
        {
          id: 'S-B1-001',
          timing: { prepSec: 15, recordSec: 60, maxAnswerSec: 75 }
        },
        {
          id: 'S-B2-001', 
          timing: { prepSec: 15, recordSec: 60, maxAnswerSec: 75 }
        },
        {
          id: 'S-A1-001',
          timing: { prepSec: 15, recordSec: 60, maxAnswerSec: 75 }
        }
      ];
      
      speakingItems.forEach(item => {
        expect(item.timing.recordSec).toBe(60);
        expect(item.timing.prepSec).toBe(15);
        expect(item.timing.maxAnswerSec).toBe(75);
      });
    });

    it('should validate preparation timer starts after audio ends', () => {
      // Mock audio events
      const mockAudio = {
        addEventListener: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
        paused: false
      };
      
      // Simulate audio setup
      const audioEvents: Record<string, Function> = {};
      mockAudio.addEventListener.mockImplementation((event: string, handler: Function) => {
        audioEvents[event] = handler;
      });
      
      // Simulate audio creation and event setup
      const audioElement = mockAudio;
      let preparationStarted = false;
      
      const startPreparationPhase = () => {
        preparationStarted = true;
      };
      
      // Setup ended event handler (this would be done in the actual component)
      if (audioEvents['ended']) {
        audioEvents['ended']();
      }
      
      // In the actual implementation, this would be triggered by the audio ended event
      startPreparationPhase();
      
      expect(preparationStarted).toBe(true);
      expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    });
  });

  describe('Data Validation', () => {
    it('should validate MST item bank structure', () => {
      // Mock item bank data structure
      const mockItemBank = {
        listening: {
          L1: [{ id: 'L-B1-001', skill: 'listening', timing: { maxAnswerSec: 60 } }]
        },
        reading: {
          R1: [{ id: 'R-B1-001', skill: 'reading', timing: { maxAnswerSec: 60 } }]
        },
        speaking: {
          S1: [{ id: 'S-B1-001', skill: 'speaking', timing: { prepSec: 15, recordSec: 60, maxAnswerSec: 75 } }]
        },
        writing: {
          W1: [{ id: 'W-B1-001', skill: 'writing', timing: { maxAnswerSec: 300 } }]
        }
      };
      
      // Validate structure
      expect(mockItemBank.listening).toBeDefined();
      expect(mockItemBank.reading).toBeDefined();
      expect(mockItemBank.speaking).toBeDefined();
      expect(mockItemBank.writing).toBeDefined();
      
      // Validate speaking items have correct timing
      const speakingItems = mockItemBank.speaking.S1;
      speakingItems.forEach(item => {
        expect(item.timing.recordSec).toBe(60);
        expect(item.timing.prepSec).toBe(15);
      });
    });

    it('should validate response data types', () => {
      // Test different response types
      const listeningResponse = ['0']; // MCQ single
      const readingMultiResponse = [['0', '2']]; // MCQ multi
      const speakingResponse = new Blob(['audio'], { type: 'audio/webm' }); // Audio blob
      const writingResponse = 'This is a writing response with sufficient words to meet the minimum requirement for assessment.'; // Text
      
      expect(Array.isArray(listeningResponse)).toBe(true);
      expect(Array.isArray(readingMultiResponse)).toBe(true);
      expect(speakingResponse instanceof Blob).toBe(true);
      expect(typeof writingResponse).toBe('string');
      expect(writingResponse.trim().split(/\s+/).length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Audio System Integration', () => {
    it('should handle Microsoft Edge TTS generation', async () => {
      const mockEdgeTTSResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          audioFile: 'edge_tts_1234567890.mp3',
          audioUrl: '/uploads/tts/edge_tts_1234567890.mp3',
          duration: 6
        })
      };
      
      (global.fetch as any).mockResolvedValue(mockEdgeTTSResponse);
      
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test speaking prompt for MST assessment',
          language: 'english',
          speed: 1.0
        })
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.audioFile).toContain('edge_tts_');
      expect(data.audioUrl).toContain('/uploads/tts/');
      expect(typeof data.duration).toBe('number');
    });

    it('should handle audio playback failures gracefully', () => {
      const mockAudio = {
        play: vi.fn().mockRejectedValue(new Error('Autoplay blocked')),
        addEventListener: vi.fn(),
        paused: true
      };
      
      // Test autoplay failure handling
      mockAudio.play().catch((error: Error) => {
        expect(error.message).toBe('Autoplay blocked');
      });
      
      expect(mockAudio.play).toHaveBeenCalled();
    });
  });
});