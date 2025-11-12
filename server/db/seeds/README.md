# Database Seeds

This directory contains SQL seed files for initializing or updating database content across environments.

## Curriculum Categories

**File**: `curriculum-categories.sql`

**Purpose**: Ensures consistent curriculum category structure across all environments (development, staging, production).

**Changes Applied**:
- Removed general "Test Prep" and "Academic English" categories
- Added 5 specific test prep categories:
  - IELTS Test Prep (آمادگی آزمون آیلتس)
  - TOEFL Test Prep (آمادگی آزمون تافل)
  - GRE Test Prep (آمادگی آزمون GRE)
  - PTE Test Prep (آمادگی آزمون PTE)
  - Vocabulary Etymology (دوره ریشه‌شناسی لغات)
- Updated "Conversation & Fluency" to "English Conversation" (مکالمه زبان انگلیسی)
- Reordered categories for proper display

**How to Run**:

```bash
# Development (already applied)
psql $DATABASE_URL -f server/db/seeds/curriculum-categories.sql

# Production (Iranian self-hosted)
psql -h localhost -U postgres -d metalingua -f server/db/seeds/curriculum-categories.sql
```

**Note**: The SQL uses `ON CONFLICT (slug) DO NOTHING` to safely re-run the script without duplicating categories.
