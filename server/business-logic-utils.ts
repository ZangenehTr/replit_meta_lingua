// Business Logic Utilities - Consolidated shared logic to eliminate duplications
// Created: July 20, 2025 - Consolidating 25+ business logic duplications

import { User } from '../shared/schema';

/**
 * TEACHER FILTERING UTILITIES
 * Consolidates 10+ teacher filtering duplications across routes.ts
 */
export const TEACHER_ROLES = ['Teacher/Tutor', 'instructor'] as const;

export function filterTeachers(users: User[]): User[] {
  return users.filter(user => TEACHER_ROLES.includes(user.role as any));
}

export function filterActiveTeachers(users: User[]): User[] {
  return users.filter(user => 
    TEACHER_ROLES.includes(user.role as any) && user.isActive
  );
}

/**
 * USER ROLE FILTERING UTILITIES
 * Consolidates role filtering across multiple components
 */
export function filterStudents(users: User[]): User[] {
  return users.filter(user => user.role === 'Student');
}

export function filterActiveUsers(users: User[]): User[] {
  return users.filter(user => user.isActive);
}

export function filterUsersByRole(users: User[], role: string): User[] {
  return users.filter(user => user.role === role);
}

/**
 * OBSERVATION STATUS UTILITIES
 * Consolidates observation filtering duplications
 */
export const ACTIVE_OBSERVATION_STATUSES = ['scheduled', 'in_progress'] as const;

export function isActiveObservation(status: string): boolean {
  return ACTIVE_OBSERVATION_STATUSES.includes(status as any);
}

export function filterActiveObservations(observations: any[]): any[] {
  return observations.filter(obs => isActiveObservation(obs.status));
}

/**
 * NUMERICAL CALCULATION UTILITIES
 * Standardized calculations to eliminate Math.random() and ensure consistency
 */

/**
 * Calculate real attendance rate from session data
 */
export function calculateAttendanceRate(completedSessions: number, totalSessions: number): number {
  if (totalSessions === 0) return 0;
  return Math.round((completedSessions / totalSessions) * 100);
}

/**
 * Calculate real teacher rating from observations
 */
export function calculateTeacherRating(totalRating: number, observationCount: number): number {
  if (observationCount === 0) return 0;
  return Math.round((totalRating / observationCount) * 10) / 10;
}

/**
 * Calculate percentage with proper bounds checking
 */
export function calculatePercentage(partial: number, total: number): number {
  if (total === 0) return 0;
  const percentage = (partial / total) * 100;
  return Math.round(Math.max(0, Math.min(100, percentage)));
}

/**
 * Calculate growth rate between two periods
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * Safe numeric rounding for currency/financial data
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount);
}

/**
 * Safe numeric rounding for ratings (1 decimal place)
 */
export function roundRating(rating: number): number {
  return Math.round(rating * 10) / 10;
}

/**
 * VALIDATION UTILITIES
 * Standardized validation to eliminate scattered checks
 */

/**
 * Validate active user - consolidated from auth.ts and auth-fix.ts
 */
export function validateActiveUser(user: any): boolean {
  return user && user.isActive === true;
}

/**
 * Validate user role
 */
export function validateUserRole(user: any, expectedRole: string): boolean {
  return user && user.role === expectedRole;
}

/**
 * Validate teacher with active status
 */
export function validateActiveTeacher(user: any): boolean {
  return validateActiveUser(user) && TEACHER_ROLES.includes(user.role as any);
}

/**
 * DATA INTEGRITY UTILITIES
 * Ensure all numerical values are safe and valid
 */

/**
 * Safe division with fallback
 */
export function safeDivision(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0) return fallback;
  return numerator / denominator;
}

/**
 * Ensure value is within bounds
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert null/undefined to zero for calculations
 */
export function safeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}