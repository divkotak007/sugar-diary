import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Save, Trash2, Lock, Edit3, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { SimpleTrendGraph, GraphErrorBoundary } from './SimpleTrendGraph';
import { canEdit, safeEpoch, toInputString, fromInputString, getEpoch, isFuture } from '../utils/time';

const VitalDeepView = ({ vitalType, initialData, fullHistory, onSave, onClose, onDelete, onEdit, isCaregiverMode }) => {
    // STRICT STATE ISOLATION: Managed entirely within this component
    // No shared state with parent for form inputs
    const [value, setValue] = useState('');
    const [logTime, setLogTime] = useState(() => toInputString(new Date()));
    const [isManualEdit, setIsManualEdit] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [editingLogId, setEditingLogId] = useState(null);

    // Vital Configuration
    const config = useMemo(() => {
        switch (vitalType) {
            case 'weight': return { label: 'Weight', unit: 'kg', color: 'orange', min: 1, max: 1000, step: 0.1, emoji: '⚖️' };
            case 'hba1c': return { label: 'HbA1c', unit: '%', color: 'emerald', min: 3, max: 20, step: 0.1, emoji: '🩸', normalRange: 5.7 };
            case 'creatinine': return { label: 'Creatinine', unit: 'mg/dL', color: 'purple', min: 0.1, max: 15, step: 0.01, emoji: '🧪', normalRange: 1.2 };
            default: return { label: 'Unknown', unit: '', color: 'stone', min: 0, max: 100, step: 1, emoji: '❓' };
        }
    }, [vitalType]);

    // STRICT DATA FILTERING: Filter history locally to ensure zero cross-contamination
    const relevantHistory = useMemo(() => {
        const uniqueIds = new Set();
        const sorted = [...fullHistory]
            .filter(log => {
                // Issue 3: STRICT Cross-Logging Prevention
                // If it has a type, it MUST be 'vital_update'
                if (log.type) {
                    if (log.type === 'vital_update') {
                        return log.updatedParams && log.updatedParams.includes(vitalType);
                    }
                    return false; // Reject 'diary', 'medication', etc.
                }

                // Legacy fallback (only for logs with NO type)
                return log.snapshot?.profile?.[vitalType] !== undefined &&
                    log.snapshot.profile[vitalType] !== null &&
                    !isNaN(parseFloat(log.snapshot.profile[vitalType]));
            })
            .filter(log => {
                // Issue 2: Deduplication
                if (uniqueIds.has(log.id)) return false;
                uniqueIds.add(log.id);
                return true;
            })
            .sort((a, b) => safeEpoch(b.timestamp) - safeEpoch(a.timestamp));

        return sorted;
    }, [fullHistory, vitalType]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        return relevantHistory
            .map(log => ({
                id: log.id,
                date: safeEpoch(log.timestamp),
                value: parseFloat(log.snapshot.profile[vitalType])
            }))
            .sort((a, b) => a.date - b.date);
    }, [relevantHistory, vitalType]);

    // Handle Edit Mode from History
    useEffect(() => {
        if (initialData) {
            // If we opened this view with specific intent to edit a log
            // (Note: The parent might pass this, or we handle it internally if we move edit logic here)
            // For now, adhere to the "Clean Slate" rule unless explicitly editing
        }
    }, [initialData]);

    const handleSave = () => {
        if (!value) return alert("Please enter a value.");
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal < config.min || numVal > config.max) {
            return alert(`Invalid ${config.label}. Must be between ${config.min} and ${config.max}.`);
        }

        const timestamp = isManualEdit ? fromInputString(logTime) : getEpoch();

        if (isFuture(timestamp)) {
            return alert("Future entries are not allowed. Please check the date and time.");
        }

        // Construct payload strictly for this vital
        const payload = {
            [vitalType]: value
        };

        onSave(payload, timestamp, editingLogId);

        // Reset after save
        setValue('');
        setEditingLogId(null);
        setIsManualEdit(false);
        setLogTime(toInputString(new Date()));
    };

    const startEdit = (log) => {
        const val = log.snapshot.profile[vitalType];
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
        <div className="fixed inset-0 z-[60] bg-[#fffbf5] animate-in slide-in-from-right duration-300 overflow-y-auto">
            {/* HEADER */}
            <div className={`sticky top-0 z-20 bg-[#fffbf5]/80 backdrop-blur-md px-6 py-4 border-b border-${config.color}-100 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.emoji}</span>
                    <div>
                        <h2 className={`text-2xl font-black text-${config.color}-700 tracking-tight leading-none`}>{config.label}</h2>
                        <span className={`text-xs font-bold text-${config.color}-400 uppercase tracking-widest`}>Deep View</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors">
                    <X size={24} className="text-stone-600" />
                </button>
            </div>

            <div className="p-6 space-y-8 pb-32">
                {/* ORDER 1: VITAL UPDATE INPUT */}
                {!isCaregiverMode && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className={`bg-white p-6 rounded-[32px] shadow-sm border border-${config.color}-100 ring-4 ring-transparent focus-within:ring-${config.color}-50 transition-all`}>
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
                                    onChange={(e) => setValue(e.target.value)}
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
                                        <button onClick={handleSave} className={`flex-1 bg-${config.color}-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-${config.color}-200 hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2`}>
                                            <Save size={20} /> Update
                                        </button>
                                        <button onClick={cancelEdit} className="px-6 bg-stone-100 text-stone-500 py-4 rounded-2xl font-bold hover:bg-stone-200 active:scale-95 transition-all">
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={handleSave} className={`w-full bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2`}>
                                        <Save size={20} /> Save Entry
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* ORDER 2: VITAL SPECIFIC CHART */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
                        {/* Issue 4 & 1: No Section Header (Internal Header Used), Explicit Height */}
                        <GraphErrorBoundary>
                            <SimpleTrendGraph
                                data={chartData}
                                label={config.label}
                                unit={config.unit}
                                color={config.color}
                                normalRange={config.normalRange}
                                onClick={() => { }} // No expansion needed inside deep view
                                height={250} // Explicit Expanded Height
                            />
                        </GraphErrorBoundary>
                    </div>
                </section>

                {/* ORDER 3: VITAL LOG / HISTORY */}
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
                                    const logVal = log.snapshot.profile[vitalType];

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
            </div>
        </div>
    );
};

export default VitalDeepView;
