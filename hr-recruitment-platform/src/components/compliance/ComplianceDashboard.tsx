/**
 * Comprehensive Compliance Dashboard
 * 
 * Provides overview of compliance status across the organization
 * - Real-time compliance scoring
 * - Document expiry tracking
 * - Home Office vs CQC separation
 * - Automated alerts and tasks
 */

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Info
} from 'lucide-react';
import { complianceService } from '../../lib/compliance/ComplianceService';
import { crossAppSyncService } from '../../lib/compliance/CrossAppSyncService';
import { COMPLIANCE_FOLDER_STRUCTURE, ComplianceAuthority, ComplianceStage } from '../../lib/compliance/complianceTypes';

// ===========================================
// TYPES
// ===========================================

interface DashboardStats {
  totalPersons: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  expiringDocuments: number;
  pendingVerifications: number;
  byStage: Record<ComplianceStage, number>;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_email?: string;
  created_at: string;
  new_values?: any;
}

interface ExpiringDocument {
  id: string;
  person_name: string;
  person_email: string;
  document_type: string;
  authority: ComplianceAuthority;
  expiry_date: string;
  days_until_expiry: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// ===========================================
// HELPER COMPONENTS
// ===========================================

const StatCard: React.FC<{
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, color, trend, onClick }) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trend.positive && 'rotate-180'}`} />
            {trend.value}% from last month
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ComplianceScoreGauge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40'
  };
  
  const getColor = (s: number) => {
    if (s >= 90) return '#10b981'; // green
    if (s >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };
  
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke={getColor(score)}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: getColor(score) }}>{score}%</span>
        <span className="text-xs text-gray-500">Compliance</span>
      </div>
    </div>
  );
};

const AuthorityBadge: React.FC<{ authority: ComplianceAuthority }> = ({ authority }) => {
  const config = {
    HOME_OFFICE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Home Office' },
    CQC: { bg: 'bg-green-100', text: 'text-green-800', label: 'CQC' },
    BOTH: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Both' },
    INTERNAL: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Internal' }
  };
  
  const { bg, text, label } = config[authority];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const config: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    LOW: { bg: 'bg-green-100', text: 'text-green-800' }
  };
  
  const { bg, text } = config[urgency] || config.LOW;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {urgency}
    </span>
  );
};

// ===========================================
// MAIN DASHBOARD COMPONENT
// ===========================================

const ComplianceDashboard: React.FC<{ tenantId: string }> = ({ tenantId }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'expiring' | 'pending' | 'activity'>('overview');
  const [authorityFilter, setAuthorityFilter] = useState<ComplianceAuthority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['compliance-dashboard', tenantId],
    queryFn: () => complianceService.getComplianceDashboard(tenantId),
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch expiring documents
  const { data: expiringDocs, isLoading: expiringLoading } = useQuery({
    queryKey: ['expiring-documents', tenantId, authorityFilter],
    queryFn: async () => {
      // Simulated - would be actual API call
      return [] as ExpiringDocument[];
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => crossAppSyncService.batchSyncToCareFlow(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-dashboard'] });
    }
  });

  // Calculate overall score
  const overallScore = stats 
    ? Math.round((stats.compliant / Math.max(stats.totalPersons, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              Compliance Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor Home Office and CQC compliance across your organization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync to CareFlow
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Authority Filter Pills */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-gray-500 mr-2">Filter by:</span>
        {(['ALL', 'HOME_OFFICE', 'CQC', 'BOTH'] as const).map(authority => (
          <button
            key={authority}
            onClick={() => setAuthorityFilter(authority)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              authorityFilter === authority
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {authority === 'ALL' ? 'All' : authority === 'HOME_OFFICE' ? 'Home Office' : authority}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Staff"
          value={stats?.totalPersons || 0}
          subtitle="Active employees & applicants"
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          color="text-indigo-600"
        />
        <StatCard
          title="Compliant"
          value={stats?.compliant || 0}
          subtitle="All requirements met"
          icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
          color="text-green-600"
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="At Risk"
          value={stats?.atRisk || 0}
          subtitle="Documents expiring soon"
          icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          color="text-yellow-600"
        />
        <StatCard
          title="Non-Compliant"
          value={stats?.nonCompliant || 0}
          subtitle="Immediate action required"
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          color="text-red-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Score Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Overall Compliance Score */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Compliance</h3>
            <div className="flex justify-center">
              <ComplianceScoreGauge score={overallScore} size="lg" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Home Office</span>
                </div>
                <span className="text-lg font-bold text-blue-600">85%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">CQC</span>
                </div>
                <span className="text-lg font-bold text-green-600">92%</span>
              </div>
            </div>
          </div>

          {/* Folder Structure */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{folder.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <span className="text-sm font-medium text-indigo-700">Process Expired Documents</span>
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                  {stats?.expiringDocuments || 0}
                </span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <span className="text-sm font-medium text-yellow-700">Verify Pending Documents</span>
                <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                  {stats?.pendingVerifications || 0}
                </span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-sm font-medium text-green-700">Generate Audit Report</span>
                <ExternalLink className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-100">
              <nav className="flex -mb-px">
                {[
                  { id: 'overview', label: 'Stage Overview', icon: Users },
                  { id: 'expiring', label: 'Expiring Documents', icon: Clock },
                  { id: 'pending', label: 'Pending Verification', icon: FileCheck },
                  { id: 'activity', label: 'Recent Activity', icon: Bell }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
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

            <div className="p-6">
              {/* Stage Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Compliance by Stage</h3>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(stats?.byStage || {}).map(([stage, count]) => (
                      <div
                        key={stage}
                        className="p-4 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {stage.replace('_', ' ')}
                            </h4>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">{count}</p>
                          </div>
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <Users className="w-6 h-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (count / Math.max(stats?.totalPersons || 1, 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round((count / Math.max(stats?.totalPersons || 1, 1)) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stage Flow Visualization */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Compliance Pipeline</h4>
                    <div className="flex items-center justify-between">
                      {['APPLICATION', 'PRE_EMPLOYMENT', 'ONBOARDING', 'ONGOING'].map((stage, index) => (
                        <React.Fragment key={stage}>
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                              {stats?.byStage?.[stage as ComplianceStage] || 0}
                            </div>
                            <span className="text-xs text-gray-500 mt-1 text-center">
                              {stage.replace('_', ' ')}
                            </span>
                          </div>
                          {index < 3 && (
                            <ChevronRight className="w-6 h-6 text-gray-300" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Expiring Documents Tab */}
              {activeTab === 'expiring' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Documents Expiring Soon</h3>
                    <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option>Next 30 days</option>
                      <option>Next 60 days</option>
                      <option>Next 90 days</option>
                    </select>
                  </div>

                  {/* Alert Banner */}
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Critical Documents Expiring</h4>
                      <p className="text-sm text-red-600 mt-1">
                        {stats?.expiringDocuments || 0} documents will expire in the next 30 days. 
                        Immediate action required to maintain compliance.
                      </p>
                    </div>
                  </div>

                  {/* Expiring Documents List */}
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
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
                        {/* Sample data - would be from API */}
                        {[
                          { name: 'John Smith', doc: 'DBS Certificate', authority: 'CQC' as const, expiry: '2024-01-15', days: 5, urgency: 'CRITICAL' },
                          { name: 'Sarah Johnson', doc: 'Visa', authority: 'HOME_OFFICE' as const, expiry: '2024-01-20', days: 10, urgency: 'HIGH' },
                          { name: 'Mike Brown', doc: 'NMC PIN', authority: 'CQC' as const, expiry: '2024-02-01', days: 22, urgency: 'MEDIUM' },
                        ].map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.doc}</td>
                            <td className="px-4 py-3">
                              <AuthorityBadge authority={item.authority} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                <p className="text-gray-900">{item.expiry}</p>
                                <p className="text-gray-500">{item.days} days</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <UrgencyBadge urgency={item.urgency} />
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                Send Reminder
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pending Verification Tab */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Documents Awaiting Verification</h3>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                      Bulk Verify
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Sample pending verifications */}
                    {[
                      { name: 'Emma Wilson', doc: 'Passport', authority: 'HOME_OFFICE' as const, uploaded: '2 hours ago' },
                      { name: 'James Taylor', doc: 'Care Certificate', authority: 'CQC' as const, uploaded: '4 hours ago' },
                      { name: 'Lisa Anderson', doc: 'References', authority: 'BOTH' as const, uploaded: '1 day ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.doc} • Uploaded {item.uploaded}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <AuthorityBadge authority={item.authority} />
                          <button className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">
                            Verify
                          </button>
                          <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  <div className="space-y-3">
                    {stats?.recentActivity?.slice(0, 10).map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{activity.action}</span>
                            {' '}on {activity.entity_type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.user_email} • {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">No recent activity</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compliance by Authority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Home Office Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Home Office Compliance</h3>
                  <p className="text-sm text-gray-500">Right to Work & Immigration</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Passport/Visa Verified</span>
                  <span className="font-medium text-gray-900">45/50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">RTW Checks Complete</span>
                  <span className="font-medium text-gray-900">48/50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">NI Numbers Verified</span>
                  <span className="font-medium text-gray-900">50/50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Visas Expiring (90 days)</span>
                  <span className="font-medium text-yellow-600">3</span>
                </div>
              </div>
            </div>

            {/* CQC Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">CQC Compliance</h3>
                  <p className="text-sm text-gray-500">Care Quality Standards</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">DBS Checks Valid</span>
                  <span className="font-medium text-gray-900">47/50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Mandatory Training Complete</span>
                  <span className="font-medium text-gray-900">42/50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Care Certificates</span>
                  <span className="font-medium text-gray-900">45/50</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Training Expiring (30 days)</span>
                  <span className="font-medium text-red-600">8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Tooltip */}
      <div className="fixed bottom-6 right-6">
        <button className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 flex items-center justify-center">
          <Info className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
