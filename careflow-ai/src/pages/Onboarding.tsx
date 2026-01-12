
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { Building, ArrowRight, Loader2, Zap, Globe, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { createTenant, loading: tenantLoading } = useTenant();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log('Onboarding - User:', user?.email, 'AuthLoading:', authLoading, 'TenantLoading:', tenantLoading);
    }, [user, authLoading, tenantLoading]);

    // Redirect to signup if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            console.log('Onboarding: No user found, redirecting to signup');
            navigate('/signup');
        }
    }, [user, authLoading, navigate]);

    // Show loading while auth is being verified
    if (authLoading || tenantLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                    <p className="text-slate-400 text-sm font-medium">Loading your workspace...</p>
                </div>
            </div>
        );
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const setupToast = toast.loading('Initializing Neural Workspace Lattice...');
        const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        try {
            const tenant = await createTenant(name, subdomain);
            if (tenant) {
                toast.success('Organization Matrix Established', { id: setupToast });
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                toast.error('Initialization Aborted', {
                    id: setupToast,
                    description: 'The specified organizational identifier is already occupied.'
                });
            }
        } catch (error) {
            toast.error('Unexpected System Logic Failure', { id: setupToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 overflow-hidden relative">
            {/* Neural Background Elements */}
            <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>

            <div className="bg-white p-20 rounded-[4.5rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] w-full max-w-2xl border border-white/10 relative z-10 animate-in fade-in zoom-in duration-1000">
                <div className="text-center mb-16 space-y-8">
                    <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border-4 border-slate-50 relative group transition-transform hover:rotate-12">
                        <Building className="text-primary-500" size={48} />
                        <div className="absolute -top-3 -right-3 p-3 bg-primary-600 rounded-2xl animate-bounce shadow-xl border-4 border-white">
                            <Zap size={16} className="text-white" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Setup <span className="text-primary-600">Hub</span></h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Initialize Organization Node • careflow ai</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] ml-10">Organizational Root Identifier</label>
                        <div className="relative">
                            <Globe className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200" size={24} />
                            <input
                                type="text"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (e.target.value.length > 3) toast.info(`Subdomain mapped: ${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.careflow.ai`, { duration: 1000 });
                                }}
                                required
                                className="w-full pl-20 pr-10 py-8 bg-slate-50 border-4 border-slate-50 rounded-[2.5rem] focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all font-black text-slate-900 text-2xl uppercase tracking-tight placeholder:text-slate-200 shadow-inner"
                                placeholder="E.G. ACME HEALTH GRID"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !name}
                        className="group w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.5em] text-[11px] py-8 rounded-[2.5rem] transition-all flex items-center justify-center gap-6 disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:shadow-primary-500/20 active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <>Initialize Infrastructure <ArrowRight size={24} className="text-primary-500 group-hover:translate-x-3 transition-transform" /></>}
                    </button>
                </form>

                <div className="mt-20 pt-10 border-t border-slate-50 flex flex-col items-center gap-6 grayscale opacity-20">
                    <Cpu size={32} className="text-slate-900" />
                    <p className="text-center text-slate-400 font-black uppercase tracking-[0.5em] text-[10px]">
                        CareFlow Neural Network Deployment Phase 01
                    </p>
                </div>
            </div>
        </div>
    );
}
