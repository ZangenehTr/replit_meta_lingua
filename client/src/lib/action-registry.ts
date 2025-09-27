/**
 * Centralized Action Registry System
 * 
 * This system provides a unified approach to handling all button actions across
 * the MetaLingua application with proper RBAC enforcement, error handling,
 * and cache management.
 */

import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type UserRole = 'Admin' | 'Student' | 'Teacher' | 'Mentor' | 'Supervisor' | 'Accountant' | 'Call Center Agent' | 'Front Desk';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ActionConfig {
  endpoint: string;
  method: HttpMethod;
  requiredRoles: UserRole[];
  cacheKeys: string[];
  optimistic?: boolean;
  skipPermissionCheck?: boolean;
  successMessage?: string;
  errorMessage?: string;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export interface ActionPayload {
  [key: string]: any;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

// ============================================================================
// COMPREHENSIVE ACTION REGISTRY
// ============================================================================

export const actionRegistry: Record<string, ActionConfig> = {
  // ========== AUTHENTICATION ACTIONS ==========
  'auth.login': {
    endpoint: '/api/auth/login',
    method: 'POST',
    requiredRoles: [],
    cacheKeys: ['/api/users/me'],
    skipPermissionCheck: true,
    successMessage: 'Login successful',
    errorMessage: 'Login failed'
  },
  'auth.logout': {
    endpoint: '/api/auth/logout',
    method: 'POST',
    requiredRoles: [],
    cacheKeys: ['/api/users/me'],
    skipPermissionCheck: true,
    successMessage: 'Logged out successfully'
  },
  'auth.register': {
    endpoint: '/api/auth/register',
    method: 'POST',
    requiredRoles: [],
    cacheKeys: ['/api/users/me'],
    skipPermissionCheck: true,
    successMessage: 'Registration successful'
  },
  'auth.forgotPassword': {
    endpoint: '/api/auth/forgot-password',
    method: 'POST',
    requiredRoles: [],
    cacheKeys: [],
    skipPermissionCheck: true,
    successMessage: 'Password reset link sent'
  },
  'auth.resetPassword': {
    endpoint: '/api/auth/reset-password',
    method: 'POST',
    requiredRoles: [],
    cacheKeys: [],
    skipPermissionCheck: true,
    successMessage: 'Password reset successful'
  },

  // ========== ADMIN ACTIONS ==========
  'admin.createUser': {
    endpoint: '/api/admin/users',
    method: 'POST',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/admin/users', '/api/admin/stats'],
    successMessage: 'User created successfully',
    confirmationRequired: true,
    confirmationMessage: 'Are you sure you want to create this user?'
  },
  'admin.updateUser': {
    endpoint: '/api/admin/users',
    method: 'PUT',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/admin/users', '/api/admin/stats'],
    successMessage: 'User updated successfully'
  },
  'admin.deleteUser': {
    endpoint: '/api/admin/users',
    method: 'DELETE',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/admin/users', '/api/admin/stats'],
    successMessage: 'User deleted successfully',
    confirmationRequired: true,
    confirmationMessage: 'Are you sure you want to delete this user? This action cannot be undone.'
  },
  'admin.createCourse': {
    endpoint: '/api/admin/courses',
    method: 'POST',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/courses', '/api/admin/courses', '/api/admin/stats'],
    successMessage: 'Course created successfully'
  },
  'admin.updateCourse': {
    endpoint: '/api/admin/courses',
    method: 'PUT',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/courses', '/api/admin/courses', '/api/admin/stats'],
    successMessage: 'Course updated successfully'
  },
  'admin.deleteCourse': {
    endpoint: '/api/admin/courses',
    method: 'DELETE',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/courses', '/api/admin/courses', '/api/admin/stats'],
    successMessage: 'Course deleted successfully',
    confirmationRequired: true,
    confirmationMessage: 'Are you sure you want to delete this course?'
  },
  'admin.generateTeacherPayroll': {
    endpoint: '/api/admin/teacher-payments/calculate',
    method: 'POST',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/admin/teacher-payments'],
    successMessage: 'Payroll generated successfully'
  },
  'admin.exportFinancialReport': {
    endpoint: '/api/admin/financial/export',
    method: 'GET',
    requiredRoles: ['Admin'],
    cacheKeys: [],
    successMessage: 'Report exported successfully'
  },
  'admin.createTeacher': {
    endpoint: '/api/admin/teachers',
    method: 'POST',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/admin/teachers', '/api/admin/stats'],
    successMessage: 'Teacher created successfully'
  },
  'admin.scheduleObservation': {
    endpoint: '/api/admin/observations',
    method: 'POST',
    requiredRoles: ['Admin'],
    cacheKeys: ['/api/admin/observations'],
    successMessage: 'Observation scheduled successfully'
  },

  // ========== STUDENT ACTIONS ==========
  'student.enrollCourse': {
    endpoint: API_ENDPOINTS.student.enroll,
    method: 'POST',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.courses, API_ENDPOINTS.student.enrollmentStatus],
    optimistic: true,
    successMessage: 'Enrolled in course successfully'
  },
  'student.submitAssignment': {
    endpoint: API_ENDPOINTS.student.assignments,
    method: 'POST',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.assignments],
    successMessage: 'Assignment submitted successfully'
  },
  'student.bookSession': {
    endpoint: API_ENDPOINTS.student.sessions,
    method: 'POST',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.sessions, API_ENDPOINTS.student.upcomingSessions],
    successMessage: 'Session booked successfully'
  },
  'student.cancelSession': {
    endpoint: API_ENDPOINTS.student.sessions,
    method: 'DELETE',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.sessions, API_ENDPOINTS.student.upcomingSessions],
    successMessage: 'Session cancelled successfully',
    confirmationRequired: true,
    confirmationMessage: 'Are you sure you want to cancel this session?'
  },
  'student.makePayment': {
    endpoint: API_ENDPOINTS.student.payments,
    method: 'POST',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.wallet, API_ENDPOINTS.student.payments],
    successMessage: 'Payment processed successfully'
  },
  'student.updateProfile': {
    endpoint: API_ENDPOINTS.student.profile,
    method: 'PUT',
    requiredRoles: ['Student'],
    cacheKeys: ['/api/users/me', API_ENDPOINTS.student.profile],
    successMessage: 'Profile updated successfully'
  },
  'student.purchaseCourse': {
    endpoint: API_ENDPOINTS.student.purchase,
    method: 'POST',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.courses, API_ENDPOINTS.student.wallet],
    successMessage: 'Course purchased successfully',
    confirmationRequired: true,
    confirmationMessage: 'Confirm course purchase?'
  },
  'student.submitTest': {
    endpoint: API_ENDPOINTS.student.testsSubmit,
    method: 'POST',
    requiredRoles: ['Student'],
    cacheKeys: [API_ENDPOINTS.student.tests, API_ENDPOINTS.student.testResults],
    successMessage: 'Test submitted successfully'
  },

  // ========== TEACHER ACTIONS ==========
  'teacher.createClass': {
    endpoint: '/api/teacher/classes',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/classes', '/api/teacher/stats'],
    successMessage: 'Class created successfully'
  },
  'teacher.updateClass': {
    endpoint: '/api/teacher/classes',
    method: 'PUT',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/classes', '/api/teacher/stats'],
    successMessage: 'Class updated successfully'
  },
  'teacher.gradeAssignment': {
    endpoint: '/api/teacher/assignments/grade',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/assignments'],
    successMessage: 'Assignment graded successfully'
  },
  'teacher.markAttendance': {
    endpoint: '/api/teacher/attendance',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/attendance'],
    successMessage: 'Attendance marked successfully'
  },
  'teacher.uploadVideo': {
    endpoint: '/api/teacher/videos',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/videos'],
    successMessage: 'Video uploaded successfully'
  },
  'teacher.createTest': {
    endpoint: '/api/teacher/tests',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/tests'],
    successMessage: 'Test created successfully'
  },
  'teacher.setAvailability': {
    endpoint: '/api/teacher/availability',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/availability'],
    successMessage: 'Availability updated successfully'
  },
  'teacher.sendMessage': {
    endpoint: '/api/teacher/messages',
    method: 'POST',
    requiredRoles: ['Teacher'],
    cacheKeys: ['/api/teacher/messages'],
    successMessage: 'Message sent successfully'
  },

  // ========== MENTOR ACTIONS ==========
  'mentor.createRecommendation': {
    endpoint: '/api/mentor/recommendations',
    method: 'POST',
    requiredRoles: ['Mentor'],
    cacheKeys: ['/api/mentor/recommendations'],
    successMessage: 'Recommendation created successfully'
  },
  'mentor.scheduleSession': {
    endpoint: '/api/mentor/sessions',
    method: 'POST',
    requiredRoles: ['Mentor'],
    cacheKeys: ['/api/mentor/sessions'],
    successMessage: 'Session scheduled successfully'
  },
  'mentor.updateProgress': {
    endpoint: '/api/mentor/progress',
    method: 'PUT',
    requiredRoles: ['Mentor'],
    cacheKeys: ['/api/mentor/progress'],
    successMessage: 'Progress updated successfully'
  },
  'mentor.submitFeedback': {
    endpoint: '/api/mentor/feedback',
    method: 'POST',
    requiredRoles: ['Mentor'],
    cacheKeys: ['/api/mentor/feedback'],
    successMessage: 'Feedback submitted successfully'
  },

  // ========== SUPERVISOR ACTIONS ==========
  'supervisor.scheduleObservation': {
    endpoint: '/api/supervisor/observations',
    method: 'POST',
    requiredRoles: ['Supervisor'],
    cacheKeys: ['/api/supervisor/observations'],
    successMessage: 'Observation scheduled successfully'
  },
  'supervisor.sendAlert': {
    endpoint: '/api/supervisor/alerts',
    method: 'POST',
    requiredRoles: ['Supervisor'],
    cacheKeys: ['/api/supervisor/alerts'],
    successMessage: 'Alert sent successfully'
  },
  'supervisor.generateReport': {
    endpoint: '/api/supervisor/reports',
    method: 'POST',
    requiredRoles: ['Supervisor'],
    cacheKeys: ['/api/supervisor/reports'],
    successMessage: 'Report generated successfully'
  },
  'supervisor.updateMonitoring': {
    endpoint: '/api/supervisor/monitoring',
    method: 'PUT',
    requiredRoles: ['Supervisor'],
    cacheKeys: ['/api/supervisor/monitoring'],
    successMessage: 'Monitoring settings updated successfully'
  },

  // ========== ACCOUNTANT ACTIONS ==========
  'accountant.generateInvoice': {
    endpoint: '/api/accountant/invoices',
    method: 'POST',
    requiredRoles: ['Accountant'],
    cacheKeys: ['/api/accountant/invoices'],
    successMessage: 'Invoice generated successfully'
  },
  'accountant.processPayment': {
    endpoint: '/api/accountant/payments',
    method: 'POST',
    requiredRoles: ['Accountant'],
    cacheKeys: ['/api/accountant/payments', '/api/accountant/financial'],
    successMessage: 'Payment processed successfully'
  },
  'accountant.exportFinancialReport': {
    endpoint: '/api/accountant/reports',
    method: 'GET',
    requiredRoles: ['Accountant'],
    cacheKeys: [],
    successMessage: 'Financial report exported successfully'
  },
  'accountant.updateBilling': {
    endpoint: '/api/accountant/billing',
    method: 'PUT',
    requiredRoles: ['Accountant'],
    cacheKeys: ['/api/accountant/billing'],
    successMessage: 'Billing updated successfully'
  },

  // ========== CALL CENTER ACTIONS ==========
  'callcenter.createLead': {
    endpoint: '/api/callcenter/leads',
    method: 'POST',
    requiredRoles: ['Call Center Agent'],
    cacheKeys: ['/api/callcenter/leads'],
    successMessage: 'Lead created successfully'
  },
  'callcenter.updateLead': {
    endpoint: '/api/callcenter/leads',
    method: 'PUT',
    requiredRoles: ['Call Center Agent'],
    cacheKeys: ['/api/callcenter/leads'],
    successMessage: 'Lead updated successfully'
  },
  'callcenter.makeCall': {
    endpoint: '/api/callcenter/calls',
    method: 'POST',
    requiredRoles: ['Call Center Agent'],
    cacheKeys: ['/api/callcenter/calls'],
    successMessage: 'Call initiated successfully'
  },
  'callcenter.logCall': {
    endpoint: '/api/callcenter/call-logs',
    method: 'POST',
    requiredRoles: ['Call Center Agent'],
    cacheKeys: ['/api/callcenter/call-logs'],
    successMessage: 'Call logged successfully'
  },
  'callcenter.sendSMS': {
    endpoint: '/api/callcenter/sms',
    method: 'POST',
    requiredRoles: ['Call Center Agent'],
    cacheKeys: ['/api/callcenter/communications'],
    successMessage: 'SMS sent successfully'
  },
  'callcenter.scheduleFollowUp': {
    endpoint: '/api/callcenter/follow-ups',
    method: 'POST',
    requiredRoles: ['Call Center Agent'],
    cacheKeys: ['/api/callcenter/follow-ups'],
    successMessage: 'Follow-up scheduled successfully'
  },

  // ========== FRONT DESK ACTIONS ==========
  'frontdesk.logCall': {
    endpoint: '/api/frontdesk/call-logs',
    method: 'POST',
    requiredRoles: ['Front Desk'],
    cacheKeys: ['/api/frontdesk/call-logs'],
    successMessage: 'Call logged successfully'
  },
  'frontdesk.checkInVisitor': {
    endpoint: '/api/frontdesk/visitors/checkin',
    method: 'POST',
    requiredRoles: ['Front Desk'],
    cacheKeys: ['/api/frontdesk/visitors'],
    successMessage: 'Visitor checked in successfully'
  },
  'frontdesk.scheduleTrialLesson': {
    endpoint: '/api/frontdesk/trial-lessons',
    method: 'POST',
    requiredRoles: ['Front Desk'],
    cacheKeys: ['/api/frontdesk/trial-lessons'],
    successMessage: 'Trial lesson scheduled successfully'
  },
  'frontdesk.sendSMSTemplate': {
    endpoint: '/api/frontdesk/sms/send',
    method: 'POST',
    requiredRoles: ['Front Desk'],
    cacheKeys: ['/api/frontdesk/sms'],
    successMessage: 'SMS sent successfully'
  },
  'frontdesk.createSMSTemplate': {
    endpoint: '/api/frontdesk/sms/templates',
    method: 'POST',
    requiredRoles: ['Front Desk'],
    cacheKeys: ['/api/frontdesk/sms/templates'],
    successMessage: 'SMS template created successfully'
  },
  'frontdesk.updateTask': {
    endpoint: '/api/frontdesk/tasks',
    method: 'PUT',
    requiredRoles: ['Front Desk'],
    cacheKeys: ['/api/frontdesk/tasks'],
    successMessage: 'Task updated successfully'
  },

  // ========== COMMON ACTIONS ==========
  'common.refreshData': {
    endpoint: '',
    method: 'GET',
    requiredRoles: [],
    cacheKeys: [],
    skipPermissionCheck: true,
    successMessage: 'Data refreshed successfully'
  },
  'common.exportData': {
    endpoint: '/api/export',
    method: 'GET',
    requiredRoles: [],
    cacheKeys: [],
    successMessage: 'Data exported successfully'
  },
  'common.uploadFile': {
    endpoint: '/api/upload',
    method: 'POST',
    requiredRoles: [],
    cacheKeys: [],
    successMessage: 'File uploaded successfully'
  }
};

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

export const checkPermission = (userRole: string, actionConfig: ActionConfig): boolean => {
  if (actionConfig.skipPermissionCheck) {
    return true;
  }
  
  // Normalize role names for comparison
  const normalizeRole = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'admin': 'Admin',
      'student': 'Student', 
      'teacher': 'Teacher',
      'mentor': 'Mentor',
      'supervisor': 'Supervisor',
      'accountant': 'Accountant',
      'call_center': 'Call Center Agent',
      'call center agent': 'Call Center Agent',
      'callcenter': 'Call Center Agent',
      'front_desk': 'Front Desk',
      'front_desk_clerk': 'Front Desk',
      'frontdesk': 'Front Desk'
    };
    
    return roleMap[role.toLowerCase()] || role;
  };
  
  const normalizedUserRole = normalizeRole(userRole);
  const requiredRoles = actionConfig.requiredRoles.map(normalizeRole);
  
  return requiredRoles.length === 0 || requiredRoles.includes(normalizedUserRole);
};

// ============================================================================
// ACTION EXECUTION UTILITIES
// ============================================================================

export const invalidateQueryKeys = async (cacheKeys: string[]): Promise<void> => {
  for (const key of cacheKeys) {
    await queryClient.invalidateQueries({ queryKey: [key] });
  }
};

export const executeAction = async (
  actionType: string,
  payload: ActionPayload = {},
  config?: Partial<ActionConfig>
): Promise<ActionResult> => {
  const actionConfig = { ...actionRegistry[actionType], ...config };
  
  if (!actionConfig) {
    throw new Error(`Action type '${actionType}' not found in registry`);
  }

  try {
    let result;
    
    if (actionType === 'common.refreshData') {
      // Special handling for refresh action
      await queryClient.invalidateQueries();
      result = { data: 'Data refreshed' };
    } else {
      // Make API request - Fix: use 'body' instead of 'data' for non-GET requests
      const requestOptions: any = {
        method: actionConfig.method
      };

      if (actionConfig.method !== 'GET') {
        // For non-GET requests, send payload in body as JSON
        requestOptions.body = JSON.stringify(payload);
      } else {
        // For GET requests, add payload as query parameters if needed
        if (payload && Object.keys(payload).length > 0) {
          const searchParams = new URLSearchParams();
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          const separator = actionConfig.endpoint.includes('?') ? '&' : '?';
          requestOptions.url = `${actionConfig.endpoint}${separator}${searchParams.toString()}`;
        }
      }

      result = await apiRequest(
        requestOptions.url || actionConfig.endpoint, 
        requestOptions
      );
    }
    
    // Invalidate cache keys
    if (actionConfig.cacheKeys.length > 0) {
      await invalidateQueryKeys(actionConfig.cacheKeys);
    }
    
    return {
      success: true,
      data: result,
      statusCode: 200
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Action failed',
      statusCode: error.status || 500
    };
  }
};