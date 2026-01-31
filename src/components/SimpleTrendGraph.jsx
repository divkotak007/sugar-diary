import React from 'react';
import { TrendingUp } from 'lucide-react';

// Graph Component (Clickable, No Overflow)
const SimpleTrendGraph = ({ data, label, unit, color, normalRange, onClick }) => {
    if (!data || data.length < 2) return (
        <div onClick={onClick} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm cursor-pointer active:scale-95 transition-all">
            <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span><span className="text-xs text-stone-300 font-bold">No Data</span></div>
            <div className="h-24 bg-stone-50 rounded-xl flex items-center justify-center text-stone-300 text-xs font-bold">Add more entries</div>
        </div>
    );

    // CORRECTION: Keep small chart to MAX 5 dots only
    const visibleData = data.slice(-5);

    const padding = 10;
    const height = 100;
    const width = 300; // Fixed width for viewBox

    const vals = visibleData.map(d => d.value);
    let min = Math.min(...vals) * 0.98;
    let max = Math.max(...vals) * 1.02;
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;

    const points = visibleData.map((d, i) => {
        const x = padding + (i / (visibleData.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
        return { x, y, value: d.value, date: d.date };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const refY = normalRange ? height - padding - ((normalRange - min) / range) * (height - 2 * padding) : null;
    // Normal Range Rectangle Calculation
    const normalMinY = normalRange ? height - padding - ((normalRange * 1.1 - min) / range) * (height - 2 * padding) : 0;
    const normalMaxY = normalRange ? height - padding - ((normalRange * 0.9 - min) / range) * (height - 2 * padding) : height;
    const showNormalBand = normalRange && label !== "HbA1c";

    return (
        <div
            onClick={onClick}
            aria-label={`${label} progress trend chart`}
            className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-all z-0"
        >
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span>
                <span className={`text-sm font-bold text-${color}-600 dark:text-${color}-400`}>{data[data.length - 1].value} {unit}</span>
            </div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-hidden pointer-events-none">
                {/* Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                    <line key={ratio} x1={padding} y1={height * ratio} x2={width - 2 * padding} y2={height * ratio} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4" />
                ))}

                {/* Normal Range Band (Gray Dotted/Muted Background) */}
                {showNormalBand && (
                    <rect
                        x={padding}
                        y={normalMinY}
                        width={width - 2 * padding}
                        height={Math.max(0, normalMaxY - normalMinY)}
                        className={`opacity-80 fill-current ${color === 'orange' ? 'text-orange-50 dark:text-stone-700' : 'text-emerald-50 dark:text-stone-700'}`}
                    />
                )}

                {label === "HbA1c" && (
                    <g opacity="0.1">
                        <rect x={padding} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={((5.7 - 0) / range) * (height - 2 * padding)} fill="#10b981" />
                        <rect x={padding} y={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={((6.5 - 5.7) / range) * (height - 2 * padding)} fill="#f59e0b" />
                        <rect x={padding} y={0} width={width - 2 * padding} height={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} fill="#ef4444" />
                    </g>
                )}
                {refY && refY > 0 && refY < height && (
                    <g>
                        <text x={width - padding} y={refY - 2} textAnchor="end" fontSize="8" fill="#6b7280" fontStyle="italic">Normal: {normalRange}</text>
                    </g>
                )}
                <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="4" points={polylinePoints} />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="2" />
                    </g>
                ))}
            </svg>
            <div className="absolute bottom-1 right-2 text-[8px] text-stone-300 font-bold uppercase tracking-widest">Tap to Expand</div>
        </div>
    );
};

// Error Boundary Fallback for Graphs
const GraphErrorBoundary = ({ children }) => {
    try {
        return children;
    } catch (e) {
        return (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-center h-24 text-stone-400 text-xs italic">
                Unable to load trend data safely.
            </div>
        );
    }
};

export { SimpleTrendGraph, GraphErrorBoundary };
