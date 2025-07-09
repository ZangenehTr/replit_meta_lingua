import { 
  users, courses, enrollments, sessions, messages, homework, 
  payments, notifications, instituteBranding, leads, invoices,
  communicationLogs, achievements, userAchievements,
  userStats, dailyGoals, skillAssessments, learningActivities, progressSnapshots,
  moodEntries, moodRecommendations, learningAdaptations, attendanceRecords, rooms,
  type User, type InsertUser, type Course, type InsertCourse,
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
  type MentorAssignment, type InsertMentorAssignment,
  type MentoringSession, type InsertMentoringSession,
  type MoodEntry, type InsertMoodEntry,
  type MoodRecommendation, type InsertMoodRecommendation,
  type LearningAdaptation, type InsertLearningAdaptation,
  type AttendanceRecord, type InsertAttendanceRecord,
  type Room, type InsertRoom,
  // Testing subsystem types
  tests, testQuestions, testAttempts, testAnswers,
  type Test, type InsertTest, type TestQuestion, type InsertTestQuestion,
  type TestAttempt, type InsertTestAttempt, type TestAnswer, type InsertTestAnswer,
  // Gamification types
  games, gameLevels, userGameProgress, gameSessions, gameLeaderboards,
  type Game, type InsertGame, type GameLevel, type InsertGameLevel,
  type UserGameProgress, type InsertUserGameProgress, type GameSession, type InsertGameSession,
  type GameLeaderboard, type InsertGameLeaderboard,
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
  // Callern types
  callernPackages, studentCallernPackages, teacherCallernAvailability, callernCallHistory,
  type CallernPackage, type InsertCallernPackage, type StudentCallernPackage, type InsertStudentCallernPackage,
  type TeacherCallernAvailability, type InsertTeacherCallernAvailability, type CallernCallHistory, type InsertCallernCallHistory
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPreferences(id: number, preferences: any): Promise<User | undefined>;

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

  // Role permissions
  checkUserPermission(role: string, resource: string, action: string): Promise<boolean>;
  getRolePermissions(role: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getUserCourses(userId: number): Promise<(Course & { progress: number })[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<void>;
  getCourseEnrollments(courseId: number): Promise<any[]>;
  enrollInCourse(enrollment: InsertEnrollment): Promise<Enrollment>;
  unenrollFromCourse(userId: number, courseId: number): Promise<void>;

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
  getStudentCallernPackages(studentId: number): Promise<any[]>;
  createStudentCallernPackage(packageData: any): Promise<any>;
  
  // Schedule Conflict Checking (Check-First Protocol)
  checkTeacherScheduleConflicts(teacherId: number, proposedHours: string[]): Promise<{
    hasConflicts: boolean;
    conflicts: any[];
    conflictType: string;
    conflictingHours: string[];
  }>;

  // Sessions
  getUserSessions(userId: number): Promise<(Session & { tutorName: string })[]>;
  getUpcomingSessions(userId: number): Promise<(Session & { tutorName: string, tutorAvatar: string })[]>;
  getAllSessions(): Promise<Session[]>;
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
  getStudentProfiles(): Promise<(UserProfile & { userName: string, userEmail: string })[]>;
  getStudentProfile(userId: number): Promise<UserProfile | undefined>;
  createStudentProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateStudentProfile(id: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;

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

  // CRM - Teacher Performance (use evaluation tables)
  getTeacherPerformance(teacherId?: number): Promise<any[]>;
  createTeacherPerformance(performance: any): Promise<any>;

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
  getLeadsByAssignee(assignee: string): Promise<Lead[]>;
  
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
  
  // White-Label Institute Management
  getWhiteLabelInstitutes(): Promise<any[]>;
  createWhiteLabelInstitute(institute: any): Promise<any>;
  updateWhiteLabelInstitute(id: number, updates: any): Promise<any>;
  
  // Campaign Management
  getMarketingCampaigns(): Promise<any[]>;
  createMarketingCampaign(campaign: any): Promise<any>;
  getCampaignAnalytics(): Promise<any>;
  
  // Website Builder
  getWebsiteTemplates(): Promise<any[]>;
  deployWebsite(deployment: any): Promise<any>;
  
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
  createGame(game: InsertGame): Promise<Game>;
  getGameById(id: number): Promise<Game | undefined>;
  getGamesByAgeGroup(ageGroup: string): Promise<Game[]>;
  getGamesByLevel(level: string): Promise<Game[]>;
  getGamesByFilters(filters: { ageGroup?: string, gameType?: string, level?: string, language?: string }): Promise<Game[]>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  
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
  getVideoLessonById(id: number): Promise<VideoLesson | undefined>;
  getVideoLessonsByCourse(courseId: number): Promise<VideoLesson[]>;
  updateVideoLesson(id: number, lesson: Partial<InsertVideoLesson>): Promise<VideoLesson | undefined>;
  deleteVideoLesson(id: number): Promise<boolean>;
  
  // Video progress
  getOrCreateVideoProgress(userId: number, videoId: number): Promise<VideoProgress>;
  updateVideoProgress(userId: number, videoId: number, progress: Partial<InsertVideoProgress>): Promise<VideoProgress | undefined>;
  getUserVideoProgress(userId: number): Promise<VideoProgress[]>;
  
  // Video notes & bookmarks
  createVideoNote(note: InsertVideoNote): Promise<VideoNote>;
  getUserVideoNotes(userId: number, videoId: number): Promise<VideoNote[]>;
  createVideoBookmark(bookmark: InsertVideoBookmark): Promise<VideoBookmark>;
  getUserVideoBookmarks(userId: number, videoId: number): Promise<VideoBookmark[]>;
  
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
      password: "$2b$10$tO5lVOUKjyeG4Kv39wvYcO4dIhOkxxh6iFezQmMApZt39r2crgFmy", // password123
      firstName: "Ahmad",
      lastName: "Rezaei",
      role: "student",
      phoneNumber: "+989123456789",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isActive: true,
      preferences: { theme: "light", language: "en", notifications: true },
      walletBalance: 5000,
      totalCredits: 12,
      memberTier: "silver",
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
      walletBalance: 0,
      totalCredits: 0,
      memberTier: "bronze",
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
      walletBalance: 0,
      totalCredits: 0,
      memberTier: "bronze",
      streakDays: 0,
      totalLessons: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(3, tutor2);

    // Initialize courses
    const course1: Course = {
      id: 1,
      courseCode: "ENG301",
      title: "Advanced English Speaking",
      description: "Improve your English conversation skills",
      language: "en",
      level: "advanced",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop",
      targetLanguage: "english",
      targetLevel: ["advanced"],
      instructorId: 2,
      price: 50,
      totalSessions: 16,
      sessionDuration: 90,
      maxStudents: 8,
      weekdays: ["Monday", "Wednesday"],
      startTime: "18:00",
      endTime: "19:30",
      category: "Language Learning",
      tags: ["speaking", "conversation", "english"],
      prerequisites: ["Intermediate English knowledge"],
      learningObjectives: ["Fluent English conversation", "Business English skills"],
      difficulty: "advanced",
      certificateTemplate: null,
      autoRecord: true,
      recordingAvailable: true,
      deliveryMode: "online",
      classFormat: "group",
      firstSessionDate: new Date().toISOString().split('T')[0],
      lastSessionDate: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 16 weeks later
      timeZone: "Asia/Tehran",
      calendarType: "gregorian",
      isActive: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.courses.set(1, course1);

    const course2: Course = {
      id: 2,
      courseCode: "GER101",
      title: "German for Beginners",
      description: "Start your German language journey",
      language: "de",
      level: "beginner",
      thumbnail: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=300&h=200&fit=crop",
      targetLanguage: "german",
      targetLevel: ["beginner"],
      instructorId: 3,
      price: 40,
      totalSessions: 12,
      sessionDuration: 90,
      maxStudents: 10,
      weekdays: ["Tuesday", "Thursday"],
      startTime: "16:00",
      endTime: "17:30",
      category: "Language Learning",
      tags: ["german", "beginner", "basics"],
      prerequisites: [],
      learningObjectives: ["Basic German communication", "German grammar fundamentals"],
      difficulty: "beginner",
      certificateTemplate: null,
      autoRecord: false,
      recordingAvailable: false,
      deliveryMode: "online",
      classFormat: "group",
      firstSessionDate: new Date().toISOString().split('T')[0],
      lastSessionDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 weeks later
      timeZone: "Asia/Tehran",
      calendarType: "gregorian",
      isActive: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date()
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
      logo: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      accentColor: "#F59E0B",
      backgroundColor: "#F8FAFC",
      textColor: "#1F2937",
      favicon: "/favicon.ico",
      loginBackgroundImage: "/login-bg.jpg",
      fontFamily: "Inter",
      borderRadius: "8px",
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
      id,
      email: "user@example.com",
      password: "hashedpassword",
      firstName: "User",
      lastName: "Name",
      role: "student",
      phoneNumber: null,
      avatar: null,
      isActive: true,
      preferences: null,
      walletBalance: 0,
      memberTier: "bronze",
      totalCredits: 0,
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
    
    const currentPrefs = typeof user.preferences === 'object' && user.preferences !== null ? user.preferences : {};
    const updatedUser = { 
      ...user, 
      preferences: { ...currentPrefs, ...preferences },
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
    
    // Create course with defaults for all required fields
    const course: Course = {
      id,
      targetLanguage: "persian",
      courseCode: `COURSE${id}`,
      title: "New Course",
      description: "Course description",
      language: "fa",
      level: "beginner",
      thumbnail: "https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=300&h=200&fit=crop",
      targetLevel: ["beginner"],
      instructorId: 1,
      price: 0,
      totalSessions: 10,
      sessionDuration: 60,
      maxStudents: 15,
      weekdays: ["Monday", "Wednesday"],
      startTime: "10:00",
      endTime: "11:00",
      category: "Language Learning",
      tags: [],
      prerequisites: [],
      learningObjectives: [],
      difficulty: "beginner",
      certificateTemplate: null,
      autoRecord: false,
      recordingAvailable: false,
      deliveryMode: "online",
      classFormat: "group",
      firstSessionDate: new Date().toISOString().split('T')[0],
      lastSessionDate: new Date(Date.now() + 10 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      timeZone: "Asia/Tehran",
      calendarType: "gregorian",
      isActive: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.courses.set(id, course);
    return course;
  }

  async enrollInCourse(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentId++;
    const enrollment: Enrollment = {
      id,
      userId: 1, // Default user ID
      courseId: 1, // Default course ID
      progress: 0,
      enrolledAt: new Date(),
      completedAt: null
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
      id,
      status: "scheduled",
      notes: "",
      title: "Learning Session",
      description: "Language learning session",
      courseId: 1,
      studentId: 1,
      tutorId: 1,
      scheduledAt: new Date(),
      duration: 60,
      sessionUrl: "",
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

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
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
      id,
      senderId: 1,
      receiverId: 1,
      content: "Sample message",
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
      id,
      status: "pending",
      title: "Assignment",
      description: "Complete the assigned work",
      courseId: 1,
      studentId: 1,
      teacherId: 1,
      dueDate: new Date(),
      submission: "",
      grade: 0,
      feedback: "",
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
      id,
      status: "pending",
      userId: 1,
      amount: "1000",
      currency: "IRR",
      creditsAwarded: 100,
      provider: "shetab",
      transactionId: null,
      merchantTransactionId: null,
      gatewayTransactionId: null,
      referenceNumber: null,
      cardNumber: null,
      failureReason: null,
      shetabResponse: null,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
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
      id,
      message: "New notification",
      type: "info",
      userId: 1,
      title: "Notification",
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
      id: 1,
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
      borderRadius: "8px",
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

  // User Profile Methods
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    // Mock implementation for MemStorage
    return undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = this.currentId++;
    const userProfile: UserProfile = {
      id,
      userId: 1,
      culturalBackground: "Persian",
      nativeLanguage: "Persian",
      targetLanguages: ["English"],
      proficiencyLevel: "beginner",
      learningGoals: ["conversation"],
      interests: ["culture"],
      timezone: "Asia/Tehran",
      preferredContactMethod: "email",
      marketingConsent: false,
      parentGuardianName: "",
      parentGuardianPhone: "",
      parentGuardianEmail: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      medicalInfo: "",
      specialRequirements: "",
      previousEducation: "",
      currentOccupation: "",
      linkedinProfile: "",
      portfolioUrl: "",
      personalityType: "introvert",
      learningStyle: "visual",
      motivationLevel: 8,
      weeklyGoalHours: 10,
      preferredDifficulty: "medium",
      currentLevel: "beginner",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return userProfile;
  }

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    // Mock implementation for MemStorage
    return undefined;
  }

  // User Session Methods
  async getUserSession(token: string): Promise<UserSession | undefined> {
    return undefined;
  }

  async getUserSessionByRefreshToken(refreshToken: string): Promise<UserSession | undefined> {
    return undefined;
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const id = this.currentId++;
    const userSession: UserSession = {
      id,
      userId: 1,
      token: "",
      refreshToken: "",
      expiresAt: new Date(),
      lastActiveAt: new Date(),
      ipAddress: "",
      userAgent: "",
      isActive: true,
      createdAt: new Date()
    };
    return userSession;
  }

  async updateUserSessionActivity(sessionId: number): Promise<void> {
    // Mock implementation for MemStorage
  }

  async updateUserSessionTokens(sessionId: number, accessToken: string, refreshToken: string): Promise<void> {
    // Mock implementation for MemStorage
  }

  async invalidateUserSession(token: string): Promise<void> {
    // Mock implementation for MemStorage
  }

  // Role Permission Methods
  async checkUserPermission(role: string, resource: string, action: string): Promise<boolean> {
    return true; // Mock implementation
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return []; // Mock implementation
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const id = this.currentId++;
    const rolePermission: RolePermission = {
      id,
      role: "student",
      resource: "courses",
      action: "read",
      allowed: true,
      createdAt: new Date()
    };
    return rolePermission;
  }

  async unenrollFromCourse(userId: number, courseId: number): Promise<void> {
    // Mock implementation for MemStorage
  }

  // CRM - Student Management
  async getStudentProfiles(): Promise<(UserProfile & { userName: string, userEmail: string })[]> {
    return []; // Mock implementation
  }

  async getStudentProfile(userId: number): Promise<UserProfile | undefined> {
    return undefined; // Mock implementation
  }

  async createStudentProfile(profile: InsertUserProfile): Promise<UserProfile> {
    return this.createUserProfile(profile);
  }

  async updateStudentProfile(id: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    return undefined; // Mock implementation
  }

  // CRM - Lead Management
  async getLeads(): Promise<(Lead & { assignedToName?: string })[]> {
    return []; // Mock implementation
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return undefined; // Mock implementation
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.currentId++;
    const newLead: Lead = {
      id,
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      source: "website",
      status: "new",
      priority: "medium",
      interestedLanguage: "persian",
      interestedLevel: "beginner",
      preferredFormat: "group",
      budget: null,
      notes: "",
      assignedAgentId: null,
      lastContactDate: null,
      nextFollowUpDate: null,
      conversionDate: null,
      studentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newLead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    return undefined; // Mock implementation
  }

  // Removed duplicate methods - implemented later in the class

  // CRM - Financial Management
  async getInvoices(): Promise<(Invoice & { studentName: string, courseName?: string })[]> {
    return []; // Mock implementation
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return undefined; // Mock implementation
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentId++;
    const newInvoice: Invoice = {
      id,
      studentId: 1,
      amount: 500000,
      currency: "IRR",
      status: "pending",
      dueDate: new Date(),
      description: "Course fee",
      courseId: 1,
      notes: "",
      invoiceNumber: `INV-${id}`,
      issuedAt: new Date(),
      taxRate: 9,
      shetabTransactionId: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return newInvoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    return undefined; // Mock implementation
  }

  // CRM - Teacher Performance
  async getTeacherPerformance(teacherId?: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async createTeacherPerformance(performance: any): Promise<any> {
    return {}; // Mock implementation
  }

  // CRM - Attendance
  async getAttendance(sessionId?: number, studentId?: number): Promise<AttendanceRecord[]> {
    return []; // Mock implementation
  }

  async createAttendance(attendance: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = this.currentId++;
    const newAttendance: AttendanceRecord = {
      id,
      sessionId: 1,
      studentId: 1,
      status: "present",
      notes: "",
      date: new Date().toISOString().split('T')[0],
      groupId: 1,
      checkInTime: new Date(),
      checkOutTime: new Date(),
      markedBy: 1,
      createdAt: new Date()
    };
    return newAttendance;
  }

  // CRM - Communication Logs
  async getCommunicationLogs(contactId?: number): Promise<(CommunicationLog & { staffName: string })[]> {
    return []; // Mock implementation
  }

  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const id = this.currentId++;
    const newLog: CommunicationLog = {
      id,
      leadId: 1,
      studentId: 1,
      agentId: 1,
      type: "call",
      direction: "outbound",
      duration: 10,
      outcome: "answered",
      notes: "",
      followUpRequired: false,
      followUpDate: new Date(),
      recordingUrl: "",
      createdAt: new Date()
    };
    return newLog;
  }

  // Gamification
  async getAchievements(): Promise<Achievement[]> {
    return []; // Mock implementation
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return []; // Mock implementation
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.currentId++;
    const newUserAchievement: UserAchievement = {
      id,
      userId: 1,
      achievementId: 1,
      unlockedAt: new Date(),
      isNotified: false
    };
    return newUserAchievement;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return undefined; // Mock implementation
  }

  async updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats | undefined> {
    return undefined; // Mock implementation
  }

  async getDailyGoals(userId: number, date?: string): Promise<DailyGoal[]> {
    return []; // Mock implementation
  }

  async createDailyGoal(goal: InsertDailyGoal): Promise<DailyGoal> {
    const id = this.currentId++;
    const newGoal: DailyGoal = {
      id,
      userId: 1,
      goalType: "practice",
      targetValue: 1,
      currentValue: 0,
      goalDate: new Date(),
      isCompleted: false,
      completedAt: new Date(),
      xpReward: 100,
      createdAt: new Date()
    };
    return newGoal;
  }

  async updateDailyGoal(id: number, updates: Partial<DailyGoal>): Promise<DailyGoal | undefined> {
    return undefined; // Mock implementation
  }

  // Progress snapshots
  async getLatestProgressSnapshot(userId: number): Promise<ProgressSnapshot | undefined> {
    return undefined; // Mock implementation
  }

  // Dashboard stats
  async getAdminDashboardStats(): Promise<any> {
    return {
      totalUsers: 42,
      totalCourses: 12,
      totalRevenue: 150000000,
      revenueGrowth: 15.2,
      systemHealth: {
        database: "healthy",
        api: "healthy",
        storage: "healthy"
      }
    };
  }

  async getTeacherDashboardStats(teacherId: number): Promise<any> {
    return {
      completedLessons: 45,
      totalStudents: 28,
      averageRating: 4.8,
      monthlyEarnings: 12500000
    };
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
    return {
      totalCourses: 3,
      completedLessons: 24,
      streakDays: 7,
      totalXP: 1250,
      currentLevel: 5,
      achievements: [
        { id: 1, name: 'First Lesson', description: 'Complete your first lesson', earned: true },
        { id: 2, name: 'Week Warrior', description: 'Complete 7 days in a row', earned: true }
      ],
      upcomingSessions: [
        { id: 1, title: 'Persian Grammar', scheduledAt: new Date(), duration: 60 }
      ],
      recentActivities: [
        { id: 1, type: 'lesson', title: 'Persian Verbs', completedAt: new Date() }
      ]
    };
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

  // Mentor assignments
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

  // Skill Assessment Methods
  async getSkillAssessments(userId?: number, skillType?: string): Promise<SkillAssessment[]> {
    return []; // Mock implementation
  }

  async getLatestSkillAssessment(userId: number, skillType: string): Promise<SkillAssessment | undefined> {
    return undefined; // Mock implementation
  }

  async createSkillAssessment(assessment: InsertSkillAssessment): Promise<SkillAssessment> {
    const id = this.currentId++;
    const newAssessment: SkillAssessment = {
      id,
      userId: 1,
      skillType: "speaking",
      score: "85.50",
      activityType: "quiz",
      activityId: null,
      metadata: null,
      assessedAt: new Date()
    };
    return newAssessment;
  }

  // Learning Activities Methods
  async getLearningActivities(userId?: number, activityType?: string): Promise<LearningActivity[]> {
    return []; // Mock implementation
  }

  async createLearningActivity(activity: InsertLearningActivity): Promise<LearningActivity> {
    const id = this.currentId++;
    const newActivity: LearningActivity = {
      id,
      userId: 1,
      activityType: "quiz",
      courseId: null,
      durationMinutes: null,
      completionRate: null,
      skillPoints: null,
      metadata: null,
      createdAt: new Date()
    };
    return newActivity;
  }

  // Progress Snapshots Methods
  async getProgressSnapshots(userId: number): Promise<ProgressSnapshot[]> {
    return []; // Mock implementation
  }

  async createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot> {
    const id = this.currentId++;
    const newSnapshot: ProgressSnapshot = {
      id,
      userId: 1,
      skillScores: {
        speaking: 85,
        listening: 90,
        reading: 88,
        writing: 82,
        grammar: 87,
        vocabulary: 89
      },
      overallLevel: "B2",
      averageScore: "86.83",
      snapshotDate: new Date(),
      createdAt: new Date()
    };
    return newSnapshot;
  }

  // Learning Profile Methods
  async getLearningProfile(userId: number): Promise<LearningProfile | undefined> {
    return undefined; // Mock implementation
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

  async updateLearningProfile(userId: number, updates: Partial<LearningProfile>): Promise<LearningProfile | undefined> {
    return undefined; // Mock implementation
  }

  // AI Conversation Methods
  async getAiConversations(userId: number): Promise<AiConversation[]> {
    return []; // Mock implementation
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

  // Mood-Based Learning Methods
  async getMoodEntries(userId: number, dateFrom?: string, dateTo?: string): Promise<MoodEntry[]> {
    return []; // Mock implementation
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
    return []; // Mock implementation
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

  async getMoodLearningAdaptations(userId: number): Promise<MoodLearningAdaptation[]> {
    return []; // Mock implementation
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

  // Extended CRM Methods
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

  async createSupervisorReport(report: any): Promise<any> {
    return null;
  }

  async deleteLead(id: number): Promise<boolean> {
    return true;
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return [];
  }

  async getLeadsByAssignee(assignee: string): Promise<Lead[]> {
    return [];
  }

  async getTeacherPerformance(teacherId?: number): Promise<any[]> {
    return [];
  }

  async createTeacherPerformance(performance: any): Promise<any> {
    return null;
  }

  // Remaining missing methods from IStorage interface
  async getSystemMetrics(): Promise<any> {
    return {
      cpuUsage: 45,
      memoryUsage: 72,
      diskSpace: 88,
      activeUsers: 142
    };
  }

  async createSystemMetric(metric: any): Promise<any> {
    return null;
  }

  async getMoodHistory(userId: number, limit?: number): Promise<any[]> {
    return [];
  }

  async getMoodEntryById(id: number): Promise<any> {
    return null;
  }

  async updateMoodEntry(id: number, updates: any): Promise<any> {
    return null;
  }

  async deleteMoodEntry(id: number): Promise<boolean> {
    return true;
  }

  async getMoodAnalytics(userId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    return {
      averageMood: 7.2,
      moodTrend: "improving",
      patterns: []
    };
  }

  async getPersonalizedRecommendations(userId: number, context: any): Promise<any[]> {
    return [];
  }

  async updateRecommendationFeedback(recommendationId: number, feedback: any): Promise<void> {
    // Mock implementation
  }

  // Additional missing methods for complete IStorage compliance
  async getMoodRecommendationById(id: number): Promise<any> {
    return null;
  }

  async updateMoodRecommendation(id: number, updates: any): Promise<any> {
    return null;
  }

  async createLearningAdaptation(adaptation: any): Promise<any> {
    return null;
  }

  async getLearningAdaptations(userId: number): Promise<any[]> {
    return [];
  }

  async updateLearningAdaptation(id: number, updates: any): Promise<any> {
    return null;
  }

  // Enterprise Features - Mock implementations for MemStorage
  async getTeacherPayments(period: string): Promise<any[]> {
    return [
      {
        id: 1,
        teacherId: 1,
        teacherName: "محمد احمدی",
        period: period,
        totalSessions: 32,
        totalHours: 48,
        hourlyRate: 800000,
        basePay: 38400000,
        bonuses: 2500000,
        deductions: 500000,
        finalAmount: 40400000,
        status: 'pending',
        calculatedAt: new Date().toISOString()
      }
    ];
  }

  async calculateTeacherPayments(period: string): Promise<any[]> {
    return this.getTeacherPayments(period);
  }

  async approveTeacherPayment(paymentId: number): Promise<any> {
    return { id: paymentId, status: 'approved' };
  }

  async getWhiteLabelInstitutes(): Promise<any[]> {
    return [
      {
        id: 1,
        name: "موسسه زبان فارسی تهران",
        subdomain: "tehran-persian",
        status: "active",
        subscriptionPlan: "enterprise"
      }
    ];
  }

  async createWhiteLabelInstitute(institute: any): Promise<any> {
    return { id: Date.now(), ...institute, status: "pending" };
  }

  async updateWhiteLabelInstitute(id: number, updates: any): Promise<any> {
    return { id, ...updates };
  }

  async getMarketingCampaigns(): Promise<any[]> {
    return [
      {
        id: 1,
        name: "نوروز ۱۴۰۴ - تخفیف ویژه",
        status: "active",
        platform: "instagram",
        budget: 25000000,
        spent: 18500000,
        roi: 2.4
      }
    ];
  }

  async createMarketingCampaign(campaign: any): Promise<any> {
    return { id: Date.now(), ...campaign, status: "draft" };
  }

  async updateMarketingCampaign(campaignId: number, updates: any): Promise<any> {
    // Simulate campaign update with Iranian data
    const existingCampaigns = await this.getMarketingCampaigns();
    const campaign = existingCampaigns.find((c: any) => c.id === campaignId);
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Apply updates
    const updatedCampaign = {
      ...campaign,
      ...updates,
      updatedAt: new Date()
    };

    return updatedCampaign;
  }

  async getCampaignAnalytics(): Promise<any> {
    return {
      totalCampaigns: 3,
      activeCampaigns: 2,
      totalBudget: 70000000,
      totalSpent: 61700000,
      averageROI: 2.1
    };
  }

  async getWebsiteTemplates(): Promise<any[]> {
    return [
      {
        id: 1,
        name: "الگوی کلاسیک فارسی",
        category: "education",
        conversionRate: 2.8,
        isPopular: true
      }
    ];
  }

  async deployWebsite(deployment: any): Promise<any> {
    return {
      id: Date.now(),
      ...deployment,
      status: "deploying",
      progress: 45
    };
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
