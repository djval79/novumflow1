/**
 * Compliance Hub Page
 * 
 * Comprehensive compliance management interface integrating:
 * - Home Office & CQC compliance tracking
 * - Document lifecycle management
 * - Automated alerts and workflows
 * - Real-time compliance scoring
 * - Cross-app synchronization with CareFlow
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileCheck,
  Users,
  TrendingUp,
  Calendar,
  Bell,
  FolderOpen,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Info,
  Eye,
  Upload,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  FileText,
  UserPlus,
  Activity,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import {
  useComplianceStats,
  useCompliancePersons,
  useComplianceDocuments,
  useExpiringDocuments,
  useComplianceTasks,
  useComplianceFolders,
  useComplianceNotifications,
  useVerifyDocument,
  useUpdateTask,
  useMarkNotificationRead,
  type CompliancePerson,
  type ComplianceDocument,
  type ComplianceTask,
  type ExpiringDocument,
} from '@/hooks/useComplianceData';
import { 
  COMPLIANCE_FOLDER_STRUCTURE, 
  type ComplianceAuthority, 
  type ComplianceStage 
} from '@/lib/compliance/complianceTypes';

// ===========================================
// HELPER COMPONENTS
// ===========================================

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
  loading?: boolean;
}> = ({ title, value, subtitle, icon, color, bgColor, trend, onClick, loading }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {loading ? (
          <div className="h-9 mt-2 flex items-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <p className={`text-3xl font-bold mt-2 ${color}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trend.positive && 'rotate-180'}`} />
            {trend.value}% from last month
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${bgColor}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ComplianceScoreGauge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg'; label?: string }> = ({ 
  score, 
  size = 'md',
  label = 'Compliance'
}) => {
  const sizeConfig = {
    sm: { container: 'w-20 h-20', text: 'text-lg', subtext: 'text-[10px]', strokeWidth: 6 },
    md: { container: 'w-28 h-28', text: 'text-2xl', subtext: 'text-xs', strokeWidth: 7 },
    lg: { container: 'w-36 h-36', text: 'text-3xl', subtext: 'text-sm', strokeWidth: 8 },
  };

  const config = sizeConfig[size];
  
  const getColor = (s: number) => {
    if (s >= 90) return '#10b981';
    if (s >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative ${config.container}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#e5e7eb"
          strokeWidth={config.strokeWidth}
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={getColor(score)}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${config.text}`} style={{ color: getColor(score) }}>
          {score}%
        </span>
        <span className={`text-gray-500 ${config.subtext}`}>{label}</span>
      </div>
    </div>
  );
};

const AuthorityBadge: React.FC<{ authority: ComplianceAuthority; size?: 'sm' | 'md' }> = ({ 
  authority, 
  size = 'md' 
}) => {
  const config = {
    HOME_OFFICE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Home Office' },
    CQC: { bg: 'bg-green-100', text: 'text-green-800', label: 'CQC' },
    BOTH: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Both' },
    INTERNAL: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Internal' },
  };

  const { bg, text, label } = config[authority] || config.INTERNAL;
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

  return (
    <span className={`rounded-full font-medium ${bg} ${text} ${sizeClass}`}>
      {label}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const config: Record<string, { bg: string; text: string; icon?: React.ReactNode }> = {
    COMPLIANT: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 className="w-3 h-3" /> },
    AT_RISK: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <AlertTriangle className="w-3 h-3" /> },
    NON_COMPLIANT: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> },
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Clock className="w-3 h-3" /> },
    VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCheck className="w-3 h-3" /> },
    UPLOADED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Upload className="w-3 h-3" /> },
    UNDER_REVIEW: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Eye className="w-3 h-3" /> },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> },
    EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-3 h-3" /> },
    EXPIRING_SOON: { bg: 'bg-orange-100', text: 'text-orange-800', icon: <Clock className="w-3 h-3" /> },
  };

  const { bg, text, icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${bg} ${text} ${sizeClass}`}>
      {icon}
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    LOW: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  };

  const { bg, text, dot } = config[urgency] || config.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
      {urgency}
    </span>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm">{description}</p>
  </div>
);

// ===========================================
// TAB COMPONENTS
// ===========================================

const OverviewTab: React.FC<{ 
  stats: any; 
  loading: boolean;
  onStageClick: (stage: ComplianceStage) => void;
}> = ({ stats, loading, onStageClick }) => {
  const stages: ComplianceStage[] = ['APPLICATION', 'PRE_EMPLOYMENT', 'ONBOARDING', 'ONGOING', 'OFFBOARDING'];

  return (
    <div className="space-y-6">
      {/* Stage Overview */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Compliance by Stage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage) => {
            const count = stats?.byStage?.[stage] || 0;
            const percentage = stats?.totalPersons > 0 
              ? Math.round((count / stats.totalPersons) * 100) 
              : 0;

            return (
              <div
                key={stage}
                onClick={() => onStageClick(stage)}
                className="p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {stage.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-2xl font-bold text-indigo-600">{count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance Pipeline */}
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-6">Compliance Pipeline Flow</h4>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {stages.slice(0, 4).map((stage, index) => (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-indigo-200">
                  {stats?.byStage?.[stage] || 0}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center font-medium">
                  {stage.replace(/_/g, ' ')}
                </span>
              </div>
              {index < 3 && (
                <div className="flex-shrink-0 mx-2">
                  <ChevronRight className="w-6 h-6 text-indigo-300" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Authority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Office */}
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Home Office Compliance</h4>
              <p className="text-sm text-gray-500">Right to Work & Immigration</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <ComplianceScoreGauge 
              score={stats?.byAuthority?.homeOffice?.score || 0} 
              size="sm" 
              label="Score"
            />
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {stats?.byAuthority?.homeOffice?.compliant || 0}/{stats?.totalPersons || 0}
              </p>
              <p className="text-sm text-gray-500">Fully Compliant</p>
            </div>
          </div>
        </div>

        {/* CQC */}
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">CQC Compliance</h4>
              <p className="text-sm text-gray-500">Care Quality Standards</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <ComplianceScoreGauge 
              score={stats?.byAuthority?.cqc?.score || 0} 
              size="sm" 
              label="Score"
            />
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {stats?.byAuthority?.cqc?.compliant || 0}/{stats?.totalPersons || 0}
              </p>
              <p className="text-sm text-gray-500">Fully Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpiringDocumentsTab: React.FC<{
  tenantId: string;
  onSendReminder: (doc: ExpiringDocument) => void;
}> = ({ tenantId, onSendReminder }) => {
  const [daysFilter, setDaysFilter] = useState(30);
  const { data: expiringDocs, isLoading } = useExpiringDocuments(tenantId, daysFilter);

  const criticalCount = expiringDocs?.filter(d => d.days_until_expiry <= 7).length || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Documents Expiring Soon</h3>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={7}>Next 7 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      </div>

      {/* Critical Alert */}
      {criticalCount > 0 && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Critical Documents Expiring</h4>
            <p className="text-sm text-red-600 mt-1">
              {criticalCount} document{criticalCount !== 1 ? 's' : ''} will expire within 7 days.
              Immediate action required to maintain compliance.
            </p>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : expiringDocs && expiringDocs.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Authority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expiringDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{doc.person_name}</p>
                      <p className="text-xs text-gray-500">{doc.person_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.document_type}</td>
                  <td className="px-4 py-3">
                    <AuthorityBadge authority={doc.authority} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="text-gray-900">{new Date(doc.expiry_date).toLocaleDateString()}</p>
                      <p className={`text-xs ${doc.days_until_expiry <= 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {doc.days_until_expiry <= 0 
                          ? `Expired ${Math.abs(doc.days_until_expiry)} days ago`
                          : `${doc.days_until_expiry} days left`
                        }
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UrgencyBadge urgency={doc.urgency} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSendReminder(doc)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      <Send className="w-3 h-3" />
                      Remind
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-green-500" />}
          title="No Expiring Documents"
          description={`No documents expiring in the next ${daysFilter} days. Great job staying on top of compliance!`}
        />
      )}
    </div>
  );
};

const PendingVerificationTab: React.FC<{
  tenantId: string;
}> = ({ tenantId }) => {
  const { data: documents, isLoading } = useComplianceDocuments(tenantId, { status: 'UPLOADED' });
  const verifyMutation = useVerifyDocument(tenantId);

  const handleVerify = async (docId: string, approved: boolean) => {
    await verifyMutation.mutateAsync({
      documentId: docId,
      verified: approved,
      rejectedReason: !approved ? 'Document verification failed' : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Documents Awaiting Verification</h3>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          Bulk Verify
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{doc.person_name}</p>
                  <p className="text-sm text-gray-500">
                    {doc.document_type_name} &bull; Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AuthorityBadge authority={doc.authority} />
                <button
                  onClick={() => handleVerify(doc.id, true)}
                  disabled={verifyMutation.isPending}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleVerify(doc.id, false)}
                  disabled={verifyMutation.isPending}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CheckCheck className="w-8 h-8 text-green-500" />}
          title="All Documents Verified"
          description="No documents pending verification. All uploaded documents have been reviewed."
        />
      )}
    </div>
  );
};

const TasksTab: React.FC<{
  tenantId: string;
}> = ({ tenantId }) => {
  const { data: tasks, isLoading } = useComplianceTasks(tenantId, { status: 'PENDING' });
  const updateTask = useUpdateTask(tenantId);

  const handleCompleteTask = async (taskId: string) => {
    await updateTask.mutateAsync({
      id: taskId,
      updates: { status: 'COMPLETED', completed_at: new Date().toISOString() },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Compliance Tasks</h3>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option>All Urgencies</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.urgency === 'CRITICAL' ? 'bg-red-100' :
                    task.urgency === 'HIGH' ? 'bg-orange-100' :
                    task.urgency === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Activity className={`w-5 h-5 ${
                      task.urgency === 'CRITICAL' ? 'text-red-600' :
                      task.urgency === 'HIGH' ? 'text-orange-600' :
                      task.urgency === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <UrgencyBadge urgency={task.urgency} />
                      {task.person_name && (
                        <span className="text-xs text-gray-500">
                          For: {task.person_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={updateTask.isPending}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CheckCheck className="w-8 h-8 text-green-500" />}
          title="No Pending Tasks"
          description="All compliance tasks have been completed. Check back later for new tasks."
        />
      )}
    </div>
  );
};

const PeopleTab: React.FC<{
  tenantId: string;
  stageFilter?: ComplianceStage;
  onClearFilter: () => void;
}> = ({ tenantId, stageFilter, onClearFilter }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: persons, isLoading } = useCompliancePersons(tenantId, {
    stage: stageFilter,
    status: statusFilter as any || undefined,
    search: searchQuery || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="AT_RISK">At Risk</option>
          <option value="NON_COMPLIANT">Non-Compliant</option>
          <option value="PENDING">Pending</option>
        </select>
        {stageFilter && (
          <button
            onClick={onClearFilter}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200"
          >
            Stage: {stageFilter.replace(/_/g, ' ')} &times;
          </button>
        )}
      </div>

      {/* People List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : persons && persons.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scores</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {persons.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{person.full_name}</p>
                      <p className="text-xs text-gray-500">{person.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{person.person_type.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{person.current_stage.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={person.compliance_status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Overall</p>
                        <p className="font-bold text-gray-900">{person.overall_compliance_score}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-blue-500">HO</p>
                        <p className="font-medium text-blue-600">{person.home_office_score}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-green-500">CQC</p>
                        <p className="font-medium text-green-600">{person.cqc_score}%</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Users className="w-8 h-8 text-gray-400" />}
          title="No People Found"
          description="No compliance records match your current filters. Try adjusting your search criteria."
        />
      )}
    </div>
  );
};

// ===========================================
// MAIN COMPONENT
// ===========================================

const ComplianceHubPage: React.FC = () => {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || '';
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'expiring' | 'pending' | 'tasks' | 'people'>('overview');
  const [stageFilter, setStageFilter] = useState<ComplianceStage | undefined>();
  const [showNotifications, setShowNotifications] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useComplianceStats(tenantId);
  const { data: notifications } = useComplianceNotifications(tenantId, { unreadOnly: true });

  // Calculate overall score
  const overallScore = useMemo(() => {
    if (!stats || stats.totalPersons === 0) return 0;
    return Math.round((stats.compliant / stats.totalPersons) * 100);
  }, [stats]);

  const unreadNotificationCount = notifications?.length || 0;

  const handleStageClick = (stage: ComplianceStage) => {
    setStageFilter(stage);
    setActiveTab('people');
  };

  const handleSendReminder = (doc: ExpiringDocument) => {
    // TODO: Implement reminder sending
    console.log('Send reminder for:', doc);
  };

  const handleSync = async () => {
    // TODO: Implement sync to CareFlow
    await refetchStats();
  };

  const handleExportReport = () => {
    // TODO: Implement report export
    console.log('Export compliance report');
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No Tenant Selected</h2>
          <p className="text-gray-500 mt-2">Please select a tenant to view compliance data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Shield className="w-7 h-7 text-indigo-600" />
                </div>
                Compliance Hub
              </h1>
              <p className="text-gray-500 mt-1 ml-12">
                Home Office & CQC compliance management
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Actions */}
              <button
                onClick={handleSync}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Sync to CareFlow
              </button>
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Staff"
            value={stats?.totalPersons || 0}
            subtitle="Active records"
            icon={<Users className="w-6 h-6 text-indigo-600" />}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
            loading={statsLoading}
          />
          <StatCard
            title="Compliant"
            value={stats?.compliant || 0}
            subtitle="All requirements met"
            icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
            color="text-green-600"
            bgColor="bg-green-50"
            loading={statsLoading}
          />
          <StatCard
            title="At Risk"
            value={stats?.atRisk || 0}
            subtitle="Expiring soon"
            icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            loading={statsLoading}
            onClick={() => setActiveTab('expiring')}
          />
          <StatCard
            title="Non-Compliant"
            value={stats?.nonCompliant || 0}
            subtitle="Action required"
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            color="text-red-600"
            bgColor="bg-red-50"
            loading={statsLoading}
          />
          <StatCard
            title="Pending Review"
            value={stats?.pendingVerifications || 0}
            subtitle="Documents to verify"
            icon={<FileCheck className="w-6 h-6 text-purple-600" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
            loading={statsLoading}
            onClick={() => setActiveTab('pending')}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Score */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Overall Compliance</h3>
              <div className="flex justify-center mb-4">
                <ComplianceScoreGauge score={overallScore} size="lg" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Home Office</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {stats?.byAuthority?.homeOffice?.score || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">CQC</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {stats?.byAuthority?.cqc?.score || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('expiring')}
                  className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="text-sm font-medium text-red-700">Expiring Documents</span>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    {stats?.expiringDocuments || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-sm font-medium text-purple-700">Verify Documents</span>
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    {stats?.pendingVerifications || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="w-full flex items-center justify-between p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <span className="text-sm font-medium text-indigo-700">View Tasks</span>
                  <ChevronRight className="w-4 h-4 text-indigo-600" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span className="text-sm font-medium text-green-700">Generate Report</span>
                  <ExternalLink className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>

            {/* Folder Structure */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gray-400" />
                Document Folders
              </h3>
              <div className="space-y-2">
                {Object.entries(COMPLIANCE_FOLDER_STRUCTURE).map(([key, folder]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    style={{ borderLeft: `4px solid ${folder.color}` }}
                  >
                    <span className="text-sm font-medium text-gray-700">{folder.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* Tabs */}
              <div className="border-b border-gray-100">
                <nav className="flex -mb-px overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'expiring', label: 'Expiring', icon: Clock },
                    { id: 'pending', label: 'Verification', icon: FileCheck },
                    { id: 'tasks', label: 'Tasks', icon: Activity },
                    { id: 'people', label: 'People', icon: Users },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        if (tab.id !== 'people') setStageFilter(undefined);
                      }}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <OverviewTab
                    stats={stats}
                    loading={statsLoading}
                    onStageClick={handleStageClick}
                  />
                )}
                {activeTab === 'expiring' && (
                  <ExpiringDocumentsTab
                    tenantId={tenantId}
                    onSendReminder={handleSendReminder}
                  />
                )}
                {activeTab === 'pending' && (
                  <PendingVerificationTab tenantId={tenantId} />
                )}
                {activeTab === 'tasks' && (
                  <TasksTab tenantId={tenantId} />
                )}
                {activeTab === 'people' && (
                  <PeopleTab
                    tenantId={tenantId}
                    stageFilter={stageFilter}
                    onClearFilter={() => setStageFilter(undefined)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6">
        <button className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 flex items-center justify-center transition-colors">
          <Info className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ComplianceHubPage;
