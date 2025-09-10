/**
 * MST Result Schema Definitions
 * Schemas for MST responses, scores, and final results
 */

import { z } from 'zod';

// Response schemas for different skills
export const listeningResponseSchema = z.object({
  answers: z.array(z.union([z.number(), z.array(z.number())])), // MCQ indices or arrays for multi-select
  latencyMs: z.number(),
});

export const readingResponseSchema = z.object({
  answers: z.array(z.union([z.number(), z.array(z.number()), z.string()])), // MCQ indices, arrays, or text
  latencyMs: z.number(),
});

export const speakingResponseSchema = z.object({
  audioUrl: z.string().optional(),
  audioBuffer: z.any().optional(), // Raw audio data
  asr: z.object({
    text: z.string(),
    confidence: z.number(),
  }).optional(),
});

export const writingResponseSchema = z.object({
  text: z.string(),
});

// MST session data
export const mstSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.number(),
  skillOrder: z.array(z.enum(['listening', 'reading', 'speaking', 'writing'])),
  perSkillSeconds: z.number(),
  startedAt: z.date(),
  currentSkill: z.string().optional(),
  currentStage: z.enum(['core', 'upper', 'lower']).optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
});

// Quickscore result
export const quickscoreResultSchema = z.object({
  p: z.number().min(0).max(1), // Performance score 0-1
  route: z.enum(['up', 'down', 'stay']), // MST routing decision
  features: z.record(z.number()).optional(), // Feature scores for debugging
  computeTimeMs: z.number().optional(),
});

// Final skill result
export const skillResultSchema = z.object({
  skill: z.enum(['listening', 'reading', 'speaking', 'writing']),
  band: z.string(), // e.g., "B1", "B2+", "A2-"
  confidence: z.number().min(0).max(1),
  stage1Score: z.number(),
  stage2Score: z.number().optional(),
  route: z.enum(['up', 'down', 'stay']),
  timeSpentSec: z.number(),
});

// Final MST result
export const mstResultSchema = z.object({
  sessionId: z.string(),
  overallBand: z.string(),
  overallConfidence: z.number().min(0).max(1),
  skills: z.array(skillResultSchema),
  totalTimeMin: z.number(),
  completedAt: z.date(),
  recommendations: z.array(z.string()).optional(),
});

// Telemetry/audit log entry
export const telemetryLogSchema = z.object({
  sessionId: z.string(),
  userId: z.number(),
  skill: z.enum(['listening', 'reading', 'speaking', 'writing']),
  stage: z.enum(['core', 'upper', 'lower']),
  itemId: z.string(),
  p: z.number(),
  route: z.enum(['up', 'down', 'stay']),
  timeSpentMs: z.number(),
  timestamp: z.date(),
  features: z.record(z.number()).optional(),
});

// Type exports
export type ListeningResponse = z.infer<typeof listeningResponseSchema>;
export type ReadingResponse = z.infer<typeof readingResponseSchema>;
export type SpeakingResponse = z.infer<typeof speakingResponseSchema>;
export type WritingResponse = z.infer<typeof writingResponseSchema>;
export type MstSession = z.infer<typeof mstSessionSchema>;
export type QuickscoreResult = z.infer<typeof quickscoreResultSchema>;
export type SkillResult = z.infer<typeof skillResultSchema>;
export type MstResult = z.infer<typeof mstResultSchema>;
export type TelemetryLog = z.infer<typeof telemetryLogSchema>;