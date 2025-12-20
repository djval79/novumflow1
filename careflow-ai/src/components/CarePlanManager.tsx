import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../context/TenantContext';
import { X, Plus, Trash2, Save, FileText, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
    id: string;
    label: string;
}

interface CarePlan {
    id: string;
    summary: string;
    tasks: Task[];
}

interface CarePlanManagerProps {
    clientId: string;
    clientName: string;
    onClose: () => void;
}

export default function CarePlanManager({ clientId, clientName, onClose }: CarePlanManagerProps) {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [carePlan, setCarePlan] = useState<CarePlan | null>(null);

    // Form State
    const [summary, setSummary] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskLabel, setNewTaskLabel] = useState('');

    useEffect(() => {
        if (currentTenant && clientId) {
            fetchCarePlan();
        }
    }, [currentTenant, clientId]);

    const fetchCarePlan = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('care_plans')
                .select('*')
                .eq('tenant_id', currentTenant!.id)
                .eq('client_id', clientId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setCarePlan(data);
                setSummary(data.summary || '');
                setTasks(data.tasks || []);
            } else {
                // No plan yet
                setCarePlan(null);
                setSummary('');
                setTasks([]);
            }
        } catch (error) {
            toast.error('Failed to fetch care plan');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = () => {
        if (!newTaskLabel.trim()) return;
        const newTask: Task = {
            id: crypto.randomUUID(),
            label: newTaskLabel.trim()
        };
        setTasks([...tasks, newTask]);
        setNewTaskLabel('');
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleSave = async () => {
        if (!currentTenant) return;
        setSaving(true);
        try {
            const payload = {
                tenant_id: currentTenant.id,
                client_id: clientId,
                summary,
                tasks
            };

            const { error } = await supabase
                .from('care_plans')
                .upsert(payload, { onConflict: 'client_id' });

            if (error) throw error;

            // Refresh to get ID if it was new
            await fetchCarePlan();
            toast.success('Care Plan saved successfully!');
        } catch (error) {
            toast.error('Failed to save care plan.');
        } finally {
            setSaving(false);
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
                            <FileText className="text-primary-600" />
                            Care Plan: {clientName}
                        </h2>
                        <p className="text-sm text-slate-500">Manage default tasks and care instructions.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading Care Plan...</div>
                    ) : (
                        <>
                            {/* Summary Section */}
                            <section>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    General Care Summary
                                </label>
                                <textarea
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    placeholder="e.g. Client prefers tea with 2 sugars. Requires assistance with mobility."
                                    className="w-full p-3 border border-slate-300 rounded-lg h-32 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                />
                            </section>

                            {/* Tasks Section */}
                            <section>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <CheckSquare size={16} />
                                    Routine Tasks (Auto-populated on Visits)
                                </label>

                                <div className="space-y-3 mb-4">
                                    {tasks.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic p-4 bg-slate-50 rounded-lg text-center border border-dashed border-slate-200">
                                            No tasks defined. Add tasks below.
                                        </p>
                                    ) : (
                                        tasks.map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-primary-200 transition-colors">
                                                <span className="text-slate-700 font-medium">{task.label}</span>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Task Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTaskLabel}
                                        onChange={(e) => setNewTaskLabel(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                        placeholder="Add a new task (e.g. 'Morning Medication')"
                                        className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <button
                                        onClick={handleAddTask}
                                        disabled={!newTaskLabel.trim()}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        {saving ? 'Saving...' : <><Save size={18} /> Save Plan</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
