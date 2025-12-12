/**
 * ReviewsTable Component
 * 
 * Displays performance reviews using GenericCRUDTable and React Query hooks
 * Supports filtering, rating, and viewing review details
 */

import React, { useMemo } from 'react';
import { Eye, Star, Trash2, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { usePerformanceReviews, useDeletePerformanceReview, PerformanceReview, ReviewFilters } from '@/hooks';
import { log } from '@/lib/logger';

interface ReviewsTableProps {
  searchTerm?: string;
  statusFilter?: string;
  isAdmin?: boolean;
  onAddNew: () => void;
  onView: (review: PerformanceReview) => void;
  onRate: (review: PerformanceReview) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ReviewsTable({
  searchTerm = '',
  statusFilter = 'all',
  isAdmin = false,
  onAddNew,
  onView,
  onRate,
  onSuccess,
  onError,
}: ReviewsTableProps) {
  // Build filters for the query
  const filters: ReviewFilters = {};
  if (statusFilter !== 'all') {
    filters.status = statusFilter;
  }

  // Fetch reviews using React Query
  const { data: reviews = [], isLoading, error } = usePerformanceReviews(filters);
  
  const deleteReviewMutation = useDeletePerformanceReview();

  // Filter reviews based on search term
  // Note: employee data comes as 'employees' from the joined query
  const filteredReviews = useMemo(() => {
    if (!searchTerm) return reviews;
    const lowerSearch = searchTerm.toLowerCase();
    return reviews.filter(review => {
      const employee = review.employees || review.employee;
      const reviewType = review.performance_review_types || review.review_types || review.review_type;
      return (
        employee?.first_name?.toLowerCase().includes(lowerSearch) ||
        employee?.last_name?.toLowerCase().includes(lowerSearch) ||
        reviewType?.name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [reviews, searchTerm]);

  // Handle review deletion
  const handleDelete = async (review: PerformanceReview) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await deleteReviewMutation.mutateAsync(review.id);
      log.track('review_deleted', { reviewId: review.id });
      onSuccess?.('Review deleted successfully');
    } catch (err: any) {
      log.error('Failed to delete review', { error: err.message });
      onError?.(err.message || 'Failed to delete review');
    }
  };

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  // Define table columns
  // Note: Handle both naming conventions from joined data (employees vs employee, performance_review_types vs review_type)
  const columns: Column<PerformanceReview>[] = useMemo(() => [
    {
      key: 'employee',
      label: 'Employee',
      sortable: true,
      render: (review) => {
        const employee = review.employees || review.employee;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {employee?.first_name} {employee?.last_name}
              </div>
              <div className="text-sm text-gray-500">{employee?.department}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'review_type',
      label: 'Review Type',
      sortable: true,
      render: (review) => {
        const reviewType = review.performance_review_types || review.review_types || review.review_type;
        return (
          <div>
            <div className="text-sm text-gray-900">{reviewType?.name}</div>
            <div className="text-sm text-gray-500">{reviewType?.frequency}</div>
          </div>
        );
      },
    },
    {
      key: 'review_period',
      label: 'Period',
      render: (review) => (
        <div className="text-sm text-gray-500">
          {review.review_period_start && format(new Date(review.review_period_start), 'MMM d, yyyy')} -<br />
          {review.review_period_end && format(new Date(review.review_period_end), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'review_due_date',
      label: 'Due Date',
      sortable: true,
      render: (review) => (
        <span className="text-sm text-gray-900">
          {review.review_due_date && format(new Date(review.review_due_date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (review) => getStatusBadge(review.status),
    },
    {
      key: 'overall_rating',
      label: 'Rating',
      sortable: true,
      render: (review) => {
        if (!review.overall_rating) {
          return <span className="text-sm text-gray-400">Not rated</span>;
        }
        return (
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
            <span className="text-sm font-medium text-gray-900">
              {typeof review.overall_rating === 'number' 
                ? review.overall_rating.toFixed(1) 
                : review.overall_rating}
            </span>
          </div>
        );
      },
    },
  ], []);

  // Define row actions
  const actions: Action<PerformanceReview>[] = useMemo(() => {
    const actionsList: Action<PerformanceReview>[] = [
      {
        label: 'View Details',
        icon: Eye,
        onClick: onView,
        variant: 'primary',
      },
      {
        label: 'Rate Review',
        icon: Star,
        onClick: onRate,
        variant: 'default',
        show: (review) => review.status !== 'completed',
      },
    ];

    if (isAdmin) {
      actionsList.push({
        label: 'Delete',
        icon: Trash2,
        onClick: handleDelete,
        variant: 'danger',
      });
    }

    return actionsList;
  }, [onView, onRate, isAdmin]);

  return (
    <GenericCRUDTable
      data={filteredReviews}
      columns={columns}
      loading={isLoading}
      error={error?.message}
      actions={actions}
      onAdd={isAdmin ? onAddNew : undefined}
      searchable={false}
      emptyMessage="No reviews found"
    />
  );
}

export default ReviewsTable;
