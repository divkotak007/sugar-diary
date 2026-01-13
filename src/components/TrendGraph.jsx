/**
 * TrendGraph Components
 * Interactive trend visualization for diabetes metrics
 * Includes small preview graph and expanded modal view
 */

import React, { useState } from 'react';
import { TrendingUp, X } from 'lucide-react';
import {
    calculateGraphPoints,
    calculateReferenceLine,
    analyzeTrend,
    detectRiskFlags,
    GRAPH_COLORS
} from '../utils/graphCalculations.js';

// --- COLOR-BLIND SAFE PALETTE ---
const getStrokeColor = (color) => {
    const colorMap = {
        orange: GRAPH_COLORS.glucose,
        emerald: GRAPH_COLORS.hba1c,
        purple: GRAPH_COLORS.creatinine,
        blue: GRAPH_COLORS.weight,
        red: GRAPH_COLORS.danger
    };
    return colorMap[color] || GRAPH_COLORS.glucose;
};

/**
 * SimpleTrendGraph - Compact graph preview (5 points)
 */
export const SimpleTrendGraph = ({
    data,
    color = 'emerald',
    label,
    unit,
    normalRange,
    onClick,
    showTrendSummary = true
}) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // Check for insufficient data
    if (!data || data.length < 2) {
        return (
            <div className="h-32 flex items-center justify-center text-sm text-stone-400 italic bg-stone-50 rounded-xl border border-dashed">
                Insufficient Data for {label}
            </div>
        );
    }

    // Graph dimensions
    const height = 120;
    const width = 300;
    const padding = 35;
    const dimensions = { width, height, padding };

    // Calculate graph points (last 5)
    const graphCalc = calculateGraphPoints(data, dimensions, 5);
    const { points, polyline } = graphCalc;

    // Calculate reference line position
    const refY = calculateReferenceLine(normalRange, graphCalc, dimensions);

    // Get trend analysis
    const trend = analyzeTrend(data);

    // Get risk flags
    const risk = detectRiskFlags(data, label.toLowerCase());

    // Get stroke color
    const strokeColor = getStrokeColor(color);

    return (
        <div
            onClick={onClick}
            className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
            role="button"
            aria-label={`${label} trend graph. Click to expand.`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1">
                    <TrendingUp size={12} /> {label} Trend
                </span>
                <span className="text-sm font-bold" style={{ color: strokeColor }}>
                    {data[data.length - 1].value} {unit}
                </span>
            </div>

            {/* Risk Flag */}
            {risk.hasRisk && (
                <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase animate-pulse ${risk.riskLevel === 'critical' ? 'bg-red-500 text-white' :
                            risk.riskLevel === 'high' ? 'bg-orange-500 text-white' :
                                risk.riskLevel === 'low' ? 'bg-yellow-400 text-stone-900' :
                                    'bg-stone-200 text-stone-600'
                        }`}
                >
                    {risk.message}
                </div>
            )}

            {/* SVG Graph */}
            <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
                role="img"
                aria-label={`${label} trend showing ${data.length} data points`}
            >
                {/* Background grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                    <line
                        key={ratio}
                        x1={padding}
                        y1={height * ratio}
                        x2={width - padding}
                        y2={height * ratio}
                        stroke="#d1d5db"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                        opacity="0.4"
                    />
                ))}

                {/* HbA1c colored zones (if applicable) */}
                {label === 'HbA1c' && (
                    <g>
                        {/* Normal zone (green) */}
                        <rect
                            x={padding}
                            y={height - padding - ((5.7 - graphCalc.min) / graphCalc.range) * (height - 2 * padding)}
                            width={width - 2 * padding}
                            height={Math.max(0, ((5.7 - graphCalc.min) / graphCalc.range) * (height - 2 * padding))}
                            fill="#ecfdf5"
                            opacity="0.5"
                        />
                        {/* Pre-diabetes zone (yellow) */}
                        <rect
                            x={padding}
                            y={height - padding - ((6.4 - graphCalc.min) / graphCalc.range) * (height - 2 * padding)}
                            width={width - 2 * padding}
                            height={Math.max(0, ((6.4 - 5.7) / graphCalc.range) * (height - 2 * padding))}
                            fill="#fefce8"
                            opacity="0.5"
                        />
                        {/* Diabetes zone (orange) */}
                        <rect
                            x={padding}
                            y={padding}
                            width={width - 2 * padding}
                            height={Math.max(0, (height - padding - ((6.4 - graphCalc.min) / graphCalc.range) * (height - 2 * padding)) - padding)}
                            fill="#fff7ed"
                            opacity="0.5"
                        />
                    </g>
                )}

                {/* Reference line (normal range) */}
                {refY && refY > 0 && refY < height && (
                    <g>
                        <line
                            x1={padding}
                            y1={refY}
                            x2={width - padding}
                            y2={refY}
                            stroke="#9ca3af"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                            opacity="0.4"
                        />
                        <text
                            x={width - padding}
                            y={refY - 4}
                            textAnchor="end"
                            fontSize="9"
                            fill="#6b7280"
                            fontStyle="italic"
                        >
                            Normal: {normalRange}
                        </text>
                    </g>
                )}

                {/* Main trend line with shadow */}
                <polyline
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="4"
                    points={polyline}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                />

                {/* Data points */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={hoveredPoint === i ? 6 : 4}
                            fill="white"
                            stroke={strokeColor}
                            strokeWidth="2"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                        />

                        {/* Tooltip on hover */}
                        {hoveredPoint === i && (
                            <g>
                                <rect
                                    x={p.x - 25}
                                    y={p.y - 30}
                                    width="50"
                                    height="22"
                                    rx="4"
                                    fill="rgba(0,0,0,0.8)"
                                />
                                <text
                                    x={p.x}
                                    y={p.y - 15}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="white"
                                    fontWeight="bold"
                                >
                                    {p.value} {unit}
                                </text>
                            </g>
                        )}
                    </g>
                ))}
            </svg>

            {/* Trend Summary */}
            {showTrendSummary && (
                <div className="mt-2 text-xs text-stone-500 flex items-center gap-1">
                    <span>{trend.arrow}</span>
                    <span>{Math.abs(trend.percentage)}% {trend.direction !== 'stable' ? trend.direction : 'stable'}</span>
                </div>
            )}

            {/* Click hint */}
            <div className="absolute bottom-1 right-2 text-[8px] text-stone-300 font-bold uppercase tracking-widest">
                Tap to Expand
            </div>
        </div>
    );
};

/**
 * ExpandedGraphModal - Full-size scrollable graph view
 */
export const ExpandedGraphModal = ({
    data,
    color = 'emerald',
    label,
    unit,
    normalRange,
    onClose
}) => {
    // Calculate dimensions for expanded view
    const height = 300;
    const pointsPerView = 7;
    const screenWidth = Math.min(window.innerWidth - 48, 600);
    const pointSpacing = screenWidth / pointsPerView;
    const graphWidth = Math.max(screenWidth, data.length * pointSpacing);
    const padding = 40;
    const dimensions = { width: graphWidth, height, padding };

    // Calculate all points (not limited to 5)
    const values = data.map(d => d.value);
    const min = Math.min(...values) * 0.9;
    const max = Math.max(...values) * 1.1;
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (graphWidth - 2 * padding);
        const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
        return { x, y, value: d.value, date: d.date };
    });

    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
    const refY = normalRange
        ? height - padding - ((normalRange - min) / range) * (height - 2 * padding)
        : null;

    const strokeColor = getStrokeColor(color);

    // Get trend and stats
    const trend = analyzeTrend(data);

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-[100] bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 animate-in slide-in-from-bottom border-t border-stone-100"
            role="dialog"
            aria-label={`Expanded ${label} graph`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold" style={{ color: strokeColor }}>
                        {label} Analysis
                    </h3>
                    <p className="text-sm text-stone-400 font-medium">
                        Detailed trend view ({data.length} records)
                    </p>
                    {/* Trend summary */}
                    <p className="text-sm text-stone-600 mt-1 font-medium">
                        {trend.summary}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                    aria-label="Close expanded graph"
                >
                    <X size={20} className="text-stone-500" />
                </button>
            </div>

            {/* Scrollable Graph Container */}
            <div className="w-full overflow-x-auto pb-4">
                <svg
                    width={graphWidth}
                    height={height}
                    viewBox={`0 0 ${graphWidth} ${height}`}
                    className="overflow-visible"
                >
                    {/* Background grid */}
                    {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                        <line
                            key={ratio}
                            x1={padding}
                            y1={height * ratio}
                            x2={graphWidth - padding}
                            y2={height * ratio}
                            stroke="#d1d5db"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                            opacity="0.4"
                        />
                    ))}

                    {/* HbA1c zones */}
                    {label === 'HbA1c' && (
                        <g>
                            <rect
                                x={padding}
                                y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)}
                                width={graphWidth - 2 * padding}
                                height={Math.max(0, ((5.7 - min) / range) * (height - 2 * padding))}
                                fill="#ecfdf5"
                            />
                            <rect
                                x={padding}
                                y={height - padding - ((6.4 - min) / range) * (height - 2 * padding)}
                                width={graphWidth - 2 * padding}
                                height={Math.max(0, ((6.4 - 5.7) / range) * (height - 2 * padding))}
                                fill="#fefce8"
                            />
                            <rect
                                x={padding}
                                y={padding}
                                width={graphWidth - 2 * padding}
                                height={Math.max(0, (height - padding - ((6.4 - min) / range) * (height - 2 * padding)) - padding)}
                                fill="#fff7ed"
                            />
                        </g>
                    )}

                    {/* Reference line */}
                    {refY && refY > 0 && refY < height && (
                        <g>
                            <line
                                x1={padding}
                                y1={refY}
                                x2={graphWidth - padding}
                                y2={refY}
                                stroke="#9ca3af"
                                strokeWidth="1"
                                strokeDasharray="4 2"
                                opacity="0.4"
                            />
                            <text
                                x={graphWidth - padding}
                                y={refY - 5}
                                textAnchor="end"
                                fontSize="12"
                                fill="#9ca3af"
                                fontWeight="bold"
                            >
                                Normal Limit: {normalRange}
                            </text>
                        </g>
                    )}

                    {/* Main line */}
                    <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="6"
                        points={polyline}
                        style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }}
                    />

                    {/* Data points with labels */}
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="6"
                                fill="white"
                                stroke={strokeColor}
                                strokeWidth="3"
                            />
                            {/* Value label */}
                            <text
                                x={p.x}
                                y={p.y - 15}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="bold"
                                fill="#374151"
                            >
                                {p.value}
                            </text>
                            {/* Date label */}
                            <text
                                x={p.x}
                                y={height - 5}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#9ca3af"
                            >
                                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default SimpleTrendGraph;
