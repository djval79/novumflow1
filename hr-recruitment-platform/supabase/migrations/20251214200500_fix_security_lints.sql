-- Fix 1: Make views respect RLS (Security Invoker)
-- This resolves "Security Definer View" errors by ensuring the view runs with the permissions
-- of the user querying it, rather than the view's owner.
ALTER VIEW public.v_expiring_documents SET (security_invoker = true);
ALTER VIEW public.v_compliance_status SET (security_invoker = true);

-- Fix 2: Enable Row Level Security (RLS) on public tables
-- This resolves "RLS Disabled in Public" errors.
ALTER TABLE public.compliance_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Fix 3: Add basic policies to prevent access lockout
-- Since RLS is now enabled, we must explicit granting access.
-- We default to "Authenticated Users can Read" for these tables to maintain app functionality.
-- Insert/Update permissions specific to Admins should be added separately if not already handled by service role.

-- 3.1 compliance_document_types
DROP POLICY IF EXISTS "Authenticated users can read document types" ON public.compliance_document_types;
CREATE POLICY "Authenticated users can read document types" 
ON public.compliance_document_types FOR SELECT TO authenticated USING (true);

-- 3.2 compliance_document_folders
DROP POLICY IF EXISTS "Authenticated users can read compliance folders" ON public.compliance_document_folders;
CREATE POLICY "Authenticated users can read compliance folders" 
ON public.compliance_document_folders FOR SELECT TO authenticated USING (true);

-- 3.3 compliance_stage_history
DROP POLICY IF EXISTS "Authenticated users can read stage history" ON public.compliance_stage_history;
CREATE POLICY "Authenticated users can read stage history" 
ON public.compliance_stage_history FOR SELECT TO authenticated USING (true);

-- 3.4 role_mappings
DROP POLICY IF EXISTS "Authenticated users can read role mappings" ON public.role_mappings;
CREATE POLICY "Authenticated users can read role mappings" 
ON public.role_mappings FOR SELECT TO authenticated USING (true);

-- 3.5 failed_syncs
DROP POLICY IF EXISTS "Authenticated users can read failed syncs" ON public.failed_syncs;
CREATE POLICY "Authenticated users can read failed syncs" 
ON public.failed_syncs FOR SELECT TO authenticated USING (true);

-- 3.6 leave_approval_rules
DROP POLICY IF EXISTS "Authenticated users can read leave rules" ON public.leave_approval_rules;
CREATE POLICY "Authenticated users can read leave rules" 
ON public.leave_approval_rules FOR SELECT TO authenticated USING (true);

-- 3.7 document_templates
DROP POLICY IF EXISTS "Authenticated users can read document templates" ON public.document_templates;
CREATE POLICY "Authenticated users can read document templates" 
ON public.document_templates FOR SELECT TO authenticated USING (true);
