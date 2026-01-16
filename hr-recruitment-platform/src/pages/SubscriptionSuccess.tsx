import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Settings, LayoutDashboard } from 'lucide-react';

const SubscriptionSuccess: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Active!</h1>
                <p className="text-slate-500 mb-8">
                    Welcome to the enterprise tier. Your organisation now has full access to AI compliance, advanced API keys, and cross-app sync.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
                    </button>

                    <button
                        onClick={() => navigate('/settings?tab=enterprise')}
                        className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Settings className="w-5 h-5" /> Configure Enterprise API
                    </button>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-medium italic">Powered by Stripe</span>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionSuccess;
