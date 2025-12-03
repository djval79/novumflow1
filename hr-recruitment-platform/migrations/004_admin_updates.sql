-- Function to update tenant settings (Super Admin Only)
CREATE OR REPLACE FUNCTION update_tenant_settings(
    p_tenant_id UUID,
    p_limits JSONB,
    p_features JSONB,
    p_subscription_tier subscription_tier
)
RETURNS VOID AS $$
BEGIN
    -- Check if user is super admin
    IF NOT EXISTS (
        SELECT 1 FROM users_profiles
        WHERE id = auth.uid()
        AND is_super_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Super Admin only';
    END IF;

    UPDATE tenants
    SET 
        limits = p_limits,
        features = p_features,
        subscription_tier = p_subscription_tier,
        updated_at = NOW()
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_tenant_settings(UUID, JSONB, JSONB, subscription_tier) TO authenticated;
