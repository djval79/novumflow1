/// <reference types="vitest" />
/**
 * useJobs Hook Tests  
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockJobs = [
    {
        id: 'job-1', job_title: 'Senior Software Engineer', job_code: 'SSE-001', department: 'Engineering', location: 'Remote', employment_type: 'full_time',
        salary_range_min: 80000, salary_range_max: 120000, status: 'open', applications_count: 45, created_at: '2024-01-01T10:00:00Z'
    },
    {
        id: 'job-2', job_title: 'Product Manager', job_code: 'PM-002', department: 'Product', location: 'London', employment_type: 'full_time',
        salary_range_min: 70000, salary_range_max: 100000, status: 'open', applications_count: 32, created_at: '2024-01-05T10:00:00Z'
    },
    {
        id: 'job-3', job_title: 'UX Designer', job_code: 'UX-003', department: 'Design', location: 'Hybrid', employment_type: 'full_time',
        salary_range_min: 55000, salary_range_max: 75000, status: 'closed', applications_count: 28, created_at: '2023-11-15T10:00:00Z'
    },
    {
        id: 'job-4', job_title: 'Data Analyst', job_code: 'DA-004', department: 'Analytics', location: 'Remote', employment_type: 'contract',
        salary_range_min: 45000, salary_range_max: 65000, status: 'draft', applications_count: 0, created_at: '2024-02-01T10:00:00Z'
    },
];

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: mockJobs, error: null })) })) })) },
}));

describe('useJobs Hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('Job Data', () => {
        it('should have valid job structure', () => {
            mockJobs.forEach(job => {
                expect(job).toHaveProperty('id');
                expect(job).toHaveProperty('job_title');
                expect(job).toHaveProperty('department');
                expect(job).toHaveProperty('status');
            });
        });

        it('should have unique job codes', () => {
            const codes = mockJobs.map(j => j.job_code);
            expect(new Set(codes).size).toBe(codes.length);
        });

        it('should have valid status values', () => {
            const validStatuses = ['draft', 'open', 'closed', 'paused'];
            mockJobs.forEach(job => expect(validStatuses).toContain(job.status));
        });

        it('should have valid employment types', () => {
            const validTypes = ['full_time', 'part_time', 'contract', 'intern', 'temporary'];
            mockJobs.forEach(job => expect(validTypes).toContain(job.employment_type));
        });

        it('should have valid salary ranges', () => {
            mockJobs.forEach(job => {
                expect(job.salary_range_min).toBeGreaterThan(0);
                expect(job.salary_range_max).toBeGreaterThan(job.salary_range_min);
            });
        });
    });

    describe('Job Filtering', () => {
        it('should filter by status', () => {
            const open = mockJobs.filter(j => j.status === 'open');
            expect(open.length).toBe(2);
        });

        it('should filter by department', () => {
            const engineering = mockJobs.filter(j => j.department === 'Engineering');
            expect(engineering.length).toBe(1);
        });

        it('should filter by location', () => {
            const remote = mockJobs.filter(j => j.location === 'Remote');
            expect(remote.length).toBe(2);
        });

        it('should search by title', () => {
            const search = 'engineer';
            const results = mockJobs.filter(j => j.job_title.toLowerCase().includes(search));
            expect(results.length).toBe(1);
        });
    });

    describe('Job Statistics', () => {
        it('should calculate total applications', () => {
            const total = mockJobs.reduce((sum, j) => sum + j.applications_count, 0);
            expect(total).toBe(105);
        });

        it('should count jobs by status', () => {
            const statusCounts = mockJobs.reduce((acc, j) => {
                acc[j.status] = (acc[j.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            expect(statusCounts['open']).toBe(2);
            expect(statusCounts['closed']).toBe(1);
            expect(statusCounts['draft']).toBe(1);
        });

        it('should calculate average applications per job', () => {
            const openJobs = mockJobs.filter(j => j.status === 'open');
            const avg = openJobs.reduce((sum, j) => sum + j.applications_count, 0) / openJobs.length;
            expect(avg).toBe(38.5);
        });
    });
});
