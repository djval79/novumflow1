import React, { useMemo } from 'react';
import {
    BrainCircuit,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Users,
    ArrowRight,
    Search,
    Filter,
    HelpCircle,
    Lightbulb
} from 'lucide-react';
import { useCompliancePersons } from '@/hooks/useComplianceData';
import { useTenant } from '@/contexts/TenantContext';

const TurnoverPredictor: React.FC = () => {
    const { currentTenant } = useTenant();
    const tenantId = currentTenant?.id || '';
    const { data: persons, isLoading } = useCompliancePersons(tenantId);

    // Simulated Predictor Engine
    const risks = useMemo(() => {
        if (!persons) return [];

        // Group by department
        const depts = persons.reduce((acc: any, p) => {
            acc[p.department || 'General'] = acc[p.department || 'General'] || { total: 0, atRisk: 0, nonCompliant: 0 };
            acc[p.department || 'General'].total++;
            if (p.compliance_status === 'AT_RISK') acc[p.department || 'General'].atRisk++;
            if (p.compliance_status === 'NON_COMPLIANT') acc[p.department || 'General'].nonCompliant++;
            return acc;
        }, {});

        return Object.entries(depts).map(([name, data]: [string, any]) => {
            const riskFactor = (data.atRisk * 2 + data.nonCompliant * 5) / data.total;
            let level: 'low' | 'medium' | 'high' = 'low';
            if (riskFactor > 2) level = 'high';
            else if (riskFactor > 0.5) level = 'medium';

            return {
                department: name,
                staffCount: data.total,
                riskLevel: level,
                prediction: level === 'high' ? 'Critical Shortage Likely' : level === 'medium' ? 'Increasing Attrition' : 'Stable',
                score: Math.min(100, Math.round(riskFactor * 10))
            };
        }).sort((a, b) => b.score - a.score);
    }, [persons]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-8">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BrainCircuit className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Predictive AI Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Turnover Predictor</h1>
                    <p className="text-slate-500 mt-2 text-lg">AI-driven attrition analysis based on compliance patterns and historical data.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                        <Filter className="w-5 h-5" /> Filter Parameters
                    </button>
                </div>
            </div>

            {/* Global Risk Banner */}
            <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Estimated Global Churn Risk</p>
                        <div className="flex items-end gap-3 mt-2">
                            <p className="text-5xl font-black text-white">14.2%</p>
                            <div className="flex items-center gap-1 text-rose-400 font-bold text-sm mb-1">
                                <TrendingUp className="w-4 h-4" /> +1.4%
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Primary Risk Driver</p>
                        <p className="text-xl font-bold text-white mt-2">Document Stagnation</p>
                        <p className="text-slate-500 text-sm mt-1">Expired certifications in 3+ core roles.</p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Strategic Mitigation</p>
                        <button className="mt-2 w-full flex items-center justify-between px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all">
                            Run AI Recruitment Ad <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {/* Abstract background flare */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* Department Risk Matrix */}
            <div className="grid grid-cols-1 gap-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Department Attrition Matrix
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {risks.map((risk) => (
                        <div key={risk.department} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{risk.department}</h4>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{risk.staffCount} Active Staff</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${risk.riskLevel === 'high' ? 'bg-rose-100 text-rose-600' :
                                        risk.riskLevel === 'medium' ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {risk.riskLevel} Risk
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold text-slate-500">Attrition Probability</span>
                                        <span className="text-lg font-black text-slate-900">{risk.score}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${risk.riskLevel === 'high' ? 'bg-rose-500' :
                                                    risk.riskLevel === 'medium' ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                }`}
                                            style={{ width: `${risk.score}%` }}
                                        />
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl flex gap-3 ${risk.riskLevel === 'high' ? 'bg-rose-50' :
                                        risk.riskLevel === 'medium' ? 'bg-amber-50' :
                                            'bg-emerald-50'
                                    }`}>
                                    <AlertTriangle className={`w-5 h-5 shrink-0 ${risk.riskLevel === 'high' ? 'text-rose-600' :
                                            risk.riskLevel === 'medium' ? 'text-amber-600' :
                                                'text-emerald-600'
                                        }`} />
                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                                        {risk.prediction}. Recommendation: {risk.riskLevel === 'high' ? 'Emergency recruitment buffer needed.' : 'Schedule 1-on-1 performance reviews.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100">
                    <h4 className="flex items-center gap-2 text-indigo-900 font-bold mb-4">
                        <Lightbulb className="w-5 h-5" /> Behavioral Insights
                    </h4>
                    <ul className="space-y-3">
                        <li className="flex gap-2 text-sm text-indigo-800">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                            Staff with 2+ expired documents are 85% more likely to leave within 60 days.
                        </li>
                        <li className="flex gap-2 text-sm text-indigo-800">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 shrink-0" />
                            The 'Nursing' department has seen a 20% increase in compliance delays this month.
                        </li>
                    </ul>
                </div>

                <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                    <h4 className="flex items-center gap-2 text-emerald-900 font-bold mb-4">
                        <Users className="w-5 h-5" /> Proactive Strategy
                    </h4>
                    <p className="text-sm text-emerald-800 leading-relaxed">
                        Based on current trends, we recommend initiating a recruitment pool for **HCA Level 2** in the South-East region within the next 14 days to prevent caregiver-to-client ratio breaches.
                    </p>
                    <button className="mt-4 px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm">
                        Apply Strategy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TurnoverPredictor;
