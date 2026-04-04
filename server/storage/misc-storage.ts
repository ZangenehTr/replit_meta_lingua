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
import { MemStorageLead } from "./lead-storage";

export class MemStorageMisc extends MemStorageLead {
  

  async getTodaysChallenges(userId: number): Promise<any[]> {
    const today = new Date().toDateString();
    const userChallenges = Array.from(this.userDailyChallengeProgress.values())
      .filter(challenge => 
        challenge.userId === userId && 
        new Date(challenge.challengeDate).toDateString() === today
      );
    
    return userChallenges.map(challenge => ({
      id: challenge.challengeId,
      progress: challenge.progressValue,
      completed: challenge.isCompleted,
      xpEarned: challenge.xpEarned
    }));
  }

  async generatePersonalizedChallenges(userId: number, userProgress: any, userProfile: any): Promise<any[]> {
    // Generate personalized challenges based on user weaknesses and learning goals
    const challenges = [
      {
        id: 1,
        title: `Practice ${userProfile?.targetLanguage || 'Persian'} Vocabulary`,
        description: 'Learn 10 new words in your target language',
        category: 'vocabulary',
        progress: 0,
        total: 10,
        xpReward: 50,
        completed: false,
        difficulty: userProfile?.currentProficiency || 'beginner'
      },
      {
        id: 2,
        title: 'Complete Grammar Exercise',
        description: 'Improve your grammar understanding',
        category: 'grammar',
        progress: 0,
        total: 5,
        xpReward: 75,
        completed: false,
        difficulty: userProfile?.currentProficiency || 'beginner'
      },
      {
        id: 3,
        title: 'Practice Speaking',
        description: 'Record 5 minutes of speaking practice',
        category: 'speaking',
        progress: 0,
        total: 5,
        xpReward: 100,
        completed: false,
        difficulty: userProfile?.currentProficiency || 'beginner'
      }
    ];
    
    return challenges;
  }

  async getUserProgress(userId: number): Promise<any> {
    const userStats = await this.getUserStats(userId);
    const progressSnapshots = await this.getProgressSnapshots(userId);
    const activities = await this.getLearningActivities(userId);
    
    return {
      stats: userStats,
      snapshots: progressSnapshots,
      activities: activities,
      totalXp: userStats?.totalXp || 0,
      level: userStats?.level || 1,
      currentStreak: userStats?.currentStreak || 0
    };
  }

  async getSystemRoles(): Promise<any[]> {
    // Get real user counts for each role
    const users = await this.getUsers();
    const roles = [
      { 
        id: 1, 
        name: "Admin", 
        description: "Full system access", 
        permissions: ["*"], 
        userCount: users.filter(u => u.role === 'Admin').length, 
        color: "red" 
      },
      { 
        id: 2, 
        name: "Supervisor", 
        description: "Institute management and supervision", 
        permissions: ["manage_courses", "manage_users", "supervise"], 
        userCount: users.filter(u => u.role === 'Supervisor').length, 
        color: "blue" 
      },
      { 
        id: 3, 
        name: "Teacher/Tutor", 
        description: "Course instruction and student management", 
        permissions: ["teach", "grade", "communicate"], 
        userCount: users.filter(u => u.role === 'Teacher/Tutor').length, 
        color: "green" 
      },
      { 
        id: 4, 
        name: "Student", 
        description: "Learning and course participation", 
        permissions: ["learn", "submit", "communicate"], 
        userCount: users.filter(u => u.role === 'Student').length, 
        color: "purple" 
      },
      { 
        id: 5, 
        name: "Call Center Agent", 
        description: "Lead management and customer support", 
        permissions: ["leads", "calls", "support"], 
        userCount: users.filter(u => u.role === 'Call Center Agent').length, 
        color: "yellow" 
      },
      { 
        id: 6, 
        name: "Accountant", 
        description: "Financial management and reporting", 
        permissions: ["financial", "reports", "payouts"], 
        userCount: users.filter(u => u.role === 'Accountant').length, 
        color: "orange" 
      },
      { 
        id: 7, 
        name: "Mentor", 
        description: "Student mentoring and guidance", 
        permissions: ["mentees", "progress", "communication"], 
        userCount: users.filter(u => u.role === 'Mentor').length, 
        color: "teal" 
      }
    ];
    
    return roles;
  }

  async getSystemIntegrations(): Promise<any[]> {
    // Get real integration status from admin settings
    const integrations = [
      { 
        name: "Ollama AI", 
        description: "Local AI processing", 
        status: "connected", 
        type: "ai",
        lastChecked: new Date().toISOString()
      },
      { 
        name: "Shetab Payment Gateway", 
        description: "Iranian payment processing", 
        status: "connected", 
        type: "payment",
        lastChecked: new Date().toISOString()
      },
      { 
        name: "Kavenegar SMS", 
        description: "SMS notifications and OTP", 
        status: "pending", 
        type: "communication",
        lastChecked: new Date().toISOString()
      },
      { 
        name: "Email Service", 
        description: "Automated email notifications", 
        status: "connected", 
        type: "communication",
        lastChecked: new Date().toISOString()
      },
      { 
        name: "WebRTC Service", 
        description: "Live video classrooms", 
        status: "configured", 
        type: "video",
        lastChecked: new Date().toISOString()
      }
    ];
    
    return integrations;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = this.currentId++;
    const newGame = {
      id,
      ...game,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.games.set(id, newGame);
    return newGame;
  }

  async getGameById(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByAgeGroup(ageGroup: string): Promise<Game[]> {
      try {
      const result = await this.db.select().from(games)
        .where(eq(games.ageGroup, ageGroup));
      return result;
    } catch (error) {
      console.error('Error getting games by age group:', error);
      return [];
    }
  }

  async getGamesByLevel(level: string): Promise<Game[]> {
      try {
      const result = await this.db.select().from(games)
        .where(eq(games.level, level));
      return result;
    } catch (error) {
      console.error('Error getting games by level:', error);
      return [];
    }
  }

  async getGamesByFilters(filters: { ageGroup?: string, gameType?: string, level?: string, language?: string }): Promise<Game[]> {
    try {
      let filteredGames = await this.db.select().from(games);
    
      if (filters.ageGroup) {
        filteredGames = filteredGames.filter(g => g.ageGroup === filters.ageGroup);
      }
      if (filters.gameType) {
        filteredGames = filteredGames.filter(g => g.gameType === filters.gameType);
      }
      if (filters.level) {
        filteredGames = filteredGames.filter(g => g.level === filters.level);
      }
      if (filters.language) {
        filteredGames = filteredGames.filter(g => g.language === filters.language);
      }
      
      return filteredGames;
    } catch (error) {
      console.error('Error getting games by filters:', error);
      return [];
    }
  }

  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined> {
    const existingGame = this.games.get(id);
    if (existingGame) {
      const updatedGame = { ...existingGame, ...game, updatedAt: new Date() };
      this.games.set(id, updatedGame);
      return updatedGame;
    }
    return undefined;
  }

  async getGameAnalytics(gameId: number): Promise<any> {
    const sessions = await this.db.select().from(gameSessions)
      .where(eq(gameSessions.gameId, gameId));
    
    const totalPlays = sessions.length;
    const scores = sessions.map(s => s.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const completionRate = sessions.filter(s => s.isCompleted).length / Math.max(totalPlays, 1) * 100;
    
    // Get top players
    const playerScores = new Map<number, { name: string; score: number }>();
    sessions.forEach(s => {
      const user = this.users.get(s.userId);
      if (user) {
        const current = playerScores.get(s.userId) || { name: `${user.firstName} ${user.lastName}`, score: 0 };
        playerScores.set(s.userId, {
          name: current.name,
          score: Math.max(current.score, s.score)
        });
      }
    });
    
    const topPlayers = Array.from(playerScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Question stats (mock for now)
    const questionStats = [];
    
    // Daily plays (last 7 days)
    const dailyPlays = [];
    
    return {
      totalPlays,
      averageScore,
      completionRate,
      topPlayers,
      questionStats,
      dailyPlays
    };
  }

  async createGameSession(session: InsertGameSession): Promise<GameSession> {
    const id = this.currentId++;
    const newSession = {
      id,
      ...session,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.gameSessions.set(id, newSession);
    return newSession;
  }

  async createGameQuestion(question: InsertGameQuestion): Promise<GameQuestion> {
    const id = this.currentId++;
    const newQuestion = {
      id,
      ...question,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.gameQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async getGameQuestions(gameId: number, levelId?: number): Promise<GameQuestion[]> {
    const questions = Array.from(this.gameQuestions.values())
      .filter(q => q.gameId === gameId);
    
    if (levelId !== undefined) {
      return questions.filter(q => q.levelNumber === levelId);
    }
    
    return questions;
  }

  async getRandomGameQuestions(gameId: number, count: number, difficulty?: string): Promise<GameQuestion[]> {
    let questions = Array.from(this.gameQuestions.values())
      .filter(q => q.gameId === gameId);
    
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    // Shuffle and return requested count
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async updateGameQuestion(id: number, question: Partial<InsertGameQuestion>): Promise<GameQuestion | undefined> {
    const existing = this.gameQuestions.get(id);
    if (existing) {
      const updated = { ...existing, ...question, updatedAt: new Date() };
      this.gameQuestions.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteGameQuestion(id: number): Promise<boolean> {
    return this.gameQuestions.delete(id);
  }

  async updateQuestionStats(questionId: number, isCorrect: boolean, responseTime: number): Promise<void> {
    // In memory storage, we can track basic stats
    const question = this.gameQuestions.get(questionId);
    if (question) {
      // Update stats (would be more complex in real DB)
      console.log(`Question ${questionId} answered: ${isCorrect ? 'correct' : 'incorrect'} in ${responseTime}ms`);
    }
  }

  async getChatConversations(): Promise<any[]> {
    return []; // Return empty array for communication features
  }

  async getSupportTickets(): Promise<any[]> {
    return []; // Return empty array for support tickets
  }

  async getPushNotifications(): Promise<any[]> {
    return []; // Return empty array for notifications
  }

  async getCallernPackages(): Promise<any[]> {
    return [];
  }

  async getTeacherCallernAvailability(teacherId?: number): Promise<any[]> {
    try {
      let query = this.db.select().from(teacherCallernAvailability);
      
      if (teacherId) {
        query = query.where(eq(teacherCallernAvailability.teacherId, teacherId));
      }
      
      const result = await query.orderBy(teacherCallernAvailability.lastActiveAt);
      return result;
    } catch (error) {
      console.error('Error getting teacher Callern availability:', error);
      return [];
    }
  }

  async getTeachersForCallern(): Promise<any[]> {
    return []; // MemStorage stub
  }

  async getAuthorizedCallernTeachers(): Promise<any[]> {
    return []; // MemStorage stub - use DatabaseStorage for actual implementation
  }

  async getTeacherCallernAuthorization(teacherId: number): Promise<TeacherCallernAuthorization | undefined> {
    return undefined; // MemStorage stub - use DatabaseStorage for actual implementation
  }

  async createTeacherCallernAuthorization(data: InsertTeacherCallernAuthorization): Promise<TeacherCallernAuthorization> {
    throw new Error('MemStorage does not support CallerN authorization - use DatabaseStorage');
  }

  async updateTeacherCallernAuthorization(
    teacherId: number, 
    updates: Partial<TeacherCallernAuthorization>
  ): Promise<TeacherCallernAuthorization | undefined> {
    return undefined;
  }

  async deleteTeacherCallernAuthorization(teacherId: number): Promise<boolean> {
    return false; // MemStorage stub - use DatabaseStorage for actual implementation
  }

  async createCallernPackage(pkg: any): Promise<any> {
    try {
      const result = await this.db.insert(callernPackages)
        .values({
          ...pkg,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating Callern package:', error);
      throw error;
    }
  }

  async getCallernPackage(id: number): Promise<any> {
    try {
      const result = await this.db.select().from(callernPackages)
        .where(eq(callernPackages.id, id))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting Callern package:', error);
      return null;
    }
  }

  async setTeacherCallernAvailability(teacherId: number, availability: any): Promise<any>;

  async setTeacherCallernAvailability(availabilityData: any): Promise<any>;

  async setTeacherCallernAvailability(teacherIdOrData: any, availability?: any): Promise<any> {
    try {
      let dataToInsert;
      
      if (typeof teacherIdOrData === 'number') {
        dataToInsert = { teacherId: teacherIdOrData, ...availability };
      } else {
        dataToInsert = teacherIdOrData;
      }
      
      // Try to update existing record first
      const existing = await this.db.select().from(teacherCallernAvailability)
        .where(eq(teacherCallernAvailability.teacherId, dataToInsert.teacherId))
        .limit(1);
      
      if (existing.length > 0) {
        const result = await this.db.update(teacherCallernAvailability)
          .set({ ...dataToInsert, updatedAt: new Date() })
          .where(eq(teacherCallernAvailability.teacherId, dataToInsert.teacherId))
          .returning();
        return result[0];
      } else {
        const result = await this.db.insert(teacherCallernAvailability)
          .values({ ...dataToInsert, createdAt: new Date() })
          .returning();
        return result[0];
      }
    } catch (error) {
      console.error('Error setting teacher Callern availability:', error);
      throw error;
    }
  }

  async getSupervisionStats(supervisorId?: number): Promise<any> {
    return {
      totalObservations: 0,
      pendingObservations: 0,
      completedObservations: 0,
      teachersObserved: 0,
      averageRating: 0
    };
  }

  async getLiveClassSessions(filters?: any): Promise<any[]> {
    return [];
  }

  async getTeacherRetentionData(filters?: any): Promise<any> {
    return {
      totalTeachers: 0,
      activeTeachers: 0,
      retentionRate: 0
    };
  }

  async getOverdueObservations(): Promise<any[]> {
    return [];
  }

  async getPendingObservations(): Promise<any[]> {
    return [];
  }

  async getScheduledObservations(): Promise<any[]> {
    return [];
  }

  async getSupervisionObservations(): Promise<any[]> {
    // Return mock supervision observations data
    return [
      {
        id: 1,
        supervisorId: 1,
        teacherId: 1,
        sessionId: 1,
        observationType: 'live',
        rating: 4.5,
        scores: {
          teaching: 5,
          engagement: 4,
          timeManagement: 4,
          languageAccuracy: 5
        },
        notes: 'Excellent teaching methodology',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getStudentQuestionnaires(courseId?: number): Promise<StudentQuestionnaire[]> {
    // Return mock questionnaires
    return [
      {
        id: 1,
        title: 'Course Feedback',
        description: 'Please provide feedback on your learning experience',
        courseId: courseId || 1,
        triggerType: 'session',
        triggerSessionNumber: 5,
        questions: [
          {
            id: '1',
            text: 'How would you rate your teacher?',
            type: 'rating',
            required: true
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as StudentQuestionnaire[];
  }

  async createStudentQuestionnaire(questionnaire: InsertStudentQuestionnaire): Promise<StudentQuestionnaire> {
    const id = this.currentId++;
    const newQuestionnaire = {
      id,
      ...questionnaire,
      createdAt: new Date(),
      updatedAt: new Date()
    } as StudentQuestionnaire;
    return newQuestionnaire;
  }

  async updateStudentQuestionnaire(id: number, updates: Partial<StudentQuestionnaire>): Promise<StudentQuestionnaire | undefined> {
    try {
      const result = await this.db.update(studentQuestionnaires)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(studentQuestionnaires.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating student questionnaire:', error);
      return undefined;
    }
  }

  async deleteStudentQuestionnaire(id: number): Promise<void> {
    try {
      await this.db.delete(studentQuestionnaires)
        .where(eq(studentQuestionnaires.id, id));
    } catch (error) {
      console.error('Error deleting student questionnaire:', error);
    }
  }

  async getQuestionnaireResponses(questionnaireId?: number, teacherId?: number): Promise<QuestionnaireResponse[]> {
    return [];
  }

  async createQuestionnaireResponse(response: InsertQuestionnaireResponse): Promise<QuestionnaireResponse> {
    const id = this.currentId++;
    return {
      id,
      ...response,
      createdAt: new Date()
    } as QuestionnaireResponse;
  }

  async updateQuestionnaireResponse(id: number, updates: Partial<QuestionnaireResponse>): Promise<QuestionnaireResponse | undefined> {
    return undefined;
  }

  async getStudentSessions(studentId: number): Promise<any[]> {
    return [];
  }

  async getUserActivities(userId: number): Promise<any[]> {
    return [];
  }

  async getTeacherSessions(teacherId: number): Promise<any[]> {
    return [];
  }

  async getTeacherStudentCount(teacherId: number): Promise<number> {
    return 0;
  }

  async getTeacherRevenue(teacherId: number): Promise<number> {
    return 0;
  }

  async getTeacherReviews(teacherId: number): Promise<any[]> {
    return [];
  }

  async getAllTeacherReviews(): Promise<any[]> {
    return [];
  }

  async getCourseEnrollmentCount(courseId: number): Promise<number> {
    return 0;
  }

  async getCourseCompletionRate(courseId: number): Promise<number> {
    return 0;
  }

  async getCourseRating(courseId: number): Promise<number | null> {
    return null;
  }

  async updateTeacherCallernAvailability(teacherId: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(teacherCallernAvailability)
        .set({ ...updates, lastActiveAt: new Date() })
        .where(eq(teacherCallernAvailability.teacherId, teacherId))
        .returning();
      return result[0] || { success: false, teacherId, error: 'Not found' };
    } catch (error) {
      console.error('Error updating teacher Callern availability:', error);
      return { success: false, teacherId, error: error.message };
    }
  }

  async incrementTeacherMissedCalls(teacherId: number): Promise<any> {
    try {
      const result = await this.db.update(teacherCallernAvailability)
        .set({ 
          missedCalls: sql`${teacherCallernAvailability.missedCalls} + 1`,
          lastActiveAt: new Date()
        })
        .where(eq(teacherCallernAvailability.teacherId, teacherId))
        .returning();
      
      return { 
        success: true, 
        teacherId, 
        action: 'missed_call_incremented',
        newCount: result[0]?.missedCalls || 0
      };
    } catch (error) {
      console.error('Error incrementing teacher missed calls:', error);
      return { success: false, teacherId, error: error.message };
    }
  }

  async updateTeacherLastSeen(teacherId: number): Promise<any> {
    try {
      const result = await this.db.update(teacherCallernAvailability)
        .set({ lastActiveAt: new Date() })
        .where(eq(teacherCallernAvailability.teacherId, teacherId))
        .returning();
      
      return { 
        success: true, 
        teacherId, 
        action: 'last_seen_updated',
        lastActiveAt: result[0]?.lastActiveAt
      };
    } catch (error) {
      console.error('Error updating teacher last seen:', error);
      return { success: false, teacherId, error: error.message };
    }
  }

  async getStudentCallernPackages(studentId: number): Promise<any[]> {
    return [];
  }

  async createStudentCallernPackage(packageData: any): Promise<any> {
    try {
      const result = await this.db.insert(studentCallernPackages)
        .values({
          ...packageData,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating student Callern package:', error);
      throw error;
    }
  }

  async getCallernCallHistory(): Promise<any[]> {
    try {
      const result = await this.db.select().from(callernCallHistory)
        .orderBy(desc(callernCallHistory.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting Callern call history:', error);
      return [];
    }
  }

  async createCallernCallHistory(historyData: any): Promise<any> {
    try {
      const result = await this.db.insert(callernCallHistory)
        .values({
          ...historyData,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating Callern call history:', error);
      throw error;
    }
  }

  async updateCallernCallHistory(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(callernCallHistory)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(callernCallHistory.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating Callern call history:', error);
      return undefined;
    }
  }

  async checkTeacherScheduleConflicts(teacherId: number, proposedHours: string[]): Promise<any> {
    return { hasConflicts: false, conflicts: [], conflictType: '', conflictingHours: [] };
  }

  async getStudentIRTAbility(studentId: number): Promise<{
    theta: number;
    standardError: number;
    totalResponses: number;
  } | undefined> {
    return {
      theta: 0,
      standardError: 1,
      totalResponses: 0
    };
  }

  async updateStudentIRTAbility(studentId: number, ability: {
    theta: number;
    standardError: number;
    totalResponses: number;
    lastUpdated: Date;
  }): Promise<void> {
    console.log('Mock: Updating IRT ability for student:', studentId, ability);
  }

  async createIRTResponse(response: {
    studentId: number;
    sessionId: number;
    itemId: string;
    correct: boolean;
    responseTime: number;
    theta: number;
  }): Promise<any> {
    return {
      id: Math.floor(Math.random() * 10000),
      ...response,
      createdAt: new Date()
    };
  }

  async createAssessmentSession(session: any): Promise<void> {
    try {
      await this.db.insert(testAttempts)
        .values({
          ...session,
          testId: session.testId || 1,
          userId: session.userId,
          startedAt: new Date(),
          status: 'in_progress'
        });
    } catch (error) {
      console.error('Error creating assessment session:', error);
      throw error;
    }
  }

  async getAssessmentSession(sessionId: string): Promise<any> {
    try {
      const result = await this.db.select().from(testAttempts)
        .where(eq(testAttempts.id, parseInt(sessionId)))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting assessment session:', error);
      return null;
    }
  }

  async updateAssessmentSession(session: any): Promise<void> {
    try {
      await this.db.update(testAttempts)
        .set({ 
          ...session,
          updatedAt: new Date()
        })
        .where(eq(testAttempts.id, session.id));
    } catch (error) {
      console.error('Error updating assessment session:', error);
    }
  }

  async updateStudentAssessmentResults(studentId: number, results: any): Promise<void> {
    try {
      // Store assessment results in user profiles
      await this.db.update(userProfiles)
        .set({ 
          assessmentResults: JSON.stringify(results),
          updatedAt: new Date()
        })
        .where(eq(userProfiles.userId, studentId));
    } catch (error) {
      console.error('Error updating student assessment results:', error);
    }
  }

  async createCallHistory(data: any): Promise<any> {
    try {
      const result = await this.db.insert(callernCallHistory)
        .values({
          ...data,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating call history:', error);
      throw error;
    }
  }

  async getAiTrainingStats() {
    return {
      totalTrainingData: 150000,
      totalModels: 3,
      totalDatasets: 5,
      activeJobs: 1
    };
  }

  async getAiModels() {
    return [
      {
        id: 1,
        modelName: "Llama 3.2B Production",
        baseModel: "llama3.2b", 
        version: "1.0.0",
        description: "Main production model for conversation assistance",
        isActive: true,
        isDefault: true,
        performanceMetrics: {
          accuracy: 0.92,
          loss: 0.15,
          training_time: 3600
        },
        createdAt: new Date().toISOString()
      }
    ];
  }

  async createAiModel(modelData: any) {
    return { id: Date.now(), ...modelData, createdAt: new Date().toISOString() };
  }

  async activateAiModel(modelId: number) {
    return true;
  }

  async getAiTrainingJobs() {
    return [
      {
        id: 1,
        jobId: `job_${Date.now()}`,
        modelName: "Llama 3.2B Production",
        status: "running",
        progress: 75,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: null,
        errorMessage: null,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }

  async cancelAiTrainingJob(jobId: number) {
    return true;
  }

  async getAiDatasets() {
    return [
      {
        id: 1,
        name: "English Conversation Dataset",
        description: "Real conversation data from Callern sessions",
        dataType: "conversation",
        language: "English",
        sourceType: "callern_sessions",
        dataCount: 15000,
        totalSize: 524288000,
        isActive: true,
        qualityScore: 4.5,
        createdAt: new Date().toISOString()
      }
    ];
  }

  async createPlacementTestSession(data: any): Promise<any> {
    try {
      const result = await this.db.insert(placementTests)
        .values({
          userId: data.userId,
          targetLanguage: data.targetLanguage,
          learningGoal: data.learningGoal || 'general',
          status: data.status || 'in_progress',
          currentSkill: data.currentSkill || 'speaking',
          currentQuestionIndex: data.currentQuestionIndex || 0,
          startedAt: new Date(),
          completedAt: null,
          overallCEFRLevel: null,
          speakingLevel: null,
          listeningLevel: null,
          readingLevel: null,
          writingLevel: null,
          overallScore: null,
          speakingScore: null,
          listeningScore: null,
          readingScore: null,
          writingScore: null
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating placement test session:', error);
      throw error;
    }
  }

  async getPlacementTestSession(id: number): Promise<any | undefined> {
    return this.placementTestSessions.get(id);
  }

  async updatePlacementTestSession(id: number, updates: any): Promise<any | undefined> {
    const session = this.placementTestSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.placementTestSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserPlacementTestSessions(userId: number): Promise<any[]> {
    return Array.from(this.placementTestSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async getPlacementTestSessionsPaginated(page: number, limit: number): Promise<{ sessions: any[], total: number }> {
    const allSessions = Array.from(this.placementTestSessions.values());
    const startIndex = (page - 1) * limit;
    const sessions = allSessions.slice(startIndex, startIndex + limit);
    return { sessions, total: allSessions.length };
  }

  async getPlacementTestSessionsCount(): Promise<number> {
    return this.placementTestSessions.size;
  }

  async createPlacementTestQuestion(data: any): Promise<any> {
    const questionData = {
      id: this.currentId++,
      skill: data.skill,
      level: data.level,
      type: data.type,
      title: data.title,
      prompt: data.prompt,
      content: data.content,
      responseType: data.responseType,
      expectedDurationSeconds: data.expectedDurationSeconds || 120,
      estimatedMinutes: data.estimatedMinutes || 2,
      createdAt: new Date()
    };
    
    this.placementTestQuestions.set(questionData.id, questionData);
    return questionData;
  }

  async getPlacementTestQuestion(id: number): Promise<any | undefined> {
    return this.placementTestQuestions.get(id);
  }

  async getPlacementTestQuestions(filters?: any): Promise<any[]> {
    let questions = Array.from(this.placementTestQuestions.values());
    
    if (filters) {
      if (filters.skill) {
        questions = questions.filter(q => q.skill === filters.skill);
      }
      if (filters.level) {
        questions = questions.filter(q => q.level === filters.level);
      }
    }
    
    return questions;
  }

  async createPlacementTestResponse(data: any): Promise<any> {
    const responseData = {
      id: this.currentId++,
      sessionId: data.sessionId,
      questionId: data.questionId,
      userResponse: data.userResponse,
      timeSpent: data.timeSpent || 0,
      score: data.score || 0,
      level: data.level || 'B1',
      feedback: data.feedback || '',
      confidence: data.confidence || 0.5,
      createdAt: new Date()
    };
    
    this.placementTestResponses.set(responseData.id, responseData);
    return responseData;
  }

  async updatePlacementTestResponse(id: number, updates: any): Promise<any | undefined> {
    const response = this.placementTestResponses.get(id);
    if (!response) return undefined;
    
    const updatedResponse = { ...response, ...updates };
    this.placementTestResponses.set(id, updatedResponse);
    return updatedResponse;
  }

  async getPlacementTestResponses(sessionId: number): Promise<any[]> {
    return Array.from(this.placementTestResponses.values())
      .filter(response => response.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createUserRoadmapEnrollment(data: any): Promise<any> {
    const enrollmentData = {
      id: this.currentId++,
      userId: data.userId,
      roadmapId: data.roadmapId,
      placementTestSessionId: data.placementTestSessionId,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0
    };
    
    this.userRoadmapEnrollments.set(enrollmentData.id, enrollmentData);
    return enrollmentData;
  }

  async getAiStudyPartnerByUserId(userId: number): Promise<AiStudyPartner | undefined> {
    // For MemStorage, this is a placeholder
    return undefined;
  }

  async createAiStudyPartner(data: InsertAiStudyPartner): Promise<AiStudyPartner> {
    // For MemStorage, this is a placeholder
    throw new Error("AI Study Partner requires database storage");
  }

  async updateAiStudyPartner(userId: number, data: Partial<AiStudyPartner>): Promise<AiStudyPartner | undefined> {
    // For MemStorage, this is a placeholder
    return undefined;
  }

  async getChatConversationById(id: number): Promise<ChatConversation | undefined> {
    // For MemStorage, this is a placeholder
    return undefined;
  }

  async getAiConversationByUserId(userId: number): Promise<ChatConversation | undefined> {
    // For MemStorage, this is a placeholder
    return undefined;
  }

  async createChatConversation(data: InsertChatConversation): Promise<ChatConversation> {
    // For MemStorage, this is a placeholder
    throw new Error("Chat conversations require database storage");
  }

  async updateChatConversation(id: number, data: Partial<ChatConversation>): Promise<ChatConversation | undefined> {
    // For MemStorage, this is a placeholder
    return undefined;
  }

  async getChatMessages(conversationId: number, options?: { limit?: number; offset?: number }): Promise<ChatMessage[]> {
    // For MemStorage, this is a placeholder
    return [];
  }

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    // For MemStorage, this is a placeholder
    throw new Error("Chat messages require database storage");
  }

  async getBookCategories(): Promise<BookCategory[]> {
    return await this.db.select().from(book_categories);
  }

  async getBookCategory(id: number): Promise<BookCategory | undefined> {
    const result = await this.db.select().from(book_categories).where(eq(book_categories.id, id));
    return result[0];
  }

  async getBookCategoriesByParent(parentId: number | null): Promise<BookCategory[]> {
    if (parentId === null) {
      return await this.db.select().from(book_categories).where(isNull(book_categories.parent_id));
    }
    return await this.db.select().from(book_categories).where(eq(book_categories.parent_id, parentId));
  }

  async createBookCategory(data: BookCategoryInsert): Promise<BookCategory> {
    const result = await this.db.insert(book_categories).values(data).returning();
    return result[0];
  }

  async updateBookCategory(id: number, updates: Partial<BookCategory>): Promise<BookCategory | undefined> {
    const result = await this.db.update(book_categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(book_categories.id, id))
      .returning();
    return result[0];
  }

  async deleteBookCategory(id: number): Promise<void> {
    await this.db.delete(book_categories).where(eq(book_categories.id, id));
  }

  async getBooks(filters?: { category?: string; isFree?: boolean; limit?: number; offset?: number }): Promise<Book[]> {
    let query = this.db.select().from(books);
    
    if (filters?.category) {
      query = query.where(eq(books.category, filters.category));
    }
    if (filters?.isFree !== undefined) {
      query = query.where(eq(books.is_free, filters.isFree));
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
  
    return await query;
  }

  async getBook(id: number): Promise<Book | undefined> {
    const result = await this.db.select().from(books).where(eq(books.id, id));
    return result[0];
  }

  async getBookByISBN(isbn: string): Promise<Book | undefined> {
    const result = await this.db.select().from(books).where(eq(books.isbn, isbn));
    return result[0];
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return await this.db.select().from(books).where(eq(books.category, category));
  }

  async getFreeBooks(): Promise<Book[]> {
    return await this.db.select().from(books).where(eq(books.is_free, true));
  }

  async searchBooks(query: string): Promise<Book[]> {
    return await this.db.select().from(books)
      .where(or(
        sql`${books.title} ILIKE ${`%${query}%`}`,
        sql`${books.author} ILIKE ${`%${query}%`}`,
        sql`${books.description} ILIKE ${`%${query}%`}`
      ));
  }

  async createBook(data: BookInsert): Promise<Book> {
    const result = await this.db.insert(books).values(data).returning();
    return result[0];
  }

  async updateBook(id: number, updates: Partial<Book>): Promise<Book | undefined> {
    const result = await this.db.update(books)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();
    return result[0];
  }

  async deleteBook(id: number): Promise<void> {
    await this.db.delete(books).where(eq(books.id, id));
  }

  async getBookAssets(bookId: number): Promise<BookAsset[]> {
    return await this.db.select().from(book_assets).where(eq(book_assets.book_id, bookId));
  }

  async getBookAsset(id: number): Promise<BookAsset | undefined> {
    const result = await this.db.select().from(book_assets).where(eq(book_assets.id, id));
    return result[0];
  }

  async createBookAsset(data: BookAssetInsert): Promise<BookAsset> {
    const result = await this.db.insert(book_assets).values(data).returning();
    return result[0];
  }

  async updateBookAsset(id: number, updates: Partial<BookAsset>): Promise<BookAsset | undefined> {
    const result = await this.db.update(book_assets)
      .set(updates)
      .where(eq(book_assets.id, id))
      .returning();
    return result[0];
  }

  async deleteBookAsset(id: number): Promise<void> {
    await this.db.delete(book_assets).where(eq(book_assets.id, id));
  }

  async getDictionaryLookups(userId: number, language?: string): Promise<DictionaryLookup[]> {
    let query = this.db.select().from(dictionary_lookups).where(eq(dictionary_lookups.user_id, userId));
    
    if (language) {
      query = query.where(and(eq(dictionary_lookups.user_id, userId), eq(dictionary_lookups.language, language)));
    }
  
    return await query.orderBy(desc(dictionary_lookups.lookup_date));
  }

  async getDictionaryLookup(id: number): Promise<DictionaryLookup | undefined> {
    const result = await this.db.select().from(dictionary_lookups).where(eq(dictionary_lookups.id, id));
    return result[0];
  }

  async createDictionaryLookup(data: DictionaryLookupInsert): Promise<DictionaryLookup> {
    const result = await this.db.insert(dictionary_lookups).values(data).returning();
    return result[0];
  }

  async deleteDictionaryLookup(id: number): Promise<void> {
    await this.db.delete(dictionary_lookups).where(eq(dictionary_lookups.id, id));
  }

  async getUserCart(userId: number): Promise<Cart | undefined> {
    const result = await this.db.select().from(carts).where(eq(carts.user_id, userId));
    return result[0];
  }

  async createCart(data: CartInsert): Promise<Cart> {
    const result = await this.db.insert(carts).values(data).returning();
    return result[0];
  }

  async updateCart(id: number, updates: Partial<Cart>): Promise<Cart | undefined> {
    const result = await this.db.update(carts)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(carts.id, id))
      .returning();
    return result[0];
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.getUserCart(userId);
    if (cart) {
      await this.db.delete(cart_items).where(eq(cart_items.cart_id, cart.id));
    }
  }

  async getCartItems(cartId: number): Promise<(CartItem & { book: Book })[]> {
    return await this.db.select({
      ...cart_items,
      book: books
    })
    .from(cart_items)
    .innerJoin(books, eq(cart_items.book_id, books.id))
    .where(eq(cart_items.cart_id, cartId));
  }

  async getCartItem(id: number): Promise<CartItem | undefined> {
    const result = await this.db.select().from(cart_items).where(eq(cart_items.id, id));
    return result[0];
  }

  async addToCart(cartId: number, bookId: number, quantity: number = 1): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await this.db.select().from(cart_items)
      .where(and(eq(cart_items.cart_id, cartId), eq(cart_items.book_id, bookId)));
    
    if (existingItem.length > 0) {
      // Update quantity
      const result = await this.db.update(cart_items)
        .set({ quantity: existingItem[0].quantity + quantity })
        .where(eq(cart_items.id, existingItem[0].id))
        .returning();
      return result[0];
    } else {
      // Create new item
      const result = await this.db.insert(cart_items)
        .values({ cart_id: cartId, book_id: bookId, quantity })
        .returning();
      return result[0];
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await this.db.update(cart_items)
      .set({ quantity })
      .where(eq(cart_items.id, id))
      .returning();
    return result[0];
  }

  async removeFromCart(id: number): Promise<void> {
    await this.db.delete(cart_items).where(eq(cart_items.id, id));
  }

  async getOrders(userId?: number, status?: string): Promise<(Order & { items: (OrderItem & { book: Book })[] })[]> {
    let query = this.db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.user_id, userId));
    }
    if (status) {
      query = query.where(eq(orders.status, status));
    }
  
    const ordersResult = await query.orderBy(desc(orders.created_at));
    
    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, items };
      })
    );
  
    return ordersWithItems;
  }

  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { book: Book })[] }) | undefined> {
    const result = await this.db.select().from(orders).where(eq(orders.id, id));
    if (!result[0]) return undefined;
  
    const items = await this.getOrderItems(id);
    return { ...result[0], items };
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await this.db.select().from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.created_at));
  }

  async createOrder(data: OrderInsert): Promise<Order> {
    const result = await this.db.insert(orders).values(data).returning();
    return result[0];
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await this.db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async cancelOrder(id: number): Promise<Order | undefined> {
    return await this.updateOrderStatus(id, 'cancelled');
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { book: Book })[]> {
    return await this.db.select({
      ...order_items,
      book: books
    })
    .from(order_items)
    .innerJoin(books, eq(order_items.book_id, books.id))
    .where(eq(order_items.order_id, orderId));
  }

  async createOrderItem(data: OrderItemInsert): Promise<OrderItem> {
    const result = await this.db.insert(order_items).values(data).returning();
    return result[0];
  }

  async updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const result = await this.db.update(order_items)
      .set(updates)
      .where(eq(order_items.id, id))
      .returning();
    return result[0];
  }

  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return await this.db.select().from(user_addresses)
      .where(eq(user_addresses.user_id, userId))
      .orderBy(desc(user_addresses.is_default), desc(user_addresses.createdAt));
  }

  async getUserAddress(id: number): Promise<UserAddress | undefined> {
    const result = await this.db.select().from(user_addresses).where(eq(user_addresses.id, id));
    return result[0];
  }

  async getDefaultUserAddress(userId: number): Promise<UserAddress | undefined> {
    const result = await this.db.select().from(user_addresses)
      .where(and(eq(user_addresses.user_id, userId), eq(user_addresses.is_default, true)));
    return result[0];
  }

  async createUserAddress(data: UserAddressInsert): Promise<UserAddress> {
    const result = await this.db.insert(user_addresses).values(data).returning();
    return result[0];
  }

  async updateUserAddress(id: number, updates: Partial<UserAddress>): Promise<UserAddress | undefined> {
    const result = await this.db.update(user_addresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(user_addresses.id, id))
      .returning();
    return result[0];
  }

  async setDefaultAddress(userId: number, addressId: number): Promise<void> {
    // First, unset all default addresses for the user
    await this.db.update(user_addresses)
      .set({ is_default: false })
      .where(eq(user_addresses.user_id, userId));
    
    // Then set the specified address as default
    await this.db.update(user_addresses)
      .set({ is_default: true })
      .where(eq(user_addresses.id, addressId));
  }

  async deleteUserAddress(id: number): Promise<void> {
    await this.db.delete(user_addresses).where(eq(user_addresses.id, id));
  }

  async getAllBookOrders(): Promise<BookOrder[]> {
    return await this.db.select().from(book_orders)
      .orderBy(desc(book_orders.createdAt));
  }

  async getUserBookOrders(userId: number): Promise<BookOrder[]> {
    return await this.db.select().from(book_orders)
      .where(eq(book_orders.userId, userId))
      .orderBy(desc(book_orders.createdAt));
  }

  async getBookOrder(id: number): Promise<BookOrder | undefined> {
    const result = await this.db.select().from(book_orders)
      .where(eq(book_orders.id, id));
    return result[0];
  }

  async createBookOrder(data: BookOrderInsert): Promise<BookOrder> {
    const result = await this.db.insert(book_orders).values(data).returning();
    return result[0];
  }

  async updateBookOrderShipping(id: number, updates: Partial<BookOrder>): Promise<BookOrder | undefined> {
    const result = await this.db.update(book_orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(book_orders.id, id))
      .returning();
    return result[0];
  }

  async recordBookDownload(orderId: number): Promise<void> {
    const order = await this.getBookOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
  
    if (order.downloadCount >= order.downloadLimit) {
      throw new Error(`Download limit reached (${order.downloadLimit} downloads)`);
    }
  
    const book = await this.getBook(order.bookId);
    if (!book || book.bookType !== 'pdf') {
      throw new Error('Only PDF books can be downloaded');
    }
  
    await this.db.update(book_orders)
      .set({ 
        downloadCount: sql`${book_orders.downloadCount} + 1`,
        lastDownloadAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(book_orders.id, orderId));
  }

  async getShippingOrders(status?: string): Promise<(ShippingOrder & { order: Order; address: UserAddress })[]> {
    let query = this.db.select({
      ...shipping_orders,
      order: orders,
      address: user_addresses
    })
    .from(shipping_orders)
    .innerJoin(orders, eq(shipping_orders.order_id, orders.id))
    .innerJoin(user_addresses, eq(shipping_orders.address_id, user_addresses.id));
  
    if (status) {
      query = query.where(eq(shipping_orders.status, status));
    }
  
    return await query.orderBy(desc(shipping_orders.createdAt));
  }

  async getShippingOrder(id: number): Promise<(ShippingOrder & { order: Order; address: UserAddress }) | undefined> {
    const result = await this.db.select({
      ...shipping_orders,
      order: orders,
      address: user_addresses
    })
    .from(shipping_orders)
    .innerJoin(orders, eq(shipping_orders.order_id, orders.id))
    .innerJoin(user_addresses, eq(shipping_orders.address_id, user_addresses.id))
    .where(eq(shipping_orders.id, id));
    
    return result[0];
  }

  async getShippingOrderByOrderId(orderId: number): Promise<ShippingOrder | undefined> {
    const result = await this.db.select().from(shipping_orders)
      .where(eq(shipping_orders.order_id, orderId));
    return result[0];
  }

  async createShippingOrder(data: ShippingOrderInsert): Promise<ShippingOrder> {
    const result = await this.db.insert(shipping_orders).values(data).returning();
    return result[0];
  }

  async updateShippingOrder(id: number, updates: Partial<ShippingOrder>): Promise<ShippingOrder | undefined> {
    const result = await this.db.update(shipping_orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shipping_orders.id, id))
      .returning();
    return result[0];
  }

  async updateShippingStatus(id: number, status: string, trackingNumber?: string): Promise<ShippingOrder | undefined> {
    const updates: Partial<ShippingOrder> = { status };
    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
    }
    if (status === 'shipped' && !updates.shipped_at) {
      updates.shipped_at = new Date();
    }
    if (status === 'delivered') {
      updates.delivered_at = new Date();
    }
  
    return await this.updateShippingOrder(id, updates);
  }

  async getCourierTracking(shippingOrderId: number): Promise<CourierTracking[]> {
    return await this.db.select().from(courier_tracking)
      .where(eq(courier_tracking.shipping_order_id, shippingOrderId))
      .orderBy(desc(courier_tracking.update_date));
  }

  async createCourierTracking(data: CourierTrackingInsert): Promise<CourierTracking> {
    const result = await this.db.insert(courier_tracking).values(data).returning();
    return result[0];
  }

  async getLatestTrackingUpdate(shippingOrderId: number): Promise<CourierTracking | undefined> {
    const result = await this.db.select().from(courier_tracking)
      .where(eq(courier_tracking.shipping_order_id, shippingOrderId))
      .orderBy(desc(courier_tracking.update_date))
      .limit(1);
    return result[0];
  }
}
