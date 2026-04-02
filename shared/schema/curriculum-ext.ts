import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { buildInsertSchema } from "./schema-helpers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, courses, curriculumCategories } from "./users";
import { aiModels, aiTrainingJobs, aiTrainingDatasets, aiDatasetItems } from "./ai-training";
import { leads, leadActivityLog } from "./leads";
import { guestLeads, videoLessons } from "./marketing";
import { institutes, enrollments } from "./social";

export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  watchedDuration: integer("watched_duration").default(0), // in seconds
  totalDuration: integer("total_duration"), // in seconds
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  lastWatchedPosition: integer("last_watched_position").default(0), // in seconds
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  watchCount: integer("watch_count").default(0),
  rating: integer("rating"), // 1-5 scale
  ratedAt: timestamp("rated_at"),
  bookmarksCount: integer("bookmarks_count").default(0),
  notesCount: integer("notes_count").default(0),
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default("1.0"),
  subtitlesEnabled: boolean("subtitles_enabled").default(true),
  qualityPreference: varchar("quality_preference", { length: 20 }).default("auto"), // auto, 720p, 1080p, etc.
  lastWatchedAt: timestamp("last_watched_at"),
  watchHistory: jsonb("watch_history"), // session timestamps and durations
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }),
  attentionSpan: integer("attention_span"), // longest continuous watch time
  pauseCount: integer("pause_count").default(0),
  rewindCount: integer("rewind_count").default(0),
  deviceType: varchar("device_type", { length: 50 }), // mobile, tablet, desktop
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Notes table
export const videoNotes = pgTable("video_notes", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  timestamp: decimal("timestamp", { precision: 8, scale: 3 }).notNull(), // in seconds
  noteText: text("note_text").notNull(),
  noteType: varchar("note_type", { length: 50 }).default("general"), // general, vocabulary, grammar, question, insight
  tags: text("tags").array().default([]),
  isPrivate: boolean("is_private").default(true),
  isImportant: boolean("is_important").default(false),
  color: varchar("color", { length: 20 }).default("yellow"), // for highlighting
  relatedVocabulary: text("related_vocabulary").array().default([]),
  attachments: text("attachments").array().default([]),
  sharedWith: text("shared_with").array().default([]), // user IDs
  likes: integer("likes").default(0),
  isTeacherApproved: boolean("is_teacher_approved").default(false),
  teacherFeedback: text("teacher_feedback"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Video Bookmarks table
export const videoBookmarks = pgTable("video_bookmarks", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videoLessons.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  timestamp: decimal("timestamp", { precision: 8, scale: 3 }).notNull(), // in seconds
  title: varchar("title", { length: 255 }),
  description: text("description"),
  bookmarkType: varchar("bookmark_type", { length: 50 }).default("important"), // important, vocabulary, grammar, review, question
  tags: text("tags").array().default([]),
  color: varchar("color", { length: 20 }).default("red"), // for visual identification
  isPublic: boolean("is_public").default(false),
  reminderSet: boolean("reminder_set").default(false),
  reminderDate: timestamp("reminder_date"),
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  folderName: varchar("folder_name", { length: 100 }), // for organization
  priority: integer("priority").default(1), // 1-5 scale
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Courier Tracking table
export const courier_tracking = pgTable("courier_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().unique(),
  courierName: varchar("courier_name", { length: 100 }).notNull(),
  courierService: varchar("courier_service", { length: 100 }), // standard, express, overnight
  status: varchar("status", { length: 50 }).default("pending"), // pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  pickupDate: timestamp("pickup_date"),
  currentLocation: varchar("current_location", { length: 255 }),
  deliveryAddress: text("delivery_address"),
  recipientName: varchar("recipient_name", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  deliveryInstructions: text("delivery_instructions"),
  signatureRequired: boolean("signature_required").default(false),
  signedBy: varchar("signed_by", { length: 255 }),
  deliveryPhoto: varchar("delivery_photo", { length: 500 }),
  attemptCount: integer("attempt_count").default(0),
  lastAttemptDate: timestamp("last_attempt_date"),
  failureReason: text("failure_reason"),
  notes: text("notes"),
  weight: decimal("weight", { precision: 8, scale: 3 }), // in kg
  dimensions: jsonb("dimensions"), // length, width, height
  insuranceValue: decimal("insurance_value", { precision: 10, scale: 2 }),
  isInsured: boolean("is_insured").default(false),
  trackingHistory: jsonb("tracking_history"), // status updates with timestamps
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  instituteId: integer("institute_id").references(() => institutes.id),
  orderId: integer("order_id").references(() => orders.id),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  invoiceType: varchar("invoice_type", { length: 50 }).default("standard"), // standard, pro_forma, credit_note, debit_note
  status: varchar("status", { length: 20 }).default("draft"), // draft, sent, paid, overdue, cancelled, refunded
  billingDate: date("billing_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 100 }), // "Net 30", "Due on receipt", etc.
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, cash, card, wallet
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  billingAddress: jsonb("billing_address"),
  shippingAddress: jsonb("shipping_address"),
  lineItems: jsonb("line_items"), // detailed breakdown of services/products
  taxBreakdown: jsonb("tax_breakdown"), // detailed tax calculations
  discountBreakdown: jsonb("discount_breakdown"), // detailed discount information
  paymentHistory: jsonb("payment_history"), // payment transactions for this invoice
  remindersSent: integer("reminders_sent").default(0),
  lastReminderDate: date("last_reminder_date"),
  nextReminderDate: date("next_reminder_date"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }), // monthly, quarterly, yearly
  parentInvoiceId: integer("parent_invoice_id").references(() => invoices.id),
  cancellationReason: text("cancellation_reason"),
  refundReason: text("refund_reason"),
  attachments: text("attachments").array().default([]),
  generatedBy: integer("generated_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  downloadCount: integer("download_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MST Responses table
export const mstResponses = pgTable("mst_responses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => mstSessions.id).notNull(),
  questionId: integer("question_id"),
  questionType: varchar("question_type", { length: 50 }).notNull(), // multiple_choice, speaking, listening, writing, reading
  response: text("response"), // student's response/answer
  isCorrect: boolean("is_correct"),
  score: decimal("score", { precision: 5, scale: 2 }),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in seconds
  attempts: integer("attempts").default(1),
  hintsUsed: integer("hints_used").default(0),
  confidence: integer("confidence"), // 1-10 scale
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  skillArea: varchar("skill_area", { length: 50 }), // listening, speaking, reading, writing, grammar, vocabulary
  adaptiveLevel: decimal("adaptive_level", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  audioUrl: varchar("audio_url", { length: 500 }), // for speaking responses
  transcription: text("transcription"), // for speaking responses
  pronunciation: jsonb("pronunciation"), // pronunciation analysis data
  fluency: jsonb("fluency"), // fluency analysis data
  accuracy: jsonb("accuracy"), // accuracy analysis data
  errors: jsonb("errors"), // detected errors
  improvements: jsonb("improvements"), // suggested improvements
  teacherFeedback: text("teacher_feedback"),
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of the response
  flagged: boolean("flagged").default(false),
  flagReason: text("flag_reason"),
  metadata: jsonb("metadata"),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
  gradedAt: timestamp("graded_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MST Sessions table
export const mstSessions = pgTable("mst_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  sessionType: varchar("session_type", { length: 50 }).default("adaptive"), // adaptive, diagnostic, practice, assessment
  targetSkill: varchar("target_skill", { length: 50 }).notNull(), // listening, speaking, reading, writing, grammar, vocabulary
  difficultyLevel: varchar("difficulty_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  sessionDuration: integer("session_duration").default(15), // in minutes
  questionsTotal: integer("questions_total"),
  questionsCompleted: integer("questions_completed").default(0),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, paused, abandoned
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  completedAt: timestamp("completed_at"),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  maxPossibleScore: decimal("max_possible_score", { precision: 5, scale: 2 }),
  accuracyScore: decimal("accuracy_score", { precision: 5, scale: 2 }),
  fluencyScore: decimal("fluency_score", { precision: 5, scale: 2 }),
  pronunciationScore: decimal("pronunciation_score", { precision: 5, scale: 2 }),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }),
  adaptiveLevel: decimal("adaptive_level", { precision: 5, scale: 2 }),
  levelAdjustments: integer("level_adjustments").default(0),
  hintsProvided: integer("hints_provided").default(0),
  errorsDetected: integer("errors_detected").default(0),
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  recommendations: text("recommendations").array().default([]),
  timeSpent: integer("time_spent"), // actual time spent in seconds
  attentionScore: decimal("attention_score", { precision: 5, scale: 2 }),
  engagementLevel: varchar("engagement_level", { length: 20 }), // low, medium, high, very_high
  frustrationLevel: varchar("frustration_level", { length: 20 }), // low, medium, high
  progressMade: boolean("progress_made").default(false),
  skillImprovement: jsonb("skill_improvement"), // detailed skill progress tracking
  sessionGoals: text("session_goals").array().default([]),
  goalsAchieved: text("goals_achieved").array().default([]),
  nextSessionRecommendations: text("next_session_recommendations").array().default([]),
  teacherNotes: text("teacher_notes"),
  studentFeedback: text("student_feedback"),
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of the session
  deviceInfo: jsonb("device_info"),
  connectionQuality: varchar("connection_quality", { length: 20 }), // excellent, good, fair, poor
  technicalIssues: text("technical_issues").array().default([]),
  sessionRecording: varchar("session_recording", { length: 500 }), // URL to session recording
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// MST Skill States table
export const mstSkillStates = pgTable("mst_skill_states", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  skillArea: varchar("skill_area", { length: 50 }).notNull(), // listening, speaking, reading, writing, grammar, vocabulary
  currentLevel: varchar("current_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  targetLevel: varchar("target_level", { length: 20 }),
  proficiencyScore: decimal("proficiency_score", { precision: 5, scale: 2 }),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  sessionsCompleted: integer("sessions_completed").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  correctAnswers: integer("correct_answers").default(0),
  incorrectAnswers: integer("incorrect_answers").default(0),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }),
  averageResponseTime: decimal("average_response_time", { precision: 8, scale: 3 }), // in seconds
  improvementTrend: varchar("improvement_trend", { length: 20 }), // improving, stable, declining, fluctuating
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  commonMistakes: text("common_mistakes").array().default([]),
  masteredConcepts: text("mastered_concepts").array().default([]),
  strugglingConcepts: text("struggling_concepts").array().default([]),
  nextMilestones: text("next_milestones").array().default([]),
  recommendedActivities: text("recommended_activities").array().default([]),
  lastAssessmentDate: timestamp("last_assessment_date"),
  lastScoreChange: decimal("last_score_change", { precision: 5, scale: 2 }),
  scoreHistory: jsonb("score_history"), // historical score data
  skillMastery: jsonb("skill_mastery"), // detailed mastery breakdown
  learningVelocity: decimal("learning_velocity", { precision: 5, scale: 2 }), // progress rate
  difficultyPreference: varchar("difficulty_preference", { length: 20 }), // easy, moderate, challenging
  adaptiveLevel: decimal("adaptive_level", { precision: 5, scale: 2 }),
  plateauDetected: boolean("plateau_detected").default(false),
  plateauDuration: integer("plateau_duration"), // days in plateau
  breakthroughNeeded: boolean("breakthrough_needed").default(false),
  motivationLevel: varchar("motivation_level", { length: 20 }), // low, medium, high, very_high
  frustrationLevel: varchar("frustration_level", { length: 20 }), // low, medium, high
  engagementPattern: varchar("engagement_pattern", { length: 50 }), // consistent, sporadic, declining, improving
  optimalSessionLength: integer("optimal_session_length"), // in minutes
  preferredLearningStyle: varchar("preferred_learning_style", { length: 50 }),
  retentionRate: decimal("retention_rate", { precision: 5, scale: 2 }),
  memoryStrength: varchar("memory_strength", { length: 20 }), // weak, average, strong, excellent
  needsReview: boolean("needs_review").default(false),
  reviewTopics: text("review_topics").array().default([]),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Main Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderType: varchar("order_type", { length: 30 }).default("purchase"), // purchase, subscription, gift, trial
  orderStatus: varchar("order_status", { length: 30 }).default("pending"), // pending, processing, confirmed, shipped, delivered, cancelled, refunded
  paymentStatus: varchar("payment_status", { length: 30 }).default("pending"), // pending, paid, failed, refunded, partial
  paymentMethod: varchar("payment_method", { length: 50 }), // shetab, wallet, bank_transfer, cash
  paymentGateway: varchar("payment_gateway", { length: 50 }), // shetab, kavenegar_pay
  transactionId: varchar("transaction_id", { length: 100 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountTotal: decimal("discount_total", { precision: 10, scale: 2 }).default("0"),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }).default("0"),
  shippingTotal: decimal("shipping_total", { precision: 10, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1"),
  discountCode: varchar("discount_code", { length: 50 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  billingAddressId: integer("billing_address_id").references(() => user_addresses.id),
  shippingAddressId: integer("shipping_address_id").references(() => user_addresses.id),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  estimatedDelivery: date("estimated_delivery"),
  actualDelivery: date("actual_delivery"),
  orderNotes: text("order_notes"),
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  giftMessage: text("gift_message"),
  isGift: boolean("is_gift").default(false),
  giftRecipientName: varchar("gift_recipient_name", { length: 255 }),
  giftRecipientEmail: varchar("gift_recipient_email", { length: 255 }),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  source: varchar("source", { length: 50 }).default("website"), // website, mobile_app, admin, phone, import
  deviceInfo: jsonb("device_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: varchar("referrer", { length: 500 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  affiliateId: integer("affiliate_id"),
  salesRepId: integer("sales_rep_id").references(() => users.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  invoiceDate: date("invoice_date"),
  dueDate: date("due_date"),
  paidDate: timestamp("paid_date"),
  refundedDate: timestamp("refunded_date"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  returnPolicy: varchar("return_policy", { length: 100 }),
  warrantyInfo: jsonb("warranty_info"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 30 }).default("pending"), // pending, processing, partially_fulfilled, fulfilled, cancelled
  trackingNumber: varchar("tracking_number", { length: 100 }),
  carrier: varchar("carrier", { length: 50 }),
  orderTags: text("order_tags").array().default([]),
  customFields: jsonb("custom_fields"),
  metadata: jsonb("metadata"),
  placedAt: timestamp("placed_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Order Items table
export const order_items = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productType: varchar("product_type", { length: 50 }).notNull(), // course, book, package, session, merchandise
  productId: integer("product_id"), // reference to specific product
  productName: varchar("product_name", { length: 255 }).notNull(),
  productDescription: text("product_description"),
  sku: varchar("sku", { length: 100 }),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("IRR"),
  weight: decimal("weight", { precision: 8, scale: 3 }), // in kg
  dimensions: jsonb("dimensions"), // length, width, height
  isDigital: boolean("is_digital").default(false),
  downloadUrl: varchar("download_url", { length: 500 }),
  accessDuration: integer("access_duration"), // days of access for digital products
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  courseStartDate: date("course_start_date"),
  courseEndDate: date("course_end_date"),
  teacherId: integer("teacher_id").references(() => users.id),
  sessionPackageId: integer("session_package_id"),
  sessionsIncluded: integer("sessions_included"),
  validityPeriod: integer("validity_period"), // days valid for sessions
  redemptionCode: varchar("redemption_code", { length: 50 }),
  giftMessage: text("gift_message"),
  giftRecipientEmail: varchar("gift_recipient_email", { length: 255 }),
  isGift: boolean("is_gift").default(false),
  customizations: jsonb("customizations"), // custom options selected
  fulfillmentStatus: varchar("fulfillment_status", { length: 20 }).default("pending"), // pending, processing, fulfilled, failed
  fulfillmentDate: timestamp("fulfillment_date"),
  shippingRequired: boolean("shipping_required").default(false),
  returnPolicy: varchar("return_policy", { length: 100 }),
  warrantyPeriod: integer("warranty_period"), // days
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Addresses table
export const user_addresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 20 }).default("home"), // home, work, billing, shipping, other
  label: varchar("label", { length: 100 }), // custom label like "Mom's House", "Office"
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }),
  addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).default("Iran").notNull(),
  countryCode: varchar("country_code", { length: 5 }).default("IR"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  alternatePhone: varchar("alternate_phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isDefault: boolean("is_default").default(false),
  isDefaultBilling: boolean("is_default_billing").default(false),
  isDefaultShipping: boolean("is_default_shipping").default(false),
  coordinates: jsonb("coordinates"), // lat, lng for mapping
  locationNotes: text("location_notes"), // delivery instructions
  accessCodes: varchar("access_codes", { length: 100 }), // building codes, buzzer numbers
  deliveryInstructions: text("delivery_instructions"),
  businessHours: jsonb("business_hours"), // for business addresses
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verificationMethod: varchar("verification_method", { length: 50 }), // postal_service, sms, manual
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Shipping Orders table
export const shipping_orders = pgTable("shipping_orders", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  shippingMethod: varchar("shipping_method", { length: 100 }).notNull(),
  shippingProvider: varchar("shipping_provider", { length: 100 }), // post_iran, tipax, peyk, courier
  trackingNumber: varchar("tracking_number", { length: 100 }).unique(),
  labelUrl: varchar("label_url", { length: 500 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  insuranceValue: decimal("insurance_value", { precision: 10, scale: 2 }),
  declaredValue: decimal("declared_value", { precision: 10, scale: 2 }),
  packageWeight: decimal("package_weight", { precision: 8, scale: 3 }), // in kg
  packageDimensions: jsonb("package_dimensions"), // length, width, height
  fromAddress: jsonb("from_address").notNull(),
  toAddress: jsonb("to_address").notNull(),
  shippingStatus: varchar("shipping_status", { length: 30 }).default("pending"), // pending, picked_up, in_transit, out_for_delivery, delivered, failed, returned
  estimatedDelivery: timestamp("estimated_delivery"),
  actualPickup: timestamp("actual_pickup"),
  actualDelivery: timestamp("actual_delivery"),
  attemptCount: integer("attempt_count").default(0),
  deliveryAttempts: jsonb("delivery_attempts"), // array of attempt details
  signatureRequired: boolean("signature_required").default(false),
  signedBy: varchar("signed_by", { length: 255 }),
  signatureImage: varchar("signature_image", { length: 500 }),
  deliveryInstructions: text("delivery_instructions"),
  specialHandling: text("special_handling").array().default([]), // fragile, urgent, temperature_controlled
  customs: jsonb("customs"), // customs declaration for international
  isInternational: boolean("is_international").default(false),
  returnPolicy: varchar("return_policy", { length: 100 }),
  returnTrackingNumber: varchar("return_tracking_number", { length: 100 }),
  returnReason: text("return_reason"),
  returnStatus: varchar("return_status", { length: 30 }), // pending, approved, rejected, completed
  notifications: jsonb("notifications"), // SMS/email notifications sent
  customerNotes: text("customer_notes"),
  courierNotes: text("courier_notes"),
  internalNotes: text("internal_notes"),
  proofOfDelivery: varchar("proof_of_delivery", { length: 500 }), // photo/document URL
  issues: jsonb("issues"), // delivery issues and resolutions
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Glossary Items table for CallerN personal vocabulary
export const glossaryItems = pgTable("glossary_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  callId: varchar("call_id", { length: 255 }), // CallerN session where this was learned
  word: varchar("word", { length: 255 }).notNull(),
  definition: text("definition").notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 50 }), // noun, verb, adjective, etc.
  pronunciation: varchar("pronunciation", { length: 255 }), // phonetic notation
  audioUrl: varchar("audio_url", { length: 500 }), // pronunciation recording
  nativeTranslation: text("native_translation"), // in user's native language
  examples: jsonb("examples"), // usage examples
  synonyms: text("synonyms").array().default([]),
  antonyms: text("antonyms").array().default([]),
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  frequency: varchar("frequency", { length: 20 }), // common, uncommon, rare
  category: varchar("category", { length: 100 }), // business, medical, technology, etc.
  tags: text("tags").array().default([]), // user-defined tags
  context: text("context"), // where/how this was encountered in the conversation
  conversationTopic: varchar("conversation_topic", { length: 255 }),
  teacherName: varchar("teacher_name", { length: 255 }),
  studyStatus: varchar("study_status", { length: 20 }).default("learning"), // learning, reviewing, mastered
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  incorrectCount: integer("incorrect_count").default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  srsLevel: integer("srs_level").default(1), // spaced repetition level
  easeFactor: decimal("ease_factor", { precision: 3, scale: 2 }).default("2.50"), // for SRS algorithm
  interval: integer("interval").default(1), // days until next review
  masteryScore: decimal("mastery_score", { precision: 5, scale: 2 }).default("0"), // 0-100
  confidenceLevel: varchar("confidence_level", { length: 20 }).default("low"), // low, medium, high
  personalNotes: text("personal_notes"),
  mnemonics: text("mnemonics"), // memory aids
  associatedImages: text("associated_images").array().default([]), // image URLs
  relatedWords: text("related_words").array().default([]),
  errorPatterns: jsonb("error_patterns"), // common mistakes user makes
  usageContext: text("usage_context").array().default([]), // formal, informal, slang, etc.
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  source: varchar("source", { length: 50 }).default("callern"), // callern, manual, import
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  sharedWithTeacher: boolean("shared_with_teacher").default(false),
  teacherFeedback: text("teacher_feedback"),
  aiGenerated: boolean("ai_generated").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Quiz Results table for storing test/quiz outcomes
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: varchar("quiz_id", { length: 255 }).notNull(),
  quizType: varchar("quiz_type", { length: 50 }).notNull(), // placement, practice, assessment, callern
  sessionId: varchar("session_id", { length: 255 }), // for CallernN session tracking
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // percentage score 0-100
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  skippedAnswers: integer("skipped_answers").default(0),
  timeSpent: integer("time_spent"), // seconds
  maxTimeAllowed: integer("max_time_allowed"), // seconds
  completionStatus: varchar("completion_status", { length: 20 }).default("completed"), // completed, incomplete, timed_out
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  subject: varchar("subject", { length: 100 }), // grammar, vocabulary, listening, speaking, reading, writing
  topics: text("topics").array().default([]), // specific topics covered
  skillAreas: jsonb("skill_areas"), // detailed skill breakdown
  detailedResults: jsonb("detailed_results"), // question-by-question analysis
  feedback: text("feedback"), // AI-generated feedback
  recommendations: jsonb("recommendations"), // next steps and recommendations
  certificateId: varchar("certificate_id", { length: 255 }), // if applicable
  retakeAllowed: boolean("retake_allowed").default(true),
  retakeCount: integer("retake_count").default(0),
  proctored: boolean("proctored").default(false),
  cheatingDetected: boolean("cheating_detected").default(false),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  gradedAt: timestamp("graded_at"),
  validUntil: timestamp("valid_until"), // certificate/result validity
  instructorId: integer("instructor_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Suggested Terms table for AI vocabulary suggestions
export const suggestedTerms = pgTable("suggested_terms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }), // video call or learning session
  term: varchar("term", { length: 255 }).notNull(),
  definition: text("definition").notNull(),
  pronunciation: varchar("pronunciation", { length: 255 }), // phonetic or IPA
  audioUrl: varchar("audio_url", { length: 500 }), // pronunciation audio
  partOfSpeech: varchar("part_of_speech", { length: 50 }), // noun, verb, adjective, etc.
  language: varchar("language", { length: 10 }).default("en"), // target language
  nativeTranslation: text("native_translation"), // translation to user's native language
  context: text("context"), // where/how this term was encountered
  examples: jsonb("examples"), // array of usage examples
  synonyms: text("synonyms").array().default([]),
  antonyms: text("antonyms").array().default([]),
  relatedTerms: text("related_terms").array().default([]),
  difficulty: varchar("difficulty", { length: 20 }), // A1, A2, B1, B2, C1, C2
  frequency: varchar("frequency", { length: 20 }), // very_common, common, uncommon, rare
  category: varchar("category", { length: 50 }), // business, academic, casual, technical, etc.
  topics: text("topics").array().default([]), // science, technology, arts, etc.
  isAdded: boolean("is_added").default(false),
  addedAt: timestamp("added_at"),
  isIgnored: boolean("is_ignored").default(false),
  ignoredAt: timestamp("ignored_at"),
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  incorrectCount: integer("incorrect_count").default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  masteryLevel: varchar("mastery_level", { length: 20 }).default("new"), // new, learning, familiar, mastered
  spaceRepetition: jsonb("space_repetition"), // SRS algorithm data
  userNotes: text("user_notes"),
  mnemonics: text("mnemonics"), // memory aids created by user
  personalityTags: text("personality_tags").array().default([]), // funny, serious, professional, etc.
  source: varchar("source", { length: 50 }).default("ai"), // ai, teacher, dictionary, reading, video
  sourceContext: text("source_context"), // which lesson, video, book, etc.
  aiConfidence: decimal("ai_confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  flags: text("flags").array().default([]), // inappropriate, outdated, regional, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Rewrite Suggestions table for AI writing assistance
export const rewriteSuggestions = pgTable("rewrite_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }), // video call or learning session
  originalText: text("original_text").notNull(),
  suggestedText: text("suggested_text").notNull(),
  suggestionType: varchar("suggestion_type", { length: 50 }).notNull(), // grammar, style, clarity, fluency, vocabulary
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00 to 1.00
  language: varchar("language", { length: 10 }).default("en"), // target language
  proficiencyLevel: varchar("proficiency_level", { length: 10 }), // A1, A2, B1, B2, C1, C2
  errorCategory: varchar("error_category", { length: 50 }), // verb_tense, article, preposition, word_order, etc.
  explanation: text("explanation"), // why this change is suggested
  examples: jsonb("examples"), // array of usage examples
  isAccepted: boolean("is_accepted"),
  acceptedAt: timestamp("accepted_at"),
  isRejected: boolean("is_rejected").default(false),
  rejectedAt: timestamp("rejected_at"),
  feedback: varchar("feedback", { length: 20 }), // helpful, not_helpful, incorrect
  userNotes: text("user_notes"),
  contextBefore: text("context_before"), // text before the error
  contextAfter: text("context_after"), // text after the error
  position: jsonb("position"), // start and end positions in original text
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  teachingPoint: text("teaching_point"), // educational explanation
  relatedRules: text("related_rules").array().default([]), // grammar rules related to this suggestion
  alternativeSuggestions: jsonb("alternative_suggestions"), // other possible corrections
  voiceToText: boolean("voice_to_text").default(false), // was this from speech recognition
  realTimeCorrection: boolean("real_time_correction").default(false),
  source: varchar("source", { length: 50 }).default("ai"), // ai, teacher, peer, self
  aiModel: varchar("ai_model", { length: 100 }), // which AI model generated this
  processingTime: integer("processing_time"), // milliseconds to generate suggestion
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ============================================================================
// CURRICULUM SYSTEM TABLES
// ============================================================================

// Main curriculum tracks (IELTS and Conversation)
export const curriculums = pgTable("curriculums", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  key: varchar("key", { length: 100 }).unique().notNull(), // 'ielts', 'conversation'
  language: varchar("language", { length: 10 }).notNull().default("en"), // target language
  description: text("description"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Curriculum levels (Flash IELTS 1, A1.1, A1.2, etc.)
export const curriculumLevels = pgTable("curriculum_levels", {
  id: serial("id").primaryKey(),
  curriculumId: integer("curriculum_id").references(() => curriculums.id).notNull(),
  code: varchar("code", { length: 20 }).notNull(), // 'A1.1', 'Flash-IELTS-1'
  name: varchar("name", { length: 255 }).notNull(),
  levelCode: varchar("level_code", { length: 20 }), // legacy support
  levelName: varchar("level_name", { length: 255 }), // legacy support
  orderIndex: integer("order_index").notNull(),
  cefrBand: varchar("cefr_band", { length: 10 }), // A1, A2, B1, B2, C1, C2
  difficultyLevel: varchar("difficulty_level", { length: 20 }),
  totalLessons: integer("total_lessons").default(0),
  estimatedWeeks: integer("estimated_weeks"),
  prerequisites: text("prerequisites").array().default([]),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Exam tags for course discovery (IELTS, TOEFL, GRE, etc.)
export const courseExamTags = pgTable("course_exam_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type CourseExamTag = typeof courseExamTags.$inferSelect;
export type InsertCourseExamTag = typeof courseExamTags.$inferInsert;

// Links courses to curriculum levels (many-to-many relationship)
export const curriculumLevelCourses = pgTable("curriculum_level_courses", {
  id: serial("id").primaryKey(),
  curriculumLevelId: integer("curriculum_level_id").references(() => curriculumLevels.id).notNull(),
  levelId: integer("level_id").references(() => curriculumLevels.id), // alias for backward compatibility
  courseId: integer("course_id").references(() => courses.id).notNull(),
  orderIndex: integer("order_index").notNull(),
  isRequired: boolean("is_required").default(true),
  minimumScore: decimal("minimum_score", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student progress through curriculum levels
export const studentCurriculumProgress = pgTable("student_curriculum_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  curriculumId: integer("curriculum_id").references(() => curriculums.id).notNull(),
  curriculumLevelId: integer("curriculum_level_id").references(() => curriculumLevels.id),
  currentLevelId: integer("current_level_id").references(() => curriculumLevels.id),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, suspended
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  completedLessons: integer("completed_lessons").default(0),
  totalLessons: integer("total_lessons").default(0),
  currentLevel: jsonb("current_level"), // level info cache
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastActiveAt: timestamp("last_active_at"),
  nextLevelUnlockedAt: timestamp("next_level_unlocked_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Course enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  curriculumLevelId: integer("curriculum_level_id").references(() => curriculumLevels.id),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, dropped, suspended
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  finalGrade: decimal("final_grade", { precision: 5, scale: 2 }),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  droppedAt: timestamp("dropped_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Student Preferences table for user settings and preferences
export const studentPreferences = pgTable("student_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  language: varchar("language", { length: 10 }).default("en"), // UI language preference
  timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
  preferredCommunicationMethod: varchar("preferred_communication_method", { length: 20 }).default("email"), // email, sms, push
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  studyReminders: boolean("study_reminders").default(true),
  weeklyReports: boolean("weekly_reports").default(true),
  progressSharing: boolean("progress_sharing").default(false), // share with teachers/mentors
  publicProfile: boolean("public_profile").default(false),
  preferredLearningStyle: varchar("preferred_learning_style", { length: 20 }), // visual, auditory, kinesthetic, reading
  difficultyPreference: varchar("difficulty_preference", { length: 20 }).default("adaptive"), // easy, medium, hard, adaptive
  sessionLength: integer("session_length").default(30), // preferred session length in minutes
  dailyGoalMinutes: integer("daily_goal_minutes").default(30),
  weeklyGoalHours: integer("weekly_goal_hours").default(5),
  autoplayVideos: boolean("autoplay_videos").default(true),
  showSubtitles: boolean("show_subtitles").default(false),
  playbackSpeed: decimal("playback_speed", { precision: 3, scale: 2 }).default("1.00"), // 0.5x to 2.0x speed
  fontSize: varchar("font_size", { length: 10 }).default("medium"), // small, medium, large
  darkMode: boolean("dark_mode").default(false),
  highContrast: boolean("high_contrast").default(false),
  accessibilityMode: boolean("accessibility_mode").default(false),
  keyboardNavigation: boolean("keyboard_navigation").default(false),
  screenReader: boolean("screen_reader").default(false),
  ttsEnabled: boolean("tts_enabled").default(false), // text-to-speech
  ttsVoice: varchar("tts_voice", { length: 50 }),
  ttsSpeed: decimal("tts_speed", { precision: 3, scale: 2 }).default("1.00"),
  calendarIntegration: varchar("calendar_integration", { length: 20 }), // google, outlook, apple
  studySchedule: jsonb("study_schedule"), // preferred study times
  breakReminders: boolean("break_reminders").default(true),
  motivationalMessages: boolean("motivational_messages").default(true),
  gamificationEnabled: boolean("gamification_enabled").default(true),
  competitiveMode: boolean("competitive_mode").default(false),
  privateMode: boolean("private_mode").default(false),
  dataSharing: boolean("data_sharing").default(false), // for research/improvement
  analyticsOptOut: boolean("analytics_opt_out").default(false),
  marketingOptIn: boolean("marketing_opt_in").default(false),
  customSettings: jsonb("custom_settings"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Teacher Trial Availability for managing trial lesson schedules
export const teacherTrialAvailability = pgTable("teacher_trial_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timeZone: varchar("time_zone", { length: 50 }).default("UTC"),
  maxStudents: integer("max_students").default(1), // concurrent trial students
  trialDuration: integer("trial_duration").default(30), // minutes
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
  effectiveUntil: timestamp("effective_until"),
  recurringWeeks: integer("recurring_weeks"), // how many weeks this availability repeats
  exceptions: jsonb("exceptions"), // specific dates when not available
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Trial Lessons for managing one-time trial sessions
export const trialLessons = pgTable("trial_lessons", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  lessonType: varchar("lesson_type", { length: 50 }).default("general_trial"), // general_trial, ielts_trial, conversation_trial
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(30), // minutes
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled, no_show
  meetingUrl: varchar("meeting_url", { length: 500 }), // video call link
  meetingId: varchar("meeting_id", { length: 255 }),
  password: varchar("password", { length: 255 }), // meeting password
  notes: text("notes"), // teacher's notes about the student
  feedback: text("feedback"), // post-lesson feedback
  studentRating: integer("student_rating"), // 1-5 star rating from student
  teacherRating: integer("teacher_rating"), // 1-5 star rating from teacher
  followUpRequired: boolean("follow_up_required").default(false),
  followUpNotes: text("follow_up_notes"),
  skillAssessment: jsonb("skill_assessment"), // assessment results
  recommendedLevel: varchar("recommended_level", { length: 20 }), // A1, A2, B1, B2, C1, C2
  recommendedCourse: varchar("recommended_course", { length: 255 }),
  conversionOutcome: varchar("conversion_outcome", { length: 20 }), // enrolled, not_interested, follow_up, no_decision
  enrolledCourseId: integer("enrolled_course_id").references(() => courses.id),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  rescheduledFrom: integer("rescheduled_from").references(() => trialLessons.id),
  rescheduledTo: integer("rescheduled_to").references(() => trialLessons.id),
  attendanceStatus: varchar("attendance_status", { length: 20 }), // attended, no_show, late, early_leave
  technicalIssues: text("technical_issues"),
  recordingUrl: varchar("recording_url", { length: 500 }),
  materialUsed: jsonb("material_used"), // what materials/resources were used
  homeworkAssigned: text("homework_assigned"),
  nextSteps: text("next_steps"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Rooms table for physical and virtual classrooms

// Classes - Specific instances of courses with teacher and schedule

// Class Enrollments (links students to specific classes)

// Course Sessions - Individual sessions within a class

// Tutoring sessions

// Session Video Progress Tracking

// Session Video Notes

// Session Video Bookmarks

// Messages between users

// Homework assignments - Enhanced with more fields

// Payment transactions with enhanced Shetab integration

// Legacy admin settings removed - using comprehensive version below

// Session Packages for Private Students

// Callern Video Call Packages

// Callern Package Roadmaps - Defines learning paths for each package

// Callern Roadmap Steps - Individual lessons/steps in a roadmap

// Student progress through roadmap steps

// Course Roadmap Progress - Track student progress through course roadmaps 

// Student Callern Packages (purchased packages)

// Teacher Callern Authorization - Controls who can access Callern dashboard

// Teacher Callern Availability

// Callern Call History (extended for new features)

// Callern Syllabus Topics

// Student Callern Progress

// ===== NEW CALLERN ENHANCEMENT TABLES =====

// Suggested Terms (vocabulary suggestions during calls)

// Rewrite Suggestions (improved versions of student utterances)

// Glossary Items (student's personal vocabulary collection)

// Quiz Results (for SRS vocabulary testing)

// Email Logs (for tracking sent emails)

// Audit Log for tracking all sensitive operations

// Student Preferences for feature toggles

// Wallet Transactions for incremental top-ups

// Course Enrollment Payments (direct payments for courses)

// Enhanced Notifications for Role-Based System



// Custom Roles and Permissions System

// Gamification System




// Level assessment questions - managed by admins/managers

// User level assessment results

// CRM Management Tables










// Insert schemas - temporarily commented out due to drizzle-zod compatibility issues
// TODO: Fix drizzle-zod integration
// export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
// export const insertUserSessionSchema = createInsertSchema(userSessions);
// export const insertOtpCodeSchema = buildInsertSchema(otpCodes, { id: true, createdAt: true });
// Holidays table for managing institute holidays (used for class end date calculation)

// Course insert schema - re-enabled for storage layer
export const insertCourseSchema = buildInsertSchema(courses, { id: true, createdAt: true, updatedAt: true });
export type InsertCourse = typeof courses.$inferInsert;

// Curriculum Category schemas
export const insertCurriculumCategorySchema = buildInsertSchema(curriculumCategories, { id: true, createdAt: true, updatedAt: true });
export type InsertCurriculumCategory = z.infer<typeof insertCurriculumCategorySchema>;
export type CurriculumCategory = typeof curriculumCategories.$inferSelect;

// Guest Lead schemas
export const insertGuestLeadSchema = buildInsertSchema(guestLeads, { id: true, createdAt: true, updatedAt: true });
export type InsertGuestLead = z.infer<typeof insertGuestLeadSchema>;
export type GuestLead = typeof guestLeads.$inferSelect;
// export const insertClassSchema = createInsertSchema(classes);
// export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments);
// export const insertHolidaySchema = createInsertSchema(holidays);
// export const insertEnrollmentSchema = createInsertSchema(enrollments);
// export const insertSessionVideoProgressSchema = createInsertSchema(sessionVideoProgress);
// export const insertSessionVideoNotesSchema = createInsertSchema(sessionVideoNotes);
// export const insertSessionVideoBookmarksSchema = createInsertSchema(sessionVideoBookmarks);
// export const insertHomeworkSchema = createInsertSchema(homework);
// Admin settings schema defined below with comprehensive version




// Lead schema moved to after table definition to avoid forward reference

// CRM Insert Schemas








// Communication log schema moved to end of file


// Referral Settings - User-defined commission split preferences

// Course Referrals - Track specific course referrals

// Referral Commissions - Track and manage commission payouts

// AI Training Data Storage

// Skill Assessment Tracking

// Learning Activities Tracking

// Progress Snapshots for Historical Tracking

// AI Knowledge Base - Processed training data ready for retrieval

// AI Model Management

// AI Training Jobs

// AI Training Datasets

// AI Dataset Items (linking datasets to training data)

// Referral system insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS
// AI Model Management schemas - MOVED TO END OF FILE

// AI Training types
export type InsertAiModel = typeof aiModels.$inferInsert;
export type InsertAiTrainingJob = typeof aiTrainingJobs.$inferInsert;
export type InsertAiTrainingDataset = typeof aiTrainingDatasets.$inferInsert;
export type InsertAiDatasetItem = typeof aiDatasetItems.$inferInsert;
export type AiModel = typeof aiModels.$inferSelect;
export type AiTrainingJob = typeof aiTrainingJobs.$inferSelect;
export type AiTrainingDataset = typeof aiTrainingDatasets.$inferSelect;
export type AiDatasetItem = typeof aiDatasetItems.$inferSelect;

// Skill tracking insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS

// LEAD MANAGEMENT SYSTEM (Call Center)

// Lead types
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// Lead Activity Log types
export type LeadActivityLogEntry = typeof leadActivityLog.$inferSelect;
export type InsertLeadActivityLog = typeof leadActivityLog.$inferInsert;

// COMMUNICATION LOGS (Call Center)

// Insert schema for communication logs

// FINANCIAL SYSTEM (Accountant)

// Insert schema for invoices

// PAYMENT TRANSACTIONS (Iranian Shetab Integration)

// Insert schema for payment transactions


// Insert schemas for order and shipping system
export const insertOrderItemSchema = buildInsertSchema(order_items, { id: true });
export const insertUserAddressSchema = buildInsertSchema(user_addresses, { id: true, createdAt: true, updatedAt: true });
export const insertShippingOrderSchema = buildInsertSchema(shipping_orders, { id: true, createdAt: true, updatedAt: true });
export const insertCourierTrackingSchema = buildInsertSchema(courier_tracking, { id: true, createdAt: true });
