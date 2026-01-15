Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Create test admin user
        const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@hrsuite.com',
                password: 'Admin123!',
                email_confirm: true,
                user_metadata: {
                    full_name: 'System Administrator',
                    role: 'admin'
                }
            })
        });

        let userId;
        if (createUserResponse.ok) {
            const userData = await createUserResponse.json();
            userId = userData.id;

            // Create user profile
            await fetch(`${supabaseUrl}/rest/v1/users_profiles`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    user_id: userId,
                    email: 'admin@hrsuite.com',
                    full_name: 'System Administrator',
                    role: 'admin',
                    is_active: true
                })
            });
        } else {
            // User might already exist, fetch their ID
            const usersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            const users = await usersResponse.json();
            const existingUser = users.users?.find((u: any) => u.email === 'admin@hrsuite.com');
            if (existingUser) {
                userId = existingUser.id;
            }
        }

        // Get some employee IDs for sample data
        const employeesResponse = await fetch(`${supabaseUrl}/rest/v1/employees?select=id&limit=5`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        const employees = await employeesResponse.json();
        const employeeIds = employees.map((e: any) => e.id);

        // Create sample visa records
        if (employeeIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/visa_records`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: employeeIds[0],
                    visa_type: 'Tier 2 (General)',
                    visa_number: 'GBR123456789',
                    issue_date: '2024-01-15',
                    expiry_date: '2026-01-15',
                    issuing_country: 'United Kingdom',
                    current_status: 'active',
                    right_to_work_status: 'full',
                    created_by: userId
                })
            });
        }

        // Create sample DBS certificates
        if (employeeIds.length > 1) {
            await fetch(`${supabaseUrl}/rest/v1/dbs_certificates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: employeeIds[1],
                    certificate_type: 'enhanced',
                    applicant_name: 'John Smith',
                    date_of_birth: '1990-05-15',
                    issue_date: '2024-06-01',
                    status: 'approved',
                    verification_method: 'online_check',
                    document_verified: true,
                    created_by: userId
                })
            });
        }

        // Create sample compliance alerts
        if (employeeIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/compliance_alerts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: employeeIds[0],
                    alert_type: 'visa_expiry',
                    alert_priority: 'high',
                    alert_title: 'Visa Expiring Soon',
                    alert_message: 'Employee visa will expire in 60 days. Please initiate renewal process.',
                    alert_date: new Date().toISOString().split('T')[0],
                    due_date: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
                    days_until_due: 60,
                    status: 'active'
                })
            });
        }

        // Create sample biometric enrollment
        if (employeeIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/biometric_enrollment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: employeeIds[0],
                    biometric_type: 'fingerprint',
                    fingerprint_template_encrypted: 'ENCRYPTED_TEMPLATE_DATA',
                    enrollment_date: new Date().toISOString().split('T')[0],
                    enrollment_status: 'active',
                    quality_score: 95,
                    enrolled_by: userId
                })
            });
        }

        // Create sample automation rule
        await fetch(`${supabaseUrl}/rest/v1/automation_rules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rule_name: 'Visa Expiry Notification',
                rule_type: 'compliance_check',
                trigger_event: 'visa_expiry_approaching',
                trigger_conditions: JSON.stringify({ days_before_expiry: 90 }),
                action_type: 'send_notification',
                action_config: JSON.stringify({ notification_type: 'email', template: 'visa_expiry' }),
                priority: 8,
                is_active: true,
                created_by: userId
            })
        });

        // Create sample RTW check
        if (employeeIds.length > 0) {
            await fetch(`${supabaseUrl}/rest/v1/right_to_work_checks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee_id: employeeIds[0],
                    check_type: 'pre_employment',
                    check_date: '2024-01-10',
                    check_method: 'online_service',
                    check_result: 'pass',
                    right_to_work_confirmed: true,
                    statutory_excuse_obtained: true,
                    checked_by: userId
                })
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Sample data created successfully',
            credentials: {
                email: 'admin@hrsuite.com',
                password: 'Admin123!'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating sample data:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SAMPLE_DATA_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
