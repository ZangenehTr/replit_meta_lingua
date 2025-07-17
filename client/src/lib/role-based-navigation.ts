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
  { path: "/dashboard", icon: "Home", label: "Dashboard", roles: ["Student"] },
  { path: "/courses", icon: "BookOpen", label: "Courses", roles: ["Student"] },
  { path: "/video-courses", icon: "Play", label: "Video Courses", roles: ["Student"] },
  { path: "/callern", icon: "Video", label: "Callern Video Calls", roles: ["Student"] },
  { path: "/games", icon: "Gamepad2", label: "Gamification & Games", roles: ["Student"] },
  { path: "/tutors", icon: "Users", label: "Find Tutors", roles: ["Student"] },
  { path: "/sessions", icon: "Calendar", label: "Live Sessions", roles: ["Student"] },
  { path: "/tests", icon: "FileText", label: "Tests & Assessments", roles: ["Student"] },
  { path: "/homework", icon: "ClipboardList", label: "Homework", roles: ["Student"] },
  { path: "/messages", icon: "MessageSquare", label: "Messages", roles: ["Student"] },
  { path: "/progress", icon: "TrendingUp", label: "Progress", roles: ["Student"] },
  { path: "/wallet", icon: "CreditCard", label: "کیف پول / Credits", roles: ["Student"] },
  { path: "/referrals", icon: "Share2", label: "سیستم معرفی", roles: ["Student"] },
];

// Teacher/Tutor navigation
export const getTeacherNavigation = (t: any): NavigationItem[] => [
  { path: "/teacher/dashboard", icon: "Home", label: t('dashboard'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/classes", icon: "Users", label: t('teacher.myClasses'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/schedule", icon: "Calendar", label: t('teacher.schedule'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/assignments", icon: "ClipboardCheck", label: t('teacher.assignments'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/students", icon: "GraduationCap", label: t('teacher.students'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/resources", icon: "FileText", label: t('teacher.resources'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/reports", icon: "BarChart", label: t('teacher.reports'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/payments", icon: "DollarSign", label: t('teacher.payments'), roles: ["Teacher/Tutor"] },
];

// Institute Management Platform (IMP) navigation - Admin/Supervisor
export const getInstituteManagementNavigation = (t: any): NavigationItem[] => [
  // Student Information System (SIS)
  { path: "/admin/students", icon: "Users", label: "Student Information System", roles: ["Admin", "Supervisor"] },
  
  // User Management
  { path: "/admin/user-management", icon: "UserCog", label: "User Management", roles: ["Admin"] },
  
  // Course & Curriculum Management
  { path: "/admin/courses", icon: "BookOpen", label: "Course Management", roles: ["Admin", "Supervisor", "Teacher/Tutor"] },
  
  // Class Scheduling & Management
  { path: "/admin/classes", icon: "Calendar", label: "Class Scheduling", roles: ["Admin", "Supervisor"] },
  
  // Games Management
  { path: "/admin/games-management", icon: "Gamepad2", label: "Games Management", roles: ["Admin", "Supervisor"] },
  
  // Callern Video Call Management
  { path: "/admin/callern-management", icon: "Video", label: "Callern Management", roles: ["Admin", "Supervisor"] },
  
  // Room Management
  { path: "/admin/room-management", icon: "Building2", label: "Room Management", roles: ["Admin", "Supervisor"] },
  
  // Mentor Matching System
  { path: "/admin/mentor-matching", icon: "Users", label: "Mentor Matching", roles: ["Admin"] },
  
  // Teacher-Student Matching
  { path: "/admin/teacher-student-matching", icon: "GraduationCap", label: "Teacher Matching", roles: ["Admin"] },
  
  // Teacher & Staff Management
  { path: "/admin/teachers", icon: "GraduationCap", label: "Teacher Management", roles: ["Admin", "Supervisor"] },
  
  // Financial Management & Billing
  { path: "/admin/financial", icon: "DollarSign", label: "Financial Management", roles: ["Admin", "Accountant"] },
  
  // Advanced Reporting & Analytics
  { path: "/admin/reports", icon: "BarChart", label: "Reports & Analytics", roles: ["Admin", "Supervisor"] },
  
  // Iranian Market Compliance Settings
  { path: "/admin/iranian-compliance", icon: "Settings", label: "Third Party Settings", roles: ["Admin"] },
  
  // AI Services Management
  { path: "/admin/ai-services", icon: "Bot", label: "AI Services", roles: ["Admin"] },
  
  // Communication & Collaboration Tools
  { path: "/admin/communications", icon: "MessageCircle", label: "Communication Center", roles: ["Admin", "Supervisor"] },
  
  // Quality Assurance & Supervision
  { path: "/admin/supervision", icon: "Eye", label: "Quality Assurance", roles: ["Supervisor", "Admin"] },
  
  // Enterprise Features
  { path: "/admin/teacher-payments", icon: "DollarSign", label: "Teacher Payments", roles: ["Admin", "Accountant"] },
  { path: "/admin/white-label", icon: "Building2", label: "White-Label Management", roles: ["Admin"] },
  { path: "/admin/sms-settings", icon: "Send", label: "SMS Management", roles: ["Admin", "Supervisor"] },
  { path: "/admin/campaign-management", icon: "Megaphone", label: "Campaign Management", roles: ["Admin", "Call Center Agent"] },
  { path: "/admin/website-builder", icon: "Globe", label: "Website Builder", roles: ["Admin"] },
];

// Lead Management & Call Center CRM
export const getCallCenterNavigation = (t: any): NavigationItem[] => [
  { path: "/callcenter/leads", icon: "UserPlus", label: "Lead Management", roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/calls", icon: "Phone", label: "Call Logs", roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/prospects", icon: "Target", label: "Prospects", roles: ["Call Center Agent", "Admin"] },
  { path: "/callcenter/campaigns", icon: "Megaphone", label: "Campaigns", roles: ["Call Center Agent", "Admin"] },
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