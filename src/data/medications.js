/**
 * Enhanced Medication Database - Phase 5 (Comprehensive India Dataset)
 * Flat list of all diabetes medications with detailed safety flags
 */

export const MEDICATION_DATABASE = [
    // ===== METFORMIN =====
    { name: "Metformin 250mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 250", "Cetapin 250", "Obimet"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 500", "Cetapin 500", "Obimet"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 850mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 850", "Cetapin 850", "Obimet"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 1000mg", route: "oral", type: "mono", class: ["Biguanide"], brands: ["Glycomet 1g", "Cetapin 1g", "Obimet"], flags: { hypo: "low", weight: "neutral", cv: true, ckd: "eGFR>30", hf: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== GLIMEPIRIDE =====
    { name: "Glimepiride 0.5mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 0.5", "Zoryl 0.5", "Glimestar"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 1mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 1", "Zoryl 1", "Glimisave"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 2mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 2", "Zoryl 2", "Glimipack"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 3mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 3", "Zoryl 3"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Glimepiride 4mg", route: "oral", type: "mono", class: ["SU"], brands: ["Amaryl 4", "Zoryl 4"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== GLICLAZIDE =====
    { name: "Gliclazide 40mg", route: "oral", type: "mono", class: ["SU"], brands: ["Glizid 40", "Diamicron"], flags: { hypo: "moderate", weight: "gain", cv: false, ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Gliclazide 80mg", route: "oral", type: "mono", class: ["SU"], brands: ["Glizid 80", "Diamicron"], flags: { hypo: "moderate", weight: "gain", cv: false, ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Gliclazide MR 30mg", route: "oral", type: "mono", class: ["SU"], brands: ["Diamicron MR 30", "Reclide MR"], flags: { hypo: "moderate", weight: "gain", cv: false, ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Gliclazide MR 60mg", route: "oral", type: "mono", class: ["SU"], brands: ["Diamicron MR 60", "Glycinorm MR"], flags: { hypo: "moderate", weight: "gain", cv: false, ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== PIOGLITAZONE =====
    { name: "Pioglitazone 7.5mg", route: "oral", type: "mono", class: ["TZD"], brands: ["Pioz 7.5", "Zactos", "Piotag"], flags: { hypo: "low", weight: "gain", cv: "neutral", ckd: true, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Pioglitazone 15mg", route: "oral", type: "mono", class: ["TZD"], brands: ["Pioz 15", "Zactos", "Pioglit"], flags: { hypo: "low", weight: "gain", cv: "neutral", ckd: true, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Pioglitazone 30mg", route: "oral", type: "mono", class: ["TZD"], brands: ["Pioz 30", "Zactos"], flags: { hypo: "low", weight: "gain", cv: "neutral", ckd: true, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== SITAGLIPTIN =====
    { name: "Sitagliptin 25mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Januvia 25", "Istavel 25"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Sitagliptin 50mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Januvia 50", "Istavel 50"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Sitagliptin 100mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Januvia 100", "Istavel 100"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== OTHERS DPP4 =====
    { name: "Teneligliptin 20mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Tenet 20", "Tenglyn", "Zita Plus"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Vildagliptin 50mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Galvus 50", "Zomelis", "Vildamac"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Linagliptin 5mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Trajenta 5", "Ondero"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Alogliptin 12.5mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Vipidia"], flags: { hypo: "low", weight: "neutral", cv: "neutral", hf: true, ckd: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Alogliptin 25mg", route: "oral", type: "mono", class: ["DPP4"], brands: ["Vipidia"], flags: { hypo: "low", weight: "neutral", cv: "neutral", hf: true, ckd: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== SGLT2 =====
    { name: "Dapagliflozin 5mg", route: "oral", type: "mono", class: ["SGLT2"], brands: ["Forxiga 5", "Oxra"], flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>25", hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Dapagliflozin 10mg", route: "oral", type: "mono", class: ["SGLT2"], brands: ["Forxiga 10", "Daparyl"], flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>25", hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Empagliflozin 10mg", route: "oral", type: "mono", class: ["SGLT2"], brands: ["Jardiance 10", "Empaone"], flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>20", hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Empagliflozin 25mg", route: "oral", type: "mono", class: ["SGLT2"], brands: ["Jardiance 25"], flags: { hypo: "low", weight: "loss", cv: true, ckd: "eGFR>20", hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Canagliflozin 100mg", route: "oral", type: "mono", class: ["SGLT2"], brands: ["Invokana 100", "Canaglu"], flags: { hypo: "low", weight: "loss", cv: true, ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Canagliflozin 300mg", route: "oral", type: "mono", class: ["SGLT2"], brands: ["Invokana 300"], flags: { hypo: "low", weight: "loss", cv: true, ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== ALPHA GLUCOSIDASE INHIBITORS =====
    { name: "Voglibose 0.2mg", route: "oral", type: "mono", class: ["AGI"], brands: ["Basen", "Voglibite"], flags: { hypo: "low", weight: "neutral", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Voglibose 0.3mg", route: "oral", type: "mono", class: ["AGI"], brands: ["Basen", "Volibo"], flags: { hypo: "low", weight: "neutral", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Acarbose 25mg", route: "oral", type: "mono", class: ["AGI"], brands: ["Glucobay", "Acarbec"], flags: { hypo: "low", weight: "neutral", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Acarbose 50mg", route: "oral", type: "mono", class: ["AGI"], brands: ["Glucobay"], flags: { hypo: "low", weight: "neutral", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== MEGLITINIDES =====
    { name: "Repaglinide 0.5mg", route: "oral", type: "mono", class: ["Meglitinide"], brands: ["Prandin", "Eurepa"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Repaglinide 1mg", route: "oral", type: "mono", class: ["Meglitinide"], brands: ["Prandin", "Regan"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Repaglinide 2mg", route: "oral", type: "mono", class: ["Meglitinide"], brands: ["Prandin"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: "caution", hf: false, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== COMBINATIONS =====
    { name: "Metformin 500mg + Glimepiride 1mg", route: "oral", type: "dual", class: ["Biguanide", "SU"], brands: ["Glycomet-GP 1", "Zoryl-M 1", "Glimestar M1"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg + Glimepiride 2mg", route: "oral", type: "dual", class: ["Biguanide", "SU"], brands: ["Glycomet-GP 2", "Zoryl-M 2", "Glimestar M2"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg + Pioglitazone 15mg", route: "oral", type: "dual", class: ["Biguanide", "TZD"], brands: ["Pioz MF 15", "Pioglit MF"], flags: { hypo: "low", weight: "gain", cv: "neutral", ckd: true, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg + Voglibose 0.2mg", route: "oral", type: "dual", class: ["Biguanide", "AGI"], brands: ["Voglimet 0.2", "Volibo M"], flags: { hypo: "low", weight: "neutral", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg + Voglibose 0.3mg", route: "oral", type: "dual", class: ["Biguanide", "AGI"], brands: ["Prandial M 0.3"], flags: { hypo: "low", weight: "neutral", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500mg + Gliclazide 80mg", route: "oral", type: "dual", class: ["Biguanide", "SU"], brands: ["Glizid M", "Reclide M"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Sitagliptin 50mg + Metformin 500mg", route: "oral", type: "dual", class: ["DPP4", "Biguanide"], brands: ["Janumet 50/500", "Istamet 50/500"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Teneligliptin 20mg + Metformin 500mg", route: "oral", type: "dual", class: ["DPP4", "Biguanide"], brands: ["Tenet M", "Tenglyn M"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Vildagliptin 50mg + Metformin 500mg", route: "oral", type: "dual", class: ["DPP4", "Biguanide"], brands: ["Galvus Met", "Zomelis Met"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },
    { name: "Vildagliptin 50mg + Metformin 1000mg", route: "oral", type: "dual", class: ["DPP4", "Biguanide"], brands: ["Galvus Met 1000"], flags: { hypo: "low", weight: "neutral", cv: false, ckd: true, hf: true, elderly: false, liver: true, pregnancy: "avoid" } },

    // ===== TRIPLE COMBINATIONS =====
    { name: "Metformin 500 + Glimepiride 1 + Voglibose 0.2", route: "oral", type: "triple", class: ["Biguanide", "SU", "AGI"], brands: ["Glycomet Trio 1"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },
    { name: "Metformin 500 + Glimepiride 2 + Voglibose 0.2", route: "oral", type: "triple", class: ["Biguanide", "SU", "AGI"], brands: ["Glycomet Trio 2", "Volix Trio"], flags: { hypo: "high", weight: "gain", cv: false, ckd: false, hf: false, elderly: true, liver: true, pregnancy: "avoid" } },

    // ===== INSULINS =====
    { name: "Insulin Aspart (NovoRapid)", route: "insulin", type: "rapid", class: ["Prandial"], brands: ["NovoRapid", "Aspalog"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Fiasp", route: "insulin", type: "rapid", class: ["Prandial"], brands: ["Fiasp"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Lispro (Humalog)", route: "insulin", type: "rapid", class: ["Prandial"], brands: ["Humalog", "Liprolog"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Glulisine (Apidra)", route: "insulin", type: "rapid", class: ["Prandial"], brands: ["Apidra"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Regular Insulin (Actrapid)", route: "insulin", type: "short", class: ["Prandial"], brands: ["Actrapid", "Huminsulin R", "Insugen R", "Wosulin R"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "NPH Insulin (Insulatard)", route: "insulin", type: "intermediate", class: ["Basal"], brands: ["Insulatard", "Huminsulin N", "Insugen N"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Glargine (Lantus)", route: "insulin", type: "basal", class: ["Basal"], brands: ["Lantus", "Basalog", "Glaritus", "Basugine"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Glargine (Toujeo U-300)", route: "insulin", type: "basal", class: ["Basal"], brands: ["Toujeo"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Detemir (Levemir)", route: "insulin", type: "basal", class: ["Basal"], brands: ["Levemir"], flags: { hypo: "moderate", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Insulin Degludec (Tresiba)", route: "insulin", type: "basal", class: ["Basal"], brands: ["Tresiba"], flags: { hypo: "low", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Premix 30/70 (Mixtard)", route: "insulin", type: "premix", class: ["Premixed"], brands: ["Mixtard 30", "Huminsulin 30/70", "Insugen 30/70", "Wosulin 30/70"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "NovoMix 30", route: "insulin", type: "premix", class: ["Premixed"], brands: ["NovoMix 30"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Humalog Mix 25", route: "insulin", type: "premix", class: ["Premixed"], brands: ["Humalog Mix 25", "Eglucent Mix 25"], flags: { hypo: "high", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
    { name: "Ryzodeg (Degludec/Aspart)", route: "insulin", type: "premix", class: ["Premixed"], brands: ["Ryzodeg"], flags: { hypo: "low", weight: "gain", cv: "neutral", ckd: true, hf: true, elderly: true, liver: true, pregnancy: "safe" } },
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

        if (patientProfile.isElderly && flags.elderly === 'caution') {
            allAlerts.push({ type: "warning", message: `⚠️ ${medName}: Caution in elderly` });
        }

        if (patientProfile.hasRenalImpairment) {
            if (flags.ckd === false) allAlerts.push({ type: "danger", message: `🚫 ${medName}: Avoid in Kidney Disease` });
            else if (typeof flags.ckd === "string") allAlerts.push({ type: "warning", message: `⚠️ ${medName}: ${flags.ckd} (Check GFR)` });
        }

        if (patientProfile.hasHeartFailure && flags.hf === false) {
            allAlerts.push({ type: "danger", message: `🚫 ${medName}: Avoid in Heart Failure` });
        }

        if (patientProfile.isPregnant && flags.pregnancy === "avoid") {
            allAlerts.push({ type: "danger", message: `🚫 ${medName}: Avoid in Pregnancy` });
        }
    });

    return allAlerts;
};
