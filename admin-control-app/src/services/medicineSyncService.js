/**
 * Medicine Database Sync Service
 * Syncs medication data between main app and admin app
 */

import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { MEDICATION_DATABASE } from '../../../src/data/medications';

const db = getFirestore();

/**
 * Convert main app medication database to clinical admin format
 */
export const convertToAdminFormat = () => {
    const medicines = [];
    const insulins = [];

    MEDICATION_DATABASE.forEach((med, index) => {
        const baseItem = {
            id: `med_${index}_${Date.now()}`,
            name: med.name,
            class: (med.class || []).join(', '),
            brands: (med.brands || []).join(', '),
            route: med.route,
            type: med.type
        };

        // Extract safety flags
        const safetyFlags = {
            hypoRisk: med.flags?.hypo || 'low',
            weightEffect: med.flags?.weight || 'neutral'
        };

        // Extract contraindications
        const contraindications = {
            ckd: typeof med.flags?.ckd === 'object' ? med.flags.ckd.eGFR_30 : (med.flags?.ckd || 'allowed'),
            pregnancy: med.flags?.pregnancy || 'safe',
            elderly: med.flags?.elderly || 'preferred',
            heartFailure: med.flags?.hf || 'safe'
        };

        // Build clinical notes
        const notes = `Type: ${med.type}. Route: ${med.route}.`;

        if (med.route === 'insulin') {
            // It's an insulin
            insulins.push({
                ...baseItem,
                safetyFlags,
                contraindications: {
                    ckd: contraindications.ckd,
                    pregnancy: contraindications.pregnancy,
                    elderly: contraindications.elderly
                },
                notes
            });
        } else {
            // It's an oral medication
            medicines.push({
                ...baseItem,
                safetyFlags,
                contraindications,
                notes
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
        // Check if Firebase is initialized and user is authenticated
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error('You must be signed in to sync the database. Please sign in to the admin app first.');
        }

        console.log(`Syncing as user: ${currentUser.email}`);

        const { medicines, insulins } = convertToAdminFormat();

        // Get current admin config
        const configRef = doc(db, 'admin_config', 'current');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            throw new Error('Admin config not found. Please ensure the admin app is properly initialized.');
        }

        const currentConfig = configSnap.data().config;

        // Update medicine database in config
        const updatedConfig = {
            ...currentConfig,
            medicineDatabase: {
                medicines,
                insulins,
                lastUpdated: new Date().toISOString(),
                source: 'main_app_medication_database',
                syncedBy: currentUser.email
            }
        };

        // Save back to Firestore
        await setDoc(configRef, {
            config: updatedConfig,
            lastModified: new Date().toISOString(),
            modifiedBy: currentUser.email || 'system_sync'
        });

        console.log(`✅ Synced ${medicines.length} medicines and ${insulins.length} insulins to admin config`);

        return { success: true, medicines: medicines.length, insulins: insulins.length };
    } catch (error) {
        console.error('Error syncing medicine database:', error);

        // Provide user-friendly error messages
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            throw new Error(`Permission denied. Only authorized admin users (divyanshkotak04@gmail.com) can sync the database. Current user: ${error.message}`);
        }

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
