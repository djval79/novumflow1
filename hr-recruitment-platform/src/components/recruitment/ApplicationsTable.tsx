/**
 * ApplicationsTable Component
 * 
 * Displays applications using GenericCRUDTable and React Query hooks
 * Supports filtering by job, workflow stage, and search
 */

import React, { useMemo } from 'react';
import { Eye, Calendar, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { useApplications, useUpdateApplication, useDeleteApplication, Application } from '@/hooks';
import { log } from '@/lib/logger';

interface WorkflowStage {
  id: string;
  name: string;
  workflow_id: string;
  stage_order: number;
}

interface ApplicationsTableProps {
  searchTerm?: string;
  selectedJobId?: string;
  selectedStageId?: string;
  selectedWorkflowId?: string;
  workflowStages?: WorkflowStage[];
  onAddNew: () => void;
  onView: (application: Application) => void;
  onScheduleInterview: (application: Application) => void;
  onStageChange?: (applicationId: string, stageId: string) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ApplicationsTable({
  searchTerm = '',
  selectedJobId = 'all',
  selectedStageId = 'all',
  selectedWorkflowId = 'all',
  workflowStages = [],
  onAddNew,
  onView,
  onScheduleInterview,
  onStageChange,
  onSuccess,
  onError,
}: ApplicationsTableProps) {
  // Fetch applications using React Query with optional job filter
  const { data: applications = [], isLoading, error } = useApplications({
    jobId: selectedJobId !== 'all' ? selectedJobId : undefined,
  });
  
  const deleteApplicationMutation = useDeleteApplication();
  const updateApplicationMutation = useUpdateApplication();

  // Filter applications based on search and filters
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        `${app.applicant_first_name} ${app.applicant_last_name} ${app.applicant_email}`
          .toLowerCase()
          .includes(lowerSearch)
      );
    }

    // Filter by stage
    if (selectedStageId !== 'all') {
      filtered = filtered.filter(app => app.current_stage_id === selectedStageId);
    }

    // Filter by workflow (through job)
    if (selectedWorkflowId !== 'all') {
      filtered = filtered.filter(app => 
        (app as any).job_postings?.workflow_id === selectedWorkflowId
      );
    }

    return filtered;
  }, [applications, searchTerm, selectedStageId, selectedWorkflowId]);

  // Get stages for a specific application
  const getStagesForApp = (app: Application): WorkflowStage[] => {
    const workflowId = (app as any).job_postings?.workflow_id;
    if (!workflowId) return [];
    return workflowStages.filter(s => s.workflow_id === workflowId);
  };

  // Handle stage update
  const handleStageChange = async (app: Application, stageId: string) => {
    try {
      await updateApplicationMutation.mutateAsync({
        id: app.id,
        data: { current_stage_id: stageId },
      });
      
      log.track('application_stage_updated', { applicationId: app.id, stageId });
      onStageChange?.(app.id, stageId);
      onSuccess?.('Application stage updated');
    } catch (err: any) {
      log.error('Failed to update application stage', { error: err.message });
      onError?.(err.message || 'Failed to update stage');
    }
  };

  // Handle application deletion
  const handleDelete = async (app: Application) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await deleteApplicationMutation.mutateAsync(app.id);
      log.track('application_deleted', { applicationId: app.id });
      onSuccess?.('Application deleted successfully');
    } catch (err: any) {
      log.error('Failed to delete application', { error: err.message });
      onError?.(err.message || 'Failed to delete application');
    }
  };

  // Define table columns
  const columns: Column<Application>[] = useMemo(() => [
    {
      key: 'applicant_name',
      label: 'Applicant',
      sortable: true,
      render: (app) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {app.applicant_first_name} {app.applicant_last_name}
          </div>
          <div className="text-sm text-gray-500">{app.applicant_email}</div>
        </div>
      ),
    },
    {
      key: 'job_title',
      label: 'Job',
      render: (app) => (app as any).job_postings?.job_title || 'Unknown Job',
    },
    {
      key: 'applied_at',
      label: 'Applied Date',
      sortable: true,
      render: (app) => app.applied_at ? format(new Date(app.applied_at), 'MMM dd, yyyy') : '-',
    },
    {
      key: 'current_stage_id',
      label: 'Stage',
      render: (app) => {
        const appStages = getStagesForApp(app);
        if (appStages.length === 0) {
          return <span className="text-sm text-gray-500 italic">No workflow</span>;
        }
        return (
          <select
            value={app.current_stage_id || ''}
            onChange={(e) => handleStageChange(app, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold rounded-full px-3 py-1 border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Stage</option>
            {appStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'ai_score',
      label: 'AI Score',
      sortable: true,
      render: (app) => {
        if (!app.ai_score) return <span className="text-gray-400">N/A</span>;
        return (
          <div className="flex items-center">
            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
              <div
                className={`h-2 rounded-full ${
                  app.ai_score >= 75
                    ? 'bg-green-600'
                    : app.ai_score >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${app.ai_score}%` }}
              />
            </div>
            <span className="text-sm font-medium">{app.ai_score}/100</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (app) => {
        const statusColors: Record<string, string> = {
          new: 'bg-blue-100 text-blue-800',
          screening: 'bg-yellow-100 text-yellow-800',
          interview: 'bg-purple-100 text-purple-800',
          offer: 'bg-indigo-100 text-indigo-800',
          hired: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[app.status?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
            {app.status}
          </span>
        );
      },
    },
  ], [workflowStages]);

  // Define row actions
  const actions: Action<Application>[] = useMemo(() => [
    {
      label: 'View Details',
      icon: Eye,
      onClick: onView,
      variant: 'primary',
    },
    {
      label: 'Schedule Interview',
      icon: Calendar,
      onClick: onScheduleInterview,
      variant: 'default',
    },
  ], [onView, onScheduleInterview]);

  return (
    <GenericCRUDTable
      data={filteredApplications}
      columns={columns}
      loading={isLoading}
      error={error?.message}
      actions={actions}
      onAdd={onAddNew}
      onDelete={handleDelete}
      searchable={false}
      title="Applications"
      emptyMessage="No applications found"
    />
  );
}

export default ApplicationsTable;
