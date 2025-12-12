/**
 * InterviewsTable Component
 * 
 * Displays interviews using GenericCRUDTable and React Query hooks
 * Supports viewing, editing, rescheduling, and completing interviews
 */

import React, { useMemo } from 'react';
import { Calendar, Edit, CheckCircle, XCircle, Eye, Video, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { useInterviews, useUpdateInterview, Interview } from '@/hooks';
import { log } from '@/lib/logger';

interface InterviewsTableProps {
  searchTerm?: string;
  onAddNew: () => void;
  onEdit: (interview: Interview) => void;
  onReschedule: (interview: Interview) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function InterviewsTable({
  searchTerm = '',
  onAddNew,
  onEdit,
  onReschedule,
  onSuccess,
  onError,
}: InterviewsTableProps) {
  // Fetch interviews using React Query
  const { data: interviews = [], isLoading, error } = useInterviews();
  const updateInterviewMutation = useUpdateInterview();

  // Filter interviews based on search term
  const filteredInterviews = useMemo(() => {
    if (!searchTerm) return interviews;
    const lowerSearch = searchTerm.toLowerCase();
    return interviews.filter(interview =>
      interview.interview_type?.toLowerCase().includes(lowerSearch) ||
      interview.status?.toLowerCase().includes(lowerSearch) ||
      interview.location?.toLowerCase().includes(lowerSearch)
    );
  }, [interviews, searchTerm]);

  // Handle marking interview as complete
  const handleMarkComplete = async (interview: Interview) => {
    if (!window.confirm('Mark this interview as completed?')) {
      return;
    }

    try {
      await updateInterviewMutation.mutateAsync({
        id: interview.id,
        data: { status: 'completed' },
      });
      log.track('interview_completed', { interviewId: interview.id });
      onSuccess?.('Interview marked as completed');
    } catch (err: any) {
      log.error('Failed to complete interview', { error: err.message });
      onError?.(err.message || 'Failed to update interview');
    }
  };

  // Handle cancelling interview
  const handleCancel = async (interview: Interview) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    try {
      await updateInterviewMutation.mutateAsync({
        id: interview.id,
        data: { status: 'cancelled' },
      });
      log.track('interview_cancelled', { interviewId: interview.id });
      onSuccess?.('Interview cancelled');
    } catch (err: any) {
      log.error('Failed to cancel interview', { error: err.message });
      onError?.(err.message || 'Failed to cancel interview');
    }
  };

  // Get interview type icon
  const getInterviewTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
      case 'video_call':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'phone':
      case 'phone_screen':
        return <Phone className="w-4 h-4 text-green-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  // Define table columns
  const columns: Column<Interview>[] = useMemo(() => [
    {
      key: 'application_id',
      label: 'Application',
      render: (interview) => {
        const appId = interview.application_id;
        return (
          <span className="font-mono text-sm">
            {appId?.substring(0, 8)}...
          </span>
        );
      },
    },
    {
      key: 'interview_type',
      label: 'Type',
      sortable: true,
      render: (interview) => (
        <div className="flex items-center gap-2">
          {getInterviewTypeIcon(interview.interview_type)}
          <span className="capitalize">{interview.interview_type?.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'scheduled_date',
      label: 'Scheduled Date',
      sortable: true,
      render: (interview) => {
        if (!interview.scheduled_date) return '-';
        const date = new Date(interview.scheduled_date);
        return (
          <div>
            <div className="text-sm font-medium">
              {format(date, 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-gray-500">
              {format(date, 'HH:mm')}
            </div>
          </div>
        );
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (interview) => 
        interview.duration ? `${interview.duration} min` : '60 min',
    },
    {
      key: 'location',
      label: 'Location',
      render: (interview) => {
        if (interview.meeting_link) {
          return (
            <a
              href={interview.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-900 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Join Meeting
            </a>
          );
        }
        return interview.location || 'TBD';
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (interview) => {
        const statusColors: Record<string, string> = {
          scheduled: 'bg-blue-100 text-blue-800',
          confirmed: 'bg-green-100 text-green-800',
          completed: 'bg-gray-100 text-gray-800',
          cancelled: 'bg-red-100 text-red-800',
          no_show: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[interview.status] || 'bg-gray-100 text-gray-800'}`}>
            {interview.status}
          </span>
        );
      },
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (interview) => {
        if (!interview.rating) return <span className="text-gray-400">N/A</span>;
        return (
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-sm ${
                  star <= interview.rating! ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
            <span className="ml-1 text-sm font-medium">{interview.rating}/5</span>
          </div>
        );
      },
    },
  ], []);

  // Define row actions
  const actions: Action<Interview>[] = useMemo(() => [
    {
      label: 'Reschedule',
      icon: Calendar,
      onClick: onReschedule,
      variant: 'default',
      show: (interview) => interview.status !== 'completed' && interview.status !== 'cancelled',
    },
    {
      label: 'Mark Complete',
      icon: CheckCircle,
      onClick: handleMarkComplete,
      variant: 'primary',
      show: (interview) => interview.status === 'scheduled',
    },
    {
      label: 'Cancel',
      icon: XCircle,
      onClick: handleCancel,
      variant: 'danger',
      show: (interview) => interview.status !== 'completed' && interview.status !== 'cancelled',
    },
  ], [onReschedule]);

  return (
    <GenericCRUDTable
      data={filteredInterviews}
      columns={columns}
      loading={isLoading}
      error={error?.message}
      actions={actions}
      onAdd={onAddNew}
      onEdit={onEdit}
      searchable={false}
      title="Interviews"
      emptyMessage="No interviews scheduled"
    />
  );
}

export default InterviewsTable;
