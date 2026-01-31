/**
 * Offline Storage Service (SECURE)
 * Handles 'Read Optimization' via Encrypted localStorage.
 * Strategy: Cache-First with Stale-Check + AES-GCM Encryption.
 */

import { cryptoUtils } from '../utils/crypto.js';

const KEYS = {
    PREFIX: 'sugar_offline_',
    LOGS: 'sugar_offline_logs',
    PROFILE: 'sugar_offline_profile_data'
};

const DEFAULT_STALE_MS = 10 * 60 * 1000; // 10 Minutes

export const offlineStorage = {
    /**
     * Save data to local cache (Encrypted)
     * @param {string} key 
     * @param {any} data 
     * @param {string} userId - REQUIRED for encryption
     */
    save: async (key, data, userId) => {
        if (!userId) return;
        try {
            const payload = {
                timestamp: Date.now(),
                data: data
            };
            // ENCRYPT BEFORE STORAGE
            const encrypted = await cryptoUtils.encrypt(payload, userId);
            if (encrypted) {
                localStorage.setItem(KEYS.PREFIX + key + '_' + userId, encrypted);
            }
        } catch (e) {
            console.warn("Offline Storage Full/Error", e);
        }
    },

    /**
     * Get data from local cache (Decrypted)
     * @param {string} key 
     * @param {string} userId - REQUIRED for decryption
     * @returns {Promise<{data: any, timestamp: number} | null>}
     */
    get: async (key, userId) => {
        if (!userId) return null;
        try {
            const raw = localStorage.getItem(KEYS.PREFIX + key + '_' + userId);
            if (!raw) return null;
            // DECRYPT AFTER RETRIEVAL
            return await cryptoUtils.decrypt(raw, userId);
        } catch (e) {
            return null;
        }
    },

    /**
     * Check if cache is stale
     * (Requires async retrieval now)
     */
    isStale: async (key, userId, durationMs = DEFAULT_STALE_MS) => {
        const cached = await offlineStorage.get(key, userId);
        if (!cached) return true;
        return (Date.now() - cached.timestamp) > durationMs;
    },

    /**
     * Clear specific cache for user
     */
    clear: (key, userId) => {
        if (userId) localStorage.removeItem(KEYS.PREFIX + key + '_' + userId);
    },

    /**
     * Security Wipe on Logout
     */
    clearAll: () => {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith(KEYS.PREFIX)) {
                localStorage.removeItem(k);
            }
        });
    }
};
