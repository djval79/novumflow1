import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface SyncRequest {
    employee_id?: string;
    tenant_id: string;
    action: 'sync' | 'verify' | 're-sync';
    include_compliance?: boolean;
}

interface SyncResult {
    employee_id: string;
    employee_name: string;
    synced: boolean;
    compliance_status: 'compliant' | 'non_compliant' | 'blocked' | 'pending';
    issues: string[];
}

const RTW_CRITICAL_DATES = {
    BRP_INVALID_DATE: new Date('2024-12-31'),
    BRP_REJECTION_DATE: new Date('2025-01-01'),
};

async function runWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return runWithRetry(fn, retries - 1, delay * 2);
    }
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: corsHeaders
        })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json() as SyncRequest
        const { employee_id, tenant_id, action, include_compliance = true } = body

        // Verify authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const token = authHeader.replace('Bearer ', '')
        const isServiceRole = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!isServiceRole) {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
            if (authError || !user) throw new Error('Unauthorized')

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
        }

        // Fetch tenant settings for multi-region support
        const { data: tenant } = await supabaseClient
            .from('tenants')
            .select('careflow_endpoint_url, careflow_endpoint_key')
            .eq('id', tenant_id)
            .single()

        const targetClient = tenant?.careflow_endpoint_url
            ? createClient(tenant.careflow_endpoint_url, tenant.careflow_endpoint_key ?? '')
            : supabaseClient

        // 1. Initialise Sync Log Entry
        const { data: syncLog, error: logError } = await supabaseClient
            .from('sync_logs')
            .insert({
                tenant_id,
                employee_id: employee_id,
                action,
                status: 'pending',
                metadata: {
                    include_compliance,
                    is_multi_region: !!tenant?.careflow_endpoint_url,
                    target_url: tenant?.careflow_endpoint_url || 'local'
                }
            })
            .select()
            .single()

        if (logError) console.error('Failed to create sync log:', logError)

        const syncResults: SyncResult[] = []
        const errors: string[] = []
        let syncedCount = 0
        let blockedCount = 0

        if (!employee_id) {
            // Bulk sync
            const { data: employees } = await supabaseClient
                .from('employees')
                .select('*')
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')

            for (const employee of employees || []) {
                try {
                    const result = await runWithRetry(() => syncSingleEmployee(supabaseClient, targetClient, employee, tenant_id, include_compliance));
                    syncResults.push(result)
                    if (result.synced) syncedCount++
                    if (result.compliance_status === 'blocked') blockedCount++
                } catch (err: any) {
                    const e = err as Error
                    errors.push(`${employee.first_name} ${employee.last_name}: ${e.message}`)
                    syncResults.push({
                        employee_id: employee.id,
                        employee_name: `${employee.first_name} ${employee.last_name}`,
                        synced: false,
                        compliance_status: 'non_compliant',
                        issues: [e.message]
                    })
                }
            }
        } else {
            // Single sync
            const { data: employee, error: fetchError } = await supabaseClient
                .from('employees')
                .select('*')
                .eq('id', employee_id)
                .eq('tenant_id', tenant_id)
                .single()

            if (fetchError) throw fetchError

            try {
                const result = await runWithRetry(() => syncSingleEmployee(supabaseClient, targetClient, employee, tenant_id, include_compliance));
                syncResults.push(result)
                if (result.synced) syncedCount = 1
                if (result.compliance_status === 'blocked') blockedCount = 1
            } catch (err: any) {
                const e = err as Error
                errors.push(e.message)
                syncResults.push({
                    employee_id,
                    employee_name: 'Unknown',
                    synced: false,
                    compliance_status: 'non_compliant',
                    issues: [e.message]
                })
            }
        }

        // 2. Finalise Sync Log
        if (syncLog) {
            await supabaseClient
                .from('sync_logs')
                .update({
                    status: errors.length === 0 ? 'success' : 'failed',
                    last_error: errors.length > 0 ? errors.join(', ') : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', syncLog.id)
        }

        return new Response(
            JSON.stringify({
                success: errors.length === 0,
                synced_count: syncedCount,
                blocked_count: blockedCount,
                total_processed: syncResults.length,
                results: syncResults,
                errors: errors.length > 0 ? errors : undefined,
                message: `Synced ${syncedCount} employee(s) to CareFlow. ${blockedCount > 0 ? `${blockedCount} blocked due to compliance issues.` : ''}`
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: errors.length === 0 ? 200 : 207
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

async function syncSingleEmployee(localSupabase: any, targetSupabase: any, employee: any, tenantId: string, includeCompliance: boolean): Promise<SyncResult> {
    const result: SyncResult = {
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        synced: false,
        compliance_status: 'pending',
        issues: []
    }

    const rtwStatus = await checkRTWCompliance(localSupabase, employee.id, tenantId)
    if (rtwStatus.blocked) {
        result.compliance_status = 'blocked'
        result.issues.push(...rtwStatus.issues)
    }

    const dbsStatus = await checkDBSCompliance(localSupabase, employee.id, tenantId)
    if (dbsStatus.blocked) {
        result.compliance_status = 'blocked'
        result.issues.push(...dbsStatus.issues)
    }

    const { data: existing } = await targetSupabase
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
        status: result.compliance_status === 'blocked' ? 'Blocked' : (employee.status === 'active' ? 'Active' : 'Inactive'),
        department: employee.department,
        start_date: employee.hire_date,
        rtw_status: rtwStatus.status,
        rtw_expiry: rtwStatus.expiry,
        dbs_status: dbsStatus.status,
        dbs_expiry: dbsStatus.expiry,
        compliance_blocked: result.compliance_status === 'blocked',
        compliance_issues: result.issues.length > 0 ? result.issues : null,
        updated_at: new Date().toISOString()
    }

    if (existing) {
        const { error } = await targetSupabase
            .from('careflow_staff')
            .update(staffData)
            .eq('id', existing.id)
        if (error) throw error
    } else {
        const { error } = await targetSupabase
            .from('careflow_staff')
            .insert({ ...staffData, created_at: new Date().toISOString() })
        if (error) throw error
    }

    if (includeCompliance) {
        await syncCompliance(localSupabase, targetSupabase, employee.id, tenantId)
        await syncRTWRecords(localSupabase, targetSupabase, employee.id, tenantId)
    }

    result.synced = true
    if (result.issues.length === 0) {
        result.compliance_status = 'compliant'
    }

    return result
}

async function checkRTWCompliance(supabase: any, employeeId: string, tenantId: string) {
    const result = {
        blocked: false,
        status: 'unknown',
        expiry: null as string | null,
        verificationMethod: null as string | null,
        issues: [] as string[]
    }

    const { data: rtwCheck } = await supabase
        .from('right_to_work_checks')
        .select('*')
        .eq('employee_id', employeeId)
        .order('check_date', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!rtwCheck) {
        result.status = 'missing'
        result.issues.push('No Right to Work check on record')
        result.blocked = true
        return result
    }

    const now = new Date()
    if (rtwCheck.document_type === 'biometric_residence_permit' && now >= RTW_CRITICAL_DATES.BRP_INVALID_DATE) {
        result.blocked = true
        result.status = 'invalid'
        result.issues.push('BRP-based RTW check is no longer valid. eVisa verification required.')
    }

    if (rtwCheck.next_check_date) {
        const expiryDate = new Date(rtwCheck.next_check_date)
        result.expiry = rtwCheck.next_check_date
        if (expiryDate < now) {
            result.blocked = true
            result.status = 'expired'
            result.issues.push(`RTW check expired on ${rtwCheck.next_check_date}`)
        }
    }

    if (rtwCheck.status === 'verified') {
        if (!result.blocked) result.status = 'verified'
    } else if (rtwCheck.status === 'blocked' || rtwCheck.status === 'invalid') {
        result.blocked = true
        result.status = rtwCheck.status
    } else {
        result.status = rtwCheck.status
    }

    result.verificationMethod = rtwCheck.verification_method || 'manual'
    return result
}

async function checkDBSCompliance(supabase: any, employeeId: string, tenantId: string) {
    const result = {
        blocked: false,
        status: 'unknown',
        expiry: null as string | null,
        issues: [] as string[]
    }

    const { data: dbsCheck } = await supabase
        .from('dbs_checks')
        .select('*')
        .eq('employee_id', employeeId)
        .order('application_date', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!dbsCheck) {
        result.status = 'missing'
        result.issues.push('No DBS check on record')
        result.blocked = true
        return result
    }

    if (dbsCheck.expiry_date) {
        const expiryDate = new Date(dbsCheck.expiry_date)
        result.expiry = dbsCheck.expiry_date
        if (expiryDate < new Date()) {
            result.blocked = true
            result.status = 'expired'
            result.issues.push(`DBS check expired on ${dbsCheck.expiry_date}`)
        }
    }

    if (dbsCheck.status === 'clear' || dbsCheck.status === 'completed') {
        if (!result.blocked) result.status = 'valid'
    } else if (dbsCheck.status === 'barred') {
        result.blocked = true
        result.issues.push('CRITICAL: Employee on barred list')
    } else {
        result.status = dbsCheck.status
    }

    return result
}

async function syncRTWRecords(localSupabase: any, targetSupabase: any, employeeId: string, tenantId: string) {
    const { data: rtwRecords } = await localSupabase.from('right_to_work_checks').select('*').eq('employee_id', employeeId)
    if (!rtwRecords || rtwRecords.length === 0) return

    const { data: staff } = await targetSupabase.from('careflow_staff').select('id').eq('novumflow_employee_id', employeeId).eq('tenant_id', tenantId).single()
    if (!staff) return

    for (const record of rtwRecords) {
        const complianceData = {
            staff_id: staff.id,
            tenant_id: tenantId,
            type: 'Right to Work',
            status: record.status,
            issue_date: record.check_date,
            expiry_date: record.next_check_date,
            document_url: record.document_url,
            document_type: record.document_type,
            verification_method: record.verification_method,
            share_code_verified: record.share_code_verified,
            requires_followup: record.requires_followup,
            novumflow_record_id: record.id,
            updated_at: new Date().toISOString()
        }

        const { data: existing } = await targetSupabase.from('careflow_compliance').select('id').eq('novumflow_record_id', record.id).maybeSingle()
        if (existing) {
            await targetSupabase.from('careflow_compliance').update(complianceData).eq('id', existing.id)
        } else {
            await targetSupabase.from('careflow_compliance').insert({ ...complianceData, created_at: new Date().toISOString() })
        }
    }
}

async function syncCompliance(localSupabase: any, targetSupabase: any, employeeId: string, tenantId: string) {
    const { data: compliance } = await localSupabase.from('compliance_records').select('*').eq('employee_id', employeeId).eq('tenant_id', tenantId)
    if (!compliance || compliance.length === 0) return

    const { data: staff } = await targetSupabase.from('careflow_staff').select('id').eq('novumflow_employee_id', employeeId).eq('tenant_id', tenantId).single()
    if (!staff) return

    for (const record of compliance) {
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

        const { data: existing } = await targetSupabase.from('careflow_compliance').select('id').eq('novumflow_record_id', record.id).maybeSingle()
        if (existing) {
            await targetSupabase.from('careflow_compliance').update(complianceData).eq('id', existing.id)
        } else {
            await targetSupabase.from('careflow_compliance').insert({ ...complianceData, created_at: new Date().toISOString() })
        }
    }
}

function mapRole(position: string): string {
    const pos = position?.toLowerCase() || ''
    if (pos.includes('manager')) return 'Admin'
    return 'Carer'
}

function mapComplianceType(type: string): string {
    const map: Record<string, string> = {
        'right_to_work': 'Right to Work',
        'dbs_check': 'DBS Check',
        'training': 'Training',
    }
    return map[type?.toLowerCase()] || type
}
