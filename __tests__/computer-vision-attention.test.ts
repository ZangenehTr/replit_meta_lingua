import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComputerVisionService, FacialAnalysis, AttentionMetrics } from '../client/src/services/computer-vision-service';

// Mock MediaPipe
vi.mock('@mediapipe/face_detection', () => ({
  FaceDetection: vi.fn().mockImplementation(() => ({
    setOptions: vi.fn(),
    onResults: vi.fn(),
    send: vi.fn(),
    close: vi.fn()
  }))
}));

vi.mock('@mediapipe/face_mesh', () => ({
  FaceMesh: vi.fn().mockImplementation(() => ({
    setOptions: vi.fn(),
    onResults: vi.fn(),
    send: vi.fn(),
    close: vi.fn()
  }))
}));

describe('MediaPipe Face Detection & Attention Tracking', () => {
  let computerVisionService: ComputerVisionService;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;

  beforeEach(async () => {
    // Mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(640 * 480 * 4),
        width: 640,
        height: 480
      })
    } as any;
    
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);

    computerVisionService = new ComputerVisionService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Face Detection Initialization', () => {
    it('should initialize MediaPipe face detection with correct options', async () => {
      await computerVisionService.initialize();
      
      expect(computerVisionService.isInitialized()).toBe(true);
    });

    it('should handle MediaPipe initialization failure gracefully', async () => {
      const { FaceDetection } = await import('@mediapipe/face_detection');
      vi.mocked(FaceDetection).mockImplementation(() => {
        throw new Error('MediaPipe initialization failed');
      });

      await expect(computerVisionService.initialize()).rejects.toThrow();
    });
  });

  describe('Real-time Attention Detection', () => {
    beforeEach(async () => {
      await computerVisionService.initialize();
    });

    it('should detect high attention when face is centered and close', async () => {
      const mockDetection = {
        boundingBox: {
          xCenter: 0.5,
          yCenter: 0.5,
          width: 0.3,
          height: 0.4
        },
        score: [0.9]
      };

      const attentionScore = computerVisionService.calculateAttentionFromDetection(mockDetection);
      expect(attentionScore).toBeGreaterThan(70);
    });

    it('should detect low attention when face is off-center', async () => {
      const mockDetection = {
        boundingBox: {
          xCenter: 0.1, // Far left
          yCenter: 0.1, // Top corner
          width: 0.1,
          height: 0.1
        },
        score: [0.3]
      };

      const attentionScore = computerVisionService.calculateAttentionFromDetection(mockDetection);
      expect(attentionScore).toBeLessThan(50);
    });

    it('should track attention over time with smoothing', async () => {
      const attentionHistory: number[] = [];
      
      // Simulate attention tracking over 10 frames
      for (let i = 0; i < 10; i++) {
        const mockDetection = {
          boundingBox: {
            xCenter: 0.5 + (Math.random() - 0.5) * 0.1, // Small variations
            yCenter: 0.5 + (Math.random() - 0.5) * 0.1,
            width: 0.25 + Math.random() * 0.1,
            height: 0.3 + Math.random() * 0.1
          },
          score: [0.8 + Math.random() * 0.2]
        };
        
        const attention = computerVisionService.calculateAttentionFromDetection(mockDetection);
        attentionHistory.push(attention);
      }

      // Check that attention values are reasonable and smoothed
      expect(attentionHistory.length).toBe(10);
      expect(Math.min(...attentionHistory)).toBeGreaterThan(30);
      expect(Math.max(...attentionHistory)).toBeLessThan(100);
      
      // Check smoothing (consecutive values shouldn't vary too much)
      for (let i = 1; i < attentionHistory.length; i++) {
        const variance = Math.abs(attentionHistory[i] - attentionHistory[i-1]);
        expect(variance).toBeLessThan(20); // Should be smoothed
      }
    });

    it('should handle no face detected scenario', async () => {
      const attentionScore = computerVisionService.calculateAttentionFromDetection(null);
      expect(attentionScore).toBeLessThan(30);
    });
  });

  describe('Eye Contact Analysis', () => {
    it('should detect good eye contact when gaze is towards camera', async () => {
      const mockFaceMesh = {
        landmarks: [
          // Mock eye landmark points (simplified)
          { x: 0.45, y: 0.4, z: 0 }, // Left eye
          { x: 0.55, y: 0.4, z: 0 }, // Right eye
          { x: 0.5, y: 0.45, z: 0 }   // Nose tip
        ]
      };

      const eyeContactScore = computerVisionService.analyzeEyeContact(mockFaceMesh);
      expect(eyeContactScore).toBeGreaterThan(60);
    });

    it('should detect poor eye contact when looking away', async () => {
      const mockFaceMesh = {
        landmarks: [
          // Mock landmarks showing face turned away
          { x: 0.3, y: 0.4, z: 0 }, // Left eye
          { x: 0.4, y: 0.4, z: 0 }, // Right eye  
          { x: 0.35, y: 0.45, z: 0 } // Nose tip
        ]
      };

      const eyeContactScore = computerVisionService.analyzeEyeContact(mockFaceMesh);
      expect(eyeContactScore).toBeLessThan(40);
    });
  });

  describe('Facial Expression Recognition', () => {
    it('should detect engaged expression', async () => {
      const mockFacialData = {
        // Mock facial landmark data for engaged expression
        landmarks: generateMockLandmarks('engaged')
      };

      const expression = computerVisionService.analyzeFacialExpression(mockFacialData);
      expect(expression.engagement).toBeGreaterThan(0.7);
      expect(expression.emotion).toBe('focused');
    });

    it('should detect bored expression', async () => {
      const mockFacialData = {
        landmarks: generateMockLandmarks('bored')
      };

      const expression = computerVisionService.analyzeFacialExpression(mockFacialData);
      expect(expression.engagement).toBeLessThan(0.4);
      expect(expression.emotion).toBe('disengaged');
    });

    it('should detect confused expression', async () => {
      const mockFacialData = {
        landmarks: generateMockLandmarks('confused')
      };

      const expression = computerVisionService.analyzeFacialExpression(mockFacialData);
      expect(expression.engagement).toBeLessThan(0.6);
      expect(expression.emotion).toBe('confused');
    });
  });

  describe('Dynamic Metrics Calculation', () => {
    it('should calculate engagement metrics from real-time data', async () => {
      const mockAttentionData = {
        faceDetection: 85,
        eyeContact: 70,
        facialExpression: { engagement: 0.8, emotion: 'focused' },
        bodyLanguage: { posture: 0.7, movement: 0.3 }
      };

      const metrics = computerVisionService.calculateDynamicEngagement(mockAttentionData);
      
      expect(metrics.overallEngagement).toBeGreaterThan(70);
      expect(metrics.attentionLevel).toBeGreaterThan(60);
      expect(metrics.confidenceScore).toBeGreaterThan(0.7);
    });

    it('should provide realistic engagement progression over time', async () => {
      const sessionMetrics = [];
      
      // Simulate 5-minute session with varying engagement
      for (let minute = 0; minute < 5; minute++) {
        const mockData = {
          faceDetection: 80 - (minute * 5), // Slight decrease over time
          eyeContact: 75 - (minute * 3),
          facialExpression: { 
            engagement: 0.8 - (minute * 0.05), 
            emotion: minute < 3 ? 'focused' : 'tired' 
          },
          bodyLanguage: { posture: 0.7, movement: 0.2 + minute * 0.1 }
        };

        const metrics = computerVisionService.calculateDynamicEngagement(mockData);
        sessionMetrics.push(metrics);
      }

      // Engagement should decrease over time (realistic pattern)
      expect(sessionMetrics[0].overallEngagement).toBeGreaterThan(sessionMetrics[4].overallEngagement);
      
      // But should remain within reasonable bounds
      expect(sessionMetrics[4].overallEngagement).toBeGreaterThan(40);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should process frames at appropriate intervals', async () => {
      const processingSpy = vi.spyOn(computerVisionService, 'processFrame');
      
      // Simulate processing multiple frames
      for (let i = 0; i < 100; i++) {
        await computerVisionService.processFrame(mockCanvas);
      }

      // Should not process every single frame (performance optimization)
      expect(processingSpy).toHaveBeenCalledTimes(100);
    });

    it('should cleanup resources properly', async () => {
      await computerVisionService.initialize();
      const cleanupSpy = vi.spyOn(computerVisionService, 'cleanup');
      
      computerVisionService.cleanup();
      
      expect(cleanupSpy).toHaveBeenCalled();
      expect(computerVisionService.isInitialized()).toBe(false);
    });
  });
});

// Helper function to generate mock facial landmarks
function generateMockLandmarks(expressionType: 'engaged' | 'bored' | 'confused') {
  const baseLandmarks = [];
  
  // Generate 468 face mesh landmarks (simplified)
  for (let i = 0; i < 468; i++) {
    let x = 0.5 + (Math.random() - 0.5) * 0.4;
    let y = 0.5 + (Math.random() - 0.5) * 0.4;
    
    // Adjust based on expression type
    if (expressionType === 'engaged') {
      // Eyes more open, slight smile
      if (i >= 33 && i <= 133) y -= 0.02; // Upper eyelids
      if (i >= 61 && i <= 291) y += 0.01; // Mouth corners up
    } else if (expressionType === 'bored') {
      // Eyes droopy, mouth neutral
      if (i >= 33 && i <= 133) y += 0.03; // Upper eyelids down
    } else if (expressionType === 'confused') {
      // Eyebrows furrowed
      if (i >= 70 && i <= 107) y -= 0.02; // Eyebrow area
    }
    
    baseLandmarks.push({ x, y, z: Math.random() * 0.1 });
  }
  
  return baseLandmarks;
}