/**
 * Log Schema Module
 * Unified event-based log schema for all diabetes tracking events
 * Supports multiple data sources and future integrations
 */

// --- LOG TYPES ---
export const LOG_TYPES = {
    GLUCOSE_READING: 'glucose_reading',
    INSULIN: 'insulin',
    ORAL_MED: 'oral_med',
    VITALS: 'vitals',
    VITAL_UPDATE: 'vital_update',
    PRESCRIPTION_UPDATE: 'prescription_update',
    DEVICE_SYNC: 'device_sync',
    AI_INSIGHT: 'ai_insight',
    AUDIT: 'audit'
};

// --- DATA SOURCES ---
export const LOG_SOURCES = {
    MANUAL: 'manual',
    CGM: 'cgm',
    GLUCOMETER: 'glucometer',
    BLUETOOTH: 'bluetooth',
    APPLE_HEALTH: 'apple_health',
    GOOGLE_FIT: 'google_fit',
    AI: 'ai',
    SYSTEM: 'system'
};

// --- LOG ENTRY FACTORY ---
/**
 * Create a new log entry with standard structure
 * @param {string} type - Log type from LOG_TYPES
 * @param {object} data - Entry-specific data
 * @param {string} source - Data source from LOG_SOURCES
 * @returns {object} Formatted log entry
 */
export const createLogEntry = (type, data, source = LOG_SOURCES.MANUAL) => {
    return {
        id: generateId(),
        type,
        source,
        deviceId: data.deviceId || null,
        timestamp: new Date().toISOString(),
        value: data.value || null,
        unit: data.unit || null,
        metadata: data.metadata || {},
        ...data
    };
};

// --- SPECIFIC LOG CREATORS ---

/**
 * Create a glucose reading log entry
 */
export const createGlucoseLog = (value, mealStatus, source = LOG_SOURCES.MANUAL, metadata = {}) => {
    return createLogEntry(LOG_TYPES.GLUCOSE_READING, {
        value: parseFloat(value),
        unit: 'mg/dL',
        mealStatus,
        metadata: {
            ...metadata,
            mealContext: mealStatus
        }
    }, source);
};

/**
 * Create an insulin dose log entry
 */
export const createInsulinLog = (insulinId, insulinName, dose, source = LOG_SOURCES.MANUAL, metadata = {}) => {
    return createLogEntry(LOG_TYPES.INSULIN, {
        value: parseFloat(dose),
        unit: 'units',
        metadata: {
            insulinId,
            insulinName,
            ...metadata
        }
    }, source);
};

/**
 * Create an oral medication log entry
 */
export const createOralMedLog = (medId, medName, timing, source = LOG_SOURCES.MANUAL, metadata = {}) => {
    return createLogEntry(LOG_TYPES.ORAL_MED, {
        value: 1, // Taken = 1
        unit: 'dose',
        metadata: {
            medicationId: medId,
            medicationName: medName,
            timing,
            ...metadata
        }
    }, source);
};

/**
 * Create a vitals update log entry
 */
export const createVitalsLog = (vitalsData, source = LOG_SOURCES.MANUAL) => {
    return createLogEntry(LOG_TYPES.VITALS, {
        metadata: {
            weight: vitalsData.weight,
            hba1c: vitalsData.hba1c,
            creatinine: vitalsData.creatinine,
            bloodPressure: vitalsData.bloodPressure,
            ...vitalsData
        }
    }, source);
};

/**
 * Create a device sync log entry
 */
export const createDeviceSyncLog = (deviceId, deviceType, readings, source) => {
    return createLogEntry(LOG_TYPES.DEVICE_SYNC, {
        deviceId,
        metadata: {
            deviceType,
            readingsCount: readings.length,
            syncedAt: new Date().toISOString()
        }
    }, source);
};

/**
 * Create an AI insight log entry
 */
export const createAIInsightLog = (insightType, insight, confidence, explanation) => {
    return createLogEntry(LOG_TYPES.AI_INSIGHT, {
        metadata: {
            insightType,
            insight,
            confidence,
            explanation,
            isAdvisoryOnly: true,
            generatedAt: new Date().toISOString()
        }
    }, LOG_SOURCES.AI);
};

// --- HELPER ---
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// --- LEGACY CONVERSION ---
/**
 * Convert a legacy log entry to the new schema
 * This ensures backward compatibility with existing data
 */
export const convertLegacyLog = (legacyLog) => {
    // If already in new format, return as-is
    if (legacyLog.type && Object.values(LOG_TYPES).includes(legacyLog.type)) {
        return legacyLog;
    }

    // Convert old format to new
    const baseEntry = {
        id: legacyLog.id || generateId(),
        source: LOG_SOURCES.MANUAL,
        timestamp: legacyLog.timestamp,
        metadata: {}
    };

    // Determine type based on legacy data
    if (legacyLog.hgt !== undefined) {
        return {
            ...baseEntry,
            type: LOG_TYPES.GLUCOSE_READING,
            value: parseFloat(legacyLog.hgt),
            unit: 'mg/dL',
            metadata: {
                mealStatus: legacyLog.mealStatus,
                tags: legacyLog.tags,
                insulinDoses: legacyLog.insulinDoses,
                medsTaken: legacyLog.medsTaken,
                snapshot: legacyLog.snapshot
            }
        };
    }

    if (legacyLog.type === 'vital_update') {
        return {
            ...baseEntry,
            type: LOG_TYPES.VITAL_UPDATE,
            metadata: legacyLog.snapshot
        };
    }

    if (legacyLog.type === 'prescription_update') {
        return {
            ...baseEntry,
            type: LOG_TYPES.PRESCRIPTION_UPDATE,
            metadata: legacyLog.snapshot
        };
    }

    // Unknown format, preserve as-is with generic type
    return {
        ...baseEntry,
        type: LOG_TYPES.VITALS,
        metadata: legacyLog
    };
};

export default {
    LOG_TYPES,
    LOG_SOURCES,
    createLogEntry,
    createGlucoseLog,
    createInsulinLog,
    createOralMedLog,
    createVitalsLog,
    createDeviceSyncLog,
    createAIInsightLog,
    convertLegacyLog
};
