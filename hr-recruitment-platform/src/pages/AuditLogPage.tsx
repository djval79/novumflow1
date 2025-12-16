import React, { useState, useEffect } from 'react';
import { auditService, AuditLog, AuditSearchFilters } from '@/lib/services/AuditService';
import { useTenant } from '@/contexts/TenantContext';
import {
    History,
    Search,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    Plus,
    Calendar
} from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';

export default function AuditLogPage() {
    const { currentTenant } = useTenant();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AuditSearchFilters>({
        limit: 50
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadAuditLogs();
    }, [filters]);

    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.search(filters);
            setLogs(data);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />;
            case 'UPDATE': return <Edit className="w-4 h-4 text-blue-600" />;
            case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />;
            case 'VIEW': return <Eye className="w-4 h-4 text-gray-600" />;
            default: return <History className="w-4 h-4 text-gray-600" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'VIEW': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
                    <p className="text-gray-600 mt-1">Complete history of system actions and changes</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <ExportButton
                        data={logs}
                        filename="audit-logs"
                        title="Audit Logs Export"
                        columns={[
                            { key: 'created_at', label: 'Timestamp' },
                            { key: 'user_email', label: 'User' },
                            { key: 'action', label: 'Action' },
                            { key: 'entity_type', label: 'Entity Type' },
                            { key: 'entity_name', label: 'Entity Name' },
                            { key: 'ip_address', label: 'IP Address' },
                        ]}
                    />
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">Filter Audit Logs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action Type
                            </label>
                            <select
                                value={filters.action || ''}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="VIEW">View</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Entity Type
                            </label>
                            <select
                                value={filters.entity_type || ''}
                                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">All Types</option>
                                <option value="tenant">Tenant</option>
                                <option value="form">Form</option>
                                <option value="application">Application</option>
                                <option value="user">User</option>
                                <option value="dbs_check">DBS Check</option>
                                <option value="training">Training</option>
                                <option value="reference">Reference</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setFilters({ limit: 50 });
                                setShowFilters(false);
                            }}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading audit logs...</div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <History className="w-12 h-12 mb-2" />
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Action
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Entity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {log.user_email || 'System'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                {getActionIcon(log.action)}
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{log.entity_type}</div>
                                            <div className="text-xs text-gray-500">{log.entity_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 max-w-md truncate">
                                                {log.changes?.fields_changed?.join(', ') || 'No changes recorded'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Audit Log Details</h2>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                                    <p className="text-gray-900 mt-1">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">User</label>
                                    <p className="text-gray-900 mt-1">{selectedLog.user_email || 'System'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Action</label>
                                    <p className="text-gray-900 mt-1">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Entity Type</label>
                                    <p className="text-gray-900 mt-1">{selectedLog.entity_type}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Entity Name</label>
                                <p className="text-gray-900 mt-1">{selectedLog.entity_name}</p>
                            </div>

                            {selectedLog.changes && (
                                <div className="space-y-3">
                                    {selectedLog.changes.before && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Before</label>
                                            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                                                {JSON.stringify(selectedLog.changes.before, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {selectedLog.changes.after && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">After</label>
                                            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                                                {JSON.stringify(selectedLog.changes.after, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {selectedLog.changes.fields_changed && selectedLog.changes.fields_changed.length > 0 && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Fields Changed</label>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {selectedLog.changes.fields_changed.map((field, index) => (
                                                    <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded">
                                                        {field}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedLog.ip_address && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">IP Address</label>
                                    <p className="text-gray-900 mt-1">{selectedLog.ip_address}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
