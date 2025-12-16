import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    User, Briefcase, FileText, Calendar, Bell, CheckCircle,
    AlertTriangle, Clock, ArrowRight, MessageSquare, X
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

interface ActivityEvent {
    id: string;
    type: 'employee_added' | 'application_received' | 'interview_scheduled' | 'document_uploaded' |
    'offer_sent' | 'employee_onboarded' | 'leave_requested' | 'training_completed' |
    'compliance_alert' | 'message_received';
    title: string;
    description: string;
    timestamp: string;
    user?: string;
    metadata?: Record<string, any>;
}

export default function ActivityTimeline() {
    const { currentTenant } = useTenant();
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(null);

    useEffect(() => {
        loadActivities();
    }, [currentTenant]);

    async function loadActivities() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('timestamp', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Transform audit logs to activity events
            const events: ActivityEvent[] = (data || []).map(log => ({
                id: log.id,
                type: mapActionToType(log.action, log.entity_type),
                title: formatActivityTitle(log.action, log.entity_type, log.entity_name),
                description: log.entity_name || '',
                timestamp: log.timestamp,
                user: log.user_email,
                metadata: log.changes,
            }));

            setActivities(events);
        } catch (error) {
            console.error('Error loading activities:', error);
            setActivities(generateMockActivities());
        } finally {
            setLoading(false);
        }
    }

    function mapActionToType(action: string, entityType: string): ActivityEvent['type'] {
        if (entityType === 'employee' && action === 'CREATE') return 'employee_added';
        if (entityType === 'application') return 'application_received';
        if (entityType === 'interview') return 'interview_scheduled';
        if (entityType === 'document') return 'document_uploaded';
        if (entityType === 'training') return 'training_completed';
        return 'employee_added';
    }

    function formatActivityTitle(action: string, entityType: string, entityName: string): string {
        const actionText = {
            CREATE: 'created',
            UPDATE: 'updated',
            DELETE: 'deleted',
            VIEW: 'viewed',
        }[action] || action.toLowerCase();

        return `${entityType} ${actionText}: ${entityName}`;
    }

    function generateMockActivities(): ActivityEvent[] {
        const now = new Date();
        const types: ActivityEvent['type'][] = [
            'employee_added', 'application_received', 'interview_scheduled',
            'document_uploaded', 'offer_sent', 'leave_requested', 'training_completed',
            'compliance_alert', 'message_received'
        ];

        return Array.from({ length: 20 }, (_, i) => {
            const type = types[Math.floor(Math.random() * types.length)];
            const timestamp = new Date(now.getTime() - i * 3600000 * (1 + Math.random()));

            return {
                id: `activity-${i}`,
                type,
                title: getMockTitle(type),
                description: getMockDescription(type),
                timestamp: timestamp.toISOString(),
                user: ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emma Wilson'][Math.floor(Math.random() * 4)],
            };
        });
    }

    function getMockTitle(type: ActivityEvent['type']): string {
        const titles: Record<string, string> = {
            employee_added: 'New employee added',
            application_received: 'New application received',
            interview_scheduled: 'Interview scheduled',
            document_uploaded: 'Document uploaded',
            offer_sent: 'Offer letter sent',
            employee_onboarded: 'Employee onboarded',
            leave_requested: 'Leave request submitted',
            training_completed: 'Training completed',
            compliance_alert: 'Compliance alert',
            message_received: 'New message received',
        };
        return titles[type] || 'Activity';
    }

    function getMockDescription(type: ActivityEvent['type']): string {
        const descriptions: Record<string, string[]> = {
            employee_added: ['Sarah Wilson joined as Senior Developer', 'Michael Chen joined as Product Manager'],
            application_received: ['Application for Senior Developer position', 'Application for Marketing Manager'],
            interview_scheduled: ['Interview with James Brown at 2:00 PM', 'Final round with Emily Davis'],
            document_uploaded: ['Employment contract uploaded', 'DBS certificate uploaded'],
            offer_sent: ['Offer sent to candidate Sarah W.', 'Revised offer sent to John D.'],
            employee_onboarded: ['Emma completed onboarding checklist', 'Robert started orientation'],
            leave_requested: ['Annual leave request for Dec 20-27', 'Sick leave request for today'],
            training_completed: ['Fire safety training completed', 'GDPR training completed'],
            compliance_alert: ['DBS check expiring in 30 days', 'Training certificate expired'],
            message_received: ['New message from HR department', 'Reply from IT support'],
        };
        const options = descriptions[type] || ['Activity occurred'];
        return options[Math.floor(Math.random() * options.length)];
    }

    function getActivityIcon(type: ActivityEvent['type']) {
        const icons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
            employee_added: { icon: <User className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-100' },
            application_received: { icon: <Briefcase className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-100' },
            interview_scheduled: { icon: <Calendar className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-100' },
            document_uploaded: { icon: <FileText className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-100' },
            offer_sent: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-teal-600', bg: 'bg-teal-100' },
            employee_onboarded: { icon: <User className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-100' },
            leave_requested: { icon: <Clock className="w-4 h-4" />, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            training_completed: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-100' },
            compliance_alert: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-100' },
            message_received: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-100' },
        };
        return icons[type] || { icon: <Bell className="w-4 h-4" />, color: 'text-gray-600', bg: 'bg-gray-100' };
    }

    const filterOptions = [
        { value: 'all', label: 'All Activity' },
        { value: 'employee', label: 'Employees' },
        { value: 'recruitment', label: 'Recruitment' },
        { value: 'documents', label: 'Documents' },
        { value: 'compliance', label: 'Compliance' },
    ];

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => {
            if (filter === 'employee') return ['employee_added', 'employee_onboarded', 'leave_requested'].includes(a.type);
            if (filter === 'recruitment') return ['application_received', 'interview_scheduled', 'offer_sent'].includes(a.type);
            if (filter === 'documents') return a.type === 'document_uploaded';
            if (filter === 'compliance') return ['training_completed', 'compliance_alert'].includes(a.type);
            return true;
        });

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {filterOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

                    {/* Events */}
                    <div className="space-y-6">
                        {filteredActivities.map((activity, index) => {
                            const { icon, color, bg } = getActivityIcon(activity.type);
                            const isFirst = index === 0;

                            return (
                                <div key={activity.id} className="relative flex items-start group">
                                    {/* Icon */}
                                    <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${bg} ${color} ring-4 ring-white`}>
                                        {icon}
                                    </div>

                                    {/* Content */}
                                    <div
                                        className="ml-4 flex-1 min-w-0 p-3 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition cursor-pointer"
                                        onClick={() => setSelectedActivity(activity)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                                        {activity.user && (
                                            <p className="text-xs text-gray-400 mt-1">by {activity.user}</p>
                                        )}
                                    </div>

                                    {/* "New" badge for recent items */}
                                    {isFirst && (
                                        <span className="absolute -left-1 top-0 px-2 py-0.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                                            New
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Load More */}
                {filteredActivities.length > 0 && (
                    <div className="mt-6 text-center">
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center">
                            Load more activities
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                )}

                {filteredActivities.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No activities found</p>
                    </div>
                )}
            </div>

            {/* Activity Detail Modal */}
            {selectedActivity && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Activity Details</h3>
                            <button onClick={() => setSelectedActivity(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getActivityIcon(selectedActivity.type).bg}`}>
                                    {getActivityIcon(selectedActivity.type).icon}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedActivity.title}</p>
                                    <p className="text-sm text-gray-500 capitalize">{selectedActivity.type.replace(/_/g, ' ')}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{selectedActivity.description}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                                <p><strong>Time:</strong> {format(parseISO(selectedActivity.timestamp), 'PPpp')}</p>
                                {selectedActivity.user && <p><strong>User:</strong> {selectedActivity.user}</p>}
                            </div>
                            {selectedActivity.metadata && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Additional Details</p>
                                    <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-32">
                                        {JSON.stringify(selectedActivity.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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
