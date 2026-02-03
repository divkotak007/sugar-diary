import { useState, useEffect, useMemo } from 'react';
import {
    getFirestore, collection, query, orderBy, onSnapshot,
    addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { auditLogger } from '../services/auditLogger';

/**
 * STRICT ISOLATION HOOK
 * Subscribes ONLY to the specific collection for the given vital type.
 * Enforces: One Vital = One Collection = One Listener.
 * 
 * @param {string} userId - Current user ID
 * @param {string} vitalType - 'weight', 'hba1c', 'creatinine', etc.
 */
export const useVitalLogs = (userId, vitalType) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const db = getFirestore();

    // 1. Strict Collection Naming Rule
    const collectionName = useMemo(() => {
        if (!vitalType) return null;
        return `vital_${vitalType}_logs`; // e.g., 'vital_weight_logs'
    }, [vitalType]);

    useEffect(() => {
        if (!userId || !collectionName) {
            setLogs([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // FIX: Use correct collection path matching app architecture
        // Changed from: db, 'users', userId, collectionName
        // To: db, 'artifacts', appId, 'users', userId, collectionName
        const appId = 'sugar_diary_v1'; // Match the appId constant from App.jsx
        const ref = collection(db, 'artifacts', appId, 'users', userId, collectionName);
        const q = query(ref, orderBy('timestamp', 'desc'));

        console.log(`[VitalGap] Subscribing to isolated channel: artifacts/${appId}/users/${userId}/${collectionName}`);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Standardize timestamp for app consumption
                timestamp: doc.data().timestamp?.toMillis ? doc.data().timestamp.toMillis() : Date.now()
            }));

            setLogs(data);
            setLoading(false);
        }, (err) => {
            console.error(`[VitalGap] Error in ${collectionName}:`, err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, collectionName, db]);

    // 2. Strict Write Function
    const addLog = async (value, timestampEpoch) => {
        if (!userId || !collectionName) throw new Error("Initialization failed");

        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) throw new Error("Invalid Value");

        try {
            const appId = 'sugar_diary_v1'; // Match the appId constant
            await addDoc(collection(db, 'artifacts', appId, 'users', userId, collectionName), {
                value: numericValue,
                unit: getUnit(vitalType),
                timestamp: new Date(timestampEpoch), // Store as Firestore Timestamp
                createdAt: serverTimestamp(),
                type: 'vital_entry' // Strict Type
            });
            auditLogger.log('vital_add', { vital: vitalType, val: numericValue });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    // 3. Strict Delete Function
    const deleteLog = async (logId) => {
        if (!userId || !collectionName || !logId) return false;
        try {
            const appId = 'sugar_diary_v1'; // Match the appId constant
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, collectionName, logId));
            auditLogger.log('vital_delete', { vital: vitalType, id: logId });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    return { logs, loading, error, addLog, deleteLog };
};

// Helper for units (Centralized simple map)
const getUnit = (type) => {
    switch (type) {
        case 'weight': return 'kg';
        case 'hba1c': return '%';
        case 'creatinine': return 'mg/dL';
        default: return '';
    }
};
