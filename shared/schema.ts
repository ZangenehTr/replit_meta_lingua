import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with roles and authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("student"), // admin, teacher, mentor, student, supervisor, call_center, accountant
  phoneNumber: text("phone_number"),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  preferences: jsonb("preferences"), // theme, language, notifications
  walletBalance: integer("wallet_balance").default(0), // IRR amount in wallet
  totalCredits: integer("total_credits").default(0), // Lifetime accumulated credits for tier calculation
  memberTier: text("member_tier").default("bronze"), // bronze, silver, gold, diamond
  streakDays: integer("streak_days").default(0),
  totalLessons: integer("total_lessons").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Profiles with Cultural Background and Learning Preferences
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  culturalBackground: text("cultural_background"), // iranian, arabic, western, east_asian, south_asian, african, latin_american, other
  nativeLanguage: text("native_language").notNull().default("en"),
  targetLanguages: text("target_languages").array().default([]), // Languages user wants to learn
  proficiencyLevel: text("proficiency_level").default("beginner"), // beginner, elementary, intermediate, upper_intermediate, advanced, proficient
  learningGoals: text("learning_goals").array().default([]),
  learningStyle: text("learning_style"), // visual, auditory, kinesthetic, reading_writing
  timezone: text("timezone").default("UTC"),
  preferredStudyTime: text("preferred_study_time"), // morning, afternoon, evening, night
  weeklyStudyHours: integer("weekly_study_hours").default(5),
  personalityType: text("personality_type"), // introvert, extrovert, ambivert
  motivationFactors: text("motivation_factors").array().default([]), // career, travel, education, family, hobby
  learningChallenges: text("learning_challenges").array().default([]), // pronunciation, grammar, vocabulary, listening, speaking
  strengths: text("strengths").array().default([]), // memory, pattern_recognition, analytical, creative
  interests: text("interests").array().default([]), // business, travel, culture, technology, arts, sports
  bio: text("bio"),
  
  // Learning goals and targets
  targetLanguage: text("target_language"), // "persian", "english", "arabic", "german", etc.
  currentProficiency: text("current_proficiency"), // "beginner", "intermediate", "advanced"
  
  // Student-specific fields
  nationalId: text("national_id"),
  dateOfBirth: date("date_of_birth"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  notes: text("notes"),
  currentLevel: text("current_level"), // Override for display level
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Role Permissions
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // admin, teacher, student, mentor, supervisor, call_center, accountant
  resource: text("resource").notNull(), // users, courses, payments, reports, sessions, etc.
  action: text("action").notNull(), // create, read, update, delete, manage
  allowed: boolean("allowed").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// User Sessions for authentication
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token").unique(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: text("course_code").notNull().unique(), // e.g., "ONL-FA-MWF-1800-001"
  title: text("title").notNull(),
  description: text("description"),
  language: text("language").notNull(), // en, fa, de, es, etc.
  level: text("level").notNull(), // beginner, intermediate, advanced
  thumbnail: text("thumbnail"),
  instructorId: integer("instructor_id").references(() => users.id),
  price: integer("price").default(0),
  
  // Session-based structure
  totalSessions: integer("total_sessions").notNull(),
  sessionDuration: integer("session_duration").notNull(), // minutes per session (60, 90, 180)
  
  // Course delivery and format
  deliveryMode: text("delivery_mode").notNull(), // "online", "in_person", "self_paced"
  classFormat: text("class_format").notNull(), // "group", "one_on_one" (not applicable for self_paced)
  maxStudents: integer("max_students"), // null for one-on-one, number for group classes
  
  // Scheduling (not applicable for self_paced)
  weekdays: text("weekdays").array(), // ["monday", "wednesday", "friday"]
  startTime: text("start_time"), // "18:00"
  endTime: text("end_time"), // "19:30"
  
  // Target language and proficiency (for matching students)
  targetLanguage: text("target_language").notNull(), // "persian", "english", "arabic", etc.
  targetLevel: text("target_level").array().notNull(), // ["beginner", "intermediate"] - levels this course is suitable for
  
  // Recording settings (for online classes)
  autoRecord: boolean("auto_record").default(false),
  recordingAvailable: boolean("recording_available").default(false),
  
  category: text("category").notNull(),
  tags: text("tags").array(),
  prerequisites: text("prerequisites").array(),
  learningObjectives: text("learning_objectives").array(),
  difficulty: text("difficulty").default("beginner"),
  certificateTemplate: text("certificate_template"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Course enrollments
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0), // 0-100
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Tutoring sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  tutorId: integer("tutor_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(60), // minutes
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  sessionUrl: text("session_url"), // LiveKit room URL
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow()
});

// Homework assignments
export const homework = pgTable("homework", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").default("pending"), // pending, submitted, graded
  submission: text("submission"),
  grade: integer("grade"), // 0-100
  feedback: text("feedback"),
  assignedAt: timestamp("assigned_at").defaultNow()
});

// Payment transactions with enhanced Shetab integration
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("IRR"),
  creditsAwarded: integer("credits_awarded").default(0),
  provider: text("provider").default("shetab"), // shetab, cash, bank_transfer
  transactionId: text("transaction_id"),
  merchantTransactionId: text("merchant_transaction_id"), // Shetab merchant transaction ID
  gatewayTransactionId: text("gateway_transaction_id"), // Shetab gateway transaction ID
  referenceNumber: text("reference_number"), // Bank reference number
  cardNumber: text("card_number"), // Last 4 digits of card
  status: text("status").default("pending"), // pending, completed, failed, cancelled, reversed
  failureReason: text("failure_reason"), // Error details for failed transactions
  shetabResponse: jsonb("shetab_response"), // Full Shetab gateway response
  ipAddress: text("ip_address"), // Client IP for security
  userAgent: text("user_agent"), // Client user agent
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Legacy admin settings removed - using comprehensive version below

// Wallet Transactions for incremental top-ups
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "topup", "course_payment", "refund", "admin_adjustment"
  amount: integer("amount").notNull(), // IRR amount
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  merchantTransactionId: text("merchant_transaction_id"),
  shetabTransactionId: text("shetab_transaction_id"),
  shetabReferenceNumber: text("shetab_reference_number"),
  cardNumber: text("card_number"), // Masked card number
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Course Enrollment Payments (direct payments for courses)
export const coursePayments = pgTable("course_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  originalPrice: integer("original_price").notNull(), // Course price before discount
  discountPercentage: integer("discount_percentage").default(0), // Member tier discount
  finalPrice: integer("final_price").notNull(), // Price after discount
  creditsAwarded: integer("credits_awarded").default(0), // Credits earned from this payment
  paymentMethod: text("payment_method").notNull(), // "shetab", "wallet"
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  merchantTransactionId: text("merchant_transaction_id"),
  shetabTransactionId: text("shetab_transaction_id"),
  shetabReferenceNumber: text("shetab_reference_number"),
  cardNumber: text("card_number"),
  gatewayResponse: jsonb("gateway_response"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, success, warning, error
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Institute branding settings
export const instituteBranding = pgTable("institute_branding", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#10B981"),
  accentColor: text("accent_color").default("#8B5CF6"),
  backgroundColor: text("background_color").default("#FFFFFF"),
  textColor: text("text_color").default("#1F2937"),
  favicon: text("favicon"),
  loginBackgroundImage: text("login_background_image"),
  fontFamily: text("font_family").default("Inter"),
  borderRadius: text("border_radius").default("0.5rem"),
  updatedAt: timestamp("updated_at").defaultNow()
});

// System Configuration for Technical Dependencies
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  // SMS API Configuration (Kavenegar)
  kavenegarApiKey: text("kavenegar_api_key"),
  kavenegarSenderNumber: text("kavenegar_sender_number"),
  smsEnabled: boolean("sms_enabled").default(false),
  
  // Payment Gateway Configuration (Shetab)
  shetabMerchantId: text("shetab_merchant_id"),
  shetabTerminalId: text("shetab_terminal_id"),
  shetabApiKey: text("shetab_api_key"),
  shetabGatewayUrl: text("shetab_gateway_url"),
  paymentEnabled: boolean("payment_enabled").default(false),
  
  // Email Configuration
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"),
  emailEnabled: boolean("email_enabled").default(false),
  
  // AI Configuration (Ollama)
  ollamaApiUrl: text("ollama_api_url").default("http://localhost:11434"),
  ollamaModel: text("ollama_model").default("llama3.2"),
  aiEnabled: boolean("ai_enabled").default(true),
  
  // General Settings
  maintenanceMode: boolean("maintenance_mode").default(false),
  registrationEnabled: boolean("registration_enabled").default(true),
  maxUsersPerInstitute: integer("max_users_per_institute").default(1000),
  
  updatedAt: timestamp("updated_at").defaultNow()
});

// Custom Roles and Permissions System
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull(), // JSON array of permission strings
  isSystemRole: boolean("is_system_role").default(false), // true for admin, teacher, student, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Gamification System
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // streak, milestone, social, skill
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").default(0),
  badgeColor: text("badge_color").default("#3B82F6"),
  requirements: jsonb("requirements").notNull(), // Conditions to unlock
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isNotified: boolean("is_notified").default(false)
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  totalXp: integer("total_xp").default(0),
  currentLevel: integer("current_level").default(1),
  streakDays: integer("streak_days").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalStudyTime: integer("total_study_time").default(0), // in minutes
  lessonsCompleted: integer("lessons_completed").default(0),
  quizzesCompleted: integer("quizzes_completed").default(0),
  perfectScores: integer("perfect_scores").default(0),
  wordsLearned: integer("words_learned").default(0),
  conversationsCompleted: integer("conversations_completed").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const dailyGoals = pgTable("daily_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  goalType: text("goal_type").notNull(), // study_time, lessons, vocabulary, speaking
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").default(0),
  goalDate: timestamp("goal_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  xpReward: integer("xp_reward").default(10),
  createdAt: timestamp("created_at").defaultNow()
});

// Level assessment questions - managed by admins/managers
export const levelAssessmentQuestions = pgTable("level_assessment_questions", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 10 }).notNull(), // Target language for the question
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // "multiple_choice", "audio", "image", "text_input", "speaking"
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // "beginner", "intermediate", "advanced"
  options: jsonb("options"), // For multiple choice questions
  correctAnswer: text("correct_answer"),
  mediaUrl: varchar("media_url", { length: 500 }), // For audio/image questions
  points: integer("points").default(1),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User level assessment results
export const levelAssessmentResults = pgTable("level_assessment_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  totalScore: integer("total_score").notNull(),
  maxScore: integer("max_score").notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 50 }).notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  answers: jsonb("answers").notNull(), // Store user answers for review
  timeTaken: integer("time_taken") // in seconds
});

// CRM Management Tables
export const institutes = pgTable("institutes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Unique institute identifier
  description: text("description"),
  address: text("address"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  website: text("website"),
  logo: text("logo"), // URL to logo image
  primaryColor: text("primary_color").default("#3B82F6"),
  secondaryColor: text("secondary_color").default("#10B981"),
  timezone: text("timezone").default("UTC"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  instituteId: integer("institute_id").references(() => institutes.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  headTeacherId: integer("head_teacher_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const studentGroups = pgTable("student_groups", {
  id: serial("id").primaryKey(),
  instituteId: integer("institute_id").references(() => institutes.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull(), // Target language
  level: text("level").notNull(), // beginner, intermediate, advanced
  maxStudents: integer("max_students").default(20),
  currentStudents: integer("current_students").default(0),
  teacherId: integer("teacher_id").references(() => users.id),
  schedule: jsonb("schedule"), // Weekly schedule
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const studentGroupMembers = pgTable("student_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => studentGroups.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").default("active"), // active, completed, dropped, suspended
  progress: integer("progress").default(0), // 0-100
  lastAttendance: timestamp("last_attendance")
});

export const teacherAssignments = pgTable("teacher_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  instituteId: integer("institute_id").references(() => institutes.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  subjects: text("subjects").array().default([]), // Languages they teach
  maxStudents: integer("max_students").default(50),
  currentStudents: integer("current_students").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  contractType: text("contract_type").default("part_time"), // full_time, part_time, freelance
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").default("active"), // active, inactive, terminated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  groupId: integer("group_id").references(() => studentGroups.id),
  sessionId: integer("session_id").references(() => sessions.id),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, late, excused
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  notes: text("notes"),
  markedBy: integer("marked_by").references(() => users.id), // Teacher who marked attendance
  createdAt: timestamp("created_at").defaultNow()
});

export const studentNotes = pgTable("student_notes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // academic, behavioral, progress, concern, achievement
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  isPrivate: boolean("is_private").default(false), // Visible only to authorized staff
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const parentGuardians = pgTable("parent_guardians", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // father, mother, guardian, other
  phoneNumber: text("phone_number"),
  email: text("email"),
  address: text("address"),
  isPrimary: boolean("is_primary").default(false),
  emergencyContact: boolean("emergency_contact").default(false),
  canPickup: boolean("can_pickup").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id),
  toParentId: integer("to_parent_id").references(() => parentGuardians.id),
  type: text("type").notNull(), // email, sms, phone_call, meeting, note
  subject: text("subject"),
  content: text("content").notNull(),
  status: text("status").default("sent"), // sent, delivered, read, failed
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"), // Additional data like SMS provider response
  createdAt: timestamp("created_at").defaultNow()
});

export const studentReports = pgTable("student_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  generatedBy: integer("generated_by").references(() => users.id).notNull(),
  reportType: text("report_type").notNull(), // progress, assessment, behavior, attendance
  period: text("period").notNull(), // weekly, monthly, quarterly, semester, annual
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  data: jsonb("data").notNull(), // Report data and metrics
  comments: text("comments"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas - simplified to remove TypeScript errors
export const insertUserSchema = createInsertSchema(users);
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export const insertUserSessionSchema = createInsertSchema(userSessions);
export const insertCourseSchema = createInsertSchema(courses);
export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const insertSessionSchema = createInsertSchema(sessions);
export const insertMessageSchema = createInsertSchema(messages);
export const insertHomeworkSchema = createInsertSchema(homework);
export const insertPaymentSchema = createInsertSchema(payments);
// Admin settings schema defined below with comprehensive version
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export const insertCoursePaymentSchema = createInsertSchema(coursePayments);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertBrandingSchema = createInsertSchema(instituteBranding);
export const insertSystemConfigSchema = createInsertSchema(systemConfig);
export const insertCustomRoleSchema = createInsertSchema(customRoles);
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertUserStatsSchema = createInsertSchema(userStats);

export const insertDailyGoalSchema = createInsertSchema(dailyGoals).omit({
  id: true,
  createdAt: true
});

export const insertLevelAssessmentQuestionSchema = createInsertSchema(levelAssessmentQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLevelAssessmentResultSchema = createInsertSchema(levelAssessmentResults).omit({
  id: true,
  completedAt: true
});

// CRM Insert Schemas
export const insertInstituteSchema = createInsertSchema(institutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentGroupSchema = createInsertSchema(studentGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentGroupMemberSchema = createInsertSchema(studentGroupMembers).omit({
  id: true,
  enrolledAt: true
});

export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true
});

export const insertStudentNoteSchema = createInsertSchema(studentNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertParentGuardianSchema = createInsertSchema(parentGuardians).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  createdAt: true
});

export const insertStudentReportSchema = createInsertSchema(studentReports).omit({
  id: true,
  createdAt: true
});

// Referral Settings - User-defined commission split preferences
export const referralSettings = pgTable("referral_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique().notNull(),
  
  // Commission split settings (max 20% total)
  referrerPercentage: integer("referrer_percentage").default(15).notNull(), // 0-20, how much referrer gets
  referredPercentage: integer("referred_percentage").default(5).notNull(), // 0-20, how much referred user gets
  
  // Statistics
  totalReferrals: integer("total_referrals").default(0).notNull(),
  totalEnrollments: integer("total_enrollments").default(0).notNull(),
  totalCommissionEarned: integer("total_commission_earned").default(0).notNull(), // in IRR
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Course Referrals - Track specific course referrals
export const courseReferrals = pgTable("course_referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  referralCode: varchar("referral_code", { length: 20 }).unique().notNull(),
  
  // Tracking data
  totalShares: integer("total_shares").default(0).notNull(), // SMS/WhatsApp shares
  totalClicks: integer("total_clicks").default(0).notNull(),
  totalEnrollments: integer("total_enrollments").default(0).notNull(),
  totalCommissionEarned: integer("total_commission_earned").default(0).notNull(), // in IRR
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Referral Commissions - Track and manage commission payouts
export const referralCommissions = pgTable("referral_commissions", {
  id: serial("id").primaryKey(),
  courseReferralId: integer("course_referral_id").references(() => courseReferrals.id).notNull(),
  referrerUserId: integer("referrer_user_id").references(() => users.id).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id),
  
  // Commission details (max 20% of course fee)
  coursePrice: integer("course_price").notNull(), // Original course price
  totalCommissionRate: integer("total_commission_rate").default(20).notNull(), // Always 20%
  totalCommissionAmount: integer("total_commission_amount").notNull(), // 20% of course price
  
  // Split information
  referrerAmount: integer("referrer_amount").notNull(), // Amount for referrer
  referredAmount: integer("referred_amount").default(0).notNull(), // Amount for referred user
  
  // Status tracking
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, paid, cancelled
  paidAt: timestamp("paid_at"),
  
  // Related transaction
  relatedPaymentId: integer("related_payment_id").references(() => payments.id),
  relatedEnrollmentId: integer("related_enrollment_id").references(() => enrollments.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Referral system insert schemas
export const insertReferralSettingsSchema = createInsertSchema(referralSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCourseReferralSchema = createInsertSchema(courseReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertReferralCommissionSchema = createInsertSchema(referralCommissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Homework = typeof homework.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type CoursePayment = typeof coursePayments.$inferSelect;
export type InsertCoursePayment = z.infer<typeof insertCoursePaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InstituteBranding = typeof instituteBranding.$inferSelect;
export type InsertBranding = z.infer<typeof insertBrandingSchema>;
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
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;

// CRM Types
export type Institute = typeof institutes.$inferSelect;
export type InsertInstitute = z.infer<typeof insertInstituteSchema>;
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
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  
  // Payment Gateway Settings (Shetab)
  shetabMerchantId: varchar("shetab_merchant_id", { length: 255 }),
  shetabTerminalId: varchar("shetab_terminal_id", { length: 255 }),
  shetabApiKey: text("shetab_api_key"),
  shetabSecretKey: text("shetab_secret_key"),
  shetabEnvironment: varchar("shetab_environment", { length: 20 }).default("sandbox"),
  shetabEnabled: boolean("shetab_enabled").default(false),
  
  // SMS API Settings (Kavehnegar)
  kavehnegarApiKey: text("kavehnegar_api_key"),
  kavehnegarSender: varchar("kavehnegar_sender", { length: 50 }),
  kavehnegarEnabled: boolean("kavehnegar_enabled").default(false),
  
  // Email Settings
  emailSmtpHost: varchar("email_smtp_host", { length: 255 }),
  emailSmtpPort: integer("email_smtp_port").default(587),
  emailUsername: varchar("email_username", { length: 255 }),
  emailPassword: text("email_password"),
  emailFromAddress: varchar("email_from_address", { length: 255 }),
  emailEnabled: boolean("email_enabled").default(false),
  
  // Database Settings
  databaseBackupEnabled: boolean("database_backup_enabled").default(true),
  databaseBackupFrequency: varchar("database_backup_frequency", { length: 20 }).default("daily"),
  databaseRetentionDays: integer("database_retention_days").default(30),
  
  // Security Settings
  jwtSecretKey: text("jwt_secret_key"),
  sessionTimeout: integer("session_timeout").default(60), // minutes
  maxLoginAttempts: integer("max_login_attempts").default(5),
  passwordMinLength: integer("password_min_length").default(8),
  requireTwoFactor: boolean("require_two_factor").default(false),
  
  // System Settings
  systemMaintenanceMode: boolean("system_maintenance_mode").default(false),
  systemDebugMode: boolean("system_debug_mode").default(false),
  systemLogLevel: varchar("system_log_level", { length: 20 }).default("info"),
  systemMaxUploadSize: integer("system_max_upload_size").default(10), // MB
  
  // Notification Settings
  notificationEmailEnabled: boolean("notification_email_enabled").default(true),
  notificationSmsEnabled: boolean("notification_sms_enabled").default(true),
  notificationPushEnabled: boolean("notification_push_enabled").default(true),
  
  // API Rate Limiting
  apiRateLimit: integer("api_rate_limit").default(100),
  apiRateLimitWindow: integer("api_rate_limit_window").default(60), // seconds
  
  // File Storage
  fileStorageProvider: varchar("file_storage_provider", { length: 20 }).default("local"),
  fileStorageConfig: jsonb("file_storage_config"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Admin settings schema
export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Referral System Types
export type ReferralSettings = typeof referralSettings.$inferSelect;
export type InsertReferralSettings = z.infer<typeof insertReferralSettingsSchema>;
export type CourseReferral = typeof courseReferrals.$inferSelect;
export type InsertCourseReferral = z.infer<typeof insertCourseReferralSchema>;
export type ReferralCommission = typeof referralCommissions.$inferSelect;
export type InsertReferralCommission = z.infer<typeof insertReferralCommissionSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;