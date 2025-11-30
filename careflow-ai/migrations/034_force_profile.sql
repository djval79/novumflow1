-- ============================================
-- Force Create Profile for mrsonirie@gmail.com
-- ============================================

-- 1. Ensure the profile exists, creating it if missing
INSERT INTO public.users_profiles (user_id, email, full_name, role, is_active, is_super_admin)
SELECT 
    id, 
    email, 
    'Mr Sonirie', 
    'admin', 
    true, 
    true
FROM auth.users
WHERE email = 'mrsonirie@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET 
    is_super_admin = true,
    role = 'admin',
    is_active = true;

-- 2. Verify/Re-create the is_admin function just in case
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 3. Ensure the policy uses it
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users_profiles;
CREATE POLICY "Admins can view all profiles" ON public.users_profiles
    FOR SELECT USING (public.is_admin());

-- 4. Grant permissions
GRANT ALL ON public.users_profiles TO authenticated;
GRANT ALL ON public.users_profiles TO service_role;
