/**
 * Module G: Med Database & Reminder Control
 * Configure medication database and reminder settings
 */

import React, { useState } from 'react';
import { Save, Pill, Clock, RefreshCw } from 'lucide-react';

const MedDatabaseControl = ({ config, onUpdate, isSaving }) => {
    const [medConfig, setMedConfig] = useState(config.medications || {});
    const [hasChanges, setHasChanges] = useState(false);

    const updateDatabase = (key, value) => {
        setMedConfig(prev => ({
            ...prev,
            database: { ...prev.database, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateReminders = (key, value) => {
        setMedConfig(prev => ({
            ...prev,
            reminders: { ...prev.reminders, [key]: value }
        }));
        setHasChanges(true);
    };

    const updateTiming = (timing, field, value) => {
        setMedConfig(prev => ({
            ...prev,
            reminders: {
                ...prev.reminders,
                defaultTimings: {
                    ...prev.reminders.defaultTimings,
                    [timing]: {
                        ...prev.reminders.defaultTimings[timing],
                        [field]: parseInt(value) || 0
                    }
                }
            }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ medications: medConfig });
        setHasChanges(false);
    };

    const timings = [
        { key: 'Morning', label: 'Morning' },
        { key: 'Breakfast', label: 'Breakfast' },
        { key: 'Lunch', label: 'Lunch' },
        { key: 'Afternoon', label: 'Afternoon' },
        { key: 'Evening', label: 'Evening' },
        { key: 'Dinner', label: 'Dinner' },
        { key: 'Night', label: 'Night' },
        { key: 'Bedtime', label: 'Bedtime' }
    ];

    return (
        <div className="med-database-control">
            <div className="module-header">
                <h2>Medication Database & Reminders</h2>
                <p className="subtitle">Configure medication database and reminder timings</p>
            </div>

            <div className="control-sections">
                {/* Database Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Pill size={24} />
                        <h3>Medication Database</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>Database Version</label>
                            <input
                                type="text"
                                value={medConfig.database?.version || ''}
                                onChange={(e) => updateDatabase('version', e.target.value)}
                                placeholder="5.1"
                            />
                            <small>Current medication database version</small>
                        </div>

                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={medConfig.database?.autoSync || false}
                                    onChange={(e) => updateDatabase('autoSync', e.target.checked)}
                                />
                                Auto-sync Database
                            </label>
                            <small>Automatically sync medication database</small>
                        </div>

                        <div className="control-item">
                            <label>Sync Interval: {Math.floor((medConfig.database?.syncInterval || 86400000) / 3600000)}h</label>
                            <input
                                type="range"
                                min="3600000"
                                max="604800000"
                                step="3600000"
                                value={medConfig.database?.syncInterval || 86400000}
                                onChange={(e) => updateDatabase('syncInterval', parseInt(e.target.value))}
                                disabled={!medConfig.database?.autoSync}
                            />
                            <small>How often to sync the database</small>
                        </div>
                    </div>
                </section>

                {/* Reminders Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Clock size={24} />
                        <h3>Reminder Settings</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={medConfig.reminders?.enabled || false}
                                    onChange={(e) => updateReminders('enabled', e.target.checked)}
                                />
                                Enable Medication Reminders
                            </label>
                        </div>
                    </div>

                    <div className="timings-section">
                        <h4>Default Reminder Timings</h4>
                        <div className="timings-grid">
                            {timings.map(({ key, label }) => {
                                const timing = medConfig.reminders?.defaultTimings?.[key] || { hour: 0, minute: 0 };

                                return (
                                    <div key={key} className="timing-item">
                                        <label>{label}</label>
                                        <div className="time-inputs">
                                            <input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={timing.hour}
                                                onChange={(e) => updateTiming(key, 'hour', e.target.value)}
                                                placeholder="HH"
                                                disabled={!medConfig.reminders?.enabled}
                                            />
                                            <span>:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={timing.minute}
                                                onChange={(e) => updateTiming(key, 'minute', e.target.value)}
                                                placeholder="MM"
                                                disabled={!medConfig.reminders?.enabled}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Frequency Rules Info */}
                <section className="control-section">
                    <div className="section-header">
                        <RefreshCw size={24} />
                        <h3>Frequency Rules</h3>
                    </div>

                    <div className="frequency-info">
                        <p>Frequency rules map medication schedules to reminder timings:</p>
                        <ul>
                            <li><strong>Once Daily:</strong> Morning</li>
                            <li><strong>Twice Daily:</strong> Morning, Evening</li>
                            <li><strong>Thrice Daily:</strong> Morning, Afternoon, Evening</li>
                            <li><strong>Bedtime:</strong> Bedtime</li>
                            <li><strong>Before Meals:</strong> Breakfast, Lunch, Dinner</li>
                            <li><strong>SOS:</strong> As Needed</li>
                        </ul>
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

export default MedDatabaseControl;
