/**
 * PWA Service Worker Update Handler
 * 
 * Manages service worker lifecycle and notifies users of updates
 */

import { useRegisterSW } from 'virtual:pwa-register/react';
import { log } from './logger';

/**
 * Hook to handle PWA updates
 */
export function usePWAUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        log.info('Service Worker registered successfully');
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 1 hour
      }
    },
    onRegisterError(error) {
      log.error('Service Worker registration failed', error);
    },
    onOfflineReady() {
      log.info('App ready to work offline');
      setOfflineReady(true);
    },
    onNeedRefresh() {
      log.info('New content available, please refresh');
      setNeedRefresh(true);
    },
  });

  /**
   * Update the service worker and reload the page
   */
  const update = async () => {
    try {
      log.info('Updating service worker...');
      await updateServiceWorker(true); // true = reload page after update
    } catch (error) {
      log.error('Failed to update service worker', error);
    }
  };

  /**
   * Close the update notification without updating
   */
  const close = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  return {
    needRefresh,
    offlineReady,
    update,
    close,
  };
}

/**
 * Check if the app is running as a PWA
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    log.error('Failed to get service worker registration', error);
    return null;
  }
}

/**
 * Unregister service worker (for debugging)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration();
    if (registration) {
      const success = await registration.unregister();
      log.info('Service worker unregistered', { success });
      return success;
    }
    return false;
  } catch (error) {
    log.error('Failed to unregister service worker', error);
    return false;
  }
}

/**
 * Clear all caches (for debugging)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      log.info('All caches cleared', { count: cacheNames.length });
    }
  } catch (error) {
    log.error('Failed to clear caches', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  cacheNames: string[];
  totalSize: number;
  cacheCount: number;
}> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      // Estimate cache sizes (rough estimation)
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        totalSize += keys.length * 50000; // Rough estimate: 50KB per cached item
      }

      return {
        cacheNames,
        totalSize,
        cacheCount: cacheNames.length,
      };
    }
  } catch (error) {
    log.error('Failed to get cache stats', error);
  }

  return {
    cacheNames: [],
    totalSize: 0,
    cacheCount: 0,
  };
}
