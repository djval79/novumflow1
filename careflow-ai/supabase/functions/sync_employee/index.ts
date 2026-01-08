import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-novumflow-signature",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json();
        const { action, employee, tenant_id } = payload;

        if (!tenant_id) throw new Error("tenant_id is required");

        const tenantIdStr = String(tenant_id);

        if (action === "employee.created" || action === "employee.updated") {
            if (!employee) throw new Error("employee is required");

            // Map role
            const { data: roleMapping } = await supabaseAdmin
                .from("role_mappings")
                .select("careflow_role")
                .eq("novumflow_role", employee.role)
                .single();

            const mappedRole = roleMapping?.careflow_role || 'Carer';

            const careFlowStaff = {
                tenant_id: tenantIdStr,
                novumflow_employee_id: employee.id,
                full_name: employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
                email: employee.email,
                phone: employee.phone,
                role: mappedRole,
                status: (employee.status === 'Active' || employee.status === 'active') ? 'active' : 'inactive',
                avatar_url: employee.avatar_url,
                updated_at: new Date().toISOString()
            };

            const { data: staffData, error: staffError } = await supabaseAdmin
                .from("careflow_staff")
                .upsert(careFlowStaff, { onConflict: "tenant_id,novumflow_employee_id" })
                .select()
                .single();

            if (staffError) throw staffError;

            return new Response(
                JSON.stringify({ success: true, data: staffData }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: false, error: "Unknown action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Sync error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
