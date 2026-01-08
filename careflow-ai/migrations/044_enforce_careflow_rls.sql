-- =================================================================
-- Secure CareFlow Tables with RLS (Row Level Security)
-- =================================================================
-- This migration ensures all tenant-specific tables in the CareFlow
-- ecosystem have RLS enabled and strictly enforce tenant isolation.
-- =================================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'careflow_clients',
        'careflow_visits',
        'careflow_medications',
        'careflow_medication_administrations',
        'careflow_staff',
        'careflow_care_plans',
        'careflow_care_goals',
        'careflow_progress_logs',
        'careflow_incidents',
        'careflow_leave_requests',
        'careflow_expenses',
        'careflow_inventory',
        'careflow_events',
        'careflow_meals',
        'careflow_hydration',
        'careflow_enquiries',
        'careflow_documents',
        'careflow_form_submissions',
        'careflow_form_templates',
        'careflow_notifications',
        'careflow_invoices',
        'careflow_assets',
        'careflow_feedback',
        'careflow_policies',
        'careflow_policy_acknowledgements'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- 1. Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            
            -- Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- Drop existing policies to ensure clean slate
            EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view their tenant data" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can insert their tenant data" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update their tenant data" ON public.%I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can delete their tenant data" ON public.%I', t);

            -- Create unified policy using user_has_tenant_access function
            EXECUTE format('
                CREATE POLICY "Tenant Isolation" ON public.%I
                FOR ALL
                USING (public.user_has_tenant_access(tenant_id))
                WITH CHECK (public.user_has_tenant_access(tenant_id))
            ', t);
            
            RAISE NOTICE 'Secured table: %', t;
        ELSE
            RAISE NOTICE 'Skipping missing table: %', t;
        END IF;
    END LOOP;
END $$;
