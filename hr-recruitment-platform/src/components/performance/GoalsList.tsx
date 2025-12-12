/**
 * GoalsList Component
 * 
 * Displays performance goals in a card-based layout
 * Supports filtering, editing, and progress tracking
 */

import React, { useMemo } from 'react';
import { Target, Users, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAllPerformanceGoals, useDeleteGoal, PerformanceGoal, GoalFilters } from '@/hooks';
import { log } from '@/lib/logger';

interface GoalsListProps {
  searchTerm?: string;
  statusFilter?: string;
  isAdmin?: boolean;
  onAddNew: () => void;
  onEdit: (goal: PerformanceGoal) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function GoalsList({
  searchTerm = '',
  statusFilter = 'all',
  isAdmin = false,
  onAddNew,
  onEdit,
  onSuccess,
  onError,
}: GoalsListProps) {
  // Build filters for the query
  const filters: GoalFilters = {};
  if (statusFilter !== 'all') {
    filters.status = statusFilter;
  }

  // Fetch goals using React Query
  const { data: goals = [], isLoading, error } = useAllPerformanceGoals(filters);
  
  const deleteGoalMutation = useDeleteGoal();

  // Filter goals based on search term
  // Note: employee data comes as 'employees' from the joined query
  const filteredGoals = useMemo(() => {
    if (!searchTerm) return goals;
    const lowerSearch = searchTerm.toLowerCase();
    return goals.filter(goal => {
      const employee = goal.employees || goal.employee;
      return (
        goal.title?.toLowerCase().includes(lowerSearch) ||
        goal.description?.toLowerCase().includes(lowerSearch) ||
        employee?.first_name?.toLowerCase().includes(lowerSearch) ||
        employee?.last_name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [goals, searchTerm]);

  // Handle goal deletion
  const handleDelete = async (goal: PerformanceGoal) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await deleteGoalMutation.mutateAsync(goal.id);
      log.track('goal_deleted', { goalId: goal.id });
      onSuccess?.('Goal deleted successfully');
    } catch (err: any) {
      log.error('Failed to delete goal', { error: err.message });
      onError?.(err.message || 'Failed to delete goal');
    }
  };

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      on_track: 'bg-green-100 text-green-800',
      at_risk: 'bg-orange-100 text-orange-800',
      achieved: 'bg-purple-100 text-purple-800',
      not_achieved: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  // Get priority badge styles
  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  // Get progress bar color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-600';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        Loading goals...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center text-red-600">
        Error loading goals: {error.message}
      </div>
    );
  }

  // Empty state
  if (filteredGoals.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No goals found</h3>
        <p className="text-gray-500 mb-4">Get started by creating a new goal</p>
        {isAdmin && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Goal
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add button at top */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={onAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add New Goal
          </button>
        </div>
      )}

      {/* Goals cards */}
      {filteredGoals.map((goal) => (
        <div key={goal.id} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <Target className="h-6 w-6 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                  {goal.priority && getPriorityBadge(goal.priority)}
                  {goal.status && getStatusBadge(goal.status)}
                </div>

                {/* Description */}
                <p className="mt-2 text-sm text-gray-600">{goal.description}</p>

                {/* Meta info */}
                <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {(goal.employees || goal.employee)?.first_name} {(goal.employees || goal.employee)?.last_name}
                  </span>
                  {goal.target_date && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {goal.goal_type && (
                    <span className="capitalize">{goal.goal_type} goal</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex items-center space-x-2">
                <button
                  onClick={() => onEdit(goal)}
                  className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition"
                  title="Edit Goal"
                >
                  <Edit className="h-5 w-5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(goal)}
                    className="text-red-600 hover:text-red-900 p-1 rounded transition"
                    title="Delete Goal"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-gray-900">
                  {goal.progress_percentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(goal.progress_percentage ?? 0)}`}
                  style={{ width: `${goal.progress_percentage ?? 0}%` }}
                />
              </div>
            </div>

            {/* Key Results (if available) */}
            {goal.key_results && goal.key_results.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Results</h4>
                <ul className="space-y-1">
                  {goal.key_results.map((result: any, index: number) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        result.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      {result.title || result}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default GoalsList;
