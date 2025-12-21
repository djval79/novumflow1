-- ============================================
-- Monthly Compliance Report Scheduler
-- ============================================
-- This migration sets up a pg_cron job to trigger the monthly compliance report
-- Edge Function on the 1st of each month at 9:00 AM UTC.

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to invoke the Edge Function via pg_net
CREATE OR REPLACE FUNCTION public.trigger_monthly_compliance_report()
RETURNS void AS $$
DECLARE
    v_supabase_url TEXT;
    v_anon_key TEXT;
BEGIN
    -- Get Supabase URL and anon key from vault or use defaults
    -- In production, store these in Supabase Vault secrets
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_anon_key := current_setting('app.settings.supabase_anon_key', true);
    
    -- If not set, use hardcoded fallback (not recommended for production)
    IF v_supabase_url IS NULL THEN
        v_supabase_url := 'https://niikshfoecitimepiifo.supabase.co';
    END IF;
    
    -- Make HTTP request to the Edge Function
    -- Note: This requires pg_net extension
    PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/monthly-compliance-report',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := '{}'::jsonb
    );
    
    -- Log the trigger
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        'cron_job_triggered',
        'compliance_report',
        'monthly_scheduler',
        jsonb_build_object(
            'triggered_at', NOW(),
            'job_name', 'monthly_compliance_report'
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail (cron jobs should be resilient)
    RAISE WARNING 'Failed to trigger monthly compliance report: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the monthly compliance report
-- Runs at 09:00 UTC on the 1st of every month
SELECT cron.schedule(
    'monthly-compliance-report',         -- Job name
    '0 9 1 * *',                         -- Cron expression: 9 AM UTC, 1st of month
    $$SELECT public.trigger_monthly_compliance_report()$$
);

-- Create a table to track scheduled report history (optional, for UI display)
CREATE TABLE IF NOT EXISTS public.scheduled_report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    actual_run_time TIMESTAMPTZ,
    status TEXT CHECK (status IN ('scheduled', 'running', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access
GRANT SELECT, INSERT ON public.scheduled_report_runs TO authenticated;
GRANT SELECT, INSERT ON public.scheduled_report_runs TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Monthly Compliance Report Scheduler configured!';
    RAISE NOTICE 'Schedule: 09:00 UTC on the 1st of every month';
    RAISE NOTICE 'To manually trigger: SELECT public.trigger_monthly_compliance_report();';
END $$;

-- ============================================
-- ALTERNATIVE: If pg_cron is not available
-- ============================================
-- You can use an external scheduler like:
-- 1. GitHub Actions with a cron schedule
-- 2. Vercel Cron Jobs
-- 3. AWS EventBridge
-- 4. Any other cron service
--
-- Example GitHub Actions workflow:
-- name: Monthly Compliance Report
-- on:
--   schedule:
--     - cron: '0 9 1 * *'
-- jobs:
--   send-report:
--     runs-on: ubuntu-latest
--     steps:
--       - run: |
--           curl -X POST \
--             "${{ secrets.SUPABASE_URL }}/functions/v1/monthly-compliance-report" \
--             -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
--             -H "Content-Type: application/json"
