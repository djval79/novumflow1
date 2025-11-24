-- Check if your user has the is_super_admin flag set correctly
-- Run this in Supabase SQL Editor to diagnose the RLS issue

-- Check your current user's profile
SELECT 
    id,
    email,
    is_super_admin,
    role,
    tenant_id
FROM users_profiles
WHERE id = auth.uid();

-- If the above returns nothing, check all super admins
SELECT 
    id,
    email,
    is_super_admin,
    role,
    tenant_id
FROM users_profiles
WHERE is_super_admin = true;

-- Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users_profiles' 
AND column_name = 'is_super_admin';
