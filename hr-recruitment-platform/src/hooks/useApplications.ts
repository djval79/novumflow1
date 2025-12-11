/**
 * Application Data Hooks using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

interface Application {
  id: string;
  job_posting_id: string;
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_email: string;
  applicant_phone?: string;
  status: string;
  applied_at: string;
  ai_score?: number;
  ai_summary?: string;
  [key: string]: any;
}

/**
 * Fetch all applications
 */
export function useApplications(filters?: { jobId?: string; status?: string }) {
  return useQuery({
    queryKey: queryKeys.applications.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('applications')
          .select('*, job_postings(job_title, department)')
          .order('applied_at', { ascending: false });

        if (filters?.jobId) {
          query = query.eq('job_posting_id', filters.jobId);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch applications');

        return data as Application[];
      } catch (error) {
        throw handleError(error, 'useApplications query failed');
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Fetch applications by job ID
 */
export function useApplicationsByJob(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.applications.byJob(jobId || ''),
    queryFn: async () => {
      if (!jobId) throw createError.validation('Job ID is required');

      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('job_posting_id', jobId)
          .order('applied_at', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch applications');
        return data as Application[];
      } catch (error) {
        throw handleError(error, 'useApplicationsByJob query failed');
      }
    },
    enabled: !!jobId,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Fetch single application
 */
export function useApplication(id: string | null) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Application ID is required');

      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, job_postings(*)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Application', { id });
          }
          throw handleError(error, 'Failed to fetch application');
        }

        return data as Application;
      } catch (error) {
        throw handleError(error, 'useApplication query failed');
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create application
 */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationData: Partial<Application>) => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .insert(applicationData)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to create application');
        log.info('Application created successfully', { id: data.id });
        return data as Application;
      } catch (error) {
        throw handleError(error, 'useCreateApplication mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.applications.all);
      queryClient.setQueryData(queryKeys.applications.detail(data.id), data);
      log.track('application_created', { applicationId: data.id });
    },
  });
}

/**
 * Update application
 */
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Application> }) => {
      try {
        const { data: updated, error } = await supabase
          .from('applications')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update application');
        return updated as Application;
      } catch (error) {
        throw handleError(error, 'useUpdateApplication mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.applications.detail(data.id), data);
      invalidateQueries(queryKeys.applications.all);
      log.track('application_updated', { applicationId: data.id });
    },
  });
}

/**
 * Delete application
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('applications')
          .delete()
          .eq('id', id);

        if (error) throw handleError(error, 'Failed to delete application');
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteApplication mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.applications.detail(id) });
      invalidateQueries(queryKeys.applications.all);
      log.track('application_deleted', { applicationId: id });
    },
  });
}
