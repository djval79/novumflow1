-- ============================================================================
-- SYSTEMATIC BOOTSTRAP: STORAGE, ADMIN & SAMPLE DATA
-- ============================================================================

-- 1. Ensure Storage Buckets Exist
-- Note: inserting directly into storage.buckets is the SQL way to create buckets if the schema is available
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('expenses', 'expenses', false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create storage buckets via SQL. Please create them in the Dashboard if missing: documents, expenses, avatars';
END $$;

-- 2. Initialize Super Admin Profile
-- Target User ID: 2d0ee2ed-a9f4-4b8d-9a49-461a8032af66
INSERT INTO users_profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    is_super_admin, 
    permissions,
    created_at,
    updated_at
)
VALUES (
    '2d0ee2ed-a9f4-4b8d-9a49-461a8032af66',
    'admin@novumflow.app', -- Placeholder, will be updated by auth if exists
    'Master Administrator',
    'Admin',
    true,
    '["all"]',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE 
SET is_super_admin = true, role = 'Admin', permissions = '["all"]';

-- 3. Create Default Tenant and Membership
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Create Default Tenant if none exists
    INSERT INTO tenants (name, subdomain, slug, subscription_tier, subscription_status)
    VALUES ('NovumFlow HQ', 'hq', 'hq', 'enterprise', 'active')
    ON CONFLICT (subdomain) DO NOTHING
    RETURNING id INTO default_tenant_id;

    -- If the tenant already existed, get its ID
    IF default_tenant_id IS NULL THEN
        SELECT id INTO default_tenant_id FROM tenants WHERE subdomain = 'hq' LIMIT 1;
    END IF;

    -- Link Admin to this Tenant
    INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
    VALUES ('2d0ee2ed-a9f4-4b8d-9a49-461a8032af66', default_tenant_id, 'owner', true)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    -- Also update the users_profiles with this tenant_id for convenience
    UPDATE users_profiles SET tenant_id = default_tenant_id WHERE user_id = '2d0ee2ed-a9f4-4b8d-9a49-461a8032af66';
END $$;

-- 4. Seed Essential HR Metadata
INSERT INTO departments (name, description) VALUES 
('Operations', 'General business operations'),
('Care Services', 'Primary care delivery and nursing'),
('Compliance', 'Quality assurance and CQC standards'),
('Recruitment', 'Talent acquisition and onboarding')
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (title, description) VALUES 
('Director', 'Strategic leadership'),
('HR Manager', 'Workforce and compliance lead'),
('Care Coordinator', 'Scheduling and visit verification'),
('Field Supervisor', 'On-site care quality control')
ON CONFLICT (title) DO NOTHING;

-- 5. Seed First Announcement
INSERT INTO announcements (title, content, category, priority, visibility_level)
VALUES (
    'Welcome to the Command Center', 
    'The NovumFlow platform has been successfully initialized. All database tables are green, and the engine is ready for deployment.', 
    'general', 
    'normal', 
    'company-wide'
) ON CONFLICT DO NOTHING;

-- VERIFICATION
SELECT '🚀 Platform initialized for user 2d0ee2ed-a9f4-4b8d-9a49-461a8032af66' as status;
