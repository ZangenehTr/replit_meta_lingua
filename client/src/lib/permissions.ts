// Role-based access control system for Meta Lingua Institute
export type UserRole = 'admin' | 'teacher' | 'student' | 'mentor' | 'supervisor' | 'call_center' | 'accountant' | 'manager';

interface Permission {
  canView: string[];
  canEdit: string[];
  canDelete: string[];
  canCreate: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canView: ['*'], // Full access
    canEdit: ['*'],
    canDelete: ['*'],
    canCreate: ['*']
  },
  manager: {
    canView: ['students', 'teachers', 'courses', 'payments', 'reports', 'leads', 'sessions'],
    canEdit: ['students', 'teachers', 'courses', 'payments', 'leads'],
    canDelete: ['leads'],
    canCreate: ['students', 'teachers', 'courses', 'leads', 'sessions']
  },
  supervisor: {
    canView: ['students', 'teachers', 'courses', 'sessions', 'reports', 'attendance'],
    canEdit: ['students', 'attendance', 'sessions'],
    canDelete: [],
    canCreate: ['sessions', 'attendance']
  },
  teacher: {
    canView: ['own_students', 'own_courses', 'own_sessions', 'attendance', 'homework'],
    canEdit: ['own_sessions', 'attendance', 'homework', 'grades'],
    canDelete: [],
    canCreate: ['homework', 'sessions', 'attendance']
  },
  mentor: {
    canView: ['assigned_students', 'progress', 'sessions', 'homework'],
    canEdit: ['student_progress', 'homework_feedback'],
    canDelete: [],
    canCreate: ['progress_notes', 'recommendations']
  },
  call_center: {
    canView: ['leads', 'students', 'communication_logs'],
    canEdit: ['leads', 'communication_logs', 'student_contact'],
    canDelete: [],
    canCreate: ['leads', 'communication_logs', 'follow_ups']
  },
  accountant: {
    canView: ['payments', 'invoices', 'financial_reports', 'students'],
    canEdit: ['invoices', 'payments', 'financial_records'],
    canDelete: [],
    canCreate: ['invoices', 'payment_records']
  },
  student: {
    canView: ['own_profile', 'own_courses', 'own_sessions', 'own_homework', 'own_payments'],
    canEdit: ['own_profile', 'homework_submissions'],
    canDelete: [],
    canCreate: ['homework_submissions', 'session_feedback']
  }
};

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  admin: '/admin',
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
  const allowedResources = permissions[actionKey];
  
  return allowedResources.includes('*') || allowedResources.includes(resource);
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Public routes
  const publicRoutes = ['/auth', '/demo'];
  if (publicRoutes.includes(route)) return true;
  
  // Role-specific route access
  const allowedRoutes = {
    admin: ['/admin', '/dashboard', '/manager', '/supervisor', '/teacher', '/mentor', '/call-center', '/accounting'],
    manager: ['/manager', '/dashboard', '/supervisor', '/teacher'],
    supervisor: ['/supervisor', '/dashboard', '/teacher'],
    teacher: ['/teacher', '/dashboard'],
    mentor: ['/mentor', '/dashboard'],
    call_center: ['/call-center', '/dashboard'],
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