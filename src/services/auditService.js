/**
 * Audit Service
 * Logs sensitive operations for compliance and tracking
 */

import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Audit action types
export const AUDIT_ACTIONS = {
    // Profile actions
    PROFILE_VIEW: 'profile_view',
    PROFILE_UPDATE: 'profile_update',
    PROFILE_DELETE: 'profile_delete',

    // Prescription actions
    PRESCRIPTION_UPDATE: 'prescription_update',
    PRESCRIPTION_ADD_INSULIN: 'prescription_add_insulin',
    PRESCRIPTION_REMOVE_INSULIN: 'prescription_remove_insulin',
    PRESCRIPTION_ADD_MED: 'prescription_add_med',
    PRESCRIPTION_REMOVE_MED: 'prescription_remove_med',

    // Log entry actions
    LOG_CREATE: 'log_create',
    LOG_DELETE: 'log_delete',
    LOG_EXPORT: 'log_export',

    // Data management
    DATA_EXPORT_JSON: 'data_export_json',
    DATA_EXPORT_CSV: 'data_export_csv',
    DATA_EXPORT_PDF: 'data_export_pdf',
    DATA_DELETE_ALL: 'data_delete_all',

    // Authentication
    AUTH_LOGIN: 'auth_login',
    AUTH_LOGOUT: 'auth_logout',

    // Consent
    CONSENT_ACCEPTED: 'consent_accepted',
    CONSENT_REVOKED: 'consent_revoked'
};

/**
 * Create an audit log entry
 * @param {object} db - Firestore database instance
 * @param {string} appId - Application ID
 * @param {string} userId - User ID
 * @param {string} action - Action type from AUDIT_ACTIONS
 * @param {object} details - Additional details about the action
 * @returns {Promise<string>} Document ID of the audit log
 */
export const createAuditLog = async (db, appId, userId, action, details = {}) => {
    if (!db || !userId) {
        console.warn('Audit log skipped: missing db or userId');
        return null;
    }

    try {
        const auditRef = collection(db, 'artifacts', appId, 'users', userId, 'auditLogs');

        const logEntry = {
            action,
            timestamp: serverTimestamp(),
            details: {
                ...details,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                timestamp: new Date().toISOString()
            }
        };

        const docRef = await addDoc(auditRef, logEntry);
        return docRef.id;
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging shouldn't break the app
        return null;
    }
};

/**
 * Get recent audit logs for a user
 * @param {object} db - Firestore database instance
 * @param {string} appId - Application ID
 * @param {string} userId - User ID
 * @param {number} maxLogs - Maximum number of logs to retrieve
 * @returns {Promise<Array>} Array of audit log entries
 */
export const getAuditLogs = async (db, appId, userId, maxLogs = 50) => {
    if (!db || !userId) {
        return [];
    }

    try {
        const auditRef = collection(db, 'artifacts', appId, 'users', userId, 'auditLogs');
        const q = query(auditRef, orderBy('timestamp', 'desc'), limit(maxLogs));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return [];
    }
};

/**
 * Generate audit log for data export
 * @param {object} db - Firestore database instance
 * @param {string} appId - Application ID
 * @param {string} userId - User ID
 * @param {string} format - Export format (JSON, CSV, PDF)
 * @param {number} recordCount - Number of records exported
 * @param {string} dateRange - Date range of exported data
 */
export const logDataExport = async (db, appId, userId, format, recordCount, dateRange = '') => {
    const actionMap = {
        'json': AUDIT_ACTIONS.DATA_EXPORT_JSON,
        'csv': AUDIT_ACTIONS.DATA_EXPORT_CSV,
        'pdf': AUDIT_ACTIONS.DATA_EXPORT_PDF
    };

    return createAuditLog(db, appId, userId, actionMap[format.toLowerCase()] || AUDIT_ACTIONS.LOG_EXPORT, {
        format,
        recordCount,
        dateRange,
        exportedAt: new Date().toISOString()
    });
};

/**
 * Generate audit log for profile update
 * @param {object} db - Firestore database instance
 * @param {string} appId - Application ID
 * @param {string} userId - User ID
 * @param {Array} fieldsChanged - List of fields that were changed
 */
export const logProfileUpdate = async (db, appId, userId, fieldsChanged) => {
    return createAuditLog(db, appId, userId, AUDIT_ACTIONS.PROFILE_UPDATE, {
        fieldsChanged,
        updatedAt: new Date().toISOString()
    });
};

/**
 * Generate audit log for prescription changes
 * @param {object} db - Firestore database instance
 * @param {string} appId - Application ID
 * @param {string} userId - User ID
 * @param {string} changeType - Type of change (add, remove, update)
 * @param {string} medicationType - Type of medication (insulin, oral_med)
 * @param {string} medicationName - Name of the medication
 */
export const logPrescriptionChange = async (db, appId, userId, changeType, medicationType, medicationName) => {
    const actionMap = {
        'add_insulin': AUDIT_ACTIONS.PRESCRIPTION_ADD_INSULIN,
        'remove_insulin': AUDIT_ACTIONS.PRESCRIPTION_REMOVE_INSULIN,
        'add_oral': AUDIT_ACTIONS.PRESCRIPTION_ADD_MED,
        'remove_oral': AUDIT_ACTIONS.PRESCRIPTION_REMOVE_MED
    };

    const action = actionMap[`${changeType}_${medicationType}`] || AUDIT_ACTIONS.PRESCRIPTION_UPDATE;

    return createAuditLog(db, appId, userId, action, {
        changeType,
        medicationType,
        medicationName,
        changedAt: new Date().toISOString()
    });
};

/**
 * Generate audit log for data deletion
 * @param {object} db - Firestore database instance
 * @param {string} appId - Application ID
 * @param {string} userId - User ID
 * @param {object} deletionStats - Statistics about what was deleted
 */
export const logDataDeletion = async (db, appId, userId, deletionStats) => {
    return createAuditLog(db, appId, userId, AUDIT_ACTIONS.DATA_DELETE_ALL, {
        ...deletionStats,
        deletedAt: new Date().toISOString(),
        isIrreversible: true
    });
};

export default {
    AUDIT_ACTIONS,
    createAuditLog,
    getAuditLogs,
    logDataExport,
    logProfileUpdate,
    logPrescriptionChange,
    logDataDeletion
};
