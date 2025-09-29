/**
 * Centralized API Endpoint Registry
 * Maps frontend features to correct backend routes for all 8 roles
 * Fixes path mismatches between frontend calls and backend mounts
 */

export const API_ENDPOINTS = {
  // =============== ADMIN ENDPOINTS ===============
  admin: {
    // Callern Management
    callernRoadmaps: '/api/callern/roadmaps',
    callernTemplates: '/api/roadmap/templates',
    callernInstances: '/api/roadmap/instances',
    callernFlows: '/api/callern/flows',
    
    // 3D Content Tools
    threeDTools: '/api/3d-tools',
    threeDLessons: '/api/3d-tools/lessons',
    threeDTemplates: '/api/3d-tools/templates',
    
    // AI Management
    aiStudyPartner: '/api/ai-study-partner',
    aiTraining: '/api/ai-training',
    aiAnalysis: '/api/ai-analysis',
    advancedFeatures: '/api/advanced',
    
    // Teacher QA & Management
    teacherQA: '/api/teacher-qa',
    teacherPerformance: '/api/teacher-qa/performance',
    teacherReviews: '/api/teacher-qa/peer-reviews',
    
    // Gamification
    gamification: '/api/gamification',
    achievements: '/api/gamification/achievements',
    leaderboards: '/api/gamification/leaderboards',
    dailyChallenges: '/api/gamification/daily-challenges',
    
    // Course & Roadmap Management
    courses: '/api/admin/courses',
    courseRoadmaps: '/api/course-roadmaps',
    examRoadmaps: '/api/roadmap/exams',
    sampleCourses: '/api/sample-courses',
    
    // Book E-commerce
    bookEcommerce: '/api/book-ecommerce',
    bookCatalog: '/api/book-ecommerce/catalog',
    bookOrders: '/api/book-ecommerce/orders',
    
    // Communication & CRM
    aiWebhooks: '/api/ai-webhooks',
    thirdPartyIntegrations: '/api/third-party',
    
    // Search System
    search: '/api/search',
    
    // Enhanced Systems
    enhancedAnalytics: '/api/enhanced-analytics',
    enhancedMentoring: '/api/enhanced-mentoring',
    unifiedTesting: '/api/unified-testing',
    
    // Admin Dashboard
    stats: '/api/admin/stats',
    
    // TTS & Voice
    tts: '/api/tts',
    ttsPipeline: '/api/tts-pipeline',
    
    // Global Lexi & LinguaQuest
    globalLexi: '/api/global-lexi',
    linguaQuest: '/api/linguaquest',
  },
  
  // =============== TEACHER ENDPOINTS ===============
  teacher: {
    // Basic Teacher Data
    daysOfWeek: '/api/teacher/days-of-week',
    stats: '/api/teacher/stats',
    
    // Performance & QA
    qa: '/api/teacher-qa',
    performance: '/api/teacher-qa/my-performance',
    peerReviews: '/api/teacher-qa/peer-reviews',
    
    // Class & Student Management
    classes: '/api/classes',
    classesToday: '/api/teacher/classes/today',
    students: '/api/teacher/students',
    assignments: '/api/teacher/assignments',
    assignmentsPending: '/api/teacher/assignments/pending',
    availability: '/api/teacher/availability',
    observations: '/api/teacher/observations',
    
    // Payment Management
    payslips: '/api/teacher/payslips',
    payslipCurrent: '/api/teacher/payslip/current',
    payslipDownload: '/api/teacher/payslip', // Base for ${id}/download
    
    // Resource Management  
    resources: '/api/teacher/resources',
    resourcesUpload: '/api/teacher/resources/upload',
    
    // Testing & Courses
    tests: '/api/teacher/tests',
    courses: '/api/teacher/courses',
    
    // Reports & Payments
    reports: '/api/teacher/reports',
    chartColors: '/api/teacher/chart-colors',
    payments: '/api/teacher/payments',
    
    // Advanced Features
    callern: '/api/callern/teacher',
    videoManagement: '/api/teacher/videos',
  },
  
  // =============== STUDENT ENDPOINTS ===============
  student: {
    // Dashboard & Analytics
    dashboard: '/api/student/dashboard',
    dashboardStats: '/api/student/dashboard-stats',
    gamificationStats: '/api/student/gamification-stats',
    learningProgress: '/api/student/learning-progress',
    socialStats: '/api/student/social-stats',
    
    // Course & Session Management
    courses: '/api/student/courses',
    sessions: '/api/student/sessions',
    upcomingSessions: '/api/student/upcoming-sessions',
    sessionHistory: '/api/student/session-history',
    enrollmentStatus: '/student/enrollment-status',
    sessionPackages: '/api/student/session-packages',
    enroll: '/api/student/enroll',
    
    // Assignments & Homework
    assignments: '/api/student/assignments',
    homework: '/api/student/homework',
    homeworkStats: '/api/student/homework/stats',
    
    // Gamification & Achievements  
    achievements: '/gamification/achievements',
    gamesAccessible: '/student/games/accessible',
    gameProgress: '/student/game-progress',
    gameSessions: '/student/game-sessions',
    leaderboard: '/gamification/leaderboard',
    conversations: '/api/student/conversations',
    wallet: '/student/wallet',
    
    // Callern & Tutoring
    callernStatus: '/api/student/callern-status',
    callernQuickSession: '/api/student/callern/quick-session',
    teacherAvailability: '/api/student/teacher-availability',
    
    // Social & Community
    studyGroups: '/api/student/study-groups',
    communityFeed: '/api/student/community-feed',
    studyPartners: '/api/student/study-partners',
    
    // AI & Learning
    aiConversation: '/student/ai-conversation',
    aiConversationMessages: '/ai-study-partner/messages',
    aiStudyPartnerChat: '/ai-study-partner/chat',
    linguaquestProgress: '/api/student/linguaquest-progress',
    learningRecommendations: '/api/student/learning-recommendations',
    moodLearning: '/advanced/mood-learning',
    
    // E-commerce & Booking
    virtualMall: '/api/student/virtual-mall',
    bookCatalog: '/api/book-ecommerce/student',
    cart: '/api/book-ecommerce/cart',
    orders: '/api/book-ecommerce/student/orders',
    bookTrial: '/api/student/book-trial',
    
    // Testing & Assessments  
    tests: '/api/student/tests',
    testsSubmit: '/api/student/tests/submit',
    testResults: '/api/student/test-results',
    
    // Profile & Payments
    payments: '/api/student/payments',
    profile: '/api/student/profile',
    tutors: '/api/student/tutors',
  },
  
  // =============== FRONT DESK ENDPOINTS ===============
  frontDesk: {
    dashboard: '/api/frontdesk/dashboard',
    walkInIntake: '/api/frontdesk/walk-in',
    trialScheduling: '/api/frontdesk/trials',
    callLogging: '/api/frontdesk/calls',
    callerHistory: '/api/frontdesk/caller-history',
    smsTemplates: '/api/frontdesk/sms-templates',
  },
  
  // =============== CALL CENTER ENDPOINTS ===============
  callCenter: {
    dashboard: '/api/callcenter/dashboard',
    leads: '/api/callcenter/leads',
    campaigns: '/api/callcenter/campaigns',
    calls: '/api/callcenter/calls',
    voipCenter: '/api/callcenter/voip',
    prospects: '/api/callcenter/prospects',
    workflow: '/api/callcenter/workflow',
  },
  
  // =============== MENTOR ENDPOINTS ===============
  mentor: {
    dashboard: '/api/mentor/dashboard',
    students: '/api/mentor/students',
    progress: '/api/mentor/progress',
    sessions: '/api/mentor/sessions',
    enhancedMentoring: '/api/enhanced-mentoring',
  },
  
  // =============== SUPERVISOR ENDPOINTS ===============
  supervisor: {
    dashboard: '/api/supervisor/dashboard',
    teacherSupervision: '/api/supervisor/teachers',
    observations: '/api/supervisor/observations',
    analytics: '/api/enhanced-analytics/supervisor',
  },
  
  // =============== ACCOUNTANT ENDPOINTS ===============
  accountant: {
    dashboard: '/api/accountant/dashboard',
    financialReports: '/api/accountant/reports',
    transactions: '/api/accountant/transactions',
    teacherPayments: '/api/accountant/teacher-payments',
  },
  
  // =============== SHARED/COMMON ENDPOINTS ===============
  common: {
    auth: '/api/auth',
    profile: '/api/profile',
    notifications: '/api/notifications',
    uploads: '/api/uploads',
    settings: '/api/settings',
  }
} as const;

// Helper function to get endpoint by role and feature
export function getEndpoint(role: keyof typeof API_ENDPOINTS, feature: string): string {
  const roleEndpoints = API_ENDPOINTS[role];
  if (!roleEndpoints || !(feature in roleEndpoints)) {
    console.warn(`Endpoint not found for role: ${role}, feature: ${feature}`);
    return `/api/${role}/${feature}`;
  }
  return (roleEndpoints as any)[feature];
}

// Helper to build full URL with base path
export function buildApiUrl(role: keyof typeof API_ENDPOINTS, feature: string, path?: string): string {
  const endpoint = getEndpoint(role, feature);
  return path ? `${endpoint}${path}` : endpoint;
}