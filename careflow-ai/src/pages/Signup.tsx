
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    ShieldCheck,
    Building2,
    User,
    Mail,
    Lock,
    Globe,
    ArrowRight,
    Check,
    Loader2,
    Zap,
    Cpu,
    Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
    const navigate = useNavigate();
    // const { signUp } = useAuth(); // Removed: Direct supabase usage
    // const { createTenant } = useTenant(); // Removed: Direct RPC usage

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        orgName: '',
        subdomain: '',
        enableNovumBridge: true
    });

    const updateFormData = (fields: Partial<typeof formData>) => {
        setFormData(prev => {
            const newData = { ...prev, ...fields };
            // Auto-generate subdomain from org name if not manually edited
            if (fields.orgName !== undefined) {
                newData.subdomain = fields.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            }
            return newData;
        });
    };

    const handleNext = () => {
        if (step === 1 && (!formData.fullName || !formData.email || !formData.password)) {
            toast.error('Identity required', { description: 'Please complete all fields to proceed.' });
            return;
        }
        if (step === 2 && (!formData.orgName || !formData.subdomain)) {
            toast.error('Entity mapping required', { description: 'Please define your organization metadata.' });
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!supabase) {
            toast.error('System Configuration Error', { description: 'Database connection not initialized. Check environment variables.' });
            return;
        }

        setLoading(true);
        const signupToast = toast.loading('Synchronizing identity and infrastructure...');

        try {
            // 1. Create User (Direct Supabase call to get ID immediately)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: 'admin',
                    }
                }
            });

            if (authError) throw authError;

            // Wait for user to be available
            let user = authData.user;
            let attempts = 0;
            while (!user && attempts < 5) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data } = await supabase.auth.getUser();
                user = data.user;
                attempts++;
            }

            if (!user) throw new Error('Identity creation failed. Please check your inputs.');

            // 2. Create Tenant (Direct RPC call to avoid context race conditions)
            console.log('🔧 Creating tenant with:', {
                name: formData.orgName,
                subdomain: formData.subdomain,
                userId: authData.user.id,
                userEmail: authData.user.email
            });

            // Note: We use the ID returned from signUp directly. 
            // The create_tenant RPC is SECURITY DEFINER, so it can run even if the 
            // session isn't fully established/propagated yet (e.g. slight latency).
            const { data: tenantId, error: tenantError } = await supabase.rpc('create_tenant', {
                p_name: formData.orgName,
                p_subdomain: formData.subdomain,
                p_owner_user_id: authData.user.id
            });

            console.log('🔧 Tenant creation result:', { tenantId, error: tenantError });

            if (tenantError) {
                console.error('❌ Tenant creation failed:', {
                    message: tenantError.message,
                    details: tenantError.details,
                    hint: tenantError.hint,
                    code: tenantError.code
                });
                throw new Error(`Tenant creation failed: ${tenantError.message}${tenantError.hint ? ` (Hint: ${tenantError.hint})` : ''}`);
            }

            if (!tenantId) {
                throw new Error('Tenant creation returned no ID. This may indicate a database configuration issue.');
            }

            console.log('✅ Tenant created successfully:', tenantId);

            // 3. Update Settings if NovumFlow Bridge is enabled
            if (formData.enableNovumBridge && tenantId) {
                const initialSettings = {
                    novumflow_integration: {
                        enabled: true
                    },
                    disabled_features: []
                };

                // We perform this update using the service role/RPC permissions implicitly via the previous flow 
                // or just standard update if RLS allows. 
                // Since user is owner, they should have RLS rights if session exists.
                // If session doesn't exist (email verification needed), this might fail, 
                // but that's acceptable for a secondary setting.

                // For robustness, we check if we have a session
                if (authData.session) {
                    const { error: updateError } = await supabase
                        .from('tenants')
                        .update({ settings: initialSettings })
                        .eq('id', tenantId);

                    if (updateError) console.warn('Settings configuration warning:', updateError);
                }
            }

            toast.success('Lattice Initialization Complete', {
                id: signupToast,
                description: authData.session ? 'Welcome to CareFlow AI Mission Control.' : 'Please verify your email to access the matrix.'
            });

            if (authData.session) {
                setTimeout(() => navigate('/dashboard'), 1000);
            } else {
                setLoading(false); // Stop loading to let them see the "Check Email" message if we had one (we rely on toast for now)
            }

        } catch (error: any) {
            console.error('Signup Error:', error);

            let title = 'Initialization Failure';
            let desc = error.message || 'The neural bridge could not be established.';

            // Handle Supabase 500 Errors (Email Rate Limits)
            if (error.status === 500 || error.message?.includes('confirmation email') || error.status === 429) {
                title = 'Signal Lost (500)';
                desc = 'Email service rate limited. Please use a NEW email address to proceed.';
            }

            toast.error(title, {
                id: signupToast,
                description: desc
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Neural Background Components */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>

            <div className="w-full max-w-xl relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
                {/* Branding */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-2xl border border-white/10 group animate-bounce">
                        <Zap className="text-indigo-500 fill-indigo-500" size={32} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                            Establish <span className="text-indigo-500">Node</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Initialize Organizational Lattice</p>
                    </div>
                </div>

                {/* Progress Grid */}
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
                    ))}
                </div>

                {/* Form Matrix */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-12 shadow-2xl relative">
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Identity Spectrum</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widestAlpha">Define authorization administrator</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha ml-4">Full Identity Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={e => updateFormData({ fullName: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-black uppercase tracking-widestAlpha placeholder:text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha ml-4">Node Mail Identifier</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => updateFormData({ email: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-black uppercase tracking-widestAlpha placeholder:text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                                            placeholder="admin@organization.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha ml-4">Encryption Phrase</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => updateFormData({ password: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-black uppercase tracking-widestAlpha placeholder:text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
                            >
                                Advance Protocol <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Entity Mapping</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widestAlpha">Define organizational root parameters</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha ml-4">Organization Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={formData.orgName}
                                            onChange={e => updateFormData({ orgName: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-black uppercase tracking-widestAlpha placeholder:text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                                            placeholder="E.G. GLOBAL CARE MATRIX"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widestAlpha ml-4">Neural Node Address</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={formData.subdomain}
                                            onChange={e => updateFormData({ subdomain: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-black uppercase tracking-widestAlpha focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-500/50">.careflow.ai</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all"
                                >
                                    Revert
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
                                >
                                    Verify <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Logic Initialization</h2>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widestAlpha">Configure initial system parameters</p>
                            </div>

                            <div className="space-y-6">
                                <div className={`p-8 rounded-[2rem] border transition-all cursor-pointer ${formData.enableNovumBridge ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'bg-slate-950 border-white/5 opacity-50'}`}
                                    onClick={() => updateFormData({ enableNovumBridge: !formData.enableNovumBridge })}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="p-4 bg-indigo-500/20 rounded-2xl">
                                            <LinkIcon className="text-indigo-400" size={24} />
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.enableNovumBridge ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.enableNovumBridge ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </div>
                                    <h3 className="font-black text-white uppercase tracking-tight">NovumFlow Neural Bridge</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widestAlpha mt-2 leading-relaxed">
                                        Enable automated sync of staff records, compliance documentation, and neural integrity checks between NovumFlow HR and CareFlow AI.
                                    </p>
                                </div>

                                <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl flex items-center gap-6">
                                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                                        <ShieldCheck className="text-emerald-500" size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white uppercase">Trial Tier Protocol</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase">14-Day Full Matrix Capability Access</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all"
                                >
                                    Revert
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Initialize Node <Cpu size={20} className="group-hover:rotate-45 transition-transform" /></>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Comms */}
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Already have an established identity? <Link to="/login" className="text-indigo-500 hover:text-indigo-400">Initialize Link</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
