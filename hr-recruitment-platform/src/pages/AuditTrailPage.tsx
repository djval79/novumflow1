import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    History,
    Search,
    Filter,
    User,
    Clock,
    FileText,
    Edit,
    Trash2,
    Plus,
    Eye,
    Download,
    Shield,
    AlertTriangle,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AuditLog {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    old_values: Record<string, any>;
    new_values: Record<string, any>;
    changes: Record<string, any>;
    description: string;
    severity: string;
    is_sensitive: boolean;
    created_at: string;
}

interface LoginEvent {
    id: string;
    user_id: string;
    event_type: string;
    ip_address: string;
    device_type: string;
    browser: string;
    os: string;
    is_suspicious: boolean;
    created_at: string;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    export: Download
};

const ENTITY_LABELS: Record<string, string> = {
    employees: 'Employee',
    clients: 'Client',
    incidents: 'Incident',
    expense_claims: 'Expense Claim',
    care_visits: 'Care Visit',
    shift_assignments: 'Shift',
    documents: 'Document',
    users_profiles: 'User Profile'
};

export default function AuditTrailPage() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'logins'>('activity');
    const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);

    // Stats
    const [stats, setStats] = useState({
        today: 0,
        thisWeek: 0,
        criticalCount: 0
    });

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant]);

    async function loadData() {
        setLoading(true);
        await Promise.all([loadAuditLogs(), loadLoginEvents()]);
        setLoading(false);
    }

    async function loadAuditLogs() {
        if (!currentTenant) return;

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('created_at', { ascending: false })
            .limit(500);

        if (data) {
            setLogs(data);

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            setStats({
                today: data.filter(l => new Date(l.created_at) >= today).length,
                thisWeek: data.filter(l => new Date(l.created_at) >= weekAgo).length,
                criticalCount: data.filter(l => l.severity === 'critical').length
            });
        }
    }

    async function loadLoginEvents() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('login_history')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .order('created_at', { ascending: false })
            .limit(100);

        setLoginEvents(data || []);
    }

    function getActionIcon(action: string) {
        return ACTION_ICONS[action] || FileText;
    }

    function getActionColor(action: string) {
        switch (action) {
            case 'create': return 'bg-green-100 text-green-600';
            case 'update': return 'bg-blue-100 text-blue-600';
            case 'delete': return 'bg-red-100 text-red-600';
            case 'view': return 'bg-gray-100 text-gray-600';
            case 'export': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    function getSeverityBadge(severity: string) {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch = `${log.user_email || ''} ${log.entity_name || ''} ${log.description || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesAction = filterAction === 'all' || log.action === filterAction;
        const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
        return matchesSearch && matchesAction && matchesEntity;
    });

    const entityTypes = [...new Set(logs.map(l => l.entity_type))];

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
                    <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl">
                        <History className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
                        <p className="text-sm text-gray-500">Track all system activity and changes</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Today's Activity</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.today}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">This Week</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.thisWeek}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Critical Events</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{stats.criticalCount}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center ${activeTab === 'activity'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <History className="w-4 h-4 mr-2" />
                    Activity Log
                </button>
                <button
                    onClick={() => setActiveTab('logins')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center ${activeTab === 'logins'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Shield className="w-4 h-4 mr-2" />
                    Login History
                </button>
            </div>

            {activeTab === 'activity' && (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search activity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Actions</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="view">View</option>
                                <option value="export">Export</option>
                            </select>
                            <select
                                value={filterEntity}
                                onChange={(e) => setFilterEntity(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Entities</option>
                                {entityTypes.map(et => (
                                    <option key={et} value={et}>{ENTITY_LABELS[et] || et}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-xl border border-gray-200">
                        {filteredLogs.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {filteredLogs.slice(0, 50).map((log) => {
                                    const ActionIcon = getActionIcon(log.action);
                                    return (
                                        <div
                                            key={log.id}
                                            onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                                            className="p-4 hover:bg-gray-50 cursor-pointer transition"
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                                                    <ActionIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="font-medium text-gray-900 capitalize">{log.action}</span>
                                                        <span className="text-gray-500">
                                                            {ENTITY_LABELS[log.entity_type] || log.entity_type}
                                                        </span>
                                                        {log.entity_name && (
                                                            <span className="text-gray-700 font-medium truncate">"{log.entity_name}"</span>
                                                        )}
                                                        {log.severity !== 'info' && (
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadge(log.severity)}`}>
                                                                {log.severity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span className="flex items-center">
                                                            <User className="w-3 h-3 mr-1" />
                                                            {log.user_name || log.user_email || 'System'}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>

                                                    {/* Expanded Details */}
                                                    {selectedLog?.id === log.id && log.changes && Object.keys(log.changes).length > 0 && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Changes Made</h4>
                                                            <div className="space-y-2">
                                                                {Object.entries(log.changes).map(([key, value]) => (
                                                                    <div key={key} className="flex text-sm">
                                                                        <span className="text-gray-500 w-32 flex-shrink-0">{key}:</span>
                                                                        <span className="text-gray-900">
                                                                            {log.old_values?.[key] && (
                                                                                <span className="text-red-500 line-through mr-2">
                                                                                    {String(log.old_values[key])}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-green-600">{String(value)}</span>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm text-gray-400">
                                                        {format(new Date(log.created_at), 'HH:mm')}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {format(new Date(log.created_at), 'dd MMM')}
                                                    </p>
                                                </div>
                                                <ChevronRight className={`w-5 h-5 text-gray-300 transition ${selectedLog?.id === log.id ? 'rotate-90' : ''}`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Found</h3>
                                <p className="text-gray-500">No audit logs match your current filters.</p>
                            </div>
                        )}
                    </div>

                    {filteredLogs.length > 50 && (
                        <p className="text-center text-gray-500 text-sm">
                            Showing 50 of {filteredLogs.length} results. Use filters to narrow down.
                        </p>
                    )}
                </>
            )}

            {activeTab === 'logins' && (
                <div className="bg-white rounded-xl border border-gray-200">
                    {loginEvents.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {loginEvents.map((event) => (
                                <div key={event.id} className="p-4 flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${event.event_type === 'login_success' ? 'bg-green-100 text-green-600' :
                                            event.event_type === 'login_failed' ? 'bg-red-100 text-red-600' :
                                                event.event_type === 'logout' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-blue-100 text-blue-600'
                                        }`}>
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {event.event_type.replace(/_/g, ' ')}
                                            {event.is_suspicious && (
                                                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                                    Suspicious
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            {event.ip_address && <span>IP: {event.ip_address}</span>}
                                            {event.device_type && <span>{event.device_type}</span>}
                                            {event.browser && <span>{event.browser}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-400">
                                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Login History</h3>
                            <p className="text-gray-500">Login events will appear here once users sign in.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
