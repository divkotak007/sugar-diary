/**
 * Safe Data Layer (CRASH CONTAINMENT & INTEGRITY GUARD)
 * Wraps Firebase write operations to enforce safety rules, validation, and auditing.
 * 
 * CORE RESPONSABILITIES:
 * 1. Crash Containment: Try/Catch wrapper to prevent app crash on write failure.
 * 2. Data Integrity: Validates medical data before sending.
 * 3. Audit Logging: Logs every write attempt.
 * 4. Time Authority: Enforces device time constraints.
 */

import { addDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'; // Real Firebase SDK
import { auditLogger } from './auditLogger';
import { validateLogEntry, validateProfile, VALIDATION_STATUS } from '../utils/schemaValidation';
import { getEpoch, isFuture } from '../utils/time';

// --- HELPER: SAFE GUARD ---
const executeSafeWrite = async (operationType, writeFn, userId, dataContext = {}) => {
    try {
        // 1. Time Authority Check
        // If data contains a timestamp, ensure it is not in the future
        if (dataContext.timestamp && typeof dataContext.timestamp === 'number') {
            if (isFuture(dataContext.timestamp)) {
                throw new Error("Time Authority Violation: Future timestamp rejected.");
            }
        }

        // 2. Data Integrity Check (Schema Validation)
        // We implicitly check based on fields present
        let validation = { isValid: true };

        if (dataContext.hgt || dataContext.insulinDoses) {
            validation = validateLogEntry(dataContext);
        } else if (dataContext.profile) {
            // For profile updates, we flatten/extract the vitals if possible, 
            // but structured profile updates might be nested. 
            // We do a best-effort check on known keys.
            validation = validateProfile(dataContext.profile);
        }

        if (!validation.isValid) {
            const errorMsg = validation.errors.map(e => e.message).join(', ');
            throw new Error(`Data Integrity Violation: ${errorMsg}`);
        }

        // 3. Execution
        const result = await writeFn();

        // 4. Audit Log (Success)
        auditLogger.log(userId, operationType, { status: 'SUCCESS', ...dataContext });

        return result;

    } catch (error) {
        // 5. Crash Containment (Log & Rethrow Safely or Alert)
        console.error(`SafeDataLayer Error [${operationType}]`, error);

        auditLogger.log(userId, 'WRITE_FAILURE', {
            status: 'FAILURE',
            error: error.message,
            operation: operationType
        });

        // We rethrow so the UI knows it failed, but strictly with a safe error object
        throw new Error(error.message || "Operation failed safely.");
    }
};

// --- EXPORTED WRAPPERS ---

/**
 * Safe addDoc
 * @param {CollectionReference} collectionRef 
 * @param {object} data 
 * @param {string} userId (Optional user ID context for auditing, often derived)
 */
export const safeAddDoc = async (collectionRef, data) => {
    // We assume data contains the payload
    // Attempt to extract userID from path if possible, or pass global user context if we had it.
    // Since this is a direct replacement, we might lack userId. 
    // We will extract strictly what we can.

    // NOTE: In App.jsx, addDoc is used for 'logs' mostly.
    return executeSafeWrite('INSERT', () => addDoc(collectionRef, data), 'system_or_path', data);
};

/**
 * Safe setDoc
 * @param {DocumentReference} docRef 
 * @param {object} data 
 * @param {object} options 
 */
export const safeSetDoc = async (docRef, data, options) => {
    return executeSafeWrite('UPSERT', () => setDoc(docRef, data, options), docRef.path || 'unknown_path', data);
};

/**
 * Safe updateDoc
 * @param {DocumentReference} docRef 
 * @param {object} data 
 */
export const safeUpdateDoc = async (docRef, data) => {
    return executeSafeWrite('UPDATE', () => updateDoc(docRef, data), docRef.path || 'unknown_path', data);
};

/**
 * Safe deleteDoc
 * @param {DocumentReference} docRef 
 */
export const safeDeleteDoc = async (docRef) => {
    return executeSafeWrite('DELETE', () => deleteDoc(docRef), docRef.path || 'unknown_path', { deleted: true });
};
