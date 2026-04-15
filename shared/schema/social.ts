import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, courses } from "./users";
import { books } from "./teaching";
import { chatConversations } from "./ai";

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

// insertThreeDLessonContentSchema moved to marketing.ts (co-located with table definition)

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

// CallerN Call History table (historical/completed sessions)
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

// CallerN Sessions table (active/in-progress sessions)
export const callSessions = pgTable("call_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  roadmapProgressId: integer("roadmap_progress_id").references(() => studentRoadmapProgress.id),
  roadmapStepId: integer("roadmap_step_id").references(() => callernRoadmapSteps.id),
  roomId: varchar("room_id", { length: 255 }), // deterministic room identifier for lifecycle binding
  sessionType: varchar("session_type", { length: 50 }).default("callern"),
  status: varchar("status", { length: 20 }).default("active"), // pending, active, completed, cancelled
  pendingAt: timestamp("pending_at"), // when student requested the call
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  durationSec: integer("duration_sec"),
  recordingPath: varchar("recording_path", { length: 500 }),
  transcriptPath: varchar("transcript_path", { length: 500 }),
  callQuality: varchar("call_quality", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN Post-Session Reports table
export const callPostReports = pgTable("call_post_reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => callSessions.id).notNull(),
  aiSummaryJson: jsonb("ai_summary_json"),
  nextSessionPrep: jsonb("next_session_prep"),
  taughtItemsJson: jsonb("taught_items_json"),
  teacherEditsJson: jsonb("teacher_edits_json"),
  teacherNotes: text("teacher_notes"),
  teacherConfirmed: boolean("teacher_confirmed").default(false),
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

// Teacher Online Status - Database-backed real-time status with heartbeat
export const teacherOnlineStatus = pgTable("teacher_online_status", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  socketId: varchar("socket_id", { length: 255 }).notNull(),
  isAvailable: boolean("is_available").default(false).notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  serverInstance: varchar("server_instance", { length: 255 })
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
  lowSessionAlertThreshold: integer("low_session_alert_threshold").default(2), // alert when remaining <= this
  minSubLevelId: integer("min_sub_level_id"),
  maxSubLevelId: integer("max_sub_level_id"),
  examTagIds: integer("exam_tag_ids").array().default([]),
  skillScope: varchar("skill_scope", { length: 50 }),
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

// Institute Settings Type (for JSONB settings field)
export const institutePublicFeaturesSchema = z.object({
  courseCatalog: z.boolean().default(true),
  placementTest: z.boolean().default(true),
  teacherDirectory: z.boolean().default(true),
  liveClasses: z.boolean().default(false),
  progressTracking: z.boolean().default(false),
  linguaquestGames: z.boolean().default(false),
  certificates: z.boolean().default(false),
  oneOnOneSessions: z.boolean().default(true),
  blogPosts: z.boolean().default(true),
  videoCourses: z.boolean().default(true)
});

export const instituteSettingsSchema = z.object({
  publicFeatures: institutePublicFeaturesSchema.optional(),
  branding: z.object({
    primaryColor: z.string().default("#3B82F6"),
    secondaryColor: z.string().default("#8B5CF6"),
    subdomain: z.string().optional(),
    customDomain: z.string().optional()
  }).optional(),
  subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']).default('basic').optional()
});

export type InstitutePublicFeatures = z.infer<typeof institutePublicFeaturesSchema>;
export type InstituteSettings = z.infer<typeof instituteSettingsSchema>;

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
  status: varchar("status", { length: 20 }).default("active"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 })
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

// Daily Challenges Table
export const gameDailyChallenges = pgTable("game_daily_challenges", {
  id: serial("id").primaryKey(),
  challengeDate: date("challenge_date").notNull(),
  challengeType: varchar("challenge_type", { length: 50 }).notNull(), // vocabulary, grammar, listening, speaking, reading, writing
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  skillFocus: text("skill_focus").array().default([]),
  targetXp: integer("target_xp").default(50),
  rewardCoins: integer("reward_coins").default(10),
  rewardBadges: text("reward_badges").array().default([]),
  description: text("description"),
  instructionsEn: text("instructions_en"),
  instructionsFa: text("instructions_fa"),
  instructionsAr: text("instructions_ar"),
  questionCount: integer("question_count").default(5),
  estimatedTimeMinutes: integer("estimated_time_minutes").default(15),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Daily Challenge Progress
export const userDailyChallengeProgress = pgTable("user_daily_challenge_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  challengeId: integer("challenge_id").references(() => gameDailyChallenges.id).notNull(),
  status: varchar("status", { length: 20 }).default("not_started"), // not_started, in_progress, completed, abandoned
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  score: integer("score").default(0),
  maxScore: integer("max_score").default(100),
  correctAnswers: integer("correct_answers").default(0),
  totalQuestions: integer("total_questions").default(0),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  xpEarned: integer("xp_earned").default(0),
  coinsEarned: integer("coins_earned").default(0),
  badgesEarned: text("badges_earned").array().default([]),
  attemptNumber: integer("attempt_number").default(1),
  answerDetails: jsonb("answer_details"), // detailed answer logs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// CallerN AI Analysis Table
export const callernAiAnalysis = pgTable("callern_ai_analysis", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(), // grammar, pronunciation, vocabulary, fluency, comprehension
  score: decimal("score", { precision: 5, scale: 2 }).default("0"),
  feedback: text("feedback"),
  suggestions: text("suggestions").array().default([]),
  strengthAreas: text("strength_areas").array().default([]),
  improvementAreas: text("improvement_areas").array().default([]),
  overallAssessment: text("overall_assessment"),
  recommendedActivities: text("recommended_activities").array().default([]),
  aiModel: varchar("ai_model", { length: 100 }).default("openai"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
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

// OTP Codes table - matches actual database structure
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  identifier: text("identifier").notNull(), // email or phone number
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  channel: text("channel"), // 'sms' or 'email'
  purpose: text("purpose").notNull(), // login, password_reset, phone_verification, email_verification
  codeHash: text("code_hash").notNull(), // hashed OTP code
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"), // when OTP was used
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  ip: text("ip"), // for OTP rate limiting
  locale: text("locale"), // 'fa' or 'en'
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
  classId: integer("class_id").references(() => classes.id),
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
  // Emergency cancellation fields
  cancellationStatus: varchar("cancellation_status", { length: 30 }).default("active"), // active, cancel_requested, cancelled
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: integer("cancelled_by").references(() => users.id),
  cancelledReason: varchar("cancelled_reason", { length: 50 }), // sick, emergency, conflict, weather, other
  cancelledReasonText: text("cancelled_reason_text"),
  isChatroomReadOnly: boolean("is_chatroom_read_only").default(false),
  actualStartTime: timestamp("actual_start_time"), // set when class physically starts (Task #41)
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
  classSessionId: integer("class_session_id").references(() => liveClassSessions.id), // FK for cancellation requests
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

// Class Cancellation Requests table
export const classCancellationRequests = pgTable("class_cancellation_requests", {
  id: serial("id").primaryKey(),
  classSessionId: integer("class_session_id").references(() => liveClassSessions.id).notNull(),
  requestedByUserId: integer("requested_by_user_id").references(() => users.id).notNull(),
  requesterRole: varchar("requester_role", { length: 20 }).notNull(), // teacher, student, admin
  reasonCategory: varchar("reason_category", { length: 30 }).notNull(), // sick, emergency, conflict, weather, other
  reasonText: text("reason_text"),
  studentRequestCount: integer("student_request_count").default(0), // for group class threshold
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, force_cancelled
  reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  makeupSessionId: integer("makeup_session_id").references(() => liveClassSessions.id),
  smsDeliveryCount: integer("sms_delivery_count").default(0),
  chatroomMessageStatus: varchar("chatroom_message_status", { length: 20 }).default("not_sent"), // not_sent, sent, failed
  supportTicketId: integer("support_ticket_id").references(() => supportTickets.id),
  isLessThan30Min: boolean("is_less_than_30_min").default(false), // flag for <30min requests
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertClassCancellationRequestSchema = z.object({
  classSessionId: z.number(),
  requestedByUserId: z.number(),
  requesterRole: z.enum(["teacher", "student", "admin"]),
  reasonCategory: z.enum(["sick", "emergency", "conflict", "weather", "other"]),
  reasonText: z.string().optional(),
  studentRequestCount: z.number().default(0),
  status: z.string().max(20).default("pending"),
  reviewedByUserId: z.number().optional(),
  reviewedAt: z.date().optional(),
  makeupSessionId: z.number().optional(),
  supportTicketId: z.number().optional(),
  isLessThan30Min: z.boolean().default(false)
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

// ============================================================================
// CLASS LATENESS DETECTION & CHECK-IN TABLES
// ============================================================================

// class_sessions: one row per physical occurrence of a recurring class
export const classSessions = pgTable("class_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  scheduledStart: timestamp("scheduled_start").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  startedByStudentId: integer("started_by_student_id").references(() => users.id),
  startMethod: varchar("start_method", { length: 20 }), // sms_link, app_button, auto
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, started, cancelled
  smsSentAt: timestamp("sms_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// class_start_confirmations: student SMS tokens for check-in
export const classStartConfirmations = pgTable("class_start_confirmations", {
  id: serial("id").primaryKey(),
  classSessionId: integer("class_session_id").references(() => classSessions.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  smsToken: varchar("sms_token", { length: 64 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  isLate: boolean("is_late").default(false),
  confirmedAt: timestamp("confirmed_at"),
  method: varchar("method", { length: 20 }), // sms_link, app_button
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// lateness_records: all detected lateness events
export const latenessRecords = pgTable("lateness_records", {
  id: serial("id").primaryKey(),
  classSessionId: integer("class_session_id").references(() => classSessions.id),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  scheduledStart: timestamp("scheduled_start").notNull(),
  actualStart: timestamp("actual_start"),
  delayMinutes: integer("delay_minutes").notNull(),
  classType: varchar("class_type", { length: 20 }).notNull(), // in_person, online
  detectionMethod: varchar("detection_method", { length: 30 }).notNull(), // sms_confirmation, teacher_button, callern_auto, monitor_timeout
  callSessionId: integer("call_session_id").references(() => callSessions.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

