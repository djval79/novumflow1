// Deno type declarations
declare const Deno: any;

// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
};

serve(async (req: Request) => {
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
            const { error: insertError } = await supabase
                .from('employees')
                .insert({
                    ...data,
                    created_by: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (insertError) {
                throw new Error(`Failed to create employee: ${insertError.message}`);
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
