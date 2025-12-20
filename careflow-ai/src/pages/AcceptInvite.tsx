
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AcceptInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying invitation...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Null invitation token spectrum detected.');
            toast.error('Invitation Token Null');
            return;
        }

        const acceptInvite = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    toast.info('Neural Handshake Required: Please authenticate.');
                    navigate(`/login?returnUrl=/accept-invite?token=${token}`);
                    return;
                }

                const { error } = await supabase.rpc('accept_tenant_invitation', {
                    p_token: token
                });

                if (error) throw error;

                setStatus('success');
                setMessage('Invitation accepted! Neural lattice integration complete.');
                toast.success('Lattice Integration Successful');

                setTimeout(() => {
                    navigate('/');
                }, 3000);

            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Lattice integration failed.');
                toast.error('Integration Failure');
            }
        };

        acceptInvite();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.03] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

            <div className="bg-white rounded-[4rem] shadow-[0_50px_150px_rgba(0,0,0,0.5)] max-w-lg w-full p-20 text-center relative z-10 animate-in zoom-in-95 duration-700 border border-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-[60px] -mr-16 -mt-16" />

                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-10">
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] shadow-inner relative group">
                            <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
                            <Sparkles className="absolute -top-2 -right-2 text-primary-400 animate-pulse" size={32} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Neural Handshake</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{message.toUpperCase()}</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-10 animate-in zoom-in duration-500">
                        <div className="w-32 h-32 bg-emerald-900 border-8 border-emerald-500/20 rounded-[2.5rem] flex items-center justify-center shadow-[0_30px_60px_rgba(16,185,129,0.3)] animate-bounce">
                            <ShieldCheck className="w-16 h-16 text-emerald-400" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Access Granted</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-[250px] mx-auto leading-relaxed">{message.toUpperCase()}</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-6 px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-black transition-all shadow-2xl active:scale-95 group"
                        >
                            Enter Matrix <ArrowRight className="w-6 h-6 text-primary-500 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-10 animate-in zoom-in duration-500">
                        <div className="w-32 h-32 bg-rose-900 border-8 border-rose-500/20 rounded-[2.5rem] flex items-center justify-center shadow-[0_30px_60px_rgba(225,29,72,0.3)]">
                            <XCircle className="w-16 h-16 text-rose-400" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Logic Error</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-[250px] mx-auto leading-relaxed">{message.toUpperCase()}</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="px-12 py-6 border-4 border-slate-50 text-slate-400 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:text-slate-900 hover:border-slate-200 transition-all shadow-xl active:scale-95"
                        >
                            Return to Base
                        </button>
                    </div>
                )}
            </div>

            {/* Futuristic Decor */}
            <div className="absolute top-12 left-12 p-8 border border-white/10 rounded-3xl backdrop-blur-3xl hidden lg:block">
                <div className="flex items-center gap-4 text-[10px] font-black text-white uppercase tracking-[0.5em]">
                    <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                    Secure Vision Protocol Active
                </div>
            </div>

            <div className="absolute bottom-12 right-12 p-8 border border-white/10 rounded-3xl backdrop-blur-3xl hidden lg:block">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] text-right">
                    Neural Bridge v4.2.0<br />
                    Status: <span className="text-emerald-500">OPTIMIZED</span>
                </div>
            </div>
        </div>
    );
}
