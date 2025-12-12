/**
 * Interview Data Hooks using React Query
 * 
 * Provides cached, optimized data fetching for interview operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, invalidateQueries } from '@/lib/queryClient';
import { handleError, createError } from '@/lib/errorHandler';
import { log } from '@/lib/logger';

export interface Interview {
  id: string;
  application_id: string;
  interview_type: 'phone_screening' | 'video' | 'in_person' | 'technical' | 'final';
  scheduled_date: string;
  duration: number;
  location?: string;
  meeting_link?: string;
  interviewer_ids?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  feedback?: string;
  rating?: number;
  recommendation?: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  applications?: {
    applicant_first_name: string;
    applicant_last_name: string;
    applicant_email: string;
    job_postings?: {
      job_title: string;
      department: string;
    };
  };
  [key: string]: any;
}

export interface InterviewFilters {
  status?: string;
  interview_type?: string;
  application_id?: string;
  from_date?: string;
  to_date?: string;
}

/**
 * Fetch all interviews with optional filtering
 */
export function useInterviews(filters?: InterviewFilters) {
  return useQuery({
    queryKey: queryKeys.interviews.list(filters),
    queryFn: async () => {
      try {
        log.info('Fetching interviews', { filters });
        
        let query = supabase
          .from('interviews')
          .select(`
            *,
            applications (
              applicant_first_name,
              applicant_last_name,
              applicant_email,
              job_postings (
                job_title,
                department
              )
            )
          `)
          .order('scheduled_date', { ascending: true });

        // Apply filters
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.interview_type) {
          query = query.eq('interview_type', filters.interview_type);
        }
        if (filters?.application_id) {
          query = query.eq('application_id', filters.application_id);
        }
        if (filters?.from_date) {
          query = query.gte('scheduled_date', filters.from_date);
        }
        if (filters?.to_date) {
          query = query.lte('scheduled_date', filters.to_date);
        }

        const { data, error } = await query;

        if (error) {
          throw handleError(error, 'Failed to fetch interviews');
        }

        log.info(`Fetched ${data?.length || 0} interviews`);
        return data as Interview[];
      } catch (error) {
        throw handleError(error, 'useInterviews query failed');
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Fetch upcoming interviews (next 7 days)
 */
export function useUpcomingInterviews() {
  return useQuery({
    queryKey: queryKeys.interviews.upcoming,
    queryFn: async () => {
      try {
        const now = new Date().toISOString();
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('interviews')
          .select(`
            *,
            applications (
              applicant_first_name,
              applicant_last_name,
              applicant_email,
              job_postings (
                job_title,
                department
              )
            )
          `)
          .gte('scheduled_date', now)
          .lte('scheduled_date', nextWeek)
          .eq('status', 'scheduled')
          .order('scheduled_date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch upcoming interviews');
        return data as Interview[];
      } catch (error) {
        throw handleError(error, 'useUpcomingInterviews query failed');
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for time-sensitive data
  });
}

/**
 * Fetch single interview by ID
 */
export function useInterview(id: string | null) {
  return useQuery({
    queryKey: queryKeys.interviews.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw createError.validation('Interview ID is required');
      }

      try {
        log.info('Fetching interview', { id });

        const { data, error } = await supabase
          .from('interviews')
          .select(`
            *,
            applications (
              *,
              job_postings (*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw createError.notFound('Interview', { id });
          }
          throw handleError(error, 'Failed to fetch interview');
        }

        return data as Interview;
      } catch (error) {
        throw handleError(error, 'useInterview query failed');
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch interviews by application ID
 */
export function useInterviewsByApplication(applicationId: string | null) {
  return useQuery({
    queryKey: ['interviews', 'byApplication', applicationId],
    queryFn: async () => {
      if (!applicationId) throw createError.validation('Application ID is required');

      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .eq('application_id', applicationId)
          .order('scheduled_date', { ascending: true });

        if (error) throw handleError(error, 'Failed to fetch interviews');
        return data as Interview[];
      } catch (error) {
        throw handleError(error, 'useInterviewsByApplication query failed');
      }
    },
    enabled: !!applicationId,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Create new interview
 */
export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interviewData: Partial<Interview>) => {
      try {
        log.info('Creating interview', { data: interviewData });

        const { data, error } = await supabase
          .from('interviews')
          .insert(interviewData)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to create interview');
        }

        log.info('Interview created successfully', { id: data.id });
        return data as Interview;
      } catch (error) {
        throw handleError(error, 'useCreateInterview mutation failed');
      }
    },
    onSuccess: (data) => {
      invalidateQueries(queryKeys.interviews.all);
      queryClient.setQueryData(queryKeys.interviews.detail(data.id), data);
      log.track('interview_created', { interviewId: data.id });
    },
  });
}

/**
 * Update existing interview
 */
export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Interview> }) => {
      try {
        log.info('Updating interview', { id, data });

        const { data: updated, error } = await supabase
          .from('interviews')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to update interview');
        }

        log.info('Interview updated successfully', { id });
        return updated as Interview;
      } catch (error) {
        throw handleError(error, 'useUpdateInterview mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.interviews.detail(data.id), data);
      invalidateQueries(queryKeys.interviews.all);
      log.track('interview_updated', { interviewId: data.id });
    },
  });
}

/**
 * Delete interview
 */
export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.info('Deleting interview', { id });

        const { error } = await supabase
          .from('interviews')
          .delete()
          .eq('id', id);

        if (error) {
          throw handleError(error, 'Failed to delete interview');
        }

        log.info('Interview deleted successfully', { id });
        return id;
      } catch (error) {
        throw handleError(error, 'useDeleteInterview mutation failed');
      }
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.interviews.detail(id) });
      invalidateQueries(queryKeys.interviews.all);
      log.track('interview_deleted', { interviewId: id });
    },
  });
}

/**
 * Submit interview feedback
 */
export function useSubmitInterviewFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      feedback, 
      rating, 
      recommendation 
    }: { 
      id: string; 
      feedback: string; 
      rating: number; 
      recommendation: Interview['recommendation'];
    }) => {
      try {
        log.info('Submitting interview feedback', { id, rating, recommendation });

        const { data: updated, error } = await supabase
          .from('interviews')
          .update({
            feedback,
            rating,
            recommendation,
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to submit feedback');
        }

        log.info('Interview feedback submitted', { id });
        return updated as Interview;
      } catch (error) {
        throw handleError(error, 'useSubmitInterviewFeedback mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.interviews.detail(data.id), data);
      invalidateQueries(queryKeys.interviews.all);
      log.track('interview_feedback_submitted', { interviewId: data.id, rating: data.rating });
    },
  });
}

/**
 * Reschedule interview
 */
export function useRescheduleInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      scheduled_date, 
      location, 
      meeting_link 
    }: { 
      id: string; 
      scheduled_date: string; 
      location?: string; 
      meeting_link?: string;
    }) => {
      try {
        log.info('Rescheduling interview', { id, scheduled_date });

        const { data: updated, error } = await supabase
          .from('interviews')
          .update({
            scheduled_date,
            location,
            meeting_link,
            status: 'rescheduled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw handleError(error, 'Failed to reschedule interview');
        }

        log.info('Interview rescheduled', { id, scheduled_date });
        return updated as Interview;
      } catch (error) {
        throw handleError(error, 'useRescheduleInterview mutation failed');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.interviews.detail(data.id), data);
      invalidateQueries(queryKeys.interviews.all);
      log.track('interview_rescheduled', { interviewId: data.id });
    },
  });
}
