
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import {
    Sun, Moon, Sparkles, Calendar, Clock,
    Bell, CheckCircle, AlertTriangle, ChevronRight, Users,
    FileHeart, Pill, Map, Heart, Zap, Target, History, ShieldAlert, Cpu, Globe
} from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';

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
        if (hour < 12) setGreeting('MORNING PROTOCOL');
        else if (hour < 17) setGreeting('AFTERNOON PROTOCOL');
        else setGreeting('EVENING PROTOCOL');
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
            { id: '1', clientName: 'MRS. THOMPSON', time: '09:00', type: 'personal_care', status: 'completed' },
            { id: '2', clientName: 'MR. WILLIAMS', time: '10:30', type: 'medication', status: 'completed' },
            { id: '3', clientName: 'MRS. JOHNSON', time: '14:00', type: 'personal_care', status: 'in_progress' },
            { id: '4', clientName: 'MR. DAVIES', time: '16:00', type: 'social', status: 'upcoming' },
            { id: '5', clientName: 'MRS. BROWN', time: '18:00', type: 'medication', status: 'upcoming' },
        ]);
    }

    function getTimeIcon() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) return <Sun className="w-8 h-8 text-amber-400 animate-pulse" />;
        return <Moon className="w-8 h-8 text-indigo-400 animate-pulse" />;
    }

    function getVisitTypeStyle(type: string) {
        switch (type) {
            case 'personal_care': return 'border-primary-500 bg-primary-900/5 text-primary-600';
            case 'medication': return 'border-emerald-500 bg-emerald-900/5 text-emerald-600';
            case 'social': return 'border-amber-500 bg-amber-900/5 text-amber-600';
            case 'medical': return 'border-rose-500 bg-rose-900/5 text-rose-600';
            default: return 'border-slate-300 bg-slate-50 text-slate-500';
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'completed': return <span className="px-6 py-2 text-[9px] font-black uppercase tracking-widest bg-emerald-900 text-emerald-400 rounded-xl border border-emerald-500/30">ARCHIVED</span>;
            case 'in_progress': return <span className="px-6 py-2 text-[9px] font-black uppercase tracking-widest bg-primary-900 text-primary-400 rounded-xl border border-primary-500/30 animate-pulse">ACTIVE NODE</span>;
            default: return <span className="px-6 py-2 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-slate-400 rounded-xl border border-slate-700">QUEUED</span>;
        }
    }

    const displayName = userName || profile?.full_name || user?.email?.split('@')[0] || 'OPERATOR';
    const today = new Date();
    const weekDays = eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Mission Critical Header */}
            <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-white/5 group">
                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-12">
                    <div className="space-y-8">
                        <div className="flex items-center space-x-6">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-2xl transition-transform group-hover:rotate-12">
                                {getTimeIcon()}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary-400 tabular-nums">
                                {format(today, 'EEEE • dd.MM.yyyy').toUpperCase()}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">
                                {greeting}, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">{displayName.toUpperCase()}</span>
                            </h1>
                            <div className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl w-fit">
                                <Sparkles size={20} className="text-primary-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
                                    "{quote.text.toUpperCase()}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-10">
                        <div className="relative group/avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="w-32 h-32 rounded-[2.5rem] border-8 border-white/10 shadow-2xl transition-transform group-hover/avatar:scale-110" />
                            ) : (
                                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-emerald-600 flex items-center justify-center text-white text-4xl font-black border-8 border-white/10 shadow-2xl transition-transform group-hover/avatar:scale-110">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-slate-900 shadow-2xl flex items-center justify-center">
                                <CheckCircle size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {weekDays.map((day, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl border-2 transition-all ${isToday(day) ? 'bg-primary-600 border-primary-400 shadow-[0_10px_30px_rgba(37,99,235,0.4)] scale-110' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                >
                                    <span className={`text-[9px] font-black uppercase mb-1 ${isToday(day) ? 'text-white' : 'text-slate-500'}`}>{format(day, 'EEE').toUpperCase()}</span>
                                    <span className={`text-xl font-black tabular-nums ${isToday(day) ? 'text-white' : 'text-slate-300'}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Visits Today', val: stats.visitsToday, icon: Target, color: 'text-primary-600', bg: 'bg-primary-900/10' },
                    { label: 'Pending Protocols', val: stats.pendingTasks, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-900/10' },
                    { label: 'Neural Comms', val: stats.unreadMessages, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-900/10' },
                    { label: 'Logic Hazards', val: stats.alertsCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-900/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-2xl hover:shadow-primary-600/10 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <stat.icon size={64} className={stat.color} />
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{stat.label}</p>
                                <p className={`text-5xl font-black tabular-nums tracking-tighter ${stat.color}`}>{stat.val}</p>
                            </div>
                            <div className={`p-6 rounded-[2rem] ${stat.bg} ${stat.color} shadow-inner`}>
                                <stat.icon size={28} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col xl:flex-row gap-10 items-stretch">
                {/* Deployment Matrix */}
                <div className="flex-1 bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-12 py-10 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-primary-900/5 text-primary-600 rounded-2xl">
                                <Calendar size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Today's Deployment Matrix</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha">Real-time Mission Manifest</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                toast.info('Navigating to Global Roster Spectrum');
                                window.location.hash = '#/rostering';
                            }}
                            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="p-12 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                        {todayVisits.length === 0 ? (
                            <div className="p-32 text-center text-slate-900 grayscale opacity-10 flex flex-col items-center gap-10">
                                <Globe size={80} />
                                <p className="font-black uppercase tracking-[0.8em] text-[18px]">Null Deployment Matrix</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {todayVisits.map(visit => (
                                    <div
                                        key={visit.id}
                                        className={`flex items-center p-8 rounded-[2.5rem] border-l-[12px] group transition-all hover:bg-slate-50 ${getVisitTypeStyle(visit.type)}`}
                                    >
                                        <div className="flex-shrink-0 w-24">
                                            <span className="text-xl font-black tabular-nums tracking-tighter">{visit.time}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 px-8">
                                            <p className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">{visit.clientName}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha mt-1">{visit.type.replace('_', ' ').toUpperCase()} MISSION</p>
                                        </div>
                                        {getStatusBadge(visit.status)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Transmission Bridge */}
                <div className="w-full xl:w-[400px] flex flex-col gap-6">
                    {[
                        { label: 'Dispatch Mission', desc: 'Roster Spectrum', icon: FileHeart, color: 'bg-primary-900 border-primary-500 text-primary-400', href: '/rostering' },
                        { label: 'Neural Pharmacy', desc: 'Medication Matrix', icon: Pill, color: 'bg-emerald-900 border-emerald-500 text-emerald-400', href: '/medication' },
                        { label: 'Geospatial Lens', desc: 'Route Optimization', icon: Map, color: 'bg-amber-900 border-amber-500 text-amber-400', href: '/routes' },
                        { label: 'Entity Registry', desc: 'People Matrix', icon: Users, color: 'bg-blue-900 border-blue-500 text-blue-400', href: '/people' },
                    ].map((link, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                toast.info(`Initializing Bridge: ${link.label.toUpperCase()}`);
                                window.location.hash = `#${link.href}`;
                            }}
                            className={`flex items-center justify-between p-10 rounded-[3rem] transition-all shadow-2xl hover:scale-[1.05] active:scale-95 border-b-8 relative overflow-hidden group/link ${link.color}`}
                        >
                            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="p-4 bg-white/10 rounded-2xl group-hover/link:rotate-12 transition-transform">
                                    <link.icon size={28} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-lg font-black uppercase tracking-widestAlpha leading-none">{link.label}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">{link.desc}</span>
                                </div>
                            </div>
                            <ChevronRight size={24} className="relative z-10 opacity-40 group-hover/link:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
