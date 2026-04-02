import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { buildInsertSchema } from "./schema-helpers";
import { z } from "zod";
import { users, courses } from "./users";
import { supervisionObservations } from "./social";

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
  // SMS Campaign fields
  discountCode: varchar("discount_code", { length: 100 }), // optional discount code for seasonal campaigns
  smsTemplate: text("sms_template"), // SMS message template with variables
  smsRecipientCount: integer("sms_recipient_count").default(0), // number of SMS recipients
  smsSentCount: integer("sms_sent_count").default(0), // number of SMS actually sent
  smsFailedCount: integer("sms_failed_count").default(0), // number of failed SMS
  smsDeliveredCount: integer("sms_delivered_count").default(0), // number of delivered SMS
  smsCost: bigint("sms_cost", { mode: "number" }).default(0), // total SMS cost in IRR
  audienceSegment: jsonb("audience_segment"), // stores audience selection criteria {type: 'unpaid_placement_test', params: {daysAgo: 7}}
  customRecipients: text("custom_recipients").array().default([]), // for CSV uploaded phone numbers
  smsScheduledFor: timestamp("sms_scheduled_for"), // when to send bulk SMS
  smsSentAt: timestamp("sms_sent_at"), // when bulk SMS was sent
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
  userId: integer("user_id").references(() => users.id),
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

// Placement Test Questions table
// Indexes defined in migrations/0070_mst_question_bank_indexes.sql
// (applied via `npm run migrate:mst-indexes`):
//   UNIQUE (mst_item_id) WHERE mst_item_id IS NOT NULL  → uidx_ptq_mst_item_id
//   (skill, cefr_level, stage, is_active)               → idx_ptq_skill_cefr_stage
export const placementTestQuestions = pgTable("placement_test_questions", {
  id: serial("id").primaryKey(),
  skill: varchar("skill", { length: 50 }).notNull(),
  cefrLevel: varchar("cefr_level", { length: 10 }).notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  prompt: text("prompt").notNull(),
  content: jsonb("content").notNull(),
  responseType: varchar("response_type", { length: 50 }).notNull(),
  expectedDurationSeconds: integer("expected_duration_seconds").notNull(),
  scoringCriteria: jsonb("scoring_criteria"),
  maxScore: integer("max_score").default(100),
  difficultyWeight: decimal("difficulty_weight", { precision: 3, scale: 2 }),
  prerequisiteSkills: text("prerequisite_skills").array(),
  tags: text("tags").array(),
  estimatedCompletionMinutes: integer("estimated_completion_minutes").default(1),
  isActive: boolean("is_active").default(true),
  stage: varchar("stage", { length: 20 }),
  difficulty: decimal("difficulty", { precision: 5, scale: 3 }),
  discrimination: decimal("discrimination", { precision: 5, scale: 3 }),
  mstItemId: varchar("mst_item_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Placement Test Responses table
export const placementTestResponses = pgTable("placement_test_responses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => placementTestSessions.id).notNull(),
  questionId: integer("question_id").references(() => placementTestQuestions.id).notNull(),
  userResponse: jsonb("user_response").notNull(),
  responseStartTime: timestamp("response_start_time"),
  responseEndTime: timestamp("response_end_time"),
  timeSpentSeconds: integer("time_spent_seconds"),
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }),
  cefrIndicators: jsonb("cefr_indicators"),
  detailedFeedback: jsonb("detailed_feedback"),
  manualScore: decimal("manual_score", { precision: 5, scale: 2 }),
  manualFeedback: text("manual_feedback"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  triggeredLevelAdjustment: boolean("triggered_level_adjustment").default(false),
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

// Guest Leads table - Captures contact information from anonymous placement test takers
export const guestLeads = pgTable("guest_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  placementSessionId: integer("placement_session_id").references(() => placementTestSessions.id),
  source: text("source").default("placement_test"),
  status: text("status").default("new"),
  notes: text("notes"),
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore circular schema dependency - curriculumLevels is in curriculum-ext.ts which imports from this file
  levelId: integer("level_id").references(() => (curriculumLevels as any).id),
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

// Video Lessons table - matches actual database structure
export const videoLessons = pgTable("video_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("video_url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  duration: integer("duration"), // in seconds
  moduleId: integer("module_id"),
  orderIndex: integer("order_index"),
  language: varchar("language", { length: 50 }),
  level: varchar("level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  skillFocus: varchar("skill_focus", { length: 100 }),
  transcriptUrl: varchar("transcript_url", { length: 500 }),
  subtitlesUrl: varchar("subtitles_url", { length: 500 }),
  materialsUrl: varchar("materials_url", { length: 500 }),
  isFree: boolean("is_free").default(false),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  viewCount: integer("view_count").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 })
});

// Insert schemas for roadmap system
export const roadmapConfigInsertSchema = buildInsertSchema(roadmapConfigs, { id: true, createdAt: true, updatedAt: true });
export const roadmapPlanInsertSchema = buildInsertSchema(roadmapPlans, { id: true, createdAt: true, updatedAt: true });
export const roadmapSessionInsertSchema = buildInsertSchema(roadmapSessions, { id: true, createdAt: true, updatedAt: true });

// Insert schemas for 3D lesson content
export const insertThreeDLessonContentSchema = buildInsertSchema(threeDLessonContent, { id: true, createdAt: true, updatedAt: true });
export const insertThreeDVideoLessonSchema = buildInsertSchema(threeDVideoLessons, { id: true, createdAt: true, updatedAt: true });
export const insertThreeDLessonProgressSchema = buildInsertSchema(threeDLessonProgress, { id: true, createdAt: true, updatedAt: true });

// Video Progress table
