import { db } from "./db";
import { notifications, users } from "@shared/schema";
import { eq, and, desc, gte, isNull, isNotNull, or, lt } from "drizzle-orm";

// Notification types and priorities
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationCategory = 'academic' | 'financial' | 'system' | 'social' | 'administrative';
export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Mentor' | 'Supervisor' | 'Call Center Agent' | 'Accountant';

// Role-specific notification templates
export interface RoleNotificationTemplate {
  role: UserRole;
  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
  expiresInHours?: number;
}

// Role-specific notification generators
export class NotificationService {
  private static roleNotificationTemplates: Record<UserRole, RoleNotificationTemplate[]> = {
    'Student': [
      {
        role: 'Student',
        category: 'academic',
        type: 'info',
        priority: 'high',
        title: 'Assignment Due Soon',
        message: 'You have an assignment due in 24 hours',
        actionUrl: '/student/assignments',
        expiresInHours: 48
      },
      {
        role: 'Student',
        category: 'academic',
        type: 'info',
        priority: 'normal',
        title: 'Class Reminder',
        message: 'Your class starts in 30 minutes',
        actionUrl: '/student/schedule',
        expiresInHours: 2
      },
      {
        role: 'Student',
        category: 'social',
        type: 'success',
        priority: 'normal',
        title: 'Achievement Unlocked',
        message: 'Congratulations! You earned a new achievement',
        actionUrl: '/student/achievements',
        expiresInHours: 168 // 7 days
      },
      {
        role: 'Student',
        category: 'financial',
        type: 'warning',
        priority: 'high',
        title: 'Payment Reminder',
        message: 'Your course payment is due soon',
        actionUrl: '/student/payments',
        expiresInHours: 72
      }
    ],
    'Teacher': [
      {
        role: 'Teacher',
        category: 'academic',
        type: 'info',
        priority: 'high',
        title: 'Class Schedule Update',
        message: 'Your upcoming class schedule has been updated',
        actionUrl: '/teacher/schedule',
        expiresInHours: 24
      },
      {
        role: 'Teacher',
        category: 'academic',
        type: 'info',
        priority: 'normal',
        title: 'Student Submission',
        message: 'New assignment submission requires review',
        actionUrl: '/teacher/assignments',
        expiresInHours: 48
      },
      {
        role: 'Teacher',
        category: 'administrative',
        type: 'warning',
        priority: 'high',
        title: 'Performance Review',
        message: 'Your performance evaluation is scheduled',
        actionUrl: '/teacher/performance',
        expiresInHours: 168
      },
      {
        role: 'Teacher',
        category: 'social',
        type: 'info',
        priority: 'low',
        title: 'New Student Enrolled',
        message: 'A new student has joined your class',
        actionUrl: '/teacher/students',
        expiresInHours: 72
      }
    ],
    'Admin': [
      {
        role: 'Admin',
        category: 'system',
        type: 'warning',
        priority: 'urgent',
        title: 'System Alert',
        message: 'Critical system issue requires attention',
        actionUrl: '/admin/system-health',
        expiresInHours: 2
      },
      {
        role: 'Admin',
        category: 'administrative',
        type: 'info',
        priority: 'high',
        title: 'New Registration',
        message: 'New user registration requires approval',
        actionUrl: '/admin/user-management',
        expiresInHours: 24
      },
      {
        role: 'Admin',
        category: 'financial',
        type: 'error',
        priority: 'high',
        title: 'Payment Issue',
        message: 'Payment gateway error needs investigation',
        actionUrl: '/admin/payments',
        expiresInHours: 6
      },
      {
        role: 'Admin',
        category: 'academic',
        type: 'info',
        priority: 'normal',
        title: 'Course Statistics',
        message: 'Weekly course enrollment report available',
        actionUrl: '/admin/reports',
        expiresInHours: 168
      }
    ],
    'Mentor': [
      {
        role: 'Mentor',
        category: 'academic',
        type: 'info',
        priority: 'normal',
        title: 'Student Progress Update',
        message: 'Student progress report available for review',
        actionUrl: '/mentor/students',
        expiresInHours: 72
      },
      {
        role: 'Mentor',
        category: 'social',
        type: 'info',
        priority: 'high',
        title: 'Mentoring Session Reminder',
        message: 'Scheduled mentoring session starts soon',
        actionUrl: '/mentor/sessions',
        expiresInHours: 4
      },
      {
        role: 'Mentor',
        category: 'academic',
        type: 'warning',
        priority: 'high',
        title: 'Student Needs Help',
        message: 'A student is struggling and needs support',
        actionUrl: '/mentor/support',
        expiresInHours: 12
      }
    ],
    'Supervisor': [
      {
        role: 'Supervisor',
        category: 'administrative',
        type: 'info',
        priority: 'normal',
        title: 'Teacher Performance Review',
        message: 'Teacher performance data ready for evaluation',
        actionUrl: '/supervisor/teachers',
        expiresInHours: 48
      },
      {
        role: 'Supervisor',
        category: 'academic',
        type: 'info',
        priority: 'high',
        title: 'Quality Review Required',
        message: 'Class quality assessment needs completion',
        actionUrl: '/supervisor/quality',
        expiresInHours: 24
      },
      {
        role: 'Supervisor',
        category: 'administrative',
        type: 'warning',
        priority: 'high',
        title: 'Compliance Issue',
        message: 'Curriculum compliance check required',
        actionUrl: '/supervisor/compliance',
        expiresInHours: 72
      }
    ],
    'Call Center Agent': [
      {
        role: 'Call Center Agent',
        category: 'administrative',
        type: 'info',
        priority: 'high',
        title: 'New Lead Assigned',
        message: 'You have a new lead to contact',
        actionUrl: '/callcenter/leads',
        expiresInHours: 8
      },
      {
        role: 'Call Center Agent',
        category: 'administrative',
        type: 'warning',
        priority: 'high',
        title: 'Follow-up Reminder',
        message: 'Lead follow-up is overdue',
        actionUrl: '/callcenter/follow-ups',
        expiresInHours: 4
      },
      {
        role: 'Call Center Agent',
        category: 'administrative',
        type: 'info',
        priority: 'normal',
        title: 'Daily Target Update',
        message: 'Your daily contact targets and progress',
        actionUrl: '/callcenter/dashboard',
        expiresInHours: 24
      }
    ],
    'Accountant': [
      {
        role: 'Accountant',
        category: 'financial',
        type: 'info',
        priority: 'high',
        title: 'Payment Processed',
        message: 'New payment transaction requires verification',
        actionUrl: '/accountant/payments',
        expiresInHours: 24
      },
      {
        role: 'Accountant',
        category: 'financial',
        type: 'warning',
        priority: 'high',
        title: 'Financial Report Due',
        message: 'Monthly financial report submission deadline approaching',
        actionUrl: '/accountant/reports',
        expiresInHours: 48
      },
      {
        role: 'Accountant',
        category: 'financial',
        type: 'error',
        priority: 'urgent',
        title: 'Payment Discrepancy',
        message: 'Payment reconciliation issue detected',
        actionUrl: '/accountant/reconciliation',
        expiresInHours: 6
      }
    ]
  };

  // Create role-specific notification
  static async createRoleNotification(
    userId: number, 
    role: UserRole, 
    templateType: string, 
    customData?: any
  ): Promise<void> {
    const templates = this.roleNotificationTemplates[role];
    const template = templates.find(t => 
      t.title.toLowerCase().includes(templateType.toLowerCase()) ||
      t.category === templateType ||
      t.message.toLowerCase().includes(templateType.toLowerCase())
    );
    
    if (!template) {
      console.warn(`No notification template found for role ${role} and type ${templateType}`);
      return;
    }

    const expiresAt = template.expiresInHours 
      ? new Date(Date.now() + template.expiresInHours * 60 * 60 * 1000)
      : null;

    await db.insert(notifications).values({
      userId,
      title: customData?.title || template.title,
      message: customData?.message || template.message,
      type: template.type
    });
  }

  // Generate notifications for specific scenarios
  static async generateStudentAssignmentDue(studentId: number, assignmentTitle: string, dueDate: Date): Promise<void> {
    await this.createRoleNotification(studentId, 'Student', 'assignment', {
      title: 'Assignment Due Soon',
      message: `"${assignmentTitle}" is due on ${dueDate.toLocaleDateString()}`,
      metadata: { assignmentTitle, dueDate: dueDate.toISOString() }
    });
  }

  static async generateTeacherNewSubmission(teacherId: number, studentName: string, assignmentTitle: string): Promise<void> {
    await this.createRoleNotification(teacherId, 'Teacher', 'submission', {
      title: 'New Assignment Submission',
      message: `${studentName} submitted "${assignmentTitle}" for review`,
      metadata: { studentName, assignmentTitle }
    });
  }

  static async generateAdminNewRegistration(adminId: number, userName: string, userRole: string): Promise<void> {
    await this.createRoleNotification(adminId, 'Admin', 'registration', {
      title: 'New User Registration',
      message: `${userName} registered as ${userRole} and needs approval`,
      metadata: { userName, userRole }
    });
  }

  static async generateCallCenterNewLead(agentId: number, leadName: string, leadPhone: string): Promise<void> {
    await this.createRoleNotification(agentId, 'Call Center Agent', 'lead', {
      title: 'New Lead Assigned',
      message: `Contact ${leadName} at ${leadPhone}`,
      metadata: { leadName, leadPhone }
    });
  }

  static async generateAccountantPaymentAlert(accountantId: number, amount: number, studentName: string): Promise<void> {
    await this.createRoleNotification(accountantId, 'Accountant', 'payment', {
      title: 'Payment Verification Required',
      message: `Payment of ${amount} IRR from ${studentName} needs verification`,
      metadata: { amount, studentName }
    });
  }

  // Bulk notification creation for role-based announcements
  static async createAnnouncementForRole(role: UserRole, title: string, message: string, priority: NotificationPriority = 'normal'): Promise<void> {
    const usersInRole = await db.select({ id: users.id }).from(users).where(eq(users.role, role));
    
    const notificationPromises = usersInRole.map(user => 
      db.insert(notifications).values({
        userId: user.id,
        title,
        message,
        type: 'info'
      })
    );

    await Promise.all(notificationPromises);
  }

  // Clean up expired notifications - disabled since expiresAt field doesn't exist in database
  static async cleanupExpiredNotifications(): Promise<void> {
    // Note: expiresAt field doesn't exist in current database schema
    // This function is disabled until schema is updated
    console.log('cleanupExpiredNotifications: expiresAt field not available in current schema');
  }
}