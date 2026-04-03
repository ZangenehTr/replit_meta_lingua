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
import { MemStorageUser } from "./user-storage";

export class MemStorageCourse extends MemStorageUser {
  

  async getStudentsWithProfiles(): Promise<any[]> {
    try {
      const result = await this.db.select({
        ...users,
        profile: userProfiles
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.role, 'Student'));
      return result;
    } catch (error) {
      console.error('Error getting students with profiles:', error);
      return [];
    }
  }

  async getStudentProfile(userId: number): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.select().from(userProfiles)
        .where(eq(userProfiles.userId, userId));
      return result[0];
    } catch (error) {
      console.error('Error getting student profile:', error);
      return undefined;
    }
  }

  async createStudentProfile(profile: InsertUserProfile): Promise<UserProfile> {
    return this.createUserProfile(profile);
  }

  async getPaymentHistory(userId?: number): Promise<Payment[]> {
    try {
      if (userId) {
        const result = await this.db.select().from(payments)
          .where(eq(payments.userId, userId));
        return result;
      }
      const result = await this.db.select().from(payments);
      return result;
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  async getTeachers(): Promise<User[]> {
    try {
      const result = await this.db.select().from(users)
        .where(and(
          or(
            eq(users.role, 'Teacher'),
            eq(users.role, 'Teacher/Tutor'),
            eq(users.role, 'teacher')
          ),
          eq(users.isActive, true)
        ));
      return result;
    } catch (error) {
      console.error('Error getting teachers:', error);
      return [];
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const result = await this.db.select().from(users);
      return result;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getSessions(): Promise<Session[]> {
    return this.getAllSessions();
  }

  async updateStudentProfile(id: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating student profile:', error);
      return undefined;
    }
  }

  async getLeads(): Promise<(Lead & { assignedToName?: string })[]> {
    try {
      const result = await this.db.select({
        ...leads,
        assignedToName: users.firstName
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id));
      return result;
    } catch (error) {
      console.error('Error getting leads:', error);
      return [];
    }
  }

  async getLead(id: number): Promise<Lead | undefined> {
    try {
      const result = await this.db.select().from(leads)
        .where(eq(leads.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting lead:', error);
      return undefined;
    }
  }

  async getLeadByPhone(phoneNumber: string): Promise<Lead | undefined> {
    try {
      const result = await this.db.select().from(leads)
        .where(eq(leads.phoneNumber, phoneNumber));
      return result[0];
    } catch (error) {
      console.error('Error getting lead by phone:', error);
      return undefined;
    }
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    try {
      const result = await this.db.insert(leads)
        .values({
          ...lead,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    try {
      const result = await this.db.update(leads)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(leads.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating lead:', error);
      return undefined;
    }
  }

  async getInvoices(): Promise<(Invoice & { studentName: string, courseName?: string })[]> {
    try {
      const result = await this.db.select({
        ...invoices,
        studentName: users.firstName,
        courseName: courses.title
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.studentId, users.id))
      .leftJoin(courses, eq(invoices.courseId, courses.id));
      return result;
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const result = await this.db.select().from(invoices)
        .where(eq(invoices.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting invoice:', error);
      return undefined;
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const result = await this.db.insert(invoices)
        .values({
          ...invoice,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const result = await this.db.update(invoices)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  }

  async getTeacherPerformance(teacherId?: number): Promise<any[]> {
    try {
      let query = this.db.select().from(teacherPerformance);
      if (teacherId) {
        query = query.where(eq(teacherPerformance.teacherId, teacherId));
      }
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting teacher performance:', error);
      return [];
    }
  }

  async createTeacherPerformance(performance: any): Promise<any> {
    try {
      const result = await this.db.insert(teacherPerformance).values(performance).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating teacher performance:', error);
      return {};
    }
  }

  async getAttendance(sessionId?: number, studentId?: number): Promise<AttendanceRecord[]> {
    try {
      let query = this.db.select().from(attendanceRecords);
      if (sessionId && studentId) {
        query = query.where(and(
          eq(attendanceRecords.sessionId, sessionId),
          eq(attendanceRecords.studentId, studentId)
        ));
      } else if (sessionId) {
        query = query.where(eq(attendanceRecords.sessionId, sessionId));
      } else if (studentId) {
        query = query.where(eq(attendanceRecords.studentId, studentId));
      }
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting attendance:', error);
      return [];
    }
  }

  async createAttendance(attendance: InsertAttendanceRecord): Promise<AttendanceRecord> {
    try {
      const result = await this.db.insert(attendanceRecords)
        .values({
          ...attendance,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  }

  async getCommunicationLogs(contactId?: number): Promise<(CommunicationLog & { staffName: string })[]> {
    try {
      let query = this.db.select({
        ...communicationLogs,
        staffName: users.firstName
      })
      .from(communicationLogs)
      .leftJoin(users, eq(communicationLogs.agentId, users.id));
      
      if (contactId) {
        query = query.where(or(
          eq(communicationLogs.leadId, contactId),
          eq(communicationLogs.studentId, contactId)
        ));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting communication logs:', error);
      return [];
    }
  }

  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    try {
      const result = await this.db.insert(communicationLogs)
        .values({
          ...log,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating communication log:', error);
      throw error;
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    const result = await this.db.select().from(achievements);
    return result;
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const result = await this.db.select({
      ...userAchievements,
      achievement: achievements
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId));
    return result;
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await this.db.insert(userAchievements).values(userAchievement).returning();
    return result[0];
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const result = await this.db.select().from(userStats)
      .where(eq(userStats.userId, userId));
    return result[0];
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats | undefined> {
    const existing = await this.getUserStats(userId);
    if (existing) {
      const result = await this.db.update(userStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(eq(userStats.userId, userId))
        .returning();
      return result[0];
    } else {
      const newStats = { userId, ...stats } as InsertUserStats;
      const result = await this.db.insert(userStats).values(newStats).returning();
      return result[0];
    }
  }

  async getDailyGoals(userId: number, date?: string): Promise<DailyGoal[]> {
    const query = this.db.select().from(dailyGoals).where(eq(dailyGoals.userId, userId));
    if (date) {
      return query.where(eq(dailyGoals.goalDate, date));
    }
    return query;
  }

  async createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal> {
    const result = await this.db.insert(dailyGoals).values(goal).returning();
    return result[0];
  }

  async updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<DailyGoal | undefined> {
    const result = await this.db.update(dailyGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dailyGoals.id, id))
      .returning();
    return result[0];
  }

  async getLatestProgressSnapshot(userId: number): Promise<ProgressSnapshot | undefined> {
    const result = await this.db.select().from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .orderBy(progressSnapshots.snapshotDate)
      .limit(1);
    return result[0];
  }

  async getAdminDashboardStats(): Promise<any> {
    try {
      const totalUsersResult = await this.db.select({ count: sql<number>`count(*)` }).from(users);
      const totalCoursesResult = await this.db.select({ count: sql<number>`count(*)` }).from(courses);
      const revenueResult = await this.db.select({ 
        total: sql<number>`sum(cast(amount as decimal))` 
      }).from(payments).where(eq(payments.status, 'completed'));
      
      return {
        totalUsers: totalUsersResult[0]?.count || 0,
        totalCourses: totalCoursesResult[0]?.count || 0,
        totalRevenue: revenueResult[0]?.total || 0,
        revenueGrowth: 15.2, // Calculate from historical data if available
        systemHealth: {
          database: "healthy",
          api: "healthy", 
          storage: "healthy"
        }
      };
    } catch (error) {
      console.error('Error getting admin dashboard stats:', error);
      return {
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        systemHealth: {
          database: "error",
          api: "error",
          storage: "error"
        }
      };
    }
  }

  async getTeacherDashboardStats(teacherId: number): Promise<any> {
    try {
      const completedLessonsResult = await this.db.select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(
          eq(sessions.teacherId, teacherId),
          eq(sessions.status, 'completed')
        ));
      
      const studentsResult = await this.db.select({ count: sql<number>`count(distinct student_id)` })
        .from(sessions)
        .where(eq(sessions.teacherId, teacherId));
        
      const ratingsResult = await this.db.select({ 
        avg: sql<number>`avg(cast(rating as decimal))`,
        count: sql<number>`count(*)` 
      })
        .from(reviews)
        .where(eq(reviews.teacherId, teacherId));
        
      const earningsResult = await this.db.select({ 
        total: sql<number>`sum(cast(teacher_fee as decimal))` 
      })
        .from(payments)
        .where(and(
          eq(payments.teacherId, teacherId),
          eq(payments.status, 'completed'),
          gte(payments.createdAt, sql`date_trunc('month', now())`)
        ));
      
      return {
        completedLessons: completedLessonsResult[0]?.count || 0,
        totalStudents: studentsResult[0]?.count || 0,
        averageRating: ratingsResult[0]?.avg || 0,
        monthlyEarnings: earningsResult[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting teacher dashboard stats:', error);
      return {
        completedLessons: 0,
        totalStudents: 0,
        averageRating: 0,
        monthlyEarnings: 0
      };
    }
  }

  async getCallCenterStats(agentId: number): Promise<any> {
    return {
      dailyCalls: 18,
      totalLeads: 26,
      conversionRate: 0.423,
      responseRate: 0.945
    };
  }

  async getAccountantDashboardStats(): Promise<any> {
    return {
      totalStudents: 26,
      monthlyRevenue: 45000000,
      pendingInvoices: 8,
      revenueGrowth: 12.5
    };
  }

  async getStudentDashboardStats(studentId: number): Promise<any> {
    try {
      const enrollmentsResult = await this.db.select({ count: sql<number>`count(distinct course_id)` })
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId));
        
      const completedLessonsResult = await this.db.select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(
          eq(sessions.studentId, studentId),
          eq(sessions.status, 'completed')
        ));
        
      const userStatsData = await this.getUserStats(studentId);
      
      const achievementsData = await this.getUserAchievements(studentId);
      
      const upcomingSessionsResult = await this.db.select()
        .from(sessions)
        .where(and(
          eq(sessions.studentId, studentId),
          eq(sessions.status, 'scheduled'),
          gte(sessions.scheduledDate, new Date())
        ))
        .orderBy(sessions.scheduledDate)
        .limit(5);
        
      const recentActivitiesResult = await this.db.select()
        .from(learningActivities)
        .where(eq(learningActivities.userId, studentId))
        .orderBy(learningActivities.createdAt)
        .limit(5);
      
      return {
        totalCourses: enrollmentsResult[0]?.count || 0,
        completedLessons: completedLessonsResult[0]?.count || 0,
        streakDays: userStatsData?.currentStreak || 0,
        totalXP: userStatsData?.totalXp || 0,
        currentLevel: userStatsData?.level || 1,
        achievements: achievementsData.map(ua => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          earned: true
        })),
        upcomingSessions: upcomingSessionsResult,
        recentActivities: recentActivitiesResult
      };
    } catch (error) {
      console.error('Error getting student dashboard stats:', error);
      return {
        totalCourses: 0,
        completedLessons: 0,
        streakDays: 0,
        totalXP: 0,
        currentLevel: 1,
        achievements: [],
        upcomingSessions: [],
        recentActivities: []
      };
    }
  }

  async getCallCenterDashboardStats(agentId: number): Promise<any> {
    return {
      todaysCalls: 18,
      totalLeads: 26,
      conversions: 4,
      activeLeads: 7,
      avgCallDuration: '7:45',
      followUpScheduled: 3,
      monthlyTarget: 120,
      performance: 89.2,
      totalStudents: 26,
      availableCourses: 12,
      responseRate: 94.5,
      satisfactionScore: 4.6
    };
  }

  async getMentorAssignments(mentorId: number): Promise<any[]> {
    return [{
      id: 1,
      mentorId,
      studentId: 1,
      status: "active",
      createdAt: new Date(),
      studentName: "علی احمدی",
      progress: 75
    }];
  }

  async createMentorAssignment(assignment: InsertMentorAssignment): Promise<MentorAssignment> {
    const id = this.currentId++;
    const newAssignment: MentorAssignment = {
      id,
      mentorId: 1,
      studentId: 1,
      status: "active",
      notes: "",
      assignedDate: new Date(),
      completedDate: new Date(),
      goals: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newAssignment;
  }

  async getMentoringSessions(assignmentId: number): Promise<MentoringSession[]> {
    return [{
      id: 1,
      assignmentId,
      scheduledDate: new Date(),
      duration: 60,
      sessionType: "conversation",
      topics: ["pronunciation"],
      outcomes: "Great progress on Persian pronunciation",
      nextSteps: ["Practice daily"],
      studentProgress: 85,
      mentorNotes: "Excellent improvement",
      status: "completed",
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }];
  }

  async createMentoringSession(session: InsertMentoringSession): Promise<MentoringSession> {
    const id = this.currentId++;
    const newSession: MentoringSession = {
      id,
      assignmentId: 1,
      scheduledDate: new Date(),
      duration: 60,
      sessionType: "conversation",
      topics: [],
      outcomes: "",
      nextSteps: [],
      studentProgress: 0,
      mentorNotes: "",
      status: "scheduled",
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newSession;
  }

  async getSkillAssessments(userId?: number, skillType?: string): Promise<SkillAssessment[]> {
    try {
      let query = this.db.select().from(skillAssessments);
      
      if (userId && skillType) {
        query = query.where(and(
          eq(skillAssessments.userId, userId),
          eq(skillAssessments.skillType, skillType)
        ));
      } else if (userId) {
        query = query.where(eq(skillAssessments.userId, userId));
      } else if (skillType) {
        query = query.where(eq(skillAssessments.skillType, skillType));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting skill assessments:', error);
      return [];
    }
  }

  async getLatestSkillAssessment(userId: number, skillType: string): Promise<SkillAssessment | undefined> {
    try {
      const result = await this.db.select().from(skillAssessments)
        .where(and(
          eq(skillAssessments.userId, userId),
          eq(skillAssessments.skillType, skillType)
        ))
        .orderBy(desc(skillAssessments.assessedAt))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting latest skill assessment:', error);
      return undefined;
    }
  }

  async createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment> {
    try {
      const result = await this.db.insert(skillAssessments)
        .values({
          ...assessment,
          assessedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating skill assessment:', error);
      throw error;
    }
  }

  async getLearningActivities(userId?: number, activityType?: string): Promise<LearningActivity[]> {
    try {
      let query = this.db.select().from(learningActivities);
      
      if (userId && activityType) {
        query = query.where(and(
          eq(learningActivities.userId, userId),
          eq(learningActivities.activityType, activityType)
        ));
      } else if (userId) {
        query = query.where(eq(learningActivities.userId, userId));
      } else if (activityType) {
        query = query.where(eq(learningActivities.activityType, activityType));
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting learning activities:', error);
      return [];
    }
  }

  async createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity> {
    try {
      const result = await this.db.insert(learningActivities)
        .values({
          ...activity,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating learning activity:', error);
      throw error;
    }
  }

  async getProgressSnapshots(userId: number, limit?: number): Promise<ProgressSnapshot[]> {
    try {
      let query = this.db.select().from(progressSnapshots)
        .where(eq(progressSnapshots.userId, userId))
        .orderBy(desc(progressSnapshots.snapshotDate));
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting progress snapshots:', error);
      return [];
    }
  }

  async createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot> {
    try {
      const result = await this.db.insert(progressSnapshots)
        .values({
          ...snapshot,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating progress snapshot:', error);
      throw error;
    }
  }

  async getLearningProfile(userId: number): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.select().from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting learning profile:', error);
      return undefined;
    }
  }

  async createLearningProfile(profile: InsertLearningProfile): Promise<LearningProfile> {
    const id = this.currentId++;
    const newProfile: LearningProfile = {
      id,
      userId: 1,
      nativeLanguage: "Persian",
      targetLanguage: "English",
      proficiencyLevel: "beginner",
      learningGoals: ["conversation"],
      culturalBackground: "Persian",
      preferredLearningStyle: "visual",
      weaknesses: [],
      strengths: [],
      progressHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newProfile;
  }

  async updateLearningProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    try {
      const result = await this.db.update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating learning profile:', error);
      return undefined;
    }
  }

  async getAiConversations(userId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(aiActivitySessions)
        .where(eq(aiActivitySessions.userId, userId))
        .orderBy(desc(aiActivitySessions.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting AI conversations:', error);
      return [];
    }
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const id = this.currentId++;
    const newConversation: AiConversation = {
      id,
      userId: 1,
      sessionId: "",
      modelName: "llama2",
      language: "en",
      conversationType: "practice",
      messages: [],
      duration: 0,
      skills: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newConversation;
  }

  async getMoodEntries(userId: number, dateFrom?: string, dateTo?: string): Promise<MoodEntry[]> {
    try {
      let query = this.db.select().from(moodEntries)
        .where(eq(moodEntries.userId, userId));
      
      if (dateFrom && dateTo) {
        query = query.where(and(
          gte(moodEntries.entryDate, new Date(dateFrom)),
          lte(moodEntries.entryDate, new Date(dateTo))
        ));
      }
      
      const result = await query.orderBy(desc(moodEntries.entryDate));
      return result;
    } catch (error) {
      console.error('Error getting mood entries:', error);
      return [];
    }
  }

  async createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.currentId++;
    const newMoodEntry: MoodEntry = {
      id,
      userId: 1,
      energy: 7,
      motivation: 8,
      stress: 3,
      focus: 8,
      mood: "good",
      context: "morning",
      notes: "",
      createdAt: new Date()
    };
    return newMoodEntry;
  }

  async getMoodRecommendations(userId: number, currentMood: any): Promise<MoodRecommendation[]> {
    try {
      const result = await this.db.select().from(moodRecommendations)
        .where(eq(moodRecommendations.userId, userId))
        .orderBy(desc(moodRecommendations.createdAt))
        .limit(10);
      return result;
    } catch (error) {
      console.error('Error getting mood recommendations:', error);
      return [];
    }
  }

  async createMoodRecommendation(recommendation: InsertMoodRecommendation): Promise<MoodRecommendation> {
    const id = this.currentId++;
    const newRecommendation: MoodRecommendation = {
      id,
      moodEntryId: 1,
      recommendationType: "activity",
      title: "Light Practice Session",
      description: "Based on your current mood, try a short vocabulary exercise",
      estimatedDuration: 15,
      difficultyLevel: "easy",
      skillFocus: ["vocabulary"],
      metadata: {},
      createdAt: new Date()
    };
    return newRecommendation;
  }

  async getMoodLearningAdaptations(userId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(learningAdaptations)
        .where(eq(learningAdaptations.userId, userId))
        .orderBy(desc(learningAdaptations.lastUsed));
      return result;
    } catch (error) {
      console.error('Error getting mood learning adaptations:', error);
      return [];
    }
  }

  async createMoodLearningAdaptation(adaptation: InsertMoodLearningAdaptation): Promise<MoodLearningAdaptation> {
    const id = this.currentId++;
    const newAdaptation: MoodLearningAdaptation = {
      id,
      userId: 1,
      moodPattern: "low_energy",
      adaptationStrategy: "shorter_sessions",
      effectiveness: 85,
      usageCount: 1,
      lastUsed: new Date(),
      createdAt: new Date()
    };
    return newAdaptation;
  }

  async getCRMStats(): Promise<any> {
    return {
      totalStudents: 156,
      activeStudents: 142,
      newStudentsThisMonth: 18,
      conversionRate: 0.72
    };
  }

  async getStudentsWithFilters(filters: any): Promise<any> {
    return [];
  }

  async getStudentDetails(id: number): Promise<any> {
    return null;
  }

  async createStudent(student: any): Promise<any> {
    return null;
  }

  async updateStudent(id: number, updates: any): Promise<any> {
    return null;
  }

  async getTeachersWithFilters(filters: any): Promise<any> {
    return [];
  }

  async getTeacherDetails(id: number): Promise<any> {
    return null;
  }

  async createTeacher(teacher: any): Promise<any> {
    return null;
  }

  async getStudentGroupsWithFilters(filters: any): Promise<any> {
    return [];
  }

  async getStudentGroupDetails(id: number): Promise<any> {
    return null;
  }

  async createStudentGroup(group: any): Promise<any> {
    return null;
  }

  async getAttendanceRecords(filters: any): Promise<any> {
    return [];
  }

  async createAttendanceRecord(record: any): Promise<any> {
    return null;
  }

  async getStudentNotes(studentId: number): Promise<any> {
    return [];
  }

  async createStudentNote(note: any): Promise<any> {
    return null;
  }

  async getStudentParents(studentId: number): Promise<any> {
    return [];
  }

  async createParentGuardian(parent: any): Promise<any> {
    return null;
  }

  async getStudentReports(filters: any): Promise<any> {
    return [];
  }

  async createStudentReport(report: any): Promise<any> {
    return null;
  }

  async getInstitutes(): Promise<any> {
    return [];
  }

  async createInstitute(institute: any): Promise<any> {
    return null;
  }

  async getPaymentTransactions(filters: any): Promise<any> {
    return [];
  }

  async getDailyRevenue(date: string): Promise<any> {
    return { revenue: 0, date };
  }

  async getFinancialStats(): Promise<any> {
    return {
      totalRevenue: 45000000,
      monthlyGrowth: 12.5,
      pendingPayments: 8500000
    };
  }

  async getTeacherEvaluations(filters: any): Promise<any> {
    return [];
  }

  async createTeacherEvaluation(evaluation: any): Promise<any> {
    return null;
  }

  async getClassObservations(filters: any): Promise<any> {
    return [];
  }

  async createClassObservation(observation: any): Promise<any> {
    return null;
  }

  async getSupervisorReports(filters: any): Promise<any> {
    return [];
  }

  async getAdminSettings(): Promise<any> {
    // Return mock admin settings for in-memory storage
    return {
      id: 1,
      instituteName: "MetaLingo",
      timezone: "Asia/Tehran",
      emailEnabled: false,
      emailSmtpHost: "",
      emailSmtpPort: 587,
      emailUsername: "",
      emailPassword: "",
      smsEnabled: false,
      smsProvider: "kavenegar",
      kavenegarEnabled: false,
      kavenegarApiKey: "",
      kavenegarSender: "",
      voipEnabled: false,
      voipProvider: "isabel",
      isabelVoipEnabled: false,
      isabelServerAddress: "",
      isabelSipPort: 5060,
      isabelUsername: "",
      isabelPassword: "",
      callRecordingEnabled: false,
      backupEnabled: false,
      maintenanceMode: false,
      aiProvider: process.env.AI_PROVIDER || "ollama",
      aiOllamaUrl: process.env.OLLAMA_HOST || "http://localhost:11434",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateAdminSettings(updates: any): Promise<any> {
    // For in-memory storage, just return the updated mock settings
    const existing = await this.getAdminSettings();
    return {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    try {
      const result = await this.db.update(courses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(courses.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating course:', error);
      return undefined;
    }
  }

  async deleteCourse(id: number): Promise<void> {
    try {
      await this.db.delete(courses).where(eq(courses.id, id));
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  }

  async getCourseEnrollments(courseId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(enrollments)
        .where(eq(enrollments.courseId, courseId));
      return result;
    } catch (error) {
      console.error('Error getting course enrollments:', error);
      return [];
    }
  }

  async getCourseModules(courseId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(courseModules)
        .where(eq(courseModules.courseId, courseId))
        .orderBy(courseModules.order);
      return result;
    } catch (error) {
      console.error('Error getting course modules:', error);
      return [];
    }
  }

  async getModuleLessons(moduleId: number): Promise<VideoLesson[]> {
    try {
      const result = await this.db.select().from(videoLessons)
        .where(eq(videoLessons.moduleId, moduleId))
        .orderBy(videoLessons.orderIndex);
      return result;
    } catch (error) {
      console.error('Error getting module lessons:', error);
      return [];
    }
  }

  async getChatConversations(userId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(chatConversations)
        .where(eq(chatConversations.userId, userId));
      return result;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  async getChatConversation(id: number): Promise<any | undefined> {
    try {
      const result = await this.db.select().from(chatConversations)
        .where(eq(chatConversations.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting chat conversation:', error);
      return undefined;
    }
  }

  async createChatConversation(conversation: any): Promise<any> {
    try {
      const result = await this.db.insert(chatConversations).values({
        ...conversation,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating chat conversation:', error);
      throw error;
    }
  }

  async updateChatConversation(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(chatConversations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(chatConversations.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating chat conversation:', error);
      return undefined;
    }
  }

  async getStudentConversations(studentId: number): Promise<any[]> {
    try {
      // Check if student is in any chat conversations as a participant
      const conversations = await this.db.select().from(chatConversations)
        .where(sql`${studentId}::text = ANY(participants)`)
        .orderBy(desc(chatConversations.lastMessageAt));
      
      // Transform database format to expected format with proper null safety
      return conversations.map(conv => {
        const title = conv.title || 'AI Conversation';
        const lastMessage = conv.lastMessage || 'Start a conversation';
        
        return {
          id: conv.id,
          name: title,
          avatar: "/api/placeholder/40/40",
          lastMessage: lastMessage,
          lastMessageTime: conv.lastMessageAt?.toISOString() || conv.createdAt?.toISOString() || new Date().toISOString(),
          unreadCount: conv.unreadCount || 0,
          type: conv.type || "ai_conversation",
          online: true,
          sessionType: 'general_chat',
          language: 'english',
          proficiencyLevel: 'intermediate'
        };
      });
    } catch (error) {
      console.error('Error getting student AI conversations:', error);
      return [];
    }
  }

  async getConversationMessages(conversationId: number, userId: number): Promise<any[]> {
    try {
      // First verify this conversation belongs to the user
      const conversation = await this.db.select().from(chatConversations)
        .where(and(
          eq(chatConversations.id, conversationId),
          sql`${userId}::text = ANY(participants)`
        ))
        .limit(1);
      
      if (!conversation.length) {
        console.error('Conversation not found or not accessible by user:', conversationId, userId);
        return [];
      }
  
      const messages = await this.db.select().from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(asc(chatMessages.sentAt));
      
      // Transform database format to expected format
      return messages.map(msg => ({
        id: msg.id,
        text: msg.message || '',
        senderId: msg.senderId || 0,
        senderName: msg.senderName || "AI Assistant",
        senderAvatar: "/api/placeholder/40/40",
        timestamp: msg.sentAt?.toISOString() || new Date().toISOString(),
        read: msg.isRead || false,
        type: msg.messageType || 'text',
        role: msg.senderId === userId ? 'user' : 'assistant',
        metadata: {},
        isBookmarked: false,
        reactions: msg.reactions || {}
      }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  async sendConversationMessage(conversationId: number, senderId: number, text: string): Promise<any> {
    try {
      // First verify this conversation belongs to the user
      const conversation = await this.db.select().from(chatConversations)
        .where(and(
          eq(chatConversations.id, conversationId),
          sql`${senderId} = ANY(participants)`
        ))
        .limit(1);
      
      if (!conversation.length) {
        throw new Error('Conversation not found or not accessible by user');
      }
  
      // Create the message using correct schema
      const messageData = {
        conversationId,
        senderId,
        senderName: 'User',
        message: text,
        messageType: 'text',
        isRead: false,
        sentAt: new Date(),
        reactions: {}
      };
  
      const result = await this.db.insert(chatMessages).values(messageData).returning();
      const savedMessage = result[0];
  
      // Update conversation's last message time
      await this.db.update(chatConversations)
        .set({ 
          lastMessageAt: new Date(),
          lastMessage: text
        })
        .where(eq(chatConversations.id, conversationId));
  
      // Transform to expected format
      return {
        id: savedMessage.id,
        text: savedMessage.message,
        senderId,
        senderName: "You",
        timestamp: savedMessage.sentAt?.toISOString() || new Date().toISOString(),
        read: false,
        type: savedMessage.messageType,
        role: 'user',
        metadata: {},
        isBookmarked: false,
        reactions: savedMessage.reactions || {}
      };
    } catch (error) {
      console.error('Error sending conversation message:', error);
      throw error;
    }
  }

  async createAIConversation(userId: number, language: string, sessionType: string, proficiencyLevel?: string): Promise<any> {
    try {
      const title = `${sessionType} - ${language}`;
      const conversationData = {
        participants: [userId], // Add user to participants array
        lastMessage: "New conversation started",
        lastMessageAt: new Date(),
        unreadCount: 0,
        type: 'ai_conversation',
        title,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      const result = await this.db.insert(chatConversations).values(conversationData).returning();
      const conversation = result[0];
  
      return {
        id: conversation.id,
        name: conversation.title || title,
        avatar: "/api/placeholder/40/40",
        lastMessage: "New conversation started",
        lastMessageTime: conversation.createdAt?.toISOString() || new Date().toISOString(),
        unreadCount: 0,
        type: "ai_conversation",
        online: true,
        sessionType,
        language,
        proficiencyLevel: proficiencyLevel || 'intermediate'
      };
    } catch (error) {
      console.error('Error creating AI conversation:', error);
      throw error;
    }
  }

  async addAIResponseMessage(conversationId: number, content: string, metadata?: any): Promise<any> {
    try {
      const messageData = {
        conversationId,
        senderId: 0, // AI assistant ID
        senderName: 'AI Assistant',
        message: content,
        messageType: 'text',
        isRead: true,
        sentAt: new Date(),
        reactions: metadata || {}
      };
  
      const result = await this.db.insert(chatMessages).values(messageData).returning();
      const savedMessage = result[0];
  
      // Update conversation's last message time
      await this.db.update(chatConversations)
        .set({ 
          lastMessageAt: new Date(),
          lastMessage: content
        })
        .where(eq(chatConversations.id, conversationId));
  
      return {
        id: savedMessage.id,
        text: savedMessage.message,
        senderId: 0, // AI assistant
        senderName: "AI Assistant",
        timestamp: savedMessage.sentAt?.toISOString() || new Date().toISOString(),
        read: true,
        type: savedMessage.messageType,
        role: 'assistant',
        metadata: metadata || {},
        isBookmarked: false,
        reactions: savedMessage.reactions || {}
      };
    } catch (error) {
      console.error('Error adding AI response message:', error);
      throw error;
    }
  }

  async getSupportTickets(filters?: any): Promise<any[]> {
    try {
      const result = await this.db.select().from(supportTickets);
      return result;
    } catch (error) {
      console.error('Error getting support tickets:', error);
      return [];
    }
  }

  async getSupportTicket(id: number): Promise<any | undefined> {
    try {
      const result = await this.db.select().from(supportTickets)
        .where(eq(supportTickets.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting support ticket:', error);
      return undefined;
    }
  }

  async createSupportTicket(ticket: any): Promise<any> {
    try {
      const result = await this.db.insert(supportTickets)
        .values({
          ...ticket,
          status: ticket.status || 'open',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async updateSupportTicket(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(supportTickets)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(supportTickets.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      return undefined;
    }
  }

  async deleteSupportTicket(id: number): Promise<void> {
    try {
      await this.db.delete(supportTickets)
        .where(eq(supportTickets.id, id));
    } catch (error) {
      console.error('Error deleting support ticket:', error);
    }
  }

  async getPushNotifications(filters?: any): Promise<any[]> {
    try {
      const result = await this.db.select().from(pushNotifications);
      return result;
    } catch (error) {
      console.error('Error getting push notifications:', error);
      return [];
    }
  }

  async getPushNotification(id: number): Promise<any | undefined> {
    try {
      const result = await this.db.select().from(pushNotifications)
        .where(eq(pushNotifications.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting push notification:', error);
      return undefined;
    }
  }

  async createPushNotification(notification: any): Promise<any> {
    try {
      const result = await this.db.insert(pushNotifications)
        .values({
          ...notification,
          status: notification.status || 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating push notification:', error);
      throw error;
    }
  }

  async updatePushNotification(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(pushNotifications)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(pushNotifications.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating push notification:', error);
      return undefined;
    }
  }

  async deletePushNotification(id: number): Promise<void> {
    try {
      await this.db.delete(pushNotifications)
        .where(eq(pushNotifications.id, id));
    } catch (error) {
      console.error('Error deleting push notification:', error);
    }
  }

  async getRooms(): Promise<Room[]> {
    try {
      const result = await this.db.select().from(rooms);
      return result;
    } catch (error) {
      console.error('Error getting rooms:', error);
      return [];
    }
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    try {
      const result = await this.db.select().from(rooms)
        .where(eq(rooms.id, id))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting room by id:', error);
      return undefined;
    }
  }

  async createRoom(room: any): Promise<Room> {
    try {
      const result = await this.db.insert(rooms)
        .values({
          ...room,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async updateRoom(id: number, updates: any): Promise<Room | undefined> {
    try {
      const result = await this.db.update(rooms)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(rooms.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating room:', error);
      return undefined;
    }
  }

  async deleteRoom(id: number): Promise<boolean> {
    try {
      await this.db.delete(rooms)
        .where(eq(rooms.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }

  async getActiveRooms(): Promise<Room[]> {
    try {
      const result = await this.db.select().from(rooms)
        .where(eq(rooms.isActive, true));
      return result;
    } catch (error) {
      console.error('Error getting available rooms:', error);
      return [];
    }
  }

  async getTeacherAvailability(teacherId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(teacherAvailability)
        .where(eq(teacherAvailability.teacherId, teacherId))
        .orderBy(teacherAvailability.dayOfWeek, teacherAvailability.startTime);
      return result;
    } catch (error) {
      console.error('Error getting teacher availability:', error);
      return [];
    }
  }
}
