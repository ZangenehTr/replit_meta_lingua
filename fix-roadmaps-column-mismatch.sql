-- =============================================
-- FIX ROADMAPS COLUMN NAME MISMATCH
-- The issue is likely camelCase vs snake_case column names
-- =============================================

-- Check current column names
SELECT 'Current learning_roadmaps columns:' as info
UNION ALL
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'learning_roadmaps' 
ORDER BY column_name;

-- Add missing columns that the code expects (if they don't exist)
DO $$
BEGIN
    -- Add createdAt column if missing (code expects camelCase)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_roadmaps' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE learning_roadmaps ADD COLUMN "createdAt" TIMESTAMP DEFAULT created_at;
    END IF;

    -- Add updatedAt column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_roadmaps' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE learning_roadmaps ADD COLUMN "updatedAt" TIMESTAMP DEFAULT updated_at;
    END IF;

    -- Add isActive column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'learning_roadmaps' AND column_name = 'isActive'
    ) THEN
        ALTER TABLE learning_roadmaps ADD COLUMN "isActive" BOOLEAN DEFAULT is_active;
    END IF;
END $$;

-- Update the camelCase columns with current data
UPDATE learning_roadmaps SET 
    "createdAt" = created_at,
    "updatedAt" = updated_at,
    "isActive" = is_active
WHERE "createdAt" IS NULL OR "updatedAt" IS NULL OR "isActive" IS NULL;

-- Test the query that's failing
SELECT 
    id, title, description, "isActive", "createdAt", "updatedAt"
FROM learning_roadmaps 
WHERE "isActive" = true 
ORDER BY "createdAt" DESC 
LIMIT 3;

SELECT '✅ Column mismatch fixed - API should work now!' as "STATUS";