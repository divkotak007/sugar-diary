/**
 * Module H: Live Preview Mode
 * Preview configuration changes before deploying to production
 */

import React, { useState } from 'react';
import { Eye, RefreshCw, CheckCircle, AlertCircle, Smartphone, Monitor } from 'lucide-react';

const LivePreview = ({ config }) => {
    const [previewMode, setPreviewMode] = useState('mobile');
    const [selectedModule, setSelectedModule] = useState('ui');

    const modules = [
        { id: 'ui', label: 'UI Preview', icon: Monitor },
        { id: 'features', label: 'Feature Flags', icon: CheckCircle },
        { id: 'medical', label: 'Medical Rules', icon: AlertCircle },
        { id: 'ai', label: 'AI Insights', icon: RefreshCw }
    ];

    const renderUIPreview = () => {
        const uiConfig = config.ui || {};

        return (
            <div className="preview-container">
                <div className="preview-card" style={{
                    fontFamily: uiConfig.typography?.fontFamily,
                    fontSize: `${(uiConfig.typography?.sizeScale || 1) * 16}px`
                }}>
                    <h3 style={{ color: uiConfig.colors?.light?.primary }}>Sample Card</h3>
                    <p style={{ color: uiConfig.colors?.light?.text }}>
                        This is how your UI will look with the current configuration.
                    </p>
                    <div className="preview-buttons">
                        <button style={{
                            background: uiConfig.colors?.light?.primary,
                            borderRadius: uiConfig.shapes?.buttonRadius,
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            Primary Button
                        </button>
                        <button style={{
                            background: uiConfig.colors?.light?.secondary,
                            borderRadius: uiConfig.shapes?.buttonRadius,
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            Secondary Button
                        </button>
                    </div>
                    <div className="preview-card-inner" style={{
                        background: uiConfig.colors?.light?.surface,
                        borderRadius: uiConfig.shapes?.cardRadius,
                        padding: '1rem',
                        marginTop: '1rem'
                    }}>
                        <p style={{ color: uiConfig.colors?.light?.text }}>
                            Card with radius: {uiConfig.shapes?.cardRadius}
                        </p>
                    </div>
                </div>

                <div className="preview-info">
                    <h4>Current Configuration</h4>
                    <ul>
                        <li><strong>Font:</strong> {uiConfig.typography?.fontFamily}</li>
                        <li><strong>Size Scale:</strong> {uiConfig.typography?.sizeScale}x</li>
                        <li><strong>Primary Color:</strong> {uiConfig.colors?.light?.primary}</li>
                        <li><strong>Card Radius:</strong> {uiConfig.shapes?.cardRadius}</li>
                        <li><strong>Animations:</strong> {uiConfig.animations?.enabled ? 'Enabled' : 'Disabled'}</li>
                    </ul>
                </div>
            </div>
        );
    };

    const renderFeaturePreview = () => {
        const features = config.features || {};
        const enabledFeatures = Object.entries(features).filter(([_, f]) => f.enabled);
        const disabledFeatures = Object.entries(features).filter(([_, f]) => !f.enabled);

        return (
            <div className="preview-container">
                <div className="feature-preview">
                    <div className="feature-status enabled">
                        <h4>✅ Enabled Features ({enabledFeatures.length})</h4>
                        <ul>
                            {enabledFeatures.map(([key, feature]) => (
                                <li key={key}>
                                    <strong>{key}</strong>
                                    <span className="rollout-badge">{feature.rollout}% rollout</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="feature-status disabled">
                        <h4>❌ Disabled Features ({disabledFeatures.length})</h4>
                        <ul>
                            {disabledFeatures.map(([key]) => (
                                <li key={key}>{key}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const renderMedicalPreview = () => {
        const medical = config.medical || {};

        return (
            <div className="preview-container">
                <div className="medical-preview">
                    <div className="preview-section">
                        <h4>Glucose Thresholds</h4>
                        <div className="threshold-bar">
                            <div className="threshold severe-low" style={{ width: '15%' }}>
                                Severe Low<br />&lt;{medical.clinicalConstants?.hypoSevere}
                            </div>
                            <div className="threshold low" style={{ width: '15%' }}>
                                Low<br />{medical.clinicalConstants?.hypoSevere}-{medical.clinicalConstants?.hypoThreshold}
                            </div>
                            <div className="threshold target" style={{ width: '40%' }}>
                                Target<br />{medical.clinicalConstants?.targetMin}-{medical.clinicalConstants?.targetMax}
                            </div>
                            <div className="threshold high" style={{ width: '15%' }}>
                                High<br />{medical.clinicalConstants?.hyperThreshold}-{medical.clinicalConstants?.hyperSevere}
                            </div>
                            <div className="threshold severe-high" style={{ width: '15%' }}>
                                Severe High<br />&gt;{medical.clinicalConstants?.hyperSevere}
                            </div>
                        </div>
                    </div>

                    <div className="preview-section">
                        <h4>Safety Limits</h4>
                        <ul>
                            <li><strong>Max Bolus:</strong> {medical.clinicalConstants?.maxBolusUnits} units</li>
                            <li><strong>Max Daily Total:</strong> {medical.clinicalConstants?.maxDailyTotal} units</li>
                            <li><strong>Max Safe IOB:</strong> {medical.clinicalConstants?.maxSafeIOB} units</li>
                            <li><strong>Min Dose Interval:</strong> {medical.clinicalConstants?.minDoseIntervalHours} hours</li>
                        </ul>
                    </div>

                    <div className="preview-section">
                        <h4>Time Rules</h4>
                        <ul>
                            <li><strong>Edit Window:</strong> {medical.timeRules?.editWindow} minutes</li>
                            <li><strong>Delete Window:</strong> {medical.timeRules?.deleteWindow} minutes</li>
                            <li><strong>Backdate Limit:</strong> {medical.timeRules?.backdateLimit} days</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    const renderAIPreview = () => {
        const ai = config.ai || {};
        const enabledInsights = Object.entries(ai.insights || {}).filter(([_, i]) => i.enabled);

        return (
            <div className="preview-container">
                <div className="ai-preview">
                    <div className="ai-status">
                        <h4>AI System Status</h4>
                        <div className={`status-badge ${ai.enabled ? 'active' : 'inactive'}`}>
                            {ai.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}
                        </div>
                    </div>

                    {ai.enabled && (
                        <>
                            <div className="preview-section">
                                <h4>Active Insights ({enabledInsights.length})</h4>
                                <ul>
                                    {enabledInsights.map(([key, insight]) => (
                                        <li key={key}>
                                            <strong>{key}</strong>
                                            {insight.minDataPoints && (
                                                <span className="data-points">
                                                    Min data: {insight.minDataPoints}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="preview-section">
                                <h4>Thresholds</h4>
                                <ul>
                                    <li><strong>Min Confidence:</strong> {(ai.thresholds?.minConfidence || 0.7) * 100}%</li>
                                    <li><strong>Min Data Points:</strong> {ai.thresholds?.minDataPoints || 3}</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderPreview = () => {
        switch (selectedModule) {
            case 'ui':
                return renderUIPreview();
            case 'features':
                return renderFeaturePreview();
            case 'medical':
                return renderMedicalPreview();
            case 'ai':
                return renderAIPreview();
            default:
                return <div>Select a module to preview</div>;
        }
    };

    return (
        <div className="live-preview">
            <div className="module-header">
                <h2>Live Preview Mode</h2>
                <p className="subtitle">Preview your configuration changes before deploying</p>
            </div>

            <div className="preview-controls">
                <div className="device-selector">
                    <button
                        className={`device-btn ${previewMode === 'mobile' ? 'active' : ''}`}
                        onClick={() => setPreviewMode('mobile')}
                    >
                        <Smartphone size={20} />
                        Mobile
                    </button>
                    <button
                        className={`device-btn ${previewMode === 'desktop' ? 'active' : ''}`}
                        onClick={() => setPreviewMode('desktop')}
                    >
                        <Monitor size={20} />
                        Desktop
                    </button>
                </div>

                <div className="module-selector">
                    {modules.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            className={`module-btn ${selectedModule === id ? 'active' : ''}`}
                            onClick={() => setSelectedModule(id)}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`preview-frame ${previewMode}`}>
                {renderPreview()}
            </div>

            <div className="preview-footer">
                <div className="preview-note">
                    <Eye size={20} />
                    <p>This is a live preview of your current configuration. Changes are not yet deployed to production.</p>
                </div>
            </div>
        </div>
    );
};

export default LivePreview;
