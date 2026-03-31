/**
 * Sub-level Mapper
 * Maps MST CEFR band + per-skill score → deterministic 17-point sub-level
 * and persists to user profile.
 *
 * Threshold table (score p is 0-100 percentile within the band):
 *   A1: p < 50 → A1.1 | p >= 50 → A1.2
 *   A2: p < 50 → A2.1 | p >= 50 → A2.2
 *   B1: p < 30 → B1.1 | 30-50 → B1.2 | 50-65 → B1.3 | 65-80 → B1.4 | >=80 → B1.5
 *   B2: p < 30 → B2.1 | 30-50 → B2.2 | 50-70 → B2.3 | 70-85 → B2.4 | >=85 → B2.5
 *   C1: p < 50 → C1.1 | p >= 50 → C1.2
 *   C2: always → C2
 */

import { db } from '../../db';
import { sql } from 'drizzle-orm';

/**
 * Determine sub-level code from CEFR band and normalised score (0-1)
 * scoreP is treated as 0-100% internally (multiply by 100).
 */
export function computeSubLevelCode(cefrBand: string, scoreP: number): string {
  const baseBand = cefrBand.replace(/[+-]$/, '');
  const p = Math.max(0, Math.min(1, scoreP)) * 100;

  switch (baseBand) {
    case 'A1':
      return p < 50 ? 'A1.1' : 'A1.2';
    case 'A2':
      return p < 50 ? 'A2.1' : 'A2.2';
    case 'B1':
      if (p < 30) return 'B1.1';
      if (p < 50) return 'B1.2';
      if (p < 65) return 'B1.3';
      if (p < 80) return 'B1.4';
      return 'B1.5';
    case 'B2':
      if (p < 30) return 'B2.1';
      if (p < 50) return 'B2.2';
      if (p < 70) return 'B2.3';
      if (p < 85) return 'B2.4';
      return 'B2.5';
    case 'C1':
      return p < 50 ? 'C1.1' : 'C1.2';
    case 'C2':
      return 'C2';
    default:
      console.warn(`⚠️ Unknown CEFR band "${cefrBand}", defaulting to A1.1`);
      return 'A1.1';
  }
}

/**
 * Resolve sub-level code to DB row id in curriculum_levels
 */
export async function getSubLevelId(subLevelCode: string): Promise<number | null> {
  const rows = await db.execute(
    sql`SELECT id FROM curriculum_levels WHERE code = ${subLevelCode} LIMIT 1`
  );
  if (rows.rows.length === 0) {
    console.warn(`⚠️ curriculum_levels row not found for code "${subLevelCode}"`);
    return null;
  }
  return (rows.rows[0] as any).id as number;
}

/**
 * Compute and persist sub-level for a user based on their MST overall band + score
 * @param userId - user ID to update
 * @param overallBand - final CEFR band (e.g. 'B1', 'B1+', 'B2')
 * @param overallScore - overall 0-1 score (average of skill p values)
 * @returns the sub-level code that was stored
 */
export async function persistUserSubLevel(
  userId: number,
  overallBand: string,
  overallScore: number
): Promise<{ subLevelCode: string; subLevelId: number | null }> {
  const subLevelCode = computeSubLevelCode(overallBand, overallScore);
  const subLevelId = await getSubLevelId(subLevelCode);

  // Update user profile
  await db.execute(
    sql`UPDATE users SET sub_level_code = ${subLevelCode}, sub_level_id = ${subLevelId}, updated_at = now() WHERE id = ${userId}`
  );

  // Also update linked lead record (if the student has an associated lead — non-blocking)
  try {
    await db.execute(
      sql`UPDATE leads SET sub_level_code = ${subLevelCode}, sub_level_id = ${subLevelId}, updated_at = now() WHERE student_id = ${userId}`
    );
  } catch (leadErr) {
    console.warn(`⚠️ Could not update lead sub-level for user ${userId}:`, leadErr);
  }

  console.log(`✅ User ${userId} sub-level set to ${subLevelCode} (id=${subLevelId})`);
  return { subLevelCode, subLevelId };
}
