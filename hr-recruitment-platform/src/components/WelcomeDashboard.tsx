import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
    Sun, Moon, Sparkles, TrendingUp, Calendar, Clock,
    Bell, CheckCircle, AlertTriangle, ChevronRight, User
} from 'lucide-react';
import { format, parseISO, differenceInDays, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { getInitials } from '@/lib/utils';

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
        pendingTasks: 5,
        upcomingMeetings: 3,
        unreadNotifications: 7,
        completedToday: 2,
    });
    const [todayEvents, setTodayEvents] = useState<Array<{
        id: string;
        title: string;
        time: string;
        type: 'meeting' | 'interview' | 'deadline' | 'training';
    }>>([]);

    useEffect(() => {
        updateGreeting();
        loadQuote();
        loadTodayEvents();
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
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "Coming together is a beginning, staying together is progress, working together is success.", author: "Henry Ford" },
            { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
            { text: "The strength of the team is each individual member. The strength of each member is the team.", author: "Phil Jackson" },
        ];
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }

    function loadTodayEvents() {
        // Mock events
        setTodayEvents([
            { id: '1', title: 'Team Standup', time: '09:30', type: 'meeting' },
            { id: '2', title: 'Interview with Sarah J.', time: '11:00', type: 'interview' },
            { id: '3', title: 'Project deadline', time: '17:00', type: 'deadline' },
            { id: '4', title: 'Fire Safety Training', time: '14:00', type: 'training' },
        ]);
    }

    function getTimeIcon() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            return <Sun className="w-6 h-6 text-yellow-500" />;
        }
        return <Moon className="w-6 h-6 text-indigo-400" />;
    }

    function getEventColor(type: string) {
        switch (type) {
            case 'meeting': return 'border-blue-400 bg-blue-50';
            case 'interview': return 'border-purple-400 bg-purple-50';
            case 'deadline': return 'border-red-400 bg-red-50';
            case 'training': return 'border-green-400 bg-green-50';
            default: return 'border-gray-400 bg-gray-50';
        }
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
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            {getTimeIcon()}
                            <span className="text-indigo-200 text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">{displayName}</span>!
                            <Sparkles className="inline w-6 h-6 ml-2 text-yellow-300" />
                        </h1>
                        <p className="text-indigo-200 max-w-lg">
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
                            <span className="text-xs text-indigo-200">{format(day, 'EEE')}</span>
                            <span className={`text-lg font-semibold ${isToday(day) ? 'text-white' : 'text-indigo-200'}`}>
                                {format(day, 'd')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Tasks</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Meetings Today</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.upcomingMeetings}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Notifications</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.unreadNotifications}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Bell className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completed Today</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
                    </div>
                    <span className="text-sm text-gray-500">{format(today, 'EEEE')}</span>
                </div>

                <div className="p-4">
                    {todayEvents.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No events scheduled for today</p>
                    ) : (
                        <div className="space-y-3">
                            {todayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={`flex items-center p-3 rounded-lg border-l-4 ${getEventColor(event.type)}`}
                                >
                                    <div className="flex-shrink-0 w-16">
                                        <span className="text-sm font-semibold text-gray-900">{event.time}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                        <p className="text-xs text-gray-500 capitalize">{event.type}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Clock In', icon: <Clock className="w-5 h-5" />, color: 'bg-green-100 text-green-700 hover:bg-green-200', href: '/attendance' },
                    { label: 'Request Leave', icon: <Calendar className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', href: '/hr' },
                    { label: 'My Documents', icon: <User className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200', href: '/documents' },
                    { label: 'View Payslip', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200', href: '/hr' },
                ].map((link, i) => (
                    <a
                        key={i}
                        href={link.href}
                        className={`flex items-center justify-center space-x-2 p-4 rounded-xl transition ${link.color}`}
                    >
                        {link.icon}
                        <span className="font-medium">{link.label}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}
