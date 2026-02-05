/**
 * CLINICAL SAFETY MODULE
 * American Diabetes Association (ADA) Clinical Standards
 * 
 * This module provides medical-grade safety calculations and checks.
 * Based on OpenAPS oref0 algorithm and ADA guidelines.
 * 
 * ZERO REGRESSION: This is a NEW module, doesn't modify existing code.
 */

// ===== CLINICAL CONSTANTS =====
// Based on ADA Clinical Practice Recommendations 2024

export const CLINICAL_CONSTANTS = {
    // Glucose Thresholds (mg/dL)
    HYPO_SEVERE: 54,        // Level 3 hypoglycemia (immediate danger)
    HYPO_THRESHOLD: 70,     // Level 1 hypoglycemia (action required)
    TARGET_MIN: 80,         // Lower bound of target range
    TARGET_MAX: 130,        // Upper bound of target range (fasting)
    TARGET_MAX_POST: 180,   // Post-meal target (2 hours)
    HYPER_THRESHOLD: 180,   // Hyperglycemia threshold
    HYPER_SEVERE: 250,      // Severe hyperglycemia
    CRITICAL_HIGH: 400,     // Critical high (DKA risk)

    // Insulin Safety Limits
    MAX_BOLUS_UNITS: 15,           // Maximum single bolus dose
    MAX_DAILY_TOTAL: 100,          // Maximum total daily insulin
    MIN_DOSE_INTERVAL_HOURS: 2,    // Minimum time between rapid doses
    MIN_DOSE_INCREMENT: 0.5,       // Minimum dose increment

    // Insulin Pharmacodynamics (Duration of Insulin Action)
    DIA_RAPID: 4,                  // Rapid-acting (Humalog, Novolog, Apidra)
    DIA_SHORT: 6,                  // Short-acting (Regular)
    DIA_LONG: 24,                  // Long-acting (Lantus, Levemir)
    DIA_ULTRA_LONG: 42,            // Ultra-long (Tresiba)

    // Insulin Activity Peaks
    PEAK_RAPID_HOURS: 1.5,         // Peak activity for rapid-acting
    PEAK_SHORT_HOURS: 3,           // Peak activity for short-acting

    // Safety Margins
    MAX_SAFE_IOB: 3.0,             // Maximum Insulin on Board
    HYPO_IOB_LIMIT: 1.0,           // IOB limit during hypoglycemia
    CRITICAL_IOB_LIMIT: 0.5,       // IOB limit during severe hypo

    // Carbohydrate Treatment
    MIN_CARBS_FOR_HYPO: 15,        // Grams for hypo treatment (15-15 rule)
    CARB_ABSORPTION_RATE: 30,      // Grams per hour (average)
    FAST_CARB_ABSORPTION: 45,      // Fast-acting carbs (juice, glucose tabs)
    SLOW_CARB_ABSORPTION: 20,      // Slow-acting carbs (bread, pasta)
};

// ===== INSULIN ON BOARD (IOB) CALCULATION =====
/**
 * Calculate Insulin on Board using exponential decay model
 * Based on OpenAPS oref0 algorithm
 * 
 * @param {Array} insulinLogs - Array of insulin log objects
 * @param {number} currentTime - Current timestamp (ms), defaults to now
 * @returns {number} Total active insulin in units
 * 
 * Formula: IOB(t) = dose × e^(-t/τ)
 * where τ = DIA/3 (time constant)
 */
export const calculateIOB = (insulinLogs, currentTime = Date.now()) => {
    if (!insulinLogs || insulinLogs.length === 0) return 0;

    let totalIOB = 0;

    insulinLogs
        .filter(log => log.insulinDoses && Object.keys(log.insulinDoses).length > 0)
        .forEach(log => {
            // Get timestamp
            const logTime = log.timestamp?.seconds
                ? log.timestamp.seconds * 1000
                : (log.timestamp instanceof Date ? log.timestamp.getTime() : log.timestamp);

            const hoursSince = (currentTime - logTime) / (1000 * 60 * 60);

            // Process each insulin type
            Object.entries(log.insulinDoses).forEach(([type, units]) => {
                if (!units || units <= 0) return;

                const dose = parseFloat(units);
                let DIA = CLINICAL_CONSTANTS.DIA_RAPID; // Default

                // Determine DIA based on insulin type
                if (type.toLowerCase().includes('rapid') || type.toLowerCase().includes('fast')) {
                    DIA = CLINICAL_CONSTANTS.DIA_RAPID;
                } else if (type.toLowerCase().includes('long') || type.toLowerCase().includes('basal')) {
                    DIA = CLINICAL_CONSTANTS.DIA_LONG;
                } else if (type.toLowerCase().includes('regular') || type.toLowerCase().includes('short')) {
                    DIA = CLINICAL_CONSTANTS.DIA_SHORT;
                }

                // Only count insulin within DIA window
                if (hoursSince >= 0 && hoursSince < DIA) {
                    // Exponential decay: activity = e^(-t/τ)
                    const tau = DIA / 3; // Time constant
                    const activity = Math.exp(-hoursSince / tau);
                    totalIOB += dose * activity;
                }
            });
        });

    return parseFloat(totalIOB.toFixed(2));
};

// ===== CARBS ON BOARD (COB) CALCULATION =====
/**
 * Calculate Carbs on Board (unabsorbed carbohydrates)
 * 
 * @param {Array} mealLogs - Array of meal/carb log objects
 * @param {number} currentTime - Current timestamp (ms)
 * @returns {number} Remaining unabsorbed carbs in grams
 */
export const calculateCOB = (mealLogs, currentTime = Date.now()) => {
    if (!mealLogs || mealLogs.length === 0) return 0;

    let totalCOB = 0;

    mealLogs
        .filter(log => log.carbs && log.carbs > 0)
        .forEach(meal => {
            const mealTime = meal.timestamp?.seconds
                ? meal.timestamp.seconds * 1000
                : (meal.timestamp instanceof Date ? meal.timestamp.getTime() : meal.timestamp);

            const hoursSince = (currentTime - mealTime) / (1000 * 60 * 60);

            // Determine absorption rate based on meal type
            let absorptionRate = CLINICAL_CONSTANTS.CARB_ABSORPTION_RATE;
            if (meal.mealType === 'fast' || meal.tags?.includes('Fast Carbs')) {
                absorptionRate = CLINICAL_CONSTANTS.FAST_CARB_ABSORPTION;
            } else if (meal.mealType === 'slow' || meal.tags?.includes('Heavy Meal')) {
                absorptionRate = CLINICAL_CONSTANTS.SLOW_CARB_ABSORPTION;
            }

            const absorbedCarbs = hoursSince * absorptionRate;
            const remainingCarbs = Math.max(0, meal.carbs - absorbedCarbs);
            totalCOB += remainingCarbs;
        });

    return parseFloat(totalCOB.toFixed(1));
};

// ===== SAFETY GATE: DOSE VALIDATION =====
/**
 * Comprehensive safety check for insulin dosing
 * 
 * @param {number} currentHGT - Current blood glucose (mg/dL)
 * @param {number} iob - Current Insulin on Board
 * @param {number} proposedDose - Proposed insulin dose (units)
 * @param {object} options - Additional context (optional)
 * @returns {object} Safety check result with warnings
 */
export const isSafeToDose = (currentHGT, iob, proposedDose, options = {}) => {
    const checks = {
        // CRITICAL: Hypoglycemia
        hypo: {
            passed: currentHGT > CLINICAL_CONSTANTS.HYPO_THRESHOLD,
            level: 'critical',
            message: `🛑 CRITICAL: Blood sugar (${currentHGT} mg/dL) is too low. Treat hypoglycemia first with ${CLINICAL_CONSTANTS.MIN_CARBS_FOR_HYPO}g fast-acting carbs.`
        },

        // CRITICAL: Severe hypoglycemia with active insulin
        severeHypoWithIOB: {
            passed: !(currentHGT < CLINICAL_CONSTANTS.HYPO_SEVERE && iob > CLINICAL_CONSTANTS.CRITICAL_IOB_LIMIT),
            level: 'critical',
            message: `🛑 CRITICAL: Severe hypoglycemia (${currentHGT} mg/dL) with active insulin (${iob.toFixed(1)}u). Immediate treatment required. DO NOT dose.`
        },

        // WARNING: IOB limit exceeded
        iobLimit: {
            passed: (iob + proposedDose) <= CLINICAL_CONSTANTS.MAX_SAFE_IOB,
            level: 'warning',
            message: `⚠️ WARNING: Total insulin (${(iob + proposedDose).toFixed(1)}u) would exceed safe limit (${CLINICAL_CONSTANTS.MAX_SAFE_IOB}u). Risk of insulin stacking.`
        },

        // WARNING: Maximum bolus exceeded
        maxBolus: {
            passed: proposedDose <= CLINICAL_CONSTANTS.MAX_BOLUS_UNITS,
            level: 'warning',
            message: `⚠️ WARNING: Dose (${proposedDose}u) exceeds maximum safe bolus (${CLINICAL_CONSTANTS.MAX_BOLUS_UNITS}u). Please verify.`
        },

        // WARNING: Active insulin during low blood sugar
        hypoWithIOB: {
            passed: !(currentHGT < 90 && iob > CLINICAL_CONSTANTS.HYPO_IOB_LIMIT),
            level: 'warning',
            message: `⚠️ WARNING: Blood sugar trending low (${currentHGT} mg/dL) with active insulin (${iob.toFixed(1)}u). Monitor closely.`
        },

        // INFO: Minimum dose increment
        minIncrement: {
            passed: proposedDose >= CLINICAL_CONSTANTS.MIN_DOSE_INCREMENT,
            level: 'info',
            message: `ℹ️ INFO: Dose below minimum increment (${CLINICAL_CONSTANTS.MIN_DOSE_INCREMENT}u).`
        }
    };

    const failedChecks = Object.entries(checks)
        .filter(([_, check]) => !check.passed);

    const criticalWarnings = failedChecks
        .filter(([_, check]) => check.level === 'critical')
        .map(([_, check]) => check.message);

    const warnings = failedChecks
        .filter(([_, check]) => check.level === 'warning')
        .map(([_, check]) => check.message);

    const info = failedChecks
        .filter(([_, check]) => check.level === 'info')
        .map(([_, check]) => check.message);

    return {
        safe: failedChecks.length === 0,
        canProceed: criticalWarnings.length === 0, // Can proceed with warnings, but not critical
        checks,
        criticalWarnings,
        warnings,
        info,
        recommendation: getSafetyRecommendation(currentHGT, iob, proposedDose)
    };
};

// ===== TIME-BASED SAFETY: MINIMUM INTERVAL =====
/**
 * Check if enough time has passed since last rapid insulin dose
 * 
 * @param {Array} insulinLogs - Array of insulin logs
 * @param {number} currentTime - Current timestamp (ms)
 * @returns {object} Interval check result
 */
export const canDoseAgain = (insulinLogs, currentTime = Date.now()) => {
    if (!insulinLogs || insulinLogs.length === 0) {
        return { can: true, waitMinutes: 0, lastDoseTime: null };
    }

    // Find most recent rapid insulin dose
    const rapidLogs = insulinLogs
        .filter(log => {
            if (!log.insulinDoses) return false;
            return Object.keys(log.insulinDoses).some(type =>
                type.toLowerCase().includes('rapid') || type.toLowerCase().includes('fast')
            );
        })
        .sort((a, b) => {
            const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : a.timestamp;
            const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : b.timestamp;
            return timeB - timeA;
        });

    if (rapidLogs.length === 0) {
        return { can: true, waitMinutes: 0, lastDoseTime: null };
    }

    const lastLog = rapidLogs[0];
    const lastDoseTime = lastLog.timestamp?.seconds
        ? lastLog.timestamp.seconds * 1000
        : lastLog.timestamp;

    const hoursSince = (currentTime - lastDoseTime) / (1000 * 60 * 60);
    const minInterval = CLINICAL_CONSTANTS.MIN_DOSE_INTERVAL_HOURS;

    return {
        can: hoursSince >= minInterval,
        waitMinutes: hoursSince < minInterval
            ? Math.ceil((minInterval - hoursSince) * 60)
            : 0,
        hoursSince: parseFloat(hoursSince.toFixed(1)),
        lastDoseTime: new Date(lastDoseTime)
    };
};

// ===== GLUCOSE RISK CATEGORIZATION =====
/**
 * Categorize glucose level into risk zones
 * 
 * @param {number} hgt - Blood glucose (mg/dL)
 * @returns {object} Risk category and details
 */
export const getGlucoseRiskCategory = (hgt) => {
    if (hgt < CLINICAL_CONSTANTS.HYPO_SEVERE) {
        return {
            category: 'severe_hypo',
            color: '#DC2626',
            emoji: '🚨',
            label: 'Severe Hypoglycemia',
            action: 'URGENT: Treat immediately with fast-acting carbs'
        };
    }

    if (hgt < CLINICAL_CONSTANTS.HYPO_THRESHOLD) {
        return {
            category: 'hypo',
            color: '#F59E0B',
            emoji: '⚠️',
            label: 'Hypoglycemia',
            action: 'Treat with 15g fast-acting carbs, recheck in 15 min'
        };
    }

    if (hgt < CLINICAL_CONSTANTS.TARGET_MIN) {
        return {
            category: 'low_normal',
            color: '#FBBF24',
            emoji: '📉',
            label: 'Low Normal',
            action: 'Monitor closely, consider snack if trending down'
        };
    }

    if (hgt <= CLINICAL_CONSTANTS.TARGET_MAX) {
        return {
            category: 'target',
            color: '#10B981',
            emoji: '✅',
            label: 'In Target Range',
            action: 'Excellent control'
        };
    }

    if (hgt <= CLINICAL_CONSTANTS.HYPER_THRESHOLD) {
        return {
            category: 'high_normal',
            color: '#FBBF24',
            emoji: '📈',
            label: 'High Normal',
            action: 'Monitor, may need correction'
        };
    }

    if (hgt <= CLINICAL_CONSTANTS.HYPER_SEVERE) {
        return {
            category: 'hyper',
            color: '#F59E0B',
            emoji: '⚠️',
            label: 'Hyperglycemia',
            action: 'Correction dose recommended'
        };
    }

    if (hgt <= CLINICAL_CONSTANTS.CRITICAL_HIGH) {
        return {
            category: 'severe_hyper',
            color: '#DC2626',
            emoji: '🔴',
            label: 'Severe Hyperglycemia',
            action: 'Immediate correction required, check ketones'
        };
    }

    return {
        category: 'critical_high',
        color: '#7F1D1D',
        emoji: '🚨',
        label: 'Critical High',
        action: 'URGENT: Check ketones, contact doctor, possible DKA'
    };
};

// ===== SAFETY RECOMMENDATION ENGINE =====
/**
 * Generate personalized safety recommendation
 * 
 * @param {number} currentHGT - Current blood glucose
 * @param {number} iob - Insulin on Board
 * @param {number} proposedDose - Proposed dose
 * @returns {string} Recommendation text
 */
const getSafetyRecommendation = (currentHGT, iob, proposedDose) => {
    const risk = getGlucoseRiskCategory(currentHGT);

    if (risk.category === 'severe_hypo' || risk.category === 'hypo') {
        return `Do not dose. ${risk.action}`;
    }

    if (iob > 2.0 && currentHGT < 150) {
        return `High IOB (${iob.toFixed(1)}u) with moderate glucose. Consider reducing dose or waiting.`;
    }

    if (proposedDose > 10 && currentHGT < 200) {
        return `Large dose (${proposedDose}u) for current glucose (${currentHGT}). Verify calculation.`;
    }

    if (risk.category === 'target') {
        return `Glucose in target range. Dose only if covering carbs.`;
    }

    return risk.action;
};

// ===== EXPORT ALL =====
export default {
    CLINICAL_CONSTANTS,
    calculateIOB,
    calculateCOB,
    isSafeToDose,
    canDoseAgain,
    getGlucoseRiskCategory
};
