import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    Users,
    Briefcase,
    Activity,
    CalendarHeart,
    ArrowRight,
    LayoutGrid,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { log } from '@/lib/logger';
import CrossAppNavigation from '../components/CrossAppNavigation';

interface SuiteStats {
    hr: {
        totalEmployees: number;
        activeJobs: number;
        pendingApplications: number;
    };
    care: {
        activeClients: number;
        todayVisits: number;
        openIncidents: number;
    };
}

export default function UnifiedDashboardPage() {
    const { currentTenant } = useTenant();
    const { profile } = useAuth();
    const [stats, setStats] = useState<SuiteStats>({
        hr: { totalEmployees: 0, activeJobs: 0, pendingApplications: 0 },
        care: { activeClients: 0, todayVisits: 0, openIncidents: 0 },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentTenant) {
            loadSuiteData();
        }
    }, [currentTenant]);

    async function loadSuiteData() {
        if (!currentTenant) return;

        try {
            setLoading(true);

            // HR Queries
            const hrQueries = Promise.all([
                supabase.from('employees').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'active'),
                supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'published'),
                supabase.from('applications').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'applied'),
            ]);

            // CareFlow Queries (assuming tables exist in the same DB)
            const careQueries = Promise.all([
                supabase.from('clients').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'active'),
                supabase.from('visits').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).gte('start_time', new Date().toISOString().split('T')[0]),
                supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('tenant_id', currentTenant.id).eq('status', 'open'),
            ]);

            const [
                [{ count: empCount }, { count: jobCount }, { count: appCount }],
                [{ count: clientCount }, { count: visitCount }, { count: incidentCount }]
            ] = await Promise.all([hrQueries, careQueries]);

            setStats({
                hr: {
                    totalEmployees: empCount || 0,
                    activeJobs: jobCount || 0,
                    pendingApplications: appCount || 0,
                },
                care: {
                    activeClients: clientCount || 0,
                    todayVisits: visitCount || 0,
                    openIncidents: incidentCount || 0,
                },
            });

        } catch (error) {
            log.error('Error loading suite data', error, { component: 'UnifiedDashboardPage' });
        } finally {
            setLoading(false);
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-8 animate-pulse space-y-8">
                <div className="h-48 bg-gray-100 rounded-3xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-10 pb-20">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                        NovumFlow <span className="text-indigo-600">Suite</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Unified Command Center for {currentTenant?.name}</p>
                </div>
                <div className="flex gap-3">
                    {/* Using existing CrossAppNavigation directly might be cleaner if we extract the button, but for now we link */}
                    <a href="/dashboard" className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> HR Dashboard
                    </a>
                    <a href={`https://careflow-ai.vercel.app?tenant=${currentTenant?.id}`} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> CareFlow Dashboard
                    </a>
                </div>
            </div>

            {/* HR Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">HR & Recruitment</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Employees"
                        value={stats.hr.totalEmployees}
                        icon={Users}
                        color="bg-indigo-500"
                        subtext="Active workforce"
                    />
                    <StatCard
                        title="Active Jobs"
                        value={stats.hr.activeJobs}
                        icon={Briefcase}
                        color="bg-blue-500"
                        subtext="Currently published"
                    />
                    <StatCard
                        title="Pending Apps"
                        value={stats.hr.pendingApplications}
                        icon={ShieldCheck}
                        color="bg-violet-500"
                        subtext="Requires screening"
                    />
                </div>
            </div>

            {/* CareFlow Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Care Operations</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Active Clients"
                        value={stats.care.activeClients}
                        icon={Users}
                        color="bg-rose-500"
                        subtext="Currently receiving care"
                    />
                    <StatCard
                        title="Today's Visits"
                        value={stats.care.todayVisits}
                        icon={CalendarHeart}
                        color="bg-orange-500"
                        subtext="Scheduled for today"
                    />
                    <StatCard
                        title="Open Incidents"
                        value={stats.care.openIncidents}
                        icon={Zap}
                        color="bg-amber-500"
                        subtext="Requires attention"
                    />
                </div>
            </div>

            {/* Quick Launchpad */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-black mb-2">Ready to manage operations?</h3>
                        <p className="text-gray-400 max-w-md">Switch seamlessly between human resource management and care delivery protocols.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold uppercase tracking-wide hover:bg-gray-100 transition-all flex items-center gap-2">
                            Open HR Platform <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
