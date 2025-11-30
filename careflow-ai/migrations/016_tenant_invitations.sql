-- ============================================
-- Phase 3: Tenant Invitations
-- ============================================

-- 1. Create Invitations Table
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member', 'carer', 'nurse')),
    token UUID DEFAULT uuid_generate_v4(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(tenant_id, email)
);

-- 2. RLS for Invitations
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view/create invitations for their tenant
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tenant_invitations' AND policyname = 'Admins can view invitations'
    ) THEN
        CREATE POLICY "Admins can view invitations"
        ON tenant_invitations FOR SELECT
        USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager']));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tenant_invitations' AND policyname = 'Admins can create invitations'
    ) THEN
        CREATE POLICY "Admins can create invitations"
        ON tenant_invitations FOR INSERT
        WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager']));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tenant_invitations' AND policyname = 'Admins can delete invitations'
    ) THEN
        CREATE POLICY "Admins can delete invitations"
        ON tenant_invitations FOR DELETE
        USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager']));
    END IF;
END $$;

-- 3. RPC to Invite User
CREATE OR REPLACE FUNCTION invite_user_to_tenant(
    p_email TEXT,
    p_role TEXT,
    p_tenant_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_invitation_id UUID;
BEGIN
    -- Check permissions
    IF NOT public.has_tenant_role(p_tenant_id, ARRAY['owner', 'admin', 'manager']) THEN
        RAISE EXCEPTION 'Access denied: You do not have permission to invite users.';
    END IF;

    -- Create Invitation
    INSERT INTO tenant_invitations (tenant_id, email, role, invited_by)
    VALUES (p_tenant_id, p_email, p_role, auth.uid())
    ON CONFLICT (tenant_id, email) 
    DO UPDATE SET 
        role = EXCLUDED.role, 
        status = 'pending',
        created_at = NOW(),
        expires_at = (NOW() + INTERVAL '7 days'),
        token = uuid_generate_v4()
    RETURNING id INTO v_invitation_id;

    RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC to Accept Invitation
CREATE OR REPLACE FUNCTION accept_tenant_invitation(p_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_invite RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Get Invitation
    SELECT * INTO v_invite
    FROM tenant_invitations
    WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation.';
    END IF;

    -- Add User to Tenant
    INSERT INTO user_tenant_memberships (user_id, tenant_id, role)
    VALUES (v_user_id, v_invite.tenant_id, v_invite.role)
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET role = EXCLUDED.role, is_active = true;

    -- Update Invitation Status
    UPDATE tenant_invitations
    SET status = 'accepted'
    WHERE id = v_invite.id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
