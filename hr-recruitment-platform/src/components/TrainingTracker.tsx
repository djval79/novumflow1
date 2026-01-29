import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import {
    GraduationCap, CheckCircle, Clock, AlertTriangle, Award,
    Calendar, ChevronRight, Play, Download, RefreshCw, Filter
} from 'lucide-react';
import { format, parseISO, differenceInDays, isBefore, addDays } from 'date-fns';

interface TrainingCourse {
    id: string;
    title: string;
    category: string;
    duration_minutes: number;
    description?: string;
    is_mandatory: boolean;
    thumbnail?: string;
}

interface TrainingRecord {
    id: string;
    employee_id: string;
    employee_name: string;
    course: TrainingCourse;
    status: 'not_started' | 'in_progress' | 'completed' | 'expired';
    progress: number;
    started_at?: string;
    completed_at?: string;
    expires_at?: string;
    score?: number;
    certificate_url?: string;
}

export default function TrainingTracker() {
    const { currentTenant } = useTenant();
    const [records, setRecords] = useState<TrainingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'expired' | 'mandatory'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadTrainingRecords();
    }, [currentTenant]);

    async function loadTrainingRecords() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('training_records')
                .select('*')
                .eq('tenant_id', currentTenant?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            log.error('Error loading training records', error, { component: 'TrainingTracker', action: 'loadTrainingRecords' });
            setRecords(generateMockRecords());
        } finally {
            setLoading(false);
        }
    }

    function generateMockRecords(): TrainingRecord[] {
        const courses: TrainingCourse[] = [
            { id: 'c1', title: 'Fire Safety Training', category: 'Health & Safety', duration_minutes: 45, is_mandatory: true },
            { id: 'c2', title: 'GDPR & Data Protection', category: 'Compliance', duration_minutes: 60, is_mandatory: true },
            { id: 'c3', title: 'Manual Handling', category: 'Health & Safety', duration_minutes: 30, is_mandatory: true },
            { id: 'c4', title: 'First Aid Basics', category: 'Health & Safety', duration_minutes: 90, is_mandatory: false },
            { id: 'c5', title: 'Leadership Fundamentals', category: 'Professional Development', duration_minutes: 120, is_mandatory: false },
            { id: 'c6', title: 'Equality & Diversity', category: 'Compliance', duration_minutes: 45, is_mandatory: true },
            { id: 'c7', title: 'Cybersecurity Awareness', category: 'IT Security', duration_minutes: 30, is_mandatory: true },
            { id: 'c8', title: 'Conflict Resolution', category: 'Soft Skills', duration_minutes: 60, is_mandatory: false },
        ];

        return courses.map((course, i) => {
            const statuses: TrainingRecord['status'][] = ['completed', 'in_progress', 'not_started', 'expired'];
            const status = statuses[i % 4];

            return {
                id: `tr-${i}`,
                employee_id: 'emp-1',
                employee_name: 'Current User',
                course,
                status,
                progress: status === 'completed' ? 100 : status === 'in_progress' ? Math.floor(Math.random() * 80) + 10 : 0,
                started_at: status !== 'not_started' ? format(addDays(new Date(), -30), 'yyyy-MM-dd') : undefined,
                completed_at: status === 'completed' ? format(addDays(new Date(), -15), 'yyyy-MM-dd') : undefined,
                expires_at: status === 'completed' ? format(addDays(new Date(), 350), 'yyyy-MM-dd') :
                    status === 'expired' ? format(addDays(new Date(), -10), 'yyyy-MM-dd') : undefined,
                score: status === 'completed' ? Math.floor(Math.random() * 20) + 80 : undefined,
                certificate_url: status === 'completed' ? '#' : undefined,
            };
        });
    }

    function getStatusInfo(status: TrainingRecord['status']) {
        switch (status) {
            case 'completed':
                return { label: 'Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> };
            case 'in_progress':
                return { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-4 h-4" /> };
            case 'expired':
                return { label: 'Expired', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="w-4 h-4" /> };
            default:
                return { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: <Clock className="w-4 h-4" /> };
        }
    }

    function getCategoryColor(category: string) {
        const colors: Record<string, string> = {
            'Health & Safety': 'bg-red-50 text-red-700 border-red-200',
            'Compliance': 'bg-blue-50 text-blue-700 border-blue-200',
            'Professional Development': 'bg-purple-50 text-purple-700 border-purple-200',
            'IT Security': 'bg-orange-50 text-orange-700 border-orange-200',
            'Soft Skills': 'bg-green-50 text-green-700 border-green-200',
        };
        return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
    }

    function formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    }

    const filteredRecords = records.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'mandatory') return r.course.is_mandatory;
        return r.status === filter;
    });

    const stats = {
        total: records.length,
        completed: records.filter(r => r.status === 'completed').length,
        inProgress: records.filter(r => r.status === 'in_progress').length,
        expired: records.filter(r => r.status === 'expired').length,
        mandatory: records.filter(r => r.course.is_mandatory).length,
        mandatoryCompleted: records.filter(r => r.course.is_mandatory && r.status === 'completed').length,
    };

    const complianceRate = stats.mandatory > 0
        ? Math.round((stats.mandatoryCompleted / stats.mandatory) * 100)
        : 100;

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Courses</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-indigo-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-indigo-200">Compliance</p>
                            <p className="text-2xl font-bold">{complianceRate}%</p>
                        </div>
                        <Award className="w-8 h-8 text-white/50" />
                    </div>
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${complianceRate}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Training List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Training Courses</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => loadTrainingRecords()}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {(['all', 'mandatory', 'in_progress', 'completed', 'expired'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 text-xs rounded-lg transition ${filter === f
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecords.map(record => {
                        const statusInfo = getStatusInfo(record.status);

                        return (
                            <div
                                key={record.id}
                                className={`rounded-xl border p-4 transition hover:shadow-md ${record.status === 'expired' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryColor(record.course.category)}`}>
                                        {record.course.category}
                                    </span>
                                    {record.course.is_mandatory && (
                                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                            Mandatory
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-medium text-gray-900 mb-1">{record.course.title}</h3>

                                <div className="flex items-center text-xs text-gray-500 space-x-3 mb-3">
                                    <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatDuration(record.course.duration_minutes)}
                                    </span>
                                    {record.expires_at && (
                                        <span className={`flex items-center ${isBefore(parseISO(record.expires_at), new Date()) ? 'text-red-600' : ''
                                            }`}>
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {isBefore(parseISO(record.expires_at), new Date())
                                                ? 'Expired'
                                                : `Expires ${format(parseISO(record.expires_at), 'MMM d, yyyy')}`
                                            }
                                        </span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className={`flex items-center ${statusInfo.color} px-2 py-0.5 rounded`}>
                                            {statusInfo.icon}
                                            <span className="ml-1">{statusInfo.label}</span>
                                        </span>
                                        <span className="text-gray-600">{record.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${record.status === 'completed' ? 'bg-green-500' :
                                                record.status === 'expired' ? 'bg-red-500' : 'bg-indigo-500'
                                                }`}
                                            style={{ width: `${record.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-2">
                                    {record.status === 'completed' ? (
                                        <>
                                            {record.score && (
                                                <span className="text-sm text-green-600 font-medium">
                                                    Score: {record.score}%
                                                </span>
                                            )}
                                            {record.certificate_url && (
                                                <button className="ml-auto flex items-center text-xs text-indigo-600 hover:text-indigo-700">
                                                    <Download className="w-3 h-3 mr-1" />
                                                    Certificate
                                                </button>
                                            )}
                                        </>
                                    ) : record.status === 'expired' ? (
                                        <button className="flex-1 flex items-center justify-center py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium">
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                            Retake Course
                                        </button>
                                    ) : (
                                        <button className="flex-1 flex items-center justify-center py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
                                            <Play className="w-4 h-4 mr-1" />
                                            {record.status === 'in_progress' ? 'Continue' : 'Start Course'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
