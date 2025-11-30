import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { visitService, clientService, staffService } from '../services/supabaseService';
import { Client } from '../types';
import { User, Calendar, Clock, AlertTriangle, CheckCircle, Lock, MapPin, X, Plus } from 'lucide-react';

interface StaffMember {
    id: string;
    userId: string;
    name: string;
    avatar: string;
    dbsStatus: string;
    rtwStatus: string;
}

interface Visit {
    id: string;
    client: { first_name: string; last_name: string };
    visit_date: string;
    start_time: string;
    end_time: string;
    status: string;
    carer_id: string | null;
}

export default function Rostering() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [unassignedVisits, setUnassignedVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedVisit, setDraggedVisit] = useState<Visit | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load Staff using Service
            const staffData = await staffService.getAll();
            setStaff(staffData as unknown as StaffMember[]);

            // 2. Load Unassigned Visits using Service
            const visitsData = await visitService.getUnassigned();

            // Map to component format
            const mappedVisits = visitsData.map((v: any) => ({
                id: v.id,
                client: {
                    first_name: v.clients?.name.split(' ')[0] || 'Unknown',
                    last_name: v.clients?.name.split(' ').slice(1).join(' ') || ''
                },
                visit_date: v.date,
                start_time: v.start_time,
                end_time: v.end_time,
                status: v.status,
                carer_id: v.staff_id
            }));

            setUnassignedVisits(mappedVisits || []);

            // 3. Load Clients for dropdown
            const clientsData = await clientService.getAll();
            setClients(clientsData);

        } catch (error) {
            console.error('Error loading roster data:', error);
        } finally {
            setLoading(false);
        }
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const isCompliant = (member: StaffMember) => {
        return member.dbsStatus === 'Clear' && member.rtwStatus === 'Valid';
        // Note: 'Clear' and 'Valid' are the expected values from the DB check constraints
    };

    const handleDragStart = (visit: Visit) => {
        setDraggedVisit(visit);
    };

    const handleDrop = async (staffId: string, date: Date, member: StaffMember) => {
        if (!draggedVisit) return;

        // COMPLIANCE LOCK
        if (!isCompliant(member)) {
            alert(`⛔ COMPLIANCE LOCK\n\nCannot assign visits to ${member.name}.\nCheck DBS, Right to Work, or Training status.`);
            return;
        }

        try {
            // Optimistic update
            setUnassignedVisits(prev => prev.filter(v => v.id !== draggedVisit.id));

            // Database update using Service
            await visitService.assignStaff(draggedVisit.id, member.userId, format(date, 'yyyy-MM-dd'));

            // Reload to confirm
            loadData();

        } catch (error) {
            console.error('Drop failed:', error);
            alert('Failed to assign visit. Please try again.');
            loadData(); // Revert
        } finally {
            setDraggedVisit(null);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Smart Roster</h1>
                    <p className="text-slate-500">Drag visits to assign. Non-compliant staff are locked.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Visit
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm">
                        Publish Roster
                    </button>
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                {/* Unassigned Visits Sidebar */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Unassigned Visits
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {unassignedVisits.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">No unassigned visits</div>
                        ) : (
                            unassignedVisits.map(visit => (
                                <div
                                    key={visit.id}
                                    draggable
                                    onDragStart={() => handleDragStart(visit)}
                                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm cursor-move hover:border-indigo-400 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-slate-800">
                                            {visit.client?.first_name} {visit.client?.last_name}
                                        </span>
                                        <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                            {visit.start_time.slice(0, 5)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {format(parseISO(visit.visit_date), 'EEE d MMM')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Header Row */}
                    <div className="flex border-b border-slate-200">
                        <div className="w-64 p-4 border-r border-slate-200 bg-slate-50 font-semibold text-slate-700">
                            Staff Member
                        </div>
                        {weekDays.map(day => (
                            <div key={day.toString()} className="flex-1 p-4 text-center border-r border-slate-200 last:border-r-0 bg-slate-50">
                                <div className="font-semibold text-slate-900">{format(day, 'EEE')}</div>
                                <div className="text-xs text-slate-500">{format(day, 'd MMM')}</div>
                            </div>
                        ))}
                    </div>

                    {/* Staff Rows */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading roster...</div>
                        ) : (
                            staff.map(member => {
                                const compliant = isCompliant(member);
                                return (
                                    <div key={member.id} className={`flex border-b border-slate-100 ${!compliant ? 'bg-red-50/50' : ''}`}>
                                        {/* Staff Info Column */}
                                        <div className="w-64 p-4 border-r border-slate-200 flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                    {member.avatar}
                                                </div>
                                                {!compliant && (
                                                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border-2 border-white" title="Non-Compliant">
                                                        <Lock className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{member.name}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    {compliant ? (
                                                        <><CheckCircle className="w-3 h-3 text-green-500" /> Active</>
                                                    ) : (
                                                        <><AlertTriangle className="w-3 h-3 text-red-500" /> Locked</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Days Columns */}
                                        {weekDays.map(day => (
                                            <div
                                                key={day.toString()}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDrop(member.id, day, member)}
                                                className={`flex-1 border-r border-slate-200 last:border-r-0 min-h-[80px] relative transition-colors ${!compliant ? 'cursor-not-allowed' : 'hover:bg-indigo-50/50'
                                                    }`}
                                            >
                                                {!compliant && (
                                                    <div className="absolute inset-0 bg-stripes-red opacity-10" title="Staff Locked: Compliance Issue"></div>
                                                )}

                                                {/* Render Assigned Visits Here (Future) */}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            {/* Add Visit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Schedule New Visit</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            try {
                                await visitService.create({
                                    clientId: formData.get('clientId') as string,
                                    date: formData.get('date') as string,
                                    startTime: formData.get('startTime') as string,
                                    endTime: formData.get('endTime') as string,
                                    visitType: formData.get('visitType') as string,
                                    status: 'Scheduled'
                                });
                                setIsAddModalOpen(false);
                                loadData();
                            } catch (err) {
                                console.error(err);
                                alert('Failed to create visit');
                            }
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                                <select name="clientId" required className="w-full p-2 border border-slate-300 rounded-lg">
                                    <option value="">Select Client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input name="date" type="date" required className="w-full p-2 border border-slate-300 rounded-lg" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                                    <input name="startTime" type="time" required className="w-full p-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                                    <input name="endTime" type="time" required className="w-full p-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Visit Type</label>
                                <select name="visitType" className="w-full p-2 border border-slate-300 rounded-lg">
                                    <option>Personal Care</option>
                                    <option>Domestic</option>
                                    <option>Social</option>
                                    <option>Medication</option>
                                    <option>Shopping</option>
                                </select>
                            </div>

                            <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg mt-2 hover:bg-indigo-700">
                                Schedule Visit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
