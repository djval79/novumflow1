-- ============================================
-- FIX MEDICATION RLS RECURSION
-- ============================================

-- Drop existing policies that might be using the recursive user_has_tenant_access function
DROP POLICY IF EXISTS "Users can access medications in their tenant" ON medications;
DROP POLICY IF EXISTS "Users can access mar records in their tenant" ON medication_records;

-- Re-create policies using the SAFE has_tenant_role function from migration 005
-- We allow all roles (owner, admin, manager, member) to access medications if they belong to the tenant

CREATE POLICY "Users can access medications in their tenant" ON medications
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

CREATE POLICY "Users can access mar records in their tenant" ON medication_records
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

-- Also fix other tables from 003 that might be affected, just to be safe
DROP POLICY IF EXISTS "Users can access clients in their tenant" ON clients;
CREATE POLICY "Users can access clients in their tenant" ON clients
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

DROP POLICY IF EXISTS "Users can access care plans in their tenant" ON care_plans;
CREATE POLICY "Users can access care plans in their tenant" ON care_plans
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

DROP POLICY IF EXISTS "Users can access visits in their tenant" ON visits;
CREATE POLICY "Users can access visits in their tenant" ON visits
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

DROP POLICY IF EXISTS "Users can access incidents in their tenant" ON incidents;
CREATE POLICY "Users can access incidents in their tenant" ON incidents
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

DROP POLICY IF EXISTS "Users can access care notes in their tenant" ON care_notes;
CREATE POLICY "Users can access care notes in their tenant" ON care_notes
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );
