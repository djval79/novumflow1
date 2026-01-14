import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import {
    CheckCircle, Circle, Clock, User, FileText, Shield,
    GraduationCap, CreditCard, Building, Key, Laptop,
    ChevronRight, Plus, Edit2, Trash2, Save, X
} from 'lucide-react';
import Toast from './Toast';

interface ChecklistItem {
    id: string;
    title: string;
    description?: string;
    category: string;
    is_required: boolean;
    is_completed: boolean;
    completed_at?: string;
    completed_by?: string;
    due_days?: number;
    order: number;
}

interface OnboardingProgress {
    employee_id: string;
    employee_name: string;
    start_date: string;
    items: ChecklistItem[];
    progress: number;
}

const defaultChecklistItems: Omit<ChecklistItem, 'id' | 'is_completed' | 'completed_at' | 'completed_by'>[] = [
    // Pre-arrival
    { title: 'Send offer letter', description: 'Send and receive signed offer letter', category: 'pre_arrival', is_required: true, due_days: -7, order: 1 },
    { title: 'Background check completed', description: 'DBS check processed', category: 'pre_arrival', is_required: true, due_days: -5, order: 2 },
    { title: 'Right to work verified', description: 'Passport/visa documentation verified', category: 'pre_arrival', is_required: true, due_days: -5, order: 3 },
    { title: 'References received', description: 'At least 2 professional references', category: 'pre_arrival', is_required: true, due_days: -3, order: 4 },
    { title: 'Contract signed', description: 'Employment contract signed and filed', category: 'pre_arrival', is_required: true, due_days: -1, order: 5 },

    // First day
    { title: 'Welcome meeting', description: 'Introduction meeting with manager', category: 'first_day', is_required: true, due_days: 0, order: 6 },
    { title: 'Office tour', description: 'Tour of facilities and introductions', category: 'first_day', is_required: false, due_days: 0, order: 7 },
    { title: 'IT setup complete', description: 'Laptop, email, and access credentials', category: 'first_day', is_required: true, due_days: 0, order: 8 },
    { title: 'ID badge issued', description: 'Photo ID and building access', category: 'first_day', is_required: true, due_days: 0, order: 9 },
    { title: 'Handbook provided', description: 'Employee handbook and policies', category: 'first_day', is_required: true, due_days: 0, order: 10 },

    // First week
    { title: 'Bank details collected', description: 'Payroll information submitted', category: 'first_week', is_required: true, due_days: 5, order: 11 },
    { title: 'Benefits enrollment', description: 'Health insurance and pension options', category: 'first_week', is_required: false, due_days: 5, order: 12 },
    { title: 'H&S induction', description: 'Health and Safety training completed', category: 'first_week', is_required: true, due_days: 5, order: 13 },
    { title: 'GDPR training', description: 'Data protection training', category: 'first_week', is_required: true, due_days: 5, order: 14 },
    { title: 'Team introduction', description: 'Meet the team and stakeholders', category: 'first_week', is_required: false, due_days: 5, order: 15 },

    // First month
    { title: 'Fire safety training', description: 'Fire evacuation and safety procedures', category: 'first_month', is_required: true, due_days: 30, order: 16 },
    { title: 'Role-specific training', description: 'Job-specific training completed', category: 'first_month', is_required: true, due_days: 30, order: 17 },
    { title: '30-day review', description: 'Check-in meeting with manager', category: 'first_month', is_required: true, due_days: 30, order: 18 },
    { title: 'Probation objectives set', description: 'Goals and KPIs agreed', category: 'first_month', is_required: true, due_days: 30, order: 19 },
];

export default function OnboardingChecklist({ employeeId, employeeName, startDate }: {
    employeeId?: string;
    employeeName?: string;
    startDate?: string;
}) {
    const { currentTenant } = useTenant();
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isToggling, setIsToggling] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>('first_day');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    useEffect(() => {
        loadChecklist();
    }, [employeeId, currentTenant]);

    async function loadChecklist() {
        if (!currentTenant || !employeeId) return;
        setLoading(true);
        try {
            // 1. Get or create the checklist header
            let { data: checklist, error: fetchError } = await supabase
                .from('employee_onboarding_checklists')
                .select('id')
                .eq('employee_id', employeeId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            let checklistId = checklist?.id;

            if (!checklistId) {
                // Create new checklist header
                const { data: newChecklist, error: createError } = await supabase
                    .from('employee_onboarding_checklists')
                    .insert({
                        employee_id: employeeId,
                        tenant_id: currentTenant.id,
                        template_name: 'Default Onboarding',
                        status: 'in_progress'
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                checklistId = newChecklist.id;

                // Seed default items
                const itemsToInsert = defaultChecklistItems.map(item => ({
                    checklist_id: checklistId,
                    task_name: item.title,
                    task_order: item.order,
                    is_completed: false,
                    notes: JSON.stringify({ category: item.category, is_required: item.is_required })
                }));

                const { error: seedError } = await supabase
                    .from('onboarding_checklist_items')
                    .insert(itemsToInsert);

                if (seedError) throw seedError;
            }

            // 2. Load latest items
            const { data: dbItems, error: itemsError } = await supabase
                .from('onboarding_checklist_items')
                .select('*')
                .eq('checklist_id', checklistId)
                .order('task_order');

            if (itemsError) throw itemsError;

            // Map DB items to UI items
            const mappedItems: ChecklistItem[] = dbItems.map(item => {
                let extra: any = {};
                try { extra = JSON.parse(item.notes || '{}'); } catch (e) { }
                return {
                    id: item.id,
                    title: item.task_name,
                    category: extra.category || 'other',
                    is_required: extra.is_required || false,
                    is_completed: item.is_completed,
                    completed_at: item.completed_at,
                    completed_by: item.completed_by,
                    order: item.task_order,
                    description: item.notes && !item.notes.startsWith('{') ? item.notes : ''
                };
            });

            setItems(mappedItems);
        } catch (error: any) {
            log.error('Error loading onboarding checklist', error, { component: 'OnboardingChecklist', action: 'loadChecklist', metadata: { employeeId } });
            setToast({ message: error.message || 'Failed to load checklist', type: 'error' });
            initializeDefaultItems();
        } finally {
            setLoading(false);
        }
    }

    function initializeDefaultItems() {
        const itemsWithIds: ChecklistItem[] = defaultChecklistItems.map((item, index) => ({
            ...item,
            id: `item-${index}`,
            is_completed: false,
        }));
        setItems(itemsWithIds);
    }

    async function toggleItem(itemId: string) {
        if (isToggling) return;
        const item = items.find(i => i.id === itemId);
        if (!item || item.id.startsWith('item-')) return; // Can't toggle mock items

        setIsToggling(itemId);
        const newStatus = !item.is_completed;
        const completedAt = newStatus ? new Date().toISOString() : null;

        try {
            const { error } = await supabase
                .from('onboarding_checklist_items')
                .update({
                    is_completed: newStatus,
                    completed_at: completedAt
                })
                .eq('id', itemId);

            if (error) throw error;

            setItems(prev => prev.map(i => i.id === itemId ? {
                ...i,
                is_completed: newStatus,
                completed_at: completedAt || undefined
            } : i));

            setToast({
                message: `Task "${item.title}" ${newStatus ? 'completed' : 'unmarked'}`,
                type: 'success'
            });
        } catch (error: any) {
            log.error('Error toggling task', error, { itemId });
            setToast({ message: 'Failed to update task', type: 'error' });
        } finally {
            setIsToggling(null);
        }
    }

    function getCategoryIcon(category: string) {
        switch (category) {
            case 'pre_arrival': return <FileText className="w-5 h-5" />;
            case 'first_day': return <Building className="w-5 h-5" />;
            case 'first_week': return <GraduationCap className="w-5 h-5" />;
            case 'first_month': return <Shield className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    }

    function getCategoryLabel(category: string) {
        switch (category) {
            case 'pre_arrival': return 'Pre-Arrival';
            case 'first_day': return 'First Day';
            case 'first_week': return 'First Week';
            case 'first_month': return 'First Month';
            default: return category;
        }
    }

    function getCategoryColor(category: string) {
        switch (category) {
            case 'pre_arrival': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'first_day': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'first_week': return 'bg-green-100 text-green-700 border-green-200';
            case 'first_month': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    }

    const categories = ['pre_arrival', 'first_day', 'first_week', 'first_month'];

    const categoryProgress = categories.reduce((acc, cat) => {
        const catItems = items.filter(i => i.category === cat);
        const completed = catItems.filter(i => i.is_completed).length;
        acc[cat] = {
            total: catItems.length,
            completed,
            percentage: catItems.length > 0 ? Math.round((completed / catItems.length) * 100) : 0
        };
        return acc;
    }, {} as Record<string, { total: number; completed: number; percentage: number }>);

    const overallProgress = items.length > 0
        ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100)
        : 0;

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Onboarding Checklist</h2>
                        {employeeName && (
                            <p className="text-indigo-200 text-sm flex items-center mt-1">
                                <User className="w-4 h-4 mr-1" />
                                {employeeName}
                                {startDate && ` • Started ${new Date(startDate).toLocaleDateString()}`}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{overallProgress}%</p>
                        <p className="text-sm text-indigo-200">Complete</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="divide-y divide-gray-100">
                {categories.map(category => {
                    const catItems = items.filter(i => i.category === category);
                    const isExpanded = expandedCategory === category;
                    const progress = categoryProgress[category];

                    return (
                        <div key={category}>
                            {/* Category Header */}
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                                className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition ${isExpanded ? 'bg-gray-50' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                                        {getCategoryIcon(category)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{getCategoryLabel(category)}</p>
                                        <p className="text-sm text-gray-500">
                                            {progress.completed} of {progress.total} tasks complete
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 w-10">
                                        {progress.percentage}%
                                    </span>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>
                            </button>

                            {/* Category Items */}
                            {isExpanded && (
                                <div className="px-6 pb-4 space-y-2">
                                    {catItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={`flex items-start p-3 rounded-lg border transition ${item.is_completed
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleItem(item.id)}
                                                disabled={isToggling === item.id}
                                                className="flex-shrink-0 mt-0.5 disabled:opacity-50"
                                            >
                                                {isToggling === item.id ? (
                                                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                ) : item.is_completed ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                                                )}
                                            </button>
                                            <div className="ml-3 flex-1">
                                                <p className={`text-sm font-medium ${item.is_completed ? 'text-green-700 line-through' : 'text-gray-900'
                                                    }`}>
                                                    {item.title}
                                                    {item.is_required && (
                                                        <span className="ml-2 text-xs text-red-500">Required</span>
                                                    )}
                                                </p>
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                                )}
                                                {item.completed_at && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Completed {new Date(item.completed_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex space-x-6">
                        <span className="text-gray-600">
                            <strong className="text-gray-900">{items.filter(i => i.is_completed).length}</strong> completed
                        </span>
                        <span className="text-gray-600">
                            <strong className="text-gray-900">{items.filter(i => !i.is_completed && i.is_required).length}</strong> required remaining
                        </span>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Print Checklist
                    </button>
                </div>
            </div>

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
