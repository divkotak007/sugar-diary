import { lazy } from 'react';

/**
 * lazyWithRetry
 * A wrapper for React.lazy that handles chunk load errors (e.g., version mismatch after deployment).
 * If a chunk fails to load, it reloads the page once to fetch the latest index.html and chunks.
 */
export const lazyWithRetry = (componentImport) =>
    lazy(async () => {
        try {
            return await componentImport();
        } catch (error) {
            console.error("Lazy load failed:", error);
            // Check for common chunk load error messages
            const isChunkError = error.message && (
                error.message.includes('fetch') ||
                error.message.includes('chunk') ||
                error.message.includes('load') ||
                error.message.includes('import') || // 'Failed to fetch dynamically imported module'
                error.name === 'ChunkLoadError'
            );

            if (isChunkError && typeof window !== 'undefined') {
                try {
                    const storageKey = 'lazy_retry_timestamp';
                    const lastRetry = window.sessionStorage.getItem(storageKey);
                    const now = Date.now();

                    // If no retry in last 10 seconds, reload.
                    // This prevents infinite reload loops if the error persists (e.g. strict network down).
                    if (!lastRetry || (now - parseInt(lastRetry)) > 10000) {
                        window.sessionStorage.setItem(storageKey, now.toString());
                        window.location.reload();
                        // Return a never-resolving promise to hold Suspense fallback while reloading
                        return new Promise(() => { });
                    }
                } catch (e) {
                    console.warn("SessionStorage blocked, cannot safe-retry lazy load", e);
                }
            }

            // If not a chunk error or already retried, propagate the error (triggers Error Boundary)
            throw error;
        }
    });
