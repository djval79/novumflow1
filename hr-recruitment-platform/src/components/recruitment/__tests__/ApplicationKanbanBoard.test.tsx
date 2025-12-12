/**
 * ApplicationKanbanBoard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils';
import { mockApplications, mockWorkflowStages, createHookMocks } from '@/test/mocks';
import { ApplicationKanbanBoard } from '../ApplicationKanbanBoard';

// Mock the hooks module
vi.mock('@/hooks', () => {
  const mocks = createHookMocks();
  return {
    useApplications: mocks.useApplications,
    useUpdateApplication: mocks.useUpdateApplication,
  };
});

// Mock the logger
vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    track: vi.fn(),
  },
}));

describe('ApplicationKanbanBoard', () => {
  const defaultProps = {
    selectedWorkflowId: 'wf-1',
    workflowStages: mockWorkflowStages,
    onViewApplication: vi.fn(),
    onScheduleInterview: vi.fn(),
    onStageChange: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts to select workflow when none selected', async () => {
    renderWithProviders(
      <ApplicationKanbanBoard {...defaultProps} selectedWorkflowId="all" />
    );

    await waitFor(() => {
      expect(screen.getByText('Select a Workflow')).toBeInTheDocument();
      expect(screen.getByText('Please select a specific workflow to view the Kanban board.')).toBeInTheDocument();
    });
  });

  it('renders stage columns when workflow selected', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      // Should show all stages for the selected workflow
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Screening')).toBeInTheDocument();
      expect(screen.getByText('Interview')).toBeInTheDocument();
      expect(screen.getByText('Offer')).toBeInTheDocument();
      expect(screen.getByText('Hired')).toBeInTheDocument();
    });
  });

  it('displays application cards in correct columns', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      // Check that applicants are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows AI score on application cards', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
    });
  });

  it('displays job title on application cards', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      const jobTitles = screen.getAllByText('Senior Software Engineer');
      expect(jobTitles.length).toBeGreaterThan(0);
    });
  });

  it('shows application count in column headers', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      // Look for count badges in column headers
      // The count depends on how many applications are in each stage
      const counts = screen.getAllByText(/^\d+$/);
      expect(counts.length).toBeGreaterThan(0);
    });
  });

  it('filters applications by search term', async () => {
    renderWithProviders(
      <ApplicationKanbanBoard {...defaultProps} searchTerm="John" />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('calls onViewApplication when view button clicked', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find view buttons on cards
    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(defaultProps.onViewApplication).toHaveBeenCalled();
  });

  it('calls onScheduleInterview when calendar button clicked', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const calendarButtons = screen.getAllByTitle('Schedule Interview');
    fireEvent.click(calendarButtons[0]);

    expect(defaultProps.onScheduleInterview).toHaveBeenCalled();
  });

  it('shows empty state for columns with no applications', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      // Some columns should show "No applications in this stage"
      const emptyMessages = screen.getAllByText('No applications in this stage');
      expect(emptyMessages.length).toBeGreaterThan(0);
    });
  });

  it('displays applicant email on cards', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  it('shows application date on cards', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      // Dates should be formatted as "MMM d"
      expect(screen.getByText('Jan 20')).toBeInTheDocument();
      expect(screen.getByText('Jan 18')).toBeInTheDocument();
    });
  });

  it('makes cards draggable', async () => {
    renderWithProviders(<ApplicationKanbanBoard {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Cards should have draggable attribute
    const card = screen.getByText('John Doe').closest('[draggable]');
    expect(card).toHaveAttribute('draggable', 'true');
  });
});
