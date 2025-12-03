import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { Building2, Save, Check, AlertTriangle, Link as LinkIcon, ShieldCheck, CreditCard, Mail } from 'lucide-react';
import StripeConnect from '@/components/organization/StripeConnect';
import SmtpSettings from '@/components/organization/SmtpSettings';

export default function TenantSettings() {
    const { currentTenant, refreshTenants } = useTenant();
    const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'email'>('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (currentTenant) {
            setSettings(currentTenant.settings || {});
        }
    }, [currentTenant]);

    const handleSave = async () => {
        if (!currentTenant) return;
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('tenants')
                .update({ settings })
                .eq('id', currentTenant.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Settings saved successfully' });
            await refreshTenants();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const toggleFeature = (feature: string) => {
        setSettings((prev: any) => {
            const disabledFeatures = prev.disabled_features || [];
            const isCurrentlyDisabled = disabledFeatures.includes(feature);

            let newDisabled;
            if (isCurrentlyDisabled) {
                newDisabled = disabledFeatures.filter((f: string) => f !== feature);
            } else {
                newDisabled = [...disabledFeatures, feature];
            }

            return { ...prev, disabled_features: newDisabled };
        });
    };

    const toggleIntegration = (enabled: boolean) => {
        setSettings((prev: any) => ({
            ...prev,
            novumflow_integration: {
                ...prev.novumflow_integration,
                enabled
            }
        }));
    };

    if (!currentTenant) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
                    <p className="text-gray-500">Manage your organization profile and integrations</p>
                </div>
                {activeTab === 'general' && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'general'
                            ? 'border-cyan-600 text-cyan-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    General & Compliance
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'payments'
                            ? 'border-cyan-600 text-cyan-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Payments
                </button>
                <button
                    onClick={() => setActiveTab('email')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'email'
                            ? 'border-cyan-600 text-cyan-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Email Settings
                </button>
            </div>

            {message && activeTab === 'general' && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {activeTab === 'general' && (
                <div className="grid gap-6">
                    {/* General Profile */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-50 rounded-lg">
                                <Building2 className="w-5 h-5 text-cyan-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">General Profile</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                                <input
                                    type="text"
                                    value={currentTenant.name}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        https://
                                    </span>
                                    <input
                                        type="text"
                                        value={currentTenant.subdomain}
                                        disabled
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NovumFlow Integration */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <LinkIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">NovumFlow Integration</h2>
                                    <p className="text-sm text-gray-500">Sync staff and compliance data from your HR platform</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.novumflow_integration?.enabled || false}
                                    onChange={(e) => toggleIntegration(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        {settings.novumflow_integration?.enabled && (
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                <h3 className="font-medium text-purple-900 mb-2">Integration Active</h3>
                                <ul className="space-y-2 text-sm text-purple-700">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Staff hired in NovumFlow will automatically appear in CareFlow
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Right to Work status is synced and enforced
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        DBS checks are synced and enforced
                                    </li>
                                </ul>

                                <div className="mt-4 pt-4 border-t border-purple-200">
                                    <label className="block text-sm font-medium text-purple-900 mb-2">Webhook URL</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 bg-white px-3 py-2 rounded border border-purple-200 text-xs font-mono">
                                            https://niikshfoecitimepiifo.supabase.co/functions/v1/sync_employee
                                        </code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText('https://niikshfoecitimepiifo.supabase.co/functions/v1/sync_employee')}
                                            className="px-3 py-1 text-xs bg-white border border-purple-200 rounded hover:bg-purple-100 text-purple-700"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-purple-600 mt-1">Add this URL to your NovumFlow Webhook settings.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compliance Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Compliance Enforcement</h2>
                                <p className="text-sm text-gray-500">Configure strict blocks for non-compliant staff</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">Block Invalid Right to Work</p>
                                    <p className="text-sm text-gray-500">Prevent assigning visits if Right to Work is missing or expired</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={!settings.disabled_features?.includes('block_rtw')}
                                        onChange={() => toggleFeature('block_rtw')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium text-gray-900">Block Invalid DBS</p>
                                    <p className="text-sm text-gray-500">Prevent assigning visits if DBS is missing, expired, or flagged</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={!settings.disabled_features?.includes('block_dbs')}
                                        onChange={() => toggleFeature('block_dbs')}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && <StripeConnect />}
            {activeTab === 'email' && <SmtpSettings />}
        </div>
    );
}
