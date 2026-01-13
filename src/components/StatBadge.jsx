/**
 * StatBadge Component
 * Displays a vital statistic with emoji, label, value, and unit
 * Designed with accessibility in mind for elderly users
 */

import React from 'react';

/**
 * StatBadge - Displays a single vital statistic
 * @param {string} emoji - Emoji icon for the stat
 * @param {string} label - Label for the stat (e.g., "Weight")
 * @param {string|number} value - Current value
 * @param {string} unit - Unit of measurement
 * @param {string} color - Color theme (blue, orange, emerald, purple)
 */
const StatBadge = ({ emoji, label, value, unit, color = 'blue' }) => {
    // Color mapping for Tailwind classes
    const colorClasses = {
        blue: 'border-blue-100',
        orange: 'border-orange-100',
        emerald: 'border-emerald-100',
        purple: 'border-purple-100',
        red: 'border-red-100'
    };

    const borderClass = colorClasses[color] || colorClasses.blue;

    return (
        <div
            className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm border ${borderClass} min-w-[90px] min-h-[90px]`}
            role="figure"
            aria-label={`${label}: ${value || 'not set'} ${unit || ''}`}
        >
            {/* Emoji Icon */}
            <div className="text-2xl mb-1" aria-hidden="true">
                {emoji}
            </div>

            {/* Value - Large and readable */}
            <div className="font-bold text-stone-800 text-lg leading-none">
                {value || '-'}
            </div>

            {/* Label */}
            <div className="text-[11px] text-stone-400 font-bold uppercase mt-1 tracking-wide">
                {label}
            </div>

            {/* Unit (if provided) */}
            {unit && (
                <div className="text-[10px] text-stone-300 font-bold">
                    {unit}
                </div>
            )}
        </div>
    );
};

export default StatBadge;
