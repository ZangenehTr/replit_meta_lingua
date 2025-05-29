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
  { path: "/dashboard", icon: "Home", label: t('dashboard'), roles: ["student"] },
  { path: "/courses", icon: "BookOpen", label: t('courses'), roles: ["student"] },
  { path: "/tutors", icon: "Users", label: t('findTutors'), roles: ["student"] },
  { path: "/sessions", icon: "Video", label: t('liveSessions'), roles: ["student"] },
  { path: "/homework", icon: "ClipboardList", label: t('homework'), roles: ["student"] },
  { path: "/messages", icon: "MessageSquare", label: t('messages'), roles: ["student"] },
  { path: "/progress", icon: "TrendingUp", label: t('progress'), roles: ["student"] },
  { path: "/payment", icon: "CreditCard", label: t('credits'), roles: ["student"] },
];

// Teacher/Tutor navigation
export const getTeacherNavigation = (t: any): NavigationItem[] => [
  { path: "/teacher/dashboard", icon: "Home", label: t('dashboard'), roles: ["teacher"] },
  { path: "/teacher/classes", icon: "Users", label: t('myClasses'), roles: ["teacher"] },
  { path: "/teacher/schedule", icon: "Calendar", label: t('schedule'), roles: ["teacher"] },
  { path: "/teacher/homework", icon: "ClipboardCheck", label: t('assignments'), roles: ["teacher"] },
  { path: "/teacher/students", icon: "GraduationCap", label: t('students'), roles: ["teacher"] },
  { path: "/teacher/resources", icon: "FileText", label: t('resources'), roles: ["teacher"] },
  { path: "/teacher/reports", icon: "BarChart", label: t('reports'), roles: ["teacher"] },
];

// Institute Management Platform (IMP) navigation - Admin/Supervisor
export const getInstituteManagementNavigation = (t: any): NavigationItem[] => [
  // Student Information System (SIS)
  { path: "/admin/students", icon: "Users", label: t('studentInformationSystem'), roles: ["admin", "supervisor"] },
  
  // Course & Curriculum Management
  { path: "/admin/courses", icon: "BookOpen", label: t('courseManagement'), roles: ["admin", "supervisor", "teacher"] },
  
  // Class Scheduling & Management
  { path: "/admin/classes", icon: "Calendar", label: t('classScheduling'), roles: ["admin", "supervisor"] },
  
  // Teacher & Staff Management
  { path: "/admin/teachers", icon: "GraduationCap", label: t('teacherManagement'), roles: ["admin", "supervisor"] },
  
  // Financial Management & Billing
  { path: "/admin/financial", icon: "DollarSign", label: t('financialManagement'), roles: ["admin", "accountant"] },
  
  // Advanced Reporting & Analytics
  { path: "/admin/reports", icon: "BarChart", label: t('reportsAnalytics'), roles: ["admin", "supervisor"] },
  
  // Communication & Collaboration Tools
  { path: "/admin/communications", icon: "MessageCircle", label: t('communicationCenter'), roles: ["admin", "supervisor"] },
  
  // Quality Assurance & Supervision
  { path: "/admin/supervision", icon: "Eye", label: t('qualityAssurance'), roles: ["supervisor", "admin"] },
];

// Lead Management & Call Center CRM
export const getCallCenterNavigation = (t: any): NavigationItem[] => [
  { path: "/callcenter/leads", icon: "UserPlus", label: t('leadManagement'), roles: ["call_center", "admin"] },
  { path: "/callcenter/calls", icon: "Phone", label: t('callLogs'), roles: ["call_center", "admin"] },
  { path: "/callcenter/prospects", icon: "Target", label: t('prospects'), roles: ["call_center", "admin"] },
  { path: "/callcenter/campaigns", icon: "Megaphone", label: t('campaigns'), roles: ["call_center", "admin"] },
];

// Mentor-specific navigation
export const getMentorNavigation = (t: any): NavigationItem[] => [
  { path: "/mentor/dashboard", icon: "Home", label: t('dashboard'), roles: ["mentor"] },
  { path: "/mentor/students", icon: "Users", label: t('mentees'), roles: ["mentor"] },
  { path: "/mentor/sessions", icon: "Calendar", label: t('mentoringSessions'), roles: ["mentor"] },
  { path: "/mentor/progress", icon: "TrendingUp", label: t('progressTracking'), roles: ["mentor"] },
];

// Get navigation based on user role
export const getNavigationForRole = (role: string, t: any): NavigationItem[] => {
  switch (role) {
    case "student":
      return getStudentNavigation(t);
    case "teacher":
      return getTeacherNavigation(t);
    case "mentor":
      return getMentorNavigation(t);
    case "admin":
    case "supervisor":
      return [
        ...getInstituteManagementNavigation(t),
        ...getCallCenterNavigation(t)
      ];
    case "call_center":
      return getCallCenterNavigation(t);
    case "accountant":
      return getInstituteManagementNavigation(t).filter(item => 
        item.roles.includes("accountant") || item.roles.includes("admin")
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