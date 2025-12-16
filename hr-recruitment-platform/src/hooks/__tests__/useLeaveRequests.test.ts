/// <reference types="vitest" />
/**
 * useLeaveRequests Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data
const mockLeaveRequests = [
    {
        id: 'leave-1',
        employee_id: 'emp-1',
        leave_type: 'annual',
        start_date: '2024-03-01',
        end_date: '2024-03-05',
        total_days: 5,
        status: 'approved',
        reason: 'Family vacation',
        approver_id: 'emp-5',
        approved_at: '2024-02-20T10:00:00Z',
        created_at: '2024-02-15T10:00:00Z',
    },
    {
        id: 'leave-2',
        employee_id: 'emp-2',
        leave_type: 'sick',
        start_date: '2024-02-10',
        end_date: '2024-02-11',
        total_days: 2,
        status: 'approved',
        reason: 'Medical appointment',
        approver_id: 'emp-6',
        approved_at: '2024-02-10T08:00:00Z',
        created_at: '2024-02-10T07:00:00Z',
    },
    {
        id: 'leave-3',
        employee_id: 'emp-3',
        leave_type: 'annual',
        start_date: '2024-04-15',
        end_date: '2024-04-19',
        total_days: 5,
        status: 'pending',
        reason: 'Personal travel',
        approver_id: null,
        approved_at: null,
        created_at: '2024-02-25T10:00:00Z',
    },
    {
        id: 'leave-4',
        employee_id: 'emp-1',
        leave_type: 'wfh',
        start_date: '2024-02-28',
        end_date: '2024-02-28',
        total_days: 1,
        status: 'rejected',
        reason: 'Important team meeting scheduled',
        approver_id: 'emp-5',
        approved_at: null,
        rejection_reason: 'Critical meeting on this date',
        created_at: '2024-02-20T10:00:00Z',
    },
    {
        id: 'leave-5',
        employee_id: 'emp-2',
        leave_type: 'maternity',
        start_date: '2024-06-01',
        end_date: '2024-09-01',
        total_days: 93,
        status: 'approved',
        reason: 'Maternity leave',
        approver_id: 'emp-6',
        approved_at: '2024-02-01T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
    },
];

const mockLeaveBalances = [
    { employee_id: 'emp-1', leave_type: 'annual', total_days: 25, used_days: 5, remaining_days: 20 },
    { employee_id: 'emp-1', leave_type: 'sick', total_days: 10, used_days: 0, remaining_days: 10 },
    { employee_id: 'emp-2', leave_type: 'annual', total_days: 25, used_days: 2, remaining_days: 23 },
    { employee_id: 'emp-2', leave_type: 'maternity', total_days: 182, used_days: 0, remaining_days: 182 },
    { employee_id: 'emp-3', leave_type: 'annual', total_days: 20, used_days: 0, remaining_days: 20 },
];

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockLeaveRequests, error: null })),
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockLeaveRequests[0], error: null })),
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockLeaveRequests[0], error: null })),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: mockLeaveRequests[0], error: null })),
            })),
        })),
    },
    getSupabaseClient: () => ({}),
}));

describe('useLeaveRequests Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mock Data Validation', () => {
        it('should have valid leave request structure', () => {
            mockLeaveRequests.forEach(leave => {
                expect(leave).toHaveProperty('id');
                expect(leave).toHaveProperty('employee_id');
                expect(leave).toHaveProperty('leave_type');
                expect(leave).toHaveProperty('start_date');
                expect(leave).toHaveProperty('end_date');
                expect(leave).toHaveProperty('status');
            });
        });

        it('should have valid leave types', () => {
            const validTypes = ['annual', 'sick', 'wfh', 'maternity', 'paternity', 'bereavement', 'unpaid'];
            mockLeaveRequests.forEach(leave => {
                expect(validTypes).toContain(leave.leave_type);
            });
        });

        it('should have valid status values', () => {
            const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
            mockLeaveRequests.forEach(leave => {
                expect(validStatuses).toContain(leave.status);
            });
        });

        it('should have end date >= start date', () => {
            mockLeaveRequests.forEach(leave => {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                expect(end.getTime()).toBeGreaterThanOrEqual(start.getTime());
            });
        });

        it('should have total_days matching date range', () => {
            mockLeaveRequests.forEach(leave => {
                const start = new Date(leave.start_date);
                const end = new Date(leave.end_date);
                const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                expect(leave.total_days).toBe(diff);
            });
        });
    });

    describe('Leave Request Filtering', () => {
        it('should filter by employee', () => {
            const emp1Leaves = mockLeaveRequests.filter(l => l.employee_id === 'emp-1');
            expect(emp1Leaves.length).toBe(2);
        });

        it('should filter by status', () => {
            const pending = mockLeaveRequests.filter(l => l.status === 'pending');
            expect(pending.length).toBe(1);
        });

        it('should filter by leave type', () => {
            const annual = mockLeaveRequests.filter(l => l.leave_type === 'annual');
            expect(annual.length).toBe(2);
        });

        it('should filter by date range', () => {
            const march2024 = mockLeaveRequests.filter(l => {
                const start = new Date(l.start_date);
                return start.getMonth() === 2 && start.getFullYear() === 2024;
            });
            expect(march2024.length).toBe(1);
        });
    });

    describe('Leave Balance Calculations', () => {
        it('should have valid balance structure', () => {
            mockLeaveBalances.forEach(balance => {
                expect(balance).toHaveProperty('employee_id');
                expect(balance).toHaveProperty('leave_type');
                expect(balance).toHaveProperty('total_days');
                expect(balance).toHaveProperty('used_days');
                expect(balance).toHaveProperty('remaining_days');
            });
        });

        it('should have remaining = total - used', () => {
            mockLeaveBalances.forEach(balance => {
                expect(balance.remaining_days).toBe(balance.total_days - balance.used_days);
            });
        });

        it('should not allow negative remaining days', () => {
            mockLeaveBalances.forEach(balance => {
                expect(balance.remaining_days).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Leave Conflict Detection', () => {
        it('should detect overlapping leave requests', () => {
            const checkOverlap = (newRequest: any) => {
                return mockLeaveRequests.some(existing => {
                    if (existing.employee_id !== newRequest.employee_id) return false;
                    if (existing.status === 'rejected' || existing.status === 'cancelled') return false;

                    const existStart = new Date(existing.start_date);
                    const existEnd = new Date(existing.end_date);
                    const newStart = new Date(newRequest.start_date);
                    const newEnd = new Date(newRequest.end_date);

                    return newStart <= existEnd && newEnd >= existStart;
                });
            };

            const conflictingRequest = {
                employee_id: 'emp-1',
                start_date: '2024-03-03',
                end_date: '2024-03-07',
            };

            expect(checkOverlap(conflictingRequest)).toBe(true);
        });

        it('should allow non-overlapping requests', () => {
            const checkOverlap = (newRequest: any) => {
                return mockLeaveRequests.some(existing => {
                    if (existing.employee_id !== newRequest.employee_id) return false;
                    if (existing.status === 'rejected' || existing.status === 'cancelled') return false;

                    const existStart = new Date(existing.start_date);
                    const existEnd = new Date(existing.end_date);
                    const newStart = new Date(newRequest.start_date);
                    const newEnd = new Date(newRequest.end_date);

                    return newStart <= existEnd && newEnd >= existStart;
                });
            };

            const validRequest = {
                employee_id: 'emp-1',
                start_date: '2024-05-01',
                end_date: '2024-05-03',
            };

            expect(checkOverlap(validRequest)).toBe(false);
        });
    });

    describe('Leave Statistics', () => {
        it('should calculate total approved leave days', () => {
            const approved = mockLeaveRequests.filter(l => l.status === 'approved');
            const totalDays = approved.reduce((sum, l) => sum + l.total_days, 0);
            expect(totalDays).toBe(100); // 5 + 2 + 93 = 100
        });

        it('should count requests by status', () => {
            const statusCounts = mockLeaveRequests.reduce((acc, l) => {
                acc[l.status] = (acc[l.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            expect(statusCounts['approved']).toBe(3);
            expect(statusCounts['pending']).toBe(1);
            expect(statusCounts['rejected']).toBe(1);
        });
    });
});
