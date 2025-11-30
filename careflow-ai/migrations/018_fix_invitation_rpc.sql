-- ============================================
-- Phase 3: Fix Invitation RPC Conflict
-- ============================================

-- Drop the conflicting function we created in 016
-- (The one with p_email first)
DROP FUNCTION IF EXISTS invite_user_to_tenant(text, text, uuid);

-- We will rely on the existing function from the HR schema:
-- invite_user_to_tenant(p_tenant_id uuid, p_email text, p_role text)
