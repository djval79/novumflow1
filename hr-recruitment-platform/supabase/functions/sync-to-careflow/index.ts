import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
    employee_id: string;
    tenant_id: string;
    action: 'sync' | 'sync_all';
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { employee_id, tenant_id, action } = await req.json() as SyncRequest

        // Verify the request has proper authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Verify user has access to this tenant
        const { data: membership } = await supabaseClient
            .from('user_tenant_memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('tenant_id', tenant_id)
            .eq('is_active', true)
            .single()

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            throw new Error('Insufficient permissions')
        }

        let syncedCount = 0
        let errors: string[] = []

        if (action === 'sync_all') {
            // Sync all active employees
            const { data: employees, error: fetchError } = await supabaseClient
                .from('employees')
                .select('*')
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')

            if (fetchError) throw fetchError

            for (const employee of employees || []) {
                try {
                    await syncEmployee(supabaseClient, employee, tenant_id)
                    syncedCount++
                } catch (e: any) {
                    errors.push(`${employee.full_name}: ${e.message}`)
                }
            }
        } else {
            // Sync single employee
            const { data: employee, error: fetchError } = await supabaseClient
                .from('employees')
                .select('*')
                .eq('id', employee_id)
                .eq('tenant_id', tenant_id)
                .single()

            if (fetchError) throw fetchError

            await syncEmployee(supabaseClient, employee, tenant_id)
            syncedCount = 1
        }

        return new Response(
            JSON.stringify({
                success: true,
                synced_count: syncedCount,
                errors: errors.length > 0 ? errors : undefined,
                message: `Successfully synced ${syncedCount} employee(s) to CareFlow`
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error: any) {
        console.error('Sync error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})

async function syncEmployee(supabase: any, employee: any, tenantId: string) {
    // Check if employee already exists in CareFlow staff table
    const { data: existing } = await supabase
        .from('careflow_staff')
        .select('id')
        .eq('novumflow_employee_id', employee.id)
        .eq('tenant_id', tenantId)
        .maybeSingle()

    const staffData = {
        tenant_id: tenantId,
        novumflow_employee_id: employee.id,
        full_name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        phone: employee.phone,
        role: mapRole(employee.position),
        status: employee.status === 'active' ? 'Active' : 'Inactive',
        department: employee.department,
        start_date: employee.hire_date,
        // Compliance fields will be synced separately
        updated_at: new Date().toISOString()
    }

    if (existing) {
        // Update existing record
        const { error } = await supabase
            .from('careflow_staff')
            .update(staffData)
            .eq('id', existing.id)

        if (error) throw error
    } else {
        // Insert new record
        const { error } = await supabase
            .from('careflow_staff')
            .insert({
                ...staffData,
                created_at: new Date().toISOString()
            })

        if (error) throw error
    }

    // Sync compliance documents
    await syncCompliance(supabase, employee.id, tenantId)
}

async function syncCompliance(supabase: any, employeeId: string, tenantId: string) {
    // Get compliance records from NovumFlow
    const { data: compliance } = await supabase
        .from('compliance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('tenant_id', tenantId)

    if (!compliance || compliance.length === 0) return

    // Get the CareFlow staff record
    const { data: staff } = await supabase
        .from('careflow_staff')
        .select('id')
        .eq('novumflow_employee_id', employeeId)
        .eq('tenant_id', tenantId)
        .single()

    if (!staff) return

    for (const record of compliance) {
        // Map and upsert compliance records
        const complianceData = {
            staff_id: staff.id,
            tenant_id: tenantId,
            type: mapComplianceType(record.document_type),
            status: record.status,
            issue_date: record.issue_date,
            expiry_date: record.expiry_date,
            document_url: record.document_url,
            verified_by: record.verified_by,
            novumflow_record_id: record.id,
            updated_at: new Date().toISOString()
        }

        const { data: existingCompliance } = await supabase
            .from('careflow_compliance')
            .select('id')
            .eq('novumflow_record_id', record.id)
            .maybeSingle()

        if (existingCompliance) {
            await supabase
                .from('careflow_compliance')
                .update(complianceData)
                .eq('id', existingCompliance.id)
        } else {
            await supabase
                .from('careflow_compliance')
                .insert({ ...complianceData, created_at: new Date().toISOString() })
        }
    }
}

function mapRole(position: string): string {
    const positionLower = position?.toLowerCase() || ''

    if (positionLower.includes('manager') || positionLower.includes('director')) {
        return 'Admin'
    }
    if (positionLower.includes('nurse') || positionLower.includes('carer') || positionLower.includes('support')) {
        return 'Carer'
    }
    return 'Carer' // Default
}

function mapComplianceType(type: string): string {
    const typeMap: Record<string, string> = {
        'right_to_work': 'Right to Work',
        'dbs_check': 'DBS Check',
        'dbs': 'DBS Check',
        'training': 'Training',
        'certificate': 'Certificate',
        'id_verification': 'ID Verification',
    }
    return typeMap[type?.toLowerCase()] || type
}
