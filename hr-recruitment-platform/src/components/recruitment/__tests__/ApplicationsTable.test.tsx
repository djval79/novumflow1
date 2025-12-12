/**
 * ApplicationsTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils';
import { mockApplications, mockWorkflowStages, createHookMocks } from '@/test/mocks';
import { ApplicationsTable } from '../ApplicationsTable';

// Mock the hooks module
vi.mock('@/hooks', () => {
  const mocks = createHookMocks();
  return {
    useApplications: mocks.useApplications,
    useUpdateApplication: mocks.useUpdateApplication,
    useDeleteApplication: mocks.useDeleteApplication,
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

describe('ApplicationsTable', () => {
  const defaultProps = {
    workflowStages: mockWorkflowStages,
    onAddNew: vi.fn(),
    onView: vi.fn(),
    onScheduleInterview: vi.fn(),
    onStageChange: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application listings correctly', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays applicant email', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    });
  });

  it('shows job title for each application', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      // Both applications are for the same job
      const jobTitles = screen.getAllByText('Senior Software Engineer');
      expect(jobTitles.length).toBeGreaterThan(0);
    });
  });

  it('displays AI score with progress bar', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('72/100')).toBeInTheDocument();
    });
  });

  it('filters applications by search term', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} searchTerm="John" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters applications by email', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} searchTerm="jane.smith" />);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('calls onView when view button is clicked', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(defaultProps.onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'app-1' })
    );
  });

  it('calls onScheduleInterview when calendar button is clicked', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const calendarButtons = screen.getAllByTitle('Schedule Interview');
    fireEvent.click(calendarButtons[0]);

    expect(defaultProps.onScheduleInterview).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'app-1' })
    );
  });

  it('shows stage dropdown with available stages', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      const stageDropdowns = screen.getAllByRole('combobox');
      expect(stageDropdowns.length).toBeGreaterThan(0);
    });
  });

  it('displays application status badge', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('screening')).toBeInTheDocument();
    });
  });

  it('shows empty message when no applications match search', async () => {
    renderWithProviders(<ApplicationsTable {...defaultProps} searchTerm="NonexistentApplicant" />);

    await waitFor(() => {
      expect(screen.getByText('No applications found')).toBeInTheDocument();
    });
  });

  it('filters by selected job', async () => {
    renderWithProviders(
      <ApplicationsTable {...defaultProps} selectedJobId="job-1" />
    );

    await waitFor(() => {
      // All mock applications are for job-1
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('filters by selected stage', async () => {
    renderWithProviders(
      <ApplicationsTable {...defaultProps} selectedStageId="stage-1" />
    );

    await waitFor(() => {
      // Only app-1 is in stage-1
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});
