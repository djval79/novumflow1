import React, { useEffect, useState } from 'react';
import { Fingerprint, Clock, Shield, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function BiometricPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enrolledEmployees, setEnrolledEmployees] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBiometricData();
  }, []);

  async function loadBiometricData() {
    try {
      const { data: enrolled } = await supabase
        .from('biometric_enrollment')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: attendance } = await supabase
        .from('biometric_attendance_logs')
        .select('*')
        .order('log_timestamp', { ascending: false })
        .limit(20);

      const { data: events } = await supabase
        .from('biometric_security_events')
        .select('*')
        .order('event_timestamp', { ascending: false })
        .limit(10);

      setEnrolledEmployees(enrolled || []);
      setRecentAttendance(attendance || []);
      setSecurityEvents(events || []);
    } catch (error) {
      console.error('Error loading biometric data:', error);
    }
  }

  async function handleEnrollEmployee() {
    const employeeId = prompt('Enter Employee ID:');
    if (!employeeId) return;

    const biometricType = confirm('Enroll fingerprint? (Cancel for face)') ? 'fingerprint' : 'face';

    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('biometric-processing', {
        body: {
          action: 'ENROLL',
          data: {
            employee_id: employeeId,
            biometric_type: biometricType,
            fingerprint_template: biometricType === 'fingerprint' ? 'ENCRYPTED_TEMPLATE_DATA' : null,
            face_template: biometricType === 'face' ? 'ENCRYPTED_TEMPLATE_DATA' : null,
            quality_score: 95,
            device_id: 'WEB_INTERFACE'
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      alert('Biometric enrollment successful!');
      loadBiometricData();
    } catch (error) {
      console.error('Error enrolling biometric:', error);
      alert('Enrollment failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogAttendance() {
    const employeeId = prompt('Enter Employee ID:');
    if (!employeeId) return;

    try {
      setLoading(true);
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('biometric-processing', {
        body: {
          action: 'LOG_ATTENDANCE',
          data: {
            employee_id: employeeId,
            log_type: 'clock_in',
            biometric_type: 'fingerprint',
            location: 'Main Office'
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      alert('Attendance logged successfully!');
      loadBiometricData();
    } catch (error) {
      console.error('Error logging attendance:', error);
      alert('Failed to log attendance');
    } finally {
      setLoading(false);
    }
  }

  const successfulAttendance = recentAttendance.filter(a => a.verification_status === 'success').length;
  const averageConfidence = recentAttendance.length > 0
    ? (recentAttendance.reduce((sum, a) => sum + parseFloat(a.confidence_score || 0), 0) / recentAttendance.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biometric System</h1>
          <p className="text-gray-600 mt-1">Attendance Tracking and Security Management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleEnrollEmployee}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            Enroll Employee
          </button>
          <button
            onClick={handleLogAttendance}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Clock className="w-4 h-4 mr-2" />
            Log Attendance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{enrolledEmployees.length}</p>
              <p className="text-xs text-green-600 mt-1">Active Biometrics</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Attendance</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{recentAttendance.length}</p>
              <p className="text-xs text-green-600 mt-1">{successfulAttendance} Successful</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{averageConfidence}%</p>
              <p className="text-xs text-blue-600 mt-1">Verification Score</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Security Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{securityEvents.length}</p>
              <p className="text-xs text-yellow-600 mt-1">Recent Incidents</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'enrollment', 'attendance', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 capitalize ${activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'enrollment' && (
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Employees</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biometric Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrolledEmployees.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{enrollment.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{enrollment.biometric_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(enrollment.enrollment_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{enrollment.quality_score}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${enrollment.enrollment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {enrollment.enrollment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance Logs</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Log Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAttendance.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{log.log_type?.replace('_', ' ') || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.log_timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.confidence_score}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${log.verification_status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {log.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events</h3>
              {securityEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No security events</p>
              ) : (
                securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`border-l-4 p-4 rounded-r-lg ${event.severity_level === 'critical' ? 'border-red-500 bg-red-50' :
                        event.severity_level === 'high' ? 'border-orange-500 bg-orange-50' :
                          'border-yellow-500 bg-yellow-50'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 capitalize">{event.event_type?.replace('_', ' ') || 'Unknown Event'}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.event_description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(event.event_timestamp).toLocaleString()}</span>
                          <span className="px-2 py-1 bg-white rounded capitalize">
                            {event.severity_level}
                          </span>
                          <span className="px-2 py-1 bg-white rounded capitalize">
                            {event.investigation_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
