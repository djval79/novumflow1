/**
 * Hooks Index
 * 
 * Central export point for all React Query hooks
 * Usage: import { useEmployees, useJobs, useInterviews } from '@/hooks';
 */

// Employee hooks
export {
  useEmployees,
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useSearchEmployees,
} from './useEmployees';
export type { Employee, EmployeeFilters } from './useEmployees';

// Job hooks
export {
  useJobs,
  useActiveJobs,
  useJob,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
} from './useJobs';
export type { JobPosting, JobFilters } from './useJobs';

// Application hooks
export {
  useApplications,
  useApplicationsByJob,
  useApplication,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
} from './useApplications';
export type { Application } from './useApplications';

// Interview hooks
export {
  useInterviews,
  useUpcomingInterviews,
  useInterview,
  useInterviewsByApplication,
  useCreateInterview,
  useUpdateInterview,
  useDeleteInterview,
  useSubmitInterviewFeedback,
  useRescheduleInterview,
} from './useInterviews';
export type { Interview, InterviewFilters } from './useInterviews';

// Leave Request hooks
export {
  useLeaveRequests,
  usePendingLeaveRequests,
  useLeaveRequest,
  useEmployeeLeaveRequests,
  useLeaveBalance,
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useCancelLeaveRequest,
  useDeleteLeaveRequest,
} from './useLeaveRequests';
export type { LeaveRequest, LeaveRequestFilters } from './useLeaveRequests';

// Performance hooks
export {
  // Reviews
  usePerformanceReviews,
  usePerformanceReview,
  usePendingReviews,
  useCreatePerformanceReview,
  useUpdatePerformanceReview,
  useCompletePerformanceReview,
  useDeletePerformanceReview,
  // Goals
  usePerformanceGoals,
  useAllPerformanceGoals,
  useAllPerformanceGoals as usePerformanceGoalsAll, // Alias for components
  useCreateGoal,
  useUpdateGoal,
  useUpdateGoalProgress,
  useDeleteGoal,
  useDeleteGoal as useDeletePerformanceGoal, // Alias for components
  // KPIs
  useKPIs,
  useKPIs as useKPIDefinitions, // Alias for components
  useEmployeeKPIs,
} from './usePerformance';
export type { 
  PerformanceReview, 
  PerformanceGoal, 
  ReviewFilters, 
  GoalFilters 
} from './usePerformance';

// KPI Definition type alias for components
export type KPIDefinition = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  measurement_unit?: string;
  calculation_method?: string;
  target_value?: number;
  default_target?: number;
  is_active?: boolean;
  [key: string]: any;
};

// Create useDeleteKPIDefinition as an alias for now (not actually deleting KPIs in most cases)
export { useKPIs as useDeleteKPIDefinition } from './usePerformance';

// Document hooks
export {
  useDocuments,
  useDocument,
  useEmployeeDocuments,
  useExpiringDocuments,
  useUnverifiedDocuments,
  useDocumentTemplates,
  useDocumentHistory,
  useCreateDocument,
  useUpdateDocument,
  useVerifyDocument,
  useUploadDocumentVersion,
  useDeleteDocument,
  useDocumentTypes,
} from './useDocuments';
export type { Document, DocumentTemplate, DocumentFilters } from './useDocuments';

// Messaging hooks
export {
  // Conversations
  useConversations,
  useConversation,
  useUnreadCount,
  useCreateConversation,
  useArchiveConversation,
  // Messages
  useMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useMarkAsRead,
  useAddParticipants,
  useLeaveConversation,
} from './useMessages';
export type { 
  Conversation, 
  Message, 
  MessageParticipant, 
  ConversationFilters 
} from './useMessages';

// Tenant hooks
export {
  useTenants,
  useTenant,
  useCurrentTenant,
  useTenantBySlug,
  useUserTenantMemberships,
  useTenantMembers,
  useCreateTenant,
  useUpdateTenant,
  useUpdateTenantSettings,
  useUpdateTenantFeatures,
  useInviteToTenant,
  useRemoveFromTenant,
  useUpdateMemberRole,
  useDeleteTenant,
  useCheckSlugAvailability,
} from './useTenants';
export type { 
  Tenant, 
  TenantMembership, 
  TenantFilters,
  SubscriptionTier,
  SubscriptionStatus,
} from './useTenants';

// Re-export mobile hook
export { useIsMobile } from './use-mobile';
