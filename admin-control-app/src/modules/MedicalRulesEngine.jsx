/**
 * Module E: Medical Rules Engine
 * Control vital limits, time rules, and clinical constants
 */

import React, { useState } from 'react';
import { Save, Activity, Clock, AlertTriangle } from 'lucide-react';

const MedicalRulesEngine = ({ config, onUpdate, isSaving }) => {
    const [medicalConfig, setMedicalConfig] = useState(config.medical || {});
    const [hasChanges, setHasChanges] = useState(false);

    const updateVitalLimit = (vital, key, value) => {
        setMedicalConfig(prev => ({
            ...prev,
            vitalLimits: {
                ...prev.vitalLimits,
                [vital]: { ...prev.vitalLimits[vital], [key]: parseFloat(value) || 0 }
            }
        }));
        setHasChanges(true);
    };

    const updateTimeRule = (key, value) => {
        setMedicalConfig(prev => ({
            ...prev,
            timeRules: { ...prev.timeRules, [key]: parseInt(value) || 0 }
        }));
        setHasChanges(true);
    };

    const updateClinicalConstant = (key, value) => {
        setMedicalConfig(prev => ({
            ...prev,
            clinicalConstants: { ...prev.clinicalConstants, [key]: parseFloat(value) || 0 }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate({ medical: medicalConfig });
        setHasChanges(false);
    };

    return (
        <div className="medical-rules-engine">
            <div className="module-header">
                <h2>Medical Rules Engine</h2>
                <p className="subtitle">Configure vital limits, time rules, and clinical safety constants</p>
            </div>

            <div className="control-sections">
                {/* Vital Limits Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Activity size={24} />
                        <h3>Vital Sign Limits</h3>
                    </div>

                    <div className="vital-limits-grid">
                        {Object.entries(medicalConfig.vitalLimits || {}).map(([vital, limits]) => (
                            <div key={vital} className="vital-card">
                                <h4>{vital.charAt(0).toUpperCase() + vital.slice(1)}</h4>
                                <div className="vital-inputs">
                                    <div className="input-group">
                                        <label>Min</label>
                                        <input
                                            type="number"
                                            value={limits.min}
                                            onChange={(e) => updateVitalLimit(vital, 'min', e.target.value)}
                                            step={limits.step}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Max</label>
                                        <input
                                            type="number"
                                            value={limits.max}
                                            onChange={(e) => updateVitalLimit(vital, 'max', e.target.value)}
                                            step={limits.step}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Unit</label>
                                        <input
                                            type="text"
                                            value={limits.unit}
                                            disabled
                                            className="unit-display"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Step</label>
                                        <input
                                            type="number"
                                            value={limits.step}
                                            onChange={(e) => updateVitalLimit(vital, 'step', e.target.value)}
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Time Rules Section */}
                <section className="control-section">
                    <div className="section-header">
                        <Clock size={24} />
                        <h3>Time Rules</h3>
                    </div>

                    <div className="control-grid">
                        <div className="control-item">
                            <label>Edit Window (minutes)</label>
                            <input
                                type="number"
                                value={medicalConfig.timeRules?.editWindow || 0}
                                onChange={(e) => updateTimeRule('editWindow', e.target.value)}
                                min="0"
                            />
                            <small>How long users can edit entries after creation</small>
                        </div>

                        <div className="control-item">
                            <label>Delete Window (minutes)</label>
                            <input
                                type="number"
                                value={medicalConfig.timeRules?.deleteWindow || 0}
                                onChange={(e) => updateTimeRule('deleteWindow', e.target.value)}
                                min="0"
                            />
                            <small>How long users can delete entries after creation</small>
                        </div>

                        <div className="control-item">
                            <label>Backdate Limit (days)</label>
                            <input
                                type="number"
                                value={medicalConfig.timeRules?.backdateLimit || 0}
                                onChange={(e) => updateTimeRule('backdateLimit', e.target.value)}
                                min="0"
                            />
                            <small>How far back users can create entries</small>
                        </div>

                        <div className="control-item">
                            <label>Duplicate Threshold (minutes)</label>
                            <input
                                type="number"
                                value={medicalConfig.timeRules?.duplicateThreshold || 0}
                                onChange={(e) => updateTimeRule('duplicateThreshold', e.target.value)}
                                min="0"
                            />
                            <small>Minimum time between duplicate entries</small>
                        </div>
                    </div>
                </section>

                {/* Clinical Constants Section */}
                <section className="control-section">
                    <div className="section-header">
                        <AlertTriangle size={24} />
                        <h3>Clinical Safety Constants</h3>
                    </div>

                    <div className="clinical-constants-grid">
                        <div className="constant-group">
                            <h4>Glucose Thresholds (mg/dL)</h4>
                            <div className="control-grid">
                                <div className="control-item">
                                    <label>Severe Hypoglycemia</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.hypoSevere || 0}
                                        onChange={(e) => updateClinicalConstant('hypoSevere', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Hypoglycemia Threshold</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.hypoThreshold || 0}
                                        onChange={(e) => updateClinicalConstant('hypoThreshold', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Target Min</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.targetMin || 0}
                                        onChange={(e) => updateClinicalConstant('targetMin', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Target Max</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.targetMax || 0}
                                        onChange={(e) => updateClinicalConstant('targetMax', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Target Max (Post-meal)</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.targetMaxPost || 0}
                                        onChange={(e) => updateClinicalConstant('targetMaxPost', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Hyperglycemia Threshold</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.hyperThreshold || 0}
                                        onChange={(e) => updateClinicalConstant('hyperThreshold', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Severe Hyperglycemia</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.hyperSevere || 0}
                                        onChange={(e) => updateClinicalConstant('hyperSevere', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Critical High</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.criticalHigh || 0}
                                        onChange={(e) => updateClinicalConstant('criticalHigh', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="constant-group">
                            <h4>Insulin Safety Limits</h4>
                            <div className="control-grid">
                                <div className="control-item">
                                    <label>Absolute Max Dose (units)</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.absoluteMaxDose || 0}
                                        onChange={(e) => updateClinicalConstant('absoluteMaxDose', e.target.value)}
                                        step="0.5"
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Max Bolus Units</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.maxBolusUnits || 0}
                                        onChange={(e) => updateClinicalConstant('maxBolusUnits', e.target.value)}
                                        step="0.5"
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Max Daily Total (units)</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.maxDailyTotal || 0}
                                        onChange={(e) => updateClinicalConstant('maxDailyTotal', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Min Dose Interval (hours)</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.minDoseIntervalHours || 0}
                                        onChange={(e) => updateClinicalConstant('minDoseIntervalHours', e.target.value)}
                                        step="0.5"
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Min Dose Increment (units)</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.minDoseIncrement || 0}
                                        onChange={(e) => updateClinicalConstant('minDoseIncrement', e.target.value)}
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="constant-group">
                            <h4>Duration of Insulin Action (hours)</h4>
                            <div className="control-grid">
                                <div className="control-item">
                                    <label>Rapid Acting</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.diaRapid || 0}
                                        onChange={(e) => updateClinicalConstant('diaRapid', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Short Acting</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.diaShort || 0}
                                        onChange={(e) => updateClinicalConstant('diaShort', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Long Acting</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.diaLong || 0}
                                        onChange={(e) => updateClinicalConstant('diaLong', e.target.value)}
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Ultra Long Acting</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.diaUltraLong || 0}
                                        onChange={(e) => updateClinicalConstant('diaUltraLong', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="constant-group">
                            <h4>IOB Safety Limits (units)</h4>
                            <div className="control-grid">
                                <div className="control-item">
                                    <label>Max Safe IOB</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.maxSafeIOB || 0}
                                        onChange={(e) => updateClinicalConstant('maxSafeIOB', e.target.value)}
                                        step="0.1"
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Hypo IOB Limit</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.hypoIOBLimit || 0}
                                        onChange={(e) => updateClinicalConstant('hypoIOBLimit', e.target.value)}
                                        step="0.1"
                                    />
                                </div>
                                <div className="control-item">
                                    <label>Critical IOB Limit</label>
                                    <input
                                        type="number"
                                        value={medicalConfig.clinicalConstants?.criticalIOBLimit || 0}
                                        onChange={(e) => updateClinicalConstant('criticalIOBLimit', e.target.value)}
                                        step="0.1"
                                    />
                                </div>
                            </div>
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

export default MedicalRulesEngine;
