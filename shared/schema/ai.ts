import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { courses } from "./users";

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
  gatewayName: varchar("gateway_name", { length: 50 }).default("shetab"),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

// Payment Idempotency table - Prevents duplicate payment processing
export const paymentIdempotency = pgTable("payment_idempotency", {
  id: serial("id").primaryKey(),
  callbackId: varchar("callback_id", { length: 255 }).notNull().unique(), // Shetab gateway transaction ID
  merchantTransactionId: varchar("merchant_transaction_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // processing, completed, failed
  requestSignature: varchar("request_signature", { length: 512 }), // HMAC signature for verification
  requestPayload: jsonb("request_payload"), // Original callback data for debugging
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course Payments table
export const coursePayments = pgTable("course_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  merchantTransactionId: varchar("merchant_transaction_id", { length: 255 }),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 512 }),
  gatewayReferenceNumber: varchar("gateway_reference_number", { length: 255 }),
  gatewayName: varchar("gateway_name", { length: 50 }).default("shetab"),
  cardNumber: varchar("card_number", { length: 20 }),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  creditsAwarded: integer("credits_awarded").default(0),
  promoCodeId: integer("promo_code_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // UTM tracking — copied from user record at payment time
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 })
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
  email: z.string().max(255).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  priority: z.string().max(50).optional().nullable(),
  interestedLanguage: z.string().max(100).optional().nullable(),
  level: z.string().max(50).optional().nullable(),
  budget: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  nextFollowUpDate: z.any().optional().nullable(),
  lastContactDate: z.any().optional().nullable(),
  conversionDate: z.any().optional().nullable(),
  studentId: z.number().optional().nullable(),
  interestedLevel: z.string().max(50).optional().nullable(),
  preferredFormat: z.string().max(50).optional().nullable(),
  assignedAgentId: z.number().optional().nullable(),
  age: z.number().optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  courseTarget: z.string().max(100).optional().nullable(),
  courseModule: z.string().max(100).optional().nullable(),
  workflowStatus: z.string().max(50).optional().nullable(),
  nationalId: z.string().max(20).optional().nullable(),
  workflowStage: z.string().max(50).optional().default('contact_desk'),
  deliveryType: z.string().max(50).optional().nullable(),
  classType: z.string().max(50).optional().nullable(),
  referralSource: z.string().max(100).optional().nullable(),
  goalScore: z.string().max(50).optional().nullable(),
  branch: z.string().max(100).optional().nullable(),
  message: z.string().optional().nullable(),
  timeLimit: z.string().max(50).optional().nullable()
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
