import { db } from "../db";
import { leadActivityLog, leads } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class LeadLogbookService {
  static async recordTransition(
    leadId: number,
    fromStage: string | null,
    toStage: string,
    operatorId: number | null,
    reason?: string
  ): Promise<void> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return;

    const snapshot = { ...lead };

    await db.insert(leadActivityLog).values({
      leadId,
      fromStage: fromStage || null,
      toStage,
      operatorId: operatorId || null,
      reason: reason || null,
      snapshot
    } as any);
  }

  static async getLogForLead(leadId: number) {
    return db
      .select()
      .from(leadActivityLog)
      .where(eq(leadActivityLog.leadId, leadId))
      .orderBy(desc(leadActivityLog.createdAt));
  }
}
