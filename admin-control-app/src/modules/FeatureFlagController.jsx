/**
 * Module D: Feature Flag Controller
 * Toggle features on/off and control rollout percentage
 */

import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Save } from 'lucide-react';

const FeatureFlagController = ({ config, onUpdate }) => {
    const [features, setFeatures] = useState(config.features || {});
    const [hasChanges, setHasChanges] = useState(false);

    const toggleFeature = (featureKey) => {
        setFeatures(prev => ({
            ...prev,
            [featureKey]: {
                ...prev[featureKey],
                enabled: !prev[featureKey].enabled
            }
        }));
        setHasChanges(true);
    };

    const updateRollout = (featureKey, value) => {
        setFeatures(prev => ({
            ...prev,
            [featureKey]: {
                ...prev[featureKey],
                rollout: parseInt(value)
            }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ features });
        setHasChanges(false);
    };

    const featureList = [
        { key: 'estimatedHbA1c', label: 'Estimated HbA1c Display', description: 'Show estimated HbA1c calculation on dashboard' },
        { key: 'calendarView', label: 'Calendar Sugar View', description: 'Calendar view for glucose readings' },
        { key: 'aiInsights', label: 'AI Insights', description: 'AI-powered data analysis and insights' },
        { key: 'reminders', label: 'Medication Reminders', description: 'Push notifications for medication reminders' },
        { key: 'deepViewVitals', label: 'Deep View Vitals', description: 'Detailed vital signs deep view' },
        { key: 'safetyChecks', label: 'Safety Checks', description: 'Clinical safety validation (IOB, dose checks)' },
        { key: 'validation', label: 'Input Validation', description: 'Zod schema validation for all inputs' },
        { key: 'cleanupTool', label: 'Data Cleanup Tool', description: 'Deduplication and data cleanup utilities' },
        { key: 'iobIndicator', label: 'IOB Indicator', description: 'Insulin on Board indicator on dashboard' },
        { key: 'pdfExport', label: 'PDF Export', description: 'Export reports as PDF' }
    ];

    return (
        <div className="feature-flag-controller">
            <div className="module-header">
                <h2>Feature Flag Controller</h2>
                <p className="subtitle">Toggle features on/off and control rollout percentage</p>
            </div>

            <div className="features-grid">
                {featureList.map(({ key, label, description }) => {
                    const feature = features[key] || { enabled: false, rollout: 0 };

                    return (
                        <div key={key} className="feature-card">
                            <div className="feature-header">
                                <div className="feature-info">
                                    <h3>{label}</h3>
                                    <p>{description}</p>
                                </div>
                                <button
                                    className={`toggle-btn ${feature.enabled ? 'enabled' : 'disabled'}`}
                                    onClick={() => toggleFeature(key)}
                                >
                                    {feature.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    <span>{feature.enabled ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>

                            {feature.enabled && (
                                <div className="rollout-control">
                                    <label>
                                        Rollout: {feature.rollout}%
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={feature.rollout}
                                            onChange={(e) => updateRollout(key, e.target.value)}
                                            className="rollout-slider"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {hasChanges && (
                <div className="save-bar">
                    <button onClick={handleSave} className="save-btn">
                        <Save size={20} />
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeatureFlagController;
