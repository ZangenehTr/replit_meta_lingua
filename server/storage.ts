import { 
  users, courses, enrollments, sessions, messages, homework, 
  payments, notifications, instituteBranding, studentProfiles, leads, invoices,
  teacherPerformance, attendance, communicationLogs, achievements, userAchievements,
  userStats, dailyGoals,
  type User, type InsertUser, type Course, type InsertCourse,
  type Enrollment, type InsertEnrollment, type Session, type InsertSession,
  type Message, type InsertMessage, type Homework, type InsertHomework,
  type Payment, type InsertPayment, type Notification, type InsertNotification,
  type InstituteBranding, type InsertBranding, type StudentProfile, type InsertStudentProfile,
  type Lead, type InsertLead, type Invoice, type InsertInvoice,
  type TeacherPerformance, type InsertTeacherPerformance, type Attendance, type InsertAttendance,
  type CommunicationLog, type InsertCommunicationLog,
  type Achievement, type InsertAchievement, type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats, type DailyGoal, type InsertDailyGoal
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPreferences(id: number, preferences: any): Promise<User | undefined>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getUserCourses(userId: number): Promise<(Course & { progress: number })[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  enrollInCourse(enrollment: InsertEnrollment): Promise<Enrollment>;

  // Sessions
  getUserSessions(userId: number): Promise<(Session & { tutorName: string })[]>;
  getUpcomingSessions(userId: number): Promise<(Session & { tutorName: string, tutorAvatar: string })[]>;
  createSession(session: InsertSession): Promise<Session>;
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
  getStudentProfiles(): Promise<(StudentProfile & { userName: string, userEmail: string })[]>;
  getStudentProfile(userId: number): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentProfile(id: number, updates: Partial<StudentProfile>): Promise<StudentProfile | undefined>;

  // CRM - Lead Management
  getLeads(): Promise<(Lead & { assignedToName?: string })[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;

  // CRM - Financial Management
  getInvoices(): Promise<(Invoice & { studentName: string, courseName?: string })[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined>;

  // CRM - Teacher Performance
  getTeacherPerformance(teacherId?: number): Promise<TeacherPerformance[]>;
  createTeacherPerformance(performance: InsertTeacherPerformance): Promise<TeacherPerformance>;

  // CRM - Attendance
  getAttendance(sessionId?: number, studentId?: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private homework: Map<number, Homework>;
  private payments: Map<number, Payment>;
  private notifications: Map<number, Notification>;
  private branding: InstituteBranding | undefined;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private userStats: Map<number, UserStats>;
  private dailyGoals: Map<number, DailyGoal>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.homework = new Map();
    this.payments = new Map();
    this.notifications = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.userStats = new Map();
    this.dailyGoals = new Map();
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data - using "password123" as the demo password
    const defaultUser: User = {
      id: 1,
      email: "ahmad.rezaei@example.com",
      password: "$2b$10$Hx.OSMR.FnZuUhUj2uEboew4eTHZu2N7Gc0VCu.tUU0Tpd3yEJJ7K", // password123
      firstName: "Ahmad",
      lastName: "Rezaei",
      role: "student",
      phoneNumber: "+989123456789",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isActive: true,
      preferences: { theme: "light", language: "en", notifications: true },
      credits: 12,
      streakDays: 15,
      totalLessons: 45,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, defaultUser);

    // Add some tutors
    const tutor1: User = {
      id: 2,
      email: "sarah.johnson@example.com",
      password: "$2b$10$hash",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "teacher",
      phoneNumber: "+1234567890",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      isActive: true,
      preferences: { theme: "light", language: "en", notifications: true },
      credits: 0,
      streakDays: 0,
      totalLessons: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(2, tutor1);

    const tutor2: User = {
      id: 3,
      email: "david.chen@example.com",
      password: "$2b$10$hash",
      firstName: "David",
      lastName: "Chen",
      role: "teacher",
      phoneNumber: "+1234567891",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      isActive: true,
      preferences: { theme: "light", language: "en", notifications: true },
      credits: 0,
      streakDays: 0,
      totalLessons: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(3, tutor2);

    // Initialize courses
    const course1: Course = {
      id: 1,
      title: "Advanced English Speaking",
      description: "Improve your English conversation skills",
      language: "en",
      level: "advanced",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
      instructorId: 2,
      price: 50,
      isActive: true,
      createdAt: new Date()
    };
    this.courses.set(1, course1);

    const course2: Course = {
      id: 2,
      title: "German for Beginners",
      description: "Start your German language journey",
      language: "de",
      level: "beginner",
      thumbnail: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=300&h=200&fit=crop",
      instructorId: 3,
      price: 40,
      isActive: true,
      createdAt: new Date()
    };
    this.courses.set(2, course2);

    // Initialize enrollments
    const enrollment1: Enrollment = {
      id: 1,
      userId: 1,
      courseId: 1,
      progress: 68,
      enrolledAt: new Date(),
      completedAt: null
    };
    this.enrollments.set(1, enrollment1);

    const enrollment2: Enrollment = {
      id: 2,
      userId: 1,
      courseId: 2,
      progress: 34,
      enrolledAt: new Date(),
      completedAt: null
    };
    this.enrollments.set(2, enrollment2);

    // Initialize branding
    this.branding = {
      id: 1,
      name: "Meta Lingua",
      logo: null,
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      updatedAt: new Date()
    };

    this.currentId = 4;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "student",
      phoneNumber: insertUser.phoneNumber || null,
      avatar: insertUser.avatar || null,
      isActive: true,
      preferences: insertUser.preferences || null,
      credits: 0,
      streakDays: 0,
      totalLessons: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() } as User;
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPreferences(id: number, preferences: any): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      preferences: { ...(user.preferences || {}), ...preferences },
      updatedAt: new Date() 
    } as User;
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(course => course.isActive);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getUserCourses(userId: number): Promise<(Course & { progress: number })[]> {
    const userEnrollments = Array.from(this.enrollments.values()).filter(e => e.userId === userId);
    const result = [];
    
    for (const enrollment of userEnrollments) {
      const course = this.courses.get(enrollment.courseId);
      if (course) {
        result.push({ ...course, progress: enrollment.progress });
      }
    }
    
    return result;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentId++;
    const course: Course = {
      ...insertCourse,
      id,
      isActive: true,
      createdAt: new Date()
    };
    this.courses.set(id, course);
    return course;
  }

  async enrollInCourse(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentId++;
    const enrollment: Enrollment = {
      ...insertEnrollment,
      id,
      progress: 0,
      enrolledAt: new Date(),
      completedAt: undefined
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }

  async getUserSessions(userId: number): Promise<(Session & { tutorName: string })[]> {
    const userSessions = Array.from(this.sessions.values()).filter(s => s.studentId === userId);
    const result = [];
    
    for (const session of userSessions) {
      const tutor = this.users.get(session.tutorId);
      result.push({
        ...session,
        tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : "Unknown"
      });
    }
    
    return result;
  }

  async getUpcomingSessions(userId: number): Promise<(Session & { tutorName: string, tutorAvatar: string })[]> {
    const now = new Date();
    const upcoming = Array.from(this.sessions.values()).filter(s => 
      s.studentId === userId && 
      s.scheduledAt > now &&
      s.status === "scheduled"
    );
    
    const result = [];
    for (const session of upcoming) {
      const tutor = this.users.get(session.tutorId);
      result.push({
        ...session,
        tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : "Unknown",
        tutorAvatar: tutor?.avatar || ""
      });
    }
    
    return result.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentId++;
    const session: Session = {
      ...insertSession,
      id,
      status: "scheduled",
      createdAt: new Date()
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSessionStatus(id: number, status: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, status };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]> {
    const userMessages = Array.from(this.messages.values()).filter(m => 
      m.receiverId === userId || m.senderId === userId
    );
    
    const result = [];
    for (const message of userMessages) {
      const sender = this.users.get(message.senderId);
      result.push({
        ...message,
        senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
        senderAvatar: sender?.avatar || ""
      });
    }
    
    return result.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async getRecentMessages(userId: number): Promise<(Message & { senderName: string, senderAvatar: string })[]> {
    const messages = await this.getUserMessages(userId);
    return messages.slice(0, 5);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId++;
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      sentAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getUserHomework(userId: number): Promise<(Homework & { courseName: string, teacherName: string })[]> {
    const userHomework = Array.from(this.homework.values()).filter(h => h.studentId === userId);
    const result = [];
    
    for (const hw of userHomework) {
      const course = this.courses.get(hw.courseId || 0);
      const teacher = this.users.get(hw.teacherId);
      result.push({
        ...hw,
        courseName: course?.title || "Unknown Course",
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"
      });
    }
    
    return result.sort((a, b) => (b.dueDate?.getTime() || 0) - (a.dueDate?.getTime() || 0));
  }

  async getPendingHomework(userId: number): Promise<(Homework & { courseName: string })[]> {
    const pending = Array.from(this.homework.values()).filter(h => 
      h.studentId === userId && h.status === "pending"
    );
    
    const result = [];
    for (const hw of pending) {
      const course = this.courses.get(hw.courseId || 0);
      result.push({
        ...hw,
        courseName: course?.title || "Unknown Course"
      });
    }
    
    return result;
  }

  async createHomework(insertHomework: InsertHomework): Promise<Homework> {
    const id = this.currentId++;
    const homework: Homework = {
      ...insertHomework,
      id,
      status: "pending",
      assignedAt: new Date()
    };
    this.homework.set(id, homework);
    return homework;
  }

  async updateHomeworkStatus(id: number, status: string, submission?: string): Promise<Homework | undefined> {
    const homework = this.homework.get(id);
    if (!homework) return undefined;
    
    const updatedHomework = { ...homework, status, submission };
    this.homework.set(id, updatedHomework);
    return updatedHomework;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentId++;
    const payment: Payment = {
      ...insertPayment,
      id,
      status: "pending",
      createdAt: new Date()
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, status };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(n => 
      n.userId === userId && !n.isRead
    );
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async getBranding(): Promise<InstituteBranding | undefined> {
    return this.branding;
  }

  async updateBranding(insertBranding: InsertBranding): Promise<InstituteBranding> {
    const branding: InstituteBranding = {
      ...insertBranding,
      id: 1,
      updatedAt: new Date()
    };
    this.branding = branding;
    return branding;
  }

  async getTutors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === "teacher" && user.isActive
    );
  }

  async getFeaturedTutors(): Promise<User[]> {
    const tutors = await this.getTutors();
    return tutors.slice(0, 6); // Return first 6 tutors as featured
  }
}

export const storage = new MemStorage();
