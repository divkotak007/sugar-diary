/**
 * Safety Gate Component
 * 
 * Provides real-time safety checks for insulin dosing.
 * Shows warnings and blocks dangerous doses.
 * 
 * ZERO REGRESSION: New component, optional integration.
 */

import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { isSafeToDose, canDoseAgain } from '../safety/clinical';

const SafetyGate = ({
    currentHGT,
    iob,
    proposedDose,
    insulinLogs,
    onProceed,
    onCancel,
    className = ''
}) => {
    // Run safety checks
    const safetyCheck = isSafeToDose(currentHGT, iob, proposedDose);
    const timeCheck = canDoseAgain(insulinLogs);

    // Determine if we should show the gate
    const shouldBlock = safetyCheck.criticalWarnings.length > 0 || !timeCheck.can;
    const hasWarnings = safetyCheck.warnings.length > 0;

    // If everything is safe and no warnings, don't show gate
    if (safetyCheck.safe && timeCheck.can) {
        return null;
    }

    return (
        <div className={`rounded-xl border-2 p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className={`w-5 h-5 ${shouldBlock ? 'text-red-600' : 'text-amber-600'}`} />
                <h3 className={`font-bold ${shouldBlock ? 'text-red-700' : 'text-amber-700'}`}>
                    {shouldBlock ? 'Safety Block' : 'Safety Warning'}
                </h3>
            </div>

            {/* Critical Warnings (Blocking) */}
            {safetyCheck.criticalWarnings.length > 0 && (
                <div className="space-y-2 mb-3">
                    {safetyCheck.criticalWarnings.map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{warning}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Time Interval Warning */}
            {!timeCheck.can && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                        <p className="font-medium">Minimum interval not met</p>
                        <p className="text-xs mt-1">
                            Please wait {timeCheck.waitMinutes} more minutes before next dose.
                            Last dose: {timeCheck.lastDoseTime?.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Regular Warnings (Can proceed with caution) */}
            {safetyCheck.warnings.length > 0 && (
                <div className="space-y-2 mb-3">
                    {safetyCheck.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700">{warning}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Messages */}
            {safetyCheck.info.length > 0 && (
                <div className="space-y-2 mb-3">
                    {safetyCheck.info.map((info, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700">{info}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendation */}
            {safetyCheck.recommendation && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                        <p className="font-medium">Recommendation:</p>
                        <p className="text-xs mt-1">{safetyCheck.recommendation}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>

                {!shouldBlock && (
                    <button
                        onClick={onProceed}
                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Proceed Anyway
                    </button>
                )}

                {shouldBlock && (
                    <button
                        disabled
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                        Blocked
                    </button>
                )}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 mt-3 text-center">
                This safety check is based on clinical guidelines but is not a substitute for medical advice.
            </p>
        </div>
    );
};

export default SafetyGate;
