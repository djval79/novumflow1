
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, X, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'critical';
    is_read: boolean;
    link?: string;
    created_at: string;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        subscribeToNotifications();
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const subscribeToNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const subscription = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Optional: Play sound or show toast
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleClick = (notif: Notification) => {
        if (!notif.is_read) markAsRead(notif.id);
        if (notif.link) {
            setIsOpen(false);
            navigate(notif.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical': return <AlertOctagon size={16} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => notifications.forEach(n => !n.is_read && markAsRead(n.id))}
                                    className="text-xs text-primary-600 font-medium hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleClick(notif)}
                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3
                                            ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="mt-1">{getIcon(notif.type)}</div>
                                        <div>
                                            <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(notif.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
