import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Building, Activity, Search, Filter, MoreVertical, CheckCircle, XCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import EditTenantModal from '@/components/admin/EditTenantModal';
import { log } from '@/lib/logger';
import LeadManagement from '@/components/admin/LeadManagement';

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
    const [stats, setStats] = useState({
        total_tenants: 0,
        active_tenants: 0,
        total_users: 0,
        total_jobs: 0,
        total_applications: 0,
        total_mrr: 0
    });
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'tenants' | 'leads'>('tenants');
    const [leadsCount, setLeadsCount] = useState(0);

    useEffect(() => {
        fetchTenants();
        fetchStats();
        fetchLeadsCount();
    }, []);

    const fetchLeadsCount = async () => {
        const { count } = await supabase.from('demo_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        setLeadsCount(count || 0);
    };

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_platform_stats');
            if (error) throw error;
            if (data) setStats(data);
        } catch (err) {
            log.error('Error fetching stats', err, { component: 'AdminPortalPage' });
        }
    };

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_all_tenants');
            if (error) throw error;
            setTenants(data || []);
        } catch (err) {
            log.error('Error fetching tenants', err, { component: 'AdminPortalPage' });
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
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
            fetchStats(); // Update stats too

            log.security('tenant_status_toggled', {
                component: 'AdminPortalPage',
                metadata: { tenantId, newStatus: !currentStatus }
            });

            toast.success(`Tenant ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (err) {
            log.error('Error toggling tenant status', err, {
                component: 'AdminPortalPage',
                metadata: { tenantId }
            });
            toast.error('Failed to update tenant status');
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
                                <p className="text-xl font-bold text-gray-900">{stats.total_tenants}</p>
                                <p className="text-xs text-gray-500">{stats.active_tenants} Active</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-xl font-bold text-gray-900">{stats.total_users}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Est. MRR</p>
                                <p className="text-xl font-bold text-gray-900">${stats.total_mrr}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 font-bold">
                    <button
                        onClick={() => setActiveTab('tenants')}
                        className={`px-6 py-4 transition-colors relative ${activeTab === 'tenants' ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Organizations
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`px-6 py-4 transition-colors relative ${activeTab === 'leads' ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Marketing Leads
                        {leadsCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-cyan-600 text-white text-[10px] rounded-full">New</span>
                        )}
                    </button>
                </div>

                {activeTab === 'leads' ? (
                    <LeadManagement />
                ) : (
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
                )}
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
