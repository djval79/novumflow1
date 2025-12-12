/**
 * PWA Service Worker Update Handler
 * 
 * Manages service worker lifecycle and notifies users of updates
 * This module is disabled when PWA plugin is not enabled
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to handle PWA updates
 * Returns a no-op when PWA is not enabled
 */
export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  // Register service worker if available
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 1 hour
      }).catch(console.error);
    }
  }, []);

  const update = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      window.location.reload();
    }
  }, []);

  const close = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

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
    console.error('Failed to get service worker registration', error);
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
      console.log('Service worker unregistered', { success });
      return success;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister service worker', error);
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
      console.log('All caches cleared', { count: cacheNames.length });
    }
  } catch (error) {
    console.error('Failed to clear caches', error);
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
    console.error('Failed to get cache stats', error);
  }

  return {
    cacheNames: [],
    totalSize: 0,
    cacheCount: 0,
  };
}
