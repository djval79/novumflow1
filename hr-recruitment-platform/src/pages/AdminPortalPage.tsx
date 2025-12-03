import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Building, Activity, Search, Filter, MoreVertical, CheckCircle, XCircle, Edit } from 'lucide-react';
import EditTenantModal from '@/components/admin/EditTenantModal';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    subscription_tier: string;
    subscription_status: string;
    created_at: string;
    member_count: number;
    is_active: boolean; // Note: RPC might not return this if I didn't include it in SELECT
}

export default function AdminPortalPage() {
    const { user } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_all_tenants');
            if (error) throw error;
            setTenants(data || []);
        } catch (err: any) {
            console.error('Error fetching tenants:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase.rpc('toggle_tenant_status', {
                p_tenant_id: tenantId,
                p_is_active: !currentStatus
            });

            if (error) throw error;

            // Refresh list
            fetchTenants();
        } catch (err: any) {
            console.error('Error toggling status:', err);
            alert('Failed to update tenant status');
        }
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="w-8 h-8 text-cyan-600" />
                            Platform Admin
                        </h1>
                        <p className="text-gray-600">Manage all organizations and subscriptions</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Tenants</p>
                                <p className="text-xl font-bold text-gray-900">{tenants.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {tenants.reduce((acc, t) => acc + (t.member_count || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search organizations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-700 font-bold text-lg">
                                                    {tenant.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                                    <div className="text-sm text-gray-500">{tenant.subdomain}.novumflow.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${tenant.subscription_tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                                    tenant.subscription_tier === 'professional' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {tenant.subscription_tier.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${tenant.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                                                    tenant.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {tenant.subscription_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {tenant.member_count}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTenant(tenant);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="text-cyan-600 hover:text-cyan-900 p-1 hover:bg-cyan-50 rounded"
                                                    title="Edit Settings"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleTenantStatus(tenant.id, tenant.is_active ?? true)}
                                                    className={`${tenant.is_active !== false ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'} p-1 hover:bg-gray-50 rounded`}
                                                    title={tenant.is_active !== false ? "Disable Tenant" : "Enable Tenant"}
                                                >
                                                    {tenant.is_active !== false ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <EditTenantModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedTenant(null);
                }}
                tenant={selectedTenant}
                onSuccess={() => {
                    fetchTenants();
                }}
            />
        </div>
    );
}
