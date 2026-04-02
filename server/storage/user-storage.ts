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
import type { IStorage } from "./storage-types";


export class MemStorageUser {
  protected db: any;

  constructor(db?: any) {
    this.db = db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    // Normalize phone number to +98 format for consistent lookup
    const normalizedPhone = normalizePhoneNumber(identifier);
    
    // Search by normalized phone number first (primary for phone-only auth)
    // Try both the normalized format and original in case of legacy data
    const byPhone = await this.db.select().from(users).where(
      or(
        eq(users.phoneNumber, normalizedPhone),
        eq(users.phoneNumber, identifier)
      )
    );
    if (byPhone.length > 0) return byPhone[0];
    
    // Fallback to email search
    const byEmail = await this.db.select().from(users).where(eq(users.email, identifier));
    return byEmail[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getTeachers(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, 'Teacher'));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPreferences(id: number, preferences: any): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set({ preferences })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async getCourses(): Promise<Course[]> {
    return await this.db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const result = await this.db.select().from(courses).where(eq(courses.id, id));
    return result[0];
  }

  async getCoursesByDeliveryMode(mode: string): Promise<Course[]> {
    return await this.db.select().from(courses).where(eq(courses.deliveryMode, mode));
  }

  async getUserCourses(userId: number): Promise<(Course & { progress: number })[]> {
    const result = await this.db.select({
      id: courses.id,
      courseCode: courses.courseCode,
      title: courses.title,
      description: courses.description,
      language: courses.language,
      level: courses.level,
      thumbnail: courses.thumbnail,
      instructorId: courses.instructorId,
      price: courses.price,
      totalSessions: courses.totalSessions,
      sessionDuration: courses.sessionDuration,
      deliveryMode: courses.deliveryMode,
      classFormat: courses.classFormat,
      maxStudents: courses.maxStudents,
      rating: courses.rating,
      firstSessionDate: courses.firstSessionDate,
      lastSessionDate: courses.lastSessionDate,
      weekdays: courses.weekdays,
      startTime: courses.startTime,
      endTime: courses.endTime,
      timeZone: courses.timeZone,
      calendarType: courses.calendarType,
      targetLanguage: courses.targetLanguage,
      targetLevel: courses.targetLevel,
      autoRecord: courses.autoRecord,
      recordingAvailable: courses.recordingAvailable,
      accessPeriodMonths: courses.accessPeriodMonths,
      callernAvailable24h: courses.callernAvailable24h,
      callernRoadmapId: courses.callernRoadmapId,
      category: courses.category,
      tags: courses.tags,
      prerequisites: courses.prerequisites,
      learningObjectives: courses.learningObjectives,
      difficulty: courses.difficulty,
      certificateTemplate: courses.certificateTemplate,
      isActive: courses.isActive,
      isFeatured: courses.isFeatured,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      progress: enrollments.progress
    })
    .from(courses)
    .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
    .where(eq(enrollments.userId, userId));
    
    return result.map(row => ({
      ...row,
      progress: row.progress || 0
    }));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await this.db.insert(courses).values(course).returning();
    return result[0];
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const result = await this.db.update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }

  async deleteCourse(id: number): Promise<void> {
    await this.db.delete(courses).where(eq(courses.id, id));
  }

  async getCourseEnrollments(courseId: number): Promise<any[]> {
    return await this.db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async enrollInCourse(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await this.db.insert(enrollments).values(enrollment).returning();
    return result[0];
  }

  async unenrollFromCourse(userId: number, courseId: number): Promise<void> {
    await this.db.delete(enrollments).where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    );
  }

  async createPlacementTestSession(data: any): Promise<any> {
    const result = await this.db.insert(mstSessions).values(data).returning();
    return result[0];
  }

  async getPlacementTestSession(id: number): Promise<any | undefined> {
    const result = await this.db.select().from(mstSessions).where(eq(mstSessions.id, id));
    return result[0];
  }

  async updatePlacementTestSession(id: number, updates: any): Promise<any | undefined> {
    const result = await this.db.update(mstSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mstSessions.id, id))
      .returning();
    return result[0];
  }

  async getUserPlacementTestSessions(userId: number): Promise<any[]> {
    return await this.db.select().from(mstSessions).where(eq(mstSessions.userId, userId));
  }

  async getUserPlacementTestSessionsThisWeek(userId: number): Promise<any[]> {
    // Get start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
  
    return await this.db.select().from(mstSessions).where(
      and(
        eq(mstSessions.userId, userId),
        gte(mstSessions.startedAt, startOfWeek),
        lte(mstSessions.startedAt, endOfWeek)
      )
    );
  }

  async getPlacementTestSessionsPaginated(page: number, limit: number): Promise<{ sessions: any[], total: number }> {
    const offset = (page - 1) * limit;
    const sessions = await this.db.select().from(mstSessions).limit(limit).offset(offset);
    const totalResult = await this.db.select().from(mstSessions);
    return { sessions, total: totalResult.length };
  }

  async getPlacementTestSessionsCount(): Promise<number> {
    const result = await this.db.select().from(mstSessions);
    return result.length;
  }

  async createPlacementTestQuestion(data: any): Promise<any> {
    const result = await this.db.insert(mstSkillStates).values(data).returning();
    return result[0];
  }

  async getPlacementTestQuestion(id: number): Promise<any | undefined> {
    const result = await this.db.select().from(mstSkillStates).where(eq(mstSkillStates.id, id));
    return result[0];
  }

  async getPlacementTestQuestions(filters?: any): Promise<any[]> {
    return await this.db.select().from(mstSkillStates);
  }

  async createPlacementTestResponse(data: any): Promise<any> {
    const result = await this.db.insert(mstResponses).values(data).returning();
    return result[0];
  }

  async updatePlacementTestResponse(id: number, updates: any): Promise<any | undefined> {
    const result = await this.db.update(mstResponses)
      .set(updates)
      .where(eq(mstResponses.id, id))
      .returning();
    return result[0];
  }

  async getPlacementTestResponses(sessionId: number): Promise<any[]> {
    return await this.db.select().from(mstResponses).where(eq(mstResponses.sessionId, sessionId));
  }

  async createUserRoadmapEnrollment(data: any): Promise<any> {
    const result = await this.db.insert(enrollments).values(data).returning();
    return result[0];
  }

  async createLearningRoadmap(roadmapData: any): Promise<any> {
    const result = await this.db.insert(learningRoadmaps).values(roadmapData).returning();
    return result[0];
  }

  async createRoadmapMilestone(milestoneData: any): Promise<any> {
    const result = await this.db.insert(roadmapMilestones).values(milestoneData).returning();
    return result[0];
  }

  async getRoadmapTemplate(id: number): Promise<any | undefined> {
    // For now, return a basic template structure - in production this would query actual templates
    return {
      id,
      name: 'Default Template',
      isActive: true
    };
  }

  async createRoadmapInstance(instanceData: any): Promise<any> {
    // Create a roadmap instance record
    return {
      id: Date.now(), // Temporary ID
      ...instanceData,
      createdAt: new Date()
    };
  }

  async initializeActivityInstances(instanceId: number): Promise<void> {
    // Initialize activity instances for the roadmap
    console.log(`Initialized activity instances for roadmap instance ${instanceId}`);
  }

  async getRoadmapInstance(id: number): Promise<any | undefined> {
    // Return a basic roadmap instance
    return {
      id,
      studentId: 1,
      status: 'active',
      createdAt: new Date()
    };
  }

  async getRoadmapInstanceWithProgress(id: number): Promise<any | undefined> {
    const instance = await this.getRoadmapInstance(id);
    if (instance) {
      instance.progress = [];
      instance.milestones = [];
    }
    return instance;
  }

  async enrichInstanceWithMetrics(instance: any): Promise<any> {
    // Add metrics to the instance
    return {
      ...instance,
      metrics: {
        completionRate: 0.5,
        averageScore: 75,
        timeSpent: 120
      }
    };
  }

  async getRoadmapInstances(filters: any): Promise<any[]> {
    // Return filtered roadmap instances
    return [];
  }

  async adjustRoadmapPacing(instanceId: number, adjustmentDays: number, reason: string, userId: number): Promise<any> {
    return {
      affectedActivities: 5,
      newEndDate: new Date(Date.now() + adjustmentDays * 24 * 60 * 60 * 1000)
    };
  }

  async updateRoadmapInstanceStatus(instanceId: number, status: string): Promise<any | undefined> {
    return {
      id: instanceId,
      status,
      updatedAt: new Date()
    };
  }

  async getRoadmapPosition(instanceId: number): Promise<any> {
    return {
      currentMilestone: 1,
      currentStep: 3,
      completionPercentage: 25
    };
  }

  async getRoadmapInstanceAnalytics(instanceId: number): Promise<any> {
    return {
      totalSteps: 20,
      completedSteps: 5,
      averageScore: 80,
      timeSpent: 300
    };
  }

  async resetRoadmapInstance(instanceId: number, keepCompleted: boolean): Promise<any> {
    return {
      resetActivities: keepCompleted ? 5 : 15
    };
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const result = await this.db.insert(passwordResetTokens).values(token).returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await this.db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return result[0];
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await this.db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await this.db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async checkUserPermission(role: string, resource: string, action: string): Promise<boolean> {
    const result = await this.db.select().from(rolePermissions)
      .where(and(
        eq(rolePermissions.role, role),
        eq(rolePermissions.resource, resource),
        eq(rolePermissions.action, action),
        eq(rolePermissions.allowed, true)
      ));
    return result.length > 0;
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await this.db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const result = await this.db.insert(rolePermissions).values(permission).returning();
    return result[0];
  }

  async getUserSessions(userId: number): Promise<(Session & { tutorName: string })[]> {
    const result = await this.db.select({
      ...sessions,
      tutorName: users.firstName
    })
    .from(sessions)
    .leftJoin(users, eq(sessions.tutorId, users.id))
    .where(eq(sessions.studentId, userId));
    
    return result.map(row => ({
      ...row,
      tutorName: row.tutorName ? `${row.tutorName} ${users.lastName}` : "Unknown"
    }));
  }

  async getUpcomingSessions(userId: number): Promise<(Session & { tutorName: string, tutorAvatar: string })[]> {
    const now = new Date();
    const result = await this.db.select({
      ...sessions,
      tutorName: users.firstName,
      tutorLastName: users.lastName,
      tutorAvatar: users.avatar
    })
    .from(sessions)
    .leftJoin(users, eq(sessions.tutorId, users.id))
    .where(and(
      eq(sessions.studentId, userId),
      gte(sessions.scheduledAt, now),
      eq(sessions.status, "scheduled")
    ));
    
    return result.map(row => ({
      ...row,
      tutorName: row.tutorName ? `${row.tutorName} ${row.tutorLastName}` : "Unknown",
      tutorAvatar: row.tutorAvatar || ""
    })).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async createSession(session: InsertSession): Promise<Session> {
    const result = await this.db.insert(sessions).values(session).returning();
    return result[0];
  }

  async updateSessionStatus(id: number, status: string): Promise<Session | undefined> {
    const result = await this.db.update(sessions)
      .set({ status })
      .where(eq(sessions.id, id))
      .returning();
    return result[0];
  }

  async getAllSessions(): Promise<Session[]> {
    return await this.db.select().from(sessions);
  }

  async getUserMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]> {
    const result = await this.db.select({
      ...messages,
      senderName: users.firstName,
      senderLastName: users.lastName,
      senderAvatar: users.avatar
    })
    .from(messages)
    .leftJoin(users, eq(messages.fromUserId, users.id))
    .where(or(eq(messages.toUserId, userId), eq(messages.fromUserId, userId)));
    
    return result.map(row => ({
      ...row,
      senderName: row.senderName ? `${row.senderName} ${row.senderLastName}` : "Unknown",
      senderAvatar: row.senderAvatar || ""
    }));
  }

  async getRecentMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]> {
    const result = await this.db.select({
      ...messages,
      senderName: users.firstName,
      senderLastName: users.lastName,
      senderAvatar: users.avatar
    })
    .from(messages)
    .leftJoin(users, eq(messages.fromUserId, users.id))
    .where(or(eq(messages.toUserId, userId), eq(messages.fromUserId, userId)))
    .orderBy(messages.sentAt)
    .limit(10);
    
    return result.map(row => ({
      ...row,
      senderName: row.senderName ? `${row.senderName} ${row.senderLastName}` : "Unknown",
      senderAvatar: row.senderAvatar || ""
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await this.db.insert(messages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await this.db.update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async getUserHomework(userId: number): Promise<(Homework & { courseName: string, teacherName: string })[]> {
    const result = await this.db.select({
      ...homework,
      courseName: courses.title,
      teacherFirstName: users.firstName,
      teacherLastName: users.lastName
    })
    .from(homework)
    .leftJoin(courses, eq(homework.courseId, courses.id))
    .leftJoin(users, eq(homework.teacherId, users.id))
    .where(eq(homework.studentId, userId));
    
    return result.map(row => ({
      ...row,
      courseName: row.courseName || "",
      teacherName: row.teacherFirstName ? `${row.teacherFirstName} ${row.teacherLastName}` : "Unknown"
    }));
  }

  async getPendingHomework(userId: number): Promise<(Homework & { courseName: string })[]> {
    const result = await this.db.select({
      ...homework,
      courseName: courses.title
    })
    .from(homework)
    .leftJoin(courses, eq(homework.courseId, courses.id))
    .where(and(
      eq(homework.studentId, userId),
      eq(homework.status, "assigned")
    ));
    
    return result.map(row => ({
      ...row,
      courseName: row.courseName || ""
    }));
  }

  async createHomework(homeworkData: InsertHomework): Promise<Homework> {
    const result = await this.db.insert(homework).values(homeworkData).returning();
    return result[0];
  }

  async updateHomeworkStatus(id: number, status: string, submission?: string): Promise<Homework | undefined> {
    const result = await this.db.update(homework)
      .set({ 
        status, 
        submission: submission || null,
        updatedAt: new Date()
      })
      .where(eq(homework.id, id))
      .returning();
    return result[0];
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return await this.db.select().from(payments).where(eq(payments.userId, userId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const result = await this.db.update(payments)
      .set({ status, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await this.db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await this.db.select().from(notifications).where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await this.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async getInstituteBranding(): Promise<InstituteBranding | undefined> {
    const result = await this.db.select().from(instituteBranding).limit(1);
    return result[0];
  }

  async updateInstituteBranding(branding: Partial<InstituteBranding>): Promise<InstituteBranding | undefined> {
    const existing = await this.getInstituteBranding();
    if (existing) {
      const result = await this.db.update(instituteBranding)
        .set({ ...branding, updatedAt: new Date() })
        .where(eq(instituteBranding.id, existing.id))
        .returning();
      return result[0];
    }
    return undefined;
  }

  async getClasses(): Promise<Class[]> {
    return await this.db.select().from(classes);
  }

  async getClass(id: number): Promise<Class | undefined> {
    const result = await this.db.select().from(classes).where(eq(classes.id, id));
    return result[0];
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await this.db.insert(classes).values(classData).returning();
    return result[0];
  }

  async updateClass(id: number, updates: Partial<Class>): Promise<Class | undefined> {
    const result = await this.db.update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return result[0];
  }

  async deleteClass(id: number): Promise<void> {
    await this.db.delete(classes).where(eq(classes.id, id));
  }

  async getClassesByCourse(courseId: number): Promise<Class[]> {
    return await this.db.select().from(classes).where(eq(classes.courseId, courseId));
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return await this.db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async calculateClassEndDate(startDate: string, totalSessions: number, weekdays: string[]): Promise<string> {
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + (totalSessions * weekdays.length * 7));
    return endDate.toISOString().split('T')[0];
  }

  async getHolidays(): Promise<Holiday[]> {
    return await this.db.select().from(holidays);
  }

  async getHoliday(id: number): Promise<Holiday | undefined> {
    const result = await this.db.select().from(holidays).where(eq(holidays.id, id));
    return result[0];
  }

  async createHoliday(holiday: InsertHoliday): Promise<Holiday> {
    const result = await this.db.insert(holidays).values(holiday).returning();
    return result[0];
  }

  async updateHoliday(id: number, updates: Partial<Holiday>): Promise<Holiday | undefined> {
    const result = await this.db.update(holidays)
      .set(updates)
      .where(eq(holidays.id, id))
      .returning();
    return result[0];
  }

  async deleteHoliday(id: number): Promise<void> {
    await this.db.delete(holidays).where(eq(holidays.id, id));
  }

  async getHolidaysInRange(startDate: string, endDate: string): Promise<Holiday[]> {
    return await this.db.select().from(holidays).where(
      and(
        gte(holidays.date, startDate),
        lte(holidays.date, endDate)
      )
    );
  }

  async addCourseModule(courseId: number, moduleData: any): Promise<any> {
    const result = await this.db.insert(videoLessons).values({
      ...moduleData,
      courseId
    }).returning();
    return result[0];
  }

  async addCourseLesson(courseId: number, moduleId: number, lessonData: any): Promise<VideoLesson> {
    const result = await this.db.insert(videoLessons).values({
      ...lessonData,
      courseId,
      moduleId
    }).returning();
    return result[0];
  }

  async publishCourse(courseId: number): Promise<Course | undefined> {
    const result = await this.db.update(courses)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(courses.id, courseId))
      .returning();
    return result[0];
  }

  async getCourseModules(courseId: number): Promise<any[]> {
    return await this.db.select().from(videoLessons).where(eq(videoLessons.courseId, courseId));
  }

  async getModuleLessons(moduleId: number): Promise<VideoLesson[]> {
    return await this.db.select().from(videoLessons).where(eq(videoLessons.moduleId, moduleId));
  }

  async getTeacherClasses(teacherId: number): Promise<any[]> {
    return await this.db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async getTeacherClass(classId: number, teacherId: number): Promise<any | undefined> {
    const result = await this.db.select().from(classes).where(
      and(eq(classes.id, classId), eq(classes.teacherId, teacherId))
    );
    return result[0];
  }

  async getTeacherAssignments(teacherId: number): Promise<any[]> {
    return await this.db.select().from(teacherAssignments).where(eq(teacherAssignments.teacherId, teacherId));
  }

  async createTeacherAssignment(assignment: any): Promise<any> {
    const result = await this.db.insert(teacherAssignments).values(assignment).returning();
    return result[0];
  }

  async updateAssignmentFeedback(assignmentId: number, feedback: string, score?: number): Promise<any> {
    const result = await this.db.update(teacherAssignments)
      .set({ feedback, score, updatedAt: new Date() })
      .where(eq(teacherAssignments.id, assignmentId))
      .returning();
    return result[0];
  }

  async getTeacherResources(teacherId: number): Promise<any[]> {
    return await this.db.select().from(contentLibrary).where(eq(contentLibrary.teacherId, teacherId));
  }

  async createTeacherResource(resource: any): Promise<any> {
    const result = await this.db.insert(contentLibrary).values(resource).returning();
    return result[0];
  }

  async deleteTeacherResource(resourceId: number, teacherId: number): Promise<void> {
    await this.db.delete(contentLibrary).where(
      and(eq(contentLibrary.id, resourceId), eq(contentLibrary.teacherId, teacherId))
    );
  }

  async getSessionAttendance(sessionId: number): Promise<any[]> {
    return await this.db.select().from(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
  }

  async markAttendance(sessionId: number, studentId: number, status: 'present' | 'absent' | 'late'): Promise<any> {
    const result = await this.db.insert(attendanceRecords).values({
      sessionId,
      studentId,
      status,
      recordedAt: new Date()
    }).returning();
    return result[0];
  }

  async getAbsenteeReport(teacherId: number): Promise<any[]> {
    // Get students absent 2+ consecutive sessions
    return await this.db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.teacherId, teacherId),
        eq(attendanceRecords.status, 'absent')
      ));
  }

  async getSessionMessages(sessionId: number): Promise<any[]> {
    return await this.db.select().from(messages).where(eq(messages.sessionId, sessionId));
  }

  async sendSessionMessage(messageData: any): Promise<any> {
    const result = await this.db.insert(messages).values(messageData).returning();
    return result[0];
  }

  async getClassMessages(classId: number): Promise<any[]> {
    return await this.db.select().from(messages).where(eq(messages.classId, classId));
  }

  async createClassMessage(messageData: any): Promise<any> {
    const result = await this.db.insert(messages).values(messageData).returning();
    return result[0];
  }

  async getRoomEquipment(roomId: number): Promise<any> {
    const result = await this.db.select().from(rooms).where(eq(rooms.id, roomId));
    return result[0];
  }

  async getLeads(filters?: {
    status?: string;
    priority?: string;
    assignedAgentId?: number;
    dateFrom?: string;
    dateTo?: string;
    source?: string;
  }): Promise<(Lead & { assignedToName?: string })[]> {
    let query = this.db.select({
      ...leads,
      assignedToName: users.firstName,
      assignedToLastName: users.lastName
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedTo, users.id));
    
    // Apply filters
    if (filters) {
      const conditions = [];
      if (filters.status) {
        conditions.push(eq(leads.status, filters.status));
      }
      if (filters.priority) {
        conditions.push(eq(leads.priority, filters.priority));
      }
      if (filters.assignedAgentId) {
        conditions.push(eq(leads.assignedTo, filters.assignedAgentId));
      }
      if (filters.source) {
        conditions.push(eq(leads.source, filters.source));
      }
      if (filters.dateFrom) {
        conditions.push(gte(leads.createdAt, new Date(filters.dateFrom)));
      }
      if (filters.dateTo) {
        conditions.push(lte(leads.createdAt, new Date(filters.dateTo)));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    const result = await query;
    
    return result.map(row => ({
      ...row,
      assignedToName: row.assignedToName ? `${row.assignedToName} ${row.assignedToLastName}` : undefined
    }));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const result = await this.db.select().from(leads).where(eq(leads.id, id));
    return result[0];
  }

  async getLeadByPhone(phoneNumber: string): Promise<Lead | undefined> {
    const result = await this.db.select().from(leads).where(eq(leads.phoneNumber, phoneNumber));
    return result[0];
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await this.db.insert(leads).values(lead).returning();
    return result[0];
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const result = await this.db.update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return result[0];
  }

  async deleteLead(id: number): Promise<void> {
    await this.db.delete(leads).where(eq(leads.id, id));
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await this.db.select().from(leads).where(eq(leads.status, status));
  }

  async getLeadsByWorkflowStatus(workflowStatus: string): Promise<Lead[]> {
    return await this.db.select().from(leads).where(eq(leads.workflowStatus, workflowStatus));
  }

  async getLeadsByAssignee(assignedTo: number): Promise<Lead[]> {
    return await this.db.select().from(leads).where(eq(leads.assignedTo, assignedTo));
  }

  async getInvoices(): Promise<Invoice[]> {
    return await this.db.select().from(invoices);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await this.db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await this.db.update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async getCommunicationLogs(): Promise<CommunicationLog[]> {
    return await this.db.select().from(communicationLogs);
  }

  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const result = await this.db.insert(communicationLogs).values(log).returning();
    return result[0];
  }

  async getAchievements(): Promise<Achievement[]> {
    return await this.db.select().from(achievements);
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await this.db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await this.db.insert(userAchievements).values(achievement).returning();
    return result[0];
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const result = await this.db.select().from(userStats).where(eq(userStats.userId, userId));
    return result[0];
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats | undefined> {
    const result = await this.db.update(userStats)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return result[0];
  }

  async getDailyGoals(userId: number): Promise<DailyGoal[]> {
    return await this.db.select().from(dailyGoals).where(eq(dailyGoals.userId, userId));
  }

  async updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<DailyGoal | undefined> {
    const result = await this.db.update(dailyGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dailyGoals.id, id))
      .returning();
    return result[0];
  }

  async getProgressSnapshots(userId: number): Promise<ProgressSnapshot[]> {
    return await this.db.select().from(progressSnapshots).where(eq(progressSnapshots.userId, userId));
  }

  async createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot> {
    const result = await this.db.insert(progressSnapshots).values(snapshot).returning();
    return result[0];
  }

  async getSkillAssessments(userId: number): Promise<SkillAssessment[]> {
    return await this.db.select().from(skillAssessments).where(eq(skillAssessments.userId, userId));
  }

  async createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment> {
    const result = await this.db.insert(skillAssessments).values(assessment).returning();
    return result[0];
  }

  async getLearningActivities(userId: number): Promise<LearningActivity[]> {
    return await this.db.select().from(learningActivities).where(eq(learningActivities.userId, userId));
  }

  async createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity> {
    const result = await this.db.insert(learningActivities).values(activity).returning();
    return result[0];
  }

  async createCallernRoadmap(roadmap: InsertCallernRoadmap): Promise<CallernRoadmap> {
    const result = await this.db.insert(callernRoadmaps).values(roadmap).returning();
    return result[0];
  }

  async getCallernRoadmaps(): Promise<CallernRoadmap[]> {
    return await this.db.select().from(callernRoadmaps);
  }

  async getCallernRoadmap(id: number): Promise<CallernRoadmap | undefined> {
    const result = await this.db.select().from(callernRoadmaps).where(eq(callernRoadmaps.id, id));
    return result[0];
  }

  async updateCallernRoadmap(id: number, updates: Partial<CallernRoadmap>): Promise<CallernRoadmap | undefined> {
    const result = await this.db.update(callernRoadmaps)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(callernRoadmaps.id, id))
      .returning();
    return result[0];
  }

  async deleteCallernRoadmap(id: number): Promise<void> {
    await this.db.delete(callernRoadmaps).where(eq(callernRoadmaps.id, id));
  }

  async createCallernPackage(callernPackage: InsertCallernPackage): Promise<CallernPackage> {
    const result = await this.db.insert(callernPackages).values(callernPackage).returning();
    return result[0];
  }

  async getCallernPackages(): Promise<CallernPackage[]> {
    return await this.db.select().from(callernPackages);
  }

  async getCallernPackage(id: number): Promise<CallernPackage | undefined> {
    const result = await this.db.select().from(callernPackages).where(eq(callernPackages.id, id));
    return result[0];
  }

  async updateCallernPackage(id: number, updates: Partial<CallernPackage>): Promise<CallernPackage | undefined> {
    const result = await this.db.update(callernPackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(callernPackages.id, id))
      .returning();
    return result[0];
  }

  async deleteCallernPackage(id: number): Promise<void> {
    await this.db.delete(callernPackages).where(eq(callernPackages.id, id));
  }

  async getCallernAvailabilities(): Promise<CallernAvailability[]> {
    return await this.db.select().from(callernAvailabilities);
  }

  async createCallernAvailability(availability: InsertCallernAvailability): Promise<CallernAvailability> {
    const result = await this.db.insert(callernAvailabilities).values(availability).returning();
    return result[0];
  }

  async updateCallernAvailability(id: number, updates: Partial<CallernAvailability>): Promise<CallernAvailability | undefined> {
    const result = await this.db.update(callernAvailabilities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(callernAvailabilities.id, id))
      .returning();
    return result[0];
  }

  async getCallernScoringResults(): Promise<CallernScoringResult[]> {
    return await this.db.select().from(callernScoringResults);
  }

  async createCallernScoringResult(result: InsertCallernScoringResult): Promise<CallernScoringResult> {
    const scoringResult = await this.db.insert(callernScoringResults).values(result).returning();
    return scoringResult[0];
  }

  async getAiInteractions(userId: number): Promise<AiInteraction[]> {
    return await this.db.select().from(aiInteractions).where(eq(aiInteractions.userId, userId));
  }

  async createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction> {
    const result = await this.db.insert(aiInteractions).values(interaction).returning();
    return result[0];
  }

  async getMoodLogs(userId: number): Promise<MoodLog[]> {
    return await this.db.select().from(moodLogs).where(eq(moodLogs.userId, userId));
  }

  async createMoodLog(moodLog: InsertMoodLog): Promise<MoodLog> {
    const result = await this.db.insert(moodLogs).values(moodLog).returning();
    return result[0];
  }

  async getLearningAdaptations(userId: number): Promise<LearningAdaptation[]> {
    return await this.db.select().from(learningAdaptations).where(eq(learningAdaptations.userId, userId));
  }

  async createLearningAdaptation(adaptation: InsertLearningAdaptation): Promise<LearningAdaptation> {
    const result = await this.db.insert(learningAdaptations).values(adaptation).returning();
    return result[0];
  }

  async getTestResults(userId: number): Promise<TestResult[]> {
    return await this.db.select().from(testResults).where(eq(testResults.userId, userId));
  }

  async createTestResult(testResult: InsertTestResult): Promise<TestResult> {
    const result = await this.db.insert(testResults).values(testResult).returning();
    return result[0];
  }

  async getQuestions(): Promise<Question[]> {
    return await this.db.select().from(questions);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const result = await this.db.select().from(questions).where(eq(questions.id, id));
    return result[0];
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = await this.db.insert(questions).values(question).returning();
    return result[0];
  }

  async getSupervisionSessions(): Promise<SupervisionSession[]> {
    return await this.db.select().from(supervisionSessions);
  }

  async createSupervisionSession(session: InsertSupervisionSession): Promise<SupervisionSession> {
    const result = await this.db.insert(supervisionSessions).values(session).returning();
    return result[0];
  }

  async getTeacherPerformance(teacherId: number): Promise<TeacherPerformance | undefined> {
    const result = await this.db.select().from(teacherPerformances).where(eq(teacherPerformances.teacherId, teacherId));
    return result[0];
  }

  async updateTeacherPerformance(teacherId: number, performance: Partial<TeacherPerformance>): Promise<TeacherPerformance | undefined> {
    const result = await this.db.update(teacherPerformances)
      .set({ ...performance, updatedAt: new Date() })
      .where(eq(teacherPerformances.teacherId, teacherId))
      .returning();
    return result[0];
  }

  async getVideoLessons(courseId: number): Promise<VideoLesson[]> {
    return await this.db.select().from(videoLessons).where(eq(videoLessons.courseId, courseId));
  }

  async getVideoLesson(id: number): Promise<VideoLesson | undefined> {
    const result = await this.db.select().from(videoLessons).where(eq(videoLessons.id, id));
    return result[0];
  }

  async createVideoLesson(lesson: InsertVideoLesson): Promise<VideoLesson> {
    const result = await this.db.insert(videoLessons).values(lesson).returning();
    return result[0];
  }

  async updateVideoLesson(id: number, updates: Partial<VideoLesson>): Promise<VideoLesson | undefined> {
    const result = await this.db.update(videoLessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoLessons.id, id))
      .returning();
    return result[0];
  }

  async deleteVideoLesson(id: number): Promise<void> {
    await this.db.delete(videoLessons).where(eq(videoLessons.id, id));
  }

  async getContentLibrary(): Promise<ContentLibraryItem[]> {
    return await this.db.select().from(contentLibrary);
  }

  async getContentLibraryItem(id: number): Promise<ContentLibraryItem | undefined> {
    const result = await this.db.select().from(contentLibrary).where(eq(contentLibrary.id, id));
    return result[0];
  }

  async createContentLibraryItem(item: InsertContentLibraryItem): Promise<ContentLibraryItem> {
    const result = await this.db.insert(contentLibrary).values(item).returning();
    return result[0];
  }

  async updateContentLibraryItem(id: number, updates: Partial<ContentLibraryItem>): Promise<ContentLibraryItem | undefined> {
    const result = await this.db.update(contentLibrary)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentLibrary.id, id))
      .returning();
    return result[0];
  }

  async deleteContentLibraryItem(id: number): Promise<void> {
    await this.db.delete(contentLibrary).where(eq(contentLibrary.id, id));
  }

  async getForumPosts(): Promise<ForumPost[]> {
    return await this.db.select().from(forumPosts);
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const result = await this.db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return result[0];
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const result = await this.db.insert(forumPosts).values(post).returning();
    return result[0];
  }

  async updateForumPost(id: number, updates: Partial<ForumPost>): Promise<ForumPost | undefined> {
    const result = await this.db.update(forumPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    return result[0];
  }

  async deleteForumPost(id: number): Promise<void> {
    await this.db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return await this.db.select().from(enrollments);
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const result = await this.db.select().from(enrollments).where(eq(enrollments.id, id));
    return result[0];
  }

  async updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const result = await this.db.update(enrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return result[0];
  }

  async deleteEnrollment(id: number): Promise<void> {
    await this.db.delete(enrollments).where(eq(enrollments.id, id));
  }

  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return await this.db.select().from(attendanceRecords);
  }

  async getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined> {
    const result = await this.db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
    return result[0];
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const result = await this.db.insert(attendanceRecords).values(record).returning();
    return result[0];
  }

  async updateAttendanceRecord(id: number, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const result = await this.db.update(attendanceRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, id))
      .returning();
    return result[0];
  }

  async deleteAttendanceRecord(id: number): Promise<void> {
    await this.db.delete(attendanceRecords).where(eq(attendanceRecords.id, id));
  }

  async getRooms(): Promise<Room[]> {
    return await this.db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const result = await this.db.select().from(rooms).where(eq(rooms.id, id));
    return result[0];
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const result = await this.db.insert(rooms).values(room).returning();
    return result[0];
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const result = await this.db.update(rooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return result[0];
  }

  async deleteRoom(id: number): Promise<void> {
    await this.db.delete(rooms).where(eq(rooms.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getTeachers(): Promise<(User & { role: string })[]> {
    return await this.db.select().from(users).where(eq(users.role, "teacher"));
  }

  async getStudents(): Promise<(User & { role: string })[]> {
    return await this.db.select().from(users).where(eq(users.role, "student"));
  }

  async getUsersWithPreferences(): Promise<(User & { preferences: string })[]> {
    const result = await this.db.select({
      ...users,
      preferences: userProfiles.preferences
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId));
    
    return result.map(row => ({
      ...row,
      preferences: row.preferences || "default"
    }));
  }

  async getStudentsByTeacher(teacherId: number): Promise<any[]> {
    const result = await this.db.select({
      ...users,
      courseName: courses.title
    })
    .from(users)
    .innerJoin(enrollments, eq(users.id, enrollments.userId))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(courses.instructorId, teacherId));
    
    return result;
  }

  async getTeacherByAssignmentId(assignmentId: number): Promise<User | undefined> {
    const result = await this.db.select({ ...users })
      .from(users)
      .innerJoin(teacherAssignments, eq(users.id, teacherAssignments.teacherId))
      .where(eq(teacherAssignments.id, assignmentId));
    return result[0];
  }

  async updateUserPreferences(userId: number, preferences: string): Promise<void> {
    const existing = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (existing.length > 0) {
      await this.db.update(userProfiles)
        .set({ preferences, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));
    } else {
      await this.db.insert(userProfiles).values({
        userId,
        preferences,
        culturalBackground: "default",
        learningStyle: "default",
        technicalBackground: "default",
        currentLevel: "beginner",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async getAllMessages(): Promise<Message[]> {
    return await this.db.select().from(messages);
  }

  async getAllHomework(): Promise<Homework[]> {
    return await this.db.select().from(homework);
  }

  async getAllPayments(): Promise<Payment[]> {
    return await this.db.select().from(payments);
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await this.db.select().from(notifications);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const result = await this.db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
    return result.reverse();
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    const result = await this.db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await this.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async getBranding(): Promise<InstituteBranding | undefined> {
    const result = await this.db.select().from(instituteBranding).limit(1);
    if (result.length === 0) {
      // Create default branding if none exists
      const defaultBranding = {
        name: "Meta Lingua Academy",
        logo: "",
        primaryColor: "#3B82F6",
        secondaryColor: "#1E40AF",
        accentColor: "#F59E0B",
        backgroundColor: "#F8FAFC",
        textColor: "#1F2937",
        favicon: "/favicon.ico",
        loginBackgroundImage: "/login-bg.jpg",
        fontFamily: "Inter",
        borderRadius: "8px"
      };
      const created = await this.db.insert(instituteBranding).values(defaultBranding).returning();
      return created[0];
    }
    return result[0];
  }

  async updateBranding(insertBranding: InsertBranding): Promise<InstituteBranding> {
    const existing = await this.getBranding();
    if (existing) {
      const result = await this.db.update(instituteBranding)
        .set({ ...insertBranding, updatedAt: new Date() })
        .where(eq(instituteBranding.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(instituteBranding).values(insertBranding).returning();
      return result[0];
    }
  }

  async getTutors(): Promise<User[]> {
    try {
      const result = await this.db.select().from(users)
        .where(and(
          eq(users.role, 'teacher'),
          eq(users.isActive, true)
        ));
      return result;
    } catch (error) {
      console.error('Error getting tutors:', error);
      return [];
    }
  }

  async getFeaturedTutors(): Promise<User[]> {
    const tutors = await this.getTutors();
    return tutors.slice(0, 6); // Return first 6 tutors as featured
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.select().from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return undefined;
    }
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    try {
      const result = await this.db.insert(userProfiles)
        .values({
          ...profile,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return undefined;
    }
  }

  async getUserSession(token: string): Promise<UserSession | undefined> {
    try {
      const result = await this.db.select().from(userSessions)
        .where(and(
          eq(userSessions.sessionToken, token),
          eq(userSessions.isActive, true),
          gte(userSessions.expiresAt, new Date())
        ))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user session:', error);
      return undefined;
    }
  }

  async getUserSessionByRefreshToken(refreshToken: string): Promise<UserSession | undefined> {
    try {
      const result = await this.db.select().from(userSessions)
        .where(and(
          eq(userSessions.refreshToken, refreshToken),
          eq(userSessions.isActive, true)
        ))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting user session by refresh token:', error);
      return undefined;
    }
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    try {
      const result = await this.db.insert(userSessions)
        .values({
          ...session,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user session:', error);
      throw error;
    }
  }

  async updateUserSessionActivity(sessionId: number): Promise<void> {
    try {
      await this.db.update(userSessions)
        .set({ lastActiveAt: new Date() })
        .where(eq(userSessions.id, sessionId));
    } catch (error) {
      console.error('Error updating user session activity:', error);
    }
  }

  async updateUserSessionTokens(sessionId: number, accessToken: string, refreshToken: string): Promise<void> {
    try {
      await this.db.update(userSessions)
        .set({ 
          sessionToken: accessToken,
          refreshToken: refreshToken,
          lastActiveAt: new Date()
        })
        .where(eq(userSessions.id, sessionId));
    } catch (error) {
      console.error('Error updating user session tokens:', error);
    }
  }

  async invalidateUserSession(token: string): Promise<void> {
    try {
      await this.db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.sessionToken, token));
    } catch (error) {
      console.error('Error invalidating user session:', error);
    }
  }

  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const id = this.currentId++;
    const passwordResetToken: PasswordResetToken = {
      id,
      userId: tokenData.userId,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      used: tokenData.used || false,
      createdAt: new Date()
    };
    
    // Store the token (we'll use a Map for in-memory storage)
    if (!this.passwordResetTokens) {
      this.passwordResetTokens = new Map();
    }
    try {
      await this.db.insert(passwordResetTokens).values({
        token: tokenData.token,
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt
      });
    } catch (error) {
      console.error('Error storing password reset token:', error);
    }
    
    return passwordResetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    if (!this.passwordResetTokens) {
      return undefined;
    }
    try {
      const result = await this.db.select().from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        ));
      return result[0];
    } catch (error) {
      console.error('Error getting password reset token:', error);
      return undefined;
    }
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    try {
      await this.db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.token, token));
    } catch (error) {
      console.error('Error marking password reset token as used:', error);
    }
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    try {
      await this.db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user password:', error);
    }
  }

  async checkUserPermission(role: string, resource: string, action: string): Promise<boolean> {
    try {
      const result = await this.db.select().from(rolePermissions)
        .where(and(
          eq(rolePermissions.role, role),
          eq(rolePermissions.resource, resource),
          eq(rolePermissions.action, action),
          eq(rolePermissions.allowed, true)
        ));
      return result.length > 0;
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    try {
      const result = await this.db.select().from(rolePermissions)
        .where(eq(rolePermissions.role, role));
      return result;
    } catch (error) {
      console.error('Error getting role permissions:', error);
      return [];
    }
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    try {
      const result = await this.db.insert(rolePermissions)
        .values({
          ...permission,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating role permission:', error);
      throw error;
    }
  }

  async unenrollFromCourse(userId: number, courseId: number): Promise<void> {
    try {
      await this.db.delete(enrollments)
        .where(and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId)
        ));
    } catch (error) {
      console.error('Error unenrolling from course:', error);
    }
  }

  async getStudentProfiles(): Promise<(UserProfile & { userName: string, userEmail: string })[]> {
    try {
      const result = await this.db.select({
        ...userProfiles,
        userName: users.firstName,
        userEmail: users.email
      })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id))
      .where(eq(users.role, 'Student'));
      return result;
    } catch (error) {
      console.error('Error getting student profiles:', error);
      return [];
    }
  }
}
