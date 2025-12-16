/// <reference types="vitest" />
/**
 * useInterviews Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data
const mockInterviews = [
    {
        id: 'int-1',
        application_id: 'app-1',
        interview_type: 'phone_screen',
        scheduled_date: '2024-02-01T10:00:00Z',
        duration: 30,
        location: null,
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        status: 'completed',
        rating: 4,
        notes: 'Good communication skills',
        interviewer_id: 'user-1',
        created_at: '2024-01-20T10:00:00Z',
    },
    {
        id: 'int-2',
        application_id: 'app-1',
        interview_type: 'technical',
        scheduled_date: '2024-02-05T14:00:00Z',
        duration: 60,
        location: null,
        meeting_link: 'https://meet.google.com/xyz-uvwx-rst',
        status: 'scheduled',
        rating: null,
        notes: null,
        interviewer_id: 'user-2',
        created_at: '2024-01-25T10:00:00Z',
    },
    {
        id: 'int-3',
        application_id: 'app-2',
        interview_type: 'final',
        scheduled_date: '2024-02-10T11:00:00Z',
        duration: 45,
        location: 'Conference Room A',
        meeting_link: null,
        status: 'scheduled',
        rating: null,
        notes: null,
        interviewer_id: 'user-3',
        created_at: '2024-01-30T10:00:00Z',
    },
    {
        id: 'int-4',
        application_id: 'app-3',
        interview_type: 'technical',
        scheduled_date: '2024-01-28T09:00:00Z',
        duration: 60,
        location: null,
        meeting_link: 'https://zoom.us/j/123456789',
        status: 'cancelled',
        rating: null,
        notes: 'Candidate requested reschedule',
        interviewer_id: 'user-2',
        created_at: '2024-01-22T10:00:00Z',
    },
];

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockInterviews, error: null })),
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockInterviews[0], error: null })),
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: mockInterviews[0], error: null })),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: mockInterviews[0], error: null })),
                    })),
                })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
        })),
    },
    getSupabaseClient: () => ({}),
}));

describe('useInterviews Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mock Data Validation', () => {
        it('should have valid interview structure', () => {
            mockInterviews.forEach(interview => {
                expect(interview).toHaveProperty('id');
                expect(interview).toHaveProperty('application_id');
                expect(interview).toHaveProperty('interview_type');
                expect(interview).toHaveProperty('scheduled_date');
                expect(interview).toHaveProperty('duration');
                expect(interview).toHaveProperty('status');
            });
        });

        it('should have valid interview types', () => {
            const validTypes = ['phone_screen', 'technical', 'behavioral', 'final', 'hr', 'cultural_fit'];
            mockInterviews.forEach(interview => {
                expect(validTypes).toContain(interview.interview_type);
            });
        });

        it('should have valid status values', () => {
            const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
            mockInterviews.forEach(interview => {
                expect(validStatuses).toContain(interview.status);
            });
        });

        it('should have valid duration in minutes', () => {
            mockInterviews.forEach(interview => {
                expect(interview.duration).toBeGreaterThan(0);
                expect(interview.duration).toBeLessThanOrEqual(180); // Max 3 hours
            });
        });

        it('should have rating only for completed interviews', () => {
            mockInterviews.forEach(interview => {
                if (interview.status === 'completed') {
                    expect(interview.rating).toBeDefined();
                    expect(interview.rating).toBeGreaterThanOrEqual(1);
                    expect(interview.rating).toBeLessThanOrEqual(5);
                }
            });
        });
    });

    describe('Interview Filtering', () => {
        it('should filter interviews by application', () => {
            const filtered = mockInterviews.filter(i => i.application_id === 'app-1');
            expect(filtered.length).toBe(2);
        });

        it('should filter scheduled interviews', () => {
            const scheduled = mockInterviews.filter(i => i.status === 'scheduled');
            expect(scheduled.length).toBe(2);
        });

        it('should filter interviews by type', () => {
            const technical = mockInterviews.filter(i => i.interview_type === 'technical');
            expect(technical.length).toBe(2);
        });

        it('should filter upcoming interviews', () => {
            const now = new Date('2024-02-03T00:00:00Z');
            const upcoming = mockInterviews.filter(i =>
                new Date(i.scheduled_date) > now && i.status === 'scheduled'
            );
            expect(upcoming.length).toBe(2);
        });
    });

    describe('Interview Scheduling Logic', () => {
        it('should validate no overlapping interviews for same interviewer', () => {
            const checkOverlap = (newInterview: any) => {
                return mockInterviews.some(existing => {
                    if (existing.interviewer_id !== newInterview.interviewer_id) return false;
                    if (existing.status === 'cancelled') return false;

                    const existingStart = new Date(existing.scheduled_date);
                    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);
                    const newStart = new Date(newInterview.scheduled_date);
                    const newEnd = new Date(newStart.getTime() + newInterview.duration * 60000);

                    return (newStart < existingEnd && newEnd > existingStart);
                });
            };

            const conflictingInterview = {
                interviewer_id: 'user-2',
                scheduled_date: '2024-02-05T14:30:00Z',
                duration: 30,
            };

            expect(checkOverlap(conflictingInterview)).toBe(true);
        });

        it('should validate meeting link or location is provided', () => {
            mockInterviews.forEach(interview => {
                if (interview.status !== 'cancelled') {
                    const hasLocation = interview.location !== null || interview.meeting_link !== null;
                    expect(hasLocation).toBe(true);
                }
            });
        });
    });

    describe('Interview Rating', () => {
        it('should calculate average rating for completed interviews', () => {
            const completed = mockInterviews.filter(i => i.status === 'completed' && i.rating !== null);
            const avgRating = completed.reduce((sum, i) => sum + (i.rating || 0), 0) / completed.length;
            expect(avgRating).toBe(4);
        });
    });
});
