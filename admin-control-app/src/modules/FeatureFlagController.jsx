/**
 * Enhanced Feature Flag Controller
 * Granular control over all feature settings with detailed UI
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Save, RotateCcw } from 'lucide-react';
import './FeatureFlagController.css';

const FeatureFlagController = ({ config, onUpdate }) => {
    const [expandedFeatures, setExpandedFeatures] = useState({});
    const [localConfig, setLocalConfig] = useState(config.features || {});

    const toggleFeature = (featureName) => {
        setExpandedFeatures(prev => ({
            ...prev,
            [featureName]: !prev[featureName]
        }));
    };

    const updateFeature = (featureName, path, value) => {
        const newConfig = { ...localConfig };
        const keys = path.split('.');
        let current = newConfig[featureName];

        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        setLocalConfig(newConfig);
    };

    const handleSave = () => {
        onUpdate({ features: localConfig });
    };

    const resetFeature = (featureName) => {
        setLocalConfig(prev => ({
            ...prev,
            [featureName]: config.features[featureName]
        }));
    };

    const features = [
        {
            id: 'weightTracking',
            name: 'Weight Tracking',
            icon: '⚖️',
            description: 'Track and monitor weight changes over time'
        },
        {
            id: 'creatinineTracking',
            name: 'Creatinine Tracking',
            icon: '🧪',
            description: 'Monitor kidney function via creatinine levels'
        },
        {
            id: 'hba1cTracking',
            name: 'HbA1c Tracking',
            icon: '🩸',
            description: 'Track HbA1c lab results over time'
        },
        {
            id: 'estimatedHbA1c',
            name: 'Estimated HbA1c',
            icon: '🎯',
            description: 'Calculate estimated HbA1c (GMI) from glucose data'
        },
        {
            id: 'aiInsights',
            name: 'AI Insights',
            icon: '🤖',
            description: 'AI-powered glucose insights and pattern detection'
        },
        {
            id: 'medicationReminders',
            name: 'Medication Reminders',
            icon: '💊',
            description: 'Smart medication reminder notifications'
        },
        {
            id: 'glucosePatterns',
            name: 'Glucose Patterns',
            icon: '📊',
            description: 'Detect and highlight glucose patterns'
        },
        {
            id: 'mealTagging',
            name: 'Meal Tagging',
            icon: '🍽️',
            description: 'Tag meals and track their impact on glucose'
        },
        {
            id: 'exportReports',
            name: 'Export Reports',
            icon: '📄',
            description: 'Export data as PDF/CSV reports'
        },
        {
            id: 'darkMode',
            name: 'Dark Mode',
            icon: '🌙',
            description: 'Dark mode theme support'
        }
    ];

    const renderColorPicker = (featureName, path, value, label) => (
        <div className="setting-row">
            <label>{label}</label>
            <div className="color-picker-wrapper">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => updateFeature(featureName, path, e.target.value)}
                    className="color-input"
                />
                <span className="color-value">{value}</span>
            </div>
        </div>
    );

    const renderTextInput = (featureName, path, value, label) => (
        <div className="setting-row">
            <label>{label}</label>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => updateFeature(featureName, path, e.target.value)}
                className="text-input"
            />
        </div>
    );

    const renderNumberInput = (featureName, path, value, label, min, max) => (
        <div className="setting-row">
            <label>{label}</label>
            <div className="number-input-wrapper">
                <button onClick={() => updateFeature(featureName, path, Math.max(min || 0, (value || 0) - 1))}>−</button>
                <input
                    type="number"
                    value={value || 0}
                    onChange={(e) => updateFeature(featureName, path, parseInt(e.target.value))}
                    min={min}
                    max={max}
                    className="number-input"
                />
                <button onClick={() => updateFeature(featureName, path, Math.min(max || 999, (value || 0) + 1))}>+</button>
            </div>
        </div>
    );

    const renderToggle = (featureName, path, value, label) => (
        <div className="setting-row">
            <label>{label}</label>
            <label className="toggle-switch">
                <input
                    type="checkbox"
                    checked={value || false}
                    onChange={(e) => updateFeature(featureName, path, e.target.checked)}
                />
                <span className="toggle-slider"></span>
            </label>
        </div>
    );

    const renderFeatureSettings = (featureId, featureData) => {
        if (!featureData) return null;

        switch (featureId) {
            case 'weightTracking':
            case 'creatinineTracking':
            case 'hba1cTracking':
                return (
                    <>
                        <div className="settings-section">
                            <h4>Display Settings</h4>
                            {renderToggle(featureId, 'display.showInDashboard', featureData.display?.showInDashboard, 'Show in Dashboard')}
                            {renderToggle(featureId, 'display.showInVitalsList', featureData.display?.showInVitalsList, 'Show in Vitals List')}
                            {renderColorPicker(featureId, 'display.badgeColor', featureData.display?.badgeColor, 'Badge Color')}
                            {renderTextInput(featureId, 'display.badgeEmoji', featureData.display?.badgeEmoji, 'Badge Emoji')}
                            {renderTextInput(featureId, 'display.label', featureData.display?.label, 'Label Text')}
                        </div>
                        <div className="settings-section">
                            <h4>Tracking Settings</h4>
                            {renderToggle(featureId, 'tracking.allowManualEntry', featureData.tracking?.allowManualEntry, 'Allow Manual Entry')}
                            {renderToggle(featureId, 'tracking.showTrend', featureData.tracking?.showTrend, 'Show Trend')}
                            {featureData.tracking?.trendDays !== undefined &&
                                renderNumberInput(featureId, 'tracking.trendDays', featureData.tracking.trendDays, 'Trend Days', 7, 365)}
                            {featureData.tracking?.trendMonths !== undefined &&
                                renderNumberInput(featureId, 'tracking.trendMonths', featureData.tracking.trendMonths, 'Trend Months', 1, 24)}
                        </div>
                        <div className="settings-section">
                            <h4>Alert Settings</h4>
                            {renderToggle(featureId, 'alerts.enabled', featureData.alerts?.enabled, 'Enable Alerts')}
                            {featureData.alerts?.enabled && (
                                <>
                                    {featureData.alerts.rapidChangeThreshold !== undefined &&
                                        renderNumberInput(featureId, 'alerts.rapidChangeThreshold', featureData.alerts.rapidChangeThreshold, 'Rapid Change Threshold (kg/week)', 1, 20)}
                                    {featureData.alerts.warnOnAbnormal !== undefined &&
                                        renderToggle(featureId, 'alerts.warnOnAbnormal', featureData.alerts.warnOnAbnormal, 'Warn on Abnormal')}
                                </>
                            )}
                        </div>
                    </>
                );

            case 'estimatedHbA1c':
                return (
                    <>
                        <div className="settings-section">
                            <h4>Display Settings</h4>
                            {renderToggle(featureId, 'display.showInDashboard', featureData.display?.showInDashboard, 'Show in Dashboard')}
                            {renderColorPicker(featureId, 'display.badgeColor', featureData.display?.badgeColor, 'Badge Color')}
                            {renderTextInput(featureId, 'display.badgeEmoji', featureData.display?.badgeEmoji, 'Badge Emoji')}
                            {renderTextInput(featureId, 'display.label', featureData.display?.label, 'Label Text')}
                        </div>
                        <div className="settings-section">
                            <h4>Calculation Settings</h4>
                            {renderNumberInput(featureId, 'calculation.minDataPoints', featureData.calculation?.minDataPoints, 'Min Data Points', 7, 90)}
                            {renderNumberInput(featureId, 'calculation.daysToConsider', featureData.calculation?.daysToConsider, 'Days to Consider', 30, 180)}
                            {renderToggle(featureId, 'calculation.showConfidence', featureData.calculation?.showConfidence, 'Show Confidence Level')}
                        </div>
                    </>
                );

            case 'aiInsights':
                return (
                    <>
                        <div className="settings-section">
                            <h4>Insight Types</h4>
                            {renderToggle(featureId, 'insights.glucoseTrends.enabled', featureData.insights?.glucoseTrends?.enabled, 'Glucose Trends')}
                            {renderToggle(featureId, 'insights.patternDetection.enabled', featureData.insights?.patternDetection?.enabled, 'Pattern Detection')}
                            {renderToggle(featureId, 'insights.predictions.enabled', featureData.insights?.predictions?.enabled, 'Predictions')}
                        </div>
                        <div className="settings-section">
                            <h4>Display Settings</h4>
                            {renderToggle(featureId, 'display.showInDashboard', featureData.display?.showInDashboard, 'Show in Dashboard')}
                            {renderToggle(featureId, 'display.autoExpand', featureData.display?.autoExpand, 'Auto Expand')}
                            {renderNumberInput(featureId, 'display.maxInsightsShown', featureData.display?.maxInsightsShown, 'Max Insights Shown', 1, 20)}
                        </div>
                    </>
                );

            case 'medicationReminders':
                return (
                    <>
                        <div className="settings-section">
                            <h4>Notification Settings</h4>
                            {renderToggle(featureId, 'notifications.sound', featureData.notifications?.sound, 'Sound')}
                            {renderToggle(featureId, 'notifications.vibrate', featureData.notifications?.vibrate, 'Vibrate')}
                            {renderToggle(featureId, 'notifications.persistent', featureData.notifications?.persistent, 'Persistent')}
                        </div>
                        <div className="settings-section">
                            <h4>Timing Settings</h4>
                            {renderNumberInput(featureId, 'timing.reminderMinutesBefore', featureData.timing?.reminderMinutesBefore, 'Reminder Minutes Before', 0, 60)}
                            {renderNumberInput(featureId, 'timing.snoozeMinutes', featureData.timing?.snoozeMinutes, 'Snooze Minutes', 5, 30)}
                            {renderNumberInput(featureId, 'timing.maxSnoozes', featureData.timing?.maxSnoozes, 'Max Snoozes', 1, 10)}
                        </div>
                    </>
                );

            default:
                return <p className="no-settings">No detailed settings available yet</p>;
        }
    };

    return (
        <div className="feature-flags-controller">
            <div className="controller-header">
                <h2>Feature Flags</h2>
                <button onClick={handleSave} className="save-btn">
                    <Save size={16} />
                    Save All Changes
                </button>
            </div>

            <div className="features-list">
                {features.map(feature => {
                    const featureData = localConfig[feature.id];
                    const isExpanded = expandedFeatures[feature.id];
                    const isEnabled = featureData?.enabled;

                    return (
                        <div key={feature.id} className={`feature-card ${isEnabled ? 'enabled' : 'disabled'}`}>
                            <div className="feature-header" onClick={() => toggleFeature(feature.id)}>
                                <div className="feature-info">
                                    <span className="feature-icon">{feature.icon}</span>
                                    <div>
                                        <h3>{feature.name}</h3>
                                        <p>{feature.description}</p>
                                    </div>
                                </div>
                                <div className="feature-controls">
                                    <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={(e) => updateFeature(feature.id, 'enabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <button className="reset-btn" onClick={(e) => { e.stopPropagation(); resetFeature(feature.id); }}>
                                        <RotateCcw size={14} />
                                    </button>
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </div>

                            {isExpanded && isEnabled && (
                                <div className="feature-settings">
                                    {renderFeatureSettings(feature.id, featureData)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FeatureFlagController;
