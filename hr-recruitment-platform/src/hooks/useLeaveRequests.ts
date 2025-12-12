/**
 * Leave Request Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for leave request operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'compassionate' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  requested_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
  };
  reviewer?: {
    first_name: string;
    last_name: string;
  };
  [key: string]: any;
}

export interface LeaveRequestFilters {
  employee_id?: string;
  status?: string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
}

/**
 * Fetch all leave requests with optional filtering
 */
export function useLeaveRequests(filters?: LeaveRequestFilters) {
  return useQuery({
    queryKey: queryKeys.leaveRequests.list(filters),
    queryFn: async () => {
      try {
        log.info('Fetching leave requests', { filters });
        
        let query = supabase
          .from('leave_requests')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department
            )
          `)
          .order('requested_at', { ascending: false });

        // Apply filters
        if (filters?.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.leave_type) {
          query = query.eq('leave_type', filters.leave_type);
        }
        if (filters?.from_date) {
          query = query.gte('start_date', filters.from_date);
        }
        if (filters?.to_date) {
          query = query.lte('end_date', filters.to_date);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch leave requests');
        }

        log.info(`Fetched ${data?.length || 0} leave requests`);
        return data as LeaveRequest[];
      } catch (error) {
        throw handleError(error, 'useLeaveRequests query failed');
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Fetch pending leave requests for approval
 */
export function usePendingLeaveRequests() {
  return useQuery({
    queryKey: queryKeys.leaveRequests.pending,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department
            )
          `)
          .eq('status', 'pending')
          .order('requested_at', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch pending leave requests');
        return data as LeaveRequest[];
      } catch (error) {
        throw handleError(error, 'usePendingLeaveRequests query failed');
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for approval workflows
  });
}

/**
 * Fetch single leave request by ID
 */
export function useLeaveRequest(id: string | null) {
  return useQuery({
    queryKey: queryKeys.leaveRequests.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Leave request ID is required');
      }

      try {
        log.info('Fetching leave request', { id });

        const { data, error } = await supabase
          .from('leave_requests')
          .select(`
            *,
            employees (
              id,
              first_name,
              last_name,
              email,
              department,
              position
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Leave request', { id });
          }
          throw handleError(error, 'Failed to fetch leave request');
        }

        return data as LeaveRequest;
      } catch (error) {
        throw handleError(error, 'useLeaveRequest query failed');
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch leave requests by employee ID
 */
export function useEmployeeLeaveRequests(employeeId: string | null) {
  return useQuery({
    queryKey: ['leaveRequests', 'byEmployee', employeeId],
    queryFn: async () => {
      if (!employeeId) throw createError.validation('Employee ID is required');

      try {
        const { data, error } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('employee_id', employeeId)
          .order('start_date', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch leave requests');
        return data as LeaveRequest[];
      } catch (error) {
        throw handleError(error, 'useEmployeeLeaveRequests query failed');
      }
    },
    enabled: !!employeeId,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Fetch leave balance for an employee
 */
export function useLeaveBalance(employeeId: string | null, year?: number) {
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['leaveRequests', 'balance', employeeId, currentYear],
    queryFn: async () => {
      if (!employeeId) throw createError.validation('Employee ID is required');

      try {
        const startOfYear = `${currentYear}-01-01`;
        const endOfYear = `${currentYear}-12-31`;

        const { data, error } = await supabase
          .from('leave_requests')
          .select('leave_type, total_days')
          .eq('employee_id', employeeId)
          .eq('status', 'approved')
          .gte('start_date', startOfYear)
          .lte('end_date', endOfYear);

        if (error) throw handleError(error, 'Failed to fetch leave balance');

        // Calculate totals by type
        const balances = (data || []).reduce((acc, request) => {
          const type = request.leave_type;
          if (!acc[type]) acc[type] = 0;
          acc[type] += request.total_days;
          return acc;
        }, {} as Record<string, number>);

        return balances;
      } catch (error) {
        throw handleError(error, 'useLeaveBalance query failed');
      }
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create new leave request
 */
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaveData: Partial<LeaveRequest>) => {
      try {
        log.info('Creating leave request', { data: leaveData });

        const { data, error } = await supabase
          .from('leave_requests')
          .insert({
            ...leaveData,
            status: 'pending',
            requested_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to create leave request');
        }

        log.info('Leave request created successfully', { id: data.id });
        return data as LeaveRequest;
      } catch (error) {
        throw handleError(error, 'useCreateLeaveRequest mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.leaveRequests.all);
      queryClient.setQueryData(queryKeys.leaveRequests.detail(data.id), data);
      log.track('leave_request_created', { leaveRequestId: data.id, leaveType: data.leave_type });
    },
  });
}

/**
 * Update existing leave request
 */
export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeaveRequest> }) => {
      try {
        log.info('Updating leave request', { id, data });

        const { data: updated, error } = await supabase
          .from('leave_requests')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update leave request');
        }

        log.info('Leave request updated successfully', { id });
        return updated as LeaveRequest;
      } catch (error) {
        throw handleError(error, 'useUpdateLeaveRequest mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.leaveRequests.detail(data.id), data);
      invalidateQueries(queryKeys.leaveRequests.all);
      log.track('leave_request_updated', { leaveRequestId: data.id });
    },
  });
}

/**
 * Approve leave request
 */
export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      reviewerId, 
      review_notes 
    }: { 
      id: string; 
      reviewerId: string; 
      review_notes?: string;
    }) => {
      try {
        log.info('Approving leave request', { id, reviewerId });

        const { data: updated, error } = await supabase
          .from('leave_requests')
          .update({
            status: 'approved',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            review_notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to approve leave request');
        }

        log.info('Leave request approved', { id });
        return updated as LeaveRequest;
      } catch (error) {
        throw handleError(error, 'useApproveLeaveRequest mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.leaveRequests.detail(data.id), data);
      invalidateQueries(queryKeys.leaveRequests.all);
      log.track('leave_request_approved', { leaveRequestId: data.id });
    },
  });
}

/**
 * Reject leave request
 */
export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      reviewerId, 
      review_notes 
    }: { 
      id: string; 
      reviewerId: string; 
      review_notes: string;
    }) => {
      try {
        log.info('Rejecting leave request', { id, reviewerId });

        const { data: updated, error } = await supabase
          .from('leave_requests')
          .update({
            status: 'rejected',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            review_notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to reject leave request');
        }

        log.info('Leave request rejected', { id });
        return updated as LeaveRequest;
      } catch (error) {
        throw handleError(error, 'useRejectLeaveRequest mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.leaveRequests.detail(data.id), data);
      invalidateQueries(queryKeys.leaveRequests.all);
      log.track('leave_request_rejected', { leaveRequestId: data.id });
    },
  });
}

/**
 * Cancel leave request (by employee)
 */
export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Cancelling leave request', { id });

        const { data: updated, error } = await supabase
          .from('leave_requests')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to cancel leave request');
        }

        log.info('Leave request cancelled', { id });
        return updated as LeaveRequest;
      } catch (error) {
        throw handleError(error, 'useCancelLeaveRequest mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.leaveRequests.detail(data.id), data);
      invalidateQueries(queryKeys.leaveRequests.all);
      log.track('leave_request_cancelled', { leaveRequestId: data.id });
    },
  });
}

/**
 * Delete leave request
 */
export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting leave request', { id });

        const { error } = await supabase
          .from('leave_requests')
          .delete()
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete leave request');
        }

        log.info('Leave request deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteLeaveRequest mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.leaveRequests.detail(id) });
      invalidateQueries(queryKeys.leaveRequests.all);
      log.track('leave_request_deleted', { leaveRequestId: id });
    },
  });
}
