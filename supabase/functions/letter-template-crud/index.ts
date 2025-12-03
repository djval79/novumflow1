Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
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

        const method = req.method;
        const url = new URL(req.url);
        const templateId = url.searchParams.get('id');

        // CREATE Letter Template
        if (method === 'POST') {
            const requestBody = await req.json();

            let templateData;
            if (requestBody.action === 'create' && requestBody.data) {
                templateData = requestBody.data;
            } else if (requestBody.data) {
                templateData = requestBody.data;
            } else {
                templateData = requestBody;
            }

            // Map fields if necessary
            if (templateData.template_type && !templateData.category) {
                templateData.category = templateData.template_type;
            }
            // Remove fields not in schema
            delete templateData.template_type;
            delete templateData.version;

            templateData.created_by = userId;
            templateData.is_active = templateData.is_active !== undefined ? templateData.is_active : true;

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/letter_templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify(templateData),
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to create letter template: ${errorText}`);
            }

            const newTemplate = await insertResponse.json();

            // Log audit trail
            await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    action: 'create',
                    entity_type: 'letter_template',
                    entity_id: newTemplate[0].id,
                    new_values: JSON.stringify(templateData),
                }),
            });

            return new Response(JSON.stringify({ data: newTemplate[0] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // UPDATE Letter Template
        if (method === 'PUT' && templateId) {
            const updateData = await req.json();
            updateData.updated_at = new Date().toISOString();

            if (updateData.template_type && !updateData.category) {
                updateData.category = updateData.template_type;
            }
            delete updateData.template_type;
            delete updateData.version;

            // Get old values
            const oldValuesResponse = await fetch(
                `${supabaseUrl}/rest/v1/letter_templates?id=eq.${templateId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    },
                }
            );
            const oldValues = await oldValuesResponse.json();

            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/letter_templates?id=eq.${templateId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation',
                    },
                    body: JSON.stringify(updateData),
                }
            );

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update letter template: ${errorText}`);
            }

            const updatedTemplate = await updateResponse.json();

            // Log audit trail
            await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    action: 'update',
                    entity_type: 'letter_template',
                    entity_id: templateId,
                    old_values: JSON.stringify(oldValues[0]),
                    new_values: JSON.stringify(updateData),
                }),
            });

            return new Response(JSON.stringify({ data: updatedTemplate[0] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // DELETE Letter Template
        if (method === 'DELETE' && templateId) {
            const templateResponse = await fetch(
                `${supabaseUrl}/rest/v1/letter_templates?id=eq.${templateId}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    },
                }
            );
            const templateData = await templateResponse.json();

            const deleteResponse = await fetch(
                `${supabaseUrl}/rest/v1/letter_templates?id=eq.${templateId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                    },
                }
            );

            if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text();
                throw new Error(`Failed to delete letter template: ${errorText}`);
            }

            // Log audit trail
            await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    action: 'delete',
                    entity_type: 'letter_template',
                    entity_id: templateId,
                    old_values: JSON.stringify(templateData[0]),
                }),
            });

            return new Response(JSON.stringify({ data: { message: 'Letter template deleted successfully' } }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Unsupported method');

    } catch (error) {
        console.error('Letter template CRUD error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'LETTER_TEMPLATE_OPERATION_FAILED',
                message: error.message || 'An error occurred'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
