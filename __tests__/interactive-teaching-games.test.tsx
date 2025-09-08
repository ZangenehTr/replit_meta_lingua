import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveActivityGame } from '../client/src/components/callern/LiveActivityGame';
import { useSocket } from '../client/src/hooks/use-socket';

// Mock useSocket hook
vi.mock('../client/src/hooks/use-socket');
const mockUseSocket = vi.mocked(useSocket);

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

describe('Interactive Teaching Games', () => {
  const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  };

  const defaultProps = {
    roomId: 'test-room',
    role: 'student' as const,
    isVisible: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    mockUseSocket.mockReturnValue({ socket: mockSocket });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Poll Activities', () => {
    it('should render poll activity correctly', () => {
      const pollActivity = {
        type: 'poll',
        content: {
          question: 'What\'s most important in a job?',
          options: ['Good salary', 'Work-life balance', 'Career growth', 'Interesting work'],
          anonymous: true
        },
        context: 'Generated from career discussion',
        timeLimit: 60
      };

      render(<LiveActivityGame {...defaultProps} />);

      // Simulate receiving poll activity
      const socketOnMock = mockSocket.on as vi.Mock;
      const activityStartedHandler = socketOnMock.mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];

      if (activityStartedHandler) {
        activityStartedHandler(pollActivity);
      }

      expect(screen.getByText('What\'s most important in a job?')).toBeInTheDocument();
      expect(screen.getByText('Good salary')).toBeInTheDocument();
      expect(screen.getByText('Work-life balance')).toBeInTheDocument();
      expect(screen.getByText('Career growth')).toBeInTheDocument();
      expect(screen.getByText('Interesting work')).toBeInTheDocument();
    });

    it('should handle poll answer selection', async () => {
      const pollActivity = {
        type: 'poll',
        content: {
          question: 'What\'s most important in a job?',
          options: ['Good salary', 'Work-life balance', 'Career growth', 'Interesting work']
        },
        timeLimit: 60
      };

      render(<LiveActivityGame {...defaultProps} />);

      // Simulate activity start
      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(pollActivity);

      // Click on an option
      const option = screen.getByText('Work-life balance');
      fireEvent.click(option);

      // Should show submit button
      const submitButton = screen.getByText('Submit Answer');
      expect(submitButton).toBeInTheDocument();

      fireEvent.click(submitButton);

      // Should emit answer
      expect(mockSocket.emit).toHaveBeenCalledWith('submit-activity-answer', {
        roomId: 'test-room',
        activityType: 'poll',
        answer: 1 // Index of selected option
      });
    });
  });

  describe('Gap Fill Activities', () => {
    it('should render gap-fill activity with options', () => {
      const gapFillActivity = {
        type: 'gap-fill',
        content: {
          title: 'Restaurant Conversation',
          sentence: 'I would like to ____ a table for two people at 7 PM.',
          options: ['book', 'reserve', 'get', 'buy'],
          correct: 'book'
        },
        timeLimit: 45
      };

      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(gapFillActivity);

      expect(screen.getByText('Restaurant Conversation')).toBeInTheDocument();
      expect(screen.getByText(/I would like to ____ a table/)).toBeInTheDocument();
      expect(screen.getByText('book')).toBeInTheDocument();
      expect(screen.getByText('reserve')).toBeInTheDocument();
      expect(screen.getByText('get')).toBeInTheDocument();
      expect(screen.getByText('buy')).toBeInTheDocument();
    });

    it('should validate gap-fill answers correctly', async () => {
      const gapFillActivity = {
        type: 'gap-fill',
        content: {
          title: 'Restaurant Conversation',
          sentence: 'I would like to ____ a table for two people.',
          options: ['book', 'reserve', 'get', 'buy'],
          correct: 'book'
        }
      };

      render(<LiveActivityGame {...defaultProps} />);

      // Start activity
      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(gapFillActivity);

      // Select correct answer
      fireEvent.click(screen.getByText('book'));
      fireEvent.click(screen.getByText('Submit Answer'));

      expect(mockSocket.emit).toHaveBeenCalledWith('submit-activity-answer', {
        roomId: 'test-room',
        activityType: 'gap-fill',
        answer: 'book'
      });

      // Simulate correct result
      const resultsHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-results'
      )?.[1];
      resultsHandler({
        correct: true,
        explanation: 'Correct! "Book" means to reserve a table.'
      });

      await waitFor(() => {
        expect(screen.getByText('🎉 Correct!')).toBeInTheDocument();
        expect(screen.getByText('Correct! "Book" means to reserve a table.')).toBeInTheDocument();
      });
    });
  });

  describe('Word Selection Activities', () => {
    it('should render word selection activity', () => {
      const wordSelectionActivity = {
        type: 'word-selection',
        content: {
          title: 'Choose the Travel Word',
          sentence: 'I want to [CHOOSE] different countries and learn about their cultures.',
          options: ['see', 'visit', 'watch', 'look'],
          correct: 'visit'
        }
      };

      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(wordSelectionActivity);

      expect(screen.getByText('Choose the Travel Word')).toBeInTheDocument();
      expect(screen.getByText(/I want to \[CHOOSE\] different countries/)).toBeInTheDocument();
      expect(screen.getByText('visit')).toBeInTheDocument();
    });

    it('should handle word selection answers', () => {
      const wordSelectionActivity = {
        type: 'word-selection',
        content: {
          title: 'Choose the Travel Word',
          sentence: 'I want to [CHOOSE] different countries.',
          options: ['see', 'visit', 'watch', 'look'],
          correct: 'visit'
        }
      };

      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(wordSelectionActivity);

      fireEvent.click(screen.getByText('visit'));
      fireEvent.click(screen.getByText('Submit Answer'));

      expect(mockSocket.emit).toHaveBeenCalledWith('submit-activity-answer', {
        roomId: 'test-room',
        activityType: 'word-selection',
        answer: 'visit'
      });
    });
  });

  describe('Matching Activities', () => {
    it('should render vocabulary matching game', () => {
      const matchingActivity = {
        type: 'matching',
        content: {
          type: 'matching',
          title: 'Weather Vocabulary Match',
          items: [
            { word: 'sunny', match: '☀️ bright and clear' },
            { word: 'rainy', match: '🌧️ water falling' },
            { word: 'cloudy', match: '☁️ gray sky' },
            { word: 'windy', match: '💨 air moving fast' }
          ]
        }
      };

      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(matchingActivity);

      expect(screen.getByText('Weather Vocabulary Match')).toBeInTheDocument();
      expect(screen.getByText('sunny')).toBeInTheDocument();
      expect(screen.getByText('☀️ bright and clear')).toBeInTheDocument();
      expect(screen.getByText('rainy')).toBeInTheDocument();
      expect(screen.getByText('🌧️ water falling')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('should display countdown timer', async () => {
      const timedActivity = {
        type: 'poll',
        content: { question: 'Test question?', options: ['A', 'B'] },
        timeLimit: 60
      };

      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(timedActivity);

      // Should show timer
      expect(screen.getByText(/60s/)).toBeInTheDocument();
    });

    it('should auto-submit when timer expires for students', async () => {
      vi.useFakeTimers();

      const timedActivity = {
        type: 'poll',
        content: { question: 'Test?', options: ['A', 'B'] },
        timeLimit: 2
      };

      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'
      )?.[1];
      activityStartedHandler(timedActivity);

      // Select an answer
      fireEvent.click(screen.getByText('A'));

      // Fast forward timer
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('submit-activity-answer', expect.any(Object));
      });

      vi.useRealTimers();
    });
  });

  describe('Teacher vs Student Views', () => {
    it('should show start activity button for teachers', () => {
      const teacherProps = { ...defaultProps, role: 'teacher' as const };
      
      render(<LiveActivityGame {...teacherProps} />);

      // Simulate teacher receiving activity suggestion
      const suggestionHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'live-activity-suggestion'
      )?.[1];
      
      if (suggestionHandler) {
        suggestionHandler({
          type: 'poll',
          content: { question: 'Test?', options: ['A', 'B'] }
        });
      }

      expect(screen.getByText('Start Activity')).toBeInTheDocument();
    });

    it('should not show start button for students', () => {
      render(<LiveActivityGame {...defaultProps} />);

      const suggestionHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'live-activity-suggestion'
      )?.[1];
      
      if (suggestionHandler) {
        suggestionHandler({
          type: 'poll',  
          content: { question: 'Test?', options: ['A', 'B'] }
        });
      }

      expect(screen.queryByText('Start Activity')).not.toBeInTheDocument();
    });

    it('should emit start activity event when teacher clicks start', () => {
      const teacherProps = { ...defaultProps, role: 'teacher' as const };
      
      render(<LiveActivityGame {...teacherProps} />);

      const suggestionHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'live-activity-suggestion'
      )?.[1];
      
      const testActivity = {
        type: 'poll',
        content: { question: 'Test?', options: ['A', 'B'] }
      };
      
      if (suggestionHandler) {
        suggestionHandler(testActivity);
      }

      fireEvent.click(screen.getByText('Start Activity'));

      expect(mockSocket.emit).toHaveBeenCalledWith('start-activity', {
        roomId: 'test-room',
        activity: testActivity
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing socket gracefully', () => {
      mockUseSocket.mockReturnValue({ socket: null });
      
      expect(() => {
        render(<LiveActivityGame {...defaultProps} />);
      }).not.toThrow();
    });

    it('should handle malformed activity data', () => {
      render(<LiveActivityGame {...defaultProps} />);

      const activityStartedHandler = (mockSocket.on as vi.Mock).mock.calls.find(
        call => call[0] === 'activity-started'  
      )?.[1];

      // Should not crash with invalid data
      expect(() => {
        activityStartedHandler({ invalid: 'data' });
      }).not.toThrow();
    });
  });
});