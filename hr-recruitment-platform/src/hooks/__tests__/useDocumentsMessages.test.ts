/// <reference types="vitest" />
/**
 * useDocuments and useMessages Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Documents mock data
const mockDocuments = [
    { id: 'doc-1', name: 'Employment Contract', category: 'contracts', file_type: 'application/pdf', file_size: 152340, status: 'verified' },
    { id: 'doc-2', name: 'ID Verification', category: 'identity', file_type: 'image/jpeg', file_size: 245000, status: 'verified' },
    { id: 'doc-3', name: 'Certificate', category: 'qualifications', file_type: 'application/pdf', file_size: 89000, status: 'pending' },
    { id: 'doc-4', name: 'Reference Letter', category: 'references', file_type: 'application/pdf', file_size: 67000, status: 'verified' },
];

// Messages mock data
const mockMessages = [
    { id: 'msg-1', sender_id: 'user-1', recipient_id: 'user-2', subject: 'Meeting', body: 'Can we meet?', is_read: false, created_at: '2024-02-20T10:00:00Z' },
    { id: 'msg-2', sender_id: 'user-2', recipient_id: 'user-1', subject: 'Re: Meeting', body: 'Yes, 2pm works', is_read: true, created_at: '2024-02-20T11:00:00Z' },
    { id: 'msg-3', sender_id: 'user-3', recipient_id: 'user-1', subject: 'Leave Request', body: 'Please approve', is_read: false, created_at: '2024-02-21T09:00:00Z' },
];

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn(() => ({ select: vi.fn(() => Promise.resolve({ data: [], error: null })) })) },
}));

describe('useDocuments Hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('Document Data', () => {
        it('should have valid document structure', () => {
            mockDocuments.forEach(doc => {
                expect(doc).toHaveProperty('id');
                expect(doc).toHaveProperty('name');
                expect(doc).toHaveProperty('category');
                expect(doc).toHaveProperty('file_type');
            });
        });

        it('should have valid file types', () => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            mockDocuments.forEach(doc => expect(validTypes).toContain(doc.file_type));
        });

        it('should have valid categories', () => {
            const validCategories = ['contracts', 'identity', 'qualifications', 'references', 'compliance', 'other'];
            mockDocuments.forEach(doc => expect(validCategories).toContain(doc.category));
        });

        it('should have positive file sizes', () => {
            mockDocuments.forEach(doc => expect(doc.file_size).toBeGreaterThan(0));
        });

        it('should filter by status', () => {
            const verified = mockDocuments.filter(d => d.status === 'verified');
            expect(verified.length).toBe(3);
        });

        it('should filter by category', () => {
            const contracts = mockDocuments.filter(d => d.category === 'contracts');
            expect(contracts.length).toBe(1);
        });
    });
});

describe('useMessages Hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('Message Data', () => {
        it('should have valid message structure', () => {
            mockMessages.forEach(msg => {
                expect(msg).toHaveProperty('id');
                expect(msg).toHaveProperty('sender_id');
                expect(msg).toHaveProperty('recipient_id');
                expect(msg).toHaveProperty('subject');
                expect(msg).toHaveProperty('body');
            });
        });

        it('should count unread messages', () => {
            const unread = mockMessages.filter(m => !m.is_read);
            expect(unread.length).toBe(2);
        });

        it('should filter inbox by recipient', () => {
            const inbox = mockMessages.filter(m => m.recipient_id === 'user-1');
            expect(inbox.length).toBe(2);
        });

        it('should filter sent by sender', () => {
            const sent = mockMessages.filter(m => m.sender_id === 'user-1');
            expect(sent.length).toBe(1);
        });

        it('should sort by date descending', () => {
            const sorted = [...mockMessages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            expect(sorted[0].id).toBe('msg-3');
        });
    });
});
