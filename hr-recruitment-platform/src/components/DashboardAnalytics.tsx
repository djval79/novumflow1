import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import { useTenant } from '@/contexts/TenantContext';
import { TrendingUp, TrendingDown, Users, Briefcase, Clock, Target, BarChart3, PieChart } from 'lucide-react';
import { formatNumber, formatPercentage /* formatCurrency */ } from '@/lib/utils';

interface AnalyticsData {
    hiring: {
        applicationsThisMonth: number;
        applicationsLastMonth: number;
        hiredThisMonth: number;
        hiredLastMonth: number;
        timeToHireAvg: number;
        conversionRate: number;
    };
    workforce: {
        totalEmployees: number;
        newHires: number;
        leavers: number;
        turnoverRate: number;
        departments: { name: string; count: number; color: string }[];
    };
    compliance: {
        score: number;
        expiringSoon: number;
        overdueTraining: number;
        pendingDBS: number;
    };
    performance: {
        avgRating: number;
        goalsCompleted: number;
        goalsAtRisk: number;
        reviewsPending: number;
    };
}

export default function DashboardAnalytics() {
    const { currentTenant } = useTenant();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    useEffect(() => {
        if (currentTenant) {
            loadAnalytics();
        }
    }, [currentTenant, timeRange]);

    async function loadAnalytics() {
        setLoading(true);

        try {
            // In production, these would be real database queries
            // For now, generate realistic analytics data
            const analyticsData: AnalyticsData = {
                hiring: {
                    applicationsThisMonth: 87,
                    applicationsLastMonth: 72,
                    hiredThisMonth: 8,
                    hiredLastMonth: 5,
                    timeToHireAvg: 28,
                    conversionRate: 9.2,
                },
                workforce: {
                    totalEmployees: 156,
                    newHires: 12,
                    leavers: 4,
                    turnoverRate: 2.6,
                    departments: [
                        { name: 'Engineering', count: 45, color: '#3B82F6' },
                        { name: 'Sales', count: 32, color: '#10B981' },
                        { name: 'Operations', count: 28, color: '#F59E0B' },
                        { name: 'Marketing', count: 22, color: '#8B5CF6' },
                        { name: 'HR', count: 15, color: '#EC4899' },
                        { name: 'Finance', count: 14, color: '#6366F1' },
                    ],
                },
                compliance: {
                    score: 94,
                    expiringSoon: 12,
                    overdueTraining: 3,
                    pendingDBS: 5,
                },
                performance: {
                    avgRating: 4.2,
                    goalsCompleted: 68,
                    goalsAtRisk: 8,
                    reviewsPending: 15,
                },
            };

            // Try to fetch real data
            try {
                const { count: totalEmployees } = await supabase
                    .from('employees')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', currentTenant?.id);

                if (totalEmployees) {
                    analyticsData.workforce.totalEmployees = totalEmployees;
                }
            } catch (e) {
                // Use mock data
            }

            setData(analyticsData);
        } catch (error) {
            log.error('Error loading analytics', error, { component: 'DashboardAnalytics', action: 'loadAnalytics', metadata: { tenantId: currentTenant?.id, timeRange } });
        } finally {
            setLoading(false);
        }
    }

    function getChangeIndicator(current: number, previous: number) {
        const change = previous ? ((current - previous) / previous) * 100 : 0;
        const isPositive = change >= 0;
        return {
            value: Math.abs(change).toFixed(1),
            isPositive,
            icon: isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
            color: isPositive ? 'text-green-600' : 'text-red-600',
        };
    }

    // Simple bar chart using CSS
    function BarChart({ data, maxValue, label, color }: { data: number; maxValue: number; label: string; color: string }) {
        const percentage = (data / maxValue) * 100;
        return (
            <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-600 w-20 truncate">{label}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8">{data}</span>
            </div>
        );
    }

    // Simple donut chart using CSS
    function DonutChart({ value, label, color }: { value: number; label: string; color: string }) {
        const circumference = 2 * Math.PI * 40;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="relative flex flex-col items-center">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{value}%</span>
                </div>
                <span className="mt-2 text-xs text-gray-600">{label}</span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                        <div className="h-8 bg-gray-200 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    if (!data) return null;

    const applicationChange = getChangeIndicator(data.hiring.applicationsThisMonth, data.hiring.applicationsLastMonth);
    const hiredChange = getChangeIndicator(data.hiring.hiredThisMonth, data.hiring.hiredLastMonth);

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    {(['week', 'month', 'quarter', 'year'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-sm rounded-md transition ${timeRange === range
                                ? 'bg-white text-indigo-600 shadow-sm font-medium'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hiring Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                        Hiring Pipeline
                    </h3>
                    <span className="text-xs text-gray-500">vs last period</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-gray-600">Applications</p>
                        <p className="text-2xl font-bold text-gray-900">{formatNumber(data.hiring.applicationsThisMonth)}</p>
                        <div className={`flex items-center text-sm ${applicationChange.color}`}>
                            {applicationChange.icon}
                            <span className="ml-1">{applicationChange.value}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Hired</p>
                        <p className="text-2xl font-bold text-gray-900">{data.hiring.hiredThisMonth}</p>
                        <div className={`flex items-center text-sm ${hiredChange.color}`}>
                            {hiredChange.icon}
                            <span className="ml-1">{hiredChange.value}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Avg Time to Hire</p>
                        <p className="text-2xl font-bold text-gray-900">{data.hiring.timeToHireAvg}</p>
                        <p className="text-xs text-gray-500">days</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Conversion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.hiring.conversionRate, 1)}</p>
                        <p className="text-xs text-gray-500">application to hire</p>
                    </div>
                </div>
            </div>

            {/* Workforce & Departments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 flex items-center mb-6">
                        <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                        Department Distribution
                    </h3>
                    <div className="space-y-3">
                        {data.workforce.departments.map((dept, index) => (
                            <BarChart
                                key={index}
                                data={dept.count}
                                maxValue={Math.max(...data.workforce.departments.map(d => d.count))}
                                label={dept.name}
                                color={dept.color}
                            />
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Employees</span>
                            <span className="font-bold text-gray-900">{formatNumber(data.workforce.totalEmployees)}</span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 flex items-center mb-6">
                        <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
                        Key Metrics
                    </h3>
                    <div className="flex items-center justify-around">
                        <DonutChart value={data.compliance.score} label="Compliance Score" color="#10B981" />
                        <DonutChart value={data.hiring.conversionRate * 10} label="Hiring Efficiency" color="#3B82F6" />
                        <DonutChart value={Math.round((data.performance.avgRating / 5) * 100)} label="Avg Rating" color="#8B5CF6" />
                    </div>
                </div>
            </div>

            {/* Workforce Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <Users className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{data.workforce.newHires}</p>
                    <p className="text-sm opacity-80">New Hires</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                    <Clock className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{data.compliance.expiringSoon}</p>
                    <p className="text-sm opacity-80">Expiring Soon</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <Target className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{formatPercentage(data.performance.goalsCompleted, 0)}</p>
                    <p className="text-sm opacity-80">Goals Complete</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
                    <p className="text-2xl font-bold">{formatPercentage(data.workforce.turnoverRate, 1)}</p>
                    <p className="text-sm opacity-80">Turnover Rate</p>
                </div>
            </div>
        </div>
    );
}
