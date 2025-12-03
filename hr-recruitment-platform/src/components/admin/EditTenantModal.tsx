import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';

interface EditTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: any;
    onSuccess: () => void;
}

export default function EditTenantModal({ isOpen, onClose, tenant, onSuccess }: EditTenantModalProps) {
    const [loading, setLoading] = useState(false);
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
        if (tenant) {
            // Fetch full tenant details first because the list view might not have everything
            fetchTenantDetails();
        }
    }, [tenant]);

    const fetchTenantDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', tenant.id)
                .single();

            if (error) throw error;

            setFormData({
                subscription_tier: data.subscription_tier,
                limits: data.limits || {
                    max_users: 10,
                    max_employees: 50,
                    max_clients: 100,
                    max_storage_gb: 10
                },
                features: data.features || {
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
            const { error } = await supabase.rpc('update_tenant_settings', {
                p_tenant_id: tenant.id,
                p_limits: formData.limits,
                p_features: formData.features,
                p_subscription_tier: formData.subscription_tier
            });

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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Edit Organization: {tenant?.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
            </div>
        </div>
    );
}
