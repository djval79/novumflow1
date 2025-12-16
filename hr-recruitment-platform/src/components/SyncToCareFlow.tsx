import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import {
    RefreshCw, CheckCircle, AlertCircle, Heart,
    Users, ArrowRight, Loader2
} from 'lucide-react';

interface SyncToCareFlowProps {
    employeeId?: string;
    employeeName?: string;
    onSuccess?: () => void;
}

export default function SyncToCareFlow({
    employeeId,
    employeeName,
    onSuccess
}: SyncToCareFlowProps) {
    const { currentTenant } = useTenant();
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    // Check if CareFlow is enabled for this tenant
    const careflowEnabled = currentTenant?.settings?.careflow_enabled !== false;

    if (!careflowEnabled) {
        return null;
    }

    async function handleSync() {
        if (!currentTenant) return;

        setSyncing(true);
        setResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('sync-to-careflow', {
                body: {
                    employee_id: employeeId,
                    tenant_id: currentTenant.id,
                    action: employeeId ? 'sync' : 'sync_all'
                }
            });

            if (error) throw error;

            setResult({
                success: data.success,
                message: data.message || 'Sync completed'
            });

            if (data.success && onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Sync error:', error);
            setResult({
                success: false,
                message: error.message || 'Failed to sync with CareFlow'
            });
        } finally {
            setSyncing(false);

            // Clear result after 5 seconds
            setTimeout(() => setResult(null), 5000);
        }
    }

    return (
        <div className="inline-flex flex-col items-start">
            <button
                onClick={handleSync}
                disabled={syncing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${syncing
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-sm'
                    }`}
            >
                {syncing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <Heart className="w-4 h-4" />
                        {employeeId ? 'Sync to CareFlow' : 'Sync All to CareFlow'}
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>

            {/* Result Message */}
            {result && (
                <div className={`mt-2 flex items-center gap-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {result.success ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    {result.message}
                </div>
            )}
        </div>
    );
}

// Compact sync button for table rows
export function CompactSyncButton({
    employeeId,
    onSuccess
}: {
    employeeId: string;
    onSuccess?: () => void;
}) {
    const { currentTenant } = useTenant();
    const [syncing, setSyncing] = useState(false);
    const [synced, setSynced] = useState(false);

    const careflowEnabled = currentTenant?.settings?.careflow_enabled !== false;
    if (!careflowEnabled) return null;

    async function handleSync() {
        if (!currentTenant) return;

        setSyncing(true);

        try {
            const { data, error } = await supabase.functions.invoke('sync-to-careflow', {
                body: {
                    employee_id: employeeId,
                    tenant_id: currentTenant.id,
                    action: 'sync'
                }
            });

            if (error) throw error;

            if (data.success) {
                setSynced(true);
                onSuccess?.();
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    }

    if (synced) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                Synced
            </span>
        );
    }

    return (
        <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-pink-600 hover:bg-pink-50 rounded transition"
            title="Sync to CareFlow"
        >
            {syncing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
                <Heart className="w-3 h-3" />
            )}
            CareFlow
        </button>
    );
}
