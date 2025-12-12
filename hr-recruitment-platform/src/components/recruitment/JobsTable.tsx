/**
 * JobsTable Component
 * 
 * Displays job postings using GenericCRUDTable and React Query hooks
 * Reduces code from RecruitmentPage by extracting job-related table logic
 */

import React, { useMemo } from 'react';
import { Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { useJobs, useUpdateJob, useDeleteJob, JobPosting } from '@/hooks';
import { log } from '@/lib/logger';

interface JobsTableProps {
  searchTerm?: string;
  onAddNew: () => void;
  onEdit: (job: JobPosting) => void;
  onView: (job: JobPosting) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function JobsTable({
  searchTerm = '',
  onAddNew,
  onEdit,
  onView,
  onSuccess,
  onError,
}: JobsTableProps) {
  // Fetch jobs using React Query
  const { data: jobs = [], isLoading, error } = useJobs();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();

  // Filter jobs based on search term
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    const lowerSearch = searchTerm.toLowerCase();
    return jobs.filter(job =>
      job.job_title.toLowerCase().includes(lowerSearch) ||
      job.department.toLowerCase().includes(lowerSearch) ||
      (job.location && job.location.toLowerCase().includes(lowerSearch))
    );
  }, [jobs, searchTerm]);

  // Handle job status update
  const handleStatusChange = async (job: JobPosting, newStatus: string) => {
    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        data: { status: newStatus },
      });
      log.track('job_status_updated', { jobId: job.id, newStatus });
      onSuccess?.(`Job status updated to ${newStatus}`);
    } catch (err: any) {
      log.error('Failed to update job status', { error: err.message, jobId: job.id });
      onError?.(err.message || 'Failed to update job status');
    }
  };

  // Handle job deletion
  const handleDelete = async (job: JobPosting) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await deleteJobMutation.mutateAsync(job.id);
      log.track('job_deleted', { jobId: job.id });
      onSuccess?.('Job posting deleted successfully');
    } catch (err: any) {
      log.error('Failed to delete job', { error: err.message, jobId: job.id });
      onError?.(err.message || 'Failed to delete job posting');
    }
  };

  // Define table columns
  const columns: Column<JobPosting>[] = useMemo(() => [
    {
      key: 'job_title',
      label: 'Job Title',
      sortable: true,
      render: (job) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{job.job_title}</div>
          <div className="text-sm text-gray-500">{job.location || 'Remote'}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
    },
    {
      key: 'employment_type',
      label: 'Type',
      render: (job) => (
        <span className="capitalize">{job.employment_type?.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (job) => (
        <select
          value={job.status}
          onChange={(e) => handleStatusChange(job, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-semibold rounded-full px-3 py-1 border-0 outline-none cursor-pointer ${
            job.status === 'active' || job.status === 'open'
              ? 'bg-green-100 text-green-800'
              : job.status === 'closed'
              ? 'bg-red-100 text-red-800'
              : job.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <option value="draft">Draft</option>
          <option value="active">Published</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      key: 'salary_range',
      label: 'Salary',
      render: (job) => {
        if (job.salary_range_min && job.salary_range_max) {
          return `$${job.salary_range_min.toLocaleString()} - $${job.salary_range_max.toLocaleString()}`;
        }
        return 'Not specified';
      },
    },
    {
      key: 'created_at',
      label: 'Posted',
      sortable: true,
      render: (job) => job.created_at ? format(new Date(job.created_at), 'MMM dd, yyyy') : '-',
    },
  ], []);

  // Define row actions
  const actions: Action<JobPosting>[] = useMemo(() => [
    {
      label: 'View Details',
      icon: Eye,
      onClick: onView,
      variant: 'default',
    },
  ], [onView]);

  return (
    <GenericCRUDTable
      data={filteredJobs}
      columns={columns}
      loading={isLoading}
      error={error?.message}
      actions={actions}
      onAdd={onAddNew}
      onEdit={onEdit}
      onDelete={handleDelete}
      searchable={false} // Search is handled externally
      title="Job Postings"
      emptyMessage="No job postings found"
    />
  );
}

export default JobsTable;
