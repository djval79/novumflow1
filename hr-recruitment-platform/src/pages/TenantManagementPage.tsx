import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tenantService, Tenant, Feature } from '@/lib/services/TenantService';
import { Building2, Check, X, Loader2, Shield } from 'lucide-react';
import Toast from '@/components/Toast';

export default function TenantManagementPage() {
    const { user, profile } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [featureStatus, setFeatureStatus] = useState<Map<string, boolean>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedTenant) {
            loadTenantFeatures(selectedTenant.id);
        }
    }, [selectedTenant]);

    async function loadData() {
        setLoading(true);
        const [tenantsData, featuresData] = await Promise.all([
            tenantService.getAllTenants(),
            tenantService.getAllFeatures()
        ]);
        setTenants(tenantsData);
        setFeatures(featuresData);
        if (tenantsData.length > 0) {
            setSelectedTenant(tenantsData[0]);
        }
        setLoading(false);
    }

    async function loadTenantFeatures(tenantId: string) {
        const status = await tenantService.getTenantFeatureStatus(tenantId);
        setFeatureStatus(status);
    }

    async function toggleFeature(featureId: string, currentStatus: boolean) {
        if (!selectedTenant || !user) return;

        setSaving(true);
        const success = currentStatus
            ? await tenantService.disableFeature(selectedTenant.id, featureId)
            : await tenantService.enableFeature(selectedTenant.id, featureId, user.id);

        if (success) {
            setToast({ message: 'Feature updated successfully', type: 'success' });
            await loadTenantFeatures(selectedTenant.id);
        } else {
            setToast({ message: 'Failed to update feature', type: 'error' });
        }
        setSaving(false);
    }

    // Check if user is super admin
    if (!profile?.is_super_admin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <Shield className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">
                        This page is only accessible to super administrators.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Manage features and settings for each tenant organization
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tenant List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Tenants</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {tenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    onClick={() => setSelectedTenant(tenant)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${selectedTenant?.id === tenant.id ? 'bg-cyan-50 border-l-4 border-cyan-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start">
                                        <Building2 className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {tenant.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {tenant.subscription_tier}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feature Management */}
                <div className="lg:col-span-3">
                    {selectedTenant && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {selectedTenant.name}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {selectedTenant.domain || 'No domain configured'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedTenant.subscription_tier === 'enterprise'
                                            ? 'bg-purple-100 text-purple-800'
                                            : selectedTenant.subscription_tier === 'premium'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {selectedTenant.subscription_tier}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Access</h3>

                                {/* Group features by category */}
                                {['module', 'feature', 'integration'].map(category => {
                                    const categoryFeatures = features.filter(f => f.category === category);
                                    if (categoryFeatures.length === 0) return null;

                                    return (
                                        <div key={category} className="mb-6">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                                                {category === 'module' ? 'Modules' : category === 'feature' ? 'Features' : 'Integrations'}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {categoryFeatures.map((feature) => {
                                                    const isEnabled = featureStatus.get(feature.id) || false;
                                                    return (
                                                        <div
                                                            key={feature.id}
                                                            className={`border rounded-lg p-4 transition ${isEnabled
                                                                    ? 'border-cyan-200 bg-cyan-50'
                                                                    : 'border-gray-200 bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center">
                                                                        <h5 className="text-sm font-medium text-gray-900">
                                                                            {feature.display_name}
                                                                        </h5>
                                                                        {feature.is_premium && (
                                                                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                                                                Premium
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {feature.description && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {feature.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleFeature(feature.id, isEnabled)}
                                                                    disabled={saving}
                                                                    className={`ml-3 flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${isEnabled ? 'bg-cyan-600' : 'bg-gray-200'
                                                                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <span
                                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
