/**
 * HR AI Narratives Service
 * Generates monthly performance narratives, improvement plans, and anomaly alerts.
 * Anomaly threshold is configurable via admin_settings.hr_anomaly_threshold.
 */

import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { users, employees, performanceReviews, adminSettings } from "@shared/schema";
import { ollamaService } from "../ollama-service";
import { notificationQueue } from "./queue-service";

const DEFAULT_ANOMALY_THRESHOLD = 15; // points below 3-month average
const DEFAULT_IMPROVEMENT_THRESHOLD = 60; // absolute score below which improvement plan is generated

export interface AiNarrativeResult {
  narrative: string;
  improvementPlan: string | null;
  anomalyDetected: boolean;
  anomalyDetails: string | null;
  threeMonthAvgScore: number | null;
  previousMonthScore: number | null;
}

/** Read configurable thresholds + notification preference from adminSettings. */
async function getHrConfig(): Promise<{ threshold: number; notifyAdmin: boolean; improvementThreshold: number }> {
  try {
    const [settings] = await db.select({
      hrAnomalyThreshold: adminSettings.hrAnomalyThreshold,
      hrAnomalyNotifyAdmin: adminSettings.hrAnomalyNotifyAdmin,
      hrImprovementThreshold: adminSettings.hrImprovementThreshold,
    }).from(adminSettings).limit(1);

    return {
      threshold: settings?.hrAnomalyThreshold != null
        ? Number(settings.hrAnomalyThreshold)
        : DEFAULT_ANOMALY_THRESHOLD,
      notifyAdmin: settings?.hrAnomalyNotifyAdmin ?? true,
      improvementThreshold: settings?.hrImprovementThreshold != null
        ? Number(settings.hrImprovementThreshold)
        : DEFAULT_IMPROVEMENT_THRESHOLD,
    };
  } catch {
    return { threshold: DEFAULT_ANOMALY_THRESHOLD, notifyAdmin: true, improvementThreshold: DEFAULT_IMPROVEMENT_THRESHOLD };
  }
}

export async function generateAiNarrative(
  employeeId: number,
  year: number,
  month: number,
  metrics: Record<string, number>,
  overallScore: number
): Promise<AiNarrativeResult> {
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
  const [user] = emp ? await db.select().from(users).where(eq(users.id, emp.userId)) : [undefined];

  const employeeName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Staff member";
  const role = user?.role ?? "Staff";
  const monthName = new Date(year, month - 1, 1).toLocaleString("en", { month: "long" });

  const { threshold, notifyAdmin, improvementThreshold } = await getHrConfig();

  // Get 3-month history for anomaly detection (published reviews only)
  const history = await db
    .select()
    .from(performanceReviews)
    .where(
      and(
        eq(performanceReviews.employeeId, employeeId),
        eq(performanceReviews.status, "published")
      )
    )
    .orderBy(desc(performanceReviews.createdAt))
    .limit(3);

  const threeMonthAvgScore: number | null =
    history.length > 0
      ? parseFloat(
          (history.reduce((s, r) => s + Number(r.overallScore ?? 0), 0) / history.length).toFixed(2)
        )
      : null;
  const previousMonthScore: number | null =
    history.length > 0 ? Number(history[0].overallScore ?? 0) : null;

  const anomalyDetected =
    threeMonthAvgScore !== null && overallScore < threeMonthAvgScore - threshold;
  const anomalyDetails: string | null = anomalyDetected
    ? `Score dropped ${(threeMonthAvgScore! - overallScore).toFixed(1)} points below the ${threshold}-point threshold (3-month avg: ${threeMonthAvgScore!.toFixed(1)}).`
    : null;

  const metricLines = Object.entries(metrics)
    .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}/100`)
    .join("\n");

  const prompt = `You are an HR performance analyst for a language institute in Iran.
Write a concise, encouraging, and professional monthly performance summary (3-4 sentences) for the following employee.
Employee: ${employeeName} (${role})
Month: ${monthName} ${year}
Overall Score: ${overallScore}/100
Metric Breakdown:
${metricLines}
${previousMonthScore !== null ? `Previous Month Score: ${previousMonthScore}/100` : ""}
${threeMonthAvgScore !== null ? `3-Month Average: ${threeMonthAvgScore.toFixed(1)}/100` : ""}
${anomalyDetected ? `⚠️ Anomaly: significant performance drop detected.` : ""}
Start with "This month, ${employeeName}" and end with a motivational closing sentence.
Respond only with the summary text, no extra formatting.`;

  let narrative = "";
  try {
    narrative = await ollamaService.generateText(prompt);
  } catch {
    narrative = `This month, ${employeeName} achieved a performance score of ${overallScore}/100 in the role of ${role}. Key metrics indicate ${
      overallScore >= 70 ? "strong performance across evaluated areas." : "areas that need attention and focused improvement."
    }`;
  }

  let improvementPlan: string | null = null;
  if (overallScore < improvementThreshold || anomalyDetected) {
    const improvementPrompt = `You are an HR coach. Create a concise, actionable 30-day improvement plan (3 bullet points) for:
Employee: ${employeeName} (${role})
Current Score: ${overallScore}/100
Weak metrics:
${Object.entries(metrics)
  .filter(([, v]) => v < improvementThreshold)
  .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}/100`)
  .join("\n")}
Format: plain text bullet points starting with "•". No headers.`;
    try {
      improvementPlan = await ollamaService.generateText(improvementPrompt);
    } catch {
      improvementPlan = `• Schedule a 1-on-1 review session to discuss performance goals.\n• Identify specific training resources to address weak metric areas.\n• Set weekly check-in milestones to track improvement over 30 days.`;
    }
  }

  // Notify admin via queue if anomaly detected and notification is enabled
  if (anomalyDetected && notifyAdmin) {
    try {
      await notificationQueue.add("hr-anomaly-alert", {
        type: "hr_performance_anomaly",
        employeeId,
        employeeName,
        role,
        year,
        month,
        overallScore,
        threeMonthAvgScore,
        anomalyDetails,
        generatedAt: new Date().toISOString(),
      }, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      });
    } catch (queueErr) {
      // Non-critical: log but don't fail the review generation
      console.warn("[HR Narratives] Could not enqueue anomaly notification:", queueErr);
    }
  }

  return {
    narrative: narrative.trim(),
    improvementPlan: improvementPlan?.trim() ?? null,
    anomalyDetected,
    anomalyDetails,
    threeMonthAvgScore,
    previousMonthScore,
  };
}
