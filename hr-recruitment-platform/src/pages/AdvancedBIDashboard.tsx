import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    ShieldCheck,
    AlertCircle,
    Globe,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Download
} from 'lucide-react';
import { useComplianceStats, useCompliancePersons } from '@/hooks/useComplianceData';
import { useTenant } from '@/contexts/TenantContext';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

const AdvancedBIDashboard: React.FC = () => {
    const { currentTenant } = useTenant();
    const tenantId = currentTenant?.id || '';

    const { data: stats, isLoading: statsLoading } = useComplianceStats(tenantId);
    const { data: persons, isLoading: personsLoading } = useCompliancePersons(tenantId);

    // Derived Data for Charts
    const stageData = useMemo(() => {
        if (!stats?.byStage) return [];
        return Object.entries(stats.byStage).map(([name, value]) => ({ name, value }));
    }, [stats]);

    const authorityPerformance = useMemo(() => {
        if (!stats?.byAuthority) return [];
        return [
            { name: 'Home Office', score: stats.byAuthority.homeOffice.score },
            { name: 'CQC', score: stats.byAuthority.cqc.score }
        ];
    }, [stats]);

    const statusData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Compliant', value: stats.compliant },
            { name: 'At Risk', value: stats.atRisk },
            { name: 'Non-Compliant', value: stats.nonCompliant },
            { name: 'Pending', value: stats.pending }
        ];
    }, [stats]);

    if (statsLoading || personsLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Intelligence</h1>
                    <p className="text-slate-500 mt-1">Cross-regional compliance and workforce performance analytics.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                    <Download className="w-5 h-5 text-indigo-600" /> Export BI Report
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatBox
                    title="Total Workforce"
                    value={stats?.totalPersons || 0}
                    icon={<Users className="w-6 h-6 text-indigo-600" />}
                    trend="+12%"
                    positive={true}
                />
                <StatBox
                    title="Avg. Compliance"
                    value={`${stats?.byAuthority.cqc.score || 0}%`}
                    icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
                    trend="+4.2%"
                    positive={true}
                />
                <StatBox
                    title="At Risk Documents"
                    value={stats?.expiringDocuments || 0}
                    icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
                    trend="-15%"
                    positive={true}
                />
                <StatBox
                    title="Sync Nodes"
                    value="4"
                    icon={<Globe className="w-6 h-6 text-blue-600" />}
                    trend="Stable"
                    positive={true}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Compliance Distribution */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" /> Compliance Distribution
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {statusData.map((item, i) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                <span className="text-sm font-medium text-slate-600">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pipeline Flow */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" /> Pipeline Progression
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stageData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Authority Performance Comparison */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" /> Authority Performance (Home Office vs CQC)
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={authorityPerformance}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatBox: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend: string; positive: boolean }> = ({ title, value, icon, trend, positive }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
            </div>
        </div>
        <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
        </div>
    </div>
);

export default AdvancedBIDashboard;
