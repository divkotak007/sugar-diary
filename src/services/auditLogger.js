/**
 * Audit Logging Service
 * Records critical safety events for compliance and debugging.
 * Stored in strict restricted collection: audit_trails/{userId}/events
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// REMOVED top-level db init to prevent race condition before App.jsx initializes app
// const db = getFirestore();

export const auditLogger = {
    /**
     * Log a security or data event
     * @param {string} userId 
     * @param {string} eventType - 'DATA_WRITE', 'DATA_DELETE', 'AUTH_LOGIN', 'SYNC_ERROR'
     * @param {object} details - Metadata about the event
     */
    log: async (userId, eventType, details) => {
        if (!userId) return;
        // Lazy Init: Get Firestore instance only when needed, ensuring App is initialized first
        const db = getFirestore();
        try {
            // Clean undefined values to prevent Firestore errors
            const safeDetails = JSON.parse(JSON.stringify(details || {}));

            await addDoc(collection(db, 'audit_trails', userId, 'events'), {
                type: eventType,
                details: safeDetails,
                timestamp: serverTimestamp(),
                deviceTime: Date.now(),
                userAgent: navigator.userAgent
            });
        } catch (e) {
            // Audit failure should not block user action, but we warn console
            console.warn("Audit Log Failed", e);
        }
    }
};
