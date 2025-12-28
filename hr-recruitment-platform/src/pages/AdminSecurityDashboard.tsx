
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, AlertTriangle, Users, Lock, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { log } from '@/lib/logger';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface SecurityEvent {
    id: string;
    event_type: string;
    event_category: 'authentication' | 'authorization' | 'session' | 'password' | 'suspicious';
    severity: 'info' | 'warning' | 'critical';
    description: string;
    email: string;
    ip_address: string;
    created_at: string;
}

interface DashboardStats {
    totalEvents: number;
    failedLogins: number;
    activeLockouts: number;
    suspiciousActivities: number;
}

export default function AdminSecurityDashboard() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalEvents: 0,
        failedLogins: 0,
        activeLockouts: 0,
        suspiciousActivities: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, [filter]);

    async function loadData() {
        setLoading(true);
        try {
            // Fetch recent events from security_audit_logs
            let query = supabase
                .from('security_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (filter !== 'all') {
                query = query.eq('severity', filter);
            }

            const { data: eventData, error } = await query;

            if (error) {
                log.error('Error fetching security audit logs', error, { component: 'AdminSecurityDashboard', action: 'loadData' });
                setEvents([]);
            } else {
                // Map the data to fit the SecurityEvent interface if field names differ
                const mappedEvents: SecurityEvent[] = (eventData || []).map(e => ({
                    id: e.id,
                    event_type: e.event_type || 'Unknown',
                    event_category: (e.details?.category || 'system') as any,
                    severity: (e.severity === 'low' ? 'info' : e.severity === 'medium' ? 'warning' : e.severity) as any,
                    description: e.details?.description || e.event_type || 'No description',
                    email: e.user_email || 'System',
                    ip_address: e.ip_address || '0.0.0.0',
                    created_at: e.created_at
                }));
                setEvents(mappedEvents);
            }

            // Fetch stats
            const { count: failedCount } = await supabase
                .from('login_attempts')
                .select('*', { count: 'exact', head: true })
                .eq('attempt_status', 'failed');

            const { count: lockoutCount } = await supabase
                .from('account_lockouts')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            const { count: totalCount } = await supabase
                .from('security_audit_logs')
                .select('*', { count: 'exact', head: true });

            // Suspicious activities could be high/critical severity events
            const { count: suspCount } = await supabase
                .from('security_audit_logs')
                .select('*', { count: 'exact', head: true })
                .in('severity', ['high', 'critical']);

            setStats({
                totalEvents: totalCount || 0,
                failedLogins: failedCount || 0,
                activeLockouts: lockoutCount || 0,
                suspiciousActivities: suspCount || 0
            });

        } catch (err) {
            log.error('Unexpected error loading dashboard', err, { component: 'AdminSecurityDashboard', action: 'loadData' });
        } finally {
            setLoading(false);
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    // Prepare Chart Data
    const eventTypeData = events.reduce((acc: any[], event) => {
        const existing = acc.find(item => item.name === event.event_category);
        if (existing) {
            existing.value++;
        } else {
            acc.push({ name: event.event_category, value: 1 });
        }
        return acc;
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
                    <p className="text-sm text-gray-500">Monitor system security and access logs</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Events</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalEvents}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Failed Logins</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.failedLogins}</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Lockouts</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.activeLockouts}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Lock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Suspicious Activity</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.suspiciousActivities}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Events List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Security Events</h2>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="text-sm border-none bg-gray-50 rounded-md focus:ring-0"
                            >
                                <option value="all">All Severities</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/IP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {events.length > 0 ? (
                                    events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 capitalize">
                                                    {event.event_type.replace(/_/g, ' ')}
                                                </div>
                                                <div className="text-xs text-gray-500">{event.event_category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{event.email || 'Unknown User'}</div>
                                                <div className="text-xs text-gray-500">{event.ip_address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                                                    {event.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            No security events found matching current filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Event Categories</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={eventTypeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {eventTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Security Tip</h3>
                        <p className="text-sm text-gray-500">
                            Review "Critical" events daily. High numbers of failed logins from unique IPs may indicate a targeted attack.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
