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
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useConfig = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
