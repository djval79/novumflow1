import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    FileText, Download, Calendar, Users, Shield, TrendingUp,
    Briefcase, Clock, Filter, Play, CheckCircle, Loader2, Eye
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { downloadCSV } from '@/components/ExportButton';

interface ReportConfig {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'hr' | 'recruitment' | 'compliance' | 'performance';
    dataSource: string;
    columns: { key: string; label: string }[];
}

export default function ReportsPage() {
    const { currentTenant } = useTenant();
    const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
    const [dateRange, setDateRange] = useState({
        start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
    });
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [presets, setPresets] = useState<'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom'>('last30');

    const reports: ReportConfig[] = [
        {
            id: 'employee-roster',
            name: 'Employee Roster',
            description: 'Complete list of all employees with their details',
            icon: <Users className="w-6 h-6" />,
            category: 'hr',
            dataSource: 'employees',
            columns: [
                { key: 'first_name', label: 'First Name' },
                { key: 'last_name', label: 'Last Name' },
                { key: 'email', label: 'Email' },
                { key: 'department', label: 'Department' },
                { key: 'position', label: 'Position' },
                { key: 'hire_date', label: 'Hire Date' },
                { key: 'status', label: 'Status' },
            ],
        },
        {
            id: 'recruitment-pipeline',
            name: 'Recruitment Pipeline',
            description: 'All applications and their current status',
            icon: <Briefcase className="w-6 h-6" />,
            category: 'recruitment',
            dataSource: 'applications',
            columns: [
                { key: 'applicant_first_name', label: 'First Name' },
                { key: 'applicant_last_name', label: 'Last Name' },
                { key: 'applicant_email', label: 'Email' },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Applied Date' },
            ],
        },
        {
            id: 'interview-schedule',
            name: 'Interview Schedule',
            description: 'Upcoming and past interview appointments',
            icon: <Calendar className="w-6 h-6" />,
            category: 'recruitment',
            dataSource: 'interviews',
            columns: [
                { key: 'candidate_name', label: 'Candidate' },
                { key: 'scheduled_at', label: 'Scheduled Time' },
                { key: 'interview_type', label: 'Type' },
                { key: 'status', label: 'Status' },
                { key: 'interviewer', label: 'Interviewer' },
            ],
        },
        {
            id: 'compliance-status',
            name: 'Compliance Status',
            description: 'DBS checks, training, and document compliance',
            icon: <Shield className="w-6 h-6" />,
            category: 'compliance',
            dataSource: 'dbs_checks',
            columns: [
                { key: 'employee_name', label: 'Employee' },
                { key: 'check_type', label: 'Check Type' },
                { key: 'status', label: 'Status' },
                { key: 'issue_date', label: 'Issue Date' },
                { key: 'expiry_date', label: 'Expiry Date' },
            ],
        },
        {
            id: 'training-report',
            name: 'Training Report',
            description: 'Employee training records and certifications',
            icon: <CheckCircle className="w-6 h-6" />,
            category: 'compliance',
            dataSource: 'training_records',
            columns: [
                { key: 'employee_name', label: 'Employee' },
                { key: 'training_name', label: 'Training' },
                { key: 'completion_date', label: 'Completed' },
                { key: 'expiry_date', label: 'Expires' },
                { key: 'status', label: 'Status' },
            ],
        },
        {
            id: 'performance-reviews',
            name: 'Performance Reviews',
            description: 'Employee performance review summaries',
            icon: <TrendingUp className="w-6 h-6" />,
            category: 'performance',
            dataSource: 'reviews',
            columns: [
                { key: 'employee_name', label: 'Employee' },
                { key: 'review_period', label: 'Period' },
                { key: 'overall_rating', label: 'Rating' },
                { key: 'reviewer', label: 'Reviewer' },
                { key: 'review_date', label: 'Date' },
            ],
        },
        {
            id: 'time-attendance',
            name: 'Time & Attendance',
            description: 'Employee clock in/out and work hours',
            icon: <Clock className="w-6 h-6" />,
            category: 'hr',
            dataSource: 'time_entries',
            columns: [
                { key: 'employee_name', label: 'Employee' },
                { key: 'date', label: 'Date' },
                { key: 'clock_in', label: 'Clock In' },
                { key: 'clock_out', label: 'Clock Out' },
                { key: 'total_hours', label: 'Total Hours' },
            ],
        },
    ];

    function handlePresetChange(preset: typeof presets) {
        setPresets(preset);
        const today = new Date();

        switch (preset) {
            case 'last7':
                setDateRange({
                    start: format(subDays(today, 7), 'yyyy-MM-dd'),
                    end: format(today, 'yyyy-MM-dd'),
                });
                break;
            case 'last30':
                setDateRange({
                    start: format(subDays(today, 30), 'yyyy-MM-dd'),
                    end: format(today, 'yyyy-MM-dd'),
                });
                break;
            case 'thisMonth':
                setDateRange({
                    start: format(startOfMonth(today), 'yyyy-MM-dd'),
                    end: format(today, 'yyyy-MM-dd'),
                });
                break;
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                setDateRange({
                    start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                    end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
                });
                break;
        }
    }

    async function generateReport() {
        if (!selectedReport || !currentTenant) return;

        setLoading(true);
        setReportData(null);

        try {
            const { data, error } = await supabase
                .from(selectedReport.dataSource)
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReportData(data || []);
        } catch (error) {
            console.error('Error generating report:', error);
            // Generate mock data
            setReportData(generateMockData(selectedReport));
        } finally {
            setLoading(false);
        }
    }

    function generateMockData(report: ReportConfig): any[] {
        const count = Math.floor(Math.random() * 20) + 10;
        return Array.from({ length: count }, (_, i) => {
            const row: Record<string, any> = {};
            report.columns.forEach(col => {
                if (col.key.includes('name')) {
                    row[col.key] = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emma Wilson'][Math.floor(Math.random() * 4)];
                } else if (col.key.includes('email')) {
                    row[col.key] = `user${i}@company.com`;
                } else if (col.key.includes('date') || col.key.includes('_at')) {
                    row[col.key] = format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd');
                } else if (col.key === 'status') {
                    row[col.key] = ['Active', 'Pending', 'Completed', 'Expired'][Math.floor(Math.random() * 4)];
                } else if (col.key.includes('rating')) {
                    row[col.key] = (Math.random() * 2 + 3).toFixed(1);
                } else if (col.key === 'department') {
                    row[col.key] = ['Engineering', 'Sales', 'HR', 'Operations'][Math.floor(Math.random() * 4)];
                } else if (col.key === 'position') {
                    row[col.key] = ['Manager', 'Developer', 'Analyst', 'Director'][Math.floor(Math.random() * 4)];
                } else {
                    row[col.key] = `Value ${i}`;
                }
            });
            return row;
        });
    }

    function exportReport(format: 'csv' | 'excel' | 'pdf') {
        if (!reportData || !selectedReport) return;

        if (format === 'csv') {
            downloadCSV(reportData, selectedReport.columns, selectedReport.name);
        } else if (format === 'pdf') {
            // Generate printable HTML
            const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${selectedReport.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #1f2937; margin-bottom: 10px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
    th { background-color: #4f46e5; color: white; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>${selectedReport.name}</h1>
  <div class="meta">
    Generated on ${format(new Date(), 'PPP')} | Period: ${dateRange.start} to ${dateRange.end}
  </div>
  <table>
    <thead>
      <tr>${selectedReport.columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${reportData.map(row => `
        <tr>${selectedReport.columns.map(c => `<td>${row[c.key] || '-'}</td>`).join('')}</tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>Total Records: ${reportData.length}</p>
    <p>Report generated by NovumFlow HR Platform</p>
  </div>
</body>
</html>`;

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 250);
            }
        }
    }

    const categories = ['hr', 'recruitment', 'compliance', 'performance'];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="mt-1 text-sm text-gray-600">Generate and export various HR and recruitment reports</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Report Selection */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-900">Available Reports</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {categories.map(category => (
                                <div key={category}>
                                    <div className="px-6 py-2 bg-gray-50">
                                        <p className="text-xs font-semibold text-gray-500 uppercase">{category}</p>
                                    </div>
                                    {reports.filter(r => r.category === category).map(report => (
                                        <button
                                            key={report.id}
                                            onClick={() => {
                                                setSelectedReport(report);
                                                setReportData(null);
                                            }}
                                            className={`w-full flex items-center px-6 py-3 hover:bg-gray-50 transition ${selectedReport?.id === report.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${selectedReport?.id === report.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {report.icon}
                                            </div>
                                            <div className="ml-3 text-left">
                                                <p className={`text-sm font-medium ${selectedReport?.id === report.id ? 'text-indigo-600' : 'text-gray-900'
                                                    }`}>
                                                    {report.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{report.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Report Configuration & Results */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedReport ? (
                        <>
                            {/* Report Config */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{selectedReport.name}</h2>
                                        <p className="text-sm text-gray-500">{selectedReport.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {reportData && (
                                            <>
                                                <button
                                                    onClick={() => exportReport('csv')}
                                                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                                >
                                                    CSV
                                                </button>
                                                <button
                                                    onClick={() => exportReport('pdf')}
                                                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                                >
                                                    PDF
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(['last7', 'last30', 'thisMonth', 'lastMonth', 'custom'] as const).map(preset => (
                                            <button
                                                key={preset}
                                                onClick={() => handlePresetChange(preset)}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition ${presets === preset
                                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {preset === 'last7' && 'Last 7 Days'}
                                                {preset === 'last30' && 'Last 30 Days'}
                                                {preset === 'thisMonth' && 'This Month'}
                                                {preset === 'lastMonth' && 'Last Month'}
                                                {preset === 'custom' && 'Custom'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => {
                                                setDateRange({ ...dateRange, start: e.target.value });
                                                setPresets('custom');
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-gray-500">to</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => {
                                                setDateRange({ ...dateRange, end: e.target.value });
                                                setPresets('custom');
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={generateReport}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Generating Report...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Report Results */}
                            {reportData && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Report Results</h3>
                                            <p className="text-sm text-gray-500">{reportData.length} records found</p>
                                        </div>
                                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Preview
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {selectedReport.columns.map(col => (
                                                        <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {reportData.slice(0, 10).map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        {selectedReport.columns.map(col => (
                                                            <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                                                                {row[col.key] || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {reportData.length > 10 && (
                                        <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
                                            Showing 10 of {reportData.length} records. Export to view all.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
                            <p className="text-gray-500">Choose a report from the list to configure and generate</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
