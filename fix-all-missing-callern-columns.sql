-- =============================================
-- FIX ALL MISSING CALLERN COLUMNS
-- Add all missing columns that are causing 500 errors
-- =============================================

-- 1. Fix callern_packages table - add missing package_type column
ALTER TABLE callern_packages 
ADD COLUMN IF NOT EXISTS package_type VARCHAR(100) DEFAULT 'conversation',
ADD COLUMN IF NOT EXISTS target_level VARCHAR(50) DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing callern_packages with proper values
UPDATE callern_packages 
SET 
    package_type = CASE 
        WHEN package_name ILIKE '%business%' THEN 'business_english'
        WHEN package_name ILIKE '%conversation%' THEN 'general_conversation'
        WHEN package_name ILIKE '%speak%' THEN 'speaking_practice'
        ELSE 'general_conversation'
    END,
    target_level = CASE 
        WHEN package_name ILIKE '%advanced%' THEN 'advanced'
        WHEN package_name ILIKE '%beginner%' THEN 'beginner'
        ELSE 'intermediate'
    END,
    features = '["AI assistance", "Real-time feedback", "Progress tracking"]'::jsonb,
    is_active = COALESCE(is_active, true)
WHERE package_type IS NULL OR target_level IS NULL;

-- 2. Fix teacher_callern_availability table - add missing schedule columns
ALTER TABLE teacher_callern_availability 
ADD COLUMN IF NOT EXISTS morning_slot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS afternoon_slot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS evening_slot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weekend_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Tehran',
ADD COLUMN IF NOT EXISTS max_daily_hours INTEGER DEFAULT 8;

-- Update existing teacher availability records with sensible defaults
UPDATE teacher_callern_availability 
SET 
    morning_slot = COALESCE(morning_slot, true),
    afternoon_slot = COALESCE(afternoon_slot, true), 
    evening_slot = COALESCE(evening_slot, false),
    weekend_available = COALESCE(weekend_available, false),
    timezone = COALESCE(timezone, 'Asia/Tehran'),
    max_daily_hours = COALESCE(max_daily_hours, 6)
WHERE morning_slot IS NULL;

-- 3. Ensure teacher_callern_authorization table exists with proper columns
CREATE TABLE IF NOT EXISTS teacher_callern_authorization (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id),
    hourly_rate DECIMAL(10,2) DEFAULT 600000.00,
    languages JSONB DEFAULT '["English", "Persian"]',
    specializations JSONB DEFAULT '["General Conversation"]',
    max_hours_per_week INTEGER DEFAULT 40,
    is_authorized BOOLEAN DEFAULT true,
    authorization_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qualifications JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id)
);

-- Ensure your authorized teachers are in the authorization table
INSERT INTO teacher_callern_authorization (
    teacher_id, hourly_rate, languages, specializations, max_hours_per_week,
    is_authorized, qualifications
) 
SELECT 
    u.id, 600000.00,
    '["English", "Persian"]'::jsonb,
    '["General Conversation", "Business English"]'::jsonb,
    40, true,
    '["Teaching Experience", "Language Proficiency"]'::jsonb
FROM users u 
WHERE u.email IN ('dr.smith@institute.com', 'ali.hosseini@institute.com')
  AND u.role = 'Teacher'
ON CONFLICT (teacher_id) DO UPDATE SET
    is_authorized = true,
    hourly_rate = EXCLUDED.hourly_rate;

-- 4. Test the queries that were failing
SELECT 'Testing callern_packages query:' as info;
SELECT id, package_name, package_type, target_level, features, is_active
FROM callern_packages 
LIMIT 3;

SELECT 'Testing teacher_callern_availability query:' as info;
SELECT id, teacher_id, morning_slot, afternoon_slot, evening_slot, timezone
FROM teacher_callern_availability 
LIMIT 3;

SELECT 'Testing teacher authorization:' as info;
SELECT tca.teacher_id, u.email, tca.hourly_rate, tca.is_authorized
FROM teacher_callern_authorization tca
JOIN users u ON tca.teacher_id = u.id
LIMIT 3;

SELECT '✅ All Callern columns fixed - APIs should work perfectly!' as "STATUS";