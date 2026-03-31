/**
 * Sub-level Mapper
 * Maps MST CEFR band + per-skill score → deterministic 17-point sub-level
 * and persists to user profile.
 */

import { db } from '../../db';
import { sql } from 'drizzle-orm';

// ────────────────────────────────────────────────────────────────────────────
// Mapping table: cefrBand + score-bracket → sub-level code
// Score (p) is in 0-1 range from MST quickscore
// ────────────────────────────────────────────────────────────────────────────
const CEFR_SUBLEVEL_MAP: Record<string, { min: number; max: number; code: string }[]> = {
  A1: [
    { min: 0.00, max: 0.49, code: 'A1.1' },
    { min: 0.50, max: 1.00, code: 'A1.2' },
  ],
  A2: [
    { min: 0.00, max: 0.49, code: 'A2.1' },
    { min: 0.50, max: 1.00, code: 'A2.2' },
  ],
  B1: [
    { min: 0.00, max: 0.19, code: 'B1.1' },
    { min: 0.20, max: 0.39, code: 'B1.2' },
    { min: 0.40, max: 0.59, code: 'B1.3' },
    { min: 0.60, max: 0.79, code: 'B1.4' },
    { min: 0.80, max: 1.00, code: 'B1.5' },
  ],
  B2: [
    { min: 0.00, max: 0.19, code: 'B2.1' },
    { min: 0.20, max: 0.39, code: 'B2.2' },
    { min: 0.40, max: 0.59, code: 'B2.3' },
    { min: 0.60, max: 0.79, code: 'B2.4' },
    { min: 0.80, max: 1.00, code: 'B2.5' },
  ],
  C1: [
    { min: 0.00, max: 0.49, code: 'C1.1' },
    { min: 0.50, max: 1.00, code: 'C1.2' },
  ],
  C2: [
    { min: 0.00, max: 1.00, code: 'C2' },
  ],
};

/**
 * Determine sub-level code from CEFR band and normalised score (0-1)
 */
export function computeSubLevelCode(cefrBand: string, scoreP: number): string {
  // Strip +/- modifier
  const baseBand = cefrBand.replace(/[+-]$/, '');
  const brackets = CEFR_SUBLEVEL_MAP[baseBand];

  if (!brackets) {
    // Unknown band — fall back to first A1 sub-level
    console.warn(`⚠️ Unknown CEFR band "${cefrBand}", defaulting to A1.1`);
    return 'A1.1';
  }

  const p = Math.max(0, Math.min(1, scoreP));
  for (const bracket of brackets) {
    if (p >= bracket.min && p <= bracket.max) {
      return bracket.code;
    }
  }

  // Fallback to last bracket in the band
  return brackets[brackets.length - 1].code;
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

  await db.execute(
    sql`UPDATE users SET sub_level_code = ${subLevelCode}, sub_level_id = ${subLevelId}, updated_at = now() WHERE id = ${userId}`
  );

  console.log(`✅ User ${userId} sub-level set to ${subLevelCode} (id=${subLevelId})`);
  return { subLevelCode, subLevelId };
}
