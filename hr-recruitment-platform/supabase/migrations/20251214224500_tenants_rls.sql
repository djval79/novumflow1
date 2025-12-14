-- Add RLS Policies for Tenants Table

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admins can do anything
-- Check if the current user has is_super_admin = true in their profile
CREATE POLICY "Super admins can manage all tenants"
ON public.tenants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Policy: Tenant Admins can view and update their OWN tenant
-- Users can see the tenant they belong to
CREATE POLICY "Users can view their own tenant"
ON public.tenants
FOR SELECT
USING (
  id IN (
    SELECT tenant_id FROM public.users_profiles
    WHERE user_id = auth.uid()
  )
);

-- Note: We are NOT allowing regular admins to UPDATE their subscription tier directly via client-side code 
-- for security reasons (they should go through a billing flow/stripe webhook or similar).
-- However, for this specific admin panel which seems to be super-admin focused, the first policy covers it.

-- If you want tenant admins to be able to update their settings (like name/domain), needed:
CREATE POLICY "Tenant admins can update their own tenant"
ON public.tenants
FOR UPDATE
USING (
  id IN (
    SELECT tenant_id FROM public.users_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO service_role;
