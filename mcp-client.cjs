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

                // 2. Direct Verification Query
                const verifySql = `
                    WITH orphans AS (
                        SELECT 
                            (SELECT count(*) FROM applications WHERE job_posting_id NOT IN (SELECT id FROM job_postings)) as orphaned_apps,
                            (SELECT count(*) FROM leave_requests WHERE employee_id NOT IN (SELECT id FROM employees)) as orphaned_leaves,
                            (SELECT count(*) FROM employees WHERE tenant_id IS NULL AND role != 'super_admin') as tenantless_employees
                    ),
                    tenant_stats AS (
                        SELECT 
                            t.id as tenant_id,
                            t.name as tenant_name,
                            (SELECT count(*) FROM employees e WHERE e.tenant_id = t.id) as emp_count,
                            (SELECT count(*) FROM job_postings jp JOIN users_profiles up ON jp.created_by = up.id WHERE up.tenant_id = t.id) as job_count
                        FROM tenants t
                        LIMIT 5
                    )
                    SELECT 
                        o.*,
                        (SELECT jsonb_agg(ts) FROM tenant_stats ts) as tenants
                    FROM orphans o;
                `;

                console.log('Running Direct Verification...');

                send(createRequest('tools/call', {
                    name: 'execute_sql',
                    arguments: {
                        query: verifySql,
                        project_id: 'niikshfoecitimepiifo'
                    }
                }));
            } else if (response.id === 1) {
                // Response from query
                console.log('Verification Result:', JSON.stringify(response.result, null, 2));
                process.exit(0);
            }

        } catch (e) {
            console.error('Error parsing line:', line, e);
        }
    }
}

run().catch(console.error);

