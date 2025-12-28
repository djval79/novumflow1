import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { auditService } from './AuditService';

// ============================================
// TYPES
// ============================================

export interface DBSCheck {
    id: string;
    tenant_id: string;
    user_id?: string;
    applicant_name: string;
    applicant_email?: string;
    dbs_number?: string;
    check_type: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred';
    check_level: 'adult' | 'child' | 'both';
    issue_date: string;
    expiry_date?: string;
    renewal_period_months: number;
    status: 'pending' | 'clear' | 'disclosed' | 'expired' | 'renewal_due';
    certificate_number?: string;
    update_service_subscribed: boolean;
    disclosures?: any;
    verified_by?: string;
    verified_at?: string;
    document_url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface EmploymentReference {
    id: string;
    tenant_id: string;
    applicant_id?: string;
    applicant_name: string;
    reference_number: number;
    referee_name: string;
    referee_position?: string;
    referee_organization: string;
    referee_email?: string;
    referee_phone?: string;
    relationship?: string;
    employment_dates_from?: string;
    employment_dates_to?: string;
    reference_type: 'employment' | 'character' | 'professional';
    requested_date: string;
    received_date?: string;
    status: 'pending' | 'received' | 'satisfactory' | 'unsatisfactory' | 'unable_to_obtain';
    reference_content?: string;
    suitability_rating?: 'excellent' | 'good' | 'satisfactory' | 'concerns';
    concerns_noted?: string;
    verified_by?: string;
    document_url?: string;
    created_at: string;
}

export interface TrainingRecord {
    id: string;
    tenant_id: string;
    user_id?: string;
    staff_name: string;
    training_name: string;
    training_category: 'mandatory' | 'role_specific' | 'cpd' | 'induction';
    training_type?: string;
    is_mandatory: boolean;
    completion_date: string;
    expiry_date?: string;
    renewal_period_months?: number;
    certificate_number?: string;
    training_provider?: string;
    training_hours?: number;
    assessment_passed: boolean;
    certificate_url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ComplianceStatus {
    id: string;
    tenant_id: string;
    user_id?: string;
    staff_name: string;
    dbs_status: 'compliant' | 'expiring_soon' | 'expired' | 'missing';
    references_status: 'compliant' | 'incomplete' | 'missing';
    training_status: 'compliant' | 'overdue' | 'missing';
    rtw_status: 'compliant' | 'expiring_soon' | 'expired' | 'missing';
    overall_compliance_score: number;
    cqc_ready: boolean;
    last_updated: string;
}

// ============================================
// COMPLIANCE SERVICE
// ============================================

class ComplianceService {
    // ============================================
    // DBS CHECKS
    // ============================================

    async addDBSCheck(data: Partial<DBSCheck>): Promise<DBSCheck | null> {
        const { data: result, error } = await supabase
            .from('dbs_checks')
            .insert(data)
            .select()
            .single();

        if (error) {
            log.error('Error adding DBS check:', error, { component: 'ComplianceService' });
            return null;
        }

        // Log to audit trail
        await auditService.log({
            action: 'CREATE',
            entity_type: 'dbs_check',
            entity_id: result.id,
            entity_name: `DBS Check for ${data.applicant_name}`,
            changes: { after: result }
        });

        return result;
    }

    async getDBSCheck(userId: string): Promise<DBSCheck | null> {
        const { data, error } = await supabase
            .from('dbs_checks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            log.error('Error fetching DBS check:', error, { component: 'ComplianceService' });
            return null;
        }

        return data;
    }

    async getExpiringDBS(daysAhead: number = 90): Promise<DBSCheck[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const { data, error } = await supabase
            .from('dbs_checks')
            .select('*')
            .lte('expiry_date', futureDate.toISOString().split('T')[0])
            .in('status', ['clear', 'renewal_due'])
            .order('expiry_date', { ascending: true });

        if (error) {
            log.error('Error fetching expiring DBS checks:', error, { component: 'ComplianceService' });
            return [];
        }

        return data || [];
    }

    // ============================================
    // REFERENCES
    // ============================================

    async addReference(data: Partial<EmploymentReference>): Promise<EmploymentReference | null> {
        const { data: result, error } = await supabase
            .from('employment_references')
            .insert(data)
            .select()
            .single();

        if (error) {
            log.error('Error adding reference:', error, { component: 'ComplianceService' });
            return null;
        }

        // Log to audit trail
        await auditService.log({
            action: 'CREATE',
            entity_type: 'reference',
            entity_id: result.id,
            entity_name: `Reference ${data.reference_number} for ${data.applicant_name}`,
            changes: { after: result }
        });

        return result;
    }

    async getReferences(applicantId: string): Promise<EmploymentReference[]> {
        const { data, error } = await supabase
            .from('employment_references')
            .select('*')
            .eq('applicant_id', applicantId)
            .order('reference_number', { ascending: true });

        if (error) {
            log.error('Error fetching references:', error, { component: 'ComplianceService' });
            return [];
        }

        return data || [];
    }

    async checkReferencesComplete(applicantId: string): Promise<boolean> {
        const references = await this.getReferences(applicantId);
        const satisfactoryRefs = references.filter(r => r.status === 'satisfactory');
        return satisfactoryRefs.length >= 2;
    }

    // ============================================
    // TRAINING
    // ============================================

    async addTrainingRecord(data: Partial<TrainingRecord>): Promise<TrainingRecord | null> {
        const { data: result, error } = await supabase
            .from('training_records')
            .insert(data)
            .select()
            .single();

        if (error) {
            log.error('Error adding training record:', error, { component: 'ComplianceService' });
            return null;
        }

        // Log to audit trail
        await auditService.log({
            action: 'CREATE',
            entity_type: 'training',
            entity_id: result.id,
            entity_name: `${data.training_name} for ${data.staff_name}`,
            changes: { after: result }
        });

        return result;
    }

    async updateTrainingRecord(id: string, data: Partial<TrainingRecord>): Promise<TrainingRecord | null> {
        const { data: result, error } = await supabase
            .from('training_records')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            log.error('Error updating training record:', error, { component: 'ComplianceService' });
            return null;
        }

        // Log to audit trail
        await auditService.log({
            action: 'UPDATE',
            entity_type: 'training',
            entity_id: result.id,
            entity_name: `${result.training_name} for ${result.staff_name}`,
            changes: { after: result }
        });

        return result;
    }

    async deleteTrainingRecord(id: string): Promise<boolean> {
        // Get record details for audit before deleting
        const { data: record } = await supabase
            .from('training_records')
            .select('*')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('training_records')
            .delete()
            .eq('id', id);

        if (error) {
            log.error('Error deleting training record:', error, { component: 'ComplianceService' });
            return false;
        }

        if (record) {
            // Log to audit trail
            await auditService.log({
                action: 'DELETE',
                entity_type: 'training',
                entity_id: id,
                entity_name: `${record.training_name} for ${record.staff_name}`,
                changes: { before: record }
            });
        }

        return true;
    }

    async getUserTraining(userId: string): Promise<TrainingRecord[]> {
        const { data, error } = await supabase
            .from('training_records')
            .select('*')
            .eq('user_id', userId)
            .order('completion_date', { ascending: false });

        if (error) {
            log.error('Error fetching training records:', error, { component: 'ComplianceService' });
            return [];
        }

        return data || [];
    }

    async getMandatoryTrainingStatus(userId: string): Promise<{
        completed: TrainingRecord[];
        missing: string[];
        expiring: TrainingRecord[];
    }> {
        const mandatoryTypes = [
            'health_safety',
            'fire_safety',
            'safeguarding',
            'infection_control',
            'manual_handling',
            'medication',
            'mental_capacity_dols',
            'first_aid',
            'food_hygiene',
            'equality_diversity',
            'record_keeping'
        ];

        const training = await this.getUserTraining(userId);
        const completed = training.filter(t => t.is_mandatory);

        const completedTypes = completed.map(t => t.training_type);
        const missing = mandatoryTypes.filter(type => !completedTypes.includes(type));

        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const expiring = completed.filter(t => {
            if (!t.expiry_date) return false;
            const expiry = new Date(t.expiry_date);
            return expiry >= today && expiry <= futureDate;
        });

        return { completed, missing, expiring };
    }

    async getExpiringCertificates(daysAhead: number = 30): Promise<TrainingRecord[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const { data, error } = await supabase
            .from('training_records')
            .select('*')
            .not('expiry_date', 'is', null)
            .lte('expiry_date', futureDate.toISOString().split('T')[0])
            .order('expiry_date', { ascending: true });

        if (error) {
            log.error('Error fetching expiring certificates:', error, { component: 'ComplianceService' });
            return [];
        }

        return data || [];
    }

    // ============================================
    // COMPLIANCE STATUS
    // ============================================

    async getStaffComplianceStatus(userId: string): Promise<ComplianceStatus | null> {
        const { data, error } = await supabase
            .from('staff_compliance_status')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            log.error('Error fetching compliance status:', error, { component: 'ComplianceService' });
            return null;
        }

        return data;
    }

    async getTenantComplianceReport(tenantId: string): Promise<{
        total_staff: number;
        compliant: number;
        non_compliant: number;
        cqc_ready: number;
        average_score: number;
    }> {
        const { data, error } = await supabase
            .from('staff_compliance_status')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) {
            log.error('Error fetching tenant compliance report:', error, { component: 'ComplianceService' });
            return {
                total_staff: 0,
                compliant: 0,
                non_compliant: 0,
                cqc_ready: 0,
                average_score: 0
            };
        }

        const total_staff = data.length;
        const compliant = data.filter(s => s.overall_compliance_score >= 90).length;
        const non_compliant = total_staff - compliant;
        const cqc_ready = data.filter(s => s.cqc_ready).length;
        const average_score = data.reduce((sum, s) => sum + s.overall_compliance_score, 0) / total_staff || 0;

        return {
            total_staff,
            compliant,
            non_compliant,
            cqc_ready,
            average_score: Math.round(average_score)
        };
    }

    async getNonCompliantStaff(tenantId: string): Promise<ComplianceStatus[]> {
        const { data, error } = await supabase
            .from('staff_compliance_status')
            .select('*')
            .eq('tenant_id', tenantId)
            .lt('overall_compliance_score', 90)
            .order('overall_compliance_score', { ascending: true });

        if (error) {
            log.error('Error fetching non-compliant staff:', error, { component: 'ComplianceService' });
            return [];
        }

        return data || [];
    }

    /**
     * Get ALL staff compliance status for a tenant
     * Used for Inspector Dashboard / CQC Evidence Register
     */
    async getAllStaffCompliance(tenantId: string): Promise<ComplianceStatus[]> {
        const { data, error } = await supabase
            .from('staff_compliance_status')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('staff_name', { ascending: true });

        if (error) {
            log.error('Error fetching all staff compliance:', error, { component: 'ComplianceService' });
            return [];
        }

        return data || [];
    }

    // ============================================
    // CQC REPORTS
    // ============================================

    async generateCQCReport(tenantId: string): Promise<{
        dbs_register: DBSCheck[];
        training_matrix: TrainingRecord[];
        compliance_summary: any;
    }> {
        const { data: dbs_register } = await supabase
            .from('dbs_checks')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('applicant_name');

        const { data: training_matrix } = await supabase
            .from('training_records')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('staff_name');

        const compliance_summary = await this.getTenantComplianceReport(tenantId);

        return {
            dbs_register: dbs_register || [],
            training_matrix: training_matrix || [],
            compliance_summary
        };
    }
    // ============================================
    // COMPLIANCE SETTINGS
    // ============================================

    async getSettings(): Promise<any> {
        const { data, error } = await supabase
            .from('company_settings')
            .select('metadata')
            .single();

        if (error) {
            log.error('Error fetching company settings:', error, { component: 'ComplianceService' });
            return {
                dbs_renewal_months: 36,
                rtw_check_frequency_months: 12,
                training_validity: {}
            };
        }

        return data?.metadata?.compliance || {
            dbs_renewal_months: 36,
            rtw_check_frequency_months: 12,
            training_validity: {}
        };
    }

    async updateSettings(settings: any): Promise<boolean> {
        // First get existing metadata to merge
        const { data: current } = await supabase
            .from('company_settings')
            .select('metadata')
            .single();

        const newMetadata = {
            ...(current?.metadata || {}),
            compliance: settings
        };

        const { error } = await supabase
            .from('company_settings')
            .update({ metadata: newMetadata })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all (usually just one row)

        if (error) {
            log.error('Error updating compliance settings:', error, { component: 'ComplianceService' });
            return false;
        }

        // Log to audit trail
        await auditService.log({
            action: 'UPDATE',
            entity_type: 'settings',
            entity_id: 'company_settings',
            entity_name: 'Compliance Rules',
            changes: { after: settings }
        });

        return true;
    }
}

export const complianceService = new ComplianceService();
