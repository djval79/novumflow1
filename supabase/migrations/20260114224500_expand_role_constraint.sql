-- Expand users_profiles.role CHECK constraint to include all roles
-- This includes:
-- - Original HR roles: admin, hr_manager, recruiter, employee
-- - CareFlow roles: carer, staff, inspector, super_admin
-- - Multi-tenant roles: owner, manager, member  
-- - Demo accounts: demo

-- Remove existing constraint (if it exists)
ALTER TABLE users_profiles DROP CONSTRAINT IF EXISTS users_profiles_role_check;

-- First, update any rows with roles not in the approved list to 'staff'
-- This ensures the constraint can be applied without violations
UPDATE users_profiles 
SET role = 'staff' 
WHERE role NOT IN (
    'admin', 'hr_manager', 'recruiter', 'employee',
    'carer', 'staff', 'inspector', 'super_admin',
    'owner', 'manager', 'member', 'demo'
);

-- Add new constraint with all possible roles
ALTER TABLE users_profiles ADD CONSTRAINT users_profiles_role_check 
    CHECK (role IN (
        -- HR Platform roles
        'admin',
        'hr_manager',
        'recruiter', 
        'employee',
        -- CareFlow roles
        'carer',
        'staff',
        'inspector',
        'super_admin',
        -- Multi-tenant/Org roles
        'owner',
        'manager',
        'member',
        -- Demo accounts
        'demo'
    ));

-- Add comment for documentation
COMMENT ON COLUMN users_profiles.role IS 'User role - HR: admin, hr_manager, recruiter, employee; Care: carer, staff, inspector, super_admin; Org: owner, manager, member; Demo: demo';
