import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tenantService, Tenant, Feature } from '@/lib/services/TenantService';
import { Building2, Check, X, Loader2, Shield, Save, CheckCircle2, Clock } from 'lucide-react';
import Toast from '@/components/Toast';
import TenantOnboardingWizard from '@/components/TenantOnboardingWizard';
import { onboardingService, TenantOnboarding } from '@/lib/services/OnboardingService';

export default function TenantManagementPage() {
    const { user, profile } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [featureStatus, setFeatureStatus] = useState<Map<string, boolean>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [subscriptionPrice, setSubscriptionPrice] = useState('');
    const [currency, setCurrency] = useState('GBP');
    const [subscriptionInterval, setSubscriptionInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        subscription_tier: 'basic',
        subscription_price: '',
        currency: 'GBP',
        subscription_interval: 'monthly' as 'monthly' | 'yearly',
        max_users: '10'
    });
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingData, setOnboardingData] = useState<Map<string, TenantOnboarding>>(new Map());

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedTenant) {
            loadTenantFeatures(selectedTenant.id);
            setSubscriptionPrice(selectedTenant.subscription_price?.toString() || '');
            setCurrency(selectedTenant.currency || 'GBP');
            setSubscriptionInterval(selectedTenant.subscription_interval || 'monthly');
            setFormData({
                name: selectedTenant.name,
                domain: selectedTenant.domain || '',
                subscription_tier: selectedTenant.subscription_tier,
                subscription_price: selectedTenant.subscription_price?.toString() || '',
                currency: selectedTenant.currency || 'GBP',
                subscription_interval: selectedTenant.subscription_interval || 'monthly',
                max_users: selectedTenant.max_users?.toString() || '10'
            });
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

        // Load onboarding data for all tenants
        const onboardingMap = new Map<string, TenantOnboarding>();
        for (const tenant of tenantsData) {
            const onboarding = await onboardingService.getOnboardingStatus(tenant.id);
            if (onboarding) {
                onboardingMap.set(tenant.id, onboarding);
            }
        }
        setOnboardingData(onboardingMap);

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

    async function saveSubscription() {
        if (!selectedTenant) return;
        setSaving(true);
        const success = await tenantService.updateTenantSubscription(
            selectedTenant.id,
            parseFloat(subscriptionPrice) || 0,
            currency,
            subscriptionInterval
        );

        if (success) {
            setToast({ message: 'Subscription updated successfully', type: 'success' });
            // Update local state
            const updatedTenants = tenants.map(t =>
                t.id === selectedTenant.id
                    ? { ...t, subscription_price: parseFloat(subscriptionPrice) || 0, currency, subscription_interval: subscriptionInterval }
                    : t
            );
            setTenants(updatedTenants);
            setSelectedTenant({ ...selectedTenant, subscription_price: parseFloat(subscriptionPrice) || 0, currency, subscription_interval: subscriptionInterval });
        } else {
            setToast({ message: 'Failed to update subscription', type: 'error' });
        }
        setSaving(false);
    }

    async function handleCreateTenant() {
        setSaving(true);
        const newTenant = await tenantService.createTenant({
            name: formData.name,
            domain: formData.domain || null,
            subscription_tier: formData.subscription_tier,
            subscription_price: parseFloat(formData.subscription_price) || undefined,
            currency: formData.currency,
            subscription_interval: formData.subscription_interval,
            max_users: parseInt(formData.max_users) || 10,
            is_active: true
        });

        if (newTenant) {
            setToast({ message: 'Tenant created successfully', type: 'success' });
            await loadData();
            setShowCreateModal(false);
            setFormData({
                name: '',
                domain: '',
                subscription_tier: 'basic',
                subscription_price: '',
                currency: 'GBP',
                subscription_interval: 'monthly',
                max_users: '10'
            });
        } else {
            setToast({ message: 'Failed to create tenant', type: 'error' });
        }
        setSaving(false);
    }

    async function handleUpdateTenant() {
        if (!selectedTenant) return;

        console.log('Updating tenant:', {
            tenantId: selectedTenant.id,
            oldName: selectedTenant.name,
            newName: formData.name,
            updates: {
                name: formData.name,
                domain: formData.domain || null,
                subscription_tier: formData.subscription_tier,
                subscription_price: parseFloat(formData.subscription_price) || undefined,
                currency: formData.currency,
                subscription_interval: formData.subscription_interval,
                max_users: parseInt(formData.max_users) || 10
            }
        });

        setSaving(true);
        try {
            const success = await tenantService.updateTenant(selectedTenant.id, {
                name: formData.name,
                domain: formData.domain || null,
                subscription_tier: formData.subscription_tier,
                subscription_price: parseFloat(formData.subscription_price) || undefined,
                currency: formData.currency,
                subscription_interval: formData.subscription_interval,
                max_users: parseInt(formData.max_users) || 10
            });

            if (success) {
                console.log('Tenant update successful, reloading data...');
                setToast({ message: 'Tenant updated successfully', type: 'success' });

                // Reload all data to ensure we have the latest
                await loadData();

                // Find and set the updated tenant as selected
                const updatedTenants = await tenantService.getAllTenants();
                const updated = updatedTenants.find(t => t.id === selectedTenant.id);
                if (updated) {
                    console.log('Updated tenant data:', updated);
                    setSelectedTenant(updated);
                }

                setEditMode(false);
            } else {
                console.error('Tenant update failed - service returned false');
                setToast({ message: 'Failed to update tenant. Please check permissions.', type: 'error' });
            }
        } catch (error) {
            console.error('Error updating tenant:', error);
            setToast({ message: 'An error occurred while updating tenant', type: 'error' });
        } finally {
            setSaving(false);
        }
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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage features and settings for each tenant organization
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Tenant
                </button>
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
                                                {tenant.subscription_price && (
                                                    <span className="ml-2 text-cyan-600 font-medium">
                                                        {tenant.currency === 'USD' ? '$' : tenant.currency === 'EUR' ? '€' : '£'}
                                                        {tenant.subscription_price}
                                                    </span>
                                                )}
                                            </p>
                                            {onboardingData.get(tenant.id) && (
                                                <div className="mt-2 flex items-center">
                                                    {onboardingData.get(tenant.id)!.onboarding_status === 'completed' ? (
                                                        <span className="inline-flex items-center text-xs text-green-600">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Onboarded
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-xs text-orange-600">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {onboardingData.get(tenant.id)!.completion_percentage}% complete
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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
                                    <div className="flex items-center space-x-3">
                                        {onboardingData.get(selectedTenant.id)?.onboarding_status !== 'completed' && (
                                            <button
                                                onClick={() => setShowOnboarding(true)}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                                            >
                                                Complete Onboarding ({onboardingData.get(selectedTenant.id)?.completion_percentage || 0}%)
                                            </button>
                                        )}
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
                            </div>

                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-900">Subscription Details</h3>
                                    {!editMode && (
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                                        >
                                            Edit Details
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                        <input
                                            type="number"
                                            value={subscriptionPrice}
                                            onChange={(e) => setSubscriptionPrice(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                        >
                                            <option value="GBP">GBP (£)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Interval</label>
                                        <select
                                            value={subscriptionInterval}
                                            onChange={(e) => setSubscriptionInterval(e.target.value as 'monthly' | 'yearly')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-cyan-500 focus:border-cyan-500"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={saveSubscription}
                                        disabled={saving}
                                        className="flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save
                                    </button>
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

            {/* Create/Edit Tenant Modal */}
            {(showCreateModal || editMode) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {showCreateModal ? 'Create New Tenant' : 'Edit Tenant'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="e.g., Acme Corporation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                                    <input
                                        type="text"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="e.g., acme.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier *</label>
                                    <select
                                        value={formData.subscription_tier}
                                        onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="premium">Premium</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
                                    <input
                                        type="number"
                                        value={formData.max_users}
                                        onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Subscription Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                        <input
                                            type="number"
                                            value={formData.subscription_price}
                                            onChange={(e) => setFormData({ ...formData, subscription_price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        >
                                            <option value="GBP">GBP (£)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Billing Interval</label>
                                        <select
                                            value={formData.subscription_interval}
                                            onChange={(e) => setFormData({ ...formData, subscription_interval: e.target.value as 'monthly' | 'yearly' })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditMode(false);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreateTenant : handleUpdateTenant}
                                disabled={saving || !formData.name}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                                        {showCreateModal ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : (
                                    showCreateModal ? 'Create Tenant' : 'Update Tenant'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Onboarding Wizard Modal */}
            {showOnboarding && selectedTenant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-3xl w-full">
                        <TenantOnboardingWizard
                            tenantId={selectedTenant.id}
                            tenantName={selectedTenant.name}
                            onClose={() => setShowOnboarding(false)}
                            onComplete={() => {
                                setShowOnboarding(false);
                                loadData(); // Reload to update onboarding status
                                setToast({ message: 'Onboarding completed successfully!', type: 'success' });
                            }}
                        />
                    </div>
                </div>
            )}

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
