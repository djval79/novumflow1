CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_super BOOLEAN;
  _user_id UUID;
BEGIN
  -- Get current user ID
  _user_id := auth.uid();
  
  -- 1. Try JWT claims first (fastest)
  user_role := current_setting('request.jwt.claims', true)::json->>'role';
  is_super := (current_setting('request.jwt.claims', true)::json->>'is_super_admin')::boolean;
  
  -- 2. Fallback: Query auth.users (avoids recursion on public.users_profiles)
  IF user_role IS NULL AND _user_id IS NOT NULL THEN
    SELECT 
      raw_user_meta_data->>'role',
      (raw_user_meta_data->>'is_super_admin')::boolean
    INTO user_role, is_super
    FROM auth.users
    WHERE id = _user_id;
  END IF;
  
  RETURN (user_role = 'admin' OR is_super = true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
