import { eq, and, asc, desc, sql, gte, lte, lt, inArray, or, isNull, isNotNull, ilike } from "drizzle-orm";
import { db } from "../db";
import { 
  filterTeachers, 
  filterActiveTeachers, 
  filterStudents, 
  calculateAttendanceRate,
  calculateTeacherRating,
  calculatePercentage,
  calculateGrowthRate,
  roundCurrency,
  safeNumber
} from '../business-logic-utils';
import { 
  users, userProfiles, userSessions, rolePermissions, courses, enrollments,
  sessions, messages, homework, payments, notifications, otpCodes,
  achievements, userAchievements, userStats, dailyGoals, adminSettings,
  walletTransactions, coursePayments, aiTrainingData, aiKnowledgeBase,
  skillAssessments, learningActivities, progressSnapshots, leads,
  communicationLogs, mentorAssignments, mentoringSessions, sessionPackages,
  callernPackages, studentCallernPackages, teacherCallernAvailability, teacherCallernAuthorization,
  callernCallHistory, callernSyllabusTopics, studentCallernProgress, rooms,
  callernRoadmaps, callernRoadmapSteps, studentRoadmapProgress, courseRoadmapProgress,
  callernPresence, callernSpeechSegments, callernScoresStudent, callernScoresTeacher, callernScoringEvents,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type UserSession, type InsertUserSession, type RolePermission, type InsertRolePermission,
  type OtpCode, type InsertOtpCode,
  type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type Session, type InsertSession, type Message, type InsertMessage,
  type Homework, type InsertHomework, type Payment, type InsertPayment,
  type Notification, type InsertNotification,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats, type DailyGoal, type InsertDailyGoal,
  type AdminSettings, type InsertAdminSettings, type WalletTransaction, type InsertWalletTransaction,
  type CoursePayment, type InsertCoursePayment, type AiTrainingData, type InsertAiTrainingData,
  type AiKnowledgeBase, type InsertAiKnowledgeBase, type SkillAssessment, type InsertSkillAssessment,
  type LearningActivity, type InsertLearningActivity, type ProgressSnapshot, type InsertProgressSnapshot,
  type Lead, type InsertLead,
  type CommunicationLog, type InsertCommunicationLog, type MentorAssignment, type InsertMentorAssignment,
  type MentoringSession, type InsertMentoringSession,
  type CallernPackage, type InsertCallernPackage, type StudentCallernPackage, type InsertStudentCallernPackage,
  type TeacherCallernAvailability, type InsertTeacherCallernAvailability, 
  type TeacherCallernAuthorization, type InsertTeacherCallernAuthorization,
  type CallernCallHistory, type InsertCallernCallHistory,
  type CallernSyllabusTopics, type InsertCallernSyllabusTopics, type StudentCallernProgress, type InsertStudentCallernProgress,
  type CallernPresence, type InsertCallernPresence, type CallernSpeechSegment, type InsertCallernSpeechSegment,
  type CallernScoresStudent, type InsertCallernScoresStudent, type CallernScoresTeacher, type InsertCallernScoresTeacher,
  type CallernScoringEvent, type InsertCallernScoringEvent,
  type CourseRoadmapProgress, type InsertCourseRoadmapProgress,
  type Room, type InsertRoom,
  // Testing subsystem types
  tests, testQuestions, testAttempts, testAnswers,
  type Test, type InsertTest, type TestQuestion, type InsertTestQuestion,
  type TestAttempt, type InsertTestAttempt, type TestAnswer, type InsertTestAnswer,
  // Gamification types
  games, gameLevels, userGameProgress, gameSessions, gameLeaderboards,
  gameQuestions, gameAnswerLogs, gameAccessRules, studentGameAssignments, courseGames,
  type Game, type InsertGame, type GameLevel, type InsertGameLevel,
  type UserGameProgress, type InsertUserGameProgress, type GameSession, type InsertGameSession,
  type GameLeaderboard, type InsertGameLeaderboard,
  type GameQuestion, type InsertGameQuestion, type GameAnswerLog, type InsertGameAnswerLog,
  // Video learning types
  videoLessons, videoProgress, videoNotes, videoBookmarks,
  type VideoLesson, type InsertVideoLesson, type VideoProgress, type InsertVideoProgress,
  type VideoNote, type InsertVideoNote, type VideoBookmark, type InsertVideoBookmark,
  // LMS types
  forumCategories, forumThreads, forumPosts, gradebookEntries, contentLibrary,
  type ForumCategory, type InsertForumCategory, type ForumThread, type InsertForumThread,
  type ForumPost, type InsertForumPost, type GradebookEntry, type InsertGradebookEntry,
  type ContentLibraryItem, type InsertContentLibraryItem,
  // AI tracking types
  aiProgressTracking, aiActivitySessions, aiVocabularyTracking, aiGrammarTracking, aiPronunciationAnalysis,
  type AiProgressTracking, type InsertAiProgressTracking, type AiActivitySession, type InsertAiActivitySession,
  type AiVocabularyTracking, type InsertAiVocabularyTracking, type AiGrammarTracking, type InsertAiGrammarTracking,
  type AiPronunciationAnalysis, type InsertAiPronunciationAnalysis,
  // Quality Assurance types
  liveClassSessions, teacherRetentionData, studentQuestionnaires, supervisionObservations, scheduledObservations,
  type LiveClassSession, type InsertLiveClassSession, type TeacherRetentionData, type InsertTeacherRetentionData,
  // Chat and AI study partner types  
  chatConversations, chatMessages, aiStudyPartners,
  type ChatConversation, type InsertChatConversation, type ChatMessage, type InsertChatMessage,
  type AiStudyPartner, type InsertAiStudyPartner,
  type StudentQuestionnaire, type InsertStudentQuestionnaire,
  type SupervisionObservation, type InsertSupervisionObservation, type ScheduledObservation, type InsertScheduledObservation,
  // Communication system types
  supportTickets, supportTicketMessages, pushNotifications, notificationDeliveryLogs,
  type SupportTicket, type InsertSupportTicket, type SupportTicketMessage, type InsertSupportTicketMessage,
  type PushNotification, type InsertPushNotification, type NotificationDeliveryLog, type InsertNotificationDeliveryLog,
  // Teacher availability
  teacherAvailability, teacherAvailabilityPeriods,
  attendanceRecords, teacherAssignments, teacherEvaluations, classObservations,
  type TeacherAvailability, type InsertTeacherAvailability,
  type TeacherAvailabilityPeriod, type InsertTeacherAvailabilityPeriod,
  // Teacher observation responses
  teacherObservationResponses,
  type TeacherObservationResponse, type InsertTeacherObservationResponse,
  // Classes and Holidays tables
  classes, holidays, classEnrollments,
  type Class, type InsertClass,
  type ClassEnrollment, type InsertClassEnrollment,
  type Holiday, type InsertHoliday,
  // Phase 1: Critical system tables
  auditLogs, emailLogs, studentReports, paymentTransactions,
  type AuditLog, type InsertAuditLog,
  type EmailLog, type InsertEmailLog,
  type StudentReport, type InsertStudentReport,
  type PaymentTransaction, type InsertPaymentTransaction,
  // Phase 2: Organizational & Student Management tables
  institutes, departments, customRoles, parentGuardians, studentNotes,
  levelAssessmentQuestions, levelAssessmentResults,
  type Institute, type InsertInstitute,
  type Department, type InsertDepartment,
  type CustomRole, type InsertCustomRole,
  type ParentGuardian, type InsertParentGuardian,
  type StudentNote, type InsertStudentNote,
  type LevelAssessmentQuestion, type InsertLevelAssessmentQuestion,
  type LevelAssessmentResult, type InsertLevelAssessmentResult,
  // Exam roadmap tables and types
  roadmapConfigs, roadmapPlans, roadmapSessions,
  // Placement test tables and types
  placementTests, placementQuestions, placementTestSessions, placementTestQuestions, placementTestResponses, placementResults,
  type PlacementTest, type InsertPlacementTest,
  type PlacementQuestion, type InsertPlacementQuestion,
  type PlacementTestSession, type InsertPlacementTestSession,
  type PlacementTestQuestion, type InsertPlacementTestQuestion,
  type PlacementTestResponse, type InsertPlacementTestResponse,
  type PlacementResult, type InsertPlacementResult,
  // Book e-commerce tables and types
  book_categories, books, book_assets, dictionary_lookups, carts, cart_items,
  orders, order_items, user_addresses, shipping_orders, courier_tracking,
  type BookCategory, type BookCategoryInsert, type Book, type BookInsert,
  type BookAsset, type BookAssetInsert, type DictionaryLookup, type DictionaryLookupInsert,
  type Cart, type CartInsert, type CartItem, type CartItemInsert,
  type Order, type OrderInsert, type OrderItem, type OrderItemInsert,
  type UserAddress, type UserAddressInsert, type ShippingOrder, type ShippingOrderInsert,
  type CourierTracking, type CourierTrackingInsert,
  // Front desk tables and types
  frontDeskOperations, phoneCallLogs, frontDeskTasks,
  type FrontDeskOperation, type InsertFrontDeskOperation,
  type PhoneCallLog, type InsertPhoneCallLog, type FrontDeskTask, type InsertFrontDeskTask,
  // 3D Lesson types
  threeDVideoLessons, threeDLessonContent, threeDLessonProgress,
  type ThreeDVideoLesson, type ThreeDVideoLessonInsert, type ThreeDLessonContent, type ThreeDLessonContentInsert,
  type ThreeDLessonProgress, type ThreeDLessonProgressInsert,
  // Web scraping tables and types
  scrapeJobs, competitorPrices, scrapedLeads, marketTrends,
  type ScrapeJob, type InsertScrapeJob, type CompetitorPrice, type InsertCompetitorPrice,
  type ScrapedLead, type InsertScrapedLead, type MarketTrend, type InsertMarketTrend,
  // Form management tables and types
  formDefinitions, formSubmissions,
  type FormDefinition, type InsertFormDefinition, type FormSubmission, type InsertFormSubmission,
  // CMS tables and types
  cmsPages, cmsPageSections, cmsBlogCategories, cmsBlogTags, cmsBlogPosts,
  cmsBlogPostTags, cmsBlogComments, cmsVideos, cmsMediaAssets, cmsPageAnalytics,
  customFonts, curriculumCategories, guestLeads, teacherReviews, instituteEvents, classes,
  type CmsPage, type InsertCmsPage,
  type CmsPageSection, type InsertCmsPageSection,
  type CmsBlogCategory, type InsertCmsBlogCategory,
  type CmsBlogTag, type InsertCmsBlogTag,
  type CmsBlogPost, type InsertCmsBlogPost,
  type CmsBlogPostTag, type InsertCmsBlogPostTag,
  type CmsBlogComment, type InsertCmsBlogComment,
  type CmsVideo, type InsertCmsVideo,
  type CmsMediaAsset, type InsertCmsMediaAsset,
  type CmsPageAnalytics, type InsertCmsPageAnalytics,
  type CustomFont, type InsertCustomFont,
  type CurriculumCategory, type InsertCurriculumCategory,
  type GuestLead, type InsertGuestLead
} from "@shared/schema";

// Placement test tables imported from main schema above
import { IStorage } from "../storage";


export class UserDbStorage {

  private db = db;
  
  // Initialize database storage - required by health monitoring service
  async initialize(): Promise<void> {
    // Database connection is already established through db property
    // This method exists to satisfy the IStorage interface contract
    return Promise.resolve();
  }

  // Ping database to check connection health
  async ping(): Promise<void> {
    try {
      await this.db.execute(sql`SELECT 1`);
    } catch (error) {
      console.error('❌ Database ping failed:', error);
      throw new Error('Database connection unhealthy');
    }
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Alias for getUser to maintain compatibility
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const results = await db.select().from(users).orderBy(users.createdAt);
    console.log("[DatabaseStorage.getAllUsers] Returned", results.length, "users");
    if (results.length > 0) {
      console.log("[DatabaseStorage.getAllUsers] User IDs:", results.map(u => u.id));
    }
    return results;
  }

  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Generate a unique student ID
  async generateStudentId(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Get count of students created today for sequential numbering
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const studentsToday = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.role, 'Student'),
        sql`${users.createdAt} >= ${startOfDay}`,
        sql`${users.createdAt} < ${endOfDay}`
      ));
    
    const sequenceNumber = (studentsToday[0]?.count || 0) + 1;
    const studentId = `STU${year}${month}${String(sequenceNumber).padStart(3, '0')}`;
    
    return studentId;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPreferences(id: number, preferences: any): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ preferences })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // User profiles
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    // Filter out undefined values and invalid fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => value !== undefined && key !== 'id' && key !== 'userId')
    );
    
    if (Object.keys(cleanUpdates).length === 0) {
      // No valid updates, return existing profile
      return this.getUserProfile(userId);
    }
    
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Authentication sessions
  async getUserSession(token: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, token));
    return session;
  }

  async getUserSessionByRefreshToken(refreshToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.refreshToken, refreshToken));
    return session;
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async invalidateAllUserSessions(userId: number): Promise<void> {
    await db
      .delete(userSessions)
      .where(eq(userSessions.userId, userId));
  }

  async updateUserSessionActivity(sessionId: number): Promise<void> {
    await db
      .update(userSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  }

  async updateUserSessionTokens(sessionId: number, accessToken: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await db
      .update(userSessions)
      .set({ 
        sessionToken: accessToken, 
        refreshToken: refreshToken,
        expiresAt: expiresAt
      })
      .where(eq(userSessions.id, sessionId));
  }

  async invalidateUserSession(token: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.token, token));
  }

  // Role permissions - FIXED: Now properly validates both resource AND action
  async checkUserPermission(role: string, resource: string, action: string): Promise<boolean> {
    const [permission] = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));
    
    if (!permission) return false;
    
    // First check if role has access to the resource (subsystem level)
    const hasResourceAccess = permission.subsystemPermissions?.includes(resource);
    if (!hasResourceAccess) return false;
    
    // Then check action-level permissions if they exist
    if (permission.actionPermissions && typeof permission.actionPermissions === 'object') {
      const resourceActions = permission.actionPermissions[resource];
      if (Array.isArray(resourceActions)) {
        // If action-level permissions are defined, check them
        return resourceActions.includes(action);
      }
    }
    
    // Fallback: If no action-level permissions defined, allow basic CRUD for backward compatibility
    // But Admin role gets all actions, others get limited actions
    if (role === 'Admin') {
      return true; // Admin has all actions
    }
    
    // For non-admin roles, only allow read actions by default for security
    return action === 'read' || action === 'list' || action === 'view';
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const [newPermission] = await db.insert(rolePermissions).values(permission).returning();
    return newPermission;
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.createdAt);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.createdAt);
  }

  async getAllClasses(): Promise<any[]> {
    return await db.select().from(classes).orderBy(classes.createdAt);
  }

  async getCoursesByDeliveryMode(mode: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.deliveryMode, mode));
  }

  async getUserCourses(userId: number): Promise<(Course & { progress: number; instructorName?: string; instructorPhoto?: string })[]> {
    try {
      // First check if the user has any enrollments to avoid complex join failures
      const userEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.userId, userId));

      if (userEnrollments.length === 0) {
        return [];
      }

      // Get courses with instructor information via join
      const courseIds = userEnrollments.map(enrollment => enrollment.courseId);
      const userCoursesWithInstructor = await db
        .select({
          // Course fields
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
          // Instructor fields
          instructorName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          instructorPhoto: users.profileImage
        })
        .from(courses)
        .leftJoin(users, eq(courses.instructorId, users.id))
        .where(sql`${courses.id} IN (${sql.join(courseIds, sql`, `)})`);

      // Map courses with progress from enrollments and instructor info
      return userCoursesWithInstructor.map(course => {
        const enrollment = userEnrollments.find(e => e.courseId === course.id);
        return {
          ...course,
          progress: enrollment?.progress || 0
        };
      }) as (Course & { progress: number; instructorName?: string; instructorPhoto?: string })[];
    } catch (error) {
      console.error('Error fetching user courses:', error);
      return [];
    }
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    try {
      const [updatedCourse] = await db
        .update(courses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(courses.id, id))
        .returning();
      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      return undefined;
    }
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getCourseEnrollments(courseId: number): Promise<any[]> {
    try {
      const courseEnrollments = await db
        .select({
          id: enrollments.id,
          userId: enrollments.userId,
          courseId: enrollments.courseId,
          progress: enrollments.progress,
          enrolledAt: enrollments.enrolledAt,
          completedAt: enrollments.completedAt,
          studentName: users.firstName,
          studentLastName: users.lastName,
          studentEmail: users.email
        })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.userId, users.id))
        .where(eq(enrollments.courseId, courseId));
      
      return courseEnrollments;
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      return [];
    }
  }

  async enrollInCourse(enrollment: InsertEnrollment): Promise<Enrollment> {
    try {
      // Pull UTM attribution from the enrolling user's account for propagation
      let userUtm: { utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null } = {};
      try {
        const [userRecord] = await db
          .select({ utmSource: users.utmSource, utmMedium: users.utmMedium, utmCampaign: users.utmCampaign })
          .from(users)
          .where(eq(users.id, enrollment.userId))
          .limit(1);
        if (userRecord) userUtm = userRecord;
      } catch (_) {}

      const [newEnrollment] = await db.insert(enrollments).values({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress: enrollment.progress || 0,
        utmSource: userUtm.utmSource ?? null,
        utmMedium: userUtm.utmMedium ?? null,
        utmCampaign: userUtm.utmCampaign ?? null
      }).returning();
      
      // Automatically create or join group chat for the course
      await this.ensureCourseGroupChat(enrollment.courseId, enrollment.userId);
      
      return newEnrollment;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }
  
  // Helper method to ensure a group chat exists for a course and add student to it
  private async ensureCourseGroupChat(courseId: number, studentId: number): Promise<void> {
    try {
      // Get course details
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      if (!course) return;
      
      // Check if group chat already exists for this course
      const existingChats = await db.select().from(chatConversations)
        .where(and(
          eq(chatConversations.type, 'group'),
          sql`${chatConversations.metadata}->>'courseId' = ${courseId.toString()}`
        ));
      
      let chatId: number;
      
      if (existingChats.length === 0) {
        // Create new group chat for the course
        const [newChat] = await db.insert(chatConversations).values({
          title: `${course.title} - Class Group`,
          type: 'group',
          participants: [studentId.toString()],
          metadata: { courseId: courseId },
          isActive: true
        }).returning();
        chatId = newChat.id;
        
        // Add welcome message
        await db.insert(chatMessages).values({
          conversationId: chatId,
          senderId: 1, // System message from admin
          senderName: 'System',
          message: `Welcome to the ${course.title} class group! Feel free to ask questions and interact with your classmates.`,
          messageType: 'system'
        });
      } else {
        // Add student to existing group chat
        chatId = existingChats[0].id;
        const currentParticipants = existingChats[0].participants || [];
        
        // Only add if not already a participant
        if (!currentParticipants.includes(studentId.toString())) {
          await db.update(chatConversations)
            .set({
              participants: [...currentParticipants, studentId.toString()]
            })
            .where(eq(chatConversations.id, chatId));
          
          // Add system message about new student joining
          const [student] = await db.select().from(users).where(eq(users.id, studentId));
          if (student) {
            await db.insert(chatMessages).values({
              conversationId: chatId,
              senderId: 1,
              senderName: 'System',
              message: `${student.firstName} ${student.lastName} has joined the class`,
              messageType: 'system',
              sentAt: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring course group chat:', error);
      // Don't throw - enrollment should succeed even if chat creation fails
    }
  }

  async unenrollFromCourse(userId: number, courseId: number): Promise<void> {
    await db
      .delete(enrollments)
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ));
  }

  // Callern Management
  async createCallernPackage(packageData: any): Promise<CallernPackage> {
    const [newPackage] = await db.insert(callernPackages).values({
      packageName: packageData.packageName,
      totalHours: packageData.totalHours,
      price: packageData.price,
      description: packageData.description,
      packageType: packageData.packageType,
      targetLevel: packageData.targetLevel,
      isActive: packageData.isActive || true
    }).returning();
    return newPackage;
  }

  async getCallernPackages(): Promise<CallernPackage[]> {
    return await db.select().from(callernPackages).where(eq(callernPackages.isActive, true));
  }

  async getCallernPackage(id: number): Promise<CallernPackage | undefined> {
    const [callernPackage] = await db.select().from(callernPackages).where(eq(callernPackages.id, id));
    return callernPackage;
  }

  async updateCallernPackage(id: number, updates: any): Promise<CallernPackage | undefined> {
    const [updated] = await db
      .update(callernPackages)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(callernPackages.id, id))
      .returning();
    return updated;
  }

  async deleteCallernPackage(id: number): Promise<void> {
    await db.delete(callernPackages).where(eq(callernPackages.id, id));
  }

  async setTeacherCallernAvailability(availabilityData: any): Promise<TeacherCallernAvailability> {
    const [availability] = await db.insert(teacherCallernAvailability).values({
      teacherId: availabilityData.teacherId,
      isOnline: availabilityData.isOnline || false,
      morningSlot: availabilityData.morningSlot || false,
      afternoonSlot: availabilityData.afternoonSlot || false,
      eveningSlot: availabilityData.eveningSlot || false,
      nightSlot: availabilityData.nightSlot || false,
      hourlyRate: availabilityData.hourlyRate
    }).returning();
    return availability;
  }

  async getTeacherCallernAvailability(): Promise<any[]> {
    const availability = await db
      .select({
        id: teacherCallernAvailability.id,
        teacherId: teacherCallernAvailability.teacherId,
        isOnline: teacherCallernAvailability.isOnline,
        lastActiveAt: teacherCallernAvailability.lastActiveAt,
        hourlyRate: teacherCallernAvailability.hourlyRate,
        morningSlot: teacherCallernAvailability.morningSlot,
        afternoonSlot: teacherCallernAvailability.afternoonSlot,
        eveningSlot: teacherCallernAvailability.eveningSlot,
        nightSlot: teacherCallernAvailability.nightSlot,
        teacherName: users.firstName,
        teacherLastName: users.lastName,
        teacherEmail: users.email
      })
      .from(teacherCallernAvailability)
      .innerJoin(users, eq(teacherCallernAvailability.teacherId, users.id));
    
    return availability;
  }

  async updateTeacherCallernAvailability(teacherId: number, updates: any): Promise<TeacherCallernAvailability | undefined> {
    const [updated] = await db
      .update(teacherCallernAvailability)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(teacherCallernAvailability.teacherId, teacherId))
      .returning();
    return updated;
  }

  // Teacher CallerN Authorization Methods
  async getAuthorizedCallernTeachers(): Promise<any[]> {
    try {
      const authorizations = await db
        .select({
          teacher: users,
          authorization: teacherCallernAuthorization,
          availability: teacherCallernAvailability
        })
        .from(teacherCallernAuthorization)
        .innerJoin(users, eq(teacherCallernAuthorization.teacherId, users.id))
        .leftJoin(teacherCallernAvailability, eq(teacherCallernAuthorization.teacherId, teacherCallernAvailability.teacherId))
        .where(and(
          eq(teacherCallernAuthorization.isAuthorized, true),
          eq(teacherCallernAuthorization.isActive, true),
          eq(users.isActive, true)
        ));

      return authorizations.map(auth => ({
        ...auth.teacher,
        teacherId: auth.teacher.id, // Explicit teacherId for clarity
        isOnline: auth.availability?.isOnline || false,
        hourlyRate: auth.availability?.hourlyRate || null,
        availableHours: auth.availability?.availableHours || [],
        isCallernAuthorized: true,
        authorizationLevel: auth.authorization.authorizationLevel,
        specializations: auth.authorization.specializations,
        maxSimultaneousCalls: auth.authorization.maxSimultaneousCalls
      }));
    } catch (error) {
      console.error('Error getting authorized Callern teachers:', error);
      return [];
    }
  }

  async getTeacherCallernAuthorization(teacherId: number): Promise<TeacherCallernAuthorization | undefined> {
    try {
      const [result] = await db
        .select()
        .from(teacherCallernAuthorization)
        .where(eq(teacherCallernAuthorization.teacherId, teacherId))
        .limit(1);
      return result;
    } catch (error) {
      console.error('Error getting teacher Callern authorization:', error);
      return undefined;
    }
  }

  async createTeacherCallernAuthorization(data: InsertTeacherCallernAuthorization): Promise<TeacherCallernAuthorization> {
    try {
      const [result] = await db
        .insert(teacherCallernAuthorization)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating teacher Callern authorization:', error);
      throw error;
    }
  }

  async updateTeacherCallernAuthorization(
    teacherId: number, 
    updates: Partial<TeacherCallernAuthorization>
  ): Promise<TeacherCallernAuthorization | undefined> {
    try {
      const [result] = await db
        .update(teacherCallernAuthorization)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(teacherCallernAuthorization.teacherId, teacherId))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating teacher Callern authorization:', error);
      return undefined;
    }
  }

  async deleteTeacherCallernAuthorization(teacherId: number): Promise<boolean> {
    try {
      await db
        .delete(teacherCallernAuthorization)
        .where(eq(teacherCallernAuthorization.teacherId, teacherId));
      return true;
    } catch (error) {
      console.error('Error deleting teacher Callern authorization:', error);
      return false;
    }
  }
}
