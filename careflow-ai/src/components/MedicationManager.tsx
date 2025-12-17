
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { X, Plus, Trash2, Save, Pill, Activity, AlertCircle } from 'lucide-react';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    status: 'Active' | 'Discontinued';
}

interface MedicationManagerProps {
    clientId: string;
    clientName: string;
    onClose: () => void;
}

export default function MedicationManager({ clientId, clientName, onClose }: MedicationManagerProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [medications, setMedications] = useState<Medication[]>([]);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: 'Morning',
        route: 'Oral'
    });

    useEffect(() => {
        if (currentTenant && clientId) {
            fetchMedications();
        }
    }, [currentTenant, clientId]);

    const fetchMedications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('tenant_id', currentTenant!.id)
                .eq('client_id', clientId)
                .eq('status', 'Active') // Only show active by default
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMedications(data || []);
        } catch (error) {
            console.error('Error fetching medications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = async () => {
        if (!newMed.name || !currentTenant) return;

        try {
            const { error } = await supabase
                .from('medications')
                .insert({
                    tenant_id: currentTenant.id,
                    client_id: clientId,
                    name: newMed.name,
                    dosage: newMed.dosage,
                    frequency: newMed.frequency,
                    route: newMed.route,
                    status: 'Active'
                });

            if (error) throw error;

            await fetchMedications();
            setIsAdding(false);
            setNewMed({ name: '', dosage: '', frequency: 'Morning', route: 'Oral' });
        } catch (error) {
            console.error('Error adding medication:', error);
            alert('Failed to add medication.');
        }
    };

    const handleDiscontinue = async (id: string) => {
        if (!confirm('Are you sure you want to discontinue this medication?')) return;

        try {
            const { error } = await supabase
                .from('medications')
                .update({ status: 'Discontinued' })
                .eq('id', id);

            if (error) throw error;
            await fetchMedications();
        } catch (error) {
            console.error('Error discontinuing medication:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Pill className="text-primary-600" />
                            Medications: {clientName}
                        </h2>
                        <p className="text-sm text-slate-500">Manage active prescriptions.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Add New Section */}
                    {isAdding ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-in slide-in-from-top-2">
                            <h3 className="font-bold text-slate-700">Add New Medication</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newMed.name}
                                        onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        placeholder="e.g. Paracetamol"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Dosage</label>
                                    <input
                                        type="text"
                                        value={newMed.dosage}
                                        onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                        placeholder="e.g. 500mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Frequency</label>
                                    <select
                                        value={newMed.frequency}
                                        onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    >
                                        <option>Morning</option>
                                        <option>Lunch</option>
                                        <option>Evening</option>
                                        <option>Bedtime</option>
                                        <option>Twice Daily</option>
                                        <option>Three Times Daily</option>
                                        <option>Four Times Daily</option>
                                        <option>As Needed (PRN)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Route</label>
                                    <select
                                        value={newMed.route}
                                        onChange={e => setNewMed({ ...newMed, route: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    >
                                        <option>Oral</option>
                                        <option>Topical</option>
                                        <option>Inhale</option>
                                        <option>Injection</option>
                                        <option>Drops</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMedication}
                                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700"
                                >
                                    Save Medication
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Add New Medication
                        </button>
                    )}

                    {/* List */}
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Loading medications...</div>
                    ) : medications.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Activity size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No active medications.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {medications.map(med => (
                                <div key={med.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-200 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Pill size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{med.name} <span className="text-slate-400 font-normal text-sm">({med.dosage})</span></h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{med.frequency}</span>
                                                <span>{med.route}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDiscontinue(med.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        title="Discontinue"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
