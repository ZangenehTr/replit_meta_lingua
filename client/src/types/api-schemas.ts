import { z } from 'zod';

// Notification API response schemas
export const notificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error', 'system']),
  category: z.enum(['academic', 'financial', 'system', 'social', 'administrative']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  targetRole: z.string().nullable(),
  actionUrl: z.string().nullable(),
  metadata: z.record(z.any()).nullable(),
  isRead: z.boolean(),
  isDismissed: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime()
});

export const notificationsResponseSchema = z.array(notificationSchema);

export const notificationCountSchema = z.object({
  total: z.number(),
  unread: z.number(),
  unreadByCategory: z.record(z.number())
});

// Dashboard stats schema
export const dashboardStatsSchema = z.object({
  totalStudents: z.number(),
  activeStudents: z.number(),
  totalCourses: z.number(),
  totalSessions: z.number(),
  completionRate: z.number(),
  attendance: z.number()
});

// User profile schema for dashboard
export const dashboardUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  avatar: z.string().nullable(),
  credits: z.number().nullable(),
  streakDays: z.number().nullable(),
  totalLessons: z.number().nullable(),
  preferences: z.record(z.any()).nullable()
});

// API refresh response schema
export const refreshResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string().datetime()
});

// Quick action schema (if we decide to implement them)
export const quickActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  actionUrl: z.string(),
  enabled: z.boolean(),
  permissions: z.array(z.string()).optional()
});

export const quickActionsResponseSchema = z.array(quickActionSchema);

// Export types
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
export type NotificationCount = z.infer<typeof notificationCountSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type DashboardUser = z.infer<typeof dashboardUserSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
export type QuickAction = z.infer<typeof quickActionSchema>;
export type QuickActionsResponse = z.infer<typeof quickActionsResponseSchema>;