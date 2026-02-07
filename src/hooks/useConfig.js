/**
 * useConfig Hook
 * Real-time configuration sync from Admin Control App
 * 
 * Usage:
 * const { config, loading } = useConfig();
 * 
 * Access any config value:
 * - config.features.aiInsights.enabled
 * - config.ui.colors.light.primary
 * - config.medical.clinicalConstants.maxBolusUnits
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
const getDb = () => {
    const apps = getApps();
    if (apps.length > 0) {
        return getFirestore(apps[0]);
    }

    // Fallback: initialize with config
    const firebaseConfig = {
        apiKey: "AIzaSyAAmGSRYXVfTL9iDNPPf7vtvGeIsna4MiI",
        authDomain: "sugerdiary.firebaseapp.com",
        projectId: "sugerdiary",
        storageBucket: "sugerdiary.firebasestorage.app",
        messagingSenderId: "467564721006",
        appId: "1:467564721006:web:bf4720ad00e356c841477f",
    };
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
};



export const useConfig = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const db = getDb();
        const configRef = doc(db, 'admin_config', 'current');

        // Real-time listener for config changes
        const unsubscribe = onSnapshot(
            configRef,
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setConfig(data.config);
                    setLoading(false);
                } else {
                    setError('No configuration found');
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Error loading config:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { config, loading, error };
};

/**
 * useFeatureFlag Hook
 * Check if a specific feature is enabled
 * 
 * Usage:
 * const isEnabled = useFeatureFlag('aiInsights');
 */
export const useFeatureFlag = (featureName) => {
    const { config, loading } = useConfig();

    if (loading || !config) return false;

    const feature = config.features?.[featureName];
    if (!feature) return false;

    // Check if enabled and rollout percentage
    if (!feature.enabled) return false;

    // Simple rollout check (you can make this more sophisticated)
    const rolloutPercentage = feature.rollout || 100;
    return Math.random() * 100 < rolloutPercentage;
};

/**
 * useThemeColors Hook
 * Get current theme colors
 * 
 * Usage:
 * const colors = useThemeColors('light');
 */
export const useThemeColors = (theme = 'light') => {
    const { config, loading } = useConfig();

    if (loading || !config) return null;

    return config.ui?.colors?.[theme] || null;
};

/**
 * useMedicalLimits Hook
 * Get medical vital limits
 * 
 * Usage:
 * const glucoseLimits = useMedicalLimits('glucose');
 */
export const useMedicalLimits = (vitalType) => {
    const { config, loading } = useConfig();

    if (loading || !config) return null;

    return config.medical?.vitalLimits?.[vitalType] || null;
};
