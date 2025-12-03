-- Add is_super_admin column if it doesn't exist
ALTER TABLE users_profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Function to get all tenants (Super Admin Only)
CREATE OR REPLACE FUNCTION get_all_tenants()
RETURNS TABLE (
    id UUID,
    name TEXT,
    subdomain TEXT,
    subscription_tier subscription_tier,
    subscription_status subscription_status,
    created_at TIMESTAMPTZ,
    member_count BIGINT
) AS $$
BEGIN
    -- Check if user is super admin
    IF NOT EXISTS (
        SELECT 1 FROM users_profiles
        WHERE id = auth.uid()
        AND is_super_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Super Admin only';
    END IF;

    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.subdomain,
        t.subscription_tier,
        t.subscription_status,
        t.created_at,
        (SELECT COUNT(*) FROM user_tenant_memberships utm WHERE utm.tenant_id = t.id) as member_count
    FROM tenants t
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_tenants() TO authenticated;

-- Function to toggle tenant status (Super Admin Only)
CREATE OR REPLACE FUNCTION toggle_tenant_status(p_tenant_id UUID, p_is_active BOOLEAN)
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
    SET is_active = p_is_active
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION toggle_tenant_status(UUID, BOOLEAN) TO authenticated;
