-- Update create_tenant function to accept subscription tier AND provision features
CREATE OR REPLACE FUNCTION create_tenant(
    p_name TEXT,
    p_subdomain TEXT,
    p_owner_user_id UUID DEFAULT NULL,
    p_subscription_tier TEXT DEFAULT 'trial'
)
RETURNS UUID AS $$
DECLARE
    new_tenant_id UUID;
    owner_id UUID;
BEGIN
    -- Use current user if no owner specified
    owner_id := COALESCE(p_owner_user_id, auth.uid());
    
    -- Create tenant
    INSERT INTO tenants (
        name,
        subdomain,
        slug,
        subscription_tier,
        trial_ends_at,
        subscription_status
    ) VALUES (
        p_name,
        p_subdomain,
        p_subdomain, -- slug same as subdomain for now
        p_subscription_tier::subscription_tier,
        CASE 
            WHEN p_subscription_tier = 'trial' THEN NOW() + INTERVAL '14 days'
            ELSE NULL 
        END,
        CASE 
            WHEN p_subscription_tier = 'trial' THEN 'trial'::subscription_status
            ELSE 'active'::subscription_status
        END
    )
    RETURNING id INTO new_tenant_id;
    
    -- Add owner to tenant
    INSERT INTO user_tenant_memberships (
        user_id,
        tenant_id,
        role,
        invitation_accepted_at
    ) VALUES (
        owner_id,
        new_tenant_id,
        'owner',
        NOW()
    );
    
    -- Provision Features based on Subscription Tier
    IF p_subscription_tier = 'enterprise' THEN
        -- ALL features
        INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
        SELECT new_tenant_id, id, true FROM features
        ON CONFLICT DO NOTHING;
        
    ELSIF p_subscription_tier = 'professional' THEN
        -- Professional features (Recruitment, Performance, Analytics, etc.)
        INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
        SELECT new_tenant_id, id, true FROM features
        WHERE name IN (
            'dashboard', 'hr_module', 'recruitment', 'performance', 
            'documents', 'messaging', 'noticeboard', 'letters', 
            'forms', 'settings', 'recruit_settings', 'advanced_analytics',
            'compliance', 'automation', 'api_access'
        )
        ON CONFLICT DO NOTHING;
        
    ELSE -- Basic and Trial (Limited set)
         -- Trial usually gets ALL features but limited time, or Basic features?
         -- Choosing Basic set for safety + maybe Recruitment for trial?
         -- Let's give Trial the Professional set so they can try everything?
         -- Frontend says: Trial: "Basic features". So Stick to Basic.
        INSERT INTO tenant_features (tenant_id, feature_id, is_enabled)
        SELECT new_tenant_id, id, true FROM features
        WHERE name IN (
            'dashboard', 'hr_module', 'documents', 
            'messaging', 'noticeboard', 'settings'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
