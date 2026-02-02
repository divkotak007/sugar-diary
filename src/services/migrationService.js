import { getFirestore, collection, getDocs, writeBatch, doc, query, where, orderBy } from 'firebase/firestore';

const MIGRATION_KEY = 'sugar_migration_vitals_v1_completed';

export const runVitalMigration = async (userId) => {
    if (!userId) return;

    // Check if already done locally
    if (localStorage.getItem(MIGRATION_KEY)) {
        console.log('[Migration] Vitals V1 already completed (Local Check).');
        return;
    }

    const db = getFirestore();
    console.log('[Migration] Starting Legacy Vital Migration...');

    try {
        // 1. Fetch ALL legacy logs (Limit to recent 500 or just all? Let's try all but safe limit)
        // In a real app with 10k logs, this needs pagination. For this user context, assuming <2000 logs.
        const logsRef = collection(db, 'users', userId, 'logs');
        const q = query(logsRef, orderBy('timestamp', 'desc')); // Newest first
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log('[Migration] No legacy logs found.');
            localStorage.setItem(MIGRATION_KEY, 'true');
            return;
        }

        const batch = writeBatch(db);
        let opCount = 0;
        const BATCH_LIMIT = 450; // Firestore limit is 500

        const counters = { weight: 0, hba1c: 0, creatinine: 0 };

        snapshot.docs.forEach(legacyDoc => {
            const data = legacyDoc.data();
            const logId = legacyDoc.id;

            // Extract from Snapshot Profile (Legacy Pattern)
            if (data.snapshot && data.snapshot.profile) {
                const p = data.snapshot.profile;
                const ts = data.timestamp; // Original Timestamp

                // Helper to queue write
                const queueMigrate = (type, val, unit) => {
                    if (val && !isNaN(parseFloat(val))) {
                        // Create NEW doc ref in ISOLATED collection
                        // We use the SAME ID to prevent duplicates if we re-run logic, 
                        // OR we generate new ID? 
                        // Using same ID is risky if IDs collide across collections (unlikely but possible).
                        // Better to use Same ID for traceability.
                        const newRef = doc(db, 'users', userId, `vital_${type}_logs`, logId);
                        batch.set(newRef, {
                            value: parseFloat(val),
                            unit: unit,
                            timestamp: ts,
                            migratedAt: new Date(),
                            legacyId: logId,
                            type: 'vital_entry'
                        });
                        opCount++;
                        counters[type]++;
                    }
                };

                // Check Weight
                queueMigrate('weight', p.weight, 'kg');
                // Check HbA1c
                queueMigrate('hba1c', p.hba1c, '%');
                // Check Creatinine
                queueMigrate('creatinine', p.creatinine, 'mg/dL');
            }
        });

        if (opCount > 0) {
            await batch.commit();
            console.log(`[Migration] Successfully moved ${opCount} entries.`, counters);
            alert(`Restored: ${counters.weight} weights, ${counters.hba1c} HbA1c, ${counters.creatinine} renal logs.`);
        } else {
            console.log('[Migration] No vital data found in legacy logs.');
        }

        // Mark complete
        localStorage.setItem(MIGRATION_KEY, 'true');

    } catch (e) {
        console.error('[Migration] Failed:', e);
        // Do NOT mark complete, so it tries again next time
    }
};
