/**
 * Centralized Scientific Limits for Vitals
 * Ensures data integrity across the application.
 */

export const VITAL_LIMITS = {
    weight: { min: 20, max: 300, unit: 'kg', step: 0.1 },
    hba1c: { min: 3.0, max: 20.0, unit: '%', step: 0.1 },
    creatinine: { min: 0.1, max: 15.0, unit: 'mg/dL', step: 0.01 },
    // Est. HbA1c is read-only usually, but limits help for sanity
    est_hba1c: { min: 0, max: 20, unit: '%', step: 0.1 }
};
