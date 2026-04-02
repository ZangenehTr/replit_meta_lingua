import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { buildInsertSchema } from "./schema-helpers";
import { z } from "zod";
import { users, courses } from "./users";
import { sessionPackages } from "./social";
import { leads } from "./leads";

// ============================================================================
// VISITOR CHAT SYSTEM
// ============================================================================

// Visitor Chat Sessions - Track anonymous visitor conversations
export const visitorChatSessions = pgTable("visitor_chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  visitorName: varchar("visitor_name", { length: 255 }),
  visitorEmail: varchar("visitor_email", { length: 255 }),
  visitorPhone: varchar("visitor_phone", { length: 50 }),
  language: varchar("language", { length: 10 }).default("fa").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  matchedUserId: integer("matched_user_id").references(() => users.id),
  matchedLeadId: integer("matched_lead_id"),
  chatMode: varchar("chat_mode", { length: 20 }).default("hybrid").notNull(),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  lastMessageAt: timestamp("last_message_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at")
});

// Visitor Chat Messages - Messages in visitor conversations
export const visitorChatMessages = pgTable("visitor_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => visitorChatSessions.id).notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // visitor, admin, ai, system
  senderName: varchar("sender_name", { length: 255 }),
  senderId: integer("sender_id").references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Zod schemas for visitor chat
export const insertVisitorChatSessionSchema = z.object({
  sessionId: z.string().max(255),
  visitorName: z.string().max(255).optional().nullable(),
  visitorEmail: z.string().max(255).optional().nullable(),
  visitorPhone: z.string().max(50).optional().nullable(),
  language: z.string().max(10).default("fa"),
  status: z.string().max(20).default("active"),
  assignedTo: z.number().optional().nullable(),
  matchedUserId: z.number().optional().nullable(),
  matchedLeadId: z.number().optional().nullable(),
  chatMode: z.string().max(20).default("hybrid"),
  rating: z.number().optional().nullable(),
  ratingComment: z.string().optional().nullable(),
  lastMessageAt: z.any().optional().nullable(),
  metadata: z.any().optional().nullable()
});

export const insertVisitorChatMessageSchema = z.object({
  sessionId: z.number(),
  senderType: z.string().max(20),
  senderName: z.string().max(255).optional().nullable(),
  senderId: z.number().optional().nullable(),
  message: z.string(),
  messageType: z.string().max(20).default("text"),
  metadata: z.any().optional().nullable(),
  isRead: z.boolean().default(false)
});

// Visitor Chat Canned Responses - Quick reply templates for admins
export const visitorChatCannedResponses = pgTable("visitor_chat_canned_responses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // greeting, faq, pricing, enrollment, general
  language: varchar("language", { length: 10 }).notNull(), // fa, en, ar
  shortcut: varchar("shortcut", { length: 50 }).notNull(), // e.g., /hello, /pricing
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Zod schemas for canned responses
export const insertVisitorChatCannedResponseSchema = buildInsertSchema(visitorChatCannedResponses, {
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true
});

// Visitor Chat Settings - Admin configuration for chat behavior
export const visitorChatSettings = pgTable("visitor_chat_settings", {
  id: serial("id").primaryKey(),
  chatMode: varchar("chat_mode", { length: 20 }).default("hybrid").notNull(), // ai, human, hybrid
  aiGreeting: text("ai_greeting"),
  aiGreetingFa: text("ai_greeting_fa"),
  aiGreetingAr: text("ai_greeting_ar"),
  businessHoursStart: varchar("business_hours_start", { length: 5 }).default("09:00"),
  businessHoursEnd: varchar("business_hours_end", { length: 5 }).default("18:00"),
  businessDays: jsonb("business_days").default([1,2,3,4,5,6]),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Tehran"),
  autoEscalateAfter: integer("auto_escalate_after").default(3),
  collectContactFirst: boolean("collect_contact_first").default(true).notNull(),
  aiPersonality: varchar("ai_personality", { length: 50 }).default("professional"),
  isActive: boolean("is_active").default(true).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertVisitorChatSettingsSchema = buildInsertSchema(visitorChatSettings, {
  id: true,
  updatedAt: true
});

// Types for visitor chat
export type VisitorChatSession = typeof visitorChatSessions.$inferSelect;
export type InsertVisitorChatSession = z.infer<typeof insertVisitorChatSessionSchema>;
export type VisitorChatMessage = typeof visitorChatMessages.$inferSelect;
export type InsertVisitorChatMessage = z.infer<typeof insertVisitorChatMessageSchema>;
export type VisitorChatCannedResponse = typeof visitorChatCannedResponses.$inferSelect;
export type InsertVisitorChatCannedResponse = z.infer<typeof insertVisitorChatCannedResponseSchema>;
export type VisitorChatSettings = typeof visitorChatSettings.$inferSelect;
export type InsertVisitorChatSettings = z.infer<typeof insertVisitorChatSettingsSchema>;

// ============================================================================
// TEACHER REVIEWS SYSTEM - Student ratings with admin approval workflow
// ============================================================================

export const teacherReviews = pgTable("teacher_reviews", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  sessionId: integer("session_id"), // Reference to completed session (optional)
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text"),
  reviewTextFa: text("review_text_fa"), // Farsi version
  reviewTextAr: text("review_text_ar"), // Arabic version
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isAnonymous: boolean("is_anonymous").default(false),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for teacher reviews
export const insertTeacherReviewSchema = buildInsertSchema(teacherReviews, {
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  rejectionReason: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true
});

// Types for teacher reviews
export type TeacherReview = typeof teacherReviews.$inferSelect;
export type InsertTeacherReview = z.infer<typeof insertTeacherReviewSchema>;

// ============================================================================
// EVENTS SYSTEM - For Upcoming Events widget
// ============================================================================

export const instituteEvents = pgTable("institute_events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  description: text("description"),
  descriptionFa: text("description_fa"),
  descriptionAr: text("description_ar"),
  eventType: varchar("event_type", { length: 50 }).notNull(), // workshop, seminar, webinar, class_opening, exam, holiday, celebration
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: varchar("location", { length: 255 }),
  locationFa: varchar("location_fa", { length: 255 }),
  isOnline: boolean("is_online").default(false),
  onlineLink: text("online_link"),
  imageUrl: text("image_url"),
  capacity: integer("capacity"),
  registeredCount: integer("registered_count").default(0),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for events
export const insertInstituteEventSchema = buildInsertSchema(instituteEvents, {
  id: true,
  registeredCount: true,
  createdAt: true,
  updatedAt: true
});

// Types for events
export type InstituteEvent = typeof instituteEvents.$inferSelect;
export type InsertInstituteEvent = z.infer<typeof insertInstituteEventSchema>;

// ============================================================================
// SOCIAL DUELING SYSTEM (Challenge Your Crush)
// ============================================================================

export const socialDuels = pgTable("social_duels", {
  id: serial("id").primaryKey(),
  challengerId: integer("challenger_id").references(() => users.id).notNull(),
  challengedId: integer("challenged_id").references(() => users.id).notNull(),
  challengeType: varchar("challenge_type", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"),
  cefrLevel: varchar("cefr_level", { length: 10 }),
  language: varchar("language", { length: 50 }).default("english"),
  isAnonymous: boolean("is_anonymous").default(false),
  status: varchar("status", { length: 30 }).default("pending"),
  questions: jsonb("questions"),
  challengerScore: integer("challenger_score"),
  challengedScore: integer("challenged_score"),
  winnerId: integer("winner_id").references(() => users.id),
  challengerAnswers: jsonb("challenger_answers"),
  challengedAnswers: jsonb("challenged_answers"),
  challengerCompletedAt: timestamp("challenger_completed_at"),
  challengedCompletedAt: timestamp("challenged_completed_at"),
  expiresAt: timestamp("expires_at"),
  xpReward: integer("xp_reward").default(25),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSocialDuelSchema = buildInsertSchema(socialDuels, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SocialDuel = typeof socialDuels.$inferSelect;
export type InsertSocialDuel = z.infer<typeof insertSocialDuelSchema>;

export const duelQuestionBank = pgTable("duel_question_bank", {
  id: serial("id").primaryKey(),
  challengeType: varchar("challenge_type", { length: 50 }).notNull(),
  cefrLevel: varchar("cefr_level", { length: 10 }).notNull(),
  language: varchar("language", { length: 50 }).default("english"),
  question: text("question").notNull(),
  questionFa: text("question_fa"),
  questionAr: text("question_ar"),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  explanationFa: text("explanation_fa"),
  explanationAr: text("explanation_ar"),
  audioUrl: text("audio_url"),
  imageUrl: text("image_url"),
  difficulty: integer("difficulty").default(1),
  timeLimitSeconds: integer("time_limit_seconds").default(30),
  points: integer("points").default(10),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDuelQuestionBankSchema = buildInsertSchema(duelQuestionBank, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export type DuelQuestionBank = typeof duelQuestionBank.$inferSelect;
export type InsertDuelQuestionBank = z.infer<typeof insertDuelQuestionBankSchema>;

// ============================================================================
// SESSION CRASHERS SYSTEM
// ============================================================================

export const crashAvailability = pgTable("crash_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(false),
  cefrLevel: varchar("cefr_level", { length: 10 }),
  language: varchar("language", { length: 50 }).default("english"),
  genderPreference: varchar("gender_preference", { length: 20 }).default("any"),
  isPremium: boolean("is_premium").default(false),
  availableFrom: time("available_from"),
  availableTo: time("available_to"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Tehran"),
  totalCrashes: integer("total_crashes").default(0),
  lastCrashAt: timestamp("last_crash_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertCrashAvailabilitySchema = buildInsertSchema(crashAvailability, {
  id: true,
  totalCrashes: true,
  lastCrashAt: true,
  createdAt: true,
  updatedAt: true
});

export type CrashAvailability = typeof crashAvailability.$inferSelect;
export type InsertCrashAvailability = z.infer<typeof insertCrashAvailabilitySchema>;

export const crashSessions = pgTable("crash_sessions", {
  id: serial("id").primaryKey(),
  callSessionId: integer("call_session_id"),
  crasherId: integer("crasher_id").references(() => users.id).notNull(),
  hostStudentId: integer("host_student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  status: varchar("status", { length: 30 }).default("invited"),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  durationSeconds: integer("duration_seconds"),
  stayedByConsent: boolean("stayed_by_consent").default(false),
  teacherApproved: boolean("teacher_approved"),
  crasherRating: integer("crasher_rating"),
  hostRating: integer("host_rating"),
  xpEarned: integer("xp_earned").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertCrashSessionSchema = buildInsertSchema(crashSessions, {
  id: true,
  createdAt: true
});

export type CrashSession = typeof crashSessions.$inferSelect;
export type InsertCrashSession = z.infer<typeof insertCrashSessionSchema>;

// ============================================================================
// DIASPORA BRIDGE SYSTEM
// ============================================================================

export const diasporaProfiles = pgTable("diaspora_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isDiaspora: boolean("is_diaspora").default(false),
  countryOfResidence: varchar("country_of_residence", { length: 100 }),
  heritageLanguage: varchar("heritage_language", { length: 50 }),
  targetLanguage: varchar("target_language", { length: 50 }),
  teachingLanguages: text("teaching_languages").array().default([]),
  proficiencyLevel: varchar("proficiency_level", { length: 10 }),
  timezone: varchar("timezone", { length: 50 }),
  isCulturalAmbassador: boolean("is_cultural_ambassador").default(false),
  ambassadorSince: timestamp("ambassador_since"),
  bio: text("bio"),
  bioFa: text("bio_fa"),
  interests: text("interests").array().default([]),
  availableSlots: jsonb("available_slots"),
  totalExchangeSessions: integer("total_exchange_sessions").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDiasporaProfileSchema = buildInsertSchema(diasporaProfiles, {
  id: true,
  totalExchangeSessions: true,
  averageRating: true,
  createdAt: true,
  updatedAt: true
});

export type DiasporaProfile = typeof diasporaProfiles.$inferSelect;
export type InsertDiasporaProfile = z.infer<typeof insertDiasporaProfileSchema>;

export const diasporaExchangeSessions = pgTable("diaspora_exchange_sessions", {
  id: serial("id").primaryKey(),
  diasporaUserId: integer("diaspora_user_id").references(() => users.id).notNull(),
  localUserId: integer("local_user_id").references(() => users.id).notNull(),
  sessionType: varchar("session_type", { length: 30 }).default("exchange"),
  language: varchar("language", { length: 50 }),
  cefrLevel: varchar("cefr_level", { length: 10 }),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  durationMinutes: integer("duration_minutes"),
  status: varchar("status", { length: 30 }).default("scheduled"),
  diasporaRating: integer("diaspora_rating"),
  localRating: integer("local_rating"),
  diasporaFeedback: text("diaspora_feedback"),
  localFeedback: text("local_feedback"),
  topicsCovered: text("topics_covered").array().default([]),
  xpEarned: integer("xp_earned").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertDiasporaExchangeSessionSchema = buildInsertSchema(diasporaExchangeSessions, {
  id: true,
  createdAt: true
});

export type DiasporaExchangeSession = typeof diasporaExchangeSessions.$inferSelect;
export type InsertDiasporaExchangeSession = z.infer<typeof insertDiasporaExchangeSessionSchema>;

// ============================================================================
// 3D INTERACTIVE SCENE SYSTEM (Enhanced LinguaQuest)
// ============================================================================

export const interactiveScenes = pgTable("interactive_scenes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  description: text("description"),
  descriptionFa: text("description_fa"),
  descriptionAr: text("description_ar"),
  sceneType: varchar("scene_type", { length: 50 }).notNull(),
  cefrLevel: varchar("cefr_level", { length: 10 }).notNull(),
  language: varchar("language", { length: 50 }).default("english"),
  environment: jsonb("environment"),
  cameraConfig: jsonb("camera_config"),
  lightingConfig: jsonb("lighting_config"),
  objects: jsonb("objects"),
  interactions: jsonb("interactions"),
  narrationScript: text("narration_script"),
  narrationScriptFa: text("narration_script_fa"),
  narrationScriptAr: text("narration_script_ar"),
  audioAssets: jsonb("audio_assets"),
  estimatedDurationMinutes: integer("estimated_duration_minutes").default(10),
  xpReward: integer("xp_reward").default(50),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isPublished: boolean("is_published").default(false),
  tags: text("tags").array().default([]),
  prerequisites: text("prerequisites").array().default([]),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertInteractiveSceneSchema = buildInsertSchema(interactiveScenes, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InteractiveScene = typeof interactiveScenes.$inferSelect;
export type InsertInteractiveScene = z.infer<typeof insertInteractiveSceneSchema>;

export const sceneInteractionPoints = pgTable("scene_interaction_points", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id").references(() => interactiveScenes.id).notNull(),
  objectId: varchar("object_id", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  labelFa: varchar("label_fa", { length: 255 }),
  labelAr: varchar("label_ar", { length: 255 }),
  interactionType: varchar("interaction_type", { length: 50 }).notNull(),
  position: jsonb("position").notNull(),
  scale: jsonb("scale"),
  rotation: jsonb("rotation"),
  color: varchar("color", { length: 20 }),
  shape: varchar("shape", { length: 30 }).default("box"),
  questionData: jsonb("question_data"),
  feedbackCorrect: text("feedback_correct"),
  feedbackCorrectFa: text("feedback_correct_fa"),
  feedbackCorrectAr: text("feedback_correct_ar"),
  feedbackIncorrect: text("feedback_incorrect"),
  feedbackIncorrectFa: text("feedback_incorrect_fa"),
  feedbackIncorrectAr: text("feedback_incorrect_ar"),
  audioUrl: text("audio_url"),
  points: integer("points").default(10),
  sortOrder: integer("sort_order").default(0),
  isRequired: boolean("is_required").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSceneInteractionPointSchema = buildInsertSchema(sceneInteractionPoints, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SceneInteractionPoint = typeof sceneInteractionPoints.$inferSelect;
export type InsertSceneInteractionPoint = z.infer<typeof insertSceneInteractionPointSchema>;

export const sceneProgress = pgTable("scene_progress", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id").references(() => interactiveScenes.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  guestToken: varchar("guest_token", { length: 255 }),
  completedInteractions: jsonb("completed_interactions"),
  score: integer("score").default(0),
  maxScore: integer("max_score").default(0),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  status: varchar("status", { length: 30 }).default("in_progress"),
  completedAt: timestamp("completed_at"),
  xpEarned: integer("xp_earned").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSceneProgressSchema = buildInsertSchema(sceneProgress, {
  id: true,
  createdAt: true,
  updatedAt: true
});

export type SceneProgress = typeof sceneProgress.$inferSelect;
export type InsertSceneProgress = z.infer<typeof insertSceneProgressSchema>;

// ============================================================================
// HR MODULE — Human Resources & AI Performance Evaluation
// ============================================================================

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  employeeCode: varchar("employee_code", { length: 30 }).notNull().unique(),
  department: varchar("department", { length: 100 }),
  jobTitle: varchar("job_title", { length: 100 }),
  contractType: varchar("contract_type", { length: 50 }).default("full_time"), // full_time | part_time | hourly | contract
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).default("0"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  hireDate: date("hire_date").notNull(),
  terminationDate: date("termination_date"),
  status: varchar("status", { length: 30 }).default("active"), // active | on_leave | terminated
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  nationalId: varchar("national_id", { length: 20 }),
  emergencyContact: varchar("emergency_contact", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  contractType: varchar("contract_type", { length: 50 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  workingHoursPerWeek: integer("working_hours_per_week").default(40),
  benefits: jsonb("benefits"),
  status: varchar("status", { length: 30 }).default("active"), // active | expired | terminated
  documentUrl: text("document_url"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  leaveType: varchar("leave_type", { length: 50 }).notNull(), // annual | sick | emergency | maternity | unpaid
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysRequested: decimal("days_requested", { precision: 5, scale: 1 }).notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 30 }).default("pending"), // pending | approved | rejected | cancelled
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payrollRecords = pgTable("payroll_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(), // 1-12
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).notNull(),
  overtimePay: decimal("overtime_pay", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  leaveDeductions: decimal("leave_deductions", { precision: 12, scale: 2 }).default("0"),
  grossPay: decimal("gross_pay", { precision: 12, scale: 2 }).notNull(),
  netPay: decimal("net_pay", { precision: 12, scale: 2 }).notNull(),
  workingDays: integer("working_days").default(0),
  presentDays: integer("present_days").default(0),
  leavesDays: decimal("leaves_days", { precision: 5, scale: 1 }).default("0"),
  notes: text("notes"),
  status: varchar("status", { length: 30 }).default("draft"), // draft | approved | paid
  approvedBy: integer("approved_by").references(() => users.id),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const performanceReviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  reviewYear: integer("review_year").notNull(),
  reviewMonth: integer("review_month").notNull(), // 1-12
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }), // 0-100
  metricBreakdown: jsonb("metric_breakdown"), // { metricName: score }
  aiNarrative: text("ai_narrative"), // Ollama-generated monthly summary
  improvementPlan: text("improvement_plan"), // Ollama-generated when below threshold
  anomalyDetected: boolean("anomaly_detected").default(false),
  anomalyDetails: text("anomaly_details"),
  adminNotified: boolean("admin_notified").default(false),
  performanceThreshold: decimal("performance_threshold", { precision: 5, scale: 2 }).default("60"),
  previousMonthScore: decimal("previous_month_score", { precision: 5, scale: 2 }),
  threeMonthAvgScore: decimal("three_month_avg_score", { precision: 5, scale: 2 }),
  generatedAt: timestamp("generated_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  status: varchar("status", { length: 30 }).default("draft"), // draft | published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * performance_scores — raw per-metric snapshots before AI aggregation.
 * One row per employee per month per data source/metric.
 * Consumed by hr-performance-aggregator.ts to build the overall score.
 */
export const performanceScores = pgTable("performance_scores", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(), // 1-12
  metricName: varchar("metric_name", { length: 100 }).notNull(), // e.g. 'session_quality', 'class_hours'
  metricValue: decimal("metric_value", { precision: 10, scale: 4 }).notNull(), // raw value
  normalizedScore: decimal("normalized_score", { precision: 5, scale: 2 }), // 0-100 after normalization
  dataSource: varchar("data_source", { length: 80 }), // e.g. 'callern', 'ai_supervisor', 'crm', 'tests'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;
export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = typeof payrollRecords.$inferInsert;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = typeof performanceReviews.$inferInsert;
export type PerformanceScore = typeof performanceScores.$inferSelect;
export type InsertPerformanceScore = typeof performanceScores.$inferInsert;

// ============================================================================
// PROMO CODES — Discount codes for course enrollment
// ============================================================================

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("percentage"), // "percentage" | "fixed"
  discountValue: integer("discount_value").notNull(), // percent (0-100) or fixed Toman amount
  minAmount: integer("min_amount").default(0), // minimum order amount to apply code
  maxUsages: integer("max_usages"), // null = unlimited
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"), // null = never expires
  applicableCourseIds: jsonb("applicable_course_ids"), // null = applies to all courses; array of course IDs
  singleUsePerUser: boolean("single_use_per_user").default(false).notNull(), // if true, each user can only use this code once (per course)
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ============================================================================
// CERTIFICATES — Digital completion certificates
// ============================================================================

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certificateNumber: varchar("certificate_number", { length: 40 }).notNull().unique(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // null = never expires
  status: varchar("status", { length: 20 }).default("active").notNull(), // "active" | "revoked"
  revokedAt: timestamp("revoked_at"),
  revokeReason: text("revoke_reason"),
  issuedBy: integer("issued_by").references(() => users.id), // admin who issued it; null = auto-issued
  pdfPath: varchar("pdf_path", { length: 500 }), // server-side generated PDF file path
  metadata: jsonb("metadata"), // extra data: score, CEFR level, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// ============================================================================
// PROMO CODE USAGES — audit trail of every promo code redemption
// ============================================================================

export const promoCodeUsages = pgTable("promo_code_usages", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").references(() => promoCodes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  discountAmount: integer("discount_amount").notNull(), // actual Toman discount applied
  originalAmount: integer("original_amount").notNull(),
  finalAmount: integer("final_amount").notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export type PromoCodeUsage = typeof promoCodeUsages.$inferSelect;
export type InsertPromoCodeUsage = typeof promoCodeUsages.$inferInsert;

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

// ============================================================================
// TASK #6: MARKETING ADDITIONS
// ============================================================================

// ---- 1. Course Reviews ----
// Separate from teacherReviews (tutor marketplace). These are for enrolled students rating courses.
export const courseReviews = pgTable("course_reviews", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  enrollmentId: integer("enrollment_id"), // optional link to enrollment record
  rating: integer("rating").notNull(), // 1–5
  reviewText: text("review_text"),
  reviewTextFa: text("review_text_fa"),
  reviewTextAr: text("review_text_ar"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending | approved | rejected
  rejectionReason: text("rejection_reason"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isAnonymous: boolean("is_anonymous").default(false),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type CourseReview = typeof courseReviews.$inferSelect;
export type InsertCourseReview = typeof courseReviews.$inferInsert;

// ---- 2. Referral Program ----
// referral_codes: one unique code per student
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  totalReferrals: integer("total_referrals").default(0),
  totalConverted: integer("total_converted").default(0),
  totalCreditsEarned: integer("total_credits_earned").default(0), // in Toman
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

// referral_events: tracks every referral click, registration, and conversion
export const referralEvents = pgTable("referral_events", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").references(() => referralCodes.id).notNull(),
  referrerId: integer("referrer_id").references(() => users.id).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id), // null until they register
  eventType: varchar("event_type", { length: 30 }).notNull(), // click | registration | first_payment
  coursePaymentId: integer("course_payment_id"), // set on first_payment event
  referrerCreditAwarded: integer("referrer_credit_awarded").default(0), // Toman added to referrer wallet
  referredCreditAwarded: integer("referred_credit_awarded").default(0), // Toman added to referred wallet
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type ReferralEvent = typeof referralEvents.$inferSelect;
export type InsertReferralEvent = typeof referralEvents.$inferInsert;

// ---- 3. CallerN Session Ratings ----
// Stores individual post-session ratings submitted by student and teacher
export const sessionRatings = pgTable("session_ratings", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(), // CallerN session identifier string
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherRating: integer("teacher_rating"), // 1–5, teacher's rating by student
  studentRating: integer("student_rating"), // 1–5, student's rating by teacher
  teacherComment: text("teacher_comment"),
  studentComment: text("student_comment"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type SessionRating = typeof sessionRatings.$inferSelect;
export type InsertSessionRating = typeof sessionRatings.$inferInsert;

// ---- 4. CallerN Teacher Followers (Notify-Me) ----
// Students can follow a specific CallerN teacher; when that teacher transitions
// to 'available', each active follower receives an in-app (and optionally SMS) notification.
export const callernTeacherFollowers = pgTable("callern_teacher_followers", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  notifiedAt: timestamp("notified_at"), // last time a notification was sent for this follow
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type CallernTeacherFollower = typeof callernTeacherFollowers.$inferSelect;
export type InsertCallernTeacherFollower = typeof callernTeacherFollowers.$inferInsert;

// ===== PRIVATE CLASS OPERATIONAL STACK =====

// Student Session Packages table — tracks a student's purchased bundle
export const studentSessionPackages = pgTable("student_session_packages", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  packageId: integer("package_id").references(() => sessionPackages.id).notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  totalSessions: integer("total_sessions").notNull(),
  remainingSessions: integer("remaining_sessions").notNull(),
  sessionDuration: integer("session_duration").notNull(), // minutes per session
  lowSessionAlertThreshold: integer("low_session_alert_threshold").notNull().default(2),
  alertFiredAt: timestamp("alert_fired_at"), // null until threshold breach
  nextScheduledAt: timestamp("next_scheduled_at"), // next planned session date/time
  status: varchar("status", { length: 20 }).default("active"), // active, completed, cancelled
  startDate: timestamp("start_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher-Student assignment record — created when a private class bundle is activated
export const teacherStudentAssignments = pgTable("teacher_student_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  studentSessionPackageId: integer("student_session_package_id").references(() => studentSessionPackages.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type StudentSessionPackage = typeof studentSessionPackages.$inferSelect;
export type InsertStudentSessionPackage = typeof studentSessionPackages.$inferInsert;

export type TeacherStudentAssignment = typeof teacherStudentAssignments.$inferSelect;
export type InsertTeacherStudentAssignment = typeof teacherStudentAssignments.$inferInsert;

// Private Sessions table — logs individual completed private sessions
export const privateSessions = pgTable("private_sessions", {
  id: serial("id").primaryKey(),
  studentSessionPackageId: integer("student_session_package_id").references(() => studentSessionPackages.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  actualDuration: integer("actual_duration"), // in minutes
  topicsCovered: text("topics_covered"),
  teacherNotes: text("teacher_notes"),
  attendanceStatus: varchar("attendance_status", { length: 20 }).default("attended"), // attended, absent, cancelled
  sessionsDeducted: integer("sessions_deducted").default(1),
  remainingAfter: integer("remaining_after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type PrivateSession = typeof privateSessions.$inferSelect;
export type InsertPrivateSession = typeof privateSessions.$inferInsert;

// ============================================================================
// IRT (Item Response Theory) Tables
// ============================================================================

export const studentIrtAbility = pgTable("student_irt_ability", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull().unique(),
  theta: decimal("theta", { precision: 8, scale: 4 }).notNull().default("0"),
  standardError: decimal("standard_error", { precision: 8, scale: 4 }).notNull().default("1"),
  totalResponses: integer("total_responses").notNull().default(0),
  source: varchar("source", { length: 20 }).default("irt"), // 'irt' or 'mst'
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type StudentIrtAbility = typeof studentIrtAbility.$inferSelect;
export type InsertStudentIrtAbility = typeof studentIrtAbility.$inferInsert;

export const irtResponses = pgTable("irt_responses", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  sessionId: integer("session_id"),
  itemId: varchar("item_id", { length: 100 }).notNull(),
  correct: boolean("correct").notNull(),
  responseTime: integer("response_time"), // ms
  theta: decimal("theta", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type IrtResponse = typeof irtResponses.$inferSelect;
export type InsertIrtResponse = typeof irtResponses.$inferInsert;

// ============================================================================
// Adaptive Session Content Table
// ============================================================================

export const adaptiveSessionContent = pgTable("adaptive_session_content", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // warmup, main, practice, review, challenge
  contentData: jsonb("content_data").notNull(),
  jobId: varchar("job_id", { length: 100 }),
  status: varchar("status", { length: 20 }).default("ready"), // pending, ready, failed
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  sessionContentTypeUniq: unique("uq_adaptive_session_content_session_type").on(table.sessionId, table.contentType),
}));

export type AdaptiveSessionContent = typeof adaptiveSessionContent.$inferSelect;
export type InsertAdaptiveSessionContent = typeof adaptiveSessionContent.$inferInsert;

// ============================================================================
// MST Telemetry Table
// ============================================================================

export const mstTelemetry = pgTable("mst_telemetry", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  skill: varchar("skill", { length: 20 }).notNull(), // listening, reading, speaking, writing
  stage: varchar("stage", { length: 20 }).notNull(), // core, upper, lower
  itemId: varchar("item_id", { length: 100 }),
  p: decimal("p", { precision: 5, scale: 4 }).notNull(),
  route: varchar("route", { length: 10 }).notNull(), // up, down, stay
  timeSpentMs: integer("time_spent_ms"),
  features: jsonb("features"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type MstTelemetry = typeof mstTelemetry.$inferSelect;
export type InsertMstTelemetry = typeof mstTelemetry.$inferInsert;