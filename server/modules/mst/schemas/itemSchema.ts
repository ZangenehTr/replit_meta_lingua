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

// ─── Question type schemas ────────────────────────────────────────────────────

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

// Ordering: present N phrases/sentences, learner drags them into correct order.
export const orderingQuestionSchema = z.object({
  type: z.literal('ordering'),
  stem: z.string(),
  items: z.array(z.string()),       // Shuffled items shown to learner
  correctOrder: z.array(z.number()), // Indices into `items` that form the correct sequence
});

// Fill-in-the-blank: passage with __BLANK__ placeholder, learner types the missing word.
// IMPORTANT: This flat shape is canonical — matches scorer (listeningQuickscore /
// readingQuickscore: `question.correctAnswers`) and UI (mst.tsx type:'fill_in'|'fill_in_blank').
export const fillInQuestionSchema = z.object({
  type: z.literal('fill_in'),
  stem: z.string(),                          // Passage/sentence with __BLANK__ placeholder
  correctAnswers: z.array(z.string()),       // Accepted answers (case-insensitive, any match wins)
  maxWords: z.number().optional(),           // Optional hint for UI character limits
});

// ─── Per-skill item schemas ───────────────────────────────────────────────────

// Listening: MC single / MC multi / short answer / ordering / fill-in
export const listeningItemSchema = baseItemSchema.extend({
  skill: z.literal('listening'),
  assets: z.object({
    audio: z.string(), // Path to audio file
    transcript: z.string(),
  }),
  questions: z.array(
    z.discriminatedUnion('type', [
      mcqQuestionSchema,
      mcqMultiQuestionSchema,
      shortAnswerQuestionSchema,
      orderingQuestionSchema,
      fillInQuestionSchema,
    ]),
  ),
});

// Reading: MC single / MC multi / short answer / ordering / fill-in
export const readingItemSchema = baseItemSchema.extend({
  skill: z.literal('reading'),
  assets: z.object({
    passage: z.string(), // Reading text
  }),
  questions: z.array(
    z.discriminatedUnion('type', [
      mcqQuestionSchema,
      mcqMultiQuestionSchema,
      shortAnswerQuestionSchema,
      orderingQuestionSchema,
      fillInQuestionSchema,
    ]),
  ),
});

// Speaking subtypes
export const speakingFreeSchema = z.object({
  type: z.literal('speaking_free'),
  prompt: z.string(),
  evaluationCriteria: z.array(z.string()).optional(),
});
export const speakingRoleplaySchema = z.object({
  type: z.literal('speaking_roleplay'),
  scenario: z.string(),
  role: z.string(),
  targetPhrases: z.array(z.string()).optional(),
});
export const speakingPictureSchema = z.object({
  type: z.literal('speaking_picture'),
  imageUrl: z.string(),
  promptText: z.string(),
  keyVocabulary: z.array(z.string()).optional(),
});

// Speaking item
export const speakingItemSchema = baseItemSchema.extend({
  skill: z.literal('speaking'),
  assets: z.object({
    prompt: z.string(),
    keywords: z.array(z.string()).optional(),
    structure: z.string().optional(),
  }),
  timing: z.object({
    prepSec: z.number(),
    recordSec: z.number(),
    maxAnswerSec: z.number(),
  }),
  speakingTask: z.discriminatedUnion('type', [
    speakingFreeSchema,
    speakingRoleplaySchema,
    speakingPictureSchema,
  ]).optional(),
});

// Writing subtypes
export const writingOpinionSchema = z.object({
  type: z.literal('writing_opinion'),
  prompt: z.string(),
  minWords: z.number(),
  maxWords: z.number(),
});
export const writingDescribeSchema = z.object({
  type: z.literal('writing_describe'),
  prompt: z.string(),
  minWords: z.number(),
  maxWords: z.number(),
  imageUrl: z.string().optional(),
});
export const writingCorrectSchema = z.object({
  type: z.literal('writing_correct'),
  errorText: z.string(),  // Text with embedded errors to correct
  correctText: z.string(),
});
export const writingArgumentSchema = z.object({
  type: z.literal('writing_argument'),
  prompt: z.string(),
  stance: z.enum(['for', 'against', 'balanced']).optional(),
  minWords: z.number(),
  maxWords: z.number(),
});

// Writing item
export const writingItemSchema = baseItemSchema.extend({
  skill: z.literal('writing'),
  assets: z.object({
    prompt: z.string(),
    minWords: z.number(),
    maxWords: z.number(),
    taskType: z.enum(['opinion', 'description', 'comparison', 'argument']),
  }),
  writingTask: z.discriminatedUnion('type', [
    writingOpinionSchema,
    writingDescribeSchema,
    writingCorrectSchema,
    writingArgumentSchema,
  ]).optional(),
});

// ─── Union and type exports ───────────────────────────────────────────────────

export const itemSchema = z.union([
  listeningItemSchema,
  readingItemSchema,
  speakingItemSchema,
  writingItemSchema,
]);

export type BaseItem = z.infer<typeof baseItemSchema>;
export type McqQuestion = z.infer<typeof mcqQuestionSchema>;
export type McqMultiQuestion = z.infer<typeof mcqMultiQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof shortAnswerQuestionSchema>;
export type OrderingQuestion = z.infer<typeof orderingQuestionSchema>;
export type FillInQuestion = z.infer<typeof fillInQuestionSchema>;
export type ListeningQuestion =
  | McqQuestion
  | McqMultiQuestion
  | ShortAnswerQuestion
  | OrderingQuestion
  | FillInQuestion;
export type ReadingQuestion = ListeningQuestion; // same union
export type SpeakingFree = z.infer<typeof speakingFreeSchema>;
export type SpeakingRoleplay = z.infer<typeof speakingRoleplaySchema>;
export type SpeakingPicture = z.infer<typeof speakingPictureSchema>;
export type WritingOpinion = z.infer<typeof writingOpinionSchema>;
export type WritingDescribe = z.infer<typeof writingDescribeSchema>;
export type WritingCorrect = z.infer<typeof writingCorrectSchema>;
export type WritingArgument = z.infer<typeof writingArgumentSchema>;
export type ListeningItem = z.infer<typeof listeningItemSchema>;
export type ReadingItem = z.infer<typeof readingItemSchema>;
export type SpeakingItem = z.infer<typeof speakingItemSchema>;
export type WritingItem = z.infer<typeof writingItemSchema>;
export type Item = z.infer<typeof itemSchema>;

// Helper types
export type Skill = 'listening' | 'reading' | 'speaking' | 'writing';
export type Stage = 'core' | 'upper' | 'lower';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Active MST routing: core→B1, upper→B2, lower→A2
export const MST_STAGE_CEFR_MAP: Record<Stage, CEFRLevel> = {
  core:  'B1',
  upper: 'B2',
  lower: 'A2',
};
