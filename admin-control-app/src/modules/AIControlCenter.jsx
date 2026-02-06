/**
 * Module F: AI Control Center
 * Configure AI insights, thresholds, and behavior
 */

import React, { useState } from 'react';
import { Save, Brain, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';

const AIControlCenter = ({ config, onUpdate, isSaving }) => {
    const [aiConfig, setAiConfig] = useState(config.ai || {});
    const [hasChanges, setHasChanges] = useState(false);

    const toggleAI = () => {
        setAiConfig(prev => ({ ...prev, enabled: !prev.enabled }));
        setHasChanges(true);
    };

    const toggleInsight = (insightKey) => {
        setAiConfig(prev => ({
            ...prev,
            insights: {
                ...prev.insights,
                [insightKey]: {
                    ...prev.insights[insightKey],
                    enabled: !prev.insights[insightKey]?.enabled
                }
            }
        }));
        setHasChanges(true);
    };

    const updateInsightParam = (insightKey, param, value) => {
        setAiConfig(prev => ({
            ...prev,
            insights: {
                ...prev.insights,
                [insightKey]: {
                    ...prev.insights[insightKey],
                    [param]: parseInt(value) || 0
                }
            }
        }));
        setHasChanges(true);
    };

    const updateThreshold = (key, value) => {
        setAiConfig(prev => ({
            ...prev,
            thresholds: {
                ...prev.thresholds,
                [key]: parseFloat(value) || 0
            }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ ai: aiConfig });
        setHasChanges(false);
    };

    const insights = [
        { key: 'glucoseTrend', label: 'Glucose Trend Analysis', description: 'Analyze glucose patterns over time', hasMinData: true },
        { key: 'weightTrend', label: 'Weight Trend Analysis', description: 'Track weight changes', hasMinData: true },
        { key: 'hba1cStatus', label: 'HbA1c Status', description: 'Evaluate HbA1c levels', hasMinData: false },
        { key: 'creatinineStatus', label: 'Creatinine Status', description: 'Monitor kidney function', hasMinData: false },
        { key: 'glucosePatterns', label: 'Glucose Patterns', description: 'Detect recurring patterns', hasMinData: false }
    ];

    return (
        <div className="ai-control-center">
            <div className="module-header">
                <h2>AI Control Center</h2>
                <p className="subtitle">Configure AI insights, thresholds, and analysis behavior</p>
            </div>

            <div className="control-sections">
                {/* Master AI Toggle */}
                <section className="control-section">
                    <div className="master-toggle">
                        <div className="toggle-info">
                            <Brain size={32} />
                            <div>
                                <h3>AI System</h3>
                                <p>Enable or disable all AI-powered features</p>
                            </div>
                        </div>
                        <button
                            className={`toggle-btn-large ${aiConfig.enabled ? 'enabled' : 'disabled'}`}
                            onClick={toggleAI}
                        >
                            {aiConfig.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            <span>{aiConfig.enabled ? 'ENABLED' : 'DISABLED'}</span>
                        </button>
                    </div>
                </section>

                {/* AI Insights */}
                <section className="control-section">
                    <div className="section-header">
                        <TrendingUp size={24} />
                        <h3>AI Insights</h3>
                    </div>

                    <div className="insights-grid">
                        {insights.map(({ key, label, description, hasMinData }) => {
                            const insight = aiConfig.insights?.[key] || {};

                            return (
                                <div key={key} className="insight-card">
                                    <div className="insight-header">
                                        <div className="insight-info">
                                            <h4>{label}</h4>
                                            <p>{description}</p>
                                        </div>
                                        <button
                                            className={`toggle-btn ${insight.enabled ? 'enabled' : 'disabled'}`}
                                            onClick={() => toggleInsight(key)}
                                            disabled={!aiConfig.enabled}
                                        >
                                            {insight.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                    </div>

                                    {hasMinData && insight.enabled && (
                                        <div className="insight-params">
                                            <label>
                                                Min Data Points: {insight.minDataPoints || 0}
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={insight.minDataPoints || 1}
                                                    onChange={(e) => updateInsightParam(key, 'minDataPoints', e.target.value)}
                                                    disabled={!aiConfig.enabled}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* AI Thresholds */}
                <section className="control-section">
                    <div className="section-header">
                        <h3>AI Thresholds</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>Minimum Confidence: {(aiConfig.thresholds?.minConfidence || 0.7) * 100}%</label>
                            <input
                                type="range"
                                min="0.5"
                                max="1.0"
                                step="0.05"
                                value={aiConfig.thresholds?.minConfidence || 0.7}
                                onChange={(e) => updateThreshold('minConfidence', e.target.value)}
                                disabled={!aiConfig.enabled}
                            />
                            <small>Minimum confidence level for AI insights to be shown</small>
                        </div>

                        <div className="control-item">
                            <label>Minimum Data Points: {aiConfig.thresholds?.minDataPoints || 3}</label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={aiConfig.thresholds?.minDataPoints || 3}
                                onChange={(e) => updateThreshold('minDataPoints', e.target.value)}
                                disabled={!aiConfig.enabled}
                            />
                            <small>Minimum data points required for analysis</small>
                        </div>
                    </div>
                </section>
            </div>

            {hasChanges && (
                <div className="save-bar">
                    <button onClick={handleSave} className="save-btn" disabled={isSaving}>
                        <Save size={20} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AIControlCenter;
