-- ============================================
-- Phase 3: Update Invitation Roles
-- ============================================

-- The existing table from HR platform has a restrictive check constraint on roles.
-- We need to add 'carer', 'nurse', 'senior_carer' to the allowed list.

-- 1. Drop the existing constraint
ALTER TABLE tenant_invitations DROP CONSTRAINT IF EXISTS tenant_invitations_role_check;

-- 2. Add the new constraint with expanded roles
ALTER TABLE tenant_invitations 
ADD CONSTRAINT tenant_invitations_role_check 
CHECK (role IN ('owner', 'admin', 'manager', 'member', 'carer', 'senior_carer', 'nurse'));
