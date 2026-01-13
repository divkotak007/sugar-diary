/**
 * useAccessibility Hook
 * Manages accessibility settings including high contrast mode
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sugar-diary-accessibility';

/**
 * Custom hook for accessibility settings
 * @returns {object} Accessibility state and methods
 */
export const useAccessibility = () => {
    const [highContrast, setHighContrastState] = useState(false);
    const [fontSize, setFontSizeState] = useState('normal'); // 'normal', 'large', 'xl'
    const [reducedMotion, setReducedMotionState] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                setHighContrastState(settings.highContrast || false);
                setFontSizeState(settings.fontSize || 'normal');
                setReducedMotionState(settings.reducedMotion || false);
            }

            // Check system preference for reduced motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (prefersReducedMotion.matches) {
                setReducedMotionState(true);
            }

            // Check system preference for high contrast
            const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
            if (prefersHighContrast.matches) {
                setHighContrastState(true);
            }
        } catch (err) {
            console.error('Error loading accessibility settings:', err);
        }
    }, []);

    // Apply settings to document
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // High contrast mode
        if (highContrast) {
            body.classList.add('high-contrast');
            root.style.setProperty('--bg-primary', '#000000');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#e5e5e5');
        } else {
            body.classList.remove('high-contrast');
            root.style.setProperty('--bg-primary', '#fffbf5');
            root.style.setProperty('--text-primary', '#1c1917');
            root.style.setProperty('--text-secondary', '#78716c');
        }

        // Font size
        const fontSizes = {
            normal: '16px',
            large: '18px',
            xl: '20px'
        };
        root.style.setProperty('--font-size-base', fontSizes[fontSize] || '16px');

        // Reduced motion
        if (reducedMotion) {
            root.style.setProperty('--animation-duration', '0s');
            root.style.setProperty('--transition-duration', '0s');
        } else {
            root.style.setProperty('--animation-duration', '0.3s');
            root.style.setProperty('--transition-duration', '0.2s');
        }
    }, [highContrast, fontSize, reducedMotion]);

    // Save settings to localStorage
    const saveSettings = useCallback((settings) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (err) {
            console.error('Error saving accessibility settings:', err);
        }
    }, []);

    // Toggle high contrast
    const toggleHighContrast = useCallback(() => {
        setHighContrastState(prev => {
            const newValue = !prev;
            saveSettings({ highContrast: newValue, fontSize, reducedMotion });
            return newValue;
        });
    }, [fontSize, reducedMotion, saveSettings]);

    // Set font size
    const setFontSize = useCallback((size) => {
        setFontSizeState(size);
        saveSettings({ highContrast, fontSize: size, reducedMotion });
    }, [highContrast, reducedMotion, saveSettings]);

    // Toggle reduced motion
    const toggleReducedMotion = useCallback(() => {
        setReducedMotionState(prev => {
            const newValue = !prev;
            saveSettings({ highContrast, fontSize, reducedMotion: newValue });
            return newValue;
        });
    }, [highContrast, fontSize, saveSettings]);

    // Reset to defaults
    const resetSettings = useCallback(() => {
        setHighContrastState(false);
        setFontSizeState('normal');
        setReducedMotionState(false);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        // State
        highContrast,
        fontSize,
        reducedMotion,

        // Methods
        toggleHighContrast,
        setFontSize,
        toggleReducedMotion,
        resetSettings
    };
};

export default useAccessibility;
