// server/__tests__/teacher-coaching.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TeacherCoachingService } from '../services/teacher-coaching-service';
import { ReminderType } from '../services/teacher-coaching-service';

describe('TeacherCoachingService', () => {
  let coachingService: TeacherCoachingService;

  beforeEach(() => {
    vi.useFakeTimers();
    coachingService = new TeacherCoachingService();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('Session Management', () => {
    it('should start a coaching session', () => {
      const teacherId = 1;
      const studentId = 2;
      const sessionId = 'test-session-123';

      coachingService.startCoachingSession(teacherId, studentId, sessionId);
      
      const session = (coachingService as any).sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session.teacherId).toBe(teacherId);
      expect(session.studentId).toBe(studentId);
      expect(session.reminders).toEqual([]);
    });

    it('should emit coaching-session-started event', () => {
      const listener = vi.fn();
      coachingService.on('coaching-session-started', listener);

      coachingService.startCoachingSession(1, 2, 'test-session');
      
      expect(listener).toHaveBeenCalledWith({
        sessionId: 'test-session',
        teacherId: 1,
        studentId: 2
      });
    });

    it('should end a coaching session', () => {
      const sessionId = 'test-session-123';
      coachingService.startCoachingSession(1, 2, sessionId);
      
      const listener = vi.fn();
      coachingService.on('coaching-session-ended', listener);
      
      coachingService.endCoachingSession(sessionId);
      
      expect((coachingService as any).sessions.has(sessionId)).toBe(false);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Metrics Updates', () => {
    const sessionId = 'test-session';
    
    beforeEach(() => {
      coachingService.startCoachingSession(1, 2, sessionId);
    });

    it('should update TTT metrics and trigger reminder when teacher talks too much', () => {
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      coachingService.updateMetrics(sessionId, {
        tttPercentage: 75,
        studentEngagement: 70
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReminderType.TTT_IMBALANCE,
          sessionId,
          teacherId: 1
        })
      );
    });

    it('should trigger engagement reminder when student engagement is low', () => {
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      coachingService.updateMetrics(sessionId, {
        tttPercentage: 50,
        studentEngagement: 30
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReminderType.ENGAGEMENT_LOW,
          sessionId,
          teacherId: 1
        })
      );
    });

    it('should trigger silence reminder when silence percentage is high', () => {
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      coachingService.updateMetrics(sessionId, {
        silencePercentage: 45
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReminderType.SILENCE_DETECTED,
          sessionId,
          teacherId: 1
        })
      );
    });

    it('should not send duplicate reminders within 30 seconds', () => {
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      // First update triggers reminder
      coachingService.updateMetrics(sessionId, {
        tttPercentage: 75
      });
      expect(listener).toHaveBeenCalledTimes(1);

      // Second update within 30 seconds should not trigger
      coachingService.updateMetrics(sessionId, {
        tttPercentage: 80
      });
      expect(listener).toHaveBeenCalledTimes(1);

      // Advance time by 31 seconds
      vi.advanceTimersByTime(31000);

      // Third update after 30 seconds should trigger
      coachingService.updateMetrics(sessionId, {
        tttPercentage: 85
      });
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Manual Reminders', () => {
    it('should trigger manual reminder immediately', () => {
      const sessionId = 'test-session';
      coachingService.startCoachingSession(1, 2, sessionId);
      
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      coachingService.triggerManualReminder(
        sessionId,
        ReminderType.ENCOURAGE_QUESTIONS,
        'Please ask more questions'
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReminderType.ENCOURAGE_QUESTIONS,
          message: 'Please ask more questions',
          sessionId,
          teacherId: 1
        })
      );
    });
  });

  describe('Teaching Patterns', () => {
    const sessionId = 'test-session';
    
    beforeEach(() => {
      coachingService.startCoachingSession(1, 2, sessionId);
    });

    it('should detect monotonous pattern and suggest variation', () => {
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      // Simulate 5 minutes of teaching
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      // Update with no questions asked
      coachingService.updateMetrics(sessionId, {
        questionCount: 0
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReminderType.ENCOURAGE_QUESTIONS,
          sessionId
        })
      );
    });

    it('should suggest error correction when needed', () => {
      const listener = vi.fn();
      coachingService.on('coaching-reminder', listener);

      // Simulate 10 minutes of teaching
      vi.advanceTimersByTime(10 * 60 * 1000);
      
      // Low error correction rate
      coachingService.updateMetrics(sessionId, {
        errorCorrectionRate: 10
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReminderType.PROVIDE_CORRECTION,
          sessionId
        })
      );
    });
  });

  describe('Session Summary', () => {
    it('should generate session summary on end', () => {
      const sessionId = 'test-session';
      coachingService.startCoachingSession(1, 2, sessionId);
      
      // Add some reminders
      coachingService.updateMetrics(sessionId, { tttPercentage: 75 });
      vi.advanceTimersByTime(31000);
      coachingService.updateMetrics(sessionId, { studentEngagement: 30 });
      
      const listener = vi.fn();
      coachingService.on('coaching-session-ended', listener);
      
      coachingService.endCoachingSession(sessionId);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId,
          teacherId: 1,
          studentId: 2,
          reminderCount: 2,
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('Contextual Prompts', () => {
    it('should generate appropriate prompts based on reminder type', () => {
      const sessionId = 'test-session';
      coachingService.startCoachingSession(1, 2, sessionId);

      const prompts = (coachingService as any).getContextualPrompt(ReminderType.TTT_IMBALANCE);
      
      expect(prompts).toContain('🎯 Give the student more speaking time');
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should have different prompts for each reminder type', () => {
      const sessionId = 'test-session';
      coachingService.startCoachingSession(1, 2, sessionId);

      const tttPrompts = (coachingService as any).getContextualPrompt(ReminderType.TTT_IMBALANCE);
      const engagementPrompts = (coachingService as any).getContextualPrompt(ReminderType.ENGAGEMENT_LOW);
      
      expect(tttPrompts).not.toEqual(engagementPrompts);
    });
  });

  describe('Edge Cases', () => {
    it('should handle updates for non-existent session', () => {
      expect(() => {
        coachingService.updateMetrics('non-existent', { tttPercentage: 50 });
      }).not.toThrow();
    });

    it('should handle ending non-existent session', () => {
      expect(() => {
        coachingService.endCoachingSession('non-existent');
      }).not.toThrow();
    });

    it('should clean up timers on session end', () => {
      const sessionId = 'test-session';
      coachingService.startCoachingSession(1, 2, sessionId);
      
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      coachingService.endCoachingSession(sessionId);
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});