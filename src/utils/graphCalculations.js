/**
 * Graph Calculations Module
 * Utility functions for trend analysis, graph data preparation,
 * and statistical calculations for diabetes tracking
 */

import { NORMAL_RANGES, DANGER_THRESHOLDS } from '../data/medications.js';

// --- COLOR-BLIND SAFE PALETTE (Okabe-Ito) ---
export const GRAPH_COLORS = {
    glucose: '#E69F00',     // Orange
    hba1c: '#009E73',       // Teal/Emerald
    creatinine: '#CC79A7',  // Pink/Purple
    weight: '#56B4E9',      // Sky blue
    insulin: '#0072B2',     // Blue
    warning: '#F0E442',     // Yellow
    danger: '#D55E00',      // Red-orange
    safe: '#009E73'         // Green
};

// --- HEX TO RGB CONVERTER ---
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

// --- TREND DATA EXTRACTION ---
/**
 * Extract trend data from full history for a specific metric
 * @param {Array} fullHistory - Array of log entries
 * @param {string} metric - Metric to extract (e.g., 'weight', 'hba1c', 'creatinine')
 * @param {object} currentProfile - Current profile with latest values
 * @returns {Array} Array of {date, value} objects sorted chronologically
 */
export const getTrendData = (fullHistory, metric, currentProfile = {}) => {
    const data = fullHistory
        .filter(log => {
            const value = log.snapshot?.profile?.[metric];
            return value !== undefined && value !== null && !isNaN(parseFloat(value));
        })
        .map(log => ({
            date: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : new Date(log.timestamp).getTime(),
            value: parseFloat(log.snapshot.profile[metric])
        }))
        .reverse(); // Chronological order

    // Remove duplicate consecutive values (only show changes)
    const filteredData = data.filter((item, index, arr) => {
        if (index === 0) return true;
        return item.value !== arr[index - 1].value;
    });

    // Add current value if different from last recorded
    const currentValue = currentProfile[metric];
    if (currentValue !== undefined && currentValue !== null && !isNaN(parseFloat(currentValue))) {
        const lastValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].value : null;
        if (lastValue !== parseFloat(currentValue)) {
            filteredData.push({
                date: Date.now(),
                value: parseFloat(currentValue)
            });
        }
    }

    return filteredData;
};

// --- GLUCOSE TREND DATA ---
/**
 * Extract glucose reading trends from history
 * @param {Array} fullHistory - Array of log entries
 * @param {number} limit - Maximum number of readings to return
 * @returns {Array} Array of {date, value, mealStatus, tags} objects
 */
export const getGlucoseTrendData = (fullHistory, limit = 30) => {
    return fullHistory
        .filter(log => log.hgt !== undefined && !isNaN(parseFloat(log.hgt)))
        .slice(0, limit)
        .map(log => ({
            date: log.timestamp?.seconds ? log.timestamp.seconds * 1000 : new Date(log.timestamp).getTime(),
            value: parseFloat(log.hgt),
            mealStatus: log.mealStatus,
            tags: log.tags || []
        }))
        .reverse();
};

// --- GRAPH POINT CALCULATION ---
/**
 * Calculate SVG coordinates for graph points
 * @param {Array} data - Array of {date, value} objects
 * @param {object} dimensions - {width, height, padding}
 * @param {number} maxPoints - Maximum points to display (default 5)
 * @returns {object} {points, polyline, min, max, range}
 */
export const calculateGraphPoints = (data, dimensions, maxPoints = 5) => {
    const { width, height, padding } = dimensions;

    // Limit to last N points
    const visibleData = data.slice(-maxPoints);

    if (visibleData.length < 2) {
        return { points: [], polyline: '', min: 0, max: 0, range: 0, insufficient: true };
    }

    // Calculate value range
    const values = visibleData.map(d => d.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Handle flat line case
    if (min === max) {
        min -= 1;
        max += 1;
    } else {
        // Add padding to range
        const rangePadding = (max - min) * 0.15;
        min -= rangePadding;
        max += rangePadding;
    }

    const range = max - min;
    const xStep = (width - 2 * padding) / (maxPoints - 1);

    // Calculate points
    const points = visibleData.map((d, i) => {
        const x = padding + (i * xStep);
        const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
        return {
            x,
            y,
            value: d.value,
            date: d.date
        };
    });

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

    return { points, polyline, min, max, range };
};

// --- REFERENCE LINE CALCULATION ---
/**
 * Calculate Y position for a reference line
 * @param {number} refValue - Reference value (e.g., 5.7 for HbA1c normal)
 * @param {object} graphCalc - Result from calculateGraphPoints
 * @param {object} dimensions - {height, padding}
 * @returns {number|null} Y coordinate or null if out of range
 */
export const calculateReferenceLine = (refValue, graphCalc, dimensions) => {
    if (!refValue || graphCalc.insufficient) return null;

    const { min, range } = graphCalc;
    const { height, padding } = dimensions;

    const y = height - padding - ((refValue - min) / range) * (height - 2 * padding);

    // Only return if visible within graph area
    if (y > padding && y < height - padding) {
        return y;
    }
    return null;
};

// --- TREND ANALYSIS ---
/**
 * Analyze trend direction and magnitude
 * @param {Array} data - Array of {date, value} objects
 * @returns {object} {direction, percentage, summary}
 */
export const analyzeTrend = (data) => {
    if (!data || data.length < 2) {
        return { direction: 'stable', percentage: 0, summary: 'Insufficient data' };
    }

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const percentage = firstValue !== 0 ? ((change / firstValue) * 100).toFixed(1) : 0;

    let direction = 'stable';
    let arrow = '→';

    if (percentage > 5) {
        direction = 'increasing';
        arrow = '↑';
    } else if (percentage < -5) {
        direction = 'decreasing';
        arrow = '↓';
    }

    const summary = `${arrow} ${Math.abs(percentage)}% ${direction === 'stable' ? 'stable' : direction === 'increasing' ? 'increase' : 'decrease'} over last ${data.length} readings`;

    return { direction, percentage: parseFloat(percentage), summary, arrow };
};

// --- RISK FLAG DETECTION ---
/**
 * Check if data contains risk flags
 * @param {Array} data - Array of {date, value} objects
 * @param {string} metric - Type of metric ('glucose', 'hba1c', etc.)
 * @returns {object} {hasRisk, riskLevel, message}
 */
export const detectRiskFlags = (data, metric) => {
    if (!data || data.length === 0) {
        return { hasRisk: false, riskLevel: 'none', message: '' };
    }

    const lastValue = data[data.length - 1].value;

    if (metric === 'glucose') {
        const thresholds = DANGER_THRESHOLDS.glucose;
        if (lastValue < thresholds.criticalLow || lastValue >= thresholds.critical) {
            return { hasRisk: true, riskLevel: 'critical', message: 'Critical value detected' };
        }
        if (lastValue < thresholds.low) {
            return { hasRisk: true, riskLevel: 'low', message: 'Low blood sugar' };
        }
        if (lastValue >= thresholds.veryHigh) {
            return { hasRisk: true, riskLevel: 'high', message: 'High blood sugar' };
        }
    }

    if (metric === 'hba1c') {
        const target = NORMAL_RANGES.hba1c.target;
        if (lastValue > 10) {
            return { hasRisk: true, riskLevel: 'high', message: 'HbA1c significantly above target' };
        }
        if (lastValue > target + 1) {
            return { hasRisk: true, riskLevel: 'warning', message: 'HbA1c above target' };
        }
    }

    if (metric === 'creatinine') {
        const target = NORMAL_RANGES.creatinine.target;
        if (lastValue > 2.5) {
            return { hasRisk: true, riskLevel: 'high', message: 'Elevated creatinine' };
        }
        if (lastValue > target) {
            return { hasRisk: true, riskLevel: 'warning', message: 'Creatinine above normal' };
        }
    }

    return { hasRisk: false, riskLevel: 'none', message: '' };
};

// --- MOVING AVERAGE CALCULATION ---
/**
 * Calculate moving average for smoothing
 * @param {Array} data - Array of {date, value} objects
 * @param {number} window - Window size for moving average
 * @returns {Array} Array with added 'average' property
 */
export const calculateMovingAverage = (data, window = 3) => {
    if (!data || data.length < window) return data;

    return data.map((point, index) => {
        if (index < window - 1) {
            return { ...point, average: null };
        }

        const windowStart = index - window + 1;
        const windowValues = data.slice(windowStart, index + 1).map(d => d.value);
        const average = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;

        return { ...point, average: parseFloat(average.toFixed(1)) };
    });
};

// --- STATISTICS CALCULATION ---
/**
 * Calculate basic statistics for a dataset
 * @param {Array} data - Array of {date, value} objects
 * @returns {object} {mean, median, min, max, stdDev}
 */
export const calculateStats = (data) => {
    if (!data || data.length === 0) {
        return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
    }

    const values = data.map(d => d.value);
    const n = values.length;

    // Mean
    const mean = values.reduce((a, b) => a + b, 0) / n;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    // Min/Max
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Standard Deviation
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(avgSquareDiff);

    return {
        mean: parseFloat(mean.toFixed(1)),
        median: parseFloat(median.toFixed(1)),
        min,
        max,
        stdDev: parseFloat(stdDev.toFixed(2))
    };
};

// --- TIME IN RANGE (TIR) CALCULATION ---
/**
 * Calculate Time In Range for glucose readings
 * @param {Array} glucoseData - Array of glucose readings
 * @param {object} range - {min, max} target range (default 70-180)
 * @returns {object} {inRange, belowRange, aboveRange} as percentages
 */
export const calculateTimeInRange = (glucoseData, range = { min: 70, max: 180 }) => {
    if (!glucoseData || glucoseData.length === 0) {
        return { inRange: 0, belowRange: 0, aboveRange: 0 };
    }

    const total = glucoseData.length;
    let inRange = 0;
    let belowRange = 0;
    let aboveRange = 0;

    glucoseData.forEach(reading => {
        const value = reading.value || reading.hgt;
        if (value < range.min) belowRange++;
        else if (value > range.max) aboveRange++;
        else inRange++;
    });

    return {
        inRange: parseFloat(((inRange / total) * 100).toFixed(1)),
        belowRange: parseFloat(((belowRange / total) * 100).toFixed(1)),
        aboveRange: parseFloat(((aboveRange / total) * 100).toFixed(1))
    };
};

// --- GMI (ESTIMATED HBA1C) CALCULATION ---
/**
 * Calculate Glucose Management Indicator (Estimated HbA1c)
 * Formula: GMI(%) = 3.31 + 0.02392 * mean_glucose(mg/dL)
 * @param {number} meanGlucose - Average glucose in mg/dL
 * @returns {number|null} GMI percentage or null
 */
export const calculateGMI = (meanGlucose) => {
    if (!meanGlucose || meanGlucose < 40) return null;
    return parseFloat((3.31 + (0.02392 * meanGlucose)).toFixed(1));
};

export default {
    GRAPH_COLORS,
    hexToRgb,
    getTrendData,
    getGlucoseTrendData,
    calculateGraphPoints,
    calculateReferenceLine,
    analyzeTrend,
    detectRiskFlags,
    calculateMovingAverage,
    calculateStats,
    calculateTimeInRange,
    calculateGMI
};
