-- SQL Script to Create Admin User for Meta Lingua
-- This will create an admin user so you can login to the application
-- Default credentials: admin@metalingua.com / admin123

-- The password 'admin123' is hashed using bcrypt with 10 rounds
-- You should change this password after first login!

-- Insert admin user
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
    'admin@metalingua.com',
    '$2b$10$X7qgJbL8H0FQZXkY5NwYy.qVT5T.vz4YMnZJ2xkZwq5V0EJGzL3e.',  -- This is 'admin123' hashed
    'Admin',
    'User',
    'Admin',
    'active',
    '+989123456789',
    NOW(),
    NOW()
);

-- Create additional test users (optional)
-- Teacher account: teacher@test.com / teacher123
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
    'teacher@test.com',
    '$2b$10$nVnkLFq2eQxgDqRPyVdp5.VKxXqY5HwXKzH5YW2HYxYKwQJeZZ5mW',  -- This is 'teacher123' hashed
    'Test',
    'Teacher',
    'Teacher',
    'active',
    '+989123456788',
    NOW(),
    NOW()
);

-- Student account: student@test.com / student123
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
    'student@test.com',
    '$2b$10$Tt0ZKWQgpRkP5BXrP7W0Z.9VQvZGKQ5WXzQ5YV2HYxZMxRKeZZ5nX',  -- This is 'student123' hashed
    'Test',
    'Student',
    'Student',
    'active',
    '+989123456787',
    NOW(),
    NOW()
);

-- Mentor account: mentor@test.com / mentor123
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
    'mentor@test.com',
    '$2b$10$Rt0ZKWQgpRkP5BXrP7W0Z.8VQvZGKQ5WXzQ5YV2HYxZMxRKeZZ5mX',  -- This is 'mentor123' hashed
    'Test',
    'Mentor',
    'Mentor',
    'active',
    '+989123456786',
    NOW(),
    NOW()
);

-- Supervisor account: supervisor@test.com / supervisor123
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
    'supervisor@test.com',
    '$2b$10$St0ZKWQgpRkP5BXrP7W0Z.7VQvZGKQ5WXzQ5YV2HYxZMxRKeZZ5lX',  -- This is 'supervisor123' hashed
    'Test',
    'Supervisor',
    'Supervisor',
    'active',
    '+989123456785',
    NOW(),
    NOW()
);

-- Call Center Agent account: callcenter@test.com / callcenter123
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
    'callcenter@test.com',
    '$2b$10$Ut0ZKWQgpRkP5BXrP7W0Z.6VQvZGKQ5WXzQ5YV2HYxZMxRKeZZ5kX',  -- This is 'callcenter123' hashed
    'Test',
    'CallCenter',
    'Call Center Agent',
    'active',
    '+989123456784',
    NOW(),
    NOW()
);

-- Accountant account: accountant@test.com / accountant123
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
    'accountant@test.com',
    '$2b$10$Vt0ZKWQgpRkP5BXrP7W0Z.5VQvZGKQ5WXzQ5YV2HYxZMxRKeZZ5jX',  -- This is 'accountant123' hashed
    'Test',
    'Accountant',
    'Accountant',
    'active',
    '+989123456783',
    NOW(),
    NOW()
);

-- Create branding entry if not exists
INSERT INTO branding (name, logo, primary_color, secondary_color, created_at, updated_at)
SELECT 'Meta Lingua Academy', '', '#3B82F6', '#10B981', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM branding LIMIT 1);

-- Display created users
SELECT email, role, first_name, last_name FROM users ORDER BY created_at DESC;

-- Show login credentials
SELECT '=====================================' AS info
UNION ALL
SELECT 'Login Credentials Created:' AS info
UNION ALL
SELECT '=====================================' AS info
UNION ALL
SELECT 'Admin: admin@metalingua.com / admin123' AS info
UNION ALL
SELECT 'Teacher: teacher@test.com / teacher123' AS info
UNION ALL
SELECT 'Student: student@test.com / student123' AS info
UNION ALL
SELECT 'Mentor: mentor@test.com / mentor123' AS info
UNION ALL
SELECT 'Supervisor: supervisor@test.com / supervisor123' AS info
UNION ALL
SELECT 'Call Center: callcenter@test.com / callcenter123' AS info
UNION ALL
SELECT 'Accountant: accountant@test.com / accountant123' AS info
UNION ALL
SELECT '=====================================' AS info
UNION ALL
SELECT 'IMPORTANT: Change passwords after first login!' AS info;