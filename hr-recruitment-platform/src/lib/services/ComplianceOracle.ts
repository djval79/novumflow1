import { supabase } from '../supabase';
import { log } from '@/lib/logger';

export interface ComplianceRisk {
    staff_id: string;
    staff_name: string;
    risk_type: 'DBS' | 'Training' | 'RightToWork' | 'Insurance';
    expiry_date: string;
    days_remaining: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
}

/**
 * Compliance Oracle: Predictive analytics for staff compliance.
 */
export const complianceOracle = {
    /**
     * Analyze upcoming compliance risks for the tenant.
     * Returns a list of risks ordered by severity.
     */
    async predictRisks(tenantId: string): Promise<ComplianceRisk[]> {
        try {
            const risks: ComplianceRisk[] = [];
            const now = new Date();
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(now.getDate() + 60);

            // 1. Check Training Expiries
            const { data: training } = await supabase
                .from('training_records')
                .select('id, employee_id, course_name, expiry_date, employees(first_name, last_name)')
                .eq('tenant_id', tenantId)
                .lte('expiry_date', sixtyDaysFromNow.toISOString())
                .order('expiry_date', { ascending: true });

            training?.forEach(t => {
                const expiry = new Date(t.expiry_date);
                const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

                risks.push({
                    staff_id: t.employee_id,
                    staff_name: `${t.employees?.first_name} ${t.employees?.last_name}`,
                    risk_type: 'Training',
                    expiry_date: t.expiry_date,
                    days_remaining: days,
                    severity: days < 7 ? 'critical' : days < 15 ? 'high' : 'medium',
                    recommendation: `Schedule ${t.course_name} refresher course immediately.`
                });
            });

            // 2. Check DBS Expiries (assuming stored in employees or documents)
            const { data: documents } = await supabase
                .from('documents')
                .select('id, employee_id, document_type, expiry_date, employees(first_name, last_name)')
                .eq('tenant_id', tenantId)
                .in('document_type', ['DBS', 'Right to Work'])
                .lte('expiry_date', sixtyDaysFromNow.toISOString())
                .eq('is_current_version', true);

            documents?.forEach(d => {
                const expiry = new Date(d.expiry_date);
                const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

                risks.push({
                    staff_id: d.employee_id,
                    staff_name: `${d.employees?.first_name} ${d.employees?.last_name}`,
                    risk_type: d.document_type === 'DBS' ? 'DBS' : 'RightToWork',
                    expiry_date: d.expiry_date,
                    days_remaining: days,
                    severity: days < 14 ? 'critical' : days < 30 ? 'high' : 'medium',
                    recommendation: `Initiate ${d.document_type} renewal process.`
                });
            });

            return risks.sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });

        } catch (error) {
            log.error('Compliance Oracle analysis failed', error, { component: 'ComplianceOracle' });
            return [];
        }
    }
};
