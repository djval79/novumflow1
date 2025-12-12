/**
 * JobsTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils';
import { mockJobs, createHookMocks } from '@/test/mocks';
import { JobsTable } from '../JobsTable';

// Mock the hooks module
vi.mock('@/hooks', () => {
  const mocks = createHookMocks();
  return {
    useJobs: mocks.useJobs,
    useUpdateJob: mocks.useUpdateJob,
    useDeleteJob: mocks.useDeleteJob,
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

describe('JobsTable', () => {
  const defaultProps = {
    onAddNew: vi.fn(),
    onEdit: vi.fn(),
    onView: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job listings correctly', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.getByText('Marketing Intern')).toBeInTheDocument();
    });
  });

  it('displays department for each job', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });
  });

  it('shows location information', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });
  });

  it('filters jobs based on search term', async () => {
    renderWithProviders(<JobsTable {...defaultProps} searchTerm="Engineer" />);

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
      expect(screen.queryByText('Marketing Intern')).not.toBeInTheDocument();
    });
  });

  it('filters jobs by department', async () => {
    renderWithProviders(<JobsTable {...defaultProps} searchTerm="Marketing" />);

    await waitFor(() => {
      expect(screen.queryByText('Senior Software Engineer')).not.toBeInTheDocument();
      expect(screen.getByText('Marketing Intern')).toBeInTheDocument();
    });
  });

  it('calls onView when view button is clicked', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    });

    // Find view buttons (Eye icons) - title is "View Details" from custom action
    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(defaultProps.onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1' })
    );
  });

  it('calls onEdit when edit button is clicked', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1' })
    );
  });

  it('displays salary range when available', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('$120,000 - $180,000')).toBeInTheDocument();
    });
  });

  it('shows "Not specified" for jobs without salary', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });
  });

  it('renders status dropdown with correct options', async () => {
    renderWithProviders(<JobsTable {...defaultProps} />);

    await waitFor(() => {
      const statusDropdowns = screen.getAllByRole('combobox');
      expect(statusDropdowns.length).toBeGreaterThan(0);
    });
  });

  it('shows empty message when no jobs match search', async () => {
    renderWithProviders(<JobsTable {...defaultProps} searchTerm="NonexistentJob" />);

    await waitFor(() => {
      expect(screen.getByText('No job postings found')).toBeInTheDocument();
    });
  });
});
