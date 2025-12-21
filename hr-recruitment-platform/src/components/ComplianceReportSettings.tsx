/**
 * Compliance Report Settings Component
 * 
 * Allows administrators to:
 * - Enable/disable monthly compliance reports
 * - Configure notification recipients
 * - Manually trigger a report
 * - View report history
 */

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/lib/supabase';
import {
    Mail,
    CalendarClock,
    Send,
    CheckCircle,
    Loader2,
    AlertCircle,
    Settings,
    Bell,
    Users,
    History,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ReportSettings {
    compliance_email_notifications: boolean;
    report_recipients: string[];
    report_frequency: 'monthly' | 'weekly' | 'quarterly';
    include_training_matrix: boolean;
    include_expiry_alerts: boolean;
}

interface ReportHistory {
    id: string;
    timestamp: string;
    admins_notified: number;
    metrics: {
        complianceRate: number;
        totalStaff: number;
        cqcReady: boolean;
    };
}

export default function ComplianceReportSettings() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingReport, setSendingReport] = useState(false);
    const [settings, setSettings] = useState<ReportSettings>({
        compliance_email_notifications: true,
        report_recipients: [],
        report_frequency: 'monthly',
        include_training_matrix: true,
        include_expiry_alerts: true
    });
    const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
    const [newRecipient, setNewRecipient] = useState('');

    useEffect(() => {
        if (currentTenant) {
            loadSettings();
            loadReportHistory();
        }
    }, [currentTenant]);

    const loadSettings = async () => {
        if (!currentTenant?.settings) {
            setLoading(false);
            return;
        }

        setSettings({
            compliance_email_notifications: currentTenant.settings.compliance_email_notifications !== false,
            report_recipients: currentTenant.settings.report_recipients || [],
            report_frequency: currentTenant.settings.report_frequency || 'monthly',
            include_training_matrix: currentTenant.settings.include_training_matrix !== false,
            include_expiry_alerts: currentTenant.settings.include_expiry_alerts !== false
        });
        setLoading(false);
    };

    const loadReportHistory = async () => {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('action', 'compliance_report_generated')
            .order('timestamp', { ascending: false })
            .limit(10);

        if (data) {
            setReportHistory(data.map((log: any) => {
                const details = JSON.parse(log.details || '{}');
                return {
                    id: log.id,
                    timestamp: log.timestamp,
                    admins_notified: details.admins_notified || 0,
                    metrics: details.metrics || {}
                };
            }));
        }
    };

    const handleSave = async () => {
        if (!currentTenant) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .update({
                    settings: {
                        ...currentTenant.settings,
                        ...settings
                    }
                })
                .eq('id', currentTenant.id);

            if (error) throw error;
            toast.success('Compliance report settings saved');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestReport = async () => {
        if (!currentTenant) return;

        setSendingReport(true);
        try {
            const { data, error } = await supabase.functions.invoke('monthly-compliance-report', {
                body: {
                    tenant_id: currentTenant.id,
                    force_email: true
                }
            });

            if (error) throw error;

            toast.success('Compliance report generated and sent!');
            loadReportHistory();
        } catch (error) {
            console.error('Error sending report:', error);
            toast.error('Failed to send report. Check function logs.');
        } finally {
            setSendingReport(false);
        }
    };

    const addRecipient = () => {
        if (!newRecipient || !newRecipient.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (settings.report_recipients.includes(newRecipient)) {
            toast.error('This email is already in the list');
            return;
        }
        setSettings({
            ...settings,
            report_recipients: [...settings.report_recipients, newRecipient]
        });
        setNewRecipient('');
    };

    const removeRecipient = (email: string) => {
        setSettings({
            ...settings,
            report_recipients: settings.report_recipients.filter(r => r !== email)
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Main Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Mail className="w-6 h-6 text-white" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">Compliance Email Reports</h2>
                            <p className="text-cyan-100 text-sm">Configure automated monthly compliance reports</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-cyan-600" />
                            <div>
                                <h3 className="font-medium text-gray-900">Monthly Reports</h3>
                                <p className="text-sm text-gray-500">
                                    Receive automated compliance summaries on the 1st of each month
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, compliance_email_notifications: !settings.compliance_email_notifications })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.compliance_email_notifications ? 'bg-cyan-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.compliance_email_notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Frequency Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <CalendarClock className="w-4 h-4 inline mr-2" />
                            Report Frequency
                        </label>
                        <select
                            value={settings.report_frequency}
                            onChange={(e) => setSettings({ ...settings, report_frequency: e.target.value as any })}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                        >
                            <option value="weekly">Weekly (Every Monday)</option>
                            <option value="monthly">Monthly (1st of month)</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>

                    {/* Report Contents */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            <Settings className="w-4 h-4 inline mr-2" />
                            Report Contents
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.include_training_matrix}
                                    onChange={(e) => setSettings({ ...settings, include_training_matrix: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <div>
                                    <span className="text-gray-900">Training Compliance Matrix</span>
                                    <p className="text-xs text-gray-500">Include detailed training status for all staff</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.include_expiry_alerts}
                                    onChange={(e) => setSettings({ ...settings, include_expiry_alerts: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <div>
                                    <span className="text-gray-900">Expiry Alerts Summary</span>
                                    <p className="text-xs text-gray-500">List of DBS, RTW, and training expiring within 90 days</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Recipients */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Users className="w-4 h-4 inline mr-2" />
                            Additional Recipients
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            All admins and HR managers receive reports by default. Add additional recipients below.
                        </p>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="email"
                                value={newRecipient}
                                onChange={(e) => setNewRecipient(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                                placeholder="email@example.com"
                                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                            />
                            <button
                                onClick={addRecipient}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {settings.report_recipients.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {settings.report_recipients.map((email) => (
                                    <span
                                        key={email}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm"
                                    >
                                        {email}
                                        <button
                                            onClick={() => removeRecipient(email)}
                                            className="hover:text-cyan-900 ml-1"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Save Settings
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleSendTestReport}
                            disabled={sendingReport}
                            className="px-4 py-2 bg-white border border-cyan-600 text-cyan-600 hover:bg-cyan-50 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {sendingReport ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Test Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                    <History className="w-5 h-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Report History</h3>
                </div>

                {reportHistory.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {reportHistory.map((report) => (
                            <div key={report.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {format(new Date(report.timestamp), 'MMMM yyyy')} Report
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Generated {format(new Date(report.timestamp), 'dd MMM yyyy HH:mm')} •
                                        Sent to {report.admins_notified} recipients
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${report.metrics.cqcReady
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-700'
                                        }`}>
                                        {report.metrics.complianceRate || 0}% compliant
                                    </span>
                                    <button className="p-2 text-gray-400 hover:text-cyan-600 transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No reports generated yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Send a test report to see it here
                        </p>
                    </div>
                )}
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-medium text-blue-800">Email Configuration Required</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        To enable automated emails, set the <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY</code>
                        environment variable in your Supabase Edge Functions.
                        <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                            Get a free API key at Resend →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
