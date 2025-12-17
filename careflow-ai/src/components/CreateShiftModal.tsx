
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { X, Calendar, Clock, User, AlertTriangle, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import complianceCheckService, { ComplianceStatus } from '@/services/ComplianceCheckService';

interface CreateShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShiftCreated: () => void;
}

interface Client {
    id: string;
    name: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    compliance?: ComplianceStatus;
}

export default function CreateShiftModal({ isOpen, onClose, onShiftCreated }: CreateShiftModalProps) {
    const { currentTenant } = useTenant();
    const [clients, setClients] = useState<Client[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);

    const [formData, setFormData] = useState({
        clientId: '',
        staffId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        visitType: 'Personal Care'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conflictWarning, setConflictWarning] = useState<string | null>(null);
    const [complianceWarning, setComplianceWarning] = useState<string | null>(null);
    const [staffCompliance, setStaffCompliance] = useState<Map<string, ComplianceStatus>>(new Map());

    useEffect(() => {
        if (isOpen && currentTenant) {
            fetchOptions();
        }
    }, [isOpen, currentTenant]);

    const fetchOptions = async () => {
        if (!currentTenant) return;

        // Fetch Clients
        const { data: clientsData } = await supabase
            .from('clients')
            .select('id, name')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'Active');

        setClients(clientsData || []);

        // Fetch Staff
        const { data: staffData } = await supabase
            .from('employees')
            .select('id, first_name, last_name')
            .eq('tenant_id', currentTenant.id)
            .eq('status', 'active');

        setStaffList(staffData || []);

        // Fetch compliance data for all staff
        const complianceMap = await complianceCheckService.checkAllStaffCompliance(currentTenant.id);
        setStaffCompliance(complianceMap);
    };

    const checkConflicts = async (staffId: string, date: string, start: string, end: string) => {
        if (!staffId || !date || !start || !end) return;

        const { data, error } = await supabase.rpc('check_visit_conflicts', {
            p_staff_id: staffId,
            p_date: date,
            p_start_time: start,
            p_end_time: end
        });

        if (error) {
            console.error('Conflict check error:', error);
            return;
        }

        if (data && data.length > 0) {
            setConflictWarning(`Staff member has ${data.length} conflicting shift(s) at this time.`);
        } else {
            setConflictWarning(null);
        }
    };

    // Check conflicts when relevant fields change
    useEffect(() => {
        if (formData.staffId) {
            checkConflicts(formData.staffId, formData.date, formData.startTime, formData.endTime);
        } else {
            setConflictWarning(null);
        }
    }, [formData.staffId, formData.date, formData.startTime, formData.endTime]);

    // Check compliance when staff is selected
    useEffect(() => {
        if (formData.staffId && currentTenant) {
            const compliance = staffCompliance.get(formData.staffId);
            if (compliance && !compliance.isCompliant) {
                let warning = 'Warning: This staff member has compliance issues:\n';
                if (compliance.rtw_status !== 'valid') {
                    warning += '• Right to Work not verified\n';
                }
                if (compliance.dbs_status !== 'valid') {
                    warning += '• DBS check not current\n';
                }
                if (compliance.missingDocuments.length > 0) {
                    warning += `• Missing: ${compliance.missingDocuments.join(', ')}\n`;
                }
                setComplianceWarning(warning.trim());
            } else {
                setComplianceWarning(null);
            }
        } else {
            setComplianceWarning(null);
        }
    }, [formData.staffId, staffCompliance, currentTenant]);

    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceData, setRecurrenceData] = useState({
        frequency: 'Weekly',
        daysOfWeek: [] as number[], // 1=Mon, 7=Sun
        endDate: ''
    });

    const toggleDay = (day: number) => {
        setRecurrenceData(prev => {
            const days = prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day];
            return { ...prev, daysOfWeek: days };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant) return;

        setLoading(true);
        setError(null);

        try {
            if (isRecurring) {
                // 1. Create Recurring Schedule
                if (recurrenceData.daysOfWeek.length === 0) throw new Error('Please select at least one day.');

                const { data: schedule, error: scheduleError } = await supabase
                    .from('recurring_schedules')
                    .insert({
                        tenant_id: currentTenant.id,
                        client_id: formData.clientId,
                        staff_id: formData.staffId || null,
                        visit_type: formData.visitType,
                        start_date: formData.date,
                        end_date: recurrenceData.endDate || null,
                        start_time: formData.startTime,
                        end_time: formData.endTime,
                        frequency: recurrenceData.frequency,
                        days_of_week: recurrenceData.daysOfWeek
                    })
                    .select()
                    .single();

                if (scheduleError) throw scheduleError;

                // 2. Generate Visits (e.g., for next 4 weeks)
                const generationEndDate = new Date();
                generationEndDate.setDate(generationEndDate.getDate() + 28); // 4 weeks ahead

                const { error: genError } = await supabase.rpc('generate_visits_from_schedule', {
                    p_schedule_id: schedule.id,
                    p_generation_end_date: generationEndDate.toISOString().split('T')[0]
                });

                if (genError) console.error('Generation warning:', genError); // Don't block success

            } else {
                // Normal Single Visit Insert
                const { error: insertError } = await supabase
                    .from('visits')
                    .insert({
                        tenant_id: currentTenant.id,
                        client_id: formData.clientId,
                        staff_id: formData.staffId || null,
                        date: formData.date,
                        start_time: formData.startTime,
                        end_time: formData.endTime,
                        visit_type: formData.visitType,
                        status: 'Scheduled'
                    });

                if (insertError) throw insertError;
            }

            onShiftCreated();
            onClose();
            // Reset form
            setFormData({
                clientId: '',
                staffId: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '10:00',
                visitType: 'Personal Care'
            });
            setIsRecurring(false);
            setRecurrenceData({ frequency: 'Weekly', daysOfWeek: [], endDate: '' });

        } catch (err: any) {
            console.error('Create shift error:', err);
            if (err.message?.includes('Compliance Block')) {
                setError(err.message);
            } else {
                setError(err.message || 'Failed to create shift.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        Create New Shift
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {conflictWarning && !isRecurring && (
                            <div className="p-3 text-sm text-orange-600 bg-orange-50 rounded-lg border border-orange-100 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{conflictWarning}</span>
                            </div>
                        )}

                        {complianceWarning && (
                            <div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <span className="font-medium">Compliance Warning</span>
                                    <p className="whitespace-pre-line text-xs mt-1">{complianceWarning}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                            >
                                <option value="">Select a client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date (Start)</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={formData.visitType}
                                    onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                                >
                                    <option>Personal Care</option>
                                    <option>Domestic</option>
                                    <option>Social</option>
                                    <option>Medication</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign Staff <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <select
                                value={formData.staffId}
                                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                            >
                                <option value="">Unassigned</option>
                                {staffList.map(s => {
                                    const compliance = staffCompliance.get(s.id);
                                    const isCompliant = compliance?.isCompliant !== false;
                                    const complianceLabel = compliance
                                        ? (isCompliant ? '✓' : '⚠️')
                                        : '';
                                    return (
                                        <option
                                            key={s.id}
                                            value={s.id}
                                            className={!isCompliant ? 'text-amber-600' : ''}
                                        >
                                            {complianceLabel} {s.first_name} {s.last_name}
                                            {compliance && !isCompliant ? ` (${compliance.compliancePercentage}% compliant)` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Recurrence Toggle */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                                />
                                <label htmlFor="recurring" className="text-sm font-medium text-gray-900">Repeat this shift?</label>
                            </div>

                            {isRecurring && (
                                <div className="bg-slate-50 p-4 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                                        <select
                                            value={recurrenceData.frequency}
                                            onChange={(e) => setRecurrenceData({ ...recurrenceData, frequency: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        >
                                            <option>Weekly</option>
                                            <option>BiWeekly</option>
                                            <option>Daily</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Days</label>
                                        <div className="flex gap-2">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                const dayNum = i + 1;
                                                const isSelected = recurrenceData.daysOfWeek.includes(dayNum);
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => toggleDay(dayNum)}
                                                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors
                                                            ${isSelected ? 'bg-cyan-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={recurrenceData.endDate}
                                            onChange={(e) => setRecurrenceData({ ...recurrenceData, endDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!!conflictWarning && !isRecurring) || !!complianceWarning}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                                {isRecurring ? 'Create Schedule' : 'Create Shift'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
