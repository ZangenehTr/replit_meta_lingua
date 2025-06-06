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
  credits: integer("credits").default(0),
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
  
  // Scheduling
  classType: text("class_type").notNull(), // "online" or "offline"
  weekdays: text("weekdays").array().notNull(), // ["monday", "wednesday", "friday"]
  startTime: text("start_time").notNull(), // "18:00"
  endTime: text("end_time").notNull(), // "19:30"
  
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true
});

export const insertHomeworkSchema = createInsertSchema(homework).omit({
  id: true,
  assignedAt: true
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

export const insertBrandingSchema = createInsertSchema(instituteBranding).omit({
  id: true,
  updatedAt: true
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true
});

export const insertCustomRoleSchema = createInsertSchema(customRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true
});

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