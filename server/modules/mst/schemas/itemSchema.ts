/**
 * MST Item Bank Schema Definitions
 * JSON schemas for Listening, Reading, Speaking, Writing items
 */

import { z } from 'zod';

// Base item schema
export const baseItemSchema = z.object({
  id: z.string(), // Format: "L-B1-034", "R-A2-012", etc.
  skill: z.enum(['listening', 'reading', 'speaking', 'writing']),
  stage: z.enum(['core', 'upper', 'lower']), // MST stages
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  timing: z.object({
    maxAnswerSec: z.number(), // Maximum time to answer
    audioSec: z.number().optional(), // For listening items
  }),
  metadata: z.object({
    domain: z.string().optional(), // social, academic, workplace
    accent: z.string().optional(), // genAm, britEng, etc.
  }),
});

// Question types
export const mcqQuestionSchema = z.object({
  type: z.literal('mcq_single'),
  stem: z.string(),
  options: z.array(z.string()),
  answerIndex: z.number(),
});

export const mcqMultiQuestionSchema = z.object({
  type: z.literal('mcq_multi'),
  stem: z.string(),
  options: z.array(z.string()),
  answerIndices: z.array(z.number()),
});

export const shortAnswerQuestionSchema = z.object({
  type: z.literal('short_answer'),
  stem: z.string(),
  correctAnswers: z.array(z.string()), // Multiple acceptable answers
  maxWords: z.number().optional(),
});

// Listening items
export const listeningItemSchema = baseItemSchema.extend({
  skill: z.literal('listening'),
  assets: z.object({
    audio: z.string(), // Path to audio file
    transcript: z.string(),
  }),
  questions: z.array(z.union([mcqQuestionSchema, shortAnswerQuestionSchema])),
});

// Reading items
export const readingItemSchema = baseItemSchema.extend({
  skill: z.literal('reading'),
  assets: z.object({
    passage: z.string(), // Reading text
  }),
  questions: z.array(z.union([mcqQuestionSchema, mcqMultiQuestionSchema, shortAnswerQuestionSchema])),
});

// Speaking items
export const speakingItemSchema = baseItemSchema.extend({
  skill: z.literal('speaking'),
  assets: z.object({
    prompt: z.string(), // Speaking task prompt
    keywords: z.array(z.string()).optional(), // Helpful keywords
    structure: z.string().optional(), // Expected response structure
  }),
  timing: z.object({
    prepSec: z.number(), // Preparation time
    recordSec: z.number(), // Recording time
    maxAnswerSec: z.number(),
  }),
});

// Writing items
export const writingItemSchema = baseItemSchema.extend({
  skill: z.literal('writing'),
  assets: z.object({
    prompt: z.string(), // Writing task prompt
    minWords: z.number(),
    maxWords: z.number(),
    taskType: z.enum(['opinion', 'description', 'comparison', 'argument']),
  }),
});

// Union type for all items
export const itemSchema = z.union([
  listeningItemSchema,
  readingItemSchema,
  speakingItemSchema,
  writingItemSchema,
]);

// Type exports
export type BaseItem = z.infer<typeof baseItemSchema>;
export type McqQuestion = z.infer<typeof mcqQuestionSchema>;
export type McqMultiQuestion = z.infer<typeof mcqMultiQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof shortAnswerQuestionSchema>;
export type ListeningItem = z.infer<typeof listeningItemSchema>;
export type ReadingItem = z.infer<typeof readingItemSchema>;
export type SpeakingItem = z.infer<typeof speakingItemSchema>;
export type WritingItem = z.infer<typeof writingItemSchema>;
export type Item = z.infer<typeof itemSchema>;

// Helper types
export type Skill = 'listening' | 'reading' | 'speaking' | 'writing';
export type Stage = 'core' | 'upper' | 'lower';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';