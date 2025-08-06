import { 
  users, courses, enrollments, sessions, messages, homework, 
  payments, notifications, instituteBranding, leads, invoices,
  communicationLogs, achievements, userAchievements,
  userStats, dailyGoals, skillAssessments, learningActivities, progressSnapshots,
  moodEntries, moodRecommendations, learningAdaptations, attendanceRecords, rooms,
  studentQuestionnaires, questionnaireResponses, userProfiles, rolePermissions, userSessions,
  sessionPackages, walletTransactions, coursePayments, mentorAssignments, mentoringSessions,
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
  callernPackages, studentCallernPackages, teacherCallernAvailability, callernCallHistory,
  // Supervision observation tables
  supervisionObservations, teacherObservationResponses,
  // Additional tables
  teacherAvailability, paymentTransactions, teacherEvaluations, classObservations, systemMetrics,
  courseSessions, levelAssessmentQuestions, levelAssessmentResults, systemConfig, customRoles,
  institutes, departments, studentGroups, studentGroupMembers, teacherAssignments,
  studentNotes, parentGuardians, studentReports, referralSettings, courseReferrals,
  referralCommissions, adminSettings, aiTrainingData, aiKnowledgeBase,
  // Types
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
  type StudentQuestionnaire, type InsertStudentQuestionnaire,
  type QuestionnaireResponse, type InsertQuestionnaireResponse,
  // Testing subsystem types
  type Test, type InsertTest, type TestQuestion, type InsertTestQuestion,
  type TestAttempt, type InsertTestAttempt, type TestAnswer, type InsertTestAnswer,
  // Gamification types
  type Game, type InsertGame, type GameLevel, type InsertGameLevel,
  type UserGameProgress, type InsertUserGameProgress, type GameSession, type InsertGameSession,
  type GameLeaderboard, type InsertGameLeaderboard,
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
  type TeacherCallernAvailability, type InsertTeacherCallernAvailability, type CallernCallHistory, type InsertCallernCallHistory,
  // Supervision observation types
  type SupervisionObservation, type InsertSupervisionObservation,
  type TeacherObservationResponse, type InsertTeacherObservationResponse
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
  getGlobalLeaderboard(): Promise<any[]>;
  
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
  getCourseCompletionAnalytics(): Promise<any>;
  getOperationalMetrics(): Promise<any>;
  getFinancialKPIs(): Promise<any>;
  getRegistrationAnalytics(): Promise<any>;
  getTeacherPerformanceAnalytics(): Promise<any>;
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
  private adminSettings: any;
  private chatConversations: Map<number, any>;
  private supportTickets: Map<number, any>;
  private pushNotifications: Map<number, any>;
  private rooms: Map<number, any>;
  private games: Map<number, any>;
  private gameSessions: Map<number, any>;
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
    this.adminSettings = null;
    this.chatConversations = new Map();
    this.supportTickets = new Map();
    this.pushNotifications = new Map();
    this.rooms = new Map();
    this.games = new Map();
    this.gameSessions = new Map();
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
      phone: "+989123456789", // Compatibility alias
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

    // Add admin user for testing
    const testAdmin: User = {
      id: 4,
      email: "admin@test.com",
      password: "$2b$10$tO5lVOUKjyeG4Kv39wvYcO4dIhOkxxh6iFezQmMApZt39r2crgFmy", // password123 (same hash as defaultUser)
      firstName: "Admin",
      lastName: "User",
      role: "Admin",
      phoneNumber: "+98-912-345-6789",
      phone: "+98-912-345-6789", // Compatibility alias
      avatar: null,
      isActive: true,
      preferences: { theme: "light", language: "en", notifications: true },
      walletBalance: 0,
      totalCredits: 0,
      memberTier: "diamond",
      streakDays: 0,
      totalLessons: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(4, testAdmin);
    
    // Update user schema compatibility for database 
    this.users.forEach((user, id) => {
      if (!user.phone && user.phoneNumber) {
        user.phone = user.phoneNumber; // Add phone compatibility field
      }
    });

    // Add some tutors
    const tutor1: User = {
      id: 2,
      email: "sarah.johnson@example.com",
      password: "$2b$10$hash",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "teacher",
      phoneNumber: "+1234567890",
      phone: "+1234567890", // Compatibility alias
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
      phone: "+1234567891", // Compatibility alias
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

    this.currentId = 43;
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
    // Ensure branding always returns valid data
    if (!this.branding) {
      this.branding = {
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
    }
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

  // Add missing methods required by server/routes.ts
  async getPaymentHistory(userId?: number): Promise<Payment[]> {
    if (userId) {
      return Array.from(this.payments.values()).filter(p => p.userId === userId);
    }
    return Array.from(this.payments.values());
  }

  async getTeachers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === "Teacher" || user.role === "teacher" && user.isActive
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getSessions(): Promise<Session[]> {
    return this.getAllSessions();
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

  // CRITICAL MISSING METHODS - Admin Settings
  async getAdminSettings(): Promise<any> {
    if (!this.adminSettings) {
      this.adminSettings = {
        id: 1,
        instituteName: "Meta Lingua",
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
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return this.adminSettings;
  }

  async updateAdminSettings(updates: any): Promise<any> {
    if (!this.adminSettings) {
      await this.getAdminSettings();
    }
    this.adminSettings = { ...this.adminSettings, ...updates, updatedAt: new Date() };
    return this.adminSettings;
  }

  // CRITICAL MISSING METHODS - Course Management
  async updateCourse(id: number, updates: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (course) {
      const updatedCourse = { ...course, ...updates, updatedAt: new Date() };
      this.courses.set(id, updatedCourse);
      return updatedCourse;
    }
    return undefined;
  }

  async deleteCourse(id: number): Promise<void> {
    this.courses.delete(id);
  }

  async getCourseEnrollments(courseId: number): Promise<any[]> {
    return Array.from(this.enrollments.values()).filter(e => e.courseId === courseId);
  }

  async getCourseModules(courseId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async getModuleLessons(moduleId: number): Promise<VideoLesson[]> {
    return []; // Mock implementation
  }

  // CRITICAL MISSING METHODS - Chat Conversations
  async getChatConversations(userId: number): Promise<any[]> {
    return Array.from(this.chatConversations.values()).filter(c => c.userId === userId);
  }

  async getChatConversation(id: number): Promise<any | undefined> {
    return this.chatConversations.get(id);
  }

  async createChatConversation(conversation: any): Promise<any> {
    const id = this.currentId++;
    const newConversation = {
      id,
      ...conversation,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatConversations.set(id, newConversation);
    return newConversation;
  }

  async updateChatConversation(id: number, updates: any): Promise<any> {
    const conversation = this.chatConversations.get(id);
    if (conversation) {
      const updated = { ...conversation, ...updates, updatedAt: new Date() };
      this.chatConversations.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // CRITICAL MISSING METHODS - Support Tickets
  async getSupportTickets(filters?: any): Promise<any[]> {
    return Array.from(this.supportTickets.values());
  }

  async getSupportTicket(id: number): Promise<any | undefined> {
    return this.supportTickets.get(id);
  }

  async createSupportTicket(ticket: any): Promise<any> {
    const id = this.currentId++;
    const newTicket = {
      id,
      ...ticket,
      status: ticket.status || 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.supportTickets.set(id, newTicket);
    return newTicket;
  }

  async updateSupportTicket(id: number, updates: any): Promise<any> {
    const ticket = this.supportTickets.get(id);
    if (ticket) {
      const updated = { ...ticket, ...updates, updatedAt: new Date() };
      this.supportTickets.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteSupportTicket(id: number): Promise<void> {
    this.supportTickets.delete(id);
  }

  // CRITICAL MISSING METHODS - Push Notifications  
  async getPushNotifications(filters?: any): Promise<any[]> {
    return Array.from(this.pushNotifications.values());
  }

  async getPushNotification(id: number): Promise<any | undefined> {
    return this.pushNotifications.get(id);
  }

  async createPushNotification(notification: any): Promise<any> {
    const id = this.currentId++;
    const newNotification = {
      id,
      ...notification,
      status: notification.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.pushNotifications.set(id, newNotification);
    return newNotification;
  }

  async updatePushNotification(id: number, updates: any): Promise<any> {
    const notification = this.pushNotifications.get(id);
    if (notification) {
      const updated = { ...notification, ...updates, updatedAt: new Date() };
      this.pushNotifications.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deletePushNotification(id: number): Promise<void> {
    this.pushNotifications.delete(id);
  }

  // CRITICAL MISSING METHODS - Room Management
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(room: any): Promise<Room> {
    const id = this.currentId++;
    const newRoom = {
      id,
      ...room,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rooms.set(id, newRoom);
    return newRoom;
  }

  async updateRoom(id: number, updates: any): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (room) {
      const updated = { ...room, ...updates, updatedAt: new Date() };
      this.rooms.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getActiveRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(r => r.isActive);
  }

  // CRITICAL MISSING METHODS - Teacher Management
  async getTeacherAvailability(teacherId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async createTeacherAvailability(availabilityData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...availabilityData, createdAt: new Date() };
  }

  async getTeacherAvailabilitySlot(slotId: number): Promise<any | undefined> {
    return undefined; // Mock implementation
  }

  async updateTeacherAvailability(slotId: number, updates: any): Promise<any> {
    return { id: slotId, ...updates, updatedAt: new Date() };
  }

  async deleteTeacherAvailability(slotId: number): Promise<void> {
    // Mock implementation
  }

  async getTeacherClasses(teacherId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async getTeacherClass(classId: number, teacherId?: number): Promise<any | undefined> {
    return undefined; // Mock implementation
  }

  async getClassMessages(classId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async createClassMessage(messageData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...messageData, createdAt: new Date() };
  }

  // Additional critical missing methods from LSP errors
  async getTeacherAvailabilityPeriods(teacherId?: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async createTeacherAvailabilityPeriod(periodData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...periodData, createdAt: new Date() };
  }

  async updateTeacherAvailabilityPeriod(id: number, updates: any): Promise<any> {
    return { id, ...updates, updatedAt: new Date() };
  }

  async deleteTeacherAvailabilityPeriod(id: number): Promise<void> {
    // Mock implementation
  }

  async checkTeacherScheduleConflict(teacherId: number, timeSlot: any): Promise<any> {
    return { hasConflict: false, conflicts: [] };
  }

  async assignTeacherToClass(assignmentData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...assignmentData, createdAt: new Date() };
  }

  async getAvailableTeachers(filters?: any): Promise<any[]> {
    return Array.from(this.users.values()).filter(u => u.role === 'teacher');
  }

  async getAvailableCoursesForUser(userId: number): Promise<any[]> {
    return Array.from(this.courses.values());
  }

  async getUserWalletData(userId: number): Promise<any> {
    const user = this.users.get(userId);
    return {
      id: userId,
      balance: user?.walletBalance || 0,
      currency: 'IRT',
      transactions: []
    };
  }

  async getUserWalletTransactions(userId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async createWalletTransaction(transaction: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...transaction, createdAt: new Date() };
  }

  async updateWalletTransactionStatus(id: number, status: string): Promise<any> {
    return { id, status, updatedAt: new Date() };
  }

  async calculateCoursePrice(courseId: number, userId: number): Promise<any> {
    return { price: 5000000, currency: 'IRT', discounts: [] };
  }

  async createCoursePayment(paymentData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...paymentData, createdAt: new Date() };
  }

  async updateCoursePaymentStatus(id: number, status: string): Promise<any> {
    return { id, status, updatedAt: new Date() };
  }

  async getEnrollments(): Promise<any[]> {
    return Array.from(this.enrollments.values());
  }

  async getPlacementTests(): Promise<any[]> {
    return []; // Mock implementation
  }

  async createPlacementTest(test: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...test, createdAt: new Date() };
  }

  async getPlacementTestAttempts(testId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async updatePlacementTest(id: number, updates: any): Promise<any> {
    return { id, ...updates, updatedAt: new Date() };
  }

  async deletePlacementTest(id: number): Promise<void> {
    // Mock implementation
  }

  async getCommunicationTemplates(): Promise<any[]> {
    return []; // Mock implementation
  }

  async createCommunicationTemplate(template: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...template, createdAt: new Date() };
  }

  async getCampaigns(): Promise<any[]> {
    return []; // Mock implementation
  }

  async createCampaign(campaign: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...campaign, createdAt: new Date() };
  }

  async getAutomationRules(): Promise<any[]> {
    return []; // Mock implementation
  }

  async createAutomationRule(rule: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...rule, createdAt: new Date() };
  }

  async getCallCenterLogs(): Promise<any[]> {
    return []; // Mock implementation
  }

  async logCallCompletion(callData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...callData, createdAt: new Date() };
  }

  async getTeacherSessions(teacherId: number): Promise<any[]> {
    return Array.from(this.sessions.values()).filter(s => s.tutorId === teacherId);
  }

  async getStudentSessionPackages(studentId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async createSessionPackage(packageData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...packageData, createdAt: new Date() };
  }

  async getTeacherAssignments(teacherId: number): Promise<any[]> {
    return []; // Mock implementation
  }

  async updateHomework(id: number, updates: any): Promise<any> {
    const homework = this.homework.get(id);
    if (homework) {
      const updated = { ...homework, ...updates, updatedAt: new Date() };
      this.homework.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createReferralLink(linkData: any): Promise<any> {
    const id = this.currentId++;
    return { id, ...linkData, createdAt: new Date() };
  }

  async updateReferralLink(id: number, updates: any): Promise<any> {
    return { id, ...updates, updatedAt: new Date() };
  }

  async getReferralStats(userId: number): Promise<any> {
    return {
      totalReferrals: 0,
      successfulReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0
    };
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

  async getRooms(): Promise<any[]> {
    return [
      { id: 1, name: "Room A1", capacity: 20, equipment: ["Projector", "Whiteboard"] },
      { id: 2, name: "Room B2", capacity: 15, equipment: ["Computer", "Audio System"] },
      { id: 3, name: "Virtual Room 1", capacity: 50, equipment: ["Video Conference", "Screen Share"] }
    ];
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

  async getTeachersWithRates(): Promise<any[]> {
    return [
      {
        id: 1,
        name: "محمد احمدی",
        hourlyRate: 75000,
        callernRate: 65000,
        totalSessions: 45,
        totalHours: 68,
        performance: 4.8,
        department: 'both'
      },
      {
        id: 2,
        name: "فاطمه صادقی",
        hourlyRate: 80000,
        callernRate: null,
        totalSessions: 38,
        totalHours: 57,
        performance: 4.9,
        department: 'regular'
      },
      {
        id: 3,
        name: "علی رضایی",
        hourlyRate: 70000,
        callernRate: 60000,
        totalSessions: 29,
        totalHours: 44,
        performance: 4.6,
        department: 'both'
      }
    ];
  }

  async updateTeacherRates(teacherId: number, regularRate: number, callernRate?: number): Promise<any> {
    return {
      id: teacherId,
      hourlyRate: regularRate,
      callernRate: callernRate,
      updatedAt: new Date().toISOString(),
      message: 'Teacher rates updated successfully'
    };
  }

  async updateTeacherPayment(paymentId: number, updates: any): Promise<any> {
    const { basePay, bonuses, deductions, totalHours, hourlyRate } = updates;
    
    // Recalculate everything based on new values
    // If totalHours is provided, prioritize hours-based calculation
    const newBasePay = totalHours ? (totalHours * (hourlyRate || 750000)) : (basePay || 0);
    const newFinalAmount = newBasePay + (bonuses || 0) - (deductions || 0);
    
    // Create updated payment record
    const updatedPayment = {
      id: paymentId,
      basePay: newBasePay,
      bonuses: bonuses || 0,
      deductions: deductions || 0,
      totalHours: totalHours,
      hourlyRate: hourlyRate || 750000,
      finalAmount: newFinalAmount,
      status: 'calculated',
      calculatedAt: new Date().toISOString(),
      isRecalculated: true
    };
    
    return {
      ...updatedPayment,
      message: "Payment recalculated successfully",
      changes: {
        previousAmount: updates.previousAmount,
        newAmount: newFinalAmount,
        difference: newFinalAmount - (updates.previousAmount || 0)
      }
    };
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

  // Teacher observation workflow methods (stub implementations)
  async getTeacherObservations(teacherId: number): Promise<SupervisionObservation[]> {
    return [];
  }

  async getUnacknowledgedObservations(teacherId: number): Promise<SupervisionObservation[]> {
    return [];
  }

  async acknowledgeObservation(observationId: number, teacherId: number): Promise<void> {
    // Stub implementation
  }

  async createTeacherObservationResponse(response: InsertTeacherObservationResponse): Promise<TeacherObservationResponse> {
    return {
      id: 1,
      observationId: response.observationId,
      teacherId: response.teacherId,
      responseType: response.responseType,
      content: response.content,
      submittedAt: new Date(),
      supervisorReviewed: false,
      supervisorReviewedAt: null
    };
  }

  async getObservationResponses(observationId: number): Promise<TeacherObservationResponse[]> {
    return [];
  }

  async updateObservationResponse(observationId: number, teacherId: number, updates: Partial<SupervisionObservation>): Promise<SupervisionObservation | undefined> {
    return undefined;
  }

  // Course module and lesson management methods
  async addCourseModule(courseId: number, moduleData: any): Promise<any> {
    const moduleId = Math.floor(Math.random() * 1000000);
    
    return {
      id: moduleId,
      courseId,
      name: moduleData.name,
      description: moduleData.description,
      duration: moduleData.duration,
      order: moduleData.order,
      createdAt: new Date()
    };
  }

  async addCourseLesson(courseId: number, moduleId: number, lessonData: any): Promise<any> {
    const lessonId = Math.floor(Math.random() * 1000000);
    
    return {
      id: lessonId,
      courseId,
      moduleId,
      teacherId: lessonData.teacherId,
      title: lessonData.title,
      description: lessonData.description,
      videoUrl: lessonData.videoUrl,
      duration: lessonData.duration,
      orderIndex: lessonData.orderIndex,
      language: lessonData.language,
      level: lessonData.level,
      skillFocus: lessonData.skillFocus,
      isPublished: lessonData.isPublished || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async publishCourse(courseId: number): Promise<Course | undefined> {
    const course = this.courses.get(courseId);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, isActive: true, updatedAt: new Date() };
    this.courses.set(courseId, updatedCourse);
    
    return updatedCourse;
  }

  async getTotalUsers(): Promise<number> {
    return Promise.resolve(this.users.size);
  }

  // Analytics methods implementations
  async getRevenueAnalytics(): Promise<any> {
    const totalRevenue = Array.from(this.payments.values())
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    return {
      totalRevenue,
      monthlyRevenue: totalRevenue * 0.3, // Mock monthly data
      growthRate: 15.2,
      transactions: this.payments.size
    };
  }

  async getStudentRetentionAnalytics(): Promise<any> {
    const totalStudents = Array.from(this.users.values()).filter(u => u.role === 'Student').length;
    const activeStudents = Math.floor(totalStudents * 0.85);
    
    return {
      totalStudents,
      activeStudents,
      retentionRate: activeStudents / totalStudents * 100,
      churnRate: 12.5
    };
  }

  async getMarketingMetrics(): Promise<any> {
    return {
      totalLeads: 145,
      convertedLeads: 89,
      conversionRate: 61.4,
      costPerAcquisition: 25000,
      averageLifetimeValue: 450000
    };
  }

  async getCourseCompletionAnalytics(): Promise<any> {
    const totalEnrollments = this.enrollments.size;
    const completedCourses = Math.floor(totalEnrollments * 0.68);
    
    return {
      totalEnrollments,
      completedCourses,
      completionRate: completedCourses / totalEnrollments * 100,
      averageCompletionTime: 45,
      dropoutRate: 32.0
    };
  }

  async getOperationalMetrics(): Promise<any> {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Math.floor(this.sessions.size * 0.7),
      averageSessionDuration: 55,
      systemUptime: 99.8,
      responseTime: 120
    };
  }

  async getFinancialKPIs(): Promise<any> {
    const totalRevenue = Array.from(this.payments.values())
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    return {
      totalRevenue,
      profit: totalRevenue * 0.35,
      operatingCosts: totalRevenue * 0.65,
      profitMargin: 35.0,
      ARPU: totalRevenue / this.users.size
    };
  }

  async getRegistrationAnalytics(): Promise<any> {
    return {
      totalRegistrations: this.users.size,
      monthlyRegistrations: Math.floor(this.users.size * 0.15),
      registrationGrowth: 8.5,
      verifiedUsers: Math.floor(this.users.size * 0.92),
      pendingVerifications: Math.floor(this.users.size * 0.08)
    };
  }

  async getTeacherPerformanceAnalytics(): Promise<any> {
    const teachers = Array.from(this.users.values()).filter(u => u.role === 'Teacher/Tutor');
    
    return {
      totalTeachers: teachers.length,
      activeTeachers: Math.floor(teachers.length * 0.9),
      averageRating: 4.6,
      totalSessions: this.sessions.size,
      averageSessionsPerTeacher: this.sessions.size / teachers.length
    };
  }

  // ===== GAMIFICATION METHODS =====
  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
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
    return Array.from(this.games.values()).filter(g => g.ageGroup === ageGroup);
  }

  async getGamesByLevel(level: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(g => g.level === level);
  }

  async getGamesByFilters(filters: { ageGroup?: string, gameType?: string, level?: string, language?: string }): Promise<Game[]> {
    let filteredGames = Array.from(this.games.values());
    
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

  // Communication methods (missing from interface)
  async getChatConversations(): Promise<any[]> {
    return []; // Return empty array for communication features
  }

  async getSupportTickets(): Promise<any[]> {
    return []; // Return empty array for support tickets
  }

  async getPushNotifications(): Promise<any[]> {
    return []; // Return empty array for notifications
  }

  // Callern Integration Methods Implementation
  async getCallernPackages(): Promise<any[]> {
    return [];
  }

  async getTeacherCallernAvailability(teacherId?: number): Promise<any[]> {
    return [];
  }

  async getTeachersForCallern(): Promise<any[]> {
    return Array.from(this.users.values()).filter(u => u.role === 'Teacher');
  }

  async createCallernPackage(pkg: any): Promise<any> {
    return { id: 1, ...pkg, createdAt: new Date() };
  }

  async getCallernPackage(id: number): Promise<any> {
    return null;
  }

  async setTeacherCallernAvailability(teacherId: number, availability: any): Promise<any>;
  async setTeacherCallernAvailability(availabilityData: any): Promise<any>;
  async setTeacherCallernAvailability(teacherIdOrData: any, availability?: any): Promise<any> {
    if (typeof teacherIdOrData === 'number') {
      return { id: 1, teacherId: teacherIdOrData, ...availability, updatedAt: new Date() };
    } else {
      return { id: 1, ...teacherIdOrData, updatedAt: new Date() };
    }
  }

  // Additional supervision methods implementation
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

  // Missing supervision observation methods
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

  // Student questionnaire methods
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
    // Mock implementation
    return {
      id,
      ...updates,
      updatedAt: new Date()
    } as StudentQuestionnaire;
  }

  async deleteStudentQuestionnaire(id: number): Promise<void> {
    // Mock implementation
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
}

import { DatabaseStorage } from "./database-storage";

// Switch to DatabaseStorage to use PostgreSQL database with real users
export const storage = new DatabaseStorage();
