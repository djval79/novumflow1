/**
 * Employee Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for employee operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface EmployeeFilters {
  department?: string;
  status?: string;
  search?: string;
}

/**
 * Fetch all employees with optional filtering
 */
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: async () => {
      try {
        log.info('Fetching employees', { filters });
        
        let query = supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.department) {
          query = query.eq('department', filters.department);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.search) {
          query = query.or(
            `first_name.ilike.%${filters.search}%,` +
            `last_name.ilike.%${filters.search}%,` +
            `email.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch employees');
        }

        log.info(`Fetched ${data?.length || 0} employees`);
        return data as Employee[];
      } catch (error) {
        throw handleError(error, 'useEmployees query failed');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single employee by ID
 */
export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Employee ID is required');
      }

      try {
        log.info('Fetching employee', { id });

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Employee', { id });
          }
          throw handleError(error, 'Failed to fetch employee');
        }

        return data as Employee;
      } catch (error) {
        throw handleError(error, 'useEmployee query failed');
      }
    },
    enabled: !!id, // Only run query if ID exists
    staleTime: 10 * 60 * 1000, // 10 minutes for single records
  });
}

/**
 * Create new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeData: Partial<Employee>) => {
      try {
        log.info('Creating employee', { data: employeeData });

        const { data, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to create employee');
        }

        log.info('Employee created successfully', { id: data.id });
        return data as Employee;
      } catch (error) {
        throw handleError(error, 'useCreateEmployee mutation failed');
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch employees list
      invalidateQueries(queryKeys.employees.all);
      
      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.employees.detail(data.id), data);
      
      log.track('employee_created', { employeeId: data.id });
    },
  });
}

/**
 * Update existing employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      try {
        log.info('Updating employee', { id, data });

        const { data: updated, error } = await supabase
          .from('employees')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update employee');
        }

        log.info('Employee updated successfully', { id });
        return updated as Employee;
      } catch (error) {
        throw handleError(error, 'useUpdateEmployee mutation failed');
      }
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(queryKeys.employees.detail(data.id), data);
      
      // Invalidate lists
      invalidateQueries(queryKeys.employees.all);
      
      log.track('employee_updated', { employeeId: data.id });
    },
  });
}

/**
 * Delete employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting employee', { id });

        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete employee');
        }

        log.info('Employee deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteEmployee mutation failed');
      }
    },
    onSuccess: (id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.employees.detail(id) });
      
      // Invalidate lists
      invalidateQueries(queryKeys.employees.all);
      
      log.track('employee_deleted', { employeeId: id });
    },
  });
}

/**
 * Search employees
 */
export function useSearchEmployees(searchQuery: string) {
  return useQuery({
    queryKey: queryKeys.employees.search(searchQuery),
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      try {
        log.info('Searching employees', { query: searchQuery });

        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email, department, position')
          .or(
            `first_name.ilike.%${searchQuery}%,` +
            `last_name.ilike.%${searchQuery}%,` +
            `email.ilike.%${searchQuery}%`
          )
          .limit(10);

        if (error) {
          throw handleError(error, 'Search failed');
        }

        return data as Partial<Employee>[];
      } catch (error) {
        throw handleError(error, 'useSearchEmployees query failed');
      }
    },
    enabled: searchQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
