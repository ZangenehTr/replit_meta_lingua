import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpeechRecognitionService } from '../client/src/services/speech-recognition-service';

// Mock Web Speech API
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US'
};

// Mock global objects
Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn(() => mockSpeechRecognition),
  configurable: true
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: vi.fn(() => mockSpeechRecognition),
  configurable: true
});

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;

  beforeEach(() => {
    service = new SpeechRecognitionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.stopRecognition();
  });

  describe('Voice Recognition', () => {
    it('should initialize speech recognition with proper settings', () => {
      expect(service.isSupported()).toBe(true);
      
      service.startRecognition('fa', vi.fn());
      
      expect(mockSpeechRecognition.continuous).toBe(true);
      expect(mockSpeechRecognition.interimResults).toBe(true);
      expect(mockSpeechRecognition.lang).toBe('fa');
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should handle transcription results', async () => {
      const onTranscript = vi.fn();
      service.startRecognition('en', onTranscript);

      // Simulate speech recognition event
      const mockEvent = {
        results: [{
          0: { transcript: 'Hello world' },
          isFinal: true
        }]
      };

      // Get the event handler that was registered
      const resultHandler = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'result')?.[1];

      if (resultHandler) {
        resultHandler(mockEvent);
        expect(onTranscript).toHaveBeenCalledWith('Hello world', true);
      }
    });

    it('should handle recognition errors gracefully', () => {
      const onTranscript = vi.fn();
      service.startRecognition('en', onTranscript);

      // Simulate error event
      const errorHandler = mockSpeechRecognition.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];

      if (errorHandler) {
        errorHandler({ error: 'network' });
        // Should not crash and should handle error gracefully
        expect(service.isListening()).toBe(false);
      }
    });
  });

  describe('Language Support', () => {
    it('should support multiple languages', () => {
      const languages = ['en', 'fa', 'ar', 'fr', 'es'];
      
      languages.forEach(lang => {
        service.startRecognition(lang, vi.fn());
        expect(mockSpeechRecognition.lang).toBe(lang);
        service.stopRecognition();
      });
    });

    it('should handle unsupported languages gracefully', () => {
      service.startRecognition('xyz', vi.fn());
      // Should default to English or handle gracefully
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should track listening state correctly', () => {
      expect(service.isListening()).toBe(false);
      
      service.startRecognition('en', vi.fn());
      expect(service.isListening()).toBe(true);
      
      service.stopRecognition();
      expect(service.isListening()).toBe(false);
    });

    it('should prevent multiple simultaneous recognition sessions', () => {
      service.startRecognition('en', vi.fn());
      service.startRecognition('fa', vi.fn());
      
      // Should only call start once (second call should be ignored)
      expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(1);
    });
  });
});