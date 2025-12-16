import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { Bell, X, Check, Clock, AlertTriangle, Users, FileText, Calendar, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    entity_type?: string;
    entity_id?: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
}

export default function NotificationCenter() {
    const { currentTenant } = useTenant();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            loadNotifications();
            subscribeToNotifications();
        }
    }, [currentTenant]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.is_read).length);
    }, [notifications]);

    async function loadNotifications() {
        if (!currentTenant) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('tenant_id', currentTenant.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Fallback to generated notifications if table doesn't exist
            generateMockNotifications();
        } finally {
            setLoading(false);
        }
    }

    function generateMockNotifications() {
        // Generate realistic notifications based on app activity
        const mockNotifications: Notification[] = [
            {
                id: '1',
                type: 'info',
                title: 'New Application Received',
                message: 'John Smith applied for Senior Developer position',
                entity_type: 'application',
                is_read: false,
                created_at: new Date(Date.now() - 5 * 60000).toISOString(),
                action_url: '/recruit'
            },
            {
                id: '2',
                type: 'warning',
                title: 'Document Expiring Soon',
                message: 'DBS check for Sarah Johnson expires in 7 days',
                entity_type: 'compliance',
                is_read: false,
                created_at: new Date(Date.now() - 30 * 60000).toISOString(),
                action_url: '/compliance-hub'
            },
            {
                id: '3',
                type: 'success',
                title: 'Interview Scheduled',
                message: 'Technical interview confirmed for tomorrow at 2pm',
                entity_type: 'interview',
                is_read: true,
                created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
                action_url: '/recruit'
            },
            {
                id: '4',
                type: 'info',
                title: 'Leave Request Pending',
                message: 'Mark Wilson requested 5 days annual leave',
                entity_type: 'leave',
                is_read: true,
                created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
                action_url: '/hr'
            },
            {
                id: '5',
                type: 'success',
                title: 'Training Completed',
                message: 'Fire Safety training marked as complete',
                entity_type: 'training',
                is_read: true,
                created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
                action_url: '/compliance-hub'
            }
        ];
        setNotifications(mockNotifications);
    }

    function subscribeToNotifications() {
        if (!currentTenant) return;

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `tenant_id=eq.${currentTenant.id}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                    // Play notification sound
                    playNotificationSound();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    function playNotificationSound() {
        // Simple notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 440;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => oscillator.stop(), 150);
        } catch (e) {
            // Audio not supported
        }
    }

    async function markAsRead(id: string) {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
        } catch (error) {
            // Ignore if table doesn't exist
        }
    }

    async function markAllAsRead() {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('tenant_id', currentTenant?.id);
        } catch (error) {
            // Ignore if table doesn't exist
        }
    }

    async function deleteNotification(id: string) {
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', id);
        } catch (error) {
            // Ignore if table doesn't exist
        }
    }

    function getIcon(type: string, entityType?: string) {
        if (entityType === 'application') return <Users className="w-4 h-4" />;
        if (entityType === 'compliance' || entityType === 'training') return <FileText className="w-4 h-4" />;
        if (entityType === 'interview') return <Calendar className="w-4 h-4" />;
        if (entityType === 'leave') return <Briefcase className="w-4 h-4" />;

        switch (type) {
            case 'warning': return <AlertTriangle className="w-4 h-4" />;
            case 'success': return <Check className="w-4 h-4" />;
            case 'error': return <AlertTriangle className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    }

    function getTypeColor(type: string) {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-600';
            case 'warning': return 'bg-orange-100 text-orange-600';
            case 'error': return 'bg-red-100 text-red-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    }

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <div className="flex items-center space-x-2">
                                <Bell className="w-5 h-5" />
                                <span className="font-semibold">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-white/80 hover:text-white transition"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/20 rounded transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">
                                    <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition cursor-pointer ${!notification.is_read ? 'bg-indigo-50/50' : ''
                                                }`}
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                if (notification.action_url) {
                                                    window.location.href = notification.action_url;
                                                    setIsOpen(false);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                                                    {getIcon(notification.type, notification.entity_type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''
                                                            }`}>
                                                            {notification.title}
                                                        </p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-red-500 transition"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center mt-1 text-xs text-gray-400">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                    </div>
                                                </div>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Navigate to full notifications page if exists
                                    }}
                                    className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
