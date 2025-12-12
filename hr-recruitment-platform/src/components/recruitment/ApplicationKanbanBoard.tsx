/**
 * ApplicationKanbanBoard Component
 * 
 * Displays applications in a Kanban board view with drag and drop support
 * Uses React Query for data fetching and optimistic updates
 */

import React, { useState, useMemo } from 'react';
import { Eye, Calendar, Kanban } from 'lucide-react';
import { format } from 'date-fns';
import { useApplications, useUpdateApplication, Application } from '@/hooks';
import { log } from '@/lib/logger';

interface WorkflowStage {
  id: string;
  name: string;
  workflow_id: string;
  stage_order: number;
}

interface ApplicationKanbanBoardProps {
  selectedWorkflowId: string;
  selectedJobId?: string;
  workflowStages: WorkflowStage[];
  searchTerm?: string;
  onViewApplication: (application: Application) => void;
  onScheduleInterview: (application: Application) => void;
  onStageChange?: (applicationId: string, stageId: string) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ApplicationKanbanBoard({
  selectedWorkflowId,
  selectedJobId = 'all',
  workflowStages,
  searchTerm = '',
  onViewApplication,
  onScheduleInterview,
  onStageChange,
  onSuccess,
  onError,
}: ApplicationKanbanBoardProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // Fetch applications
  const { data: applications = [], isLoading, error } = useApplications({
    jobId: selectedJobId !== 'all' ? selectedJobId : undefined,
  });
  
  const updateApplicationMutation = useUpdateApplication();

  // Filter applications
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

    // Filter by workflow
    if (selectedWorkflowId !== 'all') {
      filtered = filtered.filter(app => 
        (app as any).job_postings?.workflow_id === selectedWorkflowId
      );
    }

    return filtered;
  }, [applications, searchTerm, selectedWorkflowId]);

  // Get stages for current workflow
  const currentWorkflowStages = useMemo(() => {
    if (selectedWorkflowId === 'all') return [];
    return workflowStages
      .filter(s => s.workflow_id === selectedWorkflowId)
      .sort((a, b) => a.stage_order - b.stage_order);
  }, [workflowStages, selectedWorkflowId]);

  // Handle stage update
  const handleStageUpdate = async (appId: string, stageId: string) => {
    try {
      await updateApplicationMutation.mutateAsync({
        id: appId,
        data: { current_stage_id: stageId },
      });
      
      log.track('application_stage_updated_kanban', { applicationId: appId, stageId });
      onStageChange?.(appId, stageId);
      onSuccess?.('Application moved to new stage');
    } catch (err: any) {
      log.error('Failed to update application stage', { error: err.message });
      onError?.(err.message || 'Failed to update stage');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
    log.track('kanban_drag_start', { applicationId: appId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedAppId) {
      handleStageUpdate(draggedAppId, stageId);
      setDraggedAppId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
  };

  // Show prompt to select workflow
  if (selectedWorkflowId === 'all') {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <Kanban className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Select a Workflow</h3>
        <p className="text-gray-500 mt-1">Please select a specific workflow to view the Kanban board.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-red-200 bg-red-50">
        <p className="text-red-600">Error loading applications: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="flex space-x-4 min-w-max p-1">
        {currentWorkflowStages.map((stage) => {
          const stageApplications = filteredApplications.filter(
            app => app.current_stage_id === stage.id
          );

          return (
            <div
              key={stage.id}
              className={`w-80 bg-gray-50 rounded-lg flex flex-col max-h-[calc(100vh-250px)] transition-all ${
                draggedAppId ? 'border-2 border-dashed border-indigo-300' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg">
                <h3 className="font-medium text-gray-900">{stage.name}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {stageApplications.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {stageApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No applications in this stage
                  </div>
                ) : (
                  stageApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      isDragging={draggedAppId === app.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onView={() => onViewApplication(app)}
                      onScheduleInterview={() => onScheduleInterview(app)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: Application;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, appId: string) => void;
  onDragEnd: () => void;
  onView: () => void;
  onScheduleInterview: () => void;
}

function ApplicationCard({
  application,
  isDragging,
  onDragStart,
  onDragEnd,
  onView,
  onScheduleInterview,
}: ApplicationCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, application.id)}
      onDragEnd={onDragEnd}
      className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">
          {application.applicant_first_name} {application.applicant_last_name}
        </h4>
        {application.ai_score && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            application.ai_score >= 75
              ? 'bg-green-50 text-green-700'
              : application.ai_score >= 50
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {application.ai_score}%
          </span>
        )}
      </div>

      {/* Job Title */}
      <p className="text-xs text-gray-500 mb-2">
        {(application as any).job_postings?.job_title || 'Unknown Job'}
      </p>

      {/* Email */}
      <p className="text-xs text-gray-400 mb-2 truncate" title={application.applicant_email}>
        {application.applicant_email}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {application.applied_at && format(new Date(application.applied_at), 'MMM d')}
        </span>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-1 text-gray-400 hover:text-indigo-600 rounded transition"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onScheduleInterview();
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded transition"
            title="Schedule Interview"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationKanbanBoard;
