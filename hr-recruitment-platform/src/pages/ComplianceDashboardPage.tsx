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

export default function ComplianceDashboardPage() {
    const navigate = useNavigate();
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [complianceReport, setComplianceReport] = useState<any>(null);
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
            console.error('Error loading compliance data:', error);
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
            ['CQC Ready', complianceReport.cqc_ready === complianceReport.total_staff ? 'Yes' : 'No'],
            ['Generated At', new Date().toLocaleString()]
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        // Add non-compliant staff details if any
        if (nonCompliantStaff.length > 0) {
            csvContent += "\n\nNon-Compliant Staff Details\n";
            csvContent += "Staff Name,DBS Status,References,Training,RTW,Score\n";
            nonCompliantStaff.forEach(staff => {
                csvContent += `${staff.staff_name},${staff.dbs_status},${staff.references_status},${staff.training_status},${staff.rtw_status},${staff.overall_compliance_score}%\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cqc_compliance_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading compliance data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CQC Compliance Dashboard</h1>
                    <p className="text-gray-600 mt-1">Monitor staff compliance and CQC readiness</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/inspector-mode')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 border border-slate-700"
                    >
                        <Shield className="w-4 h-4" />
                        Enter Inspector Mode
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                    >
                        <Download className="w-4 h-4" />
                        Export CQC Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                            ? 'border-cyan-500 text-cyan-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Overview & Alerts
                    </button>
                    <button
                        onClick={() => setActiveTab('training')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'training'
                            ? 'border-cyan-500 text-cyan-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Training Matrix
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                            ? 'border-cyan-500 text-cyan-600'
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
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Staff</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">
                                        {complianceReport?.total_staff || 0}
                                    </p>
                                </div>
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Compliant</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">
                                        {complianceReport?.compliant || 0}
                                    </p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {complianceReport?.total_staff > 0
                                    ? Math.round((complianceReport.compliant / complianceReport.total_staff) * 100)
                                    : 0}% of staff
                            </p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Action Required</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-1">
                                        {complianceReport?.non_compliant || 0}
                                    </p>
                                </div>
                                <AlertTriangle className="w-10 h-10 text-orange-400" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">CQC Ready</p>
                                    <p className="text-3xl font-bold text-cyan-600 mt-1">
                                        {complianceReport?.cqc_ready || 0}
                                    </p>
                                </div>
                                <Shield className="w-10 h-10 text-cyan-400" />
                            </div>
                        </div>
                    </div>

                    {/* Average Compliance Score */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Average Compliance Score</h2>
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-4">
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
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Staff Requiring Action</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {nonCompliantStaff.length} staff member(s) need compliance updates
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Staff Member
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                DBS
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                References
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Training
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                RTW
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Score
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {nonCompliantStaff.map((staff) => (
                                            <tr key={staff.id} className="hover:bg-gray-50">
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
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.overall_compliance_score)}`}>
                                                        {getStatusIcon(staff.overall_compliance_score)}
                                                        {staff.overall_compliance_score}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CQC Ready Status */}
                    {complianceReport && (
                        <div className={`rounded-lg p-6 ${complianceReport.cqc_ready === complianceReport.total_staff
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-orange-50 border-2 border-orange-200'
                            }`}>
                            <div className="flex items-center gap-3">
                                {complianceReport.cqc_ready === complianceReport.total_staff ? (
                                    <>
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-green-900">
                                                ✅ CQC Inspection Ready
                                            </h3>
                                            <p className="text-green-700 mt-1">
                                                All staff members are compliant. Your organization is ready for CQC inspection.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-orange-900">
                                                ⚠️ Action Required for CQC Readiness
                                            </h3>
                                            <p className="text-orange-700 mt-1">
                                                {complianceReport.non_compliant} staff member(s) require compliance updates before CQC inspection.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowDBSModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                            <Plus className="w-4 h-4" />
                            Add New DBS Check
                        </button>
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
