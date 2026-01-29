/**
 * In-memory caching service for front-end query optimization.
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cacheMap = new Map<string, CacheEntry<any>>();

export const cachingService = {
    /**
     * Wrap a promise-returning function with a cache.
     */
    useCache: async <T>(key: string, fetchFn: () => Promise<T>, ttlMs: number = 60000): Promise<T> => {
        const entry = cacheMap.get(key);

        if (entry && Date.now() < entry.expiry) {
            return entry.data as T;
        }

        const data = await fetchFn();
        cacheMap.set(key, {
            data,
            expiry: Date.now() + ttlMs
        });

        return data;
    },

    /**
     * Clear specific or all cache entries.
     */
    invalidate: (key?: string) => {
        if (key) {
            cacheMap.delete(key);
        } else {
            cacheMap.clear();
        }
    }
};
