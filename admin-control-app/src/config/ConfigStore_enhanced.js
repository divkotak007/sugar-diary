/**
 * Configuration Store
 * Central store for all Sugar Diary configuration
 * Stored in Firestore for persistence and versioning
 */

import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ADMIN_CONFIG_COLLECTION = 'admin_config';

// ... (DEFAULT_CONFIG stays the same - keeping existing default config)

/**
 * Get current configuration
 */
export const getConfig = async () => {
    try {
        const configRef = doc(db, ADMIN_CONFIG_COLLECTION, 'current');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
            return configSnap.data().config;
        }

        // If no config exists, save default and return it
        await setDoc(configRef, {
            config: DEFAULT_CONFIG,
            version: Date.now(),
            timestamp: serverTimestamp(),
            author: 'system',
            changes: ['Initial configuration']
        });

        return DEFAULT_CONFIG;
    } catch (error) {
        console.error('Error fetching config:', error);
        return DEFAULT_CONFIG;
    }
};

/**
 * Generate detailed, human-readable change descriptions
 */
const generateDetailedChanges = (newConfig, basicChanges) => {
    const detailed = [];

    basicChanges.forEach(change => {
        if (change.includes('features')) {
            // Feature flag changes
            const featureName = change.split('.')[1];
            const feature = newConfig.features?.[featureName];
            if (feature) {
                detailed.push(`Feature "${featureName}": ${feature.enabled ? 'ENABLED' : 'DISABLED'} (${feature.rollout}% rollout)`);
            }
        } else if (change.includes('ui.colors')) {
            detailed.push(`UI Colors: Updated theme colors`);
        } else if (change.includes('ui.typography')) {
            detailed.push(`Typography: Font "${newConfig.ui.typography?.fontFamily}", Scale ${newConfig.ui.typography?.sizeScale}x`);
        } else if (change.includes('ui.shapes')) {
            detailed.push(`Shapes: Card radius ${newConfig.ui.shapes?.cardRadius}, Button radius ${newConfig.ui.shapes?.buttonRadius}`);
        } else if (change.includes('ui.animations')) {
            detailed.push(`Animations: ${newConfig.ui.animations?.enabled ? 'Enabled' : 'Disabled'}, Speed ${newConfig.ui.animations?.speed}x`);
        } else if (change.includes('medical.vitalLimits')) {
            detailed.push(`Medical: Updated vital sign limits`);
        } else if (change.includes('medical.timeRules')) {
            detailed.push(`Medical: Edit window ${newConfig.medical.timeRules?.editWindow}min, Delete window ${newConfig.medical.timeRules?.deleteWindow}min`);
        } else if (change.includes('medical.clinicalConstants')) {
            detailed.push(`Medical: Updated clinical safety constants`);
        } else if (change.includes('ai.enabled')) {
            detailed.push(`AI System: ${newConfig.ai.enabled ? 'ENABLED' : 'DISABLED'}`);
        } else if (change.includes('ai.insights')) {
            const enabledInsights = Object.entries(newConfig.ai.insights || {})
                .filter(([_, i]) => i.enabled)
                .map(([key]) => key);
            detailed.push(`AI Insights: ${enabledInsights.join(', ')}`);
        } else if (change.includes('ai.thresholds')) {
            detailed.push(`AI Thresholds: Min confidence ${(newConfig.ai.thresholds?.minConfidence || 0.7) * 100}%`);
        } else if (change.includes('ux')) {
            detailed.push(`UX: Long press ${newConfig.ux.gestures?.longPressDuration}ms, Swipe ${newConfig.ux.gestures?.swipeThreshold}px`);
        } else if (change.includes('sound_haptic')) {
            detailed.push(`Sound: ${newConfig.sound_haptic.sound?.enabled ? 'ON' : 'OFF'} (${newConfig.sound_haptic.sound?.style}), Haptic: ${newConfig.sound_haptic.haptic?.enabled ? 'ON' : 'OFF'} (${newConfig.sound_haptic.haptic?.intensity})`);
        } else if (change.includes('medications')) {
            detailed.push(`Medications: Database v${newConfig.medications.database?.version}, Auto-sync ${newConfig.medications.database?.autoSync ? 'ON' : 'OFF'}`);
        } else {
            // Generic change
            detailed.push(change);
        }
    });

    return detailed.length > 0 ? detailed : basicChanges;
};

/**
 * Save configuration with detailed change tracking
 */
export const saveConfig = async (newConfig, user, changes = []) => {
    try {
        const configRef = doc(db, ADMIN_CONFIG_COLLECTION, 'current');

        // Generate detailed change descriptions
        const detailedChanges = generateDetailedChanges(newConfig, changes);

        const configData = {
            config: newConfig,
            version: Date.now(),
            timestamp: serverTimestamp(),
            author: user.email,
            changes: detailedChanges
        };

        // Save current config
        await setDoc(configRef, configData);

        // Save to history
        const historyRef = collection(db, ADMIN_CONFIG_COLLECTION, 'current', 'history');
        await addDoc(historyRef, configData);

        return configData;
    } catch (error) {
        console.error('Error saving config:', error);
        throw error;
    }
};

/**
 * Get configuration history
 */
export const getConfigHistory = async (limitCount = 20) => {
    try {
        const historyQuery = query(
            collection(db, ADMIN_CONFIG_COLLECTION, 'current', 'history'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(historyQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching history:', error);
        return [];
    }
};

/**
 * Rollback to a specific version
 */
export const rollbackToVersion = async (versionId, user) => {
    try {
        const versionRef = doc(db, ADMIN_CONFIG_COLLECTION, 'current', 'history', versionId);
        const versionDoc = await getDoc(versionRef);

        if (!versionDoc.exists()) {
            throw new Error('Version not found');
        }

        const versionData = versionDoc.data();
        const timestamp = versionData.timestamp?.toDate?.()?.toLocaleString() || 'Unknown';
        await saveConfig(versionData.config, user, [`Rollback to version from ${timestamp}`]);

        return { success: true };
    } catch (error) {
        console.error('Error rolling back:', error);
        throw error;
    }
};

export { DEFAULT_CONFIG };
