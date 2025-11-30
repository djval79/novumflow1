-- ============================================
-- CareFlow/NovumFlow Login Diagnostic Script
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. CHECK ALL USERS IN AUTH TABLE
-- This shows all registered users
SELECT 
    email,
    id as user_id,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ Not Confirmed'
        ELSE '✅ Confirmed'
    END as email_status
FROM auth.users
ORDER BY created_at DESC;

-- 2. CHECK USER PROFILES
-- This shows which users have profiles with their roles
SELECT 
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    p.is_super_admin,
    p.created_at,
    CASE 
        WHEN p.is_active THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status
FROM users_profiles p
ORDER BY p.created_at DESC;

-- 3. FIND USERS WITHOUT PROFILES (PROBLEM!)
-- These users can log in but will have issues accessing the app
SELECT 
    u.email,
    u.id as user_id,
    u.created_at,
    '❌ Missing Profile' as issue
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE p.id IS NULL;

-- 4. FIND INACTIVE PROFILES (PROBLEM!)
-- These users exist but are deactivated
SELECT 
    email,
    full_name,
    role,
    '❌ Account Disabled' as issue
FROM users_profiles
WHERE is_active = false;

-- 5. FIND UNCONFIRMED EMAILS (PROBLEM!)
-- These users can't log in until email is confirmed
SELECT 
    u.email,
    u.created_at,
    '❌ Email Not Confirmed' as issue
FROM auth.users u
WHERE u.email_confirmed_at IS NULL;

-- 6. CHECK ROW LEVEL SECURITY POLICIES
-- Shows if RLS is enabled and what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users_profiles';

-- 7. SUMMARY STATISTICS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM users_profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
    (SELECT COUNT(*) FROM users_profiles WHERE is_active = true) as active_profiles,
    (SELECT COUNT(*) FROM users_profiles WHERE role = 'Admin') as admin_users;
