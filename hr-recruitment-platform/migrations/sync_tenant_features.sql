-- Trigger to sync tenant_features when subscription_tier changes
CREATE OR REPLACE FUNCTION sync_tenant_features_on_tier_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if subscription_tier changed
    IF OLD.subscription_tier IS NOT DISTINCT FROM NEW.subscription_tier THEN
        RETURN NEW;
    END IF;

    -- Strategy: Reset features to the defaults of the new tier.
    
    IF NEW.subscription_tier = 'enterprise' THEN
        -- Enable ALL features
        INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
        SELECT NEW.id, id, true FROM features
        ON CONFLICT (tenant_id, feature_id) DO UPDATE SET is_enabled = true;
        
    ELSIF NEW.subscription_tier = 'professional' THEN
        -- Enable Professional features
        INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
        SELECT NEW.id, id, true FROM features
        WHERE name IN (
            'dashboard', 'hr_module', 'recruitment', 'performance', 
            'documents', 'messaging', 'noticeboard', 'letters', 
            'forms', 'settings', 'recruit_settings', 'advanced_analytics',
            'compliance', 'automation', 'api_access'
        )
        ON CONFLICT (tenant_id, feature_id) DO UPDATE SET is_enabled = true;
        
        -- Disable others (that might have been enabled by previous higher tier)
        UPDATE tenant_features
        SET is_enabled = false
        WHERE tenant_id = NEW.id
        AND feature_id NOT IN (
            SELECT id FROM features WHERE name IN (
                'dashboard', 'hr_module', 'recruitment', 'performance', 
                'documents', 'messaging', 'noticeboard', 'letters', 
                'forms', 'settings', 'recruit_settings', 'advanced_analytics',
                'compliance', 'automation', 'api_access'
            )
        );

    ELSE -- Basic or Trial
        -- Enable Basic features
        INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
        SELECT NEW.id, id, true FROM features
        WHERE name IN (
            'dashboard', 'hr_module', 'documents', 
            'messaging', 'noticeboard', 'settings'
        )
        ON CONFLICT (tenant_id, feature_id) DO UPDATE SET is_enabled = true;

        -- Disable others
        UPDATE tenant_features
        SET is_enabled = false
        WHERE tenant_id = NEW.id
        AND feature_id NOT IN (
            SELECT id FROM features WHERE name IN (
                'dashboard', 'hr_module', 'documents', 
                'messaging', 'noticeboard', 'settings'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_tenant_features ON tenants;
CREATE TRIGGER trigger_sync_tenant_features
    AFTER UPDATE OF subscription_tier ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION sync_tenant_features_on_tier_change();
