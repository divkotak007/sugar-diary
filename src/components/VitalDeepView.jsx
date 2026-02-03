import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Save, Trash2, Lock, Edit3, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { SimpleTrendGraph, GraphErrorBoundary } from './SimpleTrendGraph';
import { canEdit, safeEpoch, toInputString, fromInputString, getEpoch, isFuture } from '../utils/time';
import { VITAL_LIMITS } from '../data/vitalLimits';

const VitalDeepView = ({ vitalType, initialData, fullHistory, onSave, onClose, onDelete, onEdit, isCaregiverMode, extraValue, graphData }) => {
    // STRICT STATE ISOLATION: Managed entirely within this component
    // No shared state with parent for form inputs
    const [value, setValue] = useState('');
    const [logTime, setLogTime] = useState(() => toInputString(new Date()));
    const [isManualEdit, setIsManualEdit] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [editingLogId, setEditingLogId] = useState(null);
    const [isSaving, setIsSaving] = useState(false); // D2: UI Lock

    // Vital Configuration (C2: Centralized Limits)
    const config = useMemo(() => {
        const limits = VITAL_LIMITS[vitalType] || { min: 0, max: 100, unit: '', step: 1 };
        switch (vitalType) {
            case 'weight': return { ...limits, label: 'Weight', color: 'orange', emoji: '⚖️' };
            case 'hba1c': return { ...limits, label: 'HbA1c', color: 'emerald', emoji: '🩸', normalRange: 5.7 };
            case 'creatinine': return { ...limits, label: 'Creatinine', color: 'purple', emoji: '🧪', normalRange: 1.2 };
            case 'est_hba1c': return { ...limits, label: 'Est. HbA1c', color: 'stone', emoji: '🎯', normalRange: 5.7 };
            default: return { ...limits, label: 'Unknown', color: 'stone', emoji: '❓' };
        }
    }, [vitalType]);

    // V4: PASS-THROUGH LOGS (Decoupled)
    // The parent now passes strictly isolated logs. No filtering needed.
    const relevantHistory = useMemo(() => {
        return fullHistory || []; // Renamed prop to 'logs' in V5 step, but keeping compatible for now.
        // Actually, let's assume 'fullHistory' prop now receives the isolated logs array
    }, [fullHistory]);

    // Prepare Chart Data (Unified Source of Truth)
    const chartData = useMemo(() => {
        if (graphData) return graphData; // Priority 1: Use Prop from Parent (Profile Source)

        return relevantHistory
            .map(log => ({
                id: log.id,
                date: safeEpoch(log.timestamp),
                // V5: Schema Update - Use 'value' or legacy fallback
                value: log.value !== undefined ? parseFloat(log.value) : parseFloat(log.snapshot?.profile?.[vitalType] || 0)
            }))
            .sort((a, b) => a.date - b.date);
    }, [relevantHistory, vitalType, graphData]);

    // Handle Edit Mode from History
    useEffect(() => {
        if (initialData) {
            // If we opened this view with specific intent to edit a log
            // (Note: The parent might pass this, or we handle it internally if we move edit logic here)
            // For now, adhere to the "Clean Slate" rule unless explicitly editing
        }
    }, [initialData]);

    const handleSave = async () => {
        if (isSaving) return; // Prevent double click

        if (!value) return alert("Please enter a value.");
        if (!config) return alert("System Error: Limit configuration missing.");

        let numVal = parseFloat(value);

        // C2: Limit Enforcement (Clamp on Save)
        if (isNaN(numVal)) return alert("Invalid number.");

        // Auto-clamp if strictly outside (User Rule: "on_user_input_below_min" -> auto_clamp)
        if (numVal < config.min) {
            numVal = config.min;
            // Optional: Notify user of clamp? Or silent? Rule says "silent_correction_allowed"
        }
        if (numVal > config.max) {
            numVal = config.max;
        }

        // Double check after clamp (Should be safe)
        if (numVal < config.min || numVal > config.max) {
            return alert(`Invalid ${config.label}. Must be between ${config.min} and ${config.max} ${config.unit}.`);
        }

        const timestamp = isManualEdit ? fromInputString(logTime) : getEpoch();

        if (isFuture(timestamp)) {
            return alert("Future entries are not allowed. Please check the date and time.");
        }

        // Construct payload strictly for this vital
        const payload = {
            [vitalType]: numVal.toString() // Store as string for consistency with existing app
        };

        setIsSaving(true);
        // D1: Expect boolean return from parent
        const success = await onSave(payload, timestamp, editingLogId);

        if (success) {
            // Reset after save
            setValue('');
            setEditingLogId(null);
            setIsManualEdit(false);
            setLogTime(toInputString(new Date()));
            setIsSaving(false);
        } else {
            setIsSaving(false); // Re-enable on failure
        }
    };

    const startEdit = (log) => {
        // V5: Schema Update
        const val = log.value !== undefined ? log.value : log.snapshot?.profile?.[vitalType];
        setValue(val);
        setLogTime(toInputString(log.timestamp));
        setEditingLogId(log.id);
        setIsManualEdit(true); // Treat as manual time since we are loading an old time
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setValue('');
        setEditingLogId(null);
        setIsManualEdit(false);
        setLogTime(toInputString(new Date()));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg h-[85%] bg-[#fffbf5]/90 backdrop-blur-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/50 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div className={`relative z-20 bg-white/50 px-6 py-4 border-b border-${config.color}-100 flex justify-between items-center flex-shrink-0`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{config.emoji}</span>
                        <div>
                            <h2 className={`text-2xl font-black text-${config.color}-700 tracking-tight leading-none`}>{config.label}</h2>
                            <span className={`text-xs font-bold text-${config.color}-400 uppercase tracking-widest`}>Deep View</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/80 rounded-full hover:bg-stone-100 transition-colors shadow-sm">
                        <X size={24} className="text-stone-600" />
                    </button>
                </div>

                {/* RESTORE: Est. HbA1c Big Value Display */}
                {extraValue && (
                    <div className="bg-white/50 px-6 py-4 flex flex-col items-center justify-center border-b border-stone-100">
                        <div className="text-5xl font-black text-stone-800 tracking-tighter">{extraValue}%</div>
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">Estimated Current</div>
                    </div>
                )}

                <div className="p-6 space-y-8 pb-32 overflow-y-auto flex-1">
                    {/* ORDER 1: VITAL UPDATE INPUT */}
                    {(!isCaregiverMode && vitalType !== 'est_hba1c') && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <div className={`bg-white p-6 rounded-[24px] shadow-sm border border-${config.color}-100 transition-all`}>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                        {editingLogId ? <Edit3 size={12} className="text-emerald-500" /> : <Calendar size={12} />}
                                        {editingLogId ? "Editing Record" : "New Entry"}
                                    </label>
                                    <div className="flex items-center gap-2 opacity-50 focus-within:opacity-100 transition-opacity">
                                        <input
                                            type="datetime-local"
                                            value={logTime}
                                            onChange={(e) => { setLogTime(e.target.value); setIsManualEdit(true); }}
                                            className="text-xs font-bold text-stone-500 bg-transparent outline-none text-right"
                                            disabled={!!editingLogId}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-2 mb-6">
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => {
                                            // C2: Immediate Max Clamping
                                            let v = e.target.value;
                                            if (parseFloat(v) > config.max) v = config.max.toString();
                                            setValue(v);
                                        }}
                                        placeholder="---"
                                        step={config.step}
                                        className={`w-full text-6xl font-black text-${config.color}-600 placeholder-${config.color}-200 bg-transparent outline-none`}
                                        autoFocus
                                    />
                                    <span className="text-xl font-bold text-stone-400">{config.unit}</span>
                                </div>

                                <div className="flex gap-3">
                                    {editingLogId ? (
                                        <>
                                            <button onClick={handleSave} disabled={isSaving} className={`flex-1 bg-${config.color}-600 text-white py-4 rounded-full font-bold shadow-lg shadow-${config.color}-200 hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                {isSaving ? <span className="animate-pulse">Updating...</span> : <><Save size={20} /> Update</>}
                                            </button>
                                            <button onClick={cancelEdit} disabled={isSaving} className="px-6 bg-stone-100 text-stone-500 py-4 rounded-full font-bold hover:bg-stone-200 active:scale-95 transition-all">
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={handleSave} disabled={isSaving} className={`w-full bg-stone-900 text-white py-4 rounded-full font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {isSaving ? <span className="animate-pulse">Saving...</span> : <><Save size={20} /> Save Entry</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ORDER 2: VITAL SPECIFIC CHART (HIDDEN FOR EST_HBA1C) */}
                    {vitalType !== 'est_hba1c' && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            {/* B2: Scrollable Graph Container */}
                            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-stone-100">
                                <GraphErrorBoundary>
                                    <SimpleTrendGraph
                                        data={chartData}
                                        label={config.label}
                                        unit={config.unit}
                                        color={config.color}
                                        normalRange={config.normalRange}
                                        onClick={() => { }}
                                        height={250}
                                        scrollable={true}
                                    />
                                </GraphErrorBoundary>
                            </div>
                        </section>
                    )}

                    {/* B3: Est. HbA1c INFO CARD */}
                    {vitalType === 'est_hba1c' && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <div className="bg-white rounded-[32px] shadow-sm border border-stone-100 overflow-hidden">
                                <details className="group open:pb-4" open>
                                    <summary className="flex justify-between items-center p-6 cursor-pointer list-none select-none active:bg-stone-50 transition-colors">
                                        <div>
                                            <h3 className="text-lg font-bold text-stone-700">What is Estimated HbA1c?</h3>
                                            <p className="text-xs text-stone-400 mt-1">Educational Information</p>
                                        </div>
                                        <ChevronDown className="text-stone-400 group-open:rotate-180 transition-transform" />
                                    </summary>

                                    <div className="px-6 space-y-6">
                                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                            <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Meaning</h4>
                                            <p className="text-sm text-stone-600 leading-relaxed">
                                                Estimated HbA1c (eST HbA1c) is an approximate value derived from your blood sugar readings. It is <strong>not</strong> a lab test.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">How it is estimated</h4>
                                            <p className="text-sm text-stone-600 leading-relaxed">
                                                Average blood sugar values over time are mathematically converted to an HbA1c-equivalent number for easier understanding using the GMI formula.
                                            </p>
                                        </div>

                                        <div className="bg-stone-50 p-4 rounded-xl border border-dashed border-stone-200">
                                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Formula (Reference Only)</h4>
                                            <div className="font-mono text-center text-lg text-stone-500 mb-2">(28.7 × Avg Glucose) − 46.7</div>
                                            <p className="text-[10px] text-stone-400 italic text-center">
                                                Shown only for education. This formula is not editable and does not drive app calculations.
                                            </p>
                                        </div>

                                        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-800">
                                            <div className="mt-1"><ScrollText size={16} /></div>
                                            <div className="text-xs font-medium leading-relaxed">
                                                <strong>Important Note:</strong> eST HbA1c is an estimate and may differ from lab-measured HbA1c. Always rely on lab reports for clinical decisions.
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </section>
                    )}

                    {/* ORDER 3: VITAL LOG / HISTORY */}
                    {vitalType !== 'est_hba1c' && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                            <div className="bg-stone-50 rounded-[32px] border border-stone-100 overflow-hidden">
                                <button
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                    className="w-full flex justify-between items-center p-6 bg-stone-100/50 hover:bg-stone-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <ScrollText size={20} className="text-stone-400" />
                                        <span className="font-bold text-stone-600 uppercase text-xs tracking-widest">History Log</span>
                                        <span className="bg-stone-200 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{relevantHistory.length}</span>
                                    </div>
                                    {isHistoryOpen ? <ChevronUp size={20} className="text-stone-400" /> : <ChevronDown size={20} className="text-stone-400" />}
                                </button>

                                {isHistoryOpen && (
                                    <div className="p-4 space-y-3">
                                        {relevantHistory.map(log => {
                                            const dateObj = new Date(safeEpoch(log.timestamp));
                                            const isLocked = !canEdit(log.timestamp);
                                            // V5: Schema Update
                                            const logVal = log.value !== undefined ? log.value : log.snapshot?.profile?.[vitalType];

                                            return (
                                                <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-center min-w-[50px]">
                                                            <div className="text-[10px] font-black text-stone-300 uppercase">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</div>
                                                            <div className="text-lg font-black text-stone-700 leading-none">{dateObj.getDate()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className={`text-xl font-black text-${config.color}-600`}>{logVal}</span>
                                                                <span className="text-[10px] font-bold text-stone-400">{config.unit}</span>
                                                            </div>
                                                            <div className="text-[10px] text-stone-400 font-medium">
                                                                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!isCaregiverMode && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => startEdit(log)}
                                                                disabled={isLocked}
                                                                className={`p-2 rounded-xl transition-colors ${isLocked ? 'bg-stone-50 text-stone-200 cursor-not-allowed' : 'bg-stone-50 text-stone-400 hover:bg-blue-50 hover:text-blue-500'}`}
                                                            >
                                                                {isLocked ? <Lock size={16} /> : <Edit3 size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(log.id)}
                                                                className={`p-2 rounded-xl transition-colors bg-stone-50 text-red-400 hover:bg-red-50 hover:text-red-500`}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {relevantHistory.length === 0 && (
                                            <div className="text-center py-8 text-stone-400 text-xs font-medium italic">
                                                No history available yet.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VitalDeepView;
