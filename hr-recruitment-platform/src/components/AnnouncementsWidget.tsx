import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    Megaphone, Pin, Calendar, User, ChevronRight,
    Plus, Edit2, Trash2, X, Check, AlertTriangle
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, formatDistanceToNow } from 'date-fns';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'urgent' | 'celebration';
    is_pinned: boolean;
    author_name: string;
    publish_date: string;
    expiry_date?: string;
    department?: string;
    read_by?: string[];
}

export default function AnnouncementsWidget() {
    const { currentTenant } = useTenant();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [filter, setFilter] = useState<'all' | 'pinned' | 'unread'>('all');

    useEffect(() => {
        loadAnnouncements();
    }, [currentTenant]);

    async function loadAnnouncements() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('is_pinned', { ascending: false })
                .order('publish_date', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error loading announcements:', error);
            setAnnouncements(generateMockAnnouncements());
        } finally {
            setLoading(false);
        }
    }

    function generateMockAnnouncements(): Announcement[] {
        return [
            {
                id: '1',
                title: '🎉 Company Holiday Party - December 20th!',
                content: 'Join us for our annual holiday celebration at the Grand Hall. There will be food, drinks, music, and a special surprise for everyone. Family members are welcome! RSVP by December 15th.',
                type: 'celebration',
                is_pinned: true,
                author_name: 'HR Team',
                publish_date: new Date().toISOString(),
                department: 'All',
            },
            {
                id: '2',
                title: '⚠️ System Maintenance - Saturday 2AM-6AM',
                content: 'The HR system will undergo scheduled maintenance this Saturday. During this time, the system will be unavailable. Please plan your tasks accordingly.',
                type: 'warning',
                is_pinned: true,
                author_name: 'IT Department',
                publish_date: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                id: '3',
                title: 'New Health & Safety Guidelines',
                content: 'Please review the updated health and safety guidelines posted on the intranet. All staff must complete the acknowledgment form by end of month.',
                type: 'info',
                is_pinned: false,
                author_name: 'Compliance Team',
                publish_date: new Date(Date.now() - 172800000).toISOString(),
            },
            {
                id: '4',
                title: '🚨 Urgent: Fire Drill Tomorrow at 10AM',
                content: 'A fire drill is scheduled for tomorrow at 10:00 AM. Please familiarize yourself with the evacuation routes and assembly points.',
                type: 'urgent',
                is_pinned: false,
                author_name: 'Facilities',
                publish_date: new Date(Date.now() - 259200000).toISOString(),
            },
            {
                id: '5',
                title: 'Welcome New Team Members!',
                content: 'Please join us in welcoming Sarah, Michael, and Emma who joined our team this week. Take a moment to say hello and help them feel at home!',
                type: 'info',
                is_pinned: false,
                author_name: 'HR Team',
                publish_date: new Date(Date.now() - 432000000).toISOString(),
            },
        ];
    }

    function getTypeStyles(type: Announcement['type']) {
        switch (type) {
            case 'urgent':
                return { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };
            case 'warning':
                return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
            case 'celebration':
                return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700' };
            default:
                return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' };
        }
    }

    function getTypeLabel(type: Announcement['type']) {
        return { urgent: 'Urgent', warning: 'Warning', celebration: 'Celebration', info: 'Info' }[type];
    }

    const filteredAnnouncements = announcements.filter(a => {
        if (filter === 'pinned') return a.is_pinned;
        if (filter === 'unread') return !a.read_by?.includes('current-user-id'); // Simplified
        return true;
    });

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-lg" />
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
                    <div className="flex items-center space-x-2">
                        <Megaphone className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900">Announcements</h2>
                        {announcements.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                                {announcements.length}
                            </span>
                        )}
                    </div>
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-3 flex space-x-2">
                    {(['all', 'pinned', 'unread'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs rounded-lg transition ${filter === f
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Announcements List */}
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {filteredAnnouncements.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Megaphone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No announcements</p>
                    </div>
                ) : (
                    filteredAnnouncements.map(announcement => {
                        const styles = getTypeStyles(announcement.type);
                        return (
                            <div
                                key={announcement.id}
                                onClick={() => setSelectedAnnouncement(announcement)}
                                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${announcement.is_pinned ? 'bg-gradient-to-r from-indigo-50/50 to-transparent' : ''
                                    }`}
                            >
                                <div className="flex items-start">
                                    <div className={`p-2 rounded-lg ${styles.bg} ${styles.icon} flex-shrink-0`}>
                                        {announcement.type === 'urgent' ? (
                                            <AlertTriangle className="w-4 h-4" />
                                        ) : (
                                            <Megaphone className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            {announcement.is_pinned && (
                                                <Pin className="w-3 h-3 text-indigo-500" />
                                            )}
                                            <span className={`px-2 py-0.5 text-xs rounded ${styles.badge}`}>
                                                {getTypeLabel(announcement.type)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                                            {announcement.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                            {announcement.content}
                                        </p>
                                        <div className="flex items-center mt-2 text-xs text-gray-400">
                                            <User className="w-3 h-3 mr-1" />
                                            <span>{announcement.author_name}</span>
                                            <span className="mx-2">•</span>
                                            <span>{formatDistanceToNow(parseISO(announcement.publish_date), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Announcement Detail Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className={`px-6 py-4 ${getTypeStyles(selectedAnnouncement.type).bg} border-b`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-0.5 text-xs rounded ${getTypeStyles(selectedAnnouncement.type).badge}`}>
                                        {getTypeLabel(selectedAnnouncement.type)}
                                    </span>
                                    {selectedAnnouncement.is_pinned && (
                                        <span className="flex items-center text-xs text-indigo-600">
                                            <Pin className="w-3 h-3 mr-1" />
                                            Pinned
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedAnnouncement(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mt-2">
                                {selectedAnnouncement.title}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {selectedAnnouncement.content}
                            </p>
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-500">
                                <User className="w-4 h-4 mr-1" />
                                <span>{selectedAnnouncement.author_name}</span>
                                <span className="mx-2">•</span>
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>{format(parseISO(selectedAnnouncement.publish_date), 'PPP')}</span>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            >
                                Close
                            </button>
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center">
                                <Check className="w-4 h-4 mr-1" />
                                Mark as Read
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
