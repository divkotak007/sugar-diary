/**
 * useOfflineSync Hook
 * Manages offline data persistence and sync queue using IndexedDB
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const DB_NAME = 'sugar-diary-offline';
const DB_VERSION = 1;
const STORES = {
    PENDING_SYNC: 'pendingSync',
    CACHED_DATA: 'cachedData'
};

/**
 * Custom hook for offline persistence and sync
 * @param {function} onSync - Callback to execute sync operations
 * @returns {object} Offline state and methods
 */
export const useOfflineSync = (onSync) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [error, setError] = useState(null);

    const dbRef = useRef(null);

    // --- INITIALIZE INDEXEDDB ---
    useEffect(() => {
        const initDB = () => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('IndexedDB error:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    dbRef.current = request.result;
                    resolve(request.result);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create pending sync store
                    if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
                        const pendingStore = db.createObjectStore(STORES.PENDING_SYNC, {
                            keyPath: 'id',
                            autoIncrement: true
                        });
                        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                        pendingStore.createIndex('type', 'type', { unique: false });
                    }

                    // Create cached data store
                    if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
                        db.createObjectStore(STORES.CACHED_DATA, { keyPath: 'key' });
                    }
                };
            });
        };

        initDB()
            .then(() => updatePendingCount())
            .catch(err => setError(err));

        return () => {
            if (dbRef.current) {
                dbRef.current.close();
            }
        };
    }, []);

    // --- ONLINE/OFFLINE DETECTION ---
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-sync when coming back online
            processSyncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // --- UPDATE PENDING COUNT ---
    const updatePendingCount = useCallback(async () => {
        if (!dbRef.current) return;

        try {
            const transaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readonly');
            const store = transaction.objectStore(STORES.PENDING_SYNC);
            const countRequest = store.count();

            countRequest.onsuccess = () => {
                setPendingCount(countRequest.result);
            };
        } catch (err) {
            console.error('Error counting pending items:', err);
        }
    }, []);

    // --- QUEUE FOR SYNC ---
    const queueForSync = useCallback(async (operation) => {
        if (!dbRef.current) {
            console.error('IndexedDB not initialized');
            return null;
        }

        try {
            const transaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_SYNC);

            const item = {
                ...operation,
                timestamp: Date.now(),
                retries: 0
            };

            return new Promise((resolve, reject) => {
                const request = store.add(item);

                request.onsuccess = () => {
                    updatePendingCount();
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (err) {
            console.error('Error queuing for sync:', err);
            setError(err);
            return null;
        }
    }, [updatePendingCount]);

    // --- PROCESS SYNC QUEUE ---
    const processSyncQueue = useCallback(async () => {
        if (!dbRef.current || !isOnline || isSyncing) return;

        setIsSyncing(true);
        setError(null);

        try {
            const transaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_SYNC);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = async () => {
                const items = getAllRequest.result;

                for (const item of items) {
                    try {
                        // Execute the sync callback
                        if (onSync) {
                            await onSync(item);
                        }

                        // Remove from queue on success
                        const deleteTransaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readwrite');
                        const deleteStore = deleteTransaction.objectStore(STORES.PENDING_SYNC);
                        deleteStore.delete(item.id);
                    } catch (syncError) {
                        console.error('Sync error for item:', item.id, syncError);

                        // Update retry count
                        item.retries = (item.retries || 0) + 1;
                        item.lastError = syncError.message;

                        if (item.retries < 3) {
                            const updateTransaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readwrite');
                            const updateStore = updateTransaction.objectStore(STORES.PENDING_SYNC);
                            updateStore.put(item);
                        } else {
                            // Move to failed items or delete after max retries
                            console.error('Max retries reached for item:', item.id);
                            const deleteTransaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readwrite');
                            const deleteStore = deleteTransaction.objectStore(STORES.PENDING_SYNC);
                            deleteStore.delete(item.id);
                        }
                    }
                }

                setLastSyncTime(new Date());
                updatePendingCount();
            };

            getAllRequest.onerror = () => {
                setError(getAllRequest.error);
            };
        } catch (err) {
            console.error('Error processing sync queue:', err);
            setError(err);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing, onSync, updatePendingCount]);

    // --- CACHE DATA ---
    const cacheData = useCallback(async (key, data) => {
        if (!dbRef.current) return;

        try {
            const transaction = dbRef.current.transaction([STORES.CACHED_DATA], 'readwrite');
            const store = transaction.objectStore(STORES.CACHED_DATA);

            return new Promise((resolve, reject) => {
                const request = store.put({ key, data, cachedAt: Date.now() });

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('Error caching data:', err);
            return false;
        }
    }, []);

    // --- GET CACHED DATA ---
    const getCachedData = useCallback(async (key) => {
        if (!dbRef.current) return null;

        try {
            const transaction = dbRef.current.transaction([STORES.CACHED_DATA], 'readonly');
            const store = transaction.objectStore(STORES.CACHED_DATA);

            return new Promise((resolve, reject) => {
                const request = store.get(key);

                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.data : null);
                };

                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('Error getting cached data:', err);
            return null;
        }
    }, []);

    // --- CLEAR CACHE ---
    const clearCache = useCallback(async () => {
        if (!dbRef.current) return;

        try {
            const transaction = dbRef.current.transaction([STORES.CACHED_DATA], 'readwrite');
            const store = transaction.objectStore(STORES.CACHED_DATA);
            store.clear();
        } catch (err) {
            console.error('Error clearing cache:', err);
        }
    }, []);

    // --- CLEAR PENDING SYNC ---
    const clearPendingSync = useCallback(async () => {
        if (!dbRef.current) return;

        try {
            const transaction = dbRef.current.transaction([STORES.PENDING_SYNC], 'readwrite');
            const store = transaction.objectStore(STORES.PENDING_SYNC);
            store.clear();
            setPendingCount(0);
        } catch (err) {
            console.error('Error clearing pending sync:', err);
        }
    }, []);

    return {
        // State
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncTime,
        error,

        // Methods
        queueForSync,
        processSyncQueue,
        cacheData,
        getCachedData,
        clearCache,
        clearPendingSync
    };
};

export default useOfflineSync;
