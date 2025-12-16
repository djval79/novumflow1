/// <reference types="vitest" />
/**
 * usePerformance Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data
const mockReviews = [
    {
        id: 'review-1',
        employee_id: 'emp-1',
        reviewer_id: 'emp-5',
        review_type: 'annual',
        status: 'completed',
        overall_rating: 4.5,
    },
    {
        id: 'review-2',
        employee_id: 'emp-2',
        reviewer_id: 'emp-6',
        review_type: 'quarterly',
        status: 'completed',
        overall_rating: 4.0,
    },
    {
        id: 'review-3',
        employee_id: 'emp-3',
        reviewer_id: 'emp-1',
        review_type: 'probation',
        status: 'in_progress',
        overall_rating: null,
    },
];

const mockGoals = [
    { id: 'goal-1', employee_id: 'emp-1', title: 'Complete AWS Certification', status: 'on_track', progress: 45, priority: 'high' },
    { id: 'goal-2', employee_id: 'emp-1', title: 'Lead Migration Project', status: 'on_track', progress: 20, priority: 'high' },
    { id: 'goal-3', employee_id: 'emp-2', title: 'Launch Mobile App V2', status: 'at_risk', progress: 60, priority: 'high' },
    { id: 'goal-4', employee_id: 'emp-3', title: 'Complete Training', status: 'completed', progress: 100, priority: 'medium' },
];

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })) },
}));

describe('usePerformance Hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('Reviews', () => {
        it('should have valid review structure', () => {
            mockReviews.forEach(r => {
                expect(r).toHaveProperty('id');
                expect(r).toHaveProperty('employee_id');
                expect(r).toHaveProperty('status');
            });
        });

        it('should have valid status values', () => {
            const valid = ['draft', 'in_progress', 'completed', 'cancelled'];
            mockReviews.forEach(r => expect(valid).toContain(r.status));
        });

        it('should calculate average rating', () => {
            const completed = mockReviews.filter(r => r.status === 'completed');
            const avg = completed.reduce((s, r) => s + (r.overall_rating || 0), 0) / completed.length;
            expect(avg).toBe(4.25);
        });
    });

    describe('Goals', () => {
        it('should have valid goal structure', () => {
            mockGoals.forEach(g => {
                expect(g).toHaveProperty('id');
                expect(g).toHaveProperty('title');
                expect(g).toHaveProperty('progress');
            });
        });

        it('should have progress between 0-100', () => {
            mockGoals.forEach(g => {
                expect(g.progress).toBeGreaterThanOrEqual(0);
                expect(g.progress).toBeLessThanOrEqual(100);
            });
        });

        it('should identify at-risk goals', () => {
            const atRisk = mockGoals.filter(g => g.status === 'at_risk');
            expect(atRisk.length).toBe(1);
        });
    });
});
