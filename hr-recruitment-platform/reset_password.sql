-- Reset User Password Script
-- Run this in your Supabase SQL Editor to manually reset a user's password.
-- This bypasses email recovery issues (usually caused by unconfigured SMTP settings).

-- 1. Enable pgcrypto if not already enabled (standard in Supabase)
create extension if not exists "pgcrypto";

-- 2. Update the password
-- Replace 'test.user.1764731911259@gmail.com' with the actual email address
-- Replace 'NewPassword123!' with your desired password
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'test.user.1764731911259@gmail.com';  -- <--- CHANGE EMAIL HERE IF NEEDED

-- 3. Verify the update (optional)
SELECT email, updated_at 
FROM auth.users 
WHERE email = 'test.user.1764731911259@gmail.com';
