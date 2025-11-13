-- Quick script to set your user as Admin
-- This will ensure you can see the "New Announcement" button

-- First, let's check what users exist
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Check current users_profiles table
SELECT user_id, full_name, role FROM users_profiles;

-- Update the most recent user to be Admin (this should be you)
UPDATE users_profiles 
SET role = 'Admin', 
    full_name = COALESCE(full_name, 'System Administrator')
WHERE user_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- If no profile exists, create one for the most recent user
INSERT INTO users_profiles (user_id, full_name, role, created_at)
SELECT 
    id as user_id,
    'System Administrator' as full_name,
    'Admin' as role,
    NOW() as created_at
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM users_profiles)
ORDER BY created_at DESC 
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'Admin',
    full_name = COALESCE(users_profiles.full_name, 'System Administrator');

-- Verify the update
SELECT u.email, p.full_name, p.role 
FROM auth.users u 
LEFT JOIN users_profiles p ON u.id = p.user_id 
ORDER BY u.created_at DESC 
LIMIT 3;