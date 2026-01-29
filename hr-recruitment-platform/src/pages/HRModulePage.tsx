import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Download, User, FileText, Clock, Calendar, BarChart, Plus, Search, Edit, Trash2, ClipboardList, Shield } from 'lucide-react';
import { callEmployeeCrud } from '@/lib/employeeCrud';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import AddLeaveRequestModal from '@/components/AddLeaveRequestModal';
import HRAnalyticsDashboard from '@/components/HRAnalyticsDashboard';
import Toast from '@/components/Toast';
import SyncToCareFlow, { CompactSyncButton } from '@/components/SyncToCareFlow';
import OnboardingChecklistManager, { OnboardingProgressBadge } from '@/components/OnboardingChecklistManager';
import { Tooltip } from '@/components/ui/Tooltip';
import { exportService } from '@/lib/services/ExportService';
import { useTenant } from '@/contexts/TenantContext';
import { Link } from 'react-router-dom';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';

type TabType = 'employees' | 'documents' | 'attendance' | 'leaves' | 'shifts' | 'onboarding' | 'analytics';

export default function HRModulePage() {
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isProcessingLeave, setIsProcessingLeave] = useState<string | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState<string | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    // Only load data for specific tabs, analytics will load its own
    if (activeTab === 'analytics') {
      setLoading(false); // Analytics dashboard will manage its own loading
      return;
    }

    setLoading(true);
    try {
      switch (activeTab) {
        case 'employees':
          const { data: empData } = await supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });
          setEmployees(empData || []);
          break;

        case 'documents':
          const { data: docData } = await supabase
            .from('documents')
            .select('*')
            .eq('is_current_version', true)
            .order('uploaded_at', { ascending: false });
          setDocuments(docData || []);
          break;

        case 'attendance':
          const { data: attData } = await supabase
            .from('attendance_records')
            .select('*')
            .order('date', { ascending: false })
            .limit(100);
          setAttendance(attData || []);
          break;

        case 'leaves':
          const { data: leaveData } = await supabase
            .from('leave_requests')
            .select('*')
            .order('requested_at', { ascending: false });
          setLeaves(leaveData || []);
          break;

        case 'shifts':
          const { data: shiftData } = await supabase
            .from('shifts')
            .select('*')
            .eq('is_active', true)
            .order('shift_name');
          setShifts(shiftData || []);
          break;
      }
    } catch (error) {
      console.error('Error loading data', error, { component: 'HRModulePage', action: 'loadData', metadata: { activeTab } });
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveLeave(leaveId: string) {
    if (isProcessingLeave) return;
    setIsProcessingLeave(leaveId);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', leaveId);

      if (error) throw error;

      // Log action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'APPROVE_LEAVE',
        entity_type: 'leave_requests',
        entity_id: leaveId,
        timestamp: new Date().toISOString()
      });

      setToast({ message: 'Leave request approved', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error('Error approving leave', error, { leaveId });
      setToast({ message: error.message || 'Failed to approve leave', type: 'error' });
    } finally {
      setIsProcessingLeave(null);
    }
  }

  async function handleRejectLeave(leaveId: string) {
    if (isProcessingLeave) return;
    setIsProcessingLeave(leaveId);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', leaveId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'REJECT_LEAVE',
        entity_type: 'leave_requests',
        entity_id: leaveId,
        timestamp: new Date().toISOString()
      });

      setToast({ message: 'Leave request rejected', type: 'warning' });
      loadData();
    } catch (error: any) {
      console.error('Error rejecting leave', error, { leaveId });
      setToast({ message: error.message || 'Failed to reject leave', type: 'error' });
    } finally {
      setIsProcessingLeave(null);
    }
  }

  function handleAddNew() {
    if (activeTab === 'employees') {
      setShowAddEmployeeModal(true);
    } else if (activeTab === 'leaves') {
      setShowAddLeaveModal(true);
    } else {
      setToast({ message: `Add ${activeTab} feature coming soon`, type: 'warning' });
    }
  }

  async function handleSuccess() {
    setToast({ message: 'Item created successfully!', type: 'success' });
    // Small delay to ensure database has committed the changes
    await new Promise(resolve => setTimeout(resolve, 300));
    await loadData();
  }

  function handleError(message: string) {
    setToast({ message, type: 'error' });
  }

  async function deleteEmployee(employeeId: string) {
    if (isDeletingEmployee) return;
    if (window.confirm('Are you sure you want to delete this employee? This will set their status to terminated.')) {
      setIsDeletingEmployee(employeeId);
      try {
        await callEmployeeCrud('delete', { employee_id: employeeId });
        setToast({ message: 'Employee terminated successfully', type: 'success' });
        loadData();
      } catch (error: any) {
        setToast({ message: error.message || 'Error terminating employee', type: 'error' });
      } finally {
        setIsDeletingEmployee(null);
      }
    }
  }

  function editEmployee(employee: any) {
    setSelectedEmployee(employee);
    setShowEditEmployeeModal(true);
  }

  function viewEmployeeDetails(employee: any) {
    // Navigate to employee details or show modal
    setSelectedEmployee(employee);
    // For now, just show a toast
    setToast({ message: `Viewing details for ${employee.first_name} ${employee.last_name}`, type: 'success' });
  }

  async function handleGenerateDocument(employee: any, templateId: string) {
    if (isGeneratingDoc) return;
    setIsGeneratingDoc(`${employee.id}-${templateId}`);
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          template_id: templateId,
          employee_id: employee.id,
        },
      });

      if (error) throw error;

      setToast({ message: 'Document generated successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error generating document', error, { employeeId: employee.id, templateId });
      setToast({ message: error.message || 'Failed to generate document', type: 'error' });
    } finally {
      setIsGeneratingDoc(null);
    }
  }

  function handleExportEmployees() {
    exportService.exportToCSV(`NovumFlow_Employees_${format(new Date(), 'yyyy-MM-dd')}`, filteredEmployees);
    setToast({ message: 'Employee data exported successfully', type: 'success' });
  }

  function handleExportDocuments() {
    exportService.exportToCSV(`NovumFlow_Documents_${format(new Date(), 'yyyy-MM-dd')}`, documents);
    setToast({ message: 'Document list exported successfully', type: 'success' });
  }

  const tabs = [
    { id: 'employees', label: 'Employees', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar },
    { id: 'shifts', label: 'Shifts', icon: Clock },
    { id: 'onboarding', label: 'Onboarding', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
  ];

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.employee_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Module</h1>
          <p className="mt-1 text-sm text-gray-600">Manage employees, documents, attendance, and more</p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'employees' && (
            <SyncToCareFlow onSuccess={loadData} />
          )}
          <Tooltip content={`Add new ${activeTab.slice(0, -1)}`}>
            <button
              onClick={handleAddNew}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
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
            name="search"
            id="search"
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
          activeTab === 'onboarding' ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="p-0">
              <SkeletonList count={8} />
            </div>
          )
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {activeTab === 'employees' ? filteredEmployees.length : 
               activeTab === 'documents' ? documents.length :
               activeTab === 'attendance' ? attendance.length :
               activeTab === 'leaves' ? leaves.length :
               activeTab === 'shifts' ? shifts.length : 0} {activeTab} Records</div>
              <div className="flex gap-2">
                {(activeTab === 'employees' || activeTab === 'documents') && (
                  currentTenant?.subscription_tier === 'enterprise' ? (
                    <button
                      onClick={activeTab === 'employees' ? handleExportEmployees : handleExportDocuments}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-slate-50 transition-all hover:border-cyan-200"
                    >
                      <Download size={14} className="text-cyan-500" /> Export CSV
                    </button>
                  ) : (
                    <Link
                      to="/billing"
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all"
                    >
                      <Shield size={14} /> Unlock Exports
                    </Link>
                  )
                )}
              </div>
            </div>
            {/* Employees Table */}
            {activeTab === 'employees' && (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Onboarding</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {emp.first_name} {emp.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{emp.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.employee_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.department || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {emp.position || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <OnboardingProgressBadge employeeId={emp.id} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-800' :
                              emp.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Tooltip content="View Details">
                              <button
                                onClick={() => viewEmployeeDetails(emp)}
                                className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded"
                              >
                                <User className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Edit Employee">
                              <button
                                onClick={() => editEmployee(emp)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Terminate Employee">
                              <button
                                onClick={() => deleteEmployee(emp.id)}
                                disabled={isDeletingEmployee === emp.id}
                                className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                              >
                                {isDeletingEmployee === emp.id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </Tooltip>
                            <CompactSyncButton employeeId={emp.id} onSuccess={loadData} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <div key={emp.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{emp.email}</div>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-[10px] font-semibold rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-800' :
                            emp.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {emp.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">ID: <span className="text-gray-900">{emp.employee_number}</span></p>
                            <p className="text-gray-500">Dept: <span className="text-gray-900">{emp.department || 'N/A'}</span></p>
                          </div>
                          <div className="text-right">
                            <OnboardingProgressBadge employeeId={emp.id} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                          <button onClick={() => viewEmployeeDetails(emp)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><User className="w-4 h-4" /></button>
                          <button onClick={() => editEmployee(emp)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button
                            onClick={() => deleteEmployee(emp.id)}
                            disabled={isDeletingEmployee === emp.id}
                            className="p-2 text-red-600 bg-red-50 rounded-lg disabled:opacity-50"
                          >
                            {isDeletingEmployee === emp.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          <CompactSyncButton employeeId={emp.id} onSuccess={loadData} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">No employees found</div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Table */}
            {activeTab === 'documents' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doc.document_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doc.document_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {doc.expiry_date ? format(new Date(doc.expiry_date), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doc.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {doc.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Tooltip content="Download Document">
                              <button
                                onClick={() => {
                                  const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
                                  window.open(publicUrl, '_blank');
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                          No documents found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Documents List */}
                <div className="md:hidden divide-y divide-gray-200">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium text-gray-900">{doc.document_name}</div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${doc.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {doc.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{doc.document_type}</span>
                          <span>Due: {doc.expiry_date ? format(new Date(doc.expiry_date), 'MMM dd') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
                              window.open(publicUrl, '_blank');
                            }}
                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">No documents found</div>
                  )}
                </div>
              </div>
            )}

            {/* Leave Requests Table */}
            {activeTab === 'leaves' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaves.length > 0 ? (
                      leaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.employee_id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {leave.leave_type?.replace('_', ' ') || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                            <span className="ml-2 text-gray-500">({leave.total_days} days)</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                              leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {leave.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Tooltip content="Approve Request">
                                  <button
                                    onClick={() => handleApproveLeave(leave.id)}
                                    disabled={isProcessingLeave === leave.id}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isProcessingLeave === leave.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Approve
                                  </button>
                                </Tooltip>
                                <Tooltip content="Reject Request">
                                  <button
                                    onClick={() => handleRejectLeave(leave.id)}
                                    disabled={isProcessingLeave === leave.id}
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isProcessingLeave === leave.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Reject
                                  </button>
                                </Tooltip>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                          No leave requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Leaves List */}
                <div className="md:hidden divide-y divide-gray-200">
                  {leaves.length > 0 ? (
                    leaves.map((leave) => (
                      <div key={leave.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">{leave.leave_type?.replace('_', ' ') || 'Leave'}</div>
                            <div className="text-xs text-gray-500">{leave.employee_id.substring(0, 8)}...</div>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">
                          {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd')} ({leave.total_days} days)
                        </p>
                        {leave.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                            <button
                              onClick={() => handleApproveLeave(leave.id)}
                              disabled={isProcessingLeave === leave.id}
                              className="px-4 py-2 bg-green-600 text-white text-xs rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isProcessingLeave === leave.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(leave.id)}
                              disabled={isProcessingLeave === leave.id}
                              className="px-4 py-2 bg-red-600 text-white text-xs rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isProcessingLeave === leave.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">No leave requests found</div>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Table */}
            {activeTab === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.length > 0 ? (
                      attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.employee_id?.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.check_in_time || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.check_out_time || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.total_hours || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {record.status || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          No attendance records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Attendance List */}
                <div className="md:hidden divide-y divide-gray-200">
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
                      <div key={record.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {record.status || 'N/A'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <span>In: {record.check_in_time || 'N/A'}</span>
                          <span>Out: {record.check_out_time || 'N/A'}</span>
                          <span>Hours: {record.total_hours || 'N/A'}</span>
                          <span>ID: {record.employee_id?.substring(0, 8)}...</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">No attendance records found</div>
                  )}
                </div>
              </div>
            )}

            {/* Shifts Table */}
            {activeTab === 'shifts' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shifts.length > 0 ? (
                      shifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {shift.shift_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.start_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.end_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.duration_hours || 'N/A'} hours
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shift.working_days || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${shift.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {shift.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          No shifts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Shifts List */}
                <div className="md:hidden divide-y divide-gray-200">
                  {shifts.length > 0 ? (
                    shifts.map((shift) => (
                      <div key={shift.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium text-gray-900">{shift.shift_name}</div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${shift.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {shift.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <span>Start: {shift.start_time}</span>
                          <span>End: {shift.end_time}</span>
                          <span>Duration: {shift.duration_hours || 'N/A'} hours</span>
                          <span>Days: {shift.working_days || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-gray-500">No shifts found</div>
                  )}
                </div>
              </div>
            )}

            {/* Onboarding Tab */}
            {activeTab === 'onboarding' && (
              <div className="p-6">
                {selectedEmployee ? (
                  <div>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      ← Back to employee list
                    </button>
                    <OnboardingChecklistManager
                      employeeId={selectedEmployee.id}
                      employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select an Employee to View Onboarding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {employees.filter(e => e.status === 'active').map(emp => (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                              <p className="text-sm text-gray-500">{emp.position || emp.department || 'Employee'}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <OnboardingProgressBadge employeeId={emp.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {employees.filter(e => e.status === 'active').length === 0 && (
                      <p className="text-center text-gray-500 py-12">No active employees found</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Dashboard */}
            {activeTab === 'analytics' && (
              <HRAnalyticsDashboard
                onLoadingChange={setLoading}
                onError={handleError}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />
      <AddLeaveRequestModal
        isOpen={showAddLeaveModal}
        onClose={() => setShowAddLeaveModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      <EditEmployeeModal
        isOpen={showEditEmployeeModal}
        onClose={() => setShowEditEmployeeModal(false)}
        onSuccess={handleSuccess}
        onError={handleError}
        employee={selectedEmployee}
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
