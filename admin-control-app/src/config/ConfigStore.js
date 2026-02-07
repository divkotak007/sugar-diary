/**
 * Configuration Store
 * Central store for all Sugar Diary configuration
 * Stored in Firestore for persistence and versioning
 */

import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, ADMIN_CONFIG_COLLECTION } from '../firebase/config';

/**
 * Default configuration schema
 * This is the master config that controls the entire Sugar Diary app
 */
export const DEFAULT_CONFIG = {
    version: '1.0.0',

    // Module A: UI Configuration
    ui: {
        typography: {
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            sizeScale: 1.0,
            weights: { normal: 400, medium: 500, semibold: 600, bold: 700 }
        },
        colors: {
            light: {
                primary: '#3B82F6',
                secondary: '#10B981',
                accent: '#F59E0B',
                danger: '#EF4444',
                warning: '#F59E0B',
                success: '#10B981',
                background: '#FFFFFF',
                surface: '#F9FAFB',
                text: '#111827'
            },
            dark: {
                primary: '#60A5FA',
                secondary: '#34D399',
                accent: '#FBBF24',
                danger: '#F87171',
                warning: '#FBBF24',
                success: '#34D399',
                background: '#111827',
                surface: '#1F2937',
                text: '#F9FAFB'
            }
        },
        shapes: {
            cardRadius: '12px',
            buttonRadius: '8px',
            inputRadius: '8px',
            elevation: 'medium', // low, medium, high
            shadowDepth: 3
        },
        animations: {
            enabled: true,
            speed: 1.0, // multiplier
            reducedMotion: false
        }
    },

    // Module B: UX Configuration
    ux: {
        gestures: {
            doubleTapEnabled: true,
            longPressDuration: 500, // ms
            swipeThreshold: 50 // px
        },
        behaviors: {
            autoCollapse: true,
            floatingPanelAutoDismiss: true,
            confirmationLevel: 'medium' // low, medium, high
        },
        scrollPhysics: {
            momentum: true,
            bounceEffect: true
        }
    },

    // Module C: Sound & Haptic Configuration
    sound_haptic: {
        sound: {
            enabled: true,
            style: 'premium', // silent, subtle, premium
            triggers: {
                save: 'success',
                delete: 'error',
                toggle: 'click',
                pillSelect: 'tick',
                navigation: 'click'
            }
        },
        haptic: {
            enabled: true,
            intensity: 'medium', // light, medium, strong
            triggers: {
                save: 'success',
                delete: 'warning',
                toggle: 'selection',
                pillSelect: 'selection',
                navigation: 'light'
            }
        }
    },

    // Module D: Feature Flags
    features: {
        estimatedHbA1c: { enabled: true, rollout: 100 },
        calendarView: { enabled: true, rollout: 100 },
        aiInsights: { enabled: true, rollout: 100 },
        reminders: { enabled: true, rollout: 100 },
        deepViewVitals: { enabled: true, rollout: 100 },
        safetyChecks: { enabled: true, rollout: 100 },
        validation: { enabled: true, rollout: 100 },
        cleanupTool: { enabled: false, rollout: 0 },
        iobIndicator: { enabled: true, rollout: 100 },
        pdfExport: { enabled: true, rollout: 100 }
    },

    // Module E: Medical Rules
    medical: {
        vitalLimits: {
            weight: { min: 20, max: 300, unit: 'kg', step: 0.1 },
            hba1c: { min: 3.0, max: 20.0, unit: '%', step: 0.1 },
            creatinine: { min: 0.1, max: 15.0, unit: 'mg/dL', step: 0.01 },
            glucose: { min: 40, max: 500, unit: 'mg/dL', step: 1 }
        },
        timeRules: {
            editWindow: 30, // minutes
            deleteWindow: 30, // minutes
            backdateLimit: 7, // days
            duplicateThreshold: 60 // minutes
        },
        clinicalConstants: {
            hypoSevere: 54,
            hypoThreshold: 70,
            targetMin: 80,
            targetMax: 130,
            targetMaxPost: 180,
            hyperThreshold: 180,
            hyperSevere: 250,
            criticalHigh: 400,
            absoluteMaxDose: 50,
            maxBolusUnits: 15,
            maxDailyTotal: 100,
            minDoseIntervalHours: 2,
            minDoseIncrement: 0.5,
            diaRapid: 4,
            diaShort: 6,
            diaLong: 24,
            diaUltraLong: 42,
            maxSafeIOB: 3.0,
            hypoIOBLimit: 1.0,
            criticalIOBLimit: 0.5
        }
    },

    // Module F: AI Configuration
    ai: {
        enabled: true,
        insights: {
            glucoseTrend: { enabled: true, minDataPoints: 3 },
            weightTrend: { enabled: true, minDataPoints: 2 },
            hba1cStatus: { enabled: true },
            creatinineStatus: { enabled: true },
            glucosePatterns: { enabled: true }
        },
        thresholds: {
            minConfidence: 0.7,
            minDataPoints: 3
        }
    },

    // Module G: Medications & Reminders
    medications: {
        database: {
            version: '5.1',
            autoSync: true,
            syncInterval: 86400000 // 24 hours in ms
        },
        reminders: {
            enabled: true,
            defaultTimings: {
                Morning: { hour: 8, minute: 0 },
                Breakfast: { hour: 8, minute: 0 },
                Lunch: { hour: 13, minute: 0 },
                Afternoon: { hour: 13, minute: 0 },
                Evening: { hour: 18, minute: 0 },
                Dinner: { hour: 20, minute: 0 },
                Night: { hour: 22, minute: 0 },
                Bedtime: { hour: 22, minute: 0 }
            },
            frequencyRules: {
                'Once Daily': ['Morning'],
                'Twice Daily': ['Morning', 'Evening'],
                'Thrice Daily': ['Morning', 'Afternoon', 'Evening'],
                'Bedtime': ['Bedtime'],
                'Before Meals': ['Breakfast', 'Lunch', 'Dinner'],
                'SOS': ['As Needed']
            }
        }
    }
};

/**
 * Get current configuration
 */
export const getConfig = async () => {
    try {
        const configDoc = await getDoc(doc(db, ADMIN_CONFIG_COLLECTION, 'current'));
        if (configDoc.exists()) {
            return configDoc.data().config;
        }
        return DEFAULT_CONFIG;
    } catch (error) {
        console.error('Error fetching config:', error);
        return DEFAULT_CONFIG;
    }
};

/**
 * Save configuration with versioning
 */
export const saveConfig = async (newConfig, author, changes) => {
    try {
        const version = `v_${Date.now()}`;

        // Save to history subcollection
        await setDoc(doc(db, ADMIN_CONFIG_COLLECTION, 'versions', 'history', version), {
            version,
            config: newConfig,
            author: author.email,
            changes,
            timestamp: serverTimestamp()
        });

        // Update current
        await setDoc(doc(db, ADMIN_CONFIG_COLLECTION, 'current'), {
            version,
            config: newConfig,
            lastUpdated: serverTimestamp(),
            lastUpdatedBy: author.email
        });

        return { success: true, version };
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
