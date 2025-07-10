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
  role: text("role").notNull().default("Student"), // Admin, Teacher/Tutor, Mentor, Student, Supervisor, Call Center Agent, Accountant
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
  role: text("role").notNull(), // Admin, Teacher/Tutor, Student, Mentor, Supervisor, Call Center Agent, Accountant
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
  deliveryMode: text("delivery_mode").notNull(), // "online", "in_person", "self_paced", "callern"
  classFormat: text("class_format").notNull(), // "group", "one_on_one", "callern_package" (not applicable for self_paced)
  maxStudents: integer("max_students"), // null for one-on-one, number for group classes
  
  // Scheduling (not applicable for self_paced)
  firstSessionDate: date("first_session_date"), // Start date of the course
  lastSessionDate: date("last_session_date"), // Calculated end date
  weekdays: text("weekdays").array(), // ["monday", "wednesday", "friday"]
  startTime: text("start_time"), // "18:00"
  endTime: text("end_time"), // "19:30"
  timeZone: text("time_zone").default("Asia/Tehran"), // Course timezone
  calendarType: text("calendar_type").default("gregorian"), // "gregorian" or "persian"
  
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

// Rooms table for physical and virtual classrooms
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Room 101", "Conference Room A"
  type: text("type").notNull().default("physical"), // "physical" or "virtual"
  capacity: integer("capacity").notNull().default(20),
  building: text("building"), // e.g., "Main Building", "East Wing"
  floor: text("floor"), // e.g., "1st Floor", "Ground Floor"
  equipment: text("equipment").array().default([]), // ["Whiteboard", "Projector", "Smart Board"]
  amenities: text("amenities").array().default([]), // ["Air Conditioning", "Natural Light", "Wheelchair Access"]
  description: text("description"),
  isActive: boolean("is_active").default(true),
  maintenanceStatus: text("maintenance_status").default("operational"), // "operational", "maintenance", "unavailable"
  virtualRoomUrl: text("virtual_room_url"), // For virtual rooms
  virtualRoomProvider: text("virtual_room_provider"), // "zoom", "meet", "teams", etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Course Sessions - Scheduled class sessions for courses
export const courseSessions = pgTable("course_sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  sessionNumber: integer("session_number").notNull(), // 1, 2, 3...
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: date("scheduled_date").notNull(),
  startTime: text("start_time").notNull(), // "18:00"
  endTime: text("end_time").notNull(), // "19:30"
  durationMinutes: integer("duration_minutes").notNull(), // 90
  status: text("status").default("scheduled"), // scheduled, completed, cancelled, rescheduled
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  attendanceCount: integer("attendance_count").default(0),
  recording_url: text("recording_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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

// Session Packages for Private Students
export const sessionPackages = pgTable("session_packages", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  packageName: varchar("package_name", { length: 255 }).notNull(),
  totalSessions: integer("total_sessions").notNull(),
  sessionDuration: integer("session_duration").notNull(), // in minutes
  usedSessions: integer("used_sessions").default(0).notNull(),
  remainingSessions: integer("remaining_sessions").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default('active'), // active, completed, expired
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Callern Video Call Packages
export const callernPackages = pgTable("callern_packages", {
  id: serial("id").primaryKey(),
  packageName: varchar("package_name", { length: 100 }).notNull(),
  totalHours: integer("total_hours").notNull(), // Total hours in the package
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // IRR
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Callern Packages (purchased packages)
export const studentCallernPackages = pgTable("student_callern_packages", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  packageId: integer("package_id").notNull().references(() => callernPackages.id),
  totalHours: integer("total_hours").notNull(),
  usedMinutes: integer("used_minutes").default(0).notNull(), // Track in minutes for precision
  remainingMinutes: integer("remaining_minutes").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default('active').notNull(), // active, completed, expired
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Callern Availability
export const teacherCallernAvailability = pgTable("teacher_callern_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  isOnline: boolean("is_online").default(false).notNull(),
  lastActiveAt: timestamp("last_active_at"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Optional teacher-specific rate
  availableHours: text("available_hours").array(), // JSON array of available time slots
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Callern Call History
export const callernCallHistory = pgTable("callern_call_history", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  packageId: integer("package_id").notNull().references(() => studentCallernPackages.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  status: varchar("status", { length: 20 }).notNull(), // scheduled, in-progress, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Callern Syllabus Topics
export const callernSyllabusTopics = pgTable("callern_syllabus_topics", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // grammar, vocabulary
  level: varchar("level", { length: 20 }).notNull(), // beginner, intermediate, advanced
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Callern Progress
export const studentCallernProgress = pgTable("student_callern_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  topicId: integer("topic_id").notNull().references(() => callernSyllabusTopics.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  callId: integer("call_id").references(() => callernCallHistory.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

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
export const insertSessionPackageSchema = createInsertSchema(sessionPackages);
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

// Lead schema moved to after table definition to avoid forward reference

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

// Communication log schema moved to end of file

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

// AI Training Data Storage
export const aiTrainingData = pgTable("ai_training_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  modelName: varchar("model_name", { length: 100 }).notNull(), // Model this data is trained for
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // pdf, txt, docx, etc.
  content: text("content").notNull(), // Extracted text content
  tags: text("tags").array().default([]), // Topic tags for categorization
  isActive: boolean("is_active").default(true),
  trainedAt: timestamp("trained_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Skill Assessment Tracking
export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillType: varchar("skill_type", { length: 20 }).notNull(), // speaking, listening, reading, writing, grammar, vocabulary
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // quiz, assignment, ai_conversation, etc.
  activityId: integer("activity_id"),
  metadata: jsonb("metadata").$type<{
    errors?: string[],
    timeTaken?: number,
    wordsPerMinute?: number,
    accuracy?: number,
    feedback?: string
  }>(), // Additional context
  assessedAt: timestamp("assessed_at").defaultNow().notNull()
});

// Learning Activities Tracking
export const learningActivities = pgTable("learning_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  durationMinutes: integer("duration_minutes"),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }),
  skillPoints: jsonb("skill_points").$type<{
    speaking?: number,
    listening?: number,
    reading?: number,
    writing?: number,
    grammar?: number,
    vocabulary?: number
  }>(), // Points earned for each skill
  metadata: jsonb("metadata").$type<{
    title?: string,
    description?: string,
    difficulty?: string,
    performance?: any
  }>(), // Additional activity-specific data
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Progress Snapshots for Historical Tracking
export const progressSnapshots = pgTable("progress_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillScores: jsonb("skill_scores").$type<{
    speaking: number,
    listening: number,
    reading: number,
    writing: number,
    grammar: number,
    vocabulary: number
  }>().notNull(), // Current scores for all skills
  overallLevel: varchar("overall_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).notNull(),
  snapshotDate: date("snapshot_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// AI Knowledge Base - Processed training data ready for retrieval
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: serial("id").primaryKey(),
  trainingDataId: integer("training_data_id").references(() => aiTrainingData.id).notNull(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(), // Main topic/subject
  keyTerms: text("key_terms").array().default([]), // Important keywords
  content: text("content").notNull(), // Processed content chunk
  metadata: jsonb("metadata"), // Additional context
  similarity_score: decimal("similarity_score", { precision: 5, scale: 3 }), // For semantic search
  createdAt: timestamp("created_at").defaultNow()
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

export const insertAiTrainingDataSchema = createInsertSchema(aiTrainingData).omit({
  id: true,
  trainedAt: true,
  createdAt: true
});

// Skill tracking insert schemas
export const insertSkillAssessmentSchema = createInsertSchema(skillAssessments).omit({
  id: true,
  assessedAt: true
});

export const insertLearningActivitySchema = createInsertSchema(learningActivities).omit({
  id: true,
  createdAt: true
});

export const insertProgressSnapshotSchema = createInsertSchema(progressSnapshots).omit({
  id: true,
  createdAt: true
});

export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase).omit({
  id: true,
  createdAt: true
});

// All insert schemas moved to end of file after table definitions

// LEAD MANAGEMENT SYSTEM (Call Center)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number").notNull(),
  source: text("source").notNull(), // website, social_media, referral, advertisement, walk_in
  status: text("status").notNull().default("new"), // new, contacted, interested, qualified, converted, lost
  priority: text("priority").default("medium"), // low, medium, high, urgent
  interestedLanguage: text("interested_language"), // persian, english, arabic, etc
  interestedLevel: text("interested_level"), // beginner, intermediate, advanced
  preferredFormat: text("preferred_format"), // group, individual, online, in_person
  budget: integer("budget"), // IRR amount
  notes: text("notes"),
  assignedAgentId: integer("assigned_agent_id").references(() => users.id),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  conversionDate: timestamp("conversion_date"),
  studentId: integer("student_id").references(() => users.id), // If converted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for leads
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// COMMUNICATION LOGS (Call Center)
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  studentId: integer("student_id").references(() => users.id),
  agentId: integer("agent_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // call, email, sms, meeting, note
  direction: text("direction"), // inbound, outbound
  duration: integer("duration_minutes"), // For calls
  outcome: text("outcome"), // answered, no_answer, busy, voicemail, interested, not_interested
  notes: text("notes"),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  recordingUrl: text("recording_url"), // For call recordings
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schema for communication logs
export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  createdAt: true
});

// FINANCIAL SYSTEM (Accountant)
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  amount: integer("amount").notNull(), // IRR amount
  taxAmount: integer("tax_amount").default(0), // Iranian VAT
  totalAmount: integer("total_amount").notNull(), // amount + tax
  currency: text("currency").default("IRR"),
  status: text("status").default("pending"), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paymentMethod: text("payment_method"), // shetab, cash, bank_transfer, credit
  shetabTransactionId: text("shetab_transaction_id"), // Shetab payment reference
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for invoices
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// PAYMENT TRANSACTIONS (Iranian Shetab Integration)
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  studentId: integer("student_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // IRR amount
  currency: text("currency").default("IRR"),
  method: text("method").notNull(), // shetab, bank_transfer, cash, wallet
  status: text("status").default("pending"), // pending, completed, failed, refunded
  shetabRefNumber: text("shetab_ref_number"), // Shetab reference number
  shetabCardNumber: text("shetab_card_number"), // Masked card number
  bankCode: text("bank_code"), // Iranian bank identifier
  terminalId: text("terminal_id"),
  description: text("description"),
  failureReason: text("failure_reason"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schema for payment transactions
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true
});

// ===== COMPREHENSIVE TESTING SUBSYSTEM =====

// Tests/Quizzes
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  teacherId: integer("teacher_id").references(() => users.id),
  testType: varchar("test_type", { length: 50 }).notNull(), // quiz, exam, placement, practice, assessment
  language: varchar("language", { length: 10 }).notNull(),
  level: varchar("level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  passingScore: integer("passing_score").default(60),
  timeLimit: integer("time_limit"), // in minutes
  maxAttempts: integer("max_attempts").default(1),
  randomizeQuestions: boolean("randomize_questions").default(false),
  showResults: boolean("show_results").default(true),
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  isActive: boolean("is_active").default(true),
  scheduledDate: timestamp("scheduled_date"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Test Questions - supports 8 question types
export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => tests.id).notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, true_false, fill_blank, matching, ordering, short_answer, essay, speaking
  questionText: text("question_text").notNull(),
  questionAudio: varchar("question_audio", { length: 500 }), // for listening questions
  questionImage: varchar("question_image", { length: 500 }), // for visual questions
  points: integer("points").default(1),
  order: integer("order").notNull(),
  
  // For multiple choice and true/false
  options: jsonb("options"), // array of {id, text, isCorrect}
  
  // For fill in blank
  blanksData: jsonb("blanks_data"), // array of {position, correctAnswer, acceptableAnswers}
  
  // For matching
  matchingPairs: jsonb("matching_pairs"), // array of {left, right}
  
  // For ordering
  orderingItems: jsonb("ordering_items"), // array in correct order
  
  // For short answer and essay
  modelAnswer: text("model_answer"),
  gradingCriteria: jsonb("grading_criteria"), // rubric for essay questions
  
  // For speaking
  recordingPrompt: text("recording_prompt"),
  maxRecordingDuration: integer("max_recording_duration"), // seconds
  
  explanation: text("explanation"), // shown after answering
  skillCategory: varchar("skill_category", { length: 50 }), // grammar, vocabulary, reading, writing, listening, speaking
  difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Test Attempts
export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => tests.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  attemptNumber: integer("attempt_number").default(1),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent"), // in seconds
  score: decimal("score", { precision: 5, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 20 }).default("in_progress"), // in_progress, completed, abandoned, submitted
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Test Answers
export const testAnswers = pgTable("test_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => testAttempts.id).notNull(),
  questionId: integer("question_id").references(() => testQuestions.id).notNull(),
  
  // Different answer types
  selectedOptionId: integer("selected_option_id"), // for multiple choice
  booleanAnswer: boolean("boolean_answer"), // for true/false
  textAnswer: text("text_answer"), // for short answer, essay, fill blank
  matchingAnswer: jsonb("matching_answer"), // for matching questions
  orderingAnswer: jsonb("ordering_answer"), // for ordering questions
  recordingUrl: varchar("recording_url", { length: 500 }), // for speaking questions
  
  isCorrect: boolean("is_correct"),
  pointsEarned: decimal("points_earned", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  gradedBy: integer("graded_by").references(() => users.id), // for manual grading
  gradedAt: timestamp("graded_at"),
  
  answeredAt: timestamp("answered_at").defaultNow().notNull()
});

// ===== GAMIFICATION SUBSYSTEM =====

// Language Learning Games
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameName: varchar("game_name", { length: 255 }).notNull(),
  gameCode: varchar("game_code", { length: 50 }).notNull().unique(), // unique identifier
  description: text("description"),
  gameType: varchar("game_type", { length: 50 }).notNull(), // vocabulary, grammar, listening, speaking, reading, writing, mixed
  ageGroup: varchar("age_group", { length: 20 }).notNull(), // 5-10, 11-14, 15-20, 21+
  minLevel: varchar("min_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2
  maxLevel: varchar("max_level", { length: 10 }).notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  
  // Game mechanics
  gameMode: varchar("game_mode", { length: 50 }).notNull(), // single_player, multiplayer, competitive, collaborative
  duration: integer("duration"), // estimated minutes per session
  pointsPerCorrect: integer("points_per_correct").default(10),
  bonusMultiplier: decimal("bonus_multiplier", { precision: 3, scale: 2 }).default(1.0),
  livesSystem: boolean("lives_system").default(false),
  timerEnabled: boolean("timer_enabled").default(false),
  
  // Resources
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  backgroundImage: varchar("background_image", { length: 500 }),
  soundEffects: jsonb("sound_effects"), // {correct: url, wrong: url, levelUp: url}
  
  // Progression
  totalLevels: integer("total_levels").default(10),
  unlockRequirements: jsonb("unlock_requirements"), // {minXP: 100, prerequisiteGames: []}
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Levels/Stages
export const gameLevels = pgTable("game_levels", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  levelNumber: integer("level_number").notNull(),
  levelName: varchar("level_name", { length: 100 }),
  languageLevel: varchar("language_level", { length: 10 }).notNull(), // A1, A2, etc.
  
  // Level content
  contentType: varchar("content_type", { length: 50 }).notNull(), // words, sentences, paragraphs, dialogues
  contentData: jsonb("content_data").notNull(), // actual game content
  
  // Difficulty settings
  difficulty: varchar("difficulty", { length: 20 }).default("medium"),
  speedMultiplier: decimal("speed_multiplier", { precision: 3, scale: 2 }).default(1.0),
  itemCount: integer("item_count").default(10), // number of items in this level
  
  // Rewards
  xpReward: integer("xp_reward").default(50),
  coinsReward: integer("coins_reward").default(10),
  badgeId: integer("badge_id").references(() => achievements.id),
  
  // Progression
  passingScore: integer("passing_score").default(70), // percentage
  starsThresholds: jsonb("stars_thresholds"), // {1: 60, 2: 80, 3: 95}
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User Game Progress
export const userGameProgress = pgTable("user_game_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  currentLevel: integer("current_level").default(1),
  
  // Overall progress
  totalScore: integer("total_score").default(0),
  totalXpEarned: integer("total_xp_earned").default(0),
  totalCoinsEarned: integer("total_coins_earned").default(0),
  totalPlayTime: integer("total_play_time").default(0), // in seconds
  sessionsPlayed: integer("sessions_played").default(0),
  
  // Performance metrics
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // percentage
  averageSpeed: decimal("average_speed", { precision: 5, scale: 2 }), // items per minute
  longestStreak: integer("longest_streak").default(0),
  perfectLevels: integer("perfect_levels").default(0),
  
  lastPlayedAt: timestamp("last_played_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Sessions
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  levelId: integer("level_id").references(() => gameLevels.id),
  
  // Session data
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in seconds
  
  // Performance
  score: integer("score").default(0),
  correctAnswers: integer("correct_answers").default(0),
  wrongAnswers: integer("wrong_answers").default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  starsEarned: integer("stars_earned").default(0), // 0-3
  
  // Rewards
  xpEarned: integer("xp_earned").default(0),
  coinsEarned: integer("coins_earned").default(0),
  newBadges: jsonb("new_badges"), // array of achievement IDs
  
  // Game state
  gameState: jsonb("game_state"), // for resuming
  isCompleted: boolean("is_completed").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Game Leaderboards
export const gameLeaderboards = pgTable("game_leaderboards", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Leaderboard types
  leaderboardType: varchar("leaderboard_type", { length: 50 }).notNull(), // daily, weekly, monthly, all_time
  period: varchar("period", { length: 20 }), // "2024-01", "2024-W05", etc.
  
  // Scores
  score: integer("score").notNull(),
  rank: integer("rank"),
  
  // Additional metrics
  gamesPlayed: integer("games_played").default(1),
  perfectGames: integer("perfect_games").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ===== VIDEO-BASED COURSES SUBSYSTEM =====

// Video Lessons
export const videoLessons = pgTable("video_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  teacherId: integer("teacher_id").references(() => users.id).notNull(), // Added for teacher management
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("video_url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  duration: integer("duration").notNull(), // in seconds
  
  // Content organization
  moduleId: integer("module_id"), // for grouping lessons
  orderIndex: integer("order_index").notNull(),
  
  // Learning metadata
  language: varchar("language", { length: 10 }).notNull(),
  level: varchar("level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  skillFocus: varchar("skill_focus", { length: 50 }), // speaking, listening, grammar, vocabulary
  
  // Supplementary materials
  transcriptUrl: varchar("transcript_url", { length: 500 }),
  subtitlesUrl: varchar("subtitles_url", { length: 500 }),
  materialsUrl: varchar("materials_url", { length: 500 }), // PDF, exercises
  
  // Access control
  isFree: boolean("is_free").default(false),
  isPublished: boolean("is_published").default(true),
  
  // Analytics
  viewCount: integer("view_count").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Progress Tracking
export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(), // Changed from userId to match API
  videoLessonId: integer("video_lesson_id").references(() => videoLessons.id).notNull(), // Changed from videoId to match API
  
  // Progress tracking
  watchTime: integer("watch_time").default(0), // Current watch position in seconds
  totalDuration: integer("total_duration").default(0), // Total video duration
  completed: boolean("completed").default(false), // Changed from isCompleted to match API
  
  // Engagement metrics
  totalWatchTime: integer("total_watch_time").default(0), // including replays
  pauseCount: integer("pause_count").default(0),
  rewindCount: integer("rewind_count").default(0),
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default(1.0),
  
  // Learning tracking
  notesCount: integer("notes_count").default(0),
  bookmarksCount: integer("bookmarks_count").default(0),
  
  lastWatchedAt: timestamp("last_watched_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Notes
export const videoNotes = pgTable("video_notes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(), // Changed from userId to match API
  videoLessonId: integer("video_lesson_id").references(() => videoLessons.id).notNull(), // Changed from videoId to match API
  
  timestamp: integer("timestamp").notNull(), // seconds in video
  content: text("content").notNull(), // Changed from noteText to match API
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Bookmarks
export const videoBookmarks = pgTable("video_bookmarks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(), // Changed from userId to match API
  videoLessonId: integer("video_lesson_id").references(() => videoLessons.id).notNull(), // Changed from videoId to match API
  
  timestamp: integer("timestamp").notNull(), // seconds in video
  title: varchar("title", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// ===== ENHANCED LMS FEATURES =====

// Discussion Forums
export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const forumThreads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => forumCategories.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  lastReplyBy: integer("last_reply_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => forumThreads.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  
  content: text("content").notNull(),
  
  isAnswer: boolean("is_answer").default(false), // for Q&A threads
  upvotes: integer("upvotes").default(0),
  
  editedAt: timestamp("edited_at"),
  editedBy: integer("edited_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Gradebook
export const gradebookEntries = pgTable("gradebook_entries", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  
  // Grade components
  assignmentGrades: jsonb("assignment_grades"), // {assignmentId: grade}
  testGrades: jsonb("test_grades"), // {testId: grade}
  participationGrade: decimal("participation_grade", { precision: 5, scale: 2 }),
  attendanceGrade: decimal("attendance_grade", { precision: 5, scale: 2 }),
  
  // Overall grades
  currentGrade: decimal("current_grade", { precision: 5, scale: 2 }),
  projectedGrade: decimal("projected_grade", { precision: 5, scale: 2 }),
  letterGrade: varchar("letter_grade", { length: 5 }),
  
  // Teacher feedback
  comments: text("comments"),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Content Library
export const contentLibrary = pgTable("content_library", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  contentType: varchar("content_type", { length: 50 }).notNull(), // document, audio, image, worksheet, presentation
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  
  // Metadata
  language: varchar("language", { length: 10 }).notNull(),
  level: varchar("level", { length: 20 }), // A1-C2
  skillArea: varchar("skill_area", { length: 50 }), // grammar, vocabulary, etc.
  tags: text("tags").array().default([]),
  
  // Usage tracking
  downloadCount: integer("download_count").default(0),
  useCount: integer("use_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  
  // Sharing
  isPublic: boolean("is_public").default(false),
  licenseType: varchar("license_type", { length: 50 }), // CC-BY, proprietary, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ===== AI INTEGRATION FOR COMPREHENSIVE TRACKING =====

// AI Progress Tracking
export const aiProgressTracking = pgTable("ai_progress_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Speaking Skills
  speakingAccuracy: decimal("speaking_accuracy", { precision: 5, scale: 2 }),
  speakingFluency: decimal("speaking_fluency", { precision: 5, scale: 2 }),
  pronunciation: decimal("pronunciation", { precision: 5, scale: 2 }),
  intonation: decimal("intonation", { precision: 5, scale: 2 }),
  
  // Writing Skills
  writingAccuracy: decimal("writing_accuracy", { precision: 5, scale: 2 }),
  writingComplexity: decimal("writing_complexity", { precision: 5, scale: 2 }),
  writingCoherence: decimal("writing_coherence", { precision: 5, scale: 2 }),
  
  // Vocabulary
  vocabularySize: integer("vocabulary_size"),
  vocabularyRetention: decimal("vocabulary_retention", { precision: 5, scale: 2 }),
  vocabularyUsage: decimal("vocabulary_usage", { precision: 5, scale: 2 }),
  
  // Grammar
  grammarAccuracy: decimal("grammar_accuracy", { precision: 5, scale: 2 }),
  grammarComplexity: decimal("grammar_complexity", { precision: 5, scale: 2 }),
  
  // Overall Progress
  overallLevel: varchar("overall_level", { length: 10 }), // A1-C2
  progressRate: decimal("progress_rate", { precision: 5, scale: 2 }), // percentage per month
  
  lastAssessedAt: timestamp("last_assessed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// AI Activity Sessions
export const aiActivitySessions = pgTable("ai_activity_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // speaking_practice, writing_exercise, vocabulary_game, grammar_quiz
  
  // Session details
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // seconds
  
  // AI Analysis
  aiModel: varchar("ai_model", { length: 50 }),
  analysisData: jsonb("analysis_data"), // detailed AI analysis results
  
  // Performance metrics
  score: decimal("score", { precision: 5, scale: 2 }),
  mistakes: jsonb("mistakes"), // array of mistake objects
  improvements: jsonb("improvements"), // suggested improvements
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// AI Vocabulary Tracking
export const aiVocabularyTracking = pgTable("ai_vocabulary_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  word: varchar("word", { length: 100 }).notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  
  // Learning metrics
  timesEncountered: integer("times_encountered").default(1),
  timesUsedCorrectly: integer("times_used_correctly").default(0),
  timesUsedIncorrectly: integer("times_used_incorrectly").default(0),
  
  // Retention data
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at"),
  lastUsedAt: timestamp("last_used_at"),
  masteryLevel: decimal("mastery_level", { precision: 3, scale: 2 }).default(0), // 0-1
  
  // Context
  contexts: jsonb("contexts"), // array of usage contexts
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// AI Grammar Pattern Tracking
export const aiGrammarTracking = pgTable("ai_grammar_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  patternType: varchar("pattern_type", { length: 100 }).notNull(), // tense, conditional, modal, etc.
  patternName: varchar("pattern_name", { length: 255 }).notNull(),
  
  // Mastery metrics
  correctUsage: integer("correct_usage").default(0),
  incorrectUsage: integer("incorrect_usage").default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  
  // Learning progress
  introduced: boolean("introduced").default(true),
  practiced: boolean("practiced").default(false),
  mastered: boolean("mastered").default(false),
  
  // Examples and feedback
  exampleSentences: jsonb("example_sentences"),
  commonMistakes: jsonb("common_mistakes"),
  
  lastPracticedAt: timestamp("last_practiced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// AI Pronunciation Analysis
export const aiPronunciationAnalysis = pgTable("ai_pronunciation_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => aiActivitySessions.id),
  
  // Audio data
  audioUrl: varchar("audio_url", { length: 500 }).notNull(),
  transcription: text("transcription"),
  expectedText: text("expected_text"),
  
  // Analysis results
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  clarity: decimal("clarity", { precision: 5, scale: 2 }),
  fluency: decimal("fluency", { precision: 5, scale: 2 }),
  nativelikeness: decimal("nativelikeness", { precision: 5, scale: 2 }),
  
  // Detailed feedback
  phoneticAnalysis: jsonb("phonetic_analysis"), // phoneme-level analysis
  stressPatterns: jsonb("stress_patterns"),
  intonationAnalysis: jsonb("intonation_analysis"),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// TEACHER EVALUATIONS (Supervisor)
export const teacherEvaluations = pgTable("teacher_evaluations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  evaluationPeriod: text("evaluation_period").notNull(), // "2024-Q1", "2024-January", etc
  teachingEffectiveness: integer("teaching_effectiveness"), // 1-10 scale
  classroomManagement: integer("classroom_management"), // 1-10 scale
  studentEngagement: integer("student_engagement"), // 1-10 scale
  contentKnowledge: integer("content_knowledge"), // 1-10 scale
  communication: integer("communication"), // 1-10 scale
  professionalism: integer("professionalism"), // 1-10 scale
  overallRating: decimal("overall_rating", { precision: 3, scale: 1 }), // Average rating
  strengths: text("strengths").array().default([]),
  improvementAreas: text("improvement_areas").array().default([]),
  recommendations: text("recommendations"),
  goals: text("goals").array().default([]),
  observationNotes: text("observation_notes"),
  studentFeedbackSummary: text("student_feedback_summary"),
  status: text("status").default("draft"), // draft, completed, reviewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for teacher evaluations
export const insertTeacherEvaluationSchema = createInsertSchema(teacherEvaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// CLASS OBSERVATIONS (Supervisor)
export const classObservations = pgTable("class_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  sessionId: integer("session_id").references(() => sessions.id),
  observationDate: timestamp("observation_date").notNull(),
  duration: integer("duration_minutes"),
  lessonTopic: text("lesson_topic"),
  preparedness: integer("preparedness"), // 1-5 scale
  delivery: integer("delivery"), // 1-5 scale
  studentParticipation: integer("student_participation"), // 1-5 scale
  materialUsage: integer("material_usage"), // 1-5 scale
  timeManagement: integer("time_management"), // 1-5 scale
  observations: text("observations"),
  positivePoints: text("positive_points").array().default([]),
  improvementSuggestions: text("improvement_suggestions").array().default([]),
  followUpRequired: boolean("follow_up_required").default(false),
  followUpNotes: text("follow_up_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schema for class observations
export const insertClassObservationSchema = createInsertSchema(classObservations).omit({
  id: true,
  createdAt: true
});

// SYSTEM METRICS (Admin)
export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // database_response, storage_usage, user_activity, error_rate
  value: decimal("value", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit"), // ms, GB, percentage, count
  metadata: jsonb("metadata"), // Additional metric details
  recordedAt: timestamp("recorded_at").defaultNow().notNull()
});

// Insert schema for system metrics
export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  recordedAt: true
});

// MENTOR ASSIGNMENTS (Mentor Dashboard)
export const mentorAssignments = pgTable("mentor_assignments", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  status: text("status").default("active"), // active, completed, paused, terminated
  assignedDate: timestamp("assigned_date").defaultNow().notNull(),
  completedDate: timestamp("completed_date"),
  goals: text("goals").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MENTORING SESSIONS 
export const mentoringSessions = pgTable("mentoring_sessions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => mentorAssignments.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration_minutes").default(60),
  status: text("status").default("scheduled"), // scheduled, completed, cancelled, no_show
  sessionType: text("session_type"), // goal_setting, progress_review, motivation, problem_solving
  topics: text("topics").array().default([]),
  outcomes: text("outcomes"),
  nextSteps: text("next_steps").array().default([]),
  studentProgress: integer("student_progress"), // 1-10 scale
  mentorNotes: text("mentor_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas for mentor assignments and mentoring sessions
export const insertMentorAssignmentSchema = createInsertSchema(mentorAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMentoringSessionSchema = createInsertSchema(mentoringSessions).omit({
  id: true,
  createdAt: true
});

// Insert schema for rooms
export const insertRoomSchema = createInsertSchema(rooms).omit({
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
export type SessionPackage = typeof sessionPackages.$inferSelect;
export type InsertSessionPackage = z.infer<typeof insertSessionPackageSchema>;
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
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
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
  
  // SMS API Settings (Kavenegar)
  kavenegarApiKey: text("kavenegar_api_key"),
  kavenegarSender: varchar("kavenegar_sender", { length: 50 }),
  kavenegarEnabled: boolean("kavenegar_enabled").default(false),
  
  // VoIP Settings (Isabel Line)
  voipServerAddress: varchar("voip_server_address", { length: 255 }),
  voipPort: integer("voip_port").default(5060),
  voipUsername: varchar("voip_username", { length: 100 }),
  voipPassword: text("voip_password"),
  voipEnabled: boolean("voip_enabled").default(false),
  callRecordingEnabled: boolean("call_recording_enabled").default(false),
  recordingStoragePath: varchar("recording_storage_path", { length: 500 }).default("/var/recordings"),
  
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
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
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

// Mood-Based Learning Recommendation System - Iranian Compliant (Offline-First)
export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  moodScore: integer('mood_score').notNull(), // 1-10 scale
  moodCategory: text('mood_category').notNull(), // happy, sad, stressed, motivated, tired, etc.
  energyLevel: integer('energy_level').notNull(), // 1-10 scale
  motivationLevel: integer('motivation_level').notNull(), // 1-10 scale
  stressLevel: integer('stress_level').notNull(), // 1-10 scale
  focusLevel: integer('focus_level').notNull(), // 1-10 scale
  context: text('context'), // what triggered this mood (lesson difficulty, personal life, etc.)
  notes: text('notes'), // user's optional notes
  detectedFrom: text('detected_from').default('manual'), // manual, voice_analysis, behavioral_patterns
  metadata: jsonb('metadata'), // additional mood analysis data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const moodRecommendations = pgTable('mood_recommendations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  moodEntryId: integer('mood_entry_id').references(() => moodEntries.id).notNull(),
  recommendationType: text('recommendation_type').notNull(), // content, activity, break, challenge
  contentType: text('content_type'), // lesson, exercise, game, meditation, review
  difficulty: text('difficulty'), // easy, medium, hard
  duration: integer('duration'), // in minutes
  title: text('title').notNull(),
  description: text('description').notNull(),
  reasoning: text('reasoning').notNull(), // AI explanation for why this was recommended
  priority: integer('priority').default(5), // 1-10 priority score
  isAccepted: boolean('is_accepted'),
  completedAt: timestamp('completed_at'),
  effectivenessRating: integer('effectiveness_rating'), // 1-5 user feedback
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const learningAdaptations = pgTable('learning_adaptations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  moodPattern: text('mood_pattern').notNull(), // low_energy, high_stress, motivated, etc.
  adaptationStrategy: text('adaptation_strategy').notNull(),
  preferredContentTypes: jsonb('preferred_content_types'),
  optimalDuration: integer('optimal_duration'),
  bestTimeOfDay: text('best_time_of_day'),
  successRate: integer('success_rate').default(0), // percentage
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Mood system schemas and types
export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertMoodRecommendationSchema = createInsertSchema(moodRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertLearningAdaptationSchema = createInsertSchema(learningAdaptations).omit({
  id: true,
  lastUpdated: true,
});

// Mood system types
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type MoodRecommendation = typeof moodRecommendations.$inferSelect;
export type InsertMoodRecommendation = z.infer<typeof insertMoodRecommendationSchema>;
export type LearningAdaptation = typeof learningAdaptations.$inferSelect;
export type InsertLearningAdaptation = z.infer<typeof insertLearningAdaptationSchema>;

// Testing subsystem insert schemas
export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({
  id: true,
  createdAt: true
});

export const insertTestAnswerSchema = createInsertSchema(testAnswers).omit({
  id: true,
  answeredAt: true
});

// Gamification insert schemas
export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGameLevelSchema = createInsertSchema(gameLevels).omit({
  id: true,
  createdAt: true
});

export const insertUserGameProgressSchema = createInsertSchema(userGameProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  startedAt: true,
  createdAt: true
});

export const insertGameLeaderboardSchema = createInsertSchema(gameLeaderboards).omit({
  id: true,
  createdAt: true
});

// Video learning insert schemas
export const insertVideoLessonSchema = createInsertSchema(videoLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVideoNoteSchema = createInsertSchema(videoNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVideoBookmarkSchema = createInsertSchema(videoBookmarks).omit({
  id: true,
  createdAt: true
});

// LMS insert schemas
export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({
  id: true,
  createdAt: true
});

export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true
});

export const insertGradebookEntrySchema = createInsertSchema(gradebookEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// AI tracking insert schemas
export const insertAiProgressTrackingSchema = createInsertSchema(aiProgressTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiActivitySessionSchema = createInsertSchema(aiActivitySessions).omit({
  id: true,
  startedAt: true,
  createdAt: true
});

export const insertAiVocabularyTrackingSchema = createInsertSchema(aiVocabularyTracking).omit({
  id: true,
  firstSeenAt: true,
  createdAt: true
});

export const insertAiGrammarTrackingSchema = createInsertSchema(aiGrammarTracking).omit({
  id: true,
  createdAt: true
});

export const insertAiPronunciationAnalysisSchema = createInsertSchema(aiPronunciationAnalysis).omit({
  id: true,
  createdAt: true
});

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

// Mood categories and recommendation types for Iranian context
export const MOOD_CATEGORIES = [
  'happy', 'excited', 'motivated', 'calm', 'focused', 'confident', 'curious',
  'sad', 'frustrated', 'anxious', 'stressed', 'tired', 'bored', 'overwhelmed', 'confused', 'discouraged'
] as const;

export const RECOMMENDATION_TYPES = [
  'content', 'activity', 'break', 'challenge', 'review', 'meditation', 'social', 'gamification'
] as const;

export type MoodCategory = typeof MOOD_CATEGORIES[number];
export type RecommendationType = typeof RECOMMENDATION_TYPES[number];

// Callern system insert schemas
export const insertCallernPackageSchema = createInsertSchema(callernPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentCallernPackageSchema = createInsertSchema(studentCallernPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTeacherCallernAvailabilitySchema = createInsertSchema(teacherCallernAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCallernCallHistorySchema = createInsertSchema(callernCallHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCallernSyllabusTopicSchema = createInsertSchema(callernSyllabusTopics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentCallernProgressSchema = createInsertSchema(studentCallernProgress).omit({
  id: true,
  createdAt: true
});

// Callern system types
export type CallernPackage = typeof callernPackages.$inferSelect;
export type InsertCallernPackage = z.infer<typeof insertCallernPackageSchema>;
export type StudentCallernPackage = typeof studentCallernPackages.$inferSelect;
export type InsertStudentCallernPackage = z.infer<typeof insertStudentCallernPackageSchema>;
export type TeacherCallernAvailability = typeof teacherCallernAvailability.$inferSelect;
export type InsertTeacherCallernAvailability = z.infer<typeof insertTeacherCallernAvailabilitySchema>;
export type CallernCallHistory = typeof callernCallHistory.$inferSelect;
export type InsertCallernCallHistory = z.infer<typeof insertCallernCallHistorySchema>;
export type CallernSyllabusTopics = typeof callernSyllabusTopics.$inferSelect;
export type InsertCallernSyllabusTopics = z.infer<typeof insertCallernSyllabusTopicSchema>;
export type StudentCallernProgress = typeof studentCallernProgress.$inferSelect;
export type InsertStudentCallernProgress = z.infer<typeof insertStudentCallernProgressSchema>;

// ===== COMPREHENSIVE QUALITY ASSURANCE SYSTEM =====

// Live class monitoring
export const liveClassSessions = pgTable("live_class_sessions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  classTitle: varchar("class_title", { length: 255 }).notNull(),
  classType: text("class_type").notNull(), // online, in_person, hybrid
  meetingUrl: text("meeting_url"), // For online classes
  roomNumber: varchar("room_number", { length: 50 }), // For in-person classes
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: text("status").default("scheduled"), // scheduled, live, completed, cancelled
  recordingUrl: text("recording_url"), // For recorded classes
  supervisorJoinCount: integer("supervisor_join_count").default(0),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teacher attrition and retention tracking
export const teacherRetentionData = pgTable("teacher_retention_data", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  termName: varchar("term_name", { length: 100 }).notNull(), // e.g., "Fall 2024", "Spring 2025"
  termStartDate: timestamp("term_start_date").notNull(),
  termEndDate: timestamp("term_end_date").notNull(),
  studentsAtStart: integer("students_at_start").default(0),
  studentsAtEnd: integer("students_at_end").default(0),
  studentsDropped: integer("students_dropped").default(0),
  newStudentsJoined: integer("new_students_joined").default(0),
  retentionRate: decimal("retention_rate", { precision: 5, scale: 2 }), // percentage
  attritionRate: decimal("attrition_rate", { precision: 5, scale: 2 }), // percentage
  overallRetentionRate: decimal("overall_retention_rate", { precision: 5, scale: 2 }), // teacher's historical average
  overallAttritionRate: decimal("overall_attrition_rate", { precision: 5, scale: 2 }), // teacher's historical average
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Student questionnaire configuration
export const studentQuestionnaires = pgTable("student_questionnaires", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  triggerSessionNumber: integer("trigger_session_number").notNull(), // e.g., 4th session
  isActive: boolean("is_active").default(true),
  questions: jsonb("questions").$type<Array<{
    id: string;
    text: string;
    type: 'rating' | 'text' | 'multiple_choice';
    options?: string[];
    required: boolean;
  }>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Student questionnaire responses
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  questionnaireId: integer("questionnaire_id").references(() => studentQuestionnaires.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  responses: jsonb("responses").$type<Array<{
    questionId: string;
    answer: string | number;
  }>>().notNull(),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Supervision observation forms
export const supervisionObservations = pgTable("supervision_observations", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => liveClassSessions.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  observationType: text("observation_type").notNull(), // live_online, live_in_person, recorded
  joinTime: timestamp("join_time"),
  observationDuration: integer("observation_duration"), // in minutes
  scores: jsonb("scores").$type<{
    teachingMethodology: number;
    classroomManagement: number;
    studentEngagement: number;
    contentDelivery: number;
    languageSkills: number;
    timeManagement: number;
    technologyUse?: number;
  }>().notNull(),
  overallScore: decimal("overall_score", { precision: 3, scale: 2 }).notNull(),
  strengths: text("strengths"),
  areasForImprovement: text("areas_for_improvement"),
  actionItems: text("action_items"),
  followUpRequired: boolean("follow_up_required").default(false),
  teacherNotified: boolean("teacher_notified").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for quality assurance
export const insertLiveClassSessionSchema = createInsertSchema(liveClassSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTeacherRetentionDataSchema = createInsertSchema(teacherRetentionData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStudentQuestionnaireSchema = createInsertSchema(studentQuestionnaires).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({
  id: true,
  submittedAt: true
});

export const insertSupervisionObservationSchema = createInsertSchema(supervisionObservations).omit({
  id: true,
  createdAt: true
});

// Types for quality assurance
export type LiveClassSession = typeof liveClassSessions.$inferSelect;
export type InsertLiveClassSession = z.infer<typeof insertLiveClassSessionSchema>;
export type TeacherRetentionData = typeof teacherRetentionData.$inferSelect;
export type InsertTeacherRetentionData = z.infer<typeof insertTeacherRetentionDataSchema>;
export type StudentQuestionnaire = typeof studentQuestionnaires.$inferSelect;
export type InsertStudentQuestionnaire = z.infer<typeof insertStudentQuestionnaireSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;
export type SupervisionObservation = typeof supervisionObservations.$inferSelect;
export type InsertSupervisionObservation = z.infer<typeof insertSupervisionObservationSchema>;