/**
 * HR Performance Scheduler
 *
 * Uses BullMQ repeatable jobs (monthly cron) to auto-generate missing
 * performance reviews for all active employees.
 * Falls back gracefully to setInterval when Redis is unavailable (dev/test).
 */

import { Queue, Worker, type Job } from "bullmq";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { employees, performanceReviews, performanceScores, type InsertPerformanceReview, type InsertPerformanceScore } from "@shared/schema";
import { computeEmployeeMetrics } from "./hr-performance-aggregator";
import { generateAiNarrative, type AiNarrativeResult } from "./hr-ai-narratives";
import { redisConnection, redisAvailable } from "./queue-service";

const QUEUE_NAME = "hr-performance-reviews";

// ─── Job payload ─────────────────────────────────────────────────────────────

interface HrReviewJobData {
  year: number;
  month: number;
}

// ─── Core logic (shared by BullMQ worker and setInterval fallback) ─────────

async function generateMissingReviewsForMonth(year: number, month: number): Promise<void> {
  console.log(`[HR Scheduler] Generating missing reviews for ${year}-${String(month).padStart(2, "0")} …`);

  const allActive = await db
    .select()
    .from(employees)
    .where(eq(employees.status, "active"));

  let generated = 0;
  let skipped = 0;

  for (const emp of allActive) {
    const [existing] = await db
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

    if (existing) { skipped++; continue; }

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
        adminNotified: aiResult.anomalyDetected,
        previousMonthScore: aiResult.previousMonthScore != null ? String(aiResult.previousMonthScore) : null,
        threeMonthAvgScore: aiResult.threeMonthAvgScore != null ? String(aiResult.threeMonthAvgScore) : null,
        generatedAt: new Date(),
        status: "draft",
      };

      await db.insert(performanceReviews).values(reviewData);

      // Persist per-metric snapshots into performance_scores (mirrors manual generation path)
      await db.delete(performanceScores).where(
        and(
          eq(performanceScores.employeeId, emp.id),
          eq(performanceScores.periodYear, year),
          eq(performanceScores.periodMonth, month)
        )
      );
      const scoreRows: InsertPerformanceScore[] = Object.entries(metrics.breakdown).map(([metricName, metricValue]) => {
        const mn = metricName.toLowerCase();
        const dataSource =
          mn.includes("ai_supervisor") || mn.includes("session_quality") ? "ai_supervisor" :
          mn.includes("lead") || mn.includes("followup") || mn.includes("response_speed") ? "crm" :
          mn.includes("attendance") ? "attendance" :
          mn.includes("student_outcome") || mn.includes("enrollment") ? "enrollments" :
          "aggregator";
        return {
          employeeId: emp.id,
          periodYear: year,
          periodMonth: month,
          metricName,
          metricValue: String(metricValue),
          normalizedScore: String(Math.min(100, Math.max(0, metricValue))),
          dataSource,
        };
      });
      if (scoreRows.length > 0) {
        await db.insert(performanceScores).values(scoreRows);
      }

      generated++;
      console.log(`[HR Scheduler] Generated review for employee ${emp.id} (${year}-${month})`);
    } catch (err: unknown) {
      console.error(`[HR Scheduler] Failed for employee ${emp.id}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[HR Scheduler] ${year}-${month}: generated=${generated}, skipped=${skipped}`);
}

// ─── Period helper ────────────────────────────────────────────────────────────

function getPreviousMonthPeriod(): { year: number; month: number } {
  const now = new Date();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { year, month };
}

// ─── BullMQ scheduler ─────────────────────────────────────────────────────────

let hrQueue: Queue | null = null;
let hrWorker: Worker | null = null;

async function setupBullMQScheduler(): Promise<void> {
  hrQueue = new Queue<HrReviewJobData>(QUEUE_NAME, { connection: redisConnection });

  hrWorker = new Worker<HrReviewJobData>(
    QUEUE_NAME,
    async (job: Job<HrReviewJobData>) => {
      const { year, month } = job.data;
      // Cron jobs carry static payload; compute previous month when cron fires
      const period = (year === 0 && month === 0) ? getPreviousMonthPeriod() : { year, month };
      await generateMissingReviewsForMonth(period.year, period.month);
    },
    { connection: redisConnection, concurrency: 1 }
  );

  hrWorker.on("completed", (job) => {
    console.log(`[HR Scheduler] BullMQ job ${job.id} completed`);
  });
  hrWorker.on("failed", (job, err) => {
    console.error(`[HR Scheduler] BullMQ job ${job?.id} failed:`, err.message);
  });

  // Monthly repeatable job: 03:00 on the 1st of every month
  await hrQueue.add(
    "monthly-review-generation",
    { year: 0, month: 0 },
    {
      repeat: { pattern: "0 3 1 * *" },
      jobId: "hr-monthly-cron",
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 10 },
    }
  );

  // Startup backfill: generate prior-month reviews 5 minutes after server start
  const { year, month } = getPreviousMonthPeriod();
  await hrQueue.add(
    "startup-backfill",
    { year, month },
    {
      delay: 5 * 60 * 1000,
      jobId: `hr-backfill-${year}-${month}`,
      removeOnComplete: true,
      removeOnFail: { count: 3 },
    }
  );

  console.log("✅ [HR Scheduler] BullMQ scheduler registered (monthly cron + startup backfill)");
}

// ─── setInterval fallback ────────────────────────────────────────────────────

function setupFallbackScheduler(): void {
  console.log("[HR Scheduler] Redis unavailable — using setInterval fallback");

  const runBackfill = async (): Promise<void> => {
    const { year, month } = getPreviousMonthPeriod();
    await generateMissingReviewsForMonth(year, month);
  };

  setTimeout(() => {
    runBackfill().catch(console.error);
    setInterval(() => runBackfill().catch(console.error), 24 * 60 * 60 * 1000);
  }, 5 * 60 * 1000);

  console.log("✅ [HR Scheduler] setInterval fallback initialized (runs daily)");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function startHrScheduler(): Promise<void> {
  if (!redisAvailable) {
    setupFallbackScheduler();
    return;
  }
  try {
    await setupBullMQScheduler();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[HR Scheduler] BullMQ unavailable (${msg}), falling back to setInterval`);
    setupFallbackScheduler();
  }
}

export async function stopHrScheduler(): Promise<void> {
  try {
    await hrWorker?.close();
    await hrQueue?.close();
  } catch {
    // Best-effort cleanup
  }
}
