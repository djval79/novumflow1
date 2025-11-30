
import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Navigation, CheckCircle, Loader2 } from 'lucide-react';

interface Visit {
    id: string;
    client: { first_name: string; last_name: string; address: string; postcode: string };
    visit_date: string;
    start_time: string;
    end_time: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Missed' | 'Cancelled';
    visit_type: string;
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

            // Try to find employee record linked to this user
            const { data, error } = await supabase
                .from('employees')
                .select('id')
                .eq('tenant_id', currentTenant.id)
                .eq('email', user.email) // Assuming email match for now, or user_id if linked
                .maybeSingle();

            if (data) {
                setMyStaffId(data.id);
            } else {
                // Fallback: Check if user_id column exists and matches (if we added it)
                // For now, let's assume email match is the primary link
                console.warn('No employee record found for user:', user.email);
            }
        };
        fetchStaffId();
    }, [user, currentTenant]);

    // 2. Load Visits
    useEffect(() => {
        if (myStaffId && currentTenant) {
            loadVisits();
        } else if (!loading && !myStaffId) {
            // If we finished loading staff ID and found nothing, stop loading visits
            setLoading(false);
        }
    }, [selectedDate, myStaffId, currentTenant]);

    const loadVisits = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('visits')
                .select(`
                  id,
                  visit_date,
                  start_time,
                  end_time,
                  status,
                  visit_type,
                  client:clients (first_name, last_name, address, postcode)
                `)
                .eq('tenant_id', currentTenant!.id)
                .eq('staff_id', myStaffId) // Use the found staff ID
                .eq('visit_date', dateStr)
                .order('start_time', { ascending: true });

            if (error) throw error;
            setVisits(data as any || []);
        } catch (error) {
            console.error('Error loading visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Missed': return 'bg-red-100 text-red-700 border-red-200';
            case 'Cancelled': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-white border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Day</h1>
                        <p className="text-slate-500 text-sm">
                            {format(selectedDate, 'EEEE, d MMMM')}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1">
                    <button
                        onClick={() => setSelectedDate(d => subDays(d, 1))}
                        className="p-2 hover:bg-white rounded-md transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="font-semibold text-slate-700">
                        {isToday(selectedDate) ? 'Today' : format(selectedDate, 'd MMM')}
                    </span>
                    <button
                        onClick={() => setSelectedDate(d => addDays(d, 1))}
                        className="p-2 hover:bg-white rounded-md transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Loading schedule...</p>
                    </div>
                ) : !myStaffId ? (
                    <div className="text-center py-10">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Profile Not Linked</h3>
                        <p className="text-slate-500">Your user account is not linked to an employee profile.</p>
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No visits scheduled</h3>
                        <p className="text-slate-500">Enjoy your day off!</p>
                    </div>
                ) : (
                    visits.map((visit, index) => {
                        const isNext = index === 0 || (visits[index - 1].status === 'Completed' && visit.status === 'Scheduled');

                        return (
                            <div
                                key={visit.id}
                                onClick={() => navigate(`/visit/${visit.id}`)}
                                className={`relative pl-4 border-l-2 ${isNext ? 'border-indigo-500' : 'border-slate-200'} pb-6 last:pb-0`}
                            >
                                {/* Time Indicator */}
                                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 ${visit.status === 'Completed' ? 'bg-green-500 border-green-500' :
                                    isNext ? 'bg-indigo-500 border-indigo-500 ring-4 ring-indigo-100' :
                                        'bg-white border-slate-300'
                                    }`}></div>

                                <div className={`rounded-xl p-4 border shadow-sm transition-all active:scale-95 cursor-pointer ${getStatusColor(visit.status)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-lg">
                                            {visit.start_time.slice(0, 5)} - {visit.end_time.slice(0, 5)}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${visit.status === 'Scheduled' ? 'bg-slate-100 text-slate-600' : ''
                                            }`}>
                                            {visit.status}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-1">
                                        {visit.client.first_name} {visit.client.last_name}
                                    </h3>

                                    <div className="flex items-center gap-1 text-sm opacity-80 mb-3">
                                        <MapPin className="w-4 h-4" />
                                        {visit.client.address || 'No address provided'}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
                                        <span className="text-sm font-medium opacity-70">{visit.visit_type}</span>
                                        {visit.status === 'Scheduled' && (
                                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                                                Start Visit <Navigation className="w-4 h-4" />
                                            </button>
                                        )}
                                        {visit.status === 'Completed' && (
                                            <span className="flex items-center gap-1 text-green-700 font-bold text-sm">
                                                <CheckCircle className="w-4 h-4" /> Done
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
