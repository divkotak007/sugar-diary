/**
 * AI Insights Service (SAFE MODE)
 * STRICTLY OBSERVATIONAL. NO INFERENCES. NO DIAGNOSES.
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

// --- CONFIDENCE LEVELS ---
// Removed subjective confidence. Data is either present (100%) or not.

/**
 * Base AI Insight structure
 */

export const createInsight = (module, type, insight, explanation) => {
    return {
        module,
        type,
        insight,
        explanation,
        isAdvisoryOnly: true,
        generatedAt: new Date().toISOString(),
        disclaimer: 'Summary of recorded data only.'
    };
};

/**
 * Report recent glucose average
 * STRICTLY MATHEMATICAL. NO "GOOD" OR "BAD" LABELS.
 */
export const analyzeGlucoseTrend = (readings) => {
    if (!readings || readings.length < 3) {
        return createInsight(
            AI_MODULES.DATA_SUMMARY,
            INSIGHT_TYPES.INFO,
            'Data not available',
            'Minimum 3 readings required for summary.'
        );
    }

    // Simple Average of last 7 readings
    const values = readings.map(r => r.value || r.hgt).filter(v => v !== null && !isNaN(v));

    if (values.length === 0) return null;

    const recentValues = values.slice(-7);
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    return createInsight(
        AI_MODULES.DATA_SUMMARY,
        INSIGHT_TYPES.INFO,
        `Average of last ${recentValues.length} readings: ${avg.toFixed(0)} mg/dL`,
        `Based on recorded data from ${new Date().toLocaleDateString()}.`
    );
};

/**
 * Count High/Low Events
 * STRICTLY COUNTING. NO "RISK" INFERENCE.
 */
export const detectGlucosePatterns = (readings) => {
    if (!readings || readings.length === 0) return null;

    const values = readings.map(r => r.value || r.hgt).filter(v => v !== null && !isNaN(v));
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

/**
 * Analyze time of day (Simplest Observation)
 */
export const analyzeTimePatterns = (readings) => {
    return null; // Disabled to prevent complex inference hallucinations in Phase 1
};

/**
 * Generate all applicable insights for a user's data
 */
export const generateAllInsights = (readings) => {
    const insights = [];

    const trendInsight = analyzeGlucoseTrend(readings);
    if (trendInsight) insights.push(trendInsight);

    const patternInsight = detectGlucosePatterns(readings);
    if (patternInsight) insights.push(patternInsight);

    return insights;
};

export default {
    AI_MODULES,
    INSIGHT_TYPES,
    createInsight,
    analyzeGlucoseTrend,
    detectGlucosePatterns,
    analyzeTimePatterns,
    generateAllInsights
};
