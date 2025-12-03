
ALTER TABLE users_profiles 
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- Grant platform admin to the super admin user (optional, but good for testing)
UPDATE users_profiles 
SET is_platform_admin = true 
WHERE role = 'super_admin';
