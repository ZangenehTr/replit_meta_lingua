// Role-based access control system for Meta Lingua Institute
export type UserRole = 'admin' | 'teacher' | 'student' | 'mentor' | 'supervisor' | 'call_center' | 'accountant' | 'manager';

interface Permission {
  canView: string[];
  canEdit: string[];
  canDelete: string[];
  canCreate: string[];
  
  // Role-specific powers (optional)
  systemConfig?: boolean;
  userManagement?: boolean;
  financialControl?: boolean;
  auditAccess?: boolean;
  globalSettings?: boolean;
  
  teamManagement?: boolean;
  performanceReports?: boolean;
  businessAnalytics?: boolean;
  
  qualityAssurance?: boolean;
  teacherEvaluation?: boolean;
  complianceMonitoring?: boolean;
  
  gradeManagement?: boolean;
  contentCreation?: boolean;
  studentCommunication?: boolean;
  
  goalSetting?: boolean;
  progressTracking?: boolean;
  motivationalSupport?: boolean;
  
  leadManagement?: boolean;
  customerCommunication?: boolean;
  salesTracking?: boolean;
  
  financialReporting?: boolean;
  paymentProcessing?: boolean;
  taxCompliance?: boolean;
  
  learningAccess?: boolean;
  progressViewing?: boolean;
  courseFeedback?: boolean;
}

// Enhanced RBAC based on industry best practices
export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canView: ['*'], // Full system access
    canEdit: ['*'],
    canDelete: ['*'],
    canCreate: ['*'],
    // Admin-specific powers
    systemConfig: true,
    userManagement: true,
    financialControl: true,
    auditAccess: true,
    globalSettings: true
  },
  manager: {
    canView: ['students', 'teachers', 'courses', 'payments', 'reports', 'leads', 'sessions', 'analytics'],
    canEdit: ['students', 'teachers', 'courses', 'payments', 'leads', 'schedules'],
    canDelete: ['leads', 'draft_courses'],
    canCreate: ['students', 'teachers', 'courses', 'leads', 'sessions', 'reports'],
    // Manager-specific powers
    teamManagement: true,
    performanceReports: true,
    businessAnalytics: true
  },
  supervisor: {
    canView: ['teacher_performance', 'quality_metrics', 'compliance_reports', 'audit_trails', 'class_observations', 'students', 'teachers', 'courses', 'payments', 'leads', 'callern_management', 'sessions', 'analytics'],
    canEdit: ['teacher_evaluations', 'quality_standards', 'compliance_settings', 'students', 'teachers', 'courses', 'teacher_assignments', 'callern_availability', 'leads', 'schedules'],
    canDelete: ['duplicate_leads'],
    canCreate: ['evaluation_reports', 'quality_audits', 'compliance_checks', 'students', 'teachers', 'courses', 'teacher_assignments', 'sessions', 'reports'],
    // Supervisor-specific powers
    qualityAssurance: true,
    teacherEvaluation: true,
    complianceMonitoring: true
  },
  teacher: {
    canView: ['own_students', 'own_courses', 'own_sessions', 'class_analytics', 'student_progress'],
    canEdit: ['own_courses', 'grades', 'assignments', 'class_schedule', 'teaching_materials'],
    canDelete: ['own_assignments', 'draft_materials'],
    canCreate: ['assignments', 'lessons', 'progress_reports', 'parent_communications'],
    // Teacher-specific powers
    gradeManagement: true,
    contentCreation: true,
    studentCommunication: true
  },
  mentor: {
    canView: ['assigned_students', 'learning_progress', 'goal_tracking', 'mentorship_analytics', 'leads', 'follow_up_leads'],
    canEdit: ['student_goals', 'progress_notes', 'recommendations', 'mentorship_plans', 'lead_follow_up'],
    canDelete: [],
    canCreate: ['goal_plans', 'progress_updates', 'motivation_content', 'achievement_rewards'],
    // Mentor-specific powers
    goalSetting: true,
    progressTracking: true,
    motivationalSupport: true
  },
  call_center: {
    canView: ['leads', 'conversion_metrics', 'communication_history', 'sales_funnel', 'customer_journey'],
    canEdit: ['lead_status', 'contact_information', 'follow_up_schedules', 'communication_logs'],
    canDelete: ['duplicate_leads'],
    canCreate: ['new_leads', 'follow_up_tasks', 'communication_records', 'conversion_reports'],
    // Call Center-specific powers
    leadManagement: true,
    customerCommunication: true,
    salesTracking: true
  },
  accountant: {
    canView: ['financial_data', 'payment_records', 'invoices', 'tax_reports', 'revenue_analytics'],
    canEdit: ['invoices', 'payment_status', 'financial_records', 'tax_settings'],
    canDelete: ['draft_invoices'],
    canCreate: ['invoices', 'financial_reports', 'tax_documents', 'audit_trails'],
    // Accountant-specific powers
    financialReporting: true,
    paymentProcessing: true,
    taxCompliance: true
  },
  student: {
    canView: ['own_profile', 'enrolled_courses', 'progress_tracking', 'achievements', 'payment_history'],
    canEdit: ['profile_settings', 'learning_preferences', 'homework_submissions'],
    canDelete: ['own_notes'],
    canCreate: ['homework_submissions', 'course_feedback', 'learning_notes'],
    // Student-specific powers
    learningAccess: true,
    progressViewing: true,
    courseFeedback: true
  }
};

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  admin: '/dashboard',
  manager: '/manager',
  supervisor: '/supervisor', 
  teacher: '/teacher',
  mentor: '/mentor',
  call_center: '/call-center',
  accountant: '/accounting',
  student: '/dashboard'
};

export function hasPermission(userRole: UserRole, action: 'view' | 'edit' | 'delete' | 'create', resource: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const actionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof Permission;
  const allowedResources = permissions[actionKey] as string[];
  
  return Array.isArray(allowedResources) && (allowedResources.includes('*') || allowedResources.includes(resource));
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Public routes
  const publicRoutes = ['/auth', '/demo'];
  if (publicRoutes.includes(route)) return true;
  
  // Role-specific route access
  const allowedRoutes = {
    admin: ['/admin', '/dashboard', '/manager', '/supervisor', '/teacher', '/mentor', '/call-center', '/callcenter', '/accounting'],
    manager: ['/manager', '/dashboard', '/supervisor', '/teacher'],
    supervisor: ['/supervisor', '/dashboard', '/teacher', '/callcenter'],
    teacher: ['/teacher', '/dashboard'],
    mentor: ['/mentor', '/dashboard', '/callcenter'],
    call_center: ['/call-center', '/callcenter', '/dashboard'],
    accountant: ['/accounting', '/dashboard'],
    student: ['/dashboard']
  };
  
  return allowedRoutes[userRole]?.includes(route) || false;
}

export function getDefaultRoute(userRole: UserRole): string {
  return DASHBOARD_ROUTES[userRole] || '/dashboard';
}

// Iranian-specific role configurations
export const IRANIAN_COMPLIANCE_ROLES = {
  tax_officer: {
    canView: ['financial_reports', 'tax_documents', 'invoices'],
    canEdit: ['tax_settings'],
    canDelete: [],
    canCreate: ['tax_reports']
  },
  compliance_officer: {
    canView: ['all_records', 'audit_logs', 'compliance_reports'],
    canEdit: ['compliance_settings'],
    canDelete: [],
    canCreate: ['compliance_reports', 'audit_entries']
  }
};

// Permission helpers for Iranian market features
export function canAccessShetabPayments(userRole: UserRole): boolean {
  return hasPermission(userRole, 'view', 'payments') || userRole === 'accountant';
}

export function canManageTomanCurrency(userRole: UserRole): boolean {
  return ['admin', 'manager', 'accountant'].includes(userRole);
}

export function canAccessKavenegarSMS(userRole: UserRole): boolean {
  return ['admin', 'manager', 'call_center', 'teacher'].includes(userRole);
}