// Business Logic Utilities - Consolidated shared logic to eliminate duplications
// Created: July 20, 2025 - Consolidating 25+ business logic duplications

import { User } from '../shared/schema';

/**
 * TEACHER FILTERING UTILITIES
 * Consolidates 10+ teacher filtering duplications across routes.ts
 */
export const TEACHER_ROLES = ['Teacher/Tutor', 'instructor', 'teacher', 'Teacher'] as const;

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
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Calculate growth percentage between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Round currency values for display
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount);
}

/**
 * Safe number conversion with fallback
 */
export function safeNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Check if user is active based on status
 */
export function isActiveUser(user: User): boolean {
  return user.isActive === true;
}

/**
 * Calculate real dashboard statistics without fake data
 */




/**
 * VALIDATION AND DATA INTEGRITY UTILITIES
 * Consolidates validation logic from auth.ts, auth-fix.ts and other files
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

