/**
 * IOB (Insulin on Board) Indicator Component
 * 
 * Displays current active insulin with visual risk indicators.
 * ZERO REGRESSION: New component, doesn't modify existing UI.
 */

import React from 'react';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateIOB, CLINICAL_CONSTANTS } from '../safety/clinical';

const IOBIndicator = ({ insulinLogs, className = '' }) => {
    if (!insulinLogs || insulinLogs.length === 0) {
        return null; // Don't show if no insulin data
    }

    const iob = calculateIOB(insulinLogs);

    // Don't render if IOB is negligible
    if (iob < 0.1) return null;

    // Determine risk level
    const isHigh = iob > CLINICAL_CONSTANTS.MAX_SAFE_IOB;
    const isModerate = iob > 2.0;
    const isLow = iob <= 1.0;

    // Color scheme based on IOB level
    const getColorScheme = () => {
        if (isHigh) {
            return {
                bg: 'bg-red-50',
                border: 'border-red-500',
                text: 'text-red-700',
                icon: 'text-red-600',
                badge: 'bg-red-100 text-red-800'
            };
        }
        if (isModerate) {
            return {
                bg: 'bg-amber-50',
                border: 'border-amber-500',
                text: 'text-amber-700',
                icon: 'text-amber-600',
                badge: 'bg-amber-100 text-amber-800'
            };
        }
        return {
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            text: 'text-blue-700',
            icon: 'text-blue-600',
            badge: 'bg-blue-100 text-blue-800'
        };
    };

    const colors = getColorScheme();

    // Get appropriate icon
    const Icon = isHigh ? AlertTriangle : (isModerate ? Activity : CheckCircle2);

    // Warning message
    const getWarningMessage = () => {
        if (isHigh) {
            return '⚠️ High IOB - Monitor for hypoglycemia';
        }
        if (isModerate) {
            return 'ℹ️ Moderate IOB - Be cautious with additional doses';
        }
        return '✓ Normal IOB level';
    };

    return (
        <div className={`rounded-xl border-2 p-4 ${colors.bg} ${colors.border} ${className}`}>
            <div className="flex items-center justify-between">
                {/* Left: Icon and Label */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.badge}`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-gray-600">
                            Active Insulin (IOB)
                        </div>
                        <div className={`text-2xl font-bold ${colors.text}`}>
                            {iob.toFixed(1)}u
                        </div>
                    </div>
                </div>

                {/* Right: Progress Bar */}
                <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-gray-500">
                        Max: {CLINICAL_CONSTANTS.MAX_SAFE_IOB}u
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${isHigh ? 'bg-red-500' : (isModerate ? 'bg-amber-500' : 'bg-blue-500')
                                }`}
                            style={{
                                width: `${Math.min(100, (iob / CLINICAL_CONSTANTS.MAX_SAFE_IOB) * 100)}%`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Warning Message */}
            {(isHigh || isModerate) && (
                <div className={`mt-3 text-xs ${colors.text} font-medium`}>
                    {getWarningMessage()}
                </div>
            )}

            {/* Info tooltip */}
            <div className="mt-2 text-xs text-gray-500">
                Insulin on Board (IOB) represents active insulin still working in your body.
            </div>
        </div>
    );
};

export default IOBIndicator;
