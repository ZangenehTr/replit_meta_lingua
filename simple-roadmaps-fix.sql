-- =============================================
-- SIMPLE ROADMAPS FIX - CREATE MISSING TABLE
-- Run this if learning_roadmaps doesn't exist
-- =============================================

-- Create the learning_roadmaps table that the API expects
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "targetLevel" VARCHAR(50) DEFAULT 'A1',
    language VARCHAR(50) DEFAULT 'en',
    "difficultyLevel" VARCHAR(50) DEFAULT 'beginner',
    "estimatedDurationHours" INTEGER DEFAULT 40,
    "isActive" BOOLEAN DEFAULT true,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample roadmaps to make the API work
INSERT INTO learning_roadmaps (
    title, description, "targetLevel", language, "difficultyLevel", 
    "estimatedDurationHours", "isActive", "createdBy"
) VALUES 
(
    'English Conversation Practice',
    'Build confidence in English conversation through structured practice sessions.',
    'A2', 'en', 'beginner', 20, true, 1
),
(
    'Business English Fundamentals', 
    'Professional English skills for workplace communication and meetings.',
    'B1', 'en', 'intermediate', 30, true, 1
),
(
    'IELTS Speaking Preparation',
    'Comprehensive IELTS speaking test preparation with mock tests and feedback.',
    'B2', 'en', 'intermediate', 25, true, 1
) ON CONFLICT (id) DO NOTHING;

-- Test the API query
SELECT id, title, description, "isActive", "createdAt"
FROM learning_roadmaps 
WHERE "isActive" = true 
ORDER BY "createdAt" DESC;

SELECT '✅ Roadmaps API should work now!' as "STATUS";