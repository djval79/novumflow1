import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Circle, Clock, User, ChevronDown, ChevronUp, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Toast from './Toast';

interface OnboardingChecklistManagerProps {
    employeeId: string;
    employeeName: string;
    onClose?: () => void;
}

interface ChecklistItem {
    id: string;
    task_name: string;
    task_order: number;
    is_completed: boolean;
    completed_at: string | null;
    completed_by: string | null;
    notes: string | null;
    due_date: string | null;
}

interface EmployeeChecklist {
    id: string;
    template_name: string;
    status: string;
    assigned_at: string;
    completed_at: string | null;
    due_date: string | null;
    items: ChecklistItem[];
}

export default function OnboardingChecklistManager({ employeeId, employeeName, onClose }: OnboardingChecklistManagerProps) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [checklists, setChecklists] = useState<EmployeeChecklist[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadChecklists();
        loadTemplates();
    }, [employeeId]);

    async function loadChecklists() {
        if (!employeeId) return;
        setLoading(true);

        const { data: checklistData, error } = await supabase
            .from('employee_onboarding_checklists')
            .select('*')
            .eq('employee_id', employeeId)
            .order('assigned_at', { ascending: false });

        if (error) {
            console.error('Error loading checklists:', error);
            setLoading(false);
            return;
        }

        // Load items for each checklist
        const checklistsWithItems: EmployeeChecklist[] = [];
        for (const checklist of checklistData || []) {
            const { data: items } = await supabase
                .from('onboarding_checklist_items')
                .select('*')
                .eq('checklist_id', checklist.id)
                .order('task_order');

            checklistsWithItems.push({
                ...checklist,
                items: items || []
            });
        }

        setChecklists(checklistsWithItems);
        if (checklistsWithItems.length > 0) {
            setExpandedChecklist(checklistsWithItems[0].id);
        }
        setLoading(false);
    }

    async function loadTemplates() {
        if (!currentTenant) return;

        const { data } = await supabase
            .from('onboarding_checklist_templates')
            .select('*')
            .eq('tenant_id', currentTenant.id);

        setTemplates(data || []);
    }

    async function assignChecklist() {
        if (!selectedTemplateId || !currentTenant || !user || isAssigning) return;
        setIsAssigning(true);

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        // Create the checklist assignment
        const { data: newChecklist, error: checklistError } = await supabase
            .from('employee_onboarding_checklists')
            .insert({
                employee_id: employeeId,
                template_id: template.id,
                template_name: template.name,
                tenant_id: currentTenant.id,
                status: 'not_started',
                assigned_by: user.id,
                due_date: dueDate || null
            })
            .select()
            .single();

        if (checklistError) {
            setToast({ message: 'Failed to assign checklist', type: 'error' });
            return;
        }

        // Create individual items from template tasks
        const items = template.tasks.map((task: string, index: number) => ({
            checklist_id: newChecklist.id,
            task_name: task,
            task_order: index,
            is_completed: false
        }));

        const { error: itemsError } = await supabase
            .from('onboarding_checklist_items')
            .insert(items);

        if (itemsError) {
            setToast({ message: 'Checklist assigned but failed to create items', type: 'error' });
        } else {
            setToast({ message: 'Onboarding checklist assigned successfully!', type: 'success' });
        }

        setIsAssigning(false);
        setShowAssignModal(false);
        setSelectedTemplateId('');
        setDueDate('');
        loadChecklists();
    }

    async function toggleItemCompletion(checklistId: string, itemId: string, currentState: boolean) {
        if (isToggling) return;
        setIsToggling(itemId);
        try {
            const { error } = await supabase
                .from('onboarding_checklist_items')
                .update({
                    is_completed: !currentState,
                    completed_at: !currentState ? new Date().toISOString() : null,
                    completed_by: !currentState ? user?.id : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', itemId);

            if (error) {
                setToast({ message: 'Failed to update item', type: 'error' });
            } else {
                // Update local state immediately for responsiveness
                setChecklists(prev => prev.map(cl => {
                    if (cl.id === checklistId) {
                        return {
                            ...cl,
                            items: cl.items.map(item =>
                                item.id === itemId
                                    ? { ...item, is_completed: !currentState, completed_at: !currentState ? new Date().toISOString() : null }
                                    : item
                            )
                        };
                    }
                    return cl;
                }));

                // Reload to get updated status from trigger
                setTimeout(() => loadChecklists(), 500);
            }
        } catch (error) {
            console.error('Error updating item:', error);
            setToast({ message: 'Error updating item', type: 'error' });
        } finally {
            setIsToggling(null);
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getProgressPercentage(items: ChecklistItem[]) {
        if (items.length === 0) return 0;
        const completed = items.filter(i => i.is_completed).length;
        return Math.round((completed / items.length) * 100);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{employeeName}</h3>
                        <p className="text-sm text-gray-500">Onboarding Progress</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Checklist
                </button>
            </div>

            {/* Checklists */}
            {checklists.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No onboarding checklists assigned</p>
                    <p className="text-sm text-gray-400 mt-1">Assign a checklist template to get started</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {checklists.map((checklist) => {
                        const progress = getProgressPercentage(checklist.items);
                        const isExpanded = expandedChecklist === checklist.id;

                        return (
                            <div key={checklist.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                {/* Checklist Header */}
                                <div
                                    onClick={() => setExpandedChecklist(isExpanded ? null : checklist.id)}
                                    className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{checklist.template_name}</h4>
                                            <p className="text-sm text-gray-500">
                                                Assigned {format(new Date(checklist.assigned_at), 'MMM dd, yyyy')}
                                                {checklist.due_date && (
                                                    <span className="ml-2">• Due {format(new Date(checklist.due_date), 'MMM dd')}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        {/* Progress Bar */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 w-12">{progress}%</span>
                                        </div>
                                        {/* Status Badge */}
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(checklist.status)}`}>
                                            {checklist.status.replace('_', ' ')}
                                        </span>
                                        {/* Expand Icon */}
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Checklist Items */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                        <div className="space-y-2">
                                            {checklist.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleItemCompletion(checklist.id, item.id, item.is_completed)}
                                                    className={`flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer transition hover:shadow-sm ${item.is_completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        {isToggling === item.id ? (
                                                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                        ) : item.is_completed ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-gray-400" />
                                                        )}
                                                        <span className={`text-sm ${item.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                            {item.task_name}
                                                        </span>
                                                    </div>
                                                    {item.completed_at && (
                                                        <span className="text-xs text-gray-400">
                                                            {format(new Date(item.completed_at), 'MMM dd, HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Assign Onboarding Checklist</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Choose a template...</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.name} ({template.tasks?.length || 0} tasks)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={assignChecklist}
                                disabled={!selectedTemplateId}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// Compact widget for employee table row
export function OnboardingProgressBadge({ employeeId }: { employeeId: string }) {
    const [progress, setProgress] = useState<{ total: number; completed: number; status: string } | null>(null);

    useEffect(() => {
        loadProgress();
    }, [employeeId]);

    async function loadProgress() {
        const { data: checklists } = await supabase
            .from('employee_onboarding_checklists')
            .select('id, status')
            .eq('employee_id', employeeId)
            .not('status', 'eq', 'cancelled')
            .order('assigned_at', { ascending: false })
            .limit(1);

        if (!checklists || checklists.length === 0) {
            setProgress(null);
            return;
        }

        const checklist = checklists[0];
        const { data: items } = await supabase
            .from('onboarding_checklist_items')
            .select('is_completed')
            .eq('checklist_id', checklist.id);

        if (items) {
            setProgress({
                total: items.length,
                completed: items.filter(i => i.is_completed).length,
                status: checklist.status
            });
        }
    }

    if (!progress) return null;

    const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    return (
        <div className="flex items-center space-x-2" title={`Onboarding: ${progress.completed}/${progress.total} tasks`}>
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div
                    className={`h-1.5 rounded-full ${percent === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
            <span className="text-xs text-gray-500">{percent}%</span>
        </div>
    );
}
