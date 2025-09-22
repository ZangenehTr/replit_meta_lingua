import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENHANCED MENTORING SYSTEM SCHEMA
// ============================================================================
// This schema provides comprehensive mentoring capabilities with AI-powered
// progress tracking, adaptive learning paths, and real-time guidance

// Learning Path Status
export const LEARNING_PATH_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused", 
  COMPLETED: "completed",
  SUSPENDED: "suspended",
  ARCHIVED: "archived"
} as const;

export type LearningPathStatus = typeof LEARNING_PATH_STATUS[keyof typeof LEARNING_PATH_STATUS];

// Intervention Types
export const INTERVENTION_TYPES = {
  ACADEMIC_SUPPORT: "academic_support",
  MOTIVATIONAL: "motivational",
  BEHAVIORAL: "behavioral",
  TECHNICAL: "technical",
  SOCIAL: "social",
  EMOTIONAL: "emotional",
  SCHEDULE_ADJUSTMENT: "schedule_adjustment",
  CONTENT_ADAPTATION: "content_adaptation"
} as const;

export type InterventionType = typeof INTERVENTION_TYPES[keyof typeof INTERVENTION_TYPES];

// Intervention Priority Levels
export const INTERVENTION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  URGENT: "urgent",
  CRITICAL: "critical"
} as const;

export type InterventionPriority = typeof INTERVENTION_PRIORITY[keyof typeof INTERVENTION_PRIORITY];

// Communication Types
export const COMMUNICATION_TYPES = {
  TEXT_MESSAGE: "text_message",
  VOICE_MESSAGE: "voice_message",
  VIDEO_MESSAGE: "video_message", 
  EMAIL: "email",
  IN_APP_NOTIFICATION: "in_app_notification",
  SYSTEM_ALERT: "system_alert",
  SCHEDULED_MEETING: "scheduled_meeting",
  EMERGENCY_CONTACT: "emergency_contact"
} as const;

export type CommunicationType = typeof COMMUNICATION_TYPES[keyof typeof COMMUNICATION_TYPES];

// Risk Assessment Levels
export const RISK_LEVELS = {
  MINIMAL: "minimal",
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high", 
  CRITICAL: "critical"
} as const;

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

// ============================================================================
// ENHANCED STUDENT PROGRESS TRACKING
// ============================================================================

// Enhanced student progress with detailed analytics and AI insights
export const enhancedStudentProgress = pgTable("enhanced_student_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  mentorId: integer("mentor_id").references(() => users.id),
  trackingDate: date("tracking_date").notNull(),
  
  // Progress Metrics
  overallProgressPercentage: decimal("overall_progress_percentage", { precision: 5, scale: 2 }).default("0.00"),
  skillProgressScores: jsonb("skill_progress_scores").$type<{
    speaking?: number;
    listening?: number;
    reading?: number;
    writing?: number;
    grammar?: number;
    vocabulary?: number;
    pronunciation?: number;
  }>().default({}),
  
  // Learning Velocity & Patterns
  learningVelocity: decimal("learning_velocity", { precision: 8, scale: 4 }).default("0.0000"), // Units/day
  consistencyScore: decimal("consistency_score", { precision: 5, scale: 2 }).default("0.00"), // 0-100
  engagementLevel: decimal("engagement_level", { precision: 5, scale: 2 }).default("0.00"), // 0-100
  motivationIndex: decimal("motivation_index", { precision: 5, scale: 2 }).default("0.00"), // 0-100
  
  // Performance Trends
  weeklyGrowthRate: decimal("weekly_growth_rate", { precision: 8, scale: 4 }).default("0.0000"),
  monthlyGrowthRate: decimal("monthly_growth_rate", { precision: 8, scale: 4 }).default("0.0000"),
  performanceTrendDirection: text("performance_trend_direction").default("stable"), // improving, declining, stable
  
  // Behavioral Analytics
  studyTimeMinutesDaily: integer("study_time_minutes_daily").default(0),
  sessionCompletionRate: decimal("session_completion_rate", { precision: 5, scale: 2 }).default("0.00"),
  averageSessionDuration: integer("average_session_duration").default(0), // in minutes
  consecutiveDaysActive: integer("consecutive_days_active").default(0),
  
  // Challenge Areas & Strengths
  primaryChallenges: text("primary_challenges").array().default([]),
  identifiedStrengths: text("identified_strengths").array().default([]),
  recommendedFocusAreas: text("recommended_focus_areas").array().default([]),
  
  // AI-Generated Insights
  aiInsights: jsonb("ai_insights").$type<{
    performanceSummary?: string;
    strengthsAnalysis?: string;
    improvementAreas?: string;
    personalizedRecommendations?: string[];
    predictedOutcomes?: {
      shortTerm?: string;
      mediumTerm?: string;
      longTerm?: string;
    };
    riskFactors?: string[];
    confidenceScore?: number; // 0-100 for AI prediction confidence
  }>().default({}),
  
  // Risk Assessment
  riskLevel: text("risk_level").$type<RiskLevel>().default("minimal"),
  riskFactors: text("risk_factors").array().default([]),
  interventionRequired: boolean("intervention_required").default(false),
  
  // Metadata
  dataQualityScore: decimal("data_quality_score", { precision: 5, scale: 2 }).default("100.00"), // Confidence in data
  lastAnalysisUpdate: timestamp("last_analysis_update").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// ADAPTIVE LEARNING PATHS
// ============================================================================

// Adaptive learning paths that adjust based on student performance
export const adaptiveLearningPaths = pgTable("adaptive_learning_paths", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  mentorId: integer("mentor_id").references(() => users.id),
  
  // Path Configuration
  pathName: text("path_name").notNull(),
  pathDescription: text("path_description"),
  targetSkills: text("target_skills").array().default([]),
  difficultyLevel: text("difficulty_level").notNull(), // beginner, intermediate, advanced
  estimatedDurationWeeks: integer("estimated_duration_weeks"),
  
  // Path Status & Progress
  status: text("status").$type<LearningPathStatus>().default("active"),
  currentStepIndex: integer("current_step_index").default(0),
  totalSteps: integer("total_steps").notNull(),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0.00"),
  
  // Adaptation Rules & Triggers
  adaptationRules: jsonb("adaptation_rules").$type<{
    performanceThresholds?: {
      excellentPerformance?: number; // > 85% - accelerate
      goodPerformance?: number; // > 75% - maintain
      strugglingPerformance?: number; // < 60% - provide support
      criticalPerformance?: number; // < 50% - intervention required
    };
    adaptationTriggers?: {
      consecutiveFailures?: number;
      timeSpentThreshold?: number; // minutes
      motivationDropThreshold?: number;
      engagementDropThreshold?: number;
    };
    contentAdaptations?: {
      increaseSupport?: boolean;
      simplifyContent?: boolean;
      addPracticeExercises?: boolean;
      changeInstructionMethod?: boolean;
      provideAlternativeResources?: boolean;
    };
  }>().default({}),
  
  // Learning Path Steps
  pathSteps: jsonb("path_steps").$type<Array<{
    stepId: string;
    stepName: string;
    stepDescription: string;
    stepType: string; // lesson, practice, assessment, reflection
    requiredResources?: string[];
    estimatedTimeMinutes: number;
    prerequisites?: string[];
    learningObjectives: string[];
    successCriteria: string[];
    adaptiveVariations?: {
      easier?: string[];
      harder?: string[];
      alternative?: string[];
    };
    completed: boolean;
    completedAt?: string;
    performanceScore?: number;
  }>>().default([]),
  
  // Progress Tracking
  stepsCompleted: integer("steps_completed").default(0),
  averageStepScore: decimal("average_step_score", { precision: 5, scale: 2 }),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  adaptationsApplied: integer("adaptations_applied").default(0),
  
  // AI Recommendations
  aiRecommendations: jsonb("ai_recommendations").$type<{
    nextStepSuggestions?: string[];
    paceAdjustment?: string; // accelerate, maintain, decelerate
    contentModifications?: string[];
    supportLevel?: string; // minimal, moderate, intensive
    alternativePaths?: Array<{
      pathName: string;
      reason: string;
      estimatedTime: string;
    }>;
  }>().default({}),
  
  // Outcomes & Assessment
  startedAt: timestamp("started_at").defaultNow(),
  expectedCompletionDate: timestamp("expected_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  outcomeQuality: text("outcome_quality"), // excellent, good, satisfactory, needs_improvement
  learningOutcomes: text("learning_outcomes").array().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// AI RECOMMENDATION ENGINE DATA
// ============================================================================

// AI-generated recommendations for mentors and students
export const aiMentoringRecommendations = pgTable("ai_mentoring_recommendations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  mentorId: integer("mentor_id").references(() => users.id),
  
  // Recommendation Classification
  recommendationType: text("recommendation_type").notNull(), // academic, motivational, behavioral, technical
  category: text("category").notNull(), // study_plan, content, pace, support, intervention
  priority: text("priority").$type<InterventionPriority>().default("medium"),
  urgency: boolean("urgency").default(false),
  
  // Recommendation Content
  title: text("title").notNull(),
  description: text("description").notNull(),
  detailedGuidance: text("detailed_guidance"),
  actionSteps: text("action_steps").array().default([]),
  expectedOutcomes: text("expected_outcomes").array().default([]),
  
  // AI Analysis Data
  aiModelUsed: text("ai_model_used"), // ollama:llama2, openai:gpt-4, etc.
  analysisData: jsonb("analysis_data").$type<{
    dataInputs?: {
      performanceData?: any;
      behaviorMetrics?: any;
      learningPatterns?: any;
      progressTrends?: any;
    };
    analysisMethod?: string;
    confidenceLevel?: number; // 0-100
    alternativeRecommendations?: string[];
    riskAssessment?: string;
  }>(),
  
  // Implementation Tracking
  status: text("status").default("pending"), // pending, implemented, dismissed, modified
  implementedAt: timestamp("implemented_at"),
  implementationNotes: text("implementation_notes"),
  effectiveness: text("effectiveness"), // highly_effective, effective, neutral, ineffective
  effectivenessMetrics: jsonb("effectiveness_metrics").$type<{
    beforeMetrics?: any;
    afterMetrics?: any;
    improvementScore?: number;
    measurementPeriod?: string;
  }>(),
  
  // Personalization Data
  personalizationFactors: jsonb("personalization_factors").$type<{
    learningStyle?: string;
    culturalBackground?: string;
    motivationFactors?: string[];
    personalChallenges?: string[];
    preferences?: any;
  }>().default({}),
  
  // Follow-up & Monitoring
  requiresFollowUp: boolean("requires_follow_up").default(false),
  followUpDate: timestamp("follow_up_date"),
  monitoringPeriod: integer("monitoring_period"), // days
  reviewStatus: text("review_status").default("pending"), // pending, reviewed, closed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at")
});

// ============================================================================
// INTERVENTION TRACKING SYSTEM
// ============================================================================

// Comprehensive intervention tracking with effectiveness metrics
export const mentoringInterventions = pgTable("mentoring_interventions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  triggeredBy: integer("triggered_by").references(() => aiMentoringRecommendations.id), // Optional AI recommendation link
  
  // Intervention Classification
  interventionType: text("intervention_type").$type<InterventionType>().notNull(),
  severity: text("severity").$type<InterventionPriority>().default("medium"),
  triggerReason: text("trigger_reason").notNull(),
  triggerCriteria: jsonb("trigger_criteria").$type<{
    performanceThreshold?: number;
    behaviorIndicators?: string[];
    timeBasedTriggers?: string[];
    aiRecommendationTrigger?: boolean;
  }>(),
  
  // Intervention Details
  title: text("title").notNull(),
  description: text("description").notNull(),
  plannedActions: text("planned_actions").array().default([]),
  interventionStrategy: text("intervention_strategy"), 
  resourcesRequired: text("resources_required").array().default([]),
  estimatedDuration: text("estimated_duration"), // e.g., "2 weeks", "1 month"
  
  // Implementation Tracking  
  status: text("status").default("planned"), // planned, active, completed, suspended, cancelled
  startedAt: timestamp("started_at"),
  expectedCompletionAt: timestamp("expected_completion_at"),
  actualCompletionAt: timestamp("actual_completion_at"),
  
  // Progress Monitoring
  progressUpdates: jsonb("progress_updates").$type<Array<{
    updateDate: string;
    progressNote: string;
    metricsSnapshot: any;
    adjustmentsMade?: string;
    challengesEncountered?: string;
  }>>().default([]),
  
  // Effectiveness Measurement
  baselineMetrics: jsonb("baseline_metrics").$type<{
    performanceScores?: any;
    behaviorMetrics?: any;
    engagementLevel?: number;
    motivationLevel?: number;
    specificMeasurements?: any;
  }>(),
  
  outcomeMetrics: jsonb("outcome_metrics").$type<{
    performanceScores?: any;
    behaviorMetrics?: any;
    engagementLevel?: number;
    motivationLevel?: number;
    specificMeasurements?: any;
    improvementPercentage?: number;
  }>(),
  
  effectiveness: text("effectiveness"), // highly_effective, effective, partially_effective, ineffective
  effectivenessScore: decimal("effectiveness_score", { precision: 5, scale: 2 }), // 0-100
  
  // Learning & Adaptation
  lessonsLearned: text("lessons_learned"),
  recommendationsForFuture: text("recommendations_for_future").array().default([]),
  adaptationsApplied: text("adaptations_applied").array().default([]),
  
  // Stakeholder Input
  studentFeedback: text("student_feedback"),
  mentorReflections: text("mentor_reflections"),
  parentGuardianFeedback: text("parent_guardian_feedback"),
  
  // Follow-up Requirements
  followUpRequired: boolean("follow_up_required").default(false),
  followUpActions: text("follow_up_actions").array().default([]),
  followUpDate: timestamp("follow_up_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// COMMUNICATION SYSTEM
// ============================================================================

// Enhanced communication tracking for mentor-student interactions
export const mentoringCommunications = pgTable("mentoring_communications", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  assignmentId: integer("assignment_id").references(() => mentorAssignments.id),
  relatedInterventionId: integer("related_intervention_id").references(() => mentoringInterventions.id),
  
  // Communication Details
  communicationType: text("communication_type").$type<CommunicationType>().notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  
  // Media & Attachments
  attachments: jsonb("attachments").$type<Array<{
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize?: number;
    uploadedAt: string;
  }>>().default([]),
  
  // Audio/Video Communications
  mediaDuration: integer("media_duration"), // seconds for audio/video
  transcription: text("transcription"), // AI-generated transcription if available
  
  // Communication Context
  communicationPurpose: text("communication_purpose"), // feedback, guidance, check-in, emergency, etc.
  urgencyLevel: text("urgency_level").default("normal"), // low, normal, high, urgent
  
  // Response & Follow-up
  requiresResponse: boolean("requires_response").default(false),
  responseDeadline: timestamp("response_deadline"),
  hasBeenRead: boolean("has_been_read").default(false),
  readAt: timestamp("read_at"),
  
  // Response Tracking
  parentCommunicationId: integer("parent_communication_id").references(() => mentoringCommunications.id), // For threading
  responseCount: integer("response_count").default(0),
  lastResponseAt: timestamp("last_response_at"),
  
  // Delivery & Status
  deliveryStatus: text("delivery_status").default("sent"), // sent, delivered, read, failed
  deliveryMethod: text("delivery_method"), // in_app, email, sms, push_notification
  
  // Analytics & Insights
  sentimentAnalysis: jsonb("sentiment_analysis").$type<{
    sentiment?: string; // positive, neutral, negative
    confidence?: number;
    emotionalTone?: string[];
    aiAnalysis?: string;
  }>(),
  
  // Scheduling (for scheduled meetings)
  scheduledFor: timestamp("scheduled_for"),
  duration: integer("duration"), // minutes
  location: text("location"), // virtual, physical address, etc.
  meetingStatus: text("meeting_status"), // scheduled, completed, cancelled, rescheduled
  
  // Privacy & Compliance
  isConfidential: boolean("is_confidential").default(false),
  parentGuardianCcRequired: boolean("parent_guardian_cc_required").default(false),
  complianceFlags: text("compliance_flags").array().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// MENTOR SCHEDULING & AVAILABILITY
// ============================================================================

export const mentorSchedule = pgTable("mentor_schedule", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").references(() => users.id).notNull(),
  
  // Schedule Configuration
  dayOfWeek: text("day_of_week").notNull(), // monday, tuesday, etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timezone: text("timezone").default("Asia/Tehran"),
  
  // Availability Details
  isAvailable: boolean("is_available").default(true),
  capacity: integer("capacity").default(1), // number of students that can be handled in this slot
  sessionDuration: integer("session_duration").default(30), // minutes
  
  // Specialization & Focus Areas
  preferredSessionTypes: text("preferred_session_types").array().default([]), // academic, motivational, etc.
  skillSpecialization: text("skill_specialization").array().default([]),
  
  // Recurring Pattern
  isRecurring: boolean("is_recurring").default(true),
  recurrencePattern: text("recurrence_pattern").default("weekly"), // weekly, biweekly, monthly
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  
  // Exceptions & Overrides
  exceptions: jsonb("exceptions").$type<Array<{
    date: string;
    reason: string;
    alternativeTime?: string;
    isBlocked: boolean;
  }>>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// ANALYTICS TRACKING TABLES
// ============================================================================

// Performance analytics for the mentoring system
export const mentoringAnalytics = pgTable("mentoring_analytics", {
  id: serial("id").primaryKey(),
  
  // Time Period
  analyticsPeriod: text("analytics_period").notNull(), // daily, weekly, monthly, quarterly
  periodStartDate: date("period_start_date").notNull(),
  periodEndDate: date("period_end_date").notNull(),
  
  // Overall System Metrics
  totalActiveMentorships: integer("total_active_mentorships").default(0),
  newMentorshipsStarted: integer("new_mentorships_started").default(0),
  mentorshipsCompleted: integer("mentorships_completed").default(0),
  averageMentorshipDuration: decimal("average_mentorship_duration", { precision: 8, scale: 2 }),
  
  // Student Progress Metrics
  averageProgressImprovement: decimal("average_progress_improvement", { precision: 8, scale: 4 }),
  studentEngagementRate: decimal("student_engagement_rate", { precision: 5, scale: 2 }),
  studentRetentionRate: decimal("student_retention_rate", { precision: 5, scale: 2 }),
  studentsAtRisk: integer("students_at_risk").default(0),
  
  // Mentor Effectiveness Metrics
  mentorUtilizationRate: decimal("mentor_utilization_rate", { precision: 5, scale: 2 }),
  averageMentorRating: decimal("average_mentor_rating", { precision: 5, scale: 2 }),
  mentorResponseTime: decimal("mentor_response_time", { precision: 8, scale: 2 }), // hours
  
  // Intervention Effectiveness
  interventionsInitiated: integer("interventions_initiated").default(0),
  interventionsCompleted: integer("interventions_completed").default(0),
  averageInterventionEffectiveness: decimal("average_intervention_effectiveness", { precision: 5, scale: 2 }),
  
  // AI System Performance
  aiRecommendationsGenerated: integer("ai_recommendations_generated").default(0),
  aiRecommendationsAccepted: integer("ai_recommendations_accepted").default(0),
  aiAccuracyRate: decimal("ai_accuracy_rate", { precision: 5, scale: 2 }),
  
  // Communication Metrics
  totalCommunications: integer("total_communications").default(0),
  averageResponseTimeHours: decimal("average_response_time_hours", { precision: 8, scale: 2 }),
  communicationSatisfactionScore: decimal("communication_satisfaction_score", { precision: 5, scale: 2 }),
  
  // Learning Path Effectiveness
  pathsCompleted: integer("paths_completed").default(0),
  averagePathCompletionRate: decimal("average_path_completion_rate", { precision: 5, scale: 2 }),
  pathsRequiringAdaptation: integer("paths_requiring_adaptation").default(0),
  
  // Risk Assessment Metrics
  studentsIdentifiedAtRisk: integer("students_identified_at_risk").default(0),
  riskPredictionAccuracy: decimal("risk_prediction_accuracy", { precision: 5, scale: 2 }),
  earlyInterventionSuccessRate: decimal("early_intervention_success_rate", { precision: 5, scale: 2 }),
  
  // System Usage & Performance
  averageSystemResponseTimeMs: decimal("average_system_response_time_ms", { precision: 10, scale: 2 }),
  systemUptimePercentage: decimal("system_uptime_percentage", { precision: 5, scale: 2 }),
  dataQualityScore: decimal("data_quality_score", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ============================================================================
// INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for form validation
export const insertEnhancedStudentProgressSchema = createInsertSchema(enhancedStudentProgress);
export const insertAdaptiveLearningPathSchema = createInsertSchema(adaptiveLearningPaths);
export const insertAiMentoringRecommendationSchema = createInsertSchema(aiMentoringRecommendations);
export const insertMentoringInterventionSchema = createInsertSchema(mentoringInterventions);
export const insertMentoringCommunicationSchema = createInsertSchema(mentoringCommunications);
export const insertMentorScheduleSchema = createInsertSchema(mentorSchedule);
export const insertMentoringAnalyticsSchema = createInsertSchema(mentoringAnalytics);

// Types for TypeScript usage
export type EnhancedStudentProgress = typeof enhancedStudentProgress.$inferSelect;
export type InsertEnhancedStudentProgress = z.infer<typeof insertEnhancedStudentProgressSchema>;

export type AdaptiveLearningPath = typeof adaptiveLearningPaths.$inferSelect;
export type InsertAdaptiveLearningPath = z.infer<typeof insertAdaptiveLearningPathSchema>;

export type AiMentoringRecommendation = typeof aiMentoringRecommendations.$inferSelect;
export type InsertAiMentoringRecommendation = z.infer<typeof insertAiMentoringRecommendationSchema>;

export type MentoringIntervention = typeof mentoringInterventions.$inferSelect;
export type InsertMentoringIntervention = z.infer<typeof insertMentoringInterventionSchema>;

export type MentoringCommunication = typeof mentoringCommunications.$inferSelect;
export type InsertMentoringCommunication = z.infer<typeof insertMentoringCommunicationSchema>;

export type MentorSchedule = typeof mentorSchedule.$inferSelect;
export type InsertMentorSchedule = z.infer<typeof insertMentorScheduleSchema>;

export type MentoringAnalytics = typeof mentoringAnalytics.$inferSelect;
export type InsertMentoringAnalytics = z.infer<typeof insertMentoringAnalyticsSchema>;

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

// Helper function to integrate with unified testing system
export function getUnifiedTestingIntegrationPoints() {
  return {
    // Points where mentoring system connects to unified testing
    testSessionAnalysis: "analyzeTestSessionForMentoring",
    progressFromTestResults: "updateProgressFromTestResults", 
    adaptiveLearningFromTests: "adaptLearningPathFromTestPerformance",
    interventionTriggersFromTests: "triggerInterventionsFromTestResults",
    aiInsightsFromTests: "generateAiInsightsFromTestData"
  };
}

// Helper constants for system configuration
export const MENTORING_SYSTEM_CONFIG = {
  DEFAULT_PROGRESS_UPDATE_FREQUENCY: "weekly",
  AI_ANALYSIS_CONFIDENCE_THRESHOLD: 75,
  INTERVENTION_PRIORITY_THRESHOLDS: {
    CRITICAL: 90,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25
  },
  LEARNING_PATH_ADAPTATION_TRIGGERS: {
    CONSECUTIVE_FAILURES: 3,
    PERFORMANCE_DROP_PERCENTAGE: 20,
    ENGAGEMENT_DROP_THRESHOLD: 60
  }
};