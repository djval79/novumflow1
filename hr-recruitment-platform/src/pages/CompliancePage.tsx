import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Download, Plus, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ComplianceSummary {
  compliance_score: number;
  total_alerts: number;
  critical_alerts: number;
  total_visa_records: number;
  expiring_visas: number;
  total_rtw_checks: number;
  total_persons: number;
  compliant_persons: number;
  non_compliant_persons: number;
}

interface ComplianceAlert {
  id: string;
  alert_title: string;
  alert_message: string;
  alert_priority: string;
  due_date: string;
  is_acknowledged: boolean;
}

export default function CompliancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadComplianceData();
  }, []);

  async function loadComplianceData() {
    try {
      // Load data directly from compliance tables
      const [personsResult, documentsResult, tasksResult, notificationsResult] = await Promise.all([
        supabase.from('compliance_persons').select('*'),
        supabase.from('compliance_documents').select('*, compliance_document_types(*)'),
        supabase.from('compliance_tasks').select('*').eq('status', 'PENDING'),
        supabase.from('compliance_notifications').select('*').eq('is_read', false)
      ]);
      
      const persons = personsResult.data || [];
      const documents = documentsResult.data || [];
      const tasks = tasksResult.data || [];
      const notifications = notificationsResult.data || [];
      
      // Calculate summary stats
      const compliantCount = persons.filter(p => p.compliance_status === 'COMPLIANT').length;
      const nonCompliantCount = persons.filter(p => p.compliance_status === 'NON_COMPLIANT').length;
      const atRiskCount = persons.filter(p => p.compliance_status === 'AT_RISK').length;
      
      // Calculate compliance score
      const totalPersons = persons.length || 1;
      const complianceScore = Math.round((compliantCount / totalPersons) * 100);
      
      // Get visa documents and check expiring
      const visaDocuments = documents.filter(d => 
        d.compliance_document_types?.category === 'HOME_OFFICE' || 
        d.document_type_id?.includes('visa')
      );
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringVisas = visaDocuments.filter(d => {
        const expiry = new Date(d.expiry_date);
        return expiry > now && expiry < thirtyDaysFromNow;
      }).length;
      
      // Convert tasks to alerts format
      const alerts: ComplianceAlert[] = tasks.map(task => ({
        id: task.id,
        alert_title: task.title,
        alert_message: task.description || '',
        alert_priority: task.urgency?.toLowerCase() || 'medium',
        due_date: task.due_date,
        is_acknowledged: false
      }));
      
      // Build dashboard data structure
      const data = {
        summary: {
          compliance_score: complianceScore,
          total_alerts: tasks.length,
          critical_alerts: tasks.filter(t => t.urgency === 'CRITICAL').length,
          total_visa_records: visaDocuments.length,
          expiring_visas: expiringVisas,
          total_rtw_checks: documents.filter(d => d.compliance_document_types?.name?.includes('Right to Work')).length,
          total_persons: totalPersons,
          compliant_persons: compliantCount,
          non_compliant_persons: nonCompliantCount
        },
        alerts,
        visa_records: visaDocuments.map(d => ({
          id: d.id,
          visa_type: d.compliance_document_types?.name || 'Visa',
          issue_date: d.issue_date,
          expiry_date: d.expiry_date,
          current_status: d.status?.toLowerCase() || 'pending'
        })),
        dbs_certificates: documents.filter(d => 
          d.compliance_document_types?.name?.includes('DBS')
        ).map(d => ({
          id: d.id,
          applicant_name: persons.find(p => p.id === d.person_id)?.full_name || 'Unknown',
          certificate_type: d.compliance_document_types?.name || 'DBS',
          issue_date: d.issue_date,
          status: d.status?.toLowerCase() || 'pending'
        })),
        rtw_checks: documents.filter(d => 
          d.compliance_document_types?.name?.includes('Right to Work')
        ).map(d => ({
          id: d.id,
          check_type: 'initial_check',
          check_date: d.issue_date,
          check_method: 'manual_check',
          check_result: d.status === 'VERIFIED' ? 'pass' : 'pending'
        }))
      };
      
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading compliance data:', error);
      // Set empty data structure on error
      setDashboardData({
        summary: { compliance_score: 0, total_alerts: 0, critical_alerts: 0, total_visa_records: 0, expiring_visas: 0, total_rtw_checks: 0 },
        alerts: [],
        visa_records: [],
        dbs_certificates: [],
        rtw_checks: []
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      // Update the task directly in the database
      const { error } = await supabase
        .from('compliance_tasks')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', alertId);
      
      if (error) throw error;
      
      loadComplianceData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      alert('Failed to acknowledge alert');
    }
  }

  async function handleGenerateAuditPack() {
    // Show informational message - audit pack generation requires edge functions
    alert('ℹ️ Audit Pack Generation\n\nThis feature requires the compliance-monitoring Edge Function to be deployed.\n\nTo enable:\n1. Deploy the compliance-monitoring Edge Function\n2. Configure audit pack templates\n3. Run audit pack generation again\n\nIn the meantime, you can export data manually from the Compliance Hub.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {};
  const alerts = dashboardData?.alerts || [];
  const visaRecords = dashboardData?.visa_records || [];
  const dbsCertificates = dashboardData?.dbs_certificates || [];
  const rtwChecks = dashboardData?.rtw_checks || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Home Office Compliance</h1>
          <p className="text-gray-600 mt-1">UK Immigration and Right-to-Work Management</p>
        </div>
        <button
          onClick={handleGenerateAuditPack}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Generate Audit Pack
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.compliance_score || 0}%</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              (summary.compliance_score || 0) >= 90 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <Shield className={`w-6 h-6 ${
                (summary.compliance_score || 0) >= 90 ? 'text-green-600' : 'text-yellow-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_alerts || 0}</p>
              <p className="text-xs text-red-600 mt-1">{summary.critical_alerts || 0} Critical</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visa Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_visa_records || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">{summary.expiring_visas || 0} Expiring Soon</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">RTW Checks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_rtw_checks || 0}</p>
              <p className="text-xs text-green-600 mt-1">Completed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'alerts', 'visa_records', 'dbs', 'rtw_checks'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Compliance Alerts</h3>
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active alerts</p>
              ) : (
                alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${
                      alert.alert_priority === 'critical' ? 'border-red-500 bg-red-50' :
                      alert.alert_priority === 'high' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{alert.alert_title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.alert_message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Due: {new Date(alert.due_date).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-1 bg-white rounded capitalize">
                            {alert.alert_priority}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="ml-4 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'visa_records' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visaRecords.map((record: any) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.visa_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(record.issue_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(record.expiry_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.current_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.current_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'dbs' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dbsCertificates.map((cert: any) => (
                    <tr key={cert.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{cert.applicant_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{cert.certificate_type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(cert.issue_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          cert.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'rtw_checks' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rtwChecks.map((check: any) => (
                    <tr key={check.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">{check.check_type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(check.check_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{check.check_method?.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          check.check_result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {check.check_result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
