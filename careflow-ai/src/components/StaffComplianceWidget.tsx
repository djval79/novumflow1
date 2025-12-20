
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { ShieldCheck, ShieldAlert, ShieldOff, RefreshCw, ExternalLink, AlertTriangle, Zap, Target, History, Shield } from 'lucide-react';
import complianceCheckService, { ComplianceStatus } from '@/services/ComplianceCheckService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string;
}

export default function StaffComplianceWidget() {
    const { currentTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [complianceMap, setComplianceMap] = useState<Map<string, ComplianceStatus>>(new Map());
    const [novumFlowEnabled, setNovumFlowEnabled] = useState(false);

    useEffect(() => {
        if (currentTenant) {
            fetchComplianceData();
            setNovumFlowEnabled(currentTenant.settings?.novumflow_enabled !== false);
        }
    }, [currentTenant]);

    const fetchComplianceData = async () => {
        if (!currentTenant) return;
        setLoading(true);
        const syncToast = toast.loading('Synchronizing Compliance Lattice...');

        try {
            const { data: staffData, error: staffError } = await supabase
                .from('careflow_staff')
                .select('id, full_name')
                .eq('tenant_id', currentTenant.id)
                .or('status.eq.active,status.eq.Active');

            if (staffError) throw staffError;
            setStaff((staffData || []).map((s: any) => {
                const parts = (s.full_name || '').split(' ');
                return {
                    id: s.id,
                    first_name: parts[0] || '',
                    last_name: parts.slice(1).join(' ') || ''
                };
            }));

            const compliance = await complianceCheckService.checkAllStaffCompliance(currentTenant.id);
            setComplianceMap(compliance);
            toast.success('Lattice Synced', { id: syncToast });
        } catch (error) {
            toast.error('Sync failure', { id: syncToast });
        } finally {
            setLoading(false);
        }
    };

    const getComplianceStats = () => {
        let compliant = 0;
        let partial = 0;
        let nonCompliant = 0;

        complianceMap.forEach((status) => {
            if (status.isCompliant && status.compliancePercentage >= 90) {
                compliant++;
            } else if (status.compliancePercentage >= 50) {
                partial++;
            } else {
                nonCompliant++;
            }
        });

        return { compliant, partial, nonCompliant };
    };

    const getNonCompliantStaff = () => {
        const nonCompliant: Array<{ staff: StaffMember; compliance: ComplianceStatus }> = [];

        staff.forEach((s) => {
            const compliance = complianceMap.get(s.id);
            if (compliance && !compliance.isCompliant) {
                nonCompliant.push({ staff: s, compliance });
            }
        });

        return nonCompliant.sort((a, b) => a.compliance.compliancePercentage - b.compliance.compliancePercentage).slice(0, 5);
    };

    const stats = getComplianceStats();
    const nonCompliantStaff = getNonCompliantStaff();
    const totalStaff = staff.length;
    const overallComplianceRate = totalStaff > 0
        ? Math.round((stats.compliant / totalStaff) * 100)
        : 0;

    if (loading) {
        return (
            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-white/5 animate-pulse">
                <div className="space-y-6">
                    <div className="h-6 bg-white/5 rounded-xl w-1/2"></div>
                    <div className="h-32 bg-white/5 rounded-3xl w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden flex flex-col h-full relative group">
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

            {/* Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <ShieldCheck className="w-6 h-6 text-primary-500" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.6em]">Neural Guard</h3>
                    </div>
                    {novumFlowEnabled && (
                        <span className="text-[8px] text-primary-500/60 font-black uppercase tracking-widest pl-10">
                            Satellite Auth Active
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchComplianceData}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all shadow-xl group-hover:rotate-180 duration-700"
                >
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Stats Matrix */}
                <div className="grid grid-cols-3 border-b border-white/5 relative z-10">
                    <div className="p-8 text-center border-r border-white/5 group/stat">
                        <div className="text-4xl font-black text-white tracking-tighter tabular-nums mb-1 group-hover:scale-110 transition-transform">{stats.compliant}</div>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Compliant</p>
                    </div>
                    <div className="p-8 text-center border-r border-white/5 group/stat">
                        <div className="text-4xl font-black text-amber-500 tracking-tighter tabular-nums mb-1 group-hover:scale-110 transition-transform">{stats.partial}</div>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widestAlpha">Partial</p>
                    </div>
                    <div className="p-8 text-center group/stat">
                        <div className="text-4xl font-black text-rose-500 tracking-tighter tabular-nums mb-1 group-hover:scale-110 transition-transform">{stats.nonCompliant}</div>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Hazard</p>
                    </div>
                </div>

                {/* Progress Spectrometer */}
                <div className="p-10 border-b border-white/5 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">System Integrity</span>
                        <span className={`text-xl font-black text-white tracking-tighter tabular-nums ${overallComplianceRate >= 90 ? 'text-primary-500' :
                            overallComplianceRate >= 70 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                            {overallComplianceRate}%
                        </span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 shadow-2xl ${overallComplianceRate >= 90 ? 'bg-primary-600' :
                                overallComplianceRate >= 70 ? 'bg-amber-500' : 'bg-rose-600'
                                } shadow-[0_0_20px_rgba(37,99,235,0.4)]`}
                            style={{ width: `${overallComplianceRate}%` }}
                        />
                    </div>
                </div>

                {/* Attention Required Ledger */}
                {nonCompliantStaff.length > 0 ? (
                    <div className="p-10 space-y-8 relative z-10">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4">
                            <AlertTriangle className="w-5 h-5 text-rose-500" /> Hazard Manifest
                        </h4>
                        <div className="space-y-4">
                            {nonCompliantStaff.map(({ staff: s, compliance }) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all border-l-4 border-l-rose-600 group/item"
                                >
                                    <div className="space-y-1">
                                        <p className="text-base font-black text-white uppercase tracking-tight group-hover/item:text-rose-500 transition-colors">
                                            {s.first_name} {s.last_name}
                                        </p>
                                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[150px]">
                                            {compliance.missingDocuments.length > 0
                                                ? `MISSING: ${compliance.missingDocuments.slice(0, 1).join(', ')}...`
                                                : compliance.rtw_status !== 'valid'
                                                    ? 'AUTH FAILURE'
                                                    : 'NULL COMPLIANCE'
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-black text-white tabular-nums ${compliance.compliancePercentage >= 70 ? 'text-amber-500' : 'text-rose-600'
                                            }`}>
                                            {compliance.compliancePercentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center flex flex-col items-center gap-6 grayscale opacity-20">
                        <Shield className="w-20 h-20 text-slate-400" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Shields Nominal</p>
                    </div>
                )}
            </div>

            {/* NovumFlow Bridge */}
            {novumFlowEnabled && (
                <div className="p-8 bg-black/40 border-t border-white/5 relative z-20">
                    <a
                        href={`${window.location.origin.replace('5174', '5173')}/compliance`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary-500 hover:text-white flex items-center justify-center gap-4 font-black uppercase tracking-[0.4em] transition-all"
                    >
                        <ExternalLink size={16} /> Link Satellite Command
                    </a>
                </div>
            )}
        </div>
    );
}
