/**
 * AI Insights Service (SAFE MODE)
 * STRICTLY OBSERVATIONAL. NO INFERENCES. NO DIAGNOSES.
 * 
 * Rules:
 * 1. No Data = No Summary (Return Null)
 * 2. No NaN or Undefined values in output
 * 3. No "Prediction" or "Suggestion" wording
 * 4. Units must always match the parameter
 */

// --- AI MODULE TYPES ---
export const AI_MODULES = {
    DATA_SUMMARY: 'data_summary',
    OBSERVATION: 'observation'
};

// --- INSIGHT TYPES ---
// Reduced to only INFO. No Warnings or Alerts to prevent alarm fatigue or false medical advice.
export const INSIGHT_TYPES = {
    INFO: 'info'
};

// --- HELPER: SAFE NUMBER CHECK ---
const isValidNumber = (val) => {
    return val !== undefined && val !== null && val !== '' && !isNaN(parseFloat(val)) && isFinite(val);
};

export const createInsight = (module, type, insight, explanation) => {
    return {
        module,
        type,
        insight,
        explanation,
        isAdvisoryOnly: true,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Summary of recorded data only. Not medical advice.'
    };
};

/**
 * Report recent glucose average
 * STRICTLY MATHEMATICAL. NO "GOOD" OR "BAD" LABELS.
 */
export const analyzeGlucoseTrend = (readings) => {
    if (!readings || !Array.isArray(readings) || readings.length < 3) return null;

    // Filter valid readings only
    const values = readings
        .map(r => r.value !== undefined ? r.value : r.hgt)
        .filter(isValidNumber)
        .map(v => parseFloat(v));

    if (values.length < 3) return null; // Need minimum 3 valid points

    const recentValues = values.slice(-7); // Last 7 only
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    return createInsight(
        AI_MODULES.DATA_SUMMARY,
        INSIGHT_TYPES.INFO,
        `Average of last ${recentValues.length} readings: ${avg.toFixed(0)} mg/dL`,
        `Based on recorded data.`
    );
};

/**
 * Analyze Weight (Changed Only)
 */
export const analyzeWeightTrend = (history) => {
    if (!history || !Array.isArray(history)) return null;

    const weights = history
        .filter(l => isValidNumber(l.snapshot?.profile?.weight))
        .map(l => ({ val: parseFloat(l.snapshot.profile.weight), date: l.timestamp }))
        .sort((a, b) => (b.date?.seconds || b.date) - (a.date?.seconds || a.date)); // Newest first

    if (weights.length < 2) return null; // Need at least 2 points to show change

    const current = weights[0].val;
    const previous = weights[1].val;
    const diff = current - previous;

    if (Math.abs(diff) < 0.1) return null; // Ignore negligible changes

    const direction = diff > 0 ? "gained" : "lost";

    return createInsight(
        AI_MODULES.OBSERVATION,
        INSIGHT_TYPES.INFO,
        `Weight ${direction} ${Math.abs(diff).toFixed(1)} kg since last record`,
        `Latest: ${current} kg, Previous: ${previous} kg`
    );
};

/**
 * Analyze HbA1c (Presence Only)
 */
export const analyzeHbA1cStatus = (profile) => {
    if (!profile || !isValidNumber(profile.hba1c)) return null;

    // Simple echo of the value, no judgment
    return createInsight(
        AI_MODULES.DATA_SUMMARY,
        INSIGHT_TYPES.INFO,
        `Last recorded HbA1c: ${profile.hba1c}%`,
        "Recorded in patient profile."
    );
};

/**
 * Analyze Creatinine (Presence Only)
 */
export const analyzeCreatinineStatus = (profile) => {
    if (!profile || !isValidNumber(profile.creatinine)) return null;

    return createInsight(
        AI_MODULES.DATA_SUMMARY,
        INSIGHT_TYPES.INFO,
        `Last recorded Creatinine: ${profile.creatinine}`,
        "Recorded in patient profile."
    );
};

/**
 * Count High/Low Events
 * STRICTLY COUNTING. NO "RISK" INFERENCE.
 */
export const detectGlucosePatterns = (readings) => {
    if (!readings || !Array.isArray(readings) || readings.length === 0) return null;

    const values = readings
        .map(r => r.value !== undefined ? r.value : r.hgt)
        .filter(isValidNumber)
        .map(v => parseFloat(v));

    if (values.length === 0) return null;

    const lowCount = values.filter(v => v < 70).length;
    const highCount = values.filter(v => v > 250).length;

    if (lowCount > 0) {
        return createInsight(
            AI_MODULES.OBSERVATION,
            INSIGHT_TYPES.INFO,
            `Recorded ${lowCount} reading(s) below 70 mg/dL`,
            'In the analyzed history period.'
        );
    }

    if (highCount > 0) {
        return createInsight(
            AI_MODULES.OBSERVATION,
            INSIGHT_TYPES.INFO,
            `Recorded ${highCount} reading(s) above 250 mg/dL`,
            'In the analyzed history period.'
        );
    }

    return null;
};

export const analyzeTimePatterns = (readings) => {
    return null; // Disabled
};

/**
 * Generate all applicable insights for a user's data
 */
export const generateAllInsights = (readings, fullHistory, profile) => {
    const insights = [];

    // Glucose Trends
    if (readings && readings.length > 0) {
        const trend = analyzeGlucoseTrend(readings);
        if (trend) insights.push(trend);

        const pattern = detectGlucosePatterns(readings);
        if (pattern) insights.push(pattern);
    }

    // Weight Trends (from full history)
    if (fullHistory && fullHistory.length > 0) {
        const weight = analyzeWeightTrend(fullHistory);
        if (weight) insights.push(weight);
    }

    // Profile Stat Echoes
    if (profile) {
        const a1c = analyzeHbA1cStatus(profile);
        if (a1c) insights.push(a1c);

        const creat = analyzeCreatinineStatus(profile);
        if (creat) insights.push(creat);
    }

    return insights;
};

export default {
    AI_MODULES,
    INSIGHT_TYPES,
    createInsight,
    analyzeGlucoseTrend,
    analyzeWeightTrend,
    analyzeHbA1cStatus,
    analyzeCreatinineStatus,
    detectGlucosePatterns,
    generateAllInsights
};
