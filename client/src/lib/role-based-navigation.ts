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
  { path: "/dashboard", icon: "Home", label: t('dashboard'), roles: ["Student"] },
  { path: "/courses", icon: "BookOpen", label: t('courses'), roles: ["Student"] },
  { path: "/tutors", icon: "Users", label: t('findTutors'), roles: ["Student"] },
  { path: "/sessions", icon: "Video", label: t('liveSessions'), roles: ["Student"] },
  { path: "/homework", icon: "ClipboardList", label: t('homework'), roles: ["Student"] },
  { path: "/messages", icon: "MessageSquare", label: t('messages'), roles: ["Student"] },
  { path: "/progress", icon: "TrendingUp", label: t('progress'), roles: ["Student"] },
  { path: "/wallet", icon: "CreditCard", label: "کیف پول / Credits", roles: ["Student"] },
  { path: "/referrals", icon: "Share2", label: "سیستم معرفی", roles: ["Student"] },
];

// Teacher/Tutor navigation
export const getTeacherNavigation = (t: any): NavigationItem[] => [
  { path: "/teacher/dashboard", icon: "Home", label: t('dashboard'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/classes", icon: "Users", label: t('myClasses'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/schedule", icon: "Calendar", label: t('schedule'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/homework", icon: "ClipboardCheck", label: t('assignments'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/students", icon: "GraduationCap", label: t('students'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/resources", icon: "FileText", label: t('resources'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/reports", icon: "BarChart", label: t('reports'), roles: ["Teacher/Tutor"] },
];

// Institute Management Platform (IMP) navigation - Admin/Supervisor
export const getInstituteManagementNavigation = (t: any): NavigationItem[] => [
  // Student Information System (SIS)
  { path: "/admin/students", icon: "Users", label: t('studentInformationSystem'), roles: ["Admin", "Supervisor"] },
  
  // Course & Curriculum Management
  { path: "/admin/courses", icon: "BookOpen", label: t('courseManagement'), roles: ["Admin", "Supervisor", "Teacher/Tutor"] },
  
  // Class Scheduling & Management
  { path: "/admin/classes", icon: "Calendar", label: t('classScheduling'), roles: ["Admin", "Supervisor"] },
  
  // Teacher & Staff Management
  { path: "/admin/teachers", icon: "GraduationCap", label: t('teacherManagement'), roles: ["Admin", "Supervisor"] },
  
  // Financial Management & Billing
  { path: "/admin/financial", icon: "DollarSign", label: t('financialManagement'), roles: ["Admin", "Accountant"] },
  
  // Advanced Reporting & Analytics
  { path: "/admin/reports", icon: "BarChart", label: t('reportsAnalytics'), roles: ["Admin", "Supervisor"] },
  
  // Iranian Market Compliance Settings
  { path: "/admin/iranian-compliance", icon: "Settings", label: "Iranian Compliance", roles: ["Admin"] },
  
  // Communication & Collaboration Tools
  { path: "/admin/communications", icon: "MessageCircle", label: t('communicationCenter'), roles: ["Admin", "Supervisor"] },
  
  // Quality Assurance & Supervision
  { path: "/admin/supervision", icon: "Eye", label: t('qualityAssurance'), roles: ["Supervisor", "Admin"] },
];

// Lead Management & Call Center CRM
export const getCallCenterNavigation = (t: any): NavigationItem[] => [
  { path: "/callcenter/leads", icon: "UserPlus", label: t('leadManagement'), roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/calls", icon: "Phone", label: t('callLogs'), roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/prospects", icon: "Target", label: t('prospects'), roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/campaigns", icon: "Megaphone", label: t('campaigns'), roles: ["Call Center Agent", "Admin"] },
];

// Mentor-specific navigation
export const getMentorNavigation = (t: any): NavigationItem[] => [
  { path: "/mentor/dashboard", icon: "Home", label: t('dashboard'), roles: ["Mentor"] },
  { path: "/mentor/students", icon: "Users", label: t('mentees'), roles: ["Mentor"] },
  { path: "/mentor/sessions", icon: "Calendar", label: t('mentoringSessions'), roles: ["Mentor"] },
  { path: "/mentor/progress", icon: "TrendingUp", label: t('progressTracking'), roles: ["Mentor"] },
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
    case "Supervisor":
      return [
        ...getInstituteManagementNavigation(t),
        ...getCallCenterNavigation(t)
      ];
    case "Call Center Agent":
      return getCallCenterNavigation(t);
    case "Accountant":
      return getInstituteManagementNavigation(t).filter(item => 
        item.roles.includes("Accountant") || item.roles.includes("Admin")
      );
    default:
      return getStudentNavigation(t);
  }
};

// Check if user has access to a specific route
export const hasAccess = (userRole: string, routePath: string, navigationItems: NavigationItem[]): boolean => {
  const item = navigationItems.find(nav => nav.path === routePath);
  return item ? item.roles.includes(userRole) : false;
};