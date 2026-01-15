/**
 * Utils Index
 * Central export point for all utility functions
 */

export * from './schemaValidation.js';
export * from './graphCalculations.js';

// Explicitly re-export to ensure availability even with tree-shaking quirks
import { calculateGMI, getTrendData, analyzeTrend } from './graphCalculations.js';
import { validateGlucose, validateLogEntry } from './schemaValidation.js';

export {
    calculateGMI,
    getTrendData,
    analyzeTrend,
    validateGlucose,
    validateLogEntry
};
