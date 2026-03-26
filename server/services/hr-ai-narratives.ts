/**
 * HR AI Narratives Service
 * Uses Ollama (or OpenAI fallback) to generate monthly performance summaries,
 * improvement plans, and anomaly notifications for HR.
 */

import { db } from "../db";
import { eq, and, lte, desc } from "drizzle-orm";
import { users, employees, performanceReviews } from "@shared/schema";
import { ollamaService } from "../ollama-service";

const PERFORMANCE_DROP_THRESHOLD = 15; // points below 3-month average

export async function generateAiNarrative(
  employeeId: number,
  year: number,
  month: number,
  metrics: Record<string, number>,
  overallScore: number
): Promise<{ narrative: string; improvementPlan: string | null; anomalyDetected: boolean; anomalyDetails: string | null }> {
  const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId));
  const [user] = emp ? await db.select().from(users).where(eq(users.id, emp.userId)) : [undefined];

  const employeeName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Staff member";
  const role = user?.role ?? "Staff";
  const monthName = new Date(year, month - 1, 1).toLocaleString("en", { month: "long" });

  // Get 3-month history for anomaly detection
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

  const threeMonthAvg =
    history.length > 0
      ? history.reduce((s, r) => s + Number(r.overallScore ?? 0), 0) / history.length
      : null;
  const previousMonthScore = history.length > 0 ? Number(history[0].overallScore ?? 0) : null;

  const anomalyDetected =
    threeMonthAvg !== null && overallScore < threeMonthAvg - PERFORMANCE_DROP_THRESHOLD;
  const anomalyDetails = anomalyDetected
    ? `Score dropped ${(threeMonthAvg! - overallScore).toFixed(1)} points below 3-month average of ${threeMonthAvg!.toFixed(1)}.`
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
${threeMonthAvg !== null ? `3-Month Average: ${threeMonthAvg.toFixed(1)}/100` : ""}
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
  if (overallScore < 60 || anomalyDetected) {
    const improvementPrompt = `You are an HR coach. Create a concise, actionable 30-day improvement plan (3 bullet points) for:
Employee: ${employeeName} (${role})
Current Score: ${overallScore}/100
Weak metrics:
${Object.entries(metrics)
  .filter(([, v]) => v < 60)
  .map(([k, v]) => `  - ${k.replace(/_/g, " ")}: ${v}/100`)
  .join("\n")}
Format: plain text bullet points starting with "•". No headers.`;
    try {
      improvementPlan = await ollamaService.generateText(improvementPrompt);
    } catch {
      improvementPlan = `• Schedule a 1-on-1 review session to discuss performance goals.\n• Identify specific training resources to address weak metric areas.\n• Set weekly check-in milestones to track improvement over 30 days.`;
    }
  }

  return {
    narrative: narrative.trim(),
    improvementPlan: improvementPlan?.trim() ?? null,
    anomalyDetected,
    anomalyDetails,
    // Pass through for caller to use
    ...(threeMonthAvg !== null ? { threeMonthAvgScore: parseFloat(threeMonthAvg.toFixed(2)) } : {}),
    ...(previousMonthScore !== null ? { previousMonthScore } : {}),
  } as any;
}
