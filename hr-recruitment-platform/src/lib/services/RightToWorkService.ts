import { supabase } from '@/lib/supabase';
import { auditService } from './AuditService';
import { log } from '@/lib/logger';

// ==========================================
// Home Office 2024/2025 Right to Work Changes
// ==========================================
// - BRPs are NO LONGER VALID from 31 October 2024
// - eVisas are MANDATORY for non-UK/Irish workers
// - Expired BRPs will be rejected from 1 June 2025
// - Fines up to £60,000 per illegal worker
// ==========================================

// Critical dates for validation
export const RTW_CRITICAL_DATES = {
    BRP_INVALID_DATE: new Date('2024-10-31'),      // BRPs no longer valid after this date
    BRP_REJECTION_DATE: new Date('2025-06-01'),     // Hard reject expired BRPs after this
    EVISA_MANDATORY_DATE: new Date('2025-01-01'),   // eVisa mandatory for all non-UK
};

// Document types with their validation requirements
export type DocumentType =
    | 'passport_uk'                   // UK/Irish passport - unlimited right to work
    | 'passport_irish'                // Irish passport - unlimited right to work  
    | 'passport_non_uk'               // Non-UK passport with 90-day vignette ONLY
    | 'share_code'                    // eVisa share code - RECOMMENDED for non-UK
    | 'birth_certificate_ni_number'   // UK birth cert + NI number
    | 'frontier_worker_permit'        // EU Settlement Scheme frontier worker
    | 'certificate_of_application'    // Pending Home Office application
    | 'biometric_residence_permit'    // BRP - NO LONGER VALID (legacy only)
    | 'other';

export interface RightToWorkCheck {
    id: string;
    tenant_id: string;
    employee_id?: string;
    user_id?: string;
    staff_name: string;
    document_type: DocumentType;
    document_number?: string;
    nationality?: string;
    visa_type?: string;
    visa_expiry?: string;
    share_code?: string;
    share_code_verified?: boolean;
    share_code_verified_at?: string;
    check_date: string;
    next_check_date?: string;
    status: 'verified' | 'expired' | 'renewal_required' | 'pending_verification' | 'invalid' | 'blocked';
    verification_method: 'online' | 'manual' | 'employer_checking_service';
    checked_by?: string;
    document_url?: string;
    notes?: string;
    requires_followup?: boolean;
    followup_reason?: string;
    created_at: string;
    updated_at?: string;
}

export interface RTWValidationResult {
    isValid: boolean;
    canProceed: boolean;
    errors: string[];
    warnings: string[];
    requiresOnlineCheck: boolean;
    requiresFollowup: boolean;
    followupReason?: string;
    recommendedAction?: string;
}

export interface ShareCodeVerificationResult {
    valid: boolean;
    verifiedAt?: string;
    details?: {
        name: string;
        dob?: string;
        nationality?: string;
        immigrationStatus?: string;
        rightToWork: 'unlimited' | 'limited' | 'none';
        workRestrictions?: string[];
        expiryDate?: string;
        verificationCode?: string;
    };
    error?: string;
}

class RightToWorkService {
    /**
     * Validate document type and check compliance with 2024/2025 regulations
     */
    validateDocumentType(documentType: DocumentType, checkDate: Date = new Date()): RTWValidationResult {
        const result: RTWValidationResult = {
            isValid: true,
            canProceed: true,
            errors: [],
            warnings: [],
            requiresOnlineCheck: false,
            requiresFollowup: false,
        };

        // CRITICAL: BRP validation - NO LONGER VALID
        if (documentType === 'biometric_residence_permit') {
            if (checkDate >= RTW_CRITICAL_DATES.BRP_INVALID_DATE) {
                result.isValid = false;
                result.canProceed = false;
                result.errors.push(
                    '❌ Biometric Residence Permits (BRPs) are NO LONGER VALID for Right to Work checks since 31 October 2024.'
                );
                result.errors.push(
                    '⚠️ You MUST use the Home Office Online Checking Service with the worker\'s share code instead.'
                );
                result.recommendedAction = 'Ask the worker to create a UKVI account and provide their share code for online verification.';
            }

            // June 2025: Hard rejection for any historical BRP checks
            if (checkDate >= RTW_CRITICAL_DATES.BRP_REJECTION_DATE) {
                result.errors.push(
                    '🚫 All BRP-based checks are now rejected. This statutory defence is no longer available.'
                );
            }
        }

        // Non-UK passport with vignette - requires follow-up
        if (documentType === 'passport_non_uk') {
            result.requiresFollowup = true;
            result.followupReason = '90-day vignette holder - must conduct follow-up online check once UKVI account is active';
            result.warnings.push(
                '⚠️ 90-day vignette holders: You MUST conduct a follow-up online check when the worker activates their UKVI account (typically within 10 working days of arrival).'
            );
            result.recommendedAction = 'Set a reminder for 2-4 weeks after start date to verify via online share code.';
        }

        // Share code - recommended for all non-UK workers
        if (documentType === 'share_code') {
            result.requiresOnlineCheck = true;
            result.recommendedAction = 'Verify share code at gov.uk/view-right-to-work';
        }

        // Certificate of Application - time-limited
        if (documentType === 'certificate_of_application') {
            result.warnings.push(
                '⚠️ Certificates of Application provide limited protection. Verify with Employer Checking Service if share code unavailable.'
            );
            result.requiresFollowup = true;
            result.followupReason = 'Pending application - check for outcome regularly';
        }

        return result;
    }

    /**
     * Check if a worker requires online verification (eVisa)
     */
    requiresOnlineVerification(nationality: string, documentType: DocumentType): boolean {
        // UK and Irish citizens don't require online verification
        const unlimitedRightNationalities = ['british', 'uk', 'irish', 'ireland'];
        if (unlimitedRightNationalities.some(n => nationality.toLowerCase().includes(n))) {
            return false;
        }

        // All other nationalities should use online verification
        if (documentType !== 'passport_uk' && documentType !== 'passport_irish' && documentType !== 'birth_certificate_ni_number') {
            return true;
        }

        return false;
    }

    /**
     * Calculate next check date based on document type and visa expiry
     */
    calculateNextCheckDate(documentType: DocumentType, visaExpiry?: string, checkDate?: string): string | null {
        const baseDate = checkDate ? new Date(checkDate) : new Date();

        // UK/Irish citizens - no follow-up required (or very long interval)
        if (documentType === 'passport_uk' || documentType === 'passport_irish' || documentType === 'birth_certificate_ni_number') {
            return null; // No follow-up required
        }

        // If visa expiry is provided, use that
        if (visaExpiry) {
            return visaExpiry;
        }

        // 90-day vignette - follow up in 4 weeks
        if (documentType === 'passport_non_uk') {
            const followupDate = new Date(baseDate);
            followupDate.setDate(followupDate.getDate() + 28);
            return followupDate.toISOString().split('T')[0];
        }

        // Share code without expiry - default 12 months
        if (documentType === 'share_code') {
            const followupDate = new Date(baseDate);
            followupDate.setFullYear(followupDate.getFullYear() + 1);
            return followupDate.toISOString().split('T')[0];
        }

        // Default: 6 months
        const defaultFollowup = new Date(baseDate);
        defaultFollowup.setMonth(defaultFollowup.getMonth() + 6);
        return defaultFollowup.toISOString().split('T')[0];
    }

    /**
     * Add a new Right to Work check with validation
     */
    async addCheck(data: Partial<RightToWorkCheck>): Promise<{ check: RightToWorkCheck | null; validation: RTWValidationResult }> {
        // Validate before saving
        const validation = this.validateDocumentType(data.document_type as DocumentType);

        if (!validation.canProceed) {
            return { check: null, validation };
        }

        // Calculate next check date if not provided
        if (!data.next_check_date) {
            data.next_check_date = this.calculateNextCheckDate(
                data.document_type as DocumentType,
                data.visa_expiry,
                data.check_date
            ) || undefined;
        }

        // Set follow-up flags
        data.requires_followup = validation.requiresFollowup;
        data.followup_reason = validation.followupReason;

        // Set verification method
        if (!data.verification_method) {
            data.verification_method = data.share_code ? 'online' : 'manual';
        }

        const { data: result, error } = await supabase
            .from('right_to_work_checks')
            .insert(data)
            .select()
            .single();

        if (error) {
            log.error('Error adding RTW check', error, {
                component: 'RightToWorkService',
                metadata: { staffName: data.staff_name }
            });
            validation.errors.push(`Database error: ${error.message}`);
            return { check: null, validation };
        }

        // Log to audit trail
        await auditService.log({
            action: 'CREATE',
            entity_type: 'rtw_check',
            entity_id: result.id,
            entity_name: `RTW Check for ${data.staff_name}`,
            changes: {
                after: result,
                validation_warnings: validation.warnings,
                verification_method: data.verification_method
            }
        });

        return { check: result, validation };
    }

    /**
     * Get the latest RTW check for a user
     */
    async getCheck(userId: string): Promise<RightToWorkCheck | null> {
        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .eq('user_id', userId)
            .order('check_date', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                log.error('Error fetching RTW check', error, {
                    component: 'RightToWorkService',
                    userId
                });
            }
            return null;
        }

        return data;
    }

    /**
     * Get RTW check by employee ID
     */
    async getCheckByEmployeeId(employeeId: string): Promise<RightToWorkCheck | null> {
        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .eq('employee_id', employeeId)
            .order('check_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            log.error('Error fetching RTW check by employee', error, {
                component: 'RightToWorkService',
                metadata: { employeeId }
            });
            return null;
        }

        return data;
    }

    /**
     * Get all expiring checks within specified days
     */
    async getExpiringChecks(daysAhead: number = 60): Promise<RightToWorkCheck[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .lte('next_check_date', futureDate.toISOString().split('T')[0])
            .in('status', ['verified', 'renewal_required', 'pending_verification'])
            .order('next_check_date', { ascending: true });

        if (error) {
            log.error('Error fetching expiring RTW checks', error, {
                component: 'RightToWorkService'
            });
            return [];
        }

        return data || [];
    }

    /**
     * Get checks requiring follow-up (e.g., 90-day vignette holders)
     */
    async getChecksRequiringFollowup(): Promise<RightToWorkCheck[]> {
        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .eq('requires_followup', true)
            .in('status', ['verified', 'pending_verification'])
            .order('next_check_date', { ascending: true });

        if (error) {
            log.error('Error fetching follow-up RTW checks', error, {
                component: 'RightToWorkService'
            });
            return [];
        }

        return data || [];
    }

    /**
     * Get all invalid BRP-based checks that need remediation
     */
    async getInvalidBRPChecks(): Promise<RightToWorkCheck[]> {
        const { data, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .eq('document_type', 'biometric_residence_permit')
            .neq('status', 'blocked')
            .order('check_date', { ascending: false });

        if (error) {
            log.error('Error fetching BRP checks', error, {
                component: 'RightToWorkService'
            });
            return [];
        }

        return data || [];
    }

    /**
     * Verify an online share code (mock implementation)
     * In production, this would integrate with the Home Office API
     */
    async verifyShareCode(shareCode: string, dob: string): Promise<ShareCodeVerificationResult> {
        log.info('Verifying Share Code', {
            component: 'RightToWorkService',
            action: 'verify_share_code',
            metadata: { shareCodePrefix: shareCode.substring(0, 3) + '***' }
        });

        // Validate share code format (typically W12-345-678 or 9 character alphanumeric)
        const cleanCode = shareCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanCode.length !== 9) {
            return {
                valid: false,
                error: 'Invalid share code format. Share codes should be 9 characters (e.g., W12345678 or W12-345-678).'
            };
        }

        // Mock API call - in production, use Home Office Employer Checking Service API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful verification
                const verifiedAt = new Date().toISOString();
                resolve({
                    valid: true,
                    verifiedAt,
                    details: {
                        name: 'Verified Worker',
                        dob: dob,
                        nationality: 'Non-UK',
                        immigrationStatus: 'Skilled Worker Visa',
                        rightToWork: 'limited',
                        workRestrictions: ['Maximum 20 hours per week during term time if student'],
                        expiryDate: '2026-12-31',
                        verificationCode: `HO-${Date.now()}`
                    }
                });
            }, 1500);
        });
    }

    /**
     * Update RTW check status
     */
    async updateCheckStatus(checkId: string, status: RightToWorkCheck['status'], notes?: string): Promise<boolean> {
        const { error } = await supabase
            .from('right_to_work_checks')
            .update({
                status,
                notes: notes ? `${notes}\n[Status updated to ${status} on ${new Date().toISOString()}]` : undefined,
                updated_at: new Date().toISOString()
            })
            .eq('id', checkId);

        if (error) {
            log.error('Error updating RTW status', error, {
                component: 'RightToWorkService',
                metadata: { checkId, status }
            });
            return false;
        }

        await auditService.log({
            action: 'UPDATE',
            entity_type: 'rtw_check',
            entity_id: checkId,
            entity_name: 'RTW Check Status Update',
            changes: { status, notes }
        });

        return true;
    }

    /**
     * Block staff member due to RTW expiry or invalidity
     */
    async blockStaffForRTW(employeeId: string, reason: string): Promise<boolean> {
        // Update the RTW check status
        const check = await this.getCheckByEmployeeId(employeeId);
        if (check) {
            await this.updateCheckStatus(check.id, 'blocked', reason);
        }

        // Log the block action to audit and security
        await auditService.log({
            action: 'COMPLIANCE_BLOCK' as 'UPDATE',
            entity_type: 'employee',
            entity_id: employeeId,
            entity_name: 'Employee RTW Block',
            changes: { reason, blocked_at: new Date().toISOString() }
        });

        // Security event - staff blocked for RTW
        log.security('rtw_staff_blocked', {
            component: 'RightToWorkService',
            metadata: { employeeId, reason }
        });

        return true;
    }

    /**
     * Get compliance summary for dashboard
     */
    async getComplianceSummary(tenantId: string): Promise<{
        totalChecks: number;
        verified: number;
        expiringSoon: number;
        expired: number;
        requiresFollowup: number;
        invalidBRP: number;
    }> {
        const { data: checks, error } = await supabase
            .from('right_to_work_checks')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error || !checks) {
            return { totalChecks: 0, verified: 0, expiringSoon: 0, expired: 0, requiresFollowup: 0, invalidBRP: 0 };
        }

        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return {
            totalChecks: checks.length,
            verified: checks.filter(c => c.status === 'verified').length,
            expiringSoon: checks.filter(c => {
                if (!c.next_check_date) return false;
                const expiry = new Date(c.next_check_date);
                return expiry <= thirtyDaysFromNow && expiry > now;
            }).length,
            expired: checks.filter(c => c.status === 'expired' || (c.next_check_date && new Date(c.next_check_date) < now)).length,
            requiresFollowup: checks.filter(c => c.requires_followup && c.status !== 'expired').length,
            invalidBRP: checks.filter(c => c.document_type === 'biometric_residence_permit').length
        };
    }
}

export const rtwService = new RightToWorkService();
