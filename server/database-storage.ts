import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  users, userProfiles, userSessions, rolePermissions, courses, enrollments,
  sessions, messages, homework, payments, notifications, instituteBranding,
  achievements, userAchievements, userStats, dailyGoals, adminSettings,
  walletTransactions, coursePayments, aiTrainingData, aiKnowledgeBase,
  skillAssessments, learningActivities, progressSnapshots, leads,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type UserSession, type InsertUserSession, type RolePermission, type InsertRolePermission,
  type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type Session, type InsertSession, type Message, type InsertMessage,
  type Homework, type InsertHomework, type Payment, type InsertPayment,
  type Notification, type InsertNotification, type InstituteBranding, type InsertBranding,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats, type DailyGoal, type InsertDailyGoal,
  type AdminSettings, type InsertAdminSettings, type WalletTransaction, type InsertWalletTransaction,
  type CoursePayment, type InsertCoursePayment, type AiTrainingData, type InsertAiTrainingData,
  type AiKnowledgeBase, type InsertAiKnowledgeBase, type SkillAssessment, type InsertSkillAssessment,
  type LearningActivity, type InsertLearningActivity, type ProgressSnapshot, type InsertProgressSnapshot,
  type Lead, type InsertLead
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
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
      .where(eq(userSessions.token, token));
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
        token: accessToken, 
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

  // Role permissions
  async checkUserPermission(role: string, resource: string, action: string): Promise<boolean> {
    const [permission] = await db
      .select()
      .from(rolePermissions)
      .where(and(
        eq(rolePermissions.role, role),
        eq(rolePermissions.resource, resource),
        eq(rolePermissions.action, action),
        eq(rolePermissions.allowed, true)
      ));
    return !!permission;
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

  async getUserCourses(userId: number): Promise<(Course & { progress: number })[]> {
    try {
      // First check if the user has any enrollments to avoid complex join failures
      const userEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.userId, userId));

      if (userEnrollments.length === 0) {
        return [];
      }

      // Get courses with fallback handling for missing columns
      const courseIds = userEnrollments.map(enrollment => enrollment.courseId);
      const userCourses = await db
        .select()
        .from(courses)
        .where(sql`${courses.id} IN (${sql.join(courseIds, sql`, `)})`);

      // Map courses with progress from enrollments
      return userCourses.map(course => {
        const enrollment = userEnrollments.find(e => e.courseId === course.id);
        return {
          ...course,
          progress: enrollment?.progress || 0
        };
      }) as (Course & { progress: number })[];
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
      const [newEnrollment] = await db.insert(enrollments).values({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress: enrollment.progress || 0
      }).returning();
      return newEnrollment;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
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

  // Sessions
  async getUserSessions(userId: number): Promise<(Session & { tutorName: string })[]> {
    const userSessions = await db
      .select({
        id: sessions.id,
        studentId: sessions.studentId,
        tutorId: sessions.tutorId,
        courseId: sessions.courseId,
        title: sessions.title,
        description: sessions.description,
        scheduledAt: sessions.scheduledAt,
        duration: sessions.duration,
        status: sessions.status,
        sessionUrl: sessions.sessionUrl,
        notes: sessions.notes,
        createdAt: sessions.createdAt,
        tutorName: users.firstName
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutorId, users.id))
      .where(eq(sessions.studentId, userId));
    
    return userSessions;
  }

  async getUpcomingSessions(userId: number): Promise<(Session & { tutorName: string, tutorAvatar: string })[]> {
    const upcomingSessions = await db
      .select({
        id: sessions.id,
        studentId: sessions.studentId,
        tutorId: sessions.tutorId,
        courseId: sessions.courseId,
        title: sessions.title,
        description: sessions.description,
        scheduledAt: sessions.scheduledAt,
        duration: sessions.duration,
        status: sessions.status,
        sessionUrl: sessions.sessionUrl,
        notes: sessions.notes,
        createdAt: sessions.createdAt,
        tutorName: users.firstName,
        tutorAvatar: users.avatar
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.tutorId, users.id))
      .where(and(
        eq(sessions.studentId, userId),
        eq(sessions.status, "scheduled")
      ));
    
    return upcomingSessions;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async updateSessionStatus(id: number, status: string): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set({ status })
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession;
  }

  // Messages
  async getUserMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]> {
    const userMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        sentAt: messages.sentAt,
        senderName: users.firstName,
        senderAvatar: users.avatar
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.receiverId, userId));
    
    return userMessages;
  }

  async getRecentMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]> {
    const recentMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        sentAt: messages.sentAt,
        senderName: users.firstName,
        senderAvatar: users.avatar
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.receiverId, userId))
      .limit(10);
    
    return recentMessages;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  // Homework
  async getUserHomework(userId: number): Promise<(Homework & { courseName: string, teacherName: string })[]> {
    const userHomework = await db
      .select({
        id: homework.id,
        studentId: homework.studentId,
        teacherId: homework.teacherId,
        courseId: homework.courseId,
        title: homework.title,
        description: homework.description,
        dueDate: homework.dueDate,
        status: homework.status,
        submission: homework.submission,
        grade: homework.grade,
        feedback: homework.feedback,
        assignedAt: homework.assignedAt,
        courseName: courses.title,
        teacherName: users.firstName
      })
      .from(homework)
      .leftJoin(courses, eq(homework.courseId, courses.id))
      .innerJoin(users, eq(homework.teacherId, users.id))
      .where(eq(homework.studentId, userId));
    
    return userHomework;
  }

  async getPendingHomework(userId: number): Promise<(Homework & { courseName: string })[]> {
    const pendingHomework = await db
      .select({
        id: homework.id,
        studentId: homework.studentId,
        teacherId: homework.teacherId,
        courseId: homework.courseId,
        title: homework.title,
        description: homework.description,
        dueDate: homework.dueDate,
        status: homework.status,
        submission: homework.submission,
        grade: homework.grade,
        feedback: homework.feedback,
        assignedAt: homework.assignedAt,
        courseName: courses.title
      })
      .from(homework)
      .leftJoin(courses, eq(homework.courseId, courses.id))
      .where(and(
        eq(homework.studentId, userId),
        eq(homework.status, "pending")
      ));
    
    return pendingHomework;
  }

  async createHomework(homeworkData: InsertHomework): Promise<Homework> {
    const [newHomework] = await db.insert(homework).values(homeworkData).returning();
    return newHomework;
  }

  async updateHomeworkStatus(id: number, status: string, submission?: string): Promise<Homework | undefined> {
    const updateData: any = { status };
    if (submission) updateData.submission = submission;
    
    const [updatedHomework] = await db
      .update(homework)
      .set(updateData)
      .where(eq(homework.id, id))
      .returning();
    return updatedHomework;
  }

  // Payments
  async getUserPayments(userId: number): Promise<Payment[]> {
    try {
      return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.warn('Missing payments column detected, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentByMerchantId(merchantTransactionId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.merchantTransactionId, merchantTransactionId));
    return payment;
  }

  async getPaymentById(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status,
        updatedAt: new Date(),
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async updatePaymentWithShetabData(id: number, data: Partial<{
    gatewayTransactionId: string;
    referenceNumber: string;
    cardNumber: string;
    status: string;
    failureReason: string;
    shetabResponse: any;
    completedAt: Date;
  }>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Notifications
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  // Branding
  async getBranding(): Promise<InstituteBranding | undefined> {
    const [branding] = await db.select().from(instituteBranding).limit(1);
    return branding;
  }

  async updateBranding(brandingData: InsertBranding): Promise<InstituteBranding> {
    // First try to update existing branding
    const [existing] = await db.select().from(instituteBranding).limit(1);
    
    if (existing) {
      const [updatedBranding] = await db
        .update(instituteBranding)
        .set({ ...brandingData, updatedAt: new Date() })
        .where(eq(instituteBranding.id, existing.id))
        .returning();
      return updatedBranding;
    } else {
      // Create new branding if none exists
      const [newBranding] = await db.insert(instituteBranding).values(brandingData).returning();
      return newBranding;
    }
  }

  // Tutors
  async getTutors(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "teacher"),
        eq(users.isActive, true)
      ));
  }

  async getFeaturedTutors(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "teacher"),
        eq(users.isActive, true)
      ))
      .limit(4);
  }

  // Gamification
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievementsData = await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        isNotified: userAchievements.isNotified,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    
    return userAchievementsData;
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newUserAchievement] = await db.insert(userAchievements).values(userAchievement).returning();
    return newUserAchievement;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats | undefined> {
    const [existingStats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    
    if (existingStats) {
      const [updatedStats] = await db
        .update(userStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(eq(userStats.userId, userId))
        .returning();
      return updatedStats;
    } else {
      const [newStats] = await db
        .insert(userStats)
        .values({ userId, ...stats } as InsertUserStats)
        .returning();
      return newStats;
    }
  }

  async getDailyGoals(userId: number, date?: string): Promise<DailyGoal[]> {
    let query = db.select().from(dailyGoals).where(eq(dailyGoals.userId, userId));
    
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      query = query.where(and(
        eq(dailyGoals.userId, userId),
        // Note: This is a simplified date comparison. In production, you might want more sophisticated date handling
      ));
    }
    
    return await query;
  }

  async createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal> {
    const [newGoal] = await db.insert(dailyGoals).values(goal).returning();
    return newGoal;
  }

  async updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<DailyGoal | undefined> {
    const [updatedGoal] = await db
      .update(dailyGoals)
      .set(updates)
      .where(eq(dailyGoals.id, id))
      .returning();
    return updatedGoal;
  }

  // Skill Assessment & Activity Tracking
  async getSkillAssessments(userId: number): Promise<SkillAssessment[]> {
    return await db
      .select()
      .from(skillAssessments)
      .where(eq(skillAssessments.userId, userId))
      .orderBy(desc(skillAssessments.assessedAt));
  }

  async getLatestSkillAssessment(userId: number, skillType: string): Promise<SkillAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(skillAssessments)
      .where(
        and(
          eq(skillAssessments.userId, userId),
          eq(skillAssessments.skillType, skillType)
        )
      )
      .orderBy(desc(skillAssessments.assessedAt))
      .limit(1);
    return assessment;
  }

  async createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment> {
    const [newAssessment] = await db.insert(skillAssessments).values(assessment).returning();
    return newAssessment;
  }

  async getLearningActivities(userId: number): Promise<LearningActivity[]> {
    return await db
      .select()
      .from(learningActivities)
      .where(eq(learningActivities.userId, userId))
      .orderBy(desc(learningActivities.createdAt));
  }

  async createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity> {
    const [newActivity] = await db.insert(learningActivities).values(activity).returning();
    return newActivity;
  }

  async getLatestProgressSnapshot(userId: number): Promise<ProgressSnapshot | undefined> {
    const [snapshot] = await db
      .select()
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .orderBy(desc(progressSnapshots.createdAt))
      .limit(1);
    return snapshot;
  }

  async createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot> {
    const [newSnapshot] = await db.insert(progressSnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  async getProgressSnapshots(userId: number, limit?: number): Promise<ProgressSnapshot[]> {
    let query = db
      .select()
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .orderBy(desc(progressSnapshots.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  // Leads Management - Local database operations for Iranian call center staff
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return result.rowCount > 0;
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.status, status)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByAssignee(assignee: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.assignedTo, assignee)).orderBy(desc(leads.createdAt));
  }

  // Wallet-based Payment System Methods
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings).limit(1);
    return settings;
  }

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    const existingSettings = await this.getAdminSettings();
    
    if (existingSettings) {
      const [updated] = await db
        .update(adminSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(adminSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(adminSettings)
        .values(settings as InsertAdminSettings)
        .returning();
      return created;
    }
  }

  async getUserWalletData(userId: number): Promise<{
    walletBalance: number;
    totalCredits: number;
    memberTier: string;
    discountPercentage: number;
  } | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;

    const settings = await this.getAdminSettings();
    if (!settings) return undefined;

    // Calculate member tier and discount based on total credits
    let memberTier = 'bronze';
    let discountPercentage = settings.bronzeDiscount;

    if (user.totalCredits >= settings.diamondTierThreshold) {
      memberTier = 'diamond';
      discountPercentage = settings.diamondDiscount;
    } else if (user.totalCredits >= settings.goldTierThreshold) {
      memberTier = 'gold';
      discountPercentage = settings.goldDiscount;
    } else if (user.totalCredits >= settings.silverTierThreshold) {
      memberTier = 'silver';
      discountPercentage = settings.silverDiscount;
    }

    // Update user's member tier if changed
    if (user.memberTier !== memberTier) {
      await this.updateUser(userId, { memberTier });
    }

    return {
      walletBalance: user.walletBalance || 0,
      totalCredits: user.totalCredits || 0,
      memberTier,
      discountPercentage
    };
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await db.insert(walletTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async updateWalletTransactionStatus(
    id: number, 
    status: string,
    gatewayData?: Partial<{
      shetabTransactionId: string;
      shetabReferenceNumber: string;
      cardNumber: string;
      gatewayResponse: any;
    }>
  ): Promise<WalletTransaction | undefined> {
    const updateData: any = { 
      status,
      ...(status === 'completed' ? { completedAt: new Date() } : {})
    };

    if (gatewayData) {
      Object.assign(updateData, gatewayData);
    }

    const [updated] = await db
      .update(walletTransactions)
      .set(updateData)
      .where(eq(walletTransactions.id, id))
      .returning();

    // If transaction completed and is a top-up, update user wallet balance
    if (updated && status === 'completed' && updated.type === 'topup') {
      await this.updateUserWalletBalance(updated.userId, updated.amount);
    }

    return updated;
  }

  async updateUserWalletBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const newBalance = (user.walletBalance || 0) + amount;
    return await this.updateUser(userId, { walletBalance: newBalance });
  }

  async createCoursePayment(payment: InsertCoursePayment): Promise<CoursePayment> {
    const [newPayment] = await db.insert(coursePayments).values(payment).returning();
    return newPayment;
  }

  async updateCoursePaymentStatus(
    id: number,
    status: string,
    gatewayData?: Partial<{
      shetabTransactionId: string;
      shetabReferenceNumber: string;
      cardNumber: string;
      gatewayResponse: any;
    }>
  ): Promise<CoursePayment | undefined> {
    const updateData: any = { 
      status,
      ...(status === 'completed' ? { completedAt: new Date() } : {})
    };

    if (gatewayData) {
      Object.assign(updateData, gatewayData);
    }

    const [updated] = await db
      .update(coursePayments)
      .set(updateData)
      .where(eq(coursePayments.id, id))
      .returning();

    // If payment completed, handle post-payment actions
    if (updated && status === 'completed') {
      await this.handleCompletedCoursePayment(updated);
    }

    return updated;
  }

  private async handleCompletedCoursePayment(payment: CoursePayment): Promise<void> {
    // Enroll user in course
    await this.enrollInCourse({
      userId: payment.userId,
      courseId: payment.courseId,
      progress: 0
    });

    // Award credits based on payment amount and admin settings
    if (payment.creditsAwarded > 0) {
      const user = await this.getUser(payment.userId);
      if (user) {
        const newTotalCredits = (user.totalCredits || 0) + payment.creditsAwarded;
        await this.updateUser(payment.userId, { totalCredits: newTotalCredits });
      }
    }

    // If paid from wallet, deduct from balance
    if (payment.paymentMethod === 'wallet') {
      await this.updateUserWalletBalance(payment.userId, -payment.finalPrice);
    }

    // Create notification
    await this.createNotification({
      userId: payment.userId,
      title: 'ثبت نام موفق',
      message: 'شما با موفقیت در دوره ثبت نام شدید',
      type: 'success'
    });
  }

  async getAvailableCoursesForUser(userId: number): Promise<Course[]> {
    // Get all active courses
    const allCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true));

    // Get user's enrolled courses
    const userEnrollments = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.userId, userId));

    const enrolledCourseIds = userEnrollments.map(e => e.courseId);

    // Filter out enrolled courses
    return allCourses.filter(course => !enrolledCourseIds.includes(course.id));
  }

  async calculateCoursePrice(courseId: number, userId: number): Promise<{
    originalPrice: number;
    discountPercentage: number;
    finalPrice: number;
    creditsAwarded: number;
  } | undefined> {
    const course = await this.getCourse(courseId);
    const walletData = await this.getUserWalletData(userId);
    const settings = await this.getAdminSettings();

    if (!course || !walletData || !settings) return undefined;

    const originalPrice = course.price;
    const discountPercentage = walletData.discountPercentage;
    const finalPrice = originalPrice - (originalPrice * discountPercentage / 100);
    const creditsAwarded = Math.floor(finalPrice / settings.creditValueInRials);

    return {
      originalPrice,
      discountPercentage,
      finalPrice,
      creditsAwarded
    };
  }

  // Referral System Methods
  async getUserReferralLinks(userId: number): Promise<ReferralLink[]> {
    return await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, userId))
      .orderBy(desc(referralLinks.createdAt));
  }

  async createReferralLink(linkData: InsertReferralLink): Promise<ReferralLink> {
    // Generate unique referral code
    const referralCode = this.generateReferralCode();
    
    const [link] = await db
      .insert(referralLinks)
      .values({
        ...linkData,
        referralCode
      })
      .returning();
    
    return link;
  }

  async getReferralLinkByCode(code: string): Promise<ReferralLink | undefined> {
    const [link] = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.referralCode, code));
    
    return link;
  }

  async trackReferralActivity(activityData: InsertReferralActivity): Promise<ReferralActivity> {
    const [activity] = await db
      .insert(referralActivities)
      .values(activityData)
      .returning();

    // Update referral link statistics
    if (activityData.activityType === 'click') {
      await db
        .update(referralLinks)
        .set({
          totalClicks: sql`${referralLinks.totalClicks} + 1`,
          updatedAt: new Date()
        })
        .where(eq(referralLinks.id, activityData.referralLinkId));
    } else if (activityData.activityType === 'signup') {
      await db
        .update(referralLinks)
        .set({
          totalSignups: sql`${referralLinks.totalSignups} + 1`,
          updatedAt: new Date()
        })
        .where(eq(referralLinks.id, activityData.referralLinkId));
    }

    return activity;
  }

  async createReferralCommission(commissionData: InsertReferralCommission): Promise<ReferralCommission> {
    const [commission] = await db
      .insert(referralCommissions)
      .values(commissionData)
      .returning();

    // Update referral link total earnings
    await db
      .update(referralLinks)
      .set({
        totalEarnings: sql`${referralLinks.totalEarnings} + ${commissionData.commissionAmount}`,
        updatedAt: new Date()
      })
      .where(eq(referralLinks.id, commissionData.referralLinkId));

    return commission;
  }

  async getUserReferralCommissions(userId: number): Promise<ReferralCommission[]> {
    return await db
      .select()
      .from(referralCommissions)
      .where(eq(referralCommissions.referrerUserId, userId))
      .orderBy(desc(referralCommissions.createdAt));
  }

  async processReferralPayment(
    referralLinkId: number,
    paymentId: number,
    baseAmount: number
  ): Promise<ReferralCommission | null> {
    // Get referral link details
    const [link] = await db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.id, referralLinkId));

    if (!link || !link.isActive) {
      return null;
    }

    // Calculate commission amounts
    const commissionAmount = Math.floor((baseAmount * link.selfCommissionRate) / 100);
    const referredAmount = Math.floor((baseAmount * link.referredCommissionRate) / 100);
    const referrerAmount = commissionAmount - referredAmount;

    // Create commission record
    const commissionData: InsertReferralCommission = {
      referralLinkId: link.id,
      referrerUserId: link.userId,
      commissionType: 'payment',
      baseAmount,
      commissionRate: link.selfCommissionRate,
      commissionAmount,
      referrerAmount,
      referredAmount,
      relatedPaymentId: paymentId,
      status: 'pending'
    };

    const commission = await this.createReferralCommission(commissionData);

    // Add commission to referrer's wallet
    if (referrerAmount > 0) {
      await this.updateUserWalletBalance(link.userId, referrerAmount);
      
      // Create wallet transaction record
      await this.createWalletTransaction({
        userId: link.userId,
        type: 'credit',
        amount: referrerAmount,
        description: `Referral commission from payment #${paymentId}`,
        status: 'completed'
      });
    }

    return commission;
  }

  async getReferralStats(userId: number): Promise<{
    totalLinks: number;
    totalClicks: number;
    totalSignups: number;
    totalEarnings: number;
    pendingCommissions: number;
    conversionRate: number;
  }> {
    const links = await this.getUserReferralLinks(userId);
    
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.totalClicks, 0);
    const totalSignups = links.reduce((sum, link) => sum + link.totalSignups, 0);
    const totalEarnings = links.reduce((sum, link) => sum + link.totalEarnings, 0);

    const pendingCommissions = await db
      .select({ total: sql<number>`SUM(${referralCommissions.commissionAmount})` })
      .from(referralCommissions)
      .where(
        and(
          eq(referralCommissions.referrerUserId, userId),
          eq(referralCommissions.status, 'pending')
        )
      );

    const conversionRate = totalClicks > 0 ? (totalSignups / totalClicks) * 100 : 0;

    return {
      totalLinks,
      totalClicks,
      totalSignups,
      totalEarnings,
      pendingCommissions: pendingCommissions[0]?.total || 0,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  async updateReferralLink(
    linkId: number,
    userId: number,
    updates: Partial<ReferralLink>
  ): Promise<ReferralLink | undefined> {
    const [updated] = await db
      .update(referralLinks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(referralLinks.id, linkId),
          eq(referralLinks.userId, userId)
        )
      )
      .returning();

    return updated;
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // AI Training Data Methods
  async saveTrainingData(trainingData: InsertAiTrainingData): Promise<AiTrainingData> {
    const [saved] = await db.insert(aiTrainingData).values(trainingData).returning();
    return saved;
  }

  async getTrainingDataByModel(modelName: string, userId: number): Promise<AiTrainingData[]> {
    return await db
      .select()
      .from(aiTrainingData)
      .where(
        and(
          eq(aiTrainingData.modelName, modelName),
          eq(aiTrainingData.userId, userId),
          eq(aiTrainingData.isActive, true)
        )
      )
      .orderBy(desc(aiTrainingData.createdAt));
  }

  async searchTrainingContent(query: string, modelName: string, userId: number): Promise<string[]> {
    const trainingData = await db
      .select({ content: aiTrainingData.content })
      .from(aiTrainingData)
      .where(
        and(
          eq(aiTrainingData.modelName, modelName),
          eq(aiTrainingData.userId, userId),
          eq(aiTrainingData.isActive, true)
        )
      );

    // Simple keyword search through training content
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const relevantContent: string[] = [];

    for (const data of trainingData) {
      const content = data.content.toLowerCase();
      const hasRelevantKeywords = keywords.some(keyword => content.includes(keyword));
      
      if (hasRelevantKeywords) {
        // Extract relevant paragraphs
        const sentences = data.content.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
            relevantContent.push(sentence.trim());
          }
        }
      }
    }

    return relevantContent.slice(0, 3); // Return top 3 relevant pieces
  }

  async deleteTrainingData(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(aiTrainingData)
      .set({ isActive: false })
      .where(
        and(
          eq(aiTrainingData.id, id),
          eq(aiTrainingData.userId, userId)
        )
      );

    return result.rowCount > 0;
  }
}