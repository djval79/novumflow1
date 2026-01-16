import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const SubscriptionCancel: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-rose-600" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout Cancelled</h1>
                <p className="text-slate-500 mb-8">
                    No charges were made to your account. If you experienced any issues during checkout, please reach out to our support team.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/settings?tab=billing')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Try Again
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                    </button>
                </div>

                <p className="mt-8 text-xs text-slate-400">
                    Need help? Contact <a href="mailto:support@novumflow.com" className="text-indigo-600 hover:underline">support@novumflow.com</a>
                </p>
            </div>
        </div>
    );
};

export default SubscriptionCancel;
