/**
 * VALIDATION FEEDBACK COMPONENT
 * 
 * Real-time validation feedback UI for forms.
 * Shows errors, warnings, and success states.
 * 
 * ZERO REGRESSION: New component, optional integration.
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const ValidationFeedback = ({
    errors = [],
    warnings = [],
    info = [],
    isValid = false,
    showSuccess = true,
    className = ''
}) => {
    // Don't render if nothing to show
    if (errors.length === 0 && warnings.length === 0 && info.length === 0 && !isValid) {
        return null;
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Errors (Blocking) */}
            {errors.length > 0 && (
                <div className="space-y-1">
                    {errors.map((error, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                {error.field && error.field !== 'unknown' && (
                                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                                        {error.field}
                                    </p>
                                )}
                                <p className="text-sm text-red-700">
                                    {error.message || error}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Warnings (Can proceed) */}
            {warnings.length > 0 && (
                <div className="space-y-1">
                    {warnings.map((warning, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                {warning.field && warning.field !== 'unknown' && (
                                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                                        {warning.field}
                                    </p>
                                )}
                                <p className="text-sm text-amber-700">
                                    {warning.message || warning}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Messages */}
            {info.length > 0 && (
                <div className="space-y-1">
                    {info.map((infoMsg, idx) => (
                        <div
                            key={idx}
                            className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                {infoMsg.field && infoMsg.field !== 'unknown' && (
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                        {infoMsg.field}
                                    </p>
                                )}
                                <p className="text-sm text-blue-700">
                                    {infoMsg.message || infoMsg}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Success State */}
            {isValid && showSuccess && errors.length === 0 && warnings.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">
                        ✓ Validation passed
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * Inline validation feedback (for individual fields)
 */
export const InlineValidation = ({ error, warning, success, className = '' }) => {
    if (!error && !warning && !success) return null;

    if (error) {
        return (
            <p className={`text-xs text-red-600 mt-1 flex items-center gap-1 ${className}`}>
                <AlertCircle className="w-3 h-3" />
                {error}
            </p>
        );
    }

    if (warning) {
        return (
            <p className={`text-xs text-amber-600 mt-1 flex items-center gap-1 ${className}`}>
                <AlertTriangle className="w-3 h-3" />
                {warning}
            </p>
        );
    }

    if (success) {
        return (
            <p className={`text-xs text-green-600 mt-1 flex items-center gap-1 ${className}`}>
                <CheckCircle2 className="w-3 h-3" />
                {success}
            </p>
        );
    }

    return null;
};

/**
 * Validation summary badge
 */
export const ValidationBadge = ({ isValid, errorCount = 0, warningCount = 0 }) => {
    if (isValid && errorCount === 0 && warningCount === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Valid
            </span>
        );
    }

    if (errorCount > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                <AlertCircle className="w-3 h-3" />
                {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
            </span>
        );
    }

    if (warningCount > 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
            </span>
        );
    }

    return null;
};

export default ValidationFeedback;
