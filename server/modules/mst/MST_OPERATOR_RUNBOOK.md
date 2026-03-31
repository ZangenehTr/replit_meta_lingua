# MST (Multi-Stage Test) — Operator Runbook

## Overview

The Placement Test uses a Multi-Stage Test (MST) design with three routing stages:

| Stage  | Target CEFR | Description                          |
|--------|-------------|--------------------------------------|
| core   | B1          | Entry stage — all test-takers start here |
| upper  | B2          | Adaptive branch for higher-ability   |
| lower  | A2          | Adaptive branch for lower-ability    |

A1, C1, and C2 items are seeded for completeness (curriculum gap analysis / future
multi-start MST expansion) but are **not** served by the current adaptive router.

---

## First-Time Setup

### 1. Apply database migration

```bash
npm run migrate:mst-indexes
```

This creates the idempotent `ALTER TABLE` and index DDL on `placement_test_questions`:
- `uidx_ptq_mst_item_id`   — unique partial index (prevents duplicate seeds)
- `idx_ptq_skill_cefr_stage` — lookup composite index

### 2. Seed the question bank (Ollama — default, self-hosted)

```bash
npm run seed:mst
```

The seeder targets an Ollama instance at `OLLAMA_HOST` (default: `http://localhost:11434`).
It will generate items for every `skill × CEFR × stage` cell and store IRT calibration
parameters (`difficulty`, `discrimination`) alongside the question content.

**Dry run** (generates items but does NOT write to DB):

```bash
npm run seed:mst:dry
```

**Partial run** (seed only 3 items per cell, useful for smoke-testing):

```bash
npm run seed:mst -- --count 3
```

### 3. Seed the question bank (OpenAI fallback — opt-in)

```bash
MST_ALLOW_OPENAI=true npm run seed:mst
```

OpenAI is **disabled by default** to ensure offline compatibility.
Set `MST_ALLOW_OPENAI=true` only in environments where outbound API calls are permitted.

### 4. Generate audio for listening items

```bash
npm run generate:mst-audio:db    # reads from DB (default, recommended)
npm run generate:mst-audio       # reads from JSON item bank
```

Generated audio paths are written back to the `content` column in `placement_test_questions`.

### 5. Restart the application

After seeding, restart the service so the in-memory item bank is refreshed:

```bash
# Development
npm run dev

# Production (Docker Compose)
docker compose restart app
```

---

## Seeding Scripts Reference

| Script | Source | Purpose |
|--------|--------|---------|
| `npm run seed:mst` | AI (Ollama / OpenAI) | **Primary seeder** — generates new items from AI, writes IRT-calibrated params, idempotent top-up |
| `npm run seed:mst:dry` | AI (dry run) | Preview what would be seeded without writing to DB |
| `npm run seed:mst-json` | JSON import | One-time static import from a pre-prepared JSON file; useful for bootstrapping or bulk imports |

**Use `seed:mst`** for ongoing seeding — it checks what's already in the DB and only generates what's missing (per-cell idempotent).

**Use `seed:mst-json`** only when you have a prepared JSON item-bank file and want to do a bulk import without AI generation (e.g., curriculum specialist-authored content).

---

## Ongoing Operations

### Re-seed a single skill

```bash
npm run seed:mst -- --skill listening
npm run seed:mst -- --skill reading --count 5
```

### Check item counts per cell

```sql
SELECT skill, cefr_level, stage, COUNT(*) AS n
FROM placement_test_questions
WHERE is_active = true
GROUP BY skill, cefr_level, stage
ORDER BY skill, cefr_level, stage;
```

The runtime adaptive router requires **≥ 3 items per cell** before it stops falling back
to the static JSON item bank (`server/data/mst_item_bank.json`).

### Check index health

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'placement_test_questions';
```

Expected indexes: `uidx_ptq_mst_item_id`, `idx_ptq_skill_cefr_stage`.

---

## Fallback Strategy (Priority Order)

1. **DB items** — `placement_test_questions` rows where `is_active = true`, filtered by
   `skill + cefr_level + stage`. These carry IRT calibration parameters and are preferred.
2. **JSON top-up** — static `server/data/mst_item_bank.json` is consulted when a cell has
   fewer than 3 DB items. JSON items have no `mst_item_id` and use default IRT params.
3. **Hard-coded last resort** — a single minimal item per skill. This ensures the MST
   never crashes; it should never appear in production after seeding.

---

## Environment Variables

| Variable           | Default                    | Purpose                          |
|--------------------|----------------------------|----------------------------------|
| `OLLAMA_HOST`      | `http://localhost:11434`   | Ollama endpoint for AI seeding   |
| `OLLAMA_MODEL`     | `llama3.2:3b`              | Ollama model for content gen     |
| `MST_ALLOW_OPENAI` | `false`                    | Opt-in for OpenAI seeding fallback |
| `OPENAI_API_KEY`   | —                          | Required only if `MST_ALLOW_OPENAI=true` |
| `DATABASE_URL`     | (Replit Neon / local PG)   | Target database                  |
