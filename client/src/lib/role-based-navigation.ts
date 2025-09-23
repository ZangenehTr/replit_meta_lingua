// Role-based navigation system according to PRD specifications
// PRD User Roles: Admin, Teacher/Tutor, Mentor, Student, Supervisor, Call Center Agent, Accountant

import { generateDynamicNavigation, NavigationItem as DynamicNavItem } from '@shared/subsystem-permissions';

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
  { path: "/homework", icon: "ClipboardList", label: t('common:navigation.assignments'), roles: ["Student"] },
  { path: "/messages", icon: "MessageSquare", label: t('common:navigation.chat'), roles: ["Student"] },
  { path: "/progress", icon: "TrendingUp", label: t('common:navigation.progress'), roles: ["Student"] },
  { path: "/wallet", icon: "CreditCard", label: t('common:navigation.walletCredits'), roles: ["Student"] },
  { path: "/referrals", icon: "Share2", label: t('common:navigation.referralSystem'), roles: ["Student"] },
];

// Teacher/Tutor navigation
export const getTeacherNavigation = (t: any): NavigationItem[] => [
  { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/callern", icon: "Video", label: t('common:navigation.callernVideoCalls'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/classes", icon: "Users", label: t('common:navigation.myClasses'), roles: ["Teacher/Tutor"] },
  { path: "/admin/video-courses", icon: "Play", label: t('common:navigation.videoCourses'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/schedule", icon: "Calendar", label: t('common:navigation.classScheduling'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/assignments", icon: "ClipboardCheck", label: t('common:navigation.assignments'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/students", icon: "GraduationCap", label: t('common:navigation.students'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/resources", icon: "FileText", label: t('common:navigation.resources'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/reports", icon: "BarChart", label: t('common:navigation.reports'), roles: ["Teacher/Tutor"] },
  { path: "/teacher/payments", icon: "DollarSign", label: t('common:navigation.payments'), roles: ["Teacher/Tutor"] },
];

// Institute Management Platform (IMP) navigation - Admin/Supervisor
export const getInstituteManagementNavigation = (t: any): NavigationItem[] => {
  const items = [
    // Student Information System (SIS)
    { path: "/admin/students", icon: "Users", label: t('common:navigation.studentInformationSystem'), roles: ["Admin", "Supervisor"] },
    
    // User Management
    { path: "/admin/user-management", icon: "UserCog", label: t('common:navigation.userManagement'), roles: ["Admin"] },
    
    // Course & Curriculum Management
    { path: "/admin/courses", icon: "BookOpen", label: t('common:navigation.courseManagement'), roles: ["Admin", "Supervisor", "Teacher/Tutor"] },
    
    // Video Courses Management
    { path: "/admin/video-courses", icon: "Play", label: t('common:navigation.videoCourses'), roles: ["Admin", "Supervisor", "Teacher/Tutor"] },
    
    // Class Scheduling & Management
    { path: "/admin/classes", icon: "Calendar", label: t('common:navigation.classScheduling'), roles: ["Admin", "Supervisor"] },
    
    // Games Management
    { path: "/admin/games-management", icon: "Gamepad2", label: t('common:navigation.gamesManagement'), roles: ["Admin", "Supervisor"] },
    
    // Game Access Control
    { path: "/admin/game-access-control", icon: "Settings", label: t('common:navigation.gameAccessControl'), roles: ["Admin"] },
    
    // Callern Video Call Management
    { path: "/admin/callern-management", icon: "Video", label: t('common:navigation.callernManagement'), roles: ["Admin", "Supervisor"] },
    
    // Learning Roadmap Designer
    { path: "/admin/roadmap-designer", icon: "Map", label: t('common:navigation.roadmapDesigner') || 'Learning Roadmaps', roles: ["Admin", "Teacher/Tutor"] },
  
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
  
  // AI Training Management
  { path: "/admin/ai-training", icon: "Bot", label: t('common:navigation.aiTraining') || 'AI Model Training', roles: ["Admin"] },
  
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
  { path: "/admin/subsystem-permissions", icon: "Shield", label: t('common:navigation.subsystemPermissions') || 'Subsystem Permissions', roles: ["Admin"] },
  { path: "/admin/website-builder", icon: "Globe", label: t('common:navigation.websiteBuilder'), roles: ["Admin"] },
  ];
  
  console.log('Institute management navigation items:', items.filter(item => item.path.includes('callern')));
  return items;
};

// Lead Management & Call Center CRM
export const getCallCenterNavigation = (t: any, userRole?: string): NavigationItem[] => {
  // For admin and supervisor, use admin routes. For call center agents, use callcenter routes
  const isAdmin = userRole && ['admin', 'supervisor'].includes(userRole.toLowerCase());
  const basePath = isAdmin ? '/admin' : '/callcenter';
  
  return [
    { path: "/callcenter/unified-workflow", icon: "Workflow", label: t('common:navigation.unifiedWorkflow') || 'Unified Workflow', roles: ["Call Center Agent", "Admin", "Supervisor", "Mentor"] },
    { path: `${basePath}/leads`, icon: "UserPlus", label: t('common:navigation.leadManagement'), roles: ["Call Center Agent", "Admin", "Supervisor"] },
    { path: `${basePath}/calls`, icon: "Phone", label: t('common:navigation.callLogs'), roles: ["Call Center Agent", "Admin"] },
    { path: `${basePath}/prospects`, icon: "Target", label: t('common:navigation.prospects'), roles: ["Call Center Agent", "Admin"] },
    { path: `${basePath}/campaigns`, icon: "Megaphone", label: t('common:navigation.campaigns'), roles: ["Call Center Agent", "Admin"] },
  ];
};

// Mentor-specific navigation
export const getMentorNavigation = (t: any): NavigationItem[] => [
  { path: "/dashboard", icon: "Home", label: t('common:navigation.dashboard'), roles: ["Mentor"] },
  { path: "/mentor/students", icon: "Users", label: t('common:navigation.mentees'), roles: ["Mentor"] },
  { path: "/mentor/sessions", icon: "Calendar", label: t('common:navigation.mentoringSessions'), roles: ["Mentor"] },
  { path: "/mentor/progress", icon: "TrendingUp", label: t('common:navigation.progressTracking'), roles: ["Mentor"] },
];

// Convert dynamic navigation items to component-compatible format
const convertDynamicToNavigation = (dynamicItems: DynamicNavItem[], t: any): NavigationItem[] => {
  return dynamicItems.map(item => ({
    path: item.path,
    icon: item.icon,
    label: item.nameEn || item.label || 'Navigation Item',
    roles: item.roles
  }));
};

// Get navigation based on user role using dynamic generation
export const getNavigationForRole = (role: string, t: any): NavigationItem[] => {
  // Normalize role to handle both lowercase and capitalized versions
  const normalizedRole = role.toLowerCase();
  
  // Map normalized roles to exact role names used in permissions
  const roleMapping: Record<string, string> = {
    "student": "Student",
    "teacher/tutor": "Teacher/Tutor", 
    "teacher": "Teacher/Tutor",
    "tutor": "Teacher/Tutor",
    "mentor": "Mentor",
    "admin": "Admin",
    "supervisor": "Supervisor",
    "call center agent": "Call Center Agent",
    "callcenter": "Call Center Agent",
    "call center": "Call Center Agent",
    "accountant": "Accountant"
  };

  const mappedRole = roleMapping[normalizedRole] || "Student";
  
  // Debug logging to see what role is being processed
  console.log('Processing navigation for role:', role, 'normalized:', normalizedRole, 'mapped:', mappedRole);
  
  // Generate dynamic navigation based on SUBSYSTEM_TREE and role permissions
  const dynamicItems = generateDynamicNavigation(mappedRole, t);
  const navigationItems = convertDynamicToNavigation(dynamicItems, t);
  
  // Add dashboard as the first item for all roles except students
  if (normalizedRole !== "student") {
    const dashboardItem = {
      path: "/dashboard",
      icon: "Home", 
      label: t ? t('common:navigation.dashboard') : 'Dashboard',
      roles: [mappedRole]
    };
    
    // Remove any existing dashboard item and add it at the beginning
    const filteredItems = navigationItems.filter(item => item.path !== "/dashboard");
    navigationItems.splice(0, 0, dashboardItem);
    return [dashboardItem, ...filteredItems];
  }
  
  console.log(`Generated ${navigationItems.length} navigation items for role ${mappedRole}:`, 
    navigationItems.map(item => ({ path: item.path, label: item.label })));
  
  return navigationItems;
};

// Check if user has access to a specific route
export const hasAccess = (userRole: string, routePath: string, navigationItems: NavigationItem[]): boolean => {
  const item = navigationItems.find(nav => nav.path === routePath);
  return item ? item.roles.includes(userRole) : false;
};