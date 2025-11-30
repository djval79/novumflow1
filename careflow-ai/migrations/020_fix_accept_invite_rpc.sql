-- ============================================
-- Phase 3: Fix Accept Invitation RPC
-- ============================================

-- The token column in tenant_invitations is TEXT (from HR schema), 
-- but our previous definition expected UUID.

-- 1. Drop incorrect function
DROP FUNCTION IF EXISTS accept_tenant_invitation(uuid);

-- 2. Create correct function
CREATE OR REPLACE FUNCTION accept_tenant_invitation(p_token TEXT)
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
    INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
    VALUES (v_user_id, v_invite.tenant_id, v_invite.role, true)
    ON CONFLICT (user_id, tenant_id) 
    DO UPDATE SET role = EXCLUDED.role, is_active = true;

    -- Update Invitation Status
    UPDATE tenant_invitations
    SET status = 'accepted', accepted_by = v_user_id, accepted_at = NOW()
    WHERE id = v_invite.id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
