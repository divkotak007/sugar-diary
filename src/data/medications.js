/**
 * Enhanced Medication Database (v5.1 - Dose Optimized & Exhaustive)
 * Includes explicit Strength Variants and Combinations for India
 */

export const MEDICATION_DATABASE = [
    // ============================
    // BIGUANIDES (Metformin)
    // ============================
    {
        name: "Metformin 500mg", route: "oral", type: "mono", class: ["Biguanide"],
        brands: ["Glycomet 500", "Cetapin 500", "Obimet 500", "Bigomet 500"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "specialist_only" }
    },
    {
        name: "Metformin 850mg", route: "oral", type: "mono", class: ["Biguanide"],
        brands: ["Glycomet 850", "Cetapin 850", "Obimet 850"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "specialist_only" }
    },
    {
        name: "Metformin 1000mg (1g)", route: "oral", type: "mono", class: ["Biguanide"],
        brands: ["Glycomet 1g", "Cetapin 1g", "Obimet 1g"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "specialist_only" }
    },
    {
        name: "Metformin 500mg SR (Sustained Release)", route: "oral", type: "mono", class: ["Biguanide"],
        brands: ["Glycomet SR 500", "Cetapin XR 500"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "specialist_only" }
    },
    {
        name: "Metformin 1000mg SR (Sustained Release)", route: "oral", type: "mono", class: ["Biguanide"],
        brands: ["Glycomet SR 1g", "Cetapin XR 1g"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "specialist_only" }
    },

    // ============================
    // SULFONYLUREAS (Glimepiride, Gliclazide)
    // ============================
    {
        name: "Glimepiride 0.5mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Amaryl 0.5", "Zoryl 0.5"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Glimepiride 1mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Amaryl 1", "Zoryl 1", "Glimestar 1"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Glimepiride 2mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Amaryl 2", "Zoryl 2", "Glimestar 2"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Glimepiride 3mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Amaryl 3", "Zoryl 3", "Glimestar 3"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Glimepiride 4mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Amaryl 4", "Zoryl 4", "Glimestar 4"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Gliclazide 40mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Glizid 40", "Diamicron 40"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Gliclazide 80mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Glizid 80", "Diamicron 80"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Gliclazide MR 30mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Diamicron MR 30", "Reclide MR 30"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Gliclazide MR 60mg", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Diamicron MR 60", "Reclide MR 60"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ============================
    // DPP4 INHIBITORS (Gliptins)
    // ============================
    {
        name: "Sitagliptin 25mg", route: "oral", type: "mono", class: ["DPP4 Inhibitor"], brands: ["Januvia 25"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "dose_reduce", dialysis: "dose_reduce" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Sitagliptin 50mg", route: "oral", type: "mono", class: ["DPP4 Inhibitor"], brands: ["Januvia 50"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "dose_reduce", dialysis: "dose_reduce" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Sitagliptin 100mg", route: "oral", type: "mono", class: ["DPP4 Inhibitor"], brands: ["Januvia 100"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "dose_reduce", dialysis: "dose_reduce" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Vildagliptin 50mg", route: "oral", type: "mono", class: ["DPP4 Inhibitor"], brands: ["Galvus 50", "Zomelis 50"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "dose_reduce", dialysis: "dose_reduce" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Teneligliptin 20mg", route: "oral", type: "mono", class: ["DPP4 Inhibitor"], brands: ["Tenet 20", "Zita Plus"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Linagliptin 5mg", route: "oral", type: "mono", class: ["DPP4 Inhibitor"], brands: ["Trajenta 5"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ============================
    // SGLT2 INHIBITORS (Flozins)
    // ============================
    {
        name: "Dapagliflozin 5mg", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"], brands: ["Forxiga 5"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Dapagliflozin 10mg", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"], brands: ["Forxiga 10"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Empagliflozin 10mg", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"], brands: ["Jardiance 10"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Empagliflozin 25mg", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"], brands: ["Jardiance 25"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Canagliflozin 100mg", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"], brands: ["Invokana 100"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Canagliflozin 300mg", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"], brands: ["Invokana 300"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ============================
    // DUAL COMBINATIONS (Common India)
    // ============================
    {
        name: "Metformin 500mg + Glimepiride 1mg", route: "oral", type: "dual", class: ["Biguanide + SU"],
        brands: ["Glycomet-GP 1", "Zoryl-M 1", "Glimestar M1"],
        flags: { hypo: "high", weight: "gain", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Metformin 500mg + Glimepiride 2mg", route: "oral", type: "dual", class: ["Biguanide + SU"],
        brands: ["Glycomet-GP 2", "Zoryl-M 2", "Glimestar M2"],
        flags: { hypo: "high", weight: "gain", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Metformin 1000mg + Glimepiride 2mg", route: "oral", type: "dual", class: ["Biguanide + SU"],
        brands: ["Glycomet-GP 2 Forte", "Zoryl-M 2 Forte"],
        flags: { hypo: "high", weight: "gain", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Metformin 500mg + Vildagliptin 50mg", route: "oral", type: "dual", class: ["Biguanide + DPP4"],
        brands: ["Galvus Met 50/500", "Zomelis Met 50/500"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin 1000mg + Vildagliptin 50mg", route: "oral", type: "dual", class: ["Biguanide + DPP4"],
        brands: ["Galvus Met 50/1000", "Zomelis Met 50/1000"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin 500mg + Sitagliptin 50mg", route: "oral", type: "dual", class: ["Biguanide + DPP4"],
        brands: ["Janumet 50/500"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin 1000mg + Sitagliptin 50mg", route: "oral", type: "dual", class: ["Biguanide + DPP4"],
        brands: ["Janumet 50/1000"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin 500mg + Dapagliflozin 10mg", route: "oral", type: "dual", class: ["Biguanide + SGLT2"],
        brands: ["Xigduo 10/500", "Oxra-M 10/500"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin 1000mg + Dapagliflozin 10mg", route: "oral", type: "dual", class: ["Biguanide + SGLT2"],
        brands: ["Xigduo 10/1000", "Oxra-M 10/1000"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ============================
    // INSULINS (Specific Types)
    // ============================
    {
        name: "Regular Soluble Insulin", route: "insulin", type: "short", class: ["Human Short-Acting"],
        brands: ["Actrapid", "Huminsulin R", "Insugen R", "Wosulin R"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    {
        name: "NPH (Intermediate) Insulin", route: "insulin", type: "intermediate", class: ["Human Intermediate"],
        brands: ["Insulatard", "Huminsulin N", "Insugen N"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    {
        name: "Insulin Lispro (Rapid)", route: "insulin", type: "rapid", class: ["Analog Rapid"],
        brands: ["Humalog", "Liprolog"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Aspart (Rapid)", route: "insulin", type: "rapid", class: ["Analog Rapid"],
        brands: ["NovoRapid", "Fiasp"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Glargine U-100", route: "insulin", type: "basal", class: ["Analog Basal"],
        brands: ["Lantus", "Basalog", "Glaritus"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Glargine U-300", route: "insulin", type: "basal", class: ["Analog Basal"],
        brands: ["Toujeo"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Degludec U-100", route: "insulin", type: "basal", class: ["Ultra Long-Acting"],
        brands: ["Tresiba"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Premix Human 30/70", route: "insulin", type: "premix", class: ["Premix Human"],
        brands: ["Mixtard 30", "Huminsulin 30/70", "Insugen 30/70"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    {
        name: "Premix Human 50/50", route: "insulin", type: "premix", class: ["Premix Human"],
        brands: ["Huminsulin 50/50"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    {
        name: "Premix Analog 30/70 (Aspart)", route: "insulin", type: "premix", class: ["Premix Analog"],
        brands: ["NovoMix 30"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Premix Analog 25/75 (Lispro)", route: "insulin", type: "premix", class: ["Premix Analog"],
        brands: ["Humalog Mix 25"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Premix Analog 50/50 (Lispro)", route: "insulin", type: "premix", class: ["Premix Analog"],
        brands: ["Humalog Mix 50"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    }
];

export const FREQUENCY_RULES = {
    "Once Daily": ["Morning"],
    "Twice Daily": ["Morning", "Evening"],
    "Thrice Daily": ["Morning", "Afternoon", "Evening"],
    "Bedtime": ["Bedtime"],
    "Before Meals": ["Breakfast", "Lunch", "Dinner"],
    "SOS": ["As Needed"]
};

export const FREQUENCY_ORDER = ["Morning", "Afternoon", "Evening", "Night"];


export const NORMAL_RANGES = {
    glucose: { fasting: { min: 70, max: 100, unit: "mg/dL" }, postMeal: { min: 70, max: 140, unit: "mg/dL" } },
    hba1c: { target: 7.0, preDiabetes: 5.7, unit: "%" },
    weight: { minBMI: 18.5, maxBMI: 25, unit: "kg" },
    creatinine: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 }, unit: "mg/dL" }
};

export const DANGER_THRESHOLDS = {
    glucose: { low: 70, high: 250, criticalHigh: 400 },
    hba1c: { high: 8.0, critical: 10.0 },
    creatinine: { high: 1.4, critical: 2.5 }
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

    if (prescription.oralMeds) medsToCheck.push(...prescription.oralMeds);
    if (prescription.insulins) medsToCheck.push(...prescription.insulins);

    medsToCheck.forEach(item => {
        // Handle cases where item name might include dosage e.g. "Metformin 500mg" but we just want to match flags
        const med = getMedDetails(item.name);
        if (!med) return;

        const { flags } = med;
        const { isElderly, hasRenalImpairment, hasHeartFailure, isPregnant } = patientProfile;

        if (isElderly) {
            if (flags.elderly === 'avoid')
                allAlerts.push({ type: "danger", message: `⛔ ${item.name}: Avoid in Elderly` });
            else if (flags.elderly === 'caution')
                allAlerts.push({ type: "warning", message: `⚠️ ${item.name}: Caution in Elderly` });
        }

        if (hasRenalImpairment) {
            const ckdFlag = flags.ckd;
            if (typeof ckdFlag === 'object') {
                if (ckdFlag.eGFR_30 === 'avoid') allAlerts.push({ type: "danger", message: `⛔ ${item.name}: Contraindicated (GFR<30)` });
                else if (ckdFlag.eGFR_30 === 'dose_reduce') allAlerts.push({ type: "warning", message: `⚠️ ${item.name}: Dose Reduction (GFR<30)` });
            } else if (ckdFlag === 'avoid' || ckdFlag === false) {
                allAlerts.push({ type: "danger", message: `⛔ ${item.name}: Avoid in CKD` });
            }
        }

        if (hasHeartFailure && (flags.hf === 'avoid' || flags.hf === false)) {
            allAlerts.push({ type: "danger", message: `⛔ ${item.name}: Avoid in Heart Failure` });
        }

        if (isPregnant) {
            if (flags.pregnancy === 'avoid') allAlerts.push({ type: "danger", message: `⛔ ${item.name}: UNSAFE in Pregnancy` });
            else if (flags.pregnancy === 'specialist_only') allAlerts.push({ type: "warning", message: `⚠️ ${item.name}: Specialist Only (Pregnancy)` });
        }
    });

    return allAlerts;
};
