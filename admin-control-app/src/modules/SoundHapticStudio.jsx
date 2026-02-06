/**
 * Module C: Sound & Haptic Studio
 * Configure sound effects and haptic feedback
 */

import React, { useState } from 'react';
import { Save, Volume2, Vibrate } from 'lucide-react';

const SoundHapticStudio = ({ config, onUpdate, isSaving }) => {
    const [soundHapticConfig, setConfig] = useState(config.sound_haptic || {});
    const [hasChanges, setHasChanges] = useState(false);

    const updateSound = (key, value) => {
        setConfig(prev => ({
            ...prev,
            sound: { ...prev.sound, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateSoundTrigger = (trigger, value) => {
        setConfig(prev => ({
            ...prev,
            sound: {
                ...prev.sound,
                triggers: { ...prev.sound.triggers, [trigger]: value }
            }
        }));
        setHasChanges(true);
    };

    const updateHaptic = (key, value) => {
        setConfig(prev => ({
            ...prev,
            haptic: { ...prev.haptic, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateHapticTrigger = (trigger, value) => {
        setConfig(prev => ({
            ...prev,
            haptic: {
                ...prev.haptic,
                triggers: { ...prev.haptic.triggers, [trigger]: value }
            }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ sound_haptic: soundHapticConfig });
        setHasChanges(false);
    };

    const soundStyles = ['silent', 'subtle', 'premium'];
    const soundTypes = ['success', 'error', 'click', 'tick'];
    const hapticIntensities = ['light', 'medium', 'strong'];
    const hapticTypes = ['success', 'warning', 'selection', 'light'];

    const triggers = [
        { key: 'save', label: 'Save Action' },
        { key: 'delete', label: 'Delete Action' },
        { key: 'toggle', label: 'Toggle Switch' },
        { key: 'pillSelect', label: 'Pill Selection' },
        { key: 'navigation', label: 'Navigation' }
    ];

    return (
        <div className="sound-haptic-studio">
            <div className="module-header">
                <h2>Sound & Haptic Studio</h2>
                <p className="subtitle">Configure audio feedback and haptic responses</p>
            </div>

            <div className="control-sections">
                {/* Sound Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Volume2 size={24} />
                        <h3>Sound Effects</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={soundHapticConfig.sound?.enabled || false}
                                    onChange={(e) => updateSound('enabled', e.target.checked)}
                                />
                                Enable Sound Effects
                            </label>
                        </div>

                        <div className="control-item">
                            <label>Sound Style</label>
                            <select
                                value={soundHapticConfig.sound?.style || 'premium'}
                                onChange={(e) => updateSound('style', e.target.value)}
                                disabled={!soundHapticConfig.sound?.enabled}
                            >
                                {soundStyles.map(style => (
                                    <option key={style} value={style}>
                                        {style.charAt(0).toUpperCase() + style.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <small>Overall sound design aesthetic</small>
                        </div>
                    </div>

                    <div className="triggers-section">
                        <h4>Sound Triggers</h4>
                        <div className="triggers-grid">
                            {triggers.map(({ key, label }) => (
                                <div key={key} className="trigger-item">
                                    <label>{label}</label>
                                    <select
                                        value={soundHapticConfig.sound?.triggers?.[key] || 'click'}
                                        onChange={(e) => updateSoundTrigger(key, e.target.value)}
                                        disabled={!soundHapticConfig.sound?.enabled}
                                    >
                                        {soundTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Haptic Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Vibrate size={24} />
                        <h3>Haptic Feedback</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={soundHapticConfig.haptic?.enabled || false}
                                    onChange={(e) => updateHaptic('enabled', e.target.checked)}
                                />
                                Enable Haptic Feedback
                            </label>
                        </div>

                        <div className="control-item">
                            <label>Haptic Intensity</label>
                            <select
                                value={soundHapticConfig.haptic?.intensity || 'medium'}
                                onChange={(e) => updateHaptic('intensity', e.target.value)}
                                disabled={!soundHapticConfig.haptic?.enabled}
                            >
                                {hapticIntensities.map(intensity => (
                                    <option key={intensity} value={intensity}>
                                        {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <small>Overall haptic feedback strength</small>
                        </div>
                    </div>

                    <div className="triggers-section">
                        <h4>Haptic Triggers</h4>
                        <div className="triggers-grid">
                            {triggers.map(({ key, label }) => (
                                <div key={key} className="trigger-item">
                                    <label>{label}</label>
                                    <select
                                        value={soundHapticConfig.haptic?.triggers?.[key] || 'selection'}
                                        onChange={(e) => updateHapticTrigger(key, e.target.value)}
                                        disabled={!soundHapticConfig.haptic?.enabled}
                                    >
                                        {hapticTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
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

export default SoundHapticStudio;
