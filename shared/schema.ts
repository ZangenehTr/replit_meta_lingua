import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// WORKFLOW STATUS CONSTANTS
// ============================================================================

// Canonical workflow status values for call center workflow
export const WORKFLOW_STATUS = {
  CONTACT_DESK: "دفتر_تلفن",
  NEW_INTAKE: "ورودی_جدید", 
  NO_RESPONSE: "پاسخ_نداده",
  FOLLOW_UP: "پیگیری",
  LEVEL_ASSESSMENT: "تعیین_سطح",
  LEVEL_ASSESSMENT_COMPLETE: "تعیین_سطح_کامل",
  WITHDRAWAL: "انصراف"
} as const;

// Type for workflow status
export type WorkflowStatus = typeof WORKFLOW_STATUS[keyof typeof WORKFLOW_STATUS];

// Lead status constants  
export const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted", 
  INTERESTED: "interested",
  QUALIFIED: "qualified",
  CONVERTED: "converted",
  LOST: "lost",
  ASSESSMENT_SCHEDULED: "assessment_scheduled",
  NO_RESPONSE: "no_response"
} as const;

// Type for lead status
export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];

// Users table with roles and authentication (PII fields moved to user_profiles)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(), // Made nullable for phone-only signup
  password: text("password"), // Made nullable for OTP-only login
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("Student"), // Admin, Teacher/Tutor, Mentor, Student, Supervisor, Call Center Agent, Accountant
  phoneNumber: text("phone_number").unique(), // Made unique for phone-based login
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  gender: text("gender"), // male, female - required for peer matching
  profileImage: text("profile_image"), // Profile picture URL
  status: text("status").default("active"), // Account status
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  isAvailableToSocialize: boolean("is_available_to_socialize").default(false),
  socializerLevel: text("socializer_level"), // Current proficiency level for matching
  socializerSkills: text("socializer_skills").array().default([]), // Skills array for complementary matching
  preferences: jsonb("preferences"), // theme, language, notifications
  walletBalance: integer("wallet_balance").default(0), // IRR amount in wallet
  totalCredits: integer("total_credits").default(0), // Lifetime accumulated credits for tier calculation
  memberTier: text("member_tier").default("bronze"), // bronze, silver, gold, diamond
  streakDays: integer("streak_days").default(0),
  totalLessons: integer("total_lessons").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// OTP Codes table for email/SMS verification
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Nullable for pre-registration OTP
  identifier: text("identifier").notNull(), // Email or phone number
  channel: text("channel").notNull(), // 'sms' | 'email'
  purpose: text("purpose").notNull(), // 'login' | 'registration' | 'verification' | 'password_reset'
  codeHash: text("code_hash").notNull(), // Hashed OTP code
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"), // Nullable - set when OTP is used
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(5),
  ip: text("ip"), // IP address for rate limiting
  locale: text("locale").default("fa"), // For localized messages
  createdAt: timestamp("created_at").defaultNow()
});

// Comprehensive Subsystem Permissions - controls access to all app subsystems and features with action-level granularity
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull().unique(),
  subsystemPermissions: jsonb("subsystem_permissions").$type<string[]>().default([]),
  // NEW: Action-level permissions for fine-grained control
  actionPermissions: jsonb("action_permissions").$type<Record<string, string[]>>().default({}), // { "resource": ["create", "read", "update", "delete"] }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Profiles - Canonical source for all PII and language data
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  
  // Personal Information (canonical source)
  nationalId: text("national_id"),
  birthday: date("birthday"), // Birth date for age calculation
  guardianName: text("guardian_name"), // For minor students
  guardianPhone: text("guardian_phone"), // Guardian contact
  notes: text("notes"), // Additional notes
  
  // Language Learning Profile (canonical source)
  nativeLanguage: text("native_language").notNull().default("en"),
  targetLanguages: text("target_languages").array().default([]), // Languages user wants to learn
  currentProficiency: text("current_proficiency").default("beginner"), // "beginner", "intermediate", "advanced"
  targetLanguage: text("target_language"), // Primary target language
  currentLevel: text("current_level"), // Display level for UI
  
  // Cultural and Learning Preferences
  culturalBackground: text("cultural_background"), // iranian, arabic, western, east_asian, south_asian, african, latin_american, other
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
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// MST (Multi-Stage Test) Schema
// ============================================================================

export const mstSessions = pgTable("mst_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  targetLanguage: text("target_language").notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, expired
  skillOrder: text("skill_order").array().default(["listening", "reading", "speaking", "writing"]),
  currentSkillIndex: integer("current_skill_index").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  endsAt: timestamp("ends_at").notNull(), // 10 minutes from start
  completedAt: timestamp("completed_at"),
  results: jsonb("results"), // Final CEFR results per skill
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const mstSkillStates = pgTable("mst_skill_states", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => mstSessions.id).notNull(),
  skill: text("skill").notNull(), // listening, reading, speaking, writing
  currentStage: text("current_stage").notNull().default("S1"), // S1, S2
  timeSpentSec: integer("time_spent_sec").default(0),
  timeBudgetSec: integer("time_budget_sec").default(60), // 1 minute for speaking, can be adjusted per skill
  itemsAsked: text("items_asked").array().default([]),
  s1Score: integer("s1_score"), // 0-100
  s1Route: text("s1_route"), // up, down, stay
  s2Score: integer("s2_score"), // 0-100
  finalBand: text("final_band"), // A2, B1, B2, C1
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const mstResponses = pgTable("mst_responses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => mstSessions.id).notNull(),
  skillStateId: integer("skill_state_id").references(() => mstSkillStates.id).notNull(),
  itemId: text("item_id").notNull(),
  skill: text("skill").notNull(),
  stage: text("stage").notNull(),
  response: jsonb("response").notNull(), // User's answer data
  score: integer("score"), // 0-100
  timeSpentMs: integer("time_spent_ms"),
  submittedAt: timestamp("submitted_at").defaultNow()
});

// MST Types and Schemas
export type MSTSkill = 'listening' | 'reading' | 'speaking' | 'writing';
export type MSTStage = 'S1' | 'S2';
export type MSTRoute = 'up' | 'down' | 'stay';

export const mstSessionInsertSchema = createInsertSchema(mstSessions);

export const mstSkillStateInsertSchema = createInsertSchema(mstSkillStates);

export const mstResponseInsertSchema = createInsertSchema(mstResponses);

export type MSTSessionInsert = z.infer<typeof mstSessionInsertSchema>;
export type MSTSession = typeof mstSessions.$inferSelect;
export type MSTSkillState = typeof mstSkillStates.$inferSelect;
export type MSTResponse = typeof mstResponses.$inferSelect;


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

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
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
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // Course rating
  
  // Scheduling (not applicable for self_paced)
  firstSessionDate: date("first_session_date"), // Start date of the course
  lastSessionDate: date("last_session_date"), // Calculated end date
  weekdays: text("weekdays").array(), // ["monday", "wednesday", "friday"]
  startTime: time("start_time"), // "18:00"
  endTime: time("end_time"), // "19:30"
  timeZone: text("time_zone").default("Asia/Tehran"), // Course timezone
  calendarType: text("calendar_type").default("gregorian"), // "gregorian" or "persian"
  
  // Target language and proficiency (for matching students)
  targetLanguage: text("target_language").notNull(), // "persian", "english", "arabic", etc.
  targetLevel: text("target_level").array().notNull(), // ["beginner", "intermediate"] - levels this course is suitable for
  
  // Recording settings (for online classes)
  autoRecord: boolean("auto_record").default(false),
  recordingAvailable: boolean("recording_available").default(false),
  
  // Callern-specific fields for 24/7 access courses
  accessPeriodMonths: integer("access_period_months"), // For Callern courses: access period in months
  callernAvailable24h: boolean("callern_available_24h").default(true), // For Callern courses: 24/7 availability
  callernRoadmapId: integer("callern_roadmap_id").references(() => callernRoadmaps.id), // Link to Callern roadmap for progress tracking
  
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

// ============================================================================
// CURRICULUM SYSTEM TABLES
// ============================================================================

// Main curriculum tracks (IELTS and Conversation)
export const curriculums = pgTable("curriculums", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // 'ielts' or 'conversation'
  name: text("name").notNull(), // "IELTS Preparation" or "General Conversation"
  language: text("language").notNull(), // "persian", "english", etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0), // For display ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Curriculum levels (Flash IELTS 1, A1.1, A1.2, etc.)
export const curriculumLevels = pgTable("curriculum_levels", {
  id: serial("id").primaryKey(),
  curriculumId: integer("curriculum_id").references(() => curriculums.id).notNull(),
  code: text("code").notNull(), // "F1", "F2", "PRO" for IELTS; "A11", "A12", "A21", etc. for Conversation
  name: text("name").notNull(), // "Flash IELTS 1 (Preliminary)", "A1.1", etc.
  orderIndex: integer("order_index").notNull(), // Sequential ordering within curriculum
  cefrBand: text("cefr_band"), // "A1", "A2", "B1", "B2", "C1", "C2" for conversation levels
  prerequisites: text("prerequisites").array().default([]), // Array of prerequisite level codes
  description: text("description"),
  estimatedWeeks: integer("estimated_weeks"), // Expected duration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Links courses to curriculum levels (many-to-many relationship)
export const curriculumLevelCourses = pgTable("curriculum_level_courses", {
  id: serial("id").primaryKey(),
  levelId: integer("level_id").references(() => curriculumLevels.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  isRequired: boolean("is_required").default(true), // Whether this course is required for level completion
  orderIndex: integer("order_index").default(0), // Order within the level
  createdAt: timestamp("created_at").defaultNow()
});

// Student progress through curriculum levels
export const studentCurriculumProgress = pgTable("student_curriculum_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  curriculumId: integer("curriculum_id").references(() => curriculums.id).notNull(),
  currentLevelId: integer("current_level_id").references(() => curriculumLevels.id),
  status: text("status").notNull().default("active"), // "active", "completed", "suspended"
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at"),
  completedAt: timestamp("completed_at"),
  nextLevelUnlockedAt: timestamp("next_level_unlocked_at"),
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

// Classes - Specific instances of courses with teacher and schedule
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id),
  
  // Schedule information
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(), // Auto-calculated based on course duration and holidays
  weekdays: text("weekdays").array().notNull(), // ["monday", "wednesday", "friday"]
  startTime: time("start_time").notNull(), // "18:00"
  endTime: time("end_time").notNull(), // "19:30"
  
  // Class-specific settings
  maxStudents: integer("max_students").notNull().default(20),
  currentEnrollment: integer("current_enrollment").default(0),
  deliveryMode: text("delivery_mode").notNull(), // "online", "in_person", "hybrid"
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  
  // Additional info
  notes: text("notes"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // weekly, biweekly, monthly
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Class Enrollments (links students to specific classes)
export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  
  // Enrollment details
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  enrollmentType: text("enrollment_type").default("admin"), // "self", "admin", "supervisor"
  enrolledBy: integer("enrolled_by").references(() => users.id), // Who enrolled the student
  
  // Progress tracking
  attendedSessions: integer("attended_sessions").default(0),
  absences: integer("absences").default(0),
  completionStatus: text("completion_status").default("enrolled"), // enrolled, in_progress, completed, dropped
  
  // Payment status (if applicable)
  paymentStatus: text("payment_status").default("pending"), // pending, paid, partial, waived
  
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Course Sessions - Individual sessions within a class
export const courseSessions = pgTable("course_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  sessionNumber: integer("session_number").notNull(), // 1, 2, 3...
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: date("scheduled_date").notNull(),
  startTime: time("start_time").notNull(), // "18:00"
  endTime: time("end_time").notNull(), // "19:30"
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
  
  // Video recording fields
  hasRecording: boolean("has_recording").default(false),
  recordingUrl: text("recording_url"),
  recordingDuration: integer("recording_duration"), // seconds
  thumbnailUrl: text("thumbnail_url"),
  recordingFileSize: integer("recording_file_size"), // bytes
  recordingQuality: text("recording_quality"), // 'HD', 'SD', 'FHD'
  recordingUploadDate: timestamp("recording_upload_date"),
  recordingStatus: text("recording_status").default("none"), // none, processing, ready, error
  
  createdAt: timestamp("created_at").defaultNow()
});

// Session Video Progress Tracking
export const sessionVideoProgress = pgTable("session_video_progress", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  
  // Progress tracking
  progressSeconds: integer("progress_seconds").default(0), // Current watch position
  totalDuration: integer("total_duration").default(0), // Total video duration
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  completed: boolean("completed").default(false),
  
  // Engagement metrics
  totalWatchTime: integer("total_watch_time").default(0), // including replays
  pauseCount: integer("pause_count").default(0),
  rewindCount: integer("rewind_count").default(0),
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default("1.0"),
  
  // Learning tracking
  notesCount: integer("notes_count").default(0),
  bookmarksCount: integer("bookmarks_count").default(0),
  
  lastWatchedAt: timestamp("last_watched_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Session Video Notes
export const sessionVideoNotes = pgTable("session_video_notes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  
  timestamp: integer("timestamp").notNull(), // seconds in video
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Session Video Bookmarks
export const sessionVideoBookmarks = pgTable("session_video_bookmarks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  
  timestamp: integer("timestamp").notNull(), // seconds in video
  title: text("title").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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

// Homework assignments - Enhanced with more fields
export const homework = pgTable("homework", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  // classId: integer("class_id").references(() => classes.id), // TODO: Add after migration
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"), // Detailed instructions
  dueDate: timestamp("due_date"),
  status: text("status").default("pending"), // pending, in_progress, submitted, graded, late, excused
  submission: text("submission"), // Text submission
  submissionUrl: text("submission_url"), // File upload URL
  submittedAt: timestamp("submitted_at"),
  grade: integer("grade"), // 0-100
  maxGrade: integer("max_grade").default(100),
  feedback: text("feedback"),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  estimatedTime: integer("estimated_time").default(30), // in minutes
  xpReward: integer("xp_reward").default(50), // XP points for completion
  attachments: jsonb("attachments").$type<string[]>().default([]), // Teacher's attachment files
  submissionFiles: jsonb("submission_files").$type<string[]>().default([]), // Student's submitted files
  rubric: jsonb("rubric").$type<{criteria: string, points: number}[]>(), // Grading rubric
  tags: text("tags").array().default([]), // homework tags for categorization
  isVisible: boolean("is_visible").default(true),
  allowLateSubmission: boolean("allow_late_submission").default(true),
  latePenaltyPercent: integer("late_penalty_percent").default(10), // Percentage penalty per day
  assignedAt: timestamp("assigned_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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
  packageType: varchar("package_type", { length: 50 }), // e.g., 'ielts_speaking', 'general_conversation', 'business_english'
  targetLevel: varchar("target_level", { length: 20 }), // e.g., 'beginner', 'intermediate', 'advanced'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Callern Package Roadmaps - Defines learning paths for each package
export const callernRoadmaps = pgTable("callern_roadmaps", {
  id: serial("id").primaryKey(),
  packageId: integer("package_id").notNull().references(() => callernPackages.id, { onDelete: 'cascade' }),
  roadmapName: varchar("roadmap_name", { length: 200 }).notNull(),
  description: text("description"),
  totalSteps: integer("total_steps").notNull(),
  estimatedHours: integer("estimated_hours").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Callern Roadmap Steps - Individual lessons/steps in a roadmap
export const callernRoadmapSteps = pgTable("callern_roadmap_steps", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").notNull().references(() => callernRoadmaps.id, { onDelete: 'cascade' }),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  objectives: text("objectives"), // Learning objectives for this step
  teacherAITips: text("teacher_ai_tips"), // AI tips for teachers to keep the lesson engaging
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  skillFocus: varchar("skill_focus", { length: 50 }), // speaking, listening, grammar, vocabulary
  materials: jsonb("materials"), // JSON object with teaching materials, links, etc.
  assessmentCriteria: text("assessment_criteria"), // How to evaluate completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student progress through roadmap steps
export const studentRoadmapProgress = pgTable("student_roadmap_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  packageId: integer("package_id").notNull().references(() => studentCallernPackages.id),
  roadmapId: integer("roadmap_id").notNull().references(() => callernRoadmaps.id),
  stepId: integer("step_id").notNull().references(() => callernRoadmapSteps.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  callId: integer("call_id").references(() => callernCallHistory.id),
  status: varchar("status", { length: 20 }).notNull().default('in_progress'), // in_progress, completed, skipped
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  teacherNotes: text("teacher_notes"),
  studentFeedback: text("student_feedback"),
  performanceRating: integer("performance_rating"), // 1-5 rating
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course Roadmap Progress - Track student progress through course roadmaps 
export const courseRoadmapProgress = pgTable("course_roadmap_progress", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roadmapId: integer("roadmap_id").notNull().references(() => callernRoadmaps.id, { onDelete: 'cascade' }),
  stepId: integer("step_id").notNull().references(() => callernRoadmapSteps.id, { onDelete: 'cascade' }),
  
  // Progress tracking
  status: varchar("status", { length: 20 }).notNull().default('not_started'), // not_started, in_progress, completed, skipped
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  
  // Session data
  sessionId: integer("session_id").references(() => sessions.id),
  teacherId: integer("teacher_id").references(() => users.id),
  mentorId: integer("mentor_id").references(() => users.id),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  
  // Feedback and evaluation
  teacherNotes: text("teacher_notes"),
  studentSelfAssessment: text("student_self_assessment"),
  aiEvaluationScore: decimal("ai_evaluation_score", { precision: 5, scale: 2 }), // AI-generated score 0-100
  aiRecommendations: jsonb("ai_recommendations"), // AI recommendations for improvement
  
  // Homework integration
  homeworkAssigned: boolean("homework_assigned").default(false),
  homeworkCompleted: boolean("homework_completed").default(false),
  homeworkScore: decimal("homework_score", { precision: 5, scale: 2 }),
  aiHomeworkFeedback: jsonb("ai_homework_feedback"), // AI-generated homework corrections and feedback
  
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

// Teacher Callern Authorization - Controls who can access Callern dashboard
export const teacherCallernAuthorization = pgTable("teacher_callern_authorization", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  authorizedBy: integer("authorized_by").notNull().references(() => users.id), // Admin/Supervisor who authorized
  isAuthorized: boolean("is_authorized").default(true).notNull(),
  authorizedAt: timestamp("authorized_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  notes: text("notes"),
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
  // Predefined time slots (Morning, Afternoon, Evening, Night)
  morningSlot: boolean("morning_slot").default(false).notNull(), // 6:00 - 12:00
  afternoonSlot: boolean("afternoon_slot").default(false).notNull(), // 12:00 - 18:00
  eveningSlot: boolean("evening_slot").default(false).notNull(), // 18:00 - 22:00
  nightSlot: boolean("night_slot").default(false).notNull(), // 22:00 - 06:00
  // Tracking
  missedShifts: integer("missed_shifts").default(0).notNull(),
  missedCalls: integer("missed_calls").default(0).notNull(),
  totalCallsHandled: integer("total_calls_handled").default(0).notNull(),
  // Connection quality
  lastConnectionStrength: text("last_connection_strength"), // excellent, good, fair, poor
  availableHours: text("available_hours").array(), // JSON array of available time slots
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Callern Call History (extended for new features)
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
  // New recording and transcript fields
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  transcriptLang: varchar("transcript_lang", { length: 10 }), // e.g., 'en', 'fa', 'ar'
  aiSummaryJson: jsonb("ai_summary_json"), // AI-generated summary
  contentBundleUrl: text("content_bundle_url"), // Auto-generated learning materials
  // Ratings
  studentRating: integer("student_rating"), // 1-5 rating from student
  supervisorRating: integer("supervisor_rating"), // 1-5 rating from supervisor
  // Connection quality
  teacherConnectionQuality: text("teacher_connection_quality"), // excellent, good, fair, poor
  studentConnectionQuality: text("student_connection_quality"), // excellent, good, fair, poor
  consentRecordingAt: timestamp("consent_recording_at"), // When consent was given
  studentConsentRecording: boolean("student_consent_recording").default(false),
  teacherConsentRecording: boolean("teacher_consent_recording").default(false),
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

// ===== NEW CALLERN ENHANCEMENT TABLES =====

// Suggested Terms (vocabulary suggestions during calls)
export const suggestedTerms = pgTable("suggested_terms", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => callernCallHistory.id),
  term: varchar("term", { length: 100 }).notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 20 }), // noun, verb, adjective, etc.
  cefrLevel: varchar("cefr_level", { length: 5 }), // A1, A2, B1, B2, C1, C2
  definition: text("definition"),
  example: text("example"),
  suggestedBy: varchar("suggested_by", { length: 20 }).notNull(), // 'teacher' or 'ai'
  timestamp: integer("timestamp"), // seconds into the call
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Rewrite Suggestions (improved versions of student utterances)
export const rewriteSuggestions = pgTable("rewrite_suggestions", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").notNull().references(() => callernCallHistory.id),
  originalUtterance: text("original_utterance").notNull(),
  improvedVersion: text("improved_version").notNull(),
  cefrLevel: varchar("cefr_level", { length: 5 }), // Target CEFR level
  timestamp: integer("timestamp"), // seconds into the call
  notes: text("notes"), // Grammar points or explanations
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Glossary Items (student's personal vocabulary collection)
export const glossaryItems = pgTable("glossary_items", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  term: varchar("term", { length: 100 }).notNull(),
  definition: text("definition").notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 20 }),
  cefrLevel: varchar("cefr_level", { length: 5 }),
  example: text("example"),
  sourceCallId: integer("source_call_id").references(() => callernCallHistory.id),
  // SRS (Spaced Repetition System) fields
  srsStrength: integer("srs_strength").default(0), // 0-5 strength level
  srsDueAt: timestamp("srs_due_at"),
  srsLastReviewedAt: timestamp("srs_last_reviewed_at"),
  srsReviewCount: integer("srs_review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Quiz Results (for SRS vocabulary testing)
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  glossaryItemId: integer("glossary_item_id").notNull().references(() => glossaryItems.id),
  questionType: varchar("question_type", { length: 20 }).notNull(), // 'definition', 'translation', 'fill_blank'
  wasCorrect: boolean("was_correct").notNull(),
  responseTime: integer("response_time"), // milliseconds
  attemptedAt: timestamp("attempted_at").defaultNow().notNull()
});

// Email Logs (for tracking sent emails)
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(), // 'CALL_SUMMARY', 'WEEKLY_RECAP'
  subject: varchar("subject", { length: 255 }).notNull(),
  contentJson: jsonb("content_json"), // Template data
  status: varchar("status", { length: 20 }).default('pending'), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Audit Log for tracking all sensitive operations
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userRole: varchar("user_role", { length: 50 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Student Preferences for feature toggles
export const studentPreferences = pgTable("student_preferences", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id).unique(),
  showLiveSuggestions: boolean("show_live_suggestions").default(true),
  emailCallSummaries: boolean("email_call_summaries").default(true),
  emailWeeklyRecap: boolean("email_weekly_recap").default(true),
  preferredLanguage: varchar("preferred_language", { length: 10 }).default('en'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
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

// Enhanced Notifications for Role-Based System
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, success, warning, error, system
  category: text("category").notNull(), // academic, financial, system, social, administrative
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  targetRole: text("target_role"), // Admin, Teacher, Student, Mentor, Supervisor, Call Center Agent, Accountant
  actionUrl: text("action_url"), // URL to redirect when notification is clicked
  metadata: jsonb("metadata"), // Additional context data specific to notification type
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  expiresAt: timestamp("expires_at"), // Optional expiration for time-sensitive notifications
  createdAt: timestamp("created_at").defaultNow()
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

export const teacherPaymentRecords = pgTable("teacher_payment_records", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => sessions.id),
  attendanceRecordId: integer("attendance_record_id").references(() => attendanceRecords.id),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  attendanceBonus: decimal("attendance_bonus", { precision: 10, scale: 2 }).default('0'),
  attendancePenalty: decimal("attendance_penalty", { precision: 10, scale: 2 }).default('0'),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  sessionDuration: integer("session_duration"), // in minutes
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  attendanceRate: decimal("attendance_rate", { precision: 5, scale: 2 }), // percentage of students present
  paymentPeriod: text("payment_period").notNull(), // '2024-01', '2024-02', etc.
  status: text("status").default("pending"), // pending, approved, paid, disputed
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
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
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true });
// Holidays table for managing institute holidays (used for class end date calculation)
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull(), // national, religious, institute
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // yearly, monthly
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertCourseSchema = createInsertSchema(courses);
export const insertClassSchema = createInsertSchema(classes);
export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments);
export const insertHolidaySchema = createInsertSchema(holidays);
export const insertEnrollmentSchema = createInsertSchema(enrollments);
export const insertSessionSchema = createInsertSchema(sessions);
export const insertSessionVideoProgressSchema = createInsertSchema(sessionVideoProgress);
export const insertSessionVideoNotesSchema = createInsertSchema(sessionVideoNotes);
export const insertSessionVideoBookmarksSchema = createInsertSchema(sessionVideoBookmarks);
export const insertMessageSchema = createInsertSchema(messages);
export const insertHomeworkSchema = createInsertSchema(homework);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertSessionPackageSchema = createInsertSchema(sessionPackages);
// Admin settings schema defined below with comprehensive version
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export const insertCoursePaymentSchema = createInsertSchema(coursePayments);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertCustomRoleSchema = createInsertSchema(customRoles);
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertUserStatsSchema = createInsertSchema(userStats);

export const insertDailyGoalSchema = createInsertSchema(dailyGoals);

export const insertLevelAssessmentQuestionSchema = createInsertSchema(levelAssessmentQuestions);

export const insertLevelAssessmentResultSchema = createInsertSchema(levelAssessmentResults);

// Lead schema moved to after table definition to avoid forward reference

// CRM Insert Schemas
export const insertInstituteSchema = createInsertSchema(institutes);

export const insertDepartmentSchema = createInsertSchema(departments);

export const insertStudentGroupSchema = createInsertSchema(studentGroups);

export const insertStudentGroupMemberSchema = createInsertSchema(studentGroupMembers);

export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignments);

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords);

export const insertStudentNoteSchema = createInsertSchema(studentNotes);

export const insertParentGuardianSchema = createInsertSchema(parentGuardians);

// Communication log schema moved to end of file

export const insertStudentReportSchema = createInsertSchema(studentReports);

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

// AI Model Management
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull().unique(),
  baseModel: varchar("base_model", { length: 100 }).notNull(), // llama3.2, mistral, etc.
  version: varchar("version", { length: 50 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false),
  isDefault: boolean("is_default").default(false),
  modelPath: text("model_path"), // Path to model file
  configurationParams: jsonb("configuration_params").$type<{
    temperature?: number,
    max_tokens?: number,
    top_p?: number,
    top_k?: number,
    context_length?: number,
    learning_rate?: number,
    batch_size?: number,
    epochs?: number
  }>(),
  performanceMetrics: jsonb("performance_metrics").$type<{
    accuracy?: number,
    loss?: number,
    perplexity?: number,
    bleu_score?: number,
    training_time?: number,
    validation_score?: number
  }>(),
  trainingDataCount: integer("training_data_count").default(0),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// AI Training Jobs
export const aiTrainingJobs = pgTable("ai_training_jobs", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 100 }).notNull().unique(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  baseModelId: integer("base_model_id").references(() => aiModels.id),
  datasetIds: text("dataset_ids").array().default([]), // Array of training data IDs
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, running, completed, failed, cancelled
  progress: integer("progress").default(0), // 0-100
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  trainingConfig: jsonb("training_config").$type<{
    epochs: number,
    learning_rate: number,
    batch_size: number,
    validation_split: number,
    early_stopping: boolean,
    save_checkpoints: boolean
  }>(),
  trainingLogs: text("training_logs"),
  resultModelId: integer("result_model_id").references(() => aiModels.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// AI Training Datasets
export const aiTrainingDatasets = pgTable("ai_training_datasets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dataType: varchar("data_type", { length: 50 }).notNull(), // conversation, vocabulary, grammar, pronunciation
  language: varchar("language", { length: 10 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // callern_calls, user_activity, manual_upload
  dataCount: integer("data_count").default(0),
  totalSize: integer("total_size").default(0), // in bytes
  isActive: boolean("is_active").default(true),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata").$type<{
    filters?: any,
    preprocessing_steps?: string[],
    validation_rules?: any,
    export_format?: string
  }>(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// AI Dataset Items (linking datasets to training data)
export const aiDatasetItems = pgTable("ai_dataset_items", {
  id: serial("id").primaryKey(),
  datasetId: integer("dataset_id").references(() => aiTrainingDatasets.id).notNull(),
  trainingDataId: integer("training_data_id").references(() => aiTrainingData.id).notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(), // text, audio, conversation, qa_pair
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  isValidated: boolean("is_validated").default(false),
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Referral system insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS
export const insertReferralSettingsSchema = createInsertSchema(referralSettings);
export const insertCourseReferralSchema = createInsertSchema(courseReferrals);
export const insertReferralCommissionSchema = createInsertSchema(referralCommissions);
export const insertAiTrainingDataSchema = createInsertSchema(aiTrainingData);
// AI Model Management schemas - MOVED TO END OF FILE
export const insertAiModelSchema = createInsertSchema(aiModels);
export const insertAiTrainingJobSchema = createInsertSchema(aiTrainingJobs);
export const insertAiTrainingDatasetSchema = createInsertSchema(aiTrainingDatasets);
export const insertAiDatasetItemSchema = createInsertSchema(aiDatasetItems);

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
export const insertSkillAssessmentSchema = createInsertSchema(skillAssessments);
export const insertLearningActivitySchema = createInsertSchema(learningActivities);
export const insertProgressSnapshotSchema = createInsertSchema(progressSnapshots);
export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase);

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
  level: text("level").notNull(), // Required field in the actual database
  interestedLanguage: text("interested_language"), // persian, english, arabic, etc
  interestedLevel: text("interested_level"), // beginner, intermediate, advanced
  preferredFormat: text("preferred_format"), // group, individual, online, in_person
  budget: integer("budget"), // IRR amount
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  conversionDate: timestamp("conversion_date"),
  studentId: integer("student_id").references(() => users.id), // If converted
  
  // NEW FIELDS FOR UNIFIED CALL CENTER WORKFLOW
  age: integer("age"), // Required age field
  gender: text("gender"), // male, female - required field
  nationalId: text("national_id"), // Iranian national ID
  nationalIdImage: text("national_id_image"), // National ID card image URL
  avatar: text("avatar"), // Applicant photo URL
  
  // Course-specific fields
  courseTarget: text("course_target"), // IELTS, TOEFL, PTE, GRE, GE (General English)
  courseModule: text("course_module"), // Academic, General (for IELTS), Core (for PTE)
  goal: text("goal"), // Based on goal mapping table
  deliveryType: text("delivery_type"), // حضوری, آنلاین, برون‌سازمانی
  classType: text("class_type"), // خصوصی, گروهی
  referralSource: text("referral_source"), // Detailed referral information
  timeLimit: integer("time_limit"), // Time constraint in months
  branch: text("branch"), // Preferred branch location
  
  // Workflow timeline fields
  levelAssessmentStart: timestamp("level_assessment_start"),
  levelAssessmentEnd: timestamp("level_assessment_end"),
  followUpStart: timestamp("follow_up_start"),
  followUpEnd: timestamp("follow_up_end"),
  callCount: integer("call_count").default(0), // Number of attempts made
  lastAttemptAt: timestamp("last_attempt_at"), // When last call attempt was made
  nextRetryAt: timestamp("next_retry_at"), // When next retry is due based on progressive backoff
  
  // Workflow status tracking
  workflowStatus: text("workflow_status").default(WORKFLOW_STATUS.CONTACT_DESK), // Uses canonical workflow status constants
  
  // Withdrawal tracking fields
  withdrawalReason: text("withdrawal_reason"), // Reason for withdrawal
  withdrawalDate: timestamp("withdrawal_date"), // When withdrawal occurred
  
  // SMS reminder settings
  smsReminderEnabled: boolean("sms_reminder_enabled").default(false), // Whether to send SMS reminders
  smsReminderSentAt: timestamp("sms_reminder_sent_at"), // When last SMS reminder was sent (for idempotency)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for leads
export const insertLeadSchema = createInsertSchema(leads);

// Lead types
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// COMMUNICATION LOGS (Call Center)
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  toParentId: integer("to_parent_id"),
  type: text("type").notNull(), // call, email, sms, meeting, note
  subject: text("subject"),
  content: text("content").notNull(),
  status: text("status").default("sent"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  studentId: integer("student_id").references(() => users.id)
});

// Insert schema for communication logs
export const insertCommunicationLogSchema = createInsertSchema(communicationLogs);

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
export const insertInvoiceSchema = createInsertSchema(invoices);

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
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions);

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
  bonusMultiplier: decimal("bonus_multiplier", { precision: 3, scale: 2 }).default("1.0"),
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
  speedMultiplier: decimal("speed_multiplier", { precision: 3, scale: 2 }).default("1.0"),
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

// Game Access Rules - Define automatic rules for game visibility
export const gameAccessRules = pgTable("game_access_rules", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // 'level', 'age', 'course', 'manual', 'all'
  
  // Rule criteria
  minLevel: varchar("min_level", { length: 10 }), // A1, A2, B1, B2, C1, C2
  maxLevel: varchar("max_level", { length: 10 }),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  courseId: integer("course_id").references(() => courses.id),
  languages: jsonb("languages"), // array of language codes
  
  // Additional settings
  isDefault: boolean("is_default").default(false), // Show to all students by default
  requiresUnlock: boolean("requires_unlock").default(false), // Must be unlocked through progress
  unlockCriteria: jsonb("unlock_criteria"), // {minGamesCompleted: 5, minLevel: 'B1', prerequisiteGames: [1,2,3]}
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Game Assignments - Direct assignment of games to students
export const studentGameAssignments = pgTable("student_game_assignments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  
  // Assignment details
  assignedBy: integer("assigned_by").references(() => users.id).notNull(), // Admin or teacher who assigned
  assignmentType: varchar("assignment_type", { length: 50 }).notNull(), // 'required', 'optional', 'practice', 'homework'
  
  // Access control
  isAccessible: boolean("is_accessible").default(true),
  accessStartDate: timestamp("access_start_date"),
  accessEndDate: timestamp("access_end_date"),
  
  // Progress tracking
  targetScore: integer("target_score"),
  targetCompletionDate: date("target_completion_date"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course Games - Associate games with courses
export const courseGames = pgTable("course_games", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  
  // Configuration
  isRequired: boolean("is_required").default(false),
  orderIndex: integer("order_index"), // Display order in course
  minScoreRequired: integer("min_score_required"), // Minimum score to consider complete
  
  // Availability
  weekNumber: integer("week_number"), // Which week of the course this game is for
  moduleNumber: integer("module_number"), // Which module/unit this game belongs to
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Game Questions Table - Stores actual game content
export const gameQuestions = pgTable("game_questions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  levelId: integer("level_id").references(() => gameLevels.id),
  
  // Question metadata
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, fill_blank, matching, ordering, translation
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // easy, medium, hard, expert
  language: varchar("language", { length: 10 }).notNull(),
  skillFocus: varchar("skill_focus", { length: 50 }).notNull(), // vocabulary, grammar, pronunciation, comprehension
  
  // Question content
  question: text("question").notNull(),
  questionAudio: varchar("question_audio", { length: 500 }), // for listening exercises
  questionImage: varchar("question_image", { length: 500 }), // for visual learning
  
  // Answer options
  options: jsonb("options"), // Array of {id, text, audio, image}
  correctAnswer: jsonb("correct_answer").notNull(), // Can be string, array, or object
  alternativeAnswers: jsonb("alternative_answers"), // Acceptable alternatives
  
  // Feedback
  explanation: text("explanation"),
  hint: text("hint"),
  teachingPoint: text("teaching_point"), // Grammar rule or vocabulary context
  
  // Scoring
  basePoints: integer("base_points").default(10),
  timeLimit: integer("time_limit"), // seconds, null for no limit
  bonusPoints: integer("bonus_points").default(5), // for quick answers
  
  // Usage tracking
  timesUsed: integer("times_used").default(0),
  correctRate: decimal("correct_rate", { precision: 5, scale: 2 }),
  averageTime: decimal("average_time", { precision: 5, scale: 2 }), // seconds
  
  // AI enhancement
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"), // Prompt used to generate question
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Daily Challenges Table
export const gameDailyChallenges = pgTable("game_daily_challenges", {
  id: serial("id").primaryKey(),
  challengeDate: date("challenge_date").notNull().unique(),
  
  // Challenge configuration
  challengeName: varchar("challenge_name", { length: 255 }).notNull(),
  description: text("description"),
  challengeType: varchar("challenge_type", { length: 50 }).notNull(), // score_based, time_based, accuracy_based, streak_based
  
  // Target settings
  targetGameId: integer("target_game_id").references(() => games.id),
  targetScore: integer("target_score"),
  targetTime: integer("target_time"), // seconds
  targetAccuracy: decimal("target_accuracy", { precision: 5, scale: 2 }),
  targetStreak: integer("target_streak"),
  
  // Difficulty and rewards
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // easy, medium, hard
  xpReward: integer("xp_reward").default(100),
  coinsReward: integer("coins_reward").default(50),
  badgeId: integer("badge_id").references(() => achievements.id),
  
  // Participation tracking
  totalParticipants: integer("total_participants").default(0),
  totalCompletions: integer("total_completions").default(0),
  averageScore: decimal("average_score", { precision: 10, scale: 2 }),
  
  // Featured content
  featuredQuestions: jsonb("featured_questions"), // Array of question IDs
  bonusMultiplier: decimal("bonus_multiplier", { precision: 3, scale: 2 }).default("1.5"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User Daily Challenge Progress
export const userDailyChallengeProgress = pgTable("user_daily_challenge_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  challengeId: integer("challenge_id").references(() => gameDailyChallenges.id).notNull(),
  
  // Progress tracking
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  
  // Performance
  score: integer("score").default(0),
  timeSpent: integer("time_spent"), // seconds
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  streak: integer("streak").default(0),
  
  // Completion status
  isCompleted: boolean("is_completed").default(false),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0"),
  
  // Rewards claimed
  xpClaimed: integer("xp_claimed").default(0),
  coinsClaimed: integer("coins_claimed").default(0),
  badgeClaimed: boolean("badge_claimed").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Game Answer Logs - Track every answer for analytics
export const gameAnswerLogs = pgTable("game_answer_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => gameSessions.id).notNull(),
  questionId: integer("question_id").references(() => gameQuestions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Answer details
  userAnswer: jsonb("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTime: integer("response_time").notNull(), // milliseconds
  
  // Points and feedback
  pointsEarned: integer("points_earned").default(0),
  hintUsed: boolean("hint_used").default(false),
  attemptsCount: integer("attempts_count").default(1),
  
  // AI assistance (if used)
  aiAssisted: boolean("ai_assisted").default(false),
  aiResponse: jsonb("ai_response"),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas for game system
export const insertGameQuestionSchema = createInsertSchema(gameQuestions);

export const insertGameDailyChallengeSchema = createInsertSchema(gameDailyChallenges);

export const insertUserDailyChallengeProgressSchema = createInsertSchema(userDailyChallengeProgress);

export const insertGameAnswerLogSchema = createInsertSchema(gameAnswerLogs);

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
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0"),
  
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
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default("1.0"),
  
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
  masteryLevel: decimal("mastery_level", { precision: 3, scale: 2 }).default("0"), // 0-1
  
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
export const insertTeacherEvaluationSchema = createInsertSchema(teacherEvaluations);

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
export const insertClassObservationSchema = createInsertSchema(classObservations);

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
export const insertSystemMetricSchema = createInsertSchema(systemMetrics);

// MENTOR ASSIGNMENTS (Mentor Dashboard)
export const mentorAssignments = pgTable("mentor_assignments", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  enrollmentId: integer("enrollment_id").references(() => userTrackEnrollments.id), // Link to track enrollment for auto-mentoring
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
export const insertMentorAssignmentSchema = createInsertSchema(mentorAssignments);

export const insertMentoringSessionSchema = createInsertSchema(mentoringSessions);

// BRANCHES - Institute branch management
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  instituteId: integer("institute_id").references(() => institutes.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }).notNull().default('Iran'),
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  managerName: varchar("manager_name", { length: 255 }),
  managerPhoneNumber: varchar("manager_phone_number", { length: 20 }),
  capacity: integer("capacity").default(100), // Maximum students
  currentEnrollment: integer("current_enrollment").default(0),
  facilities: text("facilities").array().default([]), // ['computer_lab', 'library', 'audio_visual']
  operatingHours: jsonb("operating_hours"), // {'monday': '9:00-17:00', ...}
  isActive: boolean("is_active").default(true),
  establishedDate: date("established_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for branches and rooms
export const insertBranchSchema = createInsertSchema(branches);
export const insertRoomSchema = createInsertSchema(rooms);

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
  
  // SMS Templates
  otpSmsTemplate: text("otp_sms_template").default("کد تأیید شما: {{code}}"),
  passwordResetSmsTemplate: text("password_reset_sms_template").default("کد بازیابی رمز عبور: {{code}}"),
  studentCreationSmsTemplate: text("student_creation_sms_template").default("خوش آمدید! اطلاعات ورود شما: {{credentials}}"),
  enrollmentSmsTemplate: text("enrollment_sms_template").default("ثبت‌نام شما در {{course}} تأیید شد"),
  sessionReminderSmsTemplate: text("session_reminder_sms_template").default("یادآوری: جلسه {{session}} در {{time}} شروع می‌شود"),
  paymentReceivedSmsTemplate: text("payment_received_sms_template").default("پرداخت {{amount}} تومان با موفقیت انجام شد"),
  
  // Placement Test SMS Automation Settings
  placementSmsEnabled: boolean("placement_sms_enabled").default(true),
  placementSmsReminderCooldownHours: integer("placement_sms_reminder_cooldown_hours").default(24),
  placementSmsMaxReminders: integer("placement_sms_max_reminders").default(3),
  placementSmsDaysAfterTest: integer("placement_sms_days_after_test").default(1),
  placementSmsQuietHoursStart: varchar("placement_sms_quiet_hours_start", { length: 5 }).default("22:00"),
  placementSmsQuietHoursEnd: varchar("placement_sms_quiet_hours_end", { length: 5 }).default("08:00"),
  placementSmsTemplate: text("placement_sms_template").default("سلام {studentName} عزیز!\n\n{daysAgo} روز پیش تست تعیین سطح خود را در سطح {placementLevel} با موفقیت تکمیل کردید. 🎉\n\nبرای شروع مسیر یادگیری و بهره‌مندی از کلاس‌های تخصصی، زمان ثبت‌نام در دوره‌های آموزشی فرا رسیده است.\n\n📞 جهت مشاوره و ثبت‌نام: 021-1234\n🌐 Meta Lingua - همراه شما در مسیر یادگیری"),
  
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
export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true, createdAt: true, updatedAt: true });

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

// Testing subsystem insert schemas
export const insertTestSchema = createInsertSchema(tests).omit({ id: true, createdAt: true, updatedAt: true });



export const insertTestQuestionSchema = createInsertSchema(testQuestions).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, createdAt: true });

export const insertTestAnswerSchema = createInsertSchema(testAnswers).omit({ id: true, answeredAt: true });

// Gamification insert schemas
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });

export const insertGameLevelSchema = createInsertSchema(gameLevels).omit({ id: true, createdAt: true });

export const insertUserGameProgressSchema = createInsertSchema(userGameProgress).omit({ id: true, createdAt: true, updatedAt: true });

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, startedAt: true, createdAt: true });

export const insertGameLeaderboardSchema = createInsertSchema(gameLeaderboards).omit({ id: true, createdAt: true });

// Video learning insert schemas
export const insertVideoLessonSchema = createInsertSchema(videoLessons).omit({ id: true, createdAt: true, updatedAt: true });

export const insertVideoProgressSchema = createInsertSchema(videoProgress).omit({ id: true, createdAt: true, updatedAt: true });

export const insertVideoNoteSchema = createInsertSchema(videoNotes).omit({ id: true, createdAt: true, updatedAt: true });

export const insertVideoBookmarkSchema = createInsertSchema(videoBookmarks).omit({ id: true, createdAt: true });

// LMS insert schemas
export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({ id: true, createdAt: true });

export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({ id: true, createdAt: true, updatedAt: true });

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true });

export const insertGradebookEntrySchema = createInsertSchema(gradebookEntries).omit({ id: true, createdAt: true, updatedAt: true });

export const insertContentLibrarySchema = createInsertSchema(contentLibrary).omit({ id: true, createdAt: true, updatedAt: true });

// AI tracking insert schemas
export const insertAiProgressTrackingSchema = createInsertSchema(aiProgressTracking).omit({ id: true, createdAt: true, updatedAt: true });

export const insertAiActivitySessionSchema = createInsertSchema(aiActivitySessions).omit({ id: true, startedAt: true, createdAt: true });

export const insertAiVocabularyTrackingSchema = createInsertSchema(aiVocabularyTracking).omit({ id: true, firstSeenAt: true, createdAt: true });

export const insertAiGrammarTrackingSchema = createInsertSchema(aiGrammarTracking).omit({ id: true, createdAt: true });

export const insertAiPronunciationAnalysisSchema = createInsertSchema(aiPronunciationAnalysis).omit({ id: true, createdAt: true });

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
export const insertCallernPackageSchema = createInsertSchema(callernPackages).omit({ id: true, createdAt: true, updatedAt: true });

export const insertStudentCallernPackageSchema = createInsertSchema(studentCallernPackages).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTeacherCallernAuthorizationSchema = createInsertSchema(teacherCallernAuthorization).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTeacherCallernAvailabilitySchema = createInsertSchema(teacherCallernAvailability).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCallernCallHistorySchema = createInsertSchema(callernCallHistory).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSuggestedTermSchema = createInsertSchema(suggestedTerms).omit({ id: true, createdAt: true });

export const insertRewriteSuggestionSchema = createInsertSchema(rewriteSuggestions).omit({ id: true, createdAt: true });

export const insertGlossaryItemSchema = createInsertSchema(glossaryItems).omit({ id: true, createdAt: true, updatedAt: true });

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({ id: true, attemptedAt: true });

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({ id: true, createdAt: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

export const insertStudentPreferencesSchema = createInsertSchema(studentPreferences).omit({ id: true, createdAt: true, updatedAt: true });

export const insertCallernSyllabusTopicSchema = createInsertSchema(callernSyllabusTopics).omit({ id: true, createdAt: true, updatedAt: true });

export const insertStudentCallernProgressSchema = createInsertSchema(studentCallernProgress).omit({ id: true, createdAt: true });

// Callern system types
export type CallernPackage = typeof callernPackages.$inferSelect;
export type InsertCallernPackage = z.infer<typeof insertCallernPackageSchema>;
export type StudentCallernPackage = typeof studentCallernPackages.$inferSelect;
export type InsertStudentCallernPackage = z.infer<typeof insertStudentCallernPackageSchema>;
export type TeacherCallernAuthorization = typeof teacherCallernAuthorization.$inferSelect;
export type InsertTeacherCallernAuthorization = z.infer<typeof insertTeacherCallernAuthorizationSchema>;
export type TeacherCallernAvailability = typeof teacherCallernAvailability.$inferSelect;
export type InsertTeacherCallernAvailability = z.infer<typeof insertTeacherCallernAvailabilitySchema>;
export type CallernCallHistory = typeof callernCallHistory.$inferSelect;
export type InsertCallernCallHistory = z.infer<typeof insertCallernCallHistorySchema>;
export type SuggestedTerm = typeof suggestedTerms.$inferSelect;
export type InsertSuggestedTerm = z.infer<typeof insertSuggestedTermSchema>;
export type RewriteSuggestion = typeof rewriteSuggestions.$inferSelect;
export type InsertRewriteSuggestion = z.infer<typeof insertRewriteSuggestionSchema>;
export type GlossaryItem = typeof glossaryItems.$inferSelect;
export type InsertGlossaryItem = z.infer<typeof insertGlossaryItemSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type StudentPreferences = typeof studentPreferences.$inferSelect;
export type InsertStudentPreferences = z.infer<typeof insertStudentPreferencesSchema>;
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


// Supervision observation forms (aligned with existing database schema)
export const supervisionObservations = pgTable("supervision_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id),
  supervisorId: integer("supervisor_id").references(() => users.id),
  sessionId: integer("session_id"),
  observationType: varchar("observation_type"),
  overallScore: decimal("overall_score", { precision: 10, scale: 2 }),
  strengths: text("strengths"),
  areasForImprovement: text("areas_for_improvement"),
  followUpRequired: boolean("follow_up_required"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Teacher response workflow fields
  teacherAcknowledged: boolean("teacher_acknowledged").default(false),
  teacherAcknowledgedAt: timestamp("teacher_acknowledged_at"),
  teacherResponse: text("teacher_response"),
  teacherImprovementPlan: text("teacher_improvement_plan"),
  improvementPlanDeadline: date("improvement_plan_deadline"),
  followUpCompleted: boolean("follow_up_completed").default(false),
  followUpCompletedAt: timestamp("follow_up_completed_at"),
  // Link to scheduled observation
  scheduledObservationId: integer("scheduled_observation_id").references(() => scheduledObservations.id),
  observationStatus: varchar("observation_status", { length: 20 }).default("completed"),
});

// Teacher observation responses for bidirectional communication
export const teacherObservationResponses = pgTable("teacher_observation_responses", {
  id: serial("id").primaryKey(),
  observationId: integer("observation_id").references(() => supervisionObservations.id, { onDelete: 'cascade' }).notNull(),
  teacherId: integer("teacher_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  responseType: text("response_type").notNull(), // 'acknowledgment', 'improvement_plan', 'progress_update'
  content: text("content").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  supervisorReviewed: boolean("supervisor_reviewed").default(false),
  supervisorReviewedAt: timestamp("supervisor_reviewed_at"),
});

// Scheduled Observations - Future observations planned by supervisors
export const scheduledObservations = pgTable("scheduled_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  supervisorId: integer("supervisor_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => sessions.id),
  classId: integer("class_id").references(() => sessions.id), // Specific class instance
  observationType: varchar("observation_type", { length: 50 }).notNull(), // 'live_in_person', 'live_online', 'recorded'
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: varchar("status", { length: 20 }).default("scheduled"), // 'scheduled', 'in_progress', 'completed', 'cancelled'
  priority: varchar("priority", { length: 10 }).default("normal"), // 'low', 'normal', 'high', 'urgent'
  notes: text("notes"),
  teacherNotified: boolean("teacher_notified").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas for quality assurance
export const insertLiveClassSessionSchema = createInsertSchema(liveClassSessions).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTeacherRetentionDataSchema = createInsertSchema(teacherRetentionData).omit({ id: true, createdAt: true, updatedAt: true });

export const insertStudentQuestionnaireSchema = createInsertSchema(studentQuestionnaires).omit({ id: true, createdAt: true, updatedAt: true });


export const insertSupervisionObservationSchema = createInsertSchema(supervisionObservations).omit({ id: true, createdAt: true, updatedAt: true, teacherAcknowledged: true, teacherAcknowledgedAt: true, followUpCompleted: true, followUpCompletedAt: true });

export const insertTeacherObservationResponseSchema = createInsertSchema(teacherObservationResponses).omit({ id: true, submittedAt: true, supervisorReviewed: true, supervisorReviewedAt: true });

export const insertScheduledObservationSchema = createInsertSchema(scheduledObservations).omit({ id: true, createdAt: true, updatedAt: true, teacherNotified: true, notificationSentAt: true });

// Types for quality assurance
export type LiveClassSession = typeof liveClassSessions.$inferSelect;
export type InsertLiveClassSession = z.infer<typeof insertLiveClassSessionSchema>;
export type TeacherRetentionData = typeof teacherRetentionData.$inferSelect;
export type InsertTeacherRetentionData = z.infer<typeof insertTeacherRetentionDataSchema>;
export type StudentQuestionnaire = typeof studentQuestionnaires.$inferSelect;
export type InsertStudentQuestionnaire = z.infer<typeof insertStudentQuestionnaireSchema>;

// Create questionnaire response types (appears to be missing from schema)
// These represent student responses to questionnaires
export interface QuestionnaireResponse {
  id: number;
  questionnaireId: number;
  studentId: number;
  responses: Array<{
    questionId: string;
    answer: string | number | string[];
  }>;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertQuestionnaireResponse {
  questionnaireId: number;
  studentId: number;
  responses: Array<{
    questionId: string;
    answer: string | number | string[];
  }>;
  submittedAt?: Date;
}
export type SupervisionObservation = typeof supervisionObservations.$inferSelect;
export type InsertSupervisionObservation = z.infer<typeof insertSupervisionObservationSchema>;

// ===== MODERN COMMUNICATION SYSTEM =====

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  category: text("category"), // technical, billing, course, general
  studentId: integer("student_id"),
  studentName: text("student_name"),
  assignedTo: text("assigned_to"), // Agent/staff handling the ticket
  attachments: text("attachments").array().default([]), // file URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Support Ticket Messages
export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  message: text("message").notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // student, staff
  senderId: integer("sender_id").references(() => users.id).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  isInternal: boolean("is_internal").default(false), // internal staff notes
  attachments: text("attachments").array().default([]),
  sentAt: timestamp("sent_at").defaultNow().notNull()
});

// Chat Conversations
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  title: text("title"),
  type: text("type").notNull().default("direct"), // direct, group, ai_study_partner
  participants: text("participants").array().notNull(), // user IDs
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count").default(0),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // For course group chats and other context
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => chatConversations.id).notNull(),
  senderId: integer("sender_id"), // Can be null for AI messages
  senderName: text("sender_name"), // Sender's full name for display
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"), // text, image, file, system, ai_response
  attachments: text("attachments").array().default([]),
  isRead: boolean("is_read").default(false), // Add missing is_read field
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  replyTo: integer("reply_to").references(() => chatMessages.id),
  reactions: jsonb("reactions"), // {emoji: [userIds]}
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readBy: jsonb("read_by"), // {userId: timestamp}
  // AI-specific fields
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiContext: jsonb("ai_context"), // Study context, roadmap progress, etc.
  aiPromptTokens: integer("ai_prompt_tokens"),
  aiResponseTokens: integer("ai_response_tokens")
});

// AI Study Partner Configuration
export const aiStudyPartners = pgTable("ai_study_partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  conversationId: integer("conversation_id").references(() => chatConversations.id),
  
  // Personalization settings
  learningStyle: varchar("learning_style", { length: 50 }).default("balanced"), // visual, auditory, kinesthetic, balanced
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
  difficultyLevel: varchar("difficulty_level", { length: 20 }).default("intermediate"), // beginner, intermediate, advanced
  studyGoals: text("study_goals").array().default([]), // exam_prep, conversation, business, academic
  
  // Current roadmap context
  activeRoadmapId: integer("active_roadmap_id"),
  currentExam: varchar("current_exam", { length: 20 }), // ielts_academic, toefl_ibt, pte_academic, etc.
  targetScore: text("target_score"),
  studyDeadline: timestamp("study_deadline"),
  
  // AI behavior preferences
  personalityType: varchar("personality_type", { length: 30 }).default("supportive"), // supportive, challenging, casual, formal
  responseLength: varchar("response_length", { length: 20 }).default("medium"), // short, medium, detailed
  systemPrompt: text("system_prompt"), // Custom system prompt that works across all AI providers
  includePronunciation: boolean("include_pronunciation").default(false),
  includeGrammarTips: boolean("include_grammar_tips").default(true),
  includeVocabulary: boolean("include_vocabulary").default(true),
  
  // Learning progress tracking
  totalConversations: integer("total_conversations").default(0),
  totalMessagesExchanged: integer("total_messages_exchanged").default(0),
  currentStreak: integer("current_streak").default(0), // days of consecutive use
  longestStreak: integer("longest_streak").default(0),
  lastInteractionAt: timestamp("last_interaction_at"),
  
  // AI usage statistics
  totalTokensUsed: integer("total_tokens_used").default(0),
  averageResponseTime: integer("average_response_time"), // in milliseconds
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Push Notifications
export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"), // info, warning, success, error
  targetAudience: varchar("target_audience", { length: 100 }).notNull(), // all, students, teachers, staff, specific_users
  targetUserIds: integer("target_user_ids").array().default([]), // specific user IDs if targeted
  channels: text("channels").array().notNull(), // web_push, in_app, sms, email
  
  // Notification content
  icon: varchar("icon", { length: 255 }),
  image: varchar("image", { length: 255 }),
  actionUrl: varchar("action_url", { length: 500 }),
  actionText: varchar("action_text", { length: 100 }),
  
  // Scheduling
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, scheduled, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  
  // Analytics
  deliveryStats: jsonb("delivery_stats"), // {sent: 0, delivered: 0, clicked: 0, failed: 0}
  
  // Settings
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high
  ttl: integer("ttl").default(86400), // time to live in seconds
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Notification Delivery Logs
export const notificationDeliveryLogs = pgTable("notification_delivery_logs", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").references(() => pushNotifications.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  channel: varchar("channel", { length: 50 }).notNull(), // web_push, in_app, sms, email
  status: varchar("status", { length: 20 }).notNull(), // sent, delivered, failed, clicked
  errorMessage: text("error_message"),
  deliveredAt: timestamp("delivered_at"),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas for communication system
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSupportTicketMessageSchema = createInsertSchema(supportTicketMessages).omit({ id: true, sentAt: true });

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({ id: true, createdAt: true, updatedAt: true });

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, sentAt: true });

export const insertAiStudyPartnerSchema = createInsertSchema(aiStudyPartners).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({ id: true, createdAt: true, updatedAt: true });

export const insertNotificationDeliveryLogSchema = createInsertSchema(notificationDeliveryLogs).omit({ id: true, createdAt: true });

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
export const aiCallInsights = pgTable("ai_call_insights", {
  id: serial("id").primaryKey(),
  callId: varchar("call_id", { length: 100 }).notNull().unique(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  agentId: integer("agent_id").notNull().references(() => users.id),
  transcript: text("transcript").notNull(),
  intent: varchar("intent", { length: 200 }),
  sentiment: varchar("sentiment", { length: 50 }), // positive, neutral, negative
  summary: text("summary"),
  entities: jsonb("entities"), // extracted entities like name, phone, email, etc.
  nextActions: jsonb("next_actions"), // AI suggested next actions
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.5"),
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Teacher Availability Table (DEPRECATED - use teacherAvailabilityPeriods)
// This table is kept only for compatibility views during migration
// DO NOT use directly - all new code should use teacherAvailabilityPeriods
export const teacherAvailability = pgTable("teacher_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  startTime: time("start_time").notNull(), // HH:MM format
  endTime: time("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Teacher Availability Periods - CANONICAL SOURCE for teacher availability
// This is the single source of truth for all teacher availability data
export const teacherAvailabilityPeriods = pgTable("teacher_availability_periods", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  periodStartDate: timestamp("period_start_date").notNull(),
  periodEndDate: timestamp("period_end_date").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  timeDivision: text("time_division").notNull(), // morning, afternoon, evening, full-day
  classFormat: text("class_format").notNull(), // online, in-person, hybrid
  specificHours: text("specific_hours"), // JSON string for specific time slots
  isActive: boolean("is_active").default(true),
  supervisorNotified: boolean("supervisor_notified").default(false),
  adminNotified: boolean("admin_notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Teacher Availability Schema (Legacy)
export const insertTeacherAvailabilitySchema = createInsertSchema(teacherAvailability).omit(['id', 'createdAt', 'updatedAt']);

export type TeacherAvailability = typeof teacherAvailability.$inferSelect;
export type InsertTeacherAvailability = z.infer<typeof insertTeacherAvailabilitySchema>;

// Enhanced Teacher Availability Periods Schema
export const insertTeacherAvailabilityPeriodSchema = createInsertSchema(teacherAvailabilityPeriods).omit(['id', 'createdAt', 'updatedAt']);

export type TeacherAvailabilityPeriod = typeof teacherAvailabilityPeriods.$inferSelect;
export type InsertTeacherAvailabilityPeriod = z.infer<typeof insertTeacherAvailabilityPeriodSchema>;

// AI Call Insights Schema
export const insertAICallInsightSchema = createInsertSchema(aiCallInsights).omit(['id', 'processedAt', 'createdAt']);

export type AICallInsight = typeof aiCallInsights.$inferSelect;
export type InsertAICallInsight = z.infer<typeof insertAICallInsightSchema>;

// Supervision observation types (continued)
export type TeacherObservationResponse = typeof teacherObservationResponses.$inferSelect;
export type InsertTeacherObservationResponse = z.infer<typeof insertTeacherObservationResponseSchema>;
export type ScheduledObservation = typeof scheduledObservations.$inferSelect;
export type InsertScheduledObservation = z.infer<typeof insertScheduledObservationSchema>;

// ===== CALLERN LIVE SCORING SYSTEM =====

// Track camera/mic presence for scoring
export const callernPresence = pgTable("callern_presence", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => callernCallHistory.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cameraOn: boolean("camera_on").default(false),
  micOn: boolean("mic_on").default(false),
  timeline: jsonb("timeline").$type<Array<{
    timestamp: number;
    cameraOn: boolean;
    micOn: boolean;
  }>>().default([]),
  totalCameraOnSeconds: integer("total_camera_on_seconds").default(0),
  totalMicOnSeconds: integer("total_mic_on_seconds").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Speech segments from ASR processing
export const callernSpeechSegments = pgTable("callern_speech_segments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => callernCallHistory.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at").notNull(),
  transcript: text("transcript"),
  langCode: text("lang_code"), // detected language
  wpm: decimal("wpm", { precision: 5, scale: 2 }), // words per minute
  pauses: integer("pauses").default(0),
  selfRepairs: integer("self_repairs").default(0),
  asrConfidence: decimal("asr_confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Student scoring for each lesson
export const callernScoresStudent = pgTable("callern_scores_student", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => callernCallHistory.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  // Category scores (0-100)
  speakingFluency: decimal("speaking_fluency", { precision: 5, scale: 2 }).default("0"),
  pronunciation: decimal("pronunciation", { precision: 5, scale: 2 }).default("0"),
  vocabulary: decimal("vocabulary", { precision: 5, scale: 2 }).default("0"),
  grammar: decimal("grammar", { precision: 5, scale: 2 }).default("0"),
  interaction: decimal("interaction", { precision: 5, scale: 2 }).default("0"),
  targetLangUse: decimal("target_lang_use", { precision: 5, scale: 2 }).default("0"),
  presence: decimal("presence", { precision: 5, scale: 2 }).default("0"),
  // Totals
  total: decimal("total", { precision: 5, scale: 2 }).default("0"),
  stars: decimal("stars", { precision: 2, scale: 1 }).default("0"), // 0-5 with half stars
  // Metadata
  scoreBreakdown: jsonb("score_breakdown"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Teacher scoring for each lesson
export const callernScoresTeacher = pgTable("callern_scores_teacher", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => callernCallHistory.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  // Role scores (0-100)
  facilitator: decimal("facilitator", { precision: 5, scale: 2 }).default("0"),
  monitor: decimal("monitor", { precision: 5, scale: 2 }).default("0"),
  feedbackProvider: decimal("feedback_provider", { precision: 5, scale: 2 }).default("0"),
  resourceModel: decimal("resource_model", { precision: 5, scale: 2 }).default("0"),
  assessor: decimal("assessor", { precision: 5, scale: 2 }).default("0"),
  engagement: decimal("engagement", { precision: 5, scale: 2 }).default("0"),
  targetLangUse: decimal("target_lang_use", { precision: 5, scale: 2 }).default("0"),
  presence: decimal("presence", { precision: 5, scale: 2 }).default("0"),
  // Totals
  total: decimal("total", { precision: 5, scale: 2 }).default("0"),
  stars: decimal("stars", { precision: 2, scale: 1 }).default("0"), // 0-5 with half stars
  // Metadata
  scoreBreakdown: jsonb("score_breakdown"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Real-time scoring events
export const callernScoringEvents = pgTable("callern_scoring_events", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => callernCallHistory.id).notNull(),
  kind: text("kind").notNull(), // 'tl_violation', 'presence_warning', 'score_update', 'milestone'
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas for scoring
export const insertCallernPresenceSchema = createInsertSchema(callernPresence).omit(['id', 'createdAt', 'updatedAt']);

export const insertCallernSpeechSegmentSchema = createInsertSchema(callernSpeechSegments).omit(['id', 'createdAt']);

export const insertCallernScoresStudentSchema = createInsertSchema(callernScoresStudent).omit(['id', 'createdAt', 'updatedAt']);

export const insertCallernScoresTeacherSchema = createInsertSchema(callernScoresTeacher).omit(['id', 'createdAt', 'updatedAt']);

export const insertCallernScoringEventSchema = createInsertSchema(callernScoringEvents).omit(['id', 'createdAt']);

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
export const roadmapTemplate = pgTable("roadmap_template", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  targetLanguage: varchar("target_language", { length: 10 }).notNull(), // en, fa, ar, etc.
  targetLevel: varchar("target_level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  audience: varchar("audience", { length: 100 }), // adults, teens, business, ielts, etc.
  objectivesJson: jsonb("objectives_json"), // Learning objectives structure
  extraContextJson: jsonb("extra_context_json"), // Additional metadata
  createdBy: integer("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Roadmap Units - Major sections within a template
export const roadmapUnit = pgTable("roadmap_unit", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => roadmapTemplate.id, { onDelete: 'cascade' }),
  orderIdx: integer("order_idx").notNull(), // Unit order within template
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  estimatedHours: integer("estimated_hours").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Roadmap Lessons - Individual lessons within units
export const roadmapLesson = pgTable("roadmap_lesson", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull().references(() => roadmapUnit.id, { onDelete: 'cascade' }),
  orderIdx: integer("order_idx").notNull(), // Lesson order within unit
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  objectives: text("objectives"), // Specific lesson objectives
  estimatedMinutes: integer("estimated_minutes").default(30),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Roadmap Activities - Specific activities within lessons
export const roadmapActivity = pgTable("roadmap_activity", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => roadmapLesson.id, { onDelete: 'cascade' }),
  orderIdx: integer("order_idx").notNull(), // Activity order within lesson
  type: varchar("type", { length: 50 }).notNull(), // quiz, matching, fill_in_blank, poll, vocab_game, dialogue_roleplay
  subtype: varchar("subtype", { length: 50 }), // Specific subtype for activity
  deliveryModesJson: jsonb("delivery_modes_json"), // Which delivery modes support this activity
  estimatedMin: integer("estimated_min").default(5),
  masteryJson: jsonb("mastery_json"), // Mastery criteria and rubrics
  metaJson: jsonb("meta_json"), // Activity-specific metadata
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ========================
// ROADMAP INSTANCES & PROGRESS
// ========================

// Roadmap Instances - Instantiated roadmaps for courses/students
export const roadmapInstance = pgTable("roadmap_instance", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => roadmapTemplate.id, { onDelete: 'cascade' }),
  courseId: integer("course_id").references(() => courses.id, { onDelete: 'cascade' }), // Can be null for individual student roadmaps
  studentId: integer("student_id").references(() => users.id, { onDelete: 'cascade' }), // Can be null for course-wide roadmaps
  startDate: date("start_date").notNull(),
  hoursPerWeek: integer("hours_per_week").default(4),
  status: varchar("status", { length: 20 }).default('active'), // active, paused, completed, cancelled
  currentProgress: integer("current_progress").default(0), // 0-100 overall completion percentage
  adaptivePacing: boolean("adaptive_pacing").default(true), // Enable/disable adaptive micro-sessions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Activity Instances - Individual activity instances with progress
export const activityInstance = pgTable("activity_instance", {
  id: serial("id").primaryKey(),
  roadmapInstanceId: integer("roadmap_instance_id").notNull().references(() => roadmapInstance.id, { onDelete: 'cascade' }),
  activityId: integer("activity_id").notNull().references(() => roadmapActivity.id, { onDelete: 'cascade' }),
  dueAt: timestamp("due_at"), // Scheduled due date
  status: varchar("status", { length: 20 }).default('not_started'), // not_started, in_progress, completed, skipped
  evidenceId: integer("evidence_id"), // Link to evidence/submission
  scoreJson: jsonb("score_json"), // Scoring results
  rubricJson: jsonb("rubric_json"), // Applied rubric
  aiGeneratedContent: jsonb("ai_generated_content"), // AI-generated activity content
  adaptiveLevel: varchar("adaptive_level", { length: 20 }).default('controlled'), // controlled, semi_controlled, free
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ========================
// CALLERN SESSION SYSTEM
// ========================

// CallerN Call Sessions - Actual video call sessions
export const callSession = pgTable("call_session", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  roadmapInstanceId: integer("roadmap_instance_id").references(() => roadmapInstance.id),
  activityInstanceId: integer("activity_instance_id").references(() => activityInstance.id),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSec: integer("duration_sec"),
  recordingPath: text("recording_path"), // Actual file path to recording
  transcriptPath: text("transcript_path"), // Actual file path to transcript
  sessionType: varchar("session_type", { length: 30 }).default('callern'), // callern, regular, assessment
  qualityMetrics: jsonb("quality_metrics"), // Audio/video quality data
  status: varchar("status", { length: 20 }).default('active'), // active, completed, cancelled, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Post-Session Reports - Teacher confirmations and AI summaries
export const callPostReport = pgTable("call_post_report", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => callSession.id, { onDelete: 'cascade' }),
  teacherSummaryJson: jsonb("teacher_summary_json"), // Teacher's summary of session
  aiSummaryJson: jsonb("ai_summary_json"), // AI-generated summary
  taughtItemsJson: jsonb("taught_items_json"), // What was actually taught/practiced
  srsSeedJson: jsonb("srs_seed_json"), // SRS cards to generate
  teacherConfirmed: boolean("teacher_confirmed").default(false),
  teacherEditsJson: jsonb("teacher_edits_json"), // Teacher modifications to AI suggestions
  nextSessionPrep: jsonb("next_session_prep"), // Generated prep for next session
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Session Ratings - Student and teacher ratings
export const sessionRatings = pgTable("session_ratings", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => callSession.id, { onDelete: 'cascade' }),
  raterRole: varchar("rater_role", { length: 10 }).notNull(), // student, teacher
  raterId: integer("rater_id").notNull().references(() => users.id),
  score: integer("score").notNull(), // 1-5 rating
  comment: text("comment"),
  aspectRatings: jsonb("aspect_ratings"), // Detailed aspect-specific ratings
  createdAt: timestamp("created_at").defaultNow()
});

// ========================
// SRS (SPACED REPETITION SYSTEM)
// ========================

// SRS Cards - Spaced repetition flashcards
export const srsCard = pgTable("srs_card", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceSessionId: integer("source_session_id").references(() => callSession.id), // Session where card was created
  term: varchar("term", { length: 200 }).notNull(),
  definition: text("definition").notNull(),
  example: text("example"),
  languageCode: varchar("language_code", { length: 10 }).notNull(), // en, fa, ar, etc.
  dueAt: timestamp("due_at").notNull(),
  ease: decimal("ease", { precision: 4, scale: 2 }).default("2.5"), // Ease factor for spacing
  interval: integer("interval").default(1), // Days until next review
  reps: integer("reps").default(0), // Number of successful reviews
  lastReviewedAt: timestamp("last_reviewed_at"),
  difficulty: varchar("difficulty", { length: 20 }).default('normal'), // easy, normal, hard
  cardType: varchar("card_type", { length: 30 }).default('vocabulary'), // vocabulary, grammar, pronunciation
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ========================
// SPECIAL CLASSES SYSTEM
// ========================

// Special Classes - admin-flagged featured classes for dashboard showcase
export const specialClasses = pgTable("special_classes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(), // Display title for the special class
  description: text("description"), // Special description/highlight
  badge: text("badge"), // "Featured", "Popular", "New", "Limited Time"
  badgeColor: text("badge_color").default("blue"), // blue, green, red, purple, orange
  thumbnail: text("thumbnail"), // Special thumbnail for featured display
  priority: integer("priority").default(1), // Higher = more priority in display
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"), // Optional expiry date
  maxEnrollments: integer("max_enrollments"), // Limited enrollment
  currentEnrollments: integer("current_enrollments").default(0),
  discountPercentage: integer("discount_percentage").default(0), // 0-100
  originalPrice: integer("original_price"), // Original price if discounted
  specialFeatures: text("special_features").array().default([]), // ["Native Speaker", "Certificate", "Small Class"]
  targetAudience: text("target_audience"), // "Beginners", "Business Professionals", "IELTS Candidates"
  adminNotes: text("admin_notes"), // Internal admin notes
  createdBy: integer("created_by").references(() => users.id), // Admin who flagged it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ========================
// PEER SOCIALIZER SYSTEM
// ========================

// Peer Socializer Groups/Rooms for language practice
export const peerSocializerGroups = pgTable("peer_socializer_groups", {
  id: serial("id").primaryKey(),
  groupName: text("group_name").notNull(),
  language: text("language").notNull(), // Target language for practice
  proficiencyLevel: text("proficiency_level").notNull(), // beginner, intermediate, advanced
  topic: text("topic"), // Conversation topic/theme
  maxParticipants: integer("max_participants").default(6), // Maximum group size
  currentParticipants: integer("current_participants").default(0),
  status: text("status").default("waiting"), // waiting, active, completed, cancelled
  hostId: integer("host_id").references(() => users.id), // Optional host/moderator
  scheduledAt: timestamp("scheduled_at"), // When the session is scheduled
  startedAt: timestamp("started_at"), // When session actually started
  endedAt: timestamp("ended_at"), // When session ended
  durationMinutes: integer("duration_minutes").default(30), // Session duration
  genderMixPreference: text("gender_mix_preference").default("mixed"), // mixed, same_gender, opposite_gender
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Peer Socializer Participants - tracks who joins which groups
export const peerSocializerParticipants = pgTable("peer_socializer_participants", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => peerSocializerGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"), // When they left (if they left early)
  participationRating: integer("participation_rating"), // 1-5 rating
  feedback: text("feedback"), // Post-session feedback
  status: text("status").default("joined"), // joined, left, completed
  createdAt: timestamp("created_at").defaultNow()
});

// Peer Matching Requests - for intelligent matching system
export const peerMatchingRequests = pgTable("peer_matching_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  language: text("language").notNull(), // Target language
  proficiencyLevel: text("proficiency_level").notNull(),
  preferredGender: text("preferred_gender"), // same, opposite, any
  preferredAgeRange: text("preferred_age_range"), // "18-25", "26-35", "36-50", "any"
  interests: text("interests").array().default([]), // Topics of interest
  availableTimeSlots: jsonb("available_time_slots"), // When they're available
  matchingPriority: integer("matching_priority").default(1), // Higher = more priority
  status: text("status").default("active"), // active, matched, cancelled, expired
  requestedAt: timestamp("requested_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // When request expires
  matchedGroupId: integer("matched_group_id").references(() => peerSocializerGroups.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Peer Matching History - tracks successful matches and quality
export const peerMatchingHistory = pgTable("peer_matching_history", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => peerMatchingRequests.id).notNull(),
  groupId: integer("group_id").references(() => peerSocializerGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  matchScore: decimal("match_score", { precision: 3, scale: 2 }), // Algorithm calculated score
  matchCriteria: jsonb("match_criteria"), // What criteria were used for matching
  sessionQuality: integer("session_quality"), // 1-5 rating post-session
  wouldMatchAgain: boolean("would_match_again"), // User feedback
  reportIssues: text("report_issues"), // Any reported problems
  matchedAt: timestamp("matched_at").defaultNow(),
  sessionCompletedAt: timestamp("session_completed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Peer Socializer Settings - user preferences for matching
export const peerSocializerSettings = pgTable("peer_socializer_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  enableMatching: boolean("enable_matching").default(true),
  preferredGender: text("preferred_gender").default("any"), // same, opposite, any
  ageRangeMin: integer("age_range_min").default(18),
  ageRangeMax: integer("age_range_max").default(65),
  maxGroupSize: integer("max_group_size").default(6),
  preferredLanguages: text("preferred_languages").array().default([]),
  preferredTopics: text("preferred_topics").array().default([]),
  availabilitySchedule: jsonb("availability_schedule"), // Weekly schedule
  notificationPreferences: jsonb("notification_preferences"),
  blockedUsers: integer("blocked_users").array().default([]), // List of blocked user IDs
  privacyLevel: text("privacy_level").default("normal"), // strict, normal, open
  autoJoinGroups: boolean("auto_join_groups").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ========================
// INSERT SCHEMAS AND TYPES
// ========================

// Roadmap Template System Insert Schemas
export const insertRoadmapTemplateSchema = createInsertSchema(roadmapTemplate).omit(['id', 'createdAt', 'updatedAt']);

export const insertRoadmapUnitSchema = createInsertSchema(roadmapUnit).omit(['id', 'createdAt', 'updatedAt']);

export const insertRoadmapLessonSchema = createInsertSchema(roadmapLesson).omit(['id', 'createdAt', 'updatedAt']);

export const insertRoadmapActivitySchema = createInsertSchema(roadmapActivity).omit(['id', 'createdAt', 'updatedAt']);

export const insertRoadmapInstanceSchema = createInsertSchema(roadmapInstance).omit(['id', 'createdAt', 'updatedAt']);

export const insertActivityInstanceSchema = createInsertSchema(activityInstance).omit(['id', 'createdAt', 'updatedAt']);

// CallerN Session System Insert Schemas
export const insertCallSessionSchema = createInsertSchema(callSession).omit(['id', 'createdAt', 'updatedAt']);

export const insertCallPostReportSchema = createInsertSchema(callPostReport).omit(['id', 'createdAt', 'updatedAt']);

export const insertSessionRatingsSchema = createInsertSchema(sessionRatings).omit(['id', 'createdAt']);

export const insertSrsCardSchema = createInsertSchema(srsCard).omit(['id', 'createdAt', 'updatedAt']);

// Special Classes System Insert Schemas  
export const insertSpecialClassSchema = createInsertSchema(specialClasses).omit(['id', 'createdAt', 'updatedAt']);

// Peer Socializer System Insert Schemas
export const insertPeerSocializerGroupSchema = createInsertSchema(peerSocializerGroups).omit(['id', 'createdAt', 'updatedAt']);

export const insertPeerSocializerParticipantSchema = createInsertSchema(peerSocializerParticipants).omit(['id', 'createdAt']);

export const insertPeerMatchingRequestSchema = createInsertSchema(peerMatchingRequests).omit(['id', 'createdAt', 'updatedAt']);

export const insertPeerMatchingHistorySchema = createInsertSchema(peerMatchingHistory).omit(['id', 'createdAt']);

export const insertPeerSocializerSettingsSchema = createInsertSchema(peerSocializerSettings).omit(['id', 'createdAt', 'updatedAt']);

// Missing insert schemas for tables identified in consolidation
export const insertCallernRoadmapSchema = createInsertSchema(callernRoadmaps).omit(['id', 'createdAt', 'updatedAt']);

export const insertCallernRoadmapStepSchema = createInsertSchema(callernRoadmapSteps).omit(['id', 'createdAt', 'updatedAt']);

export const insertCourseGameSchema = createInsertSchema(courseGames).omit(['id', 'createdAt', 'updatedAt']);

export const insertCourseRoadmapProgressSchema = createInsertSchema(courseRoadmapProgress).omit(['id', 'createdAt', 'updatedAt']);

export const insertCourseSessionSchema = createInsertSchema(courseSessions).omit(['id', 'createdAt', 'updatedAt']);

export const insertGameAccessRuleSchema = createInsertSchema(gameAccessRules).omit(['id', 'createdAt', 'updatedAt']);

export const insertStudentGameAssignmentSchema = createInsertSchema(studentGameAssignments).omit(['id', 'createdAt', 'updatedAt']);

export const insertStudentRoadmapProgressSchema = createInsertSchema(studentRoadmapProgress).omit(['id', 'createdAt', 'updatedAt']);

export const insertTeacherPaymentRecordSchema = createInsertSchema(teacherPaymentRecords).omit(['id', 'createdAt', 'updatedAt']);

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
export const classGroupChats = pgTable("class_group_chats", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => courses.id).notNull(),
  title: text("title").notNull(), // Class name + "Group Chat"
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Socializer Sessions - Track AI matching for CallernN
export const socializerSessions = pgTable("socializer_sessions", {
  id: serial("id").primaryKey(),
  callernSessionId: text("callern_session_id").notNull(), // Reference to active CallernN session
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  requestingStudentId: integer("requesting_student_id").references(() => users.id).notNull(),
  socializerId: integer("socializer_id").references(() => users.id).notNull(),
  matchReason: text("match_reason"), // AI explanation for the match
  sessionStatus: text("session_status").default("active"), // active, completed, declined
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Create insert schemas
export const insertClassGroupChatSchema = createInsertSchema(classGroupChats).omit(['id', 'createdAt', 'updatedAt']);

export const insertSocializerSessionSchema = createInsertSchema(socializerSessions).omit(['id', 'createdAt']);

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
  IELTS_ACADEMIC: 'ielts_academic',
  IELTS_GENERAL: 'ielts_general', 
  TOEFL_IBT: 'toefl_ibt',
  PTE_ACADEMIC: 'pte_academic',
  PTE_CORE: 'pte_core',
  GRE_GENERAL: 'gre_general',
  GMAT: 'gmat',
  BUSINESS_CORRESPONDENCE: 'business_correspondence',
  BUSINESS_CONVERSATION: 'business_conversation',
  GENERAL_CONVERSATION: 'general_conversation'
} as const;

export type ExamTypeValues = typeof ExamType[keyof typeof ExamType];

export const CEFRLevel = {
  A1: 'A1',
  A2: 'A2', 
  B1: 'B1',
  B2: 'B2',
  C1: 'C1',
  C2: 'C2'
} as const;

export type CEFRLevelValues = typeof CEFRLevel[keyof typeof CEFRLevel];

export const PreferredPace = {
  INTENSIVE: 'intensive',     // 15+ hours/week
  REGULAR: 'regular',         // 8-15 hours/week
  RELAXED: 'relaxed'         // 5-8 hours/week
} as const;

export type PreferredPaceValues = typeof PreferredPace[keyof typeof PreferredPace];

export const SessionType = {
  FOUNDATION: 'foundation',       // Grammar, vocabulary fundamentals
  SKILL_BUILDING: 'skill_building', // Targeted skill practice
  EXAM_STRATEGY: 'exam_strategy', // Test-taking techniques
  MOCK_TEST: 'mock_test',        // Practice exams
  REVIEW: 'review',             // Consolidation and review
  SPEAKING_INTENSIVE: 'speaking_intensive', // Focused speaking practice
  WRITING_INTENSIVE: 'writing_intensive'   // Focused writing practice
} as const;

export type SessionTypeValues = typeof SessionType[keyof typeof SessionType];

// Roadmap Configurations - User exam goals and preferences
export const roadmapConfigs = pgTable("roadmap_configs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // References MST session
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Exam configuration
  exam: text("exam").notNull(), // ExamType
  targetScore: decimal("target_score", { precision: 4, scale: 1 }).notNull(), // e.g., 7.0 for IELTS
  examDate: date("exam_date"), // Target exam date
  
  // Study preferences
  weeklyHours: integer("weekly_hours").notNull().default(10), // Available hours per week
  preferredPace: text("preferred_pace").notNull().default("regular"), // intensive, regular, relaxed
  
  // Focus areas (skills/components to emphasize)
  focusAreas: text("focus_areas").array().default([]), // ['academic_writing', 'speaking_fluency', 'listening_comprehension']
  
  // Learning preferences
  studyDays: text("study_days").array().default(['monday', 'wednesday', 'friday']), // Preferred study days
  sessionDuration: integer("session_duration").default(90), // Minutes per session
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Roadmap Plans - Generated study plans based on user goals
export const roadmapPlans = pgTable("roadmap_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  configId: integer("config_id").references(() => roadmapConfigs.id).notNull(),
  
  // Plan details
  exam: text("exam").notNull(), // ExamType
  currentLevel: text("current_level").notNull(), // Current CEFR level from MST
  targetScore: decimal("target_score", { precision: 4, scale: 1 }).notNull(),
  cefrTarget: text("cefr_target").notNull(), // Target CEFR level
  
  // Time calculations
  requiredHours: integer("required_hours").notNull(), // Total estimated study hours
  weeksToExam: integer("weeks_to_exam"), // Weeks until exam date
  sessionsPerWeek: integer("sessions_per_week").notNull(),
  totalSessions: integer("total_sessions").notNull(),
  
  // Progress tracking
  completedSessions: integer("completed_sessions").default(0),
  currentWeek: integer("current_week").default(1),
  
  // Plan metadata
  planStatus: text("plan_status").default("active"), // active, paused, completed, outdated
  lastUpdated: timestamp("last_updated").defaultNow(),
  
  // Generated plan data
  weeklyBreakdown: jsonb("weekly_breakdown"), // Week-by-week plan structure
  skillProgression: jsonb("skill_progression"), // How skills develop over time
  milestones: jsonb("milestones"), // Key checkpoints and assessments
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Roadmap Sessions - Individual study sessions within the plan
export const roadmapSessions = pgTable("roadmap_sessions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => roadmapPlans.id).notNull(),
  
  // Session ordering and timing
  sessionIndex: integer("session_index").notNull(), // 1, 2, 3... within the plan
  weekNumber: integer("week_number").notNull(), // Which week this session belongs to
  
  // Session content
  title: varchar("title", { length: 255 }).notNull(),
  sessionType: text("session_type").notNull(), // SessionType enum
  durationMinutes: integer("duration_minutes").default(90),
  
  // Learning objectives and content
  learningGoals: text("learning_goals").array().default([]), // What students will achieve
  grammarTopics: text("grammar_topics").array().default([]), // Grammar points to cover
  vocabularyThemes: text("vocabulary_themes").array().default([]), // Vocabulary areas
  keyPhrases: text("key_phrases").array().default([]), // Important phrases/expressions
  
  // Materials and resources
  flashcardSets: text("flashcard_sets").array().default([]), // Vocabulary/phrase sets
  homeworkTasks: text("homework_tasks").array().default([]), // Assignments
  practiceExercises: text("practice_exercises").array().default([]), // In-session activities
  
  // Integration with existing system
  callernLessonId: integer("callern_lesson_id"), // Link to Callern lesson if applicable
  courseId: integer("course_id").references(() => courses.id), // Link to course if applicable
  
  // Session structure
  warmUpActivities: text("warm_up_activities").array().default([]),
  mainActivities: text("main_activities").array().default([]),
  closingActivities: text("closing_activities").array().default([]),
  
  // Assessment and feedback
  assessmentCriteria: text("assessment_criteria").array().default([]),
  expectedOutcomes: text("expected_outcomes").array().default([]),
  
  // Completion tracking
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  studentNotes: text("student_notes"),
  teacherFeedback: text("teacher_feedback"),
  sessionRating: integer("session_rating"), // 1-5 student rating
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// SCORE MAPPING AND CONVERSION DATA
// ============================================================================

// IELTS Score to CEFR Mapping (Academic & General)
export const IELTS_TO_CEFR_MAPPING = {
  1.0: 'A1', 1.5: 'A1', 2.0: 'A1', 2.5: 'A1',
  3.0: 'A1', 3.5: 'A2', 4.0: 'A2', 4.5: 'B1',
  5.0: 'B1', 5.5: 'B2', 6.0: 'B2', 6.5: 'C1',
  7.0: 'C1', 7.5: 'C1', 8.0: 'C2', 8.5: 'C2', 9.0: 'C2'
} as const;

// TOEFL iBT Score to CEFR Mapping
export const TOEFL_TO_CEFR_MAPPING = {
  // A1 level (0-31)
  0: 'A1', 10: 'A1', 20: 'A1', 31: 'A1',
  // A2 level (32-41) 
  32: 'A2', 41: 'A2',
  // B1 level (42-71)
  42: 'B1', 71: 'B1',
  // B2 level (72-94)
  72: 'B2', 94: 'B2', 
  // C1 level (95-112)
  95: 'C1', 112: 'C1',
  // C2 level (113-120)
  113: 'C2', 120: 'C2'
} as const;

// PTE Academic Score to CEFR Mapping
export const PTE_TO_CEFR_MAPPING = {
  // A1 level (10-29)
  10: 'A1', 29: 'A1',
  // A2 level (30-35)
  30: 'A2', 35: 'A2',
  // B1 level (36-49)
  36: 'B1', 49: 'B1',
  // B2 level (50-64) 
  50: 'B2', 64: 'B2',
  // C1 level (65-78)
  65: 'C1', 78: 'C1',
  // C2 level (79-90)
  79: 'C2', 90: 'C2'
} as const;

// Study Hours Required for CEFR Level Progression
export const CEFR_STUDY_HOURS = {
  'A1_TO_A2': 80,  // Beginner to Elementary
  'A2_TO_B1': 100, // Elementary to Intermediate 
  'B1_TO_B2': 120, // Intermediate to Upper-Intermediate
  'B2_TO_C1': 150, // Upper-Intermediate to Advanced
  'C1_TO_C2': 200  // Advanced to Proficiency
} as const;

// Base study hours by current level (to reach next level)
export const BASE_HOURS_BY_LEVEL = {
  'A1': 80,  // A1 → A2
  'A2': 100, // A2 → B1  
  'B1': 120, // B1 → B2
  'B2': 150, // B2 → C1
  'C1': 200  // C1 → C2
} as const;

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
export const placementTests = pgTable("placement_tests", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  language: varchar("language", { length: 10 }).notNull(), // en, fa, ar, etc.
  targetLevel: varchar("target_level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  duration: integer("duration").notNull(), // minutes
  
  // Test configuration
  totalQuestions: integer("total_questions").default(50),
  passingScore: integer("passing_score").default(70), // percentage
  
  // Status and settings
  isActive: boolean("is_active").default(true),
  isPublished: boolean("is_published").default(false),
  
  // Iranian education system compliance
  institutionalApproval: boolean("institutional_approval").default(false),
  approvedByMinistryOfEducation: boolean("approved_by_ministry").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Questions - Question bank for placement tests
export const placementQuestions = pgTable("placement_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").references(() => placementTests.id).notNull(),
  
  // Question content
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 30 }).notNull(), // multiple_choice, fill_blank, essay, listening, speaking
  
  // Question options and answers
  options: jsonb("options"), // For multiple choice questions
  correctAnswer: jsonb("correct_answer"),
  explanation: text("explanation"),
  
  // Question metadata
  skillArea: varchar("skill_area", { length: 50 }), // grammar, vocabulary, reading, listening, speaking, writing
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // easy, medium, hard
  cefrLevel: varchar("cefr_level", { length: 5 }), // A1, A2, B1, B2, C1, C2
  
  // Scoring
  points: integer("points").default(1),
  timeLimit: integer("time_limit"), // seconds per question
  
  // Media attachments
  audioUrl: varchar("audio_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  
  // Order and status
  orderIndex: integer("order_index").notNull(),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Placement Test Sessions - Individual test attempts (matches actual database structure)
export const placementTestSessions = pgTable("placement_test_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  targetLanguage: varchar("target_language", { length: 10 }), // en, fa, ar, etc.
  learningGoal: text("learning_goal"),
  
  // Session timing
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  totalDurationSeconds: integer("total_duration_seconds"),
  
  // Session status and progress
  status: varchar("status", { length: 20 }).default('in_progress'), // in_progress, completed, abandoned
  currentSkill: varchar("current_skill", { length: 50 }),
  currentQuestionIndex: integer("current_question_index").default(0),
  
  // CEFR Level Results (matching database columns exactly)
  overallCefrLevel: varchar("overall_cefr_level", { length: 5 }), // A1, A2, B1, B2, C1, C2
  speakingLevel: varchar("speaking_level", { length: 5 }),
  listeningLevel: varchar("listening_level", { length: 5 }),
  readingLevel: varchar("reading_level", { length: 5 }),
  writingLevel: varchar("writing_level", { length: 5 }),
  
  // Scores
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  speakingScore: decimal("speaking_score", { precision: 5, scale: 2 }),
  listeningScore: decimal("listening_score", { precision: 5, scale: 2 }),
  readingScore: decimal("reading_score", { precision: 5, scale: 2 }),
  writingScore: decimal("writing_score", { precision: 5, scale: 2 }),
  
  // Analysis Results
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  recommendations: text("recommendations").array(),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  
  // Related records
  generatedRoadmapId: integer("generated_roadmap_id"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Placement Results - Final placement recommendations
export const placementResults = pgTable("placement_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => placementTestSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Recommended placement
  recommendedLevel: varchar("recommended_level", { length: 5 }).notNull(), // A1, A2, B1, B2, C1, C2
  recommendedCourse: integer("recommended_course_id").references(() => courses.id),
  
  // Detailed breakdown
  skillBreakdown: jsonb("skill_breakdown"), // Detailed scores per skill
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  recommendations: text("recommendations"),
  
  // Follow-up action status
  hasEnrolled: boolean("has_enrolled").default(false),
  enrollmentDate: timestamp("enrollment_date"),
  followUpStatus: varchar("follow_up_status", { length: 30 }).default('pending'), // pending, contacted, enrolled, declined
  
  // Iranian compliance
  parentNotified: boolean("parent_notified").default(false), // For under-18 students
  instituteApproval: boolean("institute_approval").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for placement test system
export const insertPlacementTestSchema = createInsertSchema(placementTests);
export const insertPlacementQuestionSchema = createInsertSchema(placementQuestions);
export const insertPlacementTestSessionSchema = createInsertSchema(placementTestSessions);
export const insertPlacementResultSchema = createInsertSchema(placementResults);

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

export const roadmapConfigInsertSchema = createInsertSchema(roadmapConfigs).omit(['id', 'createdAt', 'updatedAt']);

export const roadmapPlanInsertSchema = createInsertSchema(roadmapPlans).omit(['id', 'createdAt', 'updatedAt', 'lastUpdated']);

export const roadmapSessionInsertSchema = createInsertSchema(roadmapSessions).omit(['id', 'createdAt', 'updatedAt']);

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
export const learningTracks = pgTable("learning_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  targetLanguage: text("target_language").notNull(), // persian, english, arabic, german, etc.
  targetLevel: text("target_level").notNull(), // A1, A2, B1, B2, C1, C2
  trackType: text("track_type").notNull(), // callern, course, self_paced, exam_prep, conversation
  deliveryMode: text("delivery_mode").notNull(), // online, in_person, hybrid, callern, self_paced
  
  // Track metadata
  estimatedWeeks: integer("estimated_weeks").notNull(),
  weeklyHours: integer("weekly_hours").notNull(),
  totalExpectedMinutes: integer("total_expected_minutes").notNull(), // Total time investment
  difficulty: text("difficulty").default("intermediate"), // beginner, intermediate, advanced
  prerequisites: text("prerequisites").array().default([]),
  
  // Visual and branding
  thumbnailUrl: text("thumbnail_url"),
  iconName: text("icon_name"),
  accentColor: text("accent_color"), // Hex color for UI theming
  
  // Pricing and access
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  currency: text("currency").default("IRR"),
  accessPeriodMonths: integer("access_period_months"), // For time-limited access
  
  // Configuration
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  allowSelfEnrollment: boolean("allow_self_enrollment").default(true),
  requiresApproval: boolean("requires_approval").default(false),
  
  // Legacy compatibility - links to existing systems
  legacyCourseId: integer("legacy_course_id").references(() => courses.id), // Link to existing course
  legacyCallernPackageId: integer("legacy_callern_package_id").references(() => callernPackages.id), // Link to Callern package
  
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Track Sub-levels - Fine-grained level divisions (A1.1, A1.2, etc.)
export const trackSublevels = pgTable("track_sublevels", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => learningTracks.id).notNull(),
  sublevelCode: text("sublevel_code").notNull(), // A1.1, A1.2, B1.1, etc.
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(), // Sequential ordering within track
  
  // Time allocations per skill
  listeningMinutes: integer("listening_minutes").default(0),
  readingMinutes: integer("reading_minutes").default(0),
  speakingMinutes: integer("speaking_minutes").default(0),
  writingMinutes: integer("writing_minutes").default(0),
  grammarMinutes: integer("grammar_minutes").default(0),
  vocabularyMinutes: integer("vocabulary_minutes").default(0),
  
  // Learning objectives and outcomes
  learningObjectives: text("learning_objectives").array().default([]),
  canDoStatements: text("can_do_statements").array().default([]), // CEFR can-do descriptors
  keyVocabulary: text("key_vocabulary").array().default([]),
  grammarPoints: text("grammar_points").array().default([]),
  
  // Prerequisites and dependencies
  prerequisiteSublevelIds: integer("prerequisite_sublevel_ids").array().default([]),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Track Sessions - Individual sessions within sublevels with exam support
export const trackSessions = pgTable("track_sessions", {
  id: serial("id").primaryKey(),
  sublevelId: integer("sublevel_id").references(() => trackSublevels.id).notNull(),
  sessionNumber: integer("session_number").notNull(), // 1, 2, 3... within sublevel
  globalSessionNumber: integer("global_session_number").notNull(), // Overall session number in track (for exam scheduling)
  title: text("title").notNull(),
  description: text("description"),
  
  // Session type and configuration
  sessionType: text("session_type").default("regular"), // regular, review, exam, practice
  isExam: boolean("is_exam").default(false),
  examType: text("exam_type"), // midterm, final, quiz, placement
  
  // Time allocation
  estimatedMinutes: integer("estimated_minutes").notNull().default(60),
  
  // Learning materials and resources
  materials: jsonb("materials").$type<{type: string, url: string, title: string}[]>().default([]),
  teacherGuidelines: text("teacher_guidelines"), // For live sessions
  aiPrompts: jsonb("ai_prompts").$type<{context: string, instructions: string}[]>().default([]), // For AI-powered sessions
  
  // Prerequisites and dependencies
  prerequisiteSessionIds: integer("prerequisite_session_ids").array().default([]),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Track Tasks - Individual tasks with skill-based time allocations
export const trackTasks = pgTable("track_tasks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => trackSessions.id).notNull(),
  taskNumber: integer("task_number").notNull(), // Sequential within session
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  
  // Task type and skill focus
  taskType: text("task_type").notNull(), // reading_comprehension, listening_exercise, speaking_practice, writing_task, grammar_drill, vocabulary_quiz, conversation, role_play, presentation
  primarySkill: text("primary_skill").notNull(), // listening, reading, speaking, writing
  secondarySkills: text("secondary_skills").array().default([]), // Additional skills practiced
  
  // Time allocations per skill (in minutes)
  listeningMinutes: integer("listening_minutes").default(0),
  readingMinutes: integer("reading_minutes").default(0),
  speakingMinutes: integer("speaking_minutes").default(0),
  writingMinutes: integer("writing_minutes").default(0),
  totalExpectedMinutes: integer("total_expected_minutes").notNull(),
  
  // Difficulty and assessment
  difficultyLevel: integer("difficulty_level").default(3), // 1-5 scale
  maxScore: integer("max_score").default(100),
  passingScore: integer("passing_score").default(60),
  
  // Content and materials
  content: jsonb("content").$type<{text?: string, audio?: string, images?: string[], options?: string[]}>(), // Task content
  correctAnswers: jsonb("correct_answers"), // Expected answers for auto-grading
  rubric: jsonb("rubric").$type<{criterion: string, points: number, description: string}[]>(), // Grading rubric
  
  // Anti-plagiarism and variation support
  antiPlagHash: text("anti_plag_hash"), // Hash for plagiarism detection
  variationGroupId: text("variation_group_id"), // For grouping task variations
  generationPrompt: text("generation_prompt"), // AI prompt for generating variations
  
  // Prerequisites and adaptive features
  prerequisiteTaskIds: integer("prerequisite_task_ids").array().default([]),
  adaptiveRules: jsonb("adaptive_rules").$type<{condition: string, action: string}[]>(), // Rules for AI adaptation
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Track Enrollments - Student enrollment and progress tracking
export const userTrackEnrollments = pgTable("user_track_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  trackId: integer("track_id").references(() => learningTracks.id).notNull(),
  
  // Enrollment details
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
  enrollmentType: text("enrollment_type").default("self"), // self, admin, mentor, system
  enrolledBy: integer("enrolled_by").references(() => users.id),
  
  // Progress tracking
  currentSublevelId: integer("current_sublevel_id").references(() => trackSublevels.id),
  currentSessionId: integer("current_session_id").references(() => trackSessions.id),
  currentTaskId: integer("current_task_id").references(() => trackTasks.id),
  
  // Time and completion tracking
  totalTimeSpentMinutes: integer("total_time_spent_minutes").default(0),
  completedSessions: integer("completed_sessions").default(0),
  completedTasks: integer("completed_tasks").default(0),
  overallProgress: decimal("overall_progress", { precision: 5, scale: 2 }).default("0.00"), // 0.00-100.00
  
  // Performance metrics
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).default("0.00"),
  bestScore: decimal("best_score", { precision: 5, scale: 2 }).default("0.00"),
  weakestSkill: text("weakest_skill"), // Based on performance analysis
  strongestSkill: text("strongest_skill"),
  
  // Status and completion
  status: text("status").default("active"), // active, paused, completed, dropped, expired
  completedAt: timestamp("completed_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  
  // Access and subscription
  accessExpiresAt: timestamp("access_expires_at"), // For time-limited tracks
  subscriptionStatus: text("subscription_status").default("active"), // active, expired, cancelled
  
  // Personalization and AI
  adaptationProfileId: integer("adaptation_profile_id").references(() => adaptationProfiles.id), // Link to AI adaptation profile
  personalizedPath: boolean("personalized_path").default(false), // Whether AI has customized the path
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Task Progress - Detailed task completion with time and scores
export const userTaskProgress = pgTable("user_task_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => userTrackEnrollments.id).notNull(),
  taskId: integer("task_id").references(() => trackTasks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Denormalized for faster queries
  
  // Attempt tracking
  attemptNumber: integer("attempt_number").default(1),
  maxAttempts: integer("max_attempts").default(3),
  
  // Time tracking (in minutes)
  listeningTimeSpent: integer("listening_time_spent").default(0),
  readingTimeSpent: integer("reading_time_spent").default(0),
  speakingTimeSpent: integer("speaking_time_spent").default(0),
  writingTimeSpent: integer("writing_time_spent").default(0),
  totalTimeSpent: integer("total_time_spent").default(0),
  
  // Performance tracking
  score: decimal("score", { precision: 5, scale: 2 }), // Achieved score
  maxPossibleScore: integer("max_possible_score").default(100),
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // score/maxPossibleScore * 100
  skillScores: jsonb("skill_scores").$type<{listening?: number, reading?: number, speaking?: number, writing?: number}>(), // Individual skill scores
  
  // Response data
  userResponse: jsonb("user_response"), // User's submitted answers/responses
  feedback: text("feedback"), // Teacher or AI feedback
  teacherComments: text("teacher_comments"), // Human teacher comments
  aiAnalysis: jsonb("ai_analysis").$type<{strengths: string[], weaknesses: string[], suggestions: string[]}>(), // AI-generated analysis
  
  // Status and completion
  status: text("status").default("not_started"), // not_started, in_progress, completed, skipped, failed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  submittedAt: timestamp("submitted_at"),
  
  // Adaptive features
  wasAdapted: boolean("was_adapted").default(false), // Whether task was adapted by AI
  adaptationReason: text("adaptation_reason"), // Why task was adapted
  originalTaskId: integer("original_task_id").references(() => trackTasks.id), // Original task if this was adapted
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User Sublevel Progress - Aggregated progress for charts and overviews
export const userSublevelProgress = pgTable("user_sublevel_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => userTrackEnrollments.id).notNull(),
  sublevelId: integer("sublevel_id").references(() => trackSublevels.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Denormalized for faster queries
  
  // Progress metrics
  completedSessions: integer("completed_sessions").default(0),
  totalSessions: integer("total_sessions").notNull(),
  completedTasks: integer("completed_tasks").default(0),
  totalTasks: integer("total_tasks").notNull(),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0.00"),
  
  // Time tracking (aggregated from tasks)
  totalTimeSpentMinutes: integer("total_time_spent_minutes").default(0),
  listeningTimeSpent: integer("listening_time_spent").default(0),
  readingTimeSpent: integer("reading_time_spent").default(0),
  speakingTimeSpent: integer("speaking_time_spent").default(0),
  writingTimeSpent: integer("writing_time_spent").default(0),
  
  // Performance metrics (aggregated)
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).default("0.00"),
  bestScore: decimal("best_score", { precision: 5, scale: 2 }).default("0.00"),
  skillAverages: jsonb("skill_averages").$type<{listening: number, reading: number, speaking: number, writing: number}>(),
  
  // Status tracking
  status: text("status").default("not_started"), // not_started, in_progress, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Milestone tracking
  firstTaskCompletedAt: timestamp("first_task_completed_at"),
  lastTaskCompletedAt: timestamp("last_task_completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Track Assessment Rules - Exam and assessment configuration
export const trackAssessmentRules = pgTable("track_assessment_rules", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => learningTracks.id).notNull(),
  
  // Assessment configuration
  assessmentType: text("assessment_type").notNull(), // midterm, final, quiz, checkpoint
  triggerType: text("trigger_type").notNull(), // session_number, percentage_complete, time_based, manual
  triggerValue: text("trigger_value").notNull(), // "8", "50%", "4_weeks", etc.
  
  // Session targeting
  targetSessionNumbers: integer("target_session_numbers").array().default([]), // [8, 15] for exams at specific sessions
  sublevelIds: integer("sublevel_ids").array().default([]), // Specific sublevels to assess
  
  // Assessment configuration
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  duration: integer("duration").notNull(), // Duration in minutes
  passingScore: integer("passing_score").default(60),
  maxAttempts: integer("max_attempts").default(1),
  
  // Skills to assess
  skillsToAssess: text("skills_to_assess").array().notNull(), // [listening, reading, speaking, writing]
  skillWeights: jsonb("skill_weights").$type<{listening?: number, reading?: number, speaking?: number, writing?: number}>(), // Relative weights
  
  // Adaptive behavior
  isAdaptive: boolean("is_adaptive").default(false), // Whether assessment adapts to student level
  adaptationRules: jsonb("adaptation_rules").$type<{condition: string, action: string}[]>(),
  
  // Consequences and actions
  onPass: jsonb("on_pass").$type<{unlock_sublevels?: number[], award_credits?: number, certificate?: string}>(),
  onFail: jsonb("on_fail").$type<{retry_sessions?: number[], remedial_tasks?: number[], tutor_notification?: boolean}>(),
  
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Adaptation Profiles - AI personalization profiles for each enrollment
export const adaptationProfiles = pgTable("adaptation_profiles", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => userTrackEnrollments.id).notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(), // Denormalized for faster access
  
  // Learning style analysis
  learningStyle: text("learning_style"), // visual, auditory, kinesthetic, reading_writing
  preferredPace: text("preferred_pace").default("medium"), // slow, medium, fast
  attentionSpan: integer("attention_span").default(30), // Estimated attention span in minutes
  optimalSessionLength: integer("optimal_session_length").default(60), // Recommended session length
  
  // Skill analysis
  strongestSkill: text("strongest_skill"), // listening, reading, speaking, writing
  weakestSkill: text("weakest_skill"),
  skillGaps: jsonb("skill_gaps").$type<{skill: string, level: number, priority: number}[]>(), // Identified gaps
  skillPreferences: jsonb("skill_preferences").$type<{listening: number, reading: number, speaking: number, writing: number}>(), // 1-5 preference scale
  
  // Performance patterns
  averageAccuracy: decimal("average_accuracy", { precision: 5, scale: 2 }).default("0.00"),
  consistencyScore: decimal("consistency_score", { precision: 5, scale: 2 }).default("0.00"), // How consistent performance is
  improvementRate: decimal("improvement_rate", { precision: 5, scale: 2 }).default("0.00"), // Rate of improvement over time
  strugglingAreas: text("struggling_areas").array().default([]), // Areas where student struggles
  masteredConcepts: text("mastered_concepts").array().default([]), // Well-understood concepts
  
  // Behavioral patterns
  engagementLevel: text("engagement_level").default("medium"), // low, medium, high
  motivationFactors: text("motivation_factors").array().default([]), // What motivates the student
  commonMistakes: jsonb("common_mistakes").$type<{error: string, frequency: number, context: string}[]>(),
  responsePatterns: jsonb("response_patterns").$type<{pattern: string, frequency: number}>(),
  
  // Adaptive recommendations
  recommendedTaskTypes: text("recommended_task_types").array().default([]), // Task types that work well
  avoidTaskTypes: text("avoid_task_types").array().default([]), // Task types to avoid
  difficultyAdjustment: decimal("difficulty_adjustment", { precision: 3, scale: 2 }).default("0.00"), // -1.00 to +1.00 difficulty modifier
  
  // AI confidence and reliability
  profileConfidence: decimal("profile_confidence", { precision: 3, scale: 2 }).default("0.00"), // 0.00-1.00 AI confidence in profile
  lastAnalysis: timestamp("last_analysis").defaultNow(),
  analysisFrequency: integer("analysis_frequency").default(7), // Days between profile updates
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Adaptation Events - AI adaptation history and triggered changes
export const adaptationEvents = pgTable("adaptation_events", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => adaptationProfiles.id).notNull(),
  enrollmentId: integer("enrollment_id").references(() => userTrackEnrollments.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // Denormalized for faster queries
  
  // Event details
  eventType: text("event_type").notNull(), // task_adapted, difficulty_adjusted, sequence_modified, remedial_assigned, skip_recommended
  triggerReason: text("trigger_reason").notNull(), // performance_drop, mastery_detected, engagement_low, time_exceeded
  
  // Context and target
  targetType: text("target_type"), // task, session, sublevel, track
  targetId: integer("target_id"), // ID of the adapted target
  originalValue: jsonb("original_value"), // Original state before adaptation
  adaptedValue: jsonb("adapted_value"), // New state after adaptation
  
  // Change details
  changeDescription: text("change_description").notNull(),
  adaptationStrength: decimal("adaptation_strength", { precision: 3, scale: 2 }).default("1.00"), // How strong the adaptation was (0.1-2.0)
  expectedImpact: text("expected_impact"), // Expected impact on learning
  
  // Performance context (data that triggered the adaptation)
  triggerData: jsonb("trigger_data").$type<{scores?: number[], times?: number[], errors?: string[], performance_trend?: string}>(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.50"), // AI confidence in the adaptation decision
  
  // Results and effectiveness
  wasEffective: boolean("was_effective"), // Whether the adaptation was effective (evaluated later)
  effectivenessScore: decimal("effectiveness_score", { precision: 3, scale: 2 }), // 0.00-1.00 effectiveness rating
  studentFeedback: text("student_feedback"), // Optional student feedback on the adaptation
  
  // Timing
  implementedAt: timestamp("implemented_at").defaultNow(),
  evaluatedAt: timestamp("evaluated_at"), // When effectiveness was evaluated
  
  createdAt: timestamp("created_at").defaultNow()
});

// Task Generation Requests - One-button generation tracking with anti-plagiarism
export const taskGenerationRequests = pgTable("task_generation_requests", {
  id: serial("id").primaryKey(),
  requestedBy: integer("requested_by").references(() => users.id).notNull(),
  trackId: integer("track_id").references(() => learningTracks.id),
  sublevelId: integer("sublevel_id").references(() => trackSublevels.id),
  sessionId: integer("session_id").references(() => trackSessions.id),
  
  // Generation parameters
  generationType: text("generation_type").notNull(), // single_task, session_tasks, sublevel_content, assessment, variations
  taskType: text("task_type"), // reading_comprehension, listening_exercise, etc.
  skill: text("skill"), // listening, reading, speaking, writing
  difficultyLevel: integer("difficulty_level").default(3), // 1-5
  quantity: integer("quantity").default(1), // Number of tasks to generate
  
  // Content requirements
  topic: text("topic"), // Topic/theme for the tasks
  learningObjectives: text("learning_objectives").array().default([]),
  constraints: jsonb("constraints").$type<{max_time?: number, vocabulary_level?: string, grammar_focus?: string[]}>(),
  customPrompt: text("custom_prompt"), // Additional instructions
  
  // Anti-plagiarism and variation management
  variationGroupId: text("variation_group_id"), // Groups related variations together
  baseTaskId: integer("base_task_id").references(() => trackTasks.id), // If generating variations of existing task
  similarityThreshold: decimal("similarity_threshold", { precision: 3, scale: 2 }).default("0.70"), // Maximum similarity to existing content
  antiPlagChecks: text("anti_plag_checks").array().default([]), // Types of plagiarism checks to perform
  
  // Generation results
  status: text("status").default("pending"), // pending, processing, completed, failed, cancelled
  generatedTaskIds: integer("generated_task_ids").array().default([]), // IDs of generated tasks
  failureReason: text("failure_reason"), // Error details if generation failed
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }), // AI assessment of generated content quality
  
  // Processing metadata
  aiModel: text("ai_model"), // AI model used for generation
  promptTokens: integer("prompt_tokens"), // Tokens used in prompt
  completionTokens: integer("completion_tokens"), // Tokens in generated content
  processingTime: integer("processing_time"), // Time taken in seconds
  
  // Review and approval
  requiresReview: boolean("requires_review").default(true),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewStatus: text("review_status").default("pending"), // pending, approved, rejected, needs_revision
  reviewComments: text("review_comments"),
  reviewedAt: timestamp("reviewed_at"),
  
  requestedAt: timestamp("requested_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// BOOK E-COMMERCE SYSTEM SCHEMA
// ============================================================================

// Book categories with hierarchical structure
export const book_categories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parent_id: integer("parent_id").references(() => book_categories.id), // Self-reference for hierarchy
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Books table with pricing and availability
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  author: text("author").notNull(),
  isbn: text("isbn").unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price as decimal  
  category: text("category").notNull(), // Category as text field
  cover_image: text("cover_image"), // Cover image URL
  stock_quantity: integer("stock_quantity").default(0),
  publication_year: integer("publication_year"),
  created_at: timestamp("created_at").defaultNow()
});

// Book assets (additional files, images, etc.)
export const book_assets = pgTable("book_assets", {
  id: serial("id").primaryKey(),
  book_id: integer("book_id").references(() => books.id).notNull(),
  file_path: text("file_path").notNull(),
  file_type: text("file_type").notNull(), // pdf, image, audio, video, etc.
  file_size: integer("file_size"), // Size in bytes
  upload_date: timestamp("upload_date").defaultNow()
});

// Dictionary lookups for language learning
export const dictionary_lookups = pgTable("dictionary_lookups", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  word: text("word").notNull(),
  language: text("language").notNull().default("en"),
  definition: text("definition"),
  lookup_date: timestamp("lookup_date").defaultNow()
});

// Shopping carts
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Cart items
export const cart_items = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cart_id: integer("cart_id").references(() => carts.id).notNull(),
  book_id: integer("book_id").references(() => books.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  added_at: timestamp("added_at").defaultNow()
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  total_amount_minor: integer("total_amount_minor").notNull(), // Total in smallest currency unit
  currency_code: text("currency_code").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, cancelled, refunded
  created_at: timestamp("created_at").defaultNow()
});

// Order items
export const order_items = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id).notNull(),
  book_id: integer("book_id").references(() => books.id).notNull(),
  quantity: integer("quantity").notNull(),
  price_minor: integer("price_minor").notNull() // Price at time of purchase
});

// User addresses for shipping
export const user_addresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  full_name: text("full_name").notNull(),
  address_line1: text("address_line1").notNull(),
  address_line2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state"),
  postal_code: text("postal_code").notNull(),
  country: text("country").notNull().default("US"),
  phone: text("phone"),
  is_default: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Shipping orders
export const shipping_orders = pgTable("shipping_orders", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => orders.id).notNull(),
  address_id: integer("address_id").references(() => user_addresses.id).notNull(),
  courier_service: text("courier_service"), // ups, fedex, dhl, usps, etc.
  tracking_number: text("tracking_number"),
  status: text("status").notNull().default("pending"), // pending, shipped, in_transit, delivered, failed
  shipped_at: timestamp("shipped_at"),
  delivered_at: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Courier tracking updates
export const courier_tracking = pgTable("courier_tracking", {
  id: serial("id").primaryKey(),
  shipping_order_id: integer("shipping_order_id").references(() => shipping_orders.id).notNull(),
  status: text("status").notNull(),
  location: text("location"),
  update_date: timestamp("update_date").notNull(),
  notes: text("notes")
});

// ============================================================================
// UNIFIED SCHEMA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all unified track tables
export const insertLearningTrackSchema = createInsertSchema(learningTracks);
export const insertTrackSublevelSchema = createInsertSchema(trackSublevels);
export const insertTrackSessionSchema = createInsertSchema(trackSessions);
export const insertTrackTaskSchema = createInsertSchema(trackTasks);
export const insertUserTrackEnrollmentSchema = createInsertSchema(userTrackEnrollments);
export const insertUserTaskProgressSchema = createInsertSchema(userTaskProgress);
export const insertUserSublevelProgressSchema = createInsertSchema(userSublevelProgress);
export const insertTrackAssessmentRuleSchema = createInsertSchema(trackAssessmentRules);
export const insertAdaptationProfileSchema = createInsertSchema(adaptationProfiles);
export const insertAdaptationEventSchema = createInsertSchema(adaptationEvents);
export const insertTaskGenerationRequestSchema = createInsertSchema(taskGenerationRequests);

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
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  query: text("query").notNull(),
  searchType: text("search_type").default("universal"), // universal, books, courses, users, tests
  filters: jsonb("filters").$type<{
    categories?: string[];
    languages?: string[];
    levels?: string[];
    priceRange?: { min: number; max: number };
    dateRange?: { start: string; end: string };
    contentTypes?: string[];
  }>(),
  resultsCount: integer("results_count").default(0),
  clickedResultId: text("clicked_result_id"),
  clickedResultType: text("clicked_result_type"), // book, course, user, test, etc.
  sessionId: text("session_id"), // Track search sessions
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});

// Search Analytics - aggregate search data and metrics
export const searchAnalytics = pgTable("search_analytics", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  normalizedQuery: text("normalized_query").notNull(), // Lowercase, trimmed for grouping
  searchCount: integer("search_count").default(1),
  totalResults: integer("total_results").default(0),
  avgResultsCount: decimal("avg_results_count", { precision: 8, scale: 2 }).default("0.00"),
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 4 }).default("0.0000"), // CTR percentage
  noResultsCount: integer("no_results_count").default(0),
  popularResultTypes: text("popular_result_types").array().default([]), // Most clicked result types
  avgResponseTime: integer("avg_response_time").default(0), // Average response time in ms
  lastSearched: timestamp("last_searched").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trending Searches - track trending and suggested search terms
export const trendingSearches = pgTable("trending_searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull().unique(),
  category: text("category").default("general"), // general, books, courses, academic, etc.
  searchVolume: integer("search_volume").default(1),
  trendScore: decimal("trend_score", { precision: 8, scale: 2 }).default("0.00"), // Algorithm-calculated trend score
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }).default("0.00"), // Weekly growth rate %
  isPromoted: boolean("is_promoted").default(false), // Manually promoted searches
  language: text("language").default("en"), // en, fa, ar for multi-language support
  relatedTerms: text("related_terms").array().default([]), // Related search suggestions
  timeframe: text("timeframe").default("week"), // hour, day, week, month
  expiresAt: timestamp("expires_at"), // When trend data expires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Search Suggestions - AI-enhanced search suggestions and autocomplete
export const searchSuggestions = pgTable("search_suggestions", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  suggestion: text("suggestion").notNull(),
  suggestionType: text("suggestion_type").notNull(), // autocomplete, intent, semantic, related
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.50"), // AI confidence score
  usage_count: integer("usage_count").default(0),
  language: text("language").default("en"),
  contextTags: text("context_tags").array().default([]), // Context for better suggestions
  aiGenerated: boolean("ai_generated").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Search Index - cached search results for performance
export const searchIndex = pgTable("search_index", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // book, course, user, test, homework, etc.
  entityId: integer("entity_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"), // Full searchable content
  searchVector: text("search_vector"), // PostgreSQL tsvector for full-text search
  metadata: jsonb("metadata"), // Additional searchable metadata
  language: text("language").default("en"),
  category: text("category"),
  tags: text("tags").array().default([]),
  relevanceScore: decimal("relevance_score", { precision: 5, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  lastIndexed: timestamp("last_indexed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// BOOK E-COMMERCE SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all book e-commerce tables
export const insertBookCategorySchema = createInsertSchema(book_categories);
export const insertBookSchema = createInsertSchema(books);
export const insertBookAssetSchema = createInsertSchema(book_assets);
export const insertDictionaryLookupSchema = createInsertSchema(dictionary_lookups);
export const insertCartSchema = createInsertSchema(carts);
export const insertCartItemSchema = createInsertSchema(cart_items);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(order_items);
export const insertUserAddressSchema = createInsertSchema(user_addresses);
export const insertShippingOrderSchema = createInsertSchema(shipping_orders);
export const insertCourierTrackingSchema = createInsertSchema(courier_tracking);

// Type exports for all book e-commerce tables
export type BookCategory = typeof book_categories.$inferSelect;
export type BookCategoryInsert = z.infer<typeof insertBookCategorySchema>;
export type Book = typeof books.$inferSelect;
export type BookInsert = z.infer<typeof insertBookSchema>;
export type BookAsset = typeof book_assets.$inferSelect;
export type BookAssetInsert = z.infer<typeof insertBookAssetSchema>;
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
export const insertSearchHistorySchema = createInsertSchema(searchHistory);
export const insertSearchAnalyticsSchema = createInsertSchema(searchAnalytics);
export const insertTrendingSearchesSchema = createInsertSchema(trendingSearches);
export const insertSearchSuggestionsSchema = createInsertSchema(searchSuggestions);
export const insertSearchIndexSchema = createInsertSchema(searchIndex);

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
export const lexiConversations = pgTable("lexi_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  videoLessonId: integer("video_lesson_id"), // Reference to video lesson if applicable
  sessionType: text("session_type").notNull(), // "video_learning", "general_chat", "vocabulary", "grammar", "pronunciation"
  language: text("language").notNull().default("en"), // Conversation language
  contextData: jsonb("context_data"), // Video timestamp, lesson content, etc.
  title: text("title"), // Auto-generated or user-set conversation title
  status: text("status").notNull().default("active"), // active, completed, archived
  totalMessages: integer("total_messages").default(0),
  learningGoals: text("learning_goals").array().default([]), // What user wants to learn
  proficiencyLevel: text("proficiency_level"), // User's level for this conversation
  culturalContext: text("cultural_context"), // Cultural background for context-aware responses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at").defaultNow()
});

// Lexi messages - individual chat messages in conversations
export const lexiMessages = pgTable("lexi_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => lexiConversations.id).notNull(),
  role: text("role").notNull(), // "user", "assistant", "system"
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, audio, image, vocabulary_card, grammar_explanation, quiz
  metadata: jsonb("metadata"), // Audio transcription, pronunciation scores, etc.
  videoTimestamp: decimal("video_timestamp", { precision: 10, scale: 3 }), // Video time when message sent
  isBookmarked: boolean("is_bookmarked").default(false),
  reactions: text("reactions").array().default([]), // User reactions: helpful, confusing, etc.
  relatedConcepts: text("related_concepts").array().default([]), // Vocabulary, grammar concepts mentioned
  difficulty: text("difficulty"), // easy, medium, hard - for content personalization
  createdAt: timestamp("created_at").defaultNow()
});

// Video content analysis by Lexi - AI analysis of video content for context
export const lexiVideoAnalysis = pgTable("lexi_video_analysis", {
  id: serial("id").primaryKey(),
  videoLessonId: integer("video_lesson_id").notNull(), // Foreign key to video lessons
  courseId: integer("course_id").references(() => courses.id),
  analysisType: text("analysis_type").notNull(), // "content_summary", "vocabulary_extraction", "grammar_points", "cultural_context"
  language: text("language").notNull(),
  content: jsonb("content").notNull(), // Analysis results
  keyVocabulary: text("key_vocabulary").array().default([]), // Important words/phrases
  grammarConcepts: text("grammar_concepts").array().default([]), // Grammar topics covered
  culturalNotes: text("cultural_notes").array().default([]), // Cultural context
  difficultyLevel: text("difficulty_level"), // Auto-assessed difficulty
  topicTags: text("topic_tags").array().default([]), // Content categorization
  transcription: text("transcription"), // Auto-generated video transcript
  subtitles: jsonb("subtitles"), // Timestamped subtitles with translations
  analysisQuality: decimal("analysis_quality", { precision: 3, scale: 2 }), // 0.00-1.00 confidence score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User learning interactions with Lexi - tracks all learning activities
export const lexiLearningInteractions = pgTable("lexi_learning_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  conversationId: integer("conversation_id").references(() => lexiConversations.id),
  interactionType: text("interaction_type").notNull(), // "vocabulary_lookup", "grammar_question", "pronunciation_practice", "quiz_attempt", "explanation_request"
  content: text("content").notNull(), // The word, phrase, or concept
  context: text("context"), // Where this interaction happened (video timestamp, lesson context)
  userResponse: text("user_response"), // User's attempt or response
  lexiResponse: text("lexi_response"), // Lexi's explanation or feedback
  isCorrect: boolean("is_correct"), // For quiz/practice attempts
  difficulty: text("difficulty"), // easy, medium, hard
  timeSpent: integer("time_spent"), // Seconds spent on this interaction
  improvements: text("improvements").array().default([]), // Suggested improvements
  mastery_level: decimal("mastery_level", { precision: 3, scale: 2 }), // 0.00-1.00 estimated mastery
  createdAt: timestamp("created_at").defaultNow()
});

// Voice interactions with Lexi - specific to voice/pronunciation features
export const lexiVoiceInteractions = pgTable("lexi_voice_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  conversationId: integer("conversation_id").references(() => lexiConversations.id),
  audioUrl: text("audio_url"), // Stored user audio
  transcription: text("transcription"), // Speech-to-text result
  targetText: text("target_text"), // What user was trying to say
  pronunciation_score: decimal("pronunciation_score", { precision: 5, scale: 2 }), // 0.00-100.00
  fluency_score: decimal("fluency_score", { precision: 5, scale: 2 }), // 0.00-100.00
  accuracy_feedback: jsonb("accuracy_feedback"), // Detailed pronunciation feedback
  suggested_practice: text("suggested_practice").array().default([]), // Pronunciation tips
  language: text("language").notNull(),
  difficulty_level: text("difficulty_level"),
  duration: integer("duration"), // Audio duration in seconds
  retryCount: integer("retry_count").default(0), // How many times user retried
  isImproved: boolean("is_improved").default(false), // Did user improve on retry?
  createdAt: timestamp("created_at").defaultNow()
});

// Lexi personalized recommendations - AI-generated learning suggestions
export const lexiRecommendations = pgTable("lexi_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  recommendationType: text("recommendation_type").notNull(), // "next_lesson", "practice_activity", "vocabulary_review", "grammar_focus", "cultural_tip"
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: jsonb("content").notNull(), // Detailed recommendation data
  priority: integer("priority").default(50), // 1-100, higher = more important
  difficulty: text("difficulty"), // easy, medium, hard
  estimatedTime: integer("estimated_time"), // Minutes to complete
  relatedConcepts: text("related_concepts").array().default([]), // Connected learning topics
  prerequisites: text("prerequisites").array().default([]), // What user should know first
  targetSkills: text("target_skills").array().default([]), // Skills this will improve
  successMetrics: jsonb("success_metrics"), // How to measure success
  isCompleted: boolean("is_completed").default(false),
  userRating: integer("user_rating"), // 1-5 stars user feedback
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // Recommendations can expire
  createdAt: timestamp("created_at").defaultNow()
});

// Lexi learning analytics - aggregate learning data and insights
export const lexiLearningAnalytics = pgTable("lexi_learning_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  analyticsDate: date("analytics_date").notNull(), // Daily analytics snapshot
  totalInteractions: integer("total_interactions").default(0),
  conversationsStarted: integer("conversations_started").default(0),
  messagesExchanged: integer("messages_exchanged").default(0),
  vocabularyLearned: integer("vocabulary_learned").default(0),
  grammarConceptsExplored: integer("grammar_concepts_explored").default(0),
  pronunciationAttempts: integer("pronunciation_attempts").default(0),
  quizzesCompleted: integer("quizzes_completed").default(0),
  averagePronunciationScore: decimal("average_pronunciation_score", { precision: 5, scale: 2 }),
  averageResponseTime: decimal("average_response_time", { precision: 8, scale: 2 }), // Average seconds per interaction
  preferredLanguage: text("preferred_language"),
  mostActiveTimeSlot: text("most_active_time_slot"), // morning, afternoon, evening, night
  learningStreak: integer("learning_streak").default(0), // Consecutive days of activity
  masteryGrowth: decimal("mastery_growth", { precision: 5, scale: 2 }), // Overall learning progress
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }), // 0.00-100.00 engagement level
  strugglingAreas: text("struggling_areas").array().default([]), // Areas needing improvement
  strengths: text("strengths").array().default([]), // User's strong areas
  nextRecommendations: text("next_recommendations").array().default([]), // Auto-generated suggestions
  createdAt: timestamp("created_at").defaultNow()
});

// Quiz data generated by Lexi from video content
export const lexiQuizzes = pgTable("lexi_quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoLessonId: integer("video_lesson_id"), // Source video if quiz generated from video
  conversationId: integer("conversation_id").references(() => lexiConversations.id),
  title: text("title").notNull(),
  description: text("description"),
  quizType: text("quiz_type").notNull(), // "vocabulary", "grammar", "comprehension", "pronunciation", "cultural"
  language: text("language").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  questions: jsonb("questions").notNull(), // Array of quiz questions with answers
  timeLimit: integer("time_limit"), // Seconds, null for untimed
  maxAttempts: integer("max_attempts").default(3),
  passingScore: integer("passing_score").default(70), // Percentage needed to pass
  currentAttempts: integer("current_attempts").default(0),
  bestScore: integer("best_score"),
  isCompleted: boolean("is_completed").default(false),
  lastAttemptAt: timestamp("last_attempt_at"),
  totalTimeSpent: integer("total_time_spent").default(0), // Total seconds across all attempts
  createdAt: timestamp("created_at").defaultNow()
});

// User's quiz attempts and results
export const lexiQuizAttempts = pgTable("lexi_quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => lexiQuizzes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  answers: jsonb("answers").notNull(), // User's answers to all questions
  score: integer("score").notNull(), // Percentage score 0-100
  timeSpent: integer("time_spent"), // Seconds taken to complete
  isPassed: boolean("is_passed").notNull(),
  feedback: jsonb("feedback"), // Detailed feedback per question
  improvementAreas: text("improvement_areas").array().default([]), // What to work on
  strengths: text("strengths").array().default([]), // What user did well
  nextSteps: text("next_steps").array().default([]), // Recommended next actions
  createdAt: timestamp("created_at").defaultNow()
});

// ============================================================================
// IRANIAN/ARABIC CALENDAR AND THIRD-PARTY API INTEGRATION
// ============================================================================

// Third-party APIs management for centralized API integration
export const thirdPartyApis = pgTable("third_party_apis", {
  id: serial("id").primaryKey(),
  apiName: text("api_name").notNull().unique(), // keybit, kavenegar, sms_gateway, etc.
  displayName: text("display_name").notNull(), // User-friendly name
  description: text("description"), // API description
  baseUrl: text("base_url").notNull(), // API base URL
  apiKey: text("api_key"), // Encrypted API key
  apiSecret: text("api_secret"), // Encrypted API secret if needed
  isEnabled: boolean("is_enabled").default(true), // Can be disabled
  isHealthy: boolean("is_healthy").default(true), // Health status
  lastHealthCheck: timestamp("last_health_check"), // Last health check time
  healthCheckUrl: text("health_check_url"), // Endpoint for health checks
  rateLimit: integer("rate_limit"), // Requests per minute limit
  usageCount: integer("usage_count").default(0), // Total API calls made
  usageCountMonth: integer("usage_count_month").default(0), // Current month usage
  lastUsedAt: timestamp("last_used_at"), // Last API call timestamp
  errorCount: integer("error_count").default(0), // Total errors
  lastErrorAt: timestamp("last_error_at"), // Last error timestamp
  lastErrorMessage: text("last_error_message"), // Last error details
  configuration: jsonb("configuration"), // API-specific configuration
  testEndpoint: text("test_endpoint"), // Endpoint for testing connectivity
  costPerRequest: decimal("cost_per_request", { precision: 10, scale: 4 }), // Cost per API call
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }), // Monthly budget limit
  currentMonthlyCost: decimal("current_monthly_cost", { precision: 10, scale: 2 }).default("0.00"), // Current month cost
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Iranian calendar settings and preferences
export const iranianCalendarSettings = pgTable("iranian_calendar_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // null for global settings
  settingKey: text("setting_key").notNull(), // calendar_type, language_preference, etc.
  settingValue: text("setting_value").notNull(), // jalali, gregorian, auto, etc.
  isGlobal: boolean("is_global").default(false), // Global vs user-specific
  calendarType: text("calendar_type").default("auto"), // jalali, gregorian, auto
  languageBasedSwitching: boolean("language_based_switching").default(true), // Auto-switch based on language
  defaultLanguage: text("default_language").default("en"), // Default language for calendar
  persianWeekStart: text("persian_week_start").default("saturday"), // Week start day for Persian calendar
  showLunarCalendar: boolean("show_lunar_calendar").default(false), // Show Islamic lunar dates
  showEvents: boolean("show_events").default(true), // Show Iranian cultural events
  showHolidays: boolean("show_holidays").default(true), // Show Iranian holidays
  dateFormat: text("date_format").default("yyyy/mm/dd"), // Date display format
  timeFormat: text("time_format").default("24h"), // 12h or 24h
  timezone: text("timezone").default("Asia/Tehran"), // Default timezone
  notifications: jsonb("notifications"), // Notification settings for events/holidays
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Iranian/Persian calendar events and cultural occasions
export const calendarEventsIranian = pgTable("calendar_events_iranian", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull(), // Event name in English
  eventNamePersian: text("event_name_persian").notNull(), // Event name in Persian
  eventNameArabic: text("event_name_arabic"), // Event name in Arabic if applicable
  eventType: text("event_type").notNull(), // cultural, educational, national, religious, seasonal
  description: text("description"), // Event description
  descriptionPersian: text("description_persian"), // Description in Persian
  descriptionArabic: text("description_arabic"), // Description in Arabic
  persianDate: text("persian_date").notNull(), // Persian date (e.g., "1403/01/01")
  gregorianDate: date("gregorian_date"), // Corresponding Gregorian date
  isRecurring: boolean("is_recurring").default(true), // Annual recurring event
  duration: integer("duration").default(1), // Duration in days
  importance: text("importance").default("medium"), // low, medium, high, critical
  color: text("color").default("#3b82f6"), // Display color for calendar
  isPublicHoliday: boolean("is_public_holiday").default(false), // Official public holiday
  isEducationalEvent: boolean("is_educational_event").default(false), // Educational relevance
  relatedCourses: text("related_courses").array().default([]), // Related course types
  targetLanguages: text("target_languages").array().default(["fa", "ar"]), // Relevant languages
  celebrationTraditions: text("celebration_traditions").array().default([]), // How it's celebrated
  historicalSignificance: text("historical_significance"), // Historical context
  educationalContent: jsonb("educational_content"), // Learning materials
  isActive: boolean("is_active").default(true), // Can be disabled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Persian holiday calendar with detailed information
export const holidayCalendarPersian = pgTable("holiday_calendar_persian", {
  id: serial("id").primaryKey(),
  holidayName: text("holiday_name").notNull(), // Holiday name in English
  holidayNamePersian: text("holiday_name_persian").notNull(), // Holiday name in Persian
  holidayNameArabic: text("holiday_name_arabic"), // Holiday name in Arabic
  holidayType: text("holiday_type").notNull(), // national, religious, cultural, seasonal
  persianDate: text("persian_date").notNull(), // Persian date (e.g., "1403/01/01")
  gregorianDate: date("gregorian_date"), // Corresponding Gregorian date for current year
  isOfficialHoliday: boolean("is_official_holiday").default(true), // Government recognized
  isBankHoliday: boolean("is_bank_holiday").default(true), // Banks closed
  isSchoolHoliday: boolean("is_school_holiday").default(true), // Schools closed
  duration: integer("duration").default(1), // Duration in days
  significance: text("significance"), // Why this holiday is important
  traditions: text("traditions").array().default([]), // Traditional activities
  foods: text("foods").array().default([]), // Traditional foods
  greetings: text("greetings").array().default([]), // Traditional greetings
  symbols: text("symbols").array().default([]), // Associated symbols
  colors: text("colors").array().default([]), // Traditional colors
  historicalOrigin: text("historical_origin"), // Historical background
  modernObservance: text("modern_observance"), // How it's observed today
  regionalVariations: text("regional_variations").array().default([]), // Regional differences
  relatedHolidays: text("related_holidays").array().default([]), // Connected holidays
  educationalValue: text("educational_value"), // Learning opportunities
  businessImpact: text("business_impact"), // Impact on business operations
  travelConsiderations: text("travel_considerations"), // Travel impact
  isActive: boolean("is_active").default(true), // Can be disabled
  displayPriority: integer("display_priority").default(50), // Display order priority
  notificationDays: integer("notification_days").default(1), // Days before to notify
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// LEXI SCHEMA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for Lexi tables
export const insertLexiConversationSchema = createInsertSchema(lexiConversations);
export const insertLexiMessageSchema = createInsertSchema(lexiMessages);
export const insertLexiVideoAnalysisSchema = createInsertSchema(lexiVideoAnalysis);
export const insertLexiLearningInteractionSchema = createInsertSchema(lexiLearningInteractions);
export const insertLexiVoiceInteractionSchema = createInsertSchema(lexiVoiceInteractions);
export const insertLexiRecommendationSchema = createInsertSchema(lexiRecommendations);
export const insertLexiLearningAnalyticsSchema = createInsertSchema(lexiLearningAnalytics);
export const insertLexiQuizSchema = createInsertSchema(lexiQuizzes);
export const insertLexiQuizAttemptSchema = createInsertSchema(lexiQuizAttempts);

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
export const insertThirdPartyApiSchema = createInsertSchema(thirdPartyApis).omit(['id', 'createdAt', 'updatedAt']);
export const insertIranianCalendarSettingsSchema = createInsertSchema(iranianCalendarSettings).omit(['id', 'createdAt', 'updatedAt']);
export const insertCalendarEventsIranianSchema = createInsertSchema(calendarEventsIranian).omit(['id', 'createdAt', 'updatedAt']);
export const insertHolidayCalendarPersianSchema = createInsertSchema(holidayCalendarPersian).omit(['id', 'createdAt', 'updatedAt']);

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
// LINGUAQUEST FREE LEARNING SYSTEM SCHEMA
// ============================================================================

// LinguaQuest lesson difficulty and type constants
export const LINGUAQUEST_DIFFICULTY = {
  BEGINNER: "beginner",
  ELEMENTARY: "elementary", 
  INTERMEDIATE: "intermediate",
  UPPER_INTERMEDIATE: "upper_intermediate",
  ADVANCED: "advanced"
} as const;

export const LINGUAQUEST_LESSON_TYPE = {
  VOCABULARY: "vocabulary",
  GRAMMAR: "grammar", 
  CONVERSATION: "conversation",
  LISTENING: "listening",
  PRONUNCIATION: "pronunciation"
} as const;

export const LINGUAQUEST_SCENE_TYPE = {
  VOCABULARY_3D: "vocabulary_3d",
  GRAMMAR_BUILDER: "grammar_builder",
  CONVERSATION_ROOM: "conversation_room",
  PRONUNCIATION_LAB: "pronunciation_lab",
  LISTENING_ENVIRONMENT: "listening_environment"
} as const;

export type LinguaQuestDifficulty = typeof LINGUAQUEST_DIFFICULTY[keyof typeof LINGUAQUEST_DIFFICULTY];
export type LinguaQuestLessonType = typeof LINGUAQUEST_LESSON_TYPE[keyof typeof LINGUAQUEST_LESSON_TYPE];
export type LinguaQuestSceneType = typeof LINGUAQUEST_SCENE_TYPE[keyof typeof LINGUAQUEST_SCENE_TYPE];

// LinguaQuest 3D Interactive Lessons
export const linguaquestLessons = pgTable("linguaquest_lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  language: text("language").notNull(), // en, fa, ar, de, etc.
  difficulty: text("difficulty").notNull(), // beginner, elementary, intermediate, upper_intermediate, advanced
  lessonType: text("lesson_type").notNull(), // vocabulary, grammar, conversation, listening, pronunciation
  sceneType: text("scene_type").notNull(), // vocabulary_3d, grammar_builder, conversation_room, etc.
  
  // 3D Content references
  sceneData: jsonb("scene_data"), // 3D scene configuration, models, positions
  interactionConfig: jsonb("interaction_config"), // Touch controls, mobile gestures, interaction points
  
  // Lesson progression
  estimatedDurationMinutes: integer("estimated_duration_minutes").default(10),
  xpReward: integer("xp_reward").default(50),
  completionRequirements: jsonb("completion_requirements"), // Criteria for completion
  
  // Content
  vocabularyWords: text("vocabulary_words").array().default([]),
  grammarTopics: text("grammar_topics").array().default([]),
  exampleSentences: text("example_sentences").array().default([]),
  audioFiles: text("audio_files").array().default([]), // URLs to TTS-generated audio
  
  // Meta data
  tags: text("tags").array().default([]),
  prerequisites: integer("prerequisites").array().default([]), // Other lesson IDs required
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Guest Progress Tracking (Anonymous Users)
export const guestProgressTracking = pgTable("guest_progress_tracking", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(), // Anonymous session identifier
  fingerprintHash: text("fingerprint_hash"), // Device fingerprint for correlation
  
  // Progress data
  completedLessons: integer("completed_lessons").array().default([]), // Lesson IDs completed
  currentStreak: integer("current_streak").default(0),
  totalXp: integer("total_xp").default(0),
  currentLevel: integer("current_level").default(1),
  
  // Learning analytics
  strongSkills: text("strong_skills").array().default([]),
  weakSkills: text("weak_skills").array().default([]),
  preferredDifficulty: text("preferred_difficulty").default("beginner"),
  learningPath: text("learning_path").array().default([]), // Adaptive learning sequence
  
  // Session data
  totalStudyTimeMinutes: integer("total_study_time_minutes").default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  deviceInfo: jsonb("device_info"), // Browser, OS, screen size for mobile optimization
  
  // Conversion tracking
  hasSeenUpgradePrompt: boolean("has_seen_upgrade_prompt").default(false),
  upgradePromptCount: integer("upgrade_prompt_count").default(0),
  lastUpgradePromptAt: timestamp("last_upgrade_prompt_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Voice Exercises for Guest Users
export const voiceExercisesGuest = pgTable("voice_exercises_guest", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(), // Links to guest session
  lessonId: integer("lesson_id").references(() => linguaquestLessons.id),
  
  // Exercise content
  exerciseType: text("exercise_type").notNull(), // pronunciation, conversation, listening_repeat
  promptText: text("prompt_text").notNull(), // Text to be spoken
  targetLanguage: text("target_language").notNull(),
  difficultyLevel: text("difficulty_level").notNull(),
  
  // Voice data
  audioRecordingUrl: text("audio_recording_url"), // Guest's voice recording
  referenceTtsUrl: text("reference_tts_url"), // Perfect pronunciation reference
  pronunciationScore: integer("pronunciation_score"), // 0-100 accuracy score
  
  // Analysis results
  speechAnalysis: jsonb("speech_analysis"), // Pronunciation accuracy, timing, intonation
  feedback: text("feedback"), // AI-generated feedback
  suggestedImprovements: text("suggested_improvements").array().default([]),
  
  // Attempt tracking
  attemptNumber: integer("attempt_number").default(1),
  maxAttempts: integer("max_attempts").default(3),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow()
});

// 3D Lesson Content and Assets
export const threeDLessonContent = pgTable("3d_lesson_content", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => linguaquestLessons.id), // Optional for standalone 3D lessons
  
  // 3D Scene Configuration
  sceneConfig: jsonb("scene_config").notNull(), // Camera, lighting, environment setup
  models: jsonb("models").default([]), // 3D model assets, positions, animations
  materials: jsonb("materials").default([]), // Textures, shaders, material properties
  
  // Interactive Elements
  hotspots: jsonb("hotspots").default([]), // Clickable/touchable interaction points
  animations: jsonb("animations").default([]), // Scripted animations and transitions
  particleEffects: jsonb("particle_effects").default([]), // Visual effects for feedback
  
  // Mobile Optimization
  mobileOptimizations: jsonb("mobile_optimizations"), // LOD, simplified materials, touch controls
  lowPolyModels: jsonb("low_poly_models").default([]), // Performance-optimized 3D models
  
  // Audio Integration
  spatialAudio: jsonb("spatial_audio").default([]), // 3D audio positioning
  voiceoverTiming: jsonb("voiceover_timing").default([]), // Sync with TTS
  
  // Performance Settings  
  difficulty: text("difficulty").default("intermediate"), // beginner, elementary, intermediate, upper_intermediate, advanced
  renderQuality: text("render_quality").default("medium"), // low, medium, high
  targetFps: integer("target_fps").default(30),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 3D Video Lessons - Bridge between video courses and 3D lessons
export const threeDVideoLessons = pgTable("3d_video_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  videoLessonId: integer("video_lesson_id").references(() => videoLessons.id), // Optional: link to video lesson
  threeDContentId: integer("3d_content_id").references(() => threeDLessonContent.id).notNull(),
  
  // Lesson metadata
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  
  // Learning configuration
  language: varchar("language", { length: 10 }).notNull(),
  level: varchar("level", { length: 20 }).notNull(), // A1, A2, B1, B2, C1, C2
  skillFocus: varchar("skill_focus", { length: 50 }), // speaking, listening, vocabulary, grammar
  
  // Content organization
  moduleId: integer("module_id"), // for grouping lessons
  orderIndex: integer("order_index").notNull(),
  
  // Learning objectives
  vocabularyWords: text("vocabulary_words").array().default([]),
  grammarTopics: text("grammar_topics").array().default([]),
  learningObjectives: text("learning_objectives").array().default([]),
  
  // Assessment and progress
  estimatedDurationMinutes: integer("estimated_duration_minutes").default(15),
  xpReward: integer("xp_reward").default(100),
  maxAttempts: integer("max_attempts").default(3),
  passingScore: integer("passing_score").default(80), // percentage
  
  // Access and publishing
  isFree: boolean("is_free").default(false),
  isPublished: boolean("is_published").default(false),
  isInteractive: boolean("is_interactive").default(true),
  
  // Template and assets
  templateType: varchar("template_type", { length: 50 }), // vocabulary_scene, grammar_world, conversation_space
  assetUrls: jsonb("asset_urls").default([]), // 3D models, textures, audio files
  
  // Analytics
  viewCount: integer("view_count").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0"),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).default("0"),
  
  // Authoring
  createdBy: integer("created_by").references(() => users.id).notNull(),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 3D Lesson Progress Tracking
export const threeDLessonProgress = pgTable("3d_lesson_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  threeDLessonId: integer("3d_lesson_id").references(() => threeDVideoLessons.id).notNull(),
  
  // Progress tracking
  interactionsCompleted: jsonb("interactions_completed").default([]), // Array of completed hotspot IDs
  currentScore: integer("current_score").default(0),
  totalInteractions: integer("total_interactions").default(0),
  completedInteractions: integer("completed_interactions").default(0),
  
  // Engagement metrics
  timeSpent: integer("time_spent").default(0), // seconds
  attemptsCount: integer("attempts_count").default(0),
  hintsUsed: integer("hints_used").default(0),
  
  // Learning analytics
  errorCount: integer("error_count").default(0),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }).default("0"),
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default("0"),
  
  // Status
  completed: boolean("completed").default(false),
  passed: boolean("passed").default(false),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastInteractionAt: timestamp("last_interaction_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Freemium Conversion Tracking
export const freemiumConversionTracking = pgTable("freemium_conversion_tracking", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token"), // Guest session token
  userId: integer("user_id").references(() => users.id), // If user converts/registers
  
  // Conversion funnel stages
  funnelStage: text("funnel_stage").notNull(), // discovery, engagement, consideration, trial, conversion
  conversionEvent: text("conversion_event").notNull(), // lesson_completed, upgrade_viewed, signup_clicked, payment_completed
  eventData: jsonb("event_data"), // Additional context about the event
  
  // User journey tracking
  lessonsCompletedBeforePrompt: integer("lessons_completed_before_prompt").default(0),
  totalSessionTimeMinutes: integer("total_session_time_minutes").default(0),
  deviceType: text("device_type"), // mobile, tablet, desktop
  trafficSource: text("traffic_source"), // organic, social, paid, referral
  
  // Conversion details
  upgradePromptType: text("upgrade_prompt_type"), // completion_modal, progress_barrier, feature_preview
  upgradePromptPosition: text("upgrade_prompt_position"), // lesson_end, mid_session, navigation
  conversionDecision: text("conversion_decision"), // converted, dismissed, postponed
  
  // A/B Testing
  testVariant: text("test_variant"), // A, B, control - for conversion optimization
  cohort: text("cohort"), // User group for analytics
  
  // Revenue tracking
  planSelected: text("plan_selected"), // If converted, which Meta Lingua plan
  revenueGenerated: integer("revenue_generated").default(0), // IRR value
  
  createdAt: timestamp("created_at").defaultNow()
});

// Visitor Achievements (Gamification for Guests)
export const visitorAchievements = pgTable("visitor_achievements", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(), // Guest session identifier
  
  // Achievement details
  achievementType: text("achievement_type").notNull(), // first_lesson, streak_3, vocabulary_master, etc.
  achievementTitle: text("achievement_title").notNull(),
  achievementDescription: text("achievement_description").notNull(),
  iconUrl: text("icon_url"),
  badgeColor: text("badge_color").default("#gold"),
  
  // Progress tracking
  progress: integer("progress").default(0), // Current progress towards achievement
  targetValue: integer("target_value").notNull(), // Target value to unlock achievement
  isUnlocked: boolean("is_unlocked").default(false),
  
  // Gamification
  xpReward: integer("xp_reward").default(100),
  category: text("category"), // learning, social, engagement, mastery
  difficulty: text("difficulty").default("easy"), // easy, medium, hard, legendary
  
  // Motivation
  motivationalMessage: text("motivational_message"),
  nextAchievement: text("next_achievement"), // Suggests next achievement to work towards
  
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// ============================================================================
// PHASE 3: ENHANCED ANALYTICS TABLES
// ============================================================================

// AI-powered learning problem detection
export const learningProblems = pgTable("learning_problems", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Problem classification
  type: text("type").notNull(), // skill_weakness, engagement_drop, difficulty_spike, learning_plateau, attendance_pattern, homework_struggle
  severity: text("severity").notNull(), // low, medium, high, critical
  status: text("status").default("active"), // active, resolved, ignored
  
  // Problem details
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedSkills: text("affected_skills").array(), // JSON array of skill names
  
  // AI confidence and evidence
  confidence: integer("confidence").notNull(), // 0-100
  evidence: text("evidence").array(), // JSON array of evidence strings
  
  // Impact assessment
  estimatedImpact: text("estimated_impact"),
  urgencyScore: integer("urgency_score").default(50), // 0-100
  
  // Resolution tracking
  recommendationsGenerated: boolean("recommendations_generated").default(false),
  teacherNotified: boolean("teacher_notified").default(false),
  studentNotified: boolean("student_notified").default(false),
  resolvedAt: timestamp("resolved_at"),
  
  // Metadata
  autoGenerated: boolean("auto_generated").default(true),
  detectedAt: timestamp("detected_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Learning recommendations generated by AI
export const learningRecommendations = pgTable("learning_recommendations", {
  id: serial("id").primaryKey(),
  problemId: integer("problem_id").references(() => learningProblems.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Recommendation details
  type: text("type").notNull(), // study_plan, resource, skill_focus, schedule_change, teaching_method, practice_activity
  priority: text("priority").notNull(), // low, medium, high
  
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionSteps: text("action_steps").array(), // JSON array of steps
  
  // Timeline and expectations
  estimatedTimeWeeks: integer("estimated_time_weeks"),
  expectedOutcome: text("expected_outcome"),
  resourceLinks: text("resource_links").array(), // JSON array of URLs
  
  // Implementation tracking
  status: text("status").default("pending"), // pending, in_progress, completed, dismissed
  implementedAt: timestamp("implemented_at"),
  completedAt: timestamp("completed_at"),
  
  // Effectiveness tracking
  effectivenessRating: integer("effectiveness_rating"), // 1-5 rating after completion
  actualOutcome: text("actual_outcome"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Cross-skill performance correlations
export const skillCorrelations = pgTable("skill_correlations", {
  id: serial("id").primaryKey(),
  
  // Skill pair
  skill1: text("skill_1").notNull(),
  skill2: text("skill_2").notNull(),
  
  // Correlation analysis
  correlationStrength: decimal("correlation_strength", { precision: 5, scale: 4 }).notNull(), // -1 to 1
  correlationType: text("correlation_type").notNull(), // positive, negative, neutral
  significance: integer("significance").notNull(), // 0-100
  
  // Sample data
  studentCount: integer("student_count").notNull(),
  averageImpact: decimal("average_impact", { precision: 5, scale: 2 }).notNull(),
  
  // Analysis metadata
  analysisDate: timestamp("analysis_date").defaultNow(),
  dataTimeframe: text("data_timeframe"), // e.g., "last_90_days"
  
  createdAt: timestamp("created_at").defaultNow()
});

// Individual student performance patterns
export const performancePatterns = pgTable("performance_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Pattern analysis
  skill: text("skill").notNull(),
  patternType: text("pattern_type").notNull(), // improving, declining, stable, volatile, plateaued
  trendDirection: decimal("trend_direction", { precision: 5, scale: 4 }).notNull(), // -1 to 1
  volatility: decimal("volatility", { precision: 5, scale: 4 }).notNull(), // 0-1
  
  // Prediction
  predictionConfidence: integer("prediction_confidence").notNull(), // 0-100
  futureOutlook: text("future_outlook").notNull(), // positive, negative, neutral
  
  // Timeline
  analysisStartDate: timestamp("analysis_start_date").notNull(),
  analysisEndDate: timestamp("analysis_end_date").notNull(),
  lastChangeDetected: timestamp("last_change_detected"),
  
  // Pattern details
  dataPoints: integer("data_points").notNull(),
  patternMetadata: text("pattern_metadata"), // JSON metadata about the pattern
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Learning analytics insights cache (for performance)
export const analyticsInsights = pgTable("analytics_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  
  // Insight categorization
  insightType: text("insight_type").notNull(), // strength, weakness, opportunity, trend, prediction
  category: text("category").notNull(), // performance, engagement, skills, progress
  
  // Insight content
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionable: boolean("actionable").default(true),
  
  // Insight data
  confidence: integer("confidence").notNull(), // 0-100
  impact: text("impact").notNull(), // low, medium, high
  timeframe: text("timeframe"), // when this insight is relevant
  
  // Supporting data
  supportingData: text("supporting_data"), // JSON data supporting the insight
  visualizationType: text("visualization_type"), // chart, graph, table, etc.
  
  // Lifecycle
  validUntil: timestamp("valid_until"),
  dismissedAt: timestamp("dismissed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// LINGUAQUEST INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for LinguaQuest tables
export const insertLinguaquestLessonSchema = createInsertSchema(linguaquestLessons).omit(['id', 'createdAt', 'updatedAt']);
export const insertGuestProgressTrackingSchema = createInsertSchema(guestProgressTracking).omit(['id', 'createdAt', 'updatedAt']);
export const insertVoiceExercisesGuestSchema = createInsertSchema(voiceExercisesGuest).omit(['id', 'createdAt']);
export const insertThreeDLessonContentSchema = createInsertSchema(threeDLessonContent).omit(['id', 'createdAt', 'updatedAt']);
export const insertThreeDVideoLessonSchema = createInsertSchema(threeDVideoLessons).omit(['id', 'createdAt', 'updatedAt']);
export const insertThreeDLessonProgressSchema = createInsertSchema(threeDLessonProgress).omit(['id', 'createdAt', 'updatedAt']);
export const insertFreemiumConversionTrackingSchema = createInsertSchema(freemiumConversionTracking).omit(['id', 'createdAt']);
export const insertVisitorAchievementSchema = createInsertSchema(visitorAchievements).omit(['id', 'createdAt', 'unlockedAt']);

// Insert schemas for Enhanced Analytics tables
export const insertLearningProblemSchema = createInsertSchema(learningProblems).omit(['id', 'createdAt', 'updatedAt']);
export const insertLearningRecommendationSchema = createInsertSchema(learningRecommendations).omit(['id', 'createdAt', 'updatedAt']);
export const insertSkillCorrelationSchema = createInsertSchema(skillCorrelations).omit(['id', 'createdAt']);
export const insertPerformancePatternSchema = createInsertSchema(performancePatterns).omit(['id', 'createdAt', 'updatedAt']);
export const insertAnalyticsInsightSchema = createInsertSchema(analyticsInsights).omit(['id', 'createdAt', 'updatedAt']);

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
export const packagesUnifiedView = {
  id: serial("id").primaryKey(),
  packageType: text("package_type").notNull(), // 'session' | 'callern'
  packageName: text("package_name").notNull(),
  studentId: integer("student_id"), // null for callern packages (template)
  totalUnits: integer("total_units").notNull(), // sessions or hours
  unitType: text("unit_type").notNull(), // 'sessions' | 'hours'
  unitDuration: integer("unit_duration"), // minutes per session (for session packages)
  usedUnits: integer("used_units").default(0),
  remainingUnits: integer("remaining_units"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default('active'), // active, completed, expired
  description: text("description"),
  packageTypeCategory: text("package_type_category"), // e.g., 'ielts_speaking', 'general_conversation'
  targetLevel: text("target_level"),
  isActive: boolean("is_active").default(true),
  purchasedAt: timestamp("purchased_at"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
} as const;

// ============================================================================
// SMS TEMPLATE MANAGEMENT SYSTEM TABLES
// ============================================================================

// SMS template categories for organizing templates
export const smsTemplateCategories = pgTable("sms_template_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "trial_reminders", "follow_ups", "promotional_offers", "confirmations", "notifications", "general"
  displayName: text("display_name").notNull(), // "Trial Reminders", "Follow-ups", etc.
  description: text("description"),
  icon: text("icon"), // Icon name for UI display
  color: text("color"), // Color code for UI theming
  sortOrder: integer("sort_order").default(0), // For custom ordering
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// SMS template variables for personalization
export const smsTemplateVariables = pgTable("sms_template_variables", {
  id: serial("id").primaryKey(),
  variableName: text("variable_name").notNull().unique(), // e.g., "firstName", "lastName", "trialDate"
  displayName: text("display_name").notNull(), // e.g., "First Name", "Trial Date"
  description: text("description"), // Description of what this variable represents
  category: text("category").notNull(), // "student", "institute", "course", "staff", "datetime", "custom"
  dataType: text("data_type").notNull(), // "text", "date", "time", "number", "boolean"
  defaultValue: text("default_value"), // Default value if data not available
  isRequired: boolean("is_required").default(false), // Whether this variable must have a value
  validationRegex: text("validation_regex"), // Regex for validating variable values
  examples: text("examples").array().default([]), // Example values for this variable
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Main SMS templates table
export const smsTemplates = pgTable("sms_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Template name
  description: text("description"), // Template description
  categoryId: integer("category_id").references(() => smsTemplateCategories.id).notNull(),
  
  // Template content
  content: text("content").notNull(), // SMS message content with variables
  subject: text("subject"), // Optional subject/title for organization
  
  // Template metadata
  status: text("status").notNull().default("draft"), // "draft", "active", "archived"
  language: text("language").default("fa"), // "fa", "en" for Persian/English
  characterCount: integer("character_count"), // Auto-calculated character count
  estimatedSmsCount: integer("estimated_sms_count").default(1), // How many SMS parts this will be
  
  // Variables used in this template
  variablesUsed: text("variables_used").array().default([]), // Array of variable names used
  
  // Usage and performance tracking
  usageCount: integer("usage_count").default(0), // How many times this template has been used
  successfulSends: integer("successful_sends").default(0), // Successful deliveries
  failedSends: integer("failed_sends").default(0), // Failed deliveries
  lastUsedAt: timestamp("last_used_at"), // When this template was last used
  
  // Template settings
  isFavorite: boolean("is_favorite").default(false), // For quick access
  isSystem: boolean("is_system").default(false), // System templates can't be deleted
  allowBulkSend: boolean("allow_bulk_send").default(true), // Allow bulk sending
  requiresApproval: boolean("requires_approval").default(false), // Needs approval before sending
  
  // Version tracking
  version: integer("version").default(1), // Template version number
  parentTemplateId: integer("parent_template_id").references(() => smsTemplates.id), // For template duplicates/versions
  
  // Audit fields
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// SMS template sending logs for tracking all SMS sends
export const smsTemplateSendingLogs = pgTable("sms_template_sending_logs", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => smsTemplates.id).notNull(),
  
  // Sender information
  sentBy: integer("sent_by").references(() => users.id).notNull(), // Front desk clerk who sent
  sentFrom: text("sent_from").default("frontdesk"), // "frontdesk", "callcenter", "system"
  
  // Recipient information
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  recipientUserId: integer("recipient_user_id").references(() => users.id), // If recipient is a registered user
  
  // Message details
  finalMessage: text("final_message").notNull(), // Message after variable substitution
  variableData: jsonb("variable_data"), // The actual variable values used
  characterCount: integer("character_count").notNull(),
  smsPartsCount: integer("sms_parts_count").default(1),
  
  // Sending details
  sendingType: text("sending_type").notNull(), // "individual", "bulk", "test", "scheduled"
  scheduledFor: timestamp("scheduled_for"), // For scheduled messages
  sentAt: timestamp("sent_at").defaultNow(),
  
  // Kavenegar response data
  kavenegarMessageId: text("kavenegar_message_id"), // Kavenegar's message ID
  kavenegarStatus: text("kavenegar_status"), // Status from Kavenegar
  kavenegarCost: decimal("kavenegar_cost", { precision: 10, scale: 2 }), // Cost in IRR
  
  // Delivery tracking
  deliveryStatus: text("delivery_status").default("sent"), // "sent", "delivered", "failed", "unknown"
  deliveryTimestamp: timestamp("delivery_timestamp"),
  failureReason: text("failure_reason"), // If delivery failed
  
  // Campaign/context information
  campaignId: text("campaign_id"), // For bulk campaigns
  contextType: text("context_type"), // "walk_in", "phone_call", "manual", "automated"
  contextId: integer("context_id"), // ID of related record (operation, call, etc.)
  
  // Analytics and feedback
  wasOpened: boolean("was_opened").default(false), // If we can track opens
  clickedLinks: text("clicked_links").array().default([]), // If message contained links
  responseReceived: boolean("response_received").default(false), // If customer responded
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// SMS template analytics for performance tracking
export const smsTemplateAnalytics = pgTable("sms_template_analytics", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => smsTemplates.id).notNull(),
  
  // Time period for analytics
  periodType: text("period_type").notNull(), // "daily", "weekly", "monthly"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Usage statistics
  totalSends: integer("total_sends").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  failedDeliveries: integer("failed_deliveries").default(0),
  deliveryRate: decimal("delivery_rate", { precision: 5, scale: 2 }).default(0), // Percentage
  
  // Cost analysis
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default(0), // Total cost in IRR
  averageCostPerSms: decimal("average_cost_per_sms", { precision: 10, scale: 2 }).default(0),
  
  // Performance metrics
  averageDeliveryTime: integer("average_delivery_time"), // Seconds
  peakUsageHour: integer("peak_usage_hour"), // Hour of day (0-23) with most usage
  
  // Response tracking
  totalResponses: integer("total_responses").default(0), // Customer responses received
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default(0), // Percentage
  
  // Conversion tracking (for promotional messages)
  conversions: integer("conversions").default(0), // Actions taken after SMS
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default(0), // Percentage
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }).default(0), // Value in IRR
  
  // Usage context breakdown
  frontdeskUsage: integer("frontdesk_usage").default(0),
  callcenterUsage: integer("callcenter_usage").default(0),
  automatedUsage: integer("automated_usage").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// SMS template favorites for quick access
export const smsTemplateFavorites = pgTable("sms_template_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => smsTemplates.id).notNull(),
  sortOrder: integer("sort_order").default(0), // For custom ordering
  createdAt: timestamp("created_at").defaultNow()
});

// ============================================================================
// FRONT DESK CLERK TABLES FOR WALK-IN MANAGEMENT
// ============================================================================

// Front desk operations table for tracking walk-in inquiries and visits
export const frontDeskOperations = pgTable("front_desk_operations", {
  id: serial("id").primaryKey(),
  
  // Visitor information
  visitorName: text("visitor_name").notNull(),
  visitorPhone: text("visitor_phone"),
  visitorEmail: text("visitor_email"),
  
  // Visit details
  visitType: text("visit_type").notNull(), // "inquiry", "trial_lesson", "registration", "complaint", "consultation", "payment"
  visitPurpose: text("visit_purpose").notNull(), // Detailed description of purpose
  inquiryType: text("inquiry_type"), // "course_info", "pricing", "schedule", "teacher_info", "level_assessment"
  
  // Language learning interests
  interestedLanguage: text("interested_language"),
  currentLevel: text("current_level"),
  preferredSchedule: text("preferred_schedule"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  
  // Front desk clerk handling this
  handledBy: integer("handled_by").references(() => users.id).notNull(),
  
  // Status and workflow
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "follow_up_needed", "converted", "closed"
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"
  
  // Follow-up information
  needsFollowUp: boolean("needs_follow_up").default(false),
  followUpDate: timestamp("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  
  // Conversion tracking
  convertedToLead: boolean("converted_to_lead").default(false),
  leadId: integer("lead_id").references(() => leads.id),
  convertedToStudent: boolean("converted_to_student").default(false),
  studentId: integer("student_id").references(() => users.id),
  
  // Additional information
  notes: text("notes"),
  tags: text("tags").array().default([]), // Tags for categorization
  documents: text("documents").array().default([]), // Uploaded document references
  
  // Comprehensive intake form data (JSONB for detailed form responses)
  intakeFormData: jsonb("intake_form_data").$type<{
    // Contact Information
    middleName?: string;
    secondaryPhone?: string;
    preferredContactMethod?: 'phone' | 'email' | 'sms';
    
    // Language Learning Details
    targetLanguages?: string[];
    proficiencyLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'beginner' | 'intermediate' | 'advanced';
    learningGoals?: ('conversation' | 'business' | 'academic' | 'exam_prep' | 'travel' | 'other')[];
    previousExperience?: string;
    urgencyLevel?: 'immediate' | 'within_month' | 'flexible';
    
    // Schedule Preferences
    preferredDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    preferredTimeSlots?: ('morning' | 'afternoon' | 'evening')[];
    frequencyPreference?: '1x_week' | '2x_week' | '3x_week' | 'flexible';
    classTypePreference?: 'group' | 'private' | 'both';
    budgetRange?: string;
    
    // Additional Information
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    howHeardAbout?: string;
    specialRequirements?: string;
    accessibilityNeeds?: string;
    clerkObservations?: string;
  }>(),
  
  // Timestamps
  visitedAt: timestamp("visited_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Phone call logs table for tracking all phone communications
export const phoneCallLogs = pgTable("phone_call_logs", {
  id: serial("id").primaryKey(),
  
  // Call details
  callerName: text("caller_name").notNull(),
  callerPhone: text("caller_phone").notNull(),
  callerEmail: text("caller_email"),
  
  // Call information
  callType: text("call_type").notNull(), // "incoming", "outgoing", "missed"
  callPurpose: text("call_purpose").notNull(), // "inquiry", "follow_up", "appointment", "complaint", "support", "sales"
  
  // Language and course interest
  inquiryType: text("inquiry_type"), // "course_info", "pricing", "schedule", "teacher_info", "level_assessment"
  interestedLanguage: text("interested_language"),
  currentLevel: text("current_level"),
  
  // Call handling
  handledBy: integer("handled_by").references(() => users.id).notNull(),
  callDuration: integer("call_duration"), // Duration in seconds
  
  // Call outcome
  callResult: text("call_result").notNull(), // "information_provided", "appointment_scheduled", "follow_up_needed", "not_interested", "converted"
  appointmentScheduled: boolean("appointment_scheduled").default(false),
  appointmentDate: timestamp("appointment_date"),
  
  // Follow-up tracking
  needsFollowUp: boolean("needs_follow_up").default(false),
  followUpDate: timestamp("follow_up_date"),
  followUpMethod: text("follow_up_method"), // "call", "email", "sms", "whatsapp"
  
  // Conversion tracking
  convertedToLead: boolean("converted_to_lead").default(false),
  leadId: integer("lead_id").references(() => leads.id),
  convertedToWalkIn: boolean("converted_to_walk_in").default(false),
  walkInId: integer("walk_in_id").references(() => frontDeskOperations.id),
  
  // Call timing (enhanced)
  callStartTime: timestamp("call_start_time"),
  callEndTime: timestamp("call_end_time"),
  
  // Call notes and additional details
  callNotes: text("call_notes"),
  actionItems: text("action_items"), // Commitments made during call
  nextSteps: text("next_steps"), // Recommended actions
  urgencyLevel: text("urgency_level").default("medium"), // "low", "medium", "high", "urgent"
  customerSatisfaction: integer("customer_satisfaction"), // 1-5 customer mood/satisfaction
  tags: text("tags").array().default([]),
  callRating: integer("call_rating"), // 1-5 quality rating for the call handling
  
  // Student link for existing customers
  studentId: integer("student_id").references(() => users.id),
  
  // Timestamps
  callTime: timestamp("call_time").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Front desk tasks table for follow-up and task management
export const frontDeskTasks = pgTable("front_desk_tasks", {
  id: serial("id").primaryKey(),
  
  // Task details
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // "follow_up_call", "follow_up_email", "schedule_appointment", "send_brochure", "level_test", "trial_lesson", "documentation"
  
  // Task assignment
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  
  // Task priority and status
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled", "overdue"
  
  // Related records
  relatedWalkIn: integer("related_walk_in").references(() => frontDeskOperations.id),
  relatedCall: integer("related_call").references(() => phoneCallLogs.id),
  relatedLead: integer("related_lead").references(() => leads.id),
  relatedStudent: integer("related_student").references(() => users.id),
  
  // Contact information (for tasks involving external contact)
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  
  // Task scheduling
  dueDate: timestamp("due_date"),
  scheduledTime: timestamp("scheduled_time"),
  estimatedDuration: integer("estimated_duration"), // Duration in minutes
  
  // Task completion
  completedAt: timestamp("completed_at"),
  completionNotes: text("completion_notes"),
  taskResult: text("task_result"), // "successful", "unsuccessful", "rescheduled", "no_response"
  
  // Follow-up generation
  generatedFollowUp: boolean("generated_follow_up").default(false),
  followUpTaskId: integer("follow_up_task_id").references(() => frontDeskTasks.id),
  
  // Additional information
  notes: text("notes"),
  tags: text("tags").array().default([]),
  attachments: text("attachments").array().default([]), // File references
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Type definitions for unified packages view
export type UnifiedPackage = {
  id: number;
  packageType: 'session' | 'callern';
  packageName: string;
  studentId?: number;
  totalUnits: number;
  unitType: 'sessions' | 'hours';
  unitDuration?: number;
  usedUnits: number;
  remainingUnits: number;
  price: string;
  status: string;
  description?: string;
  packageTypeCategory?: string;
  targetLevel?: string;
  isActive: boolean;
  purchasedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Compatibility View Definitions (To be created as database views during migration)
// These ensure zero downtime during the consolidation transition

export const compatibilityViews = {
  // User data compatibility view - provides legacy user fields from user_profiles
  users_with_profile_data: `
    CREATE OR REPLACE VIEW users_with_profile_data AS
    SELECT 
      u.*,
      up.national_id,
      up.birthday,
      up.guardian_name,
      up.guardian_phone,
      up.notes,
      up.native_language,
      up.target_languages,
      up.current_proficiency,
      up.current_level
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id;
  `,

  // Legacy user fields compatibility view
  users_legacy_compat: `
    CREATE OR REPLACE VIEW users_legacy_compat AS
    SELECT 
      u.id,
      u.email,
      u.password,
      u.first_name,
      u.last_name,
      u.role,
      u.phone_number,
      COALESCE(up.national_id, '') as national_id,
      up.birthday,
      u.gender,
      COALESCE(up.guardian_name, '') as guardian_name,
      COALESCE(up.guardian_phone, '') as guardian_phone,
      COALESCE(up.notes, '') as notes,
      u.profile_image,
      COALESCE(up.current_level, u.status) as level,
      u.status,
      u.avatar,
      u.is_active,
      u.is_available_to_socialize,
      u.socializer_level,
      u.socializer_skills,
      u.preferences,
      u.wallet_balance,
      u.total_credits,
      u.member_tier,
      u.streak_days,
      u.total_lessons,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id;
  `,

  // Teacher availability compatibility view - emulates legacy table from periods
  teacher_availability_compat: `
    CREATE OR REPLACE VIEW teacher_availability_compat AS
    SELECT 
      tap.id,
      tap.teacher_id,
      tap.day_of_week,
      CASE 
        WHEN tap.time_division = 'morning' THEN '08:00'::time
        WHEN tap.time_division = 'afternoon' THEN '14:00'::time  
        WHEN tap.time_division = 'evening' THEN '18:00'::time
        ELSE '08:00'::time
      END as start_time,
      CASE 
        WHEN tap.time_division = 'morning' THEN '12:00'::time
        WHEN tap.time_division = 'afternoon' THEN '18:00'::time
        WHEN tap.time_division = 'evening' THEN '22:00'::time
        ELSE '22:00'::time
      END as end_time,
      tap.is_active,
      tap.created_at,
      tap.updated_at
    FROM teacher_availability_periods tap
    WHERE tap.is_active = true
      AND tap.period_start_date <= CURRENT_DATE
      AND tap.period_end_date >= CURRENT_DATE;
  `,

  // Unified packages view - combines session and callern packages
  packages_unified: `
    CREATE OR REPLACE VIEW packages_unified AS
    SELECT 
      sp.id,
      'session'::text as package_type,
      sp.package_name,
      sp.student_id,
      sp.total_sessions as total_units,
      'sessions'::text as unit_type,
      sp.session_duration as unit_duration,
      sp.used_sessions as used_units,
      sp.remaining_sessions as remaining_units,
      sp.price,
      sp.status,
      NULL::text as description,
      NULL::text as package_type_category,
      NULL::text as target_level,
      CASE WHEN sp.status = 'active' THEN true ELSE false END as is_active,
      sp.purchased_at,
      sp.expires_at,
      sp.notes,
      sp.created_at,
      sp.updated_at
    FROM session_packages sp
    
    UNION ALL
    
    SELECT 
      cp.id,
      'callern'::text as package_type,
      cp.package_name,
      NULL::integer as student_id,
      cp.total_hours as total_units,
      'hours'::text as unit_type,
      NULL::integer as unit_duration,
      0 as used_units,
      cp.total_hours as remaining_units,
      cp.price,
      CASE WHEN cp.is_active THEN 'active'::varchar ELSE 'inactive'::varchar END as status,
      cp.description,
      cp.package_type as package_type_category,
      cp.target_level,
      cp.is_active,
      NULL::timestamp as purchased_at,
      NULL::timestamp as expires_at,
      NULL::text as notes,
      cp.created_at,
      cp.updated_at
    FROM callern_packages cp;
  `
} as const;

// Migration utility type for tracking compatibility
export type CompatibilityViewStatus = {
  viewName: string;
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
  affectedTables: string[];
  migrationPhase: 'A1' | 'A2' | 'A3';
};

// ============================================================================
// CURRICULUM SYSTEM INSERT SCHEMAS
// ============================================================================

export const insertCurriculumSchema = createInsertSchema(curriculums).omit(['id', 'createdAt', 'updatedAt']);
export const insertCurriculumLevelSchema = createInsertSchema(curriculumLevels).omit(['id', 'createdAt', 'updatedAt']);
export const insertCurriculumLevelCourseSchema = createInsertSchema(curriculumLevelCourses).omit(['id', 'createdAt']);
export const insertStudentCurriculumProgressSchema = createInsertSchema(studentCurriculumProgress).omit(['id', 'createdAt', 'updatedAt']);

// Curriculum Types
export type Curriculum = typeof curriculums.$inferSelect;
export type InsertCurriculum = z.infer<typeof insertCurriculumSchema>;
export type CurriculumLevel = typeof curriculumLevels.$inferSelect;
export type InsertCurriculumLevel = z.infer<typeof insertCurriculumLevelSchema>;
export type CurriculumLevelCourse = typeof curriculumLevelCourses.$inferSelect;
export type InsertCurriculumLevelCourse = z.infer<typeof insertCurriculumLevelCourseSchema>;
export type StudentCurriculumProgress = typeof studentCurriculumProgress.$inferSelect;
export type InsertStudentCurriculumProgress = z.infer<typeof insertStudentCurriculumProgressSchema>;

// ============================================================================
// FRONT DESK CLERK INSERT SCHEMAS AND TYPES  
// ============================================================================

// Insert schemas for Front Desk tables
export const insertFrontDeskOperationSchema = createInsertSchema(frontDeskOperations).omit(['id', 'createdAt', 'updatedAt']);
export const insertPhoneCallLogSchema = createInsertSchema(phoneCallLogs).omit(['id', 'createdAt', 'updatedAt']);
export const insertFrontDeskTaskSchema = createInsertSchema(frontDeskTasks).omit(['id', 'createdAt', 'updatedAt']);

// Type exports for Front Desk tables
export type FrontDeskOperation = typeof frontDeskOperations.$inferSelect;
export type InsertFrontDeskOperation = z.infer<typeof insertFrontDeskOperationSchema>;
export type PhoneCallLog = typeof phoneCallLogs.$inferSelect;
export type InsertPhoneCallLog = z.infer<typeof insertPhoneCallLogSchema>;
export type FrontDeskTask = typeof frontDeskTasks.$inferSelect;
export type InsertFrontDeskTask = z.infer<typeof insertFrontDeskTaskSchema>;

// ============================================================================
// TRIAL LESSON SCHEDULING SYSTEM
// ============================================================================

// Trial Lessons - Core table for all trial lesson bookings
export const trialLessons = pgTable("trial_lessons", {
  id: serial("id").primaryKey(),
  
  // Student Information (from walk-in or phone inquiry)
  studentFirstName: text("student_first_name").notNull(),
  studentLastName: text("student_last_name").notNull(),
  studentPhone: text("student_phone").notNull(),
  studentEmail: text("student_email"),
  studentAge: integer("student_age"),
  studentGender: text("student_gender"), // for teacher matching preferences
  
  // Existing user connection (if return customer)
  existingUserId: integer("existing_user_id").references(() => users.id),
  
  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  // Language Learning Information
  targetLanguage: text("target_language").notNull(),
  currentProficiencyLevel: text("current_proficiency_level"), // A1, A2, B1, B2, C1, C2, beginner, intermediate, advanced
  learningObjectives: text("learning_objectives").array().default([]),
  previousExperience: text("previous_experience"),
  preferredLearningStyle: text("preferred_learning_style"), // visual, auditory, kinesthetic, reading_writing
  
  // Trial Lesson Details
  lessonType: text("lesson_type").notNull(), // 'in_person', 'online', 'phone_consultation'
  lessonDuration: integer("lesson_duration").notNull().default(45), // minutes: 30, 45, 60
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  scheduledEndTime: timestamp("scheduled_end_time").notNull(),
  
  // Teacher Assignment
  assignedTeacherId: integer("assigned_teacher_id").references(() => users.id),
  teacherAssignmentMethod: text("teacher_assignment_method"), // 'automatic', 'manual', 'student_preference'
  teacherPreferences: jsonb("teacher_preferences").$type<{
    preferredGender?: 'male' | 'female';
    experienceLevel?: 'new' | 'experienced' | 'senior';
    teachingStyle?: 'formal' | 'conversational' | 'interactive';
    specializations?: string[];
  }>(),
  
  // Room/Resource Booking (for in-person trials)
  roomId: integer("room_id").references(() => rooms.id),
  resourceRequirements: text("resource_requirements").array().default([]), // 'whiteboard', 'projector', 'computer', 'audio_system'
  
  // Booking Status and Workflow
  bookingStatus: text("booking_status").notNull().default("confirmed"), // 'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'
  confirmationSent: boolean("confirmation_sent").default(false),
  remindersSent: jsonb("reminders_sent").$type<{
    reminder24h?: { sent: boolean; sentAt?: string };
    reminder2h?: { sent: boolean; sentAt?: string };
  }>().default({}),
  
  // Booking Source and Context
  bookingSource: text("booking_source").notNull(), // 'walk_in', 'phone_call', 'online_form', 'referral'
  relatedWalkInId: integer("related_walk_in_id").references(() => frontDeskOperations.id),
  relatedCallId: integer("related_call_id").references(() => phoneCallLogs.id),
  bookedBy: integer("booked_by").references(() => users.id).notNull(), // Front desk clerk who made the booking
  
  // Payment Information (for paid trials)
  isPaid: boolean("is_paid").default(false),
  trialFee: decimal("trial_fee", { precision: 10, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("not_required"), // 'not_required', 'pending', 'paid', 'refunded'
  paymentMethod: text("payment_method"), // 'cash', 'card', 'online', 'wallet'
  
  // Attendance and Outcomes
  attendanceStatus: text("attendance_status"), // 'attended', 'no_show', 'late', 'left_early'
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: integer("checked_in_by").references(() => users.id),
  
  // Rescheduling
  originalScheduledDate: timestamp("original_scheduled_date"),
  rescheduleCount: integer("reschedule_count").default(0),
  rescheduleReason: text("reschedule_reason"),
  
  // Integration and Follow-up
  followUpTaskId: integer("follow_up_task_id").references(() => frontDeskTasks.id),
  convertedToEnrollment: boolean("converted_to_enrollment").default(false),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  
  // Special Requirements
  specialRequirements: text("special_requirements"),
  accessibilityNeeds: text("accessibility_needs"),
  culturalConsiderations: text("cultural_considerations"),
  
  // Communication preferences
  preferredCommunicationLanguage: text("preferred_communication_language").default("fa"), // for SMS/email templates
  communicationPreferences: jsonb("communication_preferences").$type<{
    smsEnabled?: boolean;
    emailEnabled?: boolean;
    callEnabled?: boolean;
  }>().default({}),
  
  // Notes and Additional Information
  bookingNotes: text("booking_notes"), // Front desk clerk notes during booking
  specialInstructions: text("special_instructions"), // Instructions for teacher
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trial Lesson Outcomes - Detailed assessment and feedback after trial
export const trialLessonOutcomes = pgTable("trial_lesson_outcomes", {
  id: serial("id").primaryKey(),
  trialLessonId: integer("trial_lesson_id").references(() => trialLessons.id).notNull().unique(),
  
  // Teacher Assessment
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  assessedLevel: text("assessed_level"), // Teacher's assessment of student level
  skillsAssessment: jsonb("skills_assessment").$type<{
    listening?: { level: string; notes?: string };
    speaking?: { level: string; notes?: string };
    reading?: { level: string; notes?: string };
    writing?: { level: string; notes?: string };
    vocabulary?: { level: string; notes?: string };
    grammar?: { level: string; notes?: string };
  }>(),
  
  // Recommendations
  recommendedCourse: text("recommended_course"),
  recommendedLevel: text("recommended_level"),
  recommendedClassFormat: text("recommended_class_format"), // 'group', 'private', 'semi_private'
  recommendedFrequency: text("recommended_frequency"), // '1x_week', '2x_week', '3x_week'
  
  // Student Feedback
  studentSatisfactionRating: integer("student_satisfaction_rating"), // 1-5 scale
  studentFeedbackNotes: text("student_feedback_notes"),
  studentInterestLevel: text("student_interest_level"), // 'very_interested', 'interested', 'somewhat_interested', 'not_interested'
  
  // Teacher Feedback
  teacherNotes: text("teacher_notes"),
  teachingRecommendations: text("teaching_recommendations"),
  learningChallengesIdentified: text("learning_challenges_identified").array().default([]),
  strengthsIdentified: text("strengths_identified").array().default([]),
  
  // Conversion Likelihood
  conversionLikelihood: text("conversion_likelihood"), // 'high', 'medium', 'low', 'unlikely'
  conversionBarriers: text("conversion_barriers").array().default([]), // 'price', 'schedule', 'location', 'teacher_fit', 'level_mismatch'
  
  // Follow-up Actions
  nextSteps: text("next_steps").array().default([]),
  followUpMethod: text("follow_up_method"), // 'phone_call', 'email', 'sms', 'in_person'
  followUpTimeline: text("follow_up_timeline"), // 'immediate', '24_hours', '3_days', '1_week'
  assignedFollowUpAgent: integer("assigned_follow_up_agent").references(() => users.id),
  
  // Trial Quality Assessment
  lessonQualityRating: integer("lesson_quality_rating"), // 1-5 teacher self-assessment
  technicalIssues: text("technical_issues").array().default([]),
  improvementAreas: text("improvement_areas").array().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Teacher Trial Lesson Availability - Specific availability windows for trial lessons
export const teacherTrialAvailability = pgTable("teacher_trial_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  
  // Availability Window
  availableDate: date("available_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  
  // Trial-specific settings
  maxTrialsPerSlot: integer("max_trials_per_slot").default(1),
  acceptedTrialTypes: text("accepted_trial_types").array().default(["in_person", "online"]), // which types teacher accepts
  
  // Current bookings
  currentBookings: integer("current_bookings").default(0),
  isBlocked: boolean("is_blocked").default(false), // manually blocked by teacher/admin
  blockingReason: text("blocking_reason"),
  
  // Teacher preferences for trials
  preferredStudentLevels: text("preferred_student_levels").array().default([]), // levels teacher prefers to teach in trials
  preferredLanguages: text("preferred_languages").array().default([]), // target languages teacher specializes in
  
  // Automatic scheduling
  allowAutoAssignment: boolean("allow_auto_assignment").default(true),
  minNoticeHours: integer("min_notice_hours").default(2), // minimum hours notice needed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trial Lesson Conflicts - Track and resolve scheduling conflicts
export const trialLessonConflicts = pgTable("trial_lesson_conflicts", {
  id: serial("id").primaryKey(),
  
  // Primary trial lesson
  trialLessonId: integer("trial_lesson_id").references(() => trialLessons.id).notNull(),
  
  // Conflict details
  conflictType: text("conflict_type").notNull(), // 'teacher_unavailable', 'room_occupied', 'double_booking', 'teacher_overload'
  conflictDescription: text("conflict_description"),
  
  // Conflicting resources
  conflictingTeacherId: integer("conflicting_teacher_id").references(() => users.id),
  conflictingRoomId: integer("conflicting_room_id").references(() => rooms.id),
  conflictingTrialId: integer("conflicting_trial_id").references(() => trialLessons.id),
  
  // Resolution
  resolutionStatus: text("resolution_status").notNull().default("pending"), // 'pending', 'resolved', 'escalated'
  resolutionMethod: text("resolution_method"), // 'reschedule', 'reassign_teacher', 'change_room', 'cancel'
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  
  // Alternative suggestions
  suggestedAlternatives: jsonb("suggested_alternatives").$type<Array<{
    newDateTime?: string;
    alternativeTeacherId?: number;
    alternativeRoomId?: number;
    reason?: string;
  }>>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});

// Trial Lesson Analytics - Performance tracking and metrics
export const trialLessonAnalytics = pgTable("trial_lesson_analytics", {
  id: serial("id").primaryKey(),
  
  // Time period for analytics
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: text("period_type").notNull(), // 'daily', 'weekly', 'monthly', 'quarterly'
  
  // Booking metrics
  totalBookings: integer("total_bookings").default(0),
  confirmedBookings: integer("confirmed_bookings").default(0),
  cancelledBookings: integer("cancelled_bookings").default(0),
  noShowBookings: integer("no_show_bookings").default(0),
  completedBookings: integer("completed_bookings").default(0),
  
  // Conversion metrics
  inquiryToTrialConversion: decimal("inquiry_to_trial_conversion", { precision: 5, scale: 2 }).default("0"),
  trialToEnrollmentConversion: decimal("trial_to_enrollment_conversion", { precision: 5, scale: 2 }).default("0"),
  totalConversions: integer("total_conversions").default(0),
  conversionRevenue: decimal("conversion_revenue", { precision: 10, scale: 2 }).default("0"),
  
  // Teacher performance
  teacherMetrics: jsonb("teacher_metrics").$type<Record<string, {
    trialsCompleted: number;
    averageRating: number;
    conversions: number;
    conversionRate: number;
  }>>().default({}),
  
  // Time slot popularity
  popularTimeSlots: jsonb("popular_time_slots").$type<Array<{
    timeSlot: string;
    bookingCount: number;
    conversionRate: number;
  }>>().default([]),
  
  // Demographic insights
  studentDemographics: jsonb("student_demographics").$type<{
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    targetLanguages: Record<string, number>;
    proficiencyLevels: Record<string, number>;
  }>().default({}),
  
  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  averageTrialValue: decimal("average_trial_value", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow()
});

// Trial Lesson Wait List - Manage waiting lists for popular time slots
export const trialLessonWaitList = pgTable("trial_lesson_wait_list", {
  id: serial("id").primaryKey(),
  
  // Student information
  studentFirstName: text("student_first_name").notNull(),
  studentLastName: text("student_last_name").notNull(),
  studentPhone: text("student_phone").notNull(),
  studentEmail: text("student_email"),
  
  // Desired trial details
  targetLanguage: text("target_language").notNull(),
  preferredLessonType: text("preferred_lesson_type"), // 'in_person', 'online', 'any'
  preferredDates: text("preferred_dates").array().default([]),
  preferredTimeSlots: text("preferred_time_slots").array().default([]),
  preferredTeacherGender: text("preferred_teacher_gender"),
  maxWaitDays: integer("max_wait_days").default(30), // how long to stay on wait list
  
  // Wait list management
  status: text("status").notNull().default("active"), // 'active', 'contacted', 'booked', 'expired', 'removed'
  priority: integer("priority").default(1), // higher number = higher priority
  addedBy: integer("added_by").references(() => users.id).notNull(),
  
  // Contact attempts
  contactAttempts: integer("contact_attempts").default(0),
  lastContactedAt: timestamp("last_contacted_at"),
  contactMethod: text("contact_method"), // 'phone', 'sms', 'email'
  
  // Resolution
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolutionMethod: text("resolution_method"), // 'booked', 'declined', 'expired', 'removed'
  bookedTrialId: integer("booked_trial_id").references(() => trialLessons.id),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// TRIAL LESSON SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for trial lesson tables
export const insertTrialLessonSchema = createInsertSchema(trialLessons).omit(['id', 'createdAt', 'updatedAt']);
export const insertTrialLessonOutcomeSchema = createInsertSchema(trialLessonOutcomes).omit(['id', 'createdAt', 'updatedAt']);
export const insertTeacherTrialAvailabilitySchema = createInsertSchema(teacherTrialAvailability).omit(['id', 'createdAt', 'updatedAt']);
export const insertTrialLessonConflictSchema = createInsertSchema(trialLessonConflicts).omit(['id', 'createdAt', 'resolvedAt']);
export const insertTrialLessonAnalyticsSchema = createInsertSchema(trialLessonAnalytics).omit(['id', 'createdAt']);
export const insertTrialLessonWaitListSchema = createInsertSchema(trialLessonWaitList).omit(['id', 'createdAt', 'updatedAt']);

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
export const smsLogMetadataSchema = z.object({
  placementSessionId: z.number().optional(),
  trialId: z.number().optional(),
  courseId: z.number().optional(),
  messageId: z.string().optional(),
  cost: z.number().optional(),
  automated: z.boolean().optional(),
  leadId: z.number().optional(),
  reminderType: z.string().optional(),
  placementLevel: z.string().optional(),
  daysSinceTest: z.number().optional(),
  error: z.string().optional(),
  customData: z.record(z.unknown()).optional()
}).strict();

export type SmsLogMetadata = z.infer<typeof smsLogMetadataSchema>;

// Insert schemas for SMS Template tables
export const insertSmsTemplateCategorySchema = createInsertSchema(smsTemplateCategories).omit(['id', 'createdAt', 'updatedAt']);
export const insertSmsTemplateVariableSchema = createInsertSchema(smsTemplateVariables).omit(['id', 'createdAt', 'updatedAt']);
export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit(['id', 'createdAt', 'updatedAt', 'usageCount', 'successfulSends', 'failedSends', 'lastUsedAt']);
export const insertSmsTemplateSendingLogSchema = createInsertSchema(smsTemplateSendingLogs).omit(['id', 'createdAt', 'updatedAt']);
export const insertSmsTemplateAnalyticsSchema = createInsertSchema(smsTemplateAnalytics).omit(['id', 'createdAt', 'updatedAt']);
export const insertSmsTemplateFavoriteSchema = createInsertSchema(smsTemplateFavorites).omit(['id', 'createdAt']);

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