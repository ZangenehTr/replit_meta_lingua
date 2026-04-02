import { createInsertSchema } from "drizzle-zod";
import type { Table } from "drizzle-orm";
import { z } from "zod";

/**
 * Typed wrapper for drizzle-zod's createInsertSchema().omit().
 *
 * drizzle-zod ≥0.7 with Bundler/ESNext module resolution cannot infer
 * column types for tables that carry FK references to columns defined in
 * other compilation units.  When that happens `createInsertSchema(table)`
 * returns a `ZodObject<{}>` whose `.omit()` keys all collapse to `never`,
 * making the call-site un-typeable without an escape hatch.
 *
 * This helper confines the one unavoidable `as` cast to a single place and
 * exposes a clean, call-site-safe API.  The return type is
 * `z.ZodObject<Record<string, z.ZodTypeAny>>` — the caller can always
 * re-narrow with `ReturnType<typeof buildInsertSchema<T, K>>` if needed.
 */
export function buildInsertSchema<TTable extends Table>(
  table: TTable,
  omit: Partial<Record<string, true>>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const base = createInsertSchema(table) as z.ZodObject<Record<string, z.ZodTypeAny>>;
  const mask = omit as Parameters<typeof base.omit>[0];
  return base.omit(mask);
}
