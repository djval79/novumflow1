/**
 * KPIsTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '@/test/utils';
import { mockKPIs, createHookMocks } from '@/test/mocks';
import { KPIsTable } from '../KPIsTable';

// Mock the hooks module
vi.mock('@/hooks', () => {
  const mocks = createHookMocks();
  return {
    useKPIs: mocks.useKPIs,
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

describe('KPIsTable', () => {
  const defaultProps = {
    isAdmin: true,
    onAddNew: vi.fn(),
    onEdit: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI listings correctly', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Customer Satisfaction Score')).toBeInTheDocument();
      expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    });
  });

  it('displays KPI descriptions', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Average CSAT rating from customer surveys')).toBeInTheDocument();
      expect(screen.getByText('Quarter-over-quarter revenue increase')).toBeInTheDocument();
    });
  });

  it('shows category badges', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('customer success')).toBeInTheDocument();
      expect(screen.getByText('sales')).toBeInTheDocument();
    });
  });

  it('displays measurement units', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      // Both KPIs use '%' as measurement unit
      const percentUnits = screen.getAllByText('%');
      expect(percentUnits.length).toBeGreaterThan(0);
    });
  });

  it('shows target values', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('90 %')).toBeInTheDocument();
      expect(screen.getByText('15 %')).toBeInTheDocument();
    });
  });

  it('displays calculation method', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('average')).toBeInTheDocument();
      expect(screen.getByText('percentage change')).toBeInTheDocument();
    });
  });

  it('shows active status badges', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThan(0);
    });
  });

  it('filters KPIs by search term', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} searchTerm="Customer" />);

    await waitFor(() => {
      expect(screen.getByText('Customer Satisfaction Score')).toBeInTheDocument();
      expect(screen.queryByText('Revenue Growth')).not.toBeInTheDocument();
    });
  });

  it('filters KPIs by category', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} searchTerm="sales" />);

    await waitFor(() => {
      expect(screen.queryByText('Customer Satisfaction Score')).not.toBeInTheDocument();
      expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    });
  });

  it('calls onEdit when edit button is clicked', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Customer Satisfaction Score')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'kpi-1' })
    );
  });

  it('shows add button for admin users', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Add New')).toBeInTheDocument();
    });
  });

  it('hides add button for non-admin users', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} isAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText('Customer Satisfaction Score')).toBeInTheDocument();
      expect(screen.queryByText('Add New')).not.toBeInTheDocument();
    });
  });

  it('shows deactivate button for admin users on active KPIs', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} isAdmin={true} />);

    await waitFor(() => {
      const deactivateButtons = screen.getAllByTitle('Deactivate');
      expect(deactivateButtons.length).toBeGreaterThan(0);
    });
  });

  it('hides deactivate button for non-admin users', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} isAdmin={false} />);

    await waitFor(() => {
      expect(screen.getByText('Customer Satisfaction Score')).toBeInTheDocument();
      expect(screen.queryByTitle('Deactivate')).not.toBeInTheDocument();
    });
  });

  it('shows empty message when no KPIs match search', async () => {
    renderWithProviders(<KPIsTable {...defaultProps} searchTerm="NonexistentKPI" />);

    await waitFor(() => {
      expect(screen.getByText('No KPI definitions found')).toBeInTheDocument();
    });
  });
});
