/**
 * Performance Management Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for performance reviews, goals, and KPIs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

// Performance Review Types
export interface PerformanceReview {
  id: string;
  review_type_id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  review_due_date: string;
  status: 'pending' | 'in_progress' | 'self_assessment_complete' | 'manager_review_complete' | 'peer_review_complete' | 'completed' | 'overdue' | 'cancelled';
  overall_rating?: number;
  overall_comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  action_items?: string;
  next_review_date?: string;
  is_auto_generated: boolean;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
    position?: string;
  };
  review_types?: {
    id: string;
    name: string;
    description?: string;
  };
  [key: string]: any;
}

export interface PerformanceGoal {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  goal_type: 'individual' | 'team' | 'company' | 'development';
  category?: string;
  target_date?: string;
  status: 'draft' | 'active' | 'on_track' | 'at_risk' | 'achieved' | 'not_achieved' | 'cancelled';
  progress_percentage: number;
  measurement_criteria?: string;
  target_value?: string;
  current_value?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  linked_review_id?: string;
  parent_goal_id?: string;
  is_smart: boolean;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  employees?: {
    first_name: string;
    last_name: string;
    department?: string;
  };
  [key: string]: any;
}

export interface ReviewFilters {
  employee_id?: string;
  status?: string;
  review_type_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface GoalFilters {
  employee_id?: string;
  status?: string;
  goal_type?: string;
  priority?: string;
}

// ==================== Performance Reviews ====================

/**
 * Fetch all performance reviews with optional filtering
 */
export function usePerformanceReviews(filters?: ReviewFilters) {
  return useQuery({
    queryKey: queryKeys.performance.reviews(filters),
    queryFn: async () => {
      try {
        log.info('Fetching performance reviews', { filters });
        
        let query = supabase
          .from('performance_reviews')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department,
              position
            ),
            performance_review_types (
              id,
              name,
              description
            )
          `)
          .order('review_due_date', { ascending: true });

        // Apply filters
        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.review_type_id) {
          query = query.eq('review_type_id', filters.review_type_id);
        }
        if (filters?.from_date) {
          query = query.gte('review_period_start', filters.from_date);
        }
        if (filters?.to_date) {
          query = query.lte('review_period_end', filters.to_date);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch performance reviews');
        }

        log.info(`Fetched ${data?.length || 0} performance reviews`);
        return data as PerformanceReview[];
      } catch (error) {
        throw handleError(error, 'usePerformanceReviews query failed');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single performance review by ID
 */
export function usePerformanceReview(id: string | null) {
  return useQuery({
    queryKey: queryKeys.performance.review(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Review ID is required');
      }

      try {
        log.info('Fetching performance review', { id });

        const { data, error } = await supabase
          .from('performance_reviews')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department,
              position
            ),
            performance_review_types (
              id,
              name,
              description
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Performance review', { id });
          }
          throw handleError(error, 'Failed to fetch performance review');
        }

        return data as PerformanceReview;
      } catch (error) {
        throw handleError(error, 'usePerformanceReview query failed');
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch pending/overdue reviews for dashboard
 */
export function usePendingReviews() {
  return useQuery({
    queryKey: ['performance', 'pending'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('performance_reviews')
          .select(`
            *,
            employees (
              first_name,
              last_name,
              department
            )
          `)
          .in('status', ['pending', 'in_progress', 'overdue'])
          .order('review_due_date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch pending reviews');
        return data as PerformanceReview[];
      } catch (error) {
        throw handleError(error, 'usePendingReviews query failed');
      }
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Create new performance review
 */
export function useCreatePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: Partial<PerformanceReview>) => {
      try {
        log.info('Creating performance review', { data: reviewData });

        const { data, error } = await supabase
          .from('performance_reviews')
          .insert(reviewData)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to create performance review');
        }

        log.info('Performance review created successfully', { id: data.id });
        return data as PerformanceReview;
      } catch (error) {
        throw handleError(error, 'useCreatePerformanceReview mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.performance.all);
      queryClient.setQueryData(queryKeys.performance.review(data.id), data);
      log.track('performance_review_created', { reviewId: data.id });
    },
  });
}

/**
 * Update performance review
 */
export function useUpdatePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PerformanceReview> }) => {
      try {
        log.info('Updating performance review', { id, data });

        const { data: updated, error } = await supabase
          .from('performance_reviews')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update performance review');
        }

        log.info('Performance review updated successfully', { id });
        return updated as PerformanceReview;
      } catch (error) {
        throw handleError(error, 'useUpdatePerformanceReview mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.performance.review(data.id), data);
      invalidateQueries(queryKeys.performance.all);
      log.track('performance_review_updated', { reviewId: data.id });
    },
  });
}

/**
 * Complete performance review
 */
export function useCompletePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      overall_rating, 
      overall_comments, 
      strengths, 
      areas_for_improvement, 
      action_items 
    }: { 
      id: string; 
      overall_rating: number; 
      overall_comments?: string;
      strengths?: string;
      areas_for_improvement?: string;
      action_items?: string;
    }) => {
      try {
        log.info('Completing performance review', { id, overall_rating });

        const { data: updated, error } = await supabase
          .from('performance_reviews')
          .update({
            overall_rating,
            overall_comments,
            strengths,
            areas_for_improvement,
            action_items,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to complete performance review');
        }

        log.info('Performance review completed', { id });
        return updated as PerformanceReview;
      } catch (error) {
        throw handleError(error, 'useCompletePerformanceReview mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.performance.review(data.id), data);
      invalidateQueries(queryKeys.performance.all);
      log.track('performance_review_completed', { reviewId: data.id, rating: data.overall_rating });
    },
  });
}

/**
 * Delete performance review
 */
export function useDeletePerformanceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting performance review', { id });

        const { error } = await supabase
          .from('performance_reviews')
          .delete()
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete performance review');
        }

        log.info('Performance review deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeletePerformanceReview mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.performance.review(id) });
      invalidateQueries(queryKeys.performance.all);
      log.track('performance_review_deleted', { reviewId: id });
    },
  });
}

// ==================== Performance Goals ====================

/**
 * Fetch performance goals by employee ID
 */
export function usePerformanceGoals(employeeId: string | null, filters?: GoalFilters) {
  return useQuery({
    queryKey: queryKeys.performance.goals(employeeId || ''),
    queryFn: async () => {
      if (!employeeId) throw createError.validation('Employee ID is required');

      try {
        log.info('Fetching performance goals', { employeeId, filters });
        
        let query = supabase
          .from('performance_goals')
          .select('*')
          .eq('employee_id', employeeId)
          .order('target_date', { ascending: true });

        // Apply filters
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.goal_type) {
          query = query.eq('goal_type', filters.goal_type);
        }
        if (filters?.priority) {
          query = query.eq('priority', filters.priority);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch performance goals');
        }

        log.info(`Fetched ${data?.length || 0} performance goals`);
        return data as PerformanceGoal[];
      } catch (error) {
        throw handleError(error, 'usePerformanceGoals query failed');
      }
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch all goals (for managers/HR)
 */
export function useAllPerformanceGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: ['performance', 'allGoals', filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('performance_goals')
          .select(`
            *,
            employees (
              first_name,
              last_name,
              department
            )
          `)
          .order('target_date', { ascending: true });

        // Apply filters
        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.goal_type) {
          query = query.eq('goal_type', filters.goal_type);
        }
        if (filters?.priority) {
          query = query.eq('priority', filters.priority);
        }

        const { data, error } = await query;

        if (error) throw handleError(error, 'Failed to fetch goals');
        return data as PerformanceGoal[];
      } catch (error) {
        throw handleError(error, 'useAllPerformanceGoals query failed');
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create new goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalData: Partial<PerformanceGoal>) => {
      try {
        log.info('Creating performance goal', { data: goalData });

        const { data, error } = await supabase
          .from('performance_goals')
          .insert({
            ...goalData,
            status: goalData.status || 'active',
            progress_percentage: goalData.progress_percentage || 0,
          })
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to create goal');
        }

        log.info('Goal created successfully', { id: data.id });
        return data as PerformanceGoal;
      } catch (error) {
        throw handleError(error, 'useCreateGoal mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.performance.all);
      if (data.employee_id) {
        invalidateQueries(queryKeys.performance.goals(data.employee_id));
      }
      log.track('goal_created', { goalId: data.id, goalType: data.goal_type });
    },
  });
}

/**
 * Update goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PerformanceGoal> }) => {
      try {
        log.info('Updating goal', { id, data });

        const { data: updated, error } = await supabase
          .from('performance_goals')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update goal');
        }

        log.info('Goal updated successfully', { id });
        return updated as PerformanceGoal;
      } catch (error) {
        throw handleError(error, 'useUpdateGoal mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.performance.all);
      if (data.employee_id) {
        invalidateQueries(queryKeys.performance.goals(data.employee_id));
      }
      log.track('goal_updated', { goalId: data.id });
    },
  });
}

/**
 * Update goal progress
 */
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      progress_percentage, 
      current_value 
    }: { 
      id: string; 
      progress_percentage: number; 
      current_value?: string;
    }) => {
      try {
        log.info('Updating goal progress', { id, progress_percentage });

        const { data: updated, error } = await supabase
          .from('performance_goals')
          .update({
            progress_percentage,
            current_value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update goal progress');
        }

        log.info('Goal progress updated', { id, progress_percentage });
        return updated as PerformanceGoal;
      } catch (error) {
        throw handleError(error, 'useUpdateGoalProgress mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.performance.all);
      if (data.employee_id) {
        invalidateQueries(queryKeys.performance.goals(data.employee_id));
      }
      log.track('goal_progress_updated', { goalId: data.id, progress: data.progress_percentage });
    },
  });
}

/**
 * Delete goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting goal', { id });

        const { error } = await supabase
          .from('performance_goals')
          .delete()
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete goal');
        }

        log.info('Goal deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteGoal mutation failed');
      }
    },
    onSuccess: (id) => {
      invalidateQueries(queryKeys.performance.all);
      log.track('goal_deleted', { goalId: id });
    },
  });
}

// ==================== KPIs ====================

/**
 * Fetch KPIs
 */
export function useKPIs() {
  return useQuery({
    queryKey: queryKeys.performance.kpis,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('kpi_definitions')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch KPIs');
        return data;
      } catch (error) {
        throw handleError(error, 'useKPIs query failed');
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - KPIs change rarely
  });
}

/**
 * Fetch KPI values for an employee
 */
export function useEmployeeKPIs(employeeId: string | null) {
  return useQuery({
    queryKey: ['performance', 'employeeKPIs', employeeId],
    queryFn: async () => {
      if (!employeeId) throw createError.validation('Employee ID is required');

      try {
        const { data, error } = await supabase
          .from('kpi_values')
          .select(`
            *,
            kpi_definitions (
              name,
              description,
              unit
            )
          `)
          .eq('employee_id', employeeId)
          .order('period_end', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch employee KPIs');
        return data;
      } catch (error) {
        throw handleError(error, 'useEmployeeKPIs query failed');
      }
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}
