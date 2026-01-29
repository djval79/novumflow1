import React from 'react';
import { useTenant } from '@/context/TenantContext';
import { ExternalLink, Heart, Users, ArrowRight, Activity, Command } from 'lucide-react';

// Configuration - use localhost in development
const isDev = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.endsWith('.local');

const CAREFLOW_URL = isDev
    ? `http://${window.location.host}` // Use current host for CareFlow
    : (import.meta.env.VITE_CAREFLOW_URL || 'https://careflow-ai.vercel.app');

const NOVUMFLOW_URL = isDev
    ? 'http://localhost:5173'
    : (import.meta.env.VITE_NOVUMFLOW_URL || 'https://hr-recruitment-platform.vercel.app');

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
    if (app === 'novumflow' && !canAccessCareFlow) return null;

    // Don't show NovumFlow link if tenant doesn't have access
    if (app === 'careflow' && !canAccessNovumFlow) return null;

    return (
        <button
            onClick={handleNavigate}
            className="flex items-center gap-3 px-5 py-2.5 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 group relative overflow-hidden"
            title={app === 'novumflow' ? 'Launch CareFlow AI' : 'Launch NovumFlow HR'}
        >
            <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
                {app === 'novumflow' ? (
                    <>
                        <div className="p-1.5 bg-rose-50 rounded-lg group-hover:scale-110 transition-transform">
                            <Heart className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">CareFlow AI</span>
                    </>
                ) : (
                    <>
                        <div className="p-1.5 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">NovumFlow HR</span>
                    </>
                )}
                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
            </div>
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
        <div className="hidden md:flex items-center ml-6 pl-6 border-l border-slate-100">
            <button
                onClick={handleNavigate}
                className="group relative flex items-center gap-3 pr-2 overflow-hidden rounded-2xl transition-all hover:shadow-lg active:scale-95"
            >
                <div className={`absolute inset-0 bg-gradient-to-r ${isNovumFlow
                    ? 'from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500'
                    : 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                    } transition-colors`} />

                <div className="relative px-5 py-3 flex items-center gap-3">
                    {isNovumFlow ? (
                        <>
                            <Activity className="w-5 h-5 text-white animate-pulse" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[9px] font-black text-rose-100 uppercase tracking-widest opacity-80">Switch Context</span>
                                <span className="text-sm font-black text-white uppercase tracking-wider">CareFlow AI</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <Command className="w-5 h-5 text-white" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[9px] font-black text-indigo-100 uppercase tracking-widest opacity-80">Switch Context</span>
                                <span className="text-sm font-black text-white uppercase tracking-wider">NovumFlow</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative pr-4 flex items-center justify-center border-l border-white/20 pl-4 h-full">
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </div>
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
            className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-xl transition-all active:scale-90 ${isNovumFlow
                ? 'from-rose-500 to-pink-600 text-white shadow-rose-200'
                : 'from-blue-600 to-indigo-600 text-white shadow-blue-200'
                }`}
            title={isNovumFlow ? 'Launch CareFlow AI' : 'Launch NovumFlow HR'}
        >
            {isNovumFlow ? (
                <Heart className="w-6 h-6 fill-current" />
            ) : (
                <Users className="w-6 h-6" />
            )}
        </button>
    );
}
