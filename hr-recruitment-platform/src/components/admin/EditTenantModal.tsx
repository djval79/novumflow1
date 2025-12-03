import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Loader2, CreditCard, Activity, Settings } from 'lucide-react';

interface EditTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: any;
    onSuccess: () => void;
}

export default function EditTenantModal({ isOpen, onClose, tenant, onSuccess }: EditTenantModalProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'billing' | 'activity'>('settings');
    const [tenantDetails, setTenantDetails] = useState<any>(null);
    const [formData, setFormData] = useState({
        subscription_tier: 'trial',
        limits: {
            max_users: 10,
            max_employees: 50,
            max_clients: 100,
            max_storage_gb: 10
        },
        features: {
            novumflow_enabled: true,
            careflow_enabled: true,
            ai_enabled: false,
            sms_enabled: false
        }
    });

    useEffect(() => {
        if (tenant && isOpen) {
            fetchTenantDetails();
        }
    }, [tenant, isOpen]);

    const fetchTenantDetails = async () => {
        try {
            // Use the new RPC to get comprehensive details
            const { data, error } = await supabase.rpc('get_tenant_details', { p_tenant_id: tenant.id });

            if (error) throw error;

            setTenantDetails(data);
            setFormData({
                subscription_tier: data.subscription_tier,
                limits: data.settings?.limits || { // Assuming limits are in settings jsonb now, or fallback
                    max_users: 10,
                    max_employees: 50,
                    max_clients: 100,
                    max_storage_gb: 10
                },
                features: data.settings?.features || {
                    novumflow_enabled: true,
                    careflow_enabled: true,
                    ai_enabled: false,
                    sms_enabled: false
                }
            });
        } catch (err) {
            console.error('Error fetching tenant details:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // We need to update the settings JSONB column. 
            // The previous RPC 'update_tenant_settings' might need adjustment or we do a direct update if RLS allows.
            // Assuming we use a direct update for now as platform admin.

            const { error } = await supabase
                .from('tenants')
                .update({
                    subscription_tier: formData.subscription_tier,
                    settings: {
                        ...tenantDetails?.settings, // Keep existing settings like payment/email
                        limits: formData.limits,
                        features: formData.features
                    }
                })
                .eq('id', tenant.id);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating tenant:', err);
            alert('Failed to update tenant: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Organization Details</h2>
                        <p className="text-sm text-gray-500">{tenant?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'billing' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <CreditCard className="w-4 h-4" />
                        Billing
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activity' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Activity className="w-4 h-4" />
                        Activity
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'settings' && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Subscription Tier */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Plan</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['trial', 'basic', 'professional', 'enterprise'].map((tier) => (
                                        <label key={tier} className={`
                                            relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                                            ${formData.subscription_tier === tier ? 'border-cyan-600 bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}
                                        `}>
                                            <input
                                                type="radio"
                                                name="tier"
                                                value={tier}
                                                checked={formData.subscription_tier === tier}
                                                onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                                                className="sr-only"
                                            />
                                            <span className="capitalize font-medium text-gray-900">{tier}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Limits */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Limits</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                                        <input
                                            type="number"
                                            value={formData.limits.max_users}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                limits: { ...formData.limits, max_users: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Employees</label>
                                        <input
                                            type="number"
                                            value={formData.limits.max_employees}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                limits: { ...formData.limits, max_employees: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Clients</label>
                                        <input
                                            type="number"
                                            value={formData.limits.max_clients}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                limits: { ...formData.limits, max_clients: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Storage (GB)</label>
                                        <input
                                            type="number"
                                            value={formData.limits.max_storage_gb}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                limits: { ...formData.limits, max_storage_gb: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h3>
                                <div className="space-y-3">
                                    {Object.entries(formData.features).map(([key, value]) => (
                                        <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        features: { ...formData.features, [key]: e.target.checked }
                                                    })}
                                                    className="opacity-0 w-0 h-0"
                                                    id={`toggle-${key}`}
                                                />
                                                <label
                                                    htmlFor={`toggle-${key}`}
                                                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-in-out ${value ? 'bg-cyan-600' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${value ? 'transform translate-x-6' : ''
                                                            }`}
                                                    />
                                                </label>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Subscription</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Plan</p>
                                        <p className="text-lg font-semibold text-gray-900 capitalize">{tenantDetails?.subscription_tier}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tenantDetails?.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {tenantDetails?.subscription_status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Stripe Account ID</p>
                                        <p className="text-sm font-mono text-gray-700">
                                            {tenantDetails?.settings?.payment_gateway?.account_id || 'Not Connected'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Next Billing Date</p>
                                        <p className="text-sm text-gray-900">
                                            {/* Mock date for now */}
                                            {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-600 font-medium">Active Jobs</p>
                                    <p className="text-2xl font-bold text-blue-900">{tenantDetails?.job_count || 0}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <p className="text-sm text-green-600 font-medium">Applications</p>
                                    <p className="text-2xl font-bold text-green-900">{tenantDetails?.application_count || 0}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <p className="text-sm text-purple-600 font-medium">Interviews</p>
                                    <p className="text-2xl font-bold text-purple-900">{tenantDetails?.interview_count || 0}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                    {tenantDetails?.recent_activity && tenantDetails.recent_activity.length > 0 ? (
                                        <ul className="divide-y divide-gray-200">
                                            {tenantDetails.recent_activity.map((log: any, index: number) => (
                                                <li key={index} className="p-4 hover:bg-gray-50">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                                                            <p className="text-xs text-gray-500">by {log.user_name}</p>
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">
                                            No recent activity found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
