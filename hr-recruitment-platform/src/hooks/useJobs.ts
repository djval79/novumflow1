/**
 * Job Posting Data Hooks using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export interface JobPosting {
  id: string;
  job_title: string;
  job_code?: string;
  department: string;
  location?: string;
  employment_type?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  job_description: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface JobFilters {
  department?: string;
  status?: string;
  employment_type?: string;
}

/**
 * Fetch all job postings
 */
export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: async () => {
      try {
        let query = supabase
          .from('job_postings')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.department) {
          query = query.eq('department', filters.department);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.employment_type) {
          query = query.eq('employment_type', filters.employment_type);
        }

        const { data, error } = await query;
        if (error) throw handleError(error, 'Failed to fetch jobs');

        return data as JobPosting[];
      } catch (error) {
        throw handleError(error, 'useJobs query failed');
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch active job postings
 */
export function useActiveJobs() {
  return useQuery({
    queryKey: queryKeys.jobs.active,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (error) throw handleError(error, 'Failed to fetch active jobs');
        return data as JobPosting[];
      } catch (error) {
        throw handleError(error, 'useActiveJobs query failed');
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch single job posting
 */
export function useJob(id: string | null) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id || ''),
    queryFn: async () => {
      if (!id) throw createError.validation('Job ID is required');

      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Job posting', { id });
          }
          throw handleError(error, 'Failed to fetch job');
        }

        return data as JobPosting;
      } catch (error) {
        throw handleError(error, 'useJob query failed');
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Create job posting
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: Partial<JobPosting>) => {
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .insert(jobData)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to create job');
        log.info('Job created successfully', { id: data.id });
        return data as JobPosting;
      } catch (error) {
        throw handleError(error, 'useCreateJob mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.jobs.all);
      queryClient.setQueryData(queryKeys.jobs.detail(data.id), data);
      log.track('job_created', { jobId: data.id });
    },
  });
}

/**
 * Update job posting
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<JobPosting> }) => {
      try {
        const { data: updated, error } = await supabase
          .from('job_postings')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) throw handleError(error, 'Failed to update job');
        return updated as JobPosting;
      } catch (error) {
        throw handleError(error, 'useUpdateJob mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.jobs.detail(data.id), data);
      invalidateQueries(queryKeys.jobs.all);
      log.track('job_updated', { jobId: data.id });
    },
  });
}

/**
 * Delete job posting
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('job_postings')
          .delete()
          .eq('id', id);

        if (error) throw handleError(error, 'Failed to delete job');
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteJob mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(id) });
      invalidateQueries(queryKeys.jobs.all);
      log.track('job_deleted', { jobId: id });
    },
  });
}
