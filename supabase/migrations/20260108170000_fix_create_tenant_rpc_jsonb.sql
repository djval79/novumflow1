-- Fix create_tenant RPC to use JSONB for permissions
-- This resolves the error: column "permissions" is of type jsonb but expression is of type text[]

CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name text, 
  p_subdomain text, 
  p_owner_user_id uuid,
  p_subscription_tier text DEFAULT 'trial'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Insert the new tenant
  INSERT INTO public.tenants (
    name, 
    domain, 
    slug, 
    subscription_tier, 
    is_active, 
    created_at, 
    updated_at
  )
  VALUES (
    p_name, 
    p_subdomain, 
    p_subdomain, 
    p_subscription_tier, 
    true, 
    now(), 
    now()
  )
  RETURNING id INTO v_tenant_id;

  -- Create membership for the owner
  -- FIX: Cast permissions to JSONB as the column type is likely jsonb in this env
  INSERT INTO public.user_tenant_memberships (
    user_id,
    tenant_id,
    role,
    permissions,
    is_active,
    joined_at
  ) VALUES (
    p_owner_user_id,
    v_tenant_id,
    'owner', 
    '["all"]'::jsonb, 
    true,
    now()
  );

  -- Update users_profiles to point to this as Primary Tenant (Legacy support)
  UPDATE public.users_profiles
  SET 
    tenant_id = v_tenant_id,
    role = 'admin',
    is_super_admin = false, 
    updated_at = now()
  WHERE user_id = p_owner_user_id;
  
  -- Fallback insert profile
  IF NOT FOUND THEN
    INSERT INTO public.users_profiles (
      user_id,
      tenant_id,
      role,
      is_super_admin,
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      p_owner_user_id,
      v_tenant_id,
      'admin',
      false,
      'Admin User', 
      now(),
      now()
    );
  END IF;

  RETURN v_tenant_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create tenant: %', SQLERRM;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text, uuid, text) TO authenticated, service_role;
