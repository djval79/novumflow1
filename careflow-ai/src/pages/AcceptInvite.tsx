
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function AcceptInvite() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying invitation...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No invitation token provided.');
            return;
        }

        const acceptInvite = async () => {
            try {
                // Check if user is logged in
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    // Redirect to login with return URL
                    // We store the token in local storage or pass it as query param
                    navigate(`/login?returnUrl=/accept-invite?token=${token}`);
                    return;
                }

                const { error } = await supabase.rpc('accept_tenant_invitation', {
                    p_token: token
                });

                if (error) throw error;

                setStatus('success');
                setMessage('Invitation accepted! You are now a member.');

                // Refresh session/tenant context might be needed here
                // For now, just wait a bit then redirect
                setTimeout(() => {
                    navigate('/');
                }, 2000);

            } catch (err: any) {
                console.error('Accept invite error:', err);
                setStatus('error');
                setMessage(err.message || 'Failed to accept invitation.');
            }
        };

        acceptInvite();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900">Joining Organization...</h2>
                        <p className="text-gray-500 mt-2">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Welcome Aboard!</h2>
                        <p className="text-gray-500 mt-2 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Invitation Failed</h2>
                        <p className="text-gray-500 mt-2 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
