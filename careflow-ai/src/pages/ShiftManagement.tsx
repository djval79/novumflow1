
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, User, Clock, ShieldCheck, Activity, Search, Filter, Download, Loader2 } from 'lucide-react';
import CreateShiftModal from '@/components/CreateShiftModal';
import { toast } from 'sonner';

interface Shift {
    id: string;
    client_id: string;
    staff_id: string | null;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    client: { name: string };
    staff: { first_name: string; last_name: string } | null;
}

export default function ShiftManagement() {
    const { currentTenant } = useTenant();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Calculate week start (Monday)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const fetchShifts = async () => {
        if (!currentTenant) return;
        setLoading(true);

        const startDate = format(weekStart, 'yyyy-MM-dd');
        const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

        try {
            const { data, error } = await supabase
                .from('careflow_visits')
                .select(`
                    id,
                    client_id,
                    staff_id,
                    scheduled_date,
                    scheduled_start,
                    scheduled_end,
                    status,
                    client:careflow_clients(name),
                    staff:careflow_staff(full_name)
                `)
                .eq('tenant_id', currentTenant.id)
                .gte('scheduled_date', startDate)
                .lte('scheduled_date', endDate);

            if (error) throw error;

            const mappedShifts = (data as any || []).map((s: any) => ({
                id: s.id,
                client_id: s.client_id,
                staff_id: s.staff_id,
                date: s.scheduled_date || '',
                start_time: s.scheduled_start || '',
                end_time: s.scheduled_end || '',
                status: s.status,
                client: s.client || { name: 'Unknown' },
                staff: s.staff ? {
                    first_name: s.staff.full_name?.split(' ')[0] || '',
                    last_name: s.staff.full_name?.split(' ').slice(1).join(' ') || ''
                } : null
            }));

            setShifts(mappedShifts);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Schedule synchronization failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, [currentTenant, currentDate]);

    const getShiftsForDay = (date: Date) => {
        return shifts.filter(shift => {
            if (!shift.date) return false;
            const shiftDate = new Date(shift.date);
            return isSameDay(shiftDate, date);
        });
    };

    if (loading && shifts.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-6 bg-slate-50">
                <Loader2 className="animate-spin text-primary-600" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Rostering Matrix...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-6rem)] max-w-[1600px] mx-auto flex flex-col space-y-8 animate-in fade-in duration-700 pb-8">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Roster <span className="text-primary-600">Command</span></h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">Multi-Vector Staff Scheduling & Operational Matrix</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center bg-white rounded-3xl border border-slate-200 p-2 shadow-xl">
                        <button
                            onClick={() => {
                                setCurrentDate(subWeeks(currentDate, 1));
                                toast.info('Navigating to previous schedule cycle');
                            }}
                            className="p-4 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            <ChevronLeft className="w-6 h-6 text-slate-400 hover:text-slate-900" />
                        </button>
                        <div className="px-8 flex flex-col items-center min-w-[200px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Cycle</span>
                            <span className="font-black text-slate-900 text-sm mt-1">
                                {format(weekStart, 'd MMM')} — {format(addDays(weekStart, 6), 'd MMM yyyy')}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                setCurrentDate(addWeeks(currentDate, 1));
                                toast.info('Navigating to next schedule cycle');
                            }}
                            className="p-4 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            <ChevronRight className="w-6 h-6 text-slate-400 hover:text-slate-900" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-black transition-all flex items-center gap-4 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Initialize Shift Protocol
                    </button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-6">
                    <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl"><Activity size={24} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Allocations</p>
                        <p className="text-2xl font-black text-slate-900">{shifts.filter(s => s.staff_id).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-6">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unassigned Vectors</p>
                        <p className="text-2xl font-black text-rose-600">{shifts.filter(s => !s.staff_id).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-6">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><User size={24} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unique Staff Units</p>
                        <p className="text-2xl font-black text-slate-900">{new Set(shifts.map(s => s.staff_id).filter(Boolean)).size}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex items-center gap-6">
                    <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><Clock size={24} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Man Hours</p>
                        <p className="text-2xl font-black text-slate-900">428h</p>
                    </div>
                </div>
            </div>

            {/* Calendar Matrix View */}
            <div className="flex-1 bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recalibrating Matrix...</span>
                    </div>
                )}

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/30">
                    {weekDays.map((day) => (
                        <div key={day.toString()} className="py-8 px-4 text-center border-r border-slate-100 last:border-r-0 relative group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{format(day, 'EEEE')}</p>
                            <div className={`text-3xl font-black tracking-tighter ${isSameDay(day, new Date()) ? 'text-primary-600' : 'text-slate-900'} transition-all group-hover:scale-110`}>
                                {format(day, 'd')}
                            </div>
                            {isSameDay(day, new Date()) && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-600 rounded-full" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Shifts Matrix */}
                <div className="flex-1 grid grid-cols-7 overflow-y-auto scrollbar-hide divide-x divide-slate-50">
                    {weekDays.map((day) => {
                        const dayShifts = getShiftsForDay(day);
                        return (
                            <div key={day.toString()} className="p-4 min-h-[400px] bg-white group/col hover:bg-slate-50/50 transition-colors">
                                <div className="space-y-4">
                                    {dayShifts.map((shift) => (
                                        <div
                                            key={shift.id}
                                            className={`p-5 rounded-[1.75rem] border-2 transition-all cursor-pointer group/shift relative overflow-hidden
                                                ${shift.staff_id
                                                    ? 'bg-white border-slate-100 hover:border-primary-400 hover:shadow-2xl'
                                                    : 'bg-rose-50 border-rose-100 hover:border-rose-400 hover:shadow-2xl animate-pulse'}
                                            `}
                                            onClick={() => toast.info(`Accessing shift protocol: ${shift.id.substring(0, 8)}`)}
                                        >
                                            <div className="flex flex-col gap-3 relative z-10">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${shift.staff_id ? 'text-slate-400' : 'text-rose-600'}`}>
                                                        {(shift.start_time || '').slice(0, 5)} — {(shift.end_time || '').slice(0, 5)}
                                                    </span>
                                                    {!shift.staff_id && (
                                                        <div className="p-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                                    )}
                                                </div>
                                                <p className="font-black text-slate-900 text-sm leading-tight uppercase group-hover/shift:text-primary-600 transition-colors" title={shift.client?.name}>
                                                    {shift.client?.name || 'Protocol Target'}
                                                </p>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${shift.staff_id ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
                                                        <User className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">
                                                        {shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : 'Unsigned Vector'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover/shift:opacity-20 transition-opacity">
                                                <Activity size={24} className="text-primary-600" />
                                            </div>
                                        </div>
                                    ))}
                                    {dayShifts.length === 0 && (
                                        <div className="h-48 flex items-center justify-center opacity-0 group-hover/col:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setIsCreateModalOpen(true);
                                                    toast.info('Initiating new vector generation');
                                                }}
                                                className="p-5 rounded-[2rem] bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-inner active:scale-90"
                                            >
                                                <Plus className="w-8 h-8" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Visual Protocol Footer */}
                <div className="px-12 py-6 border-t border-slate-50 bg-slate-900/5 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">Roster Matrix v2.4 // Global Schedule Grid</p>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-900 rounded-full" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 underline">Assigned Protocols</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 underline">Open Vectors</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CreateShiftModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onShiftCreated={fetchShifts}
            />
        </div>
    );
}
