/**
 * Offline storage utility for persistent data caching.
 */

const CACHE_PREFIX = 'nv_cache_';

export const offlineStorage = {
    /**
     * Save data to local cache with an optional TTL (Time To Live).
     */
    save: (key: string, data: any, ttlHours: number = 24) => {
        const item = {
            data,
            expiry: Date.now() + (ttlHours * 60 * 60 * 1000)
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    },

    /**
     * Retrieve data from cache. Returns null if expired or missing.
     */
    load: <T>(key: string): T | null => {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;

        try {
            const item = JSON.parse(raw);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return item.data as T;
        } catch (e) {
            return null;
        }
    },

    /**
     * Clear specific or all cache items.
     */
    clear: (key?: string) => {
        if (key) {
            localStorage.removeItem(CACHE_PREFIX + key);
        } else {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(k);
                }
            });
        }
    }
};
