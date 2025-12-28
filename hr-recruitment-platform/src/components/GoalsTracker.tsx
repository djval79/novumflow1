import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import {
    Target, CheckCircle, Circle, Plus, ChevronDown, ChevronRight,
    Calendar, User, TrendingUp, Edit2, Trash2, MoreHorizontal, X
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

interface Goal {
    id: string;
    title: string;
    description?: string;
    category: 'personal' | 'team' | 'company';
    status: 'not_started' | 'in_progress' | 'completed' | 'at_risk';
    progress: number;
    target_date: string;
    owner_name: string;
    key_results: KeyResult[];
}

interface KeyResult {
    id: string;
    title: string;
    target_value: number;
    current_value: number;
    unit: string;
    is_completed: boolean;
}

export default function GoalsTracker() {
    const { currentTenant } = useTenant();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'personal' | 'team' | 'company'>('all');
    const [showAddGoal, setShowAddGoal] = useState(false);

    useEffect(() => {
        loadGoals();
    }, [currentTenant]);

    async function loadGoals() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*, key_results(*)')
                .eq('tenant_id', currentTenant?.id)
                .order('target_date');

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            log.error('Error loading goals', error, { component: 'GoalsTracker', action: 'loadGoals' });
            setGoals(generateMockGoals());
        } finally {
            setLoading(false);
        }
    }

    function generateMockGoals(): Goal[] {
        return [
            {
                id: '1',
                title: 'Improve Employee Retention',
                description: 'Reduce voluntary turnover by implementing better engagement programs',
                category: 'company',
                status: 'in_progress',
                progress: 65,
                target_date: '2024-03-31',
                owner_name: 'Sarah Johnson',
                key_results: [
                    { id: 'kr1', title: 'Reduce turnover rate', target_value: 10, current_value: 12, unit: '%', is_completed: false },
                    { id: 'kr2', title: 'Conduct stay interviews', target_value: 50, current_value: 35, unit: 'interviews', is_completed: false },
                    { id: 'kr3', title: 'Launch mentorship program', target_value: 1, current_value: 1, unit: 'program', is_completed: true },
                ],
            },
            {
                id: '2',
                title: 'Complete Leadership Training',
                description: 'Finish all modules of the leadership development program',
                category: 'personal',
                status: 'in_progress',
                progress: 80,
                target_date: '2024-02-15',
                owner_name: 'Michael Chen',
                key_results: [
                    { id: 'kr4', title: 'Complete training modules', target_value: 10, current_value: 8, unit: 'modules', is_completed: false },
                    { id: 'kr5', title: 'Pass final assessment', target_value: 1, current_value: 0, unit: 'assessment', is_completed: false },
                ],
            },
            {
                id: '3',
                title: 'Streamline Recruitment Process',
                description: 'Reduce time-to-hire while maintaining quality of hires',
                category: 'team',
                status: 'at_risk',
                progress: 40,
                target_date: '2024-01-31',
                owner_name: 'Emma Wilson',
                key_results: [
                    { id: 'kr6', title: 'Reduce time-to-hire', target_value: 25, current_value: 35, unit: 'days', is_completed: false },
                    { id: 'kr7', title: 'Implement ATS features', target_value: 5, current_value: 2, unit: 'features', is_completed: false },
                ],
            },
            {
                id: '4',
                title: 'Achieve 95% Compliance Score',
                description: 'Maintain all required certifications and training completions',
                category: 'company',
                status: 'completed',
                progress: 100,
                target_date: '2024-01-15',
                owner_name: 'Compliance Team',
                key_results: [
                    { id: 'kr8', title: 'Complete mandatory training', target_value: 100, current_value: 100, unit: '%', is_completed: true },
                    { id: 'kr9', title: 'Renew certifications', target_value: 15, current_value: 15, unit: 'certs', is_completed: true },
                ],
            },
        ];
    }

    function toggleGoalExpand(goalId: string) {
        const newExpanded = new Set(expandedGoals);
        if (newExpanded.has(goalId)) {
            newExpanded.delete(goalId);
        } else {
            newExpanded.add(goalId);
        }
        setExpandedGoals(newExpanded);
    }

    function getStatusColor(status: Goal['status']) {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'at_risk': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    function getStatusLabel(status: Goal['status']) {
        return {
            completed: 'Completed',
            in_progress: 'In Progress',
            at_risk: 'At Risk',
            not_started: 'Not Started',
        }[status];
    }

    function getCategoryColor(category: Goal['category']) {
        switch (category) {
            case 'personal': return 'bg-purple-100 text-purple-700';
            case 'team': return 'bg-orange-100 text-orange-700';
            case 'company': return 'bg-indigo-100 text-indigo-700';
        }
    }

    function getDaysRemaining(targetDate: string): { days: number; label: string; color: string } {
        const days = differenceInDays(parseISO(targetDate), new Date());
        if (days < 0) return { days, label: 'Overdue', color: 'text-red-600' };
        if (days === 0) return { days, label: 'Due today', color: 'text-orange-600' };
        if (days <= 7) return { days, label: `${days} days left`, color: 'text-orange-600' };
        return { days, label: `${days} days left`, color: 'text-gray-500' };
    }

    const filteredGoals = filter === 'all' ? goals : goals.filter(g => g.category === filter);

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900">Goals & OKRs</h2>
                    </div>
                    <button
                        onClick={() => setShowAddGoal(true)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Goal
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-3 flex space-x-2">
                    {(['all', 'personal', 'team', 'company'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs rounded-lg transition ${filter === f
                                ? 'bg-indigo-100 text-indigo-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Goals Summary */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
                    <p className="text-xs text-gray-500">Total Goals</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-green-600">{goals.filter(g => g.status === 'completed').length}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-blue-600">{goals.filter(g => g.status === 'in_progress').length}</p>
                    <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-red-600">{goals.filter(g => g.status === 'at_risk').length}</p>
                    <p className="text-xs text-gray-500">At Risk</p>
                </div>
            </div>

            {/* Goals List */}
            <div className="divide-y divide-gray-100">
                {filteredGoals.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No goals found</p>
                    </div>
                ) : (
                    filteredGoals.map(goal => {
                        const isExpanded = expandedGoals.has(goal.id);
                        const daysInfo = getDaysRemaining(goal.target_date);

                        return (
                            <div key={goal.id} className="hover:bg-gray-50 transition">
                                {/* Goal Header */}
                                <div
                                    className="px-6 py-4 cursor-pointer"
                                    onClick={() => toggleGoalExpand(goal.id)}
                                >
                                    <div className="flex items-start">
                                        <button className="mt-1 mr-3 text-gray-400">
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(goal.category)}`}>
                                                    {goal.category}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(goal.status)}`}>
                                                    {getStatusLabel(goal.status)}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900">{goal.title}</h3>
                                            {goal.description && (
                                                <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                                            )}
                                            <div className="mt-2 flex items-center text-xs text-gray-400 space-x-4">
                                                <span className="flex items-center">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {goal.owner_name}
                                                </span>
                                                <span className={`flex items-center ${daysInfo.color}`}>
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {daysInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${goal.status === 'completed' ? 'bg-green-500' :
                                                            goal.status === 'at_risk' ? 'bg-red-500' : 'bg-indigo-500'
                                                            }`}
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-700">{goal.progress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Results */}
                                {isExpanded && goal.key_results.length > 0 && (
                                    <div className="px-6 pb-4 pl-14 space-y-2">
                                        <p className="text-xs font-medium text-gray-500 uppercase">Key Results</p>
                                        {goal.key_results.map(kr => (
                                            <div
                                                key={kr.id}
                                                className={`p-3 rounded-lg border ${kr.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        {kr.is_completed ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                                        ) : (
                                                            <Circle className="w-4 h-4 text-gray-400 mr-2" />
                                                        )}
                                                        <span className={`text-sm ${kr.is_completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                                                            {kr.title}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm font-medium ${kr.is_completed ? 'text-green-600' : 'text-gray-600'}`}>
                                                        {kr.current_value}/{kr.target_value} {kr.unit}
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${kr.is_completed ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min((kr.current_value / kr.target_value) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
