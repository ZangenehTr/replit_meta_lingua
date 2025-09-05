-- =============================================
-- FIX ROADMAP CREATION SCHEMA MISMATCH
-- The form is sending data that doesn't match the database schema
-- =============================================

-- Drop and recreate learning_roadmaps with schema that matches the Zod validation
DROP TABLE IF EXISTS learning_roadmaps CASCADE;

-- Create learning_roadmaps with the exact columns the schema expects
CREATE TABLE learning_roadmaps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Core roadmap fields that match the Zod schema
    "targetLanguage" VARCHAR(50) NOT NULL DEFAULT 'en',
    "targetLevel" VARCHAR(50) NOT NULL DEFAULT 'A1',
    difficulty VARCHAR(50) NOT NULL DEFAULT 'beginner',
    "estimatedWeeks" INTEGER NOT NULL DEFAULT 12,
    "weeklyHours" INTEGER NOT NULL DEFAULT 5,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    
    -- Optional fields
    prerequisites JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    "thumbnailUrl" VARCHAR(255),
    "iconName" VARCHAR(100),
    "accentColor" VARCHAR(20),
    
    -- Metadata
    "createdBy" INTEGER,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample roadmap that matches the form data structure
INSERT INTO learning_roadmaps (
    title, description, "targetLanguage", "targetLevel", 
    difficulty, "estimatedWeeks", "weeklyHours", "isPublic",
    "createdBy", "isActive"
) VALUES (
    'Learn To Speak - Roadmap',
    'This course is suitable for adults who plan to learn English within 12 weeks through CallerN 24/7 service',
    'English', 'B1', 'intermediate', 12, 10, true, 1, true
);

-- Test data that simulates the form submission
SELECT 'Testing roadmap creation with form data:' as info;

-- This simulates what the form sends
SELECT 
    'Learn To Speak - Roadmap' as title,
    'This course is suitable for adults who plan to learn English within 12 weeks through CallerN 24/7 service' as description,
    'English' as "targetLanguage",
    'B1' as "targetLevel", 
    'intermediate' as difficulty,
    12 as "estimatedWeeks",
    10 as "weeklyHours",
    true as "isPublic";

-- Verify the table structure matches what's expected
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'learning_roadmaps' 
  AND column_name IN ('title', 'description', 'targetLanguage', 'targetLevel', 'difficulty', 'estimatedWeeks', 'weeklyHours', 'isPublic')
ORDER BY column_name;

SELECT '✅ Learning roadmaps table recreated with correct schema!' as "STATUS";