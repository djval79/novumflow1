import React, { useState } from 'react';
import { CreditCard, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/context/TenantContext';

export default function StripeConnect() {
    const { currentTenant, refreshTenants } = useTenant();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const isConnected = currentTenant?.settings?.payment_gateway?.is_enabled;
    const accountId = currentTenant?.settings?.payment_gateway?.account_id;

    const handleConnect = async () => {
        setLoading(true);
        setMessage(null);
        try {
            // In a real app, this would redirect to Stripe OAuth
            // For now, we mock the connection by generating a fake account ID
            const mockAccountId = 'acct_' + Math.random().toString(36).substr(2, 9);

            const { error } = await supabase.rpc('save_tenant_stripe_config', {
                p_account_id: mockAccountId,
                p_tenant_id: currentTenant?.id
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Successfully connected to Stripe (Mock)' });
            await refreshTenants();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Payment Gateway</h2>
                    <p className="text-sm text-gray-500">Collect payments from residents directly</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                <path d="M33.95 21.35c-1.1-5.1-5.6-8.7-10.8-8.7H14.4c-.6 0-1.1.5-1.1 1.1v12.5c0 .6.5 1.1 1.1 1.1h18.5c.6 0 1.1-.5 1.1-1.1V21.35z" fill="#635BFF" fillOpacity="0.2" />
                                <path d="M14.4 12.65h8.75c5.2 0 9.7 3.6 10.8 8.7V21.35H14.4v-8.7z" fill="#635BFF" />
                                <path d="M14.4 21.35h19.55v4.9c0 .6-.5 1.1-1.1 1.1H14.4v-6z" fill="#00D4FF" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Stripe Connect</h3>
                            <p className="text-sm text-gray-500">
                                {isConnected
                                    ? `Connected (Account: ${accountId})`
                                    : 'Accept credit cards and bank transfers'}
                            </p>
                        </div>
                    </div>

                    {isConnected ? (
                        <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full text-sm">
                            <Check className="w-4 h-4" />
                            Connected
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Connecting...' : 'Connect with Stripe'}
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="text-sm text-gray-500">
                    <p>By connecting Stripe, you agree to their <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>.</p>
                </div>
            </div>
        </div>
    );
}
