import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Download, User, FileText, Clock, Calendar, BarChart, Plus, Search, Edit, Trash2, Heart } from 'lucide-react';
import { callEmployeeCrud } from '@/lib/employeeCrud';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import AddLeaveRequestModal from '@/components/AddLeaveRequestModal';
import HRAnalyticsDashboard from '@/components/HRAnalyticsDashboard';
import Toast from '@/components/Toast';
import SyncToCareFlow, { CompactSyncButton } from '@/components/SyncToCareFlow';

type TabType = 'employees' | 'documents' | 'attendance' | 'leaves' | 'shifts' | 'analytics';

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { user } = useAuth();

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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveLeave(leaveId: string) {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', leaveId);

    if (!error) {
      loadData();
      // Log action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'APPROVE_LEAVE',
        entity_type: 'leave_requests',
        entity_id: leaveId,
        timestamp: new Date().toISOString()
      });
    }
  }

  async function handleRejectLeave(leaveId: string) {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', leaveId);

    if (!error) {
      loadData();
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'REJECT_LEAVE',
        entity_type: 'leave_requests',
        entity_id: leaveId,
        timestamp: new Date().toISOString()
      });
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
    if (window.confirm('Are you sure you want to delete this employee? This will set their status to terminated.')) {
      try {
        await callEmployeeCrud('delete', { employee_id: employeeId });
        setToast({ message: 'Employee terminated successfully', type: 'success' });
        loadData();
      } catch (error: any) {
        setToast({ message: error.message || 'Error terminating employee', type: 'error' });
      }
    }
  }

  function editEmployee(employee: any) {
    setSelectedEmployee(employee);
    setShowEditEmployeeModal(true);
  }

  async function handleGenerateDocument(employee: any, templateId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          template_id: templateId,
          employee_id: employee.id,
        },
      });

      if (error) throw error;

      setToast({ message: 'Document generated successfully!', type: 'success' });
      // You might want to open the document here, or provide a link
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to generate document', type: 'error' });
    }
  }

  function viewEmployeeDetails(employee: any) {
    alert(`Employee Details:\n\nName: ${employee.first_name} ${employee.last_name}\nEmail: ${employee.email}\nPhone: ${employee.phone || 'Not provided'}\nDepartment: ${employee.department}\nPosition: ${employee.position}\nStatus: ${employee.status}\nHired: ${employee.date_hired || 'Not specified'}`);
  }

  function approveLeaveRequest(leaveId: string) {
    if (window.confirm('Approve this leave request?')) {
      setToast({ message: 'Leave request approved', type: 'success' });
    }
  }

  function rejectLeaveRequest(leaveId: string) {
    if (window.confirm('Reject this leave request?')) {
      setToast({ message: 'Leave request rejected', type: 'warning' });
    }
  }

  const tabs = [
    { id: 'employees', label: 'Employees', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar },
    { id: 'shifts', label: 'Shifts', icon: Clock },
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
          <button
            onClick={handleAddNew}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </button>
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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Employees Table */}
            {activeTab === 'employees' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-800' :
                              emp.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => viewEmployeeDetails(emp)}
                              className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded"
                              title="View Details"
                            >
                              <User className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editEmployee(emp)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEmployee(emp.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateDocument(emp, '2')} // Using hardcoded template ID '2' for contract
                              className="text-gray-600 hover:text-gray-900 p-1 rounded"
                              title="Generate Document"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <CompactSyncButton employeeId={emp.id} onSuccess={loadData} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Documents Table */}
            {activeTab === 'documents' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                            <button
                              onClick={() => {
                                const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(doc.file_path);
                                window.open(publicUrl, '_blank');
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded"
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
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
              </div>
            )}

            {/* Leave Requests Table */}
            {activeTab === 'leaves' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                                <button
                                  onClick={() => handleApproveLeave(leave.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(leave.id)}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Reject
                                </button>
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
