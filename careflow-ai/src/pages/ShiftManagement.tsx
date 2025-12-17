
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, User, Clock } from 'lucide-react';
import CreateShiftModal from '@/components/CreateShiftModal';

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
                .from('visits')
                .select(`
                    id,
                    client_id,
                    staff_id,
                    date,
                    start_time,
                    end_time,
                    status,
                    client:clients(name),
                    staff:employees(first_name, last_name)
                `)
                .eq('tenant_id', currentTenant.id)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;
            setShifts(data as any || []);
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, [currentTenant, currentDate]);

    const getShiftsForDay = (date: Date) => {
        return shifts.filter(shift => isSameDay(new Date(shift.date), date));
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rostering</h1>
                    <p className="text-gray-500">Manage visits and staff schedules</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="px-4 font-medium text-gray-700 min-w-[140px] text-center">
                            {format(weekStart, 'd MMM')} - {format(addDays(weekStart, 6), 'd MMM yyyy')}
                        </span>
                        <button
                            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Shift
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {weekDays.map((day) => (
                        <div key={day.toString()} className="py-3 px-4 text-center border-r border-gray-200 last:border-r-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase">{format(day, 'EEE')}</p>
                            <p className={`text-lg font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-cyan-600' : 'text-gray-900'}`}>
                                {format(day, 'd')}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Shifts Grid */}
                <div className="flex-1 grid grid-cols-7 overflow-y-auto">
                    {weekDays.map((day) => {
                        const dayShifts = getShiftsForDay(day);
                        return (
                            <div key={day.toString()} className="border-r border-gray-100 last:border-r-0 p-2 min-h-[200px] bg-white hover:bg-gray-50/50 transition-colors">
                                <div className="space-y-2">
                                    {dayShifts.map((shift) => (
                                        <div
                                            key={shift.id}
                                            className={`p-2 rounded-lg border text-xs shadow-sm cursor-pointer hover:shadow-md transition-all
                                                ${shift.staff_id ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-200'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-700">
                                                    {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                                                </span>
                                                {!shift.staff_id && (
                                                    <span className="w-2 h-2 rounded-full bg-orange-500" title="Unassigned" />
                                                )}
                                            </div>
                                            <p className="font-medium text-gray-900 truncate" title={shift.client?.name}>
                                                {shift.client?.name || 'Unknown Client'}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-gray-500">
                                                <User className="w-3 h-3" />
                                                <span className="truncate">
                                                    {shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : 'Unassigned'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {dayShifts.length === 0 && (
                                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-cyan-50 hover:text-cyan-600"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
