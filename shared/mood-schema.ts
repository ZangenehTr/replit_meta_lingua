import { pgTable, serial, integer, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Mood tracking table
export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  moodScore: integer('mood_score').notNull(), // 1-10 scale
  moodCategory: text('mood_category').notNull(), // happy, sad, stressed, motivated, tired, etc.
  energyLevel: integer('energy_level').notNull(), // 1-10 scale
  motivationLevel: integer('motivation_level').notNull(), // 1-10 scale
  stressLevel: integer('stress_level').notNull(), // 1-10 scale
  focusLevel: integer('focus_level').notNull(), // 1-10 scale
  context: text('context'), // what triggered this mood (lesson difficulty, personal life, etc.)
  notes: text('notes'), // user's optional notes
  detectedFrom: text('detected_from').default('manual'), // manual, voice_analysis, behavioral_patterns
  metadata: jsonb('metadata'), // additional mood analysis data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Mood-based recommendations table
export const moodRecommendations = pgTable('mood_recommendations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  moodEntryId: integer('mood_entry_id').notNull(),
  recommendationType: text('recommendation_type').notNull(), // content, activity, break, challenge
  contentType: text('content_type'), // lesson, exercise, game, meditation, review
  difficulty: text('difficulty'), // easy, medium, hard
  duration: integer('duration'), // in minutes
  title: text('title').notNull(),
  description: text('description').notNull(),
  reasoning: text('reasoning').notNull(), // AI explanation for why this was recommended
  priority: integer('priority').default(5), // 1-10 priority score
  isAccepted: boolean('is_accepted'),
  completedAt: timestamp('completed_at'),
  effectivenessRating: integer('effectiveness_rating'), // 1-5 user feedback
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Learning adaptation patterns
export const learningAdaptations = pgTable('learning_adaptations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  moodPattern: text('mood_pattern').notNull(), // low_energy, high_stress, motivated, etc.
  adaptationStrategy: text('adaptation_strategy').notNull(),
  preferredContentTypes: jsonb('preferred_content_types'),
  optimalDuration: integer('optimal_duration'),
  bestTimeOfDay: text('best_time_of_day'),
  successRate: integer('success_rate').default(0), // percentage
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertMoodRecommendationSchema = createInsertSchema(moodRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertLearningAdaptationSchema = createInsertSchema(learningAdaptations).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type MoodRecommendation = typeof moodRecommendations.$inferSelect;
export type InsertMoodRecommendation = z.infer<typeof insertMoodRecommendationSchema>;
export type LearningAdaptation = typeof learningAdaptations.$inferSelect;
export type InsertLearningAdaptation = z.infer<typeof insertLearningAdaptationSchema>;

// Mood categories enum
export const MOOD_CATEGORIES = [
  'happy',
  'excited',
  'motivated',
  'calm',
  'focused',
  'confident',
  'curious',
  'sad',
  'frustrated',
  'anxious',
  'stressed',
  'tired',
  'bored',
  'overwhelmed',
  'confused',
  'discouraged'
] as const;

export type MoodCategory = typeof MOOD_CATEGORIES[number];

// Recommendation types
export const RECOMMENDATION_TYPES = [
  'content', // specific learning content
  'activity', // interactive activities
  'break', // suggest taking a break
  'challenge', // push user harder
  'review', // review previous content
  'meditation', // mindfulness/relaxation
  'social', // group activities
  'gamification' // game-based learning
] as const;

export type RecommendationType = typeof RECOMMENDATION_TYPES[number];