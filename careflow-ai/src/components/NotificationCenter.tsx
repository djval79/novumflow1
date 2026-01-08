import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import {
    Bell, X, Check, Clock, AlertTriangle,
    Info, Settings, Trash2,
    ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'task' | 'system';
    title: string;
    message: string;
    created_at: string;
    read: boolean;
    action_url?: string;
    metadata?: Record<string, any>;
}

export default function NotificationCenter() {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user) return;

        loadNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'careflow_notifications',
                filter: `recipient_id=eq.${user.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, currentTenant]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function loadNotifications() {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('careflow_notifications')
                .select('*')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.warn('NotificationCenter: Falling back to mocks', error);
            setNotifications(generateMockNotifications());
        } finally {
            setLoading(false);
        }
    }

    function generateMockNotifications(): Notification[] {
        const now = new Date();
        return [
            {
                id: '1',
                type: 'warning',
                title: 'DBS Check Expiring',
                message: 'Sarah Johnson\'s DBS check expires in 14 days.',
                created_at: new Date(now.getTime() - 1800000).toISOString(),
                read: false,
                action_url: '/people'
            }
        ];
    }

    async function markAsRead(id: string) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await supabase.from('careflow_notifications').update({ read: true }).eq('id', id);
        } catch (error) { }
    }

    async function markAllAsRead() {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await supabase.from('careflow_notifications').update({ read: true }).eq('recipient_id', user.id).eq('read', false);
            toast.success('All notifications marked as read');
        } catch (error) { }
    }

    async function deleteNotification(id: string) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await supabase.from('careflow_notifications').delete().eq('id', id);
        } catch (error) { }
    }

    function safeFormatDistance(dateStr: string) {
        try {
            if (!dateStr) return 'recently';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'recently';
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (e) {
            return 'recently';
        }
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'success': return <Check className="w-5 h-5 text-green-500" />;
            case 'task': return <Clock className="w-5 h-5 text-purple-500" />;
            case 'system': return <Settings className="w-5 h-5 text-slate-500" />;
            default: return <Info className="w-5 h-5 text-cyan-500" />;
        }
    }

    function getTypeBg(type: string) {
        switch (type) {
            case 'warning': return 'bg-amber-50';
            case 'error': return 'bg-red-50';
            case 'success': return 'bg-green-50';
            case 'task': return 'bg-purple-50';
            default: return 'bg-cyan-50';
        }
    }

    const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-430 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-left">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold">
                                        Mark all read
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs rounded-lg transition font-bold ${filter === 'all' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                                All
                            </button>
                            <button onClick={() => setFilter('unread')} className={`px-3 py-1 text-xs rounded-lg transition font-bold ${filter === 'unread' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                                Unread ({unreadCount})
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto" /></div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm font-medium">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredNotifications.map(notification => (
                                    <div key={notification.id} className={`p-4 hover:bg-slate-50 transition group ${!notification.read ? 'bg-cyan-50/50' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className={`p-2 rounded-lg ${getTypeBg(notification.type)}`}>{getTypeIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm ${!notification.read ? 'font-bold text-slate-900' : 'text-slate-700 font-medium'}`}>{notification.title}</p>
                                                    <button onClick={() => deleteNotification(notification.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 font-medium">{notification.message}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{safeFormatDistance(notification.created_at)}</span>
                                                    {!notification.read && <button onClick={() => markAsRead(notification.id)} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold">Mark read</button>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
