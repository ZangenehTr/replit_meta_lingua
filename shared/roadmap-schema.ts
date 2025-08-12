import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, courses } from "./schema";

// Learning Roadmaps - Define structured learning paths
export const learningRoadmaps = pgTable("learning_roadmaps", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetLanguage: varchar("target_language", { length: 50 }).notNull(), // persian, english, arabic, etc.
  targetLevel: varchar("target_level", { length: 10 }).notNull(), // A1, A2, B1, B2, C1, C2
  
  // Roadmap metadata
  estimatedWeeks: integer("estimated_weeks").notNull(), // Total weeks to complete
  weeklyHours: integer("weekly_hours").notNull(), // Recommended hours per week
  difficulty: varchar("difficulty", { length: 20 }).default("intermediate"),
  prerequisites: text("prerequisites").array().default([]),
  
  // Visual representation
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  iconName: varchar("icon_name", { length: 50 }),
  accentColor: varchar("accent_color", { length: 7 }), // Hex color
  
  // Creation and management
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  isActive: boolean("is_active").default(true),
  tags: text("tags").array().default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Roadmap Milestones - Major checkpoints in the learning journey
export const roadmapMilestones = pgTable("roadmap_milestones", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").references(() => learningRoadmaps.id).notNull(),
  
  // Milestone details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(), // Sequence in roadmap
  weekNumber: integer("week_number").notNull(), // When to reach this milestone
  
  // Skills focus
  primarySkill: varchar("primary_skill", { length: 50 }).notNull(), // speaking, listening, reading, writing, grammar, vocabulary
  secondarySkills: text("secondary_skills").array().default([]),
  
  // Assessment criteria
  assessmentType: varchar("assessment_type", { length: 50 }), // quiz, project, presentation, etc.
  passingScore: integer("passing_score").default(70),
  
  // Visual elements
  iconName: varchar("icon_name", { length: 50 }),
  badgeImageUrl: varchar("badge_image_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Roadmap Steps - Individual learning activities within milestones
export const roadmapSteps = pgTable("roadmap_steps", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").references(() => roadmapMilestones.id).notNull(),
  
  // Step details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(), // Sequence within milestone
  estimatedMinutes: integer("estimated_minutes").notNull(),
  
  // Content linking
  contentType: varchar("content_type", { length: 50 }).notNull(), // lesson, video, exercise, reading, project
  courseId: integer("course_id").references(() => courses.id), // Optional link to course
  contentUrl: varchar("content_url", { length: 500 }), // External content
  contentMetadata: jsonb("content_metadata"), // Additional content info
  
  // Requirements
  isRequired: boolean("is_required").default(true),
  prerequisites: integer("prerequisites").array().default([]), // IDs of prerequisite steps
  
  // Learning objectives
  objectives: text("objectives").array().default([]),
  skillsTargeted: jsonb("skills_targeted"), // { speaking: 20, listening: 30, etc. }
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User Roadmap Enrollments - Track user progress through roadmaps
export const userRoadmapEnrollments = pgTable("user_roadmap_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roadmapId: integer("roadmap_id").references(() => learningRoadmaps.id).notNull(),
  
  // Progress tracking
  status: varchar("status", { length: 20 }).default("active"), // active, paused, completed, abandoned
  currentMilestoneId: integer("current_milestone_id").references(() => roadmapMilestones.id),
  currentStepId: integer("current_step_id").references(() => roadmapSteps.id),
  
  // Progress metrics
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  completedSteps: integer("completed_steps").default(0),
  totalSteps: integer("total_steps").notNull(),
  
  // Time tracking
  startedAt: timestamp("started_at").defaultNow().notNull(),
  targetCompletionDate: timestamp("target_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  lastActivityAt: timestamp("last_activity_at"),
  
  // Performance
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  totalStudyMinutes: integer("total_study_minutes").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User Roadmap Progress - Detailed step completion tracking
export const userRoadmapProgress = pgTable("user_roadmap_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => userRoadmapEnrollments.id).notNull(),
  stepId: integer("step_id").references(() => roadmapSteps.id).notNull(),
  
  // Completion tracking
  status: varchar("status", { length: 20 }).default("not_started"), // not_started, in_progress, completed, skipped
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Performance
  score: decimal("score", { precision: 5, scale: 2 }),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  attempts: integer("attempts").default(0),
  
  // User notes
  notes: text("notes"),
  feedback: text("feedback"),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Roadmap Reviews - User feedback on roadmaps
export const roadmapReviews = pgTable("roadmap_reviews", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").references(() => learningRoadmaps.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  
  // Specific feedback
  difficultyRating: integer("difficulty_rating"), // 1-5 (too easy to too hard)
  paceRating: integer("pace_rating"), // 1-5 (too slow to too fast)
  contentQuality: integer("content_quality"), // 1-5
  wouldRecommend: boolean("would_recommend"),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas
export const insertLearningRoadmapSchema = createInsertSchema(learningRoadmaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRoadmapMilestoneSchema = createInsertSchema(roadmapMilestones).omit({
  id: true,
  createdAt: true
});

export const insertRoadmapStepSchema = createInsertSchema(roadmapSteps).omit({
  id: true,
  createdAt: true
});

export const insertUserRoadmapEnrollmentSchema = createInsertSchema(userRoadmapEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserRoadmapProgressSchema = createInsertSchema(userRoadmapProgress).omit({
  id: true,
  createdAt: true
});

export const insertRoadmapReviewSchema = createInsertSchema(roadmapReviews).omit({
  id: true,
  createdAt: true
});

// Type exports
export type LearningRoadmap = typeof learningRoadmaps.$inferSelect;
export type InsertLearningRoadmap = z.infer<typeof insertLearningRoadmapSchema>;
export type RoadmapMilestone = typeof roadmapMilestones.$inferSelect;
export type InsertRoadmapMilestone = z.infer<typeof insertRoadmapMilestoneSchema>;
export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type InsertRoadmapStep = z.infer<typeof insertRoadmapStepSchema>;
export type UserRoadmapEnrollment = typeof userRoadmapEnrollments.$inferSelect;
export type InsertUserRoadmapEnrollment = z.infer<typeof insertUserRoadmapEnrollmentSchema>;
export type UserRoadmapProgress = typeof userRoadmapProgress.$inferSelect;
export type InsertUserRoadmapProgress = z.infer<typeof insertUserRoadmapProgressSchema>;
export type RoadmapReview = typeof roadmapReviews.$inferSelect;
export type InsertRoadmapReview = z.infer<typeof insertRoadmapReviewSchema>;