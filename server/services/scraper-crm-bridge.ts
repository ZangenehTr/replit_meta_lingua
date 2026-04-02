/**
 * Scraper → CRM Lead Promotion Bridge
 * Converts qualifying scraped leads into CRM pipeline entries,
 * with phone-based deduplication and activity logging.
 */

import { db } from '../db';
import { scrapedLeads, leads, leadActivityLog, adminSettings } from '@shared/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { validateIranianPhone } from '../utils/iranian-validation';

/**
 * Normalise a phone number to +98XXXXXXXXXX format.
 * Falls back to the raw value if the number is not a recognisable Iranian format.
 */
function normalisePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const result = validateIranianPhone(raw);
  return result.isValid ? result.normalized : raw.replace(/[\s\-\(\)\.]/g, '');
}

export interface PromotionResult {
  success: boolean;
  crmLeadId?: number;
  duplicate?: boolean;
  error?: string;
}

/**
 * Promote a single scraped lead into the CRM leads table.
 *
 * @param scrapedLeadId  PK of the scraped_leads row to promote
 * @param forceDuplicate If true, create a new CRM lead even if a matching phone is found
 */
export async function promoteScrapedLead(
  scrapedLeadId: number,
  forceDuplicate = false
): Promise<PromotionResult> {
  try {
    const [scraped] = await db
      .select()
      .from(scrapedLeads)
      .where(eq(scrapedLeads.id, scrapedLeadId))
      .limit(1);

    if (!scraped) {
      return { success: false, error: `Scraped lead #${scrapedLeadId} not found` };
    }

    if (scraped.status === 'promoted') {
      return { success: false, error: `Scraped lead #${scrapedLeadId} already promoted` };
    }

    const normPhone = normalisePhone(scraped.phone);

    let crmLeadId: number | undefined;
    let isDuplicate = false;

    if (!forceDuplicate && normPhone) {
      const [existing] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(
          or(
            eq(leads.phoneNumber, normPhone),
            eq(leads.phoneNumber, scraped.phone ?? '')
          )
        )
        .limit(1);

      if (existing) {
        isDuplicate = true;
        crmLeadId = existing.id;

        await db
          .update(leads)
          .set({
            scrapeSourceRef: `scraped_lead:${scrapedLeadId}`,
            scrapeQualificationScore: scraped.qualificationScore ?? 0,
            updatedAt: new Date()
          })
          .where(eq(leads.id, existing.id));

        await db.insert(leadActivityLog).values({
          leadId: existing.id,
          fromStage: 'contact_desk',
          toStage: 'contact_desk',
          operatorId: null,
          reason: 'Scraped lead linked to existing CRM record (duplicate phone)',
          snapshot: {
            scrapedLeadId,
            source: scraped.source,
            qualificationScore: scraped.qualificationScore,
            normalisedPhone: normPhone
          }
        });

        console.log(`[ScraperBridge] Scraped lead #${scrapedLeadId} linked to existing CRM lead #${existing.id} (dup phone)`);
      }
    }

    if (!isDuplicate) {
      const nameParts = (scraped.name ?? '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '-';

      const [newLead] = await db
        .insert(leads)
        .values({
          firstName,
          lastName,
          email: scraped.email ?? undefined,
          phoneNumber: normPhone || scraped.phone || '',
          source: 'scraper',
          status: 'new',
          priority: 'medium',
          workflowStage: 'new_contact',
          scrapeSourceRef: `scraped_lead:${scrapedLeadId}`,
          scrapeQualificationScore: scraped.qualificationScore ?? 0,
          notes: scraped.interests ? scraped.interests.join(', ') : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({ id: leads.id });

      crmLeadId = newLead.id;

      await db.insert(leadActivityLog).values({
        leadId: newLead.id,
        fromStage: 'new_contact',
        toStage: 'new_contact',
        operatorId: null,
        reason: 'Lead created from scraper promotion',
        snapshot: {
          scrapedLeadId,
          source: scraped.source,
          qualificationScore: scraped.qualificationScore,
          platform: scraped.source
        }
      });

      console.log(`[ScraperBridge] Scraped lead #${scrapedLeadId} promoted to new CRM lead #${newLead.id}`);
    }

    await db
      .update(scrapedLeads)
      .set({ status: 'promoted', importedToLeads: true })
      .where(eq(scrapedLeads.id, scrapedLeadId));

    return { success: true, crmLeadId, duplicate: isDuplicate };
  } catch (err: any) {
    console.error(`[ScraperBridge] Error promoting scraped lead #${scrapedLeadId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Run the auto-promotion batch: promote all 'new' scraped leads whose
 * qualification_score meets or exceeds the configured threshold.
 * Capped at 50 per run to avoid spikes.
 */
export async function runAutoPromotion(): Promise<void> {
  try {
    const [settings] = await db.select({ scraperAutoPromotionThreshold: adminSettings.scraperAutoPromotionThreshold })
      .from(adminSettings)
      .limit(1);

    const threshold = settings?.scraperAutoPromotionThreshold ?? 60;

    const pending = await db
      .select({ id: scrapedLeads.id })
      .from(scrapedLeads)
      .where(
        and(
          eq(scrapedLeads.status, 'new'),
          sql`${scrapedLeads.qualificationScore} >= ${threshold}`
        )
      )
      .limit(50);

    if (pending.length === 0) {
      console.log(`[ScraperBridge] Auto-promotion: no qualifying leads (threshold=${threshold})`);
      return;
    }

    console.log(`[ScraperBridge] Auto-promotion: promoting ${pending.length} leads (threshold=${threshold})`);

    for (const row of pending) {
      const result = await promoteScrapedLead(row.id);
      if (!result.success) {
        console.warn(`[ScraperBridge] Auto-promotion failed for scraped lead #${row.id}: ${result.error}`);
      }
    }

    console.log(`[ScraperBridge] Auto-promotion batch complete`);
  } catch (err: any) {
    console.error('[ScraperBridge] runAutoPromotion error:', err.message);
  }
}
