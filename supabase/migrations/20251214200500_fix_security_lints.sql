-- Fix 1: Make views respect RLS (Security Invoker)
-- This resolves "Security Definer View" errors by ensuring the view runs with the permissions
-- of the user querying it, rather than the view's owner.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'v_expiring_documents') THEN
        ALTER VIEW public.v_expiring_documents SET (security_invoker = true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'v_compliance_status') THEN
        ALTER VIEW public.v_compliance_status SET (security_invoker = true);
    END IF;
END $$;

-- Fix 2 & 3: Enable RLS and add basic policies to public tables
-- We wrap these in a block that checks for existence to prevent push failures.
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'compliance_document_types',
        'compliance_document_folders',
        'compliance_stage_history',
        'role_mappings',
        'failed_syncs',
        'leave_approval_rules',
        'document_templates'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- Add generic read policy
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON public.%I', t, t);
            EXECUTE format('CREATE POLICY "Authenticated users can read %I" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
        END IF;
    END LOOP;
END $$;
