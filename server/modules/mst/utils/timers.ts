/**
 * MST Timing Utilities
 * Level-specific timing for academic validity
 */

export interface TimingConfig {
  listeningAudioMaxSec: number;
  readingPassageWords: { min: number; max: number };
  speakingRecordSec: { min: number; max: number };
  writingComposeSec: { min: number; max: number };
}

export const DEFAULT_TIMING: TimingConfig = {
  listeningAudioMaxSec: 40,
  readingPassageWords: { min: 80, max: 180 },
  speakingRecordSec: { min: 60, max: 60 },
  writingComposeSec: { min: 180, max: 240 }, // Single question with 3-4 minutes
};

/**
 * Get level-specific listening response time (after audio ends)
 * Pedagogically sound progression: more time at lower levels, less at higher levels
 */
export function getListeningResponseTime(level: string): number {
  switch (level) {
    case 'A1': return 90; // Beginners need more time to process
    case 'A2': return 90; // Still building comprehension skills
    case 'B1': return 60; // Intermediate level - faster processing
    case 'B2': return 45; // Upper-intermediate - quicker responses
    case 'C1': return 30; // Advanced - quick comprehension expected
    case 'C2': return 30; // Proficient - rapid processing
    default: return 60; // Default to B1 timing
  }
}

/**
 * Get level-specific speaking recording time
 * Same pedagogically sound progression as listening response times
 */
export function getSpeakingRecordTime(level: string): number {
  switch (level) {
    case 'A1': return 90; // Beginners need more time to formulate responses
    case 'A2': return 90; // Still building speaking confidence
    case 'B1': return 60; // Intermediate level - more fluent responses
    case 'B2': return 45; // Upper-intermediate - quicker responses
    case 'C1': return 30; // Advanced - concise, fluent responses
    case 'C2': return 30; // Proficient - rapid, sophisticated responses
    default: return 60; // Default to B1 timing
  }
}

/**
 * Get level-specific writing composition time
 */
export function getWritingCompositionTime(level: string): number {
  // Single comprehensive writing question with adequate time
  return 240; // 4 minutes for all levels - single question approach
}

/**
 * Simple timer utilities for placement test
 */
export interface TimerState {
  startTime: number;
  timeLimit: number;
  isActive: boolean;
}

export function createTimer(timeLimitSec: number): TimerState {
  return {
    startTime: Date.now(),
    timeLimit: timeLimitSec * 1000,
    isActive: true
  };
}

export function getRemainingTime(timer: TimerState): number {
  if (!timer.isActive) return 0;
  const elapsed = Date.now() - timer.startTime;
  const remaining = Math.max(0, timer.timeLimit - elapsed);
  return Math.floor(remaining / 1000);
}

export function isTimeUp(timer: TimerState): boolean {
  return getRemainingTime(timer) <= 0;
}

export function getElapsedTime(timer: TimerState): number {
  return Math.floor((Date.now() - timer.startTime) / 1000);
}

export function stopTimer(timer: TimerState): void {
  timer.isActive = false;
}

/**
 * Session timer for overall placement test
 */
export interface SessionTimer {
  startTime: number;
  totalTimeLimit: number;
}

export function createSessionTimer(): SessionTimer {
  return {
    startTime: Date.now(),
    totalTimeLimit: 10 * 60 * 1000 // 10 minutes total
  };
}

export function getSessionElapsedTime(sessionTimer: SessionTimer): number {
  return Math.floor((Date.now() - sessionTimer.startTime) / 1000);
}

export function getSessionRemainingTime(sessionTimer: SessionTimer): number {
  const elapsed = Date.now() - sessionTimer.startTime;
  const remaining = Math.max(0, sessionTimer.totalTimeLimit - elapsed);
  return Math.floor(remaining / 1000);
}

export function isSessionTimeUp(sessionTimer: SessionTimer): boolean {
  return getSessionRemainingTime(sessionTimer) <= 0;
}

/**
 * Validate item timing against requirements
 */
export function validateItemTiming(
  skill: string,
  timing: any
): boolean {
  const config = DEFAULT_TIMING;

  switch (skill) {
    case 'listening':
      return timing.audioSec <= config.listeningAudioMaxSec;
    
    case 'reading':
      return timing.maxAnswerSec > 0 && timing.maxAnswerSec <= 180;
    
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