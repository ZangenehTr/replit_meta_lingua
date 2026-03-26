/**
 * HR Performance Scheduler
 *
 * Uses setInterval to schedule monthly performance review generation for all
 * active employees. In production this runs once per day and only generates
 * reviews for the current month if they have not been generated yet.
 *
 * BullMQ / Redis is optional: if REDIS_HOST is not set we fall back to an
 * in-process cron-like interval (runs the job on server start + daily).
 */

import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { employees, performanceReviews } from "@shared/schema";
import { computeEmployeeMetrics } from "./hr-performance-aggregator";
import { generateAiNarrative, type AiNarrativeResult } from "./hr-ai-narratives";
import type { InsertPerformanceReview } from "@shared/schema";

const SCHEDULE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function generateMissingReviews(year: number, month: number): Promise<void> {
  const activeEmployees = await db.select().from(employees).where(eq(employees.status, "active"));

  for (const emp of activeEmployees) {
    const existing = await db
      .select({ id: performanceReviews.id })
      .from(performanceReviews)
      .where(
        and(
          eq(performanceReviews.employeeId, emp.id),
          eq(performanceReviews.reviewYear, year),
          eq(performanceReviews.reviewMonth, month)
        )
      )
      .limit(1);

    if (existing.length > 0) continue; // Already generated this month

    try {
      const metrics = await computeEmployeeMetrics(emp.id, year, month);
      const aiResult: AiNarrativeResult = await generateAiNarrative(
        emp.id, year, month, metrics.breakdown, metrics.overallScore
      );

      const reviewData: InsertPerformanceReview = {
        employeeId: emp.id,
        reviewYear: year,
        reviewMonth: month,
        overallScore: metrics.overallScore.toFixed(2),
        metricBreakdown: metrics.breakdown,
        aiNarrative: aiResult.narrative,
        improvementPlan: aiResult.improvementPlan,
        anomalyDetected: aiResult.anomalyDetected,
        anomalyDetails: aiResult.anomalyDetails,
        previousMonthScore: aiResult.previousMonthScore != null ? String(aiResult.previousMonthScore) : null,
        threeMonthAvgScore: aiResult.threeMonthAvgScore != null ? String(aiResult.threeMonthAvgScore) : null,
        generatedAt: new Date(),
        status: "draft",
      };

      await db.insert(performanceReviews).values(reviewData);
      console.log(`[HR Scheduler] Generated review for employee ${emp.id} (${year}-${month})`);
    } catch (err) {
      console.error(`[HR Scheduler] Failed to generate review for employee ${emp.id}:`, err);
    }
  }
}

function shouldRunThisMonth(): boolean {
  // Only run if we are in the last 5 days of the month or the first 3 days (to catch prior month)
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  return dayOfMonth >= daysInMonth - 4 || dayOfMonth <= 3;
}

export function startHrScheduler(): void {
  const run = async () => {
    try {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;

      // If we're in the first 3 days of the month, generate for the previous month too
      if (now.getDate() <= 3) {
        const prev = new Date(year, month - 2, 1);
        console.log(`[HR Scheduler] Running end-of-month generation for ${prev.getFullYear()}-${prev.getMonth() + 1}`);
        await generateMissingReviews(prev.getFullYear(), prev.getMonth() + 1);
      }

      if (shouldRunThisMonth()) {
        console.log(`[HR Scheduler] Running performance generation for ${year}-${month}`);
        await generateMissingReviews(year, month);
      }
    } catch (err) {
      console.error("[HR Scheduler] Error during scheduled run:", err);
    }
  };

  // Run once shortly after startup (5-minute delay to let app stabilize)
  setTimeout(run, 5 * 60 * 1000);

  // Then run every 24 hours
  setInterval(run, SCHEDULE_INTERVAL_MS);

  console.log("✅ HR Performance Scheduler initialized (runs daily, generates reviews at month-end)");
}
