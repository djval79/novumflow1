
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { Pill, Check, X, AlertCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
                .from('careflow_medications')
                .select('*')
                .eq('tenant_id', currentTenant!.id)
                .eq('client_id', clientId)
                .eq('status', 'Active');

            if (medsError) throw medsError;

            // Fetch Logs for this Visit
            const { data: logData, error: logError } = await supabase
                .from('careflow_medication_administrations')
                .select('*')
                .eq('tenant_id', currentTenant!.id)
                .eq('visit_id', visitId);

            if (logError) throw logError;

            // Map DB fields to component state
            setMedications(meds || []);
            setLogs(logData?.map((l: any) => ({
                id: l.id,
                medication_id: l.medication_id,
                status: l.status,
                notes: l.notes,
                administered_at: l.administered_at
            })) || []);
        } catch (error) {
            toast.error('Failed to load eMAR clinical data');
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
            // Check if already logged
            const existing = logs.find(l => l.medication_id === medId);
            if (existing) {
                toast.warning('Medication already logged for this session');
                return;
            }

            // Get current user (staff)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication failure');

            const { data: emp, error: staffError } = await supabase
                .from('careflow_staff')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (staffError) {
                toast.error('Staff verification failed');
                throw staffError;
            }
            if (!emp) {
                toast.error('Employee profile synchronization error');
                throw new Error('Employee profile not found');
            }

            const { data: newLog, error } = await supabase
                .from('careflow_medication_administrations')
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

            toast.success('Clinical record updated', {
                description: `Successfully logged as ${status}`
            });

            setLogs([...logs, {
                id: newLog.id,
                medication_id: newLog.medication_id,
                status: newLog.status,
                notes: newLog.notes,
                administered_at: newLog.administered_at
            }]);
        } catch (error) {
            toast.error('Failed to update eMAR record');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
            <p className="font-black uppercase tracking-widest text-[10px]">Synchronizing Clinical Data...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                    <Pill size={24} className="text-primary-600" />
                    Clinical <span className="text-slate-400">eMAR</span>
                </h3>
                <span className="text-[10px] font-black text-slate-600 bg-slate-200 px-4 py-2 rounded-xl uppercase tracking-widest">
                    {logs.length} / {medications.length} Authenticated
                </span>
            </div>

            <div className="p-8 space-y-6">
                {medications.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active medications registered</p>
                    </div>
                ) : (
                    medications.map(med => {
                        const log = logs.find(l => l.medication_id === med.id);
                        const isLogged = !!log;

                        return (
                            <div key={med.id} className={`p-6 rounded-[1.5rem] border-2 transition-all ${isLogged ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-slate-100 hover:border-primary-100 hover:shadow-xl'}`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h4 className="font-black text-slate-900 text-xl tracking-tight">{med.name}</h4>
                                        <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg">{med.dosage}</span>
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg">{med.frequency}</span>
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg">Route: {med.route}</span>
                                        </div>
                                    </div>
                                    {isLogged && (
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-2
                                            ${log.status === 'Administered' ? 'bg-green-50 text-green-700 border-green-100' :
                                                log.status === 'Refused' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {log.status === 'Administered' ? <Check size={14} /> : <AlertCircle size={14} />}
                                            {log.status}
                                        </div>
                                    )}
                                </div>

                                {!isLogged && !isReadOnly && (
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => handleLog(med.id, 'Administered')}
                                            disabled={!!processingId}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 flex justify-center items-center gap-3 shadow-xl active:scale-95 transition-all"
                                        >
                                            {processingId === med.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                            Confirm Administration
                                        </button>
                                        <button
                                            onClick={() => handleLog(med.id, 'Omitted')}
                                            disabled={!!processingId}
                                            className="px-6 py-4 bg-amber-50 text-amber-700 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 border border-amber-100 transition-all"
                                        >
                                            Omit
                                        </button>
                                        <button
                                            onClick={() => handleLog(med.id, 'Refused')}
                                            disabled={!!processingId}
                                            className="px-6 py-4 bg-rose-50 text-rose-700 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 border border-rose-100 transition-all"
                                        >
                                            Refuse
                                        </button>
                                    </div>
                                )}

                                {isLogged && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        {log.notes && (
                                            <p className="text-xs text-slate-500 font-bold italic bg-white p-3 rounded-xl border border-slate-100">
                                                Clinical Note: {log.notes}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={12} /> Authenticated at {new Date(log.administered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            <div className="px-8 py-5 bg-slate-900/5 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    Authorized Electronic Medication Administration Record / CareFlow AI Signature Platform
                </p>
            </div>
        </div>
    );
}
