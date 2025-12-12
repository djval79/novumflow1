/**
 * ReviewsTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils';
import { mockReviews, createHookMocks } from '@/test/mocks';
import { ReviewsTable } from '../ReviewsTable';

// Mock the hooks module
vi.mock('@/hooks', () => {
  const mocks = createHookMocks();
  return {
    usePerformanceReviews: mocks.usePerformanceReviews,
    useDeletePerformanceReview: mocks.useDeletePerformanceReview,
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

describe('ReviewsTable', () => {
  const defaultProps = {
    isAdmin: true,
    onAddNew: vi.fn(),
    onView: vi.fn(),
    onRate: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders review listings correctly', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Williams')).toBeInTheDocument();
    });
  });

  it('displays employee department', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });
  });

  it('shows review type and frequency', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Quarterly Review')).toBeInTheDocument();
      expect(screen.getByText('Annual Review')).toBeInTheDocument();
      expect(screen.getByText('quarterly')).toBeInTheDocument();
      expect(screen.getByText('annual')).toBeInTheDocument();
    });
  });

  it('displays status badges', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('shows rating for completed reviews', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });
  });

  it('shows "Not rated" for pending reviews', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Not rated')).toBeInTheDocument();
    });
  });

  it('filters reviews by search term', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} searchTerm="Alice" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Williams')).not.toBeInTheDocument();
    });
  });

  it('filters by review type', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} searchTerm="Quarterly" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Williams')).not.toBeInTheDocument();
    });
  });

  it('calls onView when view button is clicked', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(defaultProps.onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rev-1' })
    );
  });

  it('calls onRate for pending reviews', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    const rateButtons = screen.getAllByTitle('Rate Review');
    if (rateButtons.length > 0) {
      fireEvent.click(rateButtons[0]);
      expect(defaultProps.onRate).toHaveBeenCalled();
    }
  });

  it('shows delete button for admin users', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} isAdmin={true} />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('hides delete button for non-admin users', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} isAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });
  });

  it('displays review period dates', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} />);

    await waitFor(() => {
      // Check for period formatted dates - component shows "Jan 1 - Mar 31, 2024"
      // Multiple dates contain 2024 so use getAllByText
      const dateElements = screen.getAllByText(/2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('shows empty message when no reviews match search', async () => {
    renderWithProviders(<ReviewsTable {...defaultProps} searchTerm="NonexistentEmployee" />);

    await waitFor(() => {
      expect(screen.getByText('No reviews found')).toBeInTheDocument();
    });
  });
});
