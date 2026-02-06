/**
 * Module A: UI Control Panel
 * Control typography, colors, shapes, and animations
 */

import React, { useState } from 'react';
import { Save, Palette, Type, Square, Zap } from 'lucide-react';

const UIControlPanel = ({ config, onUpdate, isSaving }) => {
    const [uiConfig, setUiConfig] = useState(config.ui || {});
    const [hasChanges, setHasChanges] = useState(false);

    const updateTypography = (key, value) => {
        setUiConfig(prev => ({
            ...prev,
            typography: { ...prev.typography, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateColor = (theme, colorKey, value) => {
        setUiConfig(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [theme]: { ...prev.colors[theme], [colorKey]: value }
            }
        }));
        setHasChanges(true);
    };

    const updateShape = (key, value) => {
        setUiConfig(prev => ({
            ...prev,
            shapes: { ...prev.shapes, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateAnimation = (key, value) => {
        setUiConfig(prev => ({
            ...prev,
            animations: { ...prev.animations, [key]: value }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ ui: uiConfig });
        setHasChanges(false);
    };

    return (
        <div className="ui-control-panel">
            <div className="module-header">
                <h2>UI Control Panel</h2>
                <p className="subtitle">Customize typography, colors, shapes, and animations</p>
            </div>

            <div className="control-sections">
                {/* Typography Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Type size={24} />
                        <h3>Typography</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>Font Family</label>
                            <input
                                type="text"
                                value={uiConfig.typography?.fontFamily || ''}
                                onChange={(e) => updateTypography('fontFamily', e.target.value)}
                                placeholder="Inter, system-ui, sans-serif"
                            />
                        </div>

                        <div className="control-item">
                            <label>Size Scale: {uiConfig.typography?.sizeScale || 1.0}</label>
                            <input
                                type="range"
                                min="0.8"
                                max="1.5"
                                step="0.1"
                                value={uiConfig.typography?.sizeScale || 1.0}
                                onChange={(e) => updateTypography('sizeScale', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </section>

                {/* Colors Section - Light Theme */}
                <section className="control-section">
                    <div className="section-header">
                        <Palette size={24} />
                        <h3>Colors - Light Theme</h3>
                    </div>

                    <div className="color-grid">
                        {Object.entries(uiConfig.colors?.light || {}).map(([key, value]) => (
                            <div key={key} className="color-item">
                                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={value}
                                        onChange={(e) => updateColor('light', key, e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => updateColor('light', key, e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Colors Section - Dark Theme */}
                <section className="control-section">
                    <div className="section-header">
                        <Palette size={24} />
                        <h3>Colors - Dark Theme</h3>
                    </div>

                    <div className="color-grid">
                        {Object.entries(uiConfig.colors?.dark || {}).map(([key, value]) => (
                            <div key={key} className="color-item">
                                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={value}
                                        onChange={(e) => updateColor('dark', key, e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => updateColor('dark', key, e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Shapes Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Square size={24} />
                        <h3>Shapes & Elevation</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>Card Radius</label>
                            <input
                                type="text"
                                value={uiConfig.shapes?.cardRadius || ''}
                                onChange={(e) => updateShape('cardRadius', e.target.value)}
                                placeholder="12px"
                            />
                        </div>

                        <div className="control-item">
                            <label>Button Radius</label>
                            <input
                                type="text"
                                value={uiConfig.shapes?.buttonRadius || ''}
                                onChange={(e) => updateShape('buttonRadius', e.target.value)}
                                placeholder="8px"
                            />
                        </div>

                        <div className="control-item">
                            <label>Input Radius</label>
                            <input
                                type="text"
                                value={uiConfig.shapes?.inputRadius || ''}
                                onChange={(e) => updateShape('inputRadius', e.target.value)}
                                placeholder="8px"
                            />
                        </div>

                        <div className="control-item">
                            <label>Elevation</label>
                            <select
                                value={uiConfig.shapes?.elevation || 'medium'}
                                onChange={(e) => updateShape('elevation', e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="control-item">
                            <label>Shadow Depth: {uiConfig.shapes?.shadowDepth || 3}</label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={uiConfig.shapes?.shadowDepth || 3}
                                onChange={(e) => updateShape('shadowDepth', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </section>

                {/* Animations Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Zap size={24} />
                        <h3>Animations</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uiConfig.animations?.enabled || false}
                                    onChange={(e) => updateAnimation('enabled', e.target.checked)}
                                />
                                Enable Animations
                            </label>
                        </div>

                        <div className="control-item">
                            <label>Speed: {uiConfig.animations?.speed || 1.0}x</label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={uiConfig.animations?.speed || 1.0}
                                onChange={(e) => updateAnimation('speed', parseFloat(e.target.value))}
                                disabled={!uiConfig.animations?.enabled}
                            />
                        </div>

                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uiConfig.animations?.reducedMotion || false}
                                    onChange={(e) => updateAnimation('reducedMotion', e.target.checked)}
                                />
                                Reduced Motion
                            </label>
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

export default UIControlPanel;
