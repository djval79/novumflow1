-- Drop and recreate get_my_tenants RPC function
DROP FUNCTION IF EXISTS public.get_my_tenants();

CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    subdomain VARCHAR,
    features JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.slug,
        t.domain as subdomain,
        COALESCE(t.features, '{"novumflow_enabled": true, "careflow_enabled": true}'::jsonb) as features
    FROM public.tenants t
    INNER JOIN public.user_tenant_memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid()
    AND m.is_active = true
    AND t.is_active = true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenants() TO service_role;
