import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// ============================================================================
// UNIFIED TESTING SYSTEM SCHEMA
// ============================================================================
// This schema consolidates and replaces:
// 1. MST (Multi-Stage Test) Schema
// 2. Placement Test Schema  
// 3. General Testing System (tests, testQuestions, testAnswers)
// 4. Game Questions System
// 5. Level Assessment System

// Question Types Enum - supports all question types
export const QUESTION_TYPES = {
  // Existing types from consolidated systems
  MULTIPLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false", 
  FILL_BLANK: "fill_blank",
  MATCHING: "matching",
  ORDERING: "ordering",
  SHORT_ANSWER: "short_answer",
  ESSAY: "essay",
  SPEAKING: "speaking",
  TRANSLATION: "translation",
  
  // New specialized IELTS types
  MAP_DIAGRAM_LABELING: "map_diagram_labeling",
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS: "multiple_choice_multiple_answers",
  
  // GRE types
  TEXT_COMPLETION_MULTIPLE_BLANKS: "text_completion_multiple_blanks", 
  SENTENCE_EQUIVALENCE: "sentence_equivalence",
  
  // TOEFL types
  COHERENCE_INSERTION: "coherence_insertion",
  
  // PTE types  
  READ_ALOUD: "read_aloud",
  REPEAT_SENTENCE: "repeat_sentence",
  DESCRIBE_IMAGE: "describe_image",
  FILL_BLANKS_DRAG_DROP: "fill_blanks_drag_drop",
  
  // GMAT types
  DATA_SUFFICIENCY: "data_sufficiency",
  SENTENCE_CORRECTION: "sentence_correction", 
  TWO_PART_ANALYSIS: "two_part_analysis"
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];

// Response Types Enum
export const RESPONSE_TYPES = {
  TEXT: "text",
  AUDIO: "audio", 
  MULTIPLE_CHOICE: "multiple_choice",
  DRAG_DROP: "drag_drop",
  DRAWING: "drawing",
  COORDINATES: "coordinates",
  TABLE: "table"
} as const;

export type ResponseType = typeof RESPONSE_TYPES[keyof typeof RESPONSE_TYPES];

// Scoring Methods Enum
export const SCORING_METHODS = {
  EXACT_MATCH: "exact_match",
  PARTIAL_CREDIT: "partial_credit", 
  ALL_OR_NOTHING: "all_or_nothing",
  PER_ITEM: "per_item",
  AI_EVALUATION: "ai_evaluation"
} as const;

export type ScoringMethod = typeof SCORING_METHODS[keyof typeof SCORING_METHODS];

// Test Types Enum
export const TEST_TYPES = {
  PLACEMENT: "placement",
  MST: "mst",
  QUIZ: "quiz", 
  EXAM: "exam",
  PRACTICE: "practice",
  ASSESSMENT: "assessment",
  GAME: "game",
  LEVEL_ASSESSMENT: "level_assessment"
} as const;

export type TestType = typeof TEST_TYPES[keyof typeof TEST_TYPES];

// CEFR Levels
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CEFRLevel = typeof CEFR_LEVELS[number];

// Skills
export const SKILLS = ['speaking', 'listening', 'writing', 'reading', 'grammar', 'vocabulary'] as const;
export type Skill = typeof SKILLS[number];

// ============================================================================
// UNIFIED QUESTION BANK
// ============================================================================

export const unifiedQuestions = pgTable("unified_questions", {
  id: serial("id").primaryKey(),
  
  // Question classification
  questionType: varchar("question_type", { length: 50 }).notNull().$type<QuestionType>(),
  skill: varchar("skill", { length: 20 }).notNull().$type<Skill>(),
  cefrLevel: varchar("cefr_level", { length: 2 }).notNull().$type<CEFRLevel>(),
  language: varchar("language", { length: 50 }).notNull(), // Target language
  
  // Question metadata
  title: varchar("title", { length: 255 }).notNull(),
  instructions: text("instructions").notNull(), // Question instructions/prompt
  
  // Unified content field - stores all question-specific data as JSONB
  content: jsonb("content").notNull().$type<{
    // Common fields
    text?: string;
    audioUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    
    // Multiple choice fields
    options?: Array<{
      id: string;
      text: string;
      audioUrl?: string;
      imageUrl?: string;
    }>;
    correctAnswers?: string[]; // Array of correct option IDs
    
    // Fill in blanks fields
    passage?: string;
    blanks?: Array<{
      id: string;
      position: number;
      correctAnswers: string[];
      acceptableVariations?: string[];
    }>;
    
    // Drag and drop fields
    wordBank?: string[];
    targetSlots?: Array<{
      id: string;
      correctWord: string;
      position: number;
    }>;
    
    // Map/diagram labeling fields
    interactiveAreas?: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      correctAnswer: string;
      acceptableAnswers?: string[];
    }>;
    
    // Text completion fields
    blankOptions?: Array<{
      blankId: string;
      options: string[];
      correctOption: string;
    }>;
    
    // Sentence equivalence fields
    choices?: string[];
    equivalentChoices?: string[]; // Two correct choices that mean the same
    
    // Data sufficiency fields  
    question?: string;
    statement1?: string;
    statement2?: string;
    dataOptions?: string[]; // Standard GMAT data sufficiency options
    
    // Two-part analysis fields
    table?: {
      headers: string[];
      rows: Array<{
        id: string;
        values: string[];
        correctSelections: string[]; // Which columns should be selected
      }>;
    };
    
    // AI evaluation fields
    keyFeatures?: string[]; // For describe image, read aloud
    evaluationCriteria?: {
      content?: number; // Weight for content accuracy
      fluency?: number; // Weight for fluency 
      pronunciation?: number; // Weight for pronunciation
    };
    
    // Timing fields
    timeLimit?: number; // Time limit in seconds
    preparationTime?: number; // Preparation time before recording
    
    // Additional metadata
    difficulty?: number; // 1-5 scale within CEFR level
    tags?: string[];
    [key: string]: any; // Allow additional fields for extensibility
  }>(),
  
  // Response configuration
  responseType: varchar("response_type", { length: 50 }).notNull().$type<ResponseType>(),
  expectedDurationSeconds: integer("expected_duration_seconds").default(120),
  maxAttempts: integer("max_attempts").default(1),
  
  // Scoring configuration
  scoringMethod: varchar("scoring_method", { length: 50 }).notNull().$type<ScoringMethod>(),
  maxScore: integer("max_score").default(100),
  passingScore: integer("passing_score").default(60),
  
  // Evaluation rules
  evaluationRules: jsonb("evaluation_rules").$type<{
    ignoreCasing?: boolean;
    ignorePunctuation?: boolean;
    allowNumericEquivalence?: boolean; // "two" = "2"
    acceptableVariations?: string[]; // Global acceptable variations
    strictMatch?: boolean; // For exact match requirements
    partialCreditRules?: {
      [key: string]: number; // Point values for partial answers
    };
    aiEvaluationPrompt?: string; // Prompt for AI evaluation
  }>().default({}),
  
  // Question bank metadata
  source: varchar("source", { length: 100 }), // "admin_created", "ai_generated", "imported"
  originalSystemId: integer("original_system_id"), // ID from original system during migration
  originalSystemType: varchar("original_system_type", { length: 50 }), // "mst", "placement", "test", "game", "level_assessment"
  
  // Quality metrics
  usageCount: integer("usage_count").default(0),
  correctAnswerRate: decimal("correct_answer_rate", { precision: 5, scale: 2 }),
  averageResponseTime: decimal("average_response_time", { precision: 8, scale: 2 }), // milliseconds
  difficultyRating: decimal("difficulty_rating", { precision: 3, scale: 2 }), // User feedback-based difficulty
  
  // AI generation metadata
  aiGenerated: boolean("ai_generated").default(false),
  aiGenerationPrompt: text("ai_generation_prompt"),
  antiPlagiarismVariations: jsonb("anti_plagiarism_variations").$type<string[]>().default([]),
  
  // Status and versioning
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  parentQuestionId: integer("parent_question_id").references(() => unifiedQuestions.id), // For variations
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id).notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// UNIFIED TEST TEMPLATES
// ============================================================================

export const unifiedTestTemplates = pgTable("unified_test_templates", {
  id: serial("id").primaryKey(),
  
  // Template metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  testType: varchar("test_type", { length: 50 }).notNull().$type<TestType>(),
  
  // Target configuration
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  targetSkills: jsonb("target_skills").$type<Skill[]>().default([]),
  cefrLevelRange: jsonb("cefr_level_range").$type<{
    min: CEFRLevel;
    max: CEFRLevel;
  }>(),
  
  // Test structure
  sections: jsonb("sections").$type<Array<{
    id: string;
    name: string;
    description?: string;
    skill: Skill;
    timeLimit?: number; // minutes
    questionCount: number;
    questionSelection: 'sequential' | 'random' | 'adaptive';
    questionTypes?: QuestionType[];
    difficultyDistribution?: {
      [key in CEFRLevel]?: number; // percentage
    };
    passingScore?: number;
    weight?: number; // Weight in overall score calculation
  }>>().notNull(),
  
  // Assembly rules
  assemblyRules: jsonb("assembly_rules").$type<{
    randomizeQuestions?: boolean;
    randomizeSections?: boolean;
    allowQuestionRepeat?: boolean;
    adaptiveDifficulty?: boolean;
    skillProgressionRules?: {
      [key in Skill]?: {
        initialLevel: CEFRLevel;
        advancementThreshold: number;
        regressionThreshold: number;
      };
    };
    terminationCriteria?: {
      maxQuestions?: number;
      confidenceThreshold?: number;
      timeLimit?: number;
    };
  }>().default({}),
  
  // Scoring configuration
  scoringConfig: jsonb("scoring_config").$type<{
    method: 'weighted_average' | 'pass_fail' | 'adaptive_scoring';
    passingScore: number;
    sectionWeights?: { [sectionId: string]: number };
    bonusPoints?: {
      speedBonus?: number;
      perfectSectionBonus?: number;
      streakBonus?: number;
    };
    penaltyRules?: {
      incorrectAnswerPenalty?: number;
      timeOveragePenalty?: number;
    };
  }>(),
  
  // AI integration
  aiEnabled: boolean("ai_enabled").default(false),
  aiConfig: jsonb("ai_config").$type<{
    questionGeneration?: boolean;
    adaptiveScoring?: boolean;
    personalizedFeedback?: boolean;
    performanceAnalysis?: boolean;
  }>().default({}),
  
  // Template metadata
  estimatedDuration: integer("estimated_duration"), // minutes
  maxAttempts: integer("max_attempts").default(1),
  isPublic: boolean("is_public").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Quality and usage tracking
  usageCount: integer("usage_count").default(0),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  averageCompletionTime: decimal("average_completion_time", { precision: 8, scale: 2 }), // minutes
  userRating: decimal("user_rating", { precision: 3, scale: 2 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// UNIFIED TEST SESSIONS 
// ============================================================================

export const unifiedTestSessions = pgTable("unified_test_sessions", {
  id: serial("id").primaryKey(),
  
  // Session identification
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => unifiedTestTemplates.id).notNull(),
  sessionType: varchar("session_type", { length: 50 }).notNull().$type<TestType>(),
  
  // Session state
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, abandoned, expired, paused
  currentSectionId: varchar("current_section_id", { length: 50 }),
  currentQuestionIndex: integer("current_question_index").default(0),
  
  // Timing
  startedAt: timestamp("started_at").defaultNow().notNull(),
  pausedAt: timestamp("paused_at"),
  resumedAt: timestamp("resumed_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  totalTimeSpent: integer("total_time_spent").default(0), // seconds
  
  // Assembled test data (snapshot of template at test time)
  assembledTest: jsonb("assembled_test").$type<{
    sections: Array<{
      id: string;
      name: string;
      questionIds: number[];
      timeLimit?: number;
      status: 'not_started' | 'in_progress' | 'completed';
      startedAt?: string;
      completedAt?: string;
    }>;
    totalQuestions: number;
    estimatedDuration: number;
  }>().notNull(),
  
  // Session configuration (can override template defaults)
  sessionConfig: jsonb("session_config").$type<{
    allowPause?: boolean;
    allowReview?: boolean;
    showProgress?: boolean;
    immediateResults?: boolean;
    randomSeed?: number; // For reproducible randomization
  }>().default({}),
  
  // Progress tracking
  questionsAttempted: integer("questions_attempted").default(0),
  questionsCompleted: integer("questions_completed").default(0),
  sectionsCompleted: integer("sections_completed").default(0),
  
  // Adaptive test state (for MST/adaptive tests)
  adaptiveState: jsonb("adaptive_state").$type<{
    skillLevels?: { [key in Skill]?: CEFRLevel };
    confidenceScores?: { [key in Skill]?: number };
    nextRecommendedLevel?: CEFRLevel;
    terminationReason?: 'confidence_reached' | 'max_questions' | 'time_expired';
    adaptiveHistory?: Array<{
      questionId: number;
      difficulty: CEFRLevel;
      correct: boolean;
      confidenceChange: number;
    }>;
  }>(),
  
  // Results summary (populated on completion)
  results: jsonb("results").$type<{
    overallScore: number;
    percentage: number;
    cefrLevel?: CEFRLevel;
    skillScores?: { [key in Skill]?: number };
    sectionScores?: { [sectionId: string]: number };
    timeSpentPerSection?: { [sectionId: string]: number };
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    nextSteps?: string[];
  }>(),
  
  // AI analysis (if enabled)
  aiAnalysis: jsonb("ai_analysis").$type<{
    performanceInsights?: string[];
    personalizedFeedback?: string;
    recommendedStudyPlan?: any;
    confidenceLevel?: number;
    detectedPatterns?: string[];
  }>(),
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// UNIFIED RESPONSES
// ============================================================================

export const unifiedResponses = pgTable("unified_responses", {
  id: serial("id").primaryKey(),
  
  // Response identification
  sessionId: integer("session_id").references(() => unifiedTestSessions.id).notNull(),
  questionId: integer("question_id").references(() => unifiedQuestions.id).notNull(),
  
  // Response metadata
  sectionId: varchar("section_id", { length: 50 }).notNull(),
  attemptNumber: integer("attempt_number").default(1),
  questionOrder: integer("question_order").notNull(), // Order within session
  
  // Timing
  startedAt: timestamp("started_at").notNull(),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"), // milliseconds
  
  // Response data (unified format for all question types)
  responseData: jsonb("response_data").$type<{
    // Text responses
    textAnswer?: string;
    
    // Multiple choice responses
    selectedOptions?: string[]; // Array of selected option IDs
    
    // Audio responses  
    audioUrl?: string;
    audioDuration?: number;
    audioTranscript?: string; // AI-generated transcript
    
    // Drag and drop responses
    dragDropMapping?: { [slotId: string]: string }; // slot -> word mapping
    
    // Coordinates/drawing responses
    coordinates?: Array<{ x: number; y: number; text?: string }>;
    
    // Table responses (for two-part analysis)
    tableSelections?: { [rowId: string]: string[] }; // row -> selected columns
    
    // Fill in blanks responses
    blankAnswers?: { [blankId: string]: string };
    
    // Additional metadata
    confidence?: number; // User's confidence level
    flaggedForReview?: boolean;
    notes?: string; // User notes
    [key: string]: any; // Allow additional fields
  }>().notNull(),
  
  // Scoring results
  autoScore: decimal("auto_score", { precision: 5, scale: 2 }), // Automatic scoring result
  manualScore: decimal("manual_score", { precision: 5, scale: 2 }), // Manual override score
  finalScore: decimal("final_score", { precision: 5, scale: 2 }), // Final score used
  maxPossibleScore: integer("max_possible_score").default(100),
  isCorrect: boolean("is_correct"),
  
  // Detailed evaluation
  evaluationDetails: jsonb("evaluation_details").$type<{
    scoringMethod: ScoringMethod;
    pointsBreakdown?: { [criterion: string]: number };
    correctParts?: string[]; // Which parts were correct (for partial credit)
    incorrectParts?: string[]; // Which parts were incorrect
    feedback?: string;
    aiConfidence?: number; // AI evaluation confidence
    humanReviewRequired?: boolean;
  }>(),
  
  // AI evaluation (for speech, essay, etc.)
  aiEvaluation: jsonb("ai_evaluation").$type<{
    contentScore?: number;
    fluencyScore?: number; // For speech
    pronunciationScore?: number; // For speech
    grammarScore?: number; // For writing
    vocabularyScore?: number; // For writing
    coherenceScore?: number; // For writing
    overallFeedback?: string;
    specificFeedback?: { [criterion: string]: string };
    suggestedImprovements?: string[];
    transcriptionAccuracy?: number; // For speech-to-text accuracy
  }>(),
  
  // Manual review (if needed)
  reviewStatus: varchar("review_status", { length: 20 }).default("auto_scored"), // auto_scored, pending_review, reviewed
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Question performance tracking
  responseTime: integer("response_time"), // milliseconds
  wasGuessed: boolean("was_guessed").default(false), // User indicated this was a guess
  difficultyPerceived: integer("difficulty_perceived"), // 1-5 user rating
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ============================================================================
// EVALUATION RULES ENGINE
// ============================================================================

export const evaluationRules = pgTable("evaluation_rules", {
  id: serial("id").primaryKey(),
  
  // Rule identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  questionTypes: jsonb("question_types").$type<QuestionType[]>().notNull(), // Which question types this rule applies to
  
  // Rule configuration
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // "text_matching", "ai_scoring", "custom_logic"
  
  ruleConfig: jsonb("rule_config").$type<{
    // Text matching rules
    ignoreCasing?: boolean;
    ignorePunctuation?: boolean;
    allowNumericEquivalence?: boolean;
    stemming?: boolean;
    synonymMatching?: boolean;
    typoTolerance?: number; // Levenshtein distance
    
    // AI scoring rules
    aiModel?: string;
    aiPrompt?: string;
    scoringCriteria?: { [criterion: string]: number }; // criterion -> weight
    
    // Custom logic rules
    customFunction?: string; // Name of custom evaluation function
    parameters?: { [key: string]: any };
    
    // Partial credit rules
    partialCreditEnabled?: boolean;
    partialCreditRules?: { [pattern: string]: number };
    
    // Multi-answer rules (for multiple correct answers)
    requireAllCorrect?: boolean; // All-or-nothing vs partial credit
    perAnswerPoints?: number;
    
    // Acceptable variations
    acceptableVariations?: string[];
    contextualVariations?: { [context: string]: string[] };
  }>().notNull(),
  
  // Performance tracking
  usageCount: integer("usage_count").default(0),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }),
  averageProcessingTime: decimal("average_processing_time", { precision: 8, scale: 2 }), // milliseconds
  
  // Status
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// AI GENERATION TEMPLATES
// ============================================================================

export const aiGenerationTemplates = pgTable("ai_generation_templates", {
  id: serial("id").primaryKey(),
  
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  questionType: varchar("question_type", { length: 50 }).notNull().$type<QuestionType>(),
  
  // Generation configuration
  generationPrompt: text("generation_prompt").notNull(),
  systemPrompt: text("system_prompt"),
  
  // Parameters
  parameters: jsonb("parameters").$type<{
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    
    // Content requirements
    skill?: Skill;
    cefrLevel?: CEFRLevel;
    language?: string;
    difficulty?: number;
    
    // Variation requirements
    variationCount?: number;
    antiPlagiarismEnabled?: boolean;
    
    // Quality requirements
    qualityThreshold?: number;
    reviewRequired?: boolean;
  }>(),
  
  // Template examples
  examples: jsonb("examples").$type<Array<{
    input: string;
    expectedOutput: any;
    quality: number; // 1-5 rating
  }>>().default([]),
  
  // Validation rules
  validationRules: jsonb("validation_rules").$type<{
    requiredFields?: string[];
    contentLengthLimits?: { min?: number; max?: number };
    difficultyValidation?: boolean;
    duplicateDetection?: boolean;
    qualityChecks?: string[];
  }>().default({}),
  
  // Performance tracking
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  averageQuality: decimal("average_quality", { precision: 3, scale: 2 }),
  averageGenerationTime: decimal("average_generation_time", { precision: 8, scale: 2 }), // milliseconds
  
  // Status
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas
export const insertUnifiedQuestionSchema = createInsertSchema(unifiedQuestions).omit({
  id: true,
  usageCount: true,
  correctAnswerRate: true,
  averageResponseTime: true,
  difficultyRating: true,
  createdAt: true,
  updatedAt: true
});

export const insertUnifiedTestTemplateSchema = createInsertSchema(unifiedTestTemplates).omit({
  id: true,
  usageCount: true,
  averageScore: true,
  averageCompletionTime: true,
  userRating: true,
  createdAt: true,
  updatedAt: true
});

export const insertUnifiedTestSessionSchema = createInsertSchema(unifiedTestSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUnifiedResponseSchema = createInsertSchema(unifiedResponses).omit({
  id: true,
  createdAt: true
});

export const insertEvaluationRuleSchema = createInsertSchema(evaluationRules).omit({
  id: true,
  usageCount: true,
  accuracyRate: true,
  averageProcessingTime: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiGenerationTemplateSchema = createInsertSchema(aiGenerationTemplates).omit({
  id: true,
  usageCount: true,
  successRate: true,
  averageQuality: true,
  averageGenerationTime: true,
  createdAt: true,
  updatedAt: true
});

// Type exports
export type UnifiedQuestion = typeof unifiedQuestions.$inferSelect;
export type InsertUnifiedQuestion = z.infer<typeof insertUnifiedQuestionSchema>;
export type UnifiedTestTemplate = typeof unifiedTestTemplates.$inferSelect;
export type InsertUnifiedTestTemplate = z.infer<typeof insertUnifiedTestTemplateSchema>;
export type UnifiedTestSession = typeof unifiedTestSessions.$inferSelect;
export type InsertUnifiedTestSession = z.infer<typeof insertUnifiedTestSessionSchema>;
export type UnifiedResponse = typeof unifiedResponses.$inferSelect;
export type InsertUnifiedResponse = z.infer<typeof insertUnifiedResponseSchema>;
export type EvaluationRule = typeof evaluationRules.$inferSelect;
export type InsertEvaluationRule = z.infer<typeof insertEvaluationRuleSchema>;
export type AiGenerationTemplate = typeof aiGenerationTemplates.$inferSelect;
export type InsertAiGenerationTemplate = z.infer<typeof insertAiGenerationTemplateSchema>;