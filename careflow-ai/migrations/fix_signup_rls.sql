-- 1. Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (user_id, email, full_name, role, is_active)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'carer'), -- Default to carer if not specified
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Add a fallback RLS policy (just in case client tries to insert)
-- This allows a user to insert their OWN profile row
CREATE POLICY "Users can insert their own profile"
ON public.users_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.users_profiles TO anon, authenticated;
GRANT ALL ON TABLE public.users_profiles TO service_role;
