const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const SERVER_PATH = '/Users/valentinechideme/Downloads/novumflow (uncle mike )/mcp_tools/supabase-mcp/packages/mcp-server-supabase/dist/transports/stdio.js';
const SUPABASE_URL = 'https://niikshfoecitimepiifo.supabase.co';
const SUPABASE_PAT = 'sbp_e43e5d03f11d0e1c9e6642d828a2629e067cb98c';

// Helper to create JSON-RPC request
let idCounter = 0;
const createRequest = (method, params) => ({
    jsonrpc: '2.0',
    id: idCounter++,
    method,
    params
});

async function run() {
    const serverProcess = spawn('node', [SERVER_PATH], {
        env: {
            ...process.env,
            SUPABASE_URL,
            SUPABASE_ACCESS_TOKEN: SUPABASE_PAT,
        },
        stdio: ['pipe', 'pipe', process.stderr]
    });

    const rl = readline.createInterface({ input: serverProcess.stdout });

    const send = (req) => {
        const msg = JSON.stringify(req);
        serverProcess.stdin.write(msg + '\n');
    };

    // 1. Initialize
    send(createRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'custom-client', version: '1.0.0' }
    }));

    // Handle responses
    for await (const line of rl) {
        try {
            const response = JSON.parse(line);

            if (response.id === 0) {
                // Initialize response
                send({ jsonrpc: '2.0', method: 'notifications/initialized' });

                // 2. Execute migration
                const migrationSql = `
-- 1. Get Platform Stats (Global)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_tenants INTEGER;
    v_active_tenants INTEGER;
    v_total_users INTEGER;
    v_total_jobs INTEGER;
    v_total_applications INTEGER;
    v_total_mrr NUMERIC := 0;
BEGIN
    -- Check if user is platform admin (simple check for now, can be enhanced)
    IF NOT EXISTS (
        SELECT 1 FROM public.users_profiles 
        WHERE id = auth.uid() AND is_platform_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Platform Admin only';
    END IF;

    -- Tenant Counts
    SELECT count(*), count(*) FILTER (WHERE is_active = true)
    INTO v_total_tenants, v_active_tenants
    FROM public.tenants;

    -- User Count
    SELECT count(*) INTO v_total_users FROM public.users_profiles;

    -- Job Count
    SELECT count(*) INTO v_total_jobs FROM public.job_postings;

    -- Application Count
    SELECT count(*) INTO v_total_applications FROM public.applications;

    -- Calculate MRR (Estimated based on tiers)
    -- Enterprise: $299, Professional: $99, Starter: $0
    SELECT COALESCE(SUM(
        CASE 
            WHEN subscription_tier = 'enterprise' THEN 299
            WHEN subscription_tier = 'professional' THEN 99
            ELSE 0
        END
    ), 0)
    INTO v_total_mrr
    FROM public.tenants
    WHERE is_active = true AND subscription_status = 'active';

    RETURN jsonb_build_object(
        'total_tenants', v_total_tenants,
        'active_tenants', v_active_tenants,
        'total_users', v_total_users,
        'total_jobs', v_total_jobs,
        'total_applications', v_total_applications,
        'total_mrr', v_total_mrr
    );
END;
$$;

-- 2. Get Tenant Details (Specific)
CREATE OR REPLACE FUNCTION get_tenant_details(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_count INTEGER;
    v_app_count INTEGER;
    v_interview_count INTEGER;
    v_recent_activity JSONB;
    v_tenant_data RECORD;
BEGIN
    -- Check if user is platform admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users_profiles 
        WHERE id = auth.uid() AND is_platform_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Platform Admin only';
    END IF;

    -- Get basic tenant info
    SELECT * INTO v_tenant_data FROM public.tenants WHERE id = p_tenant_id;

    -- Job Count
    SELECT count(*) INTO v_job_count
    FROM public.job_postings jp
    JOIN public.users_profiles up ON jp.created_by = up.id
    WHERE up.tenant_id = p_tenant_id;

    -- Application Count
    SELECT count(*) INTO v_app_count
    FROM public.applications a
    JOIN public.job_postings jp ON a.job_posting_id = jp.id
    JOIN public.users_profiles up ON jp.created_by = up.id
    WHERE up.tenant_id = p_tenant_id;

    -- Interview Count
    SELECT count(*) INTO v_interview_count
    FROM public.interviews i
    JOIN public.applications a ON i.application_id = a.id
    JOIN public.job_postings jp ON a.job_posting_id = jp.id
    JOIN public.users_profiles up ON jp.created_by = up.id
    WHERE up.tenant_id = p_tenant_id;

    -- Recent Activity (Audit Logs)
    SELECT jsonb_agg(t) INTO v_recent_activity
    FROM (
        SELECT action, entity_type, timestamp, 
               (SELECT first_name || ' ' || last_name FROM public.users_profiles WHERE id = al.user_id) as user_name
        FROM public.audit_logs al
        JOIN public.users_profiles up ON al.user_id = up.id
        WHERE up.tenant_id = p_tenant_id
        ORDER BY timestamp DESC
        LIMIT 5
    ) t;

    RETURN jsonb_build_object(
        'job_count', v_job_count,
        'application_count', v_app_count,
        'interview_count', v_interview_count,
        'recent_activity', COALESCE(v_recent_activity, '[]'::jsonb),
        'subscription_tier', v_tenant_data.subscription_tier,
        'subscription_status', v_tenant_data.subscription_status,
        'settings', v_tenant_data.settings
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_details(UUID) TO authenticated;
                `;

                send(createRequest('tools/call', {
                    name: 'execute_sql',
                    arguments: {
                        query: migrationSql,
                        project_id: 'niikshfoecitimepiifo'
                    }
                }));
            } else if (response.id === 1) {
                // Response from migration
                console.log('Migration Result:', JSON.stringify(response.result, null, 2));
                process.exit(0);
            }

        } catch (e) {
            console.error('Error parsing line:', line, e);
        }
    }
}

run().catch(console.error);

