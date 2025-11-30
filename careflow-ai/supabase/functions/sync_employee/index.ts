
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Verify Secret (Basic Security)
        // In production, use a shared secret header or verify JWT from NovumFlow
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }

        // 2. Parse Payload
        const { action, employee, tenant_id } = await req.json();

        if (!action || !employee || !tenant_id) {
            throw new Error("Invalid payload: missing action, employee, or tenant_id");
        }

        console.log(`Received sync request: ${action} for employee ${employee.id} in tenant ${tenant_id}`);

        // 3. Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 4. Handle Actions
        if (action === "employee.created" || action === "employee.updated") {
            // Map NovumFlow data to CareFlow schema
            // Split full name into first and last name
            const nameParts = employee.full_name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            const careFlowEmployee = {
                tenant_id: tenant_id,
                novumflow_employee_id: employee.id,
                first_name: firstName,
                last_name: lastName,
                email: employee.email,
                phone: employee.phone,
                role: mapRole(employee.role), // Helper to map roles
                status: employee.status === 'Active' ? 'active' : 'inactive',
                // Compliance Data
                right_to_work_status: employee.compliance?.right_to_work_status || 'Pending',
                right_to_work_expiry: employee.compliance?.right_to_work_expiry,
                dbs_status: employee.compliance?.dbs_status || 'Pending',
                dbs_expiry: employee.compliance?.dbs_expiry,
                dbs_number: employee.compliance?.dbs_number,
                compliance_data: employee.compliance || {},
                updated_at: new Date().toISOString()
            };

            // Upsert into CareFlow
            const { data, error } = await supabaseAdmin
                .from("employees")
                .upsert(careFlowEmployee, { onConflict: "novumflow_employee_id" })
                .select()
                .single();

            if (error) throw error;

            return new Response(
                JSON.stringify({ success: true, message: "Employee synced", data }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        else if (action === "employee.deleted") {
            // Soft delete or hard delete based on policy
            const { error } = await supabaseAdmin
                .from("employees")
                .update({ status: 'Inactive' })
                .eq("novumflow_employee_id", employee.id);

            if (error) throw error;

            return new Response(
                JSON.stringify({ success: true, message: "Employee deactivated" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: false, message: "Unknown action" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );

    } catch (error) {
        console.error("Sync error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});

// Helper to map NovumFlow roles to CareFlow roles
function mapRole(novumRole: string): string {
    const roleMap: Record<string, string> = {
        'Recruiter': 'Manager',
        'HR Manager': 'Manager',
        'Care Worker': 'Carer',
        'Senior Care Worker': 'Senior Carer',
        'Nurse': 'Nurse',
        'Admin': 'Manager'
    };
    return roleMap[novumRole] || 'Carer'; // Default to Carer
}
