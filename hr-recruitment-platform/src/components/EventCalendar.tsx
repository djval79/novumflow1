import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, MapPin, Video, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';

interface CalendarEvent {
    id: string;
    title: string;
    type: 'interview' | 'meeting' | 'training' | 'review' | 'leave' | 'other';
    start_time: string;
    end_time: string;
    location?: string;
    description?: string;
    attendees?: string[];
    color: string;
}

export default function EventCalendar() {
    const { currentTenant } = useTenant();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');

    useEffect(() => {
        loadEvents();
    }, [currentMonth, currentTenant]);

    async function loadEvents() {
        setLoading(true);
        try {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            // Try to load interviews
            const { data: interviews } = await supabase
                .from('interviews')
                .select('*')
                .gte('scheduled_at', monthStart.toISOString())
                .lte('scheduled_at', monthEnd.toISOString());

            const calendarEvents: CalendarEvent[] = [];

            if (interviews) {
                interviews.forEach(interview => {
                    calendarEvents.push({
                        id: interview.id,
                        title: `Interview: ${interview.candidate_name || 'Candidate'}`,
                        type: 'interview',
                        start_time: interview.scheduled_at,
                        end_time: interview.scheduled_at,
                        location: interview.location || 'TBD',
                        description: interview.notes,
                        color: '#8B5CF6'
                    });
                });
            }

            // Add mock events for demo
            if (calendarEvents.length === 0) {
                calendarEvents.push(...generateMockEvents(currentMonth));
            }

            setEvents(calendarEvents);
        } catch (error) {
            log.error('Error loading calendar events', error, { component: 'EventCalendar', action: 'loadEvents', metadata: { month: currentMonth.toISOString() } });
            setEvents(generateMockEvents(currentMonth));
        } finally {
            setLoading(false);
        }
    }

    function generateMockEvents(month: Date): CalendarEvent[] {
        const mockEvents: CalendarEvent[] = [];
        const daysInMonth = eachDayOfInterval({
            start: startOfMonth(month),
            end: endOfMonth(month)
        });

        // Add some random events
        const eventTypes = [
            { type: 'interview' as const, title: 'Interview: Sarah Johnson', color: '#8B5CF6' },
            { type: 'meeting' as const, title: 'Team Meeting', color: '#3B82F6' },
            { type: 'training' as const, title: 'Fire Safety Training', color: '#10B981' },
            { type: 'review' as const, title: 'Performance Review', color: '#F59E0B' },
            { type: 'leave' as const, title: 'John Smith - Annual Leave', color: '#EF4444' },
        ];

        daysInMonth.forEach((day, index) => {
            if (Math.random() > 0.7 && day.getDay() !== 0 && day.getDay() !== 6) {
                const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                const hour = 9 + Math.floor(Math.random() * 8);
                mockEvents.push({
                    id: `mock-${index}`,
                    title: randomEvent.title,
                    type: randomEvent.type,
                    start_time: new Date(day.setHours(hour, 0, 0)).toISOString(),
                    end_time: new Date(day.setHours(hour + 1, 0, 0)).toISOString(),
                    location: randomEvent.type === 'interview' ? 'Meeting Room A' : 'Main Office',
                    color: randomEvent.color
                });
            }
        });

        return mockEvents;
    }

    function getEventsForDate(date: Date): CalendarEvent[] {
        return events.filter(event => isSameDay(parseISO(event.start_time), date));
    }

    function getEventTypeIcon(type: string) {
        switch (type) {
            case 'interview': return <Users className="w-4 h-4" />;
            case 'meeting': return <Video className="w-4 h-4" />;
            case 'training': return <CalendarIcon className="w-4 h-4" />;
            case 'review': return <Clock className="w-4 h-4" />;
            default: return <CalendarIcon className="w-4 h-4" />;
        }
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad the start to begin on Monday
    const startDay = monthStart.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                        Today
                    </button>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {(['month', 'week', 'day'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1 text-sm rounded-md transition ${view === v ? 'bg-white shadow text-indigo-600' : 'text-gray-600'
                                    }`}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Event
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Padding days */}
                    {Array.from({ length: paddingDays }).map((_, i) => (
                        <div key={`pad-${i}`} className="h-24 bg-gray-50 rounded-lg" />
                    ))}

                    {/* Actual days */}
                    {calendarDays.map((day, index) => {
                        const dayEvents = getEventsForDate(day);
                        const isCurrentDay = isToday(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);

                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedDate(day)}
                                className={`h-24 p-1 rounded-lg border cursor-pointer transition ${isCurrentDay
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : isSelected
                                        ? 'border-indigo-300 bg-indigo-25'
                                        : 'border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-indigo-600' : 'text-gray-700'
                                    }`}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-0.5 overflow-hidden">
                                    {dayEvents.slice(0, 2).map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(event);
                                            }}
                                            className="text-xs px-1 py-0.5 rounded truncate text-white"
                                            style={{ backgroundColor: event.color }}
                                        >
                                            {format(parseISO(event.start_time), 'HH:mm')} {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <div className="text-xs text-gray-500 px-1">
                                            +{dayEvents.length - 2} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Legend */}
            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8B5CF6' }} />
                    <span className="text-gray-600">Interview</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }} />
                    <span className="text-gray-600">Meeting</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-gray-600">Training</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
                    <span className="text-gray-600">Review</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444' }} />
                    <span className="text-gray-600">Leave</span>
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="p-2 rounded-lg text-white"
                                        style={{ backgroundColor: selectedEvent.color }}
                                    >
                                        {getEventTypeIcon(selectedEvent.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{selectedEvent.title}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{selectedEvent.type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-3 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">
                                    {format(parseISO(selectedEvent.start_time), 'EEEE, MMMM d, yyyy')}
                                    <br />
                                    {format(parseISO(selectedEvent.start_time), 'HH:mm')} - {format(parseISO(selectedEvent.end_time), 'HH:mm')}
                                </span>
                            </div>
                            {selectedEvent.location && (
                                <div className="flex items-center space-x-3 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{selectedEvent.location}</span>
                                </div>
                            )}
                            {selectedEvent.description && (
                                <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                                    {selectedEvent.description}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            >
                                Close
                            </button>
                            <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                Edit Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                        Events for {format(selectedDate, 'MMMM d, yyyy')}
                    </h4>
                    <div className="space-y-2">
                        {getEventsForDate(selectedDate).length === 0 ? (
                            <p className="text-sm text-gray-500">No events scheduled</p>
                        ) : (
                            getEventsForDate(selectedDate).map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                                >
                                    <div
                                        className="w-1 h-10 rounded-full mr-3"
                                        style={{ backgroundColor: event.color }}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                                            {event.location && ` • ${event.location}`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
