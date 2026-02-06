# Admin Control App - Example Integration

This example shows how to use the Admin Control App configuration in your Sugar Diary components.

## Basic Usage

```javascript
import { useConfig } from '../hooks/useConfig';

function MyComponent() {
  const { config, loading, error } = useConfig();

  if (loading) return <div>Loading configuration...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 style={{ color: config.ui.colors.light.primary }}>
        Sugar Diary
      </h1>
    </div>
  );
}
```

## Feature Flags

```javascript
import { useFeatureFlag } from '../hooks/useConfig';

function Dashboard() {
  const showAIInsights = useFeatureFlag('aiInsights');
  const showMedReminders = useFeatureFlag('medReminders');

  return (
    <div>
      {showAIInsights && <AIInsightsPanel />}
      {showMedReminders && <MedicationReminders />}
    </div>
  );
}
```

## Theme Colors

```javascript
import { useThemeColors } from '../hooks/useConfig';

function ThemedButton() {
  const colors = useThemeColors('light');

  return (
    <button style={{
      background: colors.primary,
      color: 'white',
      borderRadius: '8px'
    }}>
      Click Me
    </button>
  );
}
```

## Medical Limits

```javascript
import { useMedicalLimits } from '../hooks/useConfig';

function GlucoseInput() {
  const glucoseLimits = useMedicalLimits('glucose');

  return (
    <input
      type="number"
      min={glucoseLimits.min}
      max={glucoseLimits.max}
      step={glucoseLimits.step}
      placeholder={`Enter glucose (${glucoseLimits.unit})`}
    />
  );
}
```

## Full Config Access

```javascript
import { useConfig } from '../hooks/useConfig';

function SettingsPanel() {
  const { config } = useConfig();

  // Access any config value
  const aiEnabled = config.ai.enabled;
  const soundEnabled = config.sound_haptic.sound.enabled;
  const maxBolusUnits = config.medical.clinicalConstants.maxBolusUnits;

  return (
    <div>
      <p>AI: {aiEnabled ? 'Enabled' : 'Disabled'}</p>
      <p>Sound: {soundEnabled ? 'On' : 'Off'}</p>
      <p>Max Bolus: {maxBolusUnits} units</p>
    </div>
  );
}
```

## Real-time Updates

The config automatically updates in real-time when changes are made in the Admin Control App. No need to refresh!

```javascript
import { useConfig } from '../hooks/useConfig';
import { useEffect } from 'react';

function LiveConfigMonitor() {
  const { config } = useConfig();

  useEffect(() => {
    console.log('Config updated!', config);
    // React to config changes
  }, [config]);

  return <div>Monitoring config changes...</div>;
}
```
