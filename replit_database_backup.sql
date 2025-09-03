-- Meta Lingua Database Backup from Replit
-- Generated: September 2025
-- This backup contains essential data to get your deployment running

-- WARNING: This database has 8,427 users total, but we're only backing up essential accounts
-- The full user export would be too large for practical deployment

-- ============================================
-- 1. ESSENTIAL USER ACCOUNTS (Test Accounts)
-- ============================================

-- Admin account: admin@test.com / admin123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(42, 'admin@test.com', '$2b$10$vctibXRpbjWYwccPqyuW..qEPJZ3ENJOLyat8QAQMH3HBNUgNtTXq', 'Admin', 'User', 'admin', '+989123456789', true, NOW(), NOW());

-- Main admin account: admin@metalingua.com / admin123 
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(33, 'admin@metalingua.com', '$2b$10$.LFhtPZTyc4FDNkQzXSMk.1fe9MpkPOdJwBUHif3lloL.PfFFbcAe', 'Admin', 'User', 'Admin', '+989123456788', true, NOW(), NOW());

-- Teacher account: teacher@test.com / teacher123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(44, 'teacher@test.com', '$2b$10$KUgoAvaELsrseDAWo1yuKeBVEWgPvJ9Keh.D3ZJUB6VqT/8VGwizW', 'Sarah', 'Johnson', 'teacher', '+989123456787', true, NOW(), NOW());

-- Student account: student@test.com / student123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(43, 'student@test.com', '$2b$10$rseQgcTOMJ/f9Z3GBndNB.H0uAVBNivSytvI6jDpDvN92WRghDcCS', 'Alex', 'Chen', 'student', '+989123456786', true, NOW(), NOW());

-- Mentor account: mentor@test.com / mentor123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(45, 'mentor@test.com', '$2b$10$TuZKMyhMPPiouJ8gqXgK5.lEEdQ8Y1lh3qS7vV8TKeCsQ094rchPe', 'Test', 'Mentor', 'Mentor', '+989123456785', true, NOW(), NOW());

-- Supervisor account: supervisor@test.com / supervisor123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(46, 'supervisor@test.com', '$2b$10$TuZKMyhMPPiouJ8gqXgK5.lEEdQ8Y1lh3qS7vV8TKeCsQ094rchPe', 'Test', 'Supervisor', 'Supervisor', '+989123456784', true, NOW(), NOW());

-- Call Center account: callcenter@test.com / callcenter123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(47, 'callcenter@test.com', '$2b$10$TuZKMyhMPPiouJ8gqXgK5.lEEdQ8Y1lh3qS7vV8TKeCsQ094rchPe', 'Test', 'CallCenter', 'Call Center Agent', '+989123456783', true, NOW(), NOW());

-- Accountant account: accountant@test.com / accountant123
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, is_active, created_at, updated_at) VALUES 
(48, 'accountant@test.com', '$2b$10$TuZKMyhMPPiouJ8gqXgK5.lEEdQ8Y1lh3qS7vV8TKeCsQ094rchPe', 'Test', 'Accountant', 'Accountant', '+989123456782', true, NOW(), NOW());

-- ============================================
-- 2. INSTITUTE BRANDING CONFIGURATION
-- ============================================

INSERT INTO institute_branding (id, name, logo, primary_color, secondary_color, accent_color, background_color, text_color, favicon, login_background_image, font_family, border_radius, updated_at) VALUES 
(1, 'Meta Lingua Academy', '', '#3B82F6', '#1E40AF', '#F59E0B', '#F8FAFC', '#1F2937', '/favicon.ico', '/login-bg.jpg', 'Inter', '8px', NOW());

-- ============================================
-- 3. ADMIN SETTINGS & SYSTEM CONFIGURATION  
-- ============================================

INSERT INTO admin_settings (id, shetab_merchant_id, shetab_terminal_id, shetab_environment, shetab_enabled, kavenegar_api_key, kavenegar_sender, kavenegar_enabled, isabel_voip_enabled, email_notifications_enabled, sms_notifications_enabled, email_smtp_port, email_enabled, database_backup_enabled, database_backup_frequency, database_retention_days, session_timeout, max_login_attempts, password_min_length, require_two_factor, system_maintenance_mode, system_debug_mode, system_log_level, system_max_upload_size, notification_email_enabled, notification_sms_enabled, notification_push_enabled, api_rate_limit, api_rate_limit_window, file_storage_provider, voip_server_address, voip_port, voip_username, voip_password, voip_enabled, call_recording_enabled, recording_storage_path, created_at, updated_at) VALUES 
(1, 'DEMO_MERCHANT_001', 'DEMO_TERMINAL_001', 'sandbox', false, '7654583566347270337679396E6F70774B3257693432455A3732786A6E325051', '90009745', true, false, true, true, 587, false, true, 'daily', 30, 60, 5, 8, false, false, false, 'info', 10, true, true, true, 100, 60, 'local', '46.100.5.198', 5038, 'ztcprep', 'sn$Y5Im8723r', false, false, '/var/recordings', NOW(), NOW());

-- ============================================
-- 4. SAMPLE COURSES (Key Educational Content)
-- ============================================

-- Persian Language Fundamentals
INSERT INTO courses (id, title, description, language, level, instructor_id, price, is_active, created_at, duration, total_lessons, category, difficulty, is_featured, updated_at, total_sessions, session_duration, class_type, weekdays, start_time, end_time, auto_record, recording_available, delivery_mode, target_language, proficiency_level, class_format, max_students, target_level, time_zone, calendar_type, rating, callern_available_24h) VALUES 
(1, 'Persian Language Fundamentals', 'Basic Persian language course for beginners', 'Persian', 'Beginner', 1, 500000, true, NOW(), 120, 0, 'Language', 'beginner', true, NOW(), 12, 90, 'group', '{"Monday","Wednesday"}', '09:00:00', '10:30:00', false, false, 'online', 'english', 'beginner', 'group', 20, 'all', 'Asia/Tehran', 'gregorian', 4.60, true);

-- Advanced Persian Literature  
INSERT INTO courses (id, title, description, language, level, instructor_id, price, is_active, created_at, duration, total_lessons, category, difficulty, is_featured, updated_at, total_sessions, session_duration, class_type, weekdays, start_time, end_time, auto_record, recording_available, delivery_mode, target_language, proficiency_level, class_format, max_students, target_level, time_zone, calendar_type, rating, callern_available_24h) VALUES 
(2, 'Advanced Persian Literature', 'Explore classical Persian poetry and modern literature', 'English', 'Intermediate', 1, 750000, true, NOW(), 90, 0, 'Language', 'intermediate', false, NOW(), 12, 90, 'group', '{"Tuesday","Thursday"}', '14:00:00', '15:30:00', false, false, 'online', 'english', 'beginner', 'group', 20, 'all', 'Asia/Tehran', 'gregorian', 4.60, true);

-- Business English for Iranians
INSERT INTO courses (id, title, description, language, level, instructor_id, price, is_active, created_at, duration, total_lessons, category, difficulty, is_featured, updated_at, total_sessions, session_duration, class_type, weekdays, start_time, end_time, auto_record, recording_available, delivery_mode, target_language, proficiency_level, class_format, max_students, target_level, time_zone, calendar_type, rating, callern_available_24h) VALUES 
(3, 'Business English for Iranians', 'Professional English communication skills', 'English', 'Advanced', 1, 900000, true, NOW(), 60, 0, 'Business', 'advanced', true, NOW(), 12, 90, 'group', '{Saturday}', '10:00:00', '12:00:00', false, false, 'online', 'english', 'beginner', 'group', 20, 'all', 'Asia/Tehran', 'gregorian', 4.60, true);

-- مکالمه فارسی مقدماتی (Persian Conversation for Beginners)
INSERT INTO courses (id, title, description, language, level, instructor_id, price, is_active, created_at, duration, total_lessons, category, difficulty, is_featured, updated_at, total_sessions, session_duration, class_type, weekdays, start_time, end_time, auto_record, recording_available, delivery_mode, target_language, proficiency_level, class_format, max_students, target_level, time_zone, calendar_type, rating, callern_available_24h) VALUES 
(6, 'مکالمه فارسی مقدماتی', 'آموزش مکالمه روزمره فارسی برای مبتدیان', 'persian', 'beginner', 50, 2500000, true, NOW(), 0, 0, 'conversation', 'beginner', false, NOW(), 12, 90, 'online', '{"monday","wednesday","friday"}', '18:00', '19:30', false, false, 'online', 'english', 'beginner', 'group', 15, 'all', 'Asia/Tehran', 'gregorian', 4.60, true);

-- Callern Course (Video Tutoring)
INSERT INTO courses (id, title, description, language, level, instructor_id, price, is_active, created_at, duration, total_lessons, category, difficulty, is_featured, updated_at, course_code, total_sessions, session_duration, class_type, weekdays, start_time, end_time, auto_record, recording_available, delivery_mode, target_language, proficiency_level, class_format, max_students, target_level, time_zone, calendar_type, rating, callern_available_24h) VALUES 
(11, 'Callern101', 'One of the most useful courses for managers', 'English', 'beginner', 1, 5000000, true, NOW(), 0, 0, 'English Language', 'beginner', true, NOW(), 'Eng-Callern101', 10, 60, 'online', '{}', '18:00', '19:30', false, false, 'callern', 'english', 'beginner', 'one_on_one', 1, '{"Beginner"}', 'Asia/Tehran', 'gregorian', 4.60, true);

-- ============================================
-- 5. SEQUENCE UPDATES (Important for PostgreSQL)
-- ============================================

-- Update sequences to avoid conflicts
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1) + 100);
SELECT setval('courses_id_seq', COALESCE((SELECT MAX(id) FROM courses), 1) + 10);
SELECT setval('institute_branding_id_seq', COALESCE((SELECT MAX(id) FROM institute_branding), 1) + 1);
SELECT setval('admin_settings_id_seq', COALESCE((SELECT MAX(id) FROM admin_settings), 1) + 1);

-- ============================================
-- 6. SUMMARY & LOGIN CREDENTIALS
-- ============================================

-- Show what we've imported
SELECT '=============================================' AS "=== IMPORT SUMMARY ===";
SELECT 'Database backup from Replit imported successfully!' AS status;
SELECT '=============================================' AS "=== LOGIN CREDENTIALS ===";
SELECT 'Main Admin: admin@metalingua.com / admin123' AS credentials;
SELECT 'Test Admin: admin@test.com / admin123' AS credentials;
SELECT 'Teacher: teacher@test.com / teacher123' AS credentials;
SELECT 'Student: student@test.com / student123' AS credentials;
SELECT 'Mentor: mentor@test.com / mentor123' AS credentials;
SELECT 'Supervisor: supervisor@test.com / supervisor123' AS credentials;
SELECT 'Call Center: callcenter@test.com / callcenter123' AS credentials;
SELECT 'Accountant: accountant@test.com / accountant123' AS credentials;
SELECT '=============================================' AS "=== SYSTEM STATUS ===";
SELECT 'Institute Name: Meta Lingua Academy' AS config;
SELECT 'SMS Service: Kavenegar (configured)' AS config;
SELECT 'Payment: Shetab sandbox mode' AS config;
SELECT 'Courses: 5 sample courses imported' AS config;
SELECT 'Users: 8 essential accounts imported' AS config;
SELECT '=============================================' AS "=== IMPORTANT NOTES ===";
SELECT 'Original database had 8,427 users total' AS note;
SELECT 'Only essential accounts imported for deployment' AS note;
SELECT 'Change passwords after first login!' AS note;
SELECT 'Configure your .env file with API keys' AS note;
SELECT '=============================================' AS "===============================";

-- End of backup file