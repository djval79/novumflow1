import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    BarChart3,
    TrendingUp,
    Users,
    Clock,
    Target,
    Zap,
    ArrowRight,
    Calendar,
    Briefcase
} from 'lucide-react';
import { format, subDays, differenceInDays } from 'date-fns';

interface FunnelStage {
    name: string;
    count: number;
    percentage: number;
    color: string;
}

interface MetricCard {
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ElementType;
    color: string;
}

export default function RecruitmentAnalyticsDashboard() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    // Analytics Data
    const [totalApplications, setTotalApplications] = useState(0);
    const [totalHired, setTotalHired] = useState(0);
    const [totalRejected, setTotalRejected] = useState(0);
    const [avgTimeToHire, setAvgTimeToHire] = useState(0);
    const [avgAiScore, setAvgAiScore] = useState(0);
    const [aiAccuracy, setAiAccuracy] = useState(0);
    const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
    const [applicationsByJob, setApplicationsByJob] = useState<{ job: string; count: number }[]>([]);
    const [applicationsByDay, setApplicationsByDay] = useState<{ date: string; count: number }[]>([]);
    const [aiScoreDistribution, setAiScoreDistribution] = useState<{ range: string; count: number }[]>([]);

    useEffect(() => {
        if (currentTenant) {
            loadAnalytics();
        }
    }, [currentTenant, dateRange]);

    async function loadAnalytics() {
        if (!currentTenant) return;
        setLoading(true);

        try {
            // Calculate date filter
            let dateFilter = null;
            if (dateRange !== 'all') {
                const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
                dateFilter = subDays(new Date(), days).toISOString();
            }

            // Fetch all applications for the tenant
            let query = supabase
                .from('applications')
                .select('*, job_postings(job_title)')
                .eq('tenant_id', currentTenant.id);

            if (dateFilter) {
                query = query.gte('applied_at', dateFilter);
            }

            const { data: applications } = await query;
            const apps = applications || [];

            // Basic counts
            setTotalApplications(apps.length);

            const hired = apps.filter(a => a.status === 'Hired' || a.status === 'hired');
            setTotalHired(hired.length);

            const rejected = apps.filter(a => a.status === 'Rejected' || a.status === 'rejected');
            setTotalRejected(rejected.length);

            // Average time to hire (for hired candidates)
            if (hired.length > 0) {
                const timesToHire = hired
                    .filter(h => h.applied_at)
                    .map(h => {
                        const appliedDate = new Date(h.applied_at);
                        const hiredDate = h.updated_at ? new Date(h.updated_at) : new Date();
                        return differenceInDays(hiredDate, appliedDate);
                    });
                const avgDays = timesToHire.reduce((sum, d) => sum + d, 0) / timesToHire.length;
                setAvgTimeToHire(Math.round(avgDays));
            }

            // AI Score analytics
            const appsWithScore = apps.filter(a => a.ai_score !== null && a.ai_score !== undefined);
            if (appsWithScore.length > 0) {
                const avgScore = appsWithScore.reduce((sum, a) => sum + a.ai_score, 0) / appsWithScore.length;
                setAvgAiScore(Math.round(avgScore));

                // AI Accuracy: How many high-scoring (>70) candidates got hired?
                const highScorers = appsWithScore.filter(a => a.ai_score >= 70);
                const highScorersHired = highScorers.filter(a => a.status === 'Hired' || a.status === 'hired');
                if (highScorers.length > 0) {
                    setAiAccuracy(Math.round((highScorersHired.length / highScorers.length) * 100));
                }

                // AI Score Distribution
                const distribution = [
                    { range: '0-30', count: appsWithScore.filter(a => a.ai_score <= 30).length },
                    { range: '31-50', count: appsWithScore.filter(a => a.ai_score > 30 && a.ai_score <= 50).length },
                    { range: '51-70', count: appsWithScore.filter(a => a.ai_score > 50 && a.ai_score <= 70).length },
                    { range: '71-85', count: appsWithScore.filter(a => a.ai_score > 70 && a.ai_score <= 85).length },
                    { range: '86-100', count: appsWithScore.filter(a => a.ai_score > 85).length },
                ];
                setAiScoreDistribution(distribution);
            }

            // Funnel data
            const statusCounts: Record<string, number> = {};
            apps.forEach(a => {
                const status = a.status || 'Unknown';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            const funnelStages: FunnelStage[] = [
                { name: 'Applied', count: apps.length, percentage: 100, color: 'bg-blue-500' },
                { name: 'Screening', count: statusCounts['Screening'] || statusCounts['screening'] || 0, percentage: 0, color: 'bg-indigo-500' },
                { name: 'Shortlisted', count: statusCounts['Shortlisted'] || statusCounts['shortlisted'] || 0, percentage: 0, color: 'bg-purple-500' },
                { name: 'Interview', count: statusCounts['Interview'] || statusCounts['interview_scheduled'] || 0, percentage: 0, color: 'bg-pink-500' },
                { name: 'Hired', count: hired.length, percentage: 0, color: 'bg-green-500' },
            ];

            // Calculate percentages relative to total
            funnelStages.forEach(stage => {
                stage.percentage = apps.length > 0 ? Math.round((stage.count / apps.length) * 100) : 0;
            });

            setFunnelData(funnelStages);

            // Applications by job
            const jobCounts: Record<string, number> = {};
            apps.forEach(a => {
                const jobTitle = a.job_postings?.job_title || 'Unknown';
                jobCounts[jobTitle] = (jobCounts[jobTitle] || 0) + 1;
            });
            const byJob = Object.entries(jobCounts)
                .map(([job, count]) => ({ job, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setApplicationsByJob(byJob);

            // Applications by day (last 14 days)
            const last14Days = Array.from({ length: 14 }, (_, i) => {
                const date = subDays(new Date(), 13 - i);
                return format(date, 'yyyy-MM-dd');
            });

            const byDay = last14Days.map(date => ({
                date: format(new Date(date), 'MMM dd'),
                count: apps.filter(a => a.applied_at?.startsWith(date)).length
            }));
            setApplicationsByDay(byDay);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    const metrics: MetricCard[] = [
        {
            label: 'Total Applications',
            value: totalApplications,
            icon: Users,
            color: 'bg-blue-500'
        },
        {
            label: 'Conversion Rate',
            value: totalApplications > 0 ? `${Math.round((totalHired / totalApplications) * 100)}%` : '0%',
            icon: Target,
            color: 'bg-green-500'
        },
        {
            label: 'Avg Time to Hire',
            value: `${avgTimeToHire} days`,
            icon: Clock,
            color: 'bg-purple-500'
        },
        {
            label: 'AI Prediction Accuracy',
            value: `${aiAccuracy}%`,
            icon: Zap,
            color: 'bg-orange-500'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                        <BarChart3 className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h2>
                        <p className="text-sm text-gray-500">Track your hiring pipeline performance</p>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="mt-4 sm:mt-0 flex bg-gray-100 rounded-xl p-1">
                    {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${dateRange === range
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {range === 'all' ? 'All Time' : range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${metric.color} p-3 rounded-xl`}>
                                <metric.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{metric.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hiring Funnel */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                        Hiring Funnel
                    </h3>
                    <div className="space-y-4">
                        {funnelData.map((stage, index) => (
                            <div key={stage.name} className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                                    <span className="text-sm text-gray-500">{stage.count} ({stage.percentage}%)</span>
                                </div>
                                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${stage.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                                        style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                                    >
                                        {stage.percentage > 10 && (
                                            <span className="text-white text-xs font-bold">{stage.count}</span>
                                        )}
                                    </div>
                                </div>
                                {index < funnelData.length - 1 && (
                                    <ArrowRight className="w-4 h-4 text-gray-300 absolute -right-2 top-1/2 transform -translate-y-1/2" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Score Distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-orange-500" />
                        AI Score Distribution
                    </h3>
                    <div className="space-y-3">
                        {aiScoreDistribution.map((bucket) => {
                            const maxCount = Math.max(...aiScoreDistribution.map(b => b.count), 1);
                            const percentage = (bucket.count / maxCount) * 100;
                            const color =
                                bucket.range === '86-100' ? 'bg-green-500' :
                                    bucket.range === '71-85' ? 'bg-blue-500' :
                                        bucket.range === '51-70' ? 'bg-yellow-500' :
                                            bucket.range === '31-50' ? 'bg-orange-500' : 'bg-red-500';

                            return (
                                <div key={bucket.range} className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-600 w-16">{bucket.range}</span>
                                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-lg transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 w-8 text-right">{bucket.count}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Average AI Score</span>
                            <span className="font-bold text-indigo-600">{avgAiScore}/100</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Applications by Job */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-purple-500" />
                        Top Jobs by Applications
                    </h3>
                    {applicationsByJob.length > 0 ? (
                        <div className="space-y-4">
                            {applicationsByJob.map((item, index) => {
                                const maxCount = Math.max(...applicationsByJob.map(j => j.count), 1);
                                const percentage = (item.count / maxCount) * 100;

                                return (
                                    <div key={item.job}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                                {index + 1}. {item.job}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No applications yet</p>
                    )}
                </div>

                {/* Applications Over Time */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                        Applications (Last 14 Days)
                    </h3>
                    <div className="flex items-end justify-between h-40 space-x-1">
                        {applicationsByDay.map((day) => {
                            const maxCount = Math.max(...applicationsByDay.map(d => d.count), 1);
                            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center">
                                    <div className="w-full flex items-end justify-center h-32">
                                        <div
                                            className="w-full max-w-[20px] bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                            title={`${day.date}: ${day.count} applications`}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-2 rotate-45 origin-left whitespace-nowrap">
                                        {day.date.split(' ')[1]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Hired</p>
                            <p className="text-3xl font-bold mt-1">{totalHired}</p>
                        </div>
                        <Users className="w-10 h-10 text-green-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Rejected</p>
                            <p className="text-3xl font-bold mt-1">{totalRejected}</p>
                        </div>
                        <Users className="w-10 h-10 text-red-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm">In Pipeline</p>
                            <p className="text-3xl font-bold mt-1">{totalApplications - totalHired - totalRejected}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-indigo-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
