import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Keep for staff lookup if generic service doesn't have it
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { visitService } from '../services/supabaseService';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Navigation, CheckCircle, Loader2, PlayCircle, StopCircle } from 'lucide-react';
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

            // Link based on user_id (most reliable)
            const { data, error } = await supabase
                .from('careflow_staff')
                .select('id')
                .eq('tenant_id', currentTenant.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setMyStaffId(data.id);
            } else {
                console.warn('No staff record found for user:', user.id);
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
            // Assuming getByDateRange supports staffId filtering now
            const data = await visitService.getByDateRange(dateStr, dateStr, myStaffId!);

            // Sort by start time client side just to be safe
            const sorted = data.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
            setVisits(sorted as any);
        } catch (error) {
            console.error('Error loading visits:', error);
            toast.error("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (e: React.MouseEvent, visit: Visit) => {
        e.stopPropagation();
        try {
            await visitService.updateStatus(visit.id, 'In Progress', 'actual_start');
            toast.success(`Checked in to ${visit.clientName}`);
            loadVisits();
        } catch (e) {
            toast.error("Failed to check in");
        }
    };

    const handleCheckOut = async (e: React.MouseEvent, visit: Visit) => {
        e.stopPropagation();
        try {
            await visitService.updateStatus(visit.id, 'Completed', 'actual_end');
            toast.success(`Completed visit with ${visit.clientName}`);
            loadVisits();
        } catch (e) {
            toast.error("Failed to check out");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200 shadow-md ring-1 ring-blue-200';
            case 'Missed': return 'bg-red-50 text-red-700 border-red-200';
            case 'Cancelled': return 'bg-gray-50 text-gray-500 border-gray-200';
            default: return 'bg-white border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-20">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Day</h1>
                        <p className="text-slate-500 text-sm font-medium">
                            {format(selectedDate, 'EEEE, d MMMM')}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
                    <button
                        onClick={() => setSelectedDate(d => subDays(d, 1))}
                        className="p-3 hover:bg-white rounded-lg transition-all active:scale-95 text-slate-600"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-slate-700">
                        {isToday(selectedDate) ? 'Today' : format(selectedDate, 'd MMM')}
                    </span>
                    <button
                        onClick={() => setSelectedDate(d => addDays(d, 1))}
                        className="p-3 hover:bg-white rounded-lg transition-all active:scale-95 text-slate-600"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                        <p className="text-sm font-medium">Loading schedule...</p>
                    </div>
                ) : !myStaffId ? (
                    <div className="text-center py-10 px-6 bg-white rounded-xl border border-dashed border-slate-300 mx-4">
                        <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Account Not Linked</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Your user account isn't linked to a staff profile. Please ask an admin to link your email in the Staff directory.
                        </p>
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-10 px-6">
                        <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No visits scheduled</h3>
                        <p className="text-slate-500 text-sm mt-1">You have no visits scheduled for this date.</p>
                    </div>
                ) : (
                    visits.map((visit, index) => {
                        const isNext = index === 0 || (visits[index - 1].status === 'Completed' && visit.status === 'Scheduled');

                        // Parse time for display (assuming HH:mm:ss format)
                        const startTimeDisp = visit.startTime.slice(0, 5);
                        const endTimeDisp = visit.endTime.slice(0, 5);

                        return (
                            <div
                                key={visit.id}
                                onClick={() => navigate(`/visit/${visit.id}`)} // Assumes we will build/have this route
                                className={`relative pl-6 pb-8 last:pb-0 border-l-2 ${isNext ? 'border-indigo-500' : 'border-slate-200'}`}
                            >
                                {/* Time Indicator Dot */}
                                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 shadow-sm z-10 ${visit.status === 'Completed' ? 'bg-green-500 border-green-500' :
                                        visit.status === 'In Progress' ? 'bg-blue-500 border-blue-500 animate-pulse' :
                                            isNext ? 'bg-indigo-600 border-indigo-600 ring-4 ring-indigo-50' :
                                                'bg-white border-slate-300'
                                    }`}></div>

                                <div className={`rounded-xl p-5 border transition-all active:scale-[0.98] cursor-pointer ${getStatusColor(visit.status)}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-extrabold text-lg text-slate-900 font-mono tracking-tight">
                                            {startTimeDisp} <span className="text-slate-400 font-sans font-normal text-sm mx-1">to</span> {endTimeDisp}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${visit.status === 'Scheduled' ? 'bg-slate-200 text-slate-600' :
                                                visit.status === 'In Progress' ? 'bg-blue-200 text-blue-800' : ''
                                            }`}>
                                            {visit.status}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-xl text-slate-900 mb-1 leading-tight">
                                        {visit.clientName}
                                    </h3>

                                    <div className="flex items-start gap-2 text-sm text-slate-600 mb-4 bg-white/50 p-2 rounded-lg backdrop-blur-sm">
                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                                        <span className="leading-snug">{visit.clientAddress || 'No address provided'}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{visit.visitType}</span>

                                        {visit.status === 'Scheduled' && (
                                            <button
                                                onClick={(e) => handleCheckIn(e, visit)}
                                                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 active:bg-indigo-700 transition-colors"
                                            >
                                                Check In <PlayCircle className="w-5 h-5" />
                                            </button>
                                        )}

                                        {visit.status === 'In Progress' && (
                                            <button
                                                onClick={(e) => handleCheckOut(e, visit)}
                                                className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-200 flex items-center gap-2 active:bg-green-700 transition-colors"
                                            >
                                                Check Out <StopCircle className="w-5 h-5" />
                                            </button>
                                        )}

                                        {visit.status === 'Completed' && (
                                            <span className="flex items-center gap-1.5 text-green-700 font-bold text-sm bg-green-100 px-3 py-1.5 rounded-lg">
                                                <CheckCircle className="w-4 h-4" /> Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
