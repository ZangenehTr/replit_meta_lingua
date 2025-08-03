// Role-based navigation system according to PRD specifications
// PRD User Roles: Admin, Teacher/Tutor, Mentor, Student, Supervisor, Call Center Agent, Accountant

export interface NavigationItem {
  path: string;
  icon: any;
  label: string;
  badge?: number;
  roles: string[];
}

// Student-facing platform navigation
export const getStudentNavigation = (t: any): NavigationItem[] => [
  { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Student"] },
  { path: "/courses", icon: "BookOpen", label: t('common:navigation.courses'), roles: ["Student"] },
  { path: "/video-courses", icon: "Play", label: t('common:navigation.videoCourses'), roles: ["Student"] },
  { path: "/callern", icon: "Video", label: t('common:navigation.callernVideoCalls'), roles: ["Student"] },
  { path: "/games", icon: "Gamepad2", label: t('common:navigation.gamificationGames'), roles: ["Student"] },
  { path: "/tutors", icon: "Users", label: t('common:navigation.findTutors'), roles: ["Student"] },
  { path: "/sessions", icon: "Calendar", label: t('common:navigation.liveSessions'), roles: ["Student"] },
  { path: "/tests", icon: "FileText", label: t('common:navigation.testsAssessments'), roles: ["Student"] },
  { path: "/homework", icon: "ClipboardList", label: t('common:navigation.homework'), roles: ["Student"] },
  { path: "/messages", icon: "MessageSquare", label: t('common:navigation.messages'), roles: ["Student"] },
  { path: "/progress", icon: "TrendingUp", label: t('common:navigation.progress'), roles: ["Student"] },
  { path: "/wallet", icon: "CreditCard", label: t('common:navigation.walletCredits'), roles: ["Student"] },
  { path: "/referrals", icon: "Share2", label: t('common:navigation.referralSystem'), roles: ["Student"] },
];

// Teacher/Tutor navigation
export const getTeacherNavigation = (t: any): NavigationItem[] => [
  { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/classes", icon: "Users", label: t('common:navigation.myClasses'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/schedule", icon: "Calendar", label: t('common:navigation.schedule'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/assignments", icon: "ClipboardCheck", label: t('common:navigation.assignments'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/students", icon: "GraduationCap", label: t('common:navigation.students'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/resources", icon: "FileText", label: t('common:navigation.resources'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/reports", icon: "BarChart", label: t('common:navigation.reports'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/payments", icon: "DollarSign", label: t('common:navigation.payments'), roles: ["Teacher/Tutor"] },
];

// Institute Management Platform (IMP) navigation - Admin/Supervisor
export const getInstituteManagementNavigation = (t: any): NavigationItem[] => [
  
  // Student Information System (SIS)
  { path: "/admin/students", icon: "Users", label: t('common:navigation.studentInformationSystem'), roles: ["Admin", "Supervisor"] },
  
  // User Management
  { path: "/admin/user-management", icon: "UserCog", label: t('common:navigation.userManagement'), roles: ["Admin"] },
  
  // Course & Curriculum Management
  { path: "/admin/courses", icon: "BookOpen", label: t('common:navigation.courseManagement'), roles: ["Admin", "Supervisor", "Teacher/Tutor"] },
  
  // Class Scheduling & Management
  { path: "/admin/classes", icon: "Calendar", label: t('common:navigation.classScheduling'), roles: ["Admin", "Supervisor"] },
  
  // Games Management
  { path: "/admin/games-management", icon: "Gamepad2", label: t('common:navigation.gamesManagement'), roles: ["Admin", "Supervisor"] },
  
  // Callern Video Call Management
  { path: "/admin/callern-management", icon: "Video", label: t('common:navigation.callernManagement'), roles: ["Admin", "Supervisor"] },
  
  // Room Management
  { path: "/admin/room-management", icon: "Building2", label: t('common:navigation.roomManagement'), roles: ["Admin", "Supervisor"] },
  
  // Mentor Matching System
  { path: "/admin/mentor-matching", icon: "Users", label: t('common:navigation.mentorMatching'), roles: ["Admin"] },
  
  // Teacher-Student Matching
  { path: "/admin/teacher-student-matching", icon: "GraduationCap", label: t('common:navigation.teacherMatching'), roles: ["Admin"] },
  
  // Teacher & Staff Management
  { path: "/admin/teachers", icon: "GraduationCap", label: t('common:navigation.teacherManagement'), roles: ["Admin", "Supervisor"] },
  
  // Financial Management & Billing
  { path: "/admin/financial", icon: "DollarSign", label: t('common:navigation.financialManagement'), roles: ["Admin", "Accountant", "Supervisor"] },
  
  // Advanced Reporting & Analytics
  { path: "/admin/reports", icon: "BarChart", label: t('common:navigation.reportsAnalytics'), roles: ["Admin", "Supervisor"] },
  
  // Iranian Market Compliance Settings
  { path: "/admin/iranian-compliance", icon: "Settings", label: t('common:navigation.thirdPartySettings'), roles: ["Admin"] },
  
  // AI Services Management
  { path: "/admin/ai-services", icon: "Bot", label: t('common:navigation.aiServices'), roles: ["Admin"] },
  
  // Communication & Collaboration Tools
  { path: "/admin/communications", icon: "MessageCircle", label: t('common:navigation.communicationCenter'), roles: ["Admin", "Supervisor"] },
  
  // Quality Assurance & Supervision
  { path: "/admin/supervision", icon: "Eye", label: t('common:navigation.qualityAssurance'), roles: ["Supervisor", "Admin"] },
  
  // Schedule Review System
  { path: "/supervisor/schedule-review", icon: "Calendar", label: t('common:navigation.scheduleReview'), roles: ["Supervisor", "Admin"] },
  
  // Enterprise Features
  { path: "/admin/teacher-payments", icon: "DollarSign", label: t('common:navigation.teacherPayments'), roles: ["Admin", "Accountant"] },
  { path: "/admin/white-label", icon: "Building2", label: t('common:navigation.whiteLabelManagement'), roles: ["Admin"] },
  { path: "/admin/sms-settings", icon: "Send", label: t('common:navigation.smsManagement'), roles: ["Admin", "Supervisor"] },
  { path: "/admin/campaign-management", icon: "Megaphone", label: t('common:navigation.campaignManagement'), roles: ["Admin", "Call Center Agent"] },
  { path: "/admin/website-builder", icon: "Globe", label: t('common:navigation.websiteBuilder'), roles: ["Admin"] },
];

// Lead Management & Call Center CRM
export const getCallCenterNavigation = (t: any): NavigationItem[] => [
  { path: "/callcenter/leads", icon: "UserPlus", label: t('common:navigation.leadManagement'), roles: ["Call Center Agent", "Admin", "Supervisor"] },
  { path: "/callcenter/calls", icon: "Phone", label: t('common:navigation.callLogs'), roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/prospects", icon: "Target", label: t('common:navigation.prospects'), roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/campaigns", icon: "Megaphone", label: t('common:navigation.campaigns'), roles: ["Call Center Agent", "Admin"] },
];

// Mentor-specific navigation
export const getMentorNavigation = (t: any): NavigationItem[] => [
  { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Mentor"] },
  { path: "/mentor/students", icon: "Users", label: t('common:navigation.mentees'), roles: ["Mentor"] },
  { path: "/mentor/sessions", icon: "Calendar", label: t('common:navigation.mentoringSessions'), roles: ["Mentor"] },
  { path: "/mentor/progress", icon: "TrendingUp", label: t('common:navigation.progressTracking'), roles: ["Mentor"] },
];

// Get navigation based on user role
export const getNavigationForRole = (role: string, t: any): NavigationItem[] => {
  switch (role) {
    case "Student":
      return getStudentNavigation(t);
    case "Teacher/Tutor":
      return getTeacherNavigation(t);
    case "Mentor":
      return getMentorNavigation(t);
    case "Admin":
      return [
        // Dashboard - Primary navigation item for Admin (unified dashboard)
        { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Admin"] },
        ...getInstituteManagementNavigation(t),
        ...getCallCenterNavigation(t)
      ];
    case "Supervisor":
      return [
        // Dashboard - Primary navigation item for Supervisor (unified dashboard)
        { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Supervisor"] },
        ...getInstituteManagementNavigation(t),
        ...getCallCenterNavigation(t)
      ];
    case "Call Center Agent":
      return [
        // Dashboard - Primary navigation item for Call Center Agent (unified dashboard)
        { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Call Center Agent"] },
        ...getCallCenterNavigation(t)
      ];
    case "Accountant":
      return [
        // Dashboard - Primary navigation item for Accountant (unified dashboard)
        { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Accountant"] },
        ...getInstituteManagementNavigation(t).filter(item => 
          item.roles.includes("Accountant") || item.roles.includes("Admin")
        )
      ];
    default:
      return getStudentNavigation(t);
  }
};

// Check if user has access to a specific route
export const hasAccess = (userRole: string, routePath: string, navigationItems: NavigationItem[]): boolean => {
  const item = navigationItems.find(nav => nav.path === routePath);
  return item ? item.roles.includes(userRole) : false;
};