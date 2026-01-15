/**
 * Monthly Compliance Report - Supabase Edge Function
 * 
 * This function generates and sends monthly compliance reports via email.
 * It is designed to be triggered by a cron job (pg_cron) on the 1st of each month.
 * 
 * Reports include:
 * - CQC Readiness Summary
 * - Home Office RTW Status
 * - DBS Expiry Tracking
 * - Training Compliance Matrix
 * - Critical Action Items
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with, pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ComplianceMetrics {
    totalStaff: number;
    compliantStaff: number;
    complianceRate: number;
    dbsValid: number;
    dbsExpiring: number;
    dbsExpired: number;
    rtwValid: number;
    rtwExpiring: number;
    rtwExpired: number;
    trainingComplete: number;
    trainingOverdue: number;
    cqcReady: boolean;
}

interface ExpiringItem {
    type: string;
    staffName: string;
    itemName: string;
    expiryDate: string;
    daysUntilExpiry: number;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Parse request body (optional - can specify tenant_id or send to all)
        let targetTenantId: string | null = null
        let forceEmail = false

        try {
            const body = await req.json()
            targetTenantId = body.tenant_id || null
            forceEmail = body.force_email || false
        } catch {
            // No body - process all tenants
        }

        // Get all tenants (or specific one)
        let tenantsQuery = supabase.from('tenants').select('id, name, settings')
        if (targetTenantId) {
            tenantsQuery = tenantsQuery.eq('id', targetTenantId)
        }

        const { data: tenants, error: tenantsError } = await tenantsQuery
        if (tenantsError) throw tenantsError

        const reports: any[] = []

        for (const tenant of tenants || []) {
            // Check if tenant has email notifications enabled
            const notificationsEnabled = tenant.settings?.compliance_email_notifications !== false
            if (!notificationsEnabled && !forceEmail) continue

            // Get admin users for this tenant
            const { data: admins } = await supabase
                .from('users_profiles')
                .select('user_id, full_name, email')
                .eq('tenant_id', tenant.id)
                .in('role', ['admin', 'hr_manager', 'compliance_officer'])

            if (!admins || admins.length === 0) continue

            // Generate compliance report for this tenant
            const metrics = await generateComplianceMetrics(supabase, tenant.id)
            const expiringItems = await getExpiringItems(supabase, tenant.id)

            // Generate HTML report
            const htmlReport = generateHTMLReport(tenant.name, metrics, expiringItems)

            // Send email to each admin (if Resend API key is configured)
            if (resendApiKey) {
                for (const admin of admins) {
                    if (!admin.email) continue

                    await sendEmail(resendApiKey, {
                        to: admin.email,
                        subject: `Monthly Compliance Report - ${tenant.name} - ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
                        html: htmlReport
                    })
                }
            }

            reports.push({
                tenant_id: tenant.id,
                tenant_name: tenant.name,
                metrics,
                expiring_items_count: expiringItems.length,
                admins_notified: admins.length,
                email_sent: !!resendApiKey
            })

            // Log the report in audit trail
            await supabase.from('audit_logs').insert({
                tenant_id: tenant.id,
                action: 'compliance_report_generated',
                entity_type: 'compliance',
                entity_id: 'monthly_report',
                details: JSON.stringify({
                    month: new Date().toISOString().slice(0, 7),
                    metrics,
                    admins_notified: admins.length
                })
            })
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Generated ${reports.length} compliance reports`,
                reports
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error generating compliance report:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function generateComplianceMetrics(supabase: any, tenantId: string): Promise<ComplianceMetrics> {
    // Get staff compliance status
    const { data: complianceData } = await supabase
        .from('staff_compliance_status')
        .select('*')
        .eq('tenant_id', tenantId)

    const staffData = complianceData || []
    const total = staffData.length
    const compliant = staffData.filter((s: any) => s.cqc_ready).length
    const dbsOk = staffData.filter((s: any) => s.dbs_status === 'compliant').length
    const dbsExp = staffData.filter((s: any) => s.dbs_status === 'expiring_soon').length
    const dbsExpired = staffData.filter((s: any) => s.dbs_status === 'expired' || s.dbs_status === 'missing').length
    const rtwOk = staffData.filter((s: any) => s.rtw_status === 'compliant').length
    const rtwExp = staffData.filter((s: any) => s.rtw_status === 'expiring_soon').length
    const rtwExpired = staffData.filter((s: any) => s.rtw_status === 'expired' || s.rtw_status === 'missing').length
    const trainingOk = staffData.filter((s: any) => s.training_status === 'compliant').length
    const trainingOverdue = staffData.filter((s: any) => s.training_status === 'overdue' || s.training_status === 'missing').length

    return {
        totalStaff: total,
        compliantStaff: compliant,
        complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 100,
        dbsValid: dbsOk,
        dbsExpiring: dbsExp,
        dbsExpired: dbsExpired,
        rtwValid: rtwOk,
        rtwExpiring: rtwExp,
        rtwExpired: rtwExpired,
        trainingComplete: trainingOk,
        trainingOverdue: trainingOverdue,
        cqcReady: dbsExpired === 0 && rtwExpired === 0
    }
}

async function getExpiringItems(supabase: any, tenantId: string): Promise<ExpiringItem[]> {
    const items: ExpiringItem[] = []
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
    const today = new Date().toISOString().split('T')[0]
    const futureDate = ninetyDaysFromNow.toISOString().split('T')[0]

    // Get expiring DBS
    const { data: expiringDBS } = await supabase
        .from('dbs_checks')
        .select('applicant_name, expiry_date')
        .eq('tenant_id', tenantId)
        .lte('expiry_date', futureDate)
        .gte('expiry_date', today)
        .order('expiry_date')

    expiringDBS?.forEach((item: any) => {
        const days = Math.round((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        items.push({
            type: 'DBS',
            staffName: item.applicant_name,
            itemName: 'DBS Certificate',
            expiryDate: item.expiry_date,
            daysUntilExpiry: days
        })
    })

    // Get expiring RTW
    const { data: expiringRTW } = await supabase
        .from('right_to_work_checks')
        .select('staff_name, next_check_date')
        .eq('tenant_id', tenantId)
        .not('next_check_date', 'is', null)
        .lte('next_check_date', futureDate)
        .gte('next_check_date', today)
        .order('next_check_date')

    expiringRTW?.forEach((item: any) => {
        const days = Math.round((new Date(item.next_check_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        items.push({
            type: 'RTW',
            staffName: item.staff_name,
            itemName: 'Right to Work',
            expiryDate: item.next_check_date,
            daysUntilExpiry: days
        })
    })

    // Get expiring training (30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const thirtyDate = thirtyDaysFromNow.toISOString().split('T')[0]

    const { data: expiringTraining } = await supabase
        .from('training_records')
        .select('staff_name, training_name, expiry_date')
        .eq('tenant_id', tenantId)
        .eq('is_mandatory', true)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDate)
        .gte('expiry_date', today)
        .order('expiry_date')

    expiringTraining?.forEach((item: any) => {
        const days = Math.round((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        items.push({
            type: 'Training',
            staffName: item.staff_name || 'Unknown',
            itemName: item.training_name,
            expiryDate: item.expiry_date,
            daysUntilExpiry: days
        })
    })

    return items.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

function generateHTMLReport(tenantName: string, metrics: ComplianceMetrics, expiringItems: ExpiringItem[]): string {
    const statusColor = metrics.cqcReady ? '#10B981' : '#EF4444'
    const statusText = metrics.cqcReady ? 'CQC Ready ✓' : 'Action Required ⚠️'
    const reportDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Compliance Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            margin: 0;
            padding: 0;
            background-color: #F3F4F6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
        }
        .header {
            background: linear-gradient(135deg, #0891B2 0%, #0E7490 100%);
            color: white;
            padding: 32px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0;
            opacity: 0.9;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 24px;
            font-weight: 600;
            margin-top: 16px;
        }
        .content {
            padding: 32px;
        }
        .score-section {
            text-align: center;
            padding: 24px;
            background-color: #F9FAFB;
            border-radius: 12px;
            margin-bottom: 24px;
        }
        .score {
            font-size: 48px;
            font-weight: 700;
            color: ${statusColor};
        }
        .score-label {
            color: #6B7280;
            font-size: 14px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        .metric-card {
            background-color: #F9FAFB;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #1F2937;
        }
        .metric-label {
            font-size: 12px;
            color: #6B7280;
            margin-top: 4px;
        }
        .alert-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
        }
        .alert-warning {
            background-color: #FEF3C7;
            color: #92400E;
        }
        .alert-danger {
            background-color: #FEE2E2;
            color: #991B1B;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1F2937;
            margin: 24px 0 16px;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 8px;
        }
        .expiry-list {
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
        }
        .expiry-item {
            padding: 12px 16px;
            border-bottom: 1px solid #E5E7EB;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .expiry-item:last-child {
            border-bottom: none;
        }
        .expiry-item.critical {
            background-color: #FEF2F2;
        }
        .expiry-item.warning {
            background-color: #FFFBEB;
        }
        .expiry-type {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            color: #6B7280;
            padding: 2px 6px;
            background-color: #E5E7EB;
            border-radius: 4px;
        }
        .expiry-staff {
            font-weight: 500;
            color: #1F2937;
        }
        .expiry-detail {
            font-size: 12px;
            color: #6B7280;
        }
        .expiry-days {
            font-weight: 600;
            text-align: right;
        }
        .expiry-days.critical {
            color: #DC2626;
        }
        .expiry-days.warning {
            color: #D97706;
        }
        .footer {
            background-color: #F9FAFB;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
        }
        .footer a {
            color: #0891B2;
            text-decoration: none;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0891B2 0%, #0E7490 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 16px;
        }
        .regulatory-notice {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 16px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        .regulatory-notice h4 {
            margin: 0 0 8px;
            color: #92400E;
            font-size: 14px;
        }
        .regulatory-notice p {
            margin: 0;
            font-size: 13px;
            color: #78350F;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Monthly Compliance Report</h1>
            <p>${tenantName}</p>
            <p style="font-size: 12px; opacity: 0.8;">${reportDate}</p>
            <div class="status-badge" style="background-color: ${statusColor};">${statusText}</div>
        </div>
        
        <div class="content">
            <div class="score-section">
                <div class="score">${metrics.complianceRate}%</div>
                <div class="score-label">Overall Compliance Rate</div>
                <p style="margin: 8px 0 0; font-size: 14px; color: #6B7280;">
                    ${metrics.compliantStaff} of ${metrics.totalStaff} staff fully compliant
                </p>
            </div>

            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${metrics.dbsValid}</div>
                    <div class="metric-label">Valid DBS</div>
                    ${metrics.dbsExpiring > 0 ? `<span class="alert-tag alert-warning">${metrics.dbsExpiring} expiring</span>` : ''}
                    ${metrics.dbsExpired > 0 ? `<span class="alert-tag alert-danger">${metrics.dbsExpired} expired</span>` : ''}
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.rtwValid}</div>
                    <div class="metric-label">RTW Verified</div>
                    ${metrics.rtwExpiring > 0 ? `<span class="alert-tag alert-warning">${metrics.rtwExpiring} expiring</span>` : ''}
                    ${metrics.rtwExpired > 0 ? `<span class="alert-tag alert-danger">${metrics.rtwExpired} expired</span>` : ''}
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.trainingComplete}</div>
                    <div class="metric-label">Training Complete</div>
                    ${metrics.trainingOverdue > 0 ? `<span class="alert-tag alert-danger">${metrics.trainingOverdue} overdue</span>` : ''}
                </div>
            </div>

            ${!metrics.cqcReady ? `
            <div class="regulatory-notice">
                <h4>⚠️ CQC Inspection Risk</h4>
                <p>Your organisation has ${metrics.dbsExpired + metrics.rtwExpired} critical compliance issues that could result in regulatory action during a CQC inspection. Please address these immediately.</p>
            </div>
            ` : ''}

            ${expiringItems.length > 0 ? `
            <h3 class="section-title">📅 Upcoming Expiries</h3>
            <div class="expiry-list">
                ${expiringItems.slice(0, 10).map(item => {
        const isCritical = item.daysUntilExpiry <= 14
        const isWarning = item.daysUntilExpiry <= 30 && !isCritical
        return `
                    <div class="expiry-item ${isCritical ? 'critical' : isWarning ? 'warning' : ''}">
                        <div>
                            <span class="expiry-type">${item.type}</span>
                            <div class="expiry-staff">${item.staffName}</div>
                            <div class="expiry-detail">${item.itemName}</div>
                        </div>
                        <div class="expiry-days ${isCritical ? 'critical' : isWarning ? 'warning' : ''}">
                            ${item.daysUntilExpiry === 0 ? 'Today!' :
                item.daysUntilExpiry === 1 ? 'Tomorrow' :
                    `${item.daysUntilExpiry} days`}
                        </div>
                    </div>
                    `
    }).join('')}
            </div>
            ${expiringItems.length > 10 ? `<p style="text-align: center; color: #6B7280; font-size: 12px; margin-top: 8px;">+ ${expiringItems.length - 10} more items</p>` : ''}
            ` : `
            <div style="text-align: center; padding: 24px; background-color: #ECFDF5; border-radius: 8px;">
                <span style="font-size: 32px;">✅</span>
                <p style="color: #065F46; font-weight: 600; margin: 8px 0 0;">All Clear!</p>
                <p style="color: #047857; font-size: 14px; margin: 4px 0 0;">No upcoming expiries in the next 30 days</p>
            </div>
            `}

            <div class="regulatory-notice" style="background-color: #EFF6FF; border-color: #3B82F6;">
                <h4 style="color: #1E40AF;">📢 2024-2025 Home Office Update</h4>
                <p style="color: #1E3A8A;">BRPs are no longer valid for Right to Work checks. All non-UK workers must use eVisa share codes via the online checking service.</p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
                <a href="https://novumflow.vercel.app/compliance" class="cta-button">
                    View Full Report in NovumFlow →
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>This report was automatically generated by NovumFlow Compliance System.</p>
            <p>Questions? Contact <a href="mailto:support@novumsolvo.com">support@novumsolvo.com</a></p>
            <p style="margin-top: 16px; font-size: 10px; color: #9CA3AF;">
                © ${new Date().getFullYear()} NovumSolvo Ltd. All rights reserved.<br>
                This email contains confidential compliance information. If you received this in error, please delete immediately.
            </p>
        </div>
    </div>
</body>
</html>
    `
}

async function sendEmail(apiKey: string, options: { to: string; subject: string; html: string }) {
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'NovumFlow Compliance <compliance@novumsolvo.com>',
                to: [options.to],
                subject: options.subject,
                html: options.html
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Email send failed:', error)
        }
    } catch (error) {
        console.error('Email send error:', error)
    }
}
