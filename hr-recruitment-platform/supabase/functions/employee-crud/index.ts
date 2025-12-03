// Deno type declarations
declare const Deno: any;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
};

async function generateHmacSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return Array.from(new Uint8Array(signed))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Invalid token');
        }

        const { action, data } = await req.json();

        if (action === 'create') {
            // Fetch tenant_id for the creator
            const { data: profileData, error: profileError } = await supabase
                .from('users_profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            const tenantId = profileData?.tenant_id;

            const { data: newEmployee, error: insertError } = await supabase
                .from('employees')
                .insert({
                    ...data,
                    created_by: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) {
                throw new Error(`Failed to create employee: ${insertError.message}`);
            }

            // Trigger webhook to CareFlow AI for onboarding
            const careflowWebhookSecret = Deno.env.get('CAREFLOW_WEBHOOK_SECRET');
            const careflowSyncEmployeeUrl = Deno.env.get('CAREFLOW_SYNC_EMPLOYEE_URL');

            if (careflowWebhookSecret && careflowSyncEmployeeUrl) {
                const webhookPayload = {
                    action: 'employee.created',
                    employee: newEmployee,
                    tenant_id: tenantId
                };
                const jsonPayload = JSON.stringify(webhookPayload);
                const signature = await generateHmacSignature(jsonPayload, careflowWebhookSecret);

                await fetch(careflowSyncEmployeeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-NovumFlow-Signature': signature,
                    },
                    body: jsonPayload,
                });
            } else {
                console.warn('CareFlow webhook secret or URL not set. Skipping webhook.');
            }

            // Log audit
            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'CREATE_EMPLOYEE',
                entity_type: 'employees',
                entity_id: data.email, // Using email as ID reference since we don't get the ID back easily with simple insert
                timestamp: new Date().toISOString()
            });

            return new Response(
                JSON.stringify({ data: { message: 'Employee created successfully' } }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        } else if (action === 'update') {
            const { employee_id, ...updateData } = data;
            if (!employee_id) {
                throw new Error('Employee ID is required for update action');
            }

            const { error: updateError } = await supabase
                .from('employees')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', employee_id);

            if (updateError) {
                throw new Error(`Failed to update employee: ${updateError.message}`);
            }

            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'UPDATE_EMPLOYEE',
                entity_type: 'employees',
                entity_id: employee_id,
                timestamp: new Date().toISOString()
            });

            return new Response(
                JSON.stringify({ data: { message: 'Employee updated successfully' } }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        } else if (action === 'delete') {
            const { employee_id } = data;
            if (!employee_id) {
                throw new Error('Employee ID is required for delete action');
            }

            const { error: deleteError } = await supabase
                .from('employees')
                .update({ status: 'terminated', updated_at: new Date().toISOString() })
                .eq('id', employee_id);

            if (deleteError) {
                throw new Error(`Failed to delete employee: ${deleteError.message}`);
            }

            // Trigger webhook to CareFlow AI for offboarding
            const careflowWebhookSecret = Deno.env.get('CAREFLOW_WEBHOOK_SECRET');
            const careflowSyncEmployeeUrl = Deno.env.get('CAREFLOW_SYNC_EMPLOYEE_URL');

            if (careflowWebhookSecret && careflowSyncEmployeeUrl) {
                const webhookPayload = {
                    action: 'employee.deleted', // Use 'deleted' action for offboarding
                    employee: { id: employee_id, status: 'terminated' }, // Send minimal data
                    tenant_id: user.id // Placeholder for tenant ID
                };
                const jsonPayload = JSON.stringify(webhookPayload);
                const signature = await generateHmacSignature(jsonPayload, careflowWebhookSecret);

                await fetch(careflowSyncEmployeeUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-NovumFlow-Signature': signature,
                    },
                    body: jsonPayload,
                });
            } else {
                console.warn('CareFlow webhook secret or URL not set. Skipping webhook for offboarding.');
            }

            await supabase.from('audit_logs').insert({
                user_id: user.id,
                action: 'DELETE_EMPLOYEE',
                entity_type: 'employees',
                entity_id: employee_id,
                timestamp: new Date().toISOString()
            });

            return new Response(
                JSON.stringify({ data: { message: 'Employee deleted successfully' } }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        } else {
            throw new Error(`Unknown action: ${action}`);
        }

    } catch (error: any) {
        return new Response(
            JSON.stringify({
                error: {
                    message: error.message
                }
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
