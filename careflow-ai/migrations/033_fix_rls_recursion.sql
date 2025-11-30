-- ============================================
-- Fix RLS Infinite Recursion in users_profiles
-- ============================================

-- 1. Create a SECURITY DEFINER function to check admin status safely
-- This function runs with the privileges of the creator (postgres/admin), bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users_profiles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to everyone (authenticated users need to call it)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Update the RLS Policy to use the new function
-- Drop the old recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users_profiles;

-- Create the new policy using the safe function
CREATE POLICY "Admins can view all profiles" ON public.users_profiles
    FOR SELECT USING (
        public.is_admin()
    );

-- 3. Ensure other policies are also safe (optional but good practice)
-- "Users can view their own profile" is already safe (auth.uid() = user_id)
