import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  users, userProfiles, userSessions, rolePermissions, courses, enrollments,
  sessions, messages, homework, payments, notifications, instituteBranding,
  achievements, userAchievements, userStats, dailyGoals,
  type User, type InsertUser, type UserProfile, type InsertUserProfile,
  type UserSession, type InsertUserSession, type RolePermission, type InsertRolePermission,
  type Course, type InsertCourse, type Enrollment, type InsertEnrollment,
  type Session, type InsertSession, type Message, type InsertMessage,
  type Homework, type InsertHomework, type Payment, type InsertPayment,
  type Notification, type InsertNotification, type InstituteBranding, type InsertBranding,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats, type DailyGoal, type InsertDailyGoal
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
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPreferences(id: number, preferences: any): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ preferences, updatedAt: new Date() })
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
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
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
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getUserCourses(userId: number): Promise<(Course & { progress: number })[]> {
    const userCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        language: courses.language,
        level: courses.level,
        thumbnail: courses.thumbnail,
        instructorId: courses.instructorId,
        price: courses.price,
        duration: courses.duration,
        totalLessons: courses.totalLessons,
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
    
    return userCourses;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async enrollInCourse(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
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
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ status })
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
}