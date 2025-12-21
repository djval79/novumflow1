/**
 * Structured Induction Workflow Component
 * 
 * CQC Regulation 18 & Skills for Care Alignment
 * Tracks new starter induction progress through mandatory stages
 */

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    CheckCircle,
    Clock,
    AlertTriangle,
    User,
    Calendar,
    FileCheck,
    Shield,
    Award,
    Heart,
    Users,
    Building2,
    Lock,
    Play,
    Pause,
    ChevronRight,
    Upload,
    MessageSquare,
    Star,
    Loader2
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface InductionStage {
    id: string;
    name: string;
    description: string;
    category: 'mandatory' | 'role_specific' | 'site_specific';
    expectedDuration: string;
    dayRange: { start: number; end: number };
    icon: React.ReactNode;
    tasks: InductionTask[];
}

interface InductionTask {
    id: string;
    name: string;
    description: string;
    type: 'training' | 'document' | 'meeting' | 'observation' | 'signoff';
    required: boolean;
    completedAt?: string;
    completedBy?: string;
    signedOffBy?: string;
    notes?: string;
    evidenceRequired: boolean;
}

interface InductionProgress {
    employeeId: string;
    employeeName: string;
    startDate: string;
    expectedCompletionDate: string;
    currentDay: number;
    stages: {
        stageId: string;
        status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
        tasks: {
            taskId: string;
            completed: boolean;
            completedAt?: string;
            evidence?: string;
        }[];
    }[];
    overallProgress: number;
}

// ============================================
// INDUCTION PROGRAMME DATA
// ============================================

const INDUCTION_STAGES: InductionStage[] = [
    {
        id: 'pre_start',
        name: 'Pre-Employment',
        description: 'Documentation and checks before first day',
        category: 'mandatory',
        expectedDuration: 'Before Day 1',
        dayRange: { start: -14, end: 0 },
        icon: <FileCheck className="w-5 h-5" />,
        tasks: [
            { id: 'contract', name: 'Employment Contract Signed', description: 'Terms and conditions agreed', type: 'document', required: true, evidenceRequired: true },
            { id: 'dbs', name: 'DBS Check Cleared', description: 'Enhanced DBS received', type: 'document', required: true, evidenceRequired: true },
            { id: 'rtw', name: 'Right to Work Verified', description: 'Immigration status confirmed', type: 'document', required: true, evidenceRequired: true },
            { id: 'references', name: 'References Received', description: 'Minimum 2 satisfactory references', type: 'document', required: true, evidenceRequired: true },
            { id: 'health_dec', name: 'Health Declaration Complete', description: 'Fitness to work confirmed', type: 'document', required: true, evidenceRequired: false },
            { id: 'character_dec', name: 'Character Declaration Complete', description: 'CQC Regulation 19 disclosure', type: 'document', required: true, evidenceRequired: true }
        ]
    },
    {
        id: 'day_one',
        name: 'Day 1: Welcome & Orientation',
        description: 'First day essentials and site orientation',
        category: 'mandatory',
        expectedDuration: 'Day 1',
        dayRange: { start: 1, end: 1 },
        icon: <Star className="w-5 h-5" />,
        tasks: [
            { id: 'welcome', name: 'Welcome Meeting', description: 'Introduction with manager', type: 'meeting', required: true, evidenceRequired: false },
            { id: 'tour', name: 'Facility Tour', description: 'Building layout, fire exits, key areas', type: 'observation', required: true, evidenceRequired: false },
            { id: 'id_badge', name: 'ID Badge & Access Cards', description: 'Security credentials issued', type: 'document', required: true, evidenceRequired: false },
            { id: 'it_setup', name: 'IT & Systems Access', description: 'Login credentials and system training', type: 'training', required: true, evidenceRequired: false },
            { id: 'handbook', name: 'Employee Handbook', description: 'Policies and procedures acknowledged', type: 'document', required: true, evidenceRequired: true },
            { id: 'meet_team', name: 'Meet the Team', description: 'Introduction to colleagues', type: 'meeting', required: true, evidenceRequired: false }
        ]
    },
    {
        id: 'week_one',
        name: 'Week 1: Core Training',
        description: 'Essential mandatory training completion',
        category: 'mandatory',
        expectedDuration: 'Days 2-5',
        dayRange: { start: 2, end: 5 },
        icon: <BookOpen className="w-5 h-5" />,
        tasks: [
            { id: 'fire_safety', name: 'Fire Safety Training', description: 'Fire awareness and evacuation', type: 'training', required: true, evidenceRequired: true },
            { id: 'h_and_s', name: 'Health & Safety', description: 'Workplace safety essentials', type: 'training', required: true, evidenceRequired: true },
            { id: 'manual_handling', name: 'Moving & Handling', description: 'Safe people handling techniques', type: 'training', required: true, evidenceRequired: true },
            { id: 'safeguarding', name: 'Safeguarding Adults', description: 'Protection from abuse', type: 'training', required: true, evidenceRequired: true },
            { id: 'infection_control', name: 'Infection Control', description: 'IPC principles and PPE use', type: 'training', required: true, evidenceRequired: true },
            { id: 'data_protection', name: 'Data Protection & GDPR', description: 'Information governance', type: 'training', required: true, evidenceRequired: true }
        ]
    },
    {
        id: 'week_two',
        name: 'Week 2: Supervised Practice',
        description: 'Shadowing and supervised care delivery',
        category: 'mandatory',
        expectedDuration: 'Days 6-12',
        dayRange: { start: 6, end: 12 },
        icon: <Users className="w-5 h-5" />,
        tasks: [
            { id: 'shadow_shift_1', name: 'Shadow Shift 1', description: 'Observe experienced colleague', type: 'observation', required: true, evidenceRequired: false },
            { id: 'shadow_shift_2', name: 'Shadow Shift 2', description: 'Practice under supervision', type: 'observation', required: true, evidenceRequired: false },
            { id: 'shadow_shift_3', name: 'Shadow Shift 3', description: 'Demonstrate core tasks', type: 'observation', required: true, evidenceRequired: false },
            { id: 'personal_care', name: 'Personal Care Competency', description: 'Dignity and respect in care', type: 'signoff', required: true, evidenceRequired: true },
            { id: 'medication_aware', name: 'Medication Awareness', description: 'Understand medication policies', type: 'training', required: true, evidenceRequired: true },
            { id: 'care_plans', name: 'Care Plan Training', description: 'Reading and following care plans', type: 'training', required: true, evidenceRequired: false }
        ]
    },
    {
        id: 'month_one',
        name: 'Month 1: Care Certificate',
        description: 'Begin Care Certificate programme',
        category: 'mandatory',
        expectedDuration: 'Days 13-30',
        dayRange: { start: 13, end: 30 },
        icon: <Award className="w-5 h-5" />,
        tasks: [
            { id: 'cc_1_role', name: 'CC1: Understand Your Role', description: 'Care Certificate Standard 1', type: 'training', required: true, evidenceRequired: true },
            { id: 'cc_2_dev', name: 'CC2: Personal Development', description: 'Care Certificate Standard 2', type: 'training', required: true, evidenceRequired: true },
            { id: 'cc_3_duty', name: 'CC3: Duty of Care', description: 'Care Certificate Standard 3', type: 'training', required: true, evidenceRequired: true },
            { id: 'cc_4_equality', name: 'CC4: Equality & Diversity', description: 'Care Certificate Standard 4', type: 'training', required: true, evidenceRequired: true },
            { id: 'cc_5_person', name: 'CC5: Person-Centred Care', description: 'Care Certificate Standard 5', type: 'training', required: true, evidenceRequired: true },
            { id: 'review_1', name: '1-Month Review Meeting', description: 'Progress review with manager', type: 'meeting', required: true, evidenceRequired: true }
        ]
    },
    {
        id: 'month_three',
        name: 'Month 2-3: Complete Care Certificate',
        description: 'Finish all 15 Care Certificate standards',
        category: 'mandatory',
        expectedDuration: 'Days 31-84',
        dayRange: { start: 31, end: 84 },
        icon: <Shield className="w-5 h-5" />,
        tasks: [
            { id: 'cc_6_15', name: 'Care Certificate Standards 6-15', description: 'Complete remaining standards', type: 'training', required: true, evidenceRequired: true },
            { id: 'cc_assessment', name: 'Care Certificate Assessment', description: 'Competency sign-off', type: 'signoff', required: true, evidenceRequired: true },
            { id: 'review_3', name: '3-Month Review Meeting', description: 'End of probation review', type: 'meeting', required: true, evidenceRequired: true },
            { id: 'probation_signoff', name: 'Probation Sign-Off', description: 'Confirm successful induction', type: 'signoff', required: true, evidenceRequired: true }
        ]
    }
];

// ============================================
// COMPONENT
// ============================================

interface InductionWorkflowProps {
    employeeId: string;
    employeeName: string;
    startDate: string;
    onClose?: () => void;
}

export default function InductionWorkflow({
    employeeId,
    employeeName,
    startDate,
    onClose
}: InductionWorkflowProps) {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeStage, setActiveStage] = useState<string>('pre_start');
    const [progress, setProgress] = useState<InductionProgress | null>(null);
    const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
    const [savingTask, setSavingTask] = useState<string | null>(null);

    // Calculate current day of induction
    const startDateObj = new Date(startDate);
    const today = new Date();
    const currentDay = Math.floor((today.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    useEffect(() => {
        loadProgress();
    }, [employeeId]);

    const loadProgress = async () => {
        setLoading(true);
        try {
            // In production, load from database
            // For demo, initialize empty progress
            const initialProgress: InductionProgress = {
                employeeId,
                employeeName,
                startDate,
                expectedCompletionDate: new Date(startDateObj.getTime() + 84 * 24 * 60 * 60 * 1000).toISOString(),
                currentDay,
                stages: INDUCTION_STAGES.map(stage => ({
                    stageId: stage.id,
                    status: 'not_started' as const,
                    tasks: stage.tasks.map(task => ({
                        taskId: task.id,
                        completed: false
                    }))
                })),
                overallProgress: 0
            };
            setProgress(initialProgress);
        } catch (error) {
            console.error('Error loading progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTaskComplete = async (stageId: string, taskId: string) => {
        if (!progress) return;
        setSavingTask(taskId);

        try {
            const updatedStages = progress.stages.map(stage => {
                if (stage.stageId === stageId) {
                    return {
                        ...stage,
                        tasks: stage.tasks.map(task => {
                            if (task.taskId === taskId) {
                                return {
                                    ...task,
                                    completed: !task.completed,
                                    completedAt: !task.completed ? new Date().toISOString() : undefined
                                };
                            }
                            return task;
                        })
                    };
                }
                return stage;
            });

            // Calculate stage statuses
            const finalStages = updatedStages.map(stage => {
                const stageData = INDUCTION_STAGES.find(s => s.id === stage.stageId)!;
                const completedTasks = stage.tasks.filter(t => t.completed).length;
                const totalTasks = stage.tasks.length;

                let status: 'not_started' | 'in_progress' | 'completed' | 'overdue' = 'not_started';
                if (completedTasks === totalTasks) {
                    status = 'completed';
                } else if (completedTasks > 0) {
                    status = 'in_progress';
                } else if (currentDay > stageData.dayRange.end) {
                    status = 'overdue';
                }

                return { ...stage, status };
            });

            // Calculate overall progress
            const totalTasks = INDUCTION_STAGES.reduce((sum, s) => sum + s.tasks.length, 0);
            const completedTasks = finalStages.reduce((sum, s) => sum + s.tasks.filter(t => t.completed).length, 0);
            const overallProgress = Math.round((completedTasks / totalTasks) * 100);

            setProgress({
                ...progress,
                stages: finalStages,
                overallProgress
            });

            // In production, save to database here
        } catch (error) {
            console.error('Error updating task:', error);
        } finally {
            setSavingTask(null);
        }
    };

    const getStageStatus = (stageId: string) => {
        return progress?.stages.find(s => s.stageId === stageId)?.status || 'not_started';
    };

    const getTaskStatus = (stageId: string, taskId: string) => {
        const stage = progress?.stages.find(s => s.stageId === stageId);
        return stage?.tasks.find(t => t.taskId === taskId)?.completed || false;
    };

    const getStageProgress = (stageId: string) => {
        const stage = progress?.stages.find(s => s.stageId === stageId);
        if (!stage) return { completed: 0, total: 0, percentage: 0 };

        const completed = stage.tasks.filter(t => t.completed).length;
        const total = stage.tasks.length;
        return { completed, total, percentage: Math.round((completed / total) * 100) };
    };

    const statusColors = {
        'not_started': 'bg-gray-100 text-gray-600',
        'in_progress': 'bg-blue-100 text-blue-600',
        'completed': 'bg-green-100 text-green-600',
        'overdue': 'bg-red-100 text-red-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Induction Programme</h2>
                            <p className="text-emerald-100">{employeeName} • Started {new Date(startDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-emerald-100">Day {currentDay}</p>
                            <p className="text-2xl font-bold text-white">{progress?.overallProgress || 0}%</p>
                        </div>
                        {onClose && (
                            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">
                                &times;
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-500"
                            style={{ width: `${progress?.overallProgress || 0}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-emerald-100">
                        <span>Pre-Start</span>
                        <span>Week 1</span>
                        <span>Week 2</span>
                        <span>Month 1</span>
                        <span>Month 3</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Stage Sidebar */}
                <div className="w-72 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
                    <div className="p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Induction Stages
                        </h3>
                        {INDUCTION_STAGES.map(stage => {
                            const status = getStageStatus(stage.id);
                            const stageProgress = getStageProgress(stage.id);
                            const isActive = activeStage === stage.id;
                            const isDue = currentDay >= stage.dayRange.start && currentDay <= stage.dayRange.end;

                            return (
                                <button
                                    key={stage.id}
                                    onClick={() => setActiveStage(stage.id)}
                                    className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${isActive
                                            ? 'bg-emerald-100 border-emerald-300 border'
                                            : 'bg-white border border-gray-200 hover:border-emerald-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={isActive ? 'text-emerald-600' : 'text-gray-500'}>{stage.icon}</span>
                                        <span className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
                                            {stage.name}
                                        </span>
                                        {isDue && status !== 'completed' && (
                                            <span className="ml-auto px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                NOW
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${status === 'completed' ? 'bg-green-500' :
                                                        status === 'overdue' ? 'bg-red-500' :
                                                            status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`}
                                                style={{ width: `${stageProgress.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">{stageProgress.completed}/{stageProgress.total}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{stage.expectedDuration}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tasks Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        </div>
                    ) : (
                        INDUCTION_STAGES
                            .filter(s => s.id === activeStage)
                            .map(stage => (
                                <div key={stage.id}>
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="p-2 bg-emerald-100 rounded-lg text-emerald-600">{stage.icon}</span>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{stage.name}</h3>
                                                <p className="text-sm text-gray-500">{stage.description}</p>
                                            </div>
                                            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${statusColors[getStageStatus(stage.id)]}`}>
                                                {getStageStatus(stage.id).replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {stage.tasks.map(task => {
                                            const isCompleted = getTaskStatus(stage.id, task.id);
                                            const isSaving = savingTask === task.id;

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`border rounded-lg p-4 transition-all ${isCompleted
                                                            ? 'bg-green-50 border-green-200'
                                                            : 'bg-white border-gray-200 hover:border-emerald-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <button
                                                            onClick={() => toggleTaskComplete(stage.id, task.id)}
                                                            disabled={isSaving}
                                                            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-gray-200 text-gray-400 hover:bg-emerald-200'
                                                                }`}
                                                        >
                                                            {isSaving ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : isCompleted ? (
                                                                <CheckCircle className="w-4 h-4" />
                                                            ) : (
                                                                <span className="text-xs">○</span>
                                                            )}
                                                        </button>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-medium ${isCompleted ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                                                    {task.name}
                                                                </span>
                                                                {task.required && (
                                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                                                                        Required
                                                                    </span>
                                                                )}
                                                                {task.evidenceRequired && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded flex items-center gap-1">
                                                                        <Upload className="w-3 h-3" />
                                                                        Evidence
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                                <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">{task.type}</span>
                                                            </div>
                                                        </div>
                                                        {task.type === 'signoff' && !isCompleted && (
                                                            <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 flex items-center gap-1">
                                                                <Lock className="w-4 h-4" />
                                                                Request Sign-off
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Structured induction programme aligned with CQC Regulation 18 and Skills for Care Care Certificate
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Export Progress Report
                        </button>
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                            Schedule Review Meeting
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
