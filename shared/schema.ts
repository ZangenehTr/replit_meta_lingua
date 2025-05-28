import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with roles and authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("student"), // admin, teacher, student, mentor, supervisor, call_center, accountant, manager
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

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  language: text("language").notNull(), // en, fa, de, es, etc.
  level: text("level").notNull(), // beginner, intermediate, advanced
  thumbnail: text("thumbnail"),
  instructorId: integer("instructor_id").references(() => users.id),
  price: integer("price").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
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

// Payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("IRR"),
  creditsAwarded: integer("credits_awarded").default(0),
  provider: text("provider").default("shetab"), // shetab, cash
  transactionId: text("transaction_id"),
  status: text("status").default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow()
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
  updatedAt: timestamp("updated_at").defaultNow()
});

// CRM Features - Student Management
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  studentId: text("student_id").unique(), // Custom student ID
  dateOfBirth: timestamp("date_of_birth"),
  nationalId: text("national_id"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  address: text("address"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  enrollmentSource: text("enrollment_source"), // website, referral, social_media, etc.
  notes: text("notes"),
  status: text("status").default("active"), // active, inactive, suspended, graduated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Lead Management
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"), // website, referral, social_media, advertisement
  status: text("status").default("new"), // new, contacted, qualified, enrolled, lost
  interestedCourses: text("interested_courses").array(),
  notes: text("notes"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  contactedAt: timestamp("contacted_at"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Financial Management
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("pending"), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"), // card, bank_transfer, cash, etc.
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Teacher Performance Tracking
export const teacherPerformance = pgTable("teacher_performance", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).default("0"),
  totalStudents: integer("total_students").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  classesConducted: integer("classes_conducted").default(0),
  studentRetentionRate: decimal("student_retention_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow()
});

// Attendance Tracking
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // present, absent, late, excused
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Communication Logs
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(), // Can reference users or leads
  contactType: text("contact_type").notNull(), // student, lead, teacher
  communicationType: text("communication_type").notNull(), // email, phone, sms, in_person
  subject: text("subject"),
  content: text("content"),
  staffId: integer("staff_id").references(() => users.id).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  outcome: text("outcome"), // successful, no_answer, rescheduled, etc.
  followUpRequired: boolean("follow_up_required").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true
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

// CRM Insert Schemas
export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTeacherPerformanceSchema = createInsertSchema(teacherPerformance).omit({
  id: true,
  createdAt: true
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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

// CRM Types
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type TeacherPerformance = typeof teacherPerformance.$inferSelect;
export type InsertTeacherPerformance = z.infer<typeof insertTeacherPerformanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;
