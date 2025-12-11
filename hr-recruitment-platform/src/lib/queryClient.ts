/**
 * React Query Configuration
 * 
 * Centralized configuration for TanStack Query (React Query)
 * Provides caching, background refetching, and optimistic updates
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { log } from './logger';
import { handleError } from './errorHandler';

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Default query options for all queries
 */
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Caching strategy
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (formerly cacheTime)
    
    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('40')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch configuration
    refetchOnWindowFocus: !isDevelopment, // Disabled in dev for better DX
    refetchOnMount: true,
    refetchOnReconnect: true,
    
    // Error handling
    throwOnError: false, // Handle errors in components, not globally
    
    // Performance
    networkMode: 'online', // Only query when online
  },
  mutations: {
    // Retry configuration for mutations
    retry: false, // Don't retry mutations by default
    
    // Error handling
    throwOnError: false,
    
    // Network mode
    networkMode: 'online',
    
    // Global mutation callbacks
    onError: (error) => {
      const appError = handleError(error, 'Mutation error');
      log.error('Mutation failed', appError);
    },
  },
};

/**
 * Create and configure the QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
  
  // Global query cache callbacks
  queryCache: undefined, // Can add global query cache callbacks here
  
  // Global mutation cache callbacks
  mutationCache: undefined, // Can add global mutation cache callbacks here
});

/**
 * Query keys for consistent cache management
 * Centralized keys prevent typos and make refactoring easier
 */
export const queryKeys = {
  // Authentication
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },
  
  // Employees
  employees: {
    all: ['employees'] as const,
    list: (filters?: Record<string, any>) => ['employees', 'list', filters] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
    search: (query: string) => ['employees', 'search', query] as const,
  },
  
  // Job Postings
  jobs: {
    all: ['jobs'] as const,
    list: (filters?: Record<string, any>) => ['jobs', 'list', filters] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    active: ['jobs', 'active'] as const,
  },
  
  // Applications
  applications: {
    all: ['applications'] as const,
    list: (filters?: Record<string, any>) => ['applications', 'list', filters] as const,
    detail: (id: string) => ['applications', 'detail', id] as const,
    byJob: (jobId: string) => ['applications', 'byJob', jobId] as const,
  },
  
  // Interviews
  interviews: {
    all: ['interviews'] as const,
    list: (filters?: Record<string, any>) => ['interviews', 'list', filters] as const,
    detail: (id: string) => ['interviews', 'detail', id] as const,
    upcoming: ['interviews', 'upcoming'] as const,
  },
  
  // Leave Requests
  leaveRequests: {
    all: ['leaveRequests'] as const,
    list: (filters?: Record<string, any>) => ['leaveRequests', 'list', filters] as const,
    detail: (id: string) => ['leaveRequests', 'detail', id] as const,
    pending: ['leaveRequests', 'pending'] as const,
  },
  
  // Performance
  performance: {
    all: ['performance'] as const,
    reviews: (filters?: Record<string, any>) => ['performance', 'reviews', filters] as const,
    review: (id: string) => ['performance', 'review', id] as const,
    goals: (employeeId: string) => ['performance', 'goals', employeeId] as const,
    kpis: ['performance', 'kpis'] as const,
  },
  
  // Documents
  documents: {
    all: ['documents'] as const,
    list: (filters?: Record<string, any>) => ['documents', 'list', filters] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    templates: ['documents', 'templates'] as const,
  },
  
  // Compliance
  compliance: {
    all: ['compliance'] as const,
    items: (filters?: Record<string, any>) => ['compliance', 'items', filters] as const,
    alerts: ['compliance', 'alerts'] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    list: (filters?: Record<string, any>) => ['messages', 'list', filters] as const,
    conversation: (conversationId: string) => ['messages', 'conversation', conversationId] as const,
    unread: ['messages', 'unread'] as const,
  },
  
  // Tenants
  tenants: {
    all: ['tenants'] as const,
    list: ['tenants', 'list'] as const,
    detail: (id: string) => ['tenants', 'detail', id] as const,
    current: ['tenants', 'current'] as const,
  },
  
  // Analytics
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    reports: (type: string) => ['analytics', 'reports', type] as const,
  },
  
  // Forms
  forms: {
    all: ['forms'] as const,
    list: ['forms', 'list'] as const,
    detail: (id: string) => ['forms', 'detail', id] as const,
    submissions: (formId: string) => ['forms', 'submissions', formId] as const,
  },
} as const;

/**
 * Helper function to invalidate related queries
 */
export function invalidateQueries(keys: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey: keys as string[] });
}

/**
 * Helper function to prefetch data
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKey as string[],
    queryFn,
  });
}

/**
 * Helper function to set query data manually
 */
export function setQueryData<T>(queryKey: readonly unknown[], data: T) {
  queryClient.setQueryData(queryKey as string[], data);
}

/**
 * Helper function to get cached query data
 */
export function getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
  return queryClient.getQueryData(queryKey as string[]);
}
