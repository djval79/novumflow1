import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ExternalLink, Heart, Users } from 'lucide-react';

// Configuration - use localhost in development
const isDev = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.endsWith('.local');

const CAREFLOW_URL = isDev
    ? 'http://localhost:5180'
    : (import.meta.env.VITE_CAREFLOW_URL || 'https://careflow-ai.vercel.app');

const NOVUMFLOW_URL = isDev
    ? `http://${window.location.host}` // Use current host for HR
    : (import.meta.env.VITE_NOVUMFLOW_URL || 'https://hr-recruitment-platform.vercel.app');

const COMPLYFLOW_URL = isDev
    ? 'http://localhost:5190'
    : (import.meta.env.VITE_COMPLYFLOW_URL || 'https://complyflow.vercel.app');

interface CrossAppNavigationProps {
    app: 'novumflow' | 'careflow' | 'complyflow';
}

export default function CrossAppNavigation({ app }: CrossAppNavigationProps) {
    const { currentTenant, canAccessCareFlow, canAccessNovumFlow } = useTenant();

    if (!currentTenant) return null;

    const handleNavigate = () => {
        let targetUrl = NOVUMFLOW_URL;
        if (app === 'careflow') targetUrl = CAREFLOW_URL;
        if (app === 'complyflow') targetUrl = COMPLYFLOW_URL;

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
    const { currentTenant, canAccessCareFlow, canAccessNovumFlow } = useTenant();

    if (!currentTenant) return null;

    const isNovumFlow = window.location.port === '5173' ||
        window.location.hostname.includes('novumflow') ||
        window.location.hostname.includes('hr-recruitment-platform');
    const targetApp = isNovumFlow ? 'careflow' : 'novumflow';
    const targetUrl = isNovumFlow ? CAREFLOW_URL : NOVUMFLOW_URL;
    const canAccess = isNovumFlow ? canAccessCareFlow : canAccessNovumFlow;

    if (!canAccess) return null;

    const handleNavigate = () => {
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="border-l border-gray-200 pl-4 ml-4 hidden md:block">
            <button
                onClick={handleNavigate}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm group"
            >
                {isNovumFlow ? (
                    <>
                        <Heart className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                        <span>Open CareFlow</span>
                    </>
                ) : (
                    <>
                        <Users className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                        <span>Open NovumFlow</span>
                    </>
                )}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
        </div>
    );
}

// Compact version for mobile or sidebars
export function CompactAppSwitcher() {
    const { currentTenant, canAccessCareFlow, canAccessNovumFlow } = useTenant();

    if (!currentTenant) return null;

    const isNovumFlow = window.location.port === '5173' ||
        window.location.hostname.includes('novumflow') ||
        window.location.hostname.includes('hr-recruitment-platform');
    const targetUrl = isNovumFlow ? CAREFLOW_URL : NOVUMFLOW_URL;
    const canAccess = isNovumFlow ? canAccessCareFlow : canAccessNovumFlow;

    if (!canAccess) return null;

    const handleNavigate = () => {
        const url = `${targetUrl}?tenant=${currentTenant.id}`;
        window.open(url, '_blank');
    };

    return (
        <button
            onClick={handleNavigate}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm"
            title={isNovumFlow ? 'Open CareFlow' : 'Open NovumFlow'}
        >
            {isNovumFlow ? (
                <Heart className="w-5 h-5" />
            ) : (
                <Users className="w-5 h-5" />
            )}
        </button>
    );
}
