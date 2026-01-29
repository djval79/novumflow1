import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
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
import CrossAppNavigation from '../components/CrossAppNavigation';
import { complianceOracle, ComplianceRisk } from '@/lib/services/ComplianceOracle';
import { naturalLanguageService } from '@/lib/services/NaturalLanguageService';
import { Sparkles, BrainCircuit, AlertTriangle, MessageSquare, Terminal, ChevronRight } from 'lucide-react';

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
    const [risks, setRisks] = useState<ComplianceRisk[]>([]);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

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

            // Compliance Oracle Analysis
            const complianceRisks = await complianceOracle.predictRisks(currentTenant.id);
            setRisks(complianceRisks);

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

    async function handleAiQuery(e: FormEvent) {
        e.preventDefault();
        if (!aiQuery || !currentTenant) return;

        setIsAiLoading(true);
        const answer = await naturalLanguageService.askData(aiQuery, currentTenant.id);
        setAiResponse(answer);
        setIsAiLoading(false);
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
                    <a href="/dashboard" className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> HR Dashboard
                    </a>
                    <a href={`http://localhost:5180/?tenant=${currentTenant?.id}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
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

            {/* Phase 8: Clinical Intelligence & Scale */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Compliance Oracle (Predictive Alerts) */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-gray-900">Compliance Oracle</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Predictive Risk Analysis</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold">Live AI Stream</div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {risks.length > 0 ? risks.map((risk, i) => (
                            <div key={i} className="group p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${risk.severity === 'critical' ? 'bg-red-500 animate-pulse' : risk.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">{risk.risk_type} Risk</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-900">{risk.staff_name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{risk.recommendation}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-gray-900">{risk.days_remaining}d</div>
                                        <div className="text-[10px] font-bold text-gray-400">Remaining</div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <ShieldCheck className="mx-auto w-12 h-12 text-gray-200 mb-4" />
                                <p className="text-sm font-bold text-gray-400">No immediate compliance risks detected.</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Oracle is monitoring in real-time</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Query Terminal */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                                <Terminal size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">NovumFlow AI Oracle</h3>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Natural Language Reporting</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-black/30 rounded-2xl border border-white/5 p-6 min-h-[160px] flex flex-col">
                                {isAiLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                                    </div>
                                ) : aiResponse ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center gap-2 mb-4 text-indigo-400">
                                            <Sparkles size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Response Synthesized</span>
                                        </div>
                                        <p className="text-sm text-gray-200 leading-relaxed font-medium">
                                            {aiResponse}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                                        <MessageSquare size={32} className="mb-3" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ask the Oracle a question about your workforce...</p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleAiQuery} className="relative">
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    placeholder="e.g. 'Who is due for training renewal this month?'"
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isAiLoading || !aiQuery}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
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
                        <a href="/dashboard" className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold uppercase tracking-wide hover:bg-gray-100 transition-all flex items-center gap-2">
                            Open HR Platform <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>

        </div>
    );
}
