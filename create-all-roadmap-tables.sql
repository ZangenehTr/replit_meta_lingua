-- =============================================
-- CREATE ALL MISSING ROADMAP TABLES
-- This will create all tables needed for roadmaps API
-- =============================================

-- 1. Create learning_roadmaps table (needed by roadmap-routes.ts)
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_level VARCHAR(50) DEFAULT 'A1',
    language VARCHAR(50) DEFAULT 'en',
    difficulty_level VARCHAR(50) DEFAULT 'beginner',
    estimated_duration_hours INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create callern_roadmaps table (needed by other routes)
CREATE TABLE IF NOT EXISTS callern_roadmaps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50) DEFAULT 'intermediate',
    total_steps INTEGER DEFAULT 10,
    estimated_hours INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create roadmap steps table
CREATE TABLE IF NOT EXISTS callern_roadmap_steps (
    id SERIAL PRIMARY KEY,
    roadmap_id INTEGER REFERENCES callern_roadmaps(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    step_type VARCHAR(50) DEFAULT 'conversation',
    estimated_minutes INTEGER DEFAULT 30,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create roadmap milestones table (for learning_roadmaps)
CREATE TABLE IF NOT EXISTS roadmap_milestones (
    id SERIAL PRIMARY KEY,
    roadmap_id INTEGER REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_duration_hours INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create roadmap steps table (for learning_roadmaps)
CREATE TABLE IF NOT EXISTS roadmap_steps (
    id SERIAL PRIMARY KEY,
    milestone_id INTEGER REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    step_type VARCHAR(50) DEFAULT 'lesson',
    content JSONB DEFAULT '{}',
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_duration_minutes INTEGER DEFAULT 30,
    completion_criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for learning_roadmaps
INSERT INTO learning_roadmaps (
    title, description, target_level, language, difficulty_level, 
    estimated_duration_hours, is_active, "isActive", created_by
) VALUES 
(
    'English Conversation Mastery',
    'Master English conversation through AI-assisted practice sessions.',
    'B1', 'en', 'intermediate', 25, true, true, 1
),
(
    'Business English Communication',
    'Professional English skills for workplace success.',
    'B2', 'en', 'intermediate', 30, true, true, 1
),
(
    'IELTS Speaking Preparation',
    'Comprehensive IELTS speaking preparation with real practice.',
    'B2', 'en', 'advanced', 20, true, true, 1
) ON CONFLICT (id) DO NOTHING;

-- Insert sample data for callern_roadmaps
INSERT INTO callern_roadmaps (
    name, description, difficulty_level, total_steps, estimated_hours, is_active, created_by
) VALUES 
(
    'English Conversation Fundamentals',
    'Build confidence in English conversation with AI assistance.',
    'intermediate', 12, 20, true, 1
),
(
    'Business Meeting Skills',
    'Professional English for meetings and presentations.',
    'intermediate', 15, 25, true, 1
) ON CONFLICT (id) DO NOTHING;

-- Update camelCase columns to match snake_case (for compatibility)
UPDATE learning_roadmaps SET 
    "isActive" = is_active,
    "createdAt" = created_at,
    "updatedAt" = updated_at;

-- Test both API endpoints
SELECT 'Learning Roadmaps (for /api/roadmaps):' as info;
SELECT id, title, description, "isActive", "createdAt"
FROM learning_roadmaps 
WHERE "isActive" = true 
ORDER BY "createdAt" DESC
LIMIT 3;

SELECT 'Callern Roadmaps (for /api/admin/callern/roadmaps):' as info;
SELECT id, name, description, is_active, created_at
FROM callern_roadmaps 
WHERE is_active = true
LIMIT 3;

SELECT '✅ All roadmap tables created - APIs should work now!' as "STATUS";