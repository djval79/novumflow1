import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle, Loader2, Send } from 'lucide-react';

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
            if (!supabase) throw new Error('Supabase client not initialized');

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
                            timestamp: new Date().toISOString()
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="relative p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {!isSuccess ? (
                        <>
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Request a Demo</h3>
                                <p className="text-slate-500">
                                    Experience the future of {productInterest === 'both' ? 'Care and HR' : productInterest === 'careflow' ? 'Care Delivery' : 'HR Management'}.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="john@company.com"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Acme Care Ltd"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 italic">
                                        {error}
                                    </div>
                                )}

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" /> Send Request
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-widest font-bold">
                                    No credit card required • GDPR Compliant
                                </p>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h3>
                            <p className="text-slate-500 mb-8">
                                One of our specialists will reach out to <strong>{formData.email}</strong> shortly to schedule your personalized tour.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DemoRequestModal;
