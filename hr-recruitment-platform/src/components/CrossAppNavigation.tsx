import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ExternalLink, Heart, Users } from 'lucide-react';

// Configuration
const CAREFLOW_URL = import.meta.env.VITE_CAREFLOW_URL || 'http://localhost:5174';
const NOVUMFLOW_URL = import.meta.env.VITE_NOVUMFLOW_URL || 'http://localhost:5173';

interface CrossAppNavigationProps {
    app: 'novumflow' | 'careflow';
}

export default function CrossAppNavigation({ app }: CrossAppNavigationProps) {
    const { currentTenant, canAccessCareFlow, canAccessNovumFlow } = useTenant();

    if (!currentTenant) return null;

    const handleNavigate = () => {
        const targetUrl = app === 'novumflow' ? CAREFLOW_URL : NOVUMFLOW_URL;
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    // Don't show CareFlow link if tenant doesn't have access
    if (app === 'novumflow' && !canAccessCareFlow) {
        return null;
    }

    // Don't show NovumFlow link if tenant doesn't have access
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
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>NovumFlow</span>
                </>
            )}
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </button>
    );
}

// Quick link component for use in headers/navbars
export function QuickAppSwitcher() {
    const { currentTenant, canAccessCareFlow } = useTenant();

    if (!currentTenant) return null;

    // Since this is the HR Platform (NovumFlow), we always link to Careflow
    const targetUrl = CAREFLOW_URL;

    if (!canAccessCareFlow) return null;

    const handleNavigate = () => {
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="border-l border-gray-200 pl-4 ml-4">
            <button
                onClick={handleNavigate}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm"
            >
                <>
                    <Heart className="w-4 h-4" />
                    <span>Open CareFlow</span>
                </>
                <ExternalLink className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// Compact version for mobile or sidebars
export function CompactAppSwitcher() {
    const { currentTenant, canAccessCareFlow } = useTenant();

    if (!currentTenant) return null;

    // Since this is the HR Platform (NovumFlow), we always link to Careflow
    const targetUrl = CAREFLOW_URL;

    if (!canAccessCareFlow) return null;

    const handleNavigate = () => {
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    return (
        <button
            onClick={handleNavigate}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm"
            title="Open CareFlow"
        >
            <Heart className="w-5 h-5" />
        </button>
    );
}
