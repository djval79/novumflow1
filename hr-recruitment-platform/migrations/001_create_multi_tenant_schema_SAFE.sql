-- ============================================
-- Phase 1: Multi-Tenant Database Schema - SAFE VERSION
-- Step 1: Create Tenants Table
-- This version handles existing tables safely
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription tier enum (if not exists)
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('trial', 'basic', 'professional', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'cancelled', 'suspended', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tenants table or alter if exists
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Add subdomain column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subdomain') THEN
        ALTER TABLE tenants ADD COLUMN subdomain TEXT UNIQUE;
    END IF;

    -- Add slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='slug') THEN
        ALTER TABLE tenants ADD COLUMN slug TEXT UNIQUE;
    END IF;

    -- Add other columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='website') THEN
        ALTER TABLE tenants ADD COLUMN website TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='primary_email') THEN
        ALTER TABLE tenants ADD COLUMN primary_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='phone') THEN
        ALTER TABLE tenants ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='address') THEN
        ALTER TABLE tenants ADD COLUMN address JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='settings') THEN
        ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='features') THEN
        ALTER TABLE tenants ADD COLUMN features JSONB DEFAULT '{
            "novumflow_enabled": true,
            "careflow_enabled": true,
            "ai_enabled": false,
            "sms_enabled": false
        }';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='limits') THEN
        ALTER TABLE tenants ADD COLUMN limits JSONB DEFAULT '{
            "max_users": 10,
            "max_employees": 50,
            "max_clients": 100,
            "max_storage_gb": 10
        }';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subscription_tier') THEN
        ALTER TABLE tenants ADD COLUMN subscription_tier subscription_tier DEFAULT 'trial';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subscription_status') THEN
        ALTER TABLE tenants ADD COLUMN subscription_status subscription_status DEFAULT 'trial';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='trial_ends_at') THEN
        ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subscription_started_at') THEN
        ALTER TABLE tenants ADD COLUMN subscription_started_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subscription_expires_at') THEN
        ALTER TABLE tenants ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='stripe_customer_id') THEN
        ALTER TABLE tenants ADD COLUMN stripe_customer_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='stripe_subscription_id') THEN
        ALTER TABLE tenants ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='is_active') THEN
        ALTER TABLE tenants ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='is_verified') THEN
        ALTER TABLE tenants ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='onboarding_completed') THEN
        ALTER TABLE tenants ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='deleted_at') THEN
        ALTER TABLE tenants ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_tier ON tenants(subscription_tier);

-- Create user-tenant membership table (many-to-many)
CREATE TABLE IF NOT EXISTS user_tenant_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Role in this tenant
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member')),
    
    -- Permissions (JSONB array)
    permissions JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    invitation_accepted_at TIMESTAMPTZ,
    
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tenant_user ON user_tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_tenant ON user_tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_active ON user_tenant_memberships(is_active) WHERE is_active = true;

-- Create tenant invitations table
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Invitation token
    token TEXT UNIQUE NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    accepted_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status ON tenant_invitations(status);

-- ============================================
-- Functions for Tenant Management
-- ============================================

-- Function to get current tenant ID from user context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    -- Try to get from session variable first
    BEGIN
        tenant_id := current_setting('app.current_tenant_id', true)::UUID;
        IF tenant_id IS NOT NULL THEN
            RETURN tenant_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Fallback: get default tenant for user
    SELECT utm.tenant_id INTO tenant_id
    FROM user_tenant_memberships utm
    WHERE utm.user_id = auth.uid()
      AND utm.is_active = true
    ORDER BY utm.joined_at ASC
    LIMIT 1;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set current tenant (for session)
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verify user has access to this tenant
    IF NOT EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = p_tenant_id
          AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User does not have access to this tenant';
    END IF;
    
    -- Set the session variable
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new tenant
CREATE OR REPLACE FUNCTION create_tenant(
    p_name TEXT,
    p_subdomain TEXT,
    p_owner_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_tenant_id UUID;
    owner_id UUID;
BEGIN
    -- Use current user if no owner specified
    owner_id := COALESCE(p_owner_user_id, auth.uid());
    
    -- Create tenant
    INSERT INTO tenants (
        name,
        subdomain,
        slug,
        trial_ends_at
    ) VALUES (
        p_name,
        p_subdomain,
        p_subdomain, -- slug same as subdomain for now
        NOW() + INTERVAL '14 days' -- 14-day trial
    )
    RETURNING id INTO new_tenant_id;
    
    -- Add owner to tenant
    INSERT INTO user_tenant_memberships (
        user_id,
        tenant_id,
        role,
        invitation_accepted_at
    ) VALUES (
        owner_id,
        new_tenant_id,
        'owner',
        NOW()
    );
    
    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite user to tenant
CREATE OR REPLACE FUNCTION invite_user_to_tenant(
    p_tenant_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'member'
)
RETURNS UUID AS $$
DECLARE
    invitation_id UUID;
    invitation_token TEXT;
BEGIN
    -- Check if user has permission to invite (must be admin or owner)
    IF NOT EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = p_tenant_id
          AND role IN ('owner', 'admin')
          AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User does not have permission to invite';
    END IF;
    
    -- Generate random token
    invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create invitation
    INSERT INTO tenant_invitations (
        tenant_id,
        email,
        role,
        invited_by,
        token
    ) VALUES (
        p_tenant_id,
        p_email,
        p_role,
        auth.uid(),
        invitation_token
    )
    RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can update tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their memberships" ON user_tenant_memberships;
DROP POLICY IF EXISTS "Admins can create invitations" ON tenant_invitations;
DROP POLICY IF EXISTS "Users can view their invitations" ON tenant_invitations;

-- Tenants: Users can see tenants they're members of
CREATE POLICY "Users can view their tenants"
ON tenants FOR SELECT
USING (
    id IN (
        SELECT tenant_id FROM user_tenant_memberships
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- Tenants: Only owners can update
CREATE POLICY "Owners can update tenants"
ON tenants FOR UPDATE
USING (
    id IN (
        SELECT tenant_id FROM user_tenant_memberships
        WHERE user_id = auth.uid() 
          AND role = 'owner'
          AND is_active = true
    )
);

-- Memberships: Users can view their own memberships
CREATE POLICY "Users can view their memberships"
ON user_tenant_memberships FOR SELECT
USING (
    user_id = auth.uid()
    OR tenant_id IN (
        SELECT tenant_id FROM user_tenant_memberships
        WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
          AND is_active = true
    )
);

-- Invitations: Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON tenant_invitations FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
          AND is_active = true
    )
);

-- Invitations: Users can view invitations for their email
CREATE POLICY "Users can view their invitations"
ON tenant_invitations FOR SELECT
USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR tenant_id IN (
        SELECT tenant_id FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
          AND is_active = true
    )
);

-- ============================================
-- Triggers
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tenant_memberships_updated_at ON user_tenant_memberships;
CREATE TRIGGER update_user_tenant_memberships_updated_at
    BEFORE UPDATE ON user_tenant_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Create default tenant for existing users
DO $$
DECLARE
    default_tenant_id UUID;
    tenant_exists BOOLEAN;
BEGIN
    -- Check if tenant already exists
    SELECT EXISTS(SELECT 1 FROM tenants WHERE slug = 'ringsteadcare') INTO tenant_exists;
    
    IF NOT tenant_exists THEN
        -- Create a default tenant
        INSERT INTO tenants (
            name,
            subdomain,
            slug,
            subscription_tier,
            subscription_status,
            is_verified,
            onboarding_completed
        ) VALUES (
            'Ringstead Care Home',
            'ringsteadcare',
            'ringsteadcare',
            'enterprise',
            'active',
            true,
            true
        )
        RETURNING id INTO default_tenant_id;
        
        -- Add existing users to this tenant
        INSERT INTO user_tenant_memberships (user_id, tenant_id, role, invitation_accepted_at)
        SELECT 
            u.id,
            default_tenant_id,
            'owner',
            NOW()
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM user_tenant_memberships utm
            WHERE utm.user_id = u.id
        )
        ON CONFLICT (user_id, tenant_id) DO NOTHING;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Multi-tenant schema created successfully!';
    RAISE NOTICE 'Created tables: tenants, user_tenant_memberships, tenant_invitations';
    RAISE NOTICE 'Created functions: get_current_tenant_id, set_current_tenant, create_tenant, invite_user_to_tenant';
    RAISE NOTICE 'RLS policies enabled';
END $$;
