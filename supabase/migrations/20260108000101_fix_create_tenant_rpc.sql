-- Fix create_tenant RPC and ensure schema exists
-- 1. Ensure user_tenant_memberships table exists
CREATE TABLE IF NOT EXISTS public.user_tenant_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  permissions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Enable RLS on membership table
ALTER TABLE public.user_tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
CREATE POLICY "Users can view own memberships" 
  ON public.user_tenant_memberships 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Tenant admins can manage memberships (this requires recursive check, simplified for now)
-- Skipping complex policies for this migration to avoid infinite recursion risk.

-- 2. Update RPC
DROP FUNCTION IF EXISTS public.create_tenant(text, text, uuid);
DROP FUNCTION IF EXISTS public.create_tenant(text, text, uuid, text);

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
  -- Ensure subscription_tier column exists (it might not if table is old)
  -- We assume it exists or the INSERT will fail. 
  -- Ideally we'd alter table here but that might lock.
  
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
    ARRAY['all'], -- Use Postgres Array constructor
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_tenant(text, text, uuid, text) TO authenticated, service_role;
GRANT ALL ON public.user_tenant_memberships TO authenticated, service_role;
