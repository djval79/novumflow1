-- ============================================
-- CareFlow/NovumFlow Login Fix Script
-- Run this in Supabase Dashboard → SQL Editor
-- AFTER running diagnose_login_issues.sql
-- ============================================

-- ==========================================
-- FIX 1: CONFIRM ALL EMAIL ADDRESSES
-- ==========================================
-- Use this for development/testing only!
-- This allows users to log in without email confirmation

UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Check result
SELECT 
    email,
    email_confirmed_at,
    'Email confirmed' as status
FROM auth.users;


-- ==========================================
-- FIX 2: CREATE MISSING PROFILES
-- ==========================================
-- This creates admin profiles for users who don't have them

INSERT INTO users_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active,
    is_super_admin,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    'Administrator',
    'Admin',
    true,
    true,
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Check result
SELECT 
    email,
    full_name,
    role,
    'Profile created' as status
FROM users_profiles
WHERE created_at >= NOW() - INTERVAL '1 minute';


-- ==========================================
-- FIX 3: ACTIVATE ALL DISABLED ACCOUNTS
-- ==========================================
-- Re-enable any disabled user accounts

UPDATE users_profiles
SET 
    is_active = true,
    updated_at = NOW()
WHERE is_active = false;

-- Check result
SELECT 
    email,
    full_name,
    is_active,
    'Account activated' as status
FROM users_profiles;


-- ==========================================
-- FIX 4: GRANT ADMIN ACCESS TO SPECIFIC USER
-- ==========================================
-- Replace 'your@email.com' with the actual email

UPDATE users_profiles
SET 
    role = 'Admin',
    is_active = true,
    is_super_admin = true,
    updated_at = NOW()
WHERE email = 'admin@ringsteadcare.com';  -- CHANGE THIS EMAIL

-- Check result
SELECT 
    email,
    role,
    is_active,
    is_super_admin,
    'Admin access granted' as status
FROM users_profiles
WHERE email = 'admin@ringsteadcare.com';  -- CHANGE THIS EMAIL


-- ==========================================
-- FIX 5: CREATE SPECIFIC ADMIN USER
-- ==========================================
-- Use this if you want to create a completely new admin account
-- Note: You still need to create the auth user via Supabase Dashboard first!

-- Step 1: Go to Supabase Dashboard → Authentication → Users → Add User
--         Email: admin@ringsteadcare.com
--         Password: (choose a strong password)
--         Confirm email: YES

-- Step 2: After creating auth user, run this query:
INSERT INTO users_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active,
    is_super_admin,
    created_at,
    updated_at
)
SELECT 
    id,
    email,
    'System Administrator',
    'Admin',
    true,
    true,
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@ringsteadcare.com'  -- CHANGE THIS EMAIL
ON CONFLICT (user_id) 
DO UPDATE SET
    role = 'Admin',
    is_active = true,
    is_super_admin = true,
    updated_at = NOW();


-- ==========================================
-- FIX 6: RESET RLS POLICIES (IF NEEDED)
-- ==========================================
-- Only use this if RLS policies are blocking access
-- This is a nuclear option - use with caution!

-- Temporarily disable RLS for testing
ALTER TABLE users_profiles DISABLE ROW LEVEL SECURITY;

-- Try logging in to test if RLS was the issue

-- If login works, re-enable RLS and create proper policies:
-- ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policy (run after re-enabling RLS):
DROP POLICY IF EXISTS "Users can view own profile" ON users_profiles;
CREATE POLICY "Users can view own profile" ON users_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profiles;
CREATE POLICY "Admins can view all profiles" ON users_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );


-- ==========================================
-- VERIFICATION QUERY
-- ==========================================
-- Run this to verify all fixes worked

SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.full_name,
    p.role,
    p.is_active,
    p.is_super_admin,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
        WHEN p.id IS NULL THEN '❌ Missing profile'
        WHEN p.is_active = false THEN '❌ Account inactive'
        ELSE '✅ Ready to login'
    END as status
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;


-- ==========================================
-- QUICK TEST CREDENTIALS
-- ==========================================
-- After running these fixes, you should be able to log in with:
-- Any user that shows "✅ Ready to login" in the verification query above

-- Common test accounts you might have:
-- - admin@ringsteadcare.com
-- - hr@ringsteadcare.com
-- - mrsonirie@gmail.com

-- If you don't have any users yet:
-- 1. Go to the login page: http://localhost:5173
-- 2. Use the "Quick Admin Setup" box in the bottom right
-- 3. Enter email and password to create account instantly
