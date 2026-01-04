import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimeClock from '../TimeClock';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

// Mock contexts
vi.mock('@/contexts/AuthContext');
vi.mock('@/contexts/TenantContext');
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
    log: {
        info: vi.fn(),
        error: vi.fn(),
        track: vi.fn(),
    },
}));

describe('TimeClock', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };

    const createSupabaseMock = (data: any = null) => {
        const mock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data, error: null }),
            gte: vi.fn().mockReturnThis(),
            then: (onSuccess: any) => Promise.resolve({ data, error: null }).then(onSuccess),
        };
        return mock;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser });
        (useTenant as any).mockReturnValue({ currentTenant: mockTenant });
    });

    it('renders clock in button when not clocked in', async () => {
        (supabase.from as any).mockReturnValue(createSupabaseMock(null));

        render(<TimeClock />);

        await waitFor(() => {
            expect(screen.getByText('Clock In')).toBeInTheDocument();
        });
    });

    it('handles clock in flow', async () => {
        const mockEntry = {
            id: 'entry-1',
            check_in_time: new Date().toISOString(),
            status: 'active',
            break_duration_minutes: 0,
            employee_id: mockUser.id,
            tenant_id: mockTenant.id,
        };

        // First call for active entry (returns null), second call for recent entries (returns empty array)
        // Actually, it's easier to just mock the flow.
        const fromMock = createSupabaseMock(null);
        (supabase.from as any).mockReturnValue(fromMock);

        render(<TimeClock />);

        const clockInButton = await screen.findByText('Clock In');

        // Update mock for the insert call
        fromMock.single.mockResolvedValue({ data: mockEntry, error: null });

        fireEvent.click(clockInButton);

        await waitFor(() => {
            expect(screen.getByText('Clock Out')).toBeInTheDocument();
            expect(screen.getByText('Take Break')).toBeInTheDocument();
        });
    });

    it('handles break toggle', async () => {
        const mockEntry = {
            id: 'entry-1',
            check_in_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            status: 'active',
            break_duration_minutes: 0,
        };

        (supabase.from as any).mockReturnValue(createSupabaseMock(mockEntry));

        render(<TimeClock />);

        const breakButton = await screen.findByText('Take Break');
        fireEvent.click(breakButton);

        expect(screen.getByText('End Break')).toBeInTheDocument();
    });

    it('calculates stats correctly', async () => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const mockEntries = [
            {
                id: '1',
                check_in_time: `${todayStr}T09:00:00`,
                check_out_time: `${todayStr}T11:00:00`, // 2 hours later
                break_duration_minutes: 30,
                status: 'present',
            }
        ];

        (supabase.from as any).mockReturnValue(createSupabaseMock(mockEntries));
        (supabase.from as any).mockReturnValueOnce(createSupabaseMock(null))
            .mockReturnValueOnce(createSupabaseMock(mockEntries));

        render(<TimeClock />);

        await waitFor(() => {
            // 2 hours - 30 mins = 1.5 hours
            // Multiple elements will show 1.5 (Today, This Week, and the entry itself)
            const statValues = screen.getAllByText(/1\.5/i);
            expect(statValues.length).toBeGreaterThan(0);
            expect(screen.getAllByText(/h/i, { selector: 'p' }).length).toBeGreaterThan(0);
        });
    });
});
