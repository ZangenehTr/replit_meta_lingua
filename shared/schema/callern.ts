import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date, time, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, courses, adminSettings, curriculumCategories, userAchievements, userStats, dailyGoals, achievements } from "./users";
import {
  aiActivitySessions, aiGrammarTracking, aiProgressTracking, aiPronunciationAnalysis, aiVocabularyTracking,
  chatConversations, chatMessages, aiTrainingData, aiKnowledgeBase, aiStudyPartners,
  walletTransactions, paymentIdempotency, coursePayments
} from "./ai";
import { aiModels, aiTrainingJobs, aiTrainingDatasets, aiDatasetItems, aiCallInsights } from "./ai-training";
import {
  bookReviews, teacherAssignments, paymentTransactions, teacherEvaluations, classObservations,
  book_categories, book_assets, book_orders, dictionary_lookups,
  insertBookSchema, insertBookAssetSchema, insertBookOrderSchema, insertDictionaryLookupSchema,
  insertCartSchema, insertCartItemSchema, insertOrderSchema
} from "./teaching";
import { leads, communicationLogs } from "./leads";
import {
  callernPresence, callernScoresStudent, callernScoresTeacher, callernScoringEvents, callernSpeechSegments,
  classEnrollments, classes, contentLibrary, enrollments, sessions,
  forumCategories, forumPosts, forumThreads,
  gameLeaderboards, gameLevels, games, gameSessions,
  gameQuestions, gameDailyChallenges, userDailyChallengeProgress, gameAnswerLogs,
  gradebookEntries, holidays, homework,
  messages, payments, notifications, pushNotifications, notificationDeliveryLogs,
  otpCodes,
  teacherCallernAuthorization, teacherCallernAvailability, teacherOnlineStatus,
  userGameProgress, peerMatchingRequests,
  studentRoadmapProgress, callernRoadmapSteps, callSessions, callernSyllabusTopics,
  callernPackages, callernCallHistory, callernRoadmaps,
  levelAssessmentQuestions, levelAssessmentResults, customRoles,
  institutes, departments, studentNotes, parentGuardians,
  supportTickets, supportTicketMessages,
  analyticsInsights, learningActivities, learningProblems, skillAssessments, progressSnapshots,
  mentorAssignments, mentoringSessions, scheduledObservations,
  courseRoadmapProgress, specialClasses,
  peerSocializerGroups, peerSocializerParticipants,
  sessionPackages, callPostReports, rooms,
  carts, cart_items, learningRecommendations, skillCorrelations, performancePatterns,
  insertLearningProblemSchema, insertLearningRecommendationSchema,
  insertSkillCorrelationSchema, insertPerformancePatternSchema, insertAnalyticsInsightSchema,
  smsLogMetadataSchema
} from "./social";
import {
  emailCampaigns, marketingCampaigns, platformCredentials, scheduledPosts,
  socialMediaAnalytics, socialMediaPosts, telegramMessages,
  testAnswers, testAttempts, testQuestions, tests, videoLessons,
  teacherObservationResponses, placementTests, placementQuestions,
  userProfiles, teacherAvailability, teacherAvailabilityPeriods,
  placementTestSessions, placementTestQuestions, placementTestResponses, placementResults,
  roadmapConfigs, roadmapPlans, roadmapSessions,
  rolePermissions, userSessions,
  threeDLessonContent, threeDVideoLessons, threeDLessonProgress,
  roadmapConfigInsertSchema, roadmapPlanInsertSchema, roadmapSessionInsertSchema,
  insertThreeDLessonContentSchema, insertThreeDVideoLessonSchema, insertThreeDLessonProgressSchema
} from "./marketing";
import {
  linguaquestAudioAssets, linguaquestAudioJobs, linguaquestCefrLevels, linguaquestLeaderboardEntries,
  guestProgressTracking, linguaquestContentBank, linguaquestLessonFeedback, voiceExercisesGuest,
  freemiumConversionTracking, visitorAchievements, linguaquestLessons,
  thirdPartyApis, iranianCalendarSettings, calendarEventsIranian, holidayCalendarPersian,
  insertThirdPartyApiSchema, insertIranianCalendarSettingsSchema,
  insertCalendarEventsIranianSchema, insertHolidayCalendarPersianSchema,
  insertLinguaquestLessonSchema, insertGuestProgressTrackingSchema,
  insertLinguaquestContentBankSchema, insertLinguaquestLessonFeedbackSchema,
  insertVoiceExercisesGuestSchema, insertFreemiumConversionTrackingSchema,
  insertVisitorAchievementSchema
} from "./linguaquest";
import {
  videoProgress, videoNotes, videoBookmarks, trialLessons, teacherTrialAvailability, invoices,
  order_items, user_addresses, shipping_orders, courier_tracking, orders,
  insertOrderItemSchema, insertUserAddressSchema, insertShippingOrderSchema, insertCourierTrackingSchema
} from "./curriculum-ext";
import { books, attendanceRecords, studentReports, insertBookCategorySchema } from "./teaching";

// ===== COMPREHENSIVE TESTING SUBSYSTEM =====

// Tests/Quizzes

// Test Questions - supports 8 question types

// Test Attempts

// Test Answers

// ===== GAMIFICATION SUBSYSTEM =====

// Language Learning Games

// Game Levels/Stages

// User Game Progress

// Game Sessions

// Game Leaderboards

// Game Access Rules - Define automatic rules for game visibility

// Student Game Assignments - Direct assignment of games to students

// Course Games - Associate games with courses

// Game Questions Table - Stores actual game content

// Daily Challenges Table

// User Daily Challenge Progress

// Game Answer Logs - Track every answer for analytics

// Insert schemas for game system




// Game system types
export type GameQuestion = typeof gameQuestions.$inferSelect;
export type InsertGameQuestion = typeof gameQuestions.$inferInsert;
export type GameDailyChallenge = typeof gameDailyChallenges.$inferSelect;
export type InsertGameDailyChallenge = typeof gameDailyChallenges.$inferInsert;
export type UserDailyChallengeProgress = typeof userDailyChallengeProgress.$inferSelect;
export type InsertUserDailyChallengeProgress = typeof userDailyChallengeProgress.$inferInsert;
export type GameAnswerLog = typeof gameAnswerLogs.$inferSelect;
export type InsertGameAnswerLog = typeof gameAnswerLogs.$inferInsert;

// ===== VIDEO-BASED COURSES SUBSYSTEM =====

// Video Lessons

// Video Progress Tracking

// Video Notes

// Video Bookmarks

// ===== ENHANCED LMS FEATURES =====

// Discussion Forums



// Gradebook

// Content Library

// ===== AI INTEGRATION FOR COMPREHENSIVE TRACKING =====

// AI Progress Tracking

// AI Activity Sessions

// AI Vocabulary Tracking

// AI Grammar Pattern Tracking

// AI Pronunciation Analysis

// TEACHER EVALUATIONS (Supervisor)

// Insert schema for teacher evaluations

// CLASS OBSERVATIONS (Supervisor)

// Insert schema for class observations

// SYSTEM METRICS (Admin)

// Insert schema for system metrics

// MENTOR ASSIGNMENTS (Mentor Dashboard)

// MENTORING SESSIONS 

// Insert schemas for mentor assignments and mentoring sessions


// BRANCHES - Institute branch management

// Insert schema for branches and rooms

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert & { 
  userId?: number | null;
  phoneNumber?: string | null;
  email?: string | null;
  channel?: string | null;
  ip?: string | null;
  locale?: string | null;
};
export type Course = typeof courses.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = typeof classEnrollments.$inferInsert;
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
// export type SessionVideoProgress = typeof sessionVideoProgress.$inferSelect; // TABLE_UNDEFINED
// export type InsertSessionVideoProgress = typeof sessionVideoProgress.$inferInsert; // TABLE_UNDEFINED
// export type SessionVideoNote = typeof sessionVideoNotes.$inferSelect; // TABLE_UNDEFINED
// export type InsertSessionVideoNote = typeof sessionVideoNotes.$inferInsert; // TABLE_UNDEFINED
// export type SessionVideoBookmark = typeof sessionVideoBookmarks.$inferSelect; // TABLE_UNDEFINED
// export type InsertSessionVideoBookmark = typeof sessionVideoBookmarks.$inferInsert; // TABLE_UNDEFINED
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Homework = typeof homework.$inferSelect;
export type InsertHomework = typeof homework.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type SessionPackage = typeof sessionPackages.$inferSelect;
export type InsertSessionPackage = typeof sessionPackages.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;
export type PaymentIdempotency = typeof paymentIdempotency.$inferSelect;
export type InsertPaymentIdempotency = typeof paymentIdempotency.$inferInsert;
export type CoursePayment = typeof coursePayments.$inferSelect;
export type InsertCoursePayment = typeof coursePayments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type InsertDailyGoal = typeof dailyGoals.$inferInsert;
export type LevelAssessmentQuestion = typeof levelAssessmentQuestions.$inferSelect;
export type InsertLevelAssessmentQuestion = typeof levelAssessmentQuestions.$inferInsert;
export type LevelAssessmentResult = typeof levelAssessmentResults.$inferSelect;
export type InsertLevelAssessmentResult = typeof levelAssessmentResults.$inferInsert;
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = typeof customRoles.$inferInsert;

// CRM Types
export type Institute = typeof institutes.$inferSelect;
export type InsertInstitute = typeof institutes.$inferInsert;
// Branding type aliases (used in storage layer)
export type InstituteBranding = Institute;
export type InsertBranding = InsertInstitute;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;
// export type StudentGroup = typeof studentGroups.$inferSelect; // TABLE_UNDEFINED
// export type InsertStudentGroup = typeof studentGroups.$inferInsert; // TABLE_UNDEFINED
// export type StudentGroupMember = typeof studentGroupMembers.$inferSelect; // TABLE_UNDEFINED
// export type InsertStudentGroupMember = typeof studentGroupMembers.$inferInsert; // TABLE_UNDEFINED
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type InsertTeacherAssignment = typeof teacherAssignments.$inferInsert;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;
export type StudentNote = typeof studentNotes.$inferSelect;
export type InsertStudentNote = typeof studentNotes.$inferInsert;
export type ParentGuardian = typeof parentGuardians.$inferSelect;
export type InsertParentGuardian = typeof parentGuardians.$inferInsert;
export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = typeof communicationLogs.$inferInsert;
export type StudentReport = typeof studentReports.$inferSelect;
export type InsertStudentReport = typeof studentReports.$inferInsert;

// Admin Settings table

// Admin settings schema - temporarily commented out
// export const insertAdminSettingsSchema = (createInsertSchema(adminSettings) as any).omit({ id: true, createdAt: true, updatedAt: true });

// Referral System Types
// export type ReferralSettings = typeof referralSettings.$inferSelect; // TABLE_UNDEFINED
// export type InsertReferralSettings = typeof referralSettings.$inferInsert; // TABLE_UNDEFINED
// export type CourseReferral = typeof courseReferrals.$inferSelect; // TABLE_UNDEFINED
// export type InsertCourseReferral = typeof courseReferrals.$inferInsert; // TABLE_UNDEFINED
// export type ReferralCommission = typeof referralCommissions.$inferSelect; // TABLE_UNDEFINED
// export type InsertReferralCommission = typeof referralCommissions.$inferInsert; // TABLE_UNDEFINED
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = typeof adminSettings.$inferInsert;

// AI Training Data Types
export type AiTrainingData = typeof aiTrainingData.$inferSelect;
export type InsertAiTrainingData = typeof aiTrainingData.$inferInsert;
export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAiKnowledgeBase = typeof aiKnowledgeBase.$inferInsert;

// Skill Assessment Types
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = typeof skillAssessments.$inferInsert;
export type LearningActivity = typeof learningActivities.$inferSelect;
export type InsertLearningActivity = typeof learningActivities.$inferInsert;
export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;
export type InsertProgressSnapshot = typeof progressSnapshots.$inferInsert;

// Additional Real Data System Types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type TeacherEvaluation = typeof teacherEvaluations.$inferSelect;
export type InsertTeacherEvaluation = typeof teacherEvaluations.$inferInsert;
export type ClassObservation = typeof classObservations.$inferSelect;
export type InsertClassObservation = typeof classObservations.$inferInsert;
// export type SystemMetric = typeof systemMetrics.$inferSelect; // TABLE_UNDEFINED
// export type InsertSystemMetric = typeof systemMetrics.$inferInsert; // TABLE_UNDEFINED
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;
export type MentorAssignment = typeof mentorAssignments.$inferSelect;
export type InsertMentorAssignment = typeof mentorAssignments.$inferInsert;
export type MentoringSession = typeof mentoringSessions.$inferSelect;
export type InsertMentoringSession = typeof mentoringSessions.$inferInsert;
// export type Branch = typeof branches.$inferSelect; // TABLE_UNDEFINED
// export type InsertBranch = typeof branches.$inferInsert; // TABLE_UNDEFINED

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
} from "../mood-schema";

// Testing subsystem insert schemas - temporarily commented out
// export const insertTestSchema = (createInsertSchema(tests) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestQuestionSchema = (createInsertSchema(testQuestions) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestAttemptSchema = (createInsertSchema(testAttempts) as any).omit({ id: true, createdAt: true });
// export const insertTestAnswerSchema = (createInsertSchema(testAnswers) as any).omit({ id: true, answeredAt: true });

// Gamification insert schemas - temporarily commented out
// export const insertGameSchema = (createInsertSchema(games) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameLevelSchema = (createInsertSchema(gameLevels) as any).omit({ id: true, createdAt: true });
// export const insertUserGameProgressSchema = (createInsertSchema(userGameProgress) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameSessionSchema = (createInsertSchema(gameSessions) as any).omit({ id: true, startedAt: true, createdAt: true });
// export const insertGameLeaderboardSchema = (createInsertSchema(gameLeaderboards) as any).omit({ id: true, createdAt: true });

// Video learning insert schemas - temporarily commented out
// export const insertVideoLessonSchema = (createInsertSchema(videoLessons) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoProgressSchema = (createInsertSchema(videoProgress) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoNoteSchema = (createInsertSchema(videoNotes) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoBookmarkSchema = (createInsertSchema(videoBookmarks) as any).omit({ id: true, createdAt: true });

// LMS insert schemas - temporarily commented out
// export const insertForumCategorySchema = (createInsertSchema(forumCategories) as any).omit({ id: true, createdAt: true });
// export const insertForumThreadSchema = (createInsertSchema(forumThreads) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertForumPostSchema = (createInsertSchema(forumPosts) as any).omit({ id: true, createdAt: true });
// export const insertGradebookEntrySchema = (createInsertSchema(gradebookEntries) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertContentLibrarySchema = (createInsertSchema(contentLibrary) as any).omit({ id: true, createdAt: true, updatedAt: true });

// AI tracking insert schemas - temporarily commented out
// export const insertAiProgressTrackingSchema = (createInsertSchema(aiProgressTracking) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertAiActivitySessionSchema = (createInsertSchema(aiActivitySessions) as any).omit({ id: true, startedAt: true, createdAt: true });
// export const insertAiVocabularyTrackingSchema = (createInsertSchema(aiVocabularyTracking) as any).omit({ id: true, firstSeenAt: true, createdAt: true });
// export const insertAiGrammarTrackingSchema = (createInsertSchema(aiGrammarTracking) as any).omit({ id: true, createdAt: true });
// export const insertAiPronunciationAnalysisSchema = (createInsertSchema(aiPronunciationAnalysis) as any).omit({ id: true, createdAt: true });

// Types for new subsystem tables
export type Test = typeof tests.$inferSelect;
export type InsertTest = typeof tests.$inferInsert;
export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = typeof testQuestions.$inferInsert;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = typeof testAttempts.$inferInsert;
export type TestAnswer = typeof testAnswers.$inferSelect;
export type InsertTestAnswer = typeof testAnswers.$inferInsert;

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type GameLevel = typeof gameLevels.$inferSelect;
export type InsertGameLevel = typeof gameLevels.$inferInsert;
export type UserGameProgress = typeof userGameProgress.$inferSelect;
export type InsertUserGameProgress = typeof userGameProgress.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;
export type GameLeaderboard = typeof gameLeaderboards.$inferSelect;
export type InsertGameLeaderboard = typeof gameLeaderboards.$inferInsert;

export type VideoLesson = typeof videoLessons.$inferSelect;
export type InsertVideoLesson = typeof videoLessons.$inferInsert;
export type VideoProgress = typeof videoProgress.$inferSelect;
export type InsertVideoProgress = typeof videoProgress.$inferInsert;
export type VideoNote = typeof videoNotes.$inferSelect;
export type InsertVideoNote = typeof videoNotes.$inferInsert;
export type VideoBookmark = typeof videoBookmarks.$inferSelect;
export type InsertVideoBookmark = typeof videoBookmarks.$inferInsert;

export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = typeof forumCategories.$inferInsert;
export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = typeof forumThreads.$inferInsert;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;
export type GradebookEntry = typeof gradebookEntries.$inferSelect;
export type InsertGradebookEntry = typeof gradebookEntries.$inferInsert;
export type ContentLibraryItem = typeof contentLibrary.$inferSelect;
export type InsertContentLibraryItem = typeof contentLibrary.$inferInsert;

export type AiProgressTracking = typeof aiProgressTracking.$inferSelect;
export type InsertAiProgressTracking = typeof aiProgressTracking.$inferInsert;
export type AiActivitySession = typeof aiActivitySessions.$inferSelect;
export type InsertAiActivitySession = typeof aiActivitySessions.$inferInsert;
export type AiVocabularyTracking = typeof aiVocabularyTracking.$inferSelect;
export type InsertAiVocabularyTracking = typeof aiVocabularyTracking.$inferInsert;
export type AiGrammarTracking = typeof aiGrammarTracking.$inferSelect;
export type InsertAiGrammarTracking = typeof aiGrammarTracking.$inferInsert;
export type AiPronunciationAnalysis = typeof aiPronunciationAnalysis.$inferSelect;
export type InsertAiPronunciationAnalysis = typeof aiPronunciationAnalysis.$inferInsert;

// ===== MODERN COMMUNICATION SYSTEM =====

// Support Tickets

// Support Ticket Messages

// Chat Conversations

// Chat Messages

// AI Study Partner Configuration

// Push Notifications

// Notification Delivery Logs

// Insert schemas for communication system







// Communication system types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = typeof supportTicketMessages.$inferInsert;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type AiStudyPartner = typeof aiStudyPartners.$inferSelect;
export type InsertAiStudyPartner = typeof aiStudyPartners.$inferInsert;
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = typeof pushNotifications.$inferInsert;
export type NotificationDeliveryLog = typeof notificationDeliveryLogs.$inferSelect;
export type InsertNotificationDeliveryLog = typeof notificationDeliveryLogs.$inferInsert;

// AI Call Insights Table for CRM Integration

// Teacher Availability Table (DEPRECATED)
// This table is kept only for compatibility views during migration
// DO NOT use directly - all new code should use teacherAvailabilityPeriods

// Teacher Availability Periods - CANONICAL SOURCE for teacher availability
// This is the single source of truth for all teacher availability data

// Teacher Availability Schema (Legacy)

export type TeacherAvailability = typeof teacherAvailability.$inferSelect;
export type InsertTeacherAvailability = typeof teacherAvailability.$inferInsert;

// Enhanced Teacher Availability Periods Schema

export type TeacherAvailabilityPeriod = typeof teacherAvailabilityPeriods.$inferSelect;
export type InsertTeacherAvailabilityPeriod = typeof teacherAvailabilityPeriods.$inferInsert;

// AI Call Insights Schema

export type AICallInsight = typeof aiCallInsights.$inferSelect;
export type InsertAICallInsight = typeof aiCallInsights.$inferInsert;

// Supervision observation types (continued)
export type TeacherObservationResponse = typeof teacherObservationResponses.$inferSelect;
export type InsertTeacherObservationResponse = typeof teacherObservationResponses.$inferInsert;
export type ScheduledObservation = typeof scheduledObservations.$inferSelect;
export type InsertScheduledObservation = typeof scheduledObservations.$inferInsert;

// ===== CALLERN LIVE SCORING SYSTEM =====

// Track camera/mic presence for scoring

// Speech segments from ASR processing

// Student scoring for each lesson

// Teacher scoring for each lesson

// Real-time scoring events

// Insert schemas for scoring
export const insertCallernPresenceSchema = (createInsertSchema(callernPresence) as any).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertCallernSpeechSegmentSchema = (createInsertSchema(callernSpeechSegments) as any).omit({ 
  id: true, createdAt: true 
});
export const insertCallernScoresStudentSchema = (createInsertSchema(callernScoresStudent) as any).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertCallernScoresTeacherSchema = (createInsertSchema(callernScoresTeacher) as any).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertCallernScoringEventSchema = (createInsertSchema(callernScoringEvents) as any).omit({ 
  id: true, createdAt: true 
});

// Teacher authorization insert schemas
export const insertTeacherCallernAuthorizationSchema = (createInsertSchema(teacherCallernAuthorization) as any).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertTeacherCallernAvailabilitySchema = (createInsertSchema(teacherCallernAvailability) as any).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertTeacherOnlineStatusSchema = (createInsertSchema(teacherOnlineStatus) as any).omit({ 
  id: true 
});


// Scoring types
export type CallernPresence = typeof callernPresence.$inferSelect;
export type InsertCallernPresence = typeof callernPresence.$inferInsert;
export type CallernSpeechSegment = typeof callernSpeechSegments.$inferSelect;
export type InsertCallernSpeechSegment = typeof callernSpeechSegments.$inferInsert;
export type CallernScoresStudent = typeof callernScoresStudent.$inferSelect;
export type InsertCallernScoresStudent = typeof callernScoresStudent.$inferInsert;
export type CallernScoresTeacher = typeof callernScoresTeacher.$inferSelect;
export type InsertCallernScoresTeacher = typeof callernScoresTeacher.$inferInsert;
export type CallernScoringEvent = typeof callernScoringEvents.$inferSelect;
export type InsertCallernScoringEvent = typeof callernScoringEvents.$inferInsert;

// Teacher authorization types
export type TeacherCallernAuthorization = typeof teacherCallernAuthorization.$inferSelect;
export type InsertTeacherCallernAuthorization = typeof teacherCallernAuthorization.$inferInsert;
export type TeacherCallernAvailability = typeof teacherCallernAvailability.$inferSelect;
export type InsertTeacherCallernAvailability = typeof teacherCallernAvailability.$inferInsert;
export type TeacherOnlineStatus = typeof teacherOnlineStatus.$inferSelect;
export type InsertTeacherOnlineStatus = z.infer<typeof insertTeacherOnlineStatusSchema>;

// ========================
// CALLERN ROADMAP TEMPLATE SYSTEM (New Implementation)
// ========================

// Roadmap Templates - Reusable learning path definitions

// Roadmap Units - Major sections within a template

// Roadmap Lessons - Individual lessons within units

// Roadmap Activities - Specific activities within lessons

// ========================
// ROADMAP INSTANCES & PROGRESS
// ========================

// Roadmap Instances - Instantiated roadmaps for courses/students

// Activity Instances - Individual activity instances with progress

// ========================
// CALLERN SESSION SYSTEM
// ========================

// CallerN Call Sessions - Actual video call sessions

// Post-Session Reports - Teacher confirmations and AI summaries

// Session Ratings - Student and teacher ratings

// ========================
// SRS (SPACED REPETITION SYSTEM)
// ========================

// SRS Cards - Spaced repetition flashcards

// ========================
// SPECIAL CLASSES SYSTEM
// ========================

// Special Classes - admin-flagged featured classes for dashboard showcase

// ========================
// PEER SOCIALIZER SYSTEM
// ========================

// Peer Socializer Groups/Rooms for language practice

// Peer Socializer Participants - tracks who joins which groups

// Peer Matching Requests - for intelligent matching system

// Peer Matching History - tracks successful matches and quality

// Peer Socializer Settings - user preferences for matching

// ========================
// INSERT SCHEMAS AND TYPES
// ========================

// Roadmap Template System Insert Schemas






// CallerN Session System Insert Schemas




// Special Classes System Insert Schemas  

// Peer Socializer System Insert Schemas





// Missing insert schemas for tables identified in consolidation









// ========================
// TYPE EXPORTS
// ========================

// Roadmap Template System Types
// export type RoadmapTemplate = typeof roadmapTemplate.$inferSelect; // TABLE_UNDEFINED
// export type InsertRoadmapTemplate = typeof roadmapTemplate.$inferInsert; // TABLE_UNDEFINED
// export type RoadmapUnit = typeof roadmapUnit.$inferSelect; // TABLE_UNDEFINED
// export type InsertRoadmapUnit = typeof roadmapUnit.$inferInsert; // TABLE_UNDEFINED
// export type RoadmapLesson = typeof roadmapLesson.$inferSelect; // TABLE_UNDEFINED
// export type InsertRoadmapLesson = typeof roadmapLesson.$inferInsert; // TABLE_UNDEFINED
// export type RoadmapActivity = typeof roadmapActivity.$inferSelect; // TABLE_UNDEFINED
// export type InsertRoadmapActivity = typeof roadmapActivity.$inferInsert; // TABLE_UNDEFINED
// export type RoadmapInstance = typeof roadmapInstance.$inferSelect; // TABLE_UNDEFINED
// export type InsertRoadmapInstance = typeof roadmapInstance.$inferInsert; // TABLE_UNDEFINED
// export type ActivityInstance = typeof activityInstance.$inferSelect; // TABLE_UNDEFINED
// export type InsertActivityInstance = typeof activityInstance.$inferInsert; // TABLE_UNDEFINED

// CallerN Session System Types
export type CallSession = typeof callSessions.$inferSelect;
export type InsertCallSession = typeof callSessions.$inferInsert;
export type CallPostReport = typeof callPostReports.$inferSelect;
export type InsertCallPostReport = typeof callPostReports.$inferInsert;
// export type SrsCard = typeof srsCard.$inferSelect; // TABLE_UNDEFINED
// export type InsertSrsCard = typeof srsCard.$inferInsert; // TABLE_UNDEFINED

// Course Roadmap Progress types (fixed)
export type CourseRoadmapProgress = typeof courseRoadmapProgress.$inferSelect;
export type InsertCourseRoadmapProgress = typeof courseRoadmapProgress.$inferInsert;

// Special Classes System Types
export type SpecialClass = typeof specialClasses.$inferSelect;
export type InsertSpecialClass = typeof specialClasses.$inferInsert;

// Peer Socializer System Types
export type PeerSocializerGroup = typeof peerSocializerGroups.$inferSelect;
export type InsertPeerSocializerGroup = typeof peerSocializerGroups.$inferInsert;
export type PeerSocializerParticipant = typeof peerSocializerParticipants.$inferSelect;
export type InsertPeerSocializerParticipant = typeof peerSocializerParticipants.$inferInsert;
export type PeerMatchingRequest = typeof peerMatchingRequests.$inferSelect;
export type InsertPeerMatchingRequest = typeof peerMatchingRequests.$inferInsert;
// export type PeerMatchingHistory = typeof peerMatchingHistory.$inferSelect; // TABLE_UNDEFINED
// export type InsertPeerMatchingHistory = typeof peerMatchingHistory.$inferInsert; // TABLE_UNDEFINED
// export type PeerSocializerSettings = typeof peerSocializerSettings.$inferSelect; // TABLE_UNDEFINED
// export type InsertPeerSocializerSettings = typeof peerSocializerSettings.$inferInsert; // TABLE_UNDEFINED

// Class Group Chats - Telegram-like environment for group classes

// Socializer Sessions - Track AI matching for CallernN

// Create insert schemas


// Export types
// export type ClassGroupChat = typeof classGroupChats.$inferSelect; // TABLE_UNDEFINED
// export type InsertClassGroupChat = typeof classGroupChats.$inferInsert; // TABLE_UNDEFINED
// export type SocializerSession = typeof socializerSessions.$inferSelect; // TABLE_UNDEFINED
// export type InsertSocializerSession = typeof socializerSessions.$inferInsert; // TABLE_UNDEFINED

// ============================================================================
// EXAM-FOCUSED PERSONALIZED ROADMAP SYSTEM
// ============================================================================

// Exam Types and Enums
export const ExamType = {
  IELTS_ACADEMIC: 'IELTS_ACADEMIC',
  IELTS_GENERAL: 'IELTS_GENERAL',
  TOEFL_IBT: 'TOEFL_IBT',
  PTE_ACADEMIC: 'PTE_ACADEMIC',
  PTE_CORE: 'PTE_CORE'
} as const;

export type ExamTypeValues = typeof ExamType[keyof typeof ExamType];

export const CEFRLevel = {
  A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1', C2: 'C2',
} as const;

export type CEFRLevelValues = typeof CEFRLevel[keyof typeof CEFRLevel];

export const PreferredPace = {
  INTENSIVE: 'INTENSIVE',
  REGULAR: 'REGULAR',
  RELAXED: 'RELAXED',
} as const;

export type PreferredPaceValues = typeof PreferredPace[keyof typeof PreferredPace];

export const SessionType = {
  ONE_ON_ONE: 'ONE_ON_ONE',
  GROUP: 'GROUP',
  SELF_STUDY: 'SELF_STUDY',
} as const;

export type SessionTypeValues = typeof SessionType[keyof typeof SessionType];

export const IELTS_TO_CEFR_MAPPING: Record<number, CEFRLevelValues> = {
  1.0: 'A1', 1.5: 'A1', 2.0: 'A1', 2.5: 'A1', 3.0: 'A1',
  3.5: 'A2', 4.0: 'A2',
  4.5: 'B1', 5.0: 'B1', 5.5: 'B1',
  6.0: 'B2', 6.5: 'B2',
  7.0: 'C1', 7.5: 'C1', 8.0: 'C1',
  8.5: 'C2', 9.0: 'C2',
};

export const BASE_HOURS_BY_LEVEL: Record<CEFRLevelValues, number> = {
  A1: 80, A2: 100, B1: 150, B2: 200, C1: 250, C2: 300,
};

// Roadmap Configurations - User exam goals and preferences

// Roadmap Plans - Generated study plans based on user goals

// Roadmap Sessions - Individual study sessions within the plan

// ============================================================================
// SCORE MAPPING AND CONVERSION DATA
// ============================================================================

// IELTS Score to CEFR Mapping (Academic & General)

// TOEFL iBT Score to CEFR Mapping

// PTE Academic Score to CEFR Mapping

// Study Hours Required for CEFR Level Progression

// Base study hours by current level (to reach next level)

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

// Placement Questions - Question bank for placement tests


// Insert schema for AI conversations

// AI Conversation types
// export type AiConversation = typeof aiConversations.$inferSelect; // TABLE_UNDEFINED
// export type InsertAiConversation = typeof aiConversations.$inferInsert; // TABLE_UNDEFINED


// ============================================================================
// MST (Multi-Stage Test) Schema
// ============================================================================




// MST Insert Schemas

// MST Types



// User Sessions for authentication

// Password Reset Tokens

// ============================================================================
// CURRICULUM SYSTEM TABLES
// ============================================================================

// Main curriculum tracks (IELTS and Conversation)

// Curriculum levels (Flash IELTS 1, A1.1, A1.2, etc.)

// Links courses to curriculum levels (many-to-many relationship)

// Student progress through curriculum levels

// Course enrollments

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
// export const insertOtpCodeSchema = (createInsertSchema(otpCodes) as any).omit({ id: true, createdAt: true });
// Holidays table for managing institute holidays (used for class end date calculation)

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

// Skill tracking insert schemas - MOVED TO END OF FILE TO AVOID FORWARD REFERENCE ERRORS

// LEAD MANAGEMENT SYSTEM (Call Center)

// Insert schema for leads

// Lead types

// COMMUNICATION LOGS (Call Center)

// Insert schema for communication logs

// FINANCIAL SYSTEM (Accountant)

// Insert schema for invoices

// PAYMENT TRANSACTIONS (Iranian Shetab Integration)

// Insert schema for payment transactions

// ===== COMPREHENSIVE TESTING SUBSYSTEM =====

// Tests/Quizzes

// Test Questions - supports 8 question types

// Test Attempts

// Test Answers

// ===== GAMIFICATION SUBSYSTEM =====

// Language Learning Games

// Game Levels/Stages

// User Game Progress

// Game Sessions

// Game Leaderboards

// Game Access Rules - Define automatic rules for game visibility

// Student Game Assignments - Direct assignment of games to students

// Course Games - Associate games with courses

// Game Questions Table - Stores actual game content

// Daily Challenges Table

// User Daily Challenge Progress

// Game Answer Logs - Track every answer for analytics

// Insert schemas for game system




// Game system types

// ===== VIDEO-BASED COURSES SUBSYSTEM =====

// Video Lessons

// Video Progress Tracking

// Video Notes

// Video Bookmarks

// ===== ENHANCED LMS FEATURES =====

// Discussion Forums



// Gradebook

// Content Library

// ===== AI INTEGRATION FOR COMPREHENSIVE TRACKING =====

// AI Progress Tracking

// AI Activity Sessions

// AI Vocabulary Tracking

// AI Grammar Pattern Tracking

// AI Pronunciation Analysis

// TEACHER EVALUATIONS (Supervisor)

// Insert schema for teacher evaluations

// CLASS OBSERVATIONS (Supervisor)

// Insert schema for class observations

// SYSTEM METRICS (Admin)

// Insert schema for system metrics

// MENTOR ASSIGNMENTS (Mentor Dashboard)

// MENTORING SESSIONS 

// Insert schemas for mentor assignments and mentoring sessions


// BRANCHES - Institute branch management

// Insert schema for branches and rooms

// Types

// CRM Types
// Branding type aliases (used in storage layer)

// Admin Settings table

// Admin settings schema - temporarily commented out
// export const insertAdminSettingsSchema = (createInsertSchema(adminSettings) as any).omit({ id: true, createdAt: true, updatedAt: true });

// Referral System Types

// AI Training Data Types

// Skill Assessment Types

// Additional Real Data System Types

// Testing subsystem insert schemas - temporarily commented out
// export const insertTestSchema = (createInsertSchema(tests) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestQuestionSchema = (createInsertSchema(testQuestions) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertTestAttemptSchema = (createInsertSchema(testAttempts) as any).omit({ id: true, createdAt: true });
// export const insertTestAnswerSchema = (createInsertSchema(testAnswers) as any).omit({ id: true, answeredAt: true });

// Gamification insert schemas - temporarily commented out
// export const insertGameSchema = (createInsertSchema(games) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameLevelSchema = (createInsertSchema(gameLevels) as any).omit({ id: true, createdAt: true });
// export const insertUserGameProgressSchema = (createInsertSchema(userGameProgress) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertGameSessionSchema = (createInsertSchema(gameSessions) as any).omit({ id: true, startedAt: true, createdAt: true });
// export const insertGameLeaderboardSchema = (createInsertSchema(gameLeaderboards) as any).omit({ id: true, createdAt: true });

// Video learning insert schemas - temporarily commented out
// export const insertVideoLessonSchema = (createInsertSchema(videoLessons) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoProgressSchema = (createInsertSchema(videoProgress) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoNoteSchema = (createInsertSchema(videoNotes) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertVideoBookmarkSchema = (createInsertSchema(videoBookmarks) as any).omit({ id: true, createdAt: true });

// LMS insert schemas - temporarily commented out
// export const insertForumCategorySchema = (createInsertSchema(forumCategories) as any).omit({ id: true, createdAt: true });
// export const insertForumThreadSchema = (createInsertSchema(forumThreads) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertForumPostSchema = (createInsertSchema(forumPosts) as any).omit({ id: true, createdAt: true });
// export const insertGradebookEntrySchema = (createInsertSchema(gradebookEntries) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertContentLibrarySchema = (createInsertSchema(contentLibrary) as any).omit({ id: true, createdAt: true, updatedAt: true });

// AI tracking insert schemas - temporarily commented out
// export const insertAiProgressTrackingSchema = (createInsertSchema(aiProgressTracking) as any).omit({ id: true, createdAt: true, updatedAt: true });
// export const insertAiActivitySessionSchema = (createInsertSchema(aiActivitySessions) as any).omit({ id: true, startedAt: true, createdAt: true });
// export const insertAiVocabularyTrackingSchema = (createInsertSchema(aiVocabularyTracking) as any).omit({ id: true, firstSeenAt: true, createdAt: true });
// export const insertAiGrammarTrackingSchema = (createInsertSchema(aiGrammarTracking) as any).omit({ id: true, createdAt: true });
// export const insertAiPronunciationAnalysisSchema = (createInsertSchema(aiPronunciationAnalysis) as any).omit({ id: true, createdAt: true });

// Types for new subsystem tables





// ===== MODERN COMMUNICATION SYSTEM =====

// Support Tickets

// Support Ticket Messages

// Chat Conversations

// Chat Messages

// AI Study Partner Configuration

// Push Notifications

// Notification Delivery Logs

// Insert schemas for communication system







// Communication system types

// AI Call Insights Table for CRM Integration

// Teacher Availability Table (DEPRECATED)
// This table is kept only for compatibility views during migration
// DO NOT use directly - all new code should use teacherAvailabilityPeriods

// Teacher Availability Periods - CANONICAL SOURCE for teacher availability
// This is the single source of truth for all teacher availability data

// Teacher Availability Schema (Legacy)


// Enhanced Teacher Availability Periods Schema


// AI Call Insights Schema


// Supervision observation types (continued)

// ===== CALLERN LIVE SCORING SYSTEM =====

// Track camera/mic presence for scoring

// Speech segments from ASR processing

// Student scoring for each lesson

// Teacher scoring for each lesson

// Real-time scoring events

// Insert schemas for scoring





// Scoring types

// ========================
// CALLERN ROADMAP TEMPLATE SYSTEM (New Implementation)
// ========================

// Roadmap Templates - Reusable learning path definitions

// Roadmap Units - Major sections within a template

// Roadmap Lessons - Individual lessons within units

// Roadmap Activities - Specific activities within lessons

// ========================
// ROADMAP INSTANCES & PROGRESS
// ========================

// Roadmap Instances - Instantiated roadmaps for courses/students

// Activity Instances - Individual activity instances with progress

// ========================
// CALLERN SESSION SYSTEM
// ========================

// CallerN Call Sessions - Actual video call sessions

// Post-Session Reports - Teacher confirmations and AI summaries

// Session Ratings - Student and teacher ratings

// ========================
// SRS (SPACED REPETITION SYSTEM)
// ========================

// SRS Cards - Spaced repetition flashcards

// ========================
// SPECIAL CLASSES SYSTEM
// ========================

// Special Classes - admin-flagged featured classes for dashboard showcase

// ========================
// PEER SOCIALIZER SYSTEM
// ========================

// Peer Socializer Groups/Rooms for language practice

// Peer Socializer Participants - tracks who joins which groups

// Peer Matching Requests - for intelligent matching system

// Peer Matching History - tracks successful matches and quality

// Peer Socializer Settings - user preferences for matching

// ========================
// INSERT SCHEMAS AND TYPES
// ========================

// Roadmap Template System Insert Schemas






// CallerN Session System Insert Schemas




// Special Classes System Insert Schemas  

// Peer Socializer System Insert Schemas





// Missing insert schemas for tables identified in consolidation









// ========================
// TYPE EXPORTS
// ========================

// Roadmap Template System Types

// CallerN Session System Types

// Course Roadmap Progress types (fixed)

// Special Classes System Types

// Peer Socializer System Types

// Class Group Chats - Telegram-like environment for group classes

// Socializer Sessions - Track AI matching for CallernN

// Create insert schemas


// Export types

// ============================================================================
// EXAM-FOCUSED PERSONALIZED ROADMAP SYSTEM
// ============================================================================

// Exam Types and Enums








// Roadmap Configurations - User exam goals and preferences

// Roadmap Plans - Generated study plans based on user goals

// Roadmap Sessions - Individual study sessions within the plan

// ============================================================================
// SCORE MAPPING AND CONVERSION DATA
// ============================================================================

// IELTS Score to CEFR Mapping (Academic & General)

// TOEFL iBT Score to CEFR Mapping

// PTE Academic Score to CEFR Mapping

// Study Hours Required for CEFR Level Progression

// Base study hours by current level (to reach next level)

// ============================================================================
// HELPER FUNCTIONS FOR SCORE CONVERSION
// ============================================================================

/**
 * Convert exam score to CEFR level
 */

/**
 * Calculate required study hours based on current and target CEFR levels
 */

/**
 * Calculate sessions per week based on available hours and session duration
 */

/**
 * Get minimum recommended score for CEFR level by exam type
 */

// ============================================================================
// PLACEMENT TEST SYSTEM TABLES
// ============================================================================

// Placement Tests - Master test definitions

// Placement Questions - Question bank for placement tests

// Placement Test Sessions - Individual test attempts (matches actual database structure)

// Placement Results - Final placement recommendations

// Insert schemas for placement test system

// Types for placement test system
export type PlacementTest = typeof placementTests.$inferSelect;
export type InsertPlacementTest = typeof placementTests.$inferInsert;
export type PlacementQuestion = typeof placementQuestions.$inferSelect;
export type InsertPlacementQuestion = typeof placementQuestions.$inferInsert;
export type PlacementTestSession = typeof placementTestSessions.$inferSelect;
export type InsertPlacementTestSession = typeof placementTestSessions.$inferInsert;
export type PlacementTestQuestion = typeof placementTestQuestions.$inferSelect;
export type InsertPlacementTestQuestion = typeof placementTestQuestions.$inferInsert;
export type PlacementTestResponse = typeof placementTestResponses.$inferSelect;
export type InsertPlacementTestResponse = typeof placementTestResponses.$inferInsert;
export type PlacementResult = typeof placementResults.$inferSelect;
export type InsertPlacementResult = typeof placementResults.$inferInsert;

// ============================================================================
// ZOD SCHEMAS FOR EXAM-FOCUSED ROADMAP TABLES
// ============================================================================




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

// Track Sub-levels - Fine-grained level divisions (A1.1, A1.2, etc.)

// Track Sessions - Individual sessions within sublevels with exam support

// Track Tasks - Individual tasks with skill-based time allocations

// User Track Enrollments - Student enrollment and progress tracking

// User Task Progress - Detailed task completion with time and scores

// User Sublevel Progress - Aggregated progress for charts and overviews

// Track Assessment Rules - Exam and assessment configuration

// Adaptation Profiles - AI personalization profiles for each enrollment

// Adaptation Events - AI adaptation history and triggered changes

// Task Generation Requests - One-button generation tracking with anti-plagiarism

// ============================================================================
// BOOK E-COMMERCE SYSTEM SCHEMA
// ============================================================================

// Book categories with hierarchical structure

// Books table with pricing and availability

// Book assets (additional files, images, etc.)

// Dictionary lookups for language learning

// Shopping carts

// Cart items

// Orders

// Order items

// User addresses for shipping

// Shipping orders

// Courier tracking updates

// ============================================================================
// UNIFIED SCHEMA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all unified track tables

// Type exports for all unified track tables
// NOTE: Learning track system tables (learningTracks, trackSublevels, trackTasks, etc.)
// were planned but never created in the database schema. Type aliases removed.
// export type LearningTrack = typeof learningTracks.$inferSelect;                  // TABLE_UNDEFINED
// export type LearningTrackInsert = z.infer<typeof insertLearningTrackSchema>;     // TABLE_UNDEFINED
// export type TrackSublevel = typeof trackSublevels.$inferSelect;                  // TABLE_UNDEFINED
// export type TrackSublevelInsert = z.infer<typeof insertTrackSublevelSchema>;     // TABLE_UNDEFINED
// export type TrackSession = typeof trackSessions.$inferSelect;                    // TABLE_UNDEFINED
// export type TrackSessionInsert = z.infer<typeof insertTrackSessionSchema>;       // TABLE_UNDEFINED
// export type TrackTask = typeof trackTasks.$inferSelect;                          // TABLE_UNDEFINED
// export type TrackTaskInsert = z.infer<typeof insertTrackTaskSchema>;             // TABLE_UNDEFINED
// export type UserTrackEnrollment = typeof userTrackEnrollments.$inferSelect;      // TABLE_UNDEFINED
// export type UserTrackEnrollmentInsert = z.infer<typeof insertUserTrackEnrollmentSchema>; // TABLE_UNDEFINED
// export type UserTaskProgress = typeof userTaskProgress.$inferSelect;             // TABLE_UNDEFINED
// export type UserTaskProgressInsert = z.infer<typeof insertUserTaskProgressSchema>; // TABLE_UNDEFINED
// export type UserSublevelProgress = typeof userSublevelProgress.$inferSelect;     // TABLE_UNDEFINED
// export type UserSublevelProgressInsert = z.infer<typeof insertUserSublevelProgressSchema>; // TABLE_UNDEFINED
// export type TrackAssessmentRule = typeof trackAssessmentRules.$inferSelect;      // TABLE_UNDEFINED
// export type TrackAssessmentRuleInsert = z.infer<typeof insertTrackAssessmentRuleSchema>; // TABLE_UNDEFINED
// export type AdaptationProfile = typeof adaptationProfiles.$inferSelect;          // TABLE_UNDEFINED
// export type AdaptationProfileInsert = z.infer<typeof insertAdaptationProfileSchema>; // TABLE_UNDEFINED
// export type AdaptationEvent = typeof adaptationEvents.$inferSelect;              // TABLE_UNDEFINED
// export type AdaptationEventInsert = z.infer<typeof insertAdaptationEventSchema>; // TABLE_UNDEFINED
// export type TaskGenerationRequest = typeof taskGenerationRequests.$inferSelect;  // TABLE_UNDEFINED
// export type TaskGenerationRequestInsert = z.infer<typeof insertTaskGenerationRequestSchema>; // TABLE_UNDEFINED

// ============================================================================
// UNIVERSAL SEARCH SYSTEM
// ============================================================================

// Search History - tracks user search queries for personalization and analytics

// Search Analytics - aggregate search data and metrics

// Trending Searches - track trending and suggested search terms

// Search Suggestions - AI-enhanced search suggestions and autocomplete

// Search Index - cached search results for performance

// ============================================================================
// BOOK E-COMMERCE SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for all book e-commerce tables

// Type exports for all book e-commerce tables
export type BookCategory = typeof book_categories.$inferSelect;
export type BookCategoryInsert = z.infer<typeof insertBookCategorySchema>;
export type Book = typeof books.$inferSelect;
export type BookInsert = z.infer<typeof insertBookSchema>;
export type BookAsset = typeof book_assets.$inferSelect;
export type BookAssetInsert = z.infer<typeof insertBookAssetSchema>;
export type BookOrder = typeof book_orders.$inferSelect;
export type BookOrderInsert = z.infer<typeof insertBookOrderSchema>;
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

// Type exports for all search-related tables
// NOTE: search tables (searchHistory, searchAnalytics, trendingSearches, searchSuggestions,
// searchIndex) were planned but never created in the database schema. Type aliases removed.
// Retained as comments to preserve intended API surface for future implementation:
// export type SearchHistoryInsert = z.infer<typeof insertSearchHistorySchema>;      // TABLE_UNDEFINED
// export type SearchAnalyticsInsert = z.infer<typeof insertSearchAnalyticsSchema>;  // TABLE_UNDEFINED
// export type TrendingSearchesInsert = z.infer<typeof insertTrendingSearchesSchema>; // TABLE_UNDEFINED
// export type SearchSuggestions = typeof searchSuggestions.$inferSelect;            // TABLE_UNDEFINED
// export type SearchSuggestionsInsert = z.infer<typeof insertSearchSuggestionsSchema>; // TABLE_UNDEFINED
// export type SearchIndex = typeof searchIndex.$inferSelect;                        // TABLE_UNDEFINED
// export type SearchIndexInsert = z.infer<typeof insertSearchIndexSchema>;          // TABLE_UNDEFINED

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

// Lexi messages - individual chat messages in conversations

// Video content analysis by Lexi - AI analysis of video content for context

// User learning interactions with Lexi - tracks all learning activities

// Voice interactions with Lexi - specific to voice/pronunciation features

// Lexi personalized recommendations - AI-generated learning suggestions

// Lexi learning analytics - aggregate learning data and insights

// Quiz data generated by Lexi from video content

// User's quiz attempts and results

// ============================================================================
// IRANIAN/ARABIC CALENDAR AND THIRD-PARTY API INTEGRATION
// ============================================================================

// Third-party APIs management for centralized API integration

// Iranian calendar settings and preferences

// Iranian/Persian calendar events and cultural occasions

// Persian holiday calendar with detailed information

// ============================================================================
// LEXI SCHEMA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for Lexi tables

// Type exports for Lexi tables
// NOTE: Lexi AI assistant tables (lexiConversations, lexiMessages, lexiVideoAnalysis, etc.)
// were planned but never created in the database schema. Type aliases removed.
// Retained as comments to preserve intended API surface for future implementation:
// export type LexiConversation = typeof lexiConversations.$inferSelect;            // TABLE_UNDEFINED
// export type LexiConversationInsert = z.infer<typeof insertLexiConversationSchema>; // TABLE_UNDEFINED
// export type LexiMessage = typeof lexiMessages.$inferSelect;                      // TABLE_UNDEFINED
// export type LexiMessageInsert = z.infer<typeof insertLexiMessageSchema>;         // TABLE_UNDEFINED
// export type LexiVideoAnalysis = typeof lexiVideoAnalysis.$inferSelect;           // TABLE_UNDEFINED
// export type LexiVideoAnalysisInsert = z.infer<typeof insertLexiVideoAnalysisSchema>; // TABLE_UNDEFINED
// export type LexiLearningInteraction = typeof lexiLearningInteractions.$inferSelect; // TABLE_UNDEFINED
// export type LexiLearningInteractionInsert = z.infer<typeof insertLexiLearningInteractionSchema>; // TABLE_UNDEFINED
// export type LexiVoiceInteraction = typeof lexiVoiceInteractions.$inferSelect;    // TABLE_UNDEFINED
// export type LexiVoiceInteractionInsert = z.infer<typeof insertLexiVoiceInteractionSchema>; // TABLE_UNDEFINED
// export type LexiRecommendation = typeof lexiRecommendations.$inferSelect;        // TABLE_UNDEFINED
// export type LexiRecommendationInsert = z.infer<typeof insertLexiRecommendationSchema>; // TABLE_UNDEFINED
// export type LexiLearningAnalytics = typeof lexiLearningAnalytics.$inferSelect;   // TABLE_UNDEFINED
// export type LexiLearningAnalyticsInsert = z.infer<typeof insertLexiLearningAnalyticsSchema>; // TABLE_UNDEFINED
// export type LexiQuiz = typeof lexiQuizzes.$inferSelect;                          // TABLE_UNDEFINED
// export type LexiQuizInsert = z.infer<typeof insertLexiQuizSchema>;               // TABLE_UNDEFINED
// export type LexiQuizAttempt = typeof lexiQuizAttempts.$inferSelect;              // TABLE_UNDEFINED
// export type LexiQuizAttemptInsert = z.infer<typeof insertLexiQuizAttemptSchema>; // TABLE_UNDEFINED

// ============================================================================
// IRANIAN/ARABIC CALENDAR SCHEMA INSERT SCHEMAS AND TYPES  
// ============================================================================

// Insert schemas for calendar and third-party API tables

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
// MARKETING & SOCIAL MEDIA INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for marketing and social media tables
export const insertMarketingCampaignSchema = (createInsertSchema(marketingCampaigns) as any).omit({
  id: true,
  impressions: true,
  clicks: true,
  conversions: true,
  costPerLead: true,
  roi: true,
  conversionRate: true,
  engagementRate: true,
  smsSentCount: true,
  smsFailedCount: true,
  smsDeliveredCount: true,
  smsCost: true,
  smsSentAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertPlatformCredentialSchema = (createInsertSchema(platformCredentials) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertScheduledPostSchema = (createInsertSchema(scheduledPosts) as any).omit({
  id: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertSocialMediaPostSchema = (createInsertSchema(socialMediaPosts) as any).omit({
  id: true,
  impressions: true,
  reach: true,
  likes: true,
  comments: true,
  shares: true,
  clicks: true,
  saves: true,
  engagementRate: true,
  lastSyncedAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertSocialMediaAnalyticsSchema = (createInsertSchema(socialMediaAnalytics) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmailCampaignSchema = (createInsertSchema(emailCampaigns) as any).omit({
  id: true,
  sentAt: true,
  successfulSends: true,
  failedSends: true,
  opened: true,
  clicked: true,
  bounced: true,
  unsubscribed: true,
  openRate: true,
  clickRate: true,
  bounceRate: true,
  createdAt: true,
  updatedAt: true
});

export const insertTelegramMessageSchema = (createInsertSchema(telegramMessages) as any).omit({
  id: true,
  sentAt: true,
  views: true,
  forwards: true,
  createdAt: true,
  updatedAt: true
});

// Type exports for marketing and social media tables
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type MarketingCampaignInsert = z.infer<typeof insertMarketingCampaignSchema>;
export type PlatformCredential = typeof platformCredentials.$inferSelect;
export type PlatformCredentialInsert = z.infer<typeof insertPlatformCredentialSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type ScheduledPostInsert = z.infer<typeof insertScheduledPostSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type SocialMediaPostInsert = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaAnalytics = typeof socialMediaAnalytics.$inferSelect;
export type SocialMediaAnalyticsInsert = z.infer<typeof insertSocialMediaAnalyticsSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailCampaignInsert = z.infer<typeof insertEmailCampaignSchema>;
export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type TelegramMessageInsert = z.infer<typeof insertTelegramMessageSchema>;

// ============================================================================
// LINGUAQUEST FREE LEARNING SYSTEM SCHEMA
// ============================================================================

// LinguaQuest lesson difficulty and type constants

export const LINGUAQUEST_DIFFICULTY = {
  BEGINNER: 'beginner',
  ELEMENTARY: 'elementary',
  INTERMEDIATE: 'intermediate',
  UPPER_INTERMEDIATE: 'upper_intermediate',
  ADVANCED: 'advanced',
} as const;

export const LINGUAQUEST_LESSON_TYPE = {
  VOCABULARY: 'vocabulary',
  GRAMMAR: 'grammar',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
  READING: 'reading',
  WRITING: 'writing',
  MIXED: 'mixed',
} as const;

export const LINGUAQUEST_SCENE_TYPE = {
  INTERACTIVE_3D: 'interactive_3d',
  VIDEO: 'video',
  DIALOGUE: 'dialogue',
  QUIZ: 'quiz',
  ROLE_PLAY: 'role_play',
} as const;

export type LinguaQuestDifficulty = typeof LINGUAQUEST_DIFFICULTY[keyof typeof LINGUAQUEST_DIFFICULTY];
export type LinguaQuestLessonType = typeof LINGUAQUEST_LESSON_TYPE[keyof typeof LINGUAQUEST_LESSON_TYPE];
export type LinguaQuestSceneType = typeof LINGUAQUEST_SCENE_TYPE[keyof typeof LINGUAQUEST_SCENE_TYPE];

// LinguaQuest 3D Interactive Lessons

// Guest Progress Tracking (Anonymous Users)

// Voice Exercises for Guest Users

// 3D Lesson Content and Assets

// 3D Video Lessons - Bridge between video courses and 3D lessons

// 3D Lesson Progress Tracking

// Freemium Conversion Tracking

// Visitor Achievements (Gamification for Guests)

// ============================================================================
// PHASE 3: ENHANCED ANALYTICS TABLES
// ============================================================================

// AI-powered learning problem detection

// Learning recommendations generated by AI

// Cross-skill performance correlations

// Individual student performance patterns

// Learning analytics insights cache (for performance)

// ============================================================================
// LINGUAQUEST INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for LinguaQuest tables
export const insertLinguaquestCefrLevelSchema = (createInsertSchema(linguaquestCefrLevels) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLinguaquestAudioAssetSchema = (createInsertSchema(linguaquestAudioAssets) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLinguaquestAudioJobSchema = (createInsertSchema(linguaquestAudioJobs) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLinguaquestLeaderboardEntrySchema = (createInsertSchema(linguaquestLeaderboardEntries) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBookReviewSchema = (createInsertSchema(bookReviews) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Insert schemas for Enhanced Analytics tables

// Type exports for LinguaQuest tables
export type LinguaquestLesson = typeof linguaquestLessons.$inferSelect;
export type LinguaquestLessonInsert = z.infer<typeof insertLinguaquestLessonSchema>;
export type GuestProgressTracking = typeof guestProgressTracking.$inferSelect;
export type GuestProgressTrackingInsert = z.infer<typeof insertGuestProgressTrackingSchema>;
export type LinguaquestCefrLevel = typeof linguaquestCefrLevels.$inferSelect;
export type LinguaquestCefrLevelInsert = z.infer<typeof insertLinguaquestCefrLevelSchema>;
export type LinguaquestAudioAsset = typeof linguaquestAudioAssets.$inferSelect;
export type LinguaquestAudioAssetInsert = z.infer<typeof insertLinguaquestAudioAssetSchema>;
export type LinguaquestAudioJob = typeof linguaquestAudioJobs.$inferSelect;
export type LinguaquestAudioJobInsert = z.infer<typeof insertLinguaquestAudioJobSchema>;
export type LinguaquestLeaderboardEntry = typeof linguaquestLeaderboardEntries.$inferSelect;
export type LinguaquestLeaderboardEntryInsert = z.infer<typeof insertLinguaquestLeaderboardEntrySchema>;
export type LinguaquestContentBank = typeof linguaquestContentBank.$inferSelect;
export type LinguaquestContentBankInsert = z.infer<typeof insertLinguaquestContentBankSchema>;
export type LinguaquestLessonFeedback = typeof linguaquestLessonFeedback.$inferSelect;
export type LinguaquestLessonFeedbackInsert = z.infer<typeof insertLinguaquestLessonFeedbackSchema>;
export type BookReview = typeof bookReviews.$inferSelect;
export type BookReviewInsert = z.infer<typeof insertBookReviewSchema>;
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

// ============================================================================
// SMS TEMPLATE MANAGEMENT SYSTEM TABLES
// ============================================================================

// SMS template categories for organizing templates

// SMS template variables for personalization

// Main SMS templates table

// SMS template sending logs for tracking all SMS sends

// SMS template analytics for performance tracking

// SMS template favorites for quick access

// ============================================================================
// FRONT DESK CLERK TABLES FOR WALK-IN MANAGEMENT
// ============================================================================

// Front desk operations table for tracking walk-in inquiries and visits

// Phone call logs table for tracking all phone communications

// Front desk tasks table for follow-up and task management

// ============================================================================
// TRIAL LESSON SCHEDULING SYSTEM
// ============================================================================

// Trial Lessons - Core table for all trial lesson bookings

// Trial Lesson Outcomes - Detailed assessment and feedback after trial

// Teacher Trial Lesson Availability - Specific availability windows for trial lessons

// Trial Lesson Conflicts - Track and resolve scheduling conflicts

// Trial Lesson Analytics - Performance tracking and metrics

// Trial Lesson Wait List - Manage waiting lists for popular time slots

// ============================================================================
// TRIAL LESSON SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// Insert schemas for trial lesson tables
export const insertTrialLessonSchema = (createInsertSchema(trialLessons) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for trial lesson tables
export type TrialLesson = typeof trialLessons.$inferSelect;
export type InsertTrialLesson = typeof trialLessons.$inferInsert;
// export type TrialLessonOutcome = typeof trialLessonOutcomes.$inferSelect; // TABLE_UNDEFINED
// export type InsertTrialLessonOutcome = typeof trialLessonOutcomes.$inferInsert; // TABLE_UNDEFINED
export type TeacherTrialAvailability = typeof teacherTrialAvailability.$inferSelect;
export type InsertTeacherTrialAvailability = typeof teacherTrialAvailability.$inferInsert;
// export type TrialLessonConflict = typeof trialLessonConflicts.$inferSelect; // TABLE_UNDEFINED
// export type InsertTrialLessonConflict = typeof trialLessonConflicts.$inferInsert; // TABLE_UNDEFINED
// export type TrialLessonAnalytics = typeof trialLessonAnalytics.$inferSelect; // TABLE_UNDEFINED
// export type InsertTrialLessonAnalytics = typeof trialLessonAnalytics.$inferInsert; // TABLE_UNDEFINED
// export type TrialLessonWaitList = typeof trialLessonWaitList.$inferSelect; // TABLE_UNDEFINED
// export type InsertTrialLessonWaitList = typeof trialLessonWaitList.$inferInsert; // TABLE_UNDEFINED

// ============================================================================
// SMS TEMPLATE SYSTEM INSERT SCHEMAS AND TYPES
// ============================================================================

// CRITICAL TYPE SAFETY: SMS Log Metadata Schema - replaces unsafe (metadata as any) casts

export type SmsLogMetadata = z.infer<typeof smsLogMetadataSchema>;

// Insert schemas for SMS Template tables

// Type exports for SMS Template tables
// export type SmsTemplateCategory = typeof smsTemplateCategories.$inferSelect; // TABLE_UNDEFINED
// export type InsertSmsTemplateCategory = typeof smsTemplateCategories.$inferInsert; // TABLE_UNDEFINED
// export type SmsTemplateVariable = typeof smsTemplateVariables.$inferSelect; // TABLE_UNDEFINED
// export type InsertSmsTemplateVariable = typeof smsTemplateVariables.$inferInsert; // TABLE_UNDEFINED
// export type SmsTemplate = typeof smsTemplates.$inferSelect; // TABLE_UNDEFINED
// export type InsertSmsTemplate = typeof smsTemplates.$inferInsert; // TABLE_UNDEFINED
// export type SmsTemplateSendingLog = typeof smsTemplateSendingLogs.$inferSelect; // TABLE_UNDEFINED
// export type InsertSmsTemplateSendingLog = typeof smsTemplateSendingLogs.$inferInsert; // TABLE_UNDEFINED
// export type SmsTemplateAnalytics = typeof smsTemplateAnalytics.$inferSelect; // TABLE_UNDEFINED
// export type InsertSmsTemplateAnalytics = typeof smsTemplateAnalytics.$inferInsert; // TABLE_UNDEFINED
// export type SmsTemplateFavorite = typeof smsTemplateFavorites.$inferSelect; // TABLE_UNDEFINED
// export type InsertSmsTemplateFavorite = typeof smsTemplateFavorites.$inferInsert; // TABLE_UNDEFINED

// ============================================================================
// WEB SCRAPING INFRASTRUCTURE TABLES
// ============================================================================

export const SCRAPE_JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export const SCRAPE_JOB_TYPE = {
  PRICING: 'pricing',
  LEADS: 'leads',
  TRENDS: 'trends',
  CUSTOM: 'custom'
} as const;

export type ScrapeJobStatus = typeof SCRAPE_JOB_STATUS[keyof typeof SCRAPE_JOB_STATUS];
export type ScrapeJobType = typeof SCRAPE_JOB_TYPE[keyof typeof SCRAPE_JOB_TYPE];

export const scrapeJobs = pgTable("scrape_jobs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  targetUrl: varchar("target_url", { length: 1000 }).notNull(),
  selectors: jsonb("selectors").notNull(),
  schedule: varchar("schedule", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  itemsScraped: integer("items_scraped").default(0),
  errorMessage: text("error_message"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const competitorPrices = pgTable("competitor_prices", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id").references(() => scrapeJobs.id),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  competitorUrl: varchar("competitor_url", { length: 1000 }).notNull(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  courseLevel: varchar("course_level", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default('IRR'),
  duration: varchar("duration", { length: 100 }),
  features: text("features").array(),
  discount: decimal("discount", { precision: 5, scale: 2 }),
  availability: varchar("availability", { length: 100 }),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const scrapedLeads = pgTable("scraped_leads", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id").references(() => scrapeJobs.id),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1000 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  location: varchar("location", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  interests: text("interests").array(),
  socialProfiles: jsonb("social_profiles"),
  qualificationScore: integer("qualification_score").default(0),
  status: varchar("status", { length: 50 }).default('new'),
  importedToLeads: boolean("imported_to_leads").default(false),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const marketTrends = pgTable("market_trends", {
  id: serial("id").primaryKey(),
  scrapeJobId: integer("scrape_job_id").references(() => scrapeJobs.id),
  category: varchar("category", { length: 100 }).notNull(),
  trendName: varchar("trend_name", { length: 255 }).notNull(),
  description: text("description"),
  source: varchar("source", { length: 255 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1000 }),
  keywords: text("keywords").array(),
  sentiment: varchar("sentiment", { length: 50 }),
  impactScore: integer("impact_score").default(0),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  aiInsights: text("ai_insights"),
  recommendations: text("recommendations").array(),
  relatedTopics: text("related_topics").array(),
  rawData: jsonb("raw_data"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertScrapeJobSchema = (createInsertSchema(scrapeJobs) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCompetitorPriceSchema = (createInsertSchema(competitorPrices) as any).omit({
  id: true,
  createdAt: true
});

export const insertScrapedLeadSchema = (createInsertSchema(scrapedLeads) as any).omit({
  id: true,
  createdAt: true
});

export const insertMarketTrendSchema = (createInsertSchema(marketTrends) as any).omit({
  id: true,
  createdAt: true
});

export const scrapeSchedules = pgTable("scrape_schedules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(),
  intervalMinutes: integer("interval_minutes"),
  config: jsonb("config").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertScrapeScheduleSchema = (createInsertSchema(scrapeSchedules) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = typeof scrapeJobs.$inferInsert;
export type CompetitorPrice = typeof competitorPrices.$inferSelect;
export type InsertCompetitorPrice = typeof competitorPrices.$inferInsert;
export type ScrapedLead = typeof scrapedLeads.$inferSelect;
export type InsertScrapedLead = typeof scrapedLeads.$inferInsert;
export type MarketTrend = typeof marketTrends.$inferSelect;
export type InsertMarketTrend = typeof marketTrends.$inferInsert;
export type ScrapeSchedule = typeof scrapeSchedules.$inferSelect;
export type InsertScrapeSchedule = typeof scrapeSchedules.$inferInsert;

// ============================================================================
// ACCOUNTING LEDGER SYSTEM - Double-Entry Bookkeeping
// ============================================================================

// Chart of Accounts - Account definitions
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  accountCode: varchar("account_code", { length: 50 }).unique().notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(), // asset, liability, equity, revenue, expense
  normalBalance: varchar("normal_balance", { length: 10 }).notNull(), // debit or credit
  parentAccountId: integer("parent_account_id"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertChartOfAccountsSchema = (createInsertSchema(chartOfAccounts) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Accounting Ledger - Double-entry bookkeeping
export const accountingLedger = pgTable("accounting_ledger", {
  id: serial("id").primaryKey(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  accountId: integer("account_id").references(() => chartOfAccounts.id).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // debit or credit
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("IRR").notNull(),
  
  // Reference to original transaction source
  sourceType: varchar("source_type", { length: 50 }).notNull(), // wallet, course_payment, teacher_payout, book_purchase, refund, etc.
  sourceId: integer("source_id").notNull(), // ID of the source transaction
  
  // Transaction grouping for double-entry pairing
  journalEntryId: varchar("journal_entry_id", { length: 100 }).notNull(), // Groups debit/credit pairs
  
  description: text("description"),
  referenceNumber: varchar("reference_number", { length: 100 }),
  
  // User tracking
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  
  // Status tracking
  status: varchar("status", { length: 20 }).default("posted").notNull(), // draft, posted, voided
  isReconciled: boolean("is_reconciled").default(false),
  reconciledAt: timestamp("reconciled_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertAccountingLedgerSchema = (createInsertSchema(accountingLedger) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ChartOfAccounts = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccounts = typeof chartOfAccounts.$inferInsert;
export type AccountingLedger = typeof accountingLedger.$inferSelect;
export type InsertAccountingLedger = typeof accountingLedger.$inferInsert;

// ============================================================================
// FORM MANAGEMENT SYSTEM
// ============================================================================

// Form Definitions - Templates for dynamic forms (Multi-language support)
export const formDefinitions = pgTable("form_definitions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(), // Default title
  titleEn: varchar("title_en", { length: 255 }),
  titleFa: varchar("title_fa", { length: 255 }),
  titleAr: varchar("title_ar", { length: 255 }),
  description: text("description"),
  descriptionEn: text("description_en"),
  descriptionFa: text("description_fa"),
  descriptionAr: text("description_ar"),
  category: varchar("category", { length: 100 }), // e.g., "student_intake", "authentication", "survey"
  fields: jsonb("fields").notNull(), // Array of field definitions with multi-language support
  isActive: boolean("is_active").default(true).notNull(),
  allowAnonymous: boolean("allow_anonymous").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  submitButtonTextEn: varchar("submit_button_text_en", { length: 100 }),
  submitButtonTextFa: varchar("submit_button_text_fa", { length: 100 }),
  submitButtonTextAr: varchar("submit_button_text_ar", { length: 100 }),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Form Submissions - User responses to forms
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").references(() => formDefinitions.id).notNull(),
  data: jsonb("data").notNull(), // Submitted form field data
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected
  submittedBy: varchar("submitted_by", { length: 255 }), // Email or identifier (for guest submissions)
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas for form management
export const insertFormDefinitionSchema = (createInsertSchema(formDefinitions) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFormSubmissionSchema = (createInsertSchema(formSubmissions) as any).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true
});

// Types for form management
export type FormDefinition = typeof formDefinitions.$inferSelect;
export type InsertFormDefinition = z.infer<typeof insertFormDefinitionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;

// ============================================================================
// CMS (CONTENT MANAGEMENT SYSTEM) - Website Builder, Blog, Video Gallery
// ============================================================================

// CMS Pages - Website pages with multi-language support
