Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, data } = await req.json();
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        let result;

        switch (action) {
            case 'CREATE_RULE':
                // Ensure JSON fields are properly stringified if they aren't already
                const triggerData = typeof data.trigger_data === 'object' ? JSON.stringify(data.trigger_data) : data.trigger_data;
                const conditions = typeof data.conditions === 'object' ? JSON.stringify(data.conditions) : data.conditions;
                const actions = typeof data.actions === 'object' ? JSON.stringify(data.actions) : data.actions;

                const createResponse = await fetch(`${supabaseUrl}/rest/v1/automation_rules`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        rule_name: data.rule_name,
                        rule_type: data.rule_type || 'workflow',
                        trigger_event: data.trigger_event || 'manual',
                        trigger_data: triggerData,
                        conditions: conditions,
                        actions: actions,
                        priority: data.priority || 1,
                        created_by: userId,
                        is_active: true,
                        execution_count: 0,
                        success_count: 0,
                        failure_count: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to create automation rule: ${errorText}`);
                }

                result = await createResponse.json();
                break;

            case 'EXECUTE_RULE':
                const executeStartTime = Date.now();
                const ruleResponse = await fetch(`${supabaseUrl}/rest/v1/automation_rules?id=eq.${data.rule_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!ruleResponse.ok) {
                    throw new Error('Rule not found');
                }

                const rules = await ruleResponse.json();
                const rule = rules[0];

                let executionStatus = 'success';
                let executionError = null;

                try {
                    console.log(`Executing rule: ${rule.rule_name}`);

                    // Parse actions if they are strings
                    const actions = typeof rule.actions === 'string' ? JSON.parse(rule.actions) : rule.actions;

                    if (Array.isArray(actions)) {
                        for (const action of actions) {
                            console.log(`Processing action:`, action);

                            let integrationAction = '';
                            let integrationData = {};

                            // Map automation actions to integration actions
                            switch (action.type) {
                                case 'send_email':
                                    integrationAction = 'email_send';
                                    integrationData = {
                                        to: action.config.to, // This needs to be dynamic based on trigger data
                                        subject: action.config.subject,
                                        html: action.config.body,
                                        // If using template
                                        template_id: action.config.template_id,
                                        template_data: action.config.template_data
                                    };

                                    // Dynamic recipient handling
                                    if (action.config.recipient_type === 'applicant') {
                                        // We need to fetch the applicant email from trigger_data
                                        // Assuming trigger_data contains application_id
                                        const triggerDataObj = typeof data.trigger_data === 'string'
                                            ? JSON.parse(data.trigger_data)
                                            : data.trigger_data;

                                        if (triggerDataObj.application_id) {
                                            const { data: app } = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${triggerDataObj.application_id}&select=applicant_email`, {
                                                headers: {
                                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                                    'apikey': serviceRoleKey
                                                }
                                            }).then(r => r.json());

                                            if (app && app[0]) {
                                                integrationData.to = app[0].applicant_email;
                                            }
                                        }
                                    }
                                    break;

                                case 'schedule_interview':
                                    // For now, we might just send an email with a link, or create a Zoom meeting
                                    // Let's assume we create a Zoom meeting link and email it
                                    integrationAction = 'zoom_create_meeting';
                                    integrationData = {
                                        topic: `Interview for ${rule.rule_name}`,
                                        start_time: action.config.start_time, // Needs to be dynamic
                                        duration: 60
                                    };
                                    break;

                                default:
                                    console.warn(`Unknown action type: ${action.type}`);
                                    continue;
                            }

                            if (integrationAction) {
                                console.log(`Calling integration-manager with action: ${integrationAction}`);
                                const integrationResponse = await fetch(`${supabaseUrl}/functions/v1/integration-manager`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${serviceRoleKey}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        action: integrationAction,
                                        ...integrationData
                                    })
                                });

                                if (!integrationResponse.ok) {
                                    const errorText = await integrationResponse.text();
                                    throw new Error(`Integration failed: ${errorText}`);
                                }

                                const integrationResult = await integrationResponse.json();
                                console.log('Integration result:', integrationResult);
                            }
                        }
                    }
                } catch (error) {
                    executionStatus = 'failed';
                    executionError = error.message;
                    console.error('Execution failed:', error);
                }

                const executionDuration = Date.now() - executeStartTime;

                await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        rule_id: data.rule_id,
                        execution_timestamp: new Date().toISOString(),
                        trigger_event: data.trigger_event || rule.trigger_event,
                        trigger_data: JSON.stringify(data.trigger_data || {}),
                        execution_status: executionStatus,
                        execution_duration_ms: executionDuration,
                        error_message: executionError,
                        created_at: new Date().toISOString()
                    })
                });

                await fetch(`${supabaseUrl}/rest/v1/automation_rules?id=eq.${data.rule_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        last_executed_at: new Date().toISOString(),
                        last_execution_status: executionStatus,
                        execution_count: rule.execution_count + 1,
                        success_count: executionStatus === 'success' ? rule.success_count + 1 : rule.success_count,
                        failure_count: executionStatus === 'failed' ? rule.failure_count + 1 : rule.failure_count,
                        updated_at: new Date().toISOString()
                    })
                });

                result = { status: executionStatus, duration_ms: executionDuration };
                break;

            case 'GET_RULES':
                const rulesListResponse = await fetch(`${supabaseUrl}/rest/v1/automation_rules?order=priority.asc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!rulesListResponse.ok) {
                    throw new Error('Failed to fetch rules');
                }

                result = await rulesListResponse.json();
                break;

            case 'TOGGLE_RULE':
                const toggleResponse = await fetch(`${supabaseUrl}/rest/v1/automation_rules?id=eq.${data.rule_id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        is_active: data.is_active,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!toggleResponse.ok) {
                    throw new Error('Failed to toggle rule');
                }

                result = await toggleResponse.json();
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Automation engine error:', error);

        const errorResponse = {
            error: {
                code: 'AUTOMATION_ENGINE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
