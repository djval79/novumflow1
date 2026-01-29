import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complianceService, ComplianceStatus } from '@/lib/services/ComplianceService';
import { useTenant } from '@/contexts/TenantContext';
import {
    Shield,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Users,
    FileText,
    Download,
    Plus
} from 'lucide-react';
import ComplianceAlerts from '../components/ComplianceAlerts';
import TrainingMatrix from '../components/TrainingMatrix';
import DBSCheckForm from '../components/DBSCheckForm';
import ComplianceReportSettings from '../components/ComplianceReportSettings';
import { log } from '@/lib/logger';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';

interface ComplianceReport {
    total_staff: number;
    compliant: number;
    non_compliant: number;
    average_score: number;
    cqc_ready: number;
}


export default function ComplianceDashboardPage() {
    const navigate = useNavigate();
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
    const [nonCompliantStaff, setNonCompliantStaff] = useState<ComplianceStatus[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'settings'>('overview');
    const [showDBSModal, setShowDBSModal] = useState(false);

    useEffect(() => {
        loadComplianceData();
    }, [currentTenant]);

    const loadComplianceData = async () => {
        if (!currentTenant) return;

        setLoading(true);
        try {
            const [report, nonCompliant] = await Promise.all([
                complianceService.getTenantComplianceReport(currentTenant.id),
                complianceService.getNonCompliantStaff(currentTenant.id)
            ]);

            setComplianceReport(report);
            setNonCompliantStaff(nonCompliant);
        } catch (error) {
            log.error('Error loading compliance data', error, { component: 'ComplianceDashboardPage', action: 'loadComplianceData' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!complianceReport) return;

        // Create CSV content
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Total Staff', complianceReport.total_staff],
            ['Compliant Staff', complianceReport.compliant],
            ['Non-Compliant Staff', complianceReport.non_compliant],
            ['Average Compliance Score', `${complianceReport.average_score}%`],
            ['Audit Ready', complianceReport.cqc_ready === complianceReport.total_staff ? 'Yes' : 'No'],
            ['Generated At', new Date().toLocaleString()]
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        // Add non-compliant staff details if any
        if (nonCompliantStaff.length > 0) {
            csvContent += `\n\nNon-Compliant Employee Details\n`;
            csvContent += "Staff Name,DBS Status,References,Training,RTW,Score\n";
            nonCompliantStaff.forEach(staff => {
                csvContent += `${staff.staff_name},${staff.dbs_status},${staff.references_status},${staff.training_status},${staff.rtw_status},${staff.overall_compliance_score}%\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `compliance_audit_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-50';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getStatusIcon = (score: number) => {
        if (score >= 90) return <CheckCircle className="w-5 h-5" />;
        if (score >= 70) return <AlertTriangle className="w-5 h-5" />;
        return <XCircle className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32 rounded-lg" />
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                </div>
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
                {/* Score Chart */}
                <SkeletonCard />
                {/* Table */}
                <SkeletonCard />
            </div>
        );
    }

    const brandColor = 'cyan';

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Regulatory Compliance</h1>
                    <p className="text-gray-600 mt-1">Monitor organization-wide audit readiness</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex flex-wrap gap-2">
                        <Tooltip content="Switch to auditor view">
                            <button
                                onClick={() => navigate('/inspector-mode')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-slate-700 text-white rounded-lg hover:opacity-90 border shadow-sm transition-all"
                            >
                                <Shield className="w-4 h-4 text-white" />
                                Enter Inspector Mode
                            </button>
                        </Tooltip>
                        <Tooltip content="Download audit CSV">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Export Audit Report
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                            ? `border-${brandColor}-500 text-${brandColor}-600`
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Overview & Alerts
                    </button>
                    <button
                        onClick={() => setActiveTab('training')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'training'
                            ? `border-${brandColor}-500 text-${brandColor}-600`
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Training Matrix
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings'
                            ? `border-${brandColor}-500 text-${brandColor}-600`
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        📧 Report Settings
                    </button>
                </nav>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-6">
                    <ComplianceAlerts />

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Staff</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">
                                        {complianceReport?.total_staff || 0}
                                    </p>
                                </div>
                                <Users className="w-10 h-10 text-gray-100" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Fully Compliant</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">
                                        {complianceReport?.compliant || 0}
                                    </p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-green-100" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {complianceReport?.total_staff > 0
                                    ? Math.round((complianceReport.compliant / complianceReport.total_staff) * 100)
                                    : 0}% of workforce
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Action Required</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-1">
                                        {complianceReport?.non_compliant || 0}
                                    </p>
                                </div>
                                <AlertTriangle className="w-10 h-10 text-orange-100" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 text-nowrap">Audit Ready</p>
                                    <p className="text-3xl font-bold text-cyan-600 mt-1">
                                        {complianceReport?.cqc_ready || 0}
                                    </p>
                                </div>
                                <Shield className="w-10 h-10 text-cyan-100" />
                            </div>
                        </div>
                    </div>

                    {/* Average Compliance Score */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Average Compliance Score</h2>
                            <TrendingUp className="w-5 h-5 text-gray-100" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="w-full bg-gray-100 rounded-full h-4 shadow-inner">
                                    <div
                                        className={`h-4 rounded-full transition-all ${(complianceReport?.average_score || 0) >= 90
                                            ? 'bg-green-600'
                                            : (complianceReport?.average_score || 0) >= 70
                                                ? 'bg-yellow-600'
                                                : 'bg-red-600'
                                            }`}
                                        style={{ width: `${complianceReport?.average_score || 0}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                                {complianceReport?.average_score || 0}%
                            </span>
                        </div>
                    </div>

                    {/* Non-Compliant Staff */}
                    {nonCompliantStaff.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Employees Requiring Action</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {nonCompliantStaff.length} member(s) need compliance updates
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                DBS/Criminal
                                            </th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                References
                                            </th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                Training
                                            </th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                RTW
                                            </th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                Score
                                            </th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {nonCompliantStaff.map((staff) => (
                                            <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{staff.staff_name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={staff.dbs_status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={staff.references_status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={staff.training_status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={staff.rtw_status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(staff.overall_compliance_score)}`}>
                                                        {getStatusIcon(staff.overall_compliance_score)}
                                                        {staff.overall_compliance_score}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Tooltip content="View staff compliance details">
                                                        <button className="text-cyan-600 hover:text-cyan-700 text-sm font-bold transition-colors">
                                                            View Details
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Audit Readiness Status */}
                    {complianceReport && (
                        <div className={`rounded-xl p-6 border-2 transition-all shadow-sm ${complianceReport.cqc_ready === complianceReport.total_staff
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-orange-50 border-orange-200'
                            }`}>
                            <div className="flex items-center gap-4">
                                {complianceReport.cqc_ready === complianceReport.total_staff ? (
                                    <>
                                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                                        <div>
                                            <h3 className="text-xl font-bold text-emerald-900">
                                                ✅ Audit Ready
                                            </h3>
                                            <p className="text-emerald-700 mt-1 font-medium">
                                                All staff members match compliance requirements. Your records are audit-ready.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-10 h-10 text-orange-600" />
                                        <div>
                                            <h3 className="text-xl font-bold text-orange-900">
                                                ⚠️ Action Required for Audit Readiness
                                            </h3>
                                            <p className="text-orange-700 mt-1 font-medium">
                                                {nonCompliantStaff.length} member(s) require compliance updates before your next audit.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Tooltip content="Start a new DBS or RTW check">
                            <button
                                onClick={() => setShowDBSModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold shadow-md transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Record New Check
                            </button>
                        </Tooltip>
                    </div>
                </div>
            ) : activeTab === 'training' ? (
                <TrainingMatrix />
            ) : (
                <ComplianceReportSettings />
            )}

            {showDBSModal && (
                <DBSCheckForm
                    onSuccess={() => {
                        setShowDBSModal(false);
                        loadComplianceData();
                    }}
                    onCancel={() => setShowDBSModal(false)}
                />
            )}
        </div>
    );
}

// Helper component for status badges
function StatusBadge({ status }: { status: string }) {
    const getColor = () => {
        if (status === 'compliant') return 'bg-green-100 text-green-800';
        if (status === 'expiring_soon') return 'bg-yellow-100 text-yellow-800';
        if (status === 'expired' || status === 'overdue') return 'bg-red-100 text-red-800';
        if (status === 'incomplete') return 'bg-orange-100 text-orange-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getLabel = () => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getColor()}`}>
            {getLabel()}
        </span>
    );
}
