import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { log } from '@/lib/logger';
import { Save, Bot, Bell, Shield, AlertCircle } from 'lucide-react';

export default function RecruitmentSettings() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        ai_auto_shortlist_enabled: false,
        ai_auto_reject_enabled: false,
        ai_shortlist_threshold: 85,
        ai_reject_threshold: 30,
        recruiter_notification_email: '',
        auto_schedule_reminders: true
    });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (currentTenant) {
            loadSettings();
        }
    }, [currentTenant]);

    async function loadSettings() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('recruitment_settings')
                .select('*')
                .eq('organization_id', currentTenant?.id)
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setSettings({
                    ai_auto_shortlist_enabled: data.ai_auto_shortlist_enabled,
                    ai_auto_reject_enabled: data.ai_auto_reject_enabled,
                    ai_shortlist_threshold: data.ai_shortlist_threshold,
                    ai_reject_threshold: data.ai_reject_threshold,
                    recruiter_notification_email: data.recruiter_notification_email || '',
                    auto_schedule_reminders: data.auto_schedule_reminders
                });
            }
        } catch (err) {
            log.error('Error loading recruitment settings', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('recruitment_settings')
                .upsert({
                    organization_id: currentTenant?.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setToast({ message: 'Settings saved successfully', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            log.error('Error saving recruitment settings', err);
            setToast({ message: 'Failed to save settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recruitment Automation</h2>
                    <p className="text-gray-500">Configure AI screening and automated workflow rules</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {toast && (
                <div className={`p-4 rounded-lg flex items-center ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {toast.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Screening Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
                        <Bot className="w-6 h-6 text-indigo-600 mr-3" />
                        <h3 className="font-bold text-gray-900">AI Shortlisting</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Auto-Shortlist</p>
                                <p className="text-sm text-gray-500">Automatically move top candidates to screening</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, ai_auto_shortlist_enabled: !settings.ai_auto_shortlist_enabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.ai_auto_shortlist_enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.ai_auto_shortlist_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {settings.ai_auto_shortlist_enabled && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Shortlist Threshold (%)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        value={settings.ai_shortlist_threshold}
                                        onChange={(e) => setSettings({ ...settings, ai_shortlist_threshold: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="font-bold text-indigo-600 w-12 text-right">{settings.ai_shortlist_threshold}%</span>
                                </div>
                                <p className="text-xs text-gray-400">Candidates scoring above this will be automatically moved.</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Auto-Reject</p>
                                <p className="text-sm text-gray-500">Reject candidates who do not meet minimum requirements</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, ai_auto_reject_enabled: !settings.ai_auto_reject_enabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.ai_auto_reject_enabled ? 'bg-red-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.ai_auto_reject_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {settings.ai_auto_reject_enabled && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Rejection Threshold (%)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={settings.ai_reject_threshold}
                                        onChange={(e) => setSettings({ ...settings, ai_reject_threshold: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                    />
                                    <span className="font-bold text-red-600 w-12 text-right">{settings.ai_reject_threshold}%</span>
                                </div>
                                <p className="text-xs text-gray-400">Candidates scoring below this will receive a rejection email.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
                        <Bell className="w-6 h-6 text-indigo-600 mr-3" />
                        <h3 className="font-bold text-gray-900">Notifications & Follow-ups</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Recruiter Notification Email</label>
                            <input
                                type="email"
                                placeholder="hr@company.com"
                                value={settings.recruiter_notification_email}
                                onChange={(e) => setSettings({ ...settings, recruiter_notification_email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-gray-400">Where to send alerts for high-matching candidates.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Interview Reminders</p>
                                <p className="text-sm text-gray-500">Send automated reminders 24h before interviews</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, auto_schedule_reminders: !settings.auto_schedule_reminders })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.auto_schedule_reminders ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.auto_schedule_reminders ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-6 flex items-start">
                <Shield className="w-6 h-6 text-indigo-600 mr-4 mt-1" />
                <div>
                    <h4 className="font-bold text-indigo-900">Platform Assurance</h4>
                    <p className="text-sm text-indigo-700 mt-1">
                        All automated actions are logged in the <strong>Audit Log</strong>.
                        AI thresholds use the Gemini model to analyze resumes against your specific job descriptions.
                        We recommend starting with a 90% threshold for shortlisting.
                    </p>
                </div>
            </div>
        </div>
    );
}
