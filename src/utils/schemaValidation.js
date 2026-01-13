/**
 * Schema Validation Module
 * Validates data before saving to prevent invalid entries
 * Provides user-friendly error messages
 */

import { DANGER_THRESHOLDS, NORMAL_RANGES } from '../data/medications.js';

// --- VALIDATION RESULT TYPES ---
export const VALIDATION_STATUS = {
    VALID: 'valid',
    WARNING: 'warning',
    ERROR: 'error',
    REQUIRES_CONFIRMATION: 'requires_confirmation'
};

// --- VALIDATION RESULT FACTORY ---
const createResult = (status, message = '', field = null) => ({
    status,
    message,
    field,
    isValid: status === VALIDATION_STATUS.VALID || status === VALIDATION_STATUS.WARNING
});

// --- GLUCOSE VALIDATION ---
/**
 * Validate a glucose reading
 * @param {number|string} value - Glucose value in mg/dL
 * @returns {object} Validation result
 */
export const validateGlucose = (value) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue) || value === '' || value === null || value === undefined) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid glucose reading', 'glucose');
    }

    if (numValue <= 0) {
        return createResult(VALIDATION_STATUS.ERROR, 'Glucose reading must be a positive number', 'glucose');
    }

    if (numValue > 600) {
        return createResult(VALIDATION_STATUS.ERROR, 'Glucose reading appears too high. Please verify.', 'glucose');
    }

    const thresholds = DANGER_THRESHOLDS.glucose;

    if (numValue < thresholds.requiresConfirmation.min || numValue > thresholds.requiresConfirmation.max) {
        return createResult(
            VALIDATION_STATUS.REQUIRES_CONFIRMATION,
            `This value (${numValue} mg/dL) is extreme. Please confirm this is correct.`,
            'glucose'
        );
    }

    if (numValue < thresholds.low) {
        return createResult(VALIDATION_STATUS.WARNING, 'Low blood sugar detected', 'glucose');
    }

    if (numValue >= thresholds.veryHigh) {
        return createResult(VALIDATION_STATUS.WARNING, 'High blood sugar detected', 'glucose');
    }

    return createResult(VALIDATION_STATUS.VALID);
};

// --- HBA1C VALIDATION ---
/**
 * Validate an HbA1c value
 * @param {number|string} value - HbA1c percentage
 * @returns {object} Validation result
 */
export const validateHbA1c = (value) => {
    if (value === '' || value === null || value === undefined) {
        return createResult(VALIDATION_STATUS.VALID); // Optional field
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid HbA1c value', 'hba1c');
    }

    if (numValue < 3 || numValue > 20) {
        return createResult(
            VALIDATION_STATUS.REQUIRES_CONFIRMATION,
            `HbA1c value of ${numValue}% is unusual. Please verify.`,
            'hba1c'
        );
    }

    if (numValue > 10) {
        return createResult(VALIDATION_STATUS.WARNING, 'HbA1c indicates poor glucose control', 'hba1c');
    }

    return createResult(VALIDATION_STATUS.VALID);
};

// --- WEIGHT VALIDATION ---
/**
 * Validate a weight value
 * @param {number|string} value - Weight in kg
 * @returns {object} Validation result
 */
export const validateWeight = (value) => {
    if (value === '' || value === null || value === undefined) {
        return createResult(VALIDATION_STATUS.VALID); // Optional field
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid weight', 'weight');
    }

    if (numValue < 1 || numValue > 500) {
        return createResult(VALIDATION_STATUS.ERROR, 'Weight appears invalid. Please check.', 'weight');
    }

    if (numValue < 20 || numValue > 300) {
        return createResult(
            VALIDATION_STATUS.REQUIRES_CONFIRMATION,
            `Weight of ${numValue} kg is unusual. Please confirm.`,
            'weight'
        );
    }

    return createResult(VALIDATION_STATUS.VALID);
};

// --- CREATININE VALIDATION ---
/**
 * Validate a creatinine value
 * @param {number|string} value - Creatinine in mg/dL
 * @returns {object} Validation result
 */
export const validateCreatinine = (value) => {
    if (value === '' || value === null || value === undefined) {
        return createResult(VALIDATION_STATUS.VALID); // Optional field
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid creatinine value', 'creatinine');
    }

    if (numValue < 0.1 || numValue > 30) {
        return createResult(VALIDATION_STATUS.ERROR, 'Creatinine value appears invalid', 'creatinine');
    }

    if (numValue > 5) {
        return createResult(VALIDATION_STATUS.WARNING, 'Creatinine indicates possible kidney concern', 'creatinine');
    }

    return createResult(VALIDATION_STATUS.VALID);
};

// --- INSULIN DOSE VALIDATION ---
/**
 * Validate an insulin dose
 * @param {number|string} value - Dose in units
 * @param {number} maxDose - Maximum allowed dose (optional safety cap)
 * @returns {object} Validation result
 */
export const validateInsulinDose = (value, maxDose = null) => {
    if (value === '' || value === null || value === undefined) {
        return createResult(VALIDATION_STATUS.VALID); // Optional field
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid dose', 'insulin');
    }

    if (numValue < 0) {
        return createResult(VALIDATION_STATUS.ERROR, 'Dose cannot be negative', 'insulin');
    }

    if (numValue > 100) {
        return createResult(
            VALIDATION_STATUS.REQUIRES_CONFIRMATION,
            `${numValue} units is a very large dose. Please confirm.`,
            'insulin'
        );
    }

    if (maxDose && numValue > maxDose) {
        return createResult(
            VALIDATION_STATUS.WARNING,
            `Dose exceeds maximum of ${maxDose} units`,
            'insulin'
        );
    }

    return createResult(VALIDATION_STATUS.VALID);
};

// --- DATE OF BIRTH VALIDATION ---
/**
 * Validate a date of birth
 * @param {string} value - Date string
 * @returns {object} Validation result
 */
export const validateDateOfBirth = (value) => {
    if (!value) {
        return createResult(VALIDATION_STATUS.VALID); // Optional on update
    }

    const date = new Date(value);
    const now = new Date();

    if (isNaN(date.getTime())) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid date', 'dob');
    }

    if (date > now) {
        return createResult(VALIDATION_STATUS.ERROR, 'Date of birth cannot be in the future', 'dob');
    }

    const age = Math.floor((now - date) / (365.25 * 24 * 60 * 60 * 1000));

    if (age > 120) {
        return createResult(VALIDATION_STATUS.ERROR, 'Please enter a valid date of birth', 'dob');
    }

    if (age < 1) {
        return createResult(VALIDATION_STATUS.WARNING, 'Patient is under 1 year old', 'dob');
    }

    return createResult(VALIDATION_STATUS.VALID);
};

// --- COMPLETE LOG ENTRY VALIDATION ---
/**
 * Validate a complete log entry before saving
 * @param {object} entry - Log entry to validate
 * @returns {object} Validation result with all field errors
 */
export const validateLogEntry = (entry) => {
    const errors = [];
    const warnings = [];
    const confirmations = [];

    // Validate glucose if present
    if (entry.hgt !== undefined) {
        const result = validateGlucose(entry.hgt);
        if (result.status === VALIDATION_STATUS.ERROR) errors.push(result);
        else if (result.status === VALIDATION_STATUS.WARNING) warnings.push(result);
        else if (result.status === VALIDATION_STATUS.REQUIRES_CONFIRMATION) confirmations.push(result);
    }

    // Validate insulin doses if present
    if (entry.insulinDoses) {
        Object.entries(entry.insulinDoses).forEach(([id, dose]) => {
            if (dose) {
                const result = validateInsulinDose(dose);
                if (result.status === VALIDATION_STATUS.ERROR) errors.push({ ...result, field: `insulin_${id}` });
                else if (result.status === VALIDATION_STATUS.REQUIRES_CONFIRMATION) confirmations.push({ ...result, field: `insulin_${id}` });
            }
        });
    }

    return {
        isValid: errors.length === 0,
        requiresConfirmation: confirmations.length > 0,
        errors,
        warnings,
        confirmations
    };
};

// --- PROFILE VALIDATION ---
/**
 * Validate profile/vitals update
 * @param {object} vitals - Vitals form data
 * @returns {object} Validation result
 */
export const validateProfile = (vitals) => {
    const errors = [];
    const warnings = [];
    const confirmations = [];

    if (vitals.weight) {
        const result = validateWeight(vitals.weight);
        if (result.status !== VALIDATION_STATUS.VALID) {
            if (result.status === VALIDATION_STATUS.ERROR) errors.push(result);
            else if (result.status === VALIDATION_STATUS.WARNING) warnings.push(result);
            else if (result.status === VALIDATION_STATUS.REQUIRES_CONFIRMATION) confirmations.push(result);
        }
    }

    if (vitals.hba1c) {
        const result = validateHbA1c(vitals.hba1c);
        if (result.status !== VALIDATION_STATUS.VALID) {
            if (result.status === VALIDATION_STATUS.ERROR) errors.push(result);
            else if (result.status === VALIDATION_STATUS.WARNING) warnings.push(result);
            else if (result.status === VALIDATION_STATUS.REQUIRES_CONFIRMATION) confirmations.push(result);
        }
    }

    if (vitals.creatinine) {
        const result = validateCreatinine(vitals.creatinine);
        if (result.status !== VALIDATION_STATUS.VALID) {
            if (result.status === VALIDATION_STATUS.ERROR) errors.push(result);
            else if (result.status === VALIDATION_STATUS.WARNING) warnings.push(result);
            else if (result.status === VALIDATION_STATUS.REQUIRES_CONFIRMATION) confirmations.push(result);
        }
    }

    if (vitals.dob) {
        const result = validateDateOfBirth(vitals.dob);
        if (result.status !== VALIDATION_STATUS.VALID) {
            if (result.status === VALIDATION_STATUS.ERROR) errors.push(result);
            else if (result.status === VALIDATION_STATUS.WARNING) warnings.push(result);
        }
    }

    return {
        isValid: errors.length === 0,
        requiresConfirmation: confirmations.length > 0,
        errors,
        warnings,
        confirmations
    };
};

export default {
    VALIDATION_STATUS,
    validateGlucose,
    validateHbA1c,
    validateWeight,
    validateCreatinine,
    validateInsulinDose,
    validateDateOfBirth,
    validateLogEntry,
    validateProfile
};
