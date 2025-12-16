import React from 'react';
import TimeClock from '@/components/TimeClock';
import EventCalendar from '@/components/EventCalendar';

export default function AttendancePage() {
    return (
        <div className="space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Attendance & Time Tracking</h1>
                <p className="mt-1 text-sm text-gray-600">Track your work hours and view scheduled events</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Time Clock */}
                <div>
                    <TimeClock />
                </div>

                {/* Right Column - Calendar Preview */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                        <div className="space-y-3">
                            {[
                                { time: '10:00', title: 'Team Standup', type: 'meeting' },
                                { time: '14:00', title: 'Interview: Sarah J.', type: 'interview' },
                                { time: '16:30', title: 'Performance Review', type: 'review' },
                            ].map((event, i) => (
                                <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                    <div className={`w-2 h-8 rounded-full mr-3 ${event.type === 'meeting' ? 'bg-blue-500' :
                                            event.type === 'interview' ? 'bg-purple-500' :
                                                'bg-orange-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                        <p className="text-xs text-gray-500">{event.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 text-sm text-left bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition">
                                Request Time Off
                            </button>
                            <button className="p-3 text-sm text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                                View Timesheet
                            </button>
                            <button className="p-3 text-sm text-left bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
                                Submit Expense
                            </button>
                            <button className="p-3 text-sm text-left bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition">
                                Book Meeting
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Calendar */}
            <div>
                <EventCalendar />
            </div>
        </div>
    );
}
