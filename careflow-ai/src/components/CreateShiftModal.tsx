
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { X, Calendar, Clock, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import complianceCheckService, { ComplianceStatus } from '@/services/ComplianceCheckService';
import { toast } from 'sonner';

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

        try {
            // Fetch Clients
            const { data: clientsData } = await supabase
                .from('careflow_clients')
                .select('id, name')
                .eq('tenant_id', currentTenant.id);
            // .eq('status', 'Active'); // Removed status check for now as it might differ

            setClients(clientsData || []);

            // Fetch Staff - using careflow_staff table
            const { data: staffData } = await supabase
                .from('careflow_staff')
                .select('id, full_name')
                .eq('tenant_id', currentTenant.id)
                .eq('status', 'Active');

            if (staffData) {
                setStaffList(staffData.map((s: any) => ({
                    id: s.id,
                    first_name: s.full_name?.split(' ')[0] || '',
                    last_name: s.full_name?.split(' ').slice(1).join(' ') || '',
                })));
            } else {
                setStaffList([]);
            }

            // Fetch compliance data for all staff
            const complianceMap = await complianceCheckService.checkAllStaffCompliance(currentTenant.id);
            setStaffCompliance(complianceMap);
        } catch (error) {
            toast.error('Failed to load form options');
        }
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
            toast.warning('Staff scheduling conflict detected');
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

    // Check compliance and blocking status
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        if (formData.staffId && currentTenant) {
            const compliance = staffCompliance.get(formData.staffId);
            const settings = currentTenant.settings || {};
            const disabledFeatures = settings.disabled_features || [];

            // Default: Locking is ENABLED unless explicitly disabled
            const shouldBlockRtw = !disabledFeatures.includes('block_rtw');
            const shouldBlockDbs = !disabledFeatures.includes('block_dbs');

            if (compliance && !compliance.isCompliant) {
                let warning = 'Warning: This staff member has compliance issues:\n';
                let blockingIssueFound = false;

                if (compliance.rtw_status !== 'valid') {
                    warning += '• Right to Work not verified\n';
                    if (shouldBlockRtw) blockingIssueFound = true;
                }
                if (compliance.dbs_status !== 'valid') {
                    warning += '• DBS check not current\n';
                    if (shouldBlockDbs) blockingIssueFound = true;
                }
                if (compliance.missingDocuments.length > 0) {
                    warning += `• Missing: ${compliance.missingDocuments.join(', ')}\n`;
                    // Document blocking logic can be added here if needed
                }

                setComplianceWarning(warning.trim());
                setIsBlocked(blockingIssueFound);
            } else {
                setComplianceWarning(null);
                setIsBlocked(false);
            }
        } else {
            setComplianceWarning(null);
            setIsBlocked(false);
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

                if (genError) console.warn('Generation warning:', genError); // Don't block success

                toast.success('Recurring schedule created successfully');
            } else {
                // Normal Single Visit Insert
                const { error: insertError } = await supabase
                    .from('careflow_visits')
                    .insert({
                        tenant_id: currentTenant.id,
                        client_id: formData.clientId,
                        staff_id: formData.staffId || null,
                        scheduled_date: formData.date,
                        scheduled_start: formData.startTime,
                        scheduled_end: formData.endTime,
                        visit_type: formData.visitType,
                        status: 'Scheduled'
                    });

                if (insertError) throw insertError;
                toast.success('Shift created successfully');
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
            const msg = err.message || 'Failed to create shift.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        Create New Shift
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {conflictWarning && !isRecurring && (
                            <div className="p-3 text-sm text-orange-700 bg-orange-50 rounded-xl border border-orange-200 flex items-start gap-2 animate-in slide-in-from-top-1">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span className="font-medium">{conflictWarning}</span>
                            </div>
                        )}

                        {complianceWarning && (
                            <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 animate-in slide-in-from-top-1">
                                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <span className="font-bold">Compliance Warning</span>
                                    <p className="whitespace-pre-line text-xs mt-1 font-medium">{complianceWarning}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Client</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                            >
                                <option value="">Select a client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Type</label>
                                <select
                                    value={formData.visitType}
                                    onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
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
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">End Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Assign Staff <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                            </label>
                            <select
                                value={formData.staffId}
                                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
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
                        <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-5 h-5 text-cyan-600 rounded-lg border-gray-300 focus:ring-cyan-500 transition-all cursor-pointer"
                                />
                                <span className="text-sm font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">Repeat this shift?</span>
                            </label>

                            {isRecurring && (
                                <div className="mt-4 bg-slate-50/80 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Frequency</label>
                                        <select
                                            value={recurrenceData.frequency}
                                            onChange={(e) => setRecurrenceData({ ...recurrenceData, frequency: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-cyan-500 transition-all"
                                        >
                                            <option>Weekly</option>
                                            <option>BiWeekly</option>
                                            <option>Daily</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Days</label>
                                        <div className="flex justify-between">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                const dayNum = i + 1;
                                                const isSelected = recurrenceData.daysOfWeek.includes(dayNum);
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => toggleDay(dayNum)}
                                                        className={`w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center transition-all
                                                            ${isSelected
                                                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200 scale-110'
                                                                : 'bg-white border border-gray-200 text-gray-500 hover:border-cyan-300'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={recurrenceData.endDate}
                                            onChange={(e) => setRecurrenceData({ ...recurrenceData, endDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-cyan-500 transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (!!conflictWarning && !isRecurring) || isBlocked}
                                className="flex items-center gap-2 px-8 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                                {isRecurring ? 'Create Schedule' : 'Create Shift'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
