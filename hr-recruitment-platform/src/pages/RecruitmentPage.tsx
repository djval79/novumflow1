import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, Eye, CheckCircle, XCircle, Calendar, LayoutList, Kanban, Filter } from 'lucide-react';
import { format } from 'date-fns';
import AddJobModal from '@/components/AddJobModal';
import AddApplicationModal from '@/components/AddApplicationModal';
import AddInterviewModal from '@/components/AddInterviewModal';
import Toast from '@/components/Toast';
import { X, MessageSquare, Clock } from 'lucide-react';
import { callEmployeeCrud } from '@/lib/employeeCrud';

type TabType = 'jobs' | 'applications' | 'interviews';
type ViewType = 'list' | 'board';

interface ApplicationDetailsModalProps {
  application: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onAiScreen: (app: any) => void;
  onConvertToEmployee: (app: any) => void;
  onGenerateDocument: (app: any, templateId: string) => void;
}

function ApplicationDetailsModal({ application, isOpen, onClose, onUpdate, onAiScreen, onConvertToEmployee, onGenerateDocument }: ApplicationDetailsModalProps) {
  const [notes, setNotes] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const { user } = useAuth();

  if (!isOpen || !application) return null;

  async function handleAddNote() {
    if (!notes.trim()) return;
    setAddingNote(true);

    // In a real app, we'd have a separate notes table. For now, we'll append to the notes field
    // or assume there's a notes table. Let's append with timestamp for this MVP.
    const timestamp = new Date().toLocaleString();
    const newNote = `[${timestamp} - ${user?.email}] ${notes}\n\n`;
    const updatedNotes = (application.notes || '') + newNote;

    const { error } = await supabase
      .from('applications')
      .update({ notes: updatedNotes })
      .eq('id', application.id);

    if (!error) {
      setNotes('');
      onUpdate();
    }
    setAddingNote(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{application.applicant_first_name} {application.applicant_last_name}</h3>
              <p className="text-gray-500">{application.applicant_email}</p>
              <p className="text-gray-500">{application.applicant_phone || 'No phone provided'}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {application.status}
              </span>
              <p className="text-sm text-gray-500 mt-1">Applied: {format(new Date(application.applied_at), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {/* Job Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Applied For</h4>
            <p className="text-gray-900 font-medium">{application.job_postings?.job_title}</p>
            <p className="text-sm text-gray-500">{application.job_postings?.department} • {application.job_postings?.employment_type?.replace('_', ' ')}</p>
          </div>

          {/* AI Screening Results */}
          {(application.ai_score || application.ai_summary) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">AI Screening Results</h4>
              {application.ai_score && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-blue-900">{application.ai_score}/100</span>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${application.ai_score}%` }}></div>
                  </div>
                </div>
              )}
              {application.ai_summary && (
                <p className="text-sm text-blue-700">{application.ai_summary}</p>
              )}
            </div>
          )}

          {/* Links & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {application.cv_url && (
              <a href={application.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                View CV
              </a>
            )}
            <button
              onClick={() => onAiScreen(application)}
              className="flex items-center justify-center p-3 border border-transparent rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
            >
              AI Screen
            </button>
            {application.status === 'Hired' && (
              <>
                <button
                  onClick={() => onConvertToEmployee(application)}
                  className="flex items-center justify-center p-3 border border-transparent rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
                >
                  Convert to Employee
                </button>
                <button
                  onClick={() => onGenerateDocument(application, '1')} // Using hardcoded template ID '1' for offer letter
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  Generate Offer Letter
                </button>
              </>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Notes & Activity
            </h4>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
              {application.notes || 'No notes yet.'}
            </div>

            <div className="flex gap-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={2}
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !notes.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowStages, setWorkflowStages] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [showAddInterviewModal, setShowAddInterviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const { user } = useAuth();

  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadWorkflowsAndStages();
  }, [activeTab]);

  async function loadWorkflowsAndStages() {
    const { data: wfData } = await supabase.from('recruitment_workflows').select('*');
    if (wfData) setWorkflows(wfData);

    const { data: stageData } = await supabase.from('workflow_stages').select('*').order('stage_order');
    if (stageData) setWorkflowStages(stageData);
  }

  async function loadData() {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'jobs':
          const { data: jobData } = await supabase
            .from('job_postings')
            .select('*, recruitment_workflows(name)')
            .order('created_at', { ascending: false });
          setJobs(jobData || []);
          break;

        case 'applications':
          const { data: appData } = await supabase
            .from('applications')
            .select(`
              *,
              job_postings (
                id,
                job_title,
                workflow_id
              )
            `)
            .order('applied_at', { ascending: false });
          setApplications(appData || []);
          break;

        case 'interviews':
          const { data: intData } = await supabase
            .from('interviews')
            .select('*')
            .order('scheduled_date', { ascending: false });
          setInterviews(intData || []);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateJobStatus(jobId: string, newStatus: string) {
    const { error } = await supabase
      .from('job_postings')
      .update({ status: newStatus })
      .eq('id', jobId);

    if (!error) {
      loadData();
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: `UPDATE_JOB_STATUS_${newStatus.toUpperCase()}`,
        entity_type: 'job_postings',
        entity_id: jobId,
        timestamp: new Date().toISOString()
      });
    }
  }

  async function updateApplicationStage(appId: string, stageId: string) {
    // Optimistic update
    setApplications(prev => prev.map(app =>
      app.id === appId ? { ...app, current_stage_id: stageId } : app
    ));

    const { error } = await supabase
      .from('applications')
      .update({
        current_stage_id: stageId,
        last_updated_by: user?.id
      })
      .eq('id', appId);

    if (!error) {
      // No need to reload data immediately if optimistic update worked, 
      // but good to ensure consistency eventually.
      // loadData(); 
      setToast({ message: 'Application stage updated', type: 'success' });
    } else {
      setToast({ message: 'Failed to update stage', type: 'error' });
      loadData(); // Revert on error
    }
  }

  async function deleteJob(jobId: string) {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (!error) {
        setToast({ message: 'Job posting deleted successfully', type: 'success' });
        loadData();
      } else {
        setToast({ message: 'Error deleting job posting', type: 'error' });
      }
    }
  }

  async function deleteApplication(appId: string) {
    if (window.confirm('Are you sure you want to delete this application?')) {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

      if (!error) {
        setToast({ message: 'Application deleted successfully', type: 'success' });
        loadData();
      } else {
        setToast({ message: 'Error deleting application', type: 'error' });
      }
    }
  }

  function viewJobDetails(job: any) {
    alert(`Job Details:\n\nTitle: ${job.job_title}\nDepartment: ${job.department}\nType: ${job.employment_type}\nDescription: ${job.description || 'No description available'}\nLocation: ${job.location || 'Remote'}\nSalary: ${job.salary_range || 'Not specified'}`);
  }

  function editJob(job: any) {
    setSelectedJob(job);
    setShowAddJobModal(true);
  }

  function viewApplicationDetails(app: any) {
    setSelectedApplication(app);
  }

  function scheduleInterviewForApplication(app: any) {
    setSelectedInterview(null); // Clear any selection
    setShowAddInterviewModal(true);
    // Pre-select application logic would go here if modal supported it via props, 
    // but currently it loads all applications. 
    // Ideally we'd pass the app ID to pre-select.
    // For now, just opening the modal is fine.
  }

  function editInterview(interview: any) {
    setSelectedInterview(interview);
    setShowAddInterviewModal(true);
  }

  function rescheduleInterview(interview: any) {
    setSelectedInterview(interview);
    setShowAddInterviewModal(true);
  }

  async function handleAiScreen(application: any) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-screen-resume', {
        body: {
          application_id: application.id,
        },
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);

      setToast({ message: 'AI screening completed successfully!', type: 'success' });
      loadData(); // Refresh the application data to show the new score and summary
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to start AI screening', type: 'error' });
    }
  }

  async function handleGenerateDocument(application: any, templateId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          template_id: templateId,
          application_id: application.id,
        },
      });

      if (error) throw error;

      setToast({ message: 'Document generated successfully!', type: 'success' });
      // You might want to open the document here, or provide a link
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to generate document', type: 'error' });
    }
  }

  async function handleConvertToEmployee(application: any) {
    if (window.confirm(`Are you sure you want to convert ${application.applicant_first_name} ${application.applicant_last_name} to an employee?`)) {
      try {
        await callEmployeeCrud('create', {
          first_name: application.applicant_first_name,
          last_name: application.applicant_last_name,
          email: application.applicant_email,
          phone: application.applicant_phone,
          position: application.job_postings?.job_title,
          department: application.job_postings?.department,
          status: 'active',
          // Other relevant data can be mapped here
        });
        setToast({ message: 'Candidate successfully converted to employee!', type: 'success' });
        setSelectedApplication(null); // Close the modal
      } catch (error: any) {
        setToast({ message: error.message || 'Failed to convert candidate', type: 'error' });
      }
    }
  }

  function handleAddNew() {
    if (activeTab === 'jobs') {
      setSelectedJob(null); // Clear selection for new job
      setShowAddJobModal(true);
    } else if (activeTab === 'applications') {
      setShowAddApplicationModal(true);
    } else if (activeTab === 'interviews') {
      setSelectedInterview(null); // Clear selection for new interview
      setShowAddInterviewModal(true);
    }
  }

  function handleSuccess() {
    setToast({ message: (selectedJob || selectedInterview) ? 'Item updated successfully!' : 'Item created successfully!', type: 'success' });
    loadData();
  }

  function handleError(message: string) {
    setToast({ message, type: 'error' });
  }

  function getStagesForApp(app: any) {
    const workflowId = app.job_postings?.workflow_id;
    if (!workflowId) return [];
    return workflowStages.filter(s => s.workflow_id === workflowId);
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedAppId) {
      updateApplicationStage(draggedAppId, stageId);
      setDraggedAppId(null);
    }
  };

  const tabs = [
    { id: 'jobs', label: 'Job Postings' },
    { id: 'applications', label: 'Applications' },
    { id: 'interviews', label: 'Interviews' },
  ];

  const filteredJobs = jobs.filter(job =>
    job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(app => {
    const matchesSearch = `${app.applicant_first_name} ${app.applicant_last_name} ${app.applicant_email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesWorkflow = selectedWorkflowId === 'all' || app.job_postings?.workflow_id === selectedWorkflowId;
    const matchesJob = selectedJobId === 'all' || app.job_id === selectedJobId;
    const matchesStage = selectedStageId === 'all' || app.current_stage_id === selectedStageId;

    return matchesSearch && matchesWorkflow && matchesJob && matchesStage;
  });

  // Get stages for the selected workflow (for Board View)
  const currentWorkflowStages = selectedWorkflowId !== 'all'
    ? workflowStages.filter(s => s.workflow_id === selectedWorkflowId)
    : [];

  return (
    <div>
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
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'applications' && (
          <div className="flex items-center space-x-4">
            {/* Workflow Filter */}
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

            {/* Job Filter */}
            <div className="flex items-center space-x-2">
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
            </div>

            {/* Stage Filter */}
            <div className="flex items-center space-x-2">
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
            </div>

            {/* View Toggle */}
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
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${viewType === 'board' && activeTab === 'applications' ? 'bg-transparent border-none shadow-none' : ''}`}>
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Job Postings Table */}
            {activeTab === 'jobs' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{job.job_title}</div>
                            <div className="text-sm text-gray-500">{job.location || 'Remote'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {job.employment_type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={job.status}
                              onChange={(e) => updateJobStatus(job.id, e.target.value)}
                              className={`text-xs font-semibold rounded-full px-3 py-1 border-0 outline-none ${job.status === 'active' ? 'bg-green-100 text-green-800' :
                                job.status === 'closed' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                              <option value="draft">Draft</option>
                              <option value="active">Published</option>
                              <option value="closed">Closed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.recruitment_workflows?.name || 'Default'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => viewJobDetails(job)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editJob(job)}
                              className="text-gray-600 hover:text-gray-900 mr-3 p-1 rounded"
                              title="Edit Job"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          No job postings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Applications List View */}
            {activeTab === 'applications' && viewType === 'list' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((app) => {
                        const appStages = getStagesForApp(app);
                        return (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {app.applicant_first_name} {app.applicant_last_name}
                              </div>
                              <div className="text-sm text-gray-500">{app.applicant_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {app.job_postings?.job_title || 'Unknown Job'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(app.applied_at), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {appStages.length > 0 ? (
                                <select
                                  value={app.current_stage_id || ''}
                                  onChange={(e) => updateApplicationStage(app.id, e.target.value)}
                                  className="text-xs font-semibold rounded-full px-3 py-1 border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="">Select Stage</option>
                                  {appStages.map((stage: any) => (
                                    <option key={stage.id} value={stage.id}>
                                      {stage.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-sm text-gray-500 italic">No workflow</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {app.ai_score ? `${app.ai_score}/100` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => viewApplicationDetails(app)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => scheduleInterviewForApplication(app)}
                                className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded"
                                title="Schedule Interview"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteApplication(app.id)}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded"
                                title="Delete Application"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          No applications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Applications Kanban Board View */}
            {activeTab === 'applications' && viewType === 'board' && (
              <div className="h-full overflow-x-auto pb-4">
                {selectedWorkflowId === 'all' ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
                    <Kanban className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Select a Workflow</h3>
                    <p className="text-gray-500 mt-1">Please select a specific workflow to view the Kanban board.</p>
                  </div>
                ) : (
                  <div className="flex space-x-4 min-w-max p-1">
                    {currentWorkflowStages.map((stage) => (
                      <div
                        key={stage.id}
                        className="w-80 bg-gray-50 rounded-lg flex flex-col max-h-[calc(100vh-250px)]"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                        {/* Column Header */}
                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg">
                          <h3 className="font-medium text-gray-900">{stage.name}</h3>
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {filteredApplications.filter(app => app.current_stage_id === stage.id).length}
                          </span>
                        </div>

                        {/* Cards Container */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3">
                          {filteredApplications
                            .filter(app => app.current_stage_id === stage.id)
                            .map((app) => (
                              <div
                                key={app.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, app.id)}
                                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900">{app.applicant_first_name} {app.applicant_last_name}</h4>
                                  {app.score && (
                                    <span className="text-xs font-semibold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                      {app.score}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{app.job_postings?.job_title}</p>
                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                                  <span className="text-xs text-gray-400">{format(new Date(app.applied_at), 'MMM d')}</span>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => viewApplicationDetails(app)}
                                      className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => scheduleInterviewForApplication(app)}
                                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interviews Table */}
            {activeTab === 'interviews' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interviews.length > 0 ? (
                      interviews.map((interview) => (
                        <tr key={interview.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.application_id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {interview.interview_type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(interview.scheduled_date), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                              interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                              {interview.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {interview.rating ? `${interview.rating}/5` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => rescheduleInterview(interview)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                              title="Reschedule Interview"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editInterview(interview)}
                              className="text-gray-600 hover:text-gray-900 mr-3 p-1 rounded"
                              title="Edit Interview"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Mark this interview as completed?')) {
                                  setToast({ message: 'Interview marked as completed', type: 'success' });
                                }
                              }}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Mark Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          No interviews scheduled
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddJobModal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        job={selectedJob}
      />
      <AddApplicationModal
        isOpen={showAddApplicationModal}
        onClose={() => setShowAddApplicationModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />
      <AddInterviewModal
        isOpen={showAddInterviewModal}
        onClose={() => setShowAddInterviewModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        interview={selectedInterview}
      />
      <ApplicationDetailsModal
        application={selectedApplication}
        isOpen={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onUpdate={() => {
          loadData();
          // Keep modal open to show updated notes
        }}
        onAiScreen={handleAiScreen}
        onConvertToEmployee={handleConvertToEmployee}
        onGenerateDocument={handleGenerateDocument}
      />

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
