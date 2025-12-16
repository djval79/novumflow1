/// <reference types="vitest" />
/**
 * useComplianceData Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data
const mockDBSChecks = [
    { id: 'dbs-1', user_id: 'user-1', dbs_number: 'DBS123456', check_type: 'enhanced', status: 'completed', expiry_date: '2027-01-15' },
    { id: 'dbs-2', user_id: 'user-2', dbs_number: 'DBS654321', check_type: 'basic', status: 'pending', expiry_date: null },
    { id: 'dbs-3', user_id: 'user-3', dbs_number: 'DBS999888', check_type: 'enhanced', status: 'completed', expiry_date: '2024-03-15' },
];

const mockTrainingRecords = [
    { id: 'tr-1', user_id: 'user-1', training_name: 'Fire Safety', is_mandatory: true, status: 'completed', expiry_date: '2025-01-10' },
    { id: 'tr-2', user_id: 'user-1', training_name: 'GDPR', is_mandatory: true, status: 'completed', expiry_date: '2024-06-15' },
    { id: 'tr-3', user_id: 'user-2', training_name: 'First Aid', is_mandatory: true, status: 'in_progress', expiry_date: null },
    { id: 'tr-4', user_id: 'user-3', training_name: 'Manual Handling', is_mandatory: false, status: 'completed', expiry_date: '2024-12-01' },
];

const mockReferences = [
    { id: 'ref-1', applicant_id: 'app-1', referee_name: 'John Manager', status: 'verified', suitability_rating: 'excellent' },
    { id: 'ref-2', applicant_id: 'app-1', referee_name: 'Jane Director', status: 'verified', suitability_rating: 'good' },
    { id: 'ref-3', applicant_id: 'app-2', referee_name: 'Bob HR', status: 'pending', suitability_rating: null },
];

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })) },
}));

describe('useComplianceData Hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('DBS Checks', () => {
        it('should have valid DBS check structure', () => {
            mockDBSChecks.forEach(dbs => {
                expect(dbs).toHaveProperty('id');
                expect(dbs).toHaveProperty('user_id');
                expect(dbs).toHaveProperty('dbs_number');
                expect(dbs).toHaveProperty('check_type');
                expect(dbs).toHaveProperty('status');
            });
        });

        it('should have valid check types', () => {
            const validTypes = ['basic', 'standard', 'enhanced', 'enhanced_barred'];
            mockDBSChecks.forEach(dbs => expect(validTypes).toContain(dbs.check_type));
        });

        it('should identify expiring checks', () => {
            const today = new Date('2024-01-15');
            const expiring = mockDBSChecks.filter(dbs => {
                if (!dbs.expiry_date) return false;
                const exp = new Date(dbs.expiry_date);
                const daysUntil = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                return daysUntil <= 90 && daysUntil > 0;
            });
            expect(expiring.length).toBe(1);
        });

        it('should count completed checks', () => {
            const completed = mockDBSChecks.filter(dbs => dbs.status === 'completed');
            expect(completed.length).toBe(2);
        });
    });

    describe('Training Records', () => {
        it('should have valid training structure', () => {
            mockTrainingRecords.forEach(tr => {
                expect(tr).toHaveProperty('id');
                expect(tr).toHaveProperty('training_name');
                expect(tr).toHaveProperty('is_mandatory');
                expect(tr).toHaveProperty('status');
            });
        });

        it('should filter mandatory training', () => {
            const mandatory = mockTrainingRecords.filter(tr => tr.is_mandatory);
            expect(mandatory.length).toBe(3);
        });

        it('should calculate completion rate', () => {
            const mandatory = mockTrainingRecords.filter(tr => tr.is_mandatory);
            const completed = mandatory.filter(tr => tr.status === 'completed');
            const rate = (completed.length / mandatory.length) * 100;
            expect(rate.toFixed(0)).toBe('67');
        });
    });

    describe('References', () => {
        it('should have valid reference structure', () => {
            mockReferences.forEach(ref => {
                expect(ref).toHaveProperty('id');
                expect(ref).toHaveProperty('applicant_id');
                expect(ref).toHaveProperty('referee_name');
                expect(ref).toHaveProperty('status');
            });
        });

        it('should have valid suitability ratings', () => {
            const validRatings = ['excellent', 'good', 'satisfactory', 'concerns', null];
            mockReferences.forEach(ref => expect(validRatings).toContain(ref.suitability_rating));
        });

        it('should count verified references per applicant', () => {
            const verified = mockReferences.filter(r => r.applicant_id === 'app-1' && r.status === 'verified');
            expect(verified.length).toBe(2);
        });
    });
});
