/// <reference lib="deno.ns" />

interface VisaRecord {
    expiry_date: string;
    current_status: string;
}

interface DBSCertificate {
    expiry_date: string | null;
    status: string;
}

interface ComplianceAlert {
    alert_priority: 'critical' | 'urgent' | 'high' | 'medium' | 'low';
    status: string;
    due_date: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
    const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, cache-control, pragma, expires, x-requested-with',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const alertsResponse = await fetch(`${supabaseUrl}/rest/v1/compliance_alerts?status=eq.active&order=alert_priority.asc,due_date.asc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const alerts: ComplianceAlert[] = alertsResponse.ok ? await alertsResponse.json() : [];

        const visaResponse = await fetch(`${supabaseUrl}/rest/v1/visa_records?current_status=eq.active&order=expiry_date.asc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const visaRecords: VisaRecord[] = visaResponse.ok ? await visaResponse.json() : [];

        const dbsResponse = await fetch(`${supabaseUrl}/rest/v1/dbs_certificates?status=in.(pending,approved)&order=expiry_date.asc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const dbsCertificates: DBSCertificate[] = dbsResponse.ok ? await dbsResponse.json() : [];

        const rtwResponse = await fetch(`${supabaseUrl}/rest/v1/right_to_work_checks?order=check_date.desc&limit=50`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const rtwChecks: unknown[] = rtwResponse.ok ? await rtwResponse.json() : [];

        const now = new Date();
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        const expiringVisas = visaRecords.filter((v: VisaRecord) => {
            const expiryDate = new Date(v.expiry_date);
            return expiryDate <= ninetyDaysFromNow && expiryDate > now;
        });

        const expiringDBS = dbsCertificates.filter((d: DBSCertificate) => {
            if (!d.expiry_date) return false;
            const expiryDate = new Date(d.expiry_date);
            return expiryDate <= ninetyDaysFromNow && expiryDate > now;
        });

        const criticalAlerts = alerts.filter((a: ComplianceAlert) => a.alert_priority === 'critical' || a.alert_priority === 'urgent');
        const highAlerts = alerts.filter((a: ComplianceAlert) => a.alert_priority === 'high');

        const complianceScore = Math.max(0, Math.min(100,
            100 - (criticalAlerts.length * 10) - (highAlerts.length * 5) - (expiringVisas.length * 3)
        ));

        return new Response(JSON.stringify({
            data: {
                summary: {
                    total_alerts: alerts.length,
                    critical_alerts: criticalAlerts.length,
                    high_alerts: highAlerts.length,
                    expiring_visas: expiringVisas.length,
                    expiring_dbs: expiringDBS.length,
                    total_visa_records: visaRecords.length,
                    total_dbs_certificates: dbsCertificates.length,
                    total_rtw_checks: rtwChecks.length,
                    compliance_score: Math.round(complianceScore)
                },
                alerts: alerts,
                visa_records: visaRecords,
                dbs_certificates: dbsCertificates,
                rtw_checks: rtwChecks,
                expiring_items: {
                    visas: expiringVisas,
                    dbs: expiringDBS
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: unknown) {
        console.error('Compliance dashboard error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        const errorResponse = {
            error: {
                code: 'COMPLIANCE_DASHBOARD_ERROR',
                message: errorMessage
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
