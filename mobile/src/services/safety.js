/**
 * SAFETY ENGINE - Mobile Port
 * Ported from backend/app/ml/safety.py and src/safety/clinical.js
 * 
 * Provides client-side safety calculations for insulin dosing
 */

// Clinical Constants
export const CLINICAL_CONSTANTS = {
    HYPO_THRESHOLD: 70,
    TARGET_MIN: 80,
    TARGET_MAX: 130,
    ABSOLUTE_MAX_DOSE: 50,
    MAX_BOLUS_UNITS: 15,
    MAX_SAFE_IOB: 3.0,
    DIA_RAPID: 4,
    DIA_SHORT: 6,
    DIA_LONG: 24,
};

/**
 * Calculate Insulin on Board (IOB)
 * @param {Array} insulinLogs - Array of insulin log objects with timestamp and units
 * @param {number} currentTime - Current timestamp in ms
 * @returns {number} Total active insulin in units
 */
export const calculateIOB = (insulinLogs, currentTime = Date.now()) => {
    if (!insulinLogs || insulinLogs.length === 0) return 0;

    let totalIOB = 0;

    insulinLogs.forEach(log => {
        const logTime = log.timestamp?.seconds
            ? log.timestamp.seconds * 1000
            : log.timestamp;

        const hoursSince = (currentTime - logTime) / (1000 * 60 * 60);
        const units = parseFloat(log.units || 0);

        if (units <= 0) return;

        // Default to rapid-acting insulin
        const DIA = CLINICAL_CONSTANTS.DIA_RAPID;

        // Only count insulin within DIA window
        if (hoursSince >= 0 && hoursSince < DIA) {
            // Exponential decay model
            const tau = DIA / 3;
            const activity = Math.exp(-hoursSince / tau);
            const iob = units * activity;
            totalIOB += iob;
        }
    });

    return Math.round(totalIOB * 100) / 100; // Round to 2 decimals
};

/**
 * Check if a proposed insulin dose is safe
 * @param {number} proposedDose - Proposed insulin dose in units
 * @param {number} currentGlucose - Current glucose in mg/dL
 * @param {Array} insulinHistory - Recent insulin logs
 * @returns {Object} { isSafe, reason, allowedDose, currentIOB }
 */
export const checkDoseSafety = (proposedDose, currentGlucose, insulinHistory = []) => {
    const currentIOB = calculateIOB(insulinHistory);

    // Check 1: Absolute maximum dose (data entry error protection)
    if (proposedDose > CLINICAL_CONSTANTS.ABSOLUTE_MAX_DOSE) {
        return {
            isSafe: false,
            reason: `Dose exceeds absolute maximum (${CLINICAL_CONSTANTS.ABSOLUTE_MAX_DOSE}u). This appears to be a data entry error.`,
            allowedDose: 0,
            currentIOB,
        };
    }

    // Check 2: Maximum IOB limit
    const expectedIOB = currentIOB + proposedDose;
    if (expectedIOB > CLINICAL_CONSTANTS.MAX_SAFE_IOB) {
        const allowedDose = Math.max(0, CLINICAL_CONSTANTS.MAX_SAFE_IOB - currentIOB);
        return {
            isSafe: false,
            reason: `Max IOB exceeded. Current: ${currentIOB.toFixed(1)}u + Dose: ${proposedDose}u > Limit: ${CLINICAL_CONSTANTS.MAX_SAFE_IOB}u`,
            allowedDose: Math.round(allowedDose * 10) / 10,
            currentIOB,
        };
    }

    // Check 3: Hypoglycemia protection
    if (currentGlucose < CLINICAL_CONSTANTS.HYPO_THRESHOLD) {
        return {
            isSafe: false,
            reason: `Current glucose (${currentGlucose} mg/dL) is below safe threshold (${CLINICAL_CONSTANTS.HYPO_THRESHOLD}). Do not dose insulin.`,
            allowedDose: 0,
            currentIOB,
        };
    }

    // Check 4: Warning for high single dose
    if (proposedDose > CLINICAL_CONSTANTS.MAX_BOLUS_UNITS) {
        return {
            isSafe: false,
            reason: `Single dose (${proposedDose}u) exceeds recommended maximum (${CLINICAL_CONSTANTS.MAX_BOLUS_UNITS}u). Please verify.`,
            allowedDose: CLINICAL_CONSTANTS.MAX_BOLUS_UNITS,
            currentIOB,
        };
    }

    // All checks passed
    return {
        isSafe: true,
        reason: 'Dose is within safe limits',
        allowedDose: proposedDose,
        currentIOB,
    };
};

/**
 * Get time since last insulin dose
 * @param {Array} insulinHistory 
 * @returns {number} Hours since last dose
 */
export const getTimeSinceLastDose = (insulinHistory = []) => {
    if (!insulinHistory || insulinHistory.length === 0) return Infinity;

    const now = Date.now();
    const lastLog = insulinHistory[insulinHistory.length - 1];
    const lastTime = lastLog.timestamp?.seconds
        ? lastLog.timestamp.seconds * 1000
        : lastLog.timestamp;

    return (now - lastTime) / (1000 * 60 * 60); // Hours
};
