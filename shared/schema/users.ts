import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS, COURSES, ACHIEVEMENTS, ADMIN TABLES
// ============================================================================

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
  isPhoneVerified: boolean("is_phone_verified").default(false),
  introVideoUrl: text("intro_video_url"), // Teacher intro video URL
  teacherBio: text("teacher_bio"), // Extended teacher biography
  teacherSpecializations: text("teacher_specializations").array(), // Teacher specializations
  hourlyRate: integer("hourly_rate"), // Teacher hourly rate in Toman
  teachingExperience: varchar("teaching_experience", { length: 50 }), // e.g., "5 years"
  // CallerN live rating aggregates
  callernRating: decimal("callern_rating", { precision: 3, scale: 2 }).default("0"),
  callernSessionCount: integer("callern_session_count").default(0),
  // UTM acquisition tracking
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  // Personal referral code for the referral program
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  // Code that was used to invite this user (tracked for referral attribution)
  referredByCode: varchar("referred_by_code", { length: 20 }),
  // MST-assigned CEFR sub-level
  subLevelId: integer("sub_level_id"),
  subLevelCode: varchar("sub_level_code", { length: 10 })
});

// Curriculum Categories table - Dynamic CMS for course categorization
export const curriculumCategories = pgTable("curriculum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameFa: text("name_fa"),
  nameAr: text("name_ar"),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
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
  categoryId: integer("category_id").references(() => curriculumCategories.id),
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
  callernRoadmapId: integer("callern_roadmap_id"),
  // Sub-level prerequisite range (FK to curriculum_levels)
  minSubLevelId: integer("min_sub_level_id"),
  maxSubLevelId: integer("max_sub_level_id"),
  // Exam tag IDs (references course_exam_tags)
  examTagIds: integer("exam_tag_ids").array().default([]),
  // Skill focus: listening, reading, speaking, writing, all
  skillScope: varchar("skill_scope", { length: 50 })
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
  aiProvider: varchar("ai_provider", { length: 50 }).default("ollama"),
  aiOllamaUrl: varchar("ai_ollama_url", { length: 255 }),
  whisperProvider: varchar("whisper_provider", { length: 50 }).default("faster-whisper"),
  whisperUrl: varchar("whisper_url", { length: 255 }),
  // Multi-gateway payment configuration
  activePaymentGateway: varchar("active_payment_gateway", { length: 50 }).default("shetab"),
  // Zarinpal
  zarinpalMerchantId: varchar("zarinpal_merchant_id", { length: 255 }),
  zarinpalEnabled: boolean("zarinpal_enabled").default(false),
  zarinpalSandbox: boolean("zarinpal_sandbox").default(true),
  // IDPay
  idpayApiKey: varchar("idpay_api_key", { length: 255 }),
  idpayEnabled: boolean("idpay_enabled").default(false),
  idpaySandbox: boolean("idpay_sandbox").default(true),
  // Zibal
  zibalMerchantId: varchar("zibal_merchant_id", { length: 255 }),
  zibalEnabled: boolean("zibal_enabled").default(false),
  zibalSandbox: boolean("zibal_sandbox").default(true),
  // Mellat
  mellatTerminalId: varchar("mellat_terminal_id", { length: 255 }),
  mellatUsername: varchar("mellat_username", { length: 255 }),
  mellatPassword: text("mellat_password"),
  mellatEnabled: boolean("mellat_enabled").default(false),
  mellatSandbox: boolean("mellat_sandbox").default(true),
  // HR Module configuration
  hrAnomalyThreshold: decimal("hr_anomaly_threshold", { precision: 5, scale: 2 }).default("15"), // points drop to trigger anomaly alert
  hrAnomalyNotifyAdmin: boolean("hr_anomaly_notify_admin").default(true), // queue admin notification on anomaly
  hrImprovementThreshold: decimal("hr_improvement_threshold", { precision: 5, scale: 2 }).default("60"), // absolute score below which improvement plan is generated
  // Certificate template configuration — JSON string containing institue name, logo URL, signature title, etc.
  certificateTemplate: text("certificate_template"),
  // Scraper → CRM bridge: auto-promotion score threshold (default 60)
  scraperAutoPromotionThreshold: integer("scraper_auto_promotion_threshold").default(60),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ─── Payment Gateway Config table (one row per gateway) ────────────────────
// Dedicated table for multi-gateway credentials & settings, separate from
// admin_settings. Each gateway has exactly one row identified by gatewayName.
export const paymentGatewayConfigs = pgTable("payment_gateway_configs", {
  id: serial("id").primaryKey(),
  gatewayName: varchar("gateway_name", { length: 50 }).notNull().unique(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  sandboxMode: boolean("sandbox_mode").default(true).notNull(),
  // JSONB blob of AES-256-GCM encrypted credential strings keyed by field name
  // e.g. { "merchantId": "ENC:...", "apiKey": "ENC:..." }
  encryptedCredentials: jsonb("encrypted_credentials"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PaymentGatewayConfigRow = typeof paymentGatewayConfigs.$inferSelect;

// AI Progress Tracking table
