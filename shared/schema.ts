import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// WORKFLOW STATUS CONSTANTS
// ============================================================================

// Canonical workflow status values for call center workflow
export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
} as const;

// Type for workflow status
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];

// Lead status constants  
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
  NURTURING: 'nurturing'
} as const;

// Type for lead status
export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];

// Users table with roles and authentication (PII fields moved to user_profiles)

// OTP Codes table for email/SMS verification

// Comprehensive Subsystem Permissions - controls access to all app subsystems and features with action-level granularity

// User Profiles - Canonical source for all PII and language data

// ============================================================================
// MST (Multi-Stage Test) Schema
// ============================================================================




// MST Insert Schemas

// MST Types
export type MSTSkill = 'listening' | 'reading' | 'speaking' | 'writing';
export type MSTStage = 'S1' | 'S2';
export type MSTRoute = 'up' | 'down' | 'stay';

export type MSTSessionInsert = z.infer<typeof mstSessionInsertSchema>;
export type MSTSession = typeof mstSessions.$inferSelect;
export type MSTSkillState = typeof mstSkillStates.$inferSelect;
export type MSTResponse = typeof mstResponses.$inferSelect;


// User Sessions for authentication

// Password Reset Tokens

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("Student"),
  phoneNumber: text("phone_number"),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  preferences: jsonb("preferences"),
  credits: integer("credits").default(0),
  streakDays: integer("streak_days").default(0),
  totalLessons: integer("total_lessons").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  walletBalance: integer("wallet_balance").default(0),
  totalCredits: integer("total_credits").default(0),
  memberTier: text("member_tier").default("bronze"),
  birthday: date("birthday"),
  nationalId: varchar("national_id", { length: 20 }),
  guardianName: varchar("guardian_name", { length: 255 }),
  guardianPhone: varchar("guardian_phone", { length: 20 }),
  totalXp: integer("total_xp").default(0),
  currentLevel: integer("current_level").default(1),
  notes: text("notes"),
  profileImage: text("profile_image"),
  level: text("level"),
  status: text("status").default("active"),
  gender: varchar("gender", { length: 10 }),
  age: integer("age"),
  isAvailableToSocialize: boolean("is_available_to_socialize").default(false),
  socializerLevel: text("socializer_level"),
  socializerSkills: text("socializer_skills").array(),
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false)
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  language: text("language"),
  level: text("level"),
  thumbnail: text("thumbnail"),
  instructorId: integer("instructor_id").references(() => users.id),
  price: integer("price"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  duration: integer("duration"),
  totalLessons: integer("total_lessons"),
  category: text("category"),
  tags: text("tags").array(),
  prerequisites: text("prerequisites").array(),
  learningObjectives: text("learning_objectives").array(),
  difficulty: text("difficulty"),
  certificateTemplate: text("certificate_template"),
  isFeatured: boolean("is_featured"),
  updatedAt: timestamp("updated_at"),
  courseCode: text("course_code"),
  totalSessions: integer("total_sessions"),
  sessionDuration: integer("session_duration"),
  classType: text("class_type"),
  weekdays: text("weekdays").array(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  autoRecord: boolean("auto_record"),
  recordingAvailable: boolean("recording_available"),
  deliveryMode: text("delivery_mode"),
  targetLanguage: text("target_language"),
  proficiencyLevel: text("proficiency_level"),
  classFormat: text("class_format"),
  maxStudents: integer("max_students"),
  targetLevel: text("target_level"),
  firstSessionDate: date("first_session_date"),
  lastSessionDate: date("last_session_date"),
  timeZone: text("time_zone"),
  calendarType: text("calendar_type"),
  rating: decimal("rating"),
  accessPeriodMonths: integer("access_period_months"),
  callernAvailable24h: boolean("callern_available_24h"),
  callernRoadmapId: integer("callern_roadmap_id")
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  points: integer("points").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Achievements table
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User Stats table
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  totalXp: integer("total_xp").default(0),
  level: integer("level").default(1),
  streakDays: integer("streak_days").default(0),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Daily Goals table
export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  targetDate: date("target_date").notNull(),
  goalType: varchar("goal_type", { length: 50 }).notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Admin Settings table
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  shetabMerchantId: varchar("shetab_merchant_id", { length: 255 }),
  shetabTerminalId: varchar("shetab_terminal_id", { length: 255 }),
  shetabApiKey: varchar("shetab_api_key", { length: 255 }),
  shetabSecretKey: varchar("shetab_secret_key", { length: 255 }),
  shetabEnvironment: varchar("shetab_environment", { length: 50 }),
  shetabEnabled: boolean("shetab_enabled").default(false),
  kavenegarApiKey: varchar("kavenegar_api_key", { length: 255 }),
  kavenegarEnabled: boolean("kavenegar_enabled").default(false),
  kavenegarSender: varchar("kavenegar_sender", { length: 50 }),
  isabelVoipEnabled: boolean("isabel_voip_enabled").default(false),
  isabelVoipCredentials: text("isabel_voip_credentials"),
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(false),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").default(false),
  emailSmtpHost: varchar("email_smtp_host", { length: 255 }),
  emailSmtpPort: integer("email_smtp_port"),
  emailUsername: varchar("email_username", { length: 255 }),
  emailPassword: text("email_password"),
  emailFromAddress: varchar("email_from_address", { length: 255 }),
  emailEnabled: boolean("email_enabled").default(false),
  databaseBackupEnabled: boolean("database_backup_enabled").default(false),
  databaseBackupFrequency: varchar("database_backup_frequency", { length: 50 }),
  databaseRetentionDays: integer("database_retention_days"),
  jwtSecretKey: text("jwt_secret_key"),
  sessionTimeout: integer("session_timeout"),
  maxLoginAttempts: integer("max_login_attempts"),
  passwordMinLength: integer("password_min_length"),
  requireTwoFactor: boolean("require_two_factor").default(false),
  systemMaintenanceMode: boolean("system_maintenance_mode").default(false),
  systemDebugMode: boolean("system_debug_mode").default(false),
  systemLogLevel: varchar("system_log_level", { length: 50 }),
  systemMaxUploadSize: integer("system_max_upload_size"),
  notificationEmailEnabled: boolean("notification_email_enabled").default(false),
  notificationSmsEnabled: boolean("notification_sms_enabled").default(false),
  notificationPushEnabled: boolean("notification_push_enabled").default(false),
  apiRateLimit: integer("api_rate_limit"),
  apiRateLimitWindow: integer("api_rate_limit_window"),
  fileStorageProvider: varchar("file_storage_provider", { length: 50 }),
  fileStorageConfig: jsonb("file_storage_config"),
  voipServerAddress: varchar("voip_server_address", { length: 255 }),
  voipPort: integer("voip_port"),
  voipUsername: varchar("voip_username", { length: 255 }),
  voipPassword: text("voip_password"),
  voipEnabled: boolean("voip_enabled").default(false),
  callRecordingEnabled: boolean("call_recording_enabled").default(false),
  recordingStoragePath: varchar("recording_storage_path", { length: 500 }),
  placementSmsEnabled: boolean("placement_sms_enabled").default(false),
  placementSmsReminderCooldownHours: integer("placement_sms_reminder_cooldown_hours").default(24),
  placementSmsMaxReminders: integer("placement_sms_max_reminders").default(3),
  placementSmsDaysAfterTest: integer("placement_sms_days_after_test").default(7),
  placementSmsQuietHoursStart: varchar("placement_sms_quiet_hours_start", { length: 5 }),
  placementSmsQuietHoursEnd: varchar("placement_sms_quiet_hours_end", { length: 5 }),
  placementSmsTemplate: text("placement_sms_template"),
  otpSmsTemplate: text("otp_sms_template"),
  passwordResetSmsTemplate: text("password_reset_sms_template"),
  studentCreationSmsTemplate: text("student_creation_sms_template"),
  enrollmentSmsTemplate: text("enrollment_sms_template"),
  sessionReminderSmsTemplate: text("session_reminder_sms_template"),
  paymentReceivedSmsTemplate: text("payment_received_sms_template"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Progress Tracking table
export const aiProgressTracking = pgTable("ai_progress_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  skill: varchar("skill", { length: 50 }).notNull(),
  currentLevel: varchar("current_level", { length: 10 }),
  progressScore: decimal("progress_score", { precision: 5, scale: 2 }),
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Activity Sessions table
export const aiActivitySessions = pgTable("ai_activity_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionType: varchar("session_type", { length: 50 }).notNull(),
  duration: integer("duration"), // in minutes
  score: integer("score"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Vocabulary Tracking table
export const aiVocabularyTracking = pgTable("ai_vocabulary_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  word: varchar("word", { length: 255 }).notNull(),
  definition: text("definition"),
  proficiencyLevel: integer("proficiency_level").default(1),
  timesEncountered: integer("times_encountered").default(1),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Grammar Tracking table
export const aiGrammarTracking = pgTable("ai_grammar_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  grammarRule: varchar("grammar_rule", { length: 255 }).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  practiceCount: integer("practice_count").default(0),
  lastPracticed: timestamp("last_practiced"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Pronunciation Analysis table
export const aiPronunciationAnalysis = pgTable("ai_pronunciation_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  word: varchar("word", { length: 255 }).notNull(),
  audioUrl: varchar("audio_url", { length: 500 }),
  score: decimal("score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Wallet Transactions table
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // deposit, withdrawal, payment, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending"),
  merchantTransactionId: varchar("merchant_transaction_id", { length: 255 }),
  shetabTransactionId: varchar("shetab_transaction_id", { length: 255 }),
  shetabReferenceNumber: varchar("shetab_reference_number", { length: 255 }),
  cardNumber: varchar("card_number", { length: 20 }),
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

// Course Payments table
export const coursePayments = pgTable("course_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Training Data table
export const aiTrainingData = pgTable("ai_training_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  dataType: varchar("data_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  isValidated: boolean("is_validated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Knowledge Base table
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  language: varchar("language", { length: 10 }).default("en"),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Chat Conversations table - ALIGNED WITH ACTUAL DB
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  participants: text("participants").array().notNull(),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count"),
  type: text("type").notNull(),
  title: text("title"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
});

// Chat Messages table - ALIGNED WITH ACTUAL DB
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  senderName: text("sender_name"),
  message: text("message").notNull(),
  messageType: text("message_type"),
  attachments: text("attachments").array(),
  isRead: boolean("is_read"),
  sentAt: timestamp("sent_at"),
  isEdited: boolean("is_edited"),
  editedAt: timestamp("edited_at"),
  replyTo: integer("reply_to"),
  reactions: jsonb("reactions"),
  readBy: jsonb("read_by")
});

// AI Study Partners table
export const aiStudyPartners = pgTable("ai_study_partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  personality: varchar("personality", { length: 100 }),
  specialization: varchar("specialization", { length: 100 }),
  targetLanguage: varchar("target_language", { length: 50 }),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for chat - ALIGNED WITH ACTUAL DB
export const insertChatConversationSchema = z.object({
  participants: z.array(z.string()),
  lastMessage: z.string().optional(),
  lastMessageAt: z.date().optional(),
  unreadCount: z.number().optional(),
  type: z.string(),
  title: z.string().optional(),
  isActive: z.boolean().optional()
});

export const insertChatMessageSchema = z.object({
  conversationId: z.number(),
  senderId: z.number(),
  senderName: z.string().optional(),
  message: z.string(),
  messageType: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  isRead: z.boolean().optional(),
  sentAt: z.date().optional(),
  isEdited: z.boolean().optional(),
  editedAt: z.date().optional(),
  replyTo: z.number().optional(),
  reactions: z.any().optional(),
  readBy: z.any().optional()
});

export const insertAiStudyPartnerSchema = z.object({
  userId: z.number(),
  name: z.string().max(255),
  personality: z.string().max(100).optional(),
  specialization: z.string().max(100).optional(),
  targetLanguage: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  settings: z.any().optional()
});

// Insert schemas for AI training tables
export const insertAiTrainingJobSchema = z.object({
  jobName: z.string().max(255),
  modelId: z.number().optional(),
  datasetId: z.number().optional(),
  jobType: z.string().max(100),
  priority: z.string().max(20).default("medium"),
  totalEpochs: z.number(),
  batchSize: z.number().default(32),
  learningRate: z.number().optional(),
  hyperparameters: z.any().optional(),
  estimatedDuration: z.number().optional(),
  maxRetries: z.number().default(3),
  parentJobId: z.number().optional(),
  childJobs: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  createdBy: z.number().optional()
});

export const insertAiTrainingDatasetSchema = z.object({
  name: z.string().max(255),
  description: z.string().optional(),
  datasetType: z.string().max(100),
  language: z.string().max(20),
  skillLevel: z.string().max(20).optional(),
  category: z.string().max(100).optional(),
  version: z.string().max(50).default("1.0.0"),
  splitRatio: z.string().max(50).default("80:10:10"),
  dataPath: z.string().max(500).optional(),
  configPath: z.string().max(500).optional(),
  metadataPath: z.string().max(500).optional(),
  preprocessingRules: z.any().optional(),
  augmentationRules: z.any().optional(),
  qualityMetrics: z.any().optional(),
  dataFormat: z.string().max(50).default("json"),
  encoding: z.string().max(50).default("utf-8"),
  compressionType: z.string().max(50).optional(),
  sizeBytes: z.number().optional(),
  checksum: z.string().max(255).optional(),
  source: z.string().max(255).optional(),
  licenseType: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
  accessLevel: z.string().max(50).default("private"),
  allowedUsers: z.array(z.string()).default([]),
  processingStatus: z.string().max(50).default("pending"),
  processingLog: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.any().optional(),
  createdBy: z.number().optional()
});

export const insertAiModelSchema = z.object({
  name: z.string().max(255),
  description: z.string().optional(),
  modelType: z.string().max(100),
  version: z.string().max(50),
  language: z.string().max(20),
  skillLevel: z.string().max(20).optional(),
  category: z.string().max(100).optional(),
  architecture: z.string().max(100).optional(),
  parameters: z.number().optional(),
  datasetId: z.string().max(255).optional(),
  trainingDataSize: z.number().optional(),
  validationDataSize: z.number().optional(),
  testDataSize: z.number().optional(),
  hyperparameters: z.any().optional(),
  metrics: z.any().optional(),
  status: z.string().max(50).default("training"),
  deploymentUrl: z.string().max(500).optional(),
  apiEndpoint: z.string().max(500).optional(),
  modelPath: z.string().max(500).optional(),
  configPath: z.string().max(500).optional(),
  checkpointPath: z.string().max(500).optional(),
  notes: z.string().optional(),
  trainedBy: z.number().optional(),
  isProduction: z.boolean().default(false)
});

export const insertAiDatasetItemSchema = z.object({
  datasetName: z.string().max(255),
  itemType: z.string().max(100),
  category: z.string().max(100),
  language: z.string().max(20),
  skillLevel: z.string().max(20),
  content: z.any(),
  expectedOutput: z.any().optional(),
  metadata: z.any().optional(),
  source: z.string().max(255).optional(),
  quality: z.string().max(20).default("unverified"),
  verifiedBy: z.number().optional(),
  difficulty: z.string().max(20).default("medium"),
  tags: z.array(z.string()).default([]),
  usage: z.string().max(100).default("training"),
  promptTemplate: z.string().optional(),
  responseTemplate: z.string().optional(),
  trainingNotes: z.string().optional(),
  performance: z.any().optional()
});

export const insertAiCallInsightsSchema = z.object({
  callId: z.string().max(255),
  userId: z.number().optional(),
  leadId: z.number().optional(),
  callStartTime: z.date(),
  callEndTime: z.date().optional(),
  callDuration: z.number().optional(),
  callType: z.string().max(100),
  callStatus: z.string().max(50),
  aiEngagementScore: z.number().optional(),
  sentimentScore: z.number().optional(),
  conversationQuality: z.string().max(50).optional(),
  keyTopics: z.array(z.string()).default([]),
  aiSuggestions: z.any().optional(),
  transcriptSummary: z.string().optional(),
  nextActionRecommended: z.string().optional(),
  leadTemperature: z.string().max(20).optional(),
  conversionProbability: z.number().optional(),
  painPointsIdentified: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  productInterest: z.array(z.string()).default([]),
  budgetIndicators: z.any().optional(),
  timelineIndicators: z.string().max(100).optional(),
  decisionMakerLevel: z.string().max(50).optional(),
  competitorsMentioned: z.array(z.string()).default([]),
  callOutcome: z.string().max(100).optional()
});

export const insertLeadSchema = z.object({
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(255).optional(),
  jobTitle: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  leadSource: z.string().max(100),
  leadStatus: z.string().max(50).default("new"),
  leadScore: z.number().default(0),
  assignedTo: z.number().optional(),
  estimatedValue: z.number().optional(),
  conversionProbability: z.number().default(0),
  languageInterests: z.array(z.string()).default([]),
  learningGoals: z.string().optional(),
  currentLanguageLevel: z.string().max(20).optional(),
  preferredContactMethod: z.string().max(50).default("email"),
  timezone: z.string().max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.any().optional(),
  lastEngagementType: z.string().max(100).optional(),
  totalInteractions: z.number().default(0)
});

export const insertCommunicationLogSchema = z.object({
  leadId: z.number(),
  userId: z.number().optional(),
  communicationType: z.string().max(100),
  direction: z.string().max(20),
  subject: z.string().max(255).optional(),
  content: z.string().optional(),
  duration: z.number().optional(),
  outcome: z.string().max(100).optional(),
  sentiment: z.string().max(20).optional(),
  followUpRequired: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
  campaignId: z.string().max(100).optional(),
  responseTime: z.number().optional(),
  engagementScore: z.number().optional(),
  conversionEvent: z.string().max(100).optional(),
  metadata: z.any().optional()
});

// Attendance Records table
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id"),
  attendanceType: varchar("attendance_type", { length: 20 }).default("present"), // present, absent, late
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Assignments table
export const teacherAssignments = pgTable("teacher_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Evaluations table
export const teacherEvaluations = pgTable("teacher_evaluations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  evaluatorId: integer("evaluator_id").references(() => users.id).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  feedback: text("feedback"),
  evaluationDate: date("evaluation_date"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Class Observations table
export const classObservations = pgTable("class_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  observerId: integer("observer_id").references(() => users.id).notNull(),
  observationDate: date("observation_date").notNull(),
  strengths: text("strengths"),
  improvements: text("improvements"),
  overallRating: decimal("overall_rating", { precision: 3, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 50 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Email Logs table
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  emailType: varchar("email_type", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  templateId: varchar("template_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Reports table
export const studentReports = pgTable("student_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  reportData: jsonb("report_data").notNull(),
  generatedBy: integer("generated_by").references(() => users.id),
  reportPeriod: varchar("report_period", { length: 50 }),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Payment Transactions table  
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  transactionType: varchar("transaction_type", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  referenceId: varchar("reference_id", { length: 255 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Book Categories table
export const book_categories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 255 }),
  isbn: varchar("isbn", { length: 20 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  stockQuantity: integer("stock_quantity").default(0),
  category: varchar("category", { length: 255 }),
  publicationYear: integer("publication_year"),
  
  // New enhanced fields
  bookType: varchar("book_type", { length: 20 }).default("pdf"), // 'pdf' or 'hardcopy'
  aiDescription: text("ai_description"), // AI-generated Farsi description (100-200 words)
  categoryId: integer("category_id").references(() => book_categories.id),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  language: varchar("language", { length: 50 }).default("en"),
  level: varchar("level", { length: 20 }),
  pageCount: integer("page_count"),
  
  // PDF book specific fields
  pdfFileUrl: varchar("pdf_file_url", { length: 500 }),
  downloadCount: integer("download_count").default(0),
  successfulDownloads: integer("successful_downloads").default(0),
  failedDownloads: integer("failed_downloads").default(0),
  
  // Hardcopy book specific fields
  shipmentStatus: varchar("shipment_status", { length: 50 }), // 'pending', 'processing', 'shipped', 'delivered'
  postOfficeTrackingNo: varchar("post_office_tracking_no", { length: 255 }),
  
  isDigital: boolean("is_digital").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for books
export const insertBookSchema = z.object({
  title: z.string().max(500),
  author: z.string().max(255).optional(),
  isbn: z.string().max(20).optional(),
  description: z.string().optional(),
  price: z.string(), // decimal as string, required
  coverImage: z.string().max(500).optional(),
  stockQuantity: z.number().default(0),
  category: z.string().max(255).optional(),
  publicationYear: z.number().optional(),
  
  // New enhanced fields
  bookType: z.enum(['pdf', 'hardcopy']).default('pdf'),
  aiDescription: z.string().optional(),
  categoryId: z.number().optional(),
  currency: z.string().max(3).default("IRR"),
  language: z.string().max(50).default("en"),
  level: z.string().max(20).optional(),
  pageCount: z.number().optional(),
  
  // PDF book specific fields
  pdfFileUrl: z.string().max(500).optional(),
  downloadCount: z.number().default(0),
  successfulDownloads: z.number().default(0),
  failedDownloads: z.number().default(0),
  
  // Hardcopy book specific fields
  shipmentStatus: z.string().max(50).optional(),
  postOfficeTrackingNo: z.string().max(255).optional(),
  
  isDigital: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

// Book Assets table
export const book_assets = pgTable("book_assets", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // audio, video, pdf, epub
  assetUrl: varchar("asset_url", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  fileSize: integer("file_size"),
  duration: integer("duration"), // for audio/video
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Dictionary Lookups table
export const dictionary_lookups = pgTable("dictionary_lookups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  word: varchar("word", { length: 255 }).notNull(),
  definition: text("definition"),
  sourceLanguage: varchar("source_language", { length: 10 }).default("en"),
  targetLanguage: varchar("target_language", { length: 10 }).default("fa"),
  context: text("context"),
  bookId: integer("book_id").references(() => books.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schema for dictionary lookups  
export const insertDictionaryLookupSchema = z.object({
  userId: z.number().optional(),
  word: z.string().max(255),
  definition: z.string().optional(),
  sourceLanguage: z.string().max(10).default("en"),
  targetLanguage: z.string().max(10).default("fa"),
  context: z.string().optional(),
  bookId: z.number().optional()
});

// Book Orders table
export const book_orders = pgTable("book_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  orderStatus: varchar("order_status", { length: 50 }).default("pending"), // pending, confirmed, completed, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, refunded
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  
  // PDF book specific - download tracking
  downloadCount: integer("download_count").default(0),
  lastDownloadAt: timestamp("last_download_at"),
  downloadLimit: integer("download_limit").default(5), // max downloads allowed
  
  // Hardcopy book specific - shipping tracking
  shippingStatus: varchar("shipping_status", { length: 50 }), // pending, processing, shipped, delivered
  trackingNumber: varchar("tracking_number", { length: 255 }), // FDC or post office tracking
  shippingAddress: text("shipping_address"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for book orders
export const insertBookOrderSchema = z.object({
  userId: z.number(),
  bookId: z.number(),
  orderStatus: z.string().max(50).optional(),
  paymentStatus: z.string().max(50).optional(),
  totalAmount: z.string(), // decimal as string
  currency: z.string().max(3).default("IRR"),
  downloadCount: z.number().default(0),
  lastDownloadAt: z.date().optional(),
  downloadLimit: z.number().default(5),
  shippingStatus: z.string().max(50).optional(),
  trackingNumber: z.string().max(255).optional(),
  shippingAddress: z.string().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional()
});

// Insert schema for book assets
export const insertBookAssetSchema = z.object({
  bookId: z.number(),
  assetType: z.string().max(50),
  assetUrl: z.string().max(500),
  title: z.string().max(255).optional(),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
  isActive: z.boolean().default(true)
});

// Insert schema for carts
export const insertCartSchema = z.object({
  userId: z.number().optional(),
  sessionId: z.string().max(255).optional(),
  status: z.string().max(20).default("active")
});

// Insert schema for cart items
export const insertCartItemSchema = z.object({
  cartId: z.number(),
  bookId: z.number(),
  quantity: z.number().default(1),
  price: z.string().optional() // decimal as string
});

// Insert schema for orders
export const insertOrderSchema = z.object({
  orderNumber: z.string().max(100),
  userId: z.number(),
  orderType: z.string().max(30).default("purchase"),
  orderStatus: z.string().max(30).default("pending"),
  paymentStatus: z.string().max(30).default("pending"),
  paymentMethod: z.string().max(50).optional(),
  paymentGateway: z.string().max(50).optional(),
  transactionId: z.string().max(100).optional(),
  subtotal: z.string(), // decimal as string
  discountTotal: z.string().default("0"),
  taxTotal: z.string().default("0"),
  shippingTotal: z.string().default("0"),
  grandTotal: z.string(), // decimal as string
  currency: z.string().max(10).default("IRR"),
  billingAddressId: z.number().optional(),
  shippingAddressId: z.number().optional(),
  orderNotes: z.string().optional(),
  customerNotes: z.string().optional()
});

// AI Training Jobs table for tracking model training job execution
export const aiTrainingJobs = pgTable("ai_training_jobs", {
  id: serial("id").primaryKey(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  modelId: integer("model_id").references(() => aiModels.id),
  datasetId: integer("dataset_id").references(() => aiTrainingDatasets.id),
  jobType: varchar("job_type", { length: 100 }).notNull(), // training, fine_tuning, evaluation, inference
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 50 }).default("queued"), // queued, running, completed, failed, cancelled, paused
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0.00"), // 0.00 to 100.00
  currentEpoch: integer("current_epoch").default(0),
  totalEpochs: integer("total_epochs").notNull(),
  batchSize: integer("batch_size").default(32),
  learningRate: decimal("learning_rate", { precision: 10, scale: 8 }),
  hyperparameters: jsonb("hyperparameters"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // in seconds
  actualDuration: integer("actual_duration"), // in seconds
  cpuUsage: decimal("cpu_usage", { precision: 5, scale: 2 }), // percentage
  memoryUsage: integer("memory_usage"), // in MB
  gpuUsage: decimal("gpu_usage", { precision: 5, scale: 2 }), // percentage
  diskUsage: integer("disk_usage"), // in MB
  networkUsage: integer("network_usage"), // in MB
  trainingLoss: decimal("training_loss", { precision: 10, scale: 6 }),
  validationLoss: decimal("validation_loss", { precision: 10, scale: 6 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  metrics: jsonb("metrics"),
  logs: text("logs"),
  errorMessage: text("error_message"),
  outputPath: varchar("output_path", { length: 500 }),
  checkpointPath: varchar("checkpoint_path", { length: 500 }),
  configPath: varchar("config_path", { length: 500 }),
  environmentConfig: jsonb("environment_config"),
  nodeId: varchar("node_id", { length: 100 }), // which compute node is running the job
  resourceAllocation: jsonb("resource_allocation"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  parentJobId: integer("parent_job_id"), // for job dependencies
  childJobs: text("child_jobs").array().default([]),
  dependencies: text("dependencies").array().default([]),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Training Datasets table for managing training dataset configurations
export const aiTrainingDatasets = pgTable("ai_training_datasets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  datasetType: varchar("dataset_type", { length: 100 }).notNull(), // text, conversation, audio, video, mixed
  language: varchar("language", { length: 20 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }), // A1, A2, B1, B2, C1, C2, all
  category: varchar("category", { length: 100 }), // grammar, vocabulary, pronunciation, conversation
  version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
  totalSamples: integer("total_samples").default(0),
  trainingSamples: integer("training_samples").default(0),
  validationSamples: integer("validation_samples").default(0),
  testSamples: integer("test_samples").default(0),
  splitRatio: varchar("split_ratio", { length: 50 }).default("80:10:10"), // train:validation:test
  dataPath: varchar("data_path", { length: 500 }),
  configPath: varchar("config_path", { length: 500 }),
  metadataPath: varchar("metadata_path", { length: 500 }),
  preprocessingRules: jsonb("preprocessing_rules"),
  augmentationRules: jsonb("augmentation_rules"),
  qualityMetrics: jsonb("quality_metrics"),
  dataFormat: varchar("data_format", { length: 50 }).default("json"), // json, csv, text, audio, video
  encoding: varchar("encoding", { length: 50 }).default("utf-8"),
  compressionType: varchar("compression_type", { length: 50 }), // gzip, zip, none
  sizeBytes: integer("size_bytes"),
  checksum: varchar("checksum", { length: 255 }),
  source: varchar("source", { length: 255 }), // where the data came from
  licenseType: varchar("license_type", { length: 100 }),
  isPublic: boolean("is_public").default(false),
  accessLevel: varchar("access_level", { length: 50 }).default("private"), // public, private, restricted
  allowedUsers: text("allowed_users").array().default([]),
  lastProcessed: timestamp("last_processed"),
  processingStatus: varchar("processing_status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  processingLog: text("processing_log"),
  tags: text("tags").array().default([]),
  customFields: jsonb("custom_fields"),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Models table for tracking trained AI models and their performance
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  modelType: varchar("model_type", { length: 100 }).notNull(), // language_model, classifier, conversation, tts, stt
  version: varchar("version", { length: 50 }).notNull(),
  language: varchar("language", { length: 20 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }), // A1, A2, B1, B2, C1, C2, all
  category: varchar("category", { length: 100 }), // grammar, vocabulary, pronunciation, conversation
  architecture: varchar("architecture", { length: 100 }), // transformer, lstm, cnn, etc
  parameters: integer("parameters"), // number of model parameters
  datasetId: varchar("dataset_id", { length: 255 }),
  trainingDataSize: integer("training_data_size"), // number of training samples
  validationDataSize: integer("validation_data_size"),
  testDataSize: integer("test_data_size"),
  trainingStarted: timestamp("training_started"),
  trainingCompleted: timestamp("training_completed"),
  trainingDuration: integer("training_duration"), // in seconds
  trainingLoss: decimal("training_loss", { precision: 10, scale: 6 }),
  validationLoss: decimal("validation_loss", { precision: 10, scale: 6 }),
  testAccuracy: decimal("test_accuracy", { precision: 5, scale: 4 }),
  modelPath: varchar("model_path", { length: 500 }),
  configPath: varchar("config_path", { length: 500 }),
  checkpointPath: varchar("checkpoint_path", { length: 500 }),
  hyperparameters: jsonb("hyperparameters"),
  metrics: jsonb("metrics"),
  status: varchar("status", { length: 50 }).default("training"), // training, completed, failed, deployed, deprecated
  deploymentUrl: varchar("deployment_url", { length: 500 }),
  apiEndpoint: varchar("api_endpoint", { length: 500 }),
  inferenceLatency: decimal("inference_latency", { precision: 8, scale: 3 }), // milliseconds
  throughput: integer("throughput"), // requests per second
  memoryUsage: integer("memory_usage"), // in bytes
  diskUsage: integer("disk_usage"), // in bytes
  trainingCost: decimal("training_cost", { precision: 10, scale: 2 }),
  inferenceCost: decimal("inference_cost", { precision: 10, scale: 6 }), // per request
  notes: text("notes"),
  trainedBy: integer("trained_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  isProduction: boolean("is_production").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Dataset Items table for training data management
export const aiDatasetItems = pgTable("ai_dataset_items", {
  id: serial("id").primaryKey(),
  datasetName: varchar("dataset_name", { length: 255 }).notNull(),
  itemType: varchar("item_type", { length: 100 }).notNull(), // text, conversation, audio, video, image
  category: varchar("category", { length: 100 }).notNull(), // grammar, vocabulary, pronunciation, conversation
  language: varchar("language", { length: 20 }).notNull(),
  skillLevel: varchar("skill_level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  content: jsonb("content").notNull(),
  expectedOutput: jsonb("expected_output"),
  metadata: jsonb("metadata"),
  source: varchar("source", { length: 255 }), // where the data came from
  quality: varchar("quality", { length: 20 }).default("unverified"), // verified, unverified, flagged
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  tags: text("tags").array().default([]),
  usage: varchar("usage", { length: 100 }).default("training"), // training, validation, testing
  promptTemplate: text("prompt_template"),
  responseTemplate: text("response_template"),
  trainingNotes: text("training_notes"),
  performance: jsonb("performance"), // model performance metrics
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Call Insights table for call analytics and AI performance tracking
export const aiCallInsights = pgTable("ai_call_insights", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 255 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  leadId: integer("lead_id"),
  callStartTime: timestamp("call_start_time").notNull(),
  callEndTime: timestamp("call_end_time"),
  callDuration: integer("call_duration"), // seconds
  callType: varchar("call_type", { length: 100 }).notNull(), // inbound, outbound, callback
  callStatus: varchar("call_status", { length: 50 }).notNull(), // completed, abandoned, failed
  aiEngagementScore: integer("ai_engagement_score"), // 0-100
  sentimentScore: integer("sentiment_score"), // -100 to +100
  conversationQuality: varchar("conversation_quality", { length: 50 }), // excellent, good, fair, poor
  keyTopics: text("key_topics").array(),
  aiSuggestions: jsonb("ai_suggestions"),
  transcriptSummary: text("transcript_summary"),
  nextActionRecommended: text("next_action_recommended"),
  followUpScheduled: timestamp("follow_up_scheduled"),
  leadTemperature: varchar("lead_temperature", { length: 20 }), // hot, warm, cold
  conversionProbability: integer("conversion_probability"), // 0-100 percentage
  painPointsIdentified: text("pain_points_identified").array(),
  objections: text("objections").array(),
  productInterest: text("product_interest").array(),
  budgetIndicators: jsonb("budget_indicators"),
  timelineIndicators: varchar("timeline_indicators", { length: 100 }),
  decisionMakerLevel: varchar("decision_maker_level", { length: 50 }),
  competitorsMentioned: text("competitors_mentioned").array(),
  callOutcome: varchar("call_outcome", { length: 100 }), // qualified, not_qualified, follow_up, demo_scheduled
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Leads table for prospect and customer lead management
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  interestedLanguage: varchar("interested_language", { length: 100 }),
  level: varchar("level", { length: 50 }),
  budget: integer("budget"),
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  conversionDate: timestamp("conversion_date"),
  studentId: integer("student_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  interestedLevel: varchar("interested_level", { length: 50 }),
  preferredFormat: varchar("preferred_format", { length: 50 }),
  assignedAgentId: integer("assigned_agent_id").references(() => users.id),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  courseTarget: varchar("course_target", { length: 100 }),
  courseModule: varchar("course_module", { length: 100 }),
  workflowStatus: varchar("workflow_status", { length: 50 }),
  followUpStart: timestamp("follow_up_start"),
  followUpEnd: timestamp("follow_up_end"),
  smsReminderEnabled: boolean("sms_reminder_enabled").default(false),
  smsReminderSentAt: timestamp("sms_reminder_sent_at"),
  nationalId: varchar("national_id", { length: 20 })
});

// Communication Logs table for tracking all lead interactions
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  communicationType: varchar("communication_type", { length: 100 }).notNull(), // call, email, sms, meeting, demo
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  duration: integer("duration"), // seconds for calls, minutes for meetings
  outcome: varchar("outcome", { length: 100 }), // connected, voicemail, email_opened, meeting_scheduled
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  attachments: text("attachments").array(),
  campaignId: varchar("campaign_id", { length: 100 }),
  responseTime: integer("response_time"), // seconds between initial contact and response
  engagementScore: integer("engagement_score"), // 0-100
  conversionEvent: varchar("conversion_event", { length: 100 }), // trial_signup, demo_request, purchase
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Iranian Calendar Settings table for Solar Hijri calendar configuration
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

// Guest Progress Tracking table for anonymous users
export const guestProgressTracking = pgTable("guest_progress_tracking", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  guestIdentifier: varchar("guest_identifier", { length: 100 }).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id"), // TODO: Add lessons table reference later  
  quizId: integer("quiz_id"), // TODO: Add quizzes table reference later
  progressPercentage: integer("progress_percentage").default(0),
  timeSpent: integer("time_spent").default(0), // seconds
  lastAccessed: timestamp("last_accessed").defaultNow().notNull(),
  deviceType: varchar("device_type", { length: 50 }),
  browserType: varchar("browser_type", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  conversionStatus: varchar("conversion_status", { length: 50 }).default("guest"), // guest, registered, paid
  languageTarget: varchar("language_target", { length: 100 }),
  completedActivities: integer("completed_activities").default(0),
  isActive: boolean("is_active").default(true),
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
  title: z.string().max(255),
  description: z.string().optional(),
  level: z.string().max(10), // A1, A2, B1, B2, C1, C2
  language: z.string().max(100),
  questType: z.string().max(100), // adventure, conversation, grammar, vocabulary
  difficulty: z.number().min(1).max(10).default(1),
  xpReward: z.number().default(0),
  estimatedDuration: z.number().optional(), // minutes
  prerequisites: z.array(z.string()).optional(),
  content: z.any().optional(), // lesson structure and activities
  objectives: z.array(z.string()).optional(),
  vocabulary: z.any().optional(), // key vocabulary items
  grammarFocus: z.array(z.string()).optional(),
  culturalContext: z.string().optional(),
  imageUrl: z.string().max(500).optional(),
  audioUrl: z.string().max(500).optional(),
  videoUrl: z.string().max(500).optional(),
  interactiveElements: z.any().optional(),
  completionCriteria: z.any().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  viewCount: z.number().default(0),
  completionCount: z.number().default(0),
  averageRating: z.number().min(0).max(5).default(0),
  createdBy: z.number().optional(),
  isActive: z.boolean().default(true)
});

// Insert schema for user addresses
export const insertUserAddressSchema = z.object({
  userId: z.number(),
  addressType: z.string().max(20).default("shipping"),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  company: z.string().max(255).optional(),
  addressLine1: z.string().max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20),
  country: z.string().max(100).default("Iran"),
  phoneNumber: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

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

// Peer Matching Requests table
export const peerMatchingRequests = pgTable("peer_matching_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  nativeLanguage: varchar("native_language", { length: 50 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }).notNull(),
  ageRange: varchar("age_range", { length: 20 }),
  interests: text("interests").array().default([]),
  availabilityDays: text("availability_days").array().default([]),
  availabilityTimes: varchar("availability_times", { length: 100 }),
  preferredMatchType: varchar("preferred_match_type", { length: 50 }).default("conversation"),
  locationPreference: varchar("location_preference", { length: 100 }),
  onlinePreference: boolean("online_preference").default(true),
  status: varchar("status", { length: 20 }).default("active"),
  priority: integer("priority").default(5),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for peer matching requests
export const insertPeerMatchingRequestSchema = z.object({
  requesterId: z.number(),
  targetLanguage: z.string().max(50),
  nativeLanguage: z.string().max(50),
  proficiencyLevel: z.string().max(20),
  ageRange: z.string().max(20).optional(),
  interests: z.array(z.string()).default([]),
  availabilityDays: z.array(z.string()).default([]),
  availabilityTimes: z.string().max(100).optional(),
  preferredMatchType: z.string().max(50).default("conversation"),
  locationPreference: z.string().max(100).optional(),
  onlinePreference: z.boolean().default(true),
  status: z.string().max(20).default("active"),
  priority: z.number().default(5),
  notes: z.string().optional()
});

// Peer Socializer Groups table
export const peerSocializerGroups = pgTable("peer_socializer_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }).notNull(),
  maxParticipants: integer("max_participants").default(10),
  currentParticipants: integer("current_participants").default(0),
  hostId: integer("host_id").references(() => users.id),
  groupType: varchar("group_type", { length: 50 }).default("conversation"),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  tags: text("tags").array().default([]),
  scheduleType: varchar("schedule_type", { length: 20 }).default("flexible"),
  scheduledTime: timestamp("scheduled_time"),
  duration: integer("duration").default(60),
  timeZone: varchar("time_zone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for peer socializer groups
export const insertPeerSocializerGroupSchema = z.object({
  name: z.string().max(255),
  description: z.string().optional(),
  targetLanguage: z.string().max(50),
  proficiencyLevel: z.string().max(20),
  maxParticipants: z.number().default(10),
  currentParticipants: z.number().default(0),
  hostId: z.number().optional(),
  groupType: z.string().max(50).default("conversation"),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  scheduleType: z.string().max(20).default("flexible"),
  scheduledTime: z.date().optional(),
  duration: z.number().default(60),
  timeZone: z.string().max(50).optional()
});

// Peer Socializer Participants table
export const peerSocializerParticipants = pgTable("peer_socializer_participants", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => peerSocializerGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: varchar("role", { length: 20 }).default("participant"),
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at"),
  participationScore: integer("participation_score").default(0),
  contributionLevel: varchar("contribution_level", { length: 20 }).default("normal"),
  notes: text("notes"),
  leftAt: timestamp("left_at"),
  leftReason: varchar("left_reason", { length: 100 })
});

// Insert schema for peer socializer participants
export const insertPeerSocializerParticipantSchema = z.object({
  groupId: z.number(),
  userId: z.number(),
  role: z.string().max(20).default("participant"),
  isActive: z.boolean().default(true),
  lastActiveAt: z.date().optional(),
  participationScore: z.number().default(0),
  contributionLevel: z.string().max(20).default("normal"),
  notes: z.string().optional(),
  leftAt: z.date().optional(),
  leftReason: z.string().max(100).optional()
});

// Insert schema for phone call logs
export const insertPhoneCallLogSchema = z.object({
  callerId: z.string().max(50).optional(),
  recipientId: z.string().max(50).optional(),
  userId: z.number().optional(),
  operatorId: z.number().optional(),
  callType: z.string().max(50),
  callPurpose: z.string().max(100).optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  status: z.string().max(20).default("completed"),
  recordingUrl: z.string().max(500).optional(),
  transferredTo: z.number().optional(),
  callNotes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  customerSatisfaction: z.number().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional()
});

// Insert schema for rooms
export const insertRoomSchema = z.object({
  name: z.string().max(255),
  roomType: z.string().max(50).default("physical"),
  capacity: z.number().optional(),
  location: z.string().max(255).optional(),
  equipment: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  bookingPolicy: z.record(z.any()).optional()
});

// Insert schema for sessions
export const insertSessionSchema = z.object({
  userId: z.number(),
  sessionToken: z.string().max(255),
  refreshToken: z.string().max(255).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().max(45).optional(),
  deviceType: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  lastActivityAt: z.date().optional(),
  expiresAt: z.date()
});

// Insert schema for user profiles
export const insertUserProfileSchema = z.object({
  userId: z.number(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  profilePictureUrl: z.string().max(500).optional(),
  dateOfBirth: z.date().optional(),
  phoneNumber: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).default("UTC"),
  preferredLanguage: z.string().max(10).default("en"),
  nativeLanguage: z.string().max(10).optional(),
  targetLanguages: z.array(z.string()).default([]),
  proficiencyLevels: z.record(z.any()).optional(),
  learningGoals: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  occupation: z.string().max(100).optional(),
  educationLevel: z.string().max(50).optional(),
  bio: z.string().optional(),
  socialLinks: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  notifications: z.record(z.any()).optional(),
  privacy: z.record(z.any()).optional(),
  accessibility: z.record(z.any()).optional(),
  theme: z.string().max(20).default("light"),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  profileCompleteness: z.number().default(0),
  verificationStatus: z.string().max(20).default("unverified"),
  verifiedAt: z.date().optional(),
  metadata: z.record(z.any()).optional()
});

// Special Classes table - admin-flagged featured classes for dashboard showcase
export const specialClasses = pgTable("special_classes", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  featuredBy: integer("featured_by").references(() => users.id).notNull(),
  featuredAt: timestamp("featured_at").defaultNow().notNull(),
  displayOrder: integer("display_order").default(0),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  highlightColor: varchar("highlight_color", { length: 7 }).default("#3B82F6"),
  badgeText: varchar("badge_text", { length: 50 }),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: text("target_audience").array().default([]),
  tags: text("tags").array().default([]),
  priority: integer("priority").default(5),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  enrollments: integer("enrollments").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for special classes
export const insertSpecialClassSchema = z.object({
  classId: z.number(),
  featuredBy: z.number(),
  displayOrder: z.number().default(0),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().max(500).optional(),
  highlightColor: z.string().max(7).default("#3B82F6"),
  badgeText: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  targetAudience: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  priority: z.number().default(5),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  enrollments: z.number().default(0),
  metadata: z.record(z.any()).optional()
});

// Teacher Payment Records table
export const teacherPaymentRecords = pgTable("teacher_payment_records", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  paymentPeriodStart: date("payment_period_start").notNull(),
  paymentPeriodEnd: date("payment_period_end").notNull(),
  totalClasses: integer("total_classes").notNull(),
  totalHours: decimal("total_hours", { precision: 8, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).default("0"),
  deductionAmount: decimal("deduction_amount", { precision: 10, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, processed, paid, failed
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, cash, check, digital_wallet
  paymentDate: timestamp("payment_date"),
  paymentReference: varchar("payment_reference", { length: 255 }),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  payrollBatch: varchar("payroll_batch", { length: 100 }),
  taxDeduction: decimal("tax_deduction", { precision: 10, scale: 2 }).default("0"),
  socialSecurityDeduction: decimal("social_security_deduction", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  paymentDetails: jsonb("payment_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for teacher payment records
export const insertTeacherPaymentRecordSchema = z.object({
  teacherId: z.number(),
  paymentPeriodStart: z.date(),
  paymentPeriodEnd: z.date(),
  totalClasses: z.number(),
  totalHours: z.string(),
  hourlyRate: z.string().optional(),
  baseAmount: z.string(),
  bonusAmount: z.string().default("0"),
  deductionAmount: z.string().default("0"),
  finalAmount: z.string(),
  currency: z.string().max(3).default("IRR"),
  paymentStatus: z.string().max(20).default("pending"),
  paymentMethod: z.string().max(50).optional(),
  paymentDate: z.date().optional(),
  paymentReference: z.string().max(255).optional(),
  approvedBy: z.number().optional(),
  approvedAt: z.date().optional(),
  notes: z.string().optional(),
  payrollBatch: z.string().max(100).optional(),
  taxDeduction: z.string().default("0"),
  socialSecurityDeduction: z.string().default("0"),
  netAmount: z.string().optional(),
  bankAccount: z.string().max(100).optional(),
  paymentDetails: z.record(z.any()).optional()
});

// Enhanced Analytics Tables

// Learning Problems table - AI-detected learning issues
export const learningProblems = pgTable("learning_problems", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // grammar, vocabulary, pronunciation, fluency, etc.
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  affectedSkills: text("affected_skills").array().default([]),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0.00 to 100.00
  evidence: jsonb("evidence").default([]), // JSON array of evidence data
  estimatedImpact: text("estimated_impact"),
  autoGenerated: boolean("auto_generated").default(true),
  status: varchar("status", { length: 20 }).default("active"), // active, resolved, dismissed
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Learning Recommendations table - AI-generated improvement suggestions
export const learningRecommendations = pgTable("learning_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  problemId: integer("problem_id").references(() => learningProblems.id),
  type: varchar("type", { length: 50 }).notNull(), // practice, review, study, exercise
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  actionItems: jsonb("action_items").default([]), // Array of specific actions
  estimatedTime: integer("estimated_time"), // minutes
  difficulty: varchar("difficulty", { length: 20 }), // easy, medium, hard
  targetSkills: text("target_skills").array().default([]),
  resources: jsonb("resources").default([]), // Links, materials, exercises
  successMetrics: jsonb("success_metrics").default([]),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  implementedAt: timestamp("implemented_at"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, implemented, dismissed
  effectiveness: decimal("effectiveness", { precision: 5, scale: 2 }), // 0.00 to 100.00
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Skill Correlations table - relationships between different skills
export const skillCorrelations = pgTable("skill_correlations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  skillA: varchar("skill_a", { length: 100 }).notNull(),
  skillB: varchar("skill_b", { length: 100 }).notNull(),
  correlationType: varchar("correlation_type", { length: 20 }).notNull(), // positive, negative, neutral
  strength: decimal("strength", { precision: 5, scale: 4 }).notNull(), // -1.0000 to 1.0000
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0.00 to 100.00
  sampleSize: integer("sample_size").notNull(),
  timeframe: varchar("timeframe", { length: 50 }), // daily, weekly, monthly, all-time
  context: varchar("context", { length: 100 }), // class, homework, test, conversation
  analysisDate: timestamp("analysis_date").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  isGlobal: boolean("is_global").default(false), // user-specific or global pattern
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Performance Patterns table - learning behavior patterns
export const performancePatterns = pgTable("performance_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  patternType: varchar("pattern_type", { length: 50 }).notNull(), // learning_curve, plateau, regression, breakthrough
  description: text("description").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  duration: integer("duration"), // days
  affectedSkills: text("affected_skills").array().default([]),
  severity: varchar("severity", { length: 20 }), // mild, moderate, severe
  frequency: varchar("frequency", { length: 20 }), // rare, occasional, frequent, constant
  triggers: jsonb("triggers").default([]), // Possible causes/triggers
  outcomes: jsonb("outcomes").default([]), // Results or consequences
  interventions: jsonb("interventions").default([]), // Actions taken
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  predictiveIndicators: jsonb("predictive_indicators").default([]),
  recommendedActions: jsonb("recommended_actions").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Analytics Insights table - high-level insights and trends
export const analyticsInsights = pgTable("analytics_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  insightType: varchar("insight_type", { length: 50 }).notNull(), // trend, prediction, recommendation, alert
  category: varchar("category", { length: 50 }).notNull(), // performance, behavior, progress, risk
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  details: jsonb("details").default({}),
  metrics: jsonb("metrics").default({}), // Key performance indicators
  severity: varchar("severity", { length: 20 }), // info, warning, critical
  actionRequired: boolean("action_required").default(false),
  timeframe: varchar("timeframe", { length: 50 }), // real-time, daily, weekly, monthly
  dataSource: varchar("data_source", { length: 100 }), // ai_analysis, statistical_model, rule_based
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  relevanceScore: decimal("relevance_score", { precision: 5, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  relatedInsights: integer("related_insights").array().default([]),
  tags: text("tags").array().default([]),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for Enhanced Analytics

// Insert schema for learning problems
export const insertLearningProblemSchema = z.object({
  userId: z.number(),
  type: z.string().max(50),
  severity: z.string().max(20),
  title: z.string().max(255),
  description: z.string(),
  affectedSkills: z.array(z.string()).default([]),
  confidence: z.string(),
  evidence: z.array(z.any()).default([]),
  estimatedImpact: z.string().optional(),
  autoGenerated: z.boolean().default(true),
  status: z.string().max(20).default("active"),
  resolvedAt: z.date().optional(),
  resolvedBy: z.number().optional()
});

// Insert schema for learning recommendations
export const insertLearningRecommendationSchema = z.object({
  userId: z.number(),
  problemId: z.number().optional(),
  type: z.string().max(50),
  priority: z.string().max(20).default("medium"),
  title: z.string().max(255),
  description: z.string(),
  actionItems: z.array(z.any()).default([]),
  estimatedTime: z.number().optional(),
  difficulty: z.string().max(20).optional(),
  targetSkills: z.array(z.string()).default([]),
  resources: z.array(z.any()).default([]),
  successMetrics: z.array(z.any()).default([]),
  implementedAt: z.date().optional(),
  status: z.string().max(20).default("pending"),
  effectiveness: z.string().optional(),
  feedback: z.string().optional()
});

// Insert schema for skill correlations
export const insertSkillCorrelationSchema = z.object({
  userId: z.number().optional(),
  skillA: z.string().max(100),
  skillB: z.string().max(100),
  correlationType: z.string().max(20),
  strength: z.string(),
  confidence: z.string(),
  sampleSize: z.number(),
  timeframe: z.string().max(50).optional(),
  context: z.string().max(100).optional(),
  analysisDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  isGlobal: z.boolean().default(false)
});

// Insert schema for performance patterns
export const insertPerformancePatternSchema = z.object({
  userId: z.number().optional(),
  patternType: z.string().max(50),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  duration: z.number().optional(),
  affectedSkills: z.array(z.string()).default([]),
  severity: z.string().max(20).optional(),
  frequency: z.string().max(20).optional(),
  triggers: z.array(z.any()).default([]),
  outcomes: z.array(z.any()).default([]),
  interventions: z.array(z.any()).default([]),
  confidence: z.string(),
  isActive: z.boolean().default(true),
  predictiveIndicators: z.array(z.any()).default([]),
  recommendedActions: z.array(z.any()).default([])
});

// Insert schema for analytics insights
export const insertAnalyticsInsightSchema = z.object({
  userId: z.number().optional(),
  insightType: z.string().max(50),
  category: z.string().max(50),
  title: z.string().max(255),
  summary: z.string(),
  details: z.record(z.any()).default({}),
  metrics: z.record(z.any()).default({}),
  severity: z.string().max(20).optional(),
  actionRequired: z.boolean().default(false),
  timeframe: z.string().max(50).optional(),
  dataSource: z.string().max(100).optional(),
  confidence: z.string(),
  relevanceScore: z.string().optional(),
  expiresAt: z.date().optional(),
  isRead: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  relatedInsights: z.array(z.number()).default([]),
  tags: z.array(z.string()).default([])
});

// Insert schema for 3D lesson content
export const insertThreeDLessonContentSchema = z.object({
  lessonId: z.number(),
  contentType: z.string().max(50), // dialogue, narration, interaction, assessment, guide_text
  sequenceOrder: z.number(),
  sceneTimestamp: z.string().optional(), // decimal as string
  characterSpeaker: z.string().max(100).optional(),
  contentText: z.string(),
  translationKey: z.string().max(255).optional(),
  voiceSettings: z.record(z.any()).optional(),
  audioUrl: z.string().max(500).optional(),
  subtitleStyling: z.record(z.any()).optional(),
  interactionData: z.record(z.any()).optional(),
  assessmentData: z.record(z.any()).optional(),
  animationCues: z.record(z.any()).optional(),
  cameraInstructions: z.record(z.any()).optional(),
  environmentChanges: z.record(z.any()).optional(),
  triggers: z.record(z.any()).optional(),
  conditions: z.record(z.any()).optional(),
  variableUpdates: z.record(z.any()).optional(),
  progressMilestone: z.boolean().default(false),
  skipAllowed: z.boolean().default(true),
  repeatAllowed: z.boolean().default(true),
  difficultyLevel: z.string().max(20).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
});

// SMS Log Metadata Schema - for structured SMS logging and tracking
export const smsLogMetadataSchema = z.object({
  messageId: z.string().optional(), // SMS provider message ID
  provider: z.string().max(50).default("kavenegar"), // SMS service provider
  providerData: z.record(z.any()).optional(), // Provider-specific response data
  cost: z.string().optional(), // Cost in local currency (decimal as string)
  credits: z.number().optional(), // SMS credits used
  deliveryStatus: z.enum(["sent", "delivered", "failed", "pending", "unknown"]).default("sent"),
  deliveryTimestamp: z.date().optional(), // When SMS was delivered
  errorCode: z.string().optional(), // Error code from provider
  errorMessage: z.string().optional(), // Error description
  retryCount: z.number().default(0), // Number of retry attempts
  batchId: z.string().optional(), // For bulk SMS operations
  campaignId: z.string().optional(), // Marketing campaign identifier
  templateId: z.string().optional(), // SMS template used
  variables: z.record(z.string()).optional(), // Template variables substituted
  recipientDetails: z.object({
    originalNumber: z.string(),
    normalizedNumber: z.string().optional(),
    countryCode: z.string().optional(),
    region: z.string().optional()
  }).optional(),
  messageDetails: z.object({
    length: z.number().optional(), // Message length in characters
    parts: z.number().optional(), // Number of SMS parts
    encoding: z.string().optional(), // utf8, gsm7, ucs2
    type: z.enum(["transactional", "promotional", "reminder", "notification"]).optional()
  }).optional(),
  schedulingInfo: z.object({
    scheduledAt: z.date().optional(),
    sentAt: z.date().optional(),
    timezone: z.string().optional()
  }).optional(),
  tracking: z.object({
    clickUrls: z.array(z.string()).optional(),
    unsubscribeUrl: z.string().optional(),
    trackingPixel: z.string().optional()
  }).optional(),
  compliance: z.object({
    consentGiven: z.boolean().optional(),
    consentTimestamp: z.date().optional(),
    optOutAvailable: z.boolean().default(true),
    dataRetentionDays: z.number().optional()
  }).optional()
});

// Shopping Carts table
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("active"), // active, checked_out, abandoned
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Cart Items table
export const cart_items = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  quantity: integer("quantity").default(1),
  price: decimal("price", { precision: 10, scale: 2 }),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Call History table
export const callernCallHistory = pgTable("callern_call_history", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  sessionType: varchar("session_type", { length: 50 }).default("callern"),
  duration: integer("duration"), // in seconds
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  callQuality: varchar("call_quality", { length: 20 }),
  recordingUrl: varchar("recording_url", { length: 500 }),
  status: varchar("status", { length: 20 }).default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Syllabus Topics table
export const callernSyllabusTopics = pgTable("callern_syllabus_topics", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }),
  estimatedDuration: integer("estimated_duration"), // in minutes
  vocabularyItems: text("vocabulary_items").array().default([]),
  grammarFocus: text("grammar_focus").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student CallerN Progress table
export const studentCallernProgress = pgTable("student_callern_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => callernSyllabusTopics.id),
  skillArea: varchar("skill_area", { length: 50 }),
  currentLevel: varchar("current_level", { length: 10 }),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }),
  lastSessionDate: timestamp("last_session_date"),
  totalSessionTime: integer("total_session_time"), // in minutes
  achievementsUnlocked: text("achievements_unlocked").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  roomType: varchar("room_type", { length: 50 }).default("physical"), // physical, virtual
  capacity: integer("capacity"),
  location: varchar("location", { length: 255 }),
  equipment: text("equipment").array().default([]),
  isActive: boolean("is_active").default(true),
  bookingPolicy: jsonb("booking_policy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Packages table
export const callernPackages = pgTable("callern_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sessionCount: integer("session_count").notNull(),
  validityDays: integer("validity_days").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  isActive: boolean("is_active").default(true),
  features: text("features").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student CallerN Packages table
export const studentCallernPackages = pgTable("student_callern_packages", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  packageId: integer("package_id").references(() => callernPackages.id).notNull(),
  sessionsRemaining: integer("sessions_remaining").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher CallerN Availability table
export const teacherCallernAvailability = pgTable("teacher_callern_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher CallerN Authorization table
export const teacherCallernAuthorization = pgTable("teacher_callern_authorization", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull().unique(),
  isAuthorized: boolean("is_authorized").default(false),
  specializations: text("specializations").array().default([]),
  maxSimultaneousCalls: integer("max_simultaneous_calls").default(1),
  authorizationLevel: varchar("authorization_level", { length: 20 }).default("basic"), // basic, advanced, expert
  certifications: text("certifications").array().default([]),
  authorizedBy: integer("authorized_by").references(() => users.id),
  authorizedAt: timestamp("authorized_at"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Presence table
export const callernPresence = pgTable("callern_presence", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("online"), // online, offline, in_call, away
  lastSeen: timestamp("last_seen").defaultNow(),
  deviceType: varchar("device_type", { length: 50 }),
  connectionQuality: varchar("connection_quality", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Speech Segments table
export const callernSpeechSegments = pgTable("callern_speech_segments", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").references(() => callernCallHistory.id).notNull(),
  speakerId: integer("speaker_id").references(() => users.id).notNull(),
  startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(), // in seconds
  endTime: decimal("end_time", { precision: 10, scale: 3 }).notNull(),
  transcript: text("transcript"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  language: varchar("language", { length: 10 }).default("en"),
  emotions: jsonb("emotions"), // detected emotions
  pronunciationScore: decimal("pronunciation_score", { precision: 5, scale: 2 }),
  grammarIssues: jsonb("grammar_issues"),
  vocabulary: text("vocabulary").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CallerN Student Scores table
export const callernScoresStudent = pgTable("callern_scores_student", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  callId: integer("call_id").references(() => callernCallHistory.id).notNull(),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  pronunciationScore: decimal("pronunciation_score", { precision: 5, scale: 2 }),
  fluencyScore: decimal("fluency_score", { precision: 5, scale: 2 }),
  grammarScore: decimal("grammar_score", { precision: 5, scale: 2 }),
  vocabularyScore: decimal("vocabulary_score", { precision: 5, scale: 2 }),
  comprehensionScore: decimal("comprehension_score", { precision: 5, scale: 2 }),
  participationLevel: varchar("participation_level", { length: 20 }),
  improvementAreas: text("improvement_areas").array().default([]),
  strengths: text("strengths").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Teacher Scores table
export const callernScoresTeacher = pgTable("callern_scores_teacher", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  callId: integer("call_id").references(() => callernCallHistory.id).notNull(),
  teachingEffectiveness: decimal("teaching_effectiveness", { precision: 5, scale: 2 }),
  communicationClarity: decimal("communication_clarity", { precision: 5, scale: 2 }),
  encouragementLevel: decimal("encouragement_level", { precision: 5, scale: 2 }),
  adaptabilityScore: decimal("adaptability_score", { precision: 5, scale: 2 }),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  patienceLevel: decimal("patience_level", { precision: 5, scale: 2 }),
  feedbackQuality: decimal("feedback_quality", { precision: 5, scale: 2 }),
  overallPerformance: decimal("overall_performance", { precision: 5, scale: 2 }),
  studentFeedback: text("student_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Scoring Events table
export const callernScoringEvents = pgTable("callern_scoring_events", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").references(() => callernCallHistory.id).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // question_asked, answer_given, correction_made, etc.
  participantId: integer("participant_id").references(() => users.id).notNull(),
  timestamp: decimal("timestamp", { precision: 10, scale: 3 }).notNull(),
  content: text("content"),
  scoreImpact: decimal("score_impact", { precision: 5, scale: 2 }),
  category: varchar("category", { length: 50 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// CallerN Roadmaps table
export const callernRoadmaps = pgTable("callern_roadmaps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  targetLevel: varchar("target_level", { length: 20 }),
  estimatedDuration: integer("estimated_duration"), // in hours
  prerequisites: text("prerequisites").array().default([]),
  learningObjectives: text("learning_objectives").array().default([]),
  isTemplate: boolean("is_template").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Roadmap Steps table
export const callernRoadmapSteps = pgTable("callern_roadmap_steps", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").references(() => callernRoadmaps.id).notNull(),
  stepOrder: integer("step_order").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  stepType: varchar("step_type", { length: 50 }).notNull(), // lesson, exercise, assessment, review
  contentId: varchar("content_id", { length: 255 }),
  duration: integer("duration"), // in minutes
  skillFocus: text("skill_focus").array().default([]),
  isRequired: boolean("is_required").default(true),
  prerequisites: text("prerequisites").array().default([]),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Roadmap Progress table
export const studentRoadmapProgress = pgTable("student_roadmap_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  roadmapId: integer("roadmap_id").references(() => callernRoadmaps.id).notNull(),
  currentStepId: integer("current_step_id").references(() => callernRoadmapSteps.id),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  completedSteps: text("completed_steps").array().default([]),
  skippedSteps: text("skipped_steps").array().default([]),
  startedAt: timestamp("started_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("not_started"), // not_started, in_progress, completed, paused
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course Roadmap Progress table
export const courseRoadmapProgress = pgTable("course_roadmap_progress", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  roadmapId: integer("roadmap_id").references(() => callernRoadmaps.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  isRequired: boolean("is_required").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.0"), // for grading purposes
  status: varchar("status", { length: 20 }).default("active"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Classes table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  roomId: integer("room_id").references(() => rooms.id),
  maxStudents: integer("max_students").default(20),
  currentStudents: integer("current_students").default(0),
  schedule: jsonb("schedule").notNull(), // recurring schedule
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, cancelled
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  description: text("description"),
  isOnline: boolean("is_online").default(false),
  meetingLink: varchar("meeting_link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Holidays table
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern", { length: 50 }), // yearly, monthly, etc
  description: text("description"),
  isNational: boolean("is_national").default(false),
  affectsSchedule: boolean("affects_schedule").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Class Enrollments table
export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, dropped, completed, transferred
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, partial, overdue
  finalGrade: varchar("final_grade", { length: 10 }),
  attendancePercentage: decimal("attendance_percentage", { precision: 5, scale: 2 }),
  dropDate: timestamp("drop_date"),
  dropReason: text("drop_reason"),
  transferredTo: integer("transferred_to").references(() => classes.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});


// Mentor Assignments table
export const mentorAssignments = pgTable("mentor_assignments", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignmentType: varchar("assignment_type", { length: 50 }).default("regular"), // regular, intensive, exam_prep
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  maxSessionsPerWeek: integer("max_sessions_per_week").default(2),
  preferredSessionDuration: integer("preferred_session_duration").default(60), // in minutes
  focusAreas: text("focus_areas").array().default([]),
  goals: text("goals"),
  status: varchar("status", { length: 20 }).default("active"), // active, paused, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Mentoring Sessions table
export const mentoringSessions = pgTable("mentoring_sessions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => mentorAssignments.id).notNull(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  duration: integer("duration"), // actual duration in minutes
  sessionType: varchar("session_type", { length: 50 }).default("mentoring"), // mentoring, check_in, goal_setting
  topic: varchar("topic", { length: 255 }),
  objectives: text("objectives").array().default([]),
  outcomes: text("outcomes"),
  homeworkAssigned: text("homework_assigned"),
  nextSessionPlans: text("next_session_plans"),
  studentMood: varchar("student_mood", { length: 20 }),
  progressRating: integer("progress_rating"), // 1-10 scale
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled, no_show
  cancellationReason: text("cancellation_reason"),
  recordingUrl: varchar("recording_url", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Session Packages table
export const sessionPackages = pgTable("session_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  packageType: varchar("package_type", { length: 50 }).default("private"), // private, group, callern
  sessionCount: integer("session_count").notNull(),
  sessionDuration: integer("session_duration").default(60), // in minutes
  validityDays: integer("validity_days").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  targetAudience: varchar("target_audience", { length: 100 }),
  skillLevel: varchar("skill_level", { length: 50 }),
  features: text("features").array().default([]),
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Forum Categories table
export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  orderIndex: integer("order_index").default(0),
  isPublic: boolean("is_public").default(true),
  allowedRoles: text("allowed_roles").array().default(["Student", "Teacher", "Mentor"]),
  moderatorIds: text("moderator_ids").array().default([]),
  isActive: boolean("is_active").default(true),
  topicCount: integer("topic_count").default(0),
  postCount: integer("post_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Forum Threads table
export const forumThreads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => forumCategories.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  tags: text("tags").array().default([]),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  lastReplyBy: integer("last_reply_by").references(() => users.id),
  status: varchar("status", { length: 20 }).default("active"), // active, closed, deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Forum Posts table
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => forumThreads.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  replyToId: integer("reply_to_id").references(() => forumPosts.id),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false),
  likeCount: integer("like_count").default(0),
  attachments: text("attachments").array().default([]),
  editedAt: timestamp("edited_at"),
  editedBy: integer("edited_by").references(() => users.id),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Gradebook Entries table
export const gradebookEntries = pgTable("gradebook_entries", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id),
  assignmentId: integer("assignment_id"), // TODO: Add assignments table reference later
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  entryType: varchar("entry_type", { length: 50 }).notNull(), // assignment, quiz, exam, participation
  title: varchar("title", { length: 255 }).notNull(),
  points: decimal("points", { precision: 5, scale: 2 }),
  maxPoints: decimal("max_points", { precision: 5, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  letterGrade: varchar("letter_grade", { length: 5 }),
  isExcused: boolean("is_excused").default(false),
  isLate: boolean("is_late").default(false),
  submittedAt: timestamp("submitted_at"),
  gradedAt: timestamp("graded_at"),
  feedback: text("feedback"),
  rubricScores: jsonb("rubric_scores"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Content Library table
export const contentLibrary = pgTable("content_library", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  contentType: varchar("content_type", { length: 50 }).notNull(), // video, audio, document, interactive
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  level: varchar("level", { length: 20 }),
  language: varchar("language", { length: 10 }).default("en"),
  duration: integer("duration"), // in minutes for videos/audio
  fileUrl: varchar("file_url", { length: 500 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  transcript: text("transcript"),
  tags: text("tags").array().default([]),
  skills: text("skills").array().default([]),
  prerequisites: text("prerequisites").array().default([]),
  isPublic: boolean("is_public").default(true),
  viewCount: integer("view_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0),
  authorId: integer("author_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Questions table
export const gameQuestions = pgTable("game_questions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, fill_blank, matching
  correctAnswer: text("correct_answer").notNull(),
  incorrectAnswers: text("incorrect_answers").array().default([]),
  explanation: text("explanation"),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"),
  timeLimit: integer("time_limit").default(30), // in seconds
  points: integer("points").default(10),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Answer Logs table
export const gameAnswerLogs = pgTable("game_answer_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  questionId: integer("question_id").references(() => gameQuestions.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent"), // in milliseconds
  pointsEarned: integer("points_earned").default(0),
  attemptNumber: integer("attempt_number").default(1),
  hints: text("hints").array().default([]),
  hintsUsed: integer("hints_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Game Access Rules table
export const gameAccessRules = pgTable("game_access_rules", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // level_requirement, course_completion, age_restriction, time_based
  ruleValue: text("rule_value").notNull(),
  isRequired: boolean("is_required").default(true),
  description: text("description"),
  errorMessage: varchar("error_message", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Game Assignments table
export const studentGameAssignments = pgTable("student_game_assignments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).default("assigned"), // assigned, in_progress, completed, overdue
  maxAttempts: integer("max_attempts").default(3),
  attemptsUsed: integer("attempts_used").default(0),
  bestScore: integer("best_score").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in minutes
  completedAt: timestamp("completed_at"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course Games table
export const courseGames = pgTable("course_games", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  orderIndex: integer("order_index").default(0),
  isRequired: boolean("is_required").default(false),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.0"), // for grading purposes
  unlockConditions: jsonb("unlock_conditions"),
  isActive: boolean("is_active").default(true),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Institutes table
export const institutes = pgTable("institutes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logo: varchar("logo", { length: 500 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  settings: jsonb("settings"),
  isActive: boolean("is_active").default(true),
  establishedDate: date("established_date"),
  licenseNumber: varchar("license_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  instituteId: integer("institute_id").references(() => institutes.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  headId: integer("head_id").references(() => users.id),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  isActive: boolean("is_active").default(true),
  parentDepartmentId: integer("parent_department_id"),
  responsibilities: text("responsibilities").array().default([]),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Custom Roles table
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  instituteId: integer("institute_id").references(() => institutes.id),
  roleName: varchar("role_name", { length: 100 }).notNull(),
  description: text("description"),
  permissions: text("permissions").array().default([]),
  baseRole: varchar("base_role", { length: 50 }).default("Student"), // extends from basic roles
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  canManageUsers: boolean("can_manage_users").default(false),
  canManageCourses: boolean("can_manage_courses").default(false),
  canManageClasses: boolean("can_manage_classes").default(false),
  canViewReports: boolean("can_view_reports").default(false),
  canManagePayments: boolean("can_manage_payments").default(false),
  canUseCallern: boolean("can_use_callern").default(false),
  maxStudents: integer("max_students"),
  restrictions: jsonb("restrictions"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Parent Guardians table
export const parentGuardians = pgTable("parent_guardians", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  guardianName: varchar("guardian_name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(), // father, mother, guardian, etc.
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  occupation: varchar("occupation", { length: 100 }),
  workPhone: varchar("work_phone", { length: 20 }),
  isPrimary: boolean("is_primary").default(false),
  emergencyContact: boolean("emergency_contact").default(false),
  canPickup: boolean("can_pickup").default(true),
  hasAccessToPortal: boolean("has_access_to_portal").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Notes table
export const studentNotes = pgTable("student_notes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  noteType: varchar("note_type", { length: 50 }).default("general"), // general, behavioral, academic, medical, administrative
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  isPrivate: boolean("is_private").default(false),
  isAlert: boolean("is_alert").default(false),
  tags: text("tags").array().default([]),
  attachments: text("attachments").array().default([]),
  followUpDate: date("follow_up_date"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course Enrollments table - MATCHES ACTUAL DATABASE STRUCTURE
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("active")
});

// Front Desk Operations table
export const frontDeskOperations = pgTable("front_desk_operations", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").references(() => users.id).notNull(),
  operationType: varchar("operation_type", { length: 50 }).notNull(), // check_in, check_out, visitor_registration, inquiry, complaint
  studentId: integer("student_id").references(() => users.id),
  visitorName: varchar("visitor_name", { length: 255 }),
  visitorPhone: varchar("visitor_phone", { length: 20 }),
  purpose: varchar("purpose", { length: 255 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  assignedTo: integer("assigned_to").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  notes: text("notes"),
  attachments: text("attachments").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Phone Call Logs table
export const phoneCallLogs = pgTable("phone_call_logs", {
  id: serial("id").primaryKey(),
  callerId: varchar("caller_id", { length: 50 }),
  recipientId: varchar("recipient_id", { length: 50 }),
  userId: integer("user_id").references(() => users.id),
  operatorId: integer("operator_id").references(() => users.id),
  callType: varchar("call_type", { length: 50 }).notNull(), // incoming, outgoing, missed, transferred
  callPurpose: varchar("call_purpose", { length: 100 }), // inquiry, enrollment, complaint, support, follow_up
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  status: varchar("status", { length: 20 }).default("completed"), // ringing, answered, completed, missed, busy, failed
  recordingUrl: varchar("recording_url", { length: 500 }),
  transferredTo: integer("transferred_to").references(() => users.id),
  callNotes: text("call_notes"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  customerSatisfaction: integer("customer_satisfaction"), // 1-10 scale
  tags: text("tags").array().default([]),
  metadata: jsonb("metadata"), // additional call data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Front Desk Tasks table
export const frontDeskTasks = pgTable("front_desk_tasks", {
  id: serial("id").primaryKey(),
  assigneeId: integer("assignee_id").references(() => users.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: varchar("task_type", { length: 50 }).default("general"), // general, student_follow_up, payment_reminder, schedule_confirmation
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, cancelled, on_hold
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // student, course, payment, etc
  relatedEntityId: varchar("related_entity_id", { length: 50 }),
  reminderSet: boolean("reminder_set").default(false),
  reminderTime: timestamp("reminder_time"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern", { length: 100 }),
  notes: text("notes"),
  completionNotes: text("completion_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  gameType: varchar("game_type", { length: 50 }).notNull(), // quiz, vocabulary, grammar, pronunciation, story
  category: varchar("category", { length: 100 }),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard, expert
  language: varchar("language", { length: 10 }).default("en"),
  targetAgeGroup: varchar("target_age_group", { length: 50 }),
  estimatedDuration: integer("estimated_duration").default(15), // in minutes
  maxScore: integer("max_score").default(100),
  passScore: integer("pass_score").default(70),
  instructions: text("instructions"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  createdBy: integer("created_by").references(() => users.id),
  tags: text("tags").array().default([]),
  skillsTargeted: text("skills_targeted").array().default([]),
  xpReward: integer("xp_reward").default(10),
  coinReward: integer("coin_reward").default(5),
  playCount: integer("play_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Levels table
export const gameLevels = pgTable("game_levels", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  levelNumber: integer("level_number").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"),
  unlockRequirements: jsonb("unlock_requirements"),
  maxScore: integer("max_score").default(100),
  timeLimit: integer("time_limit"), // in seconds
  bonusConditions: jsonb("bonus_conditions"),
  xpReward: integer("xp_reward").default(10),
  coinReward: integer("coin_reward").default(5),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Game Progress table
export const userGameProgress = pgTable("user_game_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  currentLevel: integer("current_level").default(1),
  highestScore: integer("highest_score").default(0),
  totalScore: integer("total_score").default(0),
  totalPlays: integer("total_plays").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in minutes
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  lastPlayedAt: timestamp("last_played_at"),
  firstPlayedAt: timestamp("first_played_at"),
  achievementsUnlocked: text("achievements_unlocked").array().default([]),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  favorited: boolean("favorited").default(false),
  rating: integer("rating"), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Sessions table
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  score: integer("score").default(0),
  maxPossibleScore: integer("max_possible_score"),
  correctAnswers: integer("correct_answers").default(0),
  incorrectAnswers: integer("incorrect_answers").default(0),
  hintsUsed: integer("hints_used").default(0),
  timeBonus: integer("time_bonus").default(0),
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, abandoned
  xpEarned: integer("xp_earned").default(0),
  coinsEarned: integer("coins_earned").default(0),
  achievementsEarned: text("achievements_earned").array().default([]),
  gameData: jsonb("game_data"), // session-specific game state
  deviceInfo: jsonb("device_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Leaderboards table
export const gameLeaderboards = pgTable("game_leaderboards", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  rank: integer("rank"),
  timeSpent: integer("time_spent"), // in seconds
  completionDate: timestamp("completion_date").defaultNow().notNull(),
  leaderboardType: varchar("leaderboard_type", { length: 50 }).default("all_time"), // all_time, weekly, monthly, daily
  period: varchar("period", { length: 50 }), // 2024-01, 2024-W01, 2024-01-01
  isValid: boolean("is_valid").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id),
  tutorId: integer("tutor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  title: text("title"),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration"),
  status: text("status"),
  sessionUrl: text("session_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at")
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  recipientId: integer("recipient_id").references(() => users.id),
  conversationId: integer("conversation_id").references(() => chatConversations.id),
  messageType: varchar("message_type", { length: 50 }).default("text"), // text, image, file, voice, system
  content: text("content"),
  attachments: text("attachments").array().default([]),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  replyToId: integer("reply_to_id").references(() => messages.id),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Homework table
export const homework = pgTable("homework", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status"),
  submission: text("submission"),
  grade: integer("grade"),
  feedback: text("feedback"),
  assignedAt: timestamp("assigned_at"),
  tutorId: integer("tutor_id").references(() => users.id),
  instructions: text("instructions"),
  maxScore: integer("max_score"),
  submissionUrl: text("submission_url"),
  submissionFiles: jsonb("submission_files"),
  maxGrade: integer("max_grade"),
  difficulty: text("difficulty"),
  estimatedTime: integer("estimated_time"),
  xpReward: integer("xp_reward"),
  allowLateSubmission: boolean("allow_late_submission"),
  latePenaltyPercent: integer("late_penalty_percent"),
  submittedAt: timestamp("submitted_at"),
  attachments: jsonb("attachments"),
  updatedAt: timestamp("updated_at"),
  rubric: jsonb("rubric"),
  tags: text("tags").array(),
  isVisible: boolean("is_visible")
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  payerId: integer("payer_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  paymentType: varchar("payment_type", { length: 50 }).notNull(), // course_enrollment, session_package, callern_package, late_fee
  paymentMethod: varchar("payment_method", { length: 50 }), // cash, card, bank_transfer, online
  status: varchar("status", { length: 20 }).default("pending"), // pending, completed, failed, refunded, cancelled
  transactionId: varchar("transaction_id", { length: 255 }),
  referenceNumber: varchar("reference_number", { length: 255 }),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // course, class, package, fee
  relatedEntityId: varchar("related_entity_id", { length: 50 }),
  description: text("description"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountReason: varchar("discount_reason", { length: 255 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }),
  paidAt: timestamp("paid_at"),
  processedBy: integer("processed_by").references(() => users.id),
  paymentGateway: varchar("payment_gateway", { length: 50 }),
  gatewayResponse: jsonb("gateway_response"),
  isRefundable: boolean("is_refundable").default(true),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // system, payment, course, class, homework, achievement
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  actionRequired: boolean("action_required").default(false),
  actionUrl: varchar("action_url", { length: 500 }),
  actionLabel: varchar("action_label", { length: 100 }),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  relatedEntityId: varchar("related_entity_id", { length: 50 }),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// OTP Codes table
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  code: varchar("code", { length: 10 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(), // login, password_reset, phone_verification, email_verification
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  attemptsCount: integer("attempts_count").default(0),
  maxAttempts: integer("max_attempts").default(3),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Skill Assessments table
export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  assessmentType: varchar("assessment_type", { length: 50 }).notNull(), // placement, progress, final, diagnostic
  skillArea: varchar("skill_area", { length: 50 }).notNull(), // speaking, listening, reading, writing, grammar, vocabulary
  level: varchar("level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in minutes
  completedAt: timestamp("completed_at"),
  assessorId: integer("assessor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  classId: integer("class_id").references(() => classes.id),
  assessmentData: jsonb("assessment_data"), // detailed responses
  recommendations: text("recommendations").array().default([]),
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  nextSteps: text("next_steps"),
  certificateGenerated: boolean("certificate_generated").default(false),
  isValid: boolean("is_valid").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Learning Activities table
export const learningActivities = pgTable("learning_activities", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // lesson, exercise, game, assessment, video, reading
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  classId: integer("class_id").references(() => classes.id),
  sessionId: varchar("session_id", { length: 255 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  status: varchar("status", { length: 20 }).default("completed"), // in_progress, completed, abandoned
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  skillsTargeted: text("skills_targeted").array().default([]),
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  xpEarned: integer("xp_earned").default(0),
  coinsEarned: integer("coins_earned").default(0),
  badgesEarned: text("badges_earned").array().default([]),
  timeSpentOnTask: integer("time_spent_on_task"), // actual engagement time
  attemptsCount: integer("attempts_count").default(1),
  hintsUsed: integer("hints_used").default(0),
  activityData: jsonb("activity_data"), // detailed interaction data
  deviceType: varchar("device_type", { length: 50 }),
  location: varchar("location", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Progress Snapshots table
export const progressSnapshots = pgTable("progress_snapshots", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
  snapshotType: varchar("snapshot_type", { length: 50 }).default("weekly"), // daily, weekly, monthly, milestone
  courseId: integer("course_id").references(() => courses.id),
  classId: integer("class_id").references(() => classes.id),
  overallProgress: decimal("overall_progress", { precision: 5, scale: 2 }),
  skillProgresses: jsonb("skill_progresses"), // progress per skill area
  currentLevel: varchar("current_level", { length: 20 }),
  xpTotal: integer("xp_total").default(0),
  coinsTotal: integer("coins_total").default(0),
  lessonsCompleted: integer("lessons_completed").default(0),
  exercisesCompleted: integer("exercises_completed").default(0),
  gamesPlayed: integer("games_played").default(0),
  assessmentsPassed: integer("assessments_passed").default(0),
  timeSpentLearning: integer("time_spent_learning").default(0), // in minutes
  streakDays: integer("streak_days").default(0),
  achievementsUnlocked: text("achievements_unlocked").array().default([]),
  averageSessionTime: decimal("average_session_time", { precision: 5, scale: 2 }),
  lastActivityDate: timestamp("last_activity_date"),
  attendanceRate: decimal("attendance_rate", { precision: 5, scale: 2 }),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  predictedCompletionDate: timestamp("predicted_completion_date"),
  riskFactors: text("risk_factors").array().default([]),
  recommendations: text("recommendations").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});


// Level Assessment Questions table
export const levelAssessmentQuestions = pgTable("level_assessment_questions", {
  id: serial("id").primaryKey(),
  skillArea: varchar("skill_area", { length: 50 }).notNull(), // reading, writing, listening, speaking, grammar, vocabulary
  level: varchar("level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, fill_blank, short_answer, essay
  correctAnswer: text("correct_answer"),
  options: text("options").array().default([]), // for multiple choice
  points: integer("points").default(1),
  timeLimit: integer("time_limit"), // in seconds
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  tags: text("tags").array().default([]),
  explanation: text("explanation"),
  audioUrl: varchar("audio_url", { length: 500 }), // for listening questions
  imageUrl: varchar("image_url", { length: 500 }), // for visual questions
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Level Assessment Results table
export const levelAssessmentResults = pgTable("level_assessment_results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
  overallLevel: varchar("overall_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  readingLevel: varchar("reading_level", { length: 20 }),
  writingLevel: varchar("writing_level", { length: 20 }),
  listeningLevel: varchar("listening_level", { length: 20 }),
  speakingLevel: varchar("speaking_level", { length: 20 }),
  grammarLevel: varchar("grammar_level", { length: 20 }),
  vocabularyLevel: varchar("vocabulary_level", { length: 20 }),
  readingScore: decimal("reading_score", { precision: 5, scale: 2 }),
  writingScore: decimal("writing_score", { precision: 5, scale: 2 }),
  listeningScore: decimal("listening_score", { precision: 5, scale: 2 }),
  speakingScore: decimal("speaking_score", { precision: 5, scale: 2 }),
  grammarScore: decimal("grammar_score", { precision: 5, scale: 2 }),
  vocabularyScore: decimal("vocabulary_score", { precision: 5, scale: 2 }),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }),
  maxPossibleScore: decimal("max_possible_score", { precision: 5, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in minutes
  assessorId: integer("assessor_id").references(() => users.id),
  recommendedCourse: integer("recommended_course").references(() => courses.id),
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  recommendations: text("recommendations"),
  placementNotes: text("placement_notes"),
  isPlacementCompleted: boolean("is_placement_completed").default(false),
  placedInCourse: integer("placed_in_course").references(() => courses.id),
  placedInClass: integer("placed_in_class").references(() => classes.id),
  placementDate: timestamp("placement_date"),
  assessmentData: jsonb("assessment_data"), // detailed responses
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Live Class Sessions table
export const liveClassSessions = pgTable("live_class_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  actualDuration: integer("actual_duration"), // in minutes
  plannedTopic: varchar("planned_topic", { length: 255 }),
  actualTopicsCovered: text("actual_topics_covered").array().default([]),
  attendanceCount: integer("attendance_count").default(0),
  maxCapacity: integer("max_capacity"),
  sessionType: varchar("session_type", { length: 50 }).default("regular"), // regular, makeup, extra, review
  recordingUrl: varchar("recording_url", { length: 500 }),
  materialsCovered: text("materials_covered").array().default([]),
  homeworkAssigned: text("homework_assigned"),
  nextSessionPrep: text("next_session_prep"),
  teacherNotes: text("teacher_notes"),
  studentEngagement: varchar("student_engagement", { length: 20 }), // low, medium, high
  difficultyCovered: varchar("difficulty_covered", { length: 20 }),
  objectivesAchieved: text("objectives_achieved").array().default([]),
  challengesFaced: text("challenges_faced"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  qualityRating: integer("quality_rating"), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Retention Data table
export const teacherRetentionData = pgTable("teacher_retention_data", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull().unique(),
  hireDate: date("hire_date").notNull(),
  currentStatus: varchar("current_status", { length: 50 }).default("active"), // active, on_leave, terminated, resigned
  retentionScore: decimal("retention_score", { precision: 5, scale: 2 }),
  satisfactionLevel: varchar("satisfaction_level", { length: 20 }), // very_low, low, medium, high, very_high
  performanceRating: decimal("performance_rating", { precision: 3, scale: 2 }),
  studentFeedbackAverage: decimal("student_feedback_average", { precision: 3, scale: 2 }),
  classesPerWeek: integer("classes_per_week").default(0),
  totalClassesTaught: integer("total_classes_taught").default(0),
  absenteeismRate: decimal("absenteeism_rate", { precision: 5, scale: 2 }),
  lastRaiseDate: date("last_raise_date"),
  currentSalary: decimal("current_salary", { precision: 10, scale: 2 }),
  salaryIncreases: integer("salary_increases").default(0),
  trainingCompletions: integer("training_completions").default(0),
  certifications: text("certifications").array().default([]),
  riskFactors: text("risk_factors").array().default([]),
  retentionActions: text("retention_actions").array().default([]),
  exitInterviewDate: date("exit_interview_date"),
  exitReason: varchar("exit_reason", { length: 255 }),
  wouldRecommendInstitute: boolean("would_recommend_institute"),
  lastUpdateDate: timestamp("last_update_date").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Questionnaires table
export const studentQuestionnaires = pgTable("student_questionnaires", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  questionnaireType: varchar("questionnaire_type", { length: 50 }).notNull(), // satisfaction, feedback, evaluation, assessment
  courseId: integer("course_id").references(() => courses.id),
  classId: integer("class_id").references(() => classes.id),
  teacherId: integer("teacher_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  responses: jsonb("responses").notNull(), // key-value pairs of questions and answers
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  overallRating: integer("overall_rating"), // 1-10 scale
  wouldRecommend: boolean("would_recommend"),
  submissionMethod: varchar("submission_method", { length: 50 }).default("online"), // online, paper, interview
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  actionItemsGenerated: text("action_items_generated").array().default([]),
  respondedBy: integer("responded_by").references(() => users.id), // if not anonymous
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Supervision Observations table
export const supervisionObservations = pgTable("supervision_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id),
  observationDate: timestamp("observation_date").notNull(),
  observationType: varchar("observation_type", { length: 50 }).default("formal"), // formal, informal, peer, self
  duration: integer("duration"), // in minutes
  lessonPlanReview: text("lesson_plan_review"),
  teachingEffectiveness: integer("teaching_effectiveness"), // 1-10 scale
  classroomManagement: integer("classroom_management"), // 1-10 scale
  studentEngagement: integer("student_engagement"), // 1-10 scale
  contentKnowledge: integer("content_knowledge"), // 1-10 scale
  communicationSkills: integer("communication_skills"), // 1-10 scale
  adaptability: integer("adaptability"), // 1-10 scale
  technologyUse: integer("technology_use"), // 1-10 scale
  overallRating: integer("overall_rating"), // 1-10 scale
  strengths: text("strengths").array().default([]),
  areasForImprovement: text("areas_for_improvement").array().default([]),
  actionItems: text("action_items").array().default([]),
  recommendations: text("recommendations"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  teacherSelfReflection: text("teacher_self_reflection"),
  observationNotes: text("observation_notes"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Scheduled Observations table
export const scheduledObservations = pgTable("scheduled_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  observationType: varchar("observation_type", { length: 50 }).default("formal"), // formal, informal, peer, self
  purpose: varchar("purpose", { length: 255 }),
  focusAreas: text("focus_areas").array().default([]),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled, rescheduled
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  rescheduledFrom: timestamp("rescheduled_from"),
  rescheduledReason: text("rescheduled_reason"),
  cancelledReason: text("cancelled_reason"),
  completedObservationId: integer("completed_observation_id").references(() => supervisionObservations.id),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Support Tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
  submitterId: integer("submitter_id").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  category: varchar("category", { length: 100 }).notNull(), // technical, billing, academic, general, complaint
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent, critical
  status: varchar("status", { length: 20 }).default("open"), // open, in_progress, resolved, closed, cancelled
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  tags: text("tags").array().default([]),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // course, class, payment, user
  relatedEntityId: varchar("related_entity_id", { length: 50 }),
  source: varchar("source", { length: 50 }).default("web"), // web, email, phone, chat, in_person
  lastResponseAt: timestamp("last_response_at"),
  lastResponseBy: integer("last_response_by").references(() => users.id),
  responseTime: integer("response_time"), // in minutes to first response
  resolutionTime: integer("resolution_time"), // in minutes to resolution
  satisfactionRating: integer("satisfaction_rating"), // 1-10 scale
  satisfactionFeedback: text("satisfaction_feedback"),
  escalationLevel: integer("escalation_level").default(0),
  escalatedAt: timestamp("escalated_at"),
  escalatedBy: integer("escalated_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  closedBy: integer("closed_by").references(() => users.id),
  attachments: text("attachments").array().default([]),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Support Ticket Messages table
export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  messageType: varchar("message_type", { length: 50 }).default("reply"), // reply, internal_note, status_change, escalation
  content: text("content").notNull(),
  attachments: text("attachments").array().default([]),
  isInternal: boolean("is_internal").default(false),
  isFromCustomer: boolean("is_from_customer").default(false),
  readByCustomer: boolean("read_by_customer").default(false),
  readByAgent: boolean("read_by_agent").default(false),
  readByCustomerAt: timestamp("read_by_customer_at"),
  readByAgentAt: timestamp("read_by_agent_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  timeSpent: integer("time_spent"), // in minutes
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Push Notifications table
export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userRole: varchar("user_role", { length: 50 }),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // reminder, alert, promotion, update, announcement
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  actionUrl: varchar("action_url", { length: 500 }),
  actionLabel: varchar("action_label", { length: 100 }),
  badge: integer("badge"),
  sound: varchar("sound", { length: 50 }).default("default"),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high
  ttl: integer("ttl").default(86400), // time to live in seconds
  targetCriteria: jsonb("target_criteria"), // for targeting specific user groups
  scheduledFor: timestamp("scheduled_for"),
  isScheduled: boolean("is_scheduled").default(false),
  isSent: boolean("is_sent").default(false),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").default(0),
  deliveredCount: integer("delivered_count").default(0),
  readCount: integer("read_count").default(0),
  clickCount: integer("click_count").default(0),
  campaignId: varchar("campaign_id", { length: 100 }),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  relatedEntityId: varchar("related_entity_id", { length: 50 }),
  createdBy: integer("created_by").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Notification Delivery Logs table
export const notificationDeliveryLogs = pgTable("notification_delivery_logs", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").references(() => pushNotifications.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  deliveryMethod: varchar("delivery_method", { length: 50 }).notNull(), // push, email, sms, in_app
  recipientAddress: varchar("recipient_address", { length: 255 }), // email, phone number, device token
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, delivered, failed, bounced
  attemptCount: integer("attempt_count").default(0),
  maxRetries: integer("max_retries").default(3),
  lastAttemptAt: timestamp("last_attempt_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  clickedAt: timestamp("clicked_at"),
  failureReason: varchar("failure_reason", { length: 255 }),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  providerResponse: jsonb("provider_response"), // response from email/SMS/push provider
  deviceInfo: jsonb("device_info"),
  isRead: boolean("is_read").default(false),
  isClicked: boolean("is_clicked").default(false),
  unsubscribed: boolean("unsubscribed").default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ========== MARKETING & SOCIAL MEDIA MANAGEMENT ==========

// Marketing Campaigns table - stores campaign information
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // enrollment, retention, referral, awareness, seasonal
  status: varchar("status", { length: 20 }).default("draft"), // draft, active, paused, completed, cancelled
  budget: bigint("budget", { mode: "number" }).default(0), // in IRR (Iranian Rial)
  spent: bigint("spent", { mode: "number" }).default(0), // in IRR
  targetAudience: varchar("target_audience", { length: 255 }), // persian_learners, arabic_students, etc
  channels: text("channels").array().default([]), // instagram, telegram, youtube, linkedin, twitter, facebook, email, sms
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  conversions: integer("conversions").default(0),
  costPerLead: bigint("cost_per_lead", { mode: "number" }).default(0), // in IRR
  roi: decimal("roi", { precision: 10, scale: 2 }).default("0"), // return on investment
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  tags: text("tags").array().default([]),
  iranianCompliance: boolean("iranian_compliance").default(true),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Platform Credentials table - stores API keys and tokens for social media platforms
export const platformCredentials = pgTable("platform_credentials", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }).notNull(), // instagram, telegram, youtube, linkedin, twitter, facebook, email_smtp, sms
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountHandle: varchar("account_handle", { length: 255 }), // @username or email
  credentialType: varchar("credential_type", { length: 50 }).notNull(), // api_key, oauth_token, app_password, bot_token
  accessToken: text("access_token"), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  apiKey: text("api_key"), // encrypted
  apiSecret: text("api_secret"), // encrypted
  tokenExpiry: timestamp("token_expiry"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  lastVerified: timestamp("last_verified"),
  permissions: text("permissions").array().default([]), // read, write, publish, analytics
  metadata: jsonb("metadata"), // platform-specific configuration
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Scheduled Posts table - stores scheduled social media posts
export const scheduledPosts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  platforms: text("platforms").array().notNull(), // which platforms to post to
  postType: varchar("post_type", { length: 50 }).notNull(), // text, image, video, carousel, story
  content: text("content").notNull(),
  media: text("media").array().default([]), // URLs or file paths
  hashtags: text("hashtags").array().default([]),
  mentions: text("mentions").array().default([]),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, publishing, published, failed, cancelled
  publishedAt: timestamp("published_at"),
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"),
  language: varchar("language", { length: 10 }).default("fa"), // fa, ar, en
  targetAudience: varchar("target_audience", { length: 255 }),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Social Media Posts table - stores published posts and their metadata
export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  scheduledPostId: integer("scheduled_post_id").references(() => scheduledPosts.id),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  platform: varchar("platform", { length: 50 }).notNull(),
  platformPostId: varchar("platform_post_id", { length: 255 }), // ID from the platform
  postType: varchar("post_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  media: text("media").array().default([]),
  hashtags: text("hashtags").array().default([]),
  mentions: text("mentions").array().default([]),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("published"), // published, deleted, hidden, archived
  impressions: bigint("impressions", { mode: "number" }).default(0),
  reach: bigint("reach", { mode: "number" }).default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  saves: integer("saves").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  language: varchar("language", { length: 10 }).default("fa"),
  createdBy: integer("created_by").references(() => users.id),
  metadata: jsonb("metadata"),
  lastSyncedAt: timestamp("last_synced_at"), // last time analytics were synced from platform
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Social Media Analytics table - stores daily aggregated analytics
export const socialMediaAnalytics = pgTable("social_media_analytics", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  followers: integer("followers").default(0),
  followersGrowth: integer("followers_growth").default(0),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  reach: bigint("reach", { mode: "number" }).default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  clicks: integer("clicks").default(0),
  profileViews: integer("profile_views").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  topPerformingPost: varchar("top_performing_post", { length: 255 }),
  iranianAudience: decimal("iranian_audience", { precision: 5, scale: 2 }), // percentage
  demographics: jsonb("demographics"), // age, gender, location data
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Email Campaigns table - stores email broadcast campaigns
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  senderName: varchar("sender_name", { length: 255 }).default("Meta Lingua"),
  senderEmail: varchar("sender_email", { length: 255 }).notNull(),
  replyTo: varchar("reply_to", { length: 255 }),
  recipientType: varchar("recipient_type", { length: 50 }).notNull(), // all_students, all_teachers, custom_list, segment
  recipientList: text("recipient_list").array().default([]), // email addresses
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, scheduled, sending, sent, failed
  totalRecipients: integer("total_recipients").default(0),
  successfulSends: integer("successful_sends").default(0),
  failedSends: integer("failed_sends").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  bounced: integer("bounced").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0"),
  attachments: text("attachments").array().default([]),
  createdBy: integer("created_by").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Telegram Messages table - stores telegram channel/group messages
export const telegramMessages = pgTable("telegram_messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id),
  channelId: varchar("channel_id", { length: 255 }).notNull(), // @channel_name or chat_id
  messageType: varchar("message_type", { length: 50 }).notNull(), // text, photo, video, document, poll
  content: text("content").notNull(),
  media: text("media").array().default([]),
  buttons: jsonb("buttons"), // inline keyboard buttons
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, scheduled, sent, failed
  telegramMessageId: varchar("telegram_message_id", { length: 255 }), // ID from Telegram
  views: integer("views").default(0),
  forwards: integer("forwards").default(0),
  reactions: jsonb("reactions"),
  autoReply: boolean("auto_reply").default(false),
  autoReplyRules: jsonb("auto_reply_rules"),
  createdBy: integer("created_by").references(() => users.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Tests table
export const placementTests = pgTable("placement_tests", {
  id: serial("id").primaryKey(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  description: text("description"),
  testType: varchar("test_type", { length: 50 }).default("comprehensive"), // comprehensive, skill_specific, quick_assessment
  targetLanguage: varchar("target_language", { length: 10 }).default("en"),
  skillsAssessed: text("skills_assessed").array().default([]), // reading, writing, listening, speaking, grammar, vocabulary
  totalQuestions: integer("total_questions").default(0),
  timeLimit: integer("time_limit").default(60), // in minutes
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70"),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).default("100"),
  difficultyRange: varchar("difficulty_range", { length: 50 }), // A1-B2, B1-C2, etc
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  allowRetakes: boolean("allow_retakes").default(true),
  retakeDelay: integer("retake_delay").default(7), // days before retake allowed
  instructions: text("instructions"),
  resultCalculationMethod: varchar("result_calculation_method", { length: 50 }).default("weighted"), // simple, weighted, adaptive
  adaptiveThreshold: decimal("adaptive_threshold", { precision: 5, scale: 2 }),
  certificateTemplate: varchar("certificate_template", { length: 255 }),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  version: varchar("version", { length: 20 }).default("1.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Questions table
export const placementQuestions = pgTable("placement_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => placementTests.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, fill_blank, short_answer, essay, listening, speaking
  skillArea: varchar("skill_area", { length: 50 }).notNull(), // reading, writing, listening, speaking, grammar, vocabulary
  difficultyLevel: varchar("difficulty_level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  correctAnswer: text("correct_answer"),
  options: text("options").array().default([]), // for multiple choice
  points: decimal("points", { precision: 5, scale: 2 }).default("1"),
  timeLimit: integer("time_limit"), // in seconds per question
  audioUrl: varchar("audio_url", { length: 500 }), // for listening questions
  imageUrl: varchar("image_url", { length: 500 }), // for visual questions
  context: text("context"), // additional context for the question
  explanation: text("explanation"),
  tags: text("tags").array().default([]),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  adaptiveWeight: decimal("adaptive_weight", { precision: 3, scale: 2 }).default("1.0"),
  discriminationIndex: decimal("discrimination_index", { precision: 5, scale: 4 }), // psychometric analysis
  difficultyIndex: decimal("difficulty_index", { precision: 5, scale: 4 }), // psychometric analysis
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Test Sessions table - MATCHES ACTUAL DATABASE STRUCTURE
export const placementTestSessions = pgTable("placement_test_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  targetLanguage: varchar("target_language", { length: 100 }),
  learningGoal: text("learning_goal"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalDurationSeconds: integer("total_duration_seconds"),
  status: varchar("status", { length: 20 }).default("in_progress"),
  currentSkill: varchar("current_skill", { length: 50 }),
  currentQuestionIndex: integer("current_question_index").default(0),
  overallCefrLevel: varchar("overall_cefr_level", { length: 10 }),
  speakingLevel: varchar("speaking_level", { length: 10 }),
  listeningLevel: varchar("listening_level", { length: 10 }),
  readingLevel: varchar("reading_level", { length: 10 }),
  writingLevel: varchar("writing_level", { length: 10 }),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  speakingScore: decimal("speaking_score", { precision: 5, scale: 2 }),
  listeningScore: decimal("listening_score", { precision: 5, scale: 2 }),
  readingScore: decimal("reading_score", { precision: 5, scale: 2 }),
  writingScore: decimal("writing_score", { precision: 5, scale: 2 }),
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  recommendations: text("recommendations").array(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  generatedRoadmapId: integer("generated_roadmap_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Placement Results table
export const placementResults = pgTable("placement_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => placementTestSessions.id).notNull().unique(),
  testId: integer("test_id").references(() => placementTests.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  completedAt: timestamp("completed_at").notNull(),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  maxPossibleScore: decimal("max_possible_score", { precision: 5, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  overallLevel: varchar("overall_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  readingScore: decimal("reading_score", { precision: 5, scale: 2 }),
  writingScore: decimal("writing_score", { precision: 5, scale: 2 }),
  listeningScore: decimal("listening_score", { precision: 5, scale: 2 }),
  speakingScore: decimal("speaking_score", { precision: 5, scale: 2 }),
  grammarScore: decimal("grammar_score", { precision: 5, scale: 2 }),
  vocabularyScore: decimal("vocabulary_score", { precision: 5, scale: 2 }),
  readingLevel: varchar("reading_level", { length: 20 }),
  writingLevel: varchar("writing_level", { length: 20 }),
  listeningLevel: varchar("listening_level", { length: 20 }),
  speakingLevel: varchar("speaking_level", { length: 20 }),
  grammarLevel: varchar("grammar_level", { length: 20 }),
  vocabularyLevel: varchar("vocabulary_level", { length: 20 }),
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  recommendations: text("recommendations"),
  suggestedCourses: text("suggested_courses").array().default([]),
  suggestedLevel: varchar("suggested_level", { length: 20 }),
  confidenceInterval: jsonb("confidence_interval"), // statistical confidence
  standardError: decimal("standard_error", { precision: 5, scale: 4 }),
  measurementError: decimal("measurement_error", { precision: 5, scale: 4 }),
  isValid: boolean("is_valid").default(true),
  validityFlags: text("validity_flags").array().default([]),
  gradedBy: integer("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
  reviewRequired: boolean("review_required").default(false),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  certificateGenerated: boolean("certificate_generated").default(false),
  certificateUrl: varchar("certificate_url", { length: 500 }),
  detailedAnalysis: jsonb("detailed_analysis"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Roadmap Configs table
export const roadmapConfigs = pgTable("roadmap_configs", {
  id: serial("id").primaryKey(),
  configName: varchar("config_name", { length: 255 }).notNull(),
  description: text("description"),
  targetAudience: varchar("target_audience", { length: 100 }), // beginners, intermediate, advanced, professionals
  language: varchar("language", { length: 10 }).default("en"),
  skillFocus: text("skill_focus").array().default([]), // speaking, listening, reading, writing, grammar, vocabulary
  estimatedDuration: integer("estimated_duration"), // in hours
  difficultyProgression: varchar("difficulty_progression", { length: 50 }), // linear, adaptive, branching
  milestoneFrequency: integer("milestone_frequency").default(5), // every N sessions
  assessmentStrategy: varchar("assessment_strategy", { length: 50 }), // periodic, adaptive, milestone_based
  feedbackMechanism: varchar("feedback_mechanism", { length: 50 }), // immediate, batched, milestone
  adaptiveBehavior: jsonb("adaptive_behavior"), // AI adaptation rules
  prerequisiteChecks: jsonb("prerequisite_checks"),
  completionCriteria: jsonb("completion_criteria"),
  retryPolicy: jsonb("retry_policy"),
  scaffoldingRules: jsonb("scaffolding_rules"), // support mechanisms
  personalizationRules: jsonb("personalization_rules"),
  gamificationElements: text("gamification_elements").array().default([]),
  integrationSettings: jsonb("integration_settings"), // CallerN, games, etc.
  isActive: boolean("is_active").default(true),
  isTemplate: boolean("is_template").default(false),
  version: varchar("version", { length: 20 }).default("1.0"),
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Roadmap Plans table
export const roadmapPlans = pgTable("roadmap_plans", {
  id: serial("id").primaryKey(),
  planName: varchar("plan_name", { length: 255 }).notNull(),
  configId: integer("config_id").references(() => roadmapConfigs.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  mentorId: integer("mentor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  startDate: timestamp("start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  currentPhase: varchar("current_phase", { length: 100 }),
  overallProgress: decimal("overall_progress", { precision: 5, scale: 2 }).default("0"),
  currentMilestone: integer("current_milestone").default(0),
  totalMilestones: integer("total_milestones"),
  adaptationHistory: jsonb("adaptation_history"), // AI adaptations made
  personalizedSettings: jsonb("personalized_settings"),
  difficultyAdjustments: jsonb("difficulty_adjustments"),
  paceModifications: jsonb("pace_modifications"),
  lastActivityDate: timestamp("last_activity_date"),
  streakDays: integer("streak_days").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalSessionsCompleted: integer("total_sessions_completed").default(0),
  averageSessionScore: decimal("average_session_score", { precision: 5, scale: 2 }),
  engagementLevel: varchar("engagement_level", { length: 20 }), // low, medium, high, very_high
  motivationFactors: text("motivation_factors").array().default([]),
  challengeAreas: text("challenge_areas").array().default([]),
  successMetrics: jsonb("success_metrics"),
  feedbackSummary: text("feedback_summary"),
  nextRecommendations: text("next_recommendations").array().default([]),
  status: varchar("status", { length: 20 }).default("active"), // active, paused, completed, abandoned
  pausedAt: timestamp("paused_at"),
  pauseReason: text("pause_reason"),
  completedAt: timestamp("completed_at"),
  abandonedAt: timestamp("abandoned_at"),
  abandonmentReason: text("abandonment_reason"),
  certificateEarned: boolean("certificate_earned").default(false),
  certificateUrl: varchar("certificate_url", { length: 500 }),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Roadmap Sessions table
export const roadmapSessions = pgTable("roadmap_sessions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => roadmapPlans.id).notNull(),
  sessionNumber: integer("session_number").notNull(),
  sessionType: varchar("session_type", { length: 50 }).default("regular"), // regular, milestone, assessment, review, remedial
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objectives: text("objectives").array().default([]),
  plannedDuration: integer("planned_duration").default(30), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  prerequisites: text("prerequisites").array().default([]),
  materials: text("materials").array().default([]),
  activities: jsonb("activities"), // structured activities data
  scheduledDate: timestamp("scheduled_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("planned"), // planned, scheduled, in_progress, completed, skipped, failed
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // actual engagement time in seconds
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  attentionScore: decimal("attention_score", { precision: 5, scale: 2 }),
  participationScore: decimal("participation_score", { precision: 5, scale: 2 }),
  correctAnswers: integer("correct_answers").default(0),
  incorrectAnswers: integer("incorrect_answers").default(0),
  hintsUsed: integer("hints_used").default(0),
  attemptsCount: integer("attempts_count").default(1),
  skillsTargeted: text("skills_targeted").array().default([]),
  skillsAchieved: text("skills_achieved").array().default([]),
  knowledgeGaps: text("knowledge_gaps").array().default([]),
  recommendations: text("recommendations").array().default([]),
  nextSessionAdjustments: jsonb("next_session_adjustments"),
  teacherFeedback: text("teacher_feedback"),
  studentSelfAssessment: text("student_self_assessment"),
  aiAnalysis: jsonb("ai_analysis"), // AI-generated insights
  emotionalState: varchar("emotional_state", { length: 50 }), // confident, frustrated, motivated, confused
  adaptationsApplied: jsonb("adaptations_applied"),
  isKeystone: boolean("is_keystone").default(false), // critical session for progression
  unlocksCriteria: jsonb("unlocks_criteria"), // what this session unlocks
  recordingUrl: varchar("recording_url", { length: 500 }),
  resourcesProvided: text("resources_provided").array().default([]),
  homeworkAssigned: text("homework_assigned"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  qualityRating: integer("quality_rating"), // 1-10 scale
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Role Permissions table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // Admin, Teacher, Mentor, Student, Supervisor, Call Center Agent, Accountant
  permission: varchar("permission", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }), // users, courses, classes, payments, reports, etc.
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete, manage, view
  conditions: jsonb("conditions"), // additional conditions for the permission
  subsystemPermissions: jsonb("subsystem_permissions"),
  isGranted: boolean("is_granted").default(true),
  priority: integer("priority").default(0), // for conflict resolution
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Availability table
export const teacherAvailability = pgTable("teacher_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  availabilityType: varchar("availability_type", { length: 50 }).default("general"), // general, class, private_lesson, callern, meeting
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  effectiveFromDate: date("effective_from_date").notNull(),
  effectiveToDate: date("effective_to_date"),
  isRecurring: boolean("is_recurring").default(true),
  priority: integer("priority").default(1), // 1-5 scale for scheduling preference
  maxBookings: integer("max_bookings").default(10), // max bookings in this time slot
  currentBookings: integer("current_bookings").default(0),
  bufferTime: integer("buffer_time").default(15), // minutes between sessions
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Availability Periods table
export const teacherAvailabilityPeriods = pgTable("teacher_availability_periods", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  periodType: varchar("period_type", { length: 50 }).notNull(), // vacation, sick_leave, busy, available, preferred
  reason: varchar("reason", { length: 255 }),
  isAllDay: boolean("is_all_day").default(false),
  appliesToDays: text("applies_to_days").array().default([]), // specific days of week if not all day
  recurrencePattern: varchar("recurrence_pattern", { length: 100 }), // weekly, monthly, etc.
  recurrenceEnd: date("recurrence_end"),
  priority: integer("priority").default(1), // higher number = higher priority
  overridesRegularSchedule: boolean("overrides_regular_schedule").default(false),
  autoDeclineBookings: boolean("auto_decline_bookings").default(false),
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  status: varchar("status", { length: 20 }).default("active"), // active, pending, approved, cancelled
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Observation Responses table
export const teacherObservationResponses = pgTable("teacher_observation_responses", {
  id: serial("id").primaryKey(),
  observationId: integer("observation_id").references(() => supervisionObservations.id).notNull(),
  responseType: varchar("response_type", { length: 50 }).notNull(), // improvement_plan, self_assessment, feedback_response, action_plan
  responseText: text("response_text").notNull(),
  actionItems: text("action_items").array().default([]),
  targetDates: date("target_dates").array().default([]),
  implementationStatus: varchar("implementation_status", { length: 50 }).default("pending"), // pending, in_progress, completed, deferred
  evidenceProvided: text("evidence_provided").array().default([]),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: date("follow_up_date"),
  supervisorFeedback: text("supervisor_feedback"),
  approvalStatus: varchar("approval_status", { length: 20 }).default("pending"), // pending, approved, needs_revision, rejected
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  revisionRequests: text("revision_requests").array().default([]),
  priorityLevel: varchar("priority_level", { length: 20 }).default("medium"), // low, medium, high, urgent
  attachments: text("attachments").array().default([]),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tests table
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  testType: varchar("test_type", { length: 50 }).default("quiz"), // quiz, exam, assignment, practice, placement, final
  skillsAssessed: text("skills_assessed").array().default([]), // listening, speaking, reading, writing, grammar, vocabulary
  totalQuestions: integer("total_questions").default(0),
  totalPoints: decimal("total_points", { precision: 5, scale: 2 }).default("100"),
  passingScore: decimal("passing_score", { precision: 5, scale: 2 }).default("70"),
  timeLimit: integer("time_limit"), // in minutes
  attemptsAllowed: integer("attempts_allowed").default(1),
  showResultsImmediately: boolean("show_results_immediately").default(true),
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  randomizeQuestions: boolean("randomize_questions").default(false),
  randomizeOptions: boolean("randomize_options").default(false),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  instructions: text("instructions"),
  tags: text("tags").array().default([]),
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Test Questions table
export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => tests.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, fill_blank, short_answer, essay, listening, speaking, matching, ordering, drag_drop
  points: decimal("points", { precision: 5, scale: 2 }).default("1"),
  orderIndex: integer("order_index").default(0),
  correctAnswer: text("correct_answer"),
  options: text("options").array().default([]), // for multiple choice, matching, etc.
  explanation: text("explanation"),
  hints: text("hints").array().default([]),
  timeLimit: integer("time_limit"), // per question in seconds
  isRequired: boolean("is_required").default(true),
  audioUrl: varchar("audio_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  videoUrl: varchar("video_url", { length: 500 }),
  context: text("context"), // additional context or passage
  skillArea: varchar("skill_area", { length: 50 }), // listening, speaking, reading, writing, grammar, vocabulary
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  bloomsLevel: varchar("blooms_level", { length: 50 }), // remember, understand, apply, analyze, evaluate, create
  tags: text("tags").array().default([]),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Test Attempts table
export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => tests.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  attemptNumber: integer("attempt_number").default(1),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  submittedAt: timestamp("submitted_at"),
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, submitted, abandoned, expired
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  totalQuestions: integer("total_questions"),
  questionsAnswered: integer("questions_answered").default(0),
  correctAnswers: integer("correct_answers").default(0),
  incorrectAnswers: integer("incorrect_answers").default(0),
  skippedQuestions: integer("skipped_questions").default(0),
  timeSpent: integer("time_spent"), // in seconds
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"),
  isGraded: boolean("is_graded").default(false),
  gradedBy: integer("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
  feedback: text("feedback"),
  notes: text("notes"),
  flagged: boolean("flagged").default(false),
  flagReason: text("flag_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Test Answers table
export const testAnswers = pgTable("test_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => testAttempts.id).notNull(),
  questionId: integer("question_id").references(() => testQuestions.id).notNull(),
  answer: text("answer"), // student's answer
  isCorrect: boolean("is_correct"),
  pointsEarned: decimal("points_earned", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in seconds
  hintsUsed: integer("hints_used").default(0),
  attemptsCount: integer("attempts_count").default(1),
  confidence: integer("confidence"), // 1-10 scale
  reasoning: text("reasoning"), // student's explanation
  flagged: boolean("flagged").default(false),
  flagReason: text("flag_reason"),
  teacherFeedback: text("teacher_feedback"),
  autoGraded: boolean("auto_graded").default(true),
  manualGradeOverride: boolean("manual_grade_override").default(false),
  originalAutoScore: decimal("original_auto_score", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata"),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
  gradedAt: timestamp("graded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 3D Video Lessons table
export const threeDVideoLessons = pgTable("threed_video_lessons", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  levelId: integer("level_id").references(() => curriculumLevels.id),
  sceneType: varchar("scene_type", { length: 50 }).default("bookstore"), // bookstore, classroom, city, office, cafe, mall
  environment: varchar("environment", { length: 100 }), // specific environment name like "Lingo Bookstore"
  characters: text("characters").array().default([]), // Lexi, Maya, Emma, etc.
  primaryCharacter: varchar("primary_character", { length: 100 }), // main guide character
  learningObjectives: text("learning_objectives").array().default([]),
  targetSkills: text("target_skills").array().default([]), // speaking, listening, vocabulary, cultural_awareness
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  estimatedDuration: integer("estimated_duration").default(15), // in minutes
  isInteractive: boolean("is_interactive").default(true),
  hasVoiceSynthesis: boolean("has_voice_synthesis").default(true),
  hasSubtitles: boolean("has_subtitles").default(true),
  supportedLanguages: text("supported_languages").array().default([]),
  adaptivityLevel: varchar("adaptivity_level", { length: 50 }), // static, level_adaptive, personalized
  cameraMovement: varchar("camera_movement", { length: 50 }), // fixed, guided, free_roam
  interactionTypes: text("interaction_types").array().default([]), // dialogue, exploration, selection, gesture
  assessmentIntegrated: boolean("assessment_integrated").default(false),
  gamificationElements: text("gamification_elements").array().default([]),
  prerequisiteKnowledge: text("prerequisite_knowledge").array().default([]),
  culturalContext: varchar("cultural_context", { length: 100 }),
  accessibility: jsonb("accessibility"), // accessibility features
  technicalRequirements: jsonb("technical_requirements"),
  isActive: boolean("is_active").default(true),
  publishedAt: timestamp("published_at"),
  createdBy: integer("created_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewStatus: varchar("review_status", { length: 20 }).default("draft"), // draft, review, approved, published
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 3D Lesson Content table
export const threeDLessonContent = pgTable("threed_lesson_content", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => threeDVideoLessons.id).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // dialogue, narration, interaction, assessment, guide_text
  sequenceOrder: integer("sequence_order").notNull(),
  sceneTimestamp: decimal("scene_timestamp", { precision: 8, scale: 3 }), // timestamp in seconds
  characterSpeaker: varchar("character_speaker", { length: 100 }),
  contentText: text("content_text").notNull(),
  translationKey: varchar("translation_key", { length: 255 }), // for i18n
  voiceSettings: jsonb("voice_settings"), // TTS settings
  audioUrl: varchar("audio_url", { length: 500 }),
  subtitleStyling: jsonb("subtitle_styling"),
  interactionData: jsonb("interaction_data"), // interaction parameters
  assessmentData: jsonb("assessment_data"), // assessment questions/answers
  animationCues: jsonb("animation_cues"), // character animation triggers
  cameraInstructions: jsonb("camera_instructions"), // camera movement data
  environmentChanges: jsonb("environment_changes"), // scene modifications
  triggers: jsonb("triggers"), // interaction triggers
  conditions: jsonb("conditions"), // display/execution conditions
  variableUpdates: jsonb("variable_updates"), // lesson state updates
  progressMilestone: boolean("progress_milestone").default(false),
  skipAllowed: boolean("skip_allowed").default(true),
  repeatAllowed: boolean("repeat_allowed").default(true),
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  tags: text("tags").array().default([]),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 3D Lesson Progress table
export const threeDLessonProgress = pgTable("threed_lesson_progress", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => threeDVideoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }), // unique session identifier
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, paused, abandoned
  currentSequence: integer("current_sequence").default(0),
  totalSequences: integer("total_sequences"),
  percentageComplete: decimal("percentage_complete", { precision: 5, scale: 2 }).default("0"),
  timeSpent: integer("time_spent").default(0), // in seconds
  interactionsCount: integer("interactions_count").default(0),
  correctInteractions: integer("correct_interactions").default(0),
  incorrectInteractions: integer("incorrect_interactions").default(0),
  hintsUsed: integer("hints_used").default(0),
  repeatCount: integer("repeat_count").default(0),
  skipCount: integer("skip_count").default(0),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  attentionScore: decimal("attention_score", { precision: 5, scale: 2 }),
  pronunciationScore: decimal("pronunciation_score", { precision: 5, scale: 2 }),
  comprehensionScore: decimal("comprehension_score", { precision: 5, scale: 2 }),
  vocabularyLearned: text("vocabulary_learned").array().default([]),
  phrasesLearned: text("phrases_learned").array().default([]),
  culturalInsights: text("cultural_insights").array().default([]),
  mistakePatterns: text("mistake_patterns").array().default([]),
  preferredPace: varchar("preferred_pace", { length: 20 }), // slow, normal, fast
  preferredInteractionStyle: varchar("preferred_interaction_style", { length: 50 }),
  difficultyAdjustments: jsonb("difficulty_adjustments"),
  adaptiveRecommendations: jsonb("adaptive_recommendations"),
  deviceInfo: jsonb("device_info"),
  performanceMetrics: jsonb("performance_metrics"),
  sessionData: jsonb("session_data"), // lesson state and variables
  feedbackProvided: text("feedback_provided"),
  studentRating: integer("student_rating"), // 1-10 scale
  studentComments: text("student_comments"),
  teacherNotes: text("teacher_notes"),
  flaggedIssues: text("flagged_issues").array().default([]),
  nextRecommendations: text("next_recommendations").array().default([]),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Password Reset Tokens table  
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  hashedToken: varchar("hashed_token", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).default("password_reset"), // password_reset, email_verification, account_activation
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  securityLevel: varchar("security_level", { length: 20 }).default("standard"), // low, standard, high, critical
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Profiles table
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  culturalBackground: text("cultural_background"),
  nativeLanguage: text("native_language"),
  targetLanguages: text("target_languages").array(),
  proficiencyLevel: text("proficiency_level"),
  learningGoals: text("learning_goals").array(),
  learningStyle: text("learning_style"),
  timezone: text("timezone"),
  preferredStudyTime: text("preferred_study_time"),
  weeklyStudyHours: integer("weekly_study_hours"),
  personalityType: text("personality_type"),
  motivationFactors: text("motivation_factors").array(),
  learningChallenges: text("learning_challenges").array(),
  strengths: text("strengths").array(),
  interests: text("interests").array(),
  bio: text("bio"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  nationalId: text("national_id"),
  birthday: date("birthday"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  notes: text("notes"),
  currentLevel: text("current_level"),
  targetLanguage: text("target_language"),
  currentProficiency: text("current_proficiency")
});

// User Sessions table
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  refreshToken: varchar("refresh_token", { length: 255 }),
  deviceId: varchar("device_id", { length: 255 }),
  deviceName: varchar("device_name", { length: 255 }),
  deviceType: varchar("device_type", { length: 50 }), // mobile, tablet, desktop, tv
  browserName: varchar("browser_name", { length: 100 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  operatingSystem: varchar("operating_system", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: varchar("location", { length: 255 }), // city, country
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  refreshExpiresAt: timestamp("refresh_expires_at"),
  loginMethod: varchar("login_method", { length: 50 }).default("password"), // password, sms, google, replit
  isTrusted: boolean("is_trusted").default(false),
  isFlaggedSuspicious: boolean("is_flagged_suspicious").default(false),
  securityFlags: text("security_flags").array().default([]),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Lessons table
export const videoLessons = pgTable("video_lessons", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  levelId: integer("level_id").references(() => curriculumLevels.id),
  videoUrl: varchar("video_url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  duration: integer("duration"), // in seconds
  transcriptUrl: varchar("transcript_url", { length: 500 }),
  subtitlesUrl: varchar("subtitles_url", { length: 500 }),
  skillsTargeted: text("skills_targeted").array().default([]), // listening, speaking, reading, writing, grammar, vocabulary
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  tags: text("tags").array().default([]),
  vocabulary: text("vocabulary").array().default([]), // key vocabulary in this lesson
  objectives: text("objectives").array().default([]),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  viewCount: integer("view_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  ratingCount: integer("rating_count").default(0),
  teacherId: integer("teacher_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Progress table
export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  watchedDuration: integer("watched_duration").default(0), // in seconds
  totalDuration: integer("total_duration"), // in seconds
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  lastWatchedPosition: integer("last_watched_position").default(0), // in seconds
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  watchCount: integer("watch_count").default(0),
  rating: integer("rating"), // 1-5 scale
  ratedAt: timestamp("rated_at"),
  bookmarksCount: integer("bookmarks_count").default(0),
  notesCount: integer("notes_count").default(0),
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default("1.0"),
  subtitlesEnabled: boolean("subtitles_enabled").default(true),
  qualityPreference: varchar("quality_preference", { length: 20 }).default("auto"), // auto, 720p, 1080p, etc.
  lastWatchedAt: timestamp("last_watched_at"),
  watchHistory: jsonb("watch_history"), // session timestamps and durations
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  attentionSpan: integer("attention_span"), // longest continuous watch time
  pauseCount: integer("pause_count").default(0),
  rewindCount: integer("rewind_count").default(0),
  deviceType: varchar("device_type", { length: 50 }), // mobile, tablet, desktop
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Notes table
export const videoNotes = pgTable("video_notes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  timestamp: decimal("timestamp", { precision: 8, scale: 3 }).notNull(), // in seconds
  noteText: text("note_text").notNull(),
  noteType: varchar("note_type", { length: 50 }).default("general"), // general, vocabulary, grammar, question, insight
  tags: text("tags").array().default([]),
  isPrivate: boolean("is_private").default(true),
  isImportant: boolean("is_important").default(false),
  color: varchar("color", { length: 20 }).default("yellow"), // for highlighting
  relatedVocabulary: text("related_vocabulary").array().default([]),
  attachments: text("attachments").array().default([]),
  sharedWith: text("shared_with").array().default([]), // user IDs
  likes: integer("likes").default(0),
  isTeacherApproved: boolean("is_teacher_approved").default(false),
  teacherFeedback: text("teacher_feedback"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Bookmarks table
export const videoBookmarks = pgTable("video_bookmarks", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  timestamp: decimal("timestamp", { precision: 8, scale: 3 }).notNull(), // in seconds
  title: varchar("title", { length: 255 }),
  description: text("description"),
  bookmarkType: varchar("bookmark_type", { length: 50 }).default("important"), // important, vocabulary, grammar, review, question
  tags: text("tags").array().default([]),
  color: varchar("color", { length: 20 }).default("red"), // for visual identification
  isPublic: boolean("is_public").default(false),
  reminderSet: boolean("reminder_set").default(false),
  reminderDate: timestamp("reminder_date"),
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  folderName: varchar("folder_name", { length: 100 }), // for organization
  priority: integer("priority").default(1), // 1-5 scale
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Courier Tracking table
export const courier_tracking = pgTable("courier_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().unique(),
  courierName: varchar("courier_name", { length: 100 }).notNull(),
  courierService: varchar("courier_service", { length: 100 }), // standard, express, overnight
  status: varchar("status", { length: 50 }).default("pending"), // pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  pickupDate: timestamp("pickup_date"),
  currentLocation: varchar("current_location", { length: 255 }),
  deliveryAddress: text("delivery_address"),
  recipientName: varchar("recipient_name", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  deliveryInstructions: text("delivery_instructions"),
  signatureRequired: boolean("signature_required").default(false),
  signedBy: varchar("signed_by", { length: 255 }),
  deliveryPhoto: varchar("delivery_photo", { length: 500 }),
  attemptCount: integer("attempt_count").default(0),
  lastAttemptDate: timestamp("last_attempt_date"),
  failureReason: text("failure_reason"),
  notes: text("notes"),
  weight: decimal("weight", { precision: 8, scale: 3 }), // in kg
  dimensions: jsonb("dimensions"), // length, width, height
  insuranceValue: decimal("insurance_value", { precision: 10, scale: 2 }),
  isInsured: boolean("is_insured").default(false),
  trackingHistory: jsonb("tracking_history"), // status updates with timestamps
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  instituteId: integer("institute_id").references(() => institutes.id),
  orderId: integer("order_id").references(() => orders.id),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  invoiceType: varchar("invoice_type", { length: 50 }).default("standard"), // standard, pro_forma, credit_note, debit_note
  status: varchar("status", { length: 20 }).default("draft"), // draft, sent, paid, overdue, cancelled, refunded
  billingDate: date("billing_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 100 }), // "Net 30", "Due on receipt", etc.
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, cash, card, wallet
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  billingAddress: jsonb("billing_address"),
  shippingAddress: jsonb("shipping_address"),
  lineItems: jsonb("line_items"), // detailed breakdown of services/products
  taxBreakdown: jsonb("tax_breakdown"), // detailed tax calculations
  discountBreakdown: jsonb("discount_breakdown"), // detailed discount information
  paymentHistory: jsonb("payment_history"), // payment transactions for this invoice
  remindersSent: integer("reminders_sent").default(0),
  lastReminderDate: date("last_reminder_date"),
  nextReminderDate: date("next_reminder_date"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }), // monthly, quarterly, yearly
  parentInvoiceId: integer("parent_invoice_id").references(() => invoices.id),
  cancellationReason: text("cancellation_reason"),
  refundReason: text("refund_reason"),
  attachments: text("attachments").array().default([]),
  generatedBy: integer("generated_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  downloadCount: integer("download_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MST Responses table
export const mstResponses = pgTable("mst_responses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => mstSessions.id).notNull(),
  questionId: integer("question_id"),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, speaking, listening, writing, reading
  response: text("response"), // student's response/answer
  isCorrect: boolean("is_correct"),
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in seconds
  attempts: integer("attempts").default(1),
  hintsUsed: integer("hints_used").default(0),
  confidence: integer("confidence"), // 1-10 scale
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  skillArea: varchar("skill_area", { length: 50 }), // listening, speaking, reading, writing, grammar, vocabulary
  adaptiveLevel: decimal("adaptive_level", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  audioUrl: varchar("audio_url", { length: 500 }), // for speaking responses
  transcription: text("transcription"), // for speaking responses
  pronunciation: jsonb("pronunciation"), // pronunciation analysis data
  fluency: jsonb("fluency"), // fluency analysis data
  accuracy: jsonb("accuracy"), // accuracy analysis data
  errors: jsonb("errors"), // detected errors
  improvements: jsonb("improvements"), // suggested improvements
  teacherFeedback: text("teacher_feedback"),
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of the response
  flagged: boolean("flagged").default(false),
  flagReason: text("flag_reason"),
  metadata: jsonb("metadata"),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
  gradedAt: timestamp("graded_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MST Sessions table
export const mstSessions = pgTable("mst_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  sessionType: varchar("session_type", { length: 50 }).default("adaptive"), // adaptive, diagnostic, practice, assessment
  targetSkill: varchar("target_skill", { length: 50 }).notNull(), // listening, speaking, reading, writing, grammar, vocabulary
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  sessionDuration: integer("session_duration").default(15), // in minutes
  questionsTotal: integer("questions_total"),
  questionsCompleted: integer("questions_completed").default(0),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused, abandoned
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  completedAt: timestamp("completed_at"),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  maxPossibleScore: decimal("max_possible_score", { precision: 5, scale: 2 }),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }),
  fluencyScore: decimal("fluency_score", { precision: 5, scale: 2 }),
  pronunciationScore: decimal("pronunciation_score", { precision: 5, scale: 2 }),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }),
  adaptiveLevel: decimal("adaptive_level", { precision: 5, scale: 2 }),
  levelAdjustments: integer("level_adjustments").default(0),
  hintsProvided: integer("hints_provided").default(0),
  errorsDetected: integer("errors_detected").default(0),
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  recommendations: text("recommendations").array().default([]),
  timeSpent: integer("time_spent"), // actual time spent in seconds
  attentionScore: decimal("attention_score", { precision: 5, scale: 2 }),
  engagementLevel: varchar("engagement_level", { length: 20 }), // low, medium, high, very_high
  frustrationLevel: varchar("frustration_level", { length: 20 }), // low, medium, high
  progressMade: boolean("progress_made").default(false),
  skillImprovement: jsonb("skill_improvement"), // detailed skill progress tracking
  sessionGoals: text("session_goals").array().default([]),
  goalsAchieved: text("goals_achieved").array().default([]),
  nextSessionRecommendations: text("next_session_recommendations").array().default([]),
  teacherNotes: text("teacher_notes"),
  studentFeedback: text("student_feedback"),
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of the session
  deviceInfo: jsonb("device_info"),
  connectionQuality: varchar("connection_quality", { length: 20 }), // excellent, good, fair, poor
  technicalIssues: text("technical_issues").array().default([]),
  sessionRecording: varchar("session_recording", { length: 500 }), // URL to session recording
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MST Skill States table
export const mstSkillStates = pgTable("mst_skill_states", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  skillArea: varchar("skill_area", { length: 50 }).notNull(), // listening, speaking, reading, writing, grammar, vocabulary
  currentLevel: varchar("current_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  targetLevel: varchar("target_level", { length: 20 }),
  proficiencyScore: decimal("proficiency_score", { precision: 5, scale: 2 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  sessionsCompleted: integer("sessions_completed").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  correctAnswers: integer("correct_answers").default(0),
  incorrectAnswers: integer("incorrect_answers").default(0),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }),
  averageResponseTime: decimal("average_response_time", { precision: 8, scale: 3 }), // in seconds
  improvementTrend: varchar("improvement_trend", { length: 20 }), // improving, stable, declining, fluctuating
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  commonMistakes: text("common_mistakes").array().default([]),
  masteredConcepts: text("mastered_concepts").array().default([]),
  strugglingConcepts: text("struggling_concepts").array().default([]),
  nextMilestones: text("next_milestones").array().default([]),
  recommendedActivities: text("recommended_activities").array().default([]),
  lastAssessmentDate: timestamp("last_assessment_date"),
  lastScoreChange: decimal("last_score_change", { precision: 5, scale: 2 }),
  scoreHistory: jsonb("score_history"), // historical score data
  skillMastery: jsonb("skill_mastery"), // detailed mastery breakdown
  learningVelocity: decimal("learning_velocity", { precision: 5, scale: 2 }), // progress rate
  difficultyPreference: varchar("difficulty_preference", { length: 20 }), // easy, moderate, challenging
  adaptiveLevel: decimal("adaptive_level", { precision: 5, scale: 2 }),
  plateauDetected: boolean("plateau_detected").default(false),
  plateauDuration: integer("plateau_duration"), // days in plateau
  breakthroughNeeded: boolean("breakthrough_needed").default(false),
  motivationLevel: varchar("motivation_level", { length: 20 }), // low, medium, high, very_high
  frustrationLevel: varchar("frustration_level", { length: 20 }), // low, medium, high
  engagementPattern: varchar("engagement_pattern", { length: 50 }), // consistent, sporadic, declining, improving
  optimalSessionLength: integer("optimal_session_length"), // in minutes
  preferredLearningStyle: varchar("preferred_learning_style", { length: 50 }),
  retentionRate: decimal("retention_rate", { precision: 5, scale: 2 }),
  memoryStrength: varchar("memory_strength", { length: 20 }), // weak, average, strong, excellent
  needsReview: boolean("needs_review").default(false),
  reviewTopics: text("review_topics").array().default([]),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Main Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderType: varchar("order_type", { length: 30 }).default("purchase"), // purchase, subscription, gift, trial
  orderStatus: varchar("order_status", { length: 30 }).default("pending"), // pending, processing, confirmed, shipped, delivered, cancelled, refunded
  paymentStatus: varchar("payment_status", { length: 30 }).default("pending"), // pending, paid, failed, refunded, partial
  paymentMethod: varchar("payment_method", { length: 50 }), // shetab, wallet, bank_transfer, cash
  paymentGateway: varchar("payment_gateway", { length: 50 }), // shetab, kavenegar_pay
  transactionId: varchar("transaction_id", { length: 100 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountTotal: decimal("discount_total", { precision: 10, scale: 2 }).default("0"),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }).default("0"),
  shippingTotal: decimal("shipping_total", { precision: 10, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  discountCode: varchar("discount_code", { length: 50 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  billingAddressId: integer("billing_address_id").references(() => user_addresses.id),
  shippingAddressId: integer("shipping_address_id").references(() => user_addresses.id),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  estimatedDelivery: date("estimated_delivery"),
  actualDelivery: date("actual_delivery"),
  orderNotes: text("order_notes"),
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  giftMessage: text("gift_message"),
  isGift: boolean("is_gift").default(false),
  giftRecipientName: varchar("gift_recipient_name", { length: 255 }),
  giftRecipientEmail: varchar("gift_recipient_email", { length: 255 }),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  source: varchar("source", { length: 50 }).default("website"), // website, mobile_app, admin, phone, import
  deviceInfo: jsonb("device_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: varchar("referrer", { length: 500 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  affiliateId: integer("affiliate_id"),
  salesRepId: integer("sales_rep_id").references(() => users.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  invoiceDate: date("invoice_date"),
  dueDate: date("due_date"),
  paidDate: timestamp("paid_date"),
  refundedDate: timestamp("refunded_date"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  returnPolicy: varchar("return_policy", { length: 100 }),
  warrantyInfo: jsonb("warranty_info"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 30 }).default("pending"), // pending, processing, partially_fulfilled, fulfilled, cancelled
  trackingNumber: varchar("tracking_number", { length: 100 }),
  carrier: varchar("carrier", { length: 50 }),
  orderTags: text("order_tags").array().default([]),
  customFields: jsonb("custom_fields"),
  metadata: jsonb("metadata"),
  placedAt: timestamp("placed_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Order Items table
export const order_items = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productType: varchar("product_type", { length: 50 }).notNull(), // course, book, package, session, merchandise
  productId: integer("product_id"), // reference to specific product
  productName: varchar("product_name", { length: 255 }).notNull(),
  productDescription: text("product_description"),
  sku: varchar("sku", { length: 100 }),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  weight: decimal("weight", { precision: 8, scale: 3 }), // in kg
  dimensions: jsonb("dimensions"), // length, width, height
  isDigital: boolean("is_digital").default(false),
  downloadUrl: varchar("download_url", { length: 500 }),
  accessDuration: integer("access_duration"), // days of access for digital products
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  courseStartDate: date("course_start_date"),
  courseEndDate: date("course_end_date"),
  teacherId: integer("teacher_id").references(() => users.id),
  sessionPackageId: integer("session_package_id"),
  sessionsIncluded: integer("sessions_included"),
  validityPeriod: integer("validity_period"), // days valid for sessions
  redemptionCode: varchar("redemption_code", { length: 50 }),
  giftMessage: text("gift_message"),
  giftRecipientEmail: varchar("gift_recipient_email", { length: 255 }),
  isGift: boolean("is_gift").default(false),
  customizations: jsonb("customizations"), // custom options selected
  fulfillmentStatus: varchar("fulfillment_status", { length: 20 }).default("pending"), // pending, processing, fulfilled, failed
  fulfillmentDate: timestamp("fulfillment_date"),
  shippingRequired: boolean("shipping_required").default(false),
  returnPolicy: varchar("return_policy", { length: 100 }),
  warrantyPeriod: integer("warranty_period"), // days
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Addresses table
export const user_addresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).default("home"), // home, work, billing, shipping, other
  label: varchar("label", { length: 100 }), // custom label like "Mom's House", "Office"
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }),
  addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).default("Iran").notNull(),
  countryCode: varchar("country_code", { length: 5 }).default("IR"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  alternatePhone: varchar("alternate_phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isDefault: boolean("is_default").default(false),
  isDefaultBilling: boolean("is_default_billing").default(false),
  isDefaultShipping: boolean("is_default_shipping").default(false),
  coordinates: jsonb("coordinates"), // lat, lng for mapping
  locationNotes: text("location_notes"), // delivery instructions
  accessCodes: varchar("access_codes", { length: 100 }), // building codes, buzzer numbers
  deliveryInstructions: text("delivery_instructions"),
  businessHours: jsonb("business_hours"), // for business addresses
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verificationMethod: varchar("verification_method", { length: 50 }), // postal_service, sms, manual
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Shipping Orders table
export const shipping_orders = pgTable("shipping_orders", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  shippingMethod: varchar("shipping_method", { length: 100 }).notNull(),
  shippingProvider: varchar("shipping_provider", { length: 100 }), // post_iran, tipax, peyk, courier
  trackingNumber: varchar("tracking_number", { length: 100 }).unique(),
  labelUrl: varchar("label_url", { length: 500 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  insuranceValue: decimal("insurance_value", { precision: 10, scale: 2 }),
  declaredValue: decimal("declared_value", { precision: 10, scale: 2 }),
  packageWeight: decimal("package_weight", { precision: 8, scale: 3 }), // in kg
  packageDimensions: jsonb("package_dimensions"), // length, width, height
  fromAddress: jsonb("from_address").notNull(),
  toAddress: jsonb("to_address").notNull(),
  shippingStatus: varchar("shipping_status", { length: 30 }).default("pending"), // pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned
  estimatedDelivery: timestamp("estimated_delivery"),
  actualPickup: timestamp("actual_pickup"),
  actualDelivery: timestamp("actual_delivery"),
  attemptCount: integer("attempt_count").default(0),
  deliveryAttempts: jsonb("delivery_attempts"), // array of attempt details
  signatureRequired: boolean("signature_required").default(false),
  signedBy: varchar("signed_by", { length: 255 }),
  signatureImage: varchar("signature_image", { length: 500 }),
  deliveryInstructions: text("delivery_instructions"),
  specialHandling: text("special_handling").array().default([]), // fragile, urgent, temperature_controlled
  customs: jsonb("customs"), // customs declaration for international
  isInternational: boolean("is_international").default(false),
  returnPolicy: varchar("return_policy", { length: 100 }),
  returnTrackingNumber: varchar("return_tracking_number", { length: 100 }),
  returnReason: text("return_reason"),
  returnStatus: varchar("return_status", { length: 30 }), // pending, approved, rejected, completed
  notifications: jsonb("notifications"), // SMS/email notifications sent
  customerNotes: text("customer_notes"),
  courierNotes: text("courier_notes"),
  internalNotes: text("internal_notes"),
  proofOfDelivery: varchar("proof_of_delivery", { length: 500 }), // photo/document URL
  issues: jsonb("issues"), // delivery issues and resolutions
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Glossary Items table for CallerN personal vocabulary
export const glossaryItems = pgTable("glossary_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  callId: varchar("call_id", { length: 255 }), // CallerN session where this was learned
  word: varchar("word", { length: 255 }).notNull(),
  definition: text("definition").notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 50 }), // noun, verb, adjective, etc.
  pronunciation: varchar("pronunciation", { length: 255 }), // phonetic notation
  audioUrl: varchar("audio_url", { length: 500 }), // pronunciation recording
  nativeTranslation: text("native_translation"), // in user's native language
  examples: jsonb("examples"), // usage examples
  synonyms: text("synonyms").array().default([]),
  antonyms: text("antonyms").array().default([]),
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  frequency: varchar("frequency", { length: 20 }), // common, uncommon, rare
  category: varchar("category", { length: 100 }), // business, medical, technology, etc.
  tags: text("tags").array().default([]), // user-defined tags
  context: text("context"), // where/how this was encountered in the conversation
  conversationTopic: varchar("conversation_topic", { length: 255 }),
  teacherName: varchar("teacher_name", { length: 255 }),
  studyStatus: varchar("study_status", { length: 20 }).default("learning"), // learning, reviewing, mastered
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  incorrectCount: integer("incorrect_count").default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  srsLevel: integer("srs_level").default(1), // spaced repetition level
  easeFactor: decimal("ease_factor", { precision: 3, scale: 2 }).default("2.50"), // for SRS algorithm
  interval: integer("interval").default(1), // days until next review
  masteryScore: decimal("mastery_score", { precision: 5, scale: 2 }).default("0"), // 0-100
  confidenceLevel: varchar("confidence_level", { length: 20 }).default("low"), // low, medium, high
  personalNotes: text("personal_notes"),
  mnemonics: text("mnemonics"), // memory aids
  associatedImages: text("associated_images").array().default([]), // image URLs
  relatedWords: text("related_words").array().default([]),
  errorPatterns: jsonb("error_patterns"), // common mistakes user makes
  usageContext: text("usage_context").array().default([]), // formal, informal, slang, etc.
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  source: varchar("source", { length: 50 }).default("callern"), // callern, manual, import
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  sharedWithTeacher: boolean("shared_with_teacher").default(false),
  teacherFeedback: text("teacher_feedback"),
  aiGenerated: boolean("ai_generated").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Quiz Results table for storing test/quiz outcomes
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id", { length: 255 }).notNull(),
  quizType: varchar("quiz_type", { length: 50 }).notNull(), // placement, practice, assessment, callern
  sessionId: varchar("session_id", { length: 255 }), // for CallernN session tracking
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // percentage score 0-100
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  skippedAnswers: integer("skipped_answers").default(0),
  timeSpent: integer("time_spent"), // seconds
  maxTimeAllowed: integer("max_time_allowed"), // seconds
  completionStatus: varchar("completion_status", { length: 20 }).default("completed"), // completed, incomplete, timed_out
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  subject: varchar("subject", { length: 100 }), // grammar, vocabulary, listening, speaking, reading, writing
  topics: text("topics").array().default([]), // specific topics covered
  skillAreas: jsonb("skill_areas"), // detailed skill breakdown
  detailedResults: jsonb("detailed_results"), // question-by-question analysis
  feedback: text("feedback"), // AI-generated feedback
  recommendations: jsonb("recommendations"), // next steps and recommendations
  certificateId: varchar("certificate_id", { length: 255 }), // if applicable
  retakeAllowed: boolean("retake_allowed").default(true),
  retakeCount: integer("retake_count").default(0),
  proctored: boolean("proctored").default(false),
  cheatingDetected: boolean("cheating_detected").default(false),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  gradedAt: timestamp("graded_at"),
  validUntil: timestamp("valid_until"), // certificate/result validity
  instructorId: integer("instructor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Suggested Terms table for AI vocabulary suggestions
export const suggestedTerms = pgTable("suggested_terms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }), // video call or learning session
  term: varchar("term", { length: 255 }).notNull(),
  definition: text("definition").notNull(),
  pronunciation: varchar("pronunciation", { length: 255 }), // phonetic or IPA
  audioUrl: varchar("audio_url", { length: 500 }), // pronunciation audio
  partOfSpeech: varchar("part_of_speech", { length: 50 }), // noun, verb, adjective, etc.
  language: varchar("language", { length: 10 }).default("en"), // target language
  nativeTranslation: text("native_translation"), // translation to user's native language
  context: text("context"), // where/how this term was encountered
  examples: jsonb("examples"), // array of usage examples
  synonyms: text("synonyms").array().default([]),
  antonyms: text("antonyms").array().default([]),
  relatedTerms: text("related_terms").array().default([]),
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  frequency: varchar("frequency", { length: 20 }), // very_common, common, uncommon, rare
  category: varchar("category", { length: 50 }), // business, academic, casual, technical, etc.
  topics: text("topics").array().default([]), // science, technology, arts, etc.
  isAdded: boolean("is_added").default(false),
  addedAt: timestamp("added_at"),
  isIgnored: boolean("is_ignored").default(false),
  ignoredAt: timestamp("ignored_at"),
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  incorrectCount: integer("incorrect_count").default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  masteryLevel: varchar("mastery_level", { length: 20 }).default("new"), // new, learning, familiar, mastered
  spaceRepetition: jsonb("space_repetition"), // SRS algorithm data
  userNotes: text("user_notes"),
  mnemonics: text("mnemonics"), // memory aids created by user
  personalityTags: text("personality_tags").array().default([]), // funny, serious, professional, etc.
  source: varchar("source", { length: 50 }).default("ai"), // ai, teacher, dictionary, reading, video
  sourceContext: text("source_context"), // which lesson, video, book, etc.
  aiConfidence: decimal("ai_confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  flags: text("flags").array().default([]), // inappropriate, outdated, regional, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Rewrite Suggestions table for AI writing assistance
export const rewriteSuggestions = pgTable("rewrite_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }), // video call or learning session
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  suggestionType: varchar("suggestion_type", { length: 50 }).notNull(), // grammar, style, clarity, fluency, vocabulary
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  language: varchar("language", { length: 10 }).default("en"), // target language
  proficiencyLevel: varchar("proficiency_level", { length: 10 }), // A1, A2, B1, B2, C1, C2
  errorCategory: varchar("error_category", { length: 50 }), // verb_tense, article, preposition, word_order, etc.
  explanation: text("explanation"), // why this change is suggested
  examples: jsonb("examples"), // array of usage examples
  isAccepted: boolean("is_accepted"),
  acceptedAt: timestamp("accepted_at"),
  isRejected: boolean("is_rejected").default(false),
  rejectedAt: timestamp("rejected_at"),
  feedback: varchar("feedback", { length: 20 }), // helpful, not_helpful, incorrect
  userNotes: text("user_notes"),
  contextBefore: text("context_before"), // text before the error
  contextAfter: text("context_after"), // text after the error
  position: jsonb("position"), // start and end positions in original text
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  teachingPoint: text("teaching_point"), // educational explanation
  relatedRules: text("related_rules").array().default([]), // grammar rules related to this suggestion
  alternativeSuggestions: jsonb("alternative_suggestions"), // other possible corrections
  voiceToText: boolean("voice_to_text").default(false), // was this from speech recognition
  realTimeCorrection: boolean("real_time_correction").default(false),
  source: varchar("source", { length: 50 }).default("ai"), // ai, teacher, peer, self
  aiModel: varchar("ai_model", { length: 100 }), // which AI model generated this
  processingTime: integer("processing_time"), // milliseconds to generate suggestion
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// CURRICULUM SYSTEM TABLES
// ============================================================================

// Main curriculum tracks (IELTS and Conversation)
export const curriculums = pgTable("curriculums", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  key: varchar("key", { length: 100 }).unique().notNull(), // 'ielts', 'conversation'
  language: varchar("language", { length: 10 }).notNull().default("en"), // target language
  description: text("description"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Curriculum levels (Flash IELTS 1, A1.1, A1.2, etc.)
export const curriculumLevels = pgTable("curriculum_levels", {
  id: serial("id").primaryKey(),
  curriculumId: integer("curriculum_id").references(() => curriculums.id).notNull(),
  code: varchar("code", { length: 20 }).notNull(), // 'A1.1', 'Flash-IELTS-1'
  name: varchar("name", { length: 255 }).notNull(),
  levelCode: varchar("level_code", { length: 20 }), // legacy support
  levelName: varchar("level_name", { length: 255 }), // legacy support
  orderIndex: integer("order_index").notNull(),
  cefrBand: varchar("cefr_band", { length: 10 }), // A1, A2, B1, B2, C1, C2
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  totalLessons: integer("total_lessons").default(0),
  estimatedWeeks: integer("estimated_weeks"),
  prerequisites: text("prerequisites").array().default([]),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Links courses to curriculum levels (many-to-many relationship)
export const curriculumLevelCourses = pgTable("curriculum_level_courses", {
  id: serial("id").primaryKey(),
  curriculumLevelId: integer("curriculum_level_id").references(() => curriculumLevels.id).notNull(),
  levelId: integer("level_id").references(() => curriculumLevels.id), // alias for backward compatibility
  courseId: integer("course_id").references(() => courses.id).notNull(),
  orderIndex: integer("order_index").notNull(),
  isRequired: boolean("is_required").default(true),
  minimumScore: decimal("minimum_score", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student progress through curriculum levels
export const studentCurriculumProgress = pgTable("student_curriculum_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  curriculumId: integer("curriculum_id").references(() => curriculums.id).notNull(),
  curriculumLevelId: integer("curriculum_level_id").references(() => curriculumLevels.id),
  currentLevelId: integer("current_level_id").references(() => curriculumLevels.id),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, suspended
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  completedLessons: integer("completed_lessons").default(0),
  totalLessons: integer("total_lessons").default(0),
  currentLevel: jsonb("current_level"), // level info cache
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastActiveAt: timestamp("last_active_at"),
  nextLevelUnlockedAt: timestamp("next_level_unlocked_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  curriculumLevelId: integer("curriculum_level_id").references(() => curriculumLevels.id),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, dropped, suspended
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  finalGrade: decimal("final_grade", { precision: 5, scale: 2 }),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  droppedAt: timestamp("dropped_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Preferences table for user settings and preferences
export const studentPreferences = pgTable("student_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  language: varchar("language", { length: 10 }).default("en"), // UI language preference
  timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
  preferredCommunicationMethod: varchar("preferred_communication_method", { length: 20 }).default("email"), // email, sms, push
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  studyReminders: boolean("study_reminders").default(true),
  weeklyReports: boolean("weekly_reports").default(true),
  progressSharing: boolean("progress_sharing").default(false), // share with teachers/mentors
  publicProfile: boolean("public_profile").default(false),
  preferredLearningStyle: varchar("preferred_learning_style", { length: 20 }), // visual, auditory, kinesthetic, reading
  difficultyPreference: varchar("difficulty_preference", { length: 20 }).default("adaptive"), // easy, medium, hard, adaptive
  sessionLength: integer("session_length").default(30), // preferred session length in minutes
  dailyGoalMinutes: integer("daily_goal_minutes").default(30),
  weeklyGoalHours: integer("weekly_goal_hours").default(5),
  autoplayVideos: boolean("autoplay_videos").default(true),
  showSubtitles: boolean("show_subtitles").default(false),
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default("1.00"), // 0.5x to 2.0x speed
  fontSize: varchar("font_size", { length: 10 }).default("medium"), // small, medium, large
  darkMode: boolean("dark_mode").default(false),
  highContrast: boolean("high_contrast").default(false),
  accessibilityMode: boolean("accessibility_mode").default(false),
  keyboardNavigation: boolean("keyboard_navigation").default(false),
  screenReader: boolean("screen_reader").default(false),
  ttsEnabled: boolean("tts_enabled").default(false), // text-to-speech
  ttsVoice: varchar("tts_voice", { length: 50 }),
  ttsSpeed: decimal("tts_speed", { precision: 3, scale: 2 }).default("1.00"),
  calendarIntegration: varchar("calendar_integration", { length: 20 }), // google, outlook, apple
  studySchedule: jsonb("study_schedule"), // preferred study times
  breakReminders: boolean("break_reminders").default(true),
  motivationalMessages: boolean("motivational_messages").default(true),
  gamificationEnabled: boolean("gamification_enabled").default(true),
  competitiveMode: boolean("competitive_mode").default(false),
  privateMode: boolean("private_mode").default(false),
  dataSharing: boolean("data_sharing").default(false), // for research/improvement
  analyticsOptOut: boolean("analytics_opt_out").default(false),
  marketingOptIn: boolean("marketing_opt_in").default(false),
  customSettings: jsonb("custom_settings"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Trial Availability for managing trial lesson schedules
export const teacherTrialAvailability = pgTable("teacher_trial_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
  maxStudents: integer("max_students").default(1), // concurrent trial students
  trialDuration: integer("trial_duration").default(30), // minutes
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  effectiveUntil: timestamp("effective_until"),
  recurringWeeks: integer("recurring_weeks"), // how many weeks this availability repeats
  exceptions: jsonb("exceptions"), // specific dates when not available
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Trial Lessons for managing one-time trial sessions
export const trialLessons = pgTable("trial_lessons", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  lessonType: varchar("lesson_type", { length: 50 }).default("general_trial"), // general_trial, ielts_trial, conversation_trial
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(30), // minutes
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled, no_show
  meetingUrl: varchar("meeting_url", { length: 500 }), // video call link
  meetingId: varchar("meeting_id", { length: 255 }),
  password: varchar("password", { length: 255 }), // meeting password
  notes: text("notes"), // teacher's notes about the student
  feedback: text("feedback"), // post-lesson feedback
  studentRating: integer("student_rating"), // 1-5 star rating from student
  teacherRating: integer("teacher_rating"), // 1-5 star rating from teacher
  followUpRequired: boolean("follow_up_required").default(false),
  followUpNotes: text("follow_up_notes"),
  skillAssessment: jsonb("skill_assessment"), // assessment results
  recommendedLevel: varchar("recommended_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  recommendedCourse: varchar("recommended_course", { length: 255 }),
  conversionOutcome: varchar("conversion_outcome", { length: 20 }), // enrolled, not_interested, follow_up, no_decision
  enrolledCourseId: integer("enrolled_course_id").references(() => courses.id),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  rescheduledFrom: integer("rescheduled_from").references(() => trialLessons.id),
  rescheduledTo: integer("rescheduled_to").references(() => trialLessons.id),
  attendanceStatus: varchar("attendance_status", { length: 20 }), // attended, no_show, late, early_leave
  technicalIssues: text("technical_issues"),
  recordingUrl: varchar("recording_url", { length: 500 }),
  materialUsed: jsonb("material_used"), // what materials/resources were used
  homeworkAssigned: text("homework_assigned"),
  nextSteps: text("next_steps"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Rooms table for physical and virtual classrooms

// Classes - Specific instances of courses with teacher and schedule

// Class Enrollments (links students to specific classes)

// Course Sessions - Individual sessions within a class

// Tutoring sessions

// Session Video Progress Tracking

// Session Video Notes

// Session Video Bookmarks

// Messages between users

// Homework assignments - Enhanced with more fields

// Payment transactions with enhanced Shetab integration

// Legacy admin settings removed - using comprehensive version below

// Session Packages for Private Students

// Callern Video Call Packages

// Callern Package Roadmaps - Defines learning paths for each package

// Callern Roadmap Steps - Individual lessons/steps in a roadmap

// Student progress through roadmap steps

// Course Roadmap Progress - Track student progress through course roadmaps 

// Student Callern Packages (purchased packages)

// Teacher Callern Authorization - Controls who can access Callern dashboard

// Teacher Callern Availability

// Callern Call History (extended for new features)

// Callern Syllabus Topics

// Student Callern Progress

// ===== NEW CALLERN ENHANCEMENT TABLES =====

// Suggested Terms (vocabulary suggestions during calls)

// Rewrite Suggestions (improved versions of student utterances)

// Glossary Items (student's personal vocabulary collection)

// Quiz Results (for SRS vocabulary testing)

// Email Logs (for tracking sent emails)

// Audit Log for tracking all sensitive operations

// Student Preferences for feature toggles

// Wallet Transactions for incremental top-ups

// Course Enrollment Payments (direct payments for courses)

// Enhanced Notifications for Role-Based System



// Custom Roles and Permissions System

// Gamification System




// Level assessment questions - managed by admins/managers

// User level assessment results

// CRM Management Tables










// Insert schemas - temporarily commented out due to drizzle-zod compatibility issues
// TODO: Fix drizzle-zod integration
// export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
// export const insertUserSessionSchema = createInsertSchema(userSessions);
// export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true });
// Holidays table for managing institute holidays (used for class end date calculation)

// Course insert schema - re-enabled for storage layer
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
// export const insertClassSchema = createInsertSchema(classes);
// export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments);
// export const insertHolidaySchema = createInsertSchema(holidays);
// export const insertEnrollmentSchema = createInsertSchema(enrollments);
// export const insertSessionVideoProgressSchema = createInsertSchema(sessionVideoProgress);
// export const insertSessionVideoNotesSchema = createInsertSchema(sessionVideoNotes);
// export const insertSessionVideoBookmarksSchema = createInsertSchema(sessionVideoBookmarks);
// export const insertHomeworkSchema = createInsertSchema(homework);
// Admin settings schema defined below with comprehensive version




// Lead schema moved to after table definition to avoid forward reference

// CRM Insert Schemas








// Communication log schema moved to end of file


// Referral Settings - User-defined commission split preferences

// Course Referrals - Track specific course referrals

// Referral Commissions - Track and manage commission payouts

// AI Training Data Storage

// Skill Assessment Tracking

// Learning Activities Tracking

// Progress Snapshots for Historical Tracking

// AI Knowledge Base - Processed training data ready for retrieval

// AI Model Management

// AI Training Jobs

// AI Training Datasets

// AI Dataset Items (linking datasets to training data)

// Referral system insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS
// AI Model Management schemas - MOVED TO END OF FILE

// AI Training types
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type InsertAiTrainingJob = z.infer<typeof insertAiTrainingJobSchema>;
export type InsertAiTrainingDataset = z.infer<typeof insertAiTrainingDatasetSchema>;
export type InsertAiDatasetItem = z.infer<typeof insertAiDatasetItemSchema>;
export type AiModel = typeof aiModels.$inferSelect;
export type AiTrainingJob = typeof aiTrainingJobs.$inferSelect;
export type AiTrainingDataset = typeof aiTrainingDatasets.$inferSelect;
export type AiDatasetItem = typeof aiDatasetItems.$inferSelect;

// Skill tracking insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS

// LEAD MANAGEMENT SYSTEM (Call Center)

// Insert schema for leads

// Lead types
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// COMMUNICATION LOGS (Call Center)

// Insert schema for communication logs

// FINANCIAL SYSTEM (Accountant)

// Insert schema for invoices

// PAYMENT TRANSACTIONS (Iranian Shetab Integration)

// Insert schema for payment transactions

// ===== COMPREHENSIVE TESTING SUBSYSTEM =====

// Tests/Quizzes

// Test Questions - supports 8 question types

// Test Attempts

// Test Answers

// ===== GAMIFICATION SUBSYSTEM =====

// Language Learning Games

// Game Levels/Stages

// User Game Progress

// Game Sessions

// Game Leaderboards

// Game Access Rules - Define automatic rules for game visibility

// Student Game Assignments - Direct assignment of games to students

// Course Games - Associate games with courses

// Game Questions Table - Stores actual game content

// Daily Challenges Table

// User Daily Challenge Progress

// Game Answer Logs - Track every answer for analytics

// Insert schemas for game system




// Game system types
export type GameQuestion = typeof gameQuestions.$inferSelect;
export type InsertGameQuestion = z.infer<typeof insertGameQuestionSchema>;
export type GameDailyChallenge = typeof gameDailyChallenges.$inferSelect;
export type InsertGameDailyChallenge = z.infer<typeof insertGameDailyChallengeSchema>;
export type UserDailyChallengeProgress = typeof userDailyChallengeProgress.$inferSelect;
export type InsertUserDailyChallengeProgress = z.infer<typeof insertUserDailyChallengeProgressSchema>;
export type GameAnswerLog = typeof gameAnswerLogs.$inferSelect;
export type InsertGameAnswerLog = z.infer<typeof insertGameAnswerLogSchema>;

// ===== VIDEO-BASED COURSES SUBSYSTEM =====

// Video Lessons

// Video Progress Tracking

// Video Notes

// Video Bookmarks

// ===== ENHANCED LMS FEATURES =====

// Discussion Forums



// Gradebook

// Content Library

// ===== AI INTEGRATION FOR COMPREHENSIVE TRACKING =====

// AI Progress Tracking

// AI Activity Sessions

// AI Vocabulary Tracking

// AI Grammar Pattern Tracking

// AI Pronunciation Analysis

// TEACHER EVALUATIONS (Supervisor)

// Insert schema for teacher evaluations

// CLASS OBSERVATIONS (Supervisor)

// Insert schema for class observations

// SYSTEM METRICS (Admin)

// Insert schema for system metrics

// MENTOR ASSIGNMENTS (Mentor Dashboard)

// MENTORING SESSIONS 

// Insert schemas for mentor assignments and mentoring sessions


// BRANCHES - Institute branch management

// Insert schema for branches and rooms

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SessionVideoProgress = typeof sessionVideoProgress.$inferSelect;
export type InsertSessionVideoProgress = z.infer<typeof insertSessionVideoProgressSchema>;
export type SessionVideoNote = typeof sessionVideoNotes.$inferSelect;
export type InsertSessionVideoNote = z.infer<typeof insertSessionVideoNotesSchema>;
export type SessionVideoBookmark = typeof sessionVideoBookmarks.$inferSelect;
export type InsertSessionVideoBookmark = z.infer<typeof insertSessionVideoBookmarksSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Homework = typeof homework.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type SessionPackage = typeof sessionPackages.$inferSelect;
export type InsertSessionPackage = z.infer<typeof insertSessionPackageSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type CoursePayment = typeof coursePayments.$inferSelect;
export type InsertCoursePayment = z.infer<typeof insertCoursePaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type InsertDailyGoal = z.infer<typeof insertDailyGoalSchema>;
export type LevelAssessmentQuestion = typeof levelAssessmentQuestions.$inferSelect;
export type InsertLevelAssessmentQuestion = z.infer<typeof insertLevelAssessmentQuestionSchema>;
export type LevelAssessmentResult = typeof levelAssessmentResults.$inferSelect;
export type InsertLevelAssessmentResult = z.infer<typeof insertLevelAssessmentResultSchema>;
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;

// CRM Types
export type Institute = typeof institutes.$inferSelect;
export type InsertInstitute = z.infer<typeof insertInstituteSchema>;
// Branding type aliases (used in storage layer)
export type InstituteBranding = Institute;
export type InsertBranding = InsertInstitute;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type StudentGroup = typeof studentGroups.$inferSelect;
export type InsertStudentGroup = z.infer<typeof insertStudentGroupSchema>;
export type StudentGroupMember = typeof studentGroupMembers.$inferSelect;
export type InsertStudentGroupMember = z.infer<typeof insertStudentGroupMemberSchema>;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type StudentNote = typeof studentNotes.$inferSelect;
export type InsertStudentNote = z.infer<typeof insertStudentNoteSchema>;
export type ParentGuardian = typeof parentGuardians.$inferSelect;
export type InsertParentGuardian = z.infer<typeof insertParentGuardianSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
export type StudentReport = typeof studentReports.$inferSelect;
export type InsertStudentReport = z.infer<typeof insertStudentReportSchema>;

// Admin Settings table

// Admin settings schema - temporarily commented out
// export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true, createdAt: true, updatedAt: true });

// Referral System Types
export type ReferralSettings = typeof referralSettings.$inferSelect;
export type InsertReferralSettings = z.infer<typeof insertReferralSettingsSchema>;
export type CourseReferral = typeof courseReferrals.$inferSelect;
export type InsertCourseReferral = z.infer<typeof insertCourseReferralSchema>;
export type ReferralCommission = typeof referralCommissions.$inferSelect;
export type InsertReferralCommission = z.infer<typeof insertReferralCommissionSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;

// AI Training Data Types
export type AiTrainingData = typeof aiTrainingData.$inferSelect;
export type InsertAiTrainingData = z.infer<typeof insertAiTrainingDataSchema>;
export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAiKnowledgeBase = z.infer<typeof insertAiKnowledgeBaseSchema>;

// Skill Assessment Types
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = z.infer<typeof insertSkillAssessmentSchema>;
export type LearningActivity = typeof learningActivities.$inferSelect;
export type InsertLearningActivity = z.infer<typeof insertLearningActivitySchema>;
export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;
export type InsertProgressSnapshot = z.infer<typeof insertProgressSnapshotSchema>;

// Additional Real Data System Types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type TeacherEvaluation = typeof teacherEvaluations.$inferSelect;
export type InsertTeacherEvaluation = z.infer<typeof insertTeacherEvaluationSchema>;
export type ClassObservation = typeof classObservations.$inferSelect;
export type InsertClassObservation = z.infer<typeof insertClassObservationSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type MentorAssignment = typeof mentorAssignments.$inferSelect;
export type InsertMentorAssignment = z.infer<typeof insertMentorAssignmentSchema>;
export type MentoringSession = typeof mentoringSessions.$inferSelect;
export type InsertMentoringSession = z.infer<typeof insertMentoringSessionSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

// Import mood tables from separate schema file to avoid duplication
export { 
  moodEntries, 
  moodRecommendations, 
  learningAdaptations,
  insertMoodEntrySchema,
  insertMoodRecommendationSchema,
  insertLearningAdaptationSchema,
  type MoodEntry,
  type InsertMoodEntry,
  type MoodRecommendation,
  type InsertMoodRecommendation,
  type LearningAdaptation,
  type InsertLearningAdaptation
} from "./mood-schema";

// Testing subsystem insert schemas - temporarily commented out
// export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, createdAt: true });
// export const insertTestAnswerSchema = createInsertSchema(testAnswers).omit({ id: true, answeredAt: true });

// Gamification insert schemas - temporarily commented out
// export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameLevelSchema = createInsertSchema(gameLevels).omit({ id: true, createdAt: true });
// export const insertUserGameProgressSchema = createInsertSchema(userGameProgress).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, startedAt: true, createdAt: true });
// export const insertGameLeaderboardSchema = createInsertSchema(gameLeaderboards).omit({ id: true, createdAt: true });

// Video learning insert schemas - temporarily commented out
// export const insertVideoLessonSchema = createInsertSchema(videoLessons).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoNoteSchema = createInsertSchema(videoNotes).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoBookmarkSchema = createInsertSchema(videoBookmarks).omit({ id: true, createdAt: true });

// LMS insert schemas - temporarily commented out
// export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({ id: true, createdAt: true });
// export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true });
// export const insertGradebookEntrySchema = createInsertSchema(gradebookEntries).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({ id: true, createdAt: true, updatedAt: true });

// AI tracking insert schemas - temporarily commented out
// export const insertAiProgressTrackingSchema = createInsertSchema(aiProgressTracking).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertAiActivitySessionSchema = createInsertSchema(aiActivitySessions).omit({ id: true, startedAt: true, createdAt: true });
// export const insertAiVocabularyTrackingSchema = createInsertSchema(aiVocabularyTracking).omit({ id: true, firstSeenAt: true, createdAt: true });
// export const insertAiGrammarTrackingSchema = createInsertSchema(aiGrammarTracking).omit({ id: true, createdAt: true });
// export const insertAiPronunciationAnalysisSchema = createInsertSchema(aiPronunciationAnalysis).omit({ id: true, createdAt: true });

// Types for new subsystem tables
export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = z.infer<typeof insertTestQuestionSchema>;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;
export type TestAnswer = typeof testAnswers.$inferSelect;
export type InsertTestAnswer = z.infer<typeof insertTestAnswerSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameLevel = typeof gameLevels.$inferSelect;
export type InsertGameLevel = z.infer<typeof insertGameLevelSchema>;
export type UserGameProgress = typeof userGameProgress.$inferSelect;
export type InsertUserGameProgress = z.infer<typeof insertUserGameProgressSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameLeaderboard = typeof gameLeaderboards.$inferSelect;
export type InsertGameLeaderboard = z.infer<typeof insertGameLeaderboardSchema>;

export type VideoLesson = typeof videoLessons.$inferSelect;
export type InsertVideoLesson = z.infer<typeof insertVideoLessonSchema>;
export type VideoProgress = typeof videoProgress.$inferSelect;
export type InsertVideoProgress = z.infer<typeof insertVideoProgressSchema>;
export type VideoNote = typeof videoNotes.$inferSelect;
export type InsertVideoNote = z.infer<typeof insertVideoNoteSchema>;
export type VideoBookmark = typeof videoBookmarks.$inferSelect;
export type InsertVideoBookmark = z.infer<typeof insertVideoBookmarkSchema>;

export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type GradebookEntry = typeof gradebookEntries.$inferSelect;
export type InsertGradebookEntry = z.infer<typeof insertGradebookEntrySchema>;
export type ContentLibraryItem = typeof contentLibrary.$inferSelect;
export type InsertContentLibraryItem = z.infer<typeof insertContentLibrarySchema>;

export type AiProgressTracking = typeof aiProgressTracking.$inferSelect;
export type InsertAiProgressTracking = z.infer<typeof insertAiProgressTrackingSchema>;
export type AiActivitySession = typeof aiActivitySessions.$inferSelect;
export type InsertAiActivitySession = z.infer<typeof insertAiActivitySessionSchema>;
export type AiVocabularyTracking = typeof aiVocabularyTracking.$inferSelect;
export type InsertAiVocabularyTracking = z.infer<typeof insertAiVocabularyTrackingSchema>;
export type AiGrammarTracking = typeof aiGrammarTracking.$inferSelect;
export type InsertAiGrammarTracking = z.infer<typeof insertAiGrammarTrackingSchema>;
export type AiPronunciationAnalysis = typeof aiPronunciationAnalysis.$inferSelect;
export type InsertAiPronunciationAnalysis = z.infer<typeof insertAiPronunciationAnalysisSchema>;

// ===== MODERN COMMUNICATION SYSTEM =====

// Support Tickets

// Support Ticket Messages

// Chat Conversations

// Chat Messages

// AI Study Partner Configuration

// Push Notifications

// Notification Delivery Logs

// Insert schemas for communication system







// Communication system types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = z.infer<typeof insertSupportTicketMessageSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type AiStudyPartner = typeof aiStudyPartners.$inferSelect;
export type InsertAiStudyPartner = z.infer<typeof insertAiStudyPartnerSchema>;
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
export type NotificationDeliveryLog = typeof notificationDeliveryLogs.$inferSelect;
export type InsertNotificationDeliveryLog = z.infer<typeof insertNotificationDeliveryLogSchema>;

// AI Call Insights Table for CRM Integration

// Teacher Availability Table (DEPRECATED)
// This table is kept only for compatibility views during migration
// DO NOT use directly - all new code should use teacherAvailabilityPeriods

// Teacher Availability Periods - CANONICAL SOURCE for teacher availability
// This is the single source of truth for all teacher availability data

// Teacher Availability Schema (Legacy)

export type TeacherAvailability = typeof teacherAvailability.$inferSelect;
export type InsertTeacherAvailability = z.infer<typeof insertTeacherAvailabilitySchema>;

// Enhanced Teacher Availability Periods Schema

export type TeacherAvailabilityPeriod = typeof teacherAvailabilityPeriods.$inferSelect;
export type InsertTeacherAvailabilityPeriod = z.infer<typeof insertTeacherAvailabilityPeriodSchema>;

// AI Call Insights Schema

export type AICallInsight = typeof aiCallInsights.$inferSelect;
export type InsertAICallInsight = z.infer<typeof insertAICallInsightSchema>;

// Supervision observation types (continued)
export type TeacherObservationResponse = typeof teacherObservationResponses.$inferSelect;
export type InsertTeacherObservationResponse = z.infer<typeof insertTeacherObservationResponseSchema>;
export type ScheduledObservation = typeof scheduledObservations.$inferSelect;
export type InsertScheduledObservation = z.infer<typeof insertScheduledObservationSchema>;

// ===== CALLERN LIVE SCORING SYSTEM =====

// Track camera/mic presence for scoring

// Speech segments from ASR processing

// Student scoring for each lesson

// Teacher scoring for each lesson

// Real-time scoring events

// Insert schemas for scoring





// Scoring types
export type CallernPresence = typeof callernPresence.$inferSelect;
export type InsertCallernPresence = z.infer<typeof insertCallernPresenceSchema>;
export type CallernSpeechSegment = typeof callernSpeechSegments.$inferSelect;
export type InsertCallernSpeechSegment = z.infer<typeof insertCallernSpeechSegmentSchema>;
export type CallernScoresStudent = typeof callernScoresStudent.$inferSelect;
export type InsertCallernScoresStudent = z.infer<typeof insertCallernScoresStudentSchema>;
export type CallernScoresTeacher = typeof callernScoresTeacher.$inferSelect;
export type InsertCallernScoresTeacher = z.infer<typeof insertCallernScoresTeacherSchema>;
export type CallernScoringEvent = typeof callernScoringEvents.$inferSelect;
export type InsertCallernScoringEvent = z.infer<typeof insertCallernScoringEventSchema>;

// ========================
// CALLERN ROADMAP TEMPLATE SYSTEM (New Implementation)
// ========================

// Roadmap Templates - Reusable learning path definitions

// Roadmap Units - Major sections within a template

// Roadmap Lessons - Individual lessons within units

// Roadmap Activities - Specific activities within lessons

// ========================
// ROADMAP INSTANCES & PROGRESS
// ========================

// Roadmap Instances - Instantiated roadmaps for courses/students

// Activity Instances - Individual activity instances with progress

// ========================
// CALLERN SESSION SYSTEM
// ========================

// CallerN Call Sessions - Actual video call sessions

// Post-Session Reports - Teacher confirmations and AI summaries

// Session Ratings - Student and teacher ratings

// ========================
// SRS (SPACED REPETITION SYSTEM)
// ========================

// SRS Cards - Spaced repetition flashcards

// ========================
// SPECIAL CLASSES SYSTEM
// ========================

// Special Classes - admin-flagged featured classes for dashboard showcase

// ========================
// PEER SOCIALIZER SYSTEM
// ========================

// Peer Socializer Groups/Rooms for language practice

// Peer Socializer Participants - tracks who joins which groups

// Peer Matching Requests - for intelligent matching system

// Peer Matching History - tracks successful matches and quality

// Peer Socializer Settings - user preferences for matching

// ========================
// INSERT SCHEMAS AND TYPES
// ========================

// Roadmap Template System Insert Schemas






// CallerN Session System Insert Schemas




// Special Classes System Insert Schemas  

// Peer Socializer System Insert Schemas





// Missing insert schemas for tables identified in consolidation









// ========================
// TYPE EXPORTS
// ========================

// Roadmap Template System Types
export type RoadmapTemplate = typeof roadmapTemplate.$inferSelect;
export type InsertRoadmapTemplate = z.infer<typeof insertRoadmapTemplateSchema>;
export type RoadmapUnit = typeof roadmapUnit.$inferSelect;
export type InsertRoadmapUnit = z.infer<typeof insertRoadmapUnitSchema>;
export type RoadmapLesson = typeof roadmapLesson.$inferSelect;
export type InsertRoadmapLesson = z.infer<typeof insertRoadmapLessonSchema>;
export type RoadmapActivity = typeof roadmapActivity.$inferSelect;
export type InsertRoadmapActivity = z.infer<typeof insertRoadmapActivitySchema>;
export type RoadmapInstance = typeof roadmapInstance.$inferSelect;
export type InsertRoadmapInstance = z.infer<typeof insertRoadmapInstanceSchema>;
export type ActivityInstance = typeof activityInstance.$inferSelect;
export type InsertActivityInstance = z.infer<typeof insertActivityInstanceSchema>;

// CallerN Session System Types
export type CallSession = typeof callSession.$inferSelect;
export type InsertCallSession = z.infer<typeof insertCallSessionSchema>;
export type CallPostReport = typeof callPostReport.$inferSelect;
export type InsertCallPostReport = z.infer<typeof insertCallPostReportSchema>;
export type SessionRatings = typeof sessionRatings.$inferSelect;
export type InsertSessionRatings = z.infer<typeof insertSessionRatingsSchema>;
export type SrsCard = typeof srsCard.$inferSelect;
export type InsertSrsCard = z.infer<typeof insertSrsCardSchema>;

// Course Roadmap Progress types (fixed)
export type CourseRoadmapProgress = typeof courseRoadmapProgress.$inferSelect;
export type InsertCourseRoadmapProgress = z.infer<typeof insertCourseRoadmapProgressSchema>;

// Special Classes System Types
export type SpecialClass = typeof specialClasses.$inferSelect;
export type InsertSpecialClass = z.infer<typeof insertSpecialClassSchema>;

// Peer Socializer System Types
export type PeerSocializerGroup = typeof peerSocializerGroups.$inferSelect;
export type InsertPeerSocializerGroup = z.infer<typeof insertPeerSocializerGroupSchema>;
export type PeerSocializerParticipant = typeof peerSocializerParticipants.$inferSelect;
export type InsertPeerSocializerParticipant = z.infer<typeof insertPeerSocializerParticipantSchema>;
export type PeerMatchingRequest = typeof peerMatchingRequests.$inferSelect;
export type InsertPeerMatchingRequest = z.infer<typeof insertPeerMatchingRequestSchema>;
export type PeerMatchingHistory = typeof peerMatchingHistory.$inferSelect;
export type InsertPeerMatchingHistory = z.infer<typeof insertPeerMatchingHistorySchema>;
export type PeerSocializerSettings = typeof peerSocializerSettings.$inferSelect;
export type InsertPeerSocializerSettings = z.infer<typeof insertPeerSocializerSettingsSchema>;

// Class Group Chats - Telegram-like environment for group classes

// Socializer Sessions - Track AI matching for CallernN

// Create insert schemas


// Export types
export type ClassGroupChat = typeof classGroupChats.$inferSelect;
export type InsertClassGroupChat = z.infer<typeof insertClassGroupChatSchema>;
export type SocializerSession = typeof socializerSessions.$inferSelect;
export type InsertSocializerSession = z.infer<typeof insertSocializerSessionSchema>;

// ============================================================================
// EXAM-FOCUSED PERSONALIZED ROADMAP SYSTEM
// ============================================================================

// Exam Types and Enums
export const ExamType = {
  IELTS_ACADEMIC: 'IELTS_ACADEMIC',
  IELTS_GENERAL: 'IELTS_GENERAL',
  TOEFL_IBT: 'TOEFL_IBT',
  PTE_ACADEMIC: 'PTE_ACADEMIC',
  PTE_CORE: 'PTE_CORE'
} as const;

export type ExamTypeValues = typeof ExamType[keyof typeof ExamType];


export type CEFRLevelValues = typeof CEFRLevel[keyof typeof CEFRLevel];


export type PreferredPaceValues = typeof PreferredPace[keyof typeof PreferredPace];


export type SessionTypeValues = typeof SessionType[keyof typeof SessionType];

// Roadmap Configurations - User exam goals and preferences

// Roadmap Plans - Generated study plans based on user goals

// Roadmap Sessions - Individual study sessions within the plan

// ============================================================================
// SCORE MAPPING AND CONVERSION DATA
// ============================================================================

// IELTS Score to CEFR Mapping (Academic & General)

// TOEFL iBT Score to CEFR Mapping

// PTE Academic Score to CEFR Mapping

// Study Hours Required for CEFR Level Progression

// Base study hours by current level (to reach next level)

// ============================================================================
// HELPER FUNCTIONS FOR SCORE CONVERSION
// ============================================================================

/**
 * Convert exam score to CEFR level
 */
export function examScoreToCEFR(examType: ExamTypeValues, score: number): CEFRLevelValues {
  switch (examType) {
    case ExamType.IELTS_ACADEMIC:
    case ExamType.IELTS_GENERAL:
      // Find the closest IELTS score
      const ieltsScore = Math.round(score * 2) / 2; // Round to nearest 0.5
      return IELTS_TO_CEFR_MAPPING[ieltsScore] || 'B1';

    case ExamType.TOEFL_IBT:
      // Find TOEFL range
      if (score <= 31) return 'A1';
      if (score <= 41) return 'A2'; 
      if (score <= 71) return 'B1';
      if (score <= 94) return 'B2';
      if (score <= 112) return 'C1';
      return 'C2';

    case ExamType.PTE_ACADEMIC:
    case ExamType.PTE_CORE:
      // Find PTE range
      if (score <= 29) return 'A1';
      if (score <= 35) return 'A2';
      if (score <= 49) return 'B1';
      if (score <= 64) return 'B2';
      if (score <= 78) return 'C1';
      return 'C2';

    default:
      return 'B1'; // Default fallback
  }
}

/**
 * Calculate required study hours based on current and target CEFR levels
 */
export function calculateRequiredHours(currentLevel: CEFRLevelValues, targetLevel: CEFRLevelValues): number {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levels.indexOf(currentLevel);
  const targetIndex = levels.indexOf(targetLevel);

  if (currentIndex >= targetIndex) {
    return 0; // Already at or above target level
  }

  let totalHours = 0;
  for (let i = currentIndex; i < targetIndex; i++) {
    const currentLevelKey = levels[i] as keyof typeof BASE_HOURS_BY_LEVEL;
    totalHours += BASE_HOURS_BY_LEVEL[currentLevelKey] || 100;
  }

  return totalHours;
}

/**
 * Calculate sessions per week based on available hours and session duration
 */
export function calculateSessionsPerWeek(weeklyHours: number, sessionDurationMinutes: number): number {
  const sessionHours = sessionDurationMinutes / 60;
  return Math.floor(weeklyHours / sessionHours);
}

/**
 * Get minimum recommended score for CEFR level by exam type
 */
export function getMinimumScoreForCEFR(examType: ExamTypeValues, cefrLevel: CEFRLevelValues): number {
  switch (examType) {
    case ExamType.IELTS_ACADEMIC:
    case ExamType.IELTS_GENERAL:
      const ieltsMapping = {
        'A1': 1.0, 'A2': 3.5, 'B1': 4.5, 'B2': 5.5, 'C1': 6.5, 'C2': 8.0
      };
      return ieltsMapping[cefrLevel] || 4.5;

    case ExamType.TOEFL_IBT:
      const toeflMapping = {
        'A1': 0, 'A2': 32, 'B1': 42, 'B2': 72, 'C1': 95, 'C2': 113
      };
      return toeflMapping[cefrLevel] || 42;

    case ExamType.PTE_ACADEMIC:
    case ExamType.PTE_CORE:
      const pteMapping = {
        'A1': 10, 'A2': 30, 'B1': 36, 'B2': 50, 'C1': 65, 'C2': 79
      };
      return pteMapping[cefrLevel] || 36;

    default:
      return 0;
  }
}

// ============================================================================
// PLACEMENT TEST SYSTEM TABLES
// ============================================================================

// Placement Tests - Master test definitions

// Placement Questions - Question bank for placement tests


// Insert schema for AI conversations

// AI Conversation types
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;


// ============================================================================
// MST (Multi-Stage Test) Schema
// ============================================================================




// MST Insert Schemas

// MST Types



// User Sessions for authentication

// Password Reset Tokens

// ============================================================================
// CURRICULUM SYSTEM TABLES
// ============================================================================

// Main curriculum tracks (IELTS and Conversation)

// Curriculum levels (Flash IELTS 1, A1.1, A1.2, etc.)

// Links courses to curriculum levels (many-to-many relationship)

// Student progress through curriculum levels

// Course enrollments

// Rooms table for physical and virtual classrooms

// Classes - Specific instances of courses with teacher and schedule

// Class Enrollments (links students to specific classes)

// Course Sessions - Individual sessions within a class

// Tutoring sessions

// Session Video Progress Tracking

// Session Video Notes

// Session Video Bookmarks

// Messages between users

// Homework assignments - Enhanced with more fields

// Payment transactions with enhanced Shetab integration

// Legacy admin settings removed - using comprehensive version below

// Session Packages for Private Students

// Callern Video Call Packages

// Callern Package Roadmaps - Defines learning paths for each package

// Callern Roadmap Steps - Individual lessons/steps in a roadmap

// Student progress through roadmap steps

// Course Roadmap Progress - Track student progress through course roadmaps 

// Student Callern Packages (purchased packages)

// Teacher Callern Authorization - Controls who can access Callern dashboard

// Teacher Callern Availability

// Callern Call History (extended for new features)

// Callern Syllabus Topics

// Student Callern Progress

// ===== NEW CALLERN ENHANCEMENT TABLES =====

// Suggested Terms (vocabulary suggestions during calls)

// Rewrite Suggestions (improved versions of student utterances)

// Glossary Items (student's personal vocabulary collection)

// Quiz Results (for SRS vocabulary testing)

// Email Logs (for tracking sent emails)

// Audit Log for tracking all sensitive operations

// Student Preferences for feature toggles

// Wallet Transactions for incremental top-ups

// Course Enrollment Payments (direct payments for courses)

// Enhanced Notifications for Role-Based System



// Custom Roles and Permissions System

// Gamification System




// Level assessment questions - managed by admins/managers

// User level assessment results

// CRM Management Tables










// Insert schemas - temporarily commented out due to drizzle-zod compatibility issues
// TODO: Fix drizzle-zod integration
// export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
// export const insertUserSessionSchema = createInsertSchema(userSessions);
// export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true });
// Holidays table for managing institute holidays (used for class end date calculation)

// export const insertClassSchema = createInsertSchema(classes);
// export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments);
// export const insertHolidaySchema = createInsertSchema(holidays);
// export const insertEnrollmentSchema = createInsertSchema(enrollments);
// export const insertSessionVideoProgressSchema = createInsertSchema(sessionVideoProgress);
// export const insertSessionVideoNotesSchema = createInsertSchema(sessionVideoNotes);
// export const insertSessionVideoBookmarksSchema = createInsertSchema(sessionVideoBookmarks);
// export const insertHomeworkSchema = createInsertSchema(homework);
// Admin settings schema defined below with comprehensive version




// Lead schema moved to after table definition to avoid forward reference

// CRM Insert Schemas








// Communication log schema moved to end of file


// Referral Settings - User-defined commission split preferences

// Course Referrals - Track specific course referrals

// Referral Commissions - Track and manage commission payouts

// AI Training Data Storage

// Skill Assessment Tracking

// Learning Activities Tracking

// Progress Snapshots for Historical Tracking

// AI Knowledge Base - Processed training data ready for retrieval

// AI Model Management

// AI Training Jobs

// AI Training Datasets

// AI Dataset Items (linking datasets to training data)

// Referral system insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS
// AI Model Management schemas - MOVED TO END OF FILE

// AI Training types

// Skill tracking insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS

// LEAD MANAGEMENT SYSTEM (Call Center)

// Insert schema for leads

// Lead types

// COMMUNICATION LOGS (Call Center)

// Insert schema for communication logs

// FINANCIAL SYSTEM (Accountant)

// Insert schema for invoices

// PAYMENT TRANSACTIONS (Iranian Shetab Integration)

// Insert schema for payment transactions

// ===== COMPREHENSIVE TESTING SUBSYSTEM =====

// Tests/Quizzes

// Test Questions - supports 8 question types

// Test Attempts

// Test Answers

// ===== GAMIFICATION SUBSYSTEM =====

// Language Learning Games

// Game Levels/Stages

// User Game Progress

// Game Sessions

// Game Leaderboards

// Game Access Rules - Define automatic rules for game visibility

// Student Game Assignments - Direct assignment of games to students

// Course Games - Associate games with courses

// Game Questions Table - Stores actual game content

// Daily Challenges Table

// User Daily Challenge Progress

// Game Answer Logs - Track every answer for analytics

// Insert schemas for game system




// Game system types

// ===== VIDEO-BASED COURSES SUBSYSTEM =====

// Video Lessons

// Video Progress Tracking

// Video Notes

// Video Bookmarks

// ===== ENHANCED LMS FEATURES =====

// Discussion Forums



// Gradebook

// Content Library

// ===== AI INTEGRATION FOR COMPREHENSIVE TRACKING =====

// AI Progress Tracking

// AI Activity Sessions

// AI Vocabulary Tracking

// AI Grammar Pattern Tracking

// AI Pronunciation Analysis

// TEACHER EVALUATIONS (Supervisor)

// Insert schema for teacher evaluations

// CLASS OBSERVATIONS (Supervisor)

// Insert schema for class observations

// SYSTEM METRICS (Admin)

// Insert schema for system metrics

// MENTOR ASSIGNMENTS (Mentor Dashboard)

// MENTORING SESSIONS 

// Insert schemas for mentor assignments and mentoring sessions


// BRANCHES - Institute branch management

// Insert schema for branches and rooms

// Types

// CRM Types
// Branding type aliases (used in storage layer)

// Admin Settings table

// Admin settings schema - temporarily commented out
// export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true, createdAt: true, updatedAt: true });

// Referral System Types

// AI Training Data Types

// Skill Assessment Types

// Additional Real Data System Types

// Testing subsystem insert schemas - temporarily commented out
// export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, createdAt: true });
// export const insertTestAnswerSchema = createInsertSchema(testAnswers).omit({ id: true, answeredAt: true });

// Gamification insert schemas - temporarily commented out
// export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameLevelSchema = createInsertSchema(gameLevels).omit({ id: true, createdAt: true });
// export const insertUserGameProgressSchema = createInsertSchema(userGameProgress).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, startedAt: true, createdAt: true });
// export const insertGameLeaderboardSchema = createInsertSchema(gameLeaderboards).omit({ id: true, createdAt: true });

// Video learning insert schemas - temporarily commented out
// export const insertVideoLessonSchema = createInsertSchema(videoLessons).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoNoteSchema = createInsertSchema(videoNotes).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoBookmarkSchema = createInsertSchema(videoBookmarks).omit({ id: true, createdAt: true });

// LMS insert schemas - temporarily commented out
// export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({ id: true, createdAt: true });
// export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true });
// export const insertGradebookEntrySchema = createInsertSchema(gradebookEntries).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({ id: true, createdAt: true, updatedAt: true });

// AI tracking insert schemas - temporarily commented out
// export const insertAiProgressTrackingSchema = createInsertSchema(aiProgressTracking).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertAiActivitySessionSchema = createInsertSchema(aiActivitySessions).omit({ id: true, startedAt: true, createdAt: true });
// export const insertAiVocabularyTrackingSchema = createInsertSchema(aiVocabularyTracking).omit({ id: true, firstSeenAt: true, createdAt: true });
// export const insertAiGrammarTrackingSchema = createInsertSchema(aiGrammarTracking).omit({ id: true, createdAt: true });
// export const insertAiPronunciationAnalysisSchema = createInsertSchema(aiPronunciationAnalysis).omit({ id: true, createdAt: true });

// Types for new subsystem tables





// ===== MODERN COMMUNICATION SYSTEM =====

// Support Tickets

// Support Ticket Messages

// Chat Conversations

// Chat Messages

// AI Study Partner Configuration

// Push Notifications

// Notification Delivery Logs

// Insert schemas for communication system







// Communication system types

// AI Call Insights Table for CRM Integration

// Teacher Availability Table (DEPRECATED)
// This table is kept only for compatibility views during migration
// DO NOT use directly - all new code should use teacherAvailabilityPeriods

// Teacher Availability Periods - CANONICAL SOURCE for teacher availability
// This is the single source of truth for all teacher availability data

// Teacher Availability Schema (Legacy)


// Enhanced Teacher Availability Periods Schema


// AI Call Insights Schema


// Supervision observation types (continued)

// ===== CALLERN LIVE SCORING SYSTEM =====

// Track camera/mic presence for scoring

// Speech segments from ASR processing

// Student scoring for each lesson

// Teacher scoring for each lesson

// Real-time scoring events

// Insert schemas for scoring





// Scoring types

// ========================
// CALLERN ROADMAP TEMPLATE SYSTEM (New Implementation)
// ========================

// Roadmap Templates - Reusable learning path definitions

// Roadmap Units - Major sections within a template

// Roadmap Lessons - Individual lessons within units

// Roadmap Activities - Specific activities within lessons

// ========================
// ROADMAP INSTANCES & PROGRESS
// ========================

// Roadmap Instances - Instantiated roadmaps for courses/students

// Activity Instances - Individual activity instances with progress

// ========================
// CALLERN SESSION SYSTEM
// ========================

// CallerN Call Sessions - Actual video call sessions

// Post-Session Reports - Teacher confirmations and AI summaries

// Session Ratings - Student and teacher ratings

// ========================
// SRS (SPACED REPETITION SYSTEM)
// ========================

// SRS Cards - Spaced repetition flashcards

// ========================
// SPECIAL CLASSES SYSTEM
// ========================

// Special Classes - admin-flagged featured classes for dashboard showcase

// ========================
// PEER SOCIALIZER SYSTEM
// ========================

// Peer Socializer Groups/Rooms for language practice

// Peer Socializer Participants - tracks who joins which groups

// Peer Matching Requests - for intelligent matching system

// Peer Matching History - tracks successful matches and quality

// Peer Socializer Settings - user preferences for matching

// ========================
// INSERT SCHEMAS AND TYPES
// ========================

// Roadmap Template System Insert Schemas






// CallerN Session System Insert Schemas




// Special Classes System Insert Schemas  

// Peer Socializer System Insert Schemas





// Missing insert schemas for tables identified in consolidation









// ========================
// TYPE EXPORTS
// ========================

// Roadmap Template System Types

// CallerN Session System Types

// Course Roadmap Progress types (fixed)

// Special Classes System Types

// Peer Socializer System Types

// Class Group Chats - Telegram-like environment for group classes

// Socializer Sessions - Track AI matching for CallernN

// Create insert schemas


// Export types

// ============================================================================
// EXAM-FOCUSED PERSONALIZED ROADMAP SYSTEM
// ============================================================================

// Exam Types and Enums








// Roadmap Configurations - User exam goals and preferences

// Roadmap Plans - Generated study plans based on user goals

// Roadmap Sessions - Individual study sessions within the plan

// ============================================================================
// SCORE MAPPING AND CONVERSION DATA
// ============================================================================

// IELTS Score to CEFR Mapping (Academic & General)

// TOEFL iBT Score to CEFR Mapping

// PTE Academic Score to CEFR Mapping

// Study Hours Required for CEFR Level Progression

// Base study hours by current level (to reach next level)

// ============================================================================
// HELPER FUNCTIONS FOR SCORE CONVERSION
// ============================================================================

/**
 * Convert exam score to CEFR level
 */

/**
 * Calculate required study hours based on current and target CEFR levels
 */

/**
 * Calculate sessions per week based on available hours and session duration
 */

/**
 * Get minimum recommended score for CEFR level by exam type
 */

// ============================================================================
// PLACEMENT TEST SYSTEM TABLES
// ============================================================================

// Placement Tests - Master test definitions

// Placement Questions - Question bank for placement tests

// Placement Test Sessions - Individual test attempts (matches actual database structure)

// Placement Results - Final placement recommendations

// Insert schemas for placement test system

// Types for placement test system
export type PlacementTest = typeof placementTests.$inferSelect;
export type InsertPlacementTest = z.infer<typeof insertPlacementTestSchema>;
export type PlacementQuestion = typeof placementQuestions.$inferSelect;
export type InsertPlacementQuestion = z.infer<typeof insertPlacementQuestionSchema>;
export type PlacementTestSession = typeof placementTestSessions.$inferSelect;
export type InsertPlacementTestSession = z.infer<typeof insertPlacementTestSessionSchema>;
export type PlacementResult = typeof placementResults.$inferSelect;
export type InsertPlacementResult = z.infer<typeof insertPlacementResultSchema>;

// ============================================================================
// ZOD SCHEMAS FOR EXAM-FOCUSED ROADMAP TABLES
// ============================================================================




// Type exports for exam-focused roadmap system
export type RoadmapConfig = typeof roadmapConfigs.$inferSelect;
export type RoadmapConfigInsert = z.infer<typeof roadmapConfigInsertSchema>;
export type RoadmapPlan = typeof roadmapPlans.$inferSelect;
export type RoadmapPlanInsert = z.infer<typeof roadmapPlanInsertSchema>;
export type RoadmapSession = typeof roadmapSessions.$inferSelect; 
export type RoadmapSessionInsert = z.infer<typeof roadmapSessionInsertSchema>;

// Legacy naming compatibility for storage layer
export type InsertRoadmapPlan = RoadmapPlanInsert;
export type InsertRoadmapSession = RoadmapSessionInsert;

// Placement test schemas and types exported above

// ============================================================================
// UNIFIED TASK-BASED LEARNING TRACKS SCHEMA
// ============================================================================

// Learning Tracks - Consolidated main container for all roadmap systems

// Track Sub-levels - Fine-grained level divisions (A1.1, A1.2, etc.)

// Track Sessions - Individual sessions within sublevels with exam support

// Track Tasks - Individual tasks with skill-based time allocations

// User Track Enrollments - Student enrollment and progress tracking

// User Task Progress - Detailed task completion with time and scores

// User Sublevel Progress - Aggregated progress for charts and overviews

// Track Assessment Rules - Exam and assessment configuration

// Adaptation Profiles - AI personalization profiles for each enrollment

// Adaptation Events - AI adaptation history and triggered changes

// Task Generation Requests - One-button generation tracking with anti-plagiarism

// ============================================================================
// BOOK E-COMMERCE SYSTEM SCHEMA
// ============================================================================

// Book categories with hierarchical structure

// Books table with pricing and availability

// Book assets (additional files, images, etc.)

// Dictionary lookups for language learning

// Shopping carts

// Cart items

// Orders

// Order items

// User addresses for shipping

// Shipping orders

// Courier tracking updates

// ============================================================================
// UNIFIED SCHEMA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all unified track tables

// Type exports for all unified track tables
export type LearningTrack = typeof learningTracks.$inferSelect;
export type LearningTrackInsert = z.infer<typeof insertLearningTrackSchema>;
export type TrackSublevel = typeof trackSublevels.$inferSelect;
export type TrackSublevelInsert = z.infer<typeof insertTrackSublevelSchema>;
export type TrackSession = typeof trackSessions.$inferSelect;
export type TrackSessionInsert = z.infer<typeof insertTrackSessionSchema>;
export type TrackTask = typeof trackTasks.$inferSelect;
export type TrackTaskInsert = z.infer<typeof insertTrackTaskSchema>;
export type UserTrackEnrollment = typeof userTrackEnrollments.$inferSelect;
export type UserTrackEnrollmentInsert = z.infer<typeof insertUserTrackEnrollmentSchema>;
export type UserTaskProgress = typeof userTaskProgress.$inferSelect;
export type UserTaskProgressInsert = z.infer<typeof insertUserTaskProgressSchema>;
export type UserSublevelProgress = typeof userSublevelProgress.$inferSelect;
export type UserSublevelProgressInsert = z.infer<typeof insertUserSublevelProgressSchema>;
export type TrackAssessmentRule = typeof trackAssessmentRules.$inferSelect;
export type TrackAssessmentRuleInsert = z.infer<typeof insertTrackAssessmentRuleSchema>;
export type AdaptationProfile = typeof adaptationProfiles.$inferSelect;
export type AdaptationProfileInsert = z.infer<typeof insertAdaptationProfileSchema>;
export type AdaptationEvent = typeof adaptationEvents.$inferSelect;
export type AdaptationEventInsert = z.infer<typeof insertAdaptationEventSchema>;
export type TaskGenerationRequest = typeof taskGenerationRequests.$inferSelect;
export type TaskGenerationRequestInsert = z.infer<typeof insertTaskGenerationRequestSchema>;

// ============================================================================
// UNIVERSAL SEARCH SYSTEM
// ============================================================================

// Search History - tracks user search queries for personalization and analytics

// Search Analytics - aggregate search data and metrics

// Trending Searches - track trending and suggested search terms

// Search Suggestions - AI-enhanced search suggestions and autocomplete

// Search Index - cached search results for performance

// ============================================================================
// BOOK E-COMMERCE SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all book e-commerce tables

// Type exports for all book e-commerce tables
export type BookCategory = typeof book_categories.$inferSelect;
export type BookCategoryInsert = z.infer<typeof insertBookCategorySchema>;
export type Book = typeof books.$inferSelect;
export type BookInsert = z.infer<typeof insertBookSchema>;
export type BookAsset = typeof book_assets.$inferSelect;
export type BookAssetInsert = z.infer<typeof insertBookAssetSchema>;
export type BookOrder = typeof book_orders.$inferSelect;
export type BookOrderInsert = z.infer<typeof insertBookOrderSchema>;
export type DictionaryLookup = typeof dictionary_lookups.$inferSelect;
export type DictionaryLookupInsert = z.infer<typeof insertDictionaryLookupSchema>;
export type Cart = typeof carts.$inferSelect;
export type CartInsert = z.infer<typeof insertCartSchema>;
export type CartItem = typeof cart_items.$inferSelect;
export type CartItemInsert = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type OrderInsert = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof order_items.$inferSelect;
export type OrderItemInsert = z.infer<typeof insertOrderItemSchema>;
export type UserAddress = typeof user_addresses.$inferSelect;
export type UserAddressInsert = z.infer<typeof insertUserAddressSchema>;
export type ShippingOrder = typeof shipping_orders.$inferSelect;
export type ShippingOrderInsert = z.infer<typeof insertShippingOrderSchema>;
export type CourierTracking = typeof courier_tracking.$inferSelect;
export type CourierTrackingInsert = z.infer<typeof insertCourierTrackingSchema>;

// ============================================================================
// UNIVERSAL SEARCH SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all search-related tables

// Type exports for all search-related tables
export type SearchHistory = typeof searchHistory.$inferSelect;
export type SearchHistoryInsert = z.infer<typeof insertSearchHistorySchema>;
export type SearchAnalytics = typeof searchAnalytics.$inferSelect;
export type SearchAnalyticsInsert = z.infer<typeof insertSearchAnalyticsSchema>;
export type TrendingSearches = typeof trendingSearches.$inferSelect;
export type TrendingSearchesInsert = z.infer<typeof insertTrendingSearchesSchema>;
export type SearchSuggestions = typeof searchSuggestions.$inferSelect;
export type SearchSuggestionsInsert = z.infer<typeof insertSearchSuggestionsSchema>;
export type SearchIndex = typeof searchIndex.$inferSelect;
export type SearchIndexInsert = z.infer<typeof insertSearchIndexSchema>;

// Search result types for frontend
export type SearchResultItem = {
  id: string;
  type: 'book' | 'course' | 'user' | 'test' | 'homework' | 'session' | 'roadmap' | 'dictionary';
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  metadata: {
    author?: string;
    instructor?: string;
    language?: string;
    level?: string;
    category?: string;
    rating?: number;
    price?: number;
    tags?: string[];
    [key: string]: any;
  };
  relevanceScore?: number;
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
  };
};

export type SearchFilters = {
  categories?: string[];
  languages?: string[];
  levels?: string[];
  contentTypes?: string[];
  priceRange?: { min: number; max: number };
  dateRange?: { start: string; end: string };
  ratings?: number[];
  instructors?: string[];
};

export type SearchResponse = {
  query: string;
  results: SearchResultItem[];
  totalResults: number;
  facets: {
    categories: { name: string; count: number }[];
    languages: { name: string; count: number }[];
    levels: { name: string; count: number }[];
    contentTypes: { name: string; count: number }[];
  };
  suggestions?: string[];
  responseTime: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// ============================================================================
// LEXI AI TEACHING ASSISTANT SCHEMA
// ============================================================================

// Lexi conversations - tracks chat sessions with the AI assistant

// Lexi messages - individual chat messages in conversations

// Video content analysis by Lexi - AI analysis of video content for context

// User learning interactions with Lexi - tracks all learning activities

// Voice interactions with Lexi - specific to voice/pronunciation features

// Lexi personalized recommendations - AI-generated learning suggestions

// Lexi learning analytics - aggregate learning data and insights

// Quiz data generated by Lexi from video content

// User's quiz attempts and results

// ============================================================================
// IRANIAN/ARABIC CALENDAR AND THIRD-PARTY API INTEGRATION
// ============================================================================

// Third-party APIs management for centralized API integration

// Iranian calendar settings and preferences

// Iranian/Persian calendar events and cultural occasions

// Persian holiday calendar with detailed information

// ============================================================================
// LEXI SCHEMA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for Lexi tables

// Type exports for Lexi tables
export type LexiConversation = typeof lexiConversations.$inferSelect;
export type LexiConversationInsert = z.infer<typeof insertLexiConversationSchema>;
export type LexiMessage = typeof lexiMessages.$inferSelect;
export type LexiMessageInsert = z.infer<typeof insertLexiMessageSchema>;
export type LexiVideoAnalysis = typeof lexiVideoAnalysis.$inferSelect;
export type LexiVideoAnalysisInsert = z.infer<typeof insertLexiVideoAnalysisSchema>;
export type LexiLearningInteraction = typeof lexiLearningInteractions.$inferSelect;
export type LexiLearningInteractionInsert = z.infer<typeof insertLexiLearningInteractionSchema>;
export type LexiVoiceInteraction = typeof lexiVoiceInteractions.$inferSelect;
export type LexiVoiceInteractionInsert = z.infer<typeof insertLexiVoiceInteractionSchema>;
export type LexiRecommendation = typeof lexiRecommendations.$inferSelect;
export type LexiRecommendationInsert = z.infer<typeof insertLexiRecommendationSchema>;
export type LexiLearningAnalytics = typeof lexiLearningAnalytics.$inferSelect;
export type LexiLearningAnalyticsInsert = z.infer<typeof insertLexiLearningAnalyticsSchema>;
export type LexiQuiz = typeof lexiQuizzes.$inferSelect;
export type LexiQuizInsert = z.infer<typeof insertLexiQuizSchema>;
export type LexiQuizAttempt = typeof lexiQuizAttempts.$inferSelect;
export type LexiQuizAttemptInsert = z.infer<typeof insertLexiQuizAttemptSchema>;

// ============================================================================
// IRANIAN/ARABIC CALENDAR SCHEMA INSERT SCHEMAS AND TYPES  
// ============================================================================

// Insert schemas for calendar and third-party API tables

// Type exports for calendar and third-party API tables  
export type ThirdPartyApi = typeof thirdPartyApis.$inferSelect;
export type ThirdPartyApiInsert = z.infer<typeof insertThirdPartyApiSchema>;
export type IranianCalendarSettings = typeof iranianCalendarSettings.$inferSelect;
export type IranianCalendarSettingsInsert = z.infer<typeof insertIranianCalendarSettingsSchema>;
export type CalendarEventsIranian = typeof calendarEventsIranian.$inferSelect;
export type CalendarEventsIranianInsert = z.infer<typeof insertCalendarEventsIranianSchema>;
export type HolidayCalendarPersian = typeof holidayCalendarPersian.$inferSelect;
export type HolidayCalendarPersianInsert = z.infer<typeof insertHolidayCalendarPersianSchema>;

// ============================================================================
// MARKETING & SOCIAL MEDIA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for marketing and social media tables
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  impressions: true,
  clicks: true,
  conversions: true,
  costPerLead: true,
  roi: true,
  conversionRate: true,
  engagementRate: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlatformCredentialSchema = createInsertSchema(platformCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  impressions: true,
  reach: true,
  likes: true,
  comments: true,
  shares: true,
  clicks: true,
  saves: true,
  engagementRate: true,
  lastSyncedAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertSocialMediaAnalyticsSchema = createInsertSchema(socialMediaAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  sentAt: true,
  successfulSends: true,
  failedSends: true,
  opened: true,
  clicked: true,
  bounced: true,
  unsubscribed: true,
  openRate: true,
  clickRate: true,
  bounceRate: true,
  createdAt: true,
  updatedAt: true
});

export const insertTelegramMessageSchema = createInsertSchema(telegramMessages).omit({
  id: true,
  sentAt: true,
  views: true,
  forwards: true,
  createdAt: true,
  updatedAt: true
});

// Type exports for marketing and social media tables
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type MarketingCampaignInsert = z.infer<typeof insertMarketingCampaignSchema>;
export type PlatformCredential = typeof platformCredentials.$inferSelect;
export type PlatformCredentialInsert = z.infer<typeof insertPlatformCredentialSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type ScheduledPostInsert = z.infer<typeof insertScheduledPostSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type SocialMediaPostInsert = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaAnalytics = typeof socialMediaAnalytics.$inferSelect;
export type SocialMediaAnalyticsInsert = z.infer<typeof insertSocialMediaAnalyticsSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailCampaignInsert = z.infer<typeof insertEmailCampaignSchema>;
export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type TelegramMessageInsert = z.infer<typeof insertTelegramMessageSchema>;

// ============================================================================
// LINGUAQUEST FREE LEARNING SYSTEM SCHEMA
// ============================================================================

// LinguaQuest lesson difficulty and type constants



export type LinguaQuestDifficulty = typeof LINGUAQUEST_DIFFICULTY[keyof typeof LINGUAQUEST_DIFFICULTY];
export type LinguaQuestLessonType = typeof LINGUAQUEST_LESSON_TYPE[keyof typeof LINGUAQUEST_LESSON_TYPE];
export type LinguaQuestSceneType = typeof LINGUAQUEST_SCENE_TYPE[keyof typeof LINGUAQUEST_SCENE_TYPE];

// LinguaQuest 3D Interactive Lessons

// Guest Progress Tracking (Anonymous Users)

// Voice Exercises for Guest Users

// 3D Lesson Content and Assets

// 3D Video Lessons - Bridge between video courses and 3D lessons

// 3D Lesson Progress Tracking

// Freemium Conversion Tracking

// Visitor Achievements (Gamification for Guests)

// ============================================================================
// PHASE 3: ENHANCED ANALYTICS TABLES
// ============================================================================

// AI-powered learning problem detection

// Learning recommendations generated by AI

// Cross-skill performance correlations

// Individual student performance patterns

// Learning analytics insights cache (for performance)

// ============================================================================
// LINGUAQUEST INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for LinguaQuest tables

// Insert schemas for Enhanced Analytics tables

// Type exports for LinguaQuest tables
export type LinguaquestLesson = typeof linguaquestLessons.$inferSelect;
export type LinguaquestLessonInsert = z.infer<typeof insertLinguaquestLessonSchema>;
export type GuestProgressTracking = typeof guestProgressTracking.$inferSelect;
export type GuestProgressTrackingInsert = z.infer<typeof insertGuestProgressTrackingSchema>;
export type VoiceExercisesGuest = typeof voiceExercisesGuest.$inferSelect;
export type VoiceExercisesGuestInsert = z.infer<typeof insertVoiceExercisesGuestSchema>;
export type ThreeDLessonContent = typeof threeDLessonContent.$inferSelect;
export type ThreeDLessonContentInsert = z.infer<typeof insertThreeDLessonContentSchema>;
export type ThreeDVideoLesson = typeof threeDVideoLessons.$inferSelect;
export type ThreeDVideoLessonInsert = z.infer<typeof insertThreeDVideoLessonSchema>;
export type ThreeDLessonProgress = typeof threeDLessonProgress.$inferSelect;
export type ThreeDLessonProgressInsert = z.infer<typeof insertThreeDLessonProgressSchema>;
export type FreemiumConversionTracking = typeof freemiumConversionTracking.$inferSelect;
export type FreemiumConversionTrackingInsert = z.infer<typeof insertFreemiumConversionTrackingSchema>;
export type VisitorAchievement = typeof visitorAchievements.$inferSelect;
export type VisitorAchievementInsert = z.infer<typeof insertVisitorAchievementSchema>;

// Type exports for Enhanced Analytics tables
export type LearningProblem = typeof learningProblems.$inferSelect;
export type LearningProblemInsert = z.infer<typeof insertLearningProblemSchema>;
export type LearningRecommendation = typeof learningRecommendations.$inferSelect;
export type LearningRecommendationInsert = z.infer<typeof insertLearningRecommendationSchema>;
export type SkillCorrelation = typeof skillCorrelations.$inferSelect;
export type SkillCorrelationInsert = z.infer<typeof insertSkillCorrelationSchema>;
export type PerformancePattern = typeof performancePatterns.$inferSelect;
export type PerformancePatternInsert = z.infer<typeof insertPerformancePatternSchema>;
export type AnalyticsInsight = typeof analyticsInsights.$inferSelect;
export type AnalyticsInsightInsert = z.infer<typeof insertAnalyticsInsightSchema>;

// ============================================================================
// PHASE A: DATABASE SCHEMA CONSOLIDATION VIEWS
// ============================================================================

// Unified Packages View - Combining sessionPackages and callernPackages
// This provides a single interface for all package types with type discriminator
// Use this view for all new API queries instead of individual tables

// ============================================================================
// SMS TEMPLATE MANAGEMENT SYSTEM TABLES
// ============================================================================

// SMS template categories for organizing templates

// SMS template variables for personalization

// Main SMS templates table

// SMS template sending logs for tracking all SMS sends

// SMS template analytics for performance tracking

// SMS template favorites for quick access

// ============================================================================
// FRONT DESK CLERK TABLES FOR WALK-IN MANAGEMENT
// ============================================================================

// Front desk operations table for tracking walk-in inquiries and visits

// Phone call logs table for tracking all phone communications

// Front desk tasks table for follow-up and task management

// ============================================================================
// TRIAL LESSON SCHEDULING SYSTEM
// ============================================================================

// Trial Lessons - Core table for all trial lesson bookings

// Trial Lesson Outcomes - Detailed assessment and feedback after trial

// Teacher Trial Lesson Availability - Specific availability windows for trial lessons

// Trial Lesson Conflicts - Track and resolve scheduling conflicts

// Trial Lesson Analytics - Performance tracking and metrics

// Trial Lesson Wait List - Manage waiting lists for popular time slots

// ============================================================================
// TRIAL LESSON SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for trial lesson tables
export const insertTrialLessonSchema = createInsertSchema(trialLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for trial lesson tables
export type TrialLesson = typeof trialLessons.$inferSelect;
export type InsertTrialLesson = z.infer<typeof insertTrialLessonSchema>;
export type TrialLessonOutcome = typeof trialLessonOutcomes.$inferSelect;
export type InsertTrialLessonOutcome = z.infer<typeof insertTrialLessonOutcomeSchema>;
export type TeacherTrialAvailability = typeof teacherTrialAvailability.$inferSelect;
export type InsertTeacherTrialAvailability = z.infer<typeof insertTeacherTrialAvailabilitySchema>;
export type TrialLessonConflict = typeof trialLessonConflicts.$inferSelect;
export type InsertTrialLessonConflict = z.infer<typeof insertTrialLessonConflictSchema>;
export type TrialLessonAnalytics = typeof trialLessonAnalytics.$inferSelect;
export type InsertTrialLessonAnalytics = z.infer<typeof insertTrialLessonAnalyticsSchema>;
export type TrialLessonWaitList = typeof trialLessonWaitList.$inferSelect;
export type InsertTrialLessonWaitList = z.infer<typeof insertTrialLessonWaitListSchema>;

// ============================================================================
// SMS TEMPLATE SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// CRITICAL TYPE SAFETY: SMS Log Metadata Schema - replaces unsafe (metadata as any) casts

export type SmsLogMetadata = z.infer<typeof smsLogMetadataSchema>;

// Insert schemas for SMS Template tables

// Type exports for SMS Template tables
export type SmsTemplateCategory = typeof smsTemplateCategories.$inferSelect;
export type InsertSmsTemplateCategory = z.infer<typeof insertSmsTemplateCategorySchema>;
export type SmsTemplateVariable = typeof smsTemplateVariables.$inferSelect;
export type InsertSmsTemplateVariable = z.infer<typeof insertSmsTemplateVariableSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplateSendingLog = typeof smsTemplateSendingLogs.$inferSelect;
export type InsertSmsTemplateSendingLog = z.infer<typeof insertSmsTemplateSendingLogSchema>;
export type SmsTemplateAnalytics = typeof smsTemplateAnalytics.$inferSelect;
export type InsertSmsTemplateAnalytics = z.infer<typeof insertSmsTemplateAnalyticsSchema>;
export type SmsTemplateFavorite = typeof smsTemplateFavorites.$inferSelect;
export type InsertSmsTemplateFavorite = z.infer<typeof insertSmsTemplateFavoriteSchema>;

// ============================================================================
// WEB SCRAPING INFRASTRUCTURE TABLES
// ============================================================================

export const SCRAPE_JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export const SCRAPE_JOB_TYPE = {
  PRICING: 'pricing',
  LEADS: 'leads',
  TRENDS: 'trends',
  CUSTOM: 'custom'
} as const;

export type ScrapeJobStatus = typeof SCRAPE_JOB_STATUS[keyof typeof SCRAPE_JOB_STATUS];
export type ScrapeJobType = typeof SCRAPE_JOB_TYPE[keyof typeof SCRAPE_JOB_TYPE];

export const scrapeJobs = pgTable("scrape_jobs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  targetUrl: varchar("target_url", { length: 1000 }).notNull(),
  selectors: jsonb("selectors").notNull(),
  schedule: varchar("schedule", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  itemsScraped: integer("items_scraped").default(0),
  errorMessage: text("error_message"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const competitorPrices = pgTable("competitor_prices", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id").references(() => scrapeJobs.id),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  competitorUrl: varchar("competitor_url", { length: 1000 }).notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  courseLevel: varchar("course_level", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default('IRR'),
  duration: varchar("duration", { length: 100 }),
  features: text("features").array(),
  discount: decimal("discount", { precision: 5, scale: 2 }),
  availability: varchar("availability", { length: 100 }),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const scrapedLeads = pgTable("scraped_leads", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id").references(() => scrapeJobs.id),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1000 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  location: varchar("location", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  interests: text("interests").array(),
  socialProfiles: jsonb("social_profiles"),
  qualificationScore: integer("qualification_score").default(0),
  status: varchar("status", { length: 50 }).default('new'),
  importedToLeads: boolean("imported_to_leads").default(false),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const marketTrends = pgTable("market_trends", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id").references(() => scrapeJobs.id),
  category: varchar("category", { length: 100 }).notNull(),
  trendName: varchar("trend_name", { length: 255 }).notNull(),
  description: text("description"),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1000 }),
  keywords: text("keywords").array(),
  sentiment: varchar("sentiment", { length: 50 }),
  impactScore: integer("impact_score").default(0),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  aiInsights: text("ai_insights"),
  recommendations: text("recommendations").array(),
  relatedTopics: text("related_topics").array(),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertScrapeJobSchema = createInsertSchema(scrapeJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCompetitorPriceSchema = createInsertSchema(competitorPrices).omit({
  id: true,
  createdAt: true
});

export const insertScrapedLeadSchema = createInsertSchema(scrapedLeads).omit({
  id: true,
  createdAt: true
});

export const insertMarketTrendSchema = createInsertSchema(marketTrends).omit({
  id: true,
  createdAt: true
});

export const scrapeSchedules = pgTable("scrape_schedules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(),
  intervalMinutes: integer("interval_minutes"),
  config: jsonb("config").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertScrapeScheduleSchema = createInsertSchema(scrapeSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = z.infer<typeof insertScrapeJobSchema>;
export type CompetitorPrice = typeof competitorPrices.$inferSelect;
export type InsertCompetitorPrice = z.infer<typeof insertCompetitorPriceSchema>;
export type ScrapedLead = typeof scrapedLeads.$inferSelect;
export type InsertScrapedLead = z.infer<typeof insertScrapedLeadSchema>;
export type MarketTrend = typeof marketTrends.$inferSelect;
export type InsertMarketTrend = z.infer<typeof insertMarketTrendSchema>;
export type ScrapeSchedule = typeof scrapeSchedules.$inferSelect;
export type InsertScrapeSchedule = z.infer<typeof insertScrapeScheduleSchema>;

// ============================================================================
// CRITICAL INFRASTRUCTURE: Database Performance Indexes for SMS Tables
// ============================================================================

// Performance indexes for SMS template system (commented out temporarily to fix startup issues)
// import { index } from "drizzle-orm/pg-core";

// export const smsTemplateIndexes = {
//   // Primary performance indexes for SMS templates
//   categoryIndex: index('sms_templates_category_id_idx').on(smsTemplates.categoryId),
//   createdAtIndex: index('sms_templates_created_at_idx').on(smsTemplates.createdAt),
//   statusIndex: index('sms_templates_status_idx').on(smsTemplates.status),
//   lastUsedIndex: index('sms_templates_last_used_at_idx').on(smsTemplates.lastUsedAt)
// };