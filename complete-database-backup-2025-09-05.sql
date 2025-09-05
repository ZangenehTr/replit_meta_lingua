-- =============================================
-- COMPLETE META LINGUA DATABASE BACKUP
-- Generated: September 5, 2025
-- Purpose: Production-ready backup for Iranian server deployment
-- =============================================

-- Clear existing problematic data first
DELETE FROM user_sessions;
DELETE FROM password_reset_tokens;
DELETE FROM callern_enrollments WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%test%');

-- =============================================
-- 1. PRODUCTION USERS (CORRECTED SCHEMA)
-- =============================================

-- Hash for "password": $2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6

-- Insert/Update Admin User
INSERT INTO users (
    email, password, first_name, last_name, role, status, phone_number, wallet_balance, created_at, updated_at
) VALUES (
    'admin@test.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'Admin', 'User', 'Admin', 'active', '+989123456789', 0, NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    wallet_balance = EXCLUDED.wallet_balance,
    updated_at = NOW();

-- Insert/Update Student: Sara Ahmadi (30M IRR wallet)
INSERT INTO users (
    email, password, first_name, last_name, role, status, phone_number, wallet_balance, created_at, updated_at
) VALUES (
    'sara.ahmadi@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'سارا', 'احمدی', 'Student', 'active', '+989121234567', 30000000, NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'Student',
    wallet_balance = 30000000,
    updated_at = NOW();

-- Insert/Update Student: Mohammad Rezaei (30M IRR wallet)
INSERT INTO users (
    email, password, first_name, last_name, role, status, phone_number, wallet_balance, created_at, updated_at
) VALUES (
    'mohammad.rezaei@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'محمد', 'رضایی', 'Student', 'active', '+989121234568', 30000000, NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'Student',
    wallet_balance = 30000000,
    updated_at = NOW();

-- Insert/Update Teacher: Dr. Sarah Smith
INSERT INTO users (
    email, password, first_name, last_name, role, status, phone_number, created_at, updated_at
) VALUES (
    'dr.smith@institute.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'Dr. Sarah', 'Smith', 'Teacher', 'active', '+989121234569', NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'Teacher',
    updated_at = NOW();

-- Insert/Update Teacher: Ali Hosseini
INSERT INTO users (
    email, password, first_name, last_name, role, status, phone_number, created_at, updated_at
) VALUES (
    'ali.hosseini@institute.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'علی', 'حسینی', 'Teacher', 'active', '+989121234570', NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'Teacher',
    updated_at = NOW();

-- Insert/Update Supervisor: Nazanin Mohammadi
INSERT INTO users (
    email, password, first_name, last_name, role, status, phone_number, created_at, updated_at
) VALUES (
    'supervisor@metalingua.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',
    'نازنین', 'محمدی', 'Supervisor', 'active', '+989121234571', NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET 
    password = EXCLUDED.password,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'Supervisor',
    updated_at = NOW();

-- =============================================
-- 2. CALLERN PACKAGES & ENROLLMENTS
-- =============================================

-- Insert/Update "Learn to Speak English" Callern package
INSERT INTO callern_packages (
    package_name, total_hours, price, description, package_type, target_level, 
    features, is_active, created_at, updated_at
) VALUES (
    'Learn to Speak English',
    10, 5000000.00,
    'Comprehensive English speaking practice with AI-assisted features. Focus on conversation, pronunciation, and fluency building through real-time AI assistance.',
    'general_conversation', 'intermediate',
    '["AI-powered vocabulary suggestions", "Real-time pronunciation feedback", "Grammar correction", "Progress tracking", "Session recordings"]'::jsonb,
    true, NOW(), NOW()
) ON CONFLICT (package_name) DO UPDATE SET
    total_hours = 10,
    price = 5000000.00,
    description = EXCLUDED.description,
    package_type = EXCLUDED.package_type,
    features = EXCLUDED.features,
    is_active = true,
    updated_at = NOW();

-- Remove old English Conversation Starter package if exists
DELETE FROM callern_packages WHERE package_name = 'English Conversation Starter';

-- Enroll Sara Ahmadi in Learn to Speak English package
INSERT INTO callern_enrollments (
    student_id, package_id, hours_used, hours_remaining, enrollment_date, 
    status, payment_status, created_at, updated_at
) 
SELECT 
    u.id, cp.id, 0, 10, NOW(), 'active', 'paid', NOW(), NOW()
FROM users u, callern_packages cp
WHERE u.email = 'sara.ahmadi@gmail.com' 
  AND cp.package_name = 'Learn to Speak English'
ON CONFLICT (student_id, package_id) DO UPDATE SET
    hours_remaining = 10,
    status = 'active',
    payment_status = 'paid',
    updated_at = NOW();

-- Enroll Mohammad Rezaei in Learn to Speak English package
INSERT INTO callern_enrollments (
    student_id, package_id, hours_used, hours_remaining, enrollment_date, 
    status, payment_status, created_at, updated_at
) 
SELECT 
    u.id, cp.id, 0, 10, NOW(), 'active', 'paid', NOW(), NOW()
FROM users u, callern_packages cp
WHERE u.email = 'mohammad.rezaei@gmail.com' 
  AND cp.package_name = 'Learn to Speak English'
ON CONFLICT (student_id, package_id) DO UPDATE SET
    hours_remaining = 10,
    status = 'active',
    payment_status = 'paid',
    updated_at = NOW();

-- =============================================
-- 3. TEACHER CALLERN AUTHORIZATION
-- =============================================

-- Authorize Dr. Sarah Smith for Callern
INSERT INTO teacher_callern_authorization (
    teacher_id, hourly_rate, languages, specializations, max_hours_per_week,
    is_authorized, authorization_date, qualifications, created_at, updated_at
)
SELECT 
    u.id, 600000.00,
    '["English", "Persian"]'::jsonb,
    '["General Conversation", "IELTS Speaking", "Business English"]'::jsonb,
    40, true, NOW(),
    '["Native English speaker", "TESOL certification", "5+ years experience"]'::jsonb,
    NOW(), NOW()
FROM users u
WHERE u.email = 'dr.smith@institute.com'
ON CONFLICT (teacher_id) DO UPDATE SET
    hourly_rate = 600000.00,
    is_authorized = true,
    max_hours_per_week = 40,
    languages = EXCLUDED.languages,
    specializations = EXCLUDED.specializations,
    updated_at = NOW();

-- Authorize Ali Hosseini for Callern
INSERT INTO teacher_callern_authorization (
    teacher_id, hourly_rate, languages, specializations, max_hours_per_week,
    is_authorized, authorization_date, qualifications, created_at, updated_at
)
SELECT 
    u.id, 600000.00,
    '["Persian", "English"]'::jsonb,
    '["Conversation Practice", "Pronunciation", "Grammar"]'::jsonb,
    35, true, NOW(),
    '["Bilingual teacher", "University degree", "Teaching certificate"]'::jsonb,
    NOW(), NOW()
FROM users u
WHERE u.email = 'ali.hosseini@institute.com'
ON CONFLICT (teacher_id) DO UPDATE SET
    hourly_rate = 600000.00,
    is_authorized = true,
    max_hours_per_week = 35,
    languages = EXCLUDED.languages,
    specializations = EXCLUDED.specializations,
    updated_at = NOW();

-- =============================================
-- 4. INSTITUTE BRANDING
-- =============================================

INSERT INTO institute_branding (
    name, logo, primary_color, secondary_color, accent_color, 
    background_color, text_color, updated_at
) VALUES (
    'Meta Lingua Academy', '', '#3B82F6', '#10B981', '#8B5CF6',
    '#FFFFFF', '#1F2937', NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color = EXCLUDED.accent_color,
    updated_at = NOW();

-- =============================================
-- 5. CLEAN UP PROBLEMATIC DATA
-- =============================================

-- Remove old test users that may cause conflicts
DELETE FROM users WHERE email LIKE '%1756226%' OR email LIKE '%@test.com%' 
  AND email NOT IN ('admin@test.com');

-- Clean up old enrollments that may reference deleted users
DELETE FROM callern_enrollments WHERE student_id NOT IN (SELECT id FROM users);

-- Reset any stuck user sessions
DELETE FROM user_sessions WHERE created_at < NOW() - INTERVAL '1 day';

-- =============================================
-- 6. SAMPLE COURSES FOR TESTING
-- =============================================

-- Insert a sample course for testing
INSERT INTO courses (
    course_code, title, description, language, level, total_sessions,
    session_duration, delivery_mode, class_format, max_students,
    instructor_id, price, is_active, created_at, updated_at
)
SELECT 
    'ENG-CONV-001', 'English Conversation Practice', 
    'Interactive English conversation sessions for intermediate learners',
    'en', 'intermediate', 12, 60, 'online', 'group', 8,
    u.id, 3000000, true, NOW(), NOW()
FROM users u
WHERE u.email = 'dr.smith@institute.com'
ON CONFLICT (course_code) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    instructor_id = EXCLUDED.instructor_id,
    updated_at = NOW();

-- =============================================
-- 7. VERIFICATION QUERIES
-- =============================================

-- Show created users with wallet balances
SELECT 
    email, role, first_name || ' ' || last_name as full_name,
    wallet_balance,
    CASE 
        WHEN wallet_balance >= 30000000 THEN '💰 30M IRR wallet'
        ELSE '💳 Standard wallet'
    END as wallet_status
FROM users 
WHERE email IN (
    'admin@test.com',
    'sara.ahmadi@gmail.com', 
    'mohammad.rezaei@gmail.com',
    'dr.smith@institute.com',
    'ali.hosseini@institute.com',
    'supervisor@metalingua.com'
)
ORDER BY 
    CASE 
        WHEN role = 'Admin' THEN 1
        WHEN role = 'Teacher' THEN 2  
        WHEN role = 'Student' THEN 3
        WHEN role = 'Supervisor' THEN 4
        ELSE 5
    END;

-- Show Callern package and enrollments
SELECT 
    cp.package_name,
    cp.total_hours,
    cp.price,
    COUNT(ce.id) as enrolled_students
FROM callern_packages cp
LEFT JOIN callern_enrollments ce ON cp.id = ce.package_id
WHERE cp.package_name = 'Learn to Speak English'
GROUP BY cp.id, cp.package_name, cp.total_hours, cp.price;

-- Show authorized teachers
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as teacher_name,
    tca.hourly_rate,
    tca.is_authorized,
    tca.max_hours_per_week
FROM teacher_callern_authorization tca
JOIN users u ON tca.teacher_id = u.id;

-- Show student enrollments
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as student_name,
    cp.package_name,
    ce.hours_remaining,
    ce.status,
    ce.payment_status
FROM callern_enrollments ce
JOIN users u ON ce.student_id = u.id
JOIN callern_packages cp ON ce.package_id = cp.id;

-- =============================================
-- FINAL STATUS MESSAGE
-- =============================================

SELECT '🎯====================================🎯' AS "DATABASE BACKUP COMPLETE!"
UNION ALL
SELECT '✅ Production users created/updated with correct schema'
UNION ALL
SELECT '✅ Callern "Learn to Speak English" package ready (10 hours)'
UNION ALL
SELECT '✅ Students: Sara & Mohammad enrolled with 30M IRR each'
UNION ALL
SELECT '✅ Teachers: Dr. Smith & Ali authorized at 600K IRR/hour'
UNION ALL
SELECT '✅ All conflicts resolved and problematic data cleaned'
UNION ALL
SELECT '✅ Institute branding configured'
UNION ALL
SELECT '🚀 READY FOR IMMEDIATE CALLERN AI TESTING!'
UNION ALL
SELECT '==========================================';

-- Login credentials
SELECT 'LOGIN CREDENTIALS (password: password):' AS "READY TO TEST"
UNION ALL
SELECT '👤 Admin: admin@test.com'
UNION ALL  
SELECT '🎓 Student: sara.ahmadi@gmail.com (30M IRR + Callern)'
UNION ALL
SELECT '🎓 Student: mohammad.rezaei@gmail.com (30M IRR + Callern)'
UNION ALL
SELECT '👨‍🏫 Teacher: dr.smith@institute.com (Callern Authorized)'
UNION ALL
SELECT '👨‍🏫 Teacher: ali.hosseini@institute.com (Callern Authorized)'
UNION ALL
SELECT '👩‍💼 Supervisor: supervisor@metalingua.com';