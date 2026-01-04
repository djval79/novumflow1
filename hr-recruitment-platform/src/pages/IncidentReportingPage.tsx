import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    AlertOctagon,
    Plus,
    Search,
    Filter,
    Clock,
    AlertTriangle,
    CheckCircle,
    Eye,
    FileText,
    Calendar,
    User,
    MapPin,
    X,
    ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Toast from '@/components/Toast';

interface Incident {
    id: string;
    incident_reference: string;
    incident_type: string;
    category: string;
    severity: string;
    incident_date: string;
    incident_time: string;
    location: string;
    title: string;
    description: string;
    status: string;
    injuries_sustained: boolean;
    investigation_required: boolean;
    investigation_status: string;
    created_at: string;
}

const INCIDENT_TYPES = [
    { value: 'accident', label: 'Accident' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'medication_error', label: 'Medication Error' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'other', label: 'Other' }
];

const CATEGORIES = [
    { value: 'fall', label: 'Fall' },
    { value: 'injury', label: 'Injury' },
    { value: 'medication', label: 'Medication' },
    { value: 'abuse', label: 'Abuse/Neglect' },
    { value: 'property', label: 'Property Damage' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
];

const SEVERITIES = [
    { value: 'minor', label: 'Minor', color: 'bg-green-100 text-green-800' },
    { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'major', label: 'Major', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

export default function IncidentReportingPage() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        investigating: 0,
        critical: 0
    });

    useEffect(() => {
        if (currentTenant) {
            loadIncidents();
        }
    }, [currentTenant]);

    async function loadIncidents() {
        if (!currentTenant) return;
        setLoading(true);

        const { data } = await supabase
            .from('incidents')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('incident_date', { ascending: false });

        if (data) {
            setIncidents(data);
            setStats({
                total: data.length,
                open: data.filter(i => ['reported', 'under_review'].includes(i.status)).length,
                investigating: data.filter(i => i.status === 'investigating').length,
                critical: data.filter(i => i.severity === 'critical').length
            });
        }
        setLoading(false);
    }

    function getSeverityBadge(severity: string) {
        const sev = SEVERITIES.find(s => s.value === severity);
        return sev?.color || 'bg-gray-100 text-gray-800';
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'reported': return 'bg-blue-100 text-blue-800';
            case 'under_review': return 'bg-yellow-100 text-yellow-800';
            case 'investigating': return 'bg-purple-100 text-purple-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case 'safeguarding': return '🛡️';
            case 'medication_error': return '💊';
            case 'accident': return '⚠️';
            case 'near_miss': return '⚡';
            case 'behavioral': return '👤';
            case 'environmental': return '🏠';
            default: return '📋';
        }
    }

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch = `${incident.incident_reference} ${incident.title} ${incident.description}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
        const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
        return matchesSearch && matchesStatus && matchesSeverity;
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
                    <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl">
                        <AlertOctagon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Incident Reporting</h1>
                        <p className="text-sm text-gray-500">Log, track, and investigate incidents</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Report Incident
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Incidents</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Open</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.open}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Investigating</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.investigating}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Critical</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertOctagon className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Critical Alert Banner */}
            {stats.critical > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center">
                        <AlertOctagon className="w-5 h-5 text-red-600 mr-3" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-800">Critical Incidents Require Attention</p>
                            <p className="text-sm text-red-600">
                                You have {stats.critical} critical incident(s) that may need escalation.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search incidents..."
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
                        <option value="reported">Reported</option>
                        <option value="under_review">Under Review</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="all">All Severity</option>
                        <option value="minor">Minor</option>
                        <option value="moderate">Moderate</option>
                        <option value="major">Major</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
            </div>

            {/* Incidents List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filteredIncidents.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {filteredIncidents.map((incident) => (
                            <div
                                key={incident.id}
                                onClick={() => setSelectedIncident(incident)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="text-2xl">{getTypeIcon(incident.incident_type)}</div>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-sm font-mono text-gray-500">{incident.incident_reference}</span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(incident.severity)}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(incident.status)}`}>
                                                    {incident.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">{incident.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {format(new Date(incident.incident_date), 'dd MMM yyyy')}
                                                    {incident.incident_time && ` at ${incident.incident_time}`}
                                                </span>
                                                {incident.location && (
                                                    <span className="flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {incident.location}
                                                    </span>
                                                )}
                                                {incident.injuries_sustained && (
                                                    <span className="text-red-500 flex items-center">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Injury reported
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Found</h3>
                        <p className="text-gray-500">Great news! No incidents match your current filters.</p>
                    </div>
                )}
            </div>

            {/* Report Incident Modal */}
            {showReportModal && (
                <ReportIncidentModal
                    onClose={() => setShowReportModal(false)}
                    onSuccess={() => {
                        setToast({ message: 'Incident reported successfully', type: 'success' });
                        loadIncidents();
                    }}
                    onError={(msg) => setToast({ message: msg, type: 'error' })}
                />
            )}

            {/* Incident Details Modal */}
            {selectedIncident && (
                <IncidentDetailsModal
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onStatusUpdate={() => loadIncidents()}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// Report Incident Modal
function ReportIncidentModal({
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
        incident_type: 'accident',
        category: '',
        severity: 'moderate',
        incident_date: format(new Date(), 'yyyy-MM-dd'),
        incident_time: format(new Date(), 'HH:mm'),
        location: '',
        location_type: '',
        title: '',
        description: '',
        immediate_action_taken: '',
        injuries_sustained: false,
        injury_details: '',
        medical_attention_required: false
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTenant || !user) return;

        setLoading(true);
        const { error } = await supabase
            .from('incidents')
            .insert({
                ...formData,
                tenant_id: currentTenant.id,
                reported_by: user.id,
                status: 'reported'
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
                    <h2 className="text-xl font-bold text-gray-900">Report Incident</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Type & Severity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <select
                                required
                                value={formData.incident_type}
                                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {INCIDENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Select...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                            <select
                                required
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {SEVERITIES.map(sev => (
                                    <option key={sev.value} value={sev.value}>{sev.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.incident_date}
                                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={formData.incident_time}
                                onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Lounge, Bedroom, Kitchen"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                            <select
                                value={formData.location_type}
                                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Select...</option>
                                <option value="client_home">Client's Home</option>
                                <option value="care_home">Care Home</option>
                                <option value="office">Office</option>
                                <option value="hospital">Hospital</option>
                                <option value="public">Public Place</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Brief summary of the incident"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed description of what happened..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Immediate Action Taken</label>
                        <textarea
                            rows={2}
                            value={formData.immediate_action_taken}
                            onChange={(e) => setFormData({ ...formData, immediate_action_taken: e.target.value })}
                            placeholder="What actions were taken immediately?"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Injury Section */}
                    <div className="bg-red-50 rounded-xl p-4 space-y-4">
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="injuries"
                                checked={formData.injuries_sustained}
                                onChange={(e) => setFormData({ ...formData, injuries_sustained: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="injuries" className="text-sm font-medium text-red-800">
                                Injuries were sustained
                            </label>
                        </div>
                        {formData.injuries_sustained && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-red-800 mb-1">Injury Details</label>
                                    <textarea
                                        rows={2}
                                        value={formData.injury_details}
                                        onChange={(e) => setFormData({ ...formData, injury_details: e.target.value })}
                                        className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="medical"
                                        checked={formData.medical_attention_required}
                                        onChange={(e) => setFormData({ ...formData, medical_attention_required: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <label htmlFor="medical" className="text-sm font-medium text-red-800">
                                        Medical attention was required
                                    </label>
                                </div>
                            </>
                        )}
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
                            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Incident Details Modal
function IncidentDetailsModal({
    incident,
    onClose,
    onStatusUpdate
}: {
    incident: Incident;
    onClose: () => void;
    onStatusUpdate: () => void;
}) {
    const { user } = useAuth();

    async function updateStatus(newStatus: string) {
        const { error } = await supabase
            .from('incidents')
            .update({
                status: newStatus,
                ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString(), resolved_by: user?.id } : {})
            })
            .eq('id', incident.id);

        if (!error) {
            onStatusUpdate();
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div>
                        <p className="text-sm font-mono text-gray-500">{incident.incident_reference}</p>
                        <h2 className="text-xl font-bold text-gray-900">{incident.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityBadge(incident.severity)}`}>
                            {incident.severity} severity
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(incident.status)}`}>
                            {incident.status.replace('_', ' ')}
                        </span>
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                            {INCIDENT_TYPES.find(t => t.value === incident.incident_type)?.label}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                            <p className="text-gray-900">
                                {format(new Date(incident.incident_date), 'EEEE, dd MMMM yyyy')}
                                {incident.incident_time && ` at ${incident.incident_time}`}
                            </p>
                        </div>

                        {incident.location && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                                <p className="text-gray-900">{incident.location}</p>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-medium text-gray-500">Description</h4>
                            <p className="text-gray-900 whitespace-pre-wrap">{incident.description}</p>
                        </div>

                        {incident.injuries_sustained && (
                            <div className="bg-red-50 rounded-xl p-4">
                                <h4 className="text-sm font-medium text-red-800 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Injury Reported
                                </h4>
                            </div>
                        )}
                    </div>

                    {/* Status Actions */}
                    <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                            {incident.status !== 'under_review' && (
                                <button
                                    onClick={() => updateStatus('under_review')}
                                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
                                >
                                    Mark Under Review
                                </button>
                            )}
                            {incident.status !== 'investigating' && (
                                <button
                                    onClick={() => updateStatus('investigating')}
                                    className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition"
                                >
                                    Start Investigation
                                </button>
                            )}
                            {incident.status !== 'resolved' && (
                                <button
                                    onClick={() => updateStatus('resolved')}
                                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition"
                                >
                                    Mark Resolved
                                </button>
                            )}
                            {incident.status !== 'closed' && (
                                <button
                                    onClick={() => updateStatus('closed')}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Close
                                </button>
                            )}
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

function getSeverityBadge(severity: string) {
    switch (severity) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'major': return 'bg-orange-100 text-orange-800';
        case 'moderate': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-green-100 text-green-800';
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'reported': return 'bg-blue-100 text-blue-800';
        case 'under_review': return 'bg-yellow-100 text-yellow-800';
        case 'investigating': return 'bg-purple-100 text-purple-800';
        case 'resolved': return 'bg-green-100 text-green-800';
        case 'closed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
