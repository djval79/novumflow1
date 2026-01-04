import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    CalendarDays,
    Plus,
    ChevronLeft,
    ChevronRight,
    Users,
    Clock,
    MapPin,
    Settings,
    Check,
    X,
    RefreshCw,
    User
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay } from 'date-fns';
import Toast from '@/components/Toast';

interface ShiftTemplate {
    id: string;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    break_duration_minutes: number;
    color: string;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
    department: string;
}

interface ShiftAssignment {
    id: string;
    employee_id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    status: string;
    shift_template_id: string;
    shift_templates?: ShiftTemplate;
    employees?: Employee;
}

interface Rota {
    id: string;
    name: string;
    week_start_date: string;
    week_end_date: string;
    status: string;
}

export default function ShiftManagementPage() {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [currentRota, setCurrentRota] = useState<Rota | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showAddShiftModal, setShowAddShiftModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: Date } | null>(null);
    const [activeView, setActiveView] = useState<'week' | 'templates'>('week');

    // Days of the week
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant, currentWeekStart]);

    async function loadData() {
        setLoading(true);
        await Promise.all([
            loadEmployees(),
            loadShiftTemplates(),
            loadRotaAndAssignments()
        ]);
        setLoading(false);
    }

    async function loadEmployees() {
        if (!currentTenant) return;
        const { data } = await supabase
            .from('employees')
            .select('id, first_name, last_name, position, department')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'active')
            .order('first_name');
        setEmployees(data || []);
    }

    async function loadShiftTemplates() {
        if (!currentTenant) return;
        const { data } = await supabase
            .from('shift_templates')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('is_active', true)
            .order('start_time');
        setShiftTemplates(data || []);
    }

    async function loadRotaAndAssignments() {
        if (!currentTenant) return;

        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        // Check if a rota exists for this week
        const { data: rotaData } = await supabase
            .from('rotas')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .eq('week_start_date', weekStartStr)
            .single();

        if (rotaData) {
            setCurrentRota(rotaData);

            // Load assignments for this rota
            const { data: assignmentData } = await supabase
                .from('shift_assignments')
                .select('*, shift_templates(*), employees(id, first_name, last_name, position)')
                .eq('rota_id', rotaData.id);

            setAssignments(assignmentData || []);
        } else {
            setCurrentRota(null);
            setAssignments([]);
        }
    }

    async function createRota() {
        if (!currentTenant || !user) return;

        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
        const rotaName = `Week of ${format(currentWeekStart, 'MMM dd, yyyy')}`;

        const { data, error } = await supabase
            .from('rotas')
            .insert({
                tenant_id: currentTenant.id,
                name: rotaName,
                week_start_date: weekStartStr,
                week_end_date: weekEndStr,
                status: 'draft',
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            setToast({ message: 'Failed to create rota', type: 'error' });
        } else {
            setCurrentRota(data);
            setToast({ message: 'Rota created for this week', type: 'success' });
        }
    }

    async function addShiftAssignment(employeeId: string, date: Date, templateId: string) {
        if (!currentTenant || !currentRota) return;

        const template = shiftTemplates.find(t => t.id === templateId);
        if (!template) return;

        const { error } = await supabase
            .from('shift_assignments')
            .insert({
                tenant_id: currentTenant.id,
                rota_id: currentRota.id,
                employee_id: employeeId,
                shift_template_id: templateId,
                shift_date: format(date, 'yyyy-MM-dd'),
                start_time: template.start_time,
                end_time: template.end_time,
                break_minutes: template.break_duration_minutes,
                status: 'scheduled'
            });

        if (error) {
            setToast({ message: 'Failed to add shift', type: 'error' });
        } else {
            setToast({ message: 'Shift added', type: 'success' });
            loadRotaAndAssignments();
        }
        setShowAddShiftModal(false);
        setSelectedCell(null);
    }

    async function removeShiftAssignment(assignmentId: string) {
        const { error } = await supabase
            .from('shift_assignments')
            .delete()
            .eq('id', assignmentId);

        if (!error) {
            setToast({ message: 'Shift removed', type: 'success' });
            loadRotaAndAssignments();
        }
    }

    async function publishRota() {
        if (!currentRota || !user) return;

        const { error } = await supabase
            .from('rotas')
            .update({
                status: 'published',
                published_at: new Date().toISOString(),
                published_by: user.id
            })
            .eq('id', currentRota.id);

        if (!error) {
            setToast({ message: 'Rota published! Staff will be notified.', type: 'success' });
            loadRotaAndAssignments();
        }
    }

    function getAssignmentForCell(employeeId: string, date: Date) {
        return assignments.find(a =>
            a.employee_id === employeeId &&
            isSameDay(new Date(a.shift_date), date)
        );
    }

    function formatShiftTime(time: string) {
        return format(new Date(`2000-01-01T${time}`), 'HH:mm');
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl">
                        <CalendarDays className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
                        <p className="text-sm text-gray-500">Schedule and manage staff rotas</p>
                    </div>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                    {currentRota && currentRota.status === 'draft' && (
                        <button
                            onClick={publishRota}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Publish Rota
                        </button>
                    )}
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveView('week')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center ${activeView === 'week'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Weekly Rota
                </button>
                <button
                    onClick={() => setActiveView('templates')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center ${activeView === 'templates'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Shift Templates
                </button>
            </div>

            {activeView === 'week' && (
                <>
                    {/* Week Navigation */}
                    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                        <button
                            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-lg font-bold text-gray-900">
                                {format(currentWeekStart, 'MMM dd')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                            </h2>
                            {currentRota && (
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${currentRota.status === 'published'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {currentRota.status}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Rota Grid */}
                    {!currentRota ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rota for This Week</h3>
                            <p className="text-gray-500 mb-4">Create a rota to start scheduling shifts</p>
                            <button
                                onClick={createRota}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Rota
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48 sticky left-0 bg-gray-50 z-10">
                                                Staff Member
                                            </th>
                                            {weekDays.map((day) => (
                                                <th key={day.toISOString()} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                                                    <div>{format(day, 'EEE')}</div>
                                                    <div className="text-gray-900 font-bold text-sm">{format(day, 'dd')}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {employees.map((employee) => (
                                            <tr key={employee.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-200">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                {employee.first_name} {employee.last_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{employee.position}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {weekDays.map((day) => {
                                                    const assignment = getAssignmentForCell(employee.id, day);
                                                    return (
                                                        <td key={day.toISOString()} className="px-2 py-2 text-center">
                                                            {assignment ? (
                                                                <div
                                                                    className="relative group p-2 rounded-lg text-white text-xs font-medium cursor-pointer transition hover:scale-105"
                                                                    style={{ backgroundColor: assignment.shift_templates?.color || '#6366f1' }}
                                                                >
                                                                    <div className="font-bold">{assignment.shift_templates?.code || 'Shift'}</div>
                                                                    <div className="text-white/80 text-[10px]">
                                                                        {formatShiftTime(assignment.start_time)}-{formatShiftTime(assignment.end_time)}
                                                                    </div>
                                                                    {/* Remove button on hover */}
                                                                    <button
                                                                        onClick={() => removeShiftAssignment(assignment.id)}
                                                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedCell({ employeeId: employee.id, date: day });
                                                                        setShowAddShiftModal(true);
                                                                    }}
                                                                    className="w-full h-12 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition flex items-center justify-center"
                                                                >
                                                                    <Plus className="w-4 h-4 text-gray-400" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Shift Legend */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Shift Types</h3>
                        <div className="flex flex-wrap gap-3">
                            {shiftTemplates.map((template) => (
                                <div key={template.id} className="flex items-center space-x-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: template.color }}
                                    ></div>
                                    <span className="text-sm text-gray-600">
                                        {template.name} ({template.code}) - {formatShiftTime(template.start_time)} to {formatShiftTime(template.end_time)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {activeView === 'templates' && (
                <ShiftTemplatesManager
                    templates={shiftTemplates}
                    onRefresh={loadShiftTemplates}
                    onToast={(msg, type) => setToast({ message: msg, type })}
                />
            )}

            {/* Add Shift Modal */}
            {showAddShiftModal && selectedCell && (
                <AddShiftModal
                    templates={shiftTemplates}
                    selectedDate={selectedCell.date}
                    employeeName={employees.find(e => e.id === selectedCell.employeeId)?.first_name || ''}
                    onClose={() => {
                        setShowAddShiftModal(false);
                        setSelectedCell(null);
                    }}
                    onSelect={(templateId) => addShiftAssignment(selectedCell.employeeId, selectedCell.date, templateId)}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// Add Shift Modal
function AddShiftModal({
    templates,
    selectedDate,
    employeeName,
    onClose,
    onSelect
}: {
    templates: ShiftTemplate[];
    selectedDate: Date;
    employeeName: string;
    onClose: () => void;
    onSelect: (templateId: string) => void;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add Shift</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {employeeName} - {format(selectedDate, 'EEEE, MMM dd')}
                    </p>
                </div>

                <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.id)}
                            className="w-full p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition flex items-center justify-between group"
                        >
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: template.color }}
                                >
                                    {template.code}
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-gray-900">{template.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(`2000-01-01T${template.start_time}`), 'HH:mm')} -
                                        {format(new Date(`2000-01-01T${template.end_time}`), 'HH:mm')}
                                    </p>
                                </div>
                            </div>
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Shift Templates Manager
function ShiftTemplatesManager({
    templates,
    onRefresh,
    onToast
}: {
    templates: ShiftTemplate[];
    onRefresh: () => void;
    onToast: (message: string, type: 'success' | 'error') => void;
}) {
    const { currentTenant } = useTenant();
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        start_time: '08:00',
        end_time: '16:00',
        break_duration_minutes: 30,
        color: '#6366f1'
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentTenant) return;

        const { error } = await supabase
            .from('shift_templates')
            .insert({
                tenant_id: currentTenant.id,
                ...formData
            });

        if (error) {
            onToast('Failed to create template', 'error');
        } else {
            onToast('Shift template created', 'success');
            setShowAddForm(false);
            setFormData({
                name: '',
                code: '',
                start_time: '08:00',
                end_time: '16:00',
                break_duration_minutes: 30,
                color: '#6366f1'
            });
            onRefresh();
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Shift Templates</h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Morning Shift"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="e.g., AM"
                                maxLength={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                required
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                required
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Break (minutes)</label>
                            <input
                                type="number"
                                value={formData.break_duration_minutes}
                                onChange={(e) => setFormData({ ...formData, break_duration_minutes: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            Create Template
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
                    >
                        <div className="flex items-center space-x-3 mb-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: template.color }}
                            >
                                {template.code}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{template.name}</h3>
                                <p className="text-sm text-gray-500">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {format(new Date(`2000-01-01T${template.start_time}`), 'HH:mm')} -
                                    {format(new Date(`2000-01-01T${template.end_time}`), 'HH:mm')}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            Break: {template.break_duration_minutes} minutes
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
