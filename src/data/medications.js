/**
 * Medication Database Module
 * Centralized database for diabetes medications including insulins and oral medications
 * with contraindication mappings, frequency rules, and timing constants.
 */

// --- INSULIN DATABASE ---
export const INSULINS = {
    rapid: [
        "Insulin Aspart (NovoRapid)",
        "Insulin Lispro (Humalog)",
        "Insulin Glulisine (Apidra)",
        "Fiasp"
    ],
    short: [
        "Regular Human Insulin (Actrapid)",
        "Humulin R"
    ],
    intermediate: [
        "NPH (Insulatard)",
        "Humulin N"
    ],
    basal: [
        "Glargine U-100 (Lantus)",
        "Glargine U-300 (Toujeo)",
        "Detemir (Levemir)",
        "Degludec (Tresiba)",
        "Basalog"
    ],
    premix: [
        "Mixtard 30/70",
        "NovoMix 30",
        "Humalog Mix 25",
        "Humalog Mix 50",
        "Ryzodeg"
    ]
};

// --- ORAL MEDICATIONS DATABASE ---
export const ORAL_MEDS = {
    biguanides: [
        "Metformin 500mg",
        "Metformin 850mg",
        "Metformin 1000mg ER"
    ],
    sulfonylureas: [
        "Glimepiride 1mg",
        "Glimepiride 2mg",
        "Gliclazide 80mg",
        "Gliclazide MR 60mg"
    ],
    dpp4: [
        "Sitagliptin 100mg",
        "Vildagliptin 50mg",
        "Teneligliptin 20mg",
        "Linagliptin 5mg"
    ],
    sglt2: [
        "Dapagliflozin 10mg",
        "Empagliflozin 25mg",
        "Canagliflozin 100mg",
        "Remogliflozin 100mg"
    ],
    tzd: [
        "Pioglitazone 15mg",
        "Pioglitazone 30mg"
    ],
    combinations: [
        "Glimepiride + Metformin",
        "Vildagliptin + Metformin",
        "Sitagliptin + Metformin",
        "Dapagliflozin + Metformin"
    ],
    others: [
        "Voglibose 0.2mg",
        "Acarbose 25mg",
        "Rybelsus 3mg"
    ]
};

// --- COMBINED DEFAULT DATABASE ---
export const DEFAULT_MED_DATABASE = {
    insulins: INSULINS,
    oralMeds: ORAL_MEDS
};

// --- FREQUENCY RULES ---
// Maps frequency names to their associated timing slots
export const FREQUENCY_RULES = {
    "Once Daily": ["Morning"],
    "Twice Daily": ["Morning", "Evening"],
    "Thrice Daily": ["Morning", "Afternoon", "Evening"],
    "Bedtime": ["Bedtime"],
    "Before Meals": ["Breakfast", "Lunch", "Dinner"],
    "SOS": ["As Needed"]
};

// --- INSULIN-SPECIFIC FREQUENCIES ---
export const INSULIN_FREQUENCIES = [
    "Bedtime",
    "Before Meals",
    "Twice Daily",
    "Once Daily",
    "SOS"
];

// --- ALL POSSIBLE TIMINGS ---
export const ALL_TIMINGS = [
    "Morning",
    "Breakfast",
    "Lunch",
    "Afternoon",
    "Evening",
    "Dinner",
    "Bedtime",
    "As Needed"
];

// --- CONTRAINDICATIONS ---
// Medications that should not be used or require caution in specific conditions
export const CONTRAINDICATIONS = {
    pregnancy: [
        "Pioglitazone",
        "Dapagliflozin",
        "Empagliflozin",
        "Canagliflozin",
        "Glimepiride",
        "Gliclazide",
        "Rybelsus",
        "Remogliflozin"
    ],
    renalImpairment: [
        "Metformin", // eGFR < 30
        "Dapagliflozin", // eGFR < 25
        "Empagliflozin", // eGFR < 20
        "Canagliflozin" // eGFR < 30
    ],
    heartFailure: [
        "Pioglitazone"
    ],
    liverDisease: [
        "Pioglitazone"
    ]
};

// --- CONTEXT TAGS WITH EMOJIS ---
export const TAG_EMOJIS = {
    "Sick": "🤒",
    "Sweets": "🍬",
    "Heavy Meal": "🍔",
    "Exercise": "🏃",
    "Missed Dose": "❌",
    "Travel": "✈️",
    "Fasting": "⏳",
    "Stress": "😰",
    "Alcohol": "🍺"
};

// --- NORMAL RANGES ---
// Reference values for various metrics
export const NORMAL_RANGES = {
    glucose: {
        fasting: { min: 70, max: 100, unit: 'mg/dL' },
        preMeal: { min: 70, max: 130, unit: 'mg/dL' },
        postMeal: { min: 70, max: 180, unit: 'mg/dL' },
        bedtime: { min: 100, max: 140, unit: 'mg/dL' }
    },
    hba1c: {
        normal: { max: 5.7, unit: '%' },
        prediabetes: { min: 5.7, max: 6.4, unit: '%' },
        diabetes: { min: 6.5, unit: '%' },
        target: 7.0 // Standard target for most diabetics
    },
    creatinine: {
        male: { min: 0.7, max: 1.3, unit: 'mg/dL' },
        female: { min: 0.6, max: 1.1, unit: 'mg/dL' },
        target: 1.2
    },
    weight: {
        // No fixed range, tracked for trend
        unit: 'kg'
    }
};

// --- DANGER THRESHOLDS ---
// Values that require immediate attention or confirmation
export const DANGER_THRESHOLDS = {
    glucose: {
        criticalLow: 50,      // Severe hypoglycemia
        low: 70,              // Hypoglycemia
        high: 250,            // Poor control
        veryHigh: 300,        // Concerning
        critical: 400,        // DKA risk
        requiresConfirmation: { min: 50, max: 400 }
    },
    hba1c: {
        low: 4.0,             // Unusually low
        high: 14.0,           // Unusually high
        requiresConfirmation: { min: 3.0, max: 15.0 }
    }
};

// --- HELPER FUNCTIONS ---

/**
 * Check if a medication is contraindicated for a specific condition
 * @param {string} medName - Name of the medication
 * @param {string} condition - Condition to check (e.g., 'pregnancy')
 * @returns {boolean} True if contraindicated
 */
export const isContraindicated = (medName, condition) => {
    const contraindList = CONTRAINDICATIONS[condition];
    if (!contraindList) return false;
    return contraindList.some(c =>
        medName.toLowerCase().includes(c.toLowerCase())
    );
};

/**
 * Get all medications that are contraindicated for a condition
 * @param {string} condition - Condition to check
 * @returns {string[]} List of contraindicated medication names
 */
export const getContraindicatedMeds = (condition) => {
    return CONTRAINDICATIONS[condition] || [];
};

/**
 * Get the timing slots for a given frequency
 * @param {string} frequency - Frequency name
 * @returns {string[]} Array of timing slot names
 */
export const getTimingsForFrequency = (frequency) => {
    return FREQUENCY_RULES[frequency] || [];
};

/**
 * Get the normal range for a specific context
 * @param {string} mealStatus - Current meal context (Fasting, Pre-Meal, Post-Meal, Bedtime)
 * @returns {object} Object with min and max values
 */
export const getGlucoseRange = (mealStatus) => {
    const key = mealStatus.toLowerCase().replace('-', '').replace(' ', '');
    const mappings = {
        'fasting': NORMAL_RANGES.glucose.fasting,
        'premeal': NORMAL_RANGES.glucose.preMeal,
        'postmeal': NORMAL_RANGES.glucose.postMeal,
        'bedtime': NORMAL_RANGES.glucose.bedtime
    };
    return mappings[key] || NORMAL_RANGES.glucose.preMeal;
};

/**
 * Check if a glucose value is in the danger zone
 * @param {number} value - Glucose reading in mg/dL
 * @returns {object} Object with level ('normal', 'low', 'high', 'critical') and message
 */
export const checkGlucoseLevel = (value) => {
    const thresholds = DANGER_THRESHOLDS.glucose;

    if (value < thresholds.criticalLow) {
        return { level: 'critical', message: 'SEVERE HYPOGLYCEMIA - Seek immediate help' };
    }
    if (value < thresholds.low) {
        return { level: 'low', message: 'LOW SUGAR - Take glucose immediately' };
    }
    if (value >= thresholds.critical) {
        return { level: 'critical', message: 'DANGER - Check ketones, consider emergency' };
    }
    if (value >= thresholds.veryHigh) {
        return { level: 'high', message: 'VERY HIGH - Monitor closely' };
    }
    if (value >= thresholds.high) {
        return { level: 'warning', message: 'POOR CONTROL - Review management' };
    }
    return { level: 'normal', message: '' };
};

export default DEFAULT_MED_DATABASE;
