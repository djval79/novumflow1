/**
 * Governance Dashboard
 * 
 * Central hub for CQC compliance oversight:
 * - Real-time compliance metrics
 * - Regulatory requirement tracking
 * - Audit trail and evidence management
 * - Key Performance Indicators
 */

import React, { useState, useEffect } from 'react';
import {
    Shield,
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    FileText,
    Calendar,
    Award,
    Target,
    Activity,
    Eye,
    Download,
    RefreshCcw,
    ChevronRight,
    AlertCircle,
    Zap
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

// ============================================
// TYPES
// ============================================

interface ComplianceMetric {
    id: string;
    name: string;
    category: 'regulation_19' | 'regulation_18' | 'regulation_9a' | 'fundamental_standards' | 'home_office';
    currentValue: number;
    targetValue: number;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: string;
    status: 'compliant' | 'at_risk' | 'non_compliant';
}

interface AuditItem {
    id: string;
    timestamp: string;
    action: string;
    user: string;
    category: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
}

interface RegulatoryRequirement {
    id: string;
    regulation: string;
    requirement: string;
    status: 'met' | 'partial' | 'not_met';
    evidenceCount: number;
    lastInspection?: string;
    notes?: string;
}

// ============================================
// COMPONENT
// ============================================

export default function GovernanceDashboard() {
    const { currentTenant } = useTenant();
    const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
    const [loading, setLoading] = useState(false);

    // Demo metrics data
    const metrics: ComplianceMetric[] = [
        { id: 'm1', name: 'DBS Check Compliance', category: 'regulation_19', currentValue: 98, targetValue: 100, trend: 'up', lastUpdated: '2024-12-21', status: 'compliant' },
        { id: 'm2', name: 'Right to Work Valid', category: 'home_office', currentValue: 100, targetValue: 100, trend: 'stable', lastUpdated: '2024-12-21', status: 'compliant' },
        { id: 'm3', name: 'Training Completion', category: 'regulation_18', currentValue: 94, targetValue: 95, trend: 'up', lastUpdated: '2024-12-21', status: 'at_risk' },
        { id: 'm4', name: 'Staff Competency', category: 'regulation_18', currentValue: 91, targetValue: 90, trend: 'up', lastUpdated: '2024-12-21', status: 'compliant' },
        { id: 'm5', name: 'Safe Staffing Levels', category: 'regulation_18', currentValue: 96, targetValue: 95, trend: 'stable', lastUpdated: '2024-12-21', status: 'compliant' },
        { id: 'm6', name: 'Visiting Rights Compliance', category: 'regulation_9a', currentValue: 100, targetValue: 100, trend: 'stable', lastUpdated: '2024-12-21', status: 'compliant' },
        { id: 'm7', name: 'Character Declarations', category: 'regulation_19', currentValue: 100, targetValue: 100, trend: 'stable', lastUpdated: '2024-12-21', status: 'compliant' },
        { id: 'm8', name: 'Supervision Records', category: 'fundamental_standards', currentValue: 88, targetValue: 95, trend: 'down', lastUpdated: '2024-12-21', status: 'at_risk' }
    ];

    // Recent audit trail
    const auditItems: AuditItem[] = [
        { id: 'a1', timestamp: '2024-12-21T12:45:00', action: 'DBS Check Completed', user: 'Sarah Manager', category: 'Compliance', details: 'Enhanced DBS cleared for John Smith', severity: 'info' },
        { id: 'a2', timestamp: '2024-12-21T11:30:00', action: 'Training Expired', user: 'System', category: 'Training', details: 'Fire Safety training expired for 2 staff members', severity: 'warning' },
        { id: 'a3', timestamp: '2024-12-21T10:15:00', action: 'Right to Work Verified', user: 'HR Admin', category: 'Compliance', details: 'eVisa verification completed via share code', severity: 'info' },
        { id: 'a4', timestamp: '2024-12-20T16:00:00', action: 'Competency Signed Off', user: 'Clinical Lead', category: 'Competency', details: 'Medication administration competency approved', severity: 'info' },
        { id: 'a5', timestamp: '2024-12-20T14:30:00', action: 'Policy Updated', user: 'Care Manager', category: 'Governance', details: 'Visiting policy updated for Regulation 9A', severity: 'info' }
    ];

    // Regulatory requirements
    const requirements: RegulatoryRequirement[] = [
        { id: 'r1', regulation: 'Regulation 19', requirement: 'Fit and Proper Persons Employed', status: 'met', evidenceCount: 156 },
        { id: 'r2', regulation: 'Regulation 18', requirement: 'Staffing', status: 'met', evidenceCount: 89 },
        { id: 'r3', regulation: 'Regulation 9A', requirement: 'Right to Receive Visitors', status: 'met', evidenceCount: 24 },
        { id: 'r4', regulation: 'Regulation 12', requirement: 'Safe Care and Treatment', status: 'partial', evidenceCount: 67 },
        { id: 'r5', regulation: 'Regulation 13', requirement: 'Safeguarding', status: 'met', evidenceCount: 45 },
        { id: 'r6', regulation: 'Regulation 17', requirement: 'Good Governance', status: 'met', evidenceCount: 112 }
    ];

    // Calculate overall compliance
    const overallCompliance = Math.round(
        metrics.reduce((sum, m) => sum + m.currentValue, 0) / metrics.length
    );

    const compliantCount = metrics.filter(m => m.status === 'compliant').length;
    const atRiskCount = metrics.filter(m => m.status === 'at_risk').length;
    const nonCompliantCount = metrics.filter(m => m.status === 'non_compliant').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant': case 'met': return 'text-green-600 bg-green-100';
            case 'at_risk': case 'partial': return 'text-amber-600 bg-amber-100';
            case 'non_compliant': case 'not_met': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Activity className="w-4 h-4 text-gray-400" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'regulation_19': return 'Reg 19';
            case 'regulation_18': return 'Reg 18';
            case 'regulation_9a': return 'Reg 9A';
            case 'fundamental_standards': return 'Fundamentals';
            case 'home_office': return 'Home Office';
            default: return category;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Governance Dashboard</h1>
                                <p className="text-gray-600">CQC Compliance Oversight & Evidence Management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedTimeframe}
                                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                                className="rounded-lg border-gray-300 text-sm"
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="12m">Last 12 Months</option>
                            </select>
                            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Overall Compliance Score */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5" />
                            <span className="text-indigo-100 font-medium">Overall Compliance</span>
                        </div>
                        <p className="text-5xl font-bold mb-2">{overallCompliance}%</p>
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            <span>+2% from last month</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Compliant</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{compliantCount}</p>
                        <p className="text-sm text-gray-500">metrics meeting targets</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">At Risk</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{atRiskCount}</p>
                        <p className="text-sm text-gray-500">metrics need attention</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Non-Compliant</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{nonCompliantCount}</p>
                        <p className="text-sm text-gray-500">immediate action required</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Metrics Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Compliance Metrics
                            </h2>
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                View All →
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Metric</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Category</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Current</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Target</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Trend</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {metrics.map(metric => (
                                        <tr key={metric.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{metric.name}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                    {getCategoryLabel(metric.category)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${metric.currentValue >= metric.targetValue ? 'text-green-600' : 'text-amber-600'
                                                    }`}>
                                                    {metric.currentValue}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-500">{metric.targetValue}%</td>
                                            <td className="px-4 py-3 text-center">{getTrendIcon(metric.trend)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                                                    {metric.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                Recent Activity
                            </h2>
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                Full Log →
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {auditItems.map(item => (
                                <div key={item.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded-full ${item.severity === 'warning' ? 'bg-amber-100' :
                                                item.severity === 'critical' ? 'bg-red-100' : 'bg-blue-100'
                                            }`}>
                                            {item.severity === 'warning' ? (
                                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                            ) : item.severity === 'critical' ? (
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <Zap className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{item.action}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.details}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                <span>{item.user}</span>
                                                <span>•</span>
                                                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Regulatory Requirements */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            CQC Regulatory Requirements
                        </h2>
                        <span className="text-sm text-gray-500">
                            Last CQC Inspection: October 2024
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {requirements.map(req => (
                            <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-indigo-600">{req.regulation}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-3">{req.requirement}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {req.evidenceCount} evidence items
                                    </span>
                                    <button className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                                        View <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Generate CQC Report', icon: FileText, color: 'indigo' },
                        { label: 'Schedule Audit', icon: Calendar, color: 'purple' },
                        { label: 'View Evidence Library', icon: Eye, color: 'blue' },
                        { label: 'Compliance Alerts', icon: AlertTriangle, color: 'amber' }
                    ].map(action => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.label}
                                className={`p-4 bg-white border border-gray-200 rounded-xl hover:border-${action.color}-200 hover:shadow-sm transition-all text-left`}
                            >
                                <div className={`p-2 bg-${action.color}-100 rounded-lg inline-block mb-2`}>
                                    <Icon className={`w-5 h-5 text-${action.color}-600`} />
                                </div>
                                <p className="font-medium text-gray-900">{action.label}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
