
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Pill, Check, X, AlertCircle, Loader2, Clock } from 'lucide-react';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
}

interface MedicationLogEntry {
    id: string;
    medication_id: string;
    status: 'Administered' | 'Refused' | 'Omitted';
    notes?: string;
    administered_at: string;
}

interface MedicationLogProps {
    visitId: string;
    clientId: string;
    isReadOnly: boolean;
}

export default function MedicationLog({ visitId, clientId, isReadOnly }: MedicationLogProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [logs, setLogs] = useState<MedicationLogEntry[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (currentTenant && clientId && visitId) {
            fetchData();
        }
    }, [currentTenant, clientId, visitId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Active Medications
            const { data: meds, error: medsError } = await supabase
                .from('medications')
                .select('*')
                .eq('tenant_id', currentTenant!.id)
                .eq('client_id', clientId)
                .eq('status', 'Active');

            if (medsError) throw medsError;

            // Fetch Logs for this Visit
            const { data: logData, error: logError } = await supabase
                .from('medication_logs')
                .select('*')
                .eq('tenant_id', currentTenant!.id)
                .eq('visit_id', visitId);

            if (logError) throw logError;

            setMedications(meds || []);
            setLogs(logData || []);
        } catch (error) {
            console.error('Error fetching eMAR data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLog = async (medId: string, status: 'Administered' | 'Refused' | 'Omitted') => {
        if (isReadOnly || !currentTenant) return;

        let notes = '';
        if (status !== 'Administered') {
            notes = prompt('Please provide a reason (optional):') || '';
        }

        setProcessingId(medId);
        try {
            // Check if already logged (prevent duplicates if clicked fast)
            const existing = logs.find(l => l.medication_id === medId);
            if (existing) {
                alert('Already logged.');
                return;
            }

            // Get current user (staff)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // We need the employee ID. For now assuming user.id maps to employee.id or we fetch it.
            // In this app, auth.uid() is usually the employee id if we set it up that way, 
            // OR we need to lookup employee by auth_id. 
            // For MVP, let's assume we can get the employee ID from the session or context.
            // Actually, let's look it up.
            const { data: emp } = await supabase.from('employees').select('id').eq('email', user.email).single();
            if (!emp) throw new Error('Employee profile not found');

            const { data: newLog, error } = await supabase
                .from('medication_logs')
                .insert({
                    tenant_id: currentTenant.id,
                    visit_id: visitId,
                    medication_id: medId,
                    status,
                    notes,
                    administered_by: emp.id,
                    administered_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            setLogs([...logs, newLog]);
        } catch (error) {
            console.error('Error logging medication:', error);
            alert('Failed to log medication.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-4 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /> Loading eMAR...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Pill size={20} className="text-primary-600" />
                    Medication (eMAR)
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">
                    {logs.length}/{medications.length} Logged
                </span>
            </div>

            <div className="p-6 space-y-4">
                {medications.length === 0 ? (
                    <p className="text-slate-400 text-sm italic text-center">No active medications for this client.</p>
                ) : (
                    medications.map(med => {
                        const log = logs.find(l => l.medication_id === med.id);
                        const isLogged = !!log;

                        return (
                            <div key={med.id} className={`p-4 rounded-xl border transition-all ${isLogged ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-primary-200'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{med.name} <span className="text-slate-500 font-normal">({med.dosage})</span></h4>
                                        <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{med.frequency}</span>
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{med.route}</span>
                                        </div>
                                    </div>
                                    {isLogged && (
                                        <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1
                                            ${log.status === 'Administered' ? 'bg-green-100 text-green-700' :
                                                log.status === 'Refused' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {log.status === 'Administered' ? <Check size={12} /> : <AlertCircle size={12} />}
                                            {log.status}
                                        </div>
                                    )}
                                </div>

                                {!isLogged && !isReadOnly && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleLog(med.id, 'Administered')}
                                            disabled={!!processingId}
                                            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
                                        >
                                            {processingId === med.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                            Administer
                                        </button>
                                        <button
                                            onClick={() => handleLog(med.id, 'Omitted')}
                                            disabled={!!processingId}
                                            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 disabled:opacity-50"
                                            title="Omit (Not needed)"
                                        >
                                            Omit
                                        </button>
                                        <button
                                            onClick={() => handleLog(med.id, 'Refused')}
                                            disabled={!!processingId}
                                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                                            title="Refused by Client"
                                        >
                                            Refuse
                                        </button>
                                    </div>
                                )}

                                {isLogged && log.notes && (
                                    <p className="text-xs text-slate-500 mt-2 italic border-t border-slate-200 pt-2">
                                        Note: {log.notes}
                                    </p>
                                )}
                                {isLogged && (
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <Clock size={10} /> {new Date(log.administered_at).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
