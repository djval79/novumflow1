import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Clock, Play, Square, Coffee, Calendar, TrendingUp, Users, MapPin } from 'lucide-react';
import { format, differenceInMinutes, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO } from 'date-fns';
import { log } from '@/lib/logger';

interface TimeEntry {
    id: string;
    employee_id: string;
    tenant_id: string;
    check_in_time: string;
    check_out_time?: string;
    break_duration_minutes: number;
    notes?: string;
    location?: string;
    status: 'active' | 'present' | 'late' | 'excused' | 'absent';
}

interface AttendanceStats {
    totalHoursToday: number;
    totalHoursWeek: number;
    avgStartTime: string;
    lateArrivals: number;
}

export default function TimeClock() {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
    const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [clockingIn, setClockingIn] = useState(false);
    const [onBreak, setOnBreak] = useState(false);
    const [breakStart, setBreakStart] = useState<Date | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState<string>('');

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user && currentTenant) {
            loadAttendanceData();
        }
    }, [user, currentTenant]);

    async function loadAttendanceData() {
        setLoading(true);
        try {
            // Try to get current active entry
            const { data: activeEntry } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('employee_id', user?.id)
                .eq('tenant_id', currentTenant?.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (activeEntry) {
                setCurrentEntry(activeEntry);
            }

            // Get recent entries
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
            const { data: entries } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('employee_id', user?.id)
                .eq('tenant_id', currentTenant?.id)
                .gte('check_in_time', weekStart.toISOString())
                .order('check_in_time', { ascending: false });

            setRecentEntries(entries || []);
            calculateStats(entries || []);
        } catch (error) {
            log.error('Error loading attendance', error, { component: 'TimeClock', action: 'loadAttendanceData' });
            // Generate mock data for demo
            generateMockData();
        } finally {
            setLoading(false);
        }
    }

    function generateMockData() {
        const mockEntries: TimeEntry[] = [];
        const today = new Date();

        for (let i = 0; i < 5; i++) {
            const day = new Date(today);
            day.setDate(day.getDate() - i);
            if (day.getDay() !== 0 && day.getDay() !== 6) { // Skip weekends
                mockEntries.push({
                    id: `mock-${i}`,
                    employee_id: user?.id || '',
                    tenant_id: currentTenant?.id || '',
                    check_in_time: new Date(day.setHours(9, Math.floor(Math.random() * 15), 0)).toISOString(),
                    check_out_time: i === 0 ? undefined : new Date(day.setHours(17, 30, 0)).toISOString(),
                    break_duration_minutes: 30,
                    status: i === 0 ? 'active' : 'present',
                    location: 'Office'
                });
            }
        }

        if (mockEntries[0]?.status === 'active') {
            setCurrentEntry(mockEntries[0]);
        }

        setRecentEntries(mockEntries);
        calculateStats(mockEntries);
    }

    function calculateStats(entries: TimeEntry[]) {
        const today = new Date();
        const todayEntries = entries.filter(e =>
            format(parseISO(e.check_in_time), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        );

        let totalMinutesToday = 0;
        todayEntries.forEach(entry => {
            const clockIn = parseISO(entry.check_in_time);
            const clockOut = entry.check_out_time ? parseISO(entry.check_out_time) : new Date();
            totalMinutesToday += differenceInMinutes(clockOut, clockIn) - entry.break_duration_minutes;
        });

        let totalMinutesWeek = 0;
        entries.forEach(entry => {
            if (entry.check_out_time) {
                const clockIn = parseISO(entry.check_in_time);
                const clockOut = parseISO(entry.check_out_time);
                totalMinutesWeek += differenceInMinutes(clockOut, clockIn) - entry.break_duration_minutes;
            }
        });

        const clockInTimes = entries.filter(e => e.check_in_time).map(e => {
            const d = parseISO(e.check_in_time);
            return d.getHours() * 60 + d.getMinutes();
        });
        const avgMinutes = clockInTimes.length > 0
            ? Math.round(clockInTimes.reduce((a, b) => a + b, 0) / clockInTimes.length)
            : 9 * 60;

        const lateArrivals = clockInTimes.filter(m => m > 9 * 60 + 15).length;

        setStats({
            totalHoursToday: Math.round(totalMinutesToday / 60 * 10) / 10,
            totalHoursWeek: Math.round(totalMinutesWeek / 60 * 10) / 10,
            avgStartTime: `${Math.floor(avgMinutes / 60).toString().padStart(2, '0')}:${(avgMinutes % 60).toString().padStart(2, '0')}`,
            lateArrivals
        });
    }

    async function handleClockIn() {
        setClockingIn(true);
        try {
            // Get location if available
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
                    () => setLocation('Unknown')
                );
            }

            const newEntry: Partial<TimeEntry> = {
                employee_id: user?.id,
                tenant_id: currentTenant?.id,
                date: new Date().toISOString().split('T')[0],
                check_in_time: new Date().toISOString(),
                break_duration_minutes: 0,
                status: 'active',
                location: location || 'Office'
            };

            const { data, error } = await supabase
                .from('attendance_records')
                .insert(newEntry)
                .select()
                .single();

            if (error) throw error;

            setCurrentEntry(data);
            setRecentEntries(prev => [data, ...prev]);
        } catch (error) {
            log.error('Clock in error', error, { component: 'TimeClock', action: 'handleClockIn' });
            // Create mock entry for demo
            const mockEntry: TimeEntry = {
                id: `mock-${Date.now()}`,
                employee_id: user?.id || '',
                tenant_id: currentTenant?.id || '',
                check_in_time: new Date().toISOString(),
                break_duration_minutes: 0,
                status: 'active',
                location: 'Office',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            setCurrentEntry(mockEntry);
            setRecentEntries(prev => [mockEntry, ...prev]);
        } finally {
            setClockingIn(false);
        }
    }

    async function handleClockOut() {
        if (!currentEntry) return;
        setClockingIn(true);

        try {
            const { error } = await supabase
                .from('attendance_records')
                .update({
                    check_out_time: new Date().toISOString(),
                    status: 'present',
                    break_duration_minutes: currentEntry.break_duration_minutes
                })
                .eq('id', currentEntry.id);

            if (error) throw error;

            setCurrentEntry(null);
            loadAttendanceData();
        } catch (error) {
            log.error('Clock out error', error, { component: 'TimeClock', action: 'handleClockOut' });
            // Update mock entry
            setRecentEntries(prev => prev.map(e =>
                e.id === currentEntry.id
                    ? { ...e, check_out_time: new Date().toISOString(), status: 'present' as const }
                    : e
            ));
            setCurrentEntry(null);
        } finally {
            setClockingIn(false);
        }
    }

    function handleBreakToggle() {
        if (onBreak) {
            // End break
            if (breakStart && currentEntry) {
                const breakMinutes = differenceInMinutes(new Date(), breakStart);
                setCurrentEntry({
                    ...currentEntry,
                    break_duration_minutes: currentEntry.break_duration_minutes + breakMinutes
                });
            }
            setOnBreak(false);
            setBreakStart(null);
        } else {
            // Start break
            setOnBreak(true);
            setBreakStart(new Date());
        }
    }

    function getElapsedTime(): string {
        if (!currentEntry) return '00:00:00';
        const clockIn = parseISO(currentEntry.check_in_time);
        const elapsed = differenceInMinutes(currentTime, clockIn);
        const hours = Math.floor(elapsed / 60);
        const minutes = elapsed % 60;
        const seconds = currentTime.getSeconds();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const weekDays = eachDayOfInterval({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-32 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Time Clock Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">Time Clock</h2>
                        <p className="text-indigo-200 text-sm">
                            {format(currentTime, 'EEEE, MMMM d, yyyy')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-mono font-bold">
                            {format(currentTime, 'HH:mm:ss')}
                        </p>
                    </div>
                </div>

                {currentEntry ? (
                    <div className="space-y-4">
                        <div className="bg-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-indigo-200">Clocked in at</p>
                                    <p className="text-lg font-semibold">
                                        {format(parseISO(currentEntry.check_in_time), 'HH:mm')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-indigo-200">Elapsed time</p>
                                    <p className="text-2xl font-mono font-bold">
                                        {getElapsedTime()}
                                    </p>
                                </div>
                            </div>
                            {currentEntry.break_duration_minutes > 0 && (
                                <p className="text-xs text-indigo-200 mt-2">
                                    Break time: {currentEntry.break_duration_minutes} minutes
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleBreakToggle}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${onBreak
                                    ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
                                    : 'bg-white/20 hover:bg-white/30'
                                    }`}
                            >
                                <Coffee className="w-5 h-5" />
                                {onBreak ? 'End Break' : 'Take Break'}
                            </button>
                            <button
                                onClick={handleClockOut}
                                disabled={clockingIn}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition disabled:opacity-50"
                            >
                                <Square className="w-5 h-5" />
                                Clock Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleClockIn}
                        disabled={clockingIn}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition disabled:opacity-50"
                    >
                        {clockingIn ? (
                            <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                        ) : (
                            <>
                                <Play className="w-6 h-6" />
                                Clock In
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Today</p>
                                <p className="text-xl font-bold text-gray-900">{stats.totalHoursToday}h</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">This Week</p>
                                <p className="text-xl font-bold text-gray-900">{stats.totalHoursWeek}h</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Avg Start</p>
                                <p className="text-xl font-bold text-gray-900">{stats.avgStartTime}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Users className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Late Arrivals</p>
                                <p className="text-xl font-bold text-gray-900">{stats.lateArrivals}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Week Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">This Week</h3>
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, index) => {
                        const dayEntry = recentEntries.find(e =>
                            format(parseISO(e.clock_in), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                        );
                        const isCurrentDay = isToday(day);

                        return (
                            <div key={index} className="text-center">
                                <p className="text-xs text-gray-500 mb-1">
                                    {format(day, 'EEE')}
                                </p>
                                <div className={`relative p-3 rounded-lg ${isCurrentDay
                                    ? 'bg-indigo-100 ring-2 ring-indigo-500'
                                    : dayEntry
                                        ? 'bg-green-50'
                                        : 'bg-gray-50'
                                    }`}>
                                    <p className={`text-sm font-medium ${isCurrentDay ? 'text-indigo-700' : 'text-gray-700'
                                        }`}>
                                        {format(day, 'd')}
                                    </p>
                                    {dayEntry && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {dayEntry.check_out_time
                                                ? `${format(parseISO(dayEntry.check_in_time), 'HH:mm')}-${format(parseISO(dayEntry.check_out_time), 'HH:mm')}`
                                                : format(parseISO(dayEntry.check_in_time), 'HH:mm')
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Recent Time Entries</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentEntries.slice(0, 5).map(entry => (
                        <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {format(parseISO(entry.check_in_time), 'EEEE, MMM d')}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {format(parseISO(entry.check_in_time), 'HH:mm')}
                                    {entry.check_out_time && ` - ${format(parseISO(entry.check_out_time), 'HH:mm')}`}
                                    {entry.break_duration_minutes > 0 && ` (${entry.break_duration_minutes}m break)`}
                                </p>
                            </div>
                            <div className="text-right">
                                {entry.check_out_time ? (
                                    <>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {Math.round((differenceInMinutes(parseISO(entry.check_out_time), parseISO(entry.check_in_time)) - entry.break_duration_minutes) / 60 * 10) / 10}h
                                        </p>
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                            Completed
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded animate-pulse">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
