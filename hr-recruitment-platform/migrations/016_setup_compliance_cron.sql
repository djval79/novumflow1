-- ============================================================================
-- MIGRATION 016: SETUP DAILY COMPLIANCE CHECK CRON JOB
-- ============================================================================
-- This migration sets up a pg_cron job to trigger the compliance check daily.
-- It calls the automation-engine Edge Function with the CHECK_COMPLIANCE action.
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a helper function to call the automation engine
CREATE OR REPLACE FUNCTION trigger_daily_compliance_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    supabase_url TEXT;
    service_role_key TEXT;
    response_status INTEGER;
BEGIN
    -- Get the Supabase URL and service role key from vault or config
    -- Note: In production, these should come from vault secrets
    supabase_url := current_setting('app.supabase_url', true);
    service_role_key := current_setting('app.service_role_key', true);
    
    -- If settings are not available, log and exit
    IF supabase_url IS NULL OR service_role_key IS NULL THEN
        RAISE NOTICE 'Supabase configuration not found. Skipping compliance check.';
        RETURN;
    END IF;
    
    -- Call the automation engine with CHECK_COMPLIANCE action
    -- This uses the http extension to make the API call
    PERFORM net.http_post(
        url := supabase_url || '/functions/v1/automation-engine',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || service_role_key,
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'action', 'CHECK_COMPLIANCE',
            'data', jsonb_build_object('notify_on_expiry_days', 30)
        )
    );
    
    -- Log the execution
    INSERT INTO audit_logs (
        action,
        entity_type,
        details,
        timestamp
    ) VALUES (
        'daily_compliance_check',
        'system',
        jsonb_build_object('triggered_by', 'pg_cron', 'status', 'initiated'),
        NOW()
    );
    
    RAISE NOTICE 'Daily compliance check triggered successfully';
END;
$$;

-- Schedule the cron job to run daily at 6:00 AM UTC
-- Note: pg_cron uses UTC timezone
SELECT cron.schedule(
    'daily-compliance-check',  -- Job name
    '0 6 * * *',               -- Cron expression: 6:00 AM UTC daily
    $$SELECT trigger_daily_compliance_check()$$
);

-- Alternative: If pg_cron is not available, create a fallback using pg_net
-- This creates a webhook that can be called by an external scheduler

CREATE OR REPLACE FUNCTION public.webhook_trigger_compliance_check()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function can be called via a Supabase scheduled function
    -- or an external cron service like GitHub Actions, Vercel Cron, etc.
    
    PERFORM trigger_daily_compliance_check();
    
    RETURN json_build_object(
        'success', true,
        'message', 'Compliance check triggered',
        'timestamp', NOW()
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.webhook_trigger_compliance_check() TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-compliance-check';

-- View scheduled jobs
SELECT jobid, schedule, command, nodename, nodeport, database, username, active 
FROM cron.job;

-- To manually run the compliance check for testing:
-- SELECT trigger_daily_compliance_check();

-- To unschedule the job if needed:
-- SELECT cron.unschedule('daily-compliance-check');
