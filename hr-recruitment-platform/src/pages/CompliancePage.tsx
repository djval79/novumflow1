import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { log } from '@/lib/logger';

interface VisaRecord {
  id: string;
  visa_type: string;
  issue_date: string;
  expiry_date: string;
  current_status: string;
}

interface DBSCertificate {
  id: string;
  applicant_name: string;
  certificate_type: string;
  issue_date: string;
  status: string;
}

interface RTWCheck {
  id: string;
  check_type: string;
  check_date: string;
  check_method?: string;
  check_result: string;
}

interface ComplianceAlert {
  id: string;
  alert_title: string;
  alert_message: string;
  alert_priority: 'critical' | 'high' | 'medium' | 'low';
  due_date: string;
}

interface DashboardData {
  summary: {
    compliance_score?: number;
    total_alerts?: number;
    critical_alerts?: number;
    total_visa_records?: number;
    expiring_visas?: number;
    total_rtw_checks?: number;
  };
  alerts: ComplianceAlert[];
  visa_records: VisaRecord[];
  dbs_certificates: DBSCertificate[];
  rtw_checks: RTWCheck[];
}

export default function CompliancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadComplianceData();
  }, []);

  async function loadComplianceData() {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      const { data, error } = await supabase.functions.invoke('compliance-dashboard-data', {
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (error) throw error;
      setDashboardData(data.data);
    } catch (error) {
      log.error('Error loading compliance data', error, { component: 'CompliancePage', action: 'loadComplianceData' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('compliance-monitoring', {
        body: {
          action: 'ACKNOWLEDGE_ALERT',
          data: { alert_id: alertId }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      loadComplianceData();
    } catch (error) {
      log.error('Error acknowledging alert', error, { component: 'CompliancePage', action: 'handleAcknowledgeAlert', metadata: { alertId } });
    }
  }

  async function handleGenerateAuditPack() {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) return;

      await supabase.functions.invoke('compliance-monitoring', {
        body: {
          action: 'GENERATE_AUDIT_PACK',
          data: {
            pack_name: `Audit Pack ${new Date().toLocaleDateString()}`,
            pack_type: 'compliance_review',
            date_range_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            date_range_end: new Date().toISOString().split('T')[0]
          }
        },
        headers: {
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      alert('Audit pack generated successfully!');
      loadComplianceData();
    } catch (error) {
      log.error('Error generating audit pack', error, { component: 'CompliancePage', action: 'handleGenerateAuditPack' });
      alert('Failed to generate audit pack');
    }
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(summary.compliance_score || 0) >= 90 ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
              <Shield className={`w-6 h-6 ${(summary.compliance_score || 0) >= 90 ? 'text-green-600' : 'text-yellow-600'
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
                className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === tab
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
                alerts.map((alert: ComplianceAlert) => (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${alert.alert_priority === 'critical' ? 'border-red-500 bg-red-50' :
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
                  {visaRecords.map((record: VisaRecord) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.visa_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(record.issue_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(record.expiry_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${record.current_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                  {dbsCertificates.map((cert: DBSCertificate) => (
                    <tr key={cert.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{cert.applicant_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{cert.certificate_type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(cert.issue_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${cert.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
                  {rtwChecks.map((check: RTWCheck) => (
                    <tr key={check.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">{check.check_type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(check.check_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{check.check_method?.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${check.check_result === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
