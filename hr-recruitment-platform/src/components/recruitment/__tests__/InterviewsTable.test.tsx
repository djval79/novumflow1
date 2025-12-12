/**
 * InterviewsTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils';
import { mockInterviews, createHookMocks } from '@/test/mocks';
import { InterviewsTable } from '../InterviewsTable';

// Mock the hooks module
vi.mock('@/hooks', () => {
  const mocks = createHookMocks();
  return {
    useInterviews: mocks.useInterviews,
    useUpdateInterview: mocks.useUpdateInterview,
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

describe('InterviewsTable', () => {
  const defaultProps = {
    onAddNew: vi.fn(),
    onEdit: vi.fn(),
    onReschedule: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders interview listings correctly', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      // Check for interview types
      expect(screen.getByText('phone screen')).toBeInTheDocument();
      expect(screen.getByText('technical')).toBeInTheDocument();
    });
  });

  it('displays application ID (truncated)', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      // Application IDs are truncated
      expect(screen.getByText('app-1...')).toBeInTheDocument();
      expect(screen.getByText('app-2...')).toBeInTheDocument();
    });
  });

  it('shows interview status badges', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('scheduled')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('displays meeting link when available', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      const meetingLink = screen.getByText('Join Meeting');
      expect(meetingLink).toBeInTheDocument();
      expect(meetingLink.closest('a')).toHaveAttribute('href', 'https://zoom.us/j/123456');
    });
  });

  it('shows location when no meeting link', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Office - Room A')).toBeInTheDocument();
    });
  });

  it('displays interview duration', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
    });
  });

  it('shows rating for completed interviews', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('4/5')).toBeInTheDocument();
    });
  });

  it('shows N/A for interviews without rating', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  it('filters interviews by search term', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} searchTerm="technical" />);

    await waitFor(() => {
      expect(screen.getByText('technical')).toBeInTheDocument();
      expect(screen.queryByText('phone screen')).not.toBeInTheDocument();
    });
  });

  it('calls onReschedule for scheduled interviews', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('scheduled')).toBeInTheDocument();
    });

    // Find reschedule button (Calendar icon)
    const rescheduleButtons = screen.getAllByTitle('Reschedule');
    if (rescheduleButtons.length > 0) {
      fireEvent.click(rescheduleButtons[0]);
      expect(defaultProps.onReschedule).toHaveBeenCalled();
    }
  });

  it('calls onEdit when edit button is clicked', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('phone screen')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it('shows empty message when no interviews match search', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} searchTerm="NonexistentInterview" />);

    await waitFor(() => {
      expect(screen.getByText('No interviews scheduled')).toBeInTheDocument();
    });
  });

  it('formats scheduled date correctly', async () => {
    renderWithProviders(<InterviewsTable {...defaultProps} />);

    await waitFor(() => {
      // Date should be formatted as "MMM dd, yyyy"
      expect(screen.getByText('Feb 01, 2024')).toBeInTheDocument();
    });
  });
});
