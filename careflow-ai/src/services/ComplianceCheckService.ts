/**
 * Compliance Check Service for CareFlow
 * Checks staff compliance status from NovumFlow integration
 */

import { supabase } from '@/lib/supabase';

export interface ComplianceStatus {
    staffId: string;
    isCompliant: boolean;
    compliancePercentage: number;
    missingDocuments: string[];
    expiredDocuments: string[];
    rtw_status: 'valid' | 'expired' | 'missing' | 'pending';
    dbs_status: 'valid' | 'expired' | 'missing' | 'pending';
    training_status: 'valid' | 'expired' | 'incomplete';
    syncedFromNovumFlow: boolean;
    lastSyncedAt: string | null;
}

export interface StaffWithCompliance {
    id: string;
    first_name: string;
    last_name: string;
    compliance?: ComplianceStatus;
}

class ComplianceCheckService {
    /**
     * Check compliance status for a single staff member
     */
    async checkStaffCompliance(staffId: string, tenantId: string): Promise<ComplianceStatus> {
        try {
            // First, check if staff is synced from NovumFlow
            const { data: careflowStaff, error: staffError } = await supabase
                .from('careflow_staff')
                .select('*')
                .eq('id', staffId)
                .eq('tenant_id', tenantId)
                .single();

            if (staffError && staffError.code !== 'PGRST116') {
                console.error('Error checking staff:', staffError);
            }

            // Check compliance from careflow_compliance table
            const { data: compliance, error: complianceError } = await supabase
                .from('careflow_compliance')
                .select('*')
                .eq('staff_id', staffId)
                .eq('tenant_id', tenantId)
                .single();

            if (complianceError && complianceError.code !== 'PGRST116') {
                console.error('Error checking compliance:', complianceError);
            }

            // If no compliance record, check directly in employees table for basic status
            if (!compliance) {
                const { data: employee, error: empError } = await supabase
                    .from('employees')
                    .select('id, first_name, last_name, status, rtw_status')
                    .eq('id', staffId)
                    .eq('tenant_id', tenantId)
                    .single();

                if (empError || !employee) {
                    return this.createUnknownComplianceStatus(staffId);
                }

                // Basic compliance check from employee record
                const rtwValid = employee.rtw_status === 'verified';

                return {
                    staffId,
                    isCompliant: rtwValid,
                    compliancePercentage: rtwValid ? 50 : 0, // Basic check only
                    missingDocuments: rtwValid ? [] : ['Right to Work'],
                    expiredDocuments: [],
                    rtw_status: rtwValid ? 'valid' : 'missing',
                    dbs_status: 'pending',
                    training_status: 'incomplete',
                    syncedFromNovumFlow: false,
                    lastSyncedAt: null
                };
            }

            // Parse compliance data from NovumFlow sync
            return {
                staffId,
                isCompliant: compliance.is_compliant || false,
                compliancePercentage: compliance.compliance_percentage || 0,
                missingDocuments: compliance.missing_documents || [],
                expiredDocuments: compliance.expired_documents || [],
                rtw_status: compliance.rtw_status || 'missing',
                dbs_status: compliance.dbs_status || 'missing',
                training_status: compliance.training_status || 'incomplete',
                syncedFromNovumFlow: careflowStaff?.novumflow_employee_id ? true : false,
                lastSyncedAt: compliance.last_synced_at || null
            };
        } catch (error) {
            console.error('Compliance check error:', error);
            return this.createUnknownComplianceStatus(staffId);
        }
    }

    /**
     * Check compliance for all staff members
     */
    async checkAllStaffCompliance(tenantId: string): Promise<Map<string, ComplianceStatus>> {
        const complianceMap = new Map<string, ComplianceStatus>();

        try {
            // Get all employees for tenant
            const { data: employees, error: empError } = await supabase
                .from('employees')
                .select('id, first_name, last_name, status, rtw_status')
                .eq('tenant_id', tenantId)
                .eq('status', 'active');

            if (empError || !employees) {
                console.error('Error fetching employees:', empError);
                return complianceMap;
            }

            // Get all compliance records
            const { data: complianceRecords, error: compError } = await supabase
                .from('careflow_compliance')
                .select('*')
                .eq('tenant_id', tenantId);

            if (compError) {
                console.error('Error fetching compliance:', compError);
            }

            // Build compliance map
            const complianceByStaff = new Map(
                (complianceRecords || []).map(c => [c.staff_id, c])
            );

            for (const emp of employees) {
                const compliance = complianceByStaff.get(emp.id);

                if (compliance) {
                    complianceMap.set(emp.id, {
                        staffId: emp.id,
                        isCompliant: compliance.is_compliant || false,
                        compliancePercentage: compliance.compliance_percentage || 0,
                        missingDocuments: compliance.missing_documents || [],
                        expiredDocuments: compliance.expired_documents || [],
                        rtw_status: compliance.rtw_status || 'missing',
                        dbs_status: compliance.dbs_status || 'missing',
                        training_status: compliance.training_status || 'incomplete',
                        syncedFromNovumFlow: true,
                        lastSyncedAt: compliance.last_synced_at
                    });
                } else {
                    // Fallback to basic employee data
                    const rtwValid = emp.rtw_status === 'verified';
                    complianceMap.set(emp.id, {
                        staffId: emp.id,
                        isCompliant: rtwValid,
                        compliancePercentage: rtwValid ? 50 : 0,
                        missingDocuments: rtwValid ? [] : ['Right to Work'],
                        expiredDocuments: [],
                        rtw_status: rtwValid ? 'valid' : 'missing',
                        dbs_status: 'pending',
                        training_status: 'incomplete',
                        syncedFromNovumFlow: false,
                        lastSyncedAt: null
                    });
                }
            }
        } catch (error) {
            console.error('Error checking all staff compliance:', error);
        }

        return complianceMap;
    }

    /**
     * Validate if staff can be assigned to a shift
     */
    async canAssignToShift(staffId: string, tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
        const compliance = await this.checkStaffCompliance(staffId, tenantId);

        if (!compliance.isCompliant) {
            const issues: string[] = [];

            if (compliance.rtw_status !== 'valid') {
                issues.push('Right to Work not verified');
            }
            if (compliance.dbs_status !== 'valid') {
                issues.push('DBS check not valid');
            }
            if (compliance.missingDocuments.length > 0) {
                issues.push(`Missing: ${compliance.missingDocuments.join(', ')}`);
            }
            if (compliance.expiredDocuments.length > 0) {
                issues.push(`Expired: ${compliance.expiredDocuments.join(', ')}`);
            }

            return {
                allowed: false,
                reason: `Compliance Block: ${issues.join('; ')}`
            };
        }

        return { allowed: true };
    }

    /**
     * Get compliance badge color based on status
     */
    getComplianceBadgeColor(status: ComplianceStatus): string {
        if (status.isCompliant && status.compliancePercentage >= 90) {
            return 'bg-green-100 text-green-700 border-green-200';
        } else if (status.compliancePercentage >= 70) {
            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        } else if (status.compliancePercentage >= 50) {
            return 'bg-orange-100 text-orange-700 border-orange-200';
        } else {
            return 'bg-red-100 text-red-700 border-red-200';
        }
    }

    private createUnknownComplianceStatus(staffId: string): ComplianceStatus {
        return {
            staffId,
            isCompliant: false,
            compliancePercentage: 0,
            missingDocuments: ['Unknown - Not synced'],
            expiredDocuments: [],
            rtw_status: 'pending',
            dbs_status: 'pending',
            training_status: 'incomplete',
            syncedFromNovumFlow: false,
            lastSyncedAt: null
        };
    }
}

export const complianceCheckService = new ComplianceCheckService();
export default complianceCheckService;
