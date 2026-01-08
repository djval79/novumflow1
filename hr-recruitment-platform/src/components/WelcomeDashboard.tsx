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
            <div className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                                {getTimeIcon()}
                            </div>
                            <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">{format(today, 'EEEE, MMMM d')}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-3 leading-tight">
                            {greeting}, <br className="sm:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">{displayName}</span>!
                            <Sparkles className="inline w-6 h-6 ml-2 text-yellow-300 animate-pulse" />
                        </h1>
                        <p className="text-indigo-200/80 max-w-lg text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-none">
                            "{quote.text}" — <span className="italic font-medium">{quote.author}</span>
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="p-1 rounded-full bg-white/20 backdrop-blur-md shadow-2xl">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/30 object-cover" />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white text-3xl font-black border-4 border-white/30">
                                    {getInitials(displayName)}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse" />
                    </div>
                </div>

                {/* Mini Week View - Now Scrollable on Mobile */}
                <div className="relative z-10 mt-8 sm:mt-10 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                    <div className="flex justify-between gap-2 min-w-[500px] sm:min-w-full">
                        {weekDays.map((day, i) => (
                            <div
                                key={i}
                                className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-2xl transition-all duration-300 ${isToday(day)
                                    ? 'bg-white text-indigo-700 shadow-xl scale-105'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isToday(day) ? 'text-indigo-600' : 'text-indigo-200'}`}>
                                    {format(day, 'EEE')}
                                </span>
                                <span className={`text-xl font-black ${isToday(day) ? 'text-indigo-900' : 'text-white'}`}>
                                    {format(day, 'd')}
                                </span>
                                {isToday(day) && <div className="mt-1 w-1 h-1 rounded-full bg-indigo-600" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tasks</p>
                            <p className="text-2xl font-black text-orange-600">{stats.pendingTasks}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meetings</p>
                            <p className="text-2xl font-black text-blue-600">{stats.upcomingMeetings}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Updates</p>
                            <p className="text-2xl font-black text-purple-600">{stats.unreadNotifications}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <Bell className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Done</p>
                            <p className="text-2xl font-black text-green-600">{stats.completedToday}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                            <Clock className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <h2 className="font-black text-gray-900 tracking-tight">Today's Schedule</h2>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(today, 'EEEE')}</span>
                </div>

                <div className="p-5">
                    {todayEvents.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-bold">No events scheduled for today</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={`flex items-center p-4 rounded-2xl border-l-4 transition-all hover:translate-x-1 ${getEventColor(event.type)}`}
                                >
                                    <div className="flex-shrink-0 w-20">
                                        <span className="text-sm font-black text-gray-900 tracking-tight">{event.time}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 px-2">
                                        <p className="text-sm font-bold text-gray-900 truncate">{event.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{event.type}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Clock In', icon: <Clock className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100', href: '/attendance' },
                    { label: 'Request Leave', icon: <Calendar className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100', href: '/hr' },
                    { label: 'My Documents', icon: <User className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100', href: '/documents' },
                    { label: 'View Payslip', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100', href: '/hr' },
                ].map((link, i) => (
                    <a
                        key={i}
                        href={link.href}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${link.color}`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/50 rounded-xl group-hover:scale-110 transition-transform">
                                {link.icon}
                            </div>
                            <span className="font-black tracking-tight text-sm">{link.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                ))}
            </div>
        </div>
    );
}
