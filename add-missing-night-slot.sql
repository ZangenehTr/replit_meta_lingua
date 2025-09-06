-- =============================================
-- ADD MISSING NIGHT_SLOT COLUMN
-- Quick fix for teacher availability errors
-- =============================================

-- Add the missing night_slot column
ALTER TABLE teacher_callern_availability 
ADD COLUMN IF NOT EXISTS night_slot BOOLEAN DEFAULT false;

-- Update existing records with default values
UPDATE teacher_callern_availability 
SET night_slot = false
WHERE night_slot IS NULL;

-- Test that the column exists and queries work
SELECT 'Testing teacher availability with all slots:' as info;
SELECT 
    id, teacher_id, 
    morning_slot, afternoon_slot, evening_slot, night_slot,
    weekend_available, timezone
FROM teacher_callern_availability 
LIMIT 3;

-- Show the complete table structure
SELECT 'Teacher availability table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_callern_availability'
ORDER BY column_name;

SELECT '✅ Night slot column added - teacher availability should work!' as "STATUS";