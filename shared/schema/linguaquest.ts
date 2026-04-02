import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { buildInsertSchema } from "./schema-helpers";
import { z } from "zod";
import { users } from "./users";
import { institutes } from "./social";

export const iranianCalendarSettings = pgTable("iranian_calendar_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  instituteId: integer("institute_id").references(() => institutes.id),
  timezone: varchar("timezone", { length: 100 }).default("Asia/Tehran"),
  weekStartDay: integer("week_start_day").default(6), // Saturday in Persian calendar
  workingDays: integer("working_days").array().default([6, 0, 1, 2, 3]), // Sat-Wed
  workingHoursStart: varchar("working_hours_start", { length: 10 }).default("08:00"),
  workingHoursEnd: varchar("working_hours_end", { length: 10 }).default("17:00"),
  displayFormat: varchar("display_format", { length: 50 }).default("persian"), // persian, dual, gregorian
  showHolidays: boolean("show_holidays").default(true),
  showLunarEvents: boolean("show_lunar_events").default(true),
  autoDetectHijriMonths: boolean("auto_detect_hijri_months").default(true),
  eventReminderMinutes: integer("event_reminder_minutes").default(30),
  enableNotifications: boolean("enable_notifications").default(true),
  defaultEventDuration: integer("default_event_duration").default(60), // minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Calendar Events Iranian table for Solar Hijri calendar events
export const calendarEventsIranian = pgTable("calendar_events_iranian", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  instituteId: integer("institute_id").references(() => institutes.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  persianDate: varchar("persian_date", { length: 20 }).notNull(), // 1403/01/15 format
  gregorianDate: date("gregorian_date").notNull(),
  startTime: varchar("start_time", { length: 10 }), // HH:MM format
  endTime: varchar("end_time", { length: 10 }), // HH:MM format
  isAllDay: boolean("is_all_day").default(false),
  eventType: varchar("event_type", { length: 100 }).notNull(), // class, exam, meeting, holiday
  recurrencePattern: varchar("recurrence_pattern", { length: 100 }), // daily, weekly, monthly, yearly
  recurrenceEnd: date("recurrence_end"),
  location: varchar("location", { length: 255 }),
  attendees: text("attendees").array(),
  reminderMinutes: integer("reminder_minutes").default(30),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  color: varchar("color", { length: 20 }).default("blue"),
  isVisible: boolean("is_visible").default(true),
  metadata: jsonb("metadata"),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Holiday Calendar Persian table for Iranian official holidays
export const holidayCalendarPersian = pgTable("holiday_calendar_persian", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEnglish: varchar("name_english", { length: 255 }),
  description: text("description"),
  persianDate: varchar("persian_date", { length: 20 }).notNull(), // 1403/01/01 format
  gregorianDate: date("gregorian_date").notNull(),
  hijriDate: varchar("hijri_date", { length: 20 }), // 1445/06/15 format for lunar holidays
  holidayType: varchar("holiday_type", { length: 100 }).notNull(), // national, religious, seasonal
  isOfficial: boolean("is_official").default(true), // government recognized
  isRecurring: boolean("is_recurring").default(true),
  recurrenceType: varchar("recurrence_type", { length: 50 }), // solar, lunar, fixed
  region: varchar("region", { length: 100 }).default("national"), // national, regional
  duration: integer("duration").default(1), // days
  year: integer("year"), // Persian year e.g., 1403
  category: varchar("category", { length: 100 }), // norouz, muharram, national_day
  significance: text("significance"),
  traditions: text("traditions").array(),
  isWorkingDay: boolean("is_working_day").default(false),
  compensationDate: date("compensation_date"), // makeup working day
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Third Party APIs table for managing external service integrations
export const thirdPartyApis = pgTable("third_party_apis", {
  id: serial("id").primaryKey(),
  apiName: varchar("api_name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  baseUrl: varchar("base_url", { length: 500 }).notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  isEnabled: boolean("is_enabled").default(true),
  isHealthy: boolean("is_healthy").default(false),
  lastHealthCheck: timestamp("last_health_check"),
  usageCount: integer("usage_count").default(0),
  usageCountMonth: integer("usage_count_month").default(0),
  errorCount: integer("error_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  lastErrorAt: timestamp("last_error_at"),
  lastErrorMessage: text("last_error_message"),
  rateLimit: integer("rate_limit"),
  costPerRequest: decimal("cost_per_request", { precision: 10, scale: 6 }),
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }),
  currentMonthlyCost: decimal("current_monthly_cost", { precision: 10, scale: 2 }).default('0'),
  configuration: jsonb("configuration"),
  healthCheckUrl: text("health_check_url"),
  testEndpoint: text("test_endpoint"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Voice Exercises Guest table for anonymous users practicing pronunciation
export const voiceExercisesGuest = pgTable("voice_exercises_guest", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  guestIdentifier: varchar("guest_identifier", { length: 100 }).notNull(),
  exerciseTitle: varchar("exercise_title", { length: 255 }).notNull(),
  exerciseType: varchar("exercise_type", { length: 100 }).notNull(), // pronunciation, shadowing, dictation, conversation
  targetLanguage: varchar("target_language", { length: 100 }).notNull(),
  difficultyLevel: varchar("difficulty_level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  audioPromptUrl: varchar("audio_prompt_url", { length: 500 }),
  textPrompt: text("text_prompt").notNull(),
  expectedPronunciation: text("expected_pronunciation"),
  phonetics: varchar("phonetics", { length: 255 }),
  guestRecordingUrl: varchar("guest_recording_url", { length: 500 }),
  accuracyScore: integer("accuracy_score"), // 0-100 percentage
  fluencyScore: integer("fluency_score"), // 0-100 percentage
  pronunciationScore: integer("pronunciation_score"), // 0-100 percentage
  overallScore: integer("overall_score"), // 0-100 percentage
  feedback: text("feedback"),
  improvementSuggestions: text("improvement_suggestions").array(),
  attemptNumber: integer("attempt_number").default(1),
  timeSpent: integer("time_spent"), // seconds
  isCompleted: boolean("is_completed").default(false),
  deviceType: varchar("device_type", { length: 50 }),
  browserType: varchar("browser_type", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Visitor Achievements table for tracking guest user accomplishments
export const visitorAchievements = pgTable("visitor_achievements", {
  id: serial("id").primaryKey(),
  visitorId: varchar("visitor_id", { length: 255 }).notNull(), // session or device identifier
  achievementType: varchar("achievement_type", { length: 100 }).notNull(), // first_lesson, streak_3, perfect_score, etc.
  achievementTitle: varchar("achievement_title", { length: 255 }).notNull(),
  achievementDescription: text("achievement_description"),
  achievementIcon: varchar("achievement_icon", { length: 255 }),
  pointsEarned: integer("points_earned").default(0),
  badgeLevel: varchar("badge_level", { length: 50 }), // bronze, silver, gold, platinum
  unlockCriteria: jsonb("unlock_criteria"),
  progress: integer("progress").default(0), // current progress toward achievement
  progressMax: integer("progress_max").default(1), // max progress needed
  isUnlocked: boolean("is_unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  languageTarget: varchar("language_target", { length: 100 }),
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  category: varchar("category", { length: 100 }), // learning, engagement, streak, social
  isVisible: boolean("is_visible").default(true),
  displayOrder: integer("display_order").default(0),
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceType: varchar("device_type", { length: 50 }),
  browserType: varchar("browser_type", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest Lessons table for gamified language learning content
export const linguaquestLessons = pgTable("linguaquest_lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  language: text("language").notNull(),
  difficulty: text("difficulty"), // text field instead of integer
  lessonType: text("lesson_type"), // renamed from questType to match DB
  sceneType: text("scene_type"),
  sceneData: jsonb("scene_data"),
  interactionConfig: jsonb("interaction_config"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  xpReward: integer("xp_reward"),
  completionRequirements: jsonb("completion_requirements"),
  vocabularyWords: text("vocabulary_words").array(),
  grammarTopics: text("grammar_topics").array(),
  exampleSentences: text("example_sentences").array(),
  audioFiles: text("audio_files").array(),
  tags: text("tags").array(),
  prerequisites: text("prerequisites").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Guest Progress Tracking table for anonymous users (LinguaQuest)
export const guestProgressTracking = pgTable("guest_progress_tracking", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  fingerprintHash: text("fingerprint_hash"),
  completedLessons: integer("completed_lessons").array(),
  currentStreak: integer("current_streak").default(0),
  totalXp: integer("total_xp").default(0),
  currentLevel: integer("current_level").default(1),
  strongSkills: text("strong_skills").array(),
  weakSkills: text("weak_skills").array(),
  preferredDifficulty: text("preferred_difficulty").default("beginner"),
  learningPath: text("learning_path").array(),
  totalStudyTimeMinutes: integer("total_study_time_minutes").default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  deviceInfo: jsonb("device_info"),
  hasSeenUpgradePrompt: boolean("has_seen_upgrade_prompt").default(false),
  upgradePromptCount: integer("upgrade_prompt_count").default(0),
  lastUpgradePromptAt: timestamp("last_upgrade_prompt_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest CEFR Levels table - metadata for A1-C2 levels
export const linguaquestCefrLevels = pgTable("linguaquest_cefr_levels", {
  id: serial("id").primaryKey(),
  levelCode: varchar("level_code", { length: 10 }).notNull().unique(), // A1, A2, B1, B2, C1, C2
  levelName: varchar("level_name", { length: 100 }).notNull(), // Beginner, Elementary, etc.
  description: text("description"),
  vocabularySize: integer("vocabulary_size"), // Expected vocabulary size for this level
  grammarTopics: text("grammar_topics").array(),
  canDoStatements: text("can_do_statements").array(), // CEFR "can do" descriptors
  minXpRequired: integer("min_xp_required").default(0),
  maxXpRequired: integer("max_xp_required"),
  estimatedHours: integer("estimated_hours"), // Estimated study hours needed
  color: varchar("color", { length: 20 }), // UI color for level badge
  icon: varchar("icon", { length: 100 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest Audio Assets table - TTS audio file mappings
export const linguaquestAudioAssets = pgTable("linguaquest_audio_assets", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // word, sentence, question, explanation, feedback
  contentText: text("content_text").notNull(), // The text that was converted to speech
  contentHash: varchar("content_hash", { length: 64 }).notNull().unique(), // SHA-256 hash of contentText for deduplication
  language: varchar("language", { length: 10 }).notNull(), // en, fa, ar, etc.
  voice: varchar("voice", { length: 100 }), // TTS voice used (e.g., "en-US-JennyNeural")
  filePath: varchar("file_path", { length: 500 }).notNull(), // uploads/tts/audio_hash.mp3
  fileSize: integer("file_size"), // File size in bytes
  duration: integer("duration"), // Audio duration in milliseconds
  cefrLevel: varchar("cefr_level", { length: 10 }), // A1, A2, B1, B2, C1, C2
  gameType: varchar("game_type", { length: 50 }), // vocabulary_matching, sentence_scramble, etc.
  metadata: jsonb("metadata"), // Additional metadata (speed, pitch, etc.)
  usageCount: integer("usage_count").default(0), // Track how often this audio is used
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest Leaderboard Entries table - global and level-specific rankings
export const linguaquestLeaderboardEntries = pgTable("linguaquest_leaderboard_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // NULL for guest users
  guestSessionToken: text("guest_session_token"), // For anonymous users
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatar: varchar("avatar", { length: 255 }),
  totalXp: integer("total_xp").default(0),
  totalScore: integer("total_score").default(0),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  cefrLevel: varchar("cefr_level", { length: 10 }), // Current CEFR level
  language: varchar("language", { length: 10 }).notNull(), // Target language
  globalRank: integer("global_rank"), // Updated periodically
  levelRank: integer("level_rank"), // Rank within same CEFR level
  countryCode: varchar("country_code", { length: 10 }), // For country leaderboards
  weeklyXp: integer("weekly_xp").default(0), // Reset weekly
  monthlyXp: integer("monthly_xp").default(0), // Reset monthly
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest Content Bank - Reusable vocabulary, grammar, and questions for all game types
export const linguaquestContentBank = pgTable("linguaquest_content_bank", {
  id: serial("id").primaryKey(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // vocabulary, grammar, question, sentence, phrase
  gameTypes: text("game_types").array(), // Which games can use this content: vocabulary_matching, sentence_scramble, etc.
  cefrLevel: varchar("cefr_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2
  language: varchar("language", { length: 10 }).notNull().default("en"), // Target language
  
  // Primary content
  primaryText: text("primary_text").notNull(), // Main word/phrase/question
  translation: text("translation"), // Translation in native language
  phonetic: varchar("phonetic", { length: 255 }), // IPA pronunciation
  
  // Context and examples
  exampleSentences: text("example_sentences").array(), // Usage examples
  contextNotes: text("context_notes"), // When/how to use this
  
  // For vocabulary items
  partOfSpeech: varchar("part_of_speech", { length: 50 }), // noun, verb, adjective, etc.
  synonyms: text("synonyms").array(),
  antonyms: text("antonyms").array(),
  relatedWords: text("related_words").array(),
  wordFamily: text("word_family").array(), // teach, teacher, teaching, taught
  
  // For grammar items
  grammarRule: text("grammar_rule"), // Explanation of grammar point
  grammarExamples: text("grammar_examples").array(),
  commonMistakes: text("common_mistakes").array(),
  
  // For questions (multiple choice, fill-in-blank, etc.)
  questionText: text("question_text"),
  correctAnswer: text("correct_answer"),
  wrongAnswers: text("wrong_answers").array(),
  explanation: text("explanation"), // Why this answer is correct
  hint: text("hint"), // Optional hint for learners
  
  // Difficulty and categorization
  difficultyScore: integer("difficulty_score").default(1), // 1-10 scale within CEFR level
  topicCategory: varchar("topic_category", { length: 100 }), // travel, business, daily_life, etc.
  tags: text("tags").array(), // Searchable tags
  
  // Audio references
  audioHash: varchar("audio_hash", { length: 64 }), // References linguaquestAudioAssets.contentHash
  hasAudio: boolean("has_audio").default(false),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }), // % of correct answers
  averageTimeSeconds: integer("average_time_seconds"), // Average time to answer
  
  // Quality control
  isVerified: boolean("is_verified").default(false), // Reviewed by language expert
  verifiedBy: integer("verified_by"), // Admin user ID
  verifiedAt: timestamp("verified_at"),
  reportCount: integer("report_count").default(0), // User reports of errors
  
  // Metadata
  sourceReference: varchar("source_reference", { length: 500 }), // Where content came from
  contributorNotes: text("contributor_notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest Audio Generation Jobs table - Track batch audio generation progress
export const linguaquestAudioJobs = pgTable("linguaquest_audio_jobs", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, running, completed, failed
  totalItems: integer("total_items").default(0),
  processedItems: integer("processed_items").default(0),
  generatedItems: integer("generated_items").default(0),
  cachedItems: integer("cached_items").default(0),
  failedItems: integer("failed_items").default(0),
  errors: jsonb("errors"), // Array of {contentId, error}
  contentIds: text("content_ids").array(), // Specific content IDs to process (null = all)
  regenerateAll: boolean("regenerate_all").default(false),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  triggeredBy: integer("triggered_by"), // Admin user ID who triggered the job
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// LinguaQuest Lesson Feedback table - User ratings and reviews for lessons
export const linguaquestLessonFeedback = pgTable("linguaquest_lesson_feedback", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => linguaquestLessons.id).notNull(),
  guestSessionToken: text("guest_session_token"), // For guest users
  userId: integer("user_id").references(() => users.id), // For registered users
  
  // Ratings
  starRating: integer("star_rating").notNull(), // 1-5 stars
  difficultyRating: varchar("difficulty_rating", { length: 20 }), // too_easy, just_right, too_hard
  
  // Feedback
  textFeedback: text("text_feedback"),
  wasHelpful: boolean("was_helpful"),
  
  // Metadata
  completionTimeSeconds: integer("completion_time_seconds"), // Time spent on lesson
  scorePercentage: integer("score_percentage"), // User's score on the lesson (0-100)
  attemptNumber: integer("attempt_number").default(1), // Which attempt this feedback is for
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Freemium Conversion Tracking table
export const freemiumConversionTracking = pgTable("freemium_conversion_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  previousTier: varchar("previous_tier", { length: 50 }).notNull(), // free, trial, etc.
  newTier: varchar("new_tier", { length: 50 }).notNull(), // premium, pro, etc.
  conversionDate: timestamp("conversion_date").defaultNow().notNull(),
  campaignId: varchar("campaign_id", { length: 100 }),
  conversionMethod: varchar("conversion_method", { length: 50 }), // payment, referral, promotion
  paymentAmount: integer("payment_amount"), // in IRR
  paymentProvider: varchar("payment_provider", { length: 50 }),
  referralSource: varchar("referral_source", { length: 255 }),
  promotionCode: varchar("promotion_code", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Addresses table for shipping addresses
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  addressType: varchar("address_type", { length: 20 }).default("shipping"), // shipping, billing
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }),
  addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull().default("Iran"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for Third Party APIs
export const insertThirdPartyApiSchema = z.object({
  apiName: z.string().max(100),
  displayName: z.string().max(255),
  description: z.string().optional(),
  baseUrl: z.string().max(500),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  isEnabled: z.boolean().default(true),
  rateLimit: z.number().optional(),
  costPerRequest: z.number().optional(),
  monthlyBudget: z.number().optional(),
  configuration: z.any().optional()
});

// Insert schema for Iranian Calendar Settings
export const insertIranianCalendarSettingsSchema = z.object({
  userId: z.number().optional(),
  instituteId: z.number().optional(),
  timezone: z.string().max(100).default("Asia/Tehran"),
  weekStartDay: z.number().default(6),
  workingDays: z.array(z.number()).default([6, 0, 1, 2, 3]),
  workingHoursStart: z.string().max(10).default("08:00"),
  workingHoursEnd: z.string().max(10).default("17:00"),
  displayFormat: z.string().max(50).default("persian"),
  showHolidays: z.boolean().default(true),
  showLunarEvents: z.boolean().default(true),
  autoDetectHijriMonths: z.boolean().default(true),
  eventReminderMinutes: z.number().default(30),
  enableNotifications: z.boolean().default(true),
  defaultEventDuration: z.number().default(60),
  isActive: z.boolean().default(true)
});

// Insert schema for LinguaQuest lessons
export const insertLinguaquestLessonSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  language: z.string(),
  difficulty: z.string().optional(), // CEFR level text
  lessonType: z.string().optional(),
  sceneType: z.string().optional(),
  sceneData: z.any().optional(), // JSONB
  interactionConfig: z.any().optional(), // JSONB
  estimatedDurationMinutes: z.number().optional(),
  xpReward: z.number().optional(),
  completionRequirements: z.any().optional(),
  vocabularyWords: z.array(z.string()).optional(),
  grammarTopics: z.array(z.string()).optional(),
  exampleSentences: z.array(z.string()).optional(),
  audioFiles: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isPremium: z.boolean().optional()
});

// Insert schema for Guest Progress Tracking
export const insertGuestProgressTrackingSchema = z.object({
  sessionToken: z.string(),
  fingerprintHash: z.string().optional(),
  completedLessons: z.array(z.number()).optional(),
  currentStreak: z.number().default(0),
  totalXp: z.number().default(0),
  currentLevel: z.number().default(1),
  strongSkills: z.array(z.string()).optional(),
  weakSkills: z.array(z.string()).optional(),
  preferredDifficulty: z.string().default("beginner"),
  learningPath: z.array(z.string()).optional(),
  totalStudyTimeMinutes: z.number().default(0),
  lastActiveAt: z.date().optional(),
  deviceInfo: z.any().optional(),
  hasSeenUpgradePrompt: z.boolean().default(false),
  upgradePromptCount: z.number().default(0),
  lastUpgradePromptAt: z.date().optional()
});

// Insert schema for LinguaQuest Lesson Feedback
export const insertLinguaquestLessonFeedbackSchema = buildInsertSchema(linguaquestLessonFeedback, {
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  starRating: z.number().min(1).max(5),
  difficultyRating: z.enum(['too_easy', 'just_right', 'too_hard']).optional(),
  textFeedback: z.string().max(1000).optional(),
  wasHelpful: z.boolean().optional(),
  completionTimeSeconds: z.number().optional(),
  scorePercentage: z.number().min(0).max(100).optional(),
  attemptNumber: z.number().min(1).default(1)
});

// Insert schema for Voice Exercises Guest
export const insertVoiceExercisesGuestSchema = z.object({
  sessionId: z.string().max(255),
  guestIdentifier: z.string().max(100),
  exerciseTitle: z.string().max(255),
  exerciseType: z.string().max(100),
  targetLanguage: z.string().max(100),
  difficultyLevel: z.string().max(20),
  audioPromptUrl: z.string().max(500).optional(),
  textPrompt: z.string(),
  expectedPronunciation: z.string().optional(),
  phonetics: z.string().max(255).optional(),
  guestRecordingUrl: z.string().max(500).optional(),
  accuracyScore: z.number().optional(),
  fluencyScore: z.number().optional(),
  pronunciationScore: z.number().optional(),
  overallScore: z.number().optional(),
  feedback: z.string().optional(),
  improvementSuggestions: z.array(z.string()).optional(),
  attemptNumber: z.number().default(1),
  timeSpent: z.number().optional(),
  isCompleted: z.boolean().default(false),
  deviceType: z.string().max(50).optional(),
  browserType: z.string().max(100).optional(),
  ipAddress: z.string().max(45).optional(),
  isActive: z.boolean().default(true)
});

// Insert schema for Freemium Conversion Tracking
export const insertFreemiumConversionTrackingSchema = z.object({
  userId: z.number(),
  previousTier: z.string().max(50),
  newTier: z.string().max(50),
  conversionDate: z.date().optional(),
  campaignId: z.string().max(100).optional(),
  conversionMethod: z.string().max(50).optional(),
  paymentAmount: z.number().optional(),
  paymentProvider: z.string().max(50).optional(),
  referralSource: z.string().max(255).optional(),
  promotionCode: z.string().max(100).optional(),
  isActive: z.boolean().default(true)
});

// Insert schema for LinguaQuest Content Bank
export const insertLinguaquestContentBankSchema = z.object({
  contentType: z.enum(['vocabulary', 'grammar', 'question', 'sentence', 'phrase']),
  gameTypes: z.array(z.string()).optional(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.string().max(10).default('en'),
  primaryText: z.string(),
  translation: z.string().optional(),
  phonetic: z.string().max(255).optional(),
  exampleSentences: z.array(z.string()).optional(),
  contextNotes: z.string().optional(),
  partOfSpeech: z.string().max(50).optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
  relatedWords: z.array(z.string()).optional(),
  wordFamily: z.array(z.string()).optional(),
  grammarRule: z.string().optional(),
  grammarExamples: z.array(z.string()).optional(),
  commonMistakes: z.array(z.string()).optional(),
  questionText: z.string().optional(),
  correctAnswer: z.string().optional(),
  wrongAnswers: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  difficultyScore: z.number().min(1).max(10).default(1),
  topicCategory: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  audioHash: z.string().max(64).optional(),
  hasAudio: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  sourceReference: z.string().max(500).optional(),
  contributorNotes: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Insert schema for Visitor Achievements
export const insertVisitorAchievementSchema = z.object({
  visitorId: z.string().max(255),
  achievementType: z.string().max(100),
  achievementTitle: z.string().max(255),
  achievementDescription: z.string().optional(),
  achievementIcon: z.string().max(255).optional(),
  pointsEarned: z.number().default(0),
  badgeLevel: z.string().max(50).optional(),
  unlockCriteria: z.any().optional(),
  progress: z.number().default(0),
  progressMax: z.number().default(1),
  isUnlocked: z.boolean().default(false),
  unlockedAt: z.date().optional(),
  languageTarget: z.string().max(100).optional(),
  difficultyLevel: z.string().max(20).optional(),
  category: z.string().max(100).optional(),
  isVisible: z.boolean().default(true),
  displayOrder: z.number().default(0),
  ipAddress: z.string().max(45).optional(),
  deviceType: z.string().max(50).optional(),
  browserType: z.string().max(100).optional(),
  isActive: z.boolean().default(true)
});

// insertUserAddressSchema moved to curriculum-ext.ts (co-located with table definition)

// Insert schema for departments
export const insertDepartmentSchema = z.object({
  instituteId: z.number(),
  name: z.string().max(255),
  code: z.string().max(50),
  description: z.string().optional(),
  headId: z.number().optional(),
  budget: z.number().optional(),
  currency: z.string().max(3).default("IRR"),
  isActive: z.boolean().default(true),
  parentDepartmentId: z.number().optional(),
  responsibilities: z.array(z.string()).default([]),
  location: z.string().max(255).optional()
});

// Insert schema for front desk operations
export const insertFrontDeskOperationSchema = z.object({
  operatorId: z.number(),
  operationType: z.string().max(50),
  studentId: z.number().optional(),
  visitorName: z.string().max(255).optional(),
  visitorPhone: z.string().max(20).optional(),
  purpose: z.string().max(255).optional(),
  description: z.string().optional(),
  status: z.string().max(20).default("pending"),
  priority: z.string().max(20).default("normal"),
  assignedTo: z.number().optional(),
  resolvedAt: z.date().optional(),
  resolvedBy: z.number().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([])
});

// Insert schema for front desk tasks
export const insertFrontDeskTaskSchema = z.object({
  assigneeId: z.number(),
  assignedBy: z.number().optional(),
  title: z.string().max(255),
  description: z.string().optional(),
  taskType: z.string().max(50).default("general"),
  priority: z.string().max(20).default("normal"),
  status: z.string().max(20).default("pending"),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  estimatedDuration: z.number().optional(),
  actualDuration: z.number().optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().max(50).optional(),
  reminderSet: z.boolean().default(false),
  reminderTime: z.date().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().max(100).optional(),
  notes: z.string().optional(),
  completionNotes: z.string().optional()
});

// Insert schemas for calendar tables
export const insertCalendarEventsIranianSchema = buildInsertSchema(calendarEventsIranian, { id: true, createdAt: true, updatedAt: true });
export const insertHolidayCalendarPersianSchema = buildInsertSchema(holidayCalendarPersian, { id: true, createdAt: true });

// Peer Matching Requests table
