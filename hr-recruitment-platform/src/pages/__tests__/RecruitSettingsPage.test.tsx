import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecruitSettingsPage from '../RecruitSettingsPage';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';

// Mock contexts
vi.mock('@/contexts/TenantContext');
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock components that might be complex
vi.mock('@/components/FormBuilder/FormBuilder', () => ({
    default: () => <div data-testid="form-builder">Mock Form Builder</div>,
}));

vi.mock('@/components/WorkflowEditor', () => ({
    default: () => <div data-testid="workflow-editor">Mock Workflow Editor</div>,
}));

describe('RecruitSettingsPage', () => {
    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };

    const createSupabaseMock = (data: any = null) => {
        const mock = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            then: (onSuccess: any) => Promise.resolve({ data, error: null }).then(onSuccess),
        };
        return mock;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useTenant as any).mockReturnValue({ currentTenant: mockTenant });
    });

    it('renders general settings by default', async () => {
        const mockSettings = {
            id: '1',
            auto_schedule_reminders: true,
            auto_acknowledge_applications: false,
            enable_ai_screening: true,
        };
        (supabase.from as any).mockReturnValue(createSupabaseMock(mockSettings));

        render(<RecruitSettingsPage />);

        await waitFor(() => {
            expect(screen.getByText('General Settings')).toBeInTheDocument();
            expect(screen.getByText('Automated Interview Reminders')).toBeInTheDocument();
        });
    });

    it('switches tabs correctly', async () => {
        (supabase.from as any).mockReturnValue(createSupabaseMock([]));

        render(<RecruitSettingsPage />);

        const criteriaTab = screen.getByText('Evaluation Criteria');
        fireEvent.click(criteriaTab);

        await waitFor(() => {
            expect(screen.getByText('Add Criterion')).toBeInTheDocument();
        });
    });

    it('loads evaluation criteria', async () => {
        const mockCriteria = [
            { id: '1', name: 'Technical Skills', weight: 50, max_score: 5, description: 'Test' },
            { id: '2', name: 'Cultural Fit', weight: 40, max_score: 4, description: 'Test' },
        ];

        // Settings call first, then criteria call
        (supabase.from as any).mockReturnValueOnce(createSupabaseMock({})) // Settings
            .mockReturnValueOnce(createSupabaseMock(mockCriteria)); // Criteria

        render(<RecruitSettingsPage />);

        // Switch to criteria tab
        fireEvent.click(screen.getByText('Evaluation Criteria'));

        await waitFor(() => {
            expect(screen.getByText('Technical Skills')).toBeInTheDocument();
            expect(screen.getByText('Cultural Fit')).toBeInTheDocument();
            expect(screen.getByText('Weight: 50% | Max Score: 5')).toBeInTheDocument();
            expect(screen.getByText('Weight: 40% | Max Score: 4')).toBeInTheDocument();
        });
    });

    it('loads onboarding checklists', async () => {
        const mockChecklists = [
            { id: '1', name: 'Basic Onboarding', tasks: ['Task 1', 'Task 2'], description: 'Test' },
        ];

        // Settings call first, then checklists call
        (supabase.from as any).mockReturnValueOnce(createSupabaseMock({})) // Settings
            .mockReturnValueOnce(createSupabaseMock(mockChecklists)); // Checklists

        render(<RecruitSettingsPage />);

        // Switch to checklists tab
        fireEvent.click(screen.getByText('Onboarding Checklists'));

        await waitFor(() => {
            expect(screen.getByText('Basic Onboarding')).toBeInTheDocument();
            expect(screen.getByText('Task 1')).toBeInTheDocument();
            expect(screen.getByText('Task 2')).toBeInTheDocument();
        });
    });
});
