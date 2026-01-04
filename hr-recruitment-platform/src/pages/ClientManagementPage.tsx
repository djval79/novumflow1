import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    Heart,
    Plus,
    Search,
    User,
    Phone,
    MapPin,
    Calendar,
    FileText,
    AlertTriangle,
    ChevronRight,
    Edit,
    Eye,
    X,
    Clock,
    CheckCircle
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import Toast from '@/components/Toast';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    address_line1: string;
    city: string;
    postcode: string;
    care_level: string;
    risk_level: string;
    status: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    notes: string;
}

interface CareVisit {
    id: string;
    client_id: string;
    scheduled_date: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
    assigned_employee_id: string;
    employees?: { first_name: string; last_name: string };
}

export default function ClientManagementPage() {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCareLevel, setFilterCareLevel] = useState<string>('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [todaysVisits, setTodaysVisits] = useState<CareVisit[]>([]);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        highRisk: 0,
        todaysVisits: 0
    });

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant]);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadClients(), loadTodaysVisits()]);
        setLoading(false);
    }

    async function loadClients() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('last_name');

        if (data) {
            setClients(data);
            setStats({
                total: data.length,
                active: data.filter(c => c.status === 'active').length,
                highRisk: data.filter(c => c.risk_level === 'high').length,
                todaysVisits: 0 // Will be updated from visits
            });
        }
    }

    async function loadTodaysVisits() {
        if (!currentTenant) return;

        const today = format(new Date(), 'yyyy-MM-dd');
        const { data } = await supabase
            .from('care_visits')
            .select('*, employees(first_name, last_name)')
            .eq('tenant_id', currentTenant.id)
            .eq('scheduled_date', today)
            .order('scheduled_start');

        if (data) {
            setTodaysVisits(data);
            setStats(prev => ({ ...prev, todaysVisits: data.length }));
        }
    }

    function getAge(dateOfBirth: string) {
        if (!dateOfBirth) return null;
        return differenceInYears(new Date(), new Date(dateOfBirth));
    }

    function getCareLevelBadge(level: string) {
        switch (level) {
            case 'complex': return 'bg-purple-100 text-purple-800';
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getRiskBadge(level: string) {
        switch (level) {
            case 'high': return 'bg-red-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-green-500 text-white';
        }
    }

    const filteredClients = clients.filter(client => {
        const matchesSearch = `${client.first_name} ${client.last_name} ${client.postcode || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
        const matchesCareLevel = filterCareLevel === 'all' || client.care_level === filterCareLevel;
        return matchesSearch && matchesStatus && matchesCareLevel;
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
                    <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl">
                        <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                        <p className="text-sm text-gray-500">Manage service users and care delivery</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Clients</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">High Risk</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats.highRisk}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today's Visits</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.todaysVisits}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Visits Summary */}
            {todaysVisits.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                    <h2 className="text-lg font-bold mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Today's Scheduled Visits
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {todaysVisits.slice(0, 4).map((visit) => {
                            const client = clients.find(c => c.id === visit.client_id);
                            return (
                                <div key={visit.id} className="bg-white/10 backdrop-blur rounded-xl p-4">
                                    <p className="font-medium">
                                        {client?.first_name} {client?.last_name}
                                    </p>
                                    <p className="text-white/80 text-sm">
                                        {visit.scheduled_start} - {visit.scheduled_end}
                                    </p>
                                    <p className="text-white/70 text-xs mt-1">
                                        {visit.employees?.first_name} {visit.employees?.last_name}
                                    </p>
                                    <span className={`inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium ${visit.status === 'completed' ? 'bg-green-400/30 text-green-100' :
                                            visit.status === 'in_progress' ? 'bg-blue-400/30 text-blue-100' :
                                                'bg-white/20'
                                        }`}>
                                        {visit.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {todaysVisits.length > 4 && (
                        <p className="text-white/80 text-sm mt-4">+ {todaysVisits.length - 4} more visits today</p>
                    )}
                </div>
            )}

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="discharged">Discharged</option>
                </select>
                <select
                    value={filterCareLevel}
                    onChange={(e) => setFilterCareLevel(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="all">All Care Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="complex">Complex</option>
                </select>
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                    <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-indigo-200 transition cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {client.preferred_name || client.first_name} {client.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {client.date_of_birth && `Age ${getAge(client.date_of_birth)}`}
                                        {client.gender && ` • ${client.gender}`}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition" />
                        </div>

                        <div className="space-y-2 text-sm">
                            {client.address_line1 && (
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                    {client.city}, {client.postcode}
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center text-gray-600">
                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                    {client.phone}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCareLevelBadge(client.care_level)}`}>
                                {client.care_level || 'Unset'} care
                            </span>
                            {client.risk_level && client.risk_level !== 'low' && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskBadge(client.risk_level)}`}>
                                    {client.risk_level} risk
                                </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {client.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredClients.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients Found</h3>
                    <p className="text-gray-500 mb-4">Add your first client to get started</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Client
                    </button>
                </div>
            )}

            {/* Add Client Modal */}
            {showAddModal && (
                <AddClientModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setToast({ message: 'Client added successfully', type: 'success' });
                        loadClients();
                    }}
                    onError={(msg) => setToast({ message: msg, type: 'error' })}
                />
            )}

            {/* Client Details Modal */}
            {selectedClient && (
                <ClientDetailsModal
                    client={selectedClient}
                    onClose={() => setSelectedClient(null)}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// Add Client Modal
function AddClientModal({
    onClose,
    onSuccess,
    onError
}: {
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
        preferred_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        address_line1: '',
        city: '',
        postcode: '',
        care_level: 'medium',
        risk_level: 'low',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        notes: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTenant || !user) return;

        setLoading(true);
        const { error } = await supabase
            .from('clients')
            .insert({
                ...formData,
                tenant_id: currentTenant.id,
                created_by: user.id,
                status: 'active',
                admission_date: new Date().toISOString().split('T')[0]
            });

        setLoading(false);

        if (error) {
            onError(error.message);
        } else {
            onSuccess();
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                                <input
                                    type="text"
                                    value={formData.preferred_name}
                                    onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={formData.address_line1}
                                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                <input
                                    type="text"
                                    value={formData.postcode}
                                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Care Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Requirements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Care Level</label>
                                <select
                                    value={formData.care_level}
                                    onChange={(e) => setFormData({ ...formData, care_level: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="complex">Complex</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                                <select
                                    value={formData.risk_level}
                                    onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.emergency_contact_name}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.emergency_contact_phone}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                                <input
                                    type="text"
                                    value={formData.emergency_contact_relation}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                                    placeholder="e.g., Daughter, Son"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
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
                            {loading ? 'Adding...' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Client Details Modal
function ClientDetailsModal({
    client,
    onClose
}: {
    client: Client;
    onClose: () => void;
}) {
    const age = client.date_of_birth ? differenceInYears(new Date(), new Date(client.date_of_birth)) : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Client Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {client.preferred_name || client.first_name} {client.last_name}
                            </h3>
                            <p className="text-gray-500">
                                {age && `${age} years old`}
                                {client.gender && ` • ${client.gender}`}
                            </p>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <h4 className="font-semibold text-gray-900">Contact Information</h4>
                        {client.phone && (
                            <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                {client.phone}
                            </div>
                        )}
                        {client.address_line1 && (
                            <div className="flex items-start text-gray-600">
                                <MapPin className="w-4 h-4 mr-3 mt-1 text-gray-400" />
                                <div>
                                    <p>{client.address_line1}</p>
                                    <p>{client.city}, {client.postcode}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Emergency Contact */}
                    {client.emergency_contact_name && (
                        <div className="bg-red-50 rounded-xl p-4">
                            <h4 className="font-semibold text-red-800 flex items-center mb-2">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Emergency Contact
                            </h4>
                            <p className="text-gray-900 font-medium">{client.emergency_contact_name}</p>
                            <p className="text-gray-600 text-sm">{client.emergency_contact_relation}</p>
                            <p className="text-gray-600">{client.emergency_contact_phone}</p>
                        </div>
                    )}

                    {/* Care Details */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Care Requirements</h4>
                        <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.care_level === 'complex' ? 'bg-purple-100 text-purple-800' :
                                    client.care_level === 'high' ? 'bg-red-100 text-red-800' :
                                        client.care_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                }`}>
                                {client.care_level || 'Unset'} care level
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.risk_level === 'high' ? 'bg-red-500 text-white' :
                                    client.risk_level === 'medium' ? 'bg-yellow-500 text-white' :
                                        'bg-green-100 text-green-800'
                                }`}>
                                {client.risk_level || 'low'} risk
                            </span>
                        </div>
                    </div>

                    {/* Notes */}
                    {client.notes && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                            <p className="text-gray-600 text-sm">{client.notes}</p>
                        </div>
                    )}
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
