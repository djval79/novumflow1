import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ExternalLink, Heart, Users } from 'lucide-react';

// Configuration - update these for production
const CAREFLOW_URL = import.meta.env.VITE_CAREFLOW_URL || 'http://localhost:5174';
const NOVUMFLOW_URL = import.meta.env.VITE_NOVUMFLOW_URL || 'http://localhost:5173';

interface CrossAppNavigationProps {
    app: 'novumflow' | 'careflow';
}

export default function CrossAppNavigation({ app }: CrossAppNavigationProps) {
    const { currentTenant } = useTenant();

    if (!currentTenant) return null;

    const handleNavigate = () => {
        const targetUrl = app === 'novumflow' ? CAREFLOW_URL : NOVUMFLOW_URL;
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    // Check if tenant has access to the target app
    const canAccessCareFlow = currentTenant.settings?.careflow_enabled !== false;
    const canAccessNovumFlow = currentTenant.settings?.novumflow_enabled !== false;

    // Don't show link if tenant doesn't have access
    if (app === 'novumflow' && !canAccessCareFlow) {
        return null;
    }
    if (app === 'careflow' && !canAccessNovumFlow) {
        return null;
    }

    return (
        <button
            onClick={handleNavigate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={app === 'novumflow' ? 'Open in CareFlow' : 'Open in NovumFlow'}
        >
            {app === 'novumflow' ? (
                <>
                    <Heart className="w-4 h-4 text-pink-600" />
                    <span>CareFlow</span>
                </>
            ) : (
                <>
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>NovumFlow</span>
                </>
            )}
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </button>
    );
}

// Quick link component for use in headers/navbars
export function QuickAppSwitcher() {
    const { currentTenant } = useTenant();

    if (!currentTenant) return null;

    // Detect current app based on port or hostname
    const isNovumFlow = typeof window !== 'undefined' && (
        window.location.port === '5173' ||
        window.location.hostname.includes('novumflow')
    );

    const targetUrl = isNovumFlow ? CAREFLOW_URL : NOVUMFLOW_URL;
    const canAccessCareFlow = currentTenant.settings?.careflow_enabled !== false;

    // Show CareFlow link when in NovumFlow
    if (isNovumFlow && !canAccessCareFlow) return null;

    const handleNavigate = () => {
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="border-l border-gray-200 pl-4 ml-4">
            <button
                onClick={handleNavigate}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all shadow-sm"
                title="Switch to CareFlow"
            >
                <Heart className="w-4 h-4" />
                <span className="hidden lg:inline">CareFlow</span>
                <ExternalLink className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// Compact version for mobile or sidebars
export function CompactAppSwitcher() {
    const { currentTenant } = useTenant();

    if (!currentTenant) return null;

    const isNovumFlow = typeof window !== 'undefined' && (
        window.location.port === '5173' ||
        window.location.hostname.includes('novumflow')
    );

    const targetUrl = isNovumFlow ? CAREFLOW_URL : NOVUMFLOW_URL;
    const canAccessCareFlow = currentTenant.settings?.careflow_enabled !== false;

    if (isNovumFlow && !canAccessCareFlow) return null;

    const handleNavigate = () => {
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    return (
        <button
            onClick={handleNavigate}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 transition-all shadow-sm"
            title="Open CareFlow"
        >
            <Heart className="w-5 h-5" />
        </button>
    );
}
