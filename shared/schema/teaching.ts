import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { buildInsertSchema } from "./schema-helpers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users , courses} from "./users";

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id"),
  attendanceType: varchar("attendance_type", { length: 20 }).default("present"), // present, absent, late
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Assignments table
export const teacherAssignments = pgTable("teacher_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Evaluations table
export const teacherEvaluations = pgTable("teacher_evaluations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  evaluatorId: integer("evaluator_id").references(() => users.id).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  feedback: text("feedback"),
  evaluationDate: date("evaluation_date"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Class Observations table
export const classObservations = pgTable("class_observations", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  observerId: integer("observer_id").references(() => users.id).notNull(),
  observationDate: date("observation_date").notNull(),
  strengths: text("strengths"),
  improvements: text("improvements"),
  overallRating: decimal("overall_rating", { precision: 3, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 50 }),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Email Logs table
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  emailType: varchar("email_type", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  templateId: varchar("template_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Reports table
export const studentReports = pgTable("student_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  reportData: jsonb("report_data").notNull(),
  generatedBy: integer("generated_by").references(() => users.id),
  reportPeriod: varchar("report_period", { length: 50 }),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Payment Transactions table  
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  transactionType: varchar("transaction_type", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  referenceId: varchar("reference_id", { length: 255 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Book Categories table
export const book_categories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 255 }),
  isbn: varchar("isbn", { length: 20 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  stockQuantity: integer("stock_quantity").default(0),
  category: varchar("category", { length: 255 }),
  publicationYear: integer("publication_year"),
  
  // New enhanced fields
  bookType: varchar("book_type", { length: 20 }).default("pdf"), // 'pdf' or 'hardcopy'
  aiDescription: text("ai_description"), // AI-generated Farsi description (100-200 words)
  categoryId: integer("category_id").references(() => book_categories.id),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  language: varchar("language", { length: 50 }).default("en"),
  level: varchar("level", { length: 20 }),
  pageCount: integer("page_count"),
  
  // PDF book specific fields
  pdfFileUrl: varchar("pdf_file_url", { length: 500 }),
  downloadCount: integer("download_count").default(0),
  successfulDownloads: integer("successful_downloads").default(0),
  failedDownloads: integer("failed_downloads").default(0),
  
  // Hardcopy book specific fields
  shipmentStatus: varchar("shipment_status", { length: 50 }), // 'pending', 'processing', 'shipped', 'delivered'
  postOfficeTrackingNo: varchar("post_office_tracking_no", { length: 255 }),
  
  isDigital: boolean("is_digital").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for books
export const insertBookSchema = z.object({
  title: z.string().max(500),
  author: z.string().max(255).optional(),
  isbn: z.string().max(20).optional(),
  description: z.string().optional(),
  price: z.string(), // decimal as string, required
  coverImage: z.string().max(500).optional(),
  stockQuantity: z.number().default(0),
  category: z.string().max(255).optional(),
  publicationYear: z.number().optional(),
  
  // New enhanced fields
  bookType: z.enum(['pdf', 'hardcopy']).default('pdf'),
  aiDescription: z.string().optional(),
  categoryId: z.number().optional(),
  currency: z.string().max(3).default("IRR"),
  language: z.string().max(50).default("en"),
  level: z.string().max(20).optional(),
  pageCount: z.number().optional(),
  
  // PDF book specific fields
  pdfFileUrl: z.string().max(500).optional(),
  downloadCount: z.number().default(0),
  successfulDownloads: z.number().default(0),
  failedDownloads: z.number().default(0),
  
  // Hardcopy book specific fields
  shipmentStatus: z.string().max(50).optional(),
  postOfficeTrackingNo: z.string().max(255).optional(),
  
  isDigital: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

// Book Assets table
export const book_assets = pgTable("book_assets", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // audio, video, pdf, epub
  assetUrl: varchar("asset_url", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  fileSize: integer("file_size"),
  duration: integer("duration"), // for audio/video
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Dictionary Lookups table
export const dictionary_lookups = pgTable("dictionary_lookups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  word: varchar("word", { length: 255 }).notNull(),
  definition: text("definition"),
  sourceLanguage: varchar("source_language", { length: 10 }).default("en"),
  targetLanguage: varchar("target_language", { length: 10 }).default("fa"),
  context: text("context"),
  bookId: integer("book_id").references(() => books.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schema for dictionary lookups  
export const insertDictionaryLookupSchema = z.object({
  userId: z.number().optional(),
  word: z.string().max(255),
  definition: z.string().optional(),
  sourceLanguage: z.string().max(10).default("en"),
  targetLanguage: z.string().max(10).default("fa"),
  context: z.string().optional(),
  bookId: z.number().optional()
});

// Book Orders table
export const book_orders = pgTable("book_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  orderStatus: varchar("order_status", { length: 50 }).default("pending"), // pending, confirmed, completed, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, refunded
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR"),
  
  // PDF book specific - download tracking
  downloadCount: integer("download_count").default(0),
  lastDownloadAt: timestamp("last_download_at"),
  downloadLimit: integer("download_limit").default(5), // max downloads allowed
  
  // Hardcopy book specific - shipping tracking
  shippingStatus: varchar("shipping_status", { length: 50 }), // pending, processing, shipped, delivered
  trackingNumber: varchar("tracking_number", { length: 255 }), // FDC or post office tracking
  shippingAddress: text("shipping_address"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Book Reviews table - user ratings and reviews for books
export const bookReviews = pgTable("book_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  reviewText: text("review_text"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false), // True if user bought the book
  helpfulCount: integer("helpful_count").default(0), // Number of users who found review helpful
  reportCount: integer("report_count").default(0), // Number of spam reports
  isApproved: boolean("is_approved").default(true),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schema for book orders
export const insertBookOrderSchema = z.object({
  userId: z.number(),
  bookId: z.number(),
  orderStatus: z.string().max(50).optional(),
  paymentStatus: z.string().max(50).optional(),
  totalAmount: z.string(), // decimal as string
  currency: z.string().max(3).default("IRR"),
  downloadCount: z.number().default(0),
  lastDownloadAt: z.date().optional(),
  downloadLimit: z.number().default(5),
  shippingStatus: z.string().max(50).optional(),
  trackingNumber: z.string().max(255).optional(),
  shippingAddress: z.string().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional()
});

// Insert schema for book assets
export const insertBookAssetSchema = z.object({
  bookId: z.number(),
  assetType: z.string().max(50),
  assetUrl: z.string().max(500),
  title: z.string().max(255).optional(),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
  isActive: z.boolean().default(true)
});

// Insert schema for carts
export const insertCartSchema = z.object({
  userId: z.number().optional(),
  sessionId: z.string().max(255).optional(),
  status: z.string().max(20).default("active")
});

// Insert schema for cart items
export const insertCartItemSchema = z.object({
  cartId: z.number(),
  bookId: z.number(),
  quantity: z.number().default(1),
  price: z.string().optional() // decimal as string
});

// Insert schema for orders
export const insertOrderSchema = z.object({
  orderNumber: z.string().max(100),
  userId: z.number(),
  orderType: z.string().max(30).default("purchase"),
  orderStatus: z.string().max(30).default("pending"),
  paymentStatus: z.string().max(30).default("pending"),
  paymentMethod: z.string().max(50).optional(),
  paymentGateway: z.string().max(50).optional(),
  transactionId: z.string().max(100).optional(),
  subtotal: z.string(), // decimal as string
  discountTotal: z.string().default("0"),
  taxTotal: z.string().default("0"),
  shippingTotal: z.string().default("0"),
  grandTotal: z.string(), // decimal as string
  currency: z.string().max(10).default("IRR"),
  billingAddressId: z.number().optional(),
  shippingAddressId: z.number().optional(),
  orderNotes: z.string().optional(),
  customerNotes: z.string().optional()
});

// AI Training Jobs table for tracking model training job execution
export const insertBookCategorySchema = buildInsertSchema(book_categories, { id: true, createdAt: true, updatedAt: true });
