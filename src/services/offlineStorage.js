/**
 * Offline Storage Service
 * Handles 'Read Optimization' via localStorage caching.
 * strategy: Cache-First with Stale-Check.
 */

const KEYS = {
    PREFIX: 'sugar_offline_',
    LOGS: 'sugar_offline_logs',
    PROFILE: 'sugar_offline_profile_data'
};

const DEFAULT_STALE_MS = 10 * 60 * 1000; // 10 Minutes

export const offlineStorage = {
    /**
     * Save data to local cache with timestamp
     */
    save: (key, data) => {
        try {
            const payload = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(KEYS.PREFIX + key, JSON.stringify(payload));
        } catch (e) {
            console.warn("Offline Storage Full/Error", e);
        }
    },

    /**
     * Get data from local cache
     * returns { data, timestamp } or null
     */
    get: (key) => {
        try {
            const raw = localStorage.getItem(KEYS.PREFIX + key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    },

    /**
     * Check if cache is stale
     */
    isStale: (key, durationMs = DEFAULT_STALE_MS) => {
        const cached = offlineStorage.get(key);
        if (!cached) return true;
        return (Date.now() - cached.timestamp) > durationMs;
    },

    /**
     * Clear specific cache
     */
    clear: (key) => {
        localStorage.removeItem(KEYS.PREFIX + key);
    }
};
