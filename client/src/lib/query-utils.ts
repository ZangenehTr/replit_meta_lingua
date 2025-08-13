import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

/**
 * Centralized query invalidation patterns to ensure consistency
 * across the application and prevent cache staleness
 */

export const queryKeys = {
  // User Management
  users: {
    all: ['/api/users'] as const,
    me: ['/api/users/me'] as const,
    list: ['/api/users/list'] as const,
    byRole: (role: string) => ['/api/users', { role }] as const,
    detail: (id: number) => ['/api/users', id] as const,
  },
  
  // Teacher Management
  teachers: {
    all: ['/api/teachers'] as const,
    list: ['/api/teachers/list'] as const,
    available: ['/api/admin/teachers/available'] as const,
    callern: ['/api/admin/callern-teachers'] as const,
    rates: ['/api/teachers/rates'] as const,
    detail: (id: number) => ['/api/teachers', id] as const,
    availability: (id: number) => ['/api/teachers', id, 'availability'] as const,
  },
  
  // Student Management
  students: {
    all: ['/api/students'] as const,
    list: ['/api/students/list'] as const,
    unassigned: ['/api/admin/students/unassigned-teacher'] as const,
    detail: (id: number) => ['/api/students', id] as const,
    progress: (id: number) => ['/api/students', id, 'progress'] as const,
  },
  
  // Course Management
  courses: {
    all: ['/api/courses'] as const,
    my: ['/api/courses/my'] as const,
    available: ['/api/courses/available'] as const,
    detail: (id: number) => ['/api/courses', id] as const,
  },
  
  // Roadmap Management
  roadmaps: {
    all: ['/api/roadmaps'] as const,
    detail: (id: number) => ['/api/roadmaps', id] as const,
    milestones: (roadmapId: number) => ['/api/roadmaps', roadmapId, 'milestones'] as const,
    enrollments: (roadmapId: number) => ['/api/roadmaps', roadmapId, 'enrollments'] as const,
  },
  
  // Session Management
  sessions: {
    all: ['/api/sessions'] as const,
    upcoming: ['/api/sessions/upcoming'] as const,
    teacher: ['/api/teacher/sessions'] as const,
    detail: (id: number) => ['/api/sessions', id] as const,
  },
  
  // Financial Management
  financial: {
    all: ['/api/admin/financial'] as const,
    overview: ['/api/admin/financial/overview-stats'] as const,
    payments: ['/api/admin/teacher-payments'] as const,
    transactions: ['/api/wallet/transactions'] as const,
  },
  
  // Wallet Management
  wallet: {
    all: ['/api/wallet'] as const,
    balance: ['/api/wallet/balance'] as const,
    transactions: ['/api/wallet/transactions'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['/api/dashboard'] as const,
    stats: ['/api/admin/dashboard-stats'] as const,
    admin: ['/api/admin/dashboard'] as const,
    teacher: ['/api/teacher/dashboard'] as const,
    student: ['/api/student/dashboard'] as const,
  },
  
  // Supervision
  supervision: {
    pending: ['/api/supervision/pending-observations'] as const,
    scheduled: ['/api/supervision/scheduled-observations'] as const,
    overdue: ['/api/supervision/overdue-observations'] as const,
    upcoming: ['/api/supervisor/upcoming-sessions-for-observation'] as const,
    targets: ['/api/supervisor/targets'] as const,
  },
  
  // Homework/Assignments
  homework: {
    all: ['/api/homework'] as const,
    teacher: ['/api/teacher/homework'] as const,
    student: ['/api/student/homework'] as const,
  },
  
  // Session Packages
  sessionPackages: {
    all: ['/api/session-packages'] as const,
    student: ['/api/student/session-packages'] as const,
  },
  
  // Mood Tracking
  mood: {
    history: ['/api/mood/history'] as const,
    recommendations: ['/api/mood/recommendations'] as const,
  },
  
  // Classes
  classes: {
    all: ['/api/classes'] as const,
    schedule: ['/api/classes/schedule'] as const,
    teacher: (teacherId: number) => ['/api/supervision/teacher-classes', teacherId] as const,
  },
  
  // Observations
  observations: {
    all: ['/api/admin/class-observations'] as const,
    byClass: (classId: number) => ['/api/observations', { classId }] as const,
  },
  
  // Branding
  branding: ['/api/branding'] as const,
  
  // System Configuration
  system: {
    config: ['/api/admin/system/configuration'] as const,
  },
};

/**
 * Invalidation patterns for different operations
 */
export const invalidationPatterns = {
  // When a user is created/updated/deleted
  userChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  },
  
  // When a teacher is created/updated/deleted
  teacherChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.list });
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.available });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  },
  
  // When teacher Callern authorization changes
  teacherCallernChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.list });
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.callern });
  },
  
  // When teacher rates are updated
  teacherRateChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.rates });
    queryClient.invalidateQueries({ queryKey: queryKeys.financial.payments });
  },
  
  // When a student is created/updated/deleted
  studentChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.students.list });
    queryClient.invalidateQueries({ queryKey: queryKeys.students.unassigned });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  },
  
  // When a course is created/updated/deleted
  courseChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.available });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  },
  
  // When course enrollment changes
  enrollmentChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.my });
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.available });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  
  // When a roadmap is created/updated/deleted
  roadmapChange: (queryClient: QueryClient, roadmapId?: number) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.all });
    if (roadmapId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.detail(roadmapId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roadmaps.milestones(roadmapId) });
    }
  },
  
  // When a session is created/updated/deleted
  sessionChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.upcoming });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.teacher });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  
  // When teacher-student assignment changes
  assignmentChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.students.unassigned });
    queryClient.invalidateQueries({ queryKey: queryKeys.teachers.available });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
  },
  
  // When financial data changes
  financialChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.financial.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.financial.overview });
    queryClient.invalidateQueries({ queryKey: queryKeys.financial.payments });
  },
  
  // When wallet/transaction data changes
  walletChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance });
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions });
  },
  
  // When observation data changes
  observationChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.supervision.pending });
    queryClient.invalidateQueries({ queryKey: queryKeys.supervision.scheduled });
    queryClient.invalidateQueries({ queryKey: queryKeys.supervision.overdue });
    queryClient.invalidateQueries({ queryKey: queryKeys.supervision.upcoming });
    queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  },
  
  // When homework/assignments change
  homeworkChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.homework.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.homework.teacher });
    queryClient.invalidateQueries({ queryKey: queryKeys.homework.student });
  },
  
  // When session packages change
  sessionPackageChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sessionPackages.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessionPackages.student });
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
  },
  
  // When mood data changes
  moodChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.mood.history });
    queryClient.invalidateQueries({ queryKey: queryKeys.mood.recommendations });
  },
  
  // When class schedule changes
  classScheduleChange: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.schedule });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
  },
};

/**
 * Optimistic update helper
 */
export function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (oldData: T) => T
) {
  const previousData = queryClient.getQueryData<T>(queryKey);
  
  if (previousData) {
    queryClient.setQueryData(queryKey, updater(previousData));
  }
  
  return previousData;
}

/**
 * Error handler with toast notification
 */
export function handleMutationError(
  error: any,
  defaultMessage: string,
  queryClient?: QueryClient,
  queryKey?: readonly unknown[],
  previousData?: any
) {
  // Rollback optimistic update if provided
  if (queryClient && queryKey && previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  }
  
  // Show error toast
  toast({
    title: 'Error',
    description: error?.message || defaultMessage,
    variant: 'destructive',
  });
  
  // Log error for debugging
  console.error('Mutation error:', error);
}

/**
 * Success handler with toast notification
 */
export function handleMutationSuccess(
  message: string,
  description?: string
) {
  toast({
    title: message,
    description,
  });
}

/**
 * Batch invalidation helper for complex operations
 */
export async function batchInvalidate(
  queryClient: QueryClient,
  patterns: Array<(qc: QueryClient) => void>
) {
  // Execute all invalidation patterns
  patterns.forEach(pattern => pattern(queryClient));
  
  // Wait for all queries to refetch
  await queryClient.refetchQueries();
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(
  userRole: string | undefined,
  allowedRoles: string[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Format API errors for display
 */
export function formatApiError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  if (error?.statusText) return error.statusText;
  return 'An unexpected error occurred';
}