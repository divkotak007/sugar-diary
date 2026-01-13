/**
 * useFirestore Hook
 * Handles Firestore operations for user data, profiles, prescriptions, and logs
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    deleteDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    limit,
    where,
    getDocs
} from 'firebase/firestore';

// Get app ID from environment or use default
const getAppId = () => {
    if (typeof __app_id !== 'undefined') return __app_id;
    return 'sugar-diary-v1';
};

/**
 * Custom hook for Firestore operations
 * @param {object} app - Firebase app instance
 * @param {string} userId - Current user's UID
 * @returns {object} Firestore data and methods
 */
export const useFirestore = (app, userId) => {
    const [profile, setProfile] = useState(null);
    const [prescription, setPrescription] = useState({ insulins: [], oralMeds: [] });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const db = getFirestore(app);
    const appId = getAppId();

    // --- PATH HELPERS ---
    const getUserDocPath = useCallback(() => {
        return doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
    }, [db, appId, userId]);

    const getLogsCollectionPath = useCallback(() => {
        return collection(db, 'artifacts', appId, 'users', userId, 'logs');
    }, [db, appId, userId]);

    const getAuditLogsCollectionPath = useCallback(() => {
        return collection(db, 'artifacts', appId, 'users', userId, 'auditLogs');
    }, [db, appId, userId]);

    // --- LOAD USER DATA ---
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const loadUserData = async () => {
            try {
                const userDoc = await getDoc(getUserDocPath());

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const loadedProfile = { ...data.profile };

                    // Calculate age from DOB
                    if (loadedProfile.dob) {
                        loadedProfile.age = calculateAge(loadedProfile.dob);
                    }

                    // Normalize prescription data
                    const loadedPrescription = data.prescription || { insulins: [], oralMeds: [] };
                    if (loadedPrescription.insulins) {
                        loadedPrescription.insulins = loadedPrescription.insulins.map(ins => ({
                            ...ins,
                            frequency: ins.frequency || 'Before Meals',
                            slidingScale: (ins.slidingScale || []).map(scale => ({
                                ...scale,
                                dose: scale.dose || scale.units
                            }))
                        }));
                    }

                    setProfile(loadedProfile);
                    setPrescription(loadedPrescription);
                } else {
                    // New user - initialize empty profile
                    setProfile({
                        age: '',
                        dob: '',
                        gender: '',
                        weight: '',
                        hba1c: '',
                        creatinine: '',
                        pregnancyStatus: false,
                        hasConsented: false,
                        instructions: '',
                        comorbidities: []
                    });
                }
            } catch (err) {
                console.error('Error loading user data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [userId, getUserDocPath]);

    // --- REAL-TIME LOGS LISTENER ---
    useEffect(() => {
        if (!userId) return;

        const q = query(
            getLogsCollectionPath(),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logsData);
        }, (err) => {
            console.error('Logs listener error:', err);
            setError(err);
        });

        return () => unsubscribe();
    }, [userId, getLogsCollectionPath]);

    // --- SAVE PROFILE & PRESCRIPTION ---
    const saveProfile = useCallback(async (newProfile, newPrescription = null) => {
        if (!userId) throw new Error('No user ID');

        const dataToSave = {
            profile: newProfile,
            prescription: newPrescription || prescription,
            schemaVersion: 2,
            lastUpdated: new Date().toISOString()
        };

        try {
            await setDoc(getUserDocPath(), dataToSave, { merge: true });

            // Log the update
            await addDoc(getLogsCollectionPath(), {
                type: 'vital_update',
                snapshot: { profile: newProfile, prescription: newPrescription || prescription },
                timestamp: serverTimestamp(),
                tags: ['Vital Update']
            });

            setProfile(newProfile);
            if (newPrescription) setPrescription(newPrescription);

            return true;
        } catch (err) {
            console.error('Save profile error:', err);
            setError(err);
            throw err;
        }
    }, [userId, prescription, getUserDocPath, getLogsCollectionPath]);

    // --- SAVE PRESCRIPTION ---
    const savePrescription = useCallback(async (newPrescription) => {
        if (!userId) throw new Error('No user ID');

        try {
            await setDoc(getUserDocPath(), {
                profile,
                prescription: newPrescription,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Log the update
            await addDoc(getLogsCollectionPath(), {
                type: 'prescription_update',
                snapshot: { prescription: newPrescription },
                timestamp: serverTimestamp(),
                tags: ['Rx Change', 'Audit']
            });

            setPrescription(newPrescription);
            return true;
        } catch (err) {
            console.error('Save prescription error:', err);
            setError(err);
            throw err;
        }
    }, [userId, profile, getUserDocPath, getLogsCollectionPath]);

    // --- ADD LOG ENTRY ---
    const addLogEntry = useCallback(async (entry) => {
        if (!userId) throw new Error('No user ID');

        try {
            const logEntry = {
                ...entry,
                timestamp: serverTimestamp(),
                snapshot: { profile, prescription }
            };

            const docRef = await addDoc(getLogsCollectionPath(), logEntry);
            return docRef.id;
        } catch (err) {
            console.error('Add log entry error:', err);
            setError(err);
            throw err;
        }
    }, [userId, profile, prescription, getLogsCollectionPath]);

    // --- DELETE LOG ENTRY ---
    const deleteLogEntry = useCallback(async (logId) => {
        if (!userId) throw new Error('No user ID');

        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'logs', logId));
            return true;
        } catch (err) {
            console.error('Delete log entry error:', err);
            setError(err);
            throw err;
        }
    }, [userId, db, appId]);

    // --- ADD AUDIT LOG ---
    const addAuditLog = useCallback(async (action, details) => {
        if (!userId) return;

        try {
            await addDoc(getAuditLogsCollectionPath(), {
                action,
                details,
                userId,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error('Audit log error:', err);
            // Don't throw - audit logging should not break the app
        }
    }, [userId, getAuditLogsCollectionPath]);

    // --- GET LOGS BY DATE RANGE ---
    const getLogsByDateRange = useCallback(async (startDate, endDate) => {
        if (!userId) return [];

        try {
            const startTimestamp = new Date(startDate);
            startTimestamp.setHours(0, 0, 0, 0);

            const endTimestamp = new Date(endDate);
            endTimestamp.setHours(23, 59, 59, 999);

            // Filter from existing logs (already loaded)
            return logs.filter(log => {
                const logDate = new Date(log.timestamp?.seconds * 1000);
                return logDate >= startTimestamp && logDate <= endTimestamp;
            });
        } catch (err) {
            console.error('Get logs by date range error:', err);
            setError(err);
            return [];
        }
    }, [userId, logs]);

    // --- GET ALL USER DATA (for export) ---
    const getAllUserData = useCallback(async () => {
        if (!userId) throw new Error('No user ID');

        try {
            const userData = {
                profile,
                prescription,
                logs: logs,
                exportedAt: new Date().toISOString()
            };

            return userData;
        } catch (err) {
            console.error('Get all user data error:', err);
            setError(err);
            throw err;
        }
    }, [userId, profile, prescription, logs]);

    // --- DELETE ALL USER DATA ---
    const deleteAllUserData = useCallback(async () => {
        if (!userId) throw new Error('No user ID');

        try {
            // Delete all logs
            const logsSnapshot = await getDocs(getLogsCollectionPath());
            const deletePromises = logsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete profile
            await deleteDoc(getUserDocPath());

            // Add audit log before deletion completes
            await addAuditLog('DELETE_ALL_DATA', { deletedAt: new Date().toISOString() });

            // Reset local state
            setProfile(null);
            setPrescription({ insulins: [], oralMeds: [] });
            setLogs([]);

            return true;
        } catch (err) {
            console.error('Delete all user data error:', err);
            setError(err);
            throw err;
        }
    }, [userId, getUserDocPath, getLogsCollectionPath, addAuditLog]);

    return {
        // Data
        profile,
        prescription,
        logs,
        loading,
        error,

        // Methods
        saveProfile,
        savePrescription,
        addLogEntry,
        deleteLogEntry,
        addAuditLog,
        getLogsByDateRange,
        getAllUserData,
        deleteAllUserData,

        // Setters (for local state updates)
        setProfile,
        setPrescription
    };
};

// --- HELPER FUNCTIONS ---
const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default useFirestore;
