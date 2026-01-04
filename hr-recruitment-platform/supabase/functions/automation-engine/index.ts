// Deno type declarations
declare const Deno: any;

Deno.serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control, pragma, expires, x-requested-with',
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

                const { data: profileData } = await fetch(`${supabaseUrl}/rest/v1/users_profiles?id=eq.${userId}&select=tenant_id`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                }).then(res => res.json()).then(data => ({ data: data[0] }));

                const tenantId = profileData?.tenant_id;

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
                        tenant_id: tenantId,
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
                            let integrationData: Record<string, any> = {};

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

                                case 'update_stage':
                                    const triggerDataUpdate = typeof data.trigger_data === 'string'
                                        ? JSON.parse(data.trigger_data)
                                        : data.trigger_data;

                                    if (triggerDataUpdate.application_id && action.config.stage_id) {
                                        console.log(`Updating application ${triggerDataUpdate.application_id} to stage ${action.config.stage_id}`);
                                        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${triggerDataUpdate.application_id}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Authorization': `Bearer ${serviceRoleKey}`,
                                                'apikey': serviceRoleKey,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                current_stage_id: action.config.stage_id,
                                                updated_at: new Date().toISOString()
                                            })
                                        });

                                        if (!updateResponse.ok) {
                                            const errorText = await updateResponse.text();
                                            throw new Error(`Failed to update application stage: ${errorText}`);
                                        }
                                        console.log('Application stage updated successfully');
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
                    executionError = (error as Error).message;
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

            case 'PROCESS_PENDING':
                // Fetch pending logs (hardcoded platform automations that don't have a rule_id)
                const pendingLogsResponse = await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs?execution_status=eq.pending&order=created_at.asc&limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!pendingLogsResponse.ok) {
                    const errorText = await pendingLogsResponse.text();
                    throw new Error(`Failed to fetch pending logs: ${errorText}`);
                }

                const pendingLogs = await pendingLogsResponse.json();
                const processedResults = [];

                console.log(`Processing ${pendingLogs.length} pending automation tasks`);

                for (const logItem of pendingLogs) {
                    const processStartTime = Date.now();
                    let status = 'success';
                    let errorMessage = null;

                    try {
                        const triggerData = typeof logItem.trigger_data === 'string'
                            ? JSON.parse(logItem.trigger_data)
                            : logItem.trigger_data;

                        console.log(`Processing event: ${logItem.trigger_event} for log ${logItem.id}`);

                        switch (logItem.trigger_event) {
                            case 'application_received':
                                // Call integration-manager to send templated email
                                const emailResponse = await fetch(`${supabaseUrl}/functions/v1/integration-manager`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${serviceRoleKey}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        action: 'email_send_template',
                                        template_name: triggerData.template_name || 'application_confirmation',
                                        to: triggerData.candidate_email,
                                        variables: {
                                            applicant_name: triggerData.candidate_name,
                                            job_title: triggerData.job_title,
                                            company_name: triggerData.company_name
                                        },
                                        triggered_by: 'system',
                                        related_entity_type: 'applications',
                                        related_entity_id: triggerData.application_id
                                    })
                                });

                                if (!emailResponse.ok) {
                                    const errorText = await emailResponse.text();
                                    throw new Error(`Email failed: ${errorText}`);
                                }
                                console.log(`Acknowledgement email sent for application ${triggerData.application_id}`);
                                break;

                            case 'interview_reminder':
                                // Call integration-manager to send templated email
                                console.log(`Sending interview reminder for ${triggerData.application_id}`);

                                const reminderEmailResponse = await fetch(`${supabaseUrl}/functions/v1/integration-manager`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${serviceRoleKey}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        action: 'email_send_template',
                                        template_name: 'interview_reminder',
                                        to: triggerData.candidate_email,
                                        variables: {
                                            applicant_name: triggerData.candidate_name,
                                            job_title: triggerData.job_title,
                                            interview_date: triggerData.interview_date,
                                            interview_time: triggerData.interview_time,
                                            company_name: triggerData.company_name || 'Our Company'
                                        },
                                        triggered_by: 'system',
                                        related_entity_type: 'interviews',
                                        related_entity_id: triggerData.interview_id
                                    })
                                });

                                if (!reminderEmailResponse.ok) {
                                    const errorText = await reminderEmailResponse.text();
                                    throw new Error(`Email failed: ${errorText}`);
                                }
                                console.log(`Interview reminder email sent for interview ${triggerData.interview_id}`);
                                break;

                            case 'ai_score_update':
                                // This is triggered after the DB trigger has already moved the stage
                                // Here we handle secondary actions like notifications
                                console.log(`Processing ai_score_update for candidate ${triggerData.applicant_name} (Action: ${triggerData.action_taken})`);

                                if (triggerData.action_taken === 'auto_shortlisted') {
                                    // 1. Notify the recruiter (Internal Slack/Email could go here)
                                    // 2. Fetch job title
                                    const jobRes = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${triggerData.application_id}&select=job_postings(job_title)`, {
                                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                                    });
                                    const jobData = (await jobRes.json())?.[0];
                                    const jobTitle = jobData?.job_postings?.job_title || 'Unknown Position';

                                    // Send notification to the tenant-specific recruiter email
                                    await fetch(`${supabaseUrl}/functions/v1/integration-manager`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            action: 'email_send',
                                            to: triggerData.recruiter_email || Deno.env.get('RECRUITER_NOTIFICATION_EMAIL') || 'admin@example.com',
                                            subject: `🚀 High Matching Candidate: ${triggerData.applicant_name}`,
                                            html: `
                                                <p>Great news! A new candidate has been automatically shortlisted for the <strong>${jobTitle}</strong> role.</p>
                                                <p><strong>Candidate:</strong> ${triggerData.applicant_name}</p>
                                                <p><strong>AI Score:</strong> ${triggerData.ai_score}%</p>
                                                <p><strong>AI Summary:</strong> ${triggerData.ai_summary}</p>
                                                <p><a href="${Deno.env.get('PLATFORM_URL') || 'https://novumflow.app'}/recruitment?id=${triggerData.application_id}">View Application</a></p>
                                            `
                                        })
                                    });
                                } else if (triggerData.action_taken === 'auto_rejected') {
                                    // Send rejection email to candidate
                                    await fetch(`${supabaseUrl}/functions/v1/integration-manager`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            action: 'email_send_template',
                                            template_name: 'rejection_letter', // Aligned with DB
                                            to: triggerData.applicant_email,
                                            variables: {
                                                applicant_name: triggerData.applicant_name,
                                                role_title: triggerData.job_title || 'the position',
                                                company_name: triggerData.tenant_name || 'NovumFlow Recruitment'
                                            }
                                        })
                                    });
                                }
                                break;

                            case 'stage_change':
                                // Handle automations defined in workflow_stages -> stage_automations
                                // The rule_id field in logItem contains the stage_automation.id
                                if (logItem.rule_id) {
                                    const autoRes = await fetch(`${supabaseUrl}/rest/v1/stage_automations?id=eq.${logItem.rule_id}`, {
                                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                                    });
                                    const autoData = (await autoRes.json())?.[0];

                                    if (autoData && autoData.is_active) {
                                        console.log(`Executing stage automation: ${autoData.name} (${autoData.action_type})`);

                                        if (autoData.action_type === 'send_email') {
                                            const config = autoData.action_config;
                                            let recipientEmail = config.to;

                                            // Resolve recipient if dynamic
                                            if (config.recipient_type === 'applicant' && triggerData.application_id) {
                                                const appRes = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${triggerData.application_id}&select=applicant_email`, {
                                                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                                                });
                                                const app = (await appRes.json())?.[0];
                                                recipientEmail = app?.applicant_email;
                                            }

                                            if (recipientEmail) {
                                                await fetch(`${supabaseUrl}/functions/v1/integration-manager`, {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        action: config.template_id ? 'email_send_template' : 'email_send',
                                                        to: recipientEmail,
                                                        subject: config.subject,
                                                        html: config.body,
                                                        template_name: config.template_name,
                                                        variables: {
                                                            applicant_name: triggerData.applicant_name,
                                                            ...config.variables
                                                        }
                                                    })
                                                });
                                            }
                                        }
                                    }
                                }
                                break;


                            default:
                                console.warn(`Unhandled trigger event: ${logItem.trigger_event}`);
                                status = 'skipped';
                        }
                    } catch (err) {
                        status = 'failed';
                        errorMessage = (err as Error).message;
                        console.error(`Failed to process log ${logItem.id}:`, err);
                    }

                    // Update log status
                    await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs?id=eq.${logItem.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            execution_status: status,
                            error_message: errorMessage,
                            execution_duration_ms: Date.now() - processStartTime,
                            execution_timestamp: new Date().toISOString()
                        })
                    });

                    processedResults.push({ id: logItem.id, status });
                }

                result = { processed_count: processedResults.length, details: processedResults };
                break;

            case 'CHECK_REMINDERS':
                // 1. Get settings
                const settingsRes = await fetch(`${supabaseUrl}/rest/v1/recruitment_settings?select=auto_schedule_reminders`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                const settings = await settingsRes.json();

                if (!settings?.[0]?.auto_schedule_reminders) {
                    result = { message: 'Auto reminders disabled' };
                    break;
                }

                // 2. Find interviews in the next 24 hours
                const now = new Date();
                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                const interviewsRes = await fetch(`${supabaseUrl}/rest/v1/interviews?scheduled_date=eq.${tomorrowStr}&status=eq.Scheduled`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                const interviews = await interviewsRes.json();

                const remindersScheduled = [];

                for (const interview of interviews) {
                    // Check if already scheduled
                    const checkLogRes = await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs?trigger_event=eq.interview_reminder&trigger_data->>interview_id=eq.${interview.id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey
                        }
                    });
                    const existingLogs = await checkLogRes.json();

                    if (existingLogs.length === 0) {
                        // Get application info for email
                        const appRes = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${interview.application_id}&select=*,job_postings(job_title)`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        });
                        const app = (await appRes.json())?.[0];

                        if (app) {
                            // Insert pending log
                            await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    trigger_event: 'interview_reminder',
                                    execution_status: 'pending',
                                    trigger_data: {
                                        interview_id: interview.id,
                                        application_id: app.id,
                                        candidate_name: `${app.applicant_first_name} ${app.applicant_last_name}`,
                                        candidate_email: app.applicant_email,
                                        job_title: app.job_postings?.job_title,
                                        interview_date: interview.scheduled_date,
                                        interview_time: interview.scheduled_time
                                    }
                                })
                            });
                            remindersScheduled.push(interview.id);
                        }
                    }
                }

                result = { scheduled_count: remindersScheduled.length };
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

            case 'GET_LOGS':
                // Fetch recent logs associated with rules or system events
                const logsLimit = data.limit || 20;
                const logsResponse = await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs?order=created_at.desc&limit=${logsLimit}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!logsResponse.ok) {
                    throw new Error('Failed to fetch logs');
                }

                result = await logsResponse.json();
                break;

            case 'CHECK_COMPLIANCE':
                // 1. Get alerting days from data or default to 30
                const alertDays = data.notify_on_expiry_days || 30;
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() + alertDays);
                const dateLimitStr = dateLimit.toISOString().split('T')[0];

                // 2. Check RTW
                const rtwRes = await fetch(`${supabaseUrl}/rest/v1/right_to_work_checks?next_check_date=lte.${dateLimitStr}&status=neq.expired&status=neq.blocked`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                });
                const rtwChecks = await rtwRes.json();

                // 3. Process RTW and create logs
                for (const check of rtwChecks) {
                    await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            trigger_event: 'rtw_expiry_warning',
                            execution_status: 'pending',
                            tenant_id: check.tenant_id,
                            trigger_data: {
                                rtw_check_id: check.id,
                                employee_id: check.employee_id,
                                staff_name: check.staff_name,
                                expiry_date: check.next_check_date,
                                document_type: check.document_type
                            }
                        })
                    });
                }

                // 4. Check general documents (DBS, Training, etc.)
                const docsRes = await fetch(`${supabaseUrl}/rest/v1/documents?expiry_date=lte.${dateLimitStr}&is_current_version=eq.true&verification_status=eq.verified`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                });
                const documents = await docsRes.json();

                for (const doc of documents) {
                    // Get employee name if possible (this might need a join or separate fetch if not in the doc record)
                    // Assuming for now the doc has employee info or we just use doc info
                    await fetch(`${supabaseUrl}/rest/v1/automation_execution_logs`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            trigger_event: 'document_expiry_warning',
                            execution_status: 'pending',
                            tenant_id: doc.tenant_id,
                            trigger_data: {
                                document_id: doc.id,
                                employee_id: doc.employee_id,
                                document_name: doc.document_name,
                                document_type: doc.document_type,
                                expiry_date: doc.expiry_date
                            }
                        })
                    });
                }

                result = {
                    rtw_alerts_created: rtwChecks.length,
                    doc_alerts_created: documents.length
                };
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
                message: (error as Error).message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
