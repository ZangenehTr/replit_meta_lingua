-- Meta Lingua Deployment Fix Script
-- Run this on your Iranian server PostgreSQL to ensure proper setup

-- Create admin user with proper password hash (password: admin123)
-- Use this if the admin user doesn't exist
INSERT INTO users (
  email, 
  password, 
  role, 
  first_name, 
  last_name, 
  phone_number,
  is_active,
  created_at
) VALUES (
  'admin@metalingua.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'Administrator',
  'Meta Lingua',
  '+98xxxxxxxxxx',
  true,
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Create institute branding settings
INSERT INTO institute_branding (
  id,
  name,
  logo,
  primary_color,
  secondary_color,
  website,
  phone,
  email,
  address
) VALUES (
  1,
  'Meta Lingua Academy',
  '',
  '#3b82f6',
  '#1e40af', 
  'https://metalingua.ir',
  '+98xxxxxxxxxx',
  'info@metalingua.ir',
  'Tehran, Iran'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  website = EXCLUDED.website,
  email = EXCLUDED.email;

-- Verify tables exist and show user count
SELECT 'Users table status:' as status, COUNT(*) as user_count FROM users;
SELECT 'Branding table status:' as status, COUNT(*) as brand_count FROM institute_branding;

-- Show admin user details (verify it exists)
SELECT id, email, role, first_name, is_active, created_at 
FROM users 
WHERE email = 'admin@metalingua.com';

-- Update any existing admin user to ensure proper settings
UPDATE users 
SET is_active = true, role = 'admin'
WHERE email = 'admin@metalingua.com';