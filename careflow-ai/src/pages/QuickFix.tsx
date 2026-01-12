import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function QuickFix() {
    const { user } = useAuth();
    const [isFixing, setIsFixing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const navigate = useNavigate();

    const log = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, message]);
    };

    const createTenantForCurrentUser = async () => {
        if (!user || !supabase) {
            toast.error('No user logged in or database unavailable');
            return;
        }

        setIsFixing(true);
        setLogs([]);

        try {
            log(`🔍 Current user: ${user.email} (${user.id})`);

            // Check existing tenants
            const { data: existingMemberships } = await supabase
                .from('user_tenant_memberships')
                .select('*')
                .eq('user_id', user.id);

            log(`📊 Found ${existingMemberships?.length || 0} existing memberships`);

            if (existingMemberships && existingMemberships.length > 0) {
                log('✅ User already has tenants!');
                toast.success('You already have an organization!');
                setTimeout(() => navigate('/dashboard'), 1000);
                return;
            }

            // Create a default tenant
            const orgName = user.email?.split('@')[0] || 'My Organization';
            const subdomain = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');

            log(`🏗️ Creating tenant: ${orgName} (${subdomain})`);

            const { data: tenantId, error: tenantError } = await supabase.rpc('create_tenant', {
                p_name: orgName,
                p_subdomain: subdomain,
                p_owner_user_id: user.id,
                p_subscription_tier: 'trial'
            });

            if (tenantError) {
                log(`❌ Error: ${tenantError.message}`);
                log(`📝 Details: ${JSON.stringify(tenantError, null, 2)}`);
                toast.error('Failed to create organization', { description: tenantError.message });
                return;
            }

            log(`✅ Tenant created successfully! ID: ${tenantId}`);
            toast.success('Organization created!', { description: 'Redirecting to dashboard...' });

            setTimeout(() => {
                window.location.href = '/#/dashboard';
            }, 1500);

        } catch (error: any) {
            log(`💥 Exception: ${error.message}`);
            console.error('Fix error:', error);
            toast.error('Something went wrong', { description: error.message });
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-slate-800 rounded-3xl p-12 border border-slate-700">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wrench className="w-10 h-10 text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quick Fix Tool</h1>
                    <p className="text-slate-400">Fix your account and create your organization</p>
                </div>

                {user ? (
                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
                            <div className="text-sm text-slate-400 mb-1">Logged in as:</div>
                            <div className="text-white font-mono text-sm">{user.email}</div>
                            <div className="text-slate-600 font-mono text-xs mt-1">{user.id}</div>
                        </div>

                        <button
                            onClick={createTenantForCurrentUser}
                            disabled={isFixing}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isFixing ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    Fixing...
                                </>
                            ) : (
                                <>
                                    <Wrench size={24} />
                                    Create My Organization
                                </>
                            )}
                        </button>

                        {logs.length > 0 && (
                            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-700 max-h-96 overflow-y-auto">
                                <div className="text-sm font-bold text-slate-400 mb-3">Console Logs:</div>
                                <div className="space-y-2 font-mono text-xs">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-slate-300">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-slate-400">
                        <XCircle className="w-12 h-12 mx-auto mb-4" />
                        <p>No user logged in. Please log in first.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
