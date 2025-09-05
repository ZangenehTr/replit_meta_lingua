-- =============================================
-- FIX ROADMAPS API 500 ERROR
-- Create missing tables for roadmaps functionality
-- =============================================

-- Create learning_roadmaps table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_level VARCHAR(50) DEFAULT 'A1',
    language VARCHAR(50) DEFAULT 'en',
    difficulty_level VARCHAR(50) DEFAULT 'beginner',
    estimated_duration_hours INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roadmap_milestones table if it doesn't exist
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

-- Create roadmap_steps table if it doesn't exist
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

-- Create user_roadmap_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roadmap_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    roadmap_id INTEGER REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    completed_steps INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    progress_percentage VARCHAR(10) DEFAULT '0',
    current_milestone_id INTEGER,
    current_step_id INTEGER,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_completion_date TIMESTAMP,
    completed_at TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_roadmap_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roadmap_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES user_roadmap_enrollments(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES roadmap_steps(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    score VARCHAR(10),
    time_spent_minutes INTEGER,
    notes TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roadmap_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS roadmap_reviews (
    id SERIAL PRIMARY KEY,
    roadmap_id INTEGER REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_helpful BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample roadmap data to test the endpoint
INSERT INTO learning_roadmaps (
    title, description, target_level, language, difficulty_level, 
    estimated_duration_hours, is_active, created_by
) VALUES (
    'English Conversation Fundamentals',
    'Build confidence in basic English conversation through structured lessons and practice sessions.',
    'A2', 'en', 'beginner', 20, true, 1
), (
    'Business English Communication',
    'Professional English skills for business meetings, presentations, and correspondence.',
    'B1', 'en', 'intermediate', 30, true, 1
) ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 
    'learning_roadmaps' as table_name, 
    COUNT(*) as record_count,
    '✅ Table exists' as status
FROM learning_roadmaps
UNION ALL
SELECT 
    'roadmap_milestones' as table_name, 
    COUNT(*) as record_count,
    '✅ Table exists' as status
FROM roadmap_milestones
UNION ALL
SELECT 
    'roadmap_steps' as table_name, 
    COUNT(*) as record_count,
    '✅ Table exists' as status
FROM roadmap_steps;

SELECT '🎯 Roadmaps API should now work!' as "FIXED";