/**
 * Enhanced Medication Database - Phase 5 (Comprehensive India Dataset)
 * Source: medicine data.json (v4.0)
 */

export const MEDICATION_DATABASE = [
    // ==================================================================================
    // INSULINS
    // ==================================================================================

    // Human Short Acting
    {
        name: "Regular Soluble Insulin", route: "insulin", type: "short", class: ["Human Short-Acting"],
        brands: ["Actrapid", "Huminsulin R", "Insugen R", "Wosulin R", "Lupisulin R"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    // Human Intermediate
    {
        name: "Isophane Insulin (NPH)", route: "insulin", type: "intermediate", class: ["Human Intermediate"],
        brands: ["Insulatard", "Huminsulin N", "Insugen N", "Wosulin N", "Lupisulin N"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    // Analog Rapid
    {
        name: "Insulin Aspart", route: "insulin", type: "rapid", class: ["Analog Rapid"],
        brands: ["NovoRapid", "Fiasp", "I-Aspart"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Lispro", route: "insulin", type: "rapid", class: ["Analog Rapid"],
        brands: ["Humalog", "Eglucent", "Liprolog"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Glulisine", route: "insulin", type: "rapid", class: ["Analog Rapid"],
        brands: ["Apidra"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    // Analog Basal
    {
        name: "Insulin Glargine (U-100 / U-300)", route: "insulin", type: "basal", class: ["Analog Basal"],
        brands: ["Lantus", "Basalog", "Glaritus", "Basugine", "Toujeo"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Insulin Detemir", route: "insulin", type: "basal", class: ["Analog Basal"],
        brands: ["Levemir"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    // Ultra Long
    {
        name: "Insulin Degludec", route: "insulin", type: "basal", class: ["Ultra Long-Acting"],
        brands: ["Tresiba"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    // Premix Human
    {
        name: "Biphasic Isophane Insulin (30/70)", route: "insulin", type: "premix", class: ["Premix Human"],
        brands: ["Mixtard 30", "Huminsulin 30/70", "Insugen 30/70", "Wosulin 30/70"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    {
        name: "Biphasic Isophane Insulin (50/50)", route: "insulin", type: "premix", class: ["Premix Human"],
        brands: ["Huminsulin 50/50"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "allowed" }, elderly: "caution", pregnancy: "safe" }
    },
    // Premix Analog
    {
        name: "Biphasic Aspart (30/70)", route: "insulin", type: "premix", class: ["Premix Analog"],
        brands: ["NovoMix 30"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    {
        name: "Biphasic Lispro (25/75, 50/50)", route: "insulin", type: "premix", class: ["Premix Analog"],
        brands: ["Humalog Mix 25", "Humalog Mix 50", "Eglucent Mix"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },
    // Co-formulations
    {
        name: "Insulin Degludec + Aspart", route: "insulin", type: "premix", class: ["Co-formulation"],
        brands: ["Ryzodeg"],
        flags: { hypo: "low", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "safe" }
    },

    // ==================================================================================
    // ORAL AGENTS
    // ==================================================================================

    // Biguanides
    {
        name: "Metformin", route: "oral", type: "mono", class: ["Biguanide"],
        brands: ["Glycomet", "Cetapin", "Obimet", "Bigomet", "Riomet"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "specialist_only" }
    },
    // Sulfonylureas
    {
        name: "Glimepiride", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Amaryl", "Zoryl", "Glimestar", "Jubiglim (Plain)", "Euglim"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Gliclazide MR", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Diamicron MR", "Reclide MR", "Glizid MR", "Cyblex", "Glycinorm"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Glibenclamide", route: "oral", type: "mono", class: ["Sulfonylurea"],
        brands: ["Daonil", "Euglucon"],
        flags: { hypo: "high", weight: "gain", hf: "neutral", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "avoid", pregnancy: "specialist_only" }
    },
    // Meglitinides
    {
        name: "Repaglinide", route: "oral", type: "mono", class: ["Meglitinide"],
        brands: ["Prandin", "Eurepa"],
        flags: { hypo: "moderate", weight: "gain", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "caution", pregnancy: "avoid" }
    },
    // TZDs
    {
        name: "Pioglitazone", route: "oral", type: "mono", class: ["Thiazolidinedione"],
        brands: ["Pioz", "Zactos", "Pioglit"],
        flags: { hypo: "low", weight: "gain", hf: "avoid", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Lobeglitazone", route: "oral", type: "mono", class: ["Thiazolidinedione"],
        brands: ["LOBG", "Lobe"],
        flags: { hypo: "low", weight: "gain", hf: "avoid", ckd: { eGFR_30: "caution", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    // DPP4 Inhibitors
    {
        name: "Sitagliptin / Vildagliptin", route: "oral", type: "mono", class: ["DPP4 Inhibitor"],
        brands: ["Januvia", "Galvus", "Zomelis", "Jalra"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "dose_reduce", dialysis: "dose_reduce" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Teneligliptin", route: "oral", type: "mono", class: ["DPP4 Inhibitor"],
        brands: ["Tenet", "Tenglyn", "Zita Plus"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Linagliptin", route: "oral", type: "mono", class: ["DPP4 Inhibitor"],
        brands: ["Trajenta"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },
    // SGLT2 Inhibitors
    {
        name: "Dapagliflozin / Empagliflozin", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"],
        brands: ["Forxiga", "Jardiance", "Invokana", "Oxra", "Gibtulio"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Remogliflozin", route: "oral", type: "mono", class: ["SGLT2 Inhibitor"],
        brands: ["Remoglif", "Remo"],
        flags: { hypo: "low", weight: "loss", hf: "neutral", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    // AGIs
    {
        name: "Voglibose / Acarbose", route: "oral", type: "mono", class: ["Alpha-Glucosidase Inhibitor"],
        brands: ["Basen", "Glucobay", "Volibo"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    // Glimins
    {
        name: "Imeglimin", route: "oral", type: "mono", class: ["Glimin"],
        brands: ["Imeglim", "Glimy", "Zimeg", "Gemimy"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "dose_reduce", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    // Glitazars
    {
        name: "Saroglitazar", route: "oral", type: "mono", class: ["Glitazar"],
        brands: ["Lipaglyn", "Bilypsa"],
        flags: { hypo: "low", weight: "neutral", hf: "neutral", ckd: { eGFR_30: "allowed", dialysis: "allowed" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ==================================================================================
    // INJECTABLES (NON-INSULIN)
    // ==================================================================================
    {
        name: "Liraglutide / Semaglutide (GLP-1)", route: "injection", type: "mono", class: ["GLP-1 RA"],
        brands: ["Victoza", "Rybelsus", "Trulicity", "Lirafit"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "allowed", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ==================================================================================
    // DUAL COMBINATIONS
    // ==================================================================================
    {
        name: "Metformin + Glimepiride", route: "oral", type: "dual", class: ["Biguanide + SU"],
        brands: ["Jubiglim M", "Glimestar M", "Zoryl M", "Glycomet-GP"],
        flags: { hypo: "high", weight: "gain", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "caution", pregnancy: "avoid" }
    },
    {
        name: "Metformin + Gliclazide", route: "oral", type: "dual", class: ["Biguanide + SU"],
        brands: ["Cyblex M", "Reclide M", "Diamicron XR Mex", "Glizid M"],
        flags: { hypo: "moderate", weight: "gain", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin + Gliptins (Vilda/Sita/Teneli)", route: "oral", type: "dual", class: ["Biguanide + DPP4"],
        brands: ["Jubiglim V", "Galvus Met", "Janumet", "Teneza-M", "Zita-Met Plus"],
        flags: { hypo: "low", weight: "neutral", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },
    {
        name: "Metformin + SGLT2 (Dapa/Empa)", route: "oral", type: "dual", class: ["Biguanide + SGLT2"],
        brands: ["Xigduo", "Jardiance Met", "Oxra-M", "Gibtulio Met"],
        flags: { hypo: "low", weight: "loss", hf: "benefit", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "preferred", pregnancy: "avoid" }
    },

    // ==================================================================================
    // TRIPLE COMBINATIONS
    // ==================================================================================
    {
        name: "Metformin + Glimepiride + Voglibose (Triple)", route: "oral", type: "triple", class: ["Biguanide + SU + AGI"],
        brands: ["Jubiglim MV", "Glycomet Trio", "Volix Trio", "Gluconorm-VG"],
        flags: { hypo: "high", weight: "gain", hf: "safe", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "avoid", pregnancy: "avoid" }
    },
    {
        name: "Metformin + Glimepiride + Pioglitazone (Triple)", route: "oral", type: "triple", class: ["Biguanide + SU + TZD"],
        brands: ["Jubiglim Trio", "Tribet P", "Accuglim MP", "Zoryl MP"],
        flags: { hypo: "high", weight: "gain", hf: "avoid", ckd: { eGFR_30: "avoid", dialysis: "avoid" }, elderly: "avoid", pregnancy: "avoid" }
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
        const medName = item.name;
        const med = getMedDetails(medName);
        if (!med) return;

        const { flags } = med;
        const { isElderly, hasRenalImpairment, hasHeartFailure, isPregnant } = patientProfile;

        // 1. ELDERLY CHECK
        if (isElderly) {
            if (flags.elderly === 'avoid')
                allAlerts.push({ type: "danger", message: `⛔ ${medName}: Avoid in Elderly (High Risk)` });
            else if (flags.elderly === 'caution')
                allAlerts.push({ type: "warning", message: `⚠️ ${medName}: Use with caution in Elderly` });
        }

        // 2. RENAL CHECK (CKD)
        if (hasRenalImpairment) {
            // Check structured CKD flag
            const ckdFlag = flags.ckd;
            if (typeof ckdFlag === 'object') {
                if (ckdFlag.eGFR_30 === 'avoid') {
                    allAlerts.push({ type: "danger", message: `⛔ ${medName}: Contraindicated if GFR < 30` });
                } else if (ckdFlag.eGFR_30 === 'dose_reduce') {
                    allAlerts.push({ type: "warning", message: `⚠️ ${medName}: Dose reduction required if GFR < 30` });
                }
            } else if (ckdFlag === 'avoid' || ckdFlag === false) {
                allAlerts.push({ type: "danger", message: `⛔ ${medName}: Avoid in CKD` });
            }
        }

        // 3. HEART FAILURE
        if (hasHeartFailure) {
            if (flags.hf === 'avoid' || flags.hf === false) {
                allAlerts.push({ type: "danger", message: `⛔ ${medName}: Avoid in Heart Failure` });
            }
        }

        // 4. PREGNANCY
        if (isPregnant) {
            if (flags.pregnancy === 'avoid') {
                allAlerts.push({ type: "danger", message: `⛔ ${medName}: CONTRAINDICATED in Pregnancy` });
            } else if (flags.pregnancy === 'specialist_only') {
                allAlerts.push({ type: "warning", message: `⚠️ ${medName}: Specialist supervision required in Pregnancy` });
            }
        }
    });

    return allAlerts;
};
