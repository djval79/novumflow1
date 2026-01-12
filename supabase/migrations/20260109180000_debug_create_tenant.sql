
-- Debug create_tenant RPC with manual user validation
-- This replaces the previous definition with one that checks auth.users first

CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name text, 
  p_subdomain text, 
  p_owner_user_id uuid,
  p_subscription_tier text DEFAULT 'trial'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_exists boolean;
BEGIN
  -- 1. Debug: Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_owner_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
     RAISE EXCEPTION 'USER_NOT_FOUND: The user ID % was not found in auth.users. This implies the signup transaction has not completed or the ID is incorrect.', p_owner_user_id;
  END IF;

  -- 2. Insert the new tenant
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

  -- 3. Create membership for the owner
  -- Using explicit JSONB cast as previously fixed
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

  -- 4. Update users_profiles (Legacy)
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
    -- Capture the exact error and re-raise it properly
    RAISE EXCEPTION 'Failed to create tenant: %', SQLERRM;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text, uuid, text) TO authenticated, service_role;
