/**
 * Enhanced Medication Database - Phase 3
 * Flat list of all diabetes medications with detailed safety flags
 */

export const MEDICATION_DATABASE = [
    // ===== METFORMIN =====
    { name: "Metformin 250mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 250", "Cetapin 250"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 500", "Cetapin 500"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 850mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 850", "Cetapin 850"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 1000mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 1g", "Cetapin 1g"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== GLIMEPIRIDE =====
    { name: "Glimepiride 0.5mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 0.5", "Zoryl 0.5"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 1mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 1", "Zoryl 1"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 2mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 2", "Zoryl 2"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 4mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 4", "Zoryl 4"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== SITAGLIPTIN =====
    { name: "Sitagliptin 25mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Januvia 25", "Istavel 25"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Sitagliptin 50mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Januvia 50", "Istavel 50"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Sitagliptin 100mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Januvia 100", "Istavel 100"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== DUAL: SITAGLIPTIN + METFORMIN =====
    { name: "Sitagliptin 50mg + Metformin 500mg", route: "oral", type: "dual", class: ["DPP4", "Biguanide"], brands: ["Janumet 50/500", "Istamet 50/500"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Sitagliptin 50mg + Metformin 1000mg", route: "oral", type: "dual", class: ["DPP4", "Biguanide"], brands: ["Janumet 50/1000", "Istamet 50/1000"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== TRIPLE: SITAGLIPTIN + METFORMIN + DAPAGLIFLOZIN =====
    { name: "Sitagliptin 50mg + Metformin 500mg + Dapagliflozin 10mg", route: "oral", type: "triple", class: ["DPP4", "Biguanide", "SGLT2"], brands: ["Istamet D 50/500/10"], flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>25", hf: true, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== INSULIN ASPART =====
    { name: "Insulin Aspart U100", route: "injectable", type: "rapid", class: ["Prandial"], brands: ["NovoRapid", "Aspalog"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },

    // ===== INSULIN GLARGINE =====
    { name: "Insulin Glargine U100", route: "injectable", type: "basal", class: ["Basal"], brands: ["Lantus", "Basalog"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },

    // ===== PREMIX =====
    { name: "Premix 30/70", route: "injectable", type: "premix", class: ["Premixed"], brands: ["Huminsulin 30/70", "Insugen 30/70"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } }

];

export const FREQUENCY_RULES = {
    "Once Daily": ["Morning"],
    "Twice Daily": ["Morning", "Evening"],
    "Thrice Daily": ["Morning", "Afternoon", "Evening"],
    "Bedtime": ["Bedtime"],
    "Before Meals": ["Breakfast", "Lunch", "Dinner"],
    "SOS": ["As Needed"]
};

export const NORMAL_RANGES = {
    glucose: { fasting: { min: 70, max: 100, unit: "mg/dL" }, postMeal: { min: 70, max: 140, unit: "mg/dL" } },
    hba1c: { target: 7.0, preDiabetes: 5.7, unit: "%" },
    weight: { minBMI: 18.5, maxBMI: 25, unit: "kg" },
    creatinine: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 }, unit: "mg/dL" }
};

// --- HELPER FUNCTIONS ---

export const getMedDetails = (medName) => {
    return MEDICATION_DATABASE.find(med =>
        med.name.toLowerCase() === medName.toLowerCase() ||
        (med.brands || []).some(b => medName.toLowerCase().includes(b.toLowerCase()))
    );
};

export const getPrescriptionAlerts = (prescription, patientProfile) => {
    const allAlerts = [];
    const medsToCheck = [];

    // Check both oralMeds and insulins from prescription
    if (prescription.oralMeds) medsToCheck.push(...prescription.oralMeds);
    if (prescription.insulins) medsToCheck.push(...prescription.insulins);

    medsToCheck.forEach(item => {
        const medName = item.name;
        const med = getMedDetails(medName);
        if (!med) return;

        const { flags } = med;

        // Elderly
        if (patientProfile.isElderly && flags.elderly) {
            allAlerts.push({ type: "warning", message: `⚠️ ${medName}: Caution in elderly (High Risk)` });
        }

        // CKD
        if (patientProfile.hasRenalImpairment) {
            if (flags.ckd === false) allAlerts.push({ type: "danger", message: `🚫 ${medName}: Avoid in Kidney Disease` });
            else if (typeof flags.ckd === "string") allAlerts.push({ type: "warning", message: `⚠️ ${medName}: ${flags.ckd} (Check GFR)` });
        }

        // Heart Failure
        if (patientProfile.hasHeartFailure && !flags.hf) {
            allAlerts.push({ type: "danger", message: `🚫 ${medName}: Avoid in Heart Failure` });
        }

        // Pregnancy
        if (patientProfile.isPregnant) {
            if (flags.pregnancy === "avoid") allAlerts.push({ type: "danger", message: `🚫 ${medName}: Avoid in Pregnancy` });
            else if (flags.pregnancy === "caution") allAlerts.push({ type: "warning", message: `⚠️ ${medName}: Use caution in Pregnancy` });
        }

        // Liver
        // No explicitly defined liver profile flag in App.jsx yet, but we can hook it up if needed. 
        // For now ignoring unless profile hasLiverImpairment is added.
    });

    return allAlerts;
};


export const FREQUENCY_RULES = {
  'Once Daily': ['Morning'],
  'Twice Daily': ['Morning', 'Evening'],
  'Thrice Daily': ['Morning', 'Afternoon', 'Evening'],
  'Bedtime': ['Bedtime'],
  'Before Meals': ['Breakfast', 'Lunch', 'Dinner'],
  'SOS': ['As Needed']
};
