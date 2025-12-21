import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ==========================================
// Sync NovumFlow → CareFlow Edge Function
// ==========================================
// Syncs employee and compliance data including:
// - Staff details and roles
// - RTW status (with eVisa enforcement)
// - DBS check status
// - Training records
// - Compliance block status
// ==========================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, accept, dnt, expires, x-requested-with',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Critical dates for Home Office 2024/2025 compliance
const RTW_CRITICAL_DATES = {
    BRP_INVALID_DATE: new Date('2024-10-31'),
    BRP_REJECTION_DATE: new Date('2025-06-01'),
    EVISA_MANDATORY_DATE: new Date('2025-01-01'),
}

interface SyncRequest {
    employee_id: string;
    tenant_id: string;
    action: 'sync' | 'sync_all';
    include_compliance?: boolean;
}

interface SyncResult {
    employee_id: string;
    employee_name: string;
    synced: boolean;
    compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'blocked';
    issues: string[];
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                ...corsHeaders,
                'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') ?? corsHeaders['Access-Control-Allow-Headers'],
            }
        })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { employee_id, tenant_id, action, include_compliance = true } = await req.json() as SyncRequest

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

        let syncResults: SyncResult[] = []
        let syncedCount = 0
        let blockedCount = 0
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
                    const result = await syncEmployee(supabaseClient, employee, tenant_id, include_compliance)
                    syncResults.push(result)
                    if (result.synced) syncedCount++
                    if (result.compliance_status === 'blocked') blockedCount++
                } catch (e: any) {
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
            // Sync single employee
            const { data: employee, error: fetchError } = await supabaseClient
                .from('employees')
                .select('*')
                .eq('id', employee_id)
                .eq('tenant_id', tenant_id)
                .single()

            if (fetchError) throw fetchError

            const result = await syncEmployee(supabaseClient, employee, tenant_id, include_compliance)
            syncResults.push(result)
            if (result.synced) syncedCount = 1
            if (result.compliance_status === 'blocked') blockedCount = 1
        }

        return new Response(
            JSON.stringify({
                success: true,
                synced_count: syncedCount,
                blocked_count: blockedCount,
                total_processed: syncResults.length,
                results: syncResults,
                errors: errors.length > 0 ? errors : undefined,
                message: `Synced ${syncedCount} employee(s) to CareFlow. ${blockedCount > 0 ? `${blockedCount} blocked due to compliance issues.` : ''}`
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

async function syncEmployee(supabase: any, employee: any, tenantId: string, includeCompliance: boolean): Promise<SyncResult> {
    const result: SyncResult = {
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        synced: false,
        compliance_status: 'pending',
        issues: []
    }

    // Check RTW compliance before syncing
    const rtwStatus = await checkRTWCompliance(supabase, employee.id, tenantId)
    if (rtwStatus.blocked) {
        result.compliance_status = 'blocked'
        result.issues.push(...rtwStatus.issues)
    }

    // Check DBS compliance
    const dbsStatus = await checkDBSCompliance(supabase, employee.id, tenantId)
    if (dbsStatus.blocked) {
        result.compliance_status = 'blocked'
        result.issues.push(...dbsStatus.issues)
    }

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
        status: result.compliance_status === 'blocked' ? 'Blocked' : (employee.status === 'active' ? 'Active' : 'Inactive'),
        department: employee.department,
        start_date: employee.hire_date,

        // Compliance status fields
        rtw_status: rtwStatus.status,
        rtw_expiry: rtwStatus.expiry,
        rtw_verification_method: rtwStatus.verificationMethod,
        dbs_status: dbsStatus.status,
        dbs_expiry: dbsStatus.expiry,
        compliance_blocked: result.compliance_status === 'blocked',
        compliance_issues: result.issues.length > 0 ? result.issues : null,

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

    // Sync compliance documents if requested
    if (includeCompliance) {
        await syncCompliance(supabase, employee.id, tenantId)
        await syncRTWRecords(supabase, employee.id, tenantId)
    }

    result.synced = true
    if (result.issues.length === 0) {
        result.compliance_status = 'compliant'
    }

    return result
}

async function checkRTWCompliance(supabase: any, employeeId: string, tenantId: string): Promise<{
    blocked: boolean;
    status: string;
    expiry: string | null;
    verificationMethod: string | null;
    issues: string[];
}> {
    const result = {
        blocked: false,
        status: 'unknown',
        expiry: null as string | null,
        verificationMethod: null as string | null,
        issues: [] as string[]
    }

    // Get latest RTW check
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

    // Check if BRP-based (NO LONGER VALID)
    if (rtwCheck.document_type === 'biometric_residence_permit') {
        if (now >= RTW_CRITICAL_DATES.BRP_INVALID_DATE) {
            result.blocked = true
            result.status = 'invalid'
            result.issues.push('BRP-based RTW check is no longer valid. eVisa verification required.')
        }

        if (now >= RTW_CRITICAL_DATES.BRP_REJECTION_DATE) {
            result.issues.push('CRITICAL: All BRP-based statutory defence has expired.')
        }
    }

    // Check for expiry
    if (rtwCheck.next_check_date) {
        const expiryDate = new Date(rtwCheck.next_check_date)
        result.expiry = rtwCheck.next_check_date

        if (expiryDate < now) {
            result.blocked = true
            result.status = 'expired'
            result.issues.push(`RTW check expired on ${rtwCheck.next_check_date}`)
        } else {
            // Check if expiring within 30 days
            const thirtyDaysFromNow = new Date()
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
            if (expiryDate <= thirtyDaysFromNow) {
                result.issues.push(`RTW check expiring soon: ${rtwCheck.next_check_date}`)
            }
        }
    }

    // Check verification status
    if (rtwCheck.status === 'verified') {
        if (!result.blocked) {
            result.status = 'verified'
        }
    } else if (rtwCheck.status === 'blocked' || rtwCheck.status === 'invalid') {
        result.blocked = true
        result.status = rtwCheck.status
    } else {
        result.status = rtwCheck.status
    }

    result.verificationMethod = rtwCheck.verification_method || 'manual'

    // Require follow-up for 90-day vignettes
    if (rtwCheck.requires_followup && rtwCheck.document_type === 'passport_non_uk') {
        result.issues.push('Follow-up online check required for vignette holder')
    }

    return result
}

async function checkDBSCompliance(supabase: any, employeeId: string, tenantId: string): Promise<{
    blocked: boolean;
    status: string;
    expiry: string | null;
    issues: string[];
}> {
    const result = {
        blocked: false,
        status: 'unknown',
        expiry: null as string | null,
        issues: [] as string[]
    }

    // Get latest DBS check
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

    const now = new Date()

    // Check expiry (typically 3 years for care sector)
    if (dbsCheck.expiry_date) {
        const expiryDate = new Date(dbsCheck.expiry_date)
        result.expiry = dbsCheck.expiry_date

        if (expiryDate < now) {
            result.blocked = true
            result.status = 'expired'
            result.issues.push(`DBS check expired on ${dbsCheck.expiry_date}`)
        }
    }

    // Check status
    if (dbsCheck.status === 'clear' || dbsCheck.status === 'completed') {
        if (!result.blocked) {
            result.status = 'valid'
        }
    } else if (dbsCheck.status === 'pending' || dbsCheck.status === 'in_progress') {
        result.status = 'pending'
        result.issues.push('DBS check in progress')
    } else {
        result.status = dbsCheck.status
        if (dbsCheck.status === 'barred') {
            result.blocked = true
            result.issues.push('CRITICAL: Employee on barred list')
        }
    }

    return result
}

async function syncRTWRecords(supabase: any, employeeId: string, tenantId: string) {
    // Get RTW records from NovumFlow
    const { data: rtwRecords } = await supabase
        .from('right_to_work_checks')
        .select('*')
        .eq('employee_id', employeeId)

    if (!rtwRecords || rtwRecords.length === 0) return

    // Get the CareFlow staff record
    const { data: staff } = await supabase
        .from('careflow_staff')
        .select('id')
        .eq('novumflow_employee_id', employeeId)
        .eq('tenant_id', tenantId)
        .single()

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

            // eVisa-specific fields
            document_type: record.document_type,
            verification_method: record.verification_method,
            share_code_verified: record.share_code_verified,
            requires_followup: record.requires_followup,

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
        'qualification': 'Qualification',
        'professional_registration': 'Professional Registration',
    }
    return typeMap[type?.toLowerCase()] || type
}

