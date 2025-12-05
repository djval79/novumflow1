-- Set your account as super admin
-- Replace 'YOUR_EMAIL_HERE' with your actual email (mrsonirie@gmail.com or hr@ringsteadcare.com)

UPDATE users_profiles
SET role = 'super_admin'
WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email IN ('mrsonirie@gmail.com', 'hr@ringsteadcare.com')
    LIMIT 1
);

-- Verify
SELECT 
    u.email,
    up.role,
    up.full_name
FROM users_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE up.role = 'super_admin';
