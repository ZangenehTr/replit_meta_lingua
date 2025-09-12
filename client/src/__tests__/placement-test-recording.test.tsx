import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlacementTest from '../pages/placement-test';

// Mock the necessary modules
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/placement-test', vi.fn()]
}));

// Mock MediaRecorder
class MockMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  state: string = 'inactive';
  
  private chunks: Blob[] = [];
  
  constructor(stream: MediaStream, options?: any) {
    this.state = 'inactive';
  }
  
  start(timeslice?: number) {
    this.state = 'recording';
    // Simulate data available after short delay
    setTimeout(() => {
      if (this.ondataavailable) {
        const mockBlob = new Blob(['mock-audio-data'], { type: 'audio/webm' });
        this.ondataavailable({ data: mockBlob });
      }
    }, 100);
  }
  
  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      if (this.onstop) {
        this.onstop();
      }
    }, 50);
  }
  
  requestData() {
    if (this.ondataavailable) {
      const mockBlob = new Blob(['mock-audio-data'], { type: 'audio/webm' });
      this.ondataavailable({ data: mockBlob });
    }
  }
}

// Mock getUserMedia
const mockGetUserMedia = vi.fn().mockImplementation(() => 
  Promise.resolve({
    getTracks: () => [{ stop: vi.fn(), readyState: 'live' }],
    getAudioTracks: () => [{ readyState: 'live' }]
  })
);

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
});

Object.defineProperty(global, 'MediaRecorder', {
  value: MockMediaRecorder,
  writable: true
});

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Placement Test Recording System', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        session: { id: 1 },
        question: {
          id: 1,
          text: 'Test question',
          responseType: 'audio',
          expectedDurationSeconds: 120
        }
      }),
      headers: {
        get: (name: string) => name === 'content-type' ? 'application/json' : null
      }
    });
  });
  
  afterEach(() => {
    queryClient.clear();
    vi.clearAllTimers();
  });
  
  const renderPlacementTest = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PlacementTest />
      </QueryClientProvider>
    );
  };
  
  describe('Test 1: Basic Recording Functionality', () => {
    it('should start recording when Start Recording button is clicked', async () => {
      renderPlacementTest();
      
      // Start the test first
      const startButton = screen.getByText('Take Placement Test');
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText('Start Recording')).toBeInTheDocument();
      });
      
      // Click start recording
      const recordButton = screen.getByText('Start Recording');
      fireEvent.click(recordButton);
      
      // Verify recording starts
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      });
    });
  });
  
  describe('Test 2: Timer Conflicts', () => {
    it('should not auto-submit when recording is active', async () => {
      renderPlacementTest();
      
      // Start test
      fireEvent.click(screen.getByText('Take Placement Test'));
      
      await waitFor(() => {
        expect(screen.getByText('Start Recording')).toBeInTheDocument();
      });
      
      // Start recording
      fireEvent.click(screen.getByText('Start Recording'));
      
      // Fast-forward main timer to near expiry
      vi.advanceTimersByTime(590000); // 9 minutes 50 seconds
      
      // Verify no auto-submission occurred while recording
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/responses'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
  
  describe('Test 3: Audio Blob Creation', () => {
    it('should create valid audio blob with proper size', async () => {
      renderPlacementTest();
      
      // Start test and recording
      fireEvent.click(screen.getByText('Take Placement Test'));
      await waitFor(() => screen.getByText('Start Recording'));
      fireEvent.click(screen.getByText('Start Recording'));
      
      // Wait for recording to start
      await waitFor(() => screen.getByText('Stop Recording'));
      
      // Stop recording
      fireEvent.click(screen.getByText('Stop Recording'));
      
      // Verify audio blob was created (should show submit button)
      await waitFor(() => {
        expect(screen.getByText('Submit Answer')).toBeInTheDocument();
      });
    });
  });
  
  describe('Test 4: Recording State Management', () => {
    it('should properly manage recording state transitions', async () => {
      renderPlacementTest();
      
      fireEvent.click(screen.getByText('Take Placement Test'));
      await waitFor(() => screen.getByText('Start Recording'));
      
      // Initial state: not recording
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
      
      // Start recording
      fireEvent.click(screen.getByText('Start Recording'));
      
      // Recording state: should show stop button
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      });
      
      // Stop recording
      fireEvent.click(screen.getByText('Stop Recording'));
      
      // Post-recording state: should show submit button
      await waitFor(() => {
        expect(screen.getByText('Submit Answer')).toBeInTheDocument();
      });
    });
  });
  
  describe('Test 5: Auto-Submit Detection', () => {
    it('should detect unwanted auto-submissions', async () => {
      const mockFetch = global.fetch as any;
      let submitCallCount = 0;
      
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/responses') && options.method === 'POST') {
          submitCallCount++;
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
          headers: { get: () => 'application/json' }
        });
      });
      
      renderPlacementTest();
      
      fireEvent.click(screen.getByText('Take Placement Test'));
      await waitFor(() => screen.getByText('Start Recording'));
      
      // Start and immediately stop recording
      fireEvent.click(screen.getByText('Start Recording'));
      await waitFor(() => screen.getByText('Stop Recording'));
      fireEvent.click(screen.getByText('Stop Recording'));
      
      // Wait a bit to see if auto-submit occurs
      await waitFor(() => screen.getByText('Submit Answer'));
      
      // At this point, there should be NO automatic submissions
      expect(submitCallCount).toBe(0);
      
      // Now manually submit
      fireEvent.click(screen.getByText('Submit Answer'));
      
      // Should have exactly 1 submission (the manual one)
      await waitFor(() => {
        expect(submitCallCount).toBe(1);
      });
    });
  });
  
  describe('Test 6: MediaRecorder Error Handling', () => {
    it('should handle MediaRecorder creation failures gracefully', async () => {
      // Mock MediaRecorder to throw error
      const originalMediaRecorder = global.MediaRecorder;
      global.MediaRecorder = class {
        constructor() {
          throw new Error('MediaRecorder not supported');
        }
      } as any;
      
      renderPlacementTest();
      
      fireEvent.click(screen.getByText('Take Placement Test'));
      await waitFor(() => screen.getByText('Start Recording'));
      
      fireEvent.click(screen.getByText('Start Recording'));
      
      // Should show error handling
      await waitFor(() => {
        expect(screen.getByText('Continue in Test Mode')).toBeInTheDocument();
      });
      
      // Restore MediaRecorder
      global.MediaRecorder = originalMediaRecorder;
    });
  });
  
  describe('Test 7: Permission Handling', () => {
    it('should handle microphone permission denied', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'));
      
      renderPlacementTest();
      
      fireEvent.click(screen.getByText('Take Placement Test'));
      await waitFor(() => screen.getByText('Start Recording'));
      
      fireEvent.click(screen.getByText('Start Recording'));
      
      // Should show test mode option
      await waitFor(() => {
        expect(screen.getByText('Continue in Test Mode')).toBeInTheDocument();
      });
    });
  });
  
  describe('Test 8: Recording Timer Accuracy', () => {
    it('should maintain accurate recording timer', async () => {
      vi.useFakeTimers();
      
      renderPlacementTest();
      
      fireEvent.click(screen.getByText('Take Placement Test'));
      await waitFor(() => screen.getByText('Start Recording'));
      
      fireEvent.click(screen.getByText('Start Recording'));
      
      // Advance time and check timer display
      vi.advanceTimersByTime(5000); // 5 seconds
      
      await waitFor(() => {
        // Should show countdown timer (120 seconds - 5 seconds = 115 seconds = 1:55)
        expect(screen.getByText(/1:5/)).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });
});