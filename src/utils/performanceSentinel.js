/**
 * Performance Sentinel (MONITOR)
 * Monitors for memory leaks, slow frames, and dependency issues.
 * STRICTLY PASSIVE. LOGS ONLY.
 */

export const performanceSentinel = {
    init: () => {
        if (typeof window === 'undefined') return;

        // 1. Report excessive memory usage (if API available)
        if (performance && performance.memory) {
            setInterval(() => {
                const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
                // Threshold: 80% of limit
                if (usedJSHeapSize > jsHeapSizeLimit * 0.8) {
                    console.warn(`[SENTINEL] High Memory Usage: ${(usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`);
                }
            }, 30000); // Check every 30s
        }

        // 2. Report long tasks (jank)
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 100) { // >100ms task
                    console.warn(`[SENTINEL] Long Task Detected: ${entry.duration.toFixed(1)}ms`);
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // Observer not supported
        }

        console.log("[SENTINEL] Performance Authority Active");
    },

    checkDependencies: () => {
        // Simple duplicate check for key libraries in global scope if exposed
        // (React, Firebase often attach to window if multiple versions load)
        const reactCount = Object.keys(window).filter(k => k.toLowerCase().includes('react')).length;
        if (reactCount > 10) { // Arbitrary heuristic
            console.log("[SENTINEL] Potential multiple React instances detected?");
        }
    }
};
