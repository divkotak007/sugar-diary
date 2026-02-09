/**
 * Medicine Database Sync Service
 * Syncs medication data between main app and admin app
 */

import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { MEDICATION_DATABASE } from '../../../src/data/medications';

const db = getFirestore();

/**
 * Convert main app medication database to admin format
 */
export const convertToAdminFormat = () => {
    const medicines = [];
    const insulins = [];

    MEDICATION_DATABASE.forEach((med, index) => {
        const baseItem = {
            id: `med_${index}_${Date.now()}`,
            name: med.name,
            notes: `Brands: ${(med.brands || []).join(', ')}. Class: ${(med.class || []).join(', ')}`
        };

        if (med.route === 'insulin') {
            // It's an insulin
            insulins.push({
                ...baseItem,
                type: med.type || 'rapid', // rapid, short, intermediate, basal, premix
                brand: med.brands?.[0] || '',
                concentration: 'U-100', // Default, can be updated
                stock: 0,
                price: 0,
                expiryDate: '',
                notes: baseItem.notes + `. Flags: Hypo risk: ${med.flags?.hypo || 'N/A'}, Weight: ${med.flags?.weight || 'N/A'}`
            });
        } else {
            // It's an oral medication
            medicines.push({
                ...baseItem,
                type: med.route === 'oral' ? 'tablet' : 'other',
                dosage: extractDosage(med.name),
                frequency: 'Once Daily', // Default, can be updated
                stock: 0,
                price: 0,
                manufacturer: med.brands?.[0]?.split(' ')[0] || '', // Extract manufacturer from brand
                expiryDate: '',
                notes: baseItem.notes + `. Type: ${med.type}. Flags: Hypo risk: ${med.flags?.hypo || 'N/A'}, Weight: ${med.flags?.weight || 'N/A'}`
            });
        }
    });

    return { medicines, insulins };
};

/**
 * Extract dosage from medicine name
 */
const extractDosage = (name) => {
    const match = name.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|iu)/i);
    return match ? match[0] : '';
};

/**
 * Sync medication database to Firestore admin config
 */
export const syncMedicineDatabase = async () => {
    try {
        const { medicines, insulins } = convertToAdminFormat();

        // Get current admin config
        const configRef = doc(db, 'admin_config', 'current');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            throw new Error('Admin config not found');
        }

        const currentConfig = configSnap.data().config;

        // Update medicine database in config
        const updatedConfig = {
            ...currentConfig,
            medicineDatabase: {
                medicines,
                insulins,
                lastUpdated: new Date().toISOString(),
                source: 'main_app_medication_database'
            }
        };

        // Save back to Firestore
        await setDoc(configRef, {
            config: updatedConfig,
            lastModified: new Date().toISOString(),
            modifiedBy: 'system_sync'
        });

        console.log(`✅ Synced ${medicines.length} medicines and ${insulins.length} insulins to admin config`);

        return { success: true, medicines: medicines.length, insulins: insulins.length };
    } catch (error) {
        console.error('Error syncing medicine database:', error);
        throw error;
    }
};

/**
 * Get medicine database from admin config
 */
export const getMedicineDatabase = async () => {
    try {
        const configRef = doc(db, 'admin_config', 'current');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            return { medicines: [], insulins: [] };
        }

        const medicineDb = configSnap.data().config?.medicineDatabase || {};

        return {
            medicines: medicineDb.medicines || [],
            insulins: medicineDb.insulins || [],
            lastUpdated: medicineDb.lastUpdated
        };
    } catch (error) {
        console.error('Error getting medicine database:', error);
        return { medicines: [], insulins: [] };
    }
};

/**
 * Update medicine database in admin config
 */
export const updateMedicineDatabase = async (medicines, insulins) => {
    try {
        const configRef = doc(db, 'admin_config', 'current');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            throw new Error('Admin config not found');
        }

        const currentConfig = configSnap.data().config;

        const updatedConfig = {
            ...currentConfig,
            medicineDatabase: {
                medicines,
                insulins,
                lastUpdated: new Date().toISOString(),
                source: 'admin_app_manual_update'
            }
        };

        await setDoc(configRef, {
            config: updatedConfig,
            lastModified: new Date().toISOString(),
            modifiedBy: 'admin_manual'
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating medicine database:', error);
        throw error;
    }
};
