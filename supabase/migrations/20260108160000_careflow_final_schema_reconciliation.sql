-- ======================================================================
-- CAREFLOW FINAL SCHEMA RECONCILIATION
-- This migration ensures all table names and columns match the service layer (supabaseService.ts)
-- and enforces consistent RLS using the user_has_tenant_access function.
-- ======================================================================

-- 1. FIX: Medications Table
-- Rename if exists from eMAR migration or create if missing
DO $$
BEGIN
    -- If 'medications' exists (from older migration), rename it
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'medications' AND schemaname = 'public') THEN
        ALTER TABLE medications RENAME TO careflow_medications;
    END IF;
    
    -- Ensure columns match CareFlowMedication interface
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'careflow_medications' AND schemaname = 'public') THEN
        CREATE TABLE careflow_medications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT,
            route TEXT,
            instructions TEXT,
            start_date DATE,
            stock_level INT DEFAULT 0,
            reorder_level INT DEFAULT 10,
            status TEXT DEFAULT 'Active',
            last_review_date DATE,
            next_review_date DATE,
            ai_safety_summary TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add missing columns to careflow_medications
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS instructions TEXT;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS start_date DATE;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS stock_level INT DEFAULT 0;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS reorder_level INT DEFAULT 10;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS last_review_date DATE;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS next_review_date DATE;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS ai_safety_summary TEXT;
        ALTER TABLE careflow_medications ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. FIX: Medication Administrations (MAR) Table
DO $$
BEGIN
    -- If 'medication_logs' exists, rename it
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'medication_logs' AND schemaname = 'public') THEN
        ALTER TABLE medication_logs RENAME TO careflow_medication_administrations;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'careflow_medication_administrations' AND schemaname = 'public') THEN
        CREATE TABLE careflow_medication_administrations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
            medication_id UUID NOT NULL REFERENCES careflow_medications(id) ON DELETE CASCADE,
            visit_id UUID REFERENCES careflow_visits(id) ON DELETE SET NULL,
            status TEXT NOT NULL, -- Taken, Refused, Missed
            notes TEXT,
            administered_at TIMESTAMPTZ DEFAULT NOW(),
            administered_by UUID NOT NULL, -- Link to staff or user
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
         ALTER TABLE careflow_medication_administrations ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES careflow_visits(id);
    END IF;
END $$;

-- 3. FIX: Compliance Table Name Consistency
-- The service layer expects careflow_compliance but we also want to support 'careflow_compliance_records'
-- if that's what was intended. We'll use 'careflow_compliance' as the primary.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'careflow_compliance_records' AND schemaname = 'public') THEN
        -- If both exist, we might need to merge, but for now we just ensure 'careflow_compliance' is there
        -- If 'careflow_compliance' is missing, rename the other one
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'careflow_compliance' AND schemaname = 'public') THEN
            ALTER TABLE careflow_compliance_records RENAME TO careflow_compliance;
        END IF;
    END IF;
END $$;

-- 4. HARDEN: Tenant Isolation (RLS)
-- Use the unified user_has_tenant_access function for ALL CareFlow tables
DO $$
DECLARE
    t_name TEXT;
    careflow_tables TEXT[] := ARRAY[
        'careflow_staff',
        'careflow_compliance',
        'careflow_clients',
        'careflow_visits',
        'careflow_care_plans',
        'careflow_medications',
        'careflow_medication_administrations',
        'careflow_incidents',
        'careflow_expenses',
        'careflow_leave_requests',
        'careflow_form_templates',
        'careflow_form_submissions',
        'careflow_training_modules',
        'careflow_training_progress',
        'careflow_onboarding_tasks',
        'careflow_onboarding_progress',
        'careflow_shift_marketplace',
        'careflow_assets',
        'careflow_inventory',
        'careflow_enquiries',
        'careflow_telehealth_sessions',
        'careflow_vital_readings',
        'careflow_notifications'
    ];
BEGIN
    FOREACH t_name IN ARRAY careflow_tables
    LOOP
        -- Check if table exists before applying RLS
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t_name AND schemaname = 'public') THEN
            -- Enable RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t_name);
            
            -- Drop existing policies to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "careflow_tenant_isolation_policy" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can access in their tenant" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view staff in their tenant" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view compliance in their tenant" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view clients in their tenant" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view visits in their tenant" ON %I', t_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view care plans in their tenant" ON %I', t_name);
            
            -- Create unified policy using user_has_tenant_access function
            EXECUTE format('
                CREATE POLICY "careflow_tenant_isolation_policy" ON %I
                FOR ALL
                USING (public.user_has_tenant_access(tenant_id))
                WITH CHECK (public.user_has_tenant_access(tenant_id))
            ', t_name);
        END IF;
    END LOOP;
END $$;

-- 6. FIX: Hydration Table Name Consistency
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'careflow_hydration_logs' AND schemaname = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'careflow_hydration' AND schemaname = 'public') THEN
            ALTER TABLE careflow_hydration_logs RENAME TO careflow_hydration;
        END IF;
    END IF;
END $$;

-- 7. Additional CareFlow Tables (if missing)
CREATE TABLE IF NOT EXISTS careflow_progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES careflow_staff(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT,
    note TEXT NOT NULL,
    mood TEXT,
    progress_score INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on progress logs
ALTER TABLE careflow_progress_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "careflow_tenant_isolation_policy" ON careflow_progress_logs;
CREATE POLICY "careflow_tenant_isolation_policy" ON careflow_progress_logs
    FOR ALL USING (public.user_has_tenant_access(tenant_id))
    WITH CHECK (public.user_has_tenant_access(tenant_id));

-- 8. Add care_level and other missing columns to careflow_clients if missing from first migration
ALTER TABLE careflow_clients ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE careflow_clients ADD COLUMN IF NOT EXISTS funding_details JSONB DEFAULT '{}';

-- FINAL STEP: Update migration logs
-- This is manual in Supabase but good to keep in script
-- 9. FIX: create_tenant RPC (Type Mismatch)
-- Resolves: column "permissions" is of type jsonb but expression is of type text[]
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_name text, 
  p_subdomain text, 
  p_owner_user_id uuid,
  p_subscription_tier text DEFAULT 'trial'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Insert the new tenant
  INSERT INTO public.tenants (
    name, 
    domain, 
    slug, 
    subscription_tier, 
    is_active, 
    created_at, 
    updated_at
  )
  VALUES (
    p_name, 
    p_subdomain, 
    p_subdomain, 
    p_subscription_tier, 
    true, 
    now(), 
    now()
  )
  RETURNING id INTO v_tenant_id;

  -- Create membership for the owner
  -- FIX: Cast permissions to JSONB
  INSERT INTO public.user_tenant_memberships (
    user_id,
    tenant_id,
    role,
    permissions,
    is_active,
    joined_at
  ) VALUES (
    p_owner_user_id,
    v_tenant_id,
    'owner', 
    '["all"]'::jsonb, 
    true,
    now()
  );

  -- Update users_profiles (Legacy)
  UPDATE public.users_profiles
  SET 
    tenant_id = v_tenant_id,
    role = 'admin',
    is_super_admin = false, 
    updated_at = now()
  WHERE user_id = p_owner_user_id;
  
  -- Fallback insert profile
  IF NOT FOUND THEN
    INSERT INTO public.users_profiles (
      user_id,
      tenant_id,
      role,
      is_super_admin,
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      p_owner_user_id,
      v_tenant_id,
      'admin',
      false,
      'Admin User', 
      now(),
      now()
    );
  END IF;

  RETURN v_tenant_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create tenant: %', SQLERRM;
END;
$$;

-- FINAL STEP: Update migration logs
SELECT 'CareFlow Schema Reconciliation Complete' as status;
