/**
 * VALIDATION SCHEMAS
 * 
 * Zod-based validation for all log types.
 * Provides real-time validation with helpful error messages.
 * 
 * ZERO REGRESSION: New validation layer, doesn't block existing saves.
 */

import { z } from 'zod';

// ===== SUGAR LOG VALIDATION =====

export const sugarLogSchema = z.object({
    hgt: z.number({
        required_error: 'Blood sugar value is required',
        invalid_type_error: 'Blood sugar must be a number'
    })
        .min(20, 'Blood sugar cannot be below 20 mg/dL (check meter)')
        .max(600, 'Blood sugar cannot exceed 600 mg/dL (check meter)')
        .refine(val => !isNaN(val), 'Must be a valid number'),

    timestamp: z.date({
        required_error: 'Timestamp is required',
        invalid_type_error: 'Invalid timestamp'
    })
        .refine(date => date <= new Date(), 'Cannot log future readings')
        .refine(date => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return date >= sevenDaysAgo;
        }, 'Cannot log readings older than 7 days'),

    // Allow any string for context/mealStatus (flexible for different app versions)
    context: z.string().optional(),

    mealStatus: z.string().optional(),

    tags: z.array(z.string()).optional(),

    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

// ===== INSULIN LOG VALIDATION =====

export const insulinLogSchema = z.object({
    units: z.number({
        required_error: 'Insulin dose is required',
        invalid_type_error: 'Dose must be a number'
    })
        .min(0.5, 'Minimum dose is 0.5 units')
        .max(15, 'Maximum single dose is 15 units (safety limit)')
        .refine(val => {
            // Check if it's a valid increment (0.5 units)
            const remainder = (val * 10) % 5;
            return remainder === 0;
        }, 'Dose must be in 0.5 unit increments'),

    type: z.enum(['rapid', 'long', 'short', 'premix'], {
        required_error: 'Insulin type is required',
        invalid_type_error: 'Invalid insulin type'
    }),

    timestamp: z.date({
        required_error: 'Timestamp is required'
    })
        .refine(date => date <= new Date(), 'Cannot log future doses'),

    reason: z.enum(['meal', 'correction', 'basal', 'other']).optional(),

    notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional()
});

// ===== MEAL LOG VALIDATION =====

export const mealLogSchema = z.object({
    carbs: z.number({
        required_error: 'Carbohydrate amount is required',
        invalid_type_error: 'Carbs must be a number'
    })
        .min(0, 'Carbs cannot be negative')
        .max(300, 'Carbs seem unusually high (max 300g). Please verify.'),

    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
        required_error: 'Meal type is required'
    }),

    timestamp: z.date({
        required_error: 'Timestamp is required'
    })
        .refine(date => date <= new Date(), 'Cannot log future meals'),

    description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),

    tags: z.array(z.string()).optional()
});

// ===== VITAL LOG VALIDATION =====

export const vitalLogSchema = z.object({
    type: z.enum(['weight', 'hba1c', 'creatinine', 'blood_pressure'], {
        required_error: 'Vital type is required'
    }),

    value: z.number({
        required_error: 'Value is required',
        invalid_type_error: 'Value must be a number'
    })
        .refine(val => !isNaN(val), 'Must be a valid number'),

    timestamp: z.date({
        required_error: 'Timestamp is required'
    })
        .refine(date => date <= new Date(), 'Cannot log future vitals'),

    unit: z.string().optional()
}).refine(data => {
    // Type-specific validation
    switch (data.type) {
        case 'weight':
            return data.value >= 20 && data.value <= 300;
        case 'hba1c':
            return data.value >= 4.0 && data.value <= 15.0;
        case 'creatinine':
            return data.value >= 0.1 && data.value <= 10.0;
        default:
            return true;
    }
}, data => ({
    message: `${data.type} value (${data.value}) is out of valid range`
}));

// ===== VALIDATION HELPERS =====

/**
 * Validate sugar log with detailed error messages
 */
export const validateSugarLog = (data) => {
    try {
        sugarLogSchema.parse(data);
        return { valid: true, errors: [], data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                })),
                data: null
            };
        }
        return {
            valid: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }],
            data: null
        };
    }
};

/**
 * Validate insulin log with duplicate detection
 */
export const validateInsulinLog = (data, recentLogs = []) => {
    // Schema validation first
    try {
        insulinLogSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                })),
                data: null
            };
        }
    }

    // Duplicate detection (within 5 minutes)
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentDupe = recentLogs.find(log => {
        const logTime = log.timestamp instanceof Date
            ? log.timestamp.getTime()
            : (log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp);

        const isSameTime = logTime > fiveMinAgo;
        const isSameDose = Math.abs((log.units || 0) - data.units) < 0.5;
        const isSameType = log.type === data.type;

        return isSameTime && isSameDose && isSameType;
    });

    if (recentDupe) {
        return {
            valid: false,
            errors: [{
                field: 'duplicate',
                message: '⚠️ Duplicate dose detected within last 5 minutes. Was this already logged?'
            }],
            data: null,
            isDuplicate: true
        };
    }

    return { valid: true, errors: [], data };
};

/**
 * Validate meal log
 */
export const validateMealLog = (data) => {
    try {
        mealLogSchema.parse(data);
        return { valid: true, errors: [], data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                })),
                data: null
            };
        }
        return {
            valid: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }],
            data: null
        };
    }
};

/**
 * Validate vital log
 */
export const validateVitalLog = (data) => {
    try {
        vitalLogSchema.parse(data);
        return { valid: true, errors: [], data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                valid: false,
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                })),
                data: null
            };
        }
        return {
            valid: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }],
            data: null
        };
    }
};

// ===== BATCH VALIDATION =====

/**
 * Validate multiple logs at once
 */
export const validateBatch = (logs, type = 'sugar') => {
    const validator = {
        sugar: validateSugarLog,
        insulin: validateInsulinLog,
        meal: validateMealLog,
        vital: validateVitalLog
    }[type];

    if (!validator) {
        throw new Error(`Unknown log type: ${type}`);
    }

    const results = logs.map((log, index) => ({
        index,
        ...validator(log)
    }));

    const valid = results.filter(r => r.valid);
    const invalid = results.filter(r => !r.valid);

    return {
        totalCount: logs.length,
        validCount: valid.length,
        invalidCount: invalid.length,
        valid,
        invalid,
        allValid: invalid.length === 0
    };
};

// ===== EXPORT =====

export default {
    // Schemas
    sugarLogSchema,
    insulinLogSchema,
    mealLogSchema,
    vitalLogSchema,

    // Validators
    validateSugarLog,
    validateInsulinLog,
    validateMealLog,
    validateVitalLog,
    validateBatch
};
