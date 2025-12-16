import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import {
    Sun, Moon, Sparkles, Calendar, Clock,
    Bell, CheckCircle, AlertTriangle, ChevronRight, Users,
    FileHeart, Pill, Map, Heart
} from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface WelcomeDashboardProps {
    userName?: string;
    avatarUrl?: string;
}

export default function WelcomeDashboard({ userName, avatarUrl }: WelcomeDashboardProps) {
    const { user, profile } = useAuth();
    const { currentTenant } = useTenant();
    const [greeting, setGreeting] = useState('');
    const [quote, setQuote] = useState({ text: '', author: '' });
    const [stats, setStats] = useState({
        visitsToday: 8,
        pendingTasks: 3,
        unreadMessages: 5,
        alertsCount: 2,
    });
    const [todayVisits, setTodayVisits] = useState<Array<{
        id: string;
        clientName: string;
        time: string;
        type: 'personal_care' | 'medication' | 'social' | 'medical';
        status: 'upcoming' | 'in_progress' | 'completed';
    }>>([]);

    useEffect(() => {
        updateGreeting();
        loadQuote();
        loadTodayVisits();
    }, []);

    function updateGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good morning');
        } else if (hour < 17) {
            setGreeting('Good afternoon');
        } else {
            setGreeting('Good evening');
        }
    }

    function loadQuote() {
        const quotes = [
            { text: "Caring is the essence of nursing.", author: "Jean Watson" },
            { text: "To care for those who once cared for us is one of the highest honours.", author: "Tia Walker" },
            { text: "The simple act of caring is heroic.", author: "Edward Albert" },
            { text: "Too often we underestimate the power of a touch, a smile, a kind word.", author: "Leo Buscaglia" },
            { text: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain" },
        ];
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }

    function loadTodayVisits() {
        setTodayVisits([
            { id: '1', clientName: 'Mrs. Thompson', time: '09:00', type: 'personal_care', status: 'completed' },
            { id: '2', clientName: 'Mr. Williams', time: '10:30', type: 'medication', status: 'completed' },
            { id: '3', clientName: 'Mrs. Johnson', time: '14:00', type: 'personal_care', status: 'in_progress' },
            { id: '4', clientName: 'Mr. Davies', time: '16:00', type: 'social', status: 'upcoming' },
            { id: '5', clientName: 'Mrs. Brown', time: '18:00', type: 'medication', status: 'upcoming' },
        ]);
    }

    function getTimeIcon() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            return <Sun className="w-6 h-6 text-amber-400" />;
        }
        return <Moon className="w-6 h-6 text-indigo-400" />;
    }

    function getVisitTypeColor(type: string) {
        switch (type) {
            case 'personal_care': return 'border-cyan-400 bg-cyan-50';
            case 'medication': return 'border-purple-400 bg-purple-50';
            case 'social': return 'border-green-400 bg-green-50';
            case 'medical': return 'border-red-400 bg-red-50';
            default: return 'border-slate-400 bg-slate-50';
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'completed': return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Done</span>;
            case 'in_progress': return <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full animate-pulse">In Progress</span>;
            default: return <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">Upcoming</span>;
        }
    }

    function getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    const displayName = userName || profile?.full_name || user?.email?.split('@')[0] || 'there';
    const today = new Date();
    const weekDays = eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
    });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            {getTimeIcon()}
                            <span className="text-cyan-100 text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">{displayName}</span>!
                            <Heart className="inline w-6 h-6 ml-2 text-pink-300 fill-pink-300" />
                        </h1>
                        <p className="text-cyan-100 max-w-lg text-sm">
                            "{quote.text}" — <span className="italic">{quote.author}</span>
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full border-4 border-white/30" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold border-4 border-white/30">
                                {getInitials(displayName)}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                </div>

                {/* Mini Week View */}
                <div className="relative z-10 mt-6 flex justify-between">
                    {weekDays.map((day, i) => (
                        <div
                            key={i}
                            className={`flex flex-col items-center px-3 py-2 rounded-lg ${isToday(day) ? 'bg-white/20' : ''
                                }`}
                        >
                            <span className="text-xs text-cyan-200">{format(day, 'EEE')}</span>
                            <span className={`text-lg font-semibold ${isToday(day) ? 'text-white' : 'text-cyan-200'}`}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Visits Today</p>
                            <p className="text-2xl font-bold text-cyan-600">{stats.visitsToday}</p>
                        </div>
                        <div className="p-3 bg-cyan-100 rounded-lg">
                            <FileHeart className="w-5 h-5 text-cyan-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Pending Tasks</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Messages</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.unreadMessages}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Alerts</p>
                            <p className="text-2xl font-bold text-red-600">{stats.alertsCount}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Visits */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FileHeart className="w-5 h-5 text-cyan-600" />
                        <h2 className="font-semibold text-slate-900">Today's Visits</h2>
                    </div>
                    <a href="#/rostering" className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                    </a>
                </div>

                <div className="p-4">
                    {todayVisits.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No visits scheduled for today</p>
                    ) : (
                        <div className="space-y-3">
                            {todayVisits.map(visit => (
                                <div
                                    key={visit.id}
                                    className={`flex items-center p-3 rounded-lg border-l-4 ${getVisitTypeColor(visit.type)}`}
                                >
                                    <div className="flex-shrink-0 w-16">
                                        <span className="text-sm font-semibold text-slate-900">{visit.time}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900">{visit.clientName}</p>
                                        <p className="text-xs text-slate-500 capitalize">{visit.type.replace('_', ' ')}</p>
                                    </div>
                                    {getStatusBadge(visit.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Start Visit', icon: <FileHeart className="w-5 h-5" />, color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200', href: '/rostering' },
                    { label: 'Medications', icon: <Pill className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200', href: '/medication' },
                    { label: 'View Map', icon: <Map className="w-5 h-5" />, color: 'bg-green-100 text-green-700 hover:bg-green-200', href: '/routes' },
                    { label: 'My Clients', icon: <Users className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', href: '/people' },
                ].map((link, i) => (
                    <a
                        key={i}
                        href={`#${link.href}`}
                        className={`flex items-center justify-center space-x-2 p-4 rounded-xl transition shadow-sm ${link.color}`}
                    >
                        {link.icon}
                        <span className="font-medium">{link.label}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}
