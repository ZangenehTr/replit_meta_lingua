import { EventEmitter } from 'events';

interface TeachingMetrics {
  tttPercentage: number; // Teacher Talk Time percentage
  studentEngagement: number; // 0-100 scale
  silencePercentage: number;
  questionCount: number;
  openEndedQuestionRatio: number;
  averageStudentResponseLength: number;
  sessionDuration: number; // in seconds
  errorCorrectionCount: number;
  praiseCount: number;
  interruptionCount: number;
}

interface CoachingReminder {
  id: string;
  type: 'ttt' | 'engagement' | 'questioning' | 'feedback' | 'pacing' | 'encouragement';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestion: string;
  timestamp: Date;
  metrics?: Partial<TeachingMetrics>;
  actionable: boolean;
  priority: number; // 1-10, higher is more important
}

interface CoachingSession {
  teacherId: number;
  studentId: number;
  sessionId: string;
  startTime: Date;
  reminders: CoachingReminder[];
  metrics: TeachingMetrics;
  lastReminderTime: Date | null;
}

export class TeacherCoachingService extends EventEmitter {
  private sessions: Map<string, CoachingSession> = new Map();
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Configurable thresholds
  private readonly THRESHOLDS = {
    TTT_WARNING: 40, // Warn when teacher talks > 40%
    TTT_CRITICAL: 60, // Critical when teacher talks > 60%
    MIN_STUDENT_ENGAGEMENT: 60,
    MIN_OPEN_ENDED_RATIO: 0.3,
    MAX_SILENCE_PERCENTAGE: 20,
    MIN_PRAISE_INTERVAL: 300, // 5 minutes
    MAX_ERROR_CORRECTIONS_WITHOUT_PRAISE: 3,
    MIN_TIME_BETWEEN_REMINDERS: 30000, // 30 seconds
    CHECK_INTERVAL: 15000, // Check every 15 seconds
  };

  constructor() {
    super();
  }

  /**
   * Start coaching session for a call
   */
  startCoachingSession(teacherId: number, studentId: number, sessionId: string): void {
    const session: CoachingSession = {
      teacherId,
      studentId,
      sessionId,
      startTime: new Date(),
      reminders: [],
      metrics: {
        tttPercentage: 0,
        studentEngagement: 100,
        silencePercentage: 0,
        questionCount: 0,
        openEndedQuestionRatio: 0,
        averageStudentResponseLength: 0,
        sessionDuration: 0,
        errorCorrectionCount: 0,
        praiseCount: 0,
        interruptionCount: 0,
      },
      lastReminderTime: null,
    };

    this.sessions.set(sessionId, session);
    
    // Start monitoring interval
    const interval = setInterval(() => {
      this.analyzeAndGenerateReminders(sessionId);
    }, this.THRESHOLDS.CHECK_INTERVAL);
    
    this.reminderIntervals.set(sessionId, interval);
    
    console.log(`Started coaching session for teacher ${teacherId} with student ${studentId}`);
  }

  /**
   * Update teaching metrics
   */
  updateMetrics(sessionId: string, metrics: Partial<TeachingMetrics>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.metrics = { ...session.metrics, ...metrics };
    session.metrics.sessionDuration = 
      (new Date().getTime() - session.startTime.getTime()) / 1000;

    // Immediate check for critical situations
    if (metrics.tttPercentage && metrics.tttPercentage > this.THRESHOLDS.TTT_CRITICAL) {
      this.generateReminder(sessionId, this.createTTTReminder(metrics.tttPercentage, 'critical'));
    }
  }

  /**
   * Analyze metrics and generate appropriate reminders
   */
  private analyzeAndGenerateReminders(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { metrics } = session;
    const reminders: CoachingReminder[] = [];

    // Skip if too soon since last reminder
    if (session.lastReminderTime) {
      const timeSinceLastReminder = Date.now() - session.lastReminderTime.getTime();
      if (timeSinceLastReminder < this.THRESHOLDS.MIN_TIME_BETWEEN_REMINDERS) {
        return;
      }
    }

    // Check TTT (Teacher Talk Time)
    if (metrics.sessionDuration > 60) { // After first minute
      if (metrics.tttPercentage > this.THRESHOLDS.TTT_WARNING) {
        const severity = metrics.tttPercentage > this.THRESHOLDS.TTT_CRITICAL ? 'critical' : 'warning';
        reminders.push(this.createTTTReminder(metrics.tttPercentage, severity));
      }
    }

    // Check student engagement
    if (metrics.studentEngagement < this.THRESHOLDS.MIN_STUDENT_ENGAGEMENT) {
      reminders.push(this.createEngagementReminder(metrics.studentEngagement));
    }

    // Check questioning techniques
    if (metrics.sessionDuration > 120 && metrics.openEndedQuestionRatio < this.THRESHOLDS.MIN_OPEN_ENDED_RATIO) {
      reminders.push(this.createQuestioningReminder(metrics.openEndedQuestionRatio));
    }

    // Check for excessive silence
    if (metrics.silencePercentage > this.THRESHOLDS.MAX_SILENCE_PERCENTAGE) {
      reminders.push(this.createSilenceReminder(metrics.silencePercentage));
    }

    // Check praise frequency
    if (metrics.sessionDuration > this.THRESHOLDS.MIN_PRAISE_INTERVAL && 
        metrics.praiseCount === 0) {
      reminders.push(this.createPraiseReminder());
    }

    // Check error correction balance
    if (metrics.errorCorrectionCount > this.THRESHOLDS.MAX_ERROR_CORRECTIONS_WITHOUT_PRAISE &&
        metrics.praiseCount < metrics.errorCorrectionCount / 3) {
      reminders.push(this.createBalancedFeedbackReminder(metrics.errorCorrectionCount, metrics.praiseCount));
    }

    // Check for interruptions
    if (metrics.interruptionCount > 2) {
      reminders.push(this.createInterruptionReminder(metrics.interruptionCount));
    }

    // Pacing reminder every 10 minutes
    if (metrics.sessionDuration > 0 && metrics.sessionDuration % 600 < 15) {
      reminders.push(this.createPacingReminder(Math.floor(metrics.sessionDuration / 60)));
    }

    // Sort by priority and send the most important one
    if (reminders.length > 0) {
      reminders.sort((a, b) => b.priority - a.priority);
      this.generateReminder(sessionId, reminders[0]);
    }
  }

  /**
   * Create TTT (Teacher Talk Time) reminder
   */
  private createTTTReminder(percentage: number, severity: 'warning' | 'critical'): CoachingReminder {
    const suggestions = {
      warning: [
        "Try asking 'What do you think about...?' to encourage student speaking",
        "Pause and give the student time to formulate their thoughts",
        "Ask the student to elaborate on their last answer",
      ],
      critical: [
        "Immediate action: Ask an open question and wait for the student's full response",
        "Switch to student-led discussion: 'Can you tell me more about your experience with...?'",
        "Use the 10-second rule: Count to 10 after asking a question before speaking again",
      ],
    };

    const randomSuggestion = suggestions[severity][Math.floor(Math.random() * suggestions[severity].length)];

    return {
      id: `ttt-${Date.now()}`,
      type: 'ttt',
      severity,
      title: severity === 'critical' ? '⚠️ High Teacher Talk Time!' : '📊 Teacher Talk Time Alert',
      message: `You're speaking ${percentage.toFixed(0)}% of the time. Aim for less than 40% to maximize student practice.`,
      suggestion: randomSuggestion,
      timestamp: new Date(),
      metrics: { tttPercentage: percentage },
      actionable: true,
      priority: severity === 'critical' ? 9 : 6,
    };
  }

  /**
   * Create engagement reminder
   */
  private createEngagementReminder(engagement: number): CoachingReminder {
    const suggestions = [
      "Try a quick energizer: 'Tell me three things you did yesterday'",
      "Switch to a topic the student is passionate about",
      "Use visual aids or screen sharing to re-engage",
      "Take a 30-second break and come back with a fun activity",
    ];

    return {
      id: `engagement-${Date.now()}`,
      type: 'engagement',
      severity: engagement < 40 ? 'warning' : 'info',
      title: '💡 Boost Student Engagement',
      message: `Student engagement is at ${engagement}%. Time to re-energize the session!`,
      suggestion: suggestions[Math.floor(Math.random() * suggestions.length)],
      timestamp: new Date(),
      metrics: { studentEngagement: engagement },
      actionable: true,
      priority: 7,
    };
  }

  /**
   * Create questioning technique reminder
   */
  private createQuestioningReminder(ratio: number): CoachingReminder {
    const openEndedStarters = [
      "How do you feel about...?",
      "What would you do if...?",
      "Can you describe...?",
      "Why do you think...?",
      "What's your opinion on...?",
    ];

    return {
      id: `questioning-${Date.now()}`,
      type: 'questioning',
      severity: 'info',
      title: '❓ Use More Open-Ended Questions',
      message: `Only ${(ratio * 100).toFixed(0)}% of your questions are open-ended. Aim for at least 30%.`,
      suggestion: `Try: "${openEndedStarters[Math.floor(Math.random() * openEndedStarters.length)]}"`,
      timestamp: new Date(),
      metrics: { openEndedQuestionRatio: ratio },
      actionable: true,
      priority: 5,
    };
  }

  /**
   * Create silence reminder
   */
  private createSilenceReminder(silencePercentage: number): CoachingReminder {
    return {
      id: `silence-${Date.now()}`,
      type: 'pacing',
      severity: 'info',
      title: '🤫 Too Much Silence',
      message: `${silencePercentage.toFixed(0)}% of the session is silent. Fill the gaps with encouragement or prompts.`,
      suggestion: "Try: 'Take your time, I'm here when you're ready' or provide helpful vocabulary hints",
      timestamp: new Date(),
      metrics: { silencePercentage },
      actionable: true,
      priority: 4,
    };
  }

  /**
   * Create praise reminder
   */
  private createPraiseReminder(): CoachingReminder {
    const praiseExamples = [
      "Great job with that pronunciation!",
      "Excellent use of the new vocabulary!",
      "I love how you explained that!",
      "Your grammar is really improving!",
      "That was a perfect sentence structure!",
    ];

    return {
      id: `praise-${Date.now()}`,
      type: 'encouragement',
      severity: 'info',
      title: '👏 Time for Encouragement',
      message: "Remember to praise the student's efforts regularly to maintain motivation.",
      suggestion: `Try: "${praiseExamples[Math.floor(Math.random() * praiseExamples.length)]}"`,
      timestamp: new Date(),
      actionable: true,
      priority: 6,
    };
  }

  /**
   * Create balanced feedback reminder
   */
  private createBalancedFeedbackReminder(corrections: number, praise: number): CoachingReminder {
    return {
      id: `feedback-${Date.now()}`,
      type: 'feedback',
      severity: 'warning',
      title: '⚖️ Balance Your Feedback',
      message: `You've made ${corrections} corrections but only ${praise} positive comments.`,
      suggestion: "Follow the 3:1 rule - three positive comments for every correction. Focus on what they're doing right!",
      timestamp: new Date(),
      metrics: { errorCorrectionCount: corrections, praiseCount: praise },
      actionable: true,
      priority: 7,
    };
  }

  /**
   * Create interruption reminder
   */
  private createInterruptionReminder(count: number): CoachingReminder {
    return {
      id: `interruption-${Date.now()}`,
      type: 'pacing',
      severity: 'warning',
      title: '🛑 Avoid Interruptions',
      message: `You've interrupted the student ${count} times. Let them complete their thoughts.`,
      suggestion: "Wait 3 seconds after the student stops speaking before responding. They might continue!",
      timestamp: new Date(),
      metrics: { interruptionCount: count },
      actionable: true,
      priority: 8,
    };
  }

  /**
   * Create pacing reminder
   */
  private createPacingReminder(minutes: number): CoachingReminder {
    const activities = [
      "Quick vocabulary review",
      "Role-play exercise",
      "Pronunciation practice",
      "Short storytelling activity",
      "Grammar game",
    ];

    return {
      id: `pacing-${Date.now()}`,
      type: 'pacing',
      severity: 'info',
      title: '⏱️ Session Checkpoint',
      message: `${minutes} minutes completed. Consider switching activities to maintain engagement.`,
      suggestion: `Try a ${activities[Math.floor(Math.random() * activities.length)]} to refresh the session`,
      timestamp: new Date(),
      actionable: false,
      priority: 3,
    };
  }

  /**
   * Generate and emit reminder
   */
  private generateReminder(sessionId: string, reminder: CoachingReminder): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.reminders.push(reminder);
    session.lastReminderTime = new Date();

    // Emit reminder event for WebSocket delivery
    this.emit('coaching-reminder', {
      sessionId,
      teacherId: session.teacherId,
      reminder,
    });

    console.log(`Generated coaching reminder for session ${sessionId}:`, reminder.title);
  }

  /**
   * Get session coaching history
   */
  getSessionHistory(sessionId: string): CoachingReminder[] {
    const session = this.sessions.get(sessionId);
    return session ? session.reminders : [];
  }

  /**
   * End coaching session
   */
  endCoachingSession(sessionId: string): void {
    const interval = this.reminderIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.reminderIntervals.delete(sessionId);
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      // Save session summary for later review
      this.emit('coaching-session-ended', {
        sessionId,
        teacherId: session.teacherId,
        studentId: session.studentId,
        duration: (new Date().getTime() - session.startTime.getTime()) / 1000,
        reminderCount: session.reminders.length,
        finalMetrics: session.metrics,
        reminders: session.reminders,
      });

      this.sessions.delete(sessionId);
    }

    console.log(`Ended coaching session ${sessionId}`);
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Manual reminder trigger (for testing or admin override)
   */
  triggerManualReminder(sessionId: string, type: CoachingReminder['type'], message: string): void {
    const reminder: CoachingReminder = {
      id: `manual-${Date.now()}`,
      type,
      severity: 'info',
      title: '📢 Teaching Tip',
      message,
      suggestion: '',
      timestamp: new Date(),
      actionable: true,
      priority: 10, // Highest priority for manual reminders
    };

    this.generateReminder(sessionId, reminder);
  }
}

// Singleton instance
export const teacherCoachingService = new TeacherCoachingService();