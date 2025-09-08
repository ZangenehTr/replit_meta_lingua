import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// CEFR Levels enum
export const CEFRLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CEFRLevel = typeof CEFRLevels[number];

// Skills enum
export const Skills = ['speaking', 'listening', 'writing', 'reading'] as const;
export type Skill = typeof Skills[number];

// Placement Test Sessions - Main test session tracking
export const placementTestSessions = pgTable("placement_test_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Test metadata
  targetLanguage: varchar("target_language", { length: 50 }).notNull(), // "english", "persian", "arabic", etc.
  learningGoal: text("learning_goal"), // "ielts", "toefl", "pte", "business", "general", etc.
  
  // Test timing
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  totalDurationSeconds: integer("total_duration_seconds").default(0),
  
  // Test status
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, abandoned, timed_out
  currentSkill: varchar("current_skill", { length: 20 }).default("speaking"), // Current skill being tested
  currentQuestionIndex: integer("current_question_index").default(0),
  
  // Results
  overallCEFRLevel: varchar("overall_cefr_level", { length: 2 }), // Final placement level
  speakingLevel: varchar("speaking_level", { length: 2 }),
  listeningLevel: varchar("listening_level", { length: 2 }),
  readingLevel: varchar("reading_level", { length: 2 }),
  writingLevel: varchar("writing_level", { length: 2 }),
  
  // Scores (0-100)
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  speakingScore: decimal("speaking_score", { precision: 5, scale: 2 }),
  listeningScore: decimal("listening_score", { precision: 5, scale: 2 }),
  readingScore: decimal("reading_score", { precision: 5, scale: 2 }),
  writingScore: decimal("writing_score", { precision: 5, scale: 2 }),
  
  // AI Analysis
  strengths: text("strengths").array().default([]), // Identified strong areas
  weaknesses: text("weaknesses").array().default([]), // Areas needing improvement
  recommendations: text("recommendations").array().default([]), // Learning recommendations
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }), // AI confidence in placement
  
  // Generated roadmap reference
  generatedRoadmapId: integer("generated_roadmap_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Test Questions - Question bank for adaptive testing
export const placementTestQuestions = pgTable("placement_test_questions", {
  id: serial("id").primaryKey(),
  
  // Question classification
  skill: varchar("skill", { length: 20 }).notNull(), // speaking, listening, reading, writing
  cefrLevel: varchar("cefr_level", { length: 2 }).notNull(), // A1, A2, B1, B2, C1, C2
  questionType: varchar("question_type", { length: 50 }).notNull(), // "pronunciation", "description", "reading_comprehension", etc.
  
  // Question content
  title: varchar("title", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(), // Question text/instructions
  content: jsonb("content").notNull(), // Question-specific data (text, audio URLs, images, etc.)
  
  // Expected response format
  responseType: varchar("response_type", { length: 50 }).notNull(), // "audio", "text", "multiple_choice", "drag_drop"
  expectedDurationSeconds: integer("expected_duration_seconds").notNull(),
  
  // Scoring criteria
  scoringCriteria: jsonb("scoring_criteria").notNull(), // CEFR-based scoring rubric
  maxScore: integer("max_score").default(100),
  
  // Adaptive testing
  difficultyWeight: decimal("difficulty_weight", { precision: 3, scale: 2 }), // 0-1 scale within CEFR level
  prerequisiteSkills: text("prerequisite_skills").array().default([]),
  
  // Metadata
  tags: text("tags").array().default([]),
  estimatedCompletionMinutes: integer("estimated_completion_minutes").default(2),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Test Responses - User responses to questions
export const placementTestResponses = pgTable("placement_test_responses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => placementTestSessions.id).notNull(),
  questionId: integer("question_id").references(() => placementTestQuestions.id).notNull(),
  
  // Response data
  userResponse: jsonb("user_response").notNull(), // Audio URL, text, selected options, etc.
  responseStartTime: timestamp("response_start_time").notNull(),
  responseEndTime: timestamp("response_end_time"),
  timeSpentSeconds: integer("time_spent_seconds"),
  
  // AI Scoring
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }), // 0-100 based on CEFR criteria
  cefrIndicators: jsonb("cefr_indicators"), // Which CEFR descriptors were met
  detailedFeedback: jsonb("detailed_feedback"), // Specific strengths/areas for improvement
  
  // Manual review (if needed)
  manualScore: decimal("manual_score", { precision: 5, scale: 2 }),
  manualFeedback: text("manual_feedback"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  
  // Adaptive decision
  triggeredLevelAdjustment: boolean("triggered_level_adjustment").default(false),
  nextQuestionLevel: varchar("next_question_level", { length: 2 }), // Recommended level for next question
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CEFR Descriptors - Detailed scoring criteria
export const cefrDescriptors = pgTable("cefr_descriptors", {
  id: serial("id").primaryKey(),
  
  skill: varchar("skill", { length: 20 }).notNull(), // speaking, listening, reading, writing
  cefrLevel: varchar("cefr_level", { length: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // "Spoken Production", "Listening", etc.
  
  // Descriptor text and scoring
  descriptor: text("descriptor").notNull(), // Official CEFR descriptor text
  keywords: text("keywords").array().default([]), // Key indicators for AI scoring
  scoringWeight: decimal("scoring_weight", { precision: 3, scale: 2 }).default("1.0"),
  
  // AI prompt instructions
  aiScoringPrompt: text("ai_scoring_prompt"), // How AI should evaluate this descriptor
  exampleResponses: jsonb("example_responses"), // Example good/bad responses
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Adaptive Test Algorithms - Rules for question selection
export const adaptiveTestAlgorithms = pgTable("adaptive_test_algorithms", {
  id: serial("id").primaryKey(),
  
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Algorithm parameters
  initialDifficulty: varchar("initial_difficulty", { length: 2 }).default("B1"), // Starting CEFR level
  maxQuestions: integer("max_questions").default(8), // Max questions per skill
  minQuestions: integer("min_questions").default(3), // Min questions per skill
  confidenceThreshold: decimal("confidence_threshold", { precision: 3, scale: 2 }).default("0.8"),
  
  // Skill progression rules
  speakingWeight: decimal("speaking_weight", { precision: 3, scale: 2 }).default("0.4"), // Speaking influences other skills
  skillInteractionRules: jsonb("skill_interaction_rules"), // How speaking results affect other skills
  
  // Timing constraints
  maxTimePerSkillMinutes: integer("max_time_per_skill_minutes").default(3),
  totalMaxMinutes: integer("total_max_minutes").default(10),
  
  // Question selection strategy
  questionSelectionStrategy: varchar("question_selection_strategy", { length: 50 }).default("adaptive_difficulty"),
  terminationCriteria: jsonb("termination_criteria"), // When to stop testing a skill
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// AI Roadmap Templates - Templates for instant roadmap generation
export const aiRoadmapTemplates = pgTable("ai_roadmap_templates", {
  id: serial("id").primaryKey(),
  
  name: varchar("name", { length: 100 }).notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  learningGoal: varchar("learning_goal", { length: 50 }).notNull(), // ielts, toefl, business, general
  
  // CEFR level range this template covers
  minCEFRLevel: varchar("min_cefr_level", { length: 2 }).notNull(),
  maxCEFRLevel: varchar("max_cefr_level", { length: 2 }).notNull(),
  
  // Template structure
  milestoneTemplate: jsonb("milestone_template").notNull(), // Template for generating milestones
  stepTemplate: jsonb("step_template").notNull(), // Template for generating steps
  adaptationRules: jsonb("adaptation_rules"), // How to adapt based on placement results
  
  // AI generation prompts
  aiGenerationPrompt: text("ai_generation_prompt").notNull(),
  customizationPrompt: text("customization_prompt"), // How to customize based on student profile
  
  // Metadata
  estimatedWeeks: integer("estimated_weeks"),
  weeklyHours: integer("weekly_hours"),
  tags: text("tags").array().default([]),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas
export const insertPlacementTestSessionSchema = createInsertSchema(placementTestSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlacementTestQuestionSchema = createInsertSchema(placementTestQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlacementTestResponseSchema = createInsertSchema(placementTestResponses).omit({
  id: true,
  createdAt: true
});

export const insertCEFRDescriptorSchema = createInsertSchema(cefrDescriptors).omit({
  id: true,
  createdAt: true
});

export const insertAdaptiveTestAlgorithmSchema = createInsertSchema(adaptiveTestAlgorithms).omit({
  id: true,
  createdAt: true
});

export const insertAIRoadmapTemplateSchema = createInsertSchema(aiRoadmapTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type exports
export type PlacementTestSession = typeof placementTestSessions.$inferSelect;
export type InsertPlacementTestSession = z.infer<typeof insertPlacementTestSessionSchema>;
export type PlacementTestQuestion = typeof placementTestQuestions.$inferSelect;
export type InsertPlacementTestQuestion = z.infer<typeof insertPlacementTestQuestionSchema>;
export type PlacementTestResponse = typeof placementTestResponses.$inferSelect;
export type InsertPlacementTestResponse = z.infer<typeof insertPlacementTestResponseSchema>;
export type CEFRDescriptor = typeof cefrDescriptors.$inferSelect;
export type InsertCEFRDescriptor = z.infer<typeof insertCEFRDescriptorSchema>;
export type AdaptiveTestAlgorithm = typeof adaptiveTestAlgorithms.$inferSelect;
export type InsertAdaptiveTestAlgorithm = z.infer<typeof insertAdaptiveTestAlgorithmSchema>;
export type AIRoadmapTemplate = typeof aiRoadmapTemplates.$inferSelect;
export type InsertAIRoadmapTemplate = z.infer<typeof insertAIRoadmapTemplateSchema>;