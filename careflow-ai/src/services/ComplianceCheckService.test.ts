
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complianceCheckService } from './ComplianceCheckService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn()
                    }))
                }))
            }))
        }))
    }
}));

describe('ComplianceCheckService', () => {
    const mockTenantId = 'tenant-123';
    const mockStaffId = 'staff-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return compliant status when all documents are valid', async () => {
        // Mock data
        const mockComplianceData = {
            staff_id: mockStaffId,
            is_compliant: true,
            compliance_percentage: 100,
            missing_documents: [],
            expired_documents: [],
            rtw_status: 'valid',
            dbs_status: 'valid',
            training_status: 'valid',
            last_synced_at: '2023-01-01'
        };

        // Setup mock chain
        const singleSpy = vi.fn().mockResolvedValue({ data: mockComplianceData, error: null });
        const eqSpy2 = vi.fn().mockReturnValue({ single: singleSpy });
        const eqSpy1 = vi.fn().mockReturnValue({ eq: eqSpy2 });
        const selectSpy = vi.fn().mockReturnValue({ eq: eqSpy1 });
        const fromSpy = vi.fn().mockReturnValue({ select: selectSpy });

        // Apply mock to the specific call structure we expect
        // Note: The service makes TWO calls. One to carflow_staff, one to careflow_compliance.
        // We need to support both.

        // Ideally we mock the implementation of 'from' to return different things/

        // Let's simplified mock for the 'careflow_compliance' call which is the second one
        // We will make 'select' return a mock that handles the chain

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'careflow_staff') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                single: async () => ({ data: { novumflow_employee_id: 'emp-123' }, error: null })
                            })
                        })
                    })
                }
            }
            if (table === 'staff_compliance_summary') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                single: async () => ({ data: mockComplianceData, error: null })
                            })
                        })
                    })
                }
            }
            return { select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }) };
        });

        const result = await complianceCheckService.checkStaffCompliance(mockStaffId, mockTenantId);

        expect(result.isCompliant).toBe(true);
        expect(result.missingDocuments).toHaveLength(0);
        expect(result.syncedFromNovumFlow).toBe(true);
    });

    it('should block shift assignment if non-compliant', async () => {
        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'careflow_staff') return { select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: { novumflow_employee_id: 'emp-123' }, error: null }) }) }) }) };
            if (table === 'staff_compliance_summary' || table === 'careflow_compliance') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                single: async () => ({
                                    data: {
                                        is_compliant: false,
                                        missing_documents: ['Right to Work'],
                                        rtw_status: 'missing',
                                        dbs_status: 'valid',
                                        training_status: 'valid'
                                    },
                                    error: null
                                })
                            })
                        })
                    })
                }
            }
            return { select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }) };
        });

        const result = await complianceCheckService.canAssignToShift(mockStaffId, mockTenantId);

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Compliance Block');
        expect(result.reason).toContain('Right to Work not verified');
    });
});
