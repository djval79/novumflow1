-- ============================================
-- FIX CLIENT & MEDICATION RLS LOOPS
-- ============================================

-- This script dynamically finds and drops ALL policies for the medication/client tables.
-- This ensures we remove any "bad" policies causing the loop.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop ALL policies on clients
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'clients' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.clients', r.policyname);
    END LOOP;

    -- 2. Drop ALL policies on medications
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'medications' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.medications', r.policyname);
    END LOOP;

    -- 3. Drop ALL policies on medication_records
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'medication_records' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.medication_records', r.policyname);
    END LOOP;
END $$;

-- ============================================
-- RE-APPLY SAFE POLICIES
-- ============================================

-- We use the safe 'has_tenant_role' function which we know works (from 009/010).
-- If that function is missing, we recreate it here just in case.

CREATE OR REPLACE FUNCTION public.has_tenant_role(check_tenant_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_tenant_memberships
    WHERE user_id = auth.uid()
    AND tenant_id = check_tenant_id
    AND role = ANY(required_roles)
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Clients
CREATE POLICY "safe_access_clients" ON public.clients
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

-- 2. Medications
CREATE POLICY "safe_access_medications" ON public.medications
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );

-- 3. Medication Records
CREATE POLICY "safe_access_medication_records" ON public.medication_records
    FOR ALL USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer'])
    );
