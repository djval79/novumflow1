
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/context/TenantContext';
import { supabase } from '@/lib/supabase';
import { Building2, Save, Check, AlertTriangle, Link as LinkIcon, ShieldCheck, CreditCard, Mail, Zap, Target, History, ShieldAlert, Cpu, Globe, RefreshCw } from 'lucide-react';
import StripeConnect from '@/components/organization/StripeConnect';
import SmtpSettings from '@/components/organization/SmtpSettings';
import { toast } from 'sonner';

export default function TenantSettings() {
    const { currentTenant, refreshTenants } = useTenant();
    const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'email'>('general');
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        if (currentTenant) {
            setSettings(currentTenant.settings || {});
        }
    }, [currentTenant]);

    const handleSave = async () => {
        if (!currentTenant) return;
        setSaving(true);
        const saveToast = toast.loading('Authorizing Lattice Configuration Update...');

        try {
            const { error } = await supabase
                .from('tenants')
                .update({ settings })
                .eq('id', currentTenant.id);

            if (error) throw error;

            toast.success('Lattice Configuration Synchronized', { id: saveToast });
            await refreshTenants();
        } catch (error: any) {
            toast.error('Synchronization Failure', { id: saveToast });
        } finally {
            setSaving(false);
        }
    };

    const toggleFeature = (feature: string) => {
        setSettings((prev: any) => {
            const disabledFeatures = prev.disabled_features || [];
            const isCurrentlyDisabled = disabledFeatures.includes(feature);

            let newDisabled;
            if (isCurrentlyDisabled) {
                newDisabled = disabledFeatures.filter((f: string) => f !== feature);
                toast.success(`Feature Protocol Enabled: ${feature.replace(/_/g, ' ').toUpperCase()}`);
            } else {
                newDisabled = [...disabledFeatures, feature];
                toast.warning(`Feature Protocol Disabled: ${feature.replace(/_/g, ' ').toUpperCase()}`);
            }

            return { ...prev, disabled_features: newDisabled };
        });
    };

    const toggleIntegration = (enabled: boolean) => {
        setSettings((prev: any) => ({
            ...prev,
            novumflow_integration: {
                ...prev.novumflow_integration,
                enabled
            }
        }));
        if (enabled) toast.success('NovumFlow Bridge Sequence Initialized');
        else toast.warning('NovumFlow Bridge Decommissioned');
    };

    const handleSyncAll = async () => {
        if (!currentTenant) return;
        const toastId = toast.loading('Synchronizing All Employees...');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const response = await fetch('https://niikshfoecitimepiifo.supabase.co/functions/v1/sync-to-careflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    tenant_id: currentTenant.id,
                    action: 'sync_all'
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Sync failed');
            }

            const result = await response.json();
            toast.success(result.message, { id: toastId });
        } catch (error: any) {
            console.error('Sync Error:', error);
            toast.error(error.message || 'Synchronization Failed', { id: toastId });
        }
    };

    if (!currentTenant) return (
        <div className="h-screen flex items-center justify-center bg-white">
            <Cpu className="text-primary-600 animate-spin" size={64} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-12 h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-hide pr-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-4">
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Lattice <span className="text-primary-600">Config</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mt-2">
                        Organization Profile • Neural Compliance Hub • Global Integration Matrix
                    </p>
                </div>
                {activeTab === 'general' && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-black flex items-center gap-6 active:scale-95 transition-all disabled:opacity-30"
                    >
                        {saving ? <Cpu className="animate-spin text-primary-500" size={20} /> : <Save size={20} className="text-primary-500" />}
                        Synchronize Config
                    </button>
                )}
            </div>

            {/* Navigation Deck */}
            <div className="flex p-2 bg-white border border-slate-100 rounded-[3rem] w-fit shadow-2xl relative z-50">
                <button
                    onClick={() => {
                        setActiveTab('general');
                        toast.info('Retrieving General & Compliance Spectrum');
                    }}
                    className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'general' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <Building2 size={20} /> Profile & Compliance
                </button>
                <button
                    onClick={() => {
                        setActiveTab('payments');
                        toast.info('Retrieving Fiscal Integration Spectrum');
                    }}
                    className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'payments' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <CreditCard size={20} /> Payments
                </button>
                <button
                    onClick={() => {
                        setActiveTab('email');
                        toast.info('Retrieving Comms Transmission Spectrum');
                    }}
                    className={`px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === 'email' ? 'bg-slate-900 text-white shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <Mail size={20} /> Transmission Settings
                </button>
            </div>

            <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700 min-h-[600px]">
                {activeTab === 'general' && (
                    <div className="p-16 space-y-16">
                        {/* General Profile Metadata */}
                        <div className="space-y-10 group">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl transition-transform group-hover:rotate-6">
                                    <Building2 size={32} className="text-primary-500" />
                                </div>
                                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Entity Metadata</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 text-left">Entity Identifier</label>
                                    <input
                                        type="text"
                                        value={currentTenant.name?.toUpperCase() || ''}
                                        disabled
                                        className="w-full px-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widestAlpha text-slate-400 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 text-left">Subdomain Node</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 font-black text-[11px]">HTTPS://</div>
                                        <input
                                            type="text"
                                            value={currentTenant.subdomain?.toUpperCase() || ''}
                                            disabled
                                            className="w-full pl-24 pr-8 py-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] text-[11px] font-black uppercase tracking-widestAlpha text-slate-400 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NovumFlow Lattice Bridge */}
                        <div className="p-12 bg-slate-900 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-white/5 relative overflow-hidden group/bridge">
                            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
                            <div className="flex flex-col md:flex-row items-center justify-between mb-12 relative z-10 gap-10">
                                <div className="flex items-center gap-8">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl transition-transform group-hover/bridge:rotate-12">
                                        <LinkIcon className="w-10 h-10 text-primary-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">NovumFlow Bridge</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Neural Synchronization Spectrum for Staff & Compliance</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-150">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.novumflow_integration?.enabled || false}
                                        onChange={(e) => toggleIntegration(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-2xl"></div>
                                </label>
                            </div>

                            {settings.novumflow_integration?.enabled && (
                                <div className="space-y-10 animate-in fade-in relative z-10">
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3">
                                            <Check className="text-emerald-500" size={24} />
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight leading-relaxed">Auto-Entity Propagation</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3">
                                            <Check className="text-emerald-500" size={24} />
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight leading-relaxed">RTW Neural Enforcement</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-3">
                                            <Check className="text-emerald-500" size={24} />
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight leading-relaxed">DBS Integrity Syncing</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Global Webhook Transceiver</label>
                                            <button
                                                onClick={handleSyncAll}
                                                className="px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widestAlpha hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                            >
                                                <RefreshCw size={14} /> Sync All Staff
                                            </button>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <code className="flex-1 bg-black/50 px-8 py-5 rounded-2xl border border-white/10 text-[10px] font-mono text-primary-400 overflow-hidden whitespace-nowrap text-ellipsis">
                                                https://niikshfoecitimepiifo.supabase.co/functions/v1/sync-to-careflow
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText('https://niikshfoecitimepiifo.supabase.co/functions/v1/sync-to-careflow');
                                                    toast.success('Webhook Protocol Authenticator Copied');
                                                }}
                                                className="px-10 py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widestAlpha hover:bg-slate-200 transition-all shadow-2xl active:scale-95 whitespace-nowrap"
                                            >
                                                Copy Node
                                            </button>
                                        </div>
                                        <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] ml-4 flex items-center gap-3">
                                            <Globe size={12} /> Inject this transceiver node into NovumFlow Webhook Config.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Neural Compliance Enforcement Matrix */}
                        <div className="space-y-10 group">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-rose-900 text-white rounded-[2rem] shadow-2xl transition-transform group-hover:rotate-6">
                                    <ShieldCheck size={32} className="text-rose-400" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Integrity Lockouts</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Deterministic Blocks for Non-Compliant Entity Deployment</p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                <div className="flex items-center justify-between p-10 bg-slate-50 rounded-[3rem] border-4 border-slate-50 hover:bg-white hover:shadow-2xl transition-all duration-500 group/item">
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Lockdown Invalid RTW Assets</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Prevent mission assignment if Right to Work metadata is null or expired</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-125">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!settings.disabled_features?.includes('block_rtw')}
                                            onChange={() => toggleFeature('block_rtw')}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600 shadow-xl"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-10 bg-slate-50 rounded-[3rem] border-4 border-slate-50 hover:bg-white hover:shadow-2xl transition-all duration-500 group/item">
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-slate-900 uppercase tracking-tight">Lockdown Invalid DBS Protocol</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widestAlpha">Prevent mission assignment if DBS metadata is missing, expired, or flagged</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-125">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!settings.disabled_features?.includes('block_dbs')}
                                            onChange={() => toggleFeature('block_dbs')}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600 shadow-xl"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="p-16 animate-in slide-in-from-right-10 duration-700">
                        <StripeConnect />
                    </div>
                )}
                {activeTab === 'email' && (
                    <div className="p-16 animate-in slide-in-from-right-10 duration-700">
                        <SmtpSettings />
                    </div>
                )}
            </div>
        </div>
    );
}
