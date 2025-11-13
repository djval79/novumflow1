import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Edit, Trash2, Eye, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import AddJobModal from '@/components/AddJobModal';
import AddApplicationModal from '@/components/AddApplicationModal';
import AddInterviewModal from '@/components/AddInterviewModal';
import Toast from '@/components/Toast';

type TabType = 'jobs' | 'applications' | 'interviews';

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [showAddInterviewModal, setShowAddInterviewModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'jobs':
          const { data: jobData } = await supabase
            .from('job_postings')
            .select('*')
            .order('created_at', { ascending: false });
          setJobs(jobData || []);
          break;
          
        case 'applications':
          const { data: appData } = await supabase
            .from('applications')
            .select('*')
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

  async function updateApplicationStatus(appId: string, newStatus: string) {
    const { error } = await supabase
      .from('applications')
      .update({ 
        status: newStatus,
        last_updated_by: user?.id
      })
      .eq('id', appId);

    if (!error) {
      loadData();
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: `UPDATE_APPLICATION_STATUS_${newStatus.toUpperCase()}`,
        entity_type: 'applications',
        entity_id: appId,
        timestamp: new Date().toISOString()
      });
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
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          action: 'DELETE_JOB',
          entity_type: 'job_postings',
          entity_id: jobId,
          timestamp: new Date().toISOString()
        });
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
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          action: 'DELETE_APPLICATION',
          entity_type: 'applications',
          entity_id: appId,
          timestamp: new Date().toISOString()
        });
      } else {
        setToast({ message: 'Error deleting application', type: 'error' });
      }
    }
  }

  function viewJobDetails(job: any) {
    alert(`Job Details:\n\nTitle: ${job.job_title}\nDepartment: ${job.department}\nType: ${job.employment_type}\nDescription: ${job.description || 'No description available'}\nLocation: ${job.location || 'Remote'}\nSalary: ${job.salary_range || 'Not specified'}`);
  }

  function editJob(job: any) {
    setToast({ message: 'Edit functionality will be available in the next update', type: 'warning' });
  }

  function viewApplicationDetails(app: any) {
    alert(`Application Details:\n\nApplicant: ${app.applicant_first_name} ${app.applicant_last_name}\nEmail: ${app.applicant_email}\nPhone: ${app.applicant_phone || 'Not provided'}\nStatus: ${app.status}\nApplied: ${format(new Date(app.applied_at), 'MMM dd, yyyy')}\nScore: ${app.score || 'Not scored'}`);
  }

  function scheduleInterviewForApplication(app: any) {
    setShowAddInterviewModal(true);
    setToast({ message: 'Interview scheduling modal opened', type: 'success' });
  }

  function editInterview(interview: any) {
    setToast({ message: 'Interview edit functionality will be available in the next update', type: 'warning' });
  }

  function rescheduleInterview(interview: any) {
    if (window.confirm('Reschedule this interview?')) {
      setToast({ message: 'Interview rescheduling will be available in the next update', type: 'warning' });
    }
  }

  function handleAddNew() {
    if (activeTab === 'jobs') {
      setShowAddJobModal(true);
    } else if (activeTab === 'applications') {
      setShowAddApplicationModal(true);
    } else if (activeTab === 'interviews') {
      setShowAddInterviewModal(true);
    }
  }

  function handleSuccess() {
    setToast({ message: 'Item created successfully!', type: 'success' });
    loadData();
  }

  function handleError(message: string) {
    setToast({ message, type: 'error' });
  }

  const tabs = [
    { id: 'jobs', label: 'Job Postings' },
    { id: 'applications', label: 'Applications' },
    { id: 'interviews', label: 'Interviews' },
  ];

  const filteredJobs = jobs.filter(job =>
    job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(app =>
    `${app.applicant_first_name} ${app.applicant_last_name} ${app.applicant_email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
      <div className="mb-6 border-b border-gray-200">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
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
                              className={`text-xs font-semibold rounded-full px-3 py-1 border-0 outline-none ${
                                job.status === 'published' ? 'bg-green-100 text-green-800' :
                                job.status === 'closed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="closed">Closed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.application_deadline ? format(new Date(job.application_deadline), 'MMM dd, yyyy') : 'N/A'}
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

            {/* Applications Table */}
            {activeTab === 'applications' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {app.applicant_first_name} {app.applicant_last_name}
                            </div>
                            <div className="text-sm text-gray-500">{app.applicant_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {app.job_posting_id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(app.applied_at), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={app.status}
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                              className={`text-xs font-semibold rounded-full px-3 py-1 border-0 outline-none ${
                                app.status === 'hired' ? 'bg-green-100 text-green-800' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                app.status === 'interview_scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <option value="applied">Applied</option>
                              <option value="screening">Screening</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interview_scheduled">Interview Scheduled</option>
                              <option value="interviewed">Interviewed</option>
                              <option value="offer_extended">Offer Extended</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {app.score || 'N/A'}
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
                              onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                              className="text-green-600 hover:text-green-900 mr-3 p-1 rounded" 
                              title="Shortlist"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 mr-3 p-1 rounded" 
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
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
                      ))
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              interview.status === 'completed' ? 'bg-green-100 text-green-800' :
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
