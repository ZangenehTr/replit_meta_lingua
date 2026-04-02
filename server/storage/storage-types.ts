import { 
  users, courses, enrollments, sessions, messages, homework, 
  payments, notifications, leads, invoices,
  communicationLogs, achievements, userAchievements,
  userStats, dailyGoals, skillAssessments, learningActivities, progressSnapshots,
  moodEntries, moodRecommendations, learningAdaptations, attendanceRecords, rooms,
  studentQuestionnaires, userProfiles, rolePermissions, userSessions,
  passwordResetTokens, otpCodes,
  sessionPackages, walletTransactions, coursePayments, mentorAssignments, mentoringSessions,
  classes, holidays,
  // Testing subsystem tables
  tests, testQuestions, testAttempts, testAnswers,
  // Gamification tables
  games, gameLevels, userGameProgress, gameSessions, gameLeaderboards,
  // Video learning tables
  videoLessons, videoProgress, videoNotes, videoBookmarks,
  // LMS tables
  forumCategories, forumThreads, forumPosts, gradebookEntries, contentLibrary,
  // AI tracking tables
  aiProgressTracking, aiActivitySessions, aiVocabularyTracking, aiGrammarTracking, aiPronunciationAnalysis,
  // Callern tables
  callernPackages, studentCallernPackages, teacherCallernAvailability, teacherCallernAuthorization, callernCallHistory,
  callernPresence, callernSpeechSegments, callernScoresStudent, callernScoresTeacher, callernScoringEvents,
  // Supervision observation tables
  supervisionObservations, teacherObservationResponses,
  // Additional tables
  teacherAvailability, paymentTransactions, teacherEvaluations, classObservations, systemMetrics,
  courseSessions, levelAssessmentQuestions, levelAssessmentResults, customRoles,
  institutes, departments, studentGroups, studentGroupMembers, teacherAssignments,
  studentNotes, parentGuardians, studentReports, referralSettings, courseReferrals,
  referralCommissions, adminSettings, aiTrainingData, aiKnowledgeBase,
  // Chat and AI study partner tables
  chatConversations, chatMessages, aiStudyPartners,
  // MST tables
  mstSessions, mstSkillStates, mstResponses,
  // Book e-commerce tables
  book_categories, books, book_assets, dictionary_lookups, book_orders, carts, cart_items,
  orders, order_items, user_addresses, shipping_orders, courier_tracking,
  // SMS template tables
  smsTemplateCategories, smsTemplateVariables, smsTemplates, smsTemplateSendingLogs, 
  smsTemplateAnalytics, smsTemplateFavorites,
  // 3D lesson tables
  threeDLessonContent, threeDVideoLessons, threeDLessonProgress,
  // Social media & marketing tables
  marketingCampaigns, platformCredentials, scheduledPosts, socialMediaPosts,
  socialMediaAnalytics, emailCampaigns, telegramMessages,
  // Accounting ledger tables
  chartOfAccounts, accountingLedger,
  // CMS tables
  cmsPages, cmsPageSections, cmsBlogCategories, cmsBlogTags, cmsBlogPosts,
  cmsBlogPostTags, cmsBlogComments, cmsVideos, cmsMediaAssets, cmsPageAnalytics,
  teacherReviews, instituteEvents,
} from "@shared/schema";
// Unified testing system tables
import {
  unifiedQuestions, unifiedTestTemplates, unifiedTestSessions, 
  unifiedResponses, evaluationRules, aiGenerationTemplates
} from "@shared/unified-testing-schema";
import { 
  // Types
  type User, type InsertUser, type Course, type InsertCourse,
  type Class, type InsertClass, type Holiday, type InsertHoliday,
  type Enrollment, type InsertEnrollment, type Session, type InsertSession,
  type Message, type InsertMessage, type Homework, type InsertHomework,
  type Payment, type InsertPayment, type Notification, type InsertNotification,
  type InstituteBranding, type InsertBranding,
  type Lead, type InsertLead, type Invoice, type InsertInvoice,
  type CommunicationLog, type InsertCommunicationLog,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats, type DailyGoal, type InsertDailyGoal,
  type SkillAssessment, type InsertSkillAssessment, type LearningActivity, type InsertLearningActivity,
  type ProgressSnapshot, type InsertProgressSnapshot,
  type UserProfile, type InsertUserProfile, type UserSession, type InsertUserSession,
  type RolePermission, type InsertRolePermission,
  type PasswordResetToken, type InsertPasswordResetToken,
  type OtpCode, type InsertOtpCode,
  type MentorAssignment, type InsertMentorAssignment,
  type MentoringSession, type InsertMentoringSession,
  type MoodEntry, type InsertMoodEntry,
  type MoodRecommendation, type InsertMoodRecommendation,
  type LearningAdaptation, type InsertLearningAdaptation,
  type AttendanceRecord, type InsertAttendanceRecord,
  type Room, type InsertRoom,
  type StudentQuestionnaire, type InsertStudentQuestionnaire,
  type QuestionnaireResponse, type InsertQuestionnaireResponse,
  // Testing subsystem types
  type Test, type InsertTest, type TestQuestion, type InsertTestQuestion,
  type TestAttempt, type InsertTestAttempt, type TestAnswer, type InsertTestAnswer,
  // Gamification types
  type Game, type InsertGame, type GameLevel, type InsertGameLevel,
  type UserGameProgress, type InsertUserGameProgress, type GameSession, type InsertGameSession,
  type GameLeaderboard, type InsertGameLeaderboard,
  // New game system types
  gameQuestions, gameDailyChallenges, userDailyChallengeProgress, gameAnswerLogs,
  type GameQuestion, type InsertGameQuestion, type GameDailyChallenge, type InsertGameDailyChallenge,
  type UserDailyChallengeProgress, type InsertUserDailyChallengeProgress,
  type GameAnswerLog, type InsertGameAnswerLog,
  // Video learning types
  type VideoLesson, type InsertVideoLesson, type VideoProgress, type InsertVideoProgress,
  type VideoNote, type InsertVideoNote, type VideoBookmark, type InsertVideoBookmark,
  // LMS types
  type ForumCategory, type InsertForumCategory, type ForumThread, type InsertForumThread,
  type ForumPost, type InsertForumPost, type GradebookEntry, type InsertGradebookEntry,
  type ContentLibraryItem, type InsertContentLibraryItem,
  // AI tracking types
  type AiProgressTracking, type InsertAiProgressTracking, type AiActivitySession, type InsertAiActivitySession,
  type AiVocabularyTracking, type InsertAiVocabularyTracking, type AiGrammarTracking, type InsertAiGrammarTracking,
  type AiPronunciationAnalysis, type InsertAiPronunciationAnalysis,
  // Callern types
  type CallernPackage, type InsertCallernPackage, type StudentCallernPackage, type InsertStudentCallernPackage,
  type TeacherCallernAvailability, type InsertTeacherCallernAvailability, 
  type TeacherCallernAuthorization, type InsertTeacherCallernAuthorization,
  type CallernCallHistory, type InsertCallernCallHistory,
  type CallernPresence, type InsertCallernPresence, type CallernSpeechSegment, type InsertCallernSpeechSegment,
  type CallernScoresStudent, type InsertCallernScoresStudent, type CallernScoresTeacher, type InsertCallernScoresTeacher,
  type CallernScoringEvent, type InsertCallernScoringEvent,
  // Supervision observation types
  type SupervisionObservation, type InsertSupervisionObservation,
  type TeacherObservationResponse, type InsertTeacherObservationResponse,
  // Exam roadmap types
  roadmapPlans, roadmapSessions,
  type RoadmapPlan, type InsertRoadmapPlan, type RoadmapSession, type InsertRoadmapSession,
  // Chat and AI study partner types
  type ChatConversation, type InsertChatConversation, type ChatMessage, type InsertChatMessage,
  type AiStudyPartner, type InsertAiStudyPartner,
  // MST types
  type MSTSession, type MSTSkillState, type MSTResponse,
  // Book e-commerce types
  type BookCategory, type BookCategoryInsert, type Book, type BookInsert,
  type BookAsset, type BookAssetInsert, type DictionaryLookup, type DictionaryLookupInsert,
  type BookOrder, type BookOrderInsert,
  type Cart, type CartInsert, type CartItem, type CartItemInsert,
  type Order, type OrderInsert, type OrderItem, type OrderItemInsert,
  type UserAddress, type UserAddressInsert, type ShippingOrder, type ShippingOrderInsert,
  type CourierTracking, type CourierTrackingInsert,
  // Front desk types
  type FrontDeskOperation, type InsertFrontDeskOperation,
  type PhoneCallLog, type InsertPhoneCallLog, type FrontDeskTask, type InsertFrontDeskTask,
  // SMS template types
  type SmsTemplateCategory, type InsertSmsTemplateCategory,
  type SmsTemplateVariable, type InsertSmsTemplateVariable,
  type SmsTemplate, type InsertSmsTemplate,
  type SmsTemplateSendingLog, type InsertSmsTemplateSendingLog,
  type SmsTemplateAnalytics, type InsertSmsTemplateAnalytics,
  type SmsTemplateFavorite, type InsertSmsTemplateFavorite,
  // 3D lesson types
  type ThreeDLessonContent, type ThreeDLessonContentInsert,
  type ThreeDVideoLesson, type ThreeDVideoLessonInsert,
  // Accounting ledger types
  type ChartOfAccounts, type InsertChartOfAccounts,
  type AccountingLedger, type InsertAccountingLedger,
  type ThreeDLessonProgress, type ThreeDLessonProgressInsert,
  // Social media & marketing types
  type MarketingCampaign, type InsertMarketingCampaign,
  type PlatformCredential, type InsertPlatformCredential,
  type ScheduledPost, type InsertScheduledPost,
  type SocialMediaPost, type InsertSocialMediaPost,
  type SocialMediaAnalytics, type InsertSocialMediaAnalytics,
  type EmailCampaign, type InsertEmailCampaign,
  type TelegramMessage, type InsertTelegramMessage,
  type ScrapeJob, type InsertScrapeJob,
  type CompetitorPrice, type InsertCompetitorPrice,
  type ScrapedLead, type InsertScrapedLead,
  type MarketTrend, type InsertMarketTrend,
  // CMS types
  type CmsPage, type InsertCmsPage,
  type CmsPageSection, type InsertCmsPageSection,
  type CmsBlogCategory, type InsertCmsBlogCategory,
  type CmsBlogTag, type InsertCmsBlogTag,
  type CmsBlogPost, type InsertCmsBlogPost,
  type CmsBlogPostTag, type InsertCmsBlogPostTag,
  type CmsBlogComment, type InsertCmsBlogComment,
  type CmsVideo, type InsertCmsVideo,
  type CmsMediaAsset, type InsertCmsMediaAsset,
  type CmsPageAnalytics, type InsertCmsPageAnalytics
} from "@shared/schema";
// Unified testing system types
import {
  type UnifiedQuestion, type InsertUnifiedQuestion,
  type UnifiedTestTemplate, type InsertUnifiedTestTemplate,
  type UnifiedTestSession, type InsertUnifiedTestSession,
  type UnifiedResponse, type InsertUnifiedResponse,
  type EvaluationRule, type InsertEvaluationRule,
  type AiGenerationTemplate, type InsertAiGenerationTemplate,
  type QuestionType, type Skill, type CEFRLevel, type TestType
} from "@shared/unified-testing-schema";
import { db } from "../db";
import { eq, and, gte, lte, sql, desc, asc, or } from "drizzle-orm";
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone;
  
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove + if present, we'll add it back
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Handle different input formats
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    // Already has country code: 989101234567
    return '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Local format: 09101234567 -> +989101234567
    return '+98' + cleaned.substring(1);
  } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    // Without leading 0: 9101234567 -> +989101234567
    return '+98' + cleaned;
  }
  
  // Return as-is with + prefix if nothing matched
  return cleaned.startsWith('98') ? '+' + cleaned : '+98' + cleaned;
}

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getTeachers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPreferences(id: number, preferences: any): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Placement Test management
  createPlacementTestSession(data: any): Promise<any>;
  getPlacementTestSession(id: number): Promise<any | undefined>;
  updatePlacementTestSession(id: number, updates: any): Promise<any | undefined>;
  getUserPlacementTestSessions(userId: number): Promise<any[]>;
  getUserPlacementTestSessionsThisWeek(userId: number): Promise<any[]>;
  getPlacementTestSessionsPaginated(page: number, limit: number): Promise<{ sessions: any[], total: number }>;
  getPlacementTestSessionsCount(): Promise<number>;
  createPlacementTestQuestion(data: any): Promise<any>;
  getPlacementTestQuestion(id: number): Promise<any | undefined>;
  getPlacementTestQuestions(filters?: any): Promise<any[]>;
  createPlacementTestResponse(data: any): Promise<any>;
  updatePlacementTestResponse(id: number, updates: any): Promise<any | undefined>;
  getPlacementTestResponses(sessionId: number): Promise<any[]>;
  createUserRoadmapEnrollment(data: any): Promise<any>;

  // Enrollment and payment checking methods
  getUserEnrollments(userId: number): Promise<Enrollment[]>;
  hasActiveEnrollmentAfterPlacementTest(userId: number, placementTestCompletedAt: Date): Promise<boolean>;
  getUnpaidStudentsAfterPlacementTest(daysSinceTest?: number): Promise<any[]>;
  getStudentEnrollmentSummary(userId: number): Promise<any>;

  // Audience segmentation methods for SMS campaigns
  getInactiveStudents(monthsInactive: number): Promise<any[]>;
  getCurrentEnrolledStudents(): Promise<any[]>;
  getStudentsByCustomFilter(criteria: any): Promise<any[]>;

  // User profiles
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;

  // Authentication sessions
  getUserSession(token: string): Promise<UserSession | undefined>;
  getUserSessionByRefreshToken(refreshToken: string): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSessionActivity(sessionId: number): Promise<void>;
  updateUserSessionTokens(sessionId: number, accessToken: string, refreshToken: string): Promise<void>;
  invalidateUserSession(token: string): Promise<void>;

  // Password reset
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;

  // OTP verification
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  getActiveOtpCode(identifier: string, purpose: string): Promise<OtpCode | undefined>;
  incrementOtpAttempts(otpId: number): Promise<void>;
  consumeOtpCode(otpId: number): Promise<void>;
  invalidateActiveOtps(identifier: string, purpose: string): Promise<void>;
  deleteExpiredOtpCodes(): Promise<void>;
  getOtpAttemptsByIdentifier(identifier: string, since: Date): Promise<number>;
  getOtpAttemptsByIp(ip: string, since: Date): Promise<number>;
  getAdminSettings(): Promise<any>;

  // Role permissions
  checkUserPermission(role: string, resource: string, action: string): Promise<boolean>;
  getRolePermissions(role: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;

  // Courses
  getCourses(): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  getAllClasses(): Promise<any[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByDeliveryMode(mode: string): Promise<Course[]>;
  getUserCourses(userId: number): Promise<(Course & { progress: number })[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  getCourseEnrollments(courseId: number): Promise<any[]>;
  enrollInCourse(enrollment: InsertEnrollment): Promise<Enrollment>;
  unenrollFromCourse(userId: number, courseId: number): Promise<void>;
  
  // Classes (specific instances of courses with teacher and schedule)
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, updates: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<void>;
  getClassesByCourse(courseId: number): Promise<Class[]>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  calculateClassEndDate(startDate: string, totalSessions: number, weekdays: string[]): Promise<string>;
  
  // Holidays
  getHolidays(): Promise<Holiday[]>;
  getHoliday(id: number): Promise<Holiday | undefined>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  updateHoliday(id: number, updates: Partial<Holiday>): Promise<Holiday | undefined>;
  deleteHoliday(id: number): Promise<void>;
  getHolidaysInRange(startDate: string, endDate: string): Promise<Holiday[]>;
  
  // Course modules and lessons
  addCourseModule(courseId: number, moduleData: any): Promise<any>;
  addCourseLesson(courseId: number, moduleId: number, lessonData: any): Promise<VideoLesson>;
  publishCourse(courseId: number): Promise<Course | undefined>;
  getCourseModules(courseId: number): Promise<any[]>;
  getModuleLessons(moduleId: number): Promise<VideoLesson[]>;

  // Callern Management
  createCallernPackage(packageData: any): Promise<any>;
  getCallernPackages(): Promise<any[]>;
  getCallernPackage(id: number): Promise<any | undefined>;
  setTeacherCallernAvailability(availabilityData: any): Promise<any>;
  getTeacherCallernAvailability(): Promise<any[]>;
  updateTeacherCallernAvailability(teacherId: number, updates: {
    isOnline?: boolean;
    availableHours?: string[];
    hourlyRate?: number | null;
    lastActiveAt?: Date;
  }): Promise<any>;
  getTeachersForCallern(): Promise<any[]>;
  
  // Teacher CallerN Authorization methods
  getAuthorizedCallernTeachers(): Promise<any[]>;
  getTeacherCallernAuthorization(teacherId: number): Promise<TeacherCallernAuthorization | undefined>;
  createTeacherCallernAuthorization(data: InsertTeacherCallernAuthorization): Promise<TeacherCallernAuthorization>;
  updateTeacherCallernAuthorization(teacherId: number, updates: Partial<TeacherCallernAuthorization>): Promise<TeacherCallernAuthorization | undefined>;
  deleteTeacherCallernAuthorization(teacherId: number): Promise<boolean>;
  
  getStudentCallernPackages(studentId: number): Promise<any[]>;
  createStudentCallernPackage(packageData: any): Promise<any>;
  
  // Callern Call History
  getCallernCallHistory(): Promise<any[]>;
  createCallernCallHistory(historyData: any): Promise<any>;
  updateCallernCallHistory(id: number, updates: any): Promise<any>;
  
  // Callern Roadmaps
  createCallernRoadmap(roadmapData: any): Promise<any>;
  getCallernRoadmaps(): Promise<any[]>;
  getCallernRoadmap(id: number): Promise<any | undefined>;
  updateCallernRoadmap(id: number, updates: any): Promise<any | undefined>;
  deleteCallernRoadmap(id: number): Promise<void>;
  getRoadmapByPackageId(packageId: number): Promise<any | undefined>;
  
  // Callern Roadmap Steps
  createRoadmapStep(stepData: any): Promise<any>;
  getRoadmapSteps(roadmapId: number): Promise<any[]>;
  getRoadmapStep(id: number): Promise<any | undefined>;
  updateRoadmapStep(id: number, updates: any): Promise<any | undefined>;
  deleteRoadmapStep(id: number): Promise<void>;
  
  // Learning Roadmap System
  createLearningRoadmap(roadmapData: any): Promise<any>;
  createRoadmapMilestone(milestoneData: any): Promise<any>;
  getRoadmapTemplate(id: number): Promise<any | undefined>;
  createRoadmapInstance(instanceData: any): Promise<any>;
  initializeActivityInstances(instanceId: number): Promise<void>;
  getRoadmapInstance(id: number): Promise<any | undefined>;
  getRoadmapInstanceWithProgress(id: number): Promise<any | undefined>;
  enrichInstanceWithMetrics(instance: any): Promise<any>;
  getRoadmapInstances(filters: any): Promise<any[]>;
  adjustRoadmapPacing(instanceId: number, adjustmentDays: number, reason: string, userId: number): Promise<any>;
  updateRoadmapInstanceStatus(instanceId: number, status: string): Promise<any | undefined>;
  getRoadmapPosition(instanceId: number): Promise<any>;
  getRoadmapInstanceAnalytics(instanceId: number): Promise<any>;
  resetRoadmapInstance(instanceId: number, keepCompleted: boolean): Promise<any>;
  
  // Student Roadmap Progress
  getStudentRoadmapProgress(studentId: number, packageId: number): Promise<any[]>;
  getStudentCurrentStep(studentId: number, roadmapId: number): Promise<any | undefined>;
  markStepCompleted(progressData: any): Promise<any>;
  updateStepProgress(id: number, updates: any): Promise<any | undefined>;
  
  // Student Briefing for Teachers
  getStudentCallernBriefing(studentId: number): Promise<{
    profile: any;
    currentPackage: any;
    roadmapProgress: any[];
    pastLessons: any[];
    assignedTasks: any[];
    recentPerformance: any;
  }>;
  
  // CallerN Scoring System
  createCallernPresence(presence: InsertCallernPresence): Promise<CallernPresence>;
  updateCallernPresence(lessonId: number, userId: number, updates: Partial<CallernPresence>): Promise<CallernPresence | undefined>;
  getCallernPresence(lessonId: number, userId: number): Promise<CallernPresence | undefined>;
  
  createCallernSpeechSegment(segment: InsertCallernSpeechSegment): Promise<CallernSpeechSegment>;
  getCallernSpeechSegments(lessonId: number, userId?: number): Promise<CallernSpeechSegment[]>;
  
  createCallernScoresStudent(scores: InsertCallernScoresStudent): Promise<CallernScoresStudent>;
  updateCallernScoresStudent(lessonId: number, studentId: number, updates: Partial<CallernScoresStudent>): Promise<CallernScoresStudent | undefined>;
  getCallernScoresStudent(lessonId: number, studentId: number): Promise<CallernScoresStudent | undefined>;
  
  createCallernScoresTeacher(scores: InsertCallernScoresTeacher): Promise<CallernScoresTeacher>;
  updateCallernScoresTeacher(lessonId: number, teacherId: number, updates: Partial<CallernScoresTeacher>): Promise<CallernScoresTeacher | undefined>;
  getCallernScoresTeacher(lessonId: number, teacherId: number): Promise<CallernScoresTeacher | undefined>;
  
  createCallernScoringEvent(event: InsertCallernScoringEvent): Promise<CallernScoringEvent>;
  getCallernScoringEvents(lessonId: number): Promise<CallernScoringEvent[]>;
  
  // Schedule Conflict Checking (Check-First Protocol)
  checkTeacherScheduleConflicts(teacherId: number, proposedHours: string[]): Promise<{
    hasConflicts: boolean;
    conflicts: any[];
    conflictType: string;
    conflictingHours: string[];
  }>;

  // IRT (Item Response Theory) System
  getStudentIRTAbility(studentId: number): Promise<{
    theta: number;
    standardError: number;
    totalResponses: number;
  } | undefined>;
  updateStudentIRTAbility(studentId: number, ability: {
    theta: number;
    standardError: number;
    totalResponses: number;
    lastUpdated: Date;
  }): Promise<void>;
  createIRTResponse(response: {
    studentId: number;
    sessionId: number;
    itemId: string;
    correct: boolean;
    responseTime: number;
    theta: number;
  }): Promise<any>;

  // Sessions
  getUserSessions(userId: number): Promise<(Session & { tutorName: string })[]>;
  getUpcomingSessions(userId: number): Promise<(Session & { tutorName: string, tutorAvatar: string })[]>;
  getAllSessions(): Promise<Session[]>;
  getSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;

  // Teacher-specific methods (teachers only set availability, admin assigns them to classes)
  getTeacherClasses(teacherId: number): Promise<any[]>; // Classes assigned by admin
  getTeacherClass(classId: number, teacherId: number): Promise<any | undefined>;
  getTeacherAssignments(teacherId: number): Promise<any[]>;
  createTeacherAssignment(assignment: any): Promise<any>;
  updateAssignmentFeedback(assignmentId: number, feedback: string, score?: number): Promise<any>;
  getTeacherResources(teacherId: number): Promise<any[]>;
  createTeacherResource(resource: any): Promise<any>;
  deleteTeacherResource(resourceId: number, teacherId: number): Promise<void>;
  getSessionAttendance(sessionId: number): Promise<any[]>;
  markAttendance(sessionId: number, studentId: number, status: 'present' | 'absent' | 'late'): Promise<any>;
  getAbsenteeReport(teacherId: number): Promise<any[]>; // Students absent 2+ consecutive sessions
  getSessionMessages(sessionId: number): Promise<any[]>;
  sendSessionMessage(messageData: any): Promise<any>;
  getClassMessages(classId: number): Promise<any[]>;
  createClassMessage(messageData: any): Promise<any>;
  getRoomEquipment(roomId: number): Promise<any>;
  updateSessionStatus(id: number, status: string): Promise<Session | undefined>;

  // Messages
  getUserMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]>;
  getRecentMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Homework
  getUserHomework(userId: number): Promise<(Homework & { courseName: string, teacherName: string })[]>;
  getPendingHomework(userId: number): Promise<(Homework & { courseName: string })[]>;
  createHomework(homework: InsertHomework): Promise<Homework>;
  updateHomeworkStatus(id: number, status: string, submission?: string): Promise<Homework | undefined>;

  // Payments
  getUserPayments(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;

  // Notifications
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Branding
  getBranding(): Promise<InstituteBranding | undefined>;
  updateBranding(branding: InsertBranding): Promise<InstituteBranding>;

  // Tutors
  getTutors(): Promise<User[]>;
  getFeaturedTutors(): Promise<User[]>;

  // CRM - Student Management
  getStudentProfiles(): Promise<(UserProfile & { userName: string, userEmail: string })[]>;
  getStudentsWithProfiles(): Promise<any[]>;
  getStudentProfile(userId: number): Promise<UserProfile | undefined>;
  createStudentProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateStudentProfile(id: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;

  // CRM - Lead Management
  getLeads(): Promise<(Lead & { assignedToName?: string })[]>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByPhone(phoneNumber: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;

  // CRM - Financial Management
  getInvoices(): Promise<(Invoice & { studentName: string, courseName?: string })[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined>;

  // CRM - Teacher Performance (use evaluation tables)
  getTeacherPerformance(teacherId?: number): Promise<any[]>;
  createTeacherPerformance(performance: any): Promise<any>;

  // Teacher Availability Management
  getTeacherAvailability(teacherId: number): Promise<any[]>;
  createTeacherAvailability(availabilityData: any): Promise<any>;
  getTeacherAvailabilitySlot(slotId: number): Promise<any | undefined>;
  updateTeacherAvailability(slotId: number, updates: any): Promise<any>;
  deleteTeacherAvailability(slotId: number): Promise<void>;

  // CRM - Attendance
  getAttendance(sessionId?: number, studentId?: number): Promise<AttendanceRecord[]>;
  createAttendance(attendance: InsertAttendanceRecord): Promise<AttendanceRecord>;

  // CRM - Communication Logs
  getCommunicationLogs(contactId?: number): Promise<(CommunicationLog & { staffName: string })[]>;
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;

  // Gamification
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats | undefined>;
  getDailyGoals(userId: number, date?: string): Promise<DailyGoal[]>;
  createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal>;
  updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<DailyGoal | undefined>;

  // Skill Assessment & Activity Tracking
  getSkillAssessments(userId: number): Promise<SkillAssessment[]>;
  getLatestSkillAssessment(userId: number, skillType: string): Promise<SkillAssessment | undefined>;
  createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment>;
  getLearningActivities(userId: number): Promise<LearningActivity[]>;
  createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity>;
  getLatestProgressSnapshot(userId: number): Promise<ProgressSnapshot | undefined>;
  getProgressSnapshots(userId: number, limit?: number): Promise<ProgressSnapshot[]>;
  createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot>;

  // Leads Management
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLeadsByWorkflowStatus(workflowStatus: string): Promise<Lead[]>;
  getLeadsByAssignee(assignee: string): Promise<Lead[]>;
  // Focused query for SMS reminders with only required fields
  getFollowUpReminderCandidates(workflowStatus: string): Promise<{
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    workflowStatus: string | null;
    nextFollowUpDate: Date | null;
    smsReminderEnabled: boolean | null;
    smsReminderSentAt: Date | null;
    studentId: number | null;
  }[]>;
  
  // Dashboard Stats
  getAdminDashboardStats(): Promise<any>;
  getTeacherDashboardStats(teacherId: number): Promise<any>;
  getStudentDashboardStats(studentId: number): Promise<any>;
  getCallCenterDashboardStats(agentId: number): Promise<any>;
  getAccountantDashboardStats(): Promise<any>;
  getMentorAssignments(mentorId: number): Promise<any[]>;
  createMentorAssignment(assignment: InsertMentorAssignment): Promise<MentorAssignment>;
  getMentoringSessions(assignmentId: number): Promise<MentoringSession[]>;
  createMentoringSession(session: InsertMentoringSession): Promise<MentoringSession>;
  getUnassignedStudents(): Promise<any[]>;
  getAvailableMentors(): Promise<any[]>;
  getTeacherStudentBundles(): Promise<any[]>;
  getCallCenterStats(agentId: number): Promise<any>;

  // Extended CRM Methods
  getCRMStats(): Promise<any>;
  getStudentsWithFilters(filters: any): Promise<any>;
  getStudentDetails(id: number): Promise<any>;
  createStudent(student: any): Promise<any>;
  updateStudent(id: number, updates: any): Promise<any>;
  getTeachersWithFilters(filters: any): Promise<any>;
  getTeacherDetails(id: number): Promise<any>;
  createTeacher(teacher: any): Promise<any>;
  getStudentGroupsWithFilters(filters: any): Promise<any>;
  getStudentGroupDetails(id: number): Promise<any>;
  createStudentGroup(group: any): Promise<any>;
  getAttendanceRecords(filters: any): Promise<any>;
  createAttendanceRecord(record: any): Promise<any>;
  getStudentNotes(studentId: number): Promise<any>;
  createStudentNote(note: any): Promise<any>;
  getStudentParents(studentId: number): Promise<any>;
  createParentGuardian(parent: any): Promise<any>;
  getCommunicationLogs(filters?: any): Promise<any>;
  createCommunicationLog(log: any): Promise<any>;
  getStudentReports(filters: any): Promise<any>;
  createStudentReport(report: any): Promise<any>;
  getInstitutes(): Promise<any>;
  createInstitute(institute: any): Promise<any>;
  getInvoices(): Promise<any>;
  createInvoice(invoice: any): Promise<any>;
  getPaymentTransactions(filters: any): Promise<any>;
  getDailyRevenue(date: string): Promise<any>;
  getFinancialStats(): Promise<any>;
  getTeacherEvaluations(filters: any): Promise<any>;
  createTeacherEvaluation(evaluation: any): Promise<any>;
  getClassObservations(filters: any): Promise<any>;
  createClassObservation(observation: any): Promise<any>;
  getSystemMetrics(): Promise<any>;
  createSystemMetric(metric: any): Promise<any>;
  
  // Student-specific methods
  getStudentAssignments(studentId: number): Promise<any[]>;
  getStudentGoals(studentId: number): Promise<any[]>;
  getStudentHomework(studentId: number): Promise<any[]>;
  getAllPayments(): Promise<Payment[]>;
  deleteGame(gameId: number): Promise<void>;
  getUserReferralCommissions(userId: number): Promise<any[]>;
  getReferralLinkByCode(code: string): Promise<any | undefined>;
  trackReferralActivity(activity: any): Promise<any>;
  getSupervisionObservations(): Promise<any[]>;
  getSupervisorDailyIncome(supervisorId: number): Promise<any>;
  getTeachersNeedingAttention(): Promise<any[]>;
  getStudentsNeedingAttention(): Promise<any[]>;
  getUpcomingSessionsForObservation(): Promise<any[]>;
  getEnhancedSupervisorStats(supervisorId: number): Promise<any>;
  getSupervisorTargets(supervisorId: number): Promise<any[]>;
  createSupervisorTarget(target: any): Promise<any>;
  updateSupervisorTarget(targetId: number, updates: any): Promise<any>;
  getObservationsBySessionAndTeacher(sessionId: number, teacherId: number): Promise<any[]>;
  getTeacherPaymentHistory(teacherId: number): Promise<any[]>;
  createTeacherStudentAssignment(assignment: any): Promise<any>;
  getAllMentorAssignments(): Promise<any[]>;

  // Callern Integration Methods
  getCallernPackages(): Promise<any[]>;
  getTeacherCallernAvailability(teacherId?: number): Promise<any[]>;
  getTeachersForCallern(): Promise<any[]>;
  createCallernPackage(pkg: any): Promise<any>;
  getCallernPackage(id: number): Promise<any>;
  updateCallernPackage(id: number, updates: any): Promise<any>;
  deleteCallernPackage(id: number): Promise<void>;
  setTeacherCallernAvailability(teacherId: number, availability: any): Promise<any>;
  
  // Additional missing supervision methods
  getSupervisionStats(supervisorId?: number): Promise<any>;
  getLiveClassSessions(filters?: any): Promise<any[]>;
  getTeacherRetentionData(filters?: any): Promise<any>;
  getOverdueObservations(): Promise<any[]>;
  getPendingObservations(): Promise<any[]>;
  getScheduledObservations(): Promise<any[]>;
  
  // Overload for setTeacherCallernAvailability
  setTeacherCallernAvailability(availabilityData: any): Promise<any>;

  // Mood-Based Learning Recommendation System Methods
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodHistory(userId: number, days?: number): Promise<MoodEntry[]>;
  getMoodEntryById(id: number): Promise<MoodEntry | undefined>;
  createMoodRecommendation(recommendation: InsertMoodRecommendation): Promise<MoodRecommendation>;
  getMoodRecommendations(userId: number, days?: number): Promise<MoodRecommendation[]>;
  getMoodRecommendationById(id: number): Promise<MoodRecommendation | undefined>;
  updateMoodRecommendation(id: number, updates: Partial<MoodRecommendation>): Promise<MoodRecommendation | undefined>;
  createLearningAdaptation(adaptation: InsertLearningAdaptation): Promise<LearningAdaptation>;
  getLearningAdaptations(userId: number): Promise<LearningAdaptation[]>;
  updateLearningAdaptation(id: number, updates: Partial<LearningAdaptation>): Promise<LearningAdaptation | undefined>;
  
  // Enterprise Features
  // Teacher Payment Management
  getTeacherPayments(period: string): Promise<any[]>;
  calculateTeacherPayments(period: string): Promise<any[]>;
  approveTeacherPayment(paymentId: number): Promise<any>;
  getTeachersWithRates(): Promise<any[]>;
  updateTeacherRates(teacherId: number, regularRate: number, callernRate?: number): Promise<any>;
  updateTeacherPayment(paymentId: number, updates: any): Promise<any>;
  getTeacherSessionCount(teacherId: number): Promise<number>;
  getTeacherPaymentHistory(teacherId: number, limit: number, offset: number): Promise<any[]>;
  
  // White-Label Institute Management
  getWhiteLabelInstitutes(): Promise<any[]>;
  createWhiteLabelInstitute(institute: any): Promise<any>;
  updateWhiteLabelInstitute(id: number, updates: any): Promise<any>;
  
  // Campaign Management
  getMarketingCampaigns(): Promise<any[]>;
  createMarketingCampaign(campaign: any): Promise<any>;
  updateMarketingCampaign(campaignId: number, updates: any): Promise<any>;
  getCampaignAnalytics(): Promise<any>;
  
  // Website Builder
  getWebsiteTemplates(): Promise<any[]>;
  deployWebsite(deployment: any): Promise<any>;
  
  // Supervision System - Student Questionnaires
  getStudentQuestionnaires(courseId?: number): Promise<StudentQuestionnaire[]>;
  createStudentQuestionnaire(questionnaire: InsertStudentQuestionnaire): Promise<StudentQuestionnaire>;
  updateStudentQuestionnaire(id: number, updates: Partial<StudentQuestionnaire>): Promise<StudentQuestionnaire | undefined>;
  deleteStudentQuestionnaire(id: number): Promise<void>;
  
  // Questionnaire Responses
  getQuestionnaireResponses(questionnaireId?: number, teacherId?: number): Promise<QuestionnaireResponse[]>;
  createQuestionnaireResponse(response: InsertQuestionnaireResponse): Promise<QuestionnaireResponse>;
  updateQuestionnaireResponse(id: number, updates: Partial<QuestionnaireResponse>): Promise<QuestionnaireResponse | undefined>;
  
  // ===== TESTING SUBSYSTEM =====
  // Test management
  createTest(test: InsertTest): Promise<Test>;
  getTestById(id: number): Promise<Test | undefined>;
  getTestsByCourse(courseId: number): Promise<Test[]>;
  getTestsByTeacher(teacherId: number): Promise<Test[]>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;
  
  // Test questions
  createTestQuestion(question: InsertTestQuestion): Promise<TestQuestion>;
  getTestQuestions(testId: number): Promise<TestQuestion[]>;
  updateTestQuestion(id: number, question: Partial<InsertTestQuestion>): Promise<TestQuestion | undefined>;
  deleteTestQuestion(id: number): Promise<boolean>;
  
  // Test attempts
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  getTestAttemptById(id: number): Promise<TestAttempt | undefined>;
  getStudentTestAttempts(studentId: number, testId: number): Promise<TestAttempt[]>;
  updateTestAttempt(id: number, attempt: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined>;
  
  // Test answers
  saveTestAnswer(answer: InsertTestAnswer): Promise<TestAnswer>;
  getTestAnswers(attemptId: number): Promise<TestAnswer[]>;
  gradeTestAnswer(id: number, grade: { isCorrect: boolean; pointsEarned: number; feedback?: string }): Promise<TestAnswer | undefined>;
  
  // ===== GAMIFICATION SUBSYSTEM =====
  // Games
  getAllGames(): Promise<Game[]>;
  getGames(): Promise<Game[]>;
  getGamePlayStatistics(gameId: number): Promise<{ totalPlays: number; averageScore: number; lastPlayed: Date }>;
  getTodaysChallenges(userId: number): Promise<any[]>;
  generatePersonalizedChallenges(userId: number, userProgress: any, userProfile: any): Promise<any[]>;
  getUserProgress(userId: number): Promise<any>;
  
  // AI Models Methods
  getAiModels(): Promise<any[]>;
  getAiDatasets(): Promise<any[]>;
  getAiTrainingJobs(): Promise<any[]>;
  
  // System Configuration Methods
  getSystemRoles(): Promise<any[]>;
  getSystemIntegrations(): Promise<any[]>;
  createGame(game: InsertGame): Promise<Game>;
  getGameById(id: number): Promise<Game | undefined>;
  getGamesByAgeGroup(ageGroup: string): Promise<Game[]>;
  getGamesByLevel(level: string): Promise<Game[]>;
  getGamesByFilters(filters: { ageGroup?: string, gameType?: string, level?: string, language?: string }): Promise<Game[]>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  getGameAnalytics(gameId: number): Promise<any>;
  deleteGame(id: number): Promise<boolean>;
  
  // Game Access Control
  getStudentAccessibleGames(studentId: number): Promise<Game[]>;
  createGameAccessRule(rule: any): Promise<any>;
  getGameAccessRules(gameId?: number): Promise<any[]>;
  updateGameAccessRule(id: number, updates: any): Promise<any>;
  deleteGameAccessRule(id: number): Promise<void>;
  assignGameToStudent(assignment: any): Promise<any>;
  getStudentGameAssignments(studentId: number): Promise<any[]>;
  updateStudentGameAssignment(id: number, updates: any): Promise<any>;
  removeStudentGameAssignment(id: number): Promise<void>;
  assignGameToCourse(courseGameData: any): Promise<any>;
  getCourseGames(courseId: number): Promise<any[]>;
  updateCourseGame(id: number, updates: any): Promise<any>;
  removeCourseGame(id: number): Promise<void>;
  
  // Game levels
  createGameLevel(level: InsertGameLevel): Promise<GameLevel>;
  getGameLevels(gameId: number): Promise<GameLevel[]>;
  updateGameLevel(id: number, level: Partial<InsertGameLevel>): Promise<GameLevel | undefined>;
  
  // User game progress
  getOrCreateUserGameProgress(userId: number, gameId: number): Promise<UserGameProgress>;
  updateUserGameProgress(id: number, progress: Partial<InsertUserGameProgress>): Promise<UserGameProgress | undefined>;
  getUserGameProgressByUser(userId: number): Promise<UserGameProgress[]>;
  
  // Game sessions
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  endGameSession(id: number, sessionData: Partial<InsertGameSession>): Promise<GameSession | undefined>;
  getUserGameSessions(userId: number, gameId?: number): Promise<GameSession[]>;
  
  // Leaderboards
  updateGameLeaderboard(entry: InsertGameLeaderboard): Promise<GameLeaderboard>;
  getGameLeaderboard(gameId?: number, type?: string, period?: string): Promise<GameLeaderboard[]>;
  getGlobalLeaderboard(): Promise<any[]>;
  
  // Game Questions - Real game content
  createGameQuestion(question: InsertGameQuestion): Promise<GameQuestion>;
  getGameQuestions(gameId: number, levelId?: number): Promise<GameQuestion[]>;
  getRandomGameQuestions(gameId: number, count: number, difficulty?: string): Promise<GameQuestion[]>;
  updateGameQuestion(id: number, question: Partial<InsertGameQuestion>): Promise<GameQuestion | undefined>;
  deleteGameQuestion(id: number): Promise<boolean>;
  updateQuestionStats(questionId: number, isCorrect: boolean, responseTime: number): Promise<void>;
  
  // Daily Challenges
  createDailyChallenge(challenge: InsertGameDailyChallenge): Promise<GameDailyChallenge>;
  getTodayChallenge(): Promise<GameDailyChallenge | undefined>;
  getDailyChallengeById(id: number): Promise<GameDailyChallenge | undefined>;
  getActiveDailyChallenges(): Promise<GameDailyChallenge[]>;
  updateDailyChallenge(id: number, challenge: Partial<InsertGameDailyChallenge>): Promise<GameDailyChallenge | undefined>;
  generateDailyChallenge(): Promise<GameDailyChallenge>;
  
  // User Daily Challenge Progress
  createUserDailyChallengeProgress(progress: InsertUserDailyChallengeProgress): Promise<UserDailyChallengeProgress>;
  getUserDailyChallengeProgress(userId: number, challengeId: number): Promise<UserDailyChallengeProgress | undefined>;
  updateUserDailyChallengeProgress(id: number, progress: Partial<InsertUserDailyChallengeProgress>): Promise<UserDailyChallengeProgress | undefined>;
  getUserDailyChallengeHistory(userId: number): Promise<UserDailyChallengeProgress[]>;
  completeDailyChallenge(userId: number, challengeId: number, performance: any): Promise<UserDailyChallengeProgress | undefined>;
  
  // Game Answer Logs - Track all answers for analytics
  createGameAnswerLog(log: InsertGameAnswerLog): Promise<GameAnswerLog>;
  getGameAnswerLogs(sessionId: number): Promise<GameAnswerLog[]>;
  getUserAnswerLogs(userId: number, questionId?: number): Promise<GameAnswerLog[]>;
  getQuestionAnalytics(questionId: number): Promise<any>;
  
  // User achievements and stats
  getUserAchievements(userId: number): Promise<any[]>;
  getUserStats(userId: number): Promise<any>;
  updateUserStats(userId: number, stats: any): Promise<any>;
  
  // Game courses (individual courses)
  createGameCourse(gameCourse: any): Promise<any>;
  getGameCourses(): Promise<any[]>;
  
  // Supplementary games (for existing courses)
  addSupplementaryGames(data: { courseId: number, gameIds: number[], isRequired: boolean }): Promise<any>;
  getSupplementaryGames(courseId: number): Promise<any[]>;
  
  // ===== VIDEO LEARNING SUBSYSTEM =====
  // Video lessons
  createVideoLesson(lesson: InsertVideoLesson): Promise<VideoLesson>;
  getVideoLesson(id: number): Promise<VideoLesson | undefined>; // Alias for getVideoLessonById
  getVideoLessonById(id: number): Promise<VideoLesson | undefined>;
  getVideoLessonsByCourse(courseId: number): Promise<VideoLesson[]>;
  getTeacherVideoLessons(teacherId: number): Promise<VideoLesson[]>;
  getAllVideoLessons(): Promise<VideoLesson[]>;
  updateVideoLesson(id: number, lesson: Partial<InsertVideoLesson>): Promise<VideoLesson | undefined>;
  deleteVideoLesson(id: number): Promise<boolean>;
  
  // Video progress
  getOrCreateVideoProgress(userId: number, videoId: number): Promise<VideoProgress>;
  updateVideoProgress(data: { studentId: number, videoLessonId: number, watchTime: number, totalDuration: number, completed: boolean }): Promise<VideoProgress | undefined>;
  getUserVideoProgress(userId: number): Promise<VideoProgress[]>;
  getStudentVideoProgress(studentId: number): Promise<VideoProgress[]>;
  
  // Video notes & bookmarks
  createVideoNote(note: InsertVideoNote): Promise<VideoNote>;
  getUserVideoNotes(userId: number, videoId: number): Promise<VideoNote[]>;
  getVideoNotes(studentId: number, videoId: number): Promise<VideoNote[]>;
  createVideoBookmark(bookmark: InsertVideoBookmark): Promise<VideoBookmark>;
  getUserVideoBookmarks(userId: number, videoId: number): Promise<VideoBookmark[]>;
  getVideoBookmarks(studentId: number, videoId: number): Promise<VideoBookmark[]>;
  
  // ===== LMS FEATURES =====
  // Forums
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  getForumCategories(courseId?: number): Promise<ForumCategory[]>;
  createForumThread(thread: InsertForumThread): Promise<ForumThread>;
  getForumThreads(categoryId: number): Promise<ForumThread[]>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getForumPosts(threadId: number): Promise<ForumPost[]>;
  
  // Gradebook
  getOrCreateGradebookEntry(courseId: number, studentId: number): Promise<GradebookEntry>;
  updateGradebookEntry(id: number, entry: Partial<InsertGradebookEntry>): Promise<GradebookEntry | undefined>;
  getCourseGradebook(courseId: number): Promise<GradebookEntry[]>;
  
  // Content library
  createContentLibraryItem(item: InsertContentLibraryItem): Promise<ContentLibraryItem>;
  searchContentLibrary(filters: { language?: string; level?: string; skillArea?: string; query?: string }): Promise<ContentLibraryItem[]>;
  updateContentLibraryItem(id: number, item: Partial<InsertContentLibraryItem>): Promise<ContentLibraryItem | undefined>;
  
  // ===== AI TRACKING =====
  // Progress tracking
  getOrCreateAiProgressTracking(userId: number): Promise<AiProgressTracking>;
  updateAiProgressTracking(userId: number, progress: Partial<InsertAiProgressTracking>): Promise<AiProgressTracking | undefined>;
  
  // Activity sessions
  createAiActivitySession(session: InsertAiActivitySession): Promise<AiActivitySession>;
  endAiActivitySession(id: number, sessionData: Partial<InsertAiActivitySession>): Promise<AiActivitySession | undefined>;
  getUserAiActivitySessions(userId: number, activityType?: string): Promise<AiActivitySession[]>;
  
  // Vocabulary tracking
  trackVocabularyWord(tracking: InsertAiVocabularyTracking): Promise<AiVocabularyTracking>;
  getUserVocabularyTracking(userId: number): Promise<AiVocabularyTracking[]>;
  
  // Grammar tracking
  trackGrammarPattern(tracking: InsertAiGrammarTracking): Promise<AiGrammarTracking>;
  getUserGrammarTracking(userId: number): Promise<AiGrammarTracking[]>;
  
  // Pronunciation analysis
  createPronunciationAnalysis(analysis: InsertAiPronunciationAnalysis): Promise<AiPronunciationAnalysis>;
  getUserPronunciationAnalyses(userId: number): Promise<AiPronunciationAnalysis[]>;
  
  // ===== ROOM MANAGEMENT =====
  // Room CRUD operations
  getRooms(): Promise<Room[]>;
  getRoomById(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  getActiveRooms(): Promise<Room[]>;
  getRoomsByType(type: string): Promise<Room[]>;

  // ===== STUDENT API METHODS =====
  getStudentAssignments(userId: number): Promise<any[]>;
  getStudentGoals(userId: number): Promise<any[]>;
  getStudentHomework(userId: number): Promise<any[]>;

  // ===== SUPERVISION METHODS =====
  getRecentSupervisionObservations(supervisorId?: number): Promise<any[]>;
  getTeacherPerformanceData(supervisorId?: number): Promise<any[]>;
  getSupervisionStats(): Promise<any>;
  
  // Teacher observation workflow methods
  getTeacherObservations(teacherId: number): Promise<SupervisionObservation[]>;
  getUnacknowledgedObservations(teacherId: number): Promise<SupervisionObservation[]>;
  acknowledgeObservation(observationId: number, teacherId: number): Promise<void>;
  createTeacherObservationResponse(response: InsertTeacherObservationResponse): Promise<TeacherObservationResponse>;
  getObservationResponses(observationId: number): Promise<TeacherObservationResponse[]>;
  updateObservationResponse(observationId: number, teacherId: number, updates: Partial<SupervisionObservation>): Promise<SupervisionObservation | undefined>;
  getTotalUsers(): Promise<number>;
  
  // Analytics methods
  getRevenueAnalytics(): Promise<any>;
  getStudentRetentionAnalytics(): Promise<any>;
  getMarketingMetrics(): Promise<any>;
  
  // Additional real data methods (no mock data)
  getStudentSessions(studentId: number): Promise<any[]>;
  getUserActivities(userId: number): Promise<any[]>;
  getTeacherSessions(teacherId: number): Promise<any[]>;
  getTeacherStudentCount(teacherId: number): Promise<number>;
  getTeacherRevenue(teacherId: number): Promise<number>;
  getTeacherReviews(teacherId: number): Promise<any[]>;
  getAllTeacherReviews(): Promise<any[]>;
  getCourseEnrollmentCount(courseId: number): Promise<number>;
  getCourseCompletionRate(courseId: number): Promise<number>;
  getCourseRating(courseId: number): Promise<number | null>;
  getCourseCompletionAnalytics(): Promise<any>;
  getOperationalMetrics(): Promise<any>;
  getFinancialKPIs(): Promise<any>;
  getRegistrationAnalytics(): Promise<any>;
  getTeacherPerformanceAnalytics(): Promise<any>;
  
  // Student-specific chat methods (temporary until refactored)
  getStudentConversations(studentId: number): Promise<any[]>;
  getConversationMessages(conversationId: number, userId: number): Promise<any[]>;
  sendConversationMessage(conversationId: number, senderId: number, text: string): Promise<any>;
  
  // PHASE 1: Critical System Tables Implementation
  
  // Audit Logging (Security & Compliance)
  createAuditLog(log: {
    userId: number;
    userRole: string;
    action: string;
    resourceType: string;
    resourceId?: number;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any>;
  getAuditLogs(filters?: {
    userId?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]>;
  
  // Email Logging (Communication Tracking)
  createEmailLog(log: {
    recipientId: number;
    recipientEmail: string;
    templateType: string;
    subject: string;
    contentJson?: any;
    status?: string;
  }): Promise<any>;
  updateEmailLogStatus(id: number, status: string, errorMessage?: string): Promise<any>;
  getEmailLogs(filters?: {
    recipientId?: number;
    templateType?: string;
    status?: string;
  }): Promise<any[]>;
  
  // Student Reports (Core Feature)
  createStudentReport(report: {
    studentId: number;
    generatedBy: number;
    reportType: string;
    period: string;
    startDate: string;
    endDate: string;
    data: any;
    comments?: string;
  }): Promise<any>;
  getStudentReports(studentId: number): Promise<any[]>;
  publishStudentReport(reportId: number): Promise<any>;
  getPublishedReports(studentId: number): Promise<any[]>;
  
  // Payment Transactions (Financial Tracking)
  createPaymentTransaction(transaction: {
    studentId: number;
    amount: number;
    method: string;
    description?: string;
    invoiceId?: number;
  }): Promise<any>;
  updatePaymentTransactionStatus(id: number, status: string, details?: any): Promise<any>;
  getPaymentTransactions(filters?: {
    studentId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]>;
  getTransactionDetails(id: number): Promise<any>;
  
  // Accounting Ledger System (Double-Entry Bookkeeping)
  // Chart of Accounts
  getChartOfAccounts(): Promise<ChartOfAccounts[]>;
  getAccountByCode(accountCode: string): Promise<ChartOfAccounts | undefined>;
  getAccountsByType(accountType: string): Promise<ChartOfAccounts[]>;
  createChartOfAccount(account: InsertChartOfAccounts): Promise<ChartOfAccounts>;
  updateChartOfAccount(id: number, updates: Partial<ChartOfAccounts>): Promise<ChartOfAccounts | undefined>;
  
  // Accounting Ledger
  createLedgerEntry(entry: InsertAccountingLedger): Promise<AccountingLedger>;
  createDoubleEntry(params: {
    debitAccountId: number;
    creditAccountId: number;
    amount: string | number;
    sourceType: string;
    sourceId: number;
    description?: string;
    referenceNumber?: string;
    createdBy?: number;
  }): Promise<{ debit: AccountingLedger; credit: AccountingLedger }>;
  getLedgerEntries(filters?: {
    accountId?: number;
    sourceType?: string;
    sourceId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AccountingLedger[]>;
  getLedgerEntriesByJournalEntry(journalEntryId: string): Promise<AccountingLedger[]>;
  getAccountBalance(accountId: number, asOfDate?: Date): Promise<{ balance: number; currency: string }>;
  reconcileLedgerEntry(id: number, reconciledBy: number): Promise<AccountingLedger | undefined>;
  
  // Financial Reports
  getTrialBalance(asOfDate?: Date): Promise<any[]>;
  getBalanceSheet(asOfDate?: Date): Promise<any>;
  getProfitAndLoss(startDate: Date, endDate: Date): Promise<any>;
  
  // PHASE 2: Organizational & Student Management Tables
  
  // ===== ORGANIZATIONAL STRUCTURE =====
  // Institutes Management
  getInstitutes(): Promise<any[]>;
  getInstituteById(id: number): Promise<any>;
  createInstitute(institute: any): Promise<any>;
  updateInstitute(id: number, updates: any): Promise<any>;
  deleteInstitute(id: number): Promise<boolean>;
  
  // Departments Management
  getDepartments(instituteId?: number): Promise<any[]>;
  getDepartmentById(id: number): Promise<any>;
  createDepartment(department: any): Promise<any>;
  updateDepartment(id: number, updates: any): Promise<any>;
  deleteDepartment(id: number): Promise<boolean>;
  isTeacherAssignedToDepartment(teacherId: number, departmentId: number): Promise<boolean>;
  
  // Custom Roles Management
  getCustomRoles(): Promise<any[]>;
  getCustomRoleById(id: number): Promise<any>;
  createCustomRole(role: any): Promise<any>;
  updateCustomRole(id: number, updates: any): Promise<any>;
  deleteCustomRole(id: number): Promise<boolean>;
  
  // ===== STUDENT MANAGEMENT =====
  // Mentor Assignments
  getMentorAssignments(mentorId?: number, studentId?: number): Promise<any[]>;
  createMentorAssignment(assignment: any): Promise<any>;
  updateMentorAssignment(id: number, updates: any): Promise<any>;
  deleteMentorAssignment(id: number): Promise<boolean>;
  getActiveMentorAssignments(mentorId: number): Promise<any[]>;
  
  // Mentoring Sessions
  getMentoringSessions(mentorId?: number, studentId?: number): Promise<any[]>;
  createMentoringSession(session: any): Promise<any>;
  updateMentoringSession(id: number, updates: any): Promise<any>;
  completeMentoringSession(id: number, outcome: any): Promise<any>;
  
  // Parent/Guardian Management
  getParentGuardians(studentId: number): Promise<any[]>;
  getParentGuardianById(id: number): Promise<any>;
  createParentGuardian(guardian: any): Promise<any>;
  updateParentGuardian(id: number, updates: any): Promise<any>;
  deleteParentGuardian(id: number): Promise<boolean>;
  
  // Student Notes
  getStudentNotes(studentId: number, teacherId?: number): Promise<any[]>;
  createStudentNote(note: any): Promise<any>;
  updateStudentNote(id: number, updates: any): Promise<any>;
  deleteStudentNote(id: number): Promise<boolean>;
  
  // ===== PLACEMENT & ASSESSMENT =====
  // Level Assessment Questions
  getLevelAssessmentQuestions(language?: string, difficulty?: string): Promise<any[]>;
  createLevelAssessmentQuestion(question: any): Promise<any>;
  updateLevelAssessmentQuestion(id: number, updates: any): Promise<any>;
  deleteLevelAssessmentQuestion(id: number): Promise<boolean>;
  
  // Level Assessment Results
  getLevelAssessmentResults(userId: number, language?: string): Promise<any[]>;
  createLevelAssessmentResult(result: any): Promise<any>;
  getLatestAssessmentResult(userId: number, language: string): Promise<any>;
  
  // Placement Test Management (using tests table with type='placement')
  getPlacementTests(): Promise<any[]>;
  createPlacementTest(test: any): Promise<any>;
  assignPlacementTest(studentId: number, testId: number): Promise<any>;
  getStudentPlacementResults(studentId: number): Promise<any[]>;
  
  // ===== PHASE 4: REMAINING UNCONNECTED TABLES (16 TABLES) =====
  
  // Learning Support Tables
  addGlossaryItem(data: any): Promise<any>;
  getUserGlossary(userId: number): Promise<any[]>;
  createRewriteSuggestion(data: any): Promise<any>;
  getUserRewriteSuggestions(userId: number): Promise<any[]>;
  createSuggestedTerm(data: any): Promise<any>;
  getUserSuggestedTerms(userId: number): Promise<any[]>;
  addToAIKnowledgeBase(data: any): Promise<any>;
  searchAIKnowledgeBase(category: string, language?: string): Promise<any[]>;
  
  // Business Operations Tables
  createInvoice(data: any): Promise<any>;
  getUserInvoices(userId: number): Promise<any[]>;
  createCourseReferral(data: any): Promise<any>;
  getReferralsByUser(userId: number): Promise<any[]>;
  createReferralCommission(data: any): Promise<any>;
  getUserCommissions(userId: number): Promise<any[]>;
  getReferralSettings(): Promise<any>;
  updateReferralSettings(data: any): Promise<any>;
  
  // Group Management Tables
  createStudentGroup(data: any): Promise<any>;
  getStudentGroups(): Promise<any[]>;
  addStudentToGroup(groupId: number, studentId: number): Promise<any>;
  getGroupMembers(groupId: number): Promise<any[]>;
  updateStudentPreferences(userId: number, preferences: any): Promise<any>;
  getStudentPreferences(userId: number): Promise<any>;
  
  // System Tables
  getSystemConfig(key: string): Promise<any>;
  setSystemConfig(key: string, value: any): Promise<any>;
  recordSystemMetric(data: any): Promise<any>;
  getSystemMetrics(metricType: string, limit?: number): Promise<any[]>;
  createCourseSession(data: any): Promise<any>;
  getCourseSessions(courseId: number): Promise<any[]>;
  
  // Assessment Tables
  recordQuizResult(data: any): Promise<any>;
  getUserQuizResults(userId: number): Promise<any[]>;
  createClassObservation(data: any): Promise<any>;
  getTeacherObservations(teacherId: number): Promise<any[]>;

  // Teacher Supervision Dashboard Methods
  getActiveTeacherSessions(): Promise<any[]>;
  createTeacherReminder(reminder: {
    teacherId: number;
    sessionId: number;
    supervisorId: number;
    reminderType: string;
    message: string;
    sentAt: Date;
  }): Promise<any>;
  getTeacherPerformanceMetrics(teacherId?: number): Promise<any[]>;
  getSupervisionAlerts(): Promise<any[]>;

  // IRT Assessment Session Methods
  createAssessmentSession(session: any): Promise<void>;
  getAssessmentSession(sessionId: string): Promise<any>;
  updateAssessmentSession(session: any): Promise<void>;
  updateStudentAssessmentResults(studentId: number, results: any): Promise<void>;

  // Call Recording Methods
  createCallHistory(data: any): Promise<any>;

  // Exam-focused Roadmap Methods
  createRoadmapPlan(plan: InsertRoadmapPlan): Promise<RoadmapPlan>;
  getRoadmapPlan(id: number): Promise<RoadmapPlan | undefined>;
  updateRoadmapPlan(id: number, updates: Partial<RoadmapPlan>): Promise<RoadmapPlan | undefined>;
  deleteRoadmapPlan(id: number): Promise<void>;
  getUserRoadmapPlans(userId: number): Promise<RoadmapPlan[]>;

  createRoadmapSession(session: InsertRoadmapSession): Promise<RoadmapSession>;
  getRoadmapSession(id: number): Promise<RoadmapSession | undefined>;
  updateRoadmapSession(id: number, updates: Partial<RoadmapSession>): Promise<RoadmapSession | undefined>;
  deleteRoadmapSession(id: number): Promise<void>;
  getRoadmapSessions(planId: number): Promise<RoadmapSession[]>;
  getRoadmapSessionsWithProgress(planId: number, userId: number): Promise<(RoadmapSession & { completed: boolean; score?: number; notes?: string; timeSpent?: number })[]>;

  // MST Integration Methods
  getMSTSession(sessionId: string): Promise<any>;
  getMSTResults(sessionId: string): Promise<any>;
  getUserMSTHistory(userId: number): Promise<any[]>;
  getUserMSTResultsWithAnalytics(userId: number): Promise<any>;
  getMSTAttemptCountForPeriod(userId: number, days: number): Promise<number>;

  // AI Study Partner management
  getAiStudyPartnerByUserId(userId: number): Promise<AiStudyPartner | undefined>;
  createAiStudyPartner(data: InsertAiStudyPartner): Promise<AiStudyPartner>;
  updateAiStudyPartner(userId: number, data: Partial<AiStudyPartner>): Promise<AiStudyPartner | undefined>;

  // Chat conversation management
  getChatConversationById(id: number): Promise<ChatConversation | undefined>;
  getAiConversationByUserId(userId: number): Promise<ChatConversation | undefined>;
  createChatConversation(data: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined>;

  // Chat message management
  getChatMessages(conversationId: number, options?: { limit?: number; offset?: number }): Promise<ChatMessage[]>;
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;

  // ============================================================================
  // BOOK E-COMMERCE SYSTEM STORAGE METHODS
  // ============================================================================

  // Book categories management
  getBookCategories(): Promise<BookCategory[]>;
  getBookCategory(id: number): Promise<BookCategory | undefined>;
  getBookCategoriesByParent(parentId: number | null): Promise<BookCategory[]>;
  createBookCategory(data: BookCategoryInsert): Promise<BookCategory>;
  updateBookCategory(id: number, updates: Partial<BookCategory>): Promise<BookCategory | undefined>;
  deleteBookCategory(id: number): Promise<void>;

  // Books management
  getBooks(filters?: { category?: string; isFree?: boolean; limit?: number; offset?: number }): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBookByISBN(isbn: string): Promise<Book | undefined>;
  getBooksByCategory(category: string): Promise<Book[]>;
  getFreeBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  createBook(data: BookInsert): Promise<Book>;
  updateBook(id: number, updates: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<void>;

  // Book assets management
  getBookAssets(bookId: number): Promise<BookAsset[]>;
  getBookAsset(id: number): Promise<BookAsset | undefined>;
  createBookAsset(data: BookAssetInsert): Promise<BookAsset>;
  updateBookAsset(id: number, updates: Partial<BookAsset>): Promise<BookAsset | undefined>;
  deleteBookAsset(id: number): Promise<void>;

  // Dictionary lookups management
  getDictionaryLookups(userId: number, language?: string): Promise<DictionaryLookup[]>;
  getDictionaryLookup(id: number): Promise<DictionaryLookup | undefined>;
  createDictionaryLookup(data: DictionaryLookupInsert): Promise<DictionaryLookup>;
  deleteDictionaryLookup(id: number): Promise<void>;

  // Cart management
  getUserCart(userId: number): Promise<Cart | undefined>;
  createCart(data: CartInsert): Promise<Cart>;
  updateCart(id: number, updates: Partial<Cart>): Promise<Cart | undefined>;
  clearCart(userId: number): Promise<void>;

  // Cart items management
  getCartItems(cartId: number): Promise<(CartItem & { book: Book })[]>;
  getCartItem(id: number): Promise<CartItem | undefined>;
  addToCart(cartId: number, bookId: number, quantity?: number): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;

  // Orders management
  getOrders(userId?: number, status?: string): Promise<(Order & { items: (OrderItem & { book: Book })[] })[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { book: Book })[] }) | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  createOrder(data: OrderInsert): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  cancelOrder(id: number): Promise<Order | undefined>;

  // Order items management
  getOrderItems(orderId: number): Promise<(OrderItem & { book: Book })[]>;
  createOrderItem(data: OrderItemInsert): Promise<OrderItem>;
  updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined>;

  // User addresses management
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  getUserAddress(id: number): Promise<UserAddress | undefined>;
  getDefaultUserAddress(userId: number): Promise<UserAddress | undefined>;
  createUserAddress(data: UserAddressInsert): Promise<UserAddress>;
  updateUserAddress(id: number, updates: Partial<UserAddress>): Promise<UserAddress | undefined>;

  // Book orders management
  getAllBookOrders(): Promise<BookOrder[]>;
  getUserBookOrders(userId: number): Promise<BookOrder[]>;
  getBookOrder(id: number): Promise<BookOrder | undefined>;
  createBookOrder(data: BookOrderInsert): Promise<BookOrder>;
  updateBookOrderShipping(id: number, updates: Partial<BookOrder>): Promise<BookOrder | undefined>;
  recordBookDownload(orderId: number): Promise<void>;
  setDefaultAddress(userId: number, addressId: number): Promise<void>;
  deleteUserAddress(id: number): Promise<void>;

  // Shipping orders management
  getShippingOrders(status?: string): Promise<(ShippingOrder & { order: Order; address: UserAddress })[]>;
  getShippingOrder(id: number): Promise<(ShippingOrder & { order: Order; address: UserAddress }) | undefined>;
  getShippingOrderByOrderId(orderId: number): Promise<ShippingOrder | undefined>;
  createShippingOrder(data: ShippingOrderInsert): Promise<ShippingOrder>;
  updateShippingOrder(id: number, updates: Partial<ShippingOrder>): Promise<ShippingOrder | undefined>;
  updateShippingStatus(id: number, status: string, trackingNumber?: string): Promise<ShippingOrder | undefined>;

  // Courier tracking management
  getCourierTracking(shippingOrderId: number): Promise<CourierTracking[]>;
  createCourierTracking(data: CourierTrackingInsert): Promise<CourierTracking>;
  getLatestTrackingUpdate(shippingOrderId: number): Promise<CourierTracking | undefined>;

  // ============================================================================
  // FRONT DESK CLERK SYSTEM STORAGE METHODS
  // ============================================================================

  // Front desk operations management
  getFrontDeskOperations(filters?: { status?: string; handledBy?: number; visitType?: string; date?: string }): Promise<FrontDeskOperation[]>;
  getFrontDeskOperation(id: number): Promise<FrontDeskOperation | undefined>;
  getFrontDeskOperationsByUser(handledBy: number): Promise<FrontDeskOperation[]>;
  getFrontDeskOperationsByDateRange(startDate: string, endDate: string): Promise<FrontDeskOperation[]>;
  getPendingFrontDeskOperations(): Promise<FrontDeskOperation[]>;
  createFrontDeskOperation(data: InsertFrontDeskOperation): Promise<FrontDeskOperation>;
  updateFrontDeskOperation(id: number, updates: Partial<FrontDeskOperation>): Promise<FrontDeskOperation | undefined>;
  completeFrontDeskOperation(id: number, completionNotes?: string): Promise<FrontDeskOperation | undefined>;
  convertFrontDeskOperationToLead(id: number, leadData: any): Promise<{ operation: FrontDeskOperation; lead: any }>;
  deleteFrontDeskOperation(id: number): Promise<void>;

  // Phone call logs management  
  getPhoneCallLogs(filters?: { callType?: string; handledBy?: number; date?: string; result?: string }): Promise<PhoneCallLog[]>;
  getPhoneCallLog(id: number): Promise<PhoneCallLog | undefined>;
  getPhoneCallLogsByUser(handledBy: number): Promise<PhoneCallLog[]>;
  getPhoneCallLogsByDateRange(startDate: string, endDate: string): Promise<PhoneCallLog[]>;
  getPhoneCallLogsByNumber(phoneNumber: string): Promise<PhoneCallLog[]>;
  createPhoneCallLog(data: InsertPhoneCallLog): Promise<PhoneCallLog>;
  updatePhoneCallLog(id: number, updates: Partial<PhoneCallLog>): Promise<PhoneCallLog | undefined>;
  deletePhoneCallLog(id: number): Promise<void>;

  // Front desk tasks management
  getFrontDeskTasks(filters?: { assignedTo?: number; status?: string; taskType?: string; dueDate?: string }): Promise<FrontDeskTask[]>;
  getFrontDeskTask(id: number): Promise<FrontDeskTask | undefined>;
  getFrontDeskTasksByUser(assignedTo: number): Promise<FrontDeskTask[]>;
  getFrontDeskTasksByStatus(status: string): Promise<FrontDeskTask[]>;
  getOverdueFrontDeskTasks(): Promise<FrontDeskTask[]>;
  getTodaysFrontDeskTasks(assignedTo?: number): Promise<FrontDeskTask[]>;
  createFrontDeskTask(data: InsertFrontDeskTask): Promise<FrontDeskTask>;
  updateFrontDeskTask(id: number, updates: Partial<FrontDeskTask>): Promise<FrontDeskTask | undefined>;
  assignFrontDeskTask(id: number, assignedTo: number): Promise<FrontDeskTask | undefined>;
  completeFrontDeskTask(id: number, completionNotes?: string, taskResult?: string): Promise<FrontDeskTask | undefined>;
  generateFollowUpTask(parentTaskId: number, followUpData: Partial<InsertFrontDeskTask>): Promise<FrontDeskTask>;
  deleteFrontDeskTask(id: number): Promise<void>;

  // ============================================================================
  // SMS TEMPLATE MANAGEMENT SYSTEM STORAGE METHODS
  // ============================================================================

  // SMS Template Categories management
  getSmsTemplateCategories(): Promise<SmsTemplateCategory[]>;
  getSmsTemplateCategory(id: number): Promise<SmsTemplateCategory | undefined>;
  getSmsTemplateCategoryByName(name: string): Promise<SmsTemplateCategory | undefined>;
  createSmsTemplateCategory(data: InsertSmsTemplateCategory): Promise<SmsTemplateCategory>;
  updateSmsTemplateCategory(id: number, updates: Partial<SmsTemplateCategory>): Promise<SmsTemplateCategory | undefined>;
  deleteSmsTemplateCategory(id: number): Promise<void>;

  // SMS Template Variables management
  getSmsTemplateVariables(category?: string): Promise<SmsTemplateVariable[]>;
  getSmsTemplateVariable(id: number): Promise<SmsTemplateVariable | undefined>;
  getSmsTemplateVariableByName(name: string): Promise<SmsTemplateVariable | undefined>;
  createSmsTemplateVariable(data: InsertSmsTemplateVariable): Promise<SmsTemplateVariable>;
  updateSmsTemplateVariable(id: number, updates: Partial<SmsTemplateVariable>): Promise<SmsTemplateVariable | undefined>;
  deleteSmsTemplateVariable(id: number): Promise<void>;

  // SMS Templates management
  getSmsTemplates(filters?: { 
    status?: string; 
    categoryId?: number; 
    createdBy?: number; 
    search?: string;
    isFavorite?: boolean;
  }): Promise<(SmsTemplate & { category: SmsTemplateCategory })[]>;
  getSmsTemplate(id: number): Promise<(SmsTemplate & { category: SmsTemplateCategory }) | undefined>;
  getSmsTemplatesByCategory(categoryId: number): Promise<SmsTemplate[]>;
  getSmsTemplatesByUser(createdBy: number): Promise<SmsTemplate[]>;
  getPopularSmsTemplates(limit?: number): Promise<(SmsTemplate & { category: SmsTemplateCategory })[]>;
  getRecentSmsTemplates(limit?: number): Promise<(SmsTemplate & { category: SmsTemplateCategory })[]>;
  getFavoriteSmsTemplates(userId: number): Promise<(SmsTemplate & { category: SmsTemplateCategory })[]>;
  createSmsTemplate(data: InsertSmsTemplate): Promise<SmsTemplate>;
  updateSmsTemplate(id: number, updates: Partial<SmsTemplate>): Promise<SmsTemplate | undefined>;
  duplicateSmsTemplate(id: number, newName: string, userId: number): Promise<SmsTemplate>;
  updateSmsTemplateUsage(id: number): Promise<void>;
  updateSmsTemplateStats(id: number, successful: boolean): Promise<void>;
  archiveSmsTemplate(id: number): Promise<SmsTemplate | undefined>;
  activateSmsTemplate(id: number): Promise<SmsTemplate | undefined>;
  deleteSmsTemplate(id: number): Promise<void>;

  // SMS Template Sending Logs management
  getSmsTemplateSendingLogs(filters?: {
    templateId?: number;
    sentBy?: number;
    deliveryStatus?: string;
    sentFrom?: string;
    dateRange?: { start: string; end: string };
    recipientPhone?: string;
  }): Promise<(SmsTemplateSendingLog & { template: SmsTemplate; sender: User })[]>;
  getSmsTemplateSendingLog(id: number): Promise<(SmsTemplateSendingLog & { template: SmsTemplate; sender: User }) | undefined>;
  getSmsTemplateSendingLogsByTemplate(templateId: number): Promise<SmsTemplateSendingLog[]>;
  getSmsTemplateSendingLogsByUser(sentBy: number): Promise<SmsTemplateSendingLog[]>;
  getSmsTemplateSendingLogsByRecipient(recipientPhone: string): Promise<SmsTemplateSendingLog[]>;
  createSmsTemplateSendingLog(data: InsertSmsTemplateSendingLog): Promise<SmsTemplateSendingLog>;
  updateSmsTemplateSendingLogDeliveryStatus(id: number, status: string, deliveryTimestamp?: Date, failureReason?: string): Promise<void>;
  updateSmsTemplateSendingLogResponse(id: number, responseReceived: boolean): Promise<void>;

  // SMS Template Analytics management
  getSmsTemplateAnalytics(templateId?: number, periodType?: string, startDate?: string, endDate?: string): Promise<SmsTemplateAnalytics[]>;
  getSmsTemplateAnalyticsByTemplate(templateId: number): Promise<SmsTemplateAnalytics[]>;
  createSmsTemplateAnalytics(data: InsertSmsTemplateAnalytics): Promise<SmsTemplateAnalytics>;
  updateSmsTemplateAnalytics(id: number, updates: Partial<SmsTemplateAnalytics>): Promise<SmsTemplateAnalytics | undefined>;
  getTemplatePerformanceMetrics(templateId: number, days?: number): Promise<{
    totalSends: number;
    deliveryRate: number;
    responseRate: number;
    totalCost: number;
    averageCostPerSms: number;
  }>;
  getTopPerformingTemplates(limit?: number, metric?: 'usage' | 'delivery_rate' | 'response_rate'): Promise<SmsTemplate[]>;

  // SMS Template Favorites management
  getSmsTemplateFavorites(userId: number): Promise<(SmsTemplateFavorite & { template: SmsTemplate })[]>;
  addSmsTemplateFavorite(userId: number, templateId: number): Promise<SmsTemplateFavorite>;
  removeSmsTemplateFavorite(userId: number, templateId: number): Promise<void>;
  isSmsTemplateFavorite(userId: number, templateId: number): Promise<boolean>;

  // SMS Template Utility methods
  validateSmsTemplateVariables(content: string): Promise<{ isValid: boolean; missingVariables: string[]; invalidVariables: string[] }>;
  substituteSmsTemplateVariables(content: string, variableData: Record<string, any>): Promise<string>;
  calculateSmsCharacterCount(content: string): Promise<{ characterCount: number; smsPartsCount: number }>;
  getSmsTemplatePreview(templateId: number, sampleData: Record<string, any>): Promise<{ content: string; characterCount: number; smsPartsCount: number }>;

  // 3D Lesson Content methods
  getThreeDLessonContent(id: number): Promise<ThreeDLessonContent | undefined>;
  createThreeDLessonContent(content: ThreeDLessonContentInsert): Promise<ThreeDLessonContent>;
  updateThreeDLessonContent(id: number, updates: Partial<ThreeDLessonContent>): Promise<ThreeDLessonContent | undefined>;
  deleteThreeDLessonContent(id: number): Promise<void>;

  // 3D Video Lessons methods
  getThreeDVideoLessons(filters?: { courseId?: number; language?: string; level?: string; templateType?: string; search?: string }): Promise<ThreeDVideoLesson[]>;
  getThreeDVideoLesson(id: number): Promise<ThreeDVideoLesson | undefined>;
  createThreeDVideoLesson(lesson: ThreeDVideoLessonInsert): Promise<ThreeDVideoLesson>;
  updateThreeDVideoLesson(id: number, updates: Partial<ThreeDVideoLesson>): Promise<ThreeDVideoLesson | undefined>;
  deleteThreeDVideoLesson(id: number): Promise<void>;
  getThreeDVideoLessonsByCourse(courseId: number): Promise<ThreeDVideoLesson[]>;

  // 3D Lesson Progress methods
  getThreeDLessonProgress(userId: number, threeDLessonId: number): Promise<ThreeDLessonProgress | undefined>;
  createThreeDLessonProgress(progress: ThreeDLessonProgressInsert): Promise<ThreeDLessonProgress>;
  updateThreeDLessonProgress(userId: number, threeDLessonId: number, updates: Partial<ThreeDLessonProgress>): Promise<ThreeDLessonProgress | undefined>;
  getUserThreeDLessonProgress(userId: number): Promise<ThreeDLessonProgress[]>;

  // Marketing Campaign methods
  getMarketingCampaigns(filters?: { status?: string; type?: string }): Promise<MarketingCampaign[]>;
  getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined>;
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  updateMarketingCampaign(id: number, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign | undefined>;
  deleteMarketingCampaign(id: number): Promise<void>;
  getCampaignMetrics(id: number): Promise<{
    impressions: bigint;
    clicks: bigint;
    conversions: number;
    spent: bigint;
    roi: number;
    engagement_rate: number;
  } | undefined>;

  // Platform Credentials methods
  getPlatformCredentials(filters?: { platform?: string; isActive?: boolean }): Promise<PlatformCredential[]>;
  getPlatformCredential(id: number): Promise<PlatformCredential | undefined>;
  getPlatformCredentialByPlatform(platform: string, accountHandle?: string): Promise<PlatformCredential | undefined>;
  createPlatformCredential(credential: InsertPlatformCredential): Promise<PlatformCredential>;
  updatePlatformCredential(id: number, updates: Partial<PlatformCredential>): Promise<PlatformCredential | undefined>;
  deletePlatformCredential(id: number): Promise<void>;
  verifyPlatformCredential(id: number): Promise<boolean>;

  // Scheduled Posts methods
  getScheduledPosts(filters?: { status?: string; campaignId?: number; platforms?: string[] }): Promise<ScheduledPost[]>;
  getScheduledPost(id: number): Promise<ScheduledPost | undefined>;
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  updateScheduledPost(id: number, updates: Partial<ScheduledPost>): Promise<ScheduledPost | undefined>;
  deleteScheduledPost(id: number): Promise<void>;
  getScheduledPostsDueForPublishing(): Promise<ScheduledPost[]>;
  publishScheduledPost(id: number): Promise<ScheduledPost | undefined>;

  // Social Media Posts methods
  getSocialMediaPosts(filters?: { platform?: string; campaignId?: number; dateFrom?: Date; dateTo?: Date }): Promise<SocialMediaPost[]>;
  getSocialMediaPost(id: number): Promise<SocialMediaPost | undefined>;
  createSocialMediaPost(post: InsertSocialMediaPost): Promise<SocialMediaPost>;
  updateSocialMediaPost(id: number, updates: Partial<SocialMediaPost>): Promise<SocialMediaPost | undefined>;
  deleteSocialMediaPost(id: number): Promise<void>;
  updateSocialMediaPostMetrics(id: number, metrics: {
    impressions?: bigint;
    reach?: bigint;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    saves?: number;
  }): Promise<SocialMediaPost | undefined>;

  // Social Media Analytics methods
  getSocialMediaAnalytics(filters?: { platform?: string; dateFrom?: Date; dateTo?: Date; campaignId?: number }): Promise<SocialMediaAnalytics[]>;
  createSocialMediaAnalytics(analytics: InsertSocialMediaAnalytics): Promise<SocialMediaAnalytics>;
  updateSocialMediaAnalytics(id: number, updates: Partial<SocialMediaAnalytics>): Promise<SocialMediaAnalytics | undefined>;
  getAnalyticsSummary(platform?: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalFollowers: number;
    totalImpressions: bigint;
    totalEngagement: number;
    averageEngagementRate: number;
    followersGrowth: number;
  }>;

  // Email Campaign methods
  getEmailCampaigns(filters?: { status?: string; campaignId?: number }): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(email: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: number): Promise<void>;
  updateEmailCampaignMetrics(id: number, metrics: {
    successful_sends?: number;
    failed_sends?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
    unsubscribed?: number;
  }): Promise<EmailCampaign | undefined>;

  // Telegram Message methods
  getTelegramMessages(filters?: { status?: string; campaignId?: number; channelId?: string }): Promise<TelegramMessage[]>;
  getTelegramMessage(id: number): Promise<TelegramMessage | undefined>;
  createTelegramMessage(message: InsertTelegramMessage): Promise<TelegramMessage>;
  updateTelegramMessage(id: number, updates: Partial<TelegramMessage>): Promise<TelegramMessage | undefined>;
  deleteTelegramMessage(id: number): Promise<void>;
  updateTelegramMessageMetrics(id: number, metrics: {
    views?: number;
    forwards?: number;
    reactions?: any;
  }): Promise<TelegramMessage | undefined>;

  // Web Scraping Infrastructure methods
  createScrapeJob(job: InsertScrapeJob): Promise<ScrapeJob>;
  getScrapeJob(id: number): Promise<ScrapeJob | undefined>;
  getAllScrapeJobs(): Promise<ScrapeJob[]>;
  getScrapeJobsByType(type: string): Promise<ScrapeJob[]>;
  updateScrapeJob(id: number, updates: Partial<ScrapeJob>): Promise<ScrapeJob | undefined>;
  deleteScrapeJob(id: number): Promise<void>;
  markScrapeJobAsRunning(id: number): Promise<ScrapeJob | undefined>;
  markScrapeJobAsCompleted(id: number, itemsScraped: number): Promise<ScrapeJob | undefined>;
  markScrapeJobAsFailed(id: number, errorMessage: string): Promise<ScrapeJob | undefined>;
  getDueScrapeJobs(): Promise<ScrapeJob[]>;

  createCompetitorPrice(price: InsertCompetitorPrice): Promise<CompetitorPrice>;
  getCompetitorPrices(filters?: { competitorName?: string; courseName?: string; scrapeJobId?: number }): Promise<CompetitorPrice[]>;
  getLatestCompetitorPrices(competitorName?: string): Promise<CompetitorPrice[]>;

  createScrapedLead(lead: InsertScrapedLead): Promise<ScrapedLead>;
  getScrapedLeads(filters?: { source?: string; status?: string; importedToLeads?: boolean; scrapeJobId?: number }): Promise<ScrapedLead[]>;
  updateScrapedLead(id: number, updates: Partial<ScrapedLead>): Promise<ScrapedLead | undefined>;
  markLeadAsImported(id: number): Promise<ScrapedLead | undefined>;

  createMarketTrend(trend: InsertMarketTrend): Promise<MarketTrend>;
  getMarketTrends(filters?: { category?: string; source?: string; scrapeJobId?: number }): Promise<MarketTrend[]>;
  getTrendingTopics(): Promise<MarketTrend[]>;

  // ============================================================================
  // CMS (CONTENT MANAGEMENT SYSTEM) METHODS
  // ============================================================================
  
  // CMS Pages methods
  getCmsPages(filters?: { status?: string; locale?: string; isHomepage?: boolean }): Promise<any[]>;
  getCmsPage(id: number): Promise<any | undefined>;
  getCmsPageBySlug(slug: string): Promise<any | undefined>;
  createCmsPage(page: any): Promise<any>;
  updateCmsPage(id: number, updates: any): Promise<any | undefined>;
  deleteCmsPage(id: number): Promise<void>;
  publishCmsPage(id: number): Promise<any | undefined>;
  
  // CMS Page Sections methods
  getCmsPageSections(pageId: number): Promise<any[]>;
  getCmsPageSection(id: number): Promise<any | undefined>;
  createCmsPageSection(section: any): Promise<any>;
  updateCmsPageSection(id: number, updates: any): Promise<any | undefined>;
  deleteCmsPageSection(id: number): Promise<void>;
  
  // CMS Blog Categories methods
  getBlogCategories(): Promise<any[]>;
  getBlogCategory(id: number): Promise<any | undefined>;
  createBlogCategory(category: any): Promise<any>;
  updateBlogCategory(id: number, updates: any): Promise<any | undefined>;
  deleteBlogCategory(id: number): Promise<void>;
  
  // CMS Blog Tags methods
  getBlogTags(): Promise<any[]>;
  getBlogTag(id: number): Promise<any | undefined>;
  createBlogTag(tag: any): Promise<any>;
  
  // CMS Blog Posts methods
  getBlogPosts(filters?: { status?: string; locale?: string; categoryId?: number; authorId?: number }): Promise<any[]>;
  getBlogPost(id: number): Promise<any | undefined>;
  getBlogPostBySlug(slug: string): Promise<any | undefined>;
  createBlogPost(post: any): Promise<any>;
  updateBlogPost(id: number, updates: any): Promise<any | undefined>;
  deleteBlogPost(id: number): Promise<void>;
  
  // CMS Videos methods
  getVideos(filters?: { isActive?: boolean; locale?: string; category?: string }): Promise<any[]>;
  getVideo(id: number): Promise<any | undefined>;
  createVideo(video: any): Promise<any>;
  updateVideo(id: number, updates: any): Promise<any | undefined>;
  deleteVideo(id: number): Promise<void>;
  
  // CMS Media Assets methods
  getMediaAssets(filters?: { fileType?: string; uploadedBy?: number }): Promise<any[]>;
  getMediaAsset(id: number): Promise<any | undefined>;
  createMediaAsset(asset: any): Promise<any>;
  updateMediaAsset(id: number, data: Partial<any>): Promise<any | undefined>;
  
  // CMS Page Analytics methods
  trackPageAnalytics(eventData: any): Promise<any>;
  getPageAnalytics(filters?: { pageId?: number; blogPostId?: number; videoId?: number; dateFrom?: Date; dateTo?: Date }): Promise<any[]>;
  
  // Curriculum Categories methods
  getCurriculumCategories(filters?: { isActive?: boolean }): Promise<any[]>;
  getCurriculumCategory(id: number): Promise<any | undefined>;
  getCurriculumCategoryBySlug(slug: string): Promise<any | undefined>;
  createCurriculumCategory(category: any): Promise<any>;
  updateCurriculumCategory(id: number, updates: any): Promise<any | undefined>;
  deleteCurriculumCategory(id: number): Promise<void>;
  reorderCurriculumCategories(categoryOrders: { id: number; displayOrder: number }[]): Promise<void>;
  getCoursesByCategory(categoryId: number, filters?: { isActive?: boolean }): Promise<any[]>;
  
  // Guest Leads methods
  createGuestLead(lead: any): Promise<any>;
  getGuestLeads(filters?: { status?: string; source?: string }): Promise<any[]>;
  getGuestLead(id: number): Promise<any | undefined>;
  // Teacher Reviews methods
  createTeacherReview(review: any): Promise<any>;
  getApprovedTeacherReviews(teacherId: number): Promise<any[]>;
  updateTeacherReviewStatus(reviewId: number, status: string, approvedBy: number, rejectionReason?: string): Promise<any | undefined>;
  getRecentApprovedReviews(limit: number): Promise<any[]>;
  
  // Teacher Profile methods
  updateTeacherIntroVideo(teacherId: number, introVideoUrl: string): Promise<any | undefined>;
  getTeacherPublicProfile(teacherId: number): Promise<any | undefined>;
  
  // Institute Events methods
  getUpcomingEvents(limit: number): Promise<any[]>;
  getAllEvents(): Promise<any[]>;
  createEvent(event: any): Promise<any>;
  updateEvent(id: number, updates: any): Promise<any | undefined>;
  deleteEvent(id: number): Promise<void>;
  
  // Widget Data methods
  getTopRatedTeachers(limit: number): Promise<any[]>;
  getNewClasses(limit: number): Promise<any[]>;
  getBestStudent(period: string): Promise<any | null>;
  updateGuestLead(id: number, updates: any): Promise<any | undefined>;
}