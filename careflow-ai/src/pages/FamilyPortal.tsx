
import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, MessageSquare, FileHeart, Heart,
    Phone, MapPin, ChevronRight, Activity, Salad, Brain, Loader2, ShieldCheck, Zap, History, Target, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clientService, carePlanService, visitService } from '../services/supabaseService';
import { Client, ProgressLog } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MOCK_VITALS = [
    { time: '08:00', heartRate: 72, mood: 8 },
    { time: '10:00', heartRate: 75, mood: 9 },
    { time: '12:00', heartRate: 78, mood: 7 },
    { time: '14:00', heartRate: 74, mood: 8 },
    { time: '16:00', heartRate: 72, mood: 9 },
];

const FamilyPortal: React.FC = () => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<Client | null>(null);
    const [logs, setLogs] = useState<ProgressLog[]>([]);
    const [nextVisit, setNextVisit] = useState<any | null>(null);

    useEffect(() => {
        const loadFamilyData = async () => {
            setLoading(true);
            try {
                const clients = await clientService.getAll();
                if (clients.length > 0) {
                    const matchedClient = clients[0];
                    setClient(matchedClient);

                    const clientLogs = await carePlanService.getProgressLogs(matchedClient.id);
                    setLogs(clientLogs.slice(0, 3));

                    const upcoming = await visitService.getUpcoming(20);
                    const visit = upcoming.find((v: any) => v.clientId === matchedClient.id) || upcoming[0];
                    setNextVisit(visit);
                }
            } catch (error) {
                toast.error('Identity link failure');
            } finally {
                setLoading(false);
            }
        };
        loadFamilyData();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-8 bg-slate-50">
                <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Identity Link...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-8">
                <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
                    <ShieldCheck className="text-rose-600" size={48} />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Null Linked Identity</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">System failure: No authorized subject relation found for this account. Physical authorization manifest required.</p>
                </div>
                <button
                    onClick={() => toast.info('Initiating administrative support protocol')}
                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95"
                >
                    Contact Support Vector
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700 h-[calc(100vh-6.5rem)] overflow-y-auto pr-4 scrollbar-hide">
            {/* Mission Critical Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-6">
                        Family <span className="text-primary-600">Portal</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
                        Authorized Linkage System • Real-Time Vitals • Care Manifest for <span className="text-primary-600">{client.name}</span>
                    </p>
                </div>
                <div className="flex gap-6">
                    <Link
                        to="/messages"
                        onClick={() => toast.info('Initializing secure comms channel')}
                        className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl hover:border-primary-500 transition-all flex items-center gap-4 active:scale-95"
                    >
                        <MessageSquare size={18} className="text-primary-600" /> Dispatch Comms
                    </Link>
                    <button
                        onClick={() => toast.info('Accessing visit request scheduler')}
                        className="px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95"
                    >
                        <Calendar size={18} className="text-primary-400" /> Request Deployment
                    </button>
                </div>
            </div>

            {/* Subject Status Core */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 relative overflow-hidden rounded-[4rem] bg-slate-900 text-white shadow-2xl p-12 group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-60"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-start justify-between mb-12">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 rounded-[2.5rem] border-4 border-white/10 bg-white/5 flex items-center justify-center text-4xl font-black backdrop-blur-3xl shadow-2xl transition-transform group-hover:rotate-6">
                                    {client.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black uppercase tracking-tighter">{client.name}</h2>
                                    <div className="flex items-center gap-4 text-primary-400 text-[10px] font-black uppercase tracking-widestAlpha">
                                        <MapPin size={16} /> {client.address || 'Deployment Active'}
                                    </div>
                                </div>
                            </div>
                            <span className="px-6 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] backdrop-blur-md flex items-center gap-4 shadow-2xl">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.5)]"></div>
                                Safe Orbit
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Cardio Grid', val: '72', unit: 'bpm', icon: Heart, color: 'primary' },
                                { label: 'Activity Index', val: 'Optimum', icon: Activity, color: 'orange' },
                                { label: 'Psych Core', val: 'Cheerful', icon: Brain, color: 'indigo' },
                                { label: 'Metabolic', val: 'Sustained', icon: Salad, color: 'rose' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-inner group/stat hover:bg-white/10 transition-all">
                                    <div className={`flex items-center gap-3 text-${stat.color}-400 mb-4`}>
                                        <stat.icon size={20} />
                                        <span className="text-[8px] font-black uppercase tracking-widestAlpha opacity-60">{stat.label}</span>
                                    </div>
                                    <p className="text-xl font-black uppercase tracking-tighter flex items-baseline gap-2">
                                        {stat.val}
                                        {stat.unit && <span className="text-[10px] font-medium opacity-40 lowercase">{stat.unit}</span>}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Kinetic Signal Graph */}
                        <div className="mt-12 h-24 w-full opacity-30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MOCK_VITALS}>
                                    <defs>
                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="heartRate" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorHr)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Deployment Manifest Card */}
                <div className="bg-white rounded-[4.5rem] shadow-2xl border border-slate-100 p-10 flex flex-col justify-between group hover:border-primary-100 transition-all">
                    {nextVisit ? (
                        <>
                            <div className="space-y-10">
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-4">
                                        <Clock className="text-primary-600" size={24} />
                                        Imminent Entry
                                    </h3>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widestAlpha">AUTHORIZED CARE DEPLOYMENT PHASE</p>
                                </div>

                                <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4"><Zap className="text-primary-200" size={20} /></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <p className="font-black text-slate-900 text-2xl uppercase tracking-tighter">
                                            {format(new Date(nextVisit.date), 'EEE, MMM d')}
                                        </p>
                                        <span className="px-4 py-1.5 bg-primary-100 text-primary-700 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm">Confirmed</span>
                                    </div>
                                    <p className="text-xl font-black text-slate-700 mb-8 tabular-nums">
                                        {nextVisit.startTime.slice(0, 5)} <ArrowUpRight className="inline mx-2 text-primary-400" size={18} /> {nextVisit.endTime.slice(0, 5)}
                                    </p>
                                    <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-xl transition-transform group-hover:scale-110 border-4 border-slate-50">
                                            {(nextVisit.staffName || 'U')[0]}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{nextVisit.staffName || 'Care Lead'}</p>
                                            <p className="text-[9px] font-black text-primary-600 uppercase tracking-widestAlpha">Clinical Professional</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 px-4">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Vector</p>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="px-5 py-2 bg-white border-2 border-slate-50 rounded-xl text-[9px] font-black text-slate-800 uppercase tracking-widest shadow-sm hover:border-primary-100 transition-colors">{nextVisit.visitType}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-200 gap-6">
                            <Clock size={64} className="opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Null Upcoming Vector</p>
                        </div>
                    )}

                    <Link
                        to="/activities"
                        onClick={() => toast.info('Loading complete deployment schedule')}
                        className="w-full py-6 mt-10 flex items-center justify-center gap-4 text-[10px] font-black text-primary-600 hover:bg-primary-600 hover:text-white rounded-[2rem] transition-all border-2 border-primary-50 active:scale-95 uppercase tracking-[0.3em] shadow-sm hover:shadow-xl"
                    >
                        Full Ops Manifest <ChevronRight size={18} />
                    </Link>
                </div>
            </div>

            {/* Historical Log & Protocol Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="flex justify-between items-center mb-12 relative z-10">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] flex items-center gap-4">
                            <FileHeart className="text-primary-600" size={24} />
                            Status Manifest Log
                        </h3>
                        <Link to="/care-plans" className="text-[10px] font-black text-primary-600 uppercase tracking-widestAlpha hover:underline">Full History</Link>
                    </div>

                    <div className="relative pl-10 space-y-12">
                        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-50" />
                        {logs.length > 0 ? logs.map((log) => (
                            <div key={log.id} className="relative group/log">
                                <div className="absolute -left-[39px] top-1 w-6 h-6 rounded-xl bg-white border-4 border-slate-50 shadow-sm flex items-center justify-center transition-all group-hover/log:scale-125 group-hover/log:bg-primary-600 group-hover/log:border-primary-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900 group-hover/log:bg-white" />
                                </div>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3">{format(new Date(log.date), 'MMM d, yyyy')} • {log.category} TIER</p>
                                <p className="text-slate-900 text-base font-bold leading-relaxed uppercase tracking-tight opacity-80 group-hover/log:opacity-100 transition-opacity">"{log.note}"</p>
                            </div>
                        )) : (
                            <div className="p-12 text-center flex flex-col items-center gap-6">
                                <History size={48} className="text-slate-100" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Null Log Buffer</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-[4rem] shadow-2xl p-12 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl opacity-50" />
                    <div className="flex justify-between items-center mb-12 relative z-10">
                        <h3 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.5em] flex items-center gap-4">
                            <Phone className="text-primary-500" size={24} />
                            Command Protocols
                        </h3>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="flex items-center gap-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group/contact shadow-inner">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-2xl border-4 border-white/5 transition-transform group-hover/contact:scale-110">
                                CM
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-xl font-black uppercase tracking-tight">Care Architect</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Critical Change Authorizations</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="p-4 bg-white/10 rounded-2xl shadow-xl hover:bg-white hover:text-slate-900 transition-all active:scale-90">
                                    <Phone size={22} />
                                </button>
                                <button className="p-4 bg-white/10 rounded-2xl shadow-xl hover:bg-white hover:text-slate-900 transition-all active:scale-90">
                                    <MessageSquare size={22} />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 rounded-[3rem] border border-rose-500/20 bg-rose-500/5 relative overflow-hidden group/panic">
                            <div className="absolute top-0 right-0 p-6 opacity-20"><Target className="text-rose-500" size={32} /></div>
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-4">Emergency Vector</h4>
                            <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-tight leading-relaxed">System failure or clinical zero-day: Call Emergency Matrix immediately. Out-of-station support (24/7):</p>
                            <div className="flex items-center gap-6">
                                <p className="text-3xl font-black text-rose-600 tracking-tighter tabular-nums">0800 123 4567</p>
                                <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.42)] animate-pulse active:scale-90 cursor-pointer">
                                    <Phone size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyPortal;
