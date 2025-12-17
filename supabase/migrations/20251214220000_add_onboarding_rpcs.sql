-- Create RPC functions for Tenant Onboarding

-- 1. Check Subdomain Availability
DROP FUNCTION IF EXISTS public.check_subdomain_availability(text);

CREATE OR REPLACE FUNCTION public.check_subdomain_availability(p_subdomain text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.tenants
  WHERE domain = p_subdomain OR slug = p_subdomain;
  
  RETURN v_count = 0;
END;
$$;

-- 2. Create Tenant
DROP FUNCTION IF EXISTS public.create_tenant(text, text, uuid);

CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name text, 
  p_subdomain text, 
  p_owner_user_id uuid
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
    p_subdomain, -- use subdomain as slug
    'trial', 
    true, 
    now(), 
    now()
  )
  RETURNING id INTO v_tenant_id;

  -- Update the owner's profile to link to this tenant
  -- Matches the logic in TenantSignupPage.tsx which creates user first
  UPDATE public.users_profiles
  SET 
    tenant_id = v_tenant_id,
    role = 'admin',
    is_super_admin = true
  WHERE user_id = p_owner_user_id;
  
  -- If for some reason profile doesn't exist (trigger delay), insert it
  IF NOT FOUND THEN
    INSERT INTO public.users_profiles (
      user_id,
      tenant_id,
      role,
      is_super_admin,
      full_name, -- Ideally passed in, but we can update later
      created_at,
      updated_at
    )
    VALUES (
      p_owner_user_id,
      v_tenant_id,
      'admin',
      true,
      'Admin User', -- Placeholder, usually updated by auth trigger
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

-- Grant execute permissions to public (authenticated and anon need to check availability, only auth can create tenant usually?)
-- Actually detailed access:
-- check_subdomain_availability: accessible by anon (before signup)
-- create_tenant: accessible by authenticated (user is created/logged in right before calling this)

GRANT EXECUTE ON FUNCTION public.check_subdomain_availability(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text, uuid) TO authenticated, service_role;
