-- Create test user for E2E testing
-- Email: e2e.test@novumflow.com
-- Password: TestPassword123!

DO $$
DECLARE
  test_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'e2e.test@novumflow.com';

  IF existing_user_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'e2e.test@novumflow.com',
      crypt('TestPassword123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    )
    RETURNING id INTO test_user_id;

    -- Create user profile with super admin privileges
    INSERT INTO users_profiles (
      user_id,
      full_name,
      role,
      is_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      test_user_id,
      'E2E Test User',
      'admin',
      true,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
      full_name = 'E2E Test User',
      role = 'admin',
      is_super_admin = true;

    RAISE NOTICE 'Test user created successfully with ID: %', test_user_id;
  ELSE
    RAISE NOTICE 'Test user already exists with ID: %', existing_user_id;
  END IF;
END $$;

-- Verify the user exists
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  p.is_super_admin
FROM auth.users u
LEFT JOIN users_profiles p ON u.id = p.user_id
WHERE u.email = 'e2e.test@novumflow.com';
