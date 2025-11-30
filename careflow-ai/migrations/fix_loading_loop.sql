-- ============================================
-- CareFlow - Fix Loading Loop Issue
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. CHECK USER AND PROFILE STATUS
SELECT 
    u.email,
    u.id as user_id,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.is_active,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
        WHEN p.id IS NULL THEN '❌ No profile (LOADING LOOP CAUSE!)'
        WHEN p.is_active = false THEN '❌ Inactive profile'
        ELSE '✅ OK'
    END as status
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE u.email = 'mrsonirie@gmail.com';  -- Change this to your email


-- 2. FIX: CONFIRM EMAIL (if needed)
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'mrsonirie@gmail.com'  -- Change this to your email
  AND email_confirmed_at IS NULL;


-- 3. FIX: CREATE MISSING PROFILE (THIS IS THE MAIN FIX!)
-- This is what causes the infinite loading loop!
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
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    COALESCE(raw_user_meta_data->>'role', 'admin'),
    true,
    true,
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'mrsonirie@gmail.com'  -- Change this to your email
  AND NOT EXISTS (
      SELECT 1 FROM users_profiles WHERE user_id = auth.users.id
  )
ON CONFLICT (user_id) DO UPDATE
SET 
    role = EXCLUDED.role,
    is_active = true,
    updated_at = NOW();


-- 4. VERIFY FIX
SELECT 
    u.email,
    p.full_name,
    p.role,
    p.is_active,
    '✅ Should be able to login now!' as message
FROM auth.users u
INNER JOIN users_profiles p ON u.id = p.user_id
WHERE u.email = 'mrsonirie@gmail.com';  -- Change this to your email


-- 5. FIX ALL USERS (Optional - run if multiple users have this issue)
INSERT INTO users_profiles (
    user_id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(u.raw_user_meta_data->>'role', 'carer')::text,
    true,
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO UPDATE
SET 
    is_active = true,
    updated_at = NOW();
