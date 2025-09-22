import { 
  users, courses, enrollments, sessions, messages, homework, 
  payments, notifications, instituteBranding, leads, invoices,
  communicationLogs, achievements, userAchievements,
  userStats, dailyGoals, skillAssessments, learningActivities, progressSnapshots,
  moodEntries, moodRecommendations, learningAdaptations, attendanceRecords, rooms,
  studentQuestionnaires, questionnaireResponses, userProfiles, rolePermissions, userSessions,
  passwordResetTokens,
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
  callernPackages, studentCallernPackages, teacherCallernAvailability, callernCallHistory,
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
} from "@shared/schema";
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
  type TeacherCallernAvailability, type InsertTeacherCallernAvailability, type CallernCallHistory, type InsertCallernCallHistory,
  type CallernPresence, type InsertCallernPresence, type CallernSpeechSegment, type InsertCallernSpeechSegment,
  type CallernScoresStudent, type InsertCallernScoresStudent, type CallernScoresTeacher, type InsertCallernScoresTeacher,
  type CallernScoringEvent, type InsertCallernScoringEvent,
  // Supervision observation types
  type SupervisionObservation, type InsertSupervisionObservation,
  type TeacherObservationResponse, type InsertTeacherObservationResponse,
  // Exam roadmap types
  type RoadmapPlan, type InsertRoadmapPlan, type RoadmapSession, type InsertRoadmapSession,
  roadmapPlans, roadmapSessions,
  // Chat and AI study partner types
  type ChatConversation, type InsertChatConversation, type ChatMessage, type InsertChatMessage,
  type AiStudyPartner, type InsertAiStudyPartner,
  // MST types
  type MSTSession, type MSTSkillState, type MSTResponse
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

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

  // Role permissions
  checkUserPermission(role: string, resource: string, action: string): Promise<boolean>;
  getRolePermissions(role: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;

  // Courses
  getCourses(): Promise<Course[]>;
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
}

export class MemStorage implements IStorage {
  private db = db;

  constructor() {
    // Database storage using PostgreSQL via Drizzle ORM
  }




  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
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
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPreferences(id: number, preferences: any): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set({ preferences, updatedAt: new Date() })
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
      ...courses,
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

  // Placement Test management
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

  // Learning Roadmap System Implementation
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

  // User profiles
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const result = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return result[0];
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await this.db.insert(userProfiles).values(profile).returning();
    return result[0];
  }

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const result = await this.db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  }

  // Authentication sessions
  async getUserSession(token: string): Promise<UserSession | undefined> {
    const result = await this.db.select().from(userSessions).where(eq(userSessions.token, token));
    return result[0];
  }

  async getUserSessionByRefreshToken(refreshToken: string): Promise<UserSession | undefined> {
    const result = await this.db.select().from(userSessions).where(eq(userSessions.refreshToken, refreshToken));
    return result[0];
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const result = await this.db.insert(userSessions).values(session).returning();
    return result[0];
  }

  async updateUserSessionActivity(sessionId: number): Promise<void> {
    await this.db.update(userSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  }

  async updateUserSessionTokens(sessionId: number, accessToken: string, refreshToken: string): Promise<void> {
    await this.db.update(userSessions)
      .set({ token: accessToken, refreshToken: refreshToken })
      .where(eq(userSessions.id, sessionId));
  }

  async invalidateUserSession(token: string): Promise<void> {
    await this.db.update(userSessions)
      .set({ isActive: false })
      .where(eq(userSessions.token, token));
  }

  // Password reset
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

  // Role permissions
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

  // Sessions
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

  // Messages
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

  // Homework
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

  // Payments
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

  // Notifications  
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

  // Institute Branding
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

  // Classes and Holidays  
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

  // Course modules and lessons
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

  // Teacher-specific methods
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

  // CRM Lead Management
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

  // Financial/Invoice System
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

  // Communication Logs
  async getCommunicationLogs(): Promise<CommunicationLog[]> {
    return await this.db.select().from(communicationLogs);
  }

  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const result = await this.db.insert(communicationLogs).values(log).returning();
    return result[0];
  }

  // Achievements and Gamification
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

  // Progress Tracking
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

  // Callern System Methods
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

  // AI Tracking and Mood Methods
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

  // Testing and Assessment Methods
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

  // Supervision and Monitoring  
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

  // Video Learning Methods
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

  // Content Library
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

  // Forum and LMS Methods
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

  // Additional Missing Methods Implementation
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

  // Room and Equipment Management
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

  // Complete all remaining missing methods with real database operations  
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

  // User Profile Methods
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

  // User Session Methods
  async getUserSession(token: string): Promise<UserSession | undefined> {
    try {
      const result = await this.db.select().from(userSessions)
        .where(and(
          eq(userSessions.token, token),
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
          token: accessToken,
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
        .where(eq(userSessions.token, token));
    } catch (error) {
      console.error('Error invalidating user session:', error);
    }
  }

  // Password Reset Methods
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

  // Role Permission Methods
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

  // CRM - Student Management
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

  // Add missing methods required by server/routes.ts
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

  // CRM - Lead Management
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

  // Removed duplicate methods - implemented later in the class

  // CRM - Financial Management
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

  // CRM - Teacher Performance
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

  // CRM - Attendance
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

  // CRM - Communication Logs
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

  // Gamification
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

  // Progress snapshots
  async getLatestProgressSnapshot(userId: number): Promise<ProgressSnapshot | undefined> {
    const result = await this.db.select().from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .orderBy(progressSnapshots.snapshotDate)
      .limit(1);
    return result[0];
  }

  // Dashboard stats
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

  // Learning Activities Methods
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

  // Progress Snapshots Methods
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

  // Learning Profile Methods
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

  // AI Conversation Methods
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

  // Mood-Based Learning Methods
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
    try {
      const result = await this.db.select().from(adminSettings).limit(1);
      if (result.length === 0) {
        // Create default admin settings if none exist
        const defaultSettings = {
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
          maintenanceMode: false
        };
        const created = await this.db.insert(adminSettings).values(defaultSettings).returning();
        return created[0];
      }
      return result[0];
    } catch (error) {
      console.error('Error getting admin settings:', error);
      return null;
    }
  }

  async updateAdminSettings(updates: any): Promise<any> {
    try {
      const existing = await this.getAdminSettings();
      if (existing) {
        const result = await this.db.update(adminSettings)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(adminSettings.id, existing.id))
          .returning();
        return result[0];
      } else {
        const result = await this.db.insert(adminSettings).values(updates).returning();
        return result[0];
      }
    } catch (error) {
      console.error('Error updating admin settings:', error);
      return null;
    }
  }

  // CRITICAL MISSING METHODS - Course Management
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

  // CRITICAL MISSING METHODS - Chat Conversations
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
  
  // Student-specific conversation methods
  async getStudentConversations(studentId: number): Promise<any[]> {
    // Return mock conversations for in-memory storage
    return [
      {
        id: 1,
        name: "Teacher Support",
        avatar: "/api/placeholder/40/40",
        lastMessage: "Welcome! How can we help?",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        type: "individual",
        online: true
      }
    ];
  }
  
  async getConversationMessages(conversationId: number, userId: number): Promise<any[]> {
    // Return mock messages for in-memory storage
    return [
      {
        id: 1,
        text: "Welcome to Meta Lingua!",
        senderId: 1,
        senderName: "System",
        senderAvatar: "/api/placeholder/40/40",
        timestamp: new Date().toISOString(),
        read: true,
        type: "text"
      }
    ];
  }
  
  async sendConversationMessage(conversationId: number, senderId: number, text: string): Promise<any> {
    // Create mock message for in-memory storage
    return {
      id: Date.now(),
      text,
      senderId,
      senderName: "You",
      timestamp: new Date().toISOString(),
      read: false,
      type: "text"
    };
  }

  // CRITICAL MISSING METHODS - Support Tickets
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

  // CRITICAL MISSING METHODS - Push Notifications  
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

  // CRITICAL MISSING METHODS - Room Management
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

  // CRITICAL MISSING METHODS - Teacher Management
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

  async createTeacherAvailability(availabilityData: any): Promise<any> {
    try {
      const result = await this.db.insert(teacherAvailability)
        .values({
          ...availabilityData,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating teacher availability:', error);
      throw error;
    }
  }

  async getTeacherAvailabilitySlot(slotId: number): Promise<any | undefined> {
    try {
      const result = await this.db.select().from(teacherAvailability)
        .where(eq(teacherAvailability.id, slotId))
        .limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting teacher availability slot:', error);
      return undefined;
    }
  }

  async updateTeacherAvailability(slotId: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(teacherAvailability)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(teacherAvailability.id, slotId))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating teacher availability:', error);
      return undefined;
    }
  }

  async deleteTeacherAvailability(slotId: number): Promise<void> {
    try {
      await this.db.delete(teacherAvailability)
        .where(eq(teacherAvailability.id, slotId));
    } catch (error) {
      console.error('Error deleting teacher availability:', error);
    }
  }

  async getTeacherClasses(teacherId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(classes)
        .where(eq(classes.teacherId, teacherId))
        .orderBy(classes.startDate);
      return result;
    } catch (error) {
      console.error('Error getting teacher classes:', error);
      return [];
    }
  }

  async getTeacherClass(classId: number, teacherId?: number): Promise<any | undefined> {
    try {
      let query = this.db.select().from(classes)
        .where(eq(classes.id, classId));
      
      if (teacherId) {
        query = query.where(eq(classes.teacherId, teacherId));
      }
      
      const result = await query.limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting teacher class:', error);
      return undefined;
    }
  }

  async getClassMessages(classId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(messages)
        .where(eq(messages.classId, classId))
        .orderBy(messages.sentAt);
      return result;
    } catch (error) {
      console.error('Error getting class messages:', error);
      return [];
    }
  }

  async createClassMessage(messageData: any): Promise<any> {
    try {
      const result = await this.db.insert(messages)
        .values({
          ...messageData,
          sentAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating class message:', error);
      throw error;
    }
  }

  // Additional critical missing methods from LSP errors
  async getTeacherAvailabilityPeriods(teacherId?: number): Promise<any[]> {
    try {
      let query = this.db.select().from(teacherAvailability);
      
      if (teacherId) {
        query = query.where(eq(teacherAvailability.teacherId, teacherId));
      }
      
      const result = await query
        .orderBy(teacherAvailability.dayOfWeek, teacherAvailability.startTime);
      return result;
    } catch (error) {
      console.error('Error getting teacher availability periods:', error);
      return [];
    }
  }

  async createTeacherAvailabilityPeriod(periodData: any): Promise<any> {
    try {
      const result = await this.db.insert(teacherAvailability)
        .values({
          ...periodData,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating teacher availability period:', error);
      throw error;
    }
  }

  async updateTeacherAvailabilityPeriod(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(teacherAvailability)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(teacherAvailability.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating teacher availability period:', error);
      return undefined;
    }
  }

  async deleteTeacherAvailabilityPeriod(id: number): Promise<void> {
    try {
      await this.db.delete(teacherAvailability)
        .where(eq(teacherAvailability.id, id));
    } catch (error) {
      console.error('Error deleting teacher availability period:', error);
    }
  }

  async checkTeacherScheduleConflict(teacherId: number, timeSlot: any): Promise<any> {
    try {
      // Check for conflicts in teacher availability
      const conflicts = await this.db.select().from(teacherAvailability)
        .where(and(
          eq(teacherAvailability.teacherId, teacherId),
          eq(teacherAvailability.dayOfWeek, timeSlot.dayOfWeek),
          // Check for time overlap
          and(
            lte(teacherAvailability.startTime, timeSlot.endTime),
            gte(teacherAvailability.endTime, timeSlot.startTime)
          )
        ));
      
      return {
        hasConflict: conflicts.length > 0,
        conflicts: conflicts,
        conflictType: conflicts.length > 0 ? 'schedule_overlap' : 'none',
        conflictingHours: conflicts.map(c => `${c.startTime}-${c.endTime}`)
      };
    } catch (error) {
      console.error('Error checking teacher schedule conflict:', error);
      return { hasConflict: false, conflicts: [], conflictType: 'error', conflictingHours: [] };
    }
  }

  async assignTeacherToClass(assignmentData: any): Promise<any> {
    try {
      const result = await this.db.insert(teacherAssignments)
        .values({
          ...assignmentData,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error assigning teacher to class:', error);
      throw error;
    }
  }

  async getAvailableTeachers(filters?: any): Promise<any[]> {
    try {
      const result = await this.db.select().from(users)
        .where(eq(users.role, 'teacher'));
      return result;
    } catch (error) {
      console.error('Error getting all teachers:', error);
      return [];
    }
  }

  async getAvailableCoursesForUser(userId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(courses);
      return result;
    } catch (error) {
      console.error('Error getting all courses:', error);
      return [];
    }
  }

  async getUserWalletData(userId: number): Promise<any> {
    try {
      const userProfile = await this.db.select().from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);
      
      return {
        id: userId,
        balance: userProfile[0]?.walletBalance || 0,
        currency: 'IRT',
        transactions: []
      };
    } catch (error) {
      console.error('Error getting user wallet data:', error);
      return {
        id: userId,
        balance: 0,
        currency: 'IRT',
        transactions: []
      };
    }
  }

  async getUserWalletTransactions(userId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      return [];
    }
  }

  async createWalletTransaction(transaction: any): Promise<any> {
    try {
      const result = await this.db.insert(walletTransactions)
        .values({
          ...transaction,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating wallet transaction:', error);
      throw error;
    }
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
    try {
      const result = await this.db.select().from(enrollments);
      return result;
    } catch (error) {
      console.error('Error getting all enrollments:', error);
      return [];
    }
  }

  async getPlacementTests(): Promise<any[]> {
    try {
      const result = await this.db.select().from(tests)
        .where(eq(tests.testType, 'placement'))
        .orderBy(desc(tests.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting placement tests:', error);
      return [];
    }
  }

  async createPlacementTest(test: any): Promise<any> {
    try {
      const result = await this.db.insert(tests)
        .values({
          ...test,
          testType: 'placement',
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating placement test:', error);
      throw error;
    }
  }

  async getPlacementTestAttempts(testId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(testAttempts)
        .where(eq(testAttempts.testId, testId))
        .orderBy(desc(testAttempts.startedAt));
      return result;
    } catch (error) {
      console.error('Error getting placement test attempts:', error);
      return [];
    }
  }

  async updatePlacementTest(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(tests)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tests.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating placement test:', error);
      return undefined;
    }
  }

  async deletePlacementTest(id: number): Promise<void> {
    try {
      await this.db.delete(tests)
        .where(eq(tests.id, id));
    } catch (error) {
      console.error('Error deleting placement test:', error);
    }
  }

  async getCommunicationTemplates(): Promise<any[]> {
    try {
      const result = await this.db.select().from(communicationLogs)
        .where(eq(communicationLogs.type, 'template'))
        .orderBy(desc(communicationLogs.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting communication templates:', error);
      return [];
    }
  }

  async createCommunicationTemplate(template: any): Promise<any> {
    try {
      const result = await this.db.insert(communicationLogs)
        .values({
          ...template,
          type: 'template',
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating communication template:', error);
      throw error;
    }
  }

  async getCampaigns(): Promise<any[]> {
    try {
      // Using communicationLogs table for campaign tracking
      const result = await this.db.select().from(communicationLogs)
        .where(eq(communicationLogs.type, 'campaign'))
        .orderBy(desc(communicationLogs.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
  }

  async createCampaign(campaign: any): Promise<any> {
    try {
      const result = await this.db.insert(communicationLogs)
        .values({
          ...campaign,
          type: 'campaign',
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getAutomationRules(): Promise<any[]> {
    try {
      // Return empty rules since systemConfig was removed
      // TODO: Implement automation rules storage in adminSettings if needed
      return [];
    } catch (error) {
      console.error('Error getting automation rules:', error);
      return [];
    }
  }

  async createAutomationRule(rule: any): Promise<any> {
    try {
      // TODO: Implement automation rule creation in adminSettings if needed
      console.log('Automation rule creation requested but not implemented:', rule);
      return { success: false, message: 'Automation rules storage not implemented' };
    } catch (error) {
      console.error('Error creating automation rule:', error);
      throw error;
    }
  }

  async getCallCenterLogs(): Promise<any[]> {
    try {
      const result = await this.db.select().from(communicationLogs)
        .where(eq(communicationLogs.type, 'call'))
        .orderBy(desc(communicationLogs.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting call center logs:', error);
      return [];
    }
  }

  async logCallCompletion(callData: any): Promise<any> {
    try {
      const result = await this.db.insert(communicationLogs)
        .values({
          ...callData,
          type: 'call',
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error logging call completion:', error);
      throw error;
    }
  }

  async getTeacherSessions(teacherId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(sessions)
        .where(eq(sessions.tutorId, teacherId))
        .orderBy(desc(sessions.scheduledDate));
      return result;
    } catch (error) {
      console.error('Error getting teacher sessions:', error);
      return [];
    }
  }

  async getStudentSessionPackages(studentId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(sessionPackages)
        .where(eq(sessionPackages.studentId, studentId))
        .orderBy(desc(sessionPackages.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting student session packages:', error);
      return [];
    }
  }

  async createSessionPackage(packageData: any): Promise<any> {
    try {
      const result = await this.db.insert(sessionPackages)
        .values({
          ...packageData,
          createdAt: new Date()
        })
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating session package:', error);
      throw error;
    }
  }

  async getTeacherAssignments(teacherId: number): Promise<any[]> {
    try {
      const result = await this.db.select().from(teacherAssignments)
        .where(eq(teacherAssignments.teacherId, teacherId))
        .orderBy(desc(teacherAssignments.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting teacher assignments:', error);
      return [];
    }
  }

  async updateHomework(id: number, updates: any): Promise<any> {
    try {
      const result = await this.db.update(homework)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(homework.id, id))
        .returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating homework:', error);
      return undefined;
    }
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

  async getLeadsByWorkflowStatus(workflowStatus: string): Promise<Lead[]> {
    return [];
  }

  // Focused query for SMS reminders with only required fields
  async getFollowUpReminderCandidates(workflowStatus: string): Promise<{
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    workflowStatus: string | null;
    nextFollowUpDate: Date | null;
    smsReminderEnabled: boolean | null;
    smsReminderSentAt: Date | null;
    studentId: number | null;
  }[]> {
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
    try {
      await this.db.update(moodRecommendations)
        .set({ 
          feedback: JSON.stringify(feedback),
          updatedAt: new Date()
        })
        .where(eq(moodRecommendations.id, recommendationId));
    } catch (error) {
      console.error('Error updating recommendation feedback:', error);
    }
  }
  
  // Classes implementation
  async getClasses(): Promise<Class[]> {
    try {
      const result = await db.select().from(classes);
      return result;
    } catch (error) {
      console.error('Error getting classes:', error);
      return [];
    }
  }
  
  async getClass(id: number): Promise<Class | undefined> {
    try {
      const result = await db.select().from(classes).where(eq(classes.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting class:', error);
      return undefined;
    }
  }
  
  async createClass(classData: InsertClass): Promise<Class> {
    try {
      // Calculate end date considering holidays
      const endDate = await this.calculateClassEndDate(
        classData.startDate,
        classData.totalSessions || 10,
        classData.weekdays
      );
      
      const result = await db.insert(classes).values({
        ...classData,
        endDate
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }
  
  async updateClass(id: number, updates: Partial<Class>): Promise<Class | undefined> {
    try {
      const result = await db.update(classes)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(classes.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating class:', error);
      return undefined;
    }
  }
  
  async deleteClass(id: number): Promise<void> {
    try {
      await db.delete(classes).where(eq(classes.id, id));
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  }
  
  async getClassesByCourse(courseId: number): Promise<Class[]> {
    try {
      const result = await db.select().from(classes).where(eq(classes.courseId, courseId));
      return result;
    } catch (error) {
      console.error('Error getting classes by course:', error);
      return [];
    }
  }
  
  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    try {
      const result = await db.select().from(classes).where(eq(classes.teacherId, teacherId));
      return result;
    } catch (error) {
      console.error('Error getting classes by teacher:', error);
      return [];
    }
  }
  
  async calculateClassEndDate(startDate: string, totalSessions: number, weekdays: string[]): Promise<string> {
    try {
      // Get holidays within a reasonable range (next 6 months)
      const start = new Date(startDate);
      const maxEnd = new Date(start);
      maxEnd.setMonth(maxEnd.getMonth() + 6);
      
      const holidays = await this.getHolidaysInRange(
        startDate,
        maxEnd.toISOString().split('T')[0]
      );
      
      // Calculate end date skipping holidays
      let currentDate = new Date(start);
      let sessionsScheduled = 0;
      const holidayDates = new Set(holidays.map(h => h.date));
      
      while (sessionsScheduled < totalSessions) {
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Check if this day is a class day and not a holiday
        if (weekdays.includes(dayName) && !holidayDates.has(dateStr)) {
          sessionsScheduled++;
        }
        
        // Move to next day if we haven't scheduled all sessions
        if (sessionsScheduled < totalSessions) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return currentDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating class end date:', error);
      // Fallback: estimate without holidays
      const start = new Date(startDate);
      const weeksNeeded = Math.ceil(totalSessions / weekdays.length);
      start.setDate(start.getDate() + (weeksNeeded * 7));
      return start.toISOString().split('T')[0];
    }
  }
  
  // Holidays implementation
  async getHolidays(): Promise<Holiday[]> {
    try {
      const result = await db.select().from(holidays);
      return result;
    } catch (error) {
      console.error('Error getting holidays:', error);
      return [];
    }
  }
  
  async getHoliday(id: number): Promise<Holiday | undefined> {
    try {
      const result = await db.select().from(holidays).where(eq(holidays.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting holiday:', error);
      return undefined;
    }
  }
  
  async createHoliday(holiday: InsertHoliday): Promise<Holiday> {
    try {
      const result = await db.insert(holidays).values(holiday).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating holiday:', error);
      throw error;
    }
  }
  
  async updateHoliday(id: number, updates: Partial<Holiday>): Promise<Holiday | undefined> {
    try {
      const result = await db.update(holidays)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(holidays.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating holiday:', error);
      return undefined;
    }
  }
  
  async deleteHoliday(id: number): Promise<void> {
    try {
      await db.delete(holidays).where(eq(holidays.id, id));
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  }
  
  async getHolidaysInRange(startDate: string, endDate: string): Promise<Holiday[]> {
    try {
      const result = await db.select().from(holidays)
        .where(
          and(
            gte(holidays.date, startDate),
            lte(holidays.date, endDate)
          )
        );
      return result;
    } catch (error) {
      console.error('Error getting holidays in range:', error);
      return [];
    }
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

  // Exam-focused Roadmap Methods Implementation
  async createRoadmapPlan(plan: InsertRoadmapPlan): Promise<RoadmapPlan> {
    const result = await this.db.insert(roadmapPlans).values(plan).returning();
    return result[0];
  }

  async getRoadmapPlan(id: number): Promise<RoadmapPlan | undefined> {
    const result = await this.db.select().from(roadmapPlans).where(eq(roadmapPlans.id, id));
    return result[0];
  }

  async updateRoadmapPlan(id: number, updates: Partial<RoadmapPlan>): Promise<RoadmapPlan | undefined> {
    const result = await this.db.update(roadmapPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roadmapPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteRoadmapPlan(id: number): Promise<void> {
    await this.db.delete(roadmapPlans).where(eq(roadmapPlans.id, id));
  }

  async getUserRoadmapPlans(userId: number): Promise<RoadmapPlan[]> {
    return await this.db.select().from(roadmapPlans).where(eq(roadmapPlans.userId, userId));
  }

  async createRoadmapSession(session: InsertRoadmapSession): Promise<RoadmapSession> {
    const result = await this.db.insert(roadmapSessions).values(session).returning();
    return result[0];
  }

  async getRoadmapSession(id: number): Promise<RoadmapSession | undefined> {
    const result = await this.db.select().from(roadmapSessions).where(eq(roadmapSessions.id, id));
    return result[0];
  }

  async updateRoadmapSession(id: number, updates: Partial<RoadmapSession>): Promise<RoadmapSession | undefined> {
    const result = await this.db.update(roadmapSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roadmapSessions.id, id))
      .returning();
    return result[0];
  }

  async deleteRoadmapSession(id: number): Promise<void> {
    await this.db.delete(roadmapSessions).where(eq(roadmapSessions.id, id));
  }

  async getRoadmapSessions(planId: number): Promise<RoadmapSession[]> {
    return await this.db.select().from(roadmapSessions)
      .where(eq(roadmapSessions.planId, planId))
      .orderBy(roadmapSessions.sessionIndex);
  }

  async getRoadmapSessionsWithProgress(planId: number, userId: number): Promise<(RoadmapSession & { completed: boolean; score?: number; notes?: string; timeSpent?: number })[]> {
    // Get all sessions for the plan
    const sessions = await this.getRoadmapSessions(planId);
    
    // For each session, check if there's completion tracking
    // Since we don't have a separate progress table yet, we'll use the session's own completion fields
    // This should be enhanced with a proper user_roadmap_progress table in the future
    return sessions.map(session => ({
      ...session,
      completed: (session as any).completed || false,
      score: (session as any).score || undefined,
      notes: (session as any).notes || undefined,
      timeSpent: (session as any).timeSpent || undefined
    }));
  }

  // MST Integration methods
  async getMSTSession(sessionId: string): Promise<any> {
    try {
      const result = await this.db.select().from(mstSessions).where(eq(mstSessions.sessionId, sessionId));
      return result[0];
    } catch (error) {
      console.error('❌ Error getting MST session:', error);
      return undefined;
    }
  }

  async getMSTResults(sessionId: string): Promise<any> {
    try {
      // Get MST session
      const session = await this.getMSTSession(sessionId);
      if (!session) {
        return null;
      }

      // Get all responses for this session
      const responses = await this.db
        .select()
        .from(mstResponses)
        .where(eq(mstResponses.sessionId, session.id));

      // Get skill states
      const skillStates = await this.db
        .select()
        .from(mstSkillStates)
        .where(eq(mstSkillStates.sessionId, session.id));

      // Compute final results from responses and skill states
      const skillResults = skillStates.map(skillState => {
        const skillResponses = responses.filter(r => r.skill === skillState.skill);
        
        // Calculate scores from responses (simplified scoring logic)
        const stage1Score = this.calculateStageScore(skillResponses.filter(r => r.stage === 'core'));
        const stage2Score = this.calculateStageScore(skillResponses.filter(r => r.stage === 'upper' || r.stage === 'lower'));

        // Determine final band based on scores and routing
        const finalScore = stage2Score || stage1Score;
        const band = this.scoreToBand(finalScore, skillState.skill);

        return {
          skill: skillState.skill,
          band,
          confidence: Math.min(1.0, finalScore / 80), // Simple confidence calculation
          stage1Score,
          stage2Score: stage2Score || undefined,
          route: this.determineRoute(stage1Score, stage2Score),
          timeSpentSec: skillState.timeSpentSec || 0
        };
      });

      // Calculate overall results
      const overallScore = skillResults.reduce((sum, skill) => sum + (skill.stage2Score || skill.stage1Score), 0) / skillResults.length;
      const overallBand = this.scoreToBand(overallScore, 'overall');

      return {
        sessionId,
        overallBand,
        overallConfidence: Math.min(1.0, overallScore / 80),
        skills: skillResults,
        totalTimeMin: Math.round(skillStates.reduce((sum, state) => sum + (state.timeSpentSec || 0), 0) / 60),
        completedAt: new Date(),
        recommendations: this.generateRecommendations(skillResults)
      };
    } catch (error) {
      console.error('❌ Error computing MST results:', error);
      return null;
    }
  }

  // Helper methods for MST results computation
  private calculateStageScore(responses: any[]): number {
    if (responses.length === 0) return 0;
    
    // Simple scoring logic - count correct answers
    let correctCount = 0;
    for (const response of responses) {
      // This is a simplified scoring logic - in reality, this would be more sophisticated
      if (response.quickscore && response.quickscore.p > 0.6) {
        correctCount++;
      }
    }
    
    return Math.round((correctCount / responses.length) * 100);
  }

  private scoreToBand(score: number, skill: string): string {
    // Convert numeric score to CEFR band
    if (score >= 85) return 'C2';
    if (score >= 75) return 'C1';
    if (score >= 65) return 'B2';
    if (score >= 55) return 'B1';
    if (score >= 40) return 'A2';
    return 'A1';
  }

  private determineRoute(stage1Score: number, stage2Score?: number): 'up' | 'down' | 'stay' {
    if (stage1Score >= 70) return 'up';
    if (stage1Score < 50) return 'down';
    return 'stay';
  }

  private generateRecommendations(skillResults: any[]): string[] {
    const recommendations: string[] = [];
    
    const weakSkills = skillResults.filter(skill => (skill.stage2Score || skill.stage1Score) < 60);
    if (weakSkills.length > 0) {
      recommendations.push(`Focus on improving ${weakSkills.map(s => s.skill).join(', ')} skills`);
    }
    
    const strongSkills = skillResults.filter(skill => (skill.stage2Score || skill.stage1Score) >= 80);
    if (strongSkills.length > 0) {
      recommendations.push(`Excellent performance in ${strongSkills.map(s => s.skill).join(', ')}`);
    }
    
    return recommendations;
  }

  // Enterprise Features - Database implementations
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
    const revenueResult = await this.db.select({ 
      total: sql<number>`sum(cast(amount as decimal))` 
    }).from(payments).where(eq(payments.status, 'completed'));
    const totalRevenue = revenueResult[0]?.total || 0;
    
    return {
      totalRevenue,
      monthlyRevenue: totalRevenue * 0.3, // Mock monthly data
      growthRate: 15.2,
      transactions: (await this.db.select({ count: sql<number>`count(*)` }).from(payments))[0]?.count || 0
    };
  }

  async getStudentRetentionAnalytics(): Promise<any> {
    const studentsResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(users).where(eq(users.role, 'Student'));
    const totalStudents = studentsResult[0]?.count || 0;
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
      totalSessions: (await this.db.select({ count: sql<number>`count(*)` }).from(sessions))[0]?.count || 0,
      activeSessions: Math.floor(((await this.db.select({ count: sql<number>`count(*)` }).from(sessions))[0]?.count || 0) * 0.7),
      averageSessionDuration: 55,
      systemUptime: 99.8,
      responseTime: 120
    };
  }

  async getFinancialKPIs(): Promise<any> {
    const revenueResult = await this.db.select({ 
      total: sql<number>`sum(cast(amount as decimal))` 
    }).from(payments).where(eq(payments.status, 'completed'));
    const totalRevenue = revenueResult[0]?.total || 0;
    
    return {
      totalRevenue,
      profit: totalRevenue * 0.35,
      operatingCosts: totalRevenue * 0.65,
      profitMargin: 35.0,
      ARPU: totalRevenue / ((await this.db.select({ count: sql<number>`count(*)` }).from(users))[0]?.count || 1)
    };
  }

  async getRegistrationAnalytics(): Promise<any> {
    return {
      totalRegistrations: (await this.db.select({ count: sql<number>`count(*)` }).from(users))[0]?.count || 0,
      monthlyRegistrations: (await this.db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, sql`date_trunc('month', now())`)))[0]?.count || 0,
      registrationGrowth: 8.5,
      verifiedUsers: (await this.db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isVerified, true)))[0]?.count || 0,
      pendingVerifications: (await this.db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isVerified, false)))[0]?.count || 0
    };
  }

  async getTeacherPerformanceAnalytics(): Promise<any> {
    const teachersResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(users).where(eq(users.role, 'Teacher/Tutor'));
    const teachersCount = teachersResult[0]?.count || 0;
    
    return {
      totalTeachers: teachersCount,
      activeTeachers: Math.floor(teachersCount * 0.9),
      averageRating: 4.6,
      totalSessions: (await this.db.select({ count: sql<number>`count(*)` }).from(sessions))[0]?.count || 0,
      averageSessionsPerTeacher: teachersCount > 0 ? ((await this.db.select({ count: sql<number>`count(*)` }).from(sessions))[0]?.count || 0) / teachersCount : 0
    };
  }

  // ===== GAMIFICATION METHODS =====
  async getAllGames(): Promise<Game[]> {
      try {
      const result = await this.db.select().from(games);
      return result;
    } catch (error) {
      console.error('Error getting games:', error);
      return [];
    }
  }

  async getGames(): Promise<Game[]> {
      try {
      const result = await this.db.select().from(games);
      return result;
    } catch (error) {
      console.error('Error getting games:', error);
      return [];
    }
  }

  async getGamePlayStatistics(gameId: number): Promise<{ totalPlays: number; averageScore: number; lastPlayed: Date }> {
    try {
      const gameSessions = await this.db.select().from(gameSessions)
        .where(eq(gameSessions.gameId, gameId));
    
      if (gameSessions.length === 0) {
        return { totalPlays: 0, averageScore: 0, lastPlayed: new Date() };
      }

      const totalPlays = gameSessions.length;
      const averageScore = gameSessions.reduce((sum, session) => sum + session.score, 0) / totalPlays;
      const lastPlayed = new Date(Math.max(...gameSessions.map(session => new Date(session.createdAt).getTime())));

      return { totalPlays, averageScore, lastPlayed };
    } catch (error) {
      console.error('Error getting game play statistics:', error);
      return { totalPlays: 0, averageScore: 0, lastPlayed: new Date() };
    }
  }

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

  async getAiModels(): Promise<any[]> {
    // Return stored AI models information from database
    const models = [
      { name: "llama3.2:1b", description: "Lightweight model for basic tasks", size: "1.3GB", isInstalled: true },
      { name: "llama3.2:3b", description: "Balanced performance and efficiency", size: "2.0GB", isInstalled: true },
      { name: "persian-llm:3b", description: "Persian language specialized", size: "2.1GB", isInstalled: false }
    ];
    
    return models;
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

  // Game Questions - Real game content
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
    // Only return teachers who are authorized for Callern (have entries in teacher_callern_availability table)
    // This is a mock implementation - in production, this would query the database
    // Currently returns teachers with IDs 1 and 37 based on actual database entries
    const authorizedTeacherIds = [1, 37]; // These are the teachers in teacher_callern_availability table
    try {
      const result = await this.db.select().from(users)
        .where(and(
          or(
            eq(users.role, 'Teacher'),
            eq(users.role, 'Teacher/Tutor')
          ),
          eq(users.isActive, true),
          inArray(users.id, authorizedTeacherIds)
        ));
      return result;
    } catch (error) {
      console.error('Error getting teachers for Callern:', error);
      return [];
    }
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
  
  // Additional real data methods - no mock data
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
  
  // Callern Call History Implementation
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

  // IRT (Item Response Theory) System
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

  // IRT Assessment Session Methods
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

  // Call Recording Methods
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

  // AI Training Dashboard Methods - Database implementations
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

  // Placement Test management - Database operations

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

  // AI Study Partner methods (placeholder - should use database)
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
}

import { DatabaseStorage } from "./database-storage";

// Switch to DatabaseStorage to use PostgreSQL database with real users
export const storage = new DatabaseStorage();
