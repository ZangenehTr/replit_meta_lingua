/**
 * HR Performance Aggregator Service
 * Computes role-specific performance metrics for each employee by pulling
 * real platform data: CallerN sessions, AI Supervisor analyses, CRM lead
 * transitions, and student test outcomes.
 *
 * Metrics by role:
 *  Teacher/Tutor      — student outcome rate, session quality score, attendance reliability
 *  Call Center Agent  — lead conversion rate (vs peer average), follow-up adherence, response speed
 *  Mentor             — session frequency, student retention, mentee progress delta
 *  Supervisor         — observation frequency, teacher post-feedback improvement rate, coverage
 *  Front Desk Clerk   — intake-to-enrollment conversion, daily handling speed
 *  Generic            — general activity placeholder
 */

import { db } from "../db";
import { eq, and, gte, lte, sql, ne } from "drizzle-orm";
import {
  users, employees, callernCallHistory, leads,
  supervisionObservations, enrollments, callernScoringEvents,
  performanceReviews,
} from "@shared/schema";

export interface PerformanceMetrics {
  overallScore: number;
  breakdown: Record<string, number>;
  dataPoints: number;
}

/** Compute metrics for the given employee for a calendar month. */
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
  const rawRole = userRow.role ?? "";
  const roleLower = rawRole.toLowerCase();
  const isTeacher = roleLower === "teacher" || roleLower.includes("tutor");
  const isCcAgent = roleLower.includes("call center") || roleLower.includes("agent");
  const isMentor = roleLower === "mentor";
  const isSupervisor = roleLower === "supervisor";
  const isFrontDesk = roleLower.includes("front desk");

  if (isTeacher) {
    return computeTeacherMetrics(emp.userId, periodStart, periodEnd);
  } else if (isCcAgent) {
    return computeCallCenterMetrics(emp.userId, periodStart, periodEnd);
  } else if (isMentor) {
    return computeMentorMetrics(emp.userId, periodStart, periodEnd);
  } else if (isSupervisor) {
    return computeSupervisorMetrics(emp.userId, periodStart, periodEnd);
  } else if (isFrontDesk) {
    return computeFrontDeskMetrics(emp.userId, periodStart, periodEnd);
  } else {
    return computeGenericMetrics();
  }
}

// ─── Teacher Metrics ─────────────────────────────────────────────────────────

async function computeTeacherMetrics(
  userId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceMetrics> {
  const [teacherEnrollments] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(
      sql`EXISTS (
        SELECT 1 FROM courses c
        WHERE c.id = ${enrollments.courseId}
        AND c.instructor_id = ${userId}
        AND ${enrollments.enrolledAt} BETWEEN ${periodStart} AND ${periodEnd}
      )`
    );
  const enrollCount = Number(teacherEnrollments?.count ?? 0);

  const [scoringRow] = await db
    .select({ score: sql<number>`AVG(CAST(${callernScoringEvents.scoreImpact} AS FLOAT))` })
    .from(callernScoringEvents)
    .where(
      and(
        eq(callernScoringEvents.participantId, userId),
        gte(callernScoringEvents.createdAt, periodStart),
        lte(callernScoringEvents.createdAt, periodEnd)
      )
    );
  const rawScore = Number(scoringRow?.score ?? 0);
  const avgSessionScore = Math.min(100, Math.max(0, 50 + rawScore * 10));

  const [sessions] = await db
    .select({ total: sql<number>`count(*)` })
    .from(callernCallHistory)
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernCallHistory.startTime, periodStart),
        lte(callernCallHistory.startTime, periodEnd)
      )
    );
  const sessionCount = Number(sessions?.total ?? 0);
  const attendanceScore = Math.min(100, sessionCount * 5);

  const overallScore = Math.round(
    enrollCount > 0
      ? 30 + avgSessionScore * 0.4 + Math.min(30, attendanceScore * 0.3)
      : avgSessionScore * 0.5 + attendanceScore * 0.5
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
  // Own conversion rate
  const [totalRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedAgentId, userId),
        gte(leads.createdAt, periodStart),
        lte(leads.createdAt, periodEnd)
      )
    );
  const total = Number(totalRow?.cnt ?? 0);

  const [convertedRow] = await db
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
  const converted = Number(convertedRow?.cnt ?? 0);
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  // Peer average conversion rate (all CC agents except this one)
  const peerRows = await db
    .select({
      agentId: leads.assignedAgentId,
      total: sql<number>`count(*)`,
      converted: sql<number>`count(*) FILTER (WHERE ${leads.workflowStage} IN ('enrolled','final_registration'))`,
    })
    .from(leads)
    .where(
      and(
        sql`${leads.assignedAgentId} IS NOT NULL`,
        ne(leads.assignedAgentId, userId),
        gte(leads.createdAt, periodStart),
        lte(leads.createdAt, periodEnd)
      )
    )
    .groupBy(leads.assignedAgentId);

  let peerAvgConversion = 0;
  if (peerRows.length > 0) {
    const peerRates = peerRows.map(r => Number(r.total) > 0 ? (Number(r.converted) / Number(r.total)) * 100 : 0);
    peerAvgConversion = Math.round(peerRates.reduce((s, v) => s + v, 0) / peerRates.length);
  }
  // vs-peer score: own rate normalized against peer average (100 = at peer avg)
  const vsPeerScore = peerAvgConversion > 0
    ? Math.min(100, Math.round((conversionRate / peerAvgConversion) * 100))
    : conversionRate; // no peers yet — use own rate

  // Follow-up adherence
  const [followUpRow] = await db
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
  const followUpCount = Number(followUpRow?.cnt ?? 0);
  const followUpScore = Math.min(100, followUpCount * 5);

  const overallScore = Math.round(conversionRate * 0.4 + vsPeerScore * 0.4 + followUpScore * 0.2);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      lead_conversion_rate: conversionRate,
      conversion_vs_peer_average: vsPeerScore,
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
  const [sessionsRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(callernCallHistory)
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernCallHistory.startTime, periodStart),
        lte(callernCallHistory.startTime, periodEnd)
      )
    );
  const sessionFrequency = Number(sessionsRow?.cnt ?? 0);

  const [studentsRow] = await db
    .select({ cnt: sql<number>`count(DISTINCT ${callernCallHistory.studentId})` })
    .from(callernCallHistory)
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernCallHistory.startTime, periodStart),
        lte(callernCallHistory.startTime, periodEnd)
      )
    );
  const studentCount = Number(studentsRow?.cnt ?? 0);

  // Mentee progress delta: compare avg CallerN score this month vs prior month
  const priorMonthStart = new Date(periodStart);
  priorMonthStart.setMonth(priorMonthStart.getMonth() - 1);
  const priorMonthEnd = new Date(periodStart);
  priorMonthEnd.setDate(priorMonthEnd.getDate() - 1);

  const [currentScoreRow] = await db
    .select({ avg: sql<number>`AVG(CAST(${callernScoringEvents.scoreImpact} AS FLOAT))` })
    .from(callernScoringEvents)
    .innerJoin(callernCallHistory, eq(callernScoringEvents.callId, callernCallHistory.id))
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernScoringEvents.createdAt, periodStart),
        lte(callernScoringEvents.createdAt, periodEnd)
      )
    );

  const [priorScoreRow] = await db
    .select({ avg: sql<number>`AVG(CAST(${callernScoringEvents.scoreImpact} AS FLOAT))` })
    .from(callernScoringEvents)
    .innerJoin(callernCallHistory, eq(callernScoringEvents.callId, callernCallHistory.id))
    .where(
      and(
        eq(callernCallHistory.teacherId, userId),
        gte(callernScoringEvents.createdAt, priorMonthStart),
        lte(callernScoringEvents.createdAt, priorMonthEnd)
      )
    );

  const currentAvg = Number(currentScoreRow?.avg ?? 0);
  const priorAvg = Number(priorScoreRow?.avg ?? 0);
  // Delta: positive = mentees improved. Normalize to 0-100 (delta of +5 = perfect)
  const rawDelta = currentAvg - priorAvg;
  const menteeProgressScore = Math.min(100, Math.max(0, 50 + rawDelta * 10));

  const sessionScore = Math.min(100, sessionFrequency * 5);
  const retentionScore = Math.min(100, studentCount * 15);
  const overallScore = Math.round(sessionScore * 0.3 + retentionScore * 0.3 + menteeProgressScore * 0.4);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      session_frequency: sessionScore,
      student_retention: retentionScore,
      mentee_progress_delta: Math.round(menteeProgressScore),
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

  // Teacher improvement rate post-feedback:
  // Find teachers that this supervisor observed, then compare their performance review score
  // from the month before observation vs the current month.
  let teacherImprovementRate = 0;
  try {
    // Get distinct teacher user IDs this supervisor observed this period
    const observedTeachers = await db
      .select({ teacherId: supervisionObservations.teacherId })
      .from(supervisionObservations)
      .where(
        and(
          eq(supervisionObservations.supervisorId, userId),
          gte(supervisionObservations.observationDate, periodStart),
          lte(supervisionObservations.observationDate, periodEnd)
        )
      )
      .groupBy(supervisionObservations.teacherId);

    if (observedTeachers.length > 0) {
      const currentMonth = periodStart.getMonth() + 1;
      const currentYear = periodStart.getFullYear();
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      let improved = 0;
      let measurable = 0;

      for (const { teacherId } of observedTeachers) {
        if (!teacherId) continue;
        // Find employee record for this teacher
        const [teacherEmp] = await db.select().from(employees).where(eq(employees.userId, teacherId));
        if (!teacherEmp) continue;

        const [prevReview] = await db
          .select({ score: performanceReviews.overallScore })
          .from(performanceReviews)
          .where(
            and(
              eq(performanceReviews.employeeId, teacherEmp.id),
              eq(performanceReviews.reviewYear, prevYear),
              eq(performanceReviews.reviewMonth, prevMonth)
            )
          )
          .limit(1);

        const [currReview] = await db
          .select({ score: performanceReviews.overallScore })
          .from(performanceReviews)
          .where(
            and(
              eq(performanceReviews.employeeId, teacherEmp.id),
              eq(performanceReviews.reviewYear, currentYear),
              eq(performanceReviews.reviewMonth, currentMonth)
            )
          )
          .limit(1);

        if (prevReview?.score != null && currReview?.score != null) {
          measurable++;
          if (Number(currReview.score) > Number(prevReview.score)) improved++;
        }
      }

      teacherImprovementRate = measurable > 0
        ? Math.round((improved / measurable) * 100)
        : 0;
    }
  } catch {
    teacherImprovementRate = 0;
  }

  const overallScore = Math.round(obsScore * 0.5 + teacherImprovementRate * 0.5);

  return {
    overallScore: Math.min(100, overallScore),
    breakdown: {
      quality_observation_frequency: obsScore,
      teacher_improvement_rate_post_feedback: teacherImprovementRate,
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

// ─── Generic Metrics ─────────────────────────────────────────────────────────

function computeGenericMetrics(): PerformanceMetrics {
  return {
    overallScore: 0,
    breakdown: { general_activity: 0 },
    dataPoints: 0,
  };
}
