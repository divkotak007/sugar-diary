/**
 * AI Insights Service
 * Placeholder for AI-powered analysis features
 * All insights are advisory only with confidence levels
 */

// --- AI MODULE TYPES ---
export const AI_MODULES = {
    TREND_ANALYSIS: 'trend_analysis',
    RISK_PREDICTION: 'risk_prediction',
    DOSE_PATTERN_DETECTION: 'dose_pattern_detection',
    HYPO_HYPER_ALERTS: 'hypo_hyper_alerts'
};

// --- INSIGHT TYPES ---
export const INSIGHT_TYPES = {
    INFO: 'info',
    SUGGESTION: 'suggestion',
    WARNING: 'warning',
    ALERT: 'alert'
};

// --- CONFIDENCE LEVELS ---
export const CONFIDENCE_LEVELS = {
    LOW: { value: 0.3, label: 'Low Confidence' },
    MEDIUM: { value: 0.6, label: 'Moderate Confidence' },
    HIGH: { value: 0.85, label: 'High Confidence' }
};

/**
 * Base AI Insight structure
 * @typedef {Object} AIInsight
 * @property {string} module - Which AI module generated this
 * @property {string} type - Insight type (info, suggestion, warning, alert)
 * @property {string} insight - Human-readable insight text
 * @property {number} confidence - Confidence score 0-1
 * @property {string} explanation - Why this insight was generated
 * @property {boolean} isAdvisoryOnly - Always true for safety
 * @property {Date} generatedAt - When the insight was generated
 */

/**
 * Create a standardized AI insight
 * @param {string} module - AI module name
 * @param {string} type - Insight type
 * @param {string} insight - Main insight text
 * @param {number} confidence - Confidence score
 * @param {string} explanation - Explanation text
 * @returns {AIInsight} Formatted insight object
 */
export const createInsight = (module, type, insight, confidence, explanation) => {
    return {
        module,
        type,
        insight,
        confidence,
        confidenceLabel: getConfidenceLabel(confidence),
        explanation,
        isAdvisoryOnly: true, // ALWAYS advisory, never prescriptive
        generatedAt: new Date().toISOString(),
        disclaimer: 'This is an AI-generated observation for informational purposes only. It is not medical advice. Always consult your healthcare provider.'
    };
};

/**
 * Get confidence level label
 * @param {number} confidence - Confidence value 0-1
 * @returns {string} Human-readable label
 */
const getConfidenceLabel = (confidence) => {
    if (confidence >= CONFIDENCE_LEVELS.HIGH.value) return CONFIDENCE_LEVELS.HIGH.label;
    if (confidence >= CONFIDENCE_LEVELS.MEDIUM.value) return CONFIDENCE_LEVELS.MEDIUM.label;
    return CONFIDENCE_LEVELS.LOW.label;
};

/**
 * Analyze glucose trend
 * Placeholder using simple statistical analysis
 * @param {Array} readings - Array of glucose readings
 * @returns {AIInsight} Trend analysis insight
 */
export const analyzeGlucoseTrend = (readings) => {
    if (!readings || readings.length < 5) {
        return createInsight(
            AI_MODULES.TREND_ANALYSIS,
            INSIGHT_TYPES.INFO,
            'More readings needed for trend analysis.',
            0.9,
            'At least 5 glucose readings are required to analyze trends.'
        );
    }

    // Simple trend calculation
    const values = readings.map(r => r.value || r.hgt);
    const recentValues = values.slice(-7);
    const olderValues = values.slice(-14, -7);

    if (olderValues.length === 0) {
        const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const avgText = avg < 100 ? 'well controlled' : avg < 140 ? 'moderately controlled' : 'above target';

        return createInsight(
            AI_MODULES.TREND_ANALYSIS,
            INSIGHT_TYPES.INFO,
            `Your average glucose over the last ${recentValues.length} readings is ${avg.toFixed(0)} mg/dL (${avgText}).`,
            0.7,
            'Based on recent glucose readings. More historical data would improve analysis accuracy.'
        );
    }

    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    let insight, type;
    if (Math.abs(change) < 5) {
        insight = `Your glucose levels have been stable (average: ${recentAvg.toFixed(0)} mg/dL).`;
        type = INSIGHT_TYPES.INFO;
    } else if (change > 0) {
        insight = `Your glucose levels have increased by ${change.toFixed(1)}% recently (now averaging ${recentAvg.toFixed(0)} mg/dL).`;
        type = change > 15 ? INSIGHT_TYPES.WARNING : INSIGHT_TYPES.INFO;
    } else {
        insight = `Your glucose levels have decreased by ${Math.abs(change).toFixed(1)}% recently (now averaging ${recentAvg.toFixed(0)} mg/dL).`;
        type = change < -15 ? INSIGHT_TYPES.WARNING : INSIGHT_TYPES.INFO;
    }

    return createInsight(
        AI_MODULES.TREND_ANALYSIS,
        type,
        insight,
        0.65,
        `Comparing the last ${recentValues.length} readings (avg: ${recentAvg.toFixed(0)}) with the previous ${olderValues.length} readings (avg: ${olderAvg.toFixed(0)}).`
    );
};

/**
 * Detect hypoglycemia/hyperglycemia patterns
 * @param {Array} readings - Array of glucose readings
 * @returns {AIInsight} Pattern detection insight
 */
export const detectGlucosePatterns = (readings) => {
    if (!readings || readings.length < 7) {
        return null;
    }

    const values = readings.map(r => r.value || r.hgt);
    const lowCount = values.filter(v => v < 70).length;
    const highCount = values.filter(v => v > 180).length;
    const veryHighCount = values.filter(v => v > 250).length;

    const lowPercent = (lowCount / values.length) * 100;
    const highPercent = (highCount / values.length) * 100;

    if (lowPercent > 10) {
        return createInsight(
            AI_MODULES.HYPO_HYPER_ALERTS,
            INSIGHT_TYPES.WARNING,
            `${lowPercent.toFixed(0)}% of your recent readings are below 70 mg/dL. Consider discussing this pattern with your doctor.`,
            0.75,
            `${lowCount} out of ${values.length} readings were in the hypoglycemic range.`
        );
    }

    if (highPercent > 50) {
        return createInsight(
            AI_MODULES.HYPO_HYPER_ALERTS,
            INSIGHT_TYPES.WARNING,
            `${highPercent.toFixed(0)}% of your recent readings are above 180 mg/dL. Your blood sugar may need better management.`,
            0.75,
            `${highCount} out of ${values.length} readings were above target range.`
        );
    }

    if (veryHighCount > 0) {
        return createInsight(
            AI_MODULES.HYPO_HYPER_ALERTS,
            INSIGHT_TYPES.ALERT,
            `You've had ${veryHighCount} reading(s) above 250 mg/dL. Please monitor closely and consult your healthcare provider if this continues.`,
            0.85,
            `Very high glucose readings can indicate the need for medication adjustment.`
        );
    }

    return null;
};

/**
 * Analyze time of day patterns
 * @param {Array} readings - Array of readings with meal status
 * @returns {AIInsight|null} Pattern insight or null
 */
export const analyzeTimePatterns = (readings) => {
    if (!readings || readings.length < 14) {
        return null;
    }

    const byMealStatus = {};
    readings.forEach(r => {
        const status = r.mealStatus || 'Unknown';
        if (!byMealStatus[status]) {
            byMealStatus[status] = [];
        }
        byMealStatus[status].push(r.value || r.hgt);
    });

    let highestAvg = 0;
    let highestStatus = '';
    let lowestAvg = Infinity;
    let lowestStatus = '';

    Object.entries(byMealStatus).forEach(([status, values]) => {
        if (values.length >= 3) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            if (avg > highestAvg) {
                highestAvg = avg;
                highestStatus = status;
            }
            if (avg < lowestAvg) {
                lowestAvg = avg;
                lowestStatus = status;
            }
        }
    });

    if (highestAvg - lowestAvg > 30 && highestStatus && lowestStatus) {
        return createInsight(
            AI_MODULES.DOSE_PATTERN_DETECTION,
            INSIGHT_TYPES.SUGGESTION,
            `Your ${highestStatus.toLowerCase()} readings (avg: ${highestAvg.toFixed(0)} mg/dL) are notably higher than ${lowestStatus.toLowerCase()} readings (avg: ${lowestAvg.toFixed(0)} mg/dL).`,
            0.6,
            'This pattern might indicate timing-related factors worth discussing with your healthcare provider.'
        );
    }

    return null;
};

/**
 * Generate all applicable insights for a user's data
 * @param {Array} readings - Array of glucose readings
 * @returns {Array<AIInsight>} Array of generated insights
 */
export const generateAllInsights = (readings) => {
    const insights = [];

    const trendInsight = analyzeGlucoseTrend(readings);
    if (trendInsight) insights.push(trendInsight);

    const patternInsight = detectGlucosePatterns(readings);
    if (patternInsight) insights.push(patternInsight);

    const timeInsight = analyzeTimePatterns(readings);
    if (timeInsight) insights.push(timeInsight);

    return insights;
};

export default {
    AI_MODULES,
    INSIGHT_TYPES,
    CONFIDENCE_LEVELS,
    createInsight,
    analyzeGlucoseTrend,
    detectGlucosePatterns,
    analyzeTimePatterns,
    generateAllInsights
};
