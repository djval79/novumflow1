
import React from 'react';
import { Wifi, WifiOff, Zap } from 'lucide-react';

interface RealtimeIndicatorProps {
    isConnected: boolean;
    lastUpdate?: Date | null;
    showLabel?: boolean;
    className?: string;
}

/**
 * Small indicator showing real-time connection status
 */
export const RealtimeStatusIndicator: React.FC<RealtimeIndicatorProps> = ({
    isConnected,
    lastUpdate,
    showLabel = false,
    className = ''
}) => {
    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <div
                className={`w-2 h-2 rounded-full ${isConnected
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}
            />
            {showLabel && (
                <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-slate-500'
                    }`}>
                    {isConnected ? 'Live' : 'Offline'}
                </span>
            )}
        </div>
    );
};

interface RealtimeNotificationProps {
    visible: boolean;
    message: string;
    type?: 'info' | 'success' | 'warning';
}

/**
 * Toast-like notification for real-time updates
 */
export const RealtimeNotification: React.FC<RealtimeNotificationProps> = ({
    visible,
    message,
    type = 'info'
}) => {
    if (!visible) return null;

    const colors = {
        info: 'bg-primary-600 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-amber-500 text-white'
    };

    return (
        <div
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 ${colors[type]} animate-in fade-in slide-in-from-bottom-4 duration-300`}
        >
            <Zap size={14} className="animate-pulse" />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

interface LiveBadgeProps {
    className?: string;
}

/**
 * Animated "LIVE" badge for headers
 */
export const LiveBadge: React.FC<LiveBadgeProps> = ({ className = '' }) => {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold ${className}`}>
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
            LIVE
        </span>
    );
};

interface ConnectionStatusBarProps {
    isOnline: boolean;
    isRealtimeConnected: boolean;
    className?: string;
}

/**
 * Full connection status bar (for headers/footers)
 */
export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({
    isOnline,
    isRealtimeConnected,
    className = ''
}) => {
    if (isOnline && isRealtimeConnected) return null;

    return (
        <div className={`flex items-center justify-center gap-2 py-1 px-3 text-xs font-medium ${!isOnline
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-600'
            } ${className}`}>
            {!isOnline ? (
                <>
                    <WifiOff size={12} />
                    <span>You're offline - Some features may be limited</span>
                </>
            ) : (
                <>
                    <Wifi size={12} />
                    <span>Reconnecting to live updates...</span>
                </>
            )}
        </div>
    );
};

export default { RealtimeStatusIndicator, RealtimeNotification, LiveBadge, ConnectionStatusBar };
