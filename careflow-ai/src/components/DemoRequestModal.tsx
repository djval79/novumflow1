import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle, Loader2, Send, Zap } from 'lucide-react';

interface DemoRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    productInterest: 'careflow' | 'novumflow' | 'both';
}

const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose, productInterest }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        companyName: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const { error: submitError } = await supabase
                .from('demo_requests')
                .insert([
                    {
                        full_name: formData.fullName,
                        email: formData.email,
                        company_name: formData.companyName,
                        product_interest: productInterest,
                        metadata: {
                            source: window.location.hostname,
                            user_agent: navigator.userAgent,
                            timestamp: new Date().toISOString(),
                            app: 'careflow-ai'
                        }
                    },
                ]);

            if (submitError) throw submitError;

            setIsSuccess(true);
            setFormData({ fullName: '', email: '', companyName: '' });
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="relative p-10">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {!isSuccess ? (
                        <>
                            <div className="mb-8">
                                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                                    <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">Request a Demo</h3>
                                <p className="text-slate-400">
                                    Experience the AI-powered mission control for care delivery.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Work Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="john@company.com"
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Acme Care Group"
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-rose-500/10 text-rose-400 text-sm rounded-2xl border border-rose-500/20 italic">
                                        {error}
                                    </div>
                                )}

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" /> DISPATCHING...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-6 h-6" /> REQUEST TOUR
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center text-slate-600 uppercase tracking-[0.2em] font-bold">
                                    GDPR COMPLIANT • SECURE TRANSMISSION
                                </p>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-3">Transmission Successful</h3>
                            <p className="text-slate-400 mb-10 leading-relaxed">
                                Our operations team will contact <strong>{formData.email}</strong> to coordinate your demonstration.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-12 py-4 rounded-2xl bg-white text-slate-950 font-black hover:bg-slate-200 transition-all"
                            >
                                DISMISS
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DemoRequestModal;
