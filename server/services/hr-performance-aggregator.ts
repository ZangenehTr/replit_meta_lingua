/**
 * HR Performance Aggregator Service
 * Computes role-specific performance metrics for each employee by pulling
 * real platform data: CallerN sessions, AI Supervisor analyses, CRM lead
 * transitions, and student test outcomes.
 */

import { db } from "../db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  users, employees, callernCallHistory, leads,
  supervisionObservations, enrollments,
  callernScoringEvents,
} from "@shared/schema";

export interface PerformanceMetrics {
  overallScore: number; // 0-100
  breakdown: Record<string, number>; // metric name -> score 0-100
  dataPoints: number; // how many data points were used
}

// Computes metrics for the given employee for a calendar month.
export async function computeEmployeeMetrics(
  employeeId: number,
  year: number,
  month: number
): Promise<PerformanceMetrics> {
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
  if (!emp) return { overallScore: 0, breakdown: {}, dataPoints: 0 };

  const [userRow] = await db.select().from(users).where(eq(users.id, emp.userId));
  if (!userRow) return { overallScore: 0, breakdown: {}, dataPoints: 0 };

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const role = userRow.role;

  if (role === "Teacher/Tutor") {
    return computeTeacherMetrics(emp.userId, periodStart, periodEnd);
  } else if (role === "Call Center Agent") {
    return computeCallCenterMetrics(emp.userId, periodStart, periodEnd);
  } else if (role === "Mentor") {
    return computeMentorMetrics(emp.userId, periodStart, periodEnd);
  } else if (role === "Supervisor") {
    return computeSupervisorMetrics(emp.userId, periodStart, periodEnd);
  } else if (role === "Front Desk Clerk") {
    return computeFrontDeskMetrics(emp.userId, periodStart, periodEnd);
  } else {
    return computeGenericMetrics(emp.userId, periodStart, periodEnd);
  }
}

// ─── Teacher Metrics ─────────────────────────────────────────────────────────

async function computeTeacherMetrics(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceMetrics> {
  // 1. Student outcome rate: count enrolled students where instructor = this user
  const teacherEnrollments = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .leftJoin(users, eq(enrollments.userId, users.id))
    .where(
      sql`EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = ${enrollments.courseId}
        AND c.instructor_id = ${userId}
        AND ${enrollments.createdAt} BETWEEN ${periodStart} AND ${periodEnd}
      )`
    );
  const enrollCount = Number(teacherEnrollments[0]?.count ?? 0);

  // 2. Session quality: score impact events via CallerN (participant = teacher)
  const scoringRows = await db
    .select({ score: sql<number>`AVG(CAST(${callernScoringEvents.scoreImpact} AS FLOAT))` })
    .from(callernScoringEvents)
    .where(
      and(
        eq(callernScoringEvents.participantId, userId),
        gte(callernScoringEvents.createdAt, periodStart),
        lte(callernScoringEvents.createdAt, periodEnd)
      )
    );
  // scoreImpact is a delta (-5 to +5), normalize to 0-100
  const rawScore = Number(scoringRows[0]?.score ?? 0);
  const avgSessionScore = Math.min(100, Math.max(0, 50 + rawScore * 10));

  // 3. Attendance reliability: CallerN call history sessions started by teacher
  const sessions = await db
    .select({ total: sql<number>`count(*)` })
    .from(callernCallHistory)
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernCallHistory.startedAt, periodStart),
        lte(callernCallHistory.startedAt, periodEnd)
      )
    );
  const sessionCount = Number(sessions[0]?.total ?? 0);
  const attendanceScore = Math.min(100, sessionCount * 5); // each session = 5 points, cap at 100

  // Weighted overall
  const overallScore = Math.round(
    enrollCount > 0 ? 30 + avgSessionScore * 0.4 + Math.min(30, attendanceScore * 0.3) : avgSessionScore * 0.5 + attendanceScore * 0.5
  );

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      student_outcome_rate: Math.min(100, enrollCount * 10),
      session_quality_score: Math.round(avgSessionScore),
      attendance_reliability: Math.min(100, attendanceScore),
    },
    dataPoints: enrollCount + sessionCount,
  };
}

// ─── Call Center Agent Metrics ────────────────────────────────────────────────

async function computeCallCenterMetrics(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceMetrics> {
  // Lead conversion: leads assigned to this agent that reached enrolled/final_registration
  const [totalLeads] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedAgentId, userId),
        gte(leads.createdAt, periodStart),
        lte(leads.createdAt, periodEnd)
      )
    );
  const total = Number(totalLeads?.cnt ?? 0);

  const [convertedLeads] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedAgentId, userId),
        sql`${leads.workflowStage} IN ('enrolled', 'final_registration')`,
        gte(leads.createdAt, periodStart),
        lte(leads.createdAt, periodEnd)
      )
    );
  const converted = Number(convertedLeads?.cnt ?? 0);

  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  // Follow-up adherence: leads in follow_up that were updated this period
  const [followUpLeads] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedAgentId, userId),
        eq(leads.workflowStage, "follow_up"),
        gte(leads.updatedAt, periodStart),
        lte(leads.updatedAt, periodEnd)
      )
    );
  const followUpCount = Number(followUpLeads?.cnt ?? 0);
  const followUpScore = Math.min(100, followUpCount * 5);

  const overallScore = Math.round(conversionRate * 0.6 + followUpScore * 0.4);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      lead_conversion_rate: conversionRate,
      follow_up_adherence_rate: Math.min(100, followUpScore),
    },
    dataPoints: total + followUpCount,
  };
}

// ─── Mentor Metrics ───────────────────────────────────────────────────────────

async function computeMentorMetrics(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceMetrics> {
  // CallerN sessions with students conducted by mentor
  const [sessionsRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(callernCallHistory)
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernCallHistory.startedAt, periodStart),
        lte(callernCallHistory.startedAt, periodEnd)
      )
    );
  const sessionFrequency = Number(sessionsRow?.cnt ?? 0);

  // Students served (distinct student count in sessions)
  const [studentsRow] = await db
    .select({ cnt: sql<number>`count(DISTINCT ${callernCallHistory.studentId})` })
    .from(callernCallHistory)
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernCallHistory.startedAt, periodStart),
        lte(callernCallHistory.startedAt, periodEnd)
      )
    );
  const studentCount = Number(studentsRow?.cnt ?? 0);

  const sessionScore = Math.min(100, sessionFrequency * 5);
  const retentionScore = Math.min(100, studentCount * 15);
  const overallScore = Math.round(sessionScore * 0.5 + retentionScore * 0.5);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      session_frequency: sessionScore,
      student_retention: retentionScore,
    },
    dataPoints: sessionFrequency,
  };
}

// ─── Supervisor Metrics ───────────────────────────────────────────────────────

async function computeSupervisorMetrics(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceMetrics> {
  // Observation frequency: how many supervision observations they conducted
  const [obsRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(supervisionObservations)
    .where(
      and(
        eq(supervisionObservations.supervisorId, userId),
        gte(supervisionObservations.createdAt, periodStart),
        lte(supervisionObservations.createdAt, periodEnd)
      )
    );
  const obsCount = Number(obsRow?.cnt ?? 0);
  const obsScore = Math.min(100, obsCount * 10);

  const overallScore = Math.round(obsScore);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      quality_observation_frequency: obsScore,
    },
    dataPoints: obsCount,
  };
}

// ─── Front Desk Metrics ───────────────────────────────────────────────────────

async function computeFrontDeskMetrics(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceMetrics> {
  // Leads created from walk-ins or phone (assigned_to = this user, as front desk handles walk-ins)
  const [intakeRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedTo, userId),
        gte(leads.createdAt, periodStart),
        lte(leads.createdAt, periodEnd)
      )
    );
  const intakeCount = Number(intakeRow?.cnt ?? 0);

  const [enrolledRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedTo, userId),
        sql`${leads.workflowStage} IN ('enrolled', 'final_registration')`,
        gte(leads.updatedAt, periodStart),
        lte(leads.updatedAt, periodEnd)
      )
    );
  const enrolledCount = Number(enrolledRow?.cnt ?? 0);

  const conversionScore = intakeCount > 0 ? Math.round((enrolledCount / intakeCount) * 100) : 0;
  const handlingScore = Math.min(100, intakeCount * 3);

  const overallScore = Math.round(conversionScore * 0.6 + handlingScore * 0.4);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      intake_to_enrollment_conversion: conversionScore,
      daily_handling_speed: Math.min(100, handlingScore),
    },
    dataPoints: intakeCount,
  };
}

// ─── Generic Metrics (Admin, Accountant, etc.) ────────────────────────────────

async function computeGenericMetrics(
  _userId: number,
  _periodStart: Date,
  _periodEnd: Date
): Promise<PerformanceMetrics> {
  return {
    overallScore: 0,
    breakdown: { general_activity: 0 },
    dataPoints: 0,
  };
}
