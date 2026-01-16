
-- Migration: Fix permissions for security_audit_logs
-- Missing permissions were causing 401 Unauthorized errors for authenticated users

-- Ensure usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions for security_audit_logs
GRANT ALL ON TABLE public.security_audit_logs TO service_role;
GRANT SELECT, INSERT ON TABLE public.security_audit_logs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.security_audit_logs TO anon;
