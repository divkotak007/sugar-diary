// --- FALLBACK MEDICAL DATABASE ---
export const DEFAULT_MED_DATABASE = {
    insulins: {
        rapid: ["Insulin Aspart (NovoRapid)", "Insulin Lispro (Humalog)", "Insulin Glulisine (Apidra)", "Fiasp"],
        short: ["Regular Human Insulin (Actrapid)", "Humulin R"],
        intermediate: ["NPH (Insulatard)", "Humulin N"],
        basal: ["Glargine U-100 (Lantus)", "Glargine U-300 (Toujeo)", "Detemir (Levemir)", "Degludec (Tresiba)", "Basalog"],
        premix: ["Mixtard 30/70", "NovoMix 30", "Humalog Mix 25", "Humalog Mix 50", "Ryzodeg"]
    },
    oralMeds: {
        biguanides: ["Metformin 500mg", "Metformin 850mg", "Metformin 1000mg ER"],
        sulfonylureas: ["Glimepiride 1mg", "Glimepiride 2mg", "Gliclazide 80mg", "Gliclazide MR 60mg"],
        dpp4: ["Sitagliptin 100mg", "Vildagliptin 50mg", "Teneligliptin 20mg", "Linagliptin 5mg"],
        sglt2: ["Dapagliflozin 10mg", "Empagliflozin 25mg", "Canagliflozin 100mg", "Remogliflozin 100mg"],
        tzd: ["Pioglitazone 15mg", "Pioglitazone 30mg"],
        combinations: ["Glimepiride + Metformin", "Vildagliptin + Metformin", "Sitagliptin + Metformin", "Dapagliflozin + Metformin"],
        others: ["Voglibose 0.2mg", "Acarbose 25mg", "Rybelsus 3mg"]
    }
};
