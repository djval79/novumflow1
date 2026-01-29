/**
 * RecruitmentPage - Refactored Version
 * 
 * Uses the new component-based architecture with React Query hooks
 * Significantly reduced from ~1000 lines to ~400 lines
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, LayoutList, Kanban, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  JobsTable, 
  ApplicationsTable, 
  InterviewsTable, 
  ApplicationKanbanBoard 
} from '@/components/recruitment';
import { useJobs, Application, JobPosting, Interview } from '@/hooks';
import AddJobModal from '@/components/AddJobModal';
import AddApplicationModal from '@/components/AddApplicationModal';
import AddInterviewModal from '@/components/AddInterviewModal';
import Toast from '@/components/Toast';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import { callEmployeeCrud } from '@/lib/employeeCrud';
import { log } from '@/lib/logger';

type TabType = 'jobs' | 'applications' | 'interviews';
type ViewType = 'list' | 'board';

interface WorkflowStage {
  id: string;
  name: string;
  workflow_id: string;
  stage_order: number;
}

interface Workflow {
  id: string;
  name: string;
}

export default function RecruitmentPageRefactored() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  
  // Modal states
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [showAddInterviewModal, setShowAddInterviewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Supporting data
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  
  const { user } = useAuth();
  const { data: jobs = [] } = useJobs();

  // Load workflows and stages on mount
  useEffect(() => {
    loadWorkflowsAndStages();
  }, []);

  async function loadWorkflowsAndStages() {
    const { data: wfData } = await supabase.from('recruitment_workflows').select('*');
    if (wfData) setWorkflows(wfData);

    const { data: stageData } = await supabase.from('workflow_stages').select('*').order('stage_order');
    if (stageData) setWorkflowStages(stageData);
  }

  // Toast handlers
  const showSuccess = (message: string) => setToast({ message, type: 'success' });
  const showError = (message: string) => setToast({ message, type: 'error' });

  // Modal handlers
  function handleAddNew() {
    if (activeTab === 'jobs') {
      setSelectedJob(null);
      setShowAddJobModal(true);
    } else if (activeTab === 'applications') {
      setShowAddApplicationModal(true);
    } else if (activeTab === 'interviews') {
      setSelectedInterview(null);
      setShowAddInterviewModal(true);
    }
  }

  // Job handlers
  const handleEditJob = (job: JobPosting) => {
    setSelectedJob(job);
    setShowAddJobModal(true);
  };

  const handleViewJob = (job: JobPosting) => {
    alert(`Job Details:\n\nTitle: ${job.job_title}\nDepartment: ${job.department}\nType: ${job.employment_type}\nDescription: ${job.job_description || 'No description available'}\nLocation: ${job.location || 'Remote'}\nSalary: ${job.salary_range_min && job.salary_range_max ? `$${job.salary_range_min} - $${job.salary_range_max}` : 'Not specified'}`);
  };

  // Application handlers
  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
  };

  const handleScheduleInterview = (app: Application) => {
    setSelectedInterview(null);
    setShowAddInterviewModal(true);
  };

  // Interview handlers
  const handleEditInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowAddInterviewModal(true);
  };

  const handleRescheduleInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowAddInterviewModal(true);
  };

  // AI and document handlers (keeping original functionality)
  async function handleAiScreen(application: Application) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-screen-resume', {
        body: { application_id: application.id },
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);

      showSuccess('AI screening completed successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to start AI screening');
    }
  }

  async function handleGenerateDocument(application: Application, templateId: string) {
    try {
      const { error } = await supabase.functions.invoke('generate-document', {
        body: { template_id: templateId, application_id: application.id },
      });

      if (error) throw error;
      showSuccess('Document generated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to generate document');
    }
  }

  async function handleConvertToEmployee(application: Application) {
    if (!window.confirm(`Convert ${application.applicant_first_name} ${application.applicant_last_name} to an employee?`)) {
      return;
    }

    try {
      await callEmployeeCrud('create', {
        first_name: application.applicant_first_name,
        last_name: application.applicant_last_name,
        email: application.applicant_email,
        phone: application.applicant_phone,
        position: (application as any).job_postings?.job_title,
        department: (application as any).job_postings?.department,
        status: 'active',
      });
      showSuccess('Candidate converted to employee!');
      setSelectedApplication(null);
    } catch (error: any) {
      showError(error.message || 'Failed to convert candidate');
    }
  }

  const tabs = [
    { id: 'jobs', label: 'Job Postings' },
    { id: 'applications', label: 'Applications' },
    { id: 'interviews', label: 'Interviews' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment Module</h1>
          <p className="mt-1 text-sm text-gray-600">Manage job postings, applications, and interviews</p>
        </div>

        <button
          onClick={handleAddNew}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'jobs' ? 'New Job Posting' : activeTab === 'interviews' ? 'Schedule Interview' : 'Add Application'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Application Filters & View Toggle */}
        {activeTab === 'applications' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Workflows</option>
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.name}</option>
                ))}
              </select>
            </div>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 max-w-[150px]"
            >
              <option value="all">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.job_title}</option>
              ))}
            </select>

            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 max-w-[150px]"
            >
              <option value="all">All Stages</option>
              {workflowStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('list')}
                className={`p-2 rounded-md transition ${viewType === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="List View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('board')}
                className={`p-2 rounded-md transition ${viewType === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Board View"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className={`${viewType === 'board' && activeTab === 'applications' ? '' : 'bg-white rounded-xl shadow-sm border border-gray-200'}`}>
        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <JobsTable
            searchTerm={searchTerm}
            onAddNew={handleAddNew}
            onEdit={handleEditJob}
            onView={handleViewJob}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* Applications Tab - List View */}
        {activeTab === 'applications' && viewType === 'list' && (
          <ApplicationsTable
            searchTerm={searchTerm}
            selectedJobId={selectedJobId}
            selectedStageId={selectedStageId}
            selectedWorkflowId={selectedWorkflowId}
            workflowStages={workflowStages}
            onAddNew={handleAddNew}
            onView={handleViewApplication}
            onScheduleInterview={handleScheduleInterview}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* Applications Tab - Board View */}
        {activeTab === 'applications' && viewType === 'board' && (
          <ApplicationKanbanBoard
            selectedWorkflowId={selectedWorkflowId}
            selectedJobId={selectedJobId}
            workflowStages={workflowStages}
            searchTerm={searchTerm}
            onViewApplication={handleViewApplication}
            onScheduleInterview={handleScheduleInterview}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <InterviewsTable
            searchTerm={searchTerm}
            onAddNew={handleAddNew}
            onEdit={handleEditInterview}
            onReschedule={handleRescheduleInterview}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}
      </div>

      {/* Modals */}
      <AddJobModal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        onSuccess={() => {
          showSuccess(selectedJob ? 'Job updated!' : 'Job created!');
        }}
        onError={showError}
        job={selectedJob}
      />
      
      <AddApplicationModal
        isOpen={showAddApplicationModal}
        onClose={() => setShowAddApplicationModal(false)}
        onSuccess={() => showSuccess('Application added!')}
        onError={showError}
      />
      
      <AddInterviewModal
        isOpen={showAddInterviewModal}
        onClose={() => setShowAddInterviewModal(false)}
        onSuccess={() => showSuccess(selectedInterview ? 'Interview updated!' : 'Interview scheduled!')}
        onError={showError}
        interview={selectedInterview}
      />

      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={() => {
            // Data will auto-refresh via React Query
          }}
          onAiScreen={handleAiScreen}
          onConvertToEmployee={handleConvertToEmployee}
          onGenerateDocument={handleGenerateDocument}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
