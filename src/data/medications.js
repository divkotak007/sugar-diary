/**
 * Enhanced Medication Database
 * Contains comprehensive drug information with safety flags for patient alerts
 */

// --- ORAL MEDICATIONS WITH SAFETY FLAGS ---
export const ORAL_MEDS_DETAILED = [
    // ===== BIGUANIDE =====
    {
        name: "Metformin 500mg",
        brands: ["Glycomet", "Glucophage", "Cetapin", "Obimet"],
        class: ["Biguanide"],
        flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false }
    },
    {
        name: "Metformin ER 1000mg",
        brands: ["Glycomet SR", "Cetapin XR"],
        class: ["Biguanide"],
        flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false }
    },

    // ===== SULFONYLUREA =====
    {
        name: "Glimepiride 1mg",
        brands: ["Amaryl", "Zoryl", "Glypride"],
        class: ["SU"],
        flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true }
    },
    {
        name: "Gliclazide MR 60mg",
        brands: ["Diamicron MR", "Glyzide MR"],
        class: ["SU"],
        flags: { hypo: "moderate", weight: "gain", cv: false, ckd: false, hf: false, elderly: true }
    },

    // ===== DPP4 =====
    {
        name: "Sitagliptin 100mg",
        brands: ["Januvia", "Istavel", "Sitara"],
        class: ["DPP4"],
        flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false }
    },
    {
        name: "Teneligliptin 20mg",
        brands: ["Tenelia", "Tenglyn"],
        class: ["DPP4"],
        flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false }
    },

    // ===== SGLT2 =====
    {
        name: "Dapagliflozin 10mg",
        brands: ["Forxiga", "Daparyl"],
        class: ["SGLT2"],
        flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>25", hf: true, elderly: true }
    },
    {
        name: "Empagliflozin 25mg",
        brands: ["Jardiance 25"],
        class: ["SGLT2"],
        flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>30", hf: true, elderly: true }
    },

    // ===== TZD =====
    {
        name: "Pioglitazone 15mg",
        brands: ["Pioz", "Piomed"],
        class: ["TZD"],
        flags: { hypo: "low", weight: "gain", cv: false, ckd: true, hf: false, elderly: true }
    },

    // ===== ALPHA GLUCOSIDASE =====
    {
        name: "Voglibose 0.3mg",
        brands: ["Volibo", "Voglimac"],
        class: ["AGI"],
        flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false }
    },

    // ===== GLP1 ORAL =====
    {
        name: "Semaglutide oral 14mg",
        brands: ["Rybelsus 14"],
        class: ["GLP1"],
        flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>30", hf: true, elderly: false }
    },

    // ===== DUAL COMBINATIONS =====
    {
        name: "Glimepiride 1mg + Metformin 500mg",
        brands: ["Zoryl M1", "Glypride M1"],
        class: ["SU", "Biguanide"],
        flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true }
    },
    {
        name: "Sitagliptin 50mg + Metformin 500mg",
        brands: ["Janumet", "Istamet"],
        class: ["DPP4", "Biguanide"],
        flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false }
    },
    {
        name: "Dapagliflozin 10mg + Metformin 500mg",
        brands: ["Xigduo", "Daparyl M"],
        class: ["SGLT2", "Biguanide"],
        flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>25", hf: true, elderly: true }
    },

    // ===== TRIPLE COMBINATIONS =====
    {
        name: "Glimepiride 2mg + Metformin 500mg + Pioglitazone 15mg",
        brands: ["Zoryl PM2"],
        class: ["SU", "Biguanide", "TZD"],
        flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true }
    },
    {
        name: "Sitagliptin 50mg + Metformin 500mg + Dapagliflozin 10mg",
        brands: ["Istamet D"],
        class: ["DPP4", "Biguanide", "SGLT2"],
        flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>25", hf: true, elderly: true }
    }
];

// --- INSULIN DATABASE ---
export const INSULINS_DATABASE = {
    rapid: [
        { name: "Insulin Aspart (NovoRapid)", brands: ["NovoRapid", "Fiasp"], onset: "10-15 min", peak: "1-2 hr", duration: "3-5 hr" },
        { name: "Insulin Lispro (Humalog)", brands: ["Humalog"], onset: "10-15 min", peak: "1-2 hr", duration: "3-5 hr" },
        { name: "Insulin Glulisine (Apidra)", brands: ["Apidra"], onset: "10-15 min", peak: "1-2 hr", duration: "3-5 hr" }
    ],
    short: [
        { name: "Regular Human Insulin", brands: ["Actrapid", "Humulin R"], onset: "30-60 min", peak: "2-4 hr", duration: "5-8 hr" }
    ],
    intermediate: [
        { name: "NPH Insulin", brands: ["Insulatard", "Humulin N"], onset: "1-2 hr", peak: "4-8 hr", duration: "12-18 hr" }
    ],
    basal: [
        { name: "Insulin Glargine U100", brands: ["Lantus", "Basalog"], onset: "1-2 hr", peak: "None", duration: "24 hr" },
        { name: "Insulin Glargine U300", brands: ["Toujeo"], onset: "1-2 hr", peak: "None", duration: "36 hr" },
        { name: "Insulin Detemir", brands: ["Levemir"], onset: "1-2 hr", peak: "3-14 hr", duration: "18-24 hr" },
        { name: "Insulin Degludec", brands: ["Tresiba"], onset: "1-2 hr", peak: "None", duration: "42 hr" }
    ],
    premix: [
        { name: "Mixtard 30/70", brands: ["Mixtard 30"], ratio: "30% rapid / 70% NPH" },
        { name: "NovoMix 30", brands: ["NovoMix 30"], ratio: "30% aspart / 70% aspart protamine" },
        { name: "Humalog Mix 25", brands: ["Humalog Mix 25"], ratio: "25% lispro / 75% lispro protamine" },
        { name: "Ryzodeg", brands: ["Ryzodeg"], ratio: "70% degludec / 30% aspart" }
    ]
};

// --- LEGACY FORMAT FOR BACKWARD COMPATIBILITY ---
// --- DYNAMICALLY COMPILED DATABASE ---
export const DEFAULT_MED_DATABASE = {
    insulins: INSULINS_DATABASE, // Use the structured insulin DB
    oralMeds: {
        biguanides: ORAL_MEDS_DETAILED.filter(m => m.class.includes("Biguanide")).map(m => m.name),
        sulfonylureas: ORAL_MEDS_DETAILED.filter(m => m.class.includes("SU")).map(m => m.name),
        dpp4: ORAL_MEDS_DETAILED.filter(m => m.class.includes("DPP4")).map(m => m.name),
        sglt2: ORAL_MEDS_DETAILED.filter(m => m.class.includes("SGLT2")).map(m => m.name),
        tzd: ORAL_MEDS_DETAILED.filter(m => m.class.includes("TZD")).map(m => m.name),
        combinations: ORAL_MEDS_DETAILED.filter(m => m.class.length > 1).map(m => m.name),
        others: ORAL_MEDS_DETAILED.filter(m => m.class.includes("AGI") || m.class.includes("GLP1")).map(m => m.name)
    }
};

// --- SAFETY FLAG DESCRIPTIONS ---
export const SAFETY_FLAG_DESCRIPTIONS = {
    hypo: {
        low: "Low hypoglycemia risk",
        moderate: "Moderate hypoglycemia risk - monitor closely",
        high: "⚠️ HIGH HYPOGLYCEMIA RISK - caution in elderly/renal impairment"
    },
    weight: {
        loss: "May promote weight loss",
        neutral: "Weight neutral",
        gain: "⚠️ May cause weight gain"
    },
    cv: {
        true: "✓ Cardiovascular benefit demonstrated",
        false: "No proven CV benefit"
    },
    ckd: {
        true: "✓ Safe in CKD",
        false: "⚠️ AVOID or use caution in CKD",
        "eGFR>30": "Use if eGFR > 30 mL/min",
        "eGFR>25": "Use if eGFR > 25 mL/min"
    },
    hf: {
        true: "✓ Safe in heart failure",
        false: "⚠️ AVOID in heart failure"
    },
    elderly: {
        true: "⚠️ Use caution in elderly",
        false: "Generally safe in elderly"
    }
};

// --- CONTRAINDICATIONS ---
export const CONTRAINDICATIONS = {
    pregnancy: ["Pioglitazone", "Dapagliflozin", "Empagliflozin", "Canagliflozin", "Glimepiride", "Gliclazide", "Rybelsus", "Semaglutide"],
    heartFailure: ["Pioglitazone"],
    renalImpairment: ["Metformin", "Glimepiride", "Gliclazide"]
};

// --- FREQUENCY RULES ---
export const FREQUENCY_RULES = {
    "Once Daily": ["Morning"],
    "Twice Daily": ["Morning", "Evening"],
    "Thrice Daily": ["Morning", "Afternoon", "Evening"],
    "Bedtime": ["Bedtime"],
    "Before Meals": ["Breakfast", "Lunch", "Dinner"],
    "SOS": ["As Needed"]
};

export const INSULIN_FREQUENCIES = ["Bedtime", "Before Meals", "Twice Daily", "Once Daily", "SOS"];
export const ALL_TIMINGS = ["Morning", "Breakfast", "Lunch", "Afternoon", "Evening", "Dinner", "Bedtime", "As Needed"];

// --- NORMAL RANGES ---
export const NORMAL_RANGES = {
    glucose: { fasting: { min: 70, max: 100, unit: "mg/dL" }, postMeal: { min: 70, max: 140, unit: "mg/dL" } },
    hba1c: { target: 7.0, preDiabetes: 5.7, unit: "%" },
    weight: { minBMI: 18.5, maxBMI: 25, unit: "kg" },
    creatinine: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 }, unit: "mg/dL" }
};

// --- DANGER THRESHOLDS (for alerts) ---
export const DANGER_THRESHOLDS = {
    glucose: { criticalLow: 50, low: 70, high: 180, criticalHigh: 300, extremeHigh: 400 },
    hba1c: { high: 9.0, criticalHigh: 12.0 }
};

// --- TAG EMOJIS ---
export const TAG_EMOJIS = {
    "Sick": "🤒",
    "Sweets": "🍬",
    "Heavy Meal": "🍔",
    "Exercise": "🏃",
    "Missed Dose": "❌",
    "Travel": "✈️",
    "Fasting": "⏳"
};

// --- HELPER FUNCTIONS ---

/**
 * Check if a medication is contraindicated for a condition
 */
export const isContraindicated = (medName, condition) => {
    const list = CONTRAINDICATIONS[condition] || [];
    return list.some(ci => medName.toLowerCase().includes(ci.toLowerCase()));
};

/**
 * Get medication details by name
 */
export const getMedDetails = (medName) => {
    return ORAL_MEDS_DETAILED.find(med =>
        med.name.toLowerCase() === medName.toLowerCase() ||
        med.brands.some(b => medName.toLowerCase().includes(b.toLowerCase()))
    );
};

/**
 * Check medication alerts based on patient profile
 * Returns array of alert messages
 */
export const getMedicationAlerts = (medName, patientProfile) => {
    const med = getMedDetails(medName);
    if (!med) return [];

    const alerts = [];
    const { flags } = med;

    // Check hypoglycemia risk for elderly
    if (patientProfile.isElderly && flags.hypo === "high") {
        alerts.push({ type: "warning", message: `⚠️ ${med.name}: High hypoglycemia risk in elderly patients` });
    }

    // Check CKD contraindication
    if (patientProfile.hasRenalImpairment && flags.ckd === false) {
        alerts.push({ type: "danger", message: `🚫 ${med.name}: Avoid in renal impairment` });
    }
    if (patientProfile.hasRenalImpairment && typeof flags.ckd === "string") {
        alerts.push({ type: "warning", message: `⚠️ ${med.name}: ${flags.ckd}` });
    }

    // Check heart failure
    if (patientProfile.hasHeartFailure && flags.hf === false) {
        alerts.push({ type: "danger", message: `🚫 ${med.name}: Avoid in heart failure` });
    }

    // Check pregnancy
    if (patientProfile.isPregnant) {
        const contraindicated = isContraindicated(med.name, "pregnancy");
        if (contraindicated) {
            alerts.push({ type: "danger", message: `🚫 ${med.name}: Contraindicated in pregnancy` });
        }
    }

    // Weight concern
    if (patientProfile.hasObesity && flags.weight === "gain") {
        alerts.push({ type: "info", message: `ℹ️ ${med.name}: May cause weight gain` });
    }

    return alerts;
};

/**
 * Get all alerts for a prescription
 */
export const getPrescriptionAlerts = (prescription, patientProfile) => {
    const allAlerts = [];

    prescription.oralMeds?.forEach(med => {
        const alerts = getMedicationAlerts(med.name || med, patientProfile);
        allAlerts.push(...alerts);
    });

    return allAlerts;
};

/**
 * Get timings for a frequency
 */
export const getTimingsForFrequency = (frequency) => {
    return FREQUENCY_RULES[frequency] || [];
};

/**
 * Get glucose range based on meal status
 */
export const getGlucoseRange = (mealStatus) => {
    if (mealStatus === "Pre-Meal" || mealStatus === "Fasting") {
        return NORMAL_RANGES.glucose.fasting;
    }
    return NORMAL_RANGES.glucose.postMeal;
};

/**
 * Check glucose level and return status
 */
export const checkGlucoseLevel = (value, mealStatus) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return { status: "unknown", message: "" };

    const thresholds = DANGER_THRESHOLDS.glucose;

    if (numValue < thresholds.criticalLow) {
        return { status: "critical-low", message: "⚠️ CRITICAL LOW - Treat immediately!", color: "red" };
    }
    if (numValue < thresholds.low) {
        return { status: "low", message: "Low blood sugar - Consider glucose", color: "amber" };
    }
    if (numValue > thresholds.extremeHigh) {
        return { status: "extreme-high", message: "⚠️ VERY HIGH - Check ketones, seek care", color: "red" };
    }
    if (numValue > thresholds.criticalHigh) {
        return { status: "critical-high", message: "⚠️ HIGH - Monitor closely", color: "orange" };
    }
    if (numValue > thresholds.high) {
        return { status: "high", message: "Above target", color: "amber" };
    }
    return { status: "normal", message: "Within target range", color: "green" };
};

export default {
    ORAL_MEDS_DETAILED,
    INSULINS_DATABASE,
    DEFAULT_MED_DATABASE,
    SAFETY_FLAG_DESCRIPTIONS,
    CONTRAINDICATIONS,
    FREQUENCY_RULES,
    INSULIN_FREQUENCIES,
    ALL_TIMINGS,
    NORMAL_RANGES,
    DANGER_THRESHOLDS,
    TAG_EMOJIS,
    isContraindicated,
    getMedDetails,
    getMedicationAlerts,
    getPrescriptionAlerts,
    getTimingsForFrequency,
    getGlucoseRange,
    checkGlucoseLevel
};
