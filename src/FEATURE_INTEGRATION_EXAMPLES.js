/**
 * Feature Integration Guide
 * How to integrate all admin-controlled features into the main Sugar Diary app
 */

import { useConfig, useFeatureFlag } from './hooks/useConfig';

// ============================================
// EXAMPLE 1: Feature Flags (Simple ON/OFF)
// ============================================

function AIInsightsPanel() {
    const isEnabled = useFeatureFlag('aiInsights');

    if (!isEnabled) return null;  // Hide if disabled in admin

    return <div>AI Insights Content...</div>;
}

// ============================================
// EXAMPLE 2: Multiple Features
// ============================================

function Dashboard() {
    const showAI = useFeatureFlag('aiInsights');
    const showMedReminders = useFeatureFlag('medicationReminders');
    const showWeightTracking = useFeatureFlag('weightTracking');
    const showHbA1c = useFeatureFlag('estimatedHbA1c');

    return (
        <div>
            {showAI && <AIPanel />}
            {showMedReminders && <RemindersList />}
            {showWeightTracking && <WeightChart />}
            {showHbA1c && <HbA1cBadge />}
        </div>
    );
}

// ============================================
// EXAMPLE 3: Using Full Config for UI/UX
// ============================================

function ThemedButton({ children }) {
    const { config } = useConfig();

    const colors = config?.ui?.colors?.light;
    const shapes = config?.ui?.shapes;
    const animations = config?.ui?.animations;

    return (
        <button
            style={{
                background: colors?.primary || '#3B82F6',
                borderRadius: shapes?.buttonRadius || '8px',
                transition: animations?.enabled ? `all ${animations?.speed || 1}s` : 'none'
            }}
        >
            {children}
        </button>
    );
}

// ============================================
// EXAMPLE 4: Medical Limits from Admin
// ============================================

function GlucoseInput({ value }) {
    const { config } = useConfig();

    const limits = config?.medical?.vitalLimits?.glucose;
    const isHigh = value > (limits?.max || 180);
    const isLow = value < (limits?.min || 70);

    return (
        <div className={isHigh ? 'danger' : isLow ? 'warning' : 'normal'}>
            Glucose: {value} mg/dL
            {isHigh && ' ⚠️ HIGH'}
            {isLow && ' ⚠️ LOW'}
        </div>
    );
}

// ============================================
// EXAMPLE 5: Sound & Haptic from Admin
// ============================================

function ActionButton({ onClick }) {
    const { config } = useConfig();

    const handleClick = () => {
        // Play sound if enabled in admin
        if (config?.sound_haptic?.sound?.enabled) {
            playSound(config.sound_haptic.sound.style);
        }

        // Trigger haptic if enabled
        if (config?.sound_haptic?.haptic?.enabled) {
            triggerHaptic(config.sound_haptic.haptic.intensity);
        }

        onClick();
    };

    return <button onClick={handleClick}>Click Me</button>;
}

// ============================================
// ALL 10 FEATURES TO INTEGRATE
// ============================================

/*
1. AI Insights - useFeatureFlag('aiInsights')
2. Medication Reminders - useFeatureFlag('medicationReminders')
3. Weight Tracking - useFeatureFlag('weightTracking')
4. Creatinine Tracking - useFeatureFlag('creatinineTracking')
5. Estimated HbA1c - useFeatureFlag('estimatedHbA1c')
6. Glucose Patterns - useFeatureFlag('glucosePatterns')
7. Insulin Calculator - useFeatureFlag('insulinCalculator')
8. Meal Tagging - useFeatureFlag('mealTagging')
9. Export Reports - useFeatureFlag('exportReports')
10. Dark Mode - useFeatureFlag('darkMode')

UI Controls:
- config.ui.colors.light/dark
- config.ui.typography
- config.ui.shapes
- config.ui.animations

Medical Rules:
- config.medical.vitalLimits
- config.medical.timeRules
- config.medical.clinicalConstants

UX Settings:
- config.ux.gestures
- config.ux.feedback

Sound/Haptic:
- config.sound_haptic.sound
- config.sound_haptic.haptic
*/

export default {
    AIInsightsPanel,
    Dashboard,
    ThemedButton,
    GlucoseInput,
    ActionButton
};
