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
    courses: '/api/courses',
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
    qa: '/api/teacher-qa',
    performance: '/api/teacher-qa/my-performance',
    peerReviews: '/api/teacher-qa/peer-reviews',
    classes: '/api/classes',
    students: '/api/teacher/students',
    assignments: '/api/teacher/assignments',
    availability: '/api/teacher/availability',
    payments: '/api/teacher/payments',
    resources: '/api/teacher/resources',
    observations: '/api/teacher/observations',
    callern: '/api/callern/teacher',
    videoManagement: '/api/teacher/videos',
  },
  
  // =============== STUDENT ENDPOINTS ===============
  student: {
    dashboard: '/api/student/dashboard',
    courses: '/api/student/courses',
    sessions: '/api/student/sessions',
    homework: '/api/student/homework',
    achievements: '/api/gamification/student',
    aiConversation: '/api/ai-study-partner/student',
    virtualMall: '/api/student/virtual-mall',
    bookCatalog: '/api/book-ecommerce/student',
    cart: '/api/book-ecommerce/cart',
    orders: '/api/book-ecommerce/student/orders',
    payments: '/api/student/payments',
    profile: '/api/student/profile',
    tutors: '/api/student/tutors',
    moodLearning: '/api/advanced/mood-learning',
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