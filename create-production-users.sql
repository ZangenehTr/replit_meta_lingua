-- SQL Script to Create Production Users for Meta Lingua
-- This creates the exact users requested with "password" as the default password
-- These are the production test users with real wallet balances

-- Hash for "password" using bcrypt with 10 rounds
-- $2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6

-- Admin User
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    phone_number,
    created_at,
    updated_at
) VALUES (
    'admin@test.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',  -- "password"
    'Admin',
    'User',
    'Admin',
    'active',
    '+989123456789',
    NOW(),
    NOW()
);

-- Student: Sara Ahmadi (with 30M IRR wallet)
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    phone_number,
    created_at,
    updated_at
) VALUES (
    'sara.ahmadi@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',  -- "password"
    'سارا',
    'احمدی',
    'Student',
    'active',
    '+989121234567',
    NOW(),
    NOW()
);

-- Student: Mohammad Rezaei (with 30M IRR wallet)
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    phone_number,
    created_at,
    updated_at
) VALUES (
    'mohammad.rezaei@gmail.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',  -- "password"
    'محمد',
    'رضایی',
    'Student',
    'active',
    '+989121234568',
    NOW(),
    NOW()
);

-- Teacher: Dr. Sarah Smith
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    phone_number,
    created_at,
    updated_at
) VALUES (
    'dr.smith@institute.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',  -- "password"
    'Dr. Sarah',
    'Smith',
    'Teacher',
    'active',
    '+989121234569',
    NOW(),
    NOW()
);

-- Teacher: Ali Hosseini
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    phone_number,
    created_at,
    updated_at
) VALUES (
    'ali.hosseini@institute.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',  -- "password"
    'علی',
    'حسینی',
    'Teacher',
    'active',
    '+989121234570',
    NOW(),
    NOW()
);

-- Supervisor: Nazanin Mohammadi
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    status,
    phone_number,
    created_at,
    updated_at
) VALUES (
    'supervisor@metalingua.com',
    '$2b$10$N9qo8uLOickgx2ZMRdvLCOQ3AV1T5OtXr5qF3rjjJH6k5rKYk5YZ6',  -- "password"
    'نازنین',
    'محمدی',
    'Supervisor',
    'active',
    '+989121234571',
    NOW(),
    NOW()
);

-- Create wallet entries for students with 30M IRR balance
INSERT INTO wallets (user_id, balance, currency, created_at, updated_at)
SELECT id, 30000000, 'IRR', NOW(), NOW()
FROM users 
WHERE email IN ('sara.ahmadi@gmail.com', 'mohammad.rezaei@gmail.com');

-- Create branding entry if not exists
INSERT INTO branding (name, logo, primary_color, secondary_color, created_at, updated_at)
SELECT 'Meta Lingua Academy', '', '#3B82F6', '#10B981', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM branding LIMIT 1);

-- Display created users
SELECT 
    email, 
    role, 
    first_name, 
    last_name,
    CASE 
        WHEN email IN ('sara.ahmadi@gmail.com', 'mohammad.rezaei@gmail.com') 
        THEN 'Has 30M IRR wallet' 
        ELSE 'No wallet' 
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

-- Show login credentials
SELECT '=====================================' AS info
UNION ALL
SELECT 'PRODUCTION USER CREDENTIALS CREATED:' AS info
UNION ALL
SELECT '=====================================' AS info
UNION ALL
SELECT 'Admin: admin@test.com / password' AS info
UNION ALL
SELECT 'Student (30M IRR): sara.ahmadi@gmail.com / password' AS info
UNION ALL
SELECT 'Student (30M IRR): mohammad.rezaei@gmail.com / password' AS info
UNION ALL
SELECT 'Teacher: dr.smith@institute.com / password' AS info
UNION ALL
SELECT 'Teacher: ali.hosseini@institute.com / password' AS info
UNION ALL
SELECT 'Supervisor: supervisor@metalingua.com / password' AS info
UNION ALL
SELECT '=====================================' AS info
UNION ALL
SELECT 'Students have 30,000,000 IRR wallet balance' AS info
UNION ALL
SELECT 'IMPORTANT: Change passwords after deployment!' AS info;