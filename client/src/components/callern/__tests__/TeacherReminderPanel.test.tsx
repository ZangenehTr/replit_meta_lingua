// client/src/components/callern/__tests__/TeacherReminderPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TeacherReminderPanel } from '../TeacherReminderPanel';
import { useSocket } from '@/hooks/useSocket';
import '@testing-library/jest-dom';

// Mock the socket hook
vi.mock('@/hooks/useSocket');

describe('TeacherReminderPanel', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSocket as any).mockReturnValue(mockSocket);
  });

  describe('Rendering', () => {
    it('should render the panel when visible', () => {
      render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      expect(screen.getByText('Teaching Assistant')).toBeInTheDocument();
    });

    it('should apply correct position class', () => {
      const { container } = render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
          position="top-right"
        />
      );

      const panel = container.querySelector('.fixed');
      expect(panel).toHaveClass('top-4', 'right-4');
    });

    it('should hide panel when visible is false', () => {
      const { container } = render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
          visible={false}
        />
      );

      const panel = container.querySelector('.fixed');
      expect(panel).toHaveStyle({ display: 'none' });
    });
  });

  describe('Socket Events', () => {
    it('should listen for coaching reminders', () => {
      render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      expect(mockSocket.on).toHaveBeenCalledWith('coaching-reminder', expect.any(Function));
    });

    it('should display reminder when received', async () => {
      render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      // Get the callback function that was registered
      const coachingCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'coaching-reminder'
      )?.[1];

      // Simulate receiving a reminder
      coachingCallback({
        type: 'ttt_imbalance',
        message: 'Give the student more speaking time',
        sessionId: 'test-session',
        teacherId: 1,
        severity: 'high'
      });

      await waitFor(() => {
        expect(screen.getByText('Give the student more speaking time')).toBeInTheDocument();
      });
    });

    it('should filter reminders by session', () => {
      render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      const coachingCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'coaching-reminder'
      )?.[1];

      // Send reminder for different session
      coachingCallback({
        type: 'ttt_imbalance',
        message: 'Test message',
        sessionId: 'different-session',
        teacherId: 1
      });

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('should clean up socket listeners on unmount', () => {
      const { unmount } = render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('coaching-reminder');
    });
  });

  describe('Reminder Display', () => {
    it('should show severity indicator', async () => {
      const { container } = render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      const coachingCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'coaching-reminder'
      )?.[1];

      coachingCallback({
        type: 'engagement_low',
        message: 'Student seems disengaged',
        sessionId: 'test-session',
        teacherId: 1,
        severity: 'high'
      });

      await waitFor(() => {
        const indicator = container.querySelector('.bg-red-500');
        expect(indicator).toBeInTheDocument();
      });
    });

    it('should limit number of visible reminders', async () => {
      render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      const coachingCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'coaching-reminder'
      )?.[1];

      // Send multiple reminders
      for (let i = 1; i <= 10; i++) {
        coachingCallback({
          type: 'general',
          message: `Reminder ${i}`,
          sessionId: 'test-session',
          teacherId: 1
        });
      }

      await waitFor(() => {
        const reminders = screen.getAllByText(/Reminder \d+/);
        expect(reminders.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-dismiss reminders after timeout', async () => {
      render(
        <TeacherReminderPanel
          sessionId="test-session"
          teacherId={1}
          studentId={2}
        />
      );

      const coachingCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'coaching-reminder'
      )?.[1];

      coachingCallback({
        type: 'general',
        message: 'Test reminder',
        sessionId: 'test-session',
        teacherId: 1
      });

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      // Fast-forward time by 10 seconds
      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(screen.queryByText('Test reminder')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reminder Types', () => {
    const reminderTypes = [
      { type: 'ttt_imbalance', icon: '🎯' },
      { type: 'engagement_low', icon: '💡' },
      { type: 'silence_detected', icon: '🔇' },
      { type: 'encourage_questions', icon: '❓' },
      { type: 'provide_feedback', icon: '💬' }
    ];

    reminderTypes.forEach(({ type, icon }) => {
      it(`should display correct icon for ${type}`, async () => {
        render(
          <TeacherReminderPanel
            sessionId="test-session"
            teacherId={1}
            studentId={2}
          />
        );

        const coachingCallback = mockSocket.on.mock.calls.find(
          call => call[0] === 'coaching-reminder'
        )?.[1];

        coachingCallback({
          type,
          message: `${type} message`,
          sessionId: 'test-session',
          teacherId: 1
        });

        await waitFor(() => {
          expect(screen.getByText(icon)).toBeInTheDocument();
        });
      });
    });
  });
});