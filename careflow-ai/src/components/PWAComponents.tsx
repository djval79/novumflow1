
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

// Check if the app is running as a PWA
export const isPWA = () => {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
    );
};

// Hook to detect online status
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};

// PWA Update Prompt Component
export const PWAUpdatePrompt: React.FC = () => {
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setShowUpdatePrompt(true);
                            }
                        });
                    }
                });
            });

            // Check for updates every 5 minutes
            const checkForUpdates = setInterval(() => {
                if (registration) {
                    registration.update();
                }
            }, 5 * 60 * 1000);

            return () => clearInterval(checkForUpdates);
        }
    }, [registration]);

    const handleUpdate = () => {
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setShowUpdatePrompt(false);
            window.location.reload();
        }
    };

    if (!showUpdatePrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary-600 text-white p-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                    <RefreshCw size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm">Update Available</h4>
                    <p className="text-xs text-primary-100 mt-1">
                        A new version of CareFlow is available. Refresh to update.
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-1.5 bg-white text-primary-700 font-bold text-xs rounded-lg hover:bg-primary-50 transition-colors"
                        >
                            Update Now
                        </button>
                        <button
                            onClick={() => setShowUpdatePrompt(false)}
                            className="px-4 py-1.5 bg-white/20 text-white font-bold text-xs rounded-lg hover:bg-white/30 transition-colors"
                        >
                            Later
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setShowUpdatePrompt(false)}
                    className="text-white/60 hover:text-white p-1"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

// Offline Banner Component
export const OfflineBanner: React.FC = () => {
    const isOnline = useOnlineStatus();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Reset dismissed state when coming back online
        if (isOnline) {
            setDismissed(false);
        }
    }, [isOnline]);

    if (isOnline || dismissed) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 z-50 flex items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                You're offline. Some features may be limited.
            </span>
            <button
                onClick={() => setDismissed(true)}
                className="text-white/80 hover:text-white"
            >
                <X size={16} />
            </button>
        </div>
    );
};

// Install Prompt Component (for iOS and desktop)
export const InstallPrompt: React.FC = () => {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Check if not already installed and not dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const alreadyInstalled = isPWA();

        if (!dismissed && !alreadyInstalled) {
            // Listen for the beforeinstallprompt event
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowInstallPrompt(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            // For iOS, show manual install instructions after delay
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS && !navigator.userAgent.includes('Safari')) {
                setTimeout(() => setShowInstallPrompt(true), 10000);
            }

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowInstallPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowInstallPrompt(false);
    };

    if (!showInstallPrompt) return null;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-slate-200 p-4 rounded-xl shadow-xl z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold text-lg">
                    CF
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-slate-900">Install CareFlow</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        {isIOS
                            ? 'Tap the share button, then "Add to Home Screen"'
                            : 'Install for quick access and offline support'}
                    </p>
                    <div className="flex gap-2 mt-3">
                        {deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="px-4 py-1.5 bg-primary-600 text-white font-bold text-xs rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Install
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Not now
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-slate-400 hover:text-slate-600 p-1"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default { PWAUpdatePrompt, OfflineBanner, InstallPrompt, useOnlineStatus, isPWA };
