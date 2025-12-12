/**
 * Mock Data for Tests
 * 
 * Provides consistent mock data for testing components
 */

import { vi } from 'vitest';

// Mock Job Postings
export const mockJobs = [
  {
    id: 'job-1',
    job_title: 'Senior Software Engineer',
    department: 'Engineering',
    employment_type: 'full_time',
    status: 'active',
    location: 'Remote',
    salary_range_min: 120000,
    salary_range_max: 180000,
    job_description: 'We are looking for a senior engineer...',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'job-2',
    job_title: 'Product Manager',
    department: 'Product',
    employment_type: 'full_time',
    status: 'draft',
    location: 'New York',
    salary_range_min: 100000,
    salary_range_max: 150000,
    job_description: 'Lead product initiatives...',
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'job-3',
    job_title: 'Marketing Intern',
    department: 'Marketing',
    employment_type: 'part_time',
    status: 'closed',
    location: 'San Francisco',
    salary_range_min: null,
    salary_range_max: null,
    job_description: 'Support marketing team...',
    created_at: '2024-01-05T10:00:00Z',
  },
];

// Mock Applications
export const mockApplications = [
  {
    id: 'app-1',
    job_posting_id: 'job-1',
    applicant_first_name: 'John',
    applicant_last_name: 'Doe',
    applicant_email: 'john.doe@example.com',
    applicant_phone: '+1234567890',
    status: 'new',
    ai_score: 85,
    ai_summary: 'Strong candidate with relevant experience',
    applied_at: '2024-01-20T10:00:00Z',
    current_stage_id: 'stage-1',
    cv_url: 'https://example.com/cv.pdf',
    notes: '',
    job_postings: {
      id: 'job-1',
      job_title: 'Senior Software Engineer',
      department: 'Engineering',
      workflow_id: 'wf-1',
    },
  },
  {
    id: 'app-2',
    job_posting_id: 'job-1',
    applicant_first_name: 'Jane',
    applicant_last_name: 'Smith',
    applicant_email: 'jane.smith@example.com',
    applicant_phone: '+0987654321',
    status: 'screening',
    ai_score: 72,
    ai_summary: 'Good potential',
    applied_at: '2024-01-18T10:00:00Z',
    current_stage_id: 'stage-2',
    cv_url: null,
    notes: 'Follow up scheduled',
    job_postings: {
      id: 'job-1',
      job_title: 'Senior Software Engineer',
      department: 'Engineering',
      workflow_id: 'wf-1',
    },
  },
];

// Mock Interviews
export const mockInterviews = [
  {
    id: 'int-1',
    application_id: 'app-1',
    interview_type: 'phone_screen',
    scheduled_date: '2024-02-01T14:00:00Z',
    duration: 30,
    location: null,
    meeting_link: 'https://zoom.us/j/123456',
    status: 'scheduled',
    rating: null,
    feedback: null,
  },
  {
    id: 'int-2',
    application_id: 'app-2',
    interview_type: 'technical',
    scheduled_date: '2024-02-05T10:00:00Z',
    duration: 60,
    location: 'Office - Room A',
    meeting_link: null,
    status: 'completed',
    rating: 4,
    feedback: 'Strong technical skills',
  },
];

// Mock Performance Reviews
export const mockReviews = [
  {
    id: 'rev-1',
    review_type_id: 'rt-1',
    employee_id: 'emp-1',
    review_period_start: '2024-01-01',
    review_period_end: '2024-03-31',
    review_due_date: '2024-04-15',
    status: 'pending',
    overall_rating: null,
    employees: {
      id: 'emp-1',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice@company.com',
      department: 'Engineering',
    },
    performance_review_types: {
      id: 'rt-1',
      name: 'Quarterly Review',
      frequency: 'quarterly',
    },
  },
  {
    id: 'rev-2',
    review_type_id: 'rt-2',
    employee_id: 'emp-2',
    review_period_start: '2023-01-01',
    review_period_end: '2023-12-31',
    review_due_date: '2024-01-15',
    status: 'completed',
    overall_rating: 4.5,
    employees: {
      id: 'emp-2',
      first_name: 'Bob',
      last_name: 'Williams',
      email: 'bob@company.com',
      department: 'Sales',
    },
    performance_review_types: {
      id: 'rt-2',
      name: 'Annual Review',
      frequency: 'annual',
    },
  },
];

// Mock Goals
export const mockGoals = [
  {
    id: 'goal-1',
    employee_id: 'emp-1',
    title: 'Complete certification',
    description: 'Obtain AWS Solutions Architect certification',
    goal_type: 'development',
    target_date: '2024-06-30',
    status: 'on_track',
    progress_percentage: 65,
    priority: 'high',
    employees: {
      first_name: 'Alice',
      last_name: 'Johnson',
      department: 'Engineering',
    },
  },
  {
    id: 'goal-2',
    employee_id: 'emp-2',
    title: 'Increase sales quota',
    description: 'Achieve 120% of quarterly sales target',
    goal_type: 'individual',
    target_date: '2024-03-31',
    status: 'at_risk',
    progress_percentage: 45,
    priority: 'critical',
    employees: {
      first_name: 'Bob',
      last_name: 'Williams',
      department: 'Sales',
    },
  },
];

// Mock KPIs
export const mockKPIs = [
  {
    id: 'kpi-1',
    name: 'Customer Satisfaction Score',
    description: 'Average CSAT rating from customer surveys',
    category: 'customer_success',
    measurement_unit: '%',
    target_value: 90,
    calculation_method: 'average',
    is_active: true,
  },
  {
    id: 'kpi-2',
    name: 'Revenue Growth',
    description: 'Quarter-over-quarter revenue increase',
    category: 'sales',
    measurement_unit: '%',
    target_value: 15,
    calculation_method: 'percentage_change',
    is_active: true,
  },
];

// Mock Workflow Stages
export const mockWorkflowStages = [
  { id: 'stage-1', name: 'Applied', workflow_id: 'wf-1', stage_order: 1 },
  { id: 'stage-2', name: 'Screening', workflow_id: 'wf-1', stage_order: 2 },
  { id: 'stage-3', name: 'Interview', workflow_id: 'wf-1', stage_order: 3 },
  { id: 'stage-4', name: 'Offer', workflow_id: 'wf-1', stage_order: 4 },
  { id: 'stage-5', name: 'Hired', workflow_id: 'wf-1', stage_order: 5 },
];

// Mock Workflows
export const mockWorkflows = [
  { id: 'wf-1', name: 'Standard Hiring' },
  { id: 'wf-2', name: 'Executive Hiring' },
];

// Create hook mocks
export const createHookMocks = () => ({
  // Job hooks
  useJobs: vi.fn(() => ({
    data: mockJobs,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useUpdateJob: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useDeleteJob: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),

  // Application hooks
  useApplications: vi.fn(() => ({
    data: mockApplications,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useUpdateApplication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useDeleteApplication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),

  // Interview hooks
  useInterviews: vi.fn(() => ({
    data: mockInterviews,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useUpdateInterview: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),

  // Performance hooks
  usePerformanceReviews: vi.fn(() => ({
    data: mockReviews,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useDeletePerformanceReview: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useAllPerformanceGoals: vi.fn(() => ({
    data: mockGoals,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useDeleteGoal: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useKPIs: vi.fn(() => ({
    data: mockKPIs,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
});
