/**
 * Audit Logger
 * Immutable log of all admin changes
 */

import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, ADMIN_CONFIG_COLLECTION } from '../firebase/config';

/**
 * Log an admin action
 */
export const logAction = async (action, details, user) => {
    try {
        await addDoc(collection(db, ADMIN_CONFIG_COLLECTION, 'audit_log'), {
            action,
            details,
            user: user.email,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging action:', error);
    }
};

/**
 * Get audit log
 */
export const getAuditLog = async (limitCount = 50) => {
    try {
        const logQuery = query(
            collection(db, ADMIN_CONFIG_COLLECTION, 'audit_log'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(logQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching audit log:', error);
        return [];
    }
};
