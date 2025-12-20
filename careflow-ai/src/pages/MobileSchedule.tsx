
import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { visitService } from '../services/supabaseService';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Navigation, CheckCircle, Loader2, PlayCircle, StopCircle, UserCheck, ShieldCheck, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface Visit {
    id: string;
    clientName: string;
    clientAddress?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    visitType: string;
}

export default function MobileSchedule() {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [myStaffId, setMyStaffId] = useState<string | null>(null);

    // 1. Find my staff ID based on auth user ID
    useEffect(() => {
        const fetchStaffId = async () => {
            if (!user || !currentTenant) return;

            const { data, error } = await supabase
                .from('careflow_staff')
                .select('id')
                .eq('tenant_id', currentTenant.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setMyStaffId(data.id);
            } else {
                toast.error('Identity Mismatch', {
                    description: 'Could not synchronize your staff profile with this organization.'
                });
            }
        };
        fetchStaffId();
    }, [user, currentTenant]);

    // 2. Load Visits
    useEffect(() => {
        if (myStaffId && currentTenant) {
            loadVisits();
        } else if (!loading && !myStaffId) {
            setLoading(false);
        }
    }, [selectedDate, myStaffId, currentTenant]);

    const loadVisits = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const data = await visitService.getByDateRange(dateStr, dateStr, myStaffId!);
            const sorted = data.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
            setVisits(sorted as any);
        } catch (error) {
            toast.error("Failed to load clinical schedule");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (e: React.MouseEvent, visit: Visit) => {
        e.stopPropagation();
        const checkInToast = toast.loading('Initializing check-in sequence...');
        try {
            await visitService.updateStatus(visit.id, 'In Progress', 'actual_start');
            toast.success(`Check-in complete: ${visit.clientName}`, { id: checkInToast });
            loadVisits();
        } catch (e) {
            toast.error("Cloud synchronization failure", { id: checkInToast });
        }
    };

    const handleCheckOut = async (e: React.MouseEvent, visit: Visit) => {
        e.stopPropagation();
        const checkOutToast = toast.loading('Synchronizing end-of-visit data...');
        try {
            await visitService.updateStatus(visit.id, 'Completed', 'actual_end');
            toast.success(`Session finalized: ${visit.clientName}`, { id: checkOutToast });
            loadVisits();
        } catch (e) {
            toast.error("Check-out failure", { id: checkOutToast });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'In Progress': return 'bg-primary-50 text-primary-700 border-primary-200 shadow-[0_0_20px_rgba(59,130,246,0.1)] ring-2 ring-primary-100';
            case 'Missed': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'Cancelled': return 'bg-slate-50 text-slate-500 border-slate-200';
            default: return 'bg-white border-slate-100 shadow-sm';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-32 font-sans animate-in fade-in duration-700">
            {/* Premium Mobile Header */}
            <div className="bg-white px-8 pt-10 pb-8 shadow-2xl rounded-b-[3.5rem] sticky top-0 z-30 border-b border-slate-100">
                <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">My <span className="text-primary-600">Ops</span></h1>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                            {format(selectedDate, 'EEEE, d MMMM')}
                        </p>
                    </div>
                    <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl group active:scale-95 transition-all">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>

                {/* Date Selector Matrix */}
                <div className="flex items-center justify-between bg-slate-50 rounded-[2rem] p-2 border border-slate-100 shadow-inner">
                    <button
                        onClick={() => {
                            setSelectedDate(d => subDays(d, 1));
                            toast.info('Navigating to previous vector');
                        }}
                        className="p-5 hover:bg-white hover:shadow-xl rounded-[1.5rem] transition-all active:scale-90 text-slate-400 hover:text-slate-900"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Shift</span>
                        <span className="font-black text-slate-800 text-base mt-0.5 uppercase tracking-tight">
                            {isToday(selectedDate) ? 'Current Day' : format(selectedDate, 'd MMM')}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedDate(d => addDays(d, 1));
                            toast.info('Navigating to next vector');
                        }}
                        className="p-5 hover:bg-white hover:shadow-xl rounded-[1.5rem] transition-all active:scale-90 text-slate-400 hover:text-slate-900"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Timeline Terminal */}
            <div className="px-6 py-10 space-y-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-6">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Timeline...</p>
                    </div>
                ) : !myStaffId ? (
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-rose-100 text-center space-y-6">
                        <div className="h-24 w-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                            <ShieldCheck className="w-12 h-12 text-rose-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Denied</h3>
                        <p className="text-slate-500 font-bold text-sm tracking-tight px-4 leading-relaxed">
                            Your identity vector is not linked to a clinical profile. Please request organizational synchronization from an administrator.
                        </p>
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-20 px-10">
                        <div className="h-32 w-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner relative">
                            <Calendar className="w-16 h-16 text-slate-300" />
                            <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center">
                                <Activity size={12} className="text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Zero Activity</h3>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-2">No operational vectors detected for this epoch.</p>
                    </div>
                ) : (
                    visits.map((visit, index) => {
                        const isNext = index === 0 || (visits[index - 1].status === 'Completed' && visit.status === 'Scheduled');
                        const startTimeDisp = visit.startTime.slice(0, 5);
                        const endTimeDisp = visit.endTime.slice(0, 5);

                        return (
                            <div
                                key={visit.id}
                                onClick={() => navigate(`/visit/${visit.id}`)}
                                className={`relative pl-10 pb-12 last:pb-0 border-l-[3px] transition-all duration-1000 ${isNext ? 'border-primary-500' : 'border-slate-200'}`}
                            >
                                {/* Time Sequence Node */}
                                <div className={`absolute -left-[14px] top-6 h-6 w-6 rounded-full border-4 shadow-2xl z-10 transition-all duration-500 ${visit.status === 'Completed' ? 'bg-green-500 border-white' :
                                    visit.status === 'In Progress' ? 'bg-primary-500 border-white animate-pulse scale-125' :
                                        isNext ? 'bg-slate-900 border-white ring-8 ring-primary-50' :
                                            'bg-white border-slate-200'
                                    }`}></div>

                                <div className={`rounded-[3rem] p-8 border-2 transition-all active:scale-[0.95] cursor-pointer group shadow-xl ${getStatusColor(visit.status)} hover:shadow-2xl`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Vector</span>
                                            <span className="font-black text-xl text-slate-900 tracking-tighter tabular-nums flex items-center gap-2">
                                                {startTimeDisp} <span className="text-slate-300 font-bold text-xs">TO</span> {endTimeDisp}
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl border ${visit.status === 'Scheduled' ? 'bg-slate-900 text-white border-slate-900' :
                                                visit.status === 'In Progress' ? 'bg-primary-600 text-white border-primary-600 animate-pulse' :
                                                    'bg-white text-green-700 border-green-100'
                                            }`}>
                                            {visit.status}
                                        </span>
                                    </div>

                                    <h3 className="font-black text-3xl text-slate-900 mb-4 leading-none tracking-tight uppercase group-hover:text-primary-600 transition-colors">
                                        {visit.clientName}
                                    </h3>

                                    <div className="flex items-start gap-4 text-xs font-bold text-slate-500 mb-8 bg-black/5 p-4 rounded-[1.5rem] backdrop-blur-sm border border-white/20">
                                        <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary-500" />
                                        <span className="leading-relaxed tracking-tight">{visit.clientAddress || 'Location Undefined'}</span>
                                    </div>

                                    {/* Command Bar */}
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-black/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</span>
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-0.5">{visit.visitType}</span>
                                        </div>

                                        {visit.status === 'Scheduled' && (
                                            <button
                                                onClick={(e) => handleCheckIn(e, visit)}
                                                className="bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black flex items-center gap-3 active:scale-95 transition-all"
                                            >
                                                Initialize <Navigation className="w-4 h-4" />
                                            </button>
                                        )}

                                        {visit.status === 'In Progress' && (
                                            <button
                                                onClick={(e) => handleCheckOut(e, visit)}
                                                className="bg-rose-600 text-white px-8 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-rose-700 flex items-center gap-3 active:scale-95 transition-all"
                                            >
                                                Terminate <StopCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        {visit.status === 'Completed' && (
                                            <div className="flex items-center gap-2 px-6 py-4 bg-green-100 text-green-700 font-black text-[10px] uppercase tracking-widest rounded-2xl">
                                                <CheckCircle className="w-4 h-4" /> Finalized
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Status Feed */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-3xl border-t border-slate-100 z-40 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                <div className="max-w-md mx-auto flex justify-around items-center">
                    <div className="flex flex-col items-center gap-1 text-primary-600">
                        <Activity size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Ops</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                        <UserCheck size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Clients</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-slate-300">
                        <ShieldCheck size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Shield</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
