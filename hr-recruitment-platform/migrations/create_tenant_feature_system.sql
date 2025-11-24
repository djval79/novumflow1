-- Multi-Tenant Feature Management System
-- This migration creates the infrastructure for managing features per tenant

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#00D9FF',
    secondary_color TEXT DEFAULT '#0A1628',
    subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create features table
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'module' CHECK (category IN ('module', 'feature', 'integration')),
    icon TEXT,
    is_premium BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create tenant_features junction table
CREATE TABLE IF NOT EXISTS tenant_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    enabled_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(tenant_id, feature_id)
);

-- 4. Add tenant_id to users_profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profiles' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX idx_users_tenant ON users_profiles(tenant_id);
    END IF;
END $$;

-- 5. Add super_admin flag to users_profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profiles' AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 6. Insert all available features
INSERT INTO features (name, display_name, description, category, icon, is_premium, sort_order) VALUES
    ('dashboard', 'Dashboard', 'Main dashboard with analytics and overview', 'module', 'LayoutDashboard', false, 1),
    ('hr_module', 'HR Module', 'Employee management and HR operations', 'module', 'Users', false, 2),
    ('recruitment', 'Recruitment', 'Job posting and applicant tracking', 'module', 'Briefcase', false, 3),
    ('performance', 'Performance Reviews', 'Employee performance management', 'module', 'TrendingUp', false, 4),
    ('integrations', 'Integrations', 'Third-party service integrations', 'module', 'Zap', true, 5),
    ('documents', 'Document Management', 'File storage and document management', 'module', 'FolderOpen', false, 6),
    ('messaging', 'Messaging', 'Internal team messaging', 'module', 'MessageSquare', false, 7),
    ('noticeboard', 'Notice Board', 'Company announcements and notices', 'module', 'Bell', false, 8),
    ('compliance', 'Home Office Compliance', 'Compliance tracking and reporting', 'module', 'Shield', true, 9),
    ('biometric', 'Biometric System', 'Attendance and time tracking', 'module', 'Fingerprint', true, 10),
    ('automation', 'Automation Engine', 'Workflow automation and rules', 'module', 'Zap', true, 11),
    ('letters', 'Letter Templates', 'Document generation and templates', 'module', 'FileText', false, 12),
    ('forms', 'Form Builder', 'Custom form creation and management', 'module', 'FileText', false, 13),
    ('settings', 'Settings', 'System configuration and preferences', 'module', 'Settings', false, 14),
    ('recruit_settings', 'Recruitment Settings', 'Recruitment configuration', 'module', 'Sliders', false, 15),
    ('advanced_analytics', 'Advanced Analytics', 'Enhanced reporting and insights', 'feature', 'BarChart', true, 16),
    ('api_access', 'API Access', 'REST API access for integrations', 'feature', 'Code', true, 17),
    ('white_label', 'White Label Branding', 'Custom branding and white-labeling', 'feature', 'Palette', true, 18),
    ('bulk_operations', 'Bulk Operations', 'Bulk import/export capabilities', 'feature', 'Database', true, 19),
    ('custom_workflows', 'Custom Workflows', 'Advanced workflow customization', 'feature', 'GitBranch', true, 20)
ON CONFLICT (name) DO NOTHING;

-- 7. Create test tenants
INSERT INTO tenants (name, slug, domain, subscription_tier, max_users) VALUES
    ('Ringstead Care', 'ringstead-care', 'ringsteadcare.com', 'enterprise', 500),
    ('Welcome Care', 'welcome-care', 'welcomecare.com', 'basic', 50),
    ('Sunrise Care Services', 'sunrise-care', 'sunrisecare.com', 'premium', 100),
    ('Harmony Health', 'harmony-health', 'harmonyhealth.com', 'basic', 50),
    ('Caring Hands', 'caring-hands', 'caringhands.com', 'premium', 100)
ON CONFLICT (slug) DO NOTHING;

-- 8. Enable ALL features for Ringstead Care (enterprise tier)
INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
SELECT 
    (SELECT id FROM tenants WHERE slug = 'ringstead-care'),
    id,
    true
FROM features
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

-- 9. Enable basic features for Welcome Care
INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
SELECT 
    (SELECT id FROM tenants WHERE slug = 'welcome-care'),
    id,
    true
FROM features
WHERE name IN ('dashboard', 'hr_module', 'documents', 'messaging', 'noticeboard', 'settings')
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

-- 10. Enable premium features for Sunrise Care
INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
SELECT 
    (SELECT id FROM tenants WHERE slug = 'sunrise-care'),
    id,
    true
FROM features
WHERE name IN ('dashboard', 'hr_module', 'recruitment', 'performance', 'documents', 'messaging', 'noticeboard', 'letters', 'forms', 'settings', 'advanced_analytics')
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

-- 11. Enable basic features for Harmony Health
INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
SELECT 
    (SELECT id FROM tenants WHERE slug = 'harmony-health'),
    id,
    true
FROM features
WHERE name IN ('dashboard', 'hr_module', 'documents', 'messaging', 'settings')
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

-- 12. Enable premium features for Caring Hands
INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
SELECT 
    (SELECT id FROM tenants WHERE slug = 'caring-hands'),
    id,
    true
FROM features
WHERE name IN ('dashboard', 'hr_module', 'recruitment', 'performance', 'documents', 'messaging', 'noticeboard', 'compliance', 'letters', 'forms', 'settings')
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

-- 13. Assign existing users to Ringstead Care
UPDATE users_profiles
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'ringstead-care')
WHERE tenant_id IS NULL;

-- 14. Set super admin flag for your account
UPDATE users_profiles
SET is_super_admin = true
WHERE email IN ('mrsonirie@gmail.com', 'hr@ringsteadcare.com');

-- 15. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature ON tenant_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

-- 16. Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;

-- 17. RLS Policies for tenants table
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant"
    ON tenants FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Super admins can view all tenants" ON tenants;
CREATE POLICY "Super admins can view all tenants"
    ON tenants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE user_id = auth.uid() AND is_super_admin = true
        )
    );

DROP POLICY IF EXISTS "Super admins can manage tenants" ON tenants;
CREATE POLICY "Super admins can manage tenants"
    ON tenants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE user_id = auth.uid() AND is_super_admin = true
        )
    );

-- 18. RLS Policies for features table (everyone can view, only super admins can modify)
DROP POLICY IF EXISTS "Anyone can view features" ON features;
CREATE POLICY "Anyone can view features"
    ON features FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Super admins can manage features" ON features;
CREATE POLICY "Super admins can manage features"
    ON features FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE user_id = auth.uid() AND is_super_admin = true
        )
    );

-- 19. RLS Policies for tenant_features
DROP POLICY IF EXISTS "Users can view their tenant's features" ON tenant_features;
CREATE POLICY "Users can view their tenant's features"
    ON tenant_features FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Super admins can manage all tenant features" ON tenant_features;
CREATE POLICY "Super admins can manage all tenant features"
    ON tenant_features FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE user_id = auth.uid() AND is_super_admin = true
        )
    );

-- 20. Create helper function to check if a feature is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_user_id UUID,
    p_feature_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
BEGIN
    SELECT tf.is_enabled INTO v_enabled
    FROM users_profiles up
    JOIN tenant_features tf ON tf.tenant_id = up.tenant_id
    JOIN features f ON f.id = tf.feature_id
    WHERE up.user_id = p_user_id
    AND f.name = p_feature_name;
    
    RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Create function to get user's enabled features
CREATE OR REPLACE FUNCTION get_user_features(p_user_id UUID)
RETURNS TABLE (
    feature_name TEXT,
    display_name TEXT,
    category TEXT,
    icon TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.name,
        f.display_name,
        f.category,
        f.icon
    FROM users_profiles up
    JOIN tenant_features tf ON tf.tenant_id = up.tenant_id
    JOIN features f ON f.id = tf.feature_id
    WHERE up.user_id = p_user_id
    AND tf.is_enabled = true
    ORDER BY f.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE tenants IS 'Stores client organizations (e.g., Ringstead Care, Welcome Care)';
COMMENT ON TABLE features IS 'Defines all available modules and features in the system';
COMMENT ON TABLE tenant_features IS 'Maps which features are enabled for which tenants';
COMMENT ON FUNCTION is_feature_enabled IS 'Check if a specific feature is enabled for a user';
COMMENT ON FUNCTION get_user_features IS 'Get all enabled features for a user';
