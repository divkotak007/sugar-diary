import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, X, TrendingUp, ScrollText, ChevronDown, ChevronUp, Edit3, Trash2, Lock, BookOpen } from 'lucide-react';
import { canEdit, safeEpoch } from '../utils/time';

const ExpandedGraphModal = ({ data, color, label, unit, normalRange, onClose, fullHistory, onEdit, onDelete }) => {
    const containerRef = useRef(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const height = 300;
    const padding = 40;

    // Crash Prevention
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[32px] w-full max-w-sm text-center">
                    <AlertCircle size={48} className="mx-auto text-stone-300 mb-4" />
                    <h3 className="text-xl font-bold text-stone-800 mb-2">No Data Points</h3>
                    <button onClick={onClose} className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold">Close View</button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }, [data]);

    const values = data.map(d => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const dataRange = (dataMax - dataMin) || (dataMax * 0.1) || 1;
    const min = dataMin - (dataRange * 0.4);
    const max = dataMax + (dataRange * 0.4);
    const range = max - min || 1;

    const screenWidth = Math.min(window.innerWidth - 48, 600);
    const pointsPerView = 5;
    const pointSpacing = screenWidth / pointsPerView;
    const graphWidth = Math.max(screenWidth, data.length * pointSpacing);

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 === 0 ? 1 : data.length - 1)) * (graphWidth - 2 * padding);
        const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
        return { x, y, val: d.value, date: d.date, id: d.id };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Filter history for this specific vital
    const vitalType = label.toLowerCase();

    // 1. Get the exact data points used in the graph (already filtered/deduplicated)
    const graphPointIds = new Set(data.map(d => d.id));

    const relevantLogs = [...fullHistory]
        .filter(log => {
            // PRIMARY RULE: Only show logs that are actual data points in the graph
            if (graphPointIds.has(log.id)) return true;

            // SECONDARY RULE: For recent 'vital_update' logs that might not be in graph yet (edge case)
            if (log.type === 'vital_update') {
                return log.updatedParams && log.updatedParams.includes(vitalType);
            }

            // Strict Fallback: Do not show generic logs unless they are graph points
            return false;
        })
        .sort((a, b) => {
            // Fix: Use strict safeEpoch for comparison
            return safeEpoch(b.timestamp) - safeEpoch(a.timestamp);
        });

    return (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in fade-in flex flex-col">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-6 border-b border-stone-100 flex justify-between items-center">
                <div>
                    <h3 className={`text-2xl font-black text-${color}-600 uppercase tracking-tighter`}>{label} Trends</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase">Read-Only Visualization</p>
                </div>
                <button onClick={onClose} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><X size={24} className="text-stone-600" /></button>
            </div>

            <div className="p-6 pb-0 overflow-hidden">
                <div ref={containerRef} className="w-full overflow-x-auto pb-6 scroll-smooth cursor-default overflow-y-hidden">
                    <div style={{ width: graphWidth, height }}>
                        <svg width={graphWidth} height={height} viewBox={`0 0 ${graphWidth} ${height}`} className="overflow-hidden pointer-events-none">
                            {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                                <line key={ratio} x1={0} y1={height * ratio} x2={graphWidth} y2={height * ratio} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                            ))}
                            {label === "HbA1c" && (
                                <g opacity="0.05">
                                    <rect x={0} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={graphWidth} height={((5.7 - 0) / range) * (height - 2 * padding)} fill="#10b981" />
                                    <rect x={0} y={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} width={graphWidth} height={((6.5 - 5.7) / range) * (height - 2 * padding)} fill="#f59e0b" />
                                    <rect x={0} y={0} width={graphWidth} height={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} fill="#ef4444" />
                                </g>
                            )}
                            <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />
                            {points.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="8" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="4" />
                                    <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="14" fontWeight="900" fill="#1c1917">{p.val}</text>
                                    <text x={p.x} y={height - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78716c">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-auto bg-stone-50 rounded-t-[40px] shadow-inner transition-all duration-300">
                <button
                    onClick={() => setIsLogOpen(!isLogOpen)}
                    className="w-full flex justify-between items-center p-6 bg-white rounded-t-[40px] rounded-b-none border-b border-stone-100 group active:scale-[0.99] transition-all sticky top-0"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 bg-${color}-50 rounded-2xl`}>
                            <ScrollText className={`text-${color}-600`} size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xl font-black text-stone-800 tracking-tighter uppercase">History Logbook</h4>
                            <p className="text-xs font-bold text-stone-400">{relevantLogs.length} Records Documented</p>
                        </div>
                    </div>
                    {isLogOpen ? <ChevronDown size={24} className="text-stone-300" /> : <ChevronUp size={24} className="text-stone-300" />}
                </button>

                {isLogOpen && (
                    <div className="p-6 space-y-3 animate-in slide-in-from-bottom duration-300 max-h-[400px] overflow-y-auto">
                        {relevantLogs.map((log) => {
                            const dateObj = new Date(safeEpoch(log.timestamp));
                            const isLocked = !canEdit(log.timestamp);

                            return (
                                <div key={log.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-stone-100 flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-stone-50 py-2 px-3 rounded-2xl min-w-[64px]">
                                            <div className="text-[10px] font-black text-stone-400 uppercase leading-none">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</div>
                                            <div className="text-lg font-black text-stone-800 leading-tight">{dateObj.getDate()}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-stone-800">{log.snapshot.profile[vitalType]}</span>
                                                <span className="text-xs font-bold text-stone-400 uppercase">{unit}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Recorded at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(log, vitalType)}
                                            className="p-3 bg-stone-50 rounded-xl text-stone-400 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                                            title="Edit Entry"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(log.id)}
                                            disabled={isLocked}
                                            className={`p-3 rounded-xl transition-all active:scale-90 ${isLocked ? 'bg-stone-50 text-stone-200 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                            title={isLocked ? "Delete Locked (>30m required)" : "Delete Entry"}
                                        >
                                            {isLocked ? <Lock size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {relevantLogs.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen size={24} className="text-stone-300" />
                                </div>
                                <p className="text-stone-400 font-bold text-sm">No recorded history for {label} yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpandedGraphModal;
