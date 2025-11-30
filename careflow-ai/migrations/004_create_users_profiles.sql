-- ============================================
-- Create users_profiles table
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'carer',
    phone TEXT,
    avatar_url TEXT,
    department TEXT,
    position TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID, -- Optional link to a specific tenant context
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_profiles_user_id ON users_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_profiles_email ON users_profiles(email);
CREATE INDEX IF NOT EXISTS idx_users_profiles_role ON users_profiles(role);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins and Super Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON users_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles up
            WHERE up.user_id = auth.uid() AND (up.role = 'admin' OR up.is_super_admin = true)
        )
    );

-- Fallback for insert (handled by trigger usually, but good for manual testing)
CREATE POLICY "Users can insert their own profile" ON users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Triggers
-- ============================================

-- Function to handle new user creation (Sync with Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (user_id, email, full_name, role, is_active)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'carer'),
    true
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent errors if already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_profiles_updated_at ON users_profiles;
CREATE TRIGGER update_users_profiles_updated_at
    BEFORE UPDATE ON users_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.users_profiles TO anon, authenticated;
GRANT ALL ON TABLE public.users_profiles TO service_role;
