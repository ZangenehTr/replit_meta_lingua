/**
 * MST Timing Utilities
 * Strict timing guards and auto-advance logic
 */

export interface TimingConfig {
  globalPerSkillSec: number; // 150s (2.5 minutes)
  listeningAudioMaxSec: number; // 40s
  readingPassageWords: { min: number; max: number }; // 80-180 words
  speakingRecordSec: { min: number; max: number }; // 30-40s
  writingComposeSec: { min: number; max: number }; // 80-90s
}

export const DEFAULT_TIMING: TimingConfig = {
  globalPerSkillSec: 90, // 1.5 minutes per skill (more reasonable)
  listeningAudioMaxSec: 40,
  readingPassageWords: { min: 80, max: 180 },
  speakingRecordSec: { min: 60, max: 60 }, // 1 minute for speaking (not 2 minutes)
  writingComposeSec: { min: 80, max: 90 },
};

/**
 * Timer class for tracking skill-specific time limits
 */
export class SkillTimer {
  private startTime: number;
  private timeLimit: number;
  private callbacks: Array<() => void> = [];

  constructor(timeLimitSec: number) {
    this.timeLimit = timeLimitSec * 1000; // Convert to milliseconds
    this.startTime = Date.now();
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.timeLimit - elapsed);
    return Math.floor(remaining / 1000);
  }

  /**
   * Check if time is up
   */
  isTimeUp(): boolean {
    return this.getRemainingTime() <= 0;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Add callback for when time runs out
   */
  onTimeUp(callback: () => void): void {
    this.callbacks.push(callback);
    
    // Set timeout for remaining time
    const remaining = this.getRemainingTime();
    if (remaining > 0) {
      setTimeout(() => {
        if (this.isTimeUp()) {
          this.callbacks.forEach(cb => cb());
        }
      }, remaining * 1000);
    } else {
      // Time is already up
      callback();
    }
  }

  /**
   * Reset timer
   */
  reset(newTimeLimitSec?: number): void {
    this.startTime = Date.now();
    if (newTimeLimitSec) {
      this.timeLimit = newTimeLimitSec * 1000;
    }
    this.callbacks = [];
  }
}

/**
 * Global MST session timer (10-minute total)
 */
export class MstSessionTimer {
  private startTime: number;
  private readonly totalTimeLimit = 10 * 60 * 1000; // 10 minutes
  private skillTimers: Map<string, SkillTimer> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Create timer for specific skill
   */
  createSkillTimer(skill: string, timeLimitSec: number = 150): SkillTimer {
    const timer = new SkillTimer(timeLimitSec);
    this.skillTimers.set(skill, timer);
    return timer;
  }

  /**
   * Get skill timer
   */
  getSkillTimer(skill: string): SkillTimer | undefined {
    return this.skillTimers.get(skill);
  }

  /**
   * Get total elapsed time
   */
  getTotalElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get total remaining time
   */
  getTotalRemainingTime(): number {
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.totalTimeLimit - elapsed);
    return Math.floor(remaining / 1000);
  }

  /**
   * Check if total session time is up
   */
  isSessionTimeUp(): boolean {
    return this.getTotalRemainingTime() <= 0;
  }

  /**
   * Force timeout all skills if session time is up
   */
  enforceGlobalTimeout(): boolean {
    if (this.isSessionTimeUp()) {
      // Auto-advance all remaining skills
      return true;
    }
    return false;
  }
}

/**
 * Validate item timing against stage requirements
 */
export function validateItemTiming(
  skill: string,
  stage: 'core' | 'upper' | 'lower',
  timing: any
): boolean {
  const config = DEFAULT_TIMING;

  switch (skill) {
    case 'listening':
      return timing.audioSec <= config.listeningAudioMaxSec;
    
    case 'reading':
      // Validate passage length is reasonable for timing
      return timing.maxAnswerSec <= config.globalPerSkillSec;
    
    case 'speaking':
      return timing.recordSec >= config.speakingRecordSec.min &&
             timing.recordSec <= config.speakingRecordSec.max;
    
    case 'writing':
      return timing.maxAnswerSec >= config.writingComposeSec.min &&
             timing.maxAnswerSec <= config.writingComposeSec.max;
    
    default:
      return false;
  }
}