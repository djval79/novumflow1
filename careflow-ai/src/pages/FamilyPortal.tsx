import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, MessageSquare, FileHeart, Heart,
    Phone, MapPin, ChevronRight, Activity, Salad, Brain, Loader2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clientService, carePlanService, visitService } from '../services/supabaseService';
import { Client, ProgressLog } from '../types';
import { format } from 'date-fns';

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
                // 1. Fetch Clients (Simulate finding the linked relative)
                const clients = await clientService.getAll();
                if (clients.length > 0) {
                    const matchedClient = clients[0]; // Demo: Pick first one
                    setClient(matchedClient);

                    // 2. Fetch Progress Logs for this client
                    const clientLogs = await carePlanService.getProgressLogs(matchedClient.id);
                    setLogs(clientLogs.slice(0, 3));

                    // 3. Fetch Upcoming Visits (Frontend Filter as service is limited)
                    const upcoming = await visitService.getUpcoming(20);
                    // Find first visit for this client
                    const visit = upcoming.find((v: any) => v.clientId === matchedClient.id) || upcoming[0];
                    setNextVisit(visit);
                }
            } catch (error) {
                console.error("Failed to load family portal data", error);
            } finally {
                setLoading(false);
            }
        };
        loadFamilyData();
    }, []);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="text-slate-500 font-medium tracking-tight">Loading family dashboard...</p>
            </div>
        );
    }

    // Fallback if no client found
    if (!client) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">No Linked Client Found</h2>
                <p className="text-slate-500 mt-2">Please contact the care administration to link your account to a family member.</p>
                <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold">Contact Support</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Family Portal</h1>
                    <p className="text-slate-500">Welcome, {profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Family Member'}. Here is the latest update for <span className="font-semibold text-primary-600">{client.name}</span>.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/messages" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
                        <MessageSquare size={18} /> Contact Care Team
                    </Link>
                    <button className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center gap-2">
                        <Calendar size={18} /> Request Visit
                    </button>
                </div>
            </div>

            {/* Hero Status Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white shadow-2xl p-8">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-3xl font-bold backdrop-blur-md">
                                    {client.name.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{client.name}</h2>
                                    <div className="flex items-center gap-2 text-primary-200 text-sm">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {client.address || 'Address on file'}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                Safe & Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-primary-300 mb-2">
                                    <Heart size={16} /> Heart Rate
                                </div>
                                <p className="text-2xl font-bold">72 <span className="text-sm font-normal text-slate-400">bpm</span></p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-orange-300 mb-2">
                                    <Activity size={16} /> Activity
                                </div>
                                <p className="text-2xl font-bold">Good</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-purple-300 mb-2">
                                    <Brain size={16} /> Mood
                                </div>
                                <p className="text-2xl font-bold">Cheerful</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-emerald-300 mb-2">
                                    <Salad size={16} /> Lunch
                                </div>
                                <p className="text-lg font-bold truncate">Chicken Salad</p>
                            </div>
                        </div>

                        {/* Tiny Graph */}
                        <div className="mt-6 h-16 w-full opacity-50">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MOCK_VITALS}>
                                    <defs>
                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="heartRate" stroke="#fff" fillOpacity={1} fill="url(#colorHr)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Next Visit Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                    {nextVisit ? (
                        <>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <Clock className="text-primary-600" size={20} /> Next Visit
                                </h3>
                                <p className="text-slate-500 text-sm mb-6">Scheduled care visit details.</p>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-slate-900 text-lg">
                                            {format(new Date(nextVisit.date), 'EEE, MMM d')}
                                        </p>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Confirmed</span>
                                    </div>
                                    <p className="text-md font-bold text-slate-700 mb-3">
                                        {nextVisit.startTime.slice(0, 5)} - {nextVisit.endTime.slice(0, 5)}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                            {(nextVisit.staffName || 'U')[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{nextVisit.staffName || 'UnassignedCarer'}</p>
                                            <p className="text-xs text-slate-500">Care Professional</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visit Type</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-600 font-medium">{nextVisit.visitType}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Clock size={40} className="mb-2 opacity-50" />
                            <p>No upcoming visits scheduled</p>
                        </div>
                    )}

                    <Link to="/activities" className="w-full py-3 mt-6 flex items-center justify-center gap-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                        View Full Schedule <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Activity Feed & Care Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileHeart className="text-primary-600" size={20} />
                            Recent Care Logs
                        </h3>
                        <Link to="/care-plans" className="text-sm font-medium text-primary-600 hover:underline">View All</Link>
                    </div>

                    <div className="border-l-2 border-slate-100 pl-4 space-y-6">
                        {logs.length > 0 ? logs.map((log) => (
                            <div key={log.id} className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                                <p className="text-xs text-slate-400 font-medium mb-1">{format(new Date(log.date), 'MMM d, yyyy')} • {log.category}</p>
                                <p className="text-slate-800 text-sm leading-relaxed">{log.note}</p>
                            </div>
                        )) : (
                            <p className="text-slate-500 italic">No recent logs recorded.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Phone className="text-primary-600" size={20} />
                            Care Team Contacts
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-200">
                                CM
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">Care Manager</p>
                                <p className="text-xs text-slate-500">For urgent queries & plan changes</p>
                            </div>
                            <button className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 border border-slate-200 text-primary-600">
                                <Phone size={18} />
                            </button>
                            <button className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 border border-slate-200 text-primary-600">
                                <MessageSquare size={18} />
                            </button>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 bg-amber-50">
                            <h4 className="font-bold text-amber-900 text-sm mb-2">Emergency Information</h4>
                            <p className="text-xs text-amber-800 mb-2">In case of a medical emergency, please call 999 immediately. For urgent care issues out of hours, call our 24/7 line:</p>
                            <p className="text-lg font-bold text-amber-900">0800 123 4567</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyPortal;
