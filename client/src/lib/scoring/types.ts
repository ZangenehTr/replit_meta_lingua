/**
 * Client-side MST Scoring Types
 * Adapted from server-side schemas for browser use
 */

// Response types for client-side scoring
export interface SpeakingResponse {
  audioUrl?: string;
  audioBuffer?: any;
  asr?: {
    text: string;
    confidence: number;
  };
}

export interface WritingResponse {
  text: string;
}

// Item types for client-side scoring
export interface SpeakingItem {
  id: string;
  skill: 'speaking';
  stage: 'core' | 'upper' | 'lower';
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  assets: {
    prompt: string;
    keywords?: string[];
    structure?: string;
  };
  timing: {
    prepSec: number;
    recordSec: number;
    maxAnswerSec: number;
  };
}

export interface WritingItem {
  id: string;
  skill: 'writing';
  stage: 'core' | 'upper' | 'lower';
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  assets: {
    prompt: string;
    minWords: number;
    maxWords: number;
    taskType: 'opinion' | 'description' | 'comparison' | 'argument';
  };
}

// Quickscore result
export interface QuickscoreResult {
  p: number; // Performance score 0-1
  route: 'up' | 'down' | 'stay'; // MST routing decision
  features?: Record<string, number>; // Feature scores for debugging
  computeTimeMs?: number;
}

export type ClientScoringItem = SpeakingItem | WritingItem;
export type ClientScoringResponse = SpeakingResponse | WritingResponse | string;