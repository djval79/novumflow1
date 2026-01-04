import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    Shield,
    AlertTriangle,
    Clock,
    Users,
    Plus,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Eye,
    Edit,
    Search,
    Filter,
    Globe
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import Toast from './Toast';

interface SponsoredWorker {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    nationality: string;
    visa_type: string;
    visa_number: string;
    visa_expiry_date: string;
    cos_number: string;
    rtw_check_date: string;
    rtw_next_check_date: string;
    job_title: string;
    department: string;
    sponsorship_status: string;
}

interface ComplianceAlert {
    id: string;
    worker_id: string;
    alert_type: string;
    severity: string;
    title: string;
    description: string;
    due_date: string;
    status: string;
    worker?: SponsoredWorker;
}

export default function SponsorGuardianDashboard() {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [workers, setWorkers] = useState<SponsoredWorker[]>([]);
    const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<SponsoredWorker | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [activeView, setActiveView] = useState<'workers' | 'alerts'>('workers');

    // Stats
    const [stats, setStats] = useState({
        totalWorkers: 0,
        expiringIn30Days: 0,
        rtwChecksDue: 0,
        criticalAlerts: 0
    });

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant]);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadWorkers(), loadAlerts()]);
        setLoading(false);
    }

    async function loadWorkers() {
        if (!currentTenant) return;

        const { data, error } = await supabase
            .from('sponsored_workers')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('visa_expiry_date', { ascending: true });

        if (!error && data) {
            setWorkers(data);

            // Calculate stats
            const today = new Date();
            const in30Days = addDays(today, 30);

            setStats({
                totalWorkers: data.filter(w => w.sponsorship_status === 'active').length,
                expiringIn30Days: data.filter(w => {
                    if (!w.visa_expiry_date) return false;
                    const expiry = new Date(w.visa_expiry_date);
                    return expiry >= today && expiry <= in30Days;
                }).length,
                rtwChecksDue: data.filter(w => {
                    if (!w.rtw_next_check_date) return false;
                    const checkDate = new Date(w.rtw_next_check_date);
                    return checkDate <= in30Days;
                }).length,
                criticalAlerts: 0 // Will be updated from alerts
            });
        }
    }

    async function loadAlerts() {
        if (!currentTenant) return;

        const { data, error } = await supabase
            .from('sponsor_compliance_alerts')
            .select('*, sponsored_workers(*)')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'active')
            .order('due_date', { ascending: true });

        if (!error && data) {
            setAlerts(data.map(a => ({ ...a, worker: a.sponsored_workers })));
            setStats(prev => ({
                ...prev,
                criticalAlerts: data.filter(a => a.severity === 'critical').length
            }));
        }
    }

    async function resolveAlert(alertId: string) {
        const { error } = await supabase
            .from('sponsor_compliance_alerts')
            .update({
                status: 'resolved',
                resolved_by: user?.id,
                resolved_at: new Date().toISOString()
            })
            .eq('id', alertId);

        if (!error) {
            setToast({ message: 'Alert resolved', type: 'success' });
            loadAlerts();
        }
    }

    async function acknowledgeAlert(alertId: string) {
        const { error } = await supabase
            .from('sponsor_compliance_alerts')
            .update({
                status: 'acknowledged',
                acknowledged_by: user?.id,
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', alertId);

        if (!error) {
            setToast({ message: 'Alert acknowledged', type: 'success' });
            loadAlerts();
        }
    }

    function getDaysUntilExpiry(date: string) {
        if (!date) return null;
        return differenceInDays(new Date(date), new Date());
    }

    function getExpiryBadgeColor(days: number | null) {
        if (days === null) return 'bg-gray-100 text-gray-600';
        if (days <= 0) return 'bg-red-100 text-red-800';
        if (days <= 14) return 'bg-red-100 text-red-700';
        if (days <= 30) return 'bg-orange-100 text-orange-700';
        if (days <= 60) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    }

    function getSeverityColor(severity: string) {
        switch (severity) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-blue-500';
        }
    }

    const filteredWorkers = workers.filter(w => {
        const matchesSearch = `${w.first_name} ${w.last_name} ${w.email} ${w.visa_number || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || w.sponsorship_status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sponsor Guardian</h1>
                        <p className="text-sm text-gray-500">Visa & Right-to-Work Compliance Management</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sponsored Worker
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Workers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalWorkers}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Visas Expiring (30d)</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.expiringIn30Days}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">RTW Checks Due</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.rtwChecksDue}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Critical Alerts</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats.criticalAlerts}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Alerts Banner */}
            {alerts.filter(a => a.severity === 'critical').length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-800">Critical Compliance Actions Required</p>
                            <p className="text-sm text-red-600">
                                You have {alerts.filter(a => a.severity === 'critical').length} critical alert(s) that need immediate attention.
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveView('alerts')}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                        >
                            View Alerts
                        </button>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveView('workers')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeView === 'workers'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Sponsored Workers
                </button>
                <button
                    onClick={() => setActiveView('alerts')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeView === 'alerts'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Compliance Alerts
                    {alerts.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {alerts.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Workers View */}
            {activeView === 'workers' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {/* Search & Filter */}
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search workers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="ending">Ending</option>
                                <option value="ended">Ended</option>
                            </select>
                        </div>
                    </div>

                    {/* Workers Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Expiry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RTW Check</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredWorkers.length > 0 ? (
                                    filteredWorkers.map((worker) => {
                                        const daysUntilExpiry = getDaysUntilExpiry(worker.visa_expiry_date);
                                        const daysUntilRtw = getDaysUntilExpiry(worker.rtw_next_check_date);

                                        return (
                                            <tr key={worker.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <Globe className="w-5 h-5 text-indigo-600" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="font-medium text-gray-900">{worker.first_name} {worker.last_name}</p>
                                                            <p className="text-sm text-gray-500">{worker.nationality || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{worker.visa_type}</span>
                                                    {worker.cos_number && (
                                                        <p className="text-xs text-gray-500">CoS: {worker.cos_number}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExpiryBadgeColor(daysUntilExpiry)}`}>
                                                        {daysUntilExpiry !== null
                                                            ? daysUntilExpiry <= 0
                                                                ? 'EXPIRED'
                                                                : `${daysUntilExpiry} days`
                                                            : 'N/A'}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {worker.visa_expiry_date && format(new Date(worker.visa_expiry_date), 'dd MMM yyyy')}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {worker.rtw_next_check_date ? (
                                                        <>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExpiryBadgeColor(daysUntilRtw)}`}>
                                                                {daysUntilRtw !== null && daysUntilRtw <= 0 ? 'OVERDUE' : `${daysUntilRtw} days`}
                                                            </span>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {format(new Date(worker.rtw_next_check_date), 'dd MMM yyyy')}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Not set</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${worker.sponsorship_status === 'active' ? 'bg-green-100 text-green-800' :
                                                            worker.sponsorship_status === 'ending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {worker.sponsorship_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => setSelectedWorker(worker)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="text-gray-600 hover:text-gray-900 p-1 rounded ml-2"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                            No sponsored workers found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Alerts View */}
            {activeView === 'alerts' && (
                <div className="space-y-4">
                    {alerts.length > 0 ? (
                        alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-xl ${getSeverityColor(alert.severity)} bg-opacity-10`}>
                                            <AlertTriangle className={`w-6 h-6 ${alert.severity === 'critical' ? 'text-red-500' :
                                                    alert.severity === 'high' ? 'text-orange-500' :
                                                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                                                }`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {alert.severity}
                                                </span>
                                                <span className="text-xs text-gray-500">{alert.alert_type.replace('_', ' ')}</span>
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mt-1">{alert.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                            {alert.due_date && (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    Due: {format(new Date(alert.due_date), 'dd MMM yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            Acknowledge
                                        </button>
                                        <button
                                            onClick={() => resolveAlert(alert.id)}
                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900">All Clear!</h3>
                            <p className="text-gray-500 mt-1">No active compliance alerts at this time.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Worker Modal */}
            {showAddModal && (
                <AddSponsoredWorkerModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setToast({ message: 'Sponsored worker added successfully', type: 'success' });
                        loadData();
                    }}
                    onError={(msg) => setToast({ message: msg, type: 'error' })}
                />
            )}

            {/* Worker Details Modal */}
            {selectedWorker && (
                <WorkerDetailsModal
                    worker={selectedWorker}
                    onClose={() => setSelectedWorker(null)}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// Add Worker Modal Component
function AddSponsoredWorkerModal({
    isOpen,
    onClose,
    onSuccess,
    onError
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        nationality: '',
        visa_type: 'Skilled Worker',
        visa_number: '',
        visa_expiry_date: '',
        cos_number: '',
        job_title: '',
        department: '',
        rtw_check_date: '',
        rtw_next_check_date: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTenant || !user) return;

        setLoading(true);
        const { error } = await supabase
            .from('sponsored_workers')
            .insert({
                ...formData,
                tenant_id: currentTenant.id,
                created_by: user.id,
                sponsorship_status: 'active'
            });

        setLoading(false);

        if (error) {
            onError(error.message);
        } else {
            onSuccess();
            onClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add Sponsored Worker</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                <input
                                    type="text"
                                    value={formData.nationality}
                                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g., Nigerian, Indian"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visa Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visa Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type *</label>
                                <select
                                    required
                                    value={formData.visa_type}
                                    onChange={(e) => setFormData({ ...formData, visa_type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Skilled Worker">Skilled Worker</option>
                                    <option value="Health and Care Worker">Health and Care Worker</option>
                                    <option value="Student">Student</option>
                                    <option value="Graduate">Graduate</option>
                                    <option value="Dependent">Dependant</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Number</label>
                                <input
                                    type="text"
                                    value={formData.visa_number}
                                    onChange={(e) => setFormData({ ...formData, visa_number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Expiry Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.visa_expiry_date}
                                    onChange={(e) => setFormData({ ...formData, visa_expiry_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CoS Number</label>
                                <input
                                    type="text"
                                    value={formData.cos_number}
                                    onChange={(e) => setFormData({ ...formData, cos_number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Certificate of Sponsorship"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RTW */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Right to Work</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last RTW Check Date</label>
                                <input
                                    type="date"
                                    value={formData.rtw_check_date}
                                    onChange={(e) => setFormData({ ...formData, rtw_check_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Next RTW Check Due</label>
                                <input
                                    type="date"
                                    value={formData.rtw_next_check_date}
                                    onChange={(e) => setFormData({ ...formData, rtw_next_check_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Worker'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Worker Details Modal
function WorkerDetailsModal({
    worker,
    onClose
}: {
    worker: SponsoredWorker;
    onClose: () => void;
}) {
    const daysUntilExpiry = differenceInDays(new Date(worker.visa_expiry_date), new Date());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Worker Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Globe className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{worker.first_name} {worker.last_name}</h3>
                            <p className="text-gray-500">{worker.nationality}</p>
                        </div>
                    </div>

                    {/* Visa Info */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Visa Type</span>
                            <span className="font-medium text-gray-900">{worker.visa_type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Visa Number</span>
                            <span className="font-medium text-gray-900">{worker.visa_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Expiry Date</span>
                            <span className={`font-medium ${daysUntilExpiry <= 30 ? 'text-red-600' : 'text-gray-900'}`}>
                                {format(new Date(worker.visa_expiry_date), 'dd MMM yyyy')}
                                {daysUntilExpiry > 0 && ` (${daysUntilExpiry} days)`}
                            </span>
                        </div>
                        {worker.cos_number && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">CoS Number</span>
                                <span className="font-medium text-gray-900">{worker.cos_number}</span>
                            </div>
                        )}
                    </div>

                    {/* Employment */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Employment</h4>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Job Title</span>
                            <span className="font-medium text-gray-900">{worker.job_title || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Department</span>
                            <span className="font-medium text-gray-900">{worker.department || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
