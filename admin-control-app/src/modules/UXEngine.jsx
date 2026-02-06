/**
 * Module B: UX Engine
 * Control gestures, behaviors, and scroll physics
 */

import React, { useState } from 'react';
import { Save, Hand, Settings, MousePointer } from 'lucide-react';

const UXEngine = ({ config, onUpdate, isSaving }) => {
    const [uxConfig, setUxConfig] = useState(config.ux || {});
    const [hasChanges, setHasChanges] = useState(false);

    const updateGesture = (key, value) => {
        setUxConfig(prev => ({
            ...prev,
            gestures: { ...prev.gestures, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateBehavior = (key, value) => {
        setUxConfig(prev => ({
            ...prev,
            behaviors: { ...prev.behaviors, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateScrollPhysics = (key, value) => {
        setUxConfig(prev => ({
            ...prev,
            scrollPhysics: { ...prev.scrollPhysics, [key]: value }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ ux: uxConfig });
        setHasChanges(false);
    };

    return (
        <div className="ux-engine">
            <div className="module-header">
                <h2>UX Engine</h2>
                <p className="subtitle">Configure gestures, behaviors, and interaction patterns</p>
            </div>

            <div className="control-sections">
                {/* Gestures Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Hand size={24} />
                        <h3>Gestures</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uxConfig.gestures?.doubleTapEnabled || false}
                                    onChange={(e) => updateGesture('doubleTapEnabled', e.target.checked)}
                                />
                                Enable Double Tap
                            </label>
                            <small>Allow double-tap gestures for quick actions</small>
                        </div>

                        <div className="control-item">
                            <label>Long Press Duration: {uxConfig.gestures?.longPressDuration || 500}ms</label>
                            <input
                                type="range"
                                min="200"
                                max="1000"
                                step="50"
                                value={uxConfig.gestures?.longPressDuration || 500}
                                onChange={(e) => updateGesture('longPressDuration', parseInt(e.target.value))}
                            />
                            <small>How long to press before triggering long press action</small>
                        </div>

                        <div className="control-item">
                            <label>Swipe Threshold: {uxConfig.gestures?.swipeThreshold || 50}px</label>
                            <input
                                type="range"
                                min="20"
                                max="100"
                                step="5"
                                value={uxConfig.gestures?.swipeThreshold || 50}
                                onChange={(e) => updateGesture('swipeThreshold', parseInt(e.target.value))}
                            />
                            <small>Minimum distance for swipe gesture recognition</small>
                        </div>
                    </div>
                </section>

                {/* Behaviors Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Settings size={24} />
                        <h3>Behaviors</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uxConfig.behaviors?.autoCollapse || false}
                                    onChange={(e) => updateBehavior('autoCollapse', e.target.checked)}
                                />
                                Auto-collapse Sections
                            </label>
                            <small>Automatically collapse sections when opening new ones</small>
                        </div>

                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uxConfig.behaviors?.floatingPanelAutoDismiss || false}
                                    onChange={(e) => updateBehavior('floatingPanelAutoDismiss', e.target.checked)}
                                />
                                Auto-dismiss Floating Panels
                            </label>
                            <small>Automatically dismiss floating panels after interaction</small>
                        </div>

                        <div className="control-item">
                            <label>Confirmation Level</label>
                            <select
                                value={uxConfig.behaviors?.confirmationLevel || 'medium'}
                                onChange={(e) => updateBehavior('confirmationLevel', e.target.value)}
                            >
                                <option value="low">Low - Minimal confirmations</option>
                                <option value="medium">Medium - Balanced</option>
                                <option value="high">High - Confirm all actions</option>
                            </select>
                            <small>How often to show confirmation dialogs</small>
                        </div>
                    </div>
                </section>

                {/* Scroll Physics Section */}
                <section className="control-section">
                    <div className="section-header">
                        <MousePointer size={24} />
                        <h3>Scroll Physics</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uxConfig.scrollPhysics?.momentum || false}
                                    onChange={(e) => updateScrollPhysics('momentum', e.target.checked)}
                                />
                                Momentum Scrolling
                            </label>
                            <small>Enable inertial scrolling with momentum</small>
                        </div>

                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={uxConfig.scrollPhysics?.bounceEffect || false}
                                    onChange={(e) => updateScrollPhysics('bounceEffect', e.target.checked)}
                                />
                                Bounce Effect
                            </label>
                            <small>Show bounce effect at scroll boundaries</small>
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

export default UXEngine;
