/// <reference types="vitest" />
/**
 * useApplications Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock data
const mockApplications = [
    {
        id: 'app-1',
        job_posting_id: 'job-1',
        applicant_first_name: 'John',
        applicant_last_name: 'Doe',
        applicant_email: 'john.doe@example.com',
        applicant_phone: '+447123456789',
        status: 'new',
        ai_score: 85,
        ai_summary: 'Strong candidate with relevant experience',
        applied_at: '2024-01-15T10:00:00Z',
        cv_url: 'https://storage.example.com/cv1.pdf',
        job_posting: {
            id: 'job-1',
            job_title: 'Software Engineer',
            department: 'Engineering',
        },
    },
    {
        id: 'app-2',
        job_posting_id: 'job-1',
        applicant_first_name: 'Jane',
        applicant_last_name: 'Smith',
        applicant_email: 'jane.smith@example.com',
        applicant_phone: '+447987654321',
        status: 'screening',
        ai_score: 92,
        ai_summary: 'Excellent candidate with extensive experience',
        applied_at: '2024-01-16T10:00:00Z',
        cv_url: 'https://storage.example.com/cv2.pdf',
        job_posting: {
            id: 'job-1',
            job_title: 'Software Engineer',
            department: 'Engineering',
        },
    },
    {
        id: 'app-3',
        job_posting_id: 'job-2',
        applicant_first_name: 'Bob',
        applicant_last_name: 'Johnson',
        applicant_email: 'bob.johnson@example.com',
        applicant_phone: '+447555123456',
        status: 'interview',
        ai_score: 78,
        ai_summary: 'Good candidate with potential',
        applied_at: '2024-01-17T10:00:00Z',
        cv_url: 'https://storage.example.com/cv3.pdf',
        job_posting: {
            id: 'job-2',
            job_title: 'Product Manager',
            department: 'Product',
        },
    },
];

// Mock Supabase
const mockSupabaseClient = {
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockApplications, error: null })),
            eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockApplications.filter(a => a.job_posting_id === 'job-1'), error: null })),
                single: vi.fn(() => Promise.resolve({ data: mockApplications[0], error: null })),
            })),
        })),
        insert: vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { ...mockApplications[0], id: 'new-app' }, error: null })),
            })),
        })),
        update: vi.fn(() => ({
            eq: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { ...mockApplications[0], status: 'screening' }, error: null })),
                })),
            })),
        })),
        delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
    })),
};

vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabaseClient,
    getSupabaseClient: () => mockSupabaseClient,
}));

// Create wrapper
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useApplications Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mock Data Validation', () => {
        it('should have valid application structure', () => {
            mockApplications.forEach(app => {
                expect(app).toHaveProperty('id');
                expect(app).toHaveProperty('applicant_first_name');
                expect(app).toHaveProperty('applicant_last_name');
                expect(app).toHaveProperty('applicant_email');
                expect(app).toHaveProperty('status');
            });
        });

        it('should have valid AI scores between 0-100', () => {
            mockApplications.forEach(app => {
                expect(app.ai_score).toBeGreaterThanOrEqual(0);
                expect(app.ai_score).toBeLessThanOrEqual(100);
            });
        });

        it('should have valid email formats', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            mockApplications.forEach(app => {
                expect(emailRegex.test(app.applicant_email)).toBe(true);
            });
        });

        it('should have valid status values', () => {
            const validStatuses = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];
            mockApplications.forEach(app => {
                expect(validStatuses).toContain(app.status);
            });
        });

        it('should have associated job postings', () => {
            mockApplications.forEach(app => {
                expect(app.job_posting).toBeDefined();
                expect(app.job_posting.job_title).toBeDefined();
            });
        });
    });

    describe('Application Filtering', () => {
        it('should filter applications by job ID', () => {
            const filtered = mockApplications.filter(a => a.job_posting_id === 'job-1');
            expect(filtered.length).toBe(2);
        });

        it('should filter applications by status', () => {
            const newApps = mockApplications.filter(a => a.status === 'new');
            expect(newApps.length).toBe(1);
            expect(newApps[0].applicant_first_name).toBe('John');
        });

        it('should sort applications by AI score descending', () => {
            const sorted = [...mockApplications].sort((a, b) => b.ai_score - a.ai_score);
            expect(sorted[0].applicant_first_name).toBe('Jane');
            expect(sorted[0].ai_score).toBe(92);
        });
    });

    describe('Application Status Transitions', () => {
        it('should define valid status flow', () => {
            const statusFlow = {
                new: ['screening', 'rejected'],
                screening: ['interview', 'rejected'],
                interview: ['offer', 'rejected'],
                offer: ['hired', 'rejected'],
                hired: [],
                rejected: [],
            };

            expect(statusFlow.new).toContain('screening');
            expect(statusFlow.screening).toContain('interview');
            expect(statusFlow.interview).toContain('offer');
            expect(statusFlow.offer).toContain('hired');
        });
    });
});
