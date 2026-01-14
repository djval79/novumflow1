import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { User, Calendar, CheckCircle, Clock, AlertCircle, Plus, Search, ChevronRight } from 'lucide-react';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { format, differenceInDays, parseISO } from 'date-fns';
import { log } from '@/lib/logger';
import AddEmployeeModal from '@/components/AddEmployeeModal';
import Toast from '@/components/Toast';

interface NewHire {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    position: string;
    start_date: string;
    onboarding_progress: number;
    status: 'pending' | 'in_progress' | 'completed';
}

export default function OnboardingPage() {
    const { currentTenant } = useTenant();
    const [newHires, setNewHires] = useState<NewHire[]>([]);
    const [selectedHire, setSelectedHire] = useState<NewHire | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    useEffect(() => {
        loadNewHires();
    }, [currentTenant]);

    async function loadNewHires() {
        if (!currentTenant) return;
        setLoading(true);
        try {
            // Fetch employees with recent hire dates
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .gte('date_hired', ninetyDaysAgo.toISOString().split('T')[0])
                .order('date_hired', { ascending: false });

            if (error) throw error;

            // In a real app, we'd join with employee_onboarding_checklists to get progress/status
            // For now, we'll keep the simplified mapping but make it more realistic
            const hires: NewHire[] = (data || []).map(emp => ({
                id: emp.id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                email: emp.email,
                department: emp.department || 'N/A',
                position: emp.position || 'N/A',
                start_date: emp.date_hired || emp.created_at,
                onboarding_progress: 0, // Should be fetched from DB
                status: 'pending' as any, // Should be fetched from DB
            }));

            // Fetch actual statuses and progress if available
            const { data: checklists, error: checklistError } = await supabase
                .from('employee_onboarding_checklists')
                .select('employee_id, status, id')
                .in('employee_id', hires.map(h => h.id));

            if (!checklistError && checklists) {
                hires.forEach(h => {
                    const cl = checklists.find(c => c.employee_id === h.id);
                    if (cl) {
                        h.status = cl.status;
                        // We could also count items here to get percentage
                    }
                });
            }

            setNewHires(hires);
            if (hires.length > 0 && !selectedHire) {
                setSelectedHire(hires[0]);
            }
        } catch (error: any) {
            log.error('Error loading new hires', error, { component: 'OnboardingPage', action: 'loadNewHires' });
            setToast({ message: 'Failed to load new hires', type: 'error' });
            setNewHires(generateMockNewHires());
        } finally {
            setLoading(false);
        }
    }

    function generateMockNewHires(): NewHire[] {
        const names = [
            { first: 'Emma', last: 'Wilson' },
            { first: 'James', last: 'Chen' },
            { first: 'Sarah', last: 'Davis' },
            { first: 'Michael', last: 'Brown' },
            { first: 'Lisa', last: 'Taylor' },
        ];

        return names.map((name, i) => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
            const progress = Math.random() * 100;

            return {
                id: `hire-${i}`,
                first_name: name.first,
                last_name: name.last,
                email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@company.com`,
                department: ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR'][i],
                position: ['Developer', 'Account Manager', 'Designer', 'Analyst', 'Coordinator'][i],
                start_date: format(startDate, 'yyyy-MM-dd'),
                onboarding_progress: progress,
                status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending',
            };
        });
    }

    const filteredHires = newHires.filter(hire => {
        if (filter !== 'all' && hire.status !== filter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                hire.first_name.toLowerCase().includes(query) ||
                hire.last_name.toLowerCase().includes(query) ||
                hire.email.toLowerCase().includes(query) ||
                hire.department.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const stats = {
        total: newHires.length,
        pending: newHires.filter(h => h.status === 'pending').length,
        inProgress: newHires.filter(h => h.status === 'in_progress').length,
        completed: newHires.filter(h => h.status === 'completed').length,
    };

    function getStatusColor(status: string) {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    function getDaysInfo(startDate: string): { days: number; label: string } {
        const days = differenceInDays(new Date(), parseISO(startDate));
        if (days === 0) return { days: 0, label: 'Starts today!' };
        if (days < 0) return { days: Math.abs(days), label: `Starts in ${Math.abs(days)} days` };
        return { days, label: `Day ${days}` };
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Employee Onboarding</h1>
                    <p className="mt-1 text-sm text-gray-600">Track and manage new hire onboarding progress</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Hire
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total New Hires</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <User className="w-8 h-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* New Hires List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">New Hires</h2>
                        <div className="mt-3 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="mt-3 flex space-x-1">
                            {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-2 py-1 text-xs rounded-lg transition ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {filteredHires.map(hire => {
                            const daysInfo = getDaysInfo(hire.start_date);
                            return (
                                <button
                                    key={hire.id}
                                    onClick={() => setSelectedHire(hire)}
                                    className={`w-full flex items-center px-6 py-4 hover:bg-gray-50 transition ${selectedHire?.id === hire.id ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {hire.first_name[0]}{hire.last_name[0]}
                                    </div>
                                    <div className="ml-3 flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-900">
                                            {hire.first_name} {hire.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{hire.position}</p>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(hire.status)}`}>
                                                {hire.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">{daysInfo.label}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-indigo-600">
                                            {Math.round(hire.onboarding_progress)}%
                                        </p>
                                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                                    </div>
                                </button>
                            );
                        })}
                        {filteredHires.length === 0 && (
                            <div className="px-6 py-12 text-center text-gray-500">
                                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No new hires found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Onboarding Checklist */}
                <div className="lg:col-span-2">
                    {selectedHire ? (
                        <OnboardingChecklist
                            employeeId={selectedHire.id}
                            employeeName={`${selectedHire.first_name} ${selectedHire.last_name}`}
                            startDate={selectedHire.start_date}
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a New Hire</h3>
                            <p className="text-gray-500">Choose a new hire from the list to view their onboarding checklist</p>
                        </div>
                    )}
                </div>
            </div>

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setToast({ message: 'New hire added successfully', type: 'success' });
                    loadNewHires();
                }}
                onError={(msg) => setToast({ message: msg, type: 'error' })}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
