import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  source: varchar("source", { length: 100 }),
  status: varchar("status", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  interestedLanguage: varchar("interested_language", { length: 100 }),
  level: varchar("level", { length: 50 }),
  budget: integer("budget"),
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  conversionDate: timestamp("conversion_date"),
  studentId: integer("student_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  interestedLevel: varchar("interested_level", { length: 50 }),
  preferredFormat: varchar("preferred_format", { length: 50 }),
  assignedAgentId: integer("assigned_agent_id").references(() => users.id),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  courseTarget: varchar("course_target", { length: 100 }),
  courseModule: varchar("course_module", { length: 100 }),
  workflowStatus: varchar("workflow_status", { length: 50 }),
  followUpStart: timestamp("follow_up_start"),
  followUpEnd: timestamp("follow_up_end"),
  smsReminderEnabled: boolean("sms_reminder_enabled").default(false),
  smsReminderSentAt: timestamp("sms_reminder_sent_at"),
  nationalId: varchar("national_id", { length: 20 }),
  workflowStage: varchar("workflow_stage", { length: 50 }).default('contact_desk'),
  callAttempts: integer("call_attempts").default(0),
  lastCallOutcome: varchar("last_call_outcome", { length: 50 }),
  stageChangedAt: timestamp("stage_changed_at"),
  withdrawalDate: timestamp("withdrawal_date"),
  withdrawalReason: varchar("withdrawal_reason", { length: 255 }),
  lastAttemptAt: timestamp("last_attempt_at"),
  nextRetryAt: timestamp("next_retry_at"),
  followUpCount: integer("follow_up_count").default(0),
  followUpColor: varchar("follow_up_color", { length: 20 }),
  assessmentMethod: varchar("assessment_method", { length: 50 }),
  assessmentStartTime: timestamp("assessment_start_time"),
  assessmentEndTime: timestamp("assessment_end_time"),
  goalScore: varchar("goal_score", { length: 50 }),
  deliveryType: varchar("delivery_type", { length: 50 }),
  classType: varchar("class_type", { length: 50 }),
  referralSource: varchar("referral_source", { length: 100 }),
  timeLimit: varchar("time_limit", { length: 50 }),
  branch: varchar("branch", { length: 100 }),
  message: text("message"),
  evaluationNotes: text("evaluation_notes"),
  consultationNotes: text("consultation_notes"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  installmentPlan: jsonb("installment_plan"),
  idCardUploaded: boolean("id_card_uploaded").default(false),
  classNumber: varchar("class_number", { length: 50 }),
  teacherId: integer("teacher_id").references(() => users.id),
  enrolledCourseId: integer("enrolled_course_id"),
  subLevelCode: varchar("sub_level_code", { length: 20 }),
  subLevelId: integer("sub_level_id"),
  scrapeSourceRef: varchar("scrape_source_ref", { length: 255 }),
  scrapeQualificationScore: integer("scrape_qualification_score")
});

export const leadActivityLog = pgTable("lead_activity_log", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  fromStage: varchar("from_stage", { length: 50 }),
  toStage: varchar("to_stage", { length: 50 }).notNull(),
  operatorId: integer("operator_id").references(() => users.id),
  reason: text("reason"),
  snapshot: jsonb("snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Communication Logs table for tracking all lead interactions
export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  communicationType: varchar("communication_type", { length: 100 }).notNull(), // call, email, sms, meeting, demo
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  duration: integer("duration"), // seconds for calls, minutes for meetings
  outcome: varchar("outcome", { length: 100 }), // connected, voicemail, email_opened, meeting_scheduled
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  attachments: text("attachments").array(),
  campaignId: varchar("campaign_id", { length: 100 }),
  responseTime: integer("response_time"), // seconds between initial contact and response
  engagementScore: integer("engagement_score"), // 0-100
  conversionEvent: varchar("conversion_event", { length: 100 }), // trial_signup, demo_request, purchase
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Iranian Calendar Settings table for Solar Hijri calendar configuration
