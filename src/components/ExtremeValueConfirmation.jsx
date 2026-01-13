/**
 * ExtremeValueConfirmation Component
 * Modal dialog for confirming extreme or dangerous values
 * Requires explicit user confirmation before saving
 */

import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

/**
 * ExtremeValueConfirmation - Confirmation dialog for unusual values
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Warning message to display
 * @param {string} value - The value being confirmed
 * @param {string} unit - Unit of measurement
 * @param {string} severity - 'warning', 'danger', or 'critical'
 * @param {function} onConfirm - Callback when user confirms
 * @param {function} onCancel - Callback when user cancels
 */
const ExtremeValueConfirmation = ({
    isOpen,
    title = 'Confirm Value',
    message,
    value,
    unit,
    severity = 'warning',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    // Severity styling
    const severityStyles = {
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-500',
            button: 'bg-yellow-500 hover:bg-yellow-600'
        },
        danger: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            icon: 'text-orange-500',
            button: 'bg-orange-500 hover:bg-orange-600'
        },
        critical: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600'
        }
    };

    const styles = severityStyles[severity] || severityStyles.warning;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className={`relative ${styles.bg} ${styles.border} border-2 rounded-3xl p-6 max-w-sm w-full shadow-2xl`}>
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-white/50 min-w-[48px] min-h-[48px] flex items-center justify-center"
                    aria-label="Cancel"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.icon}`}>
                        <AlertTriangle size={48} className="animate-pulse" />
                    </div>
                </div>

                {/* Title */}
                <h2
                    id="confirmation-title"
                    className="text-xl font-bold text-stone-800 text-center mb-2"
                >
                    {title}
                </h2>

                {/* Value display */}
                <div className="text-center mb-4">
                    <span className="text-4xl font-bold text-stone-900">{value}</span>
                    <span className="text-xl text-stone-500 ml-2">{unit}</span>
                </div>

                {/* Message */}
                <p className="text-stone-600 text-center mb-6 text-base leading-relaxed">
                    {message}
                </p>

                {/* Actions - Large touch targets */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className={`w-full py-4 px-6 ${styles.button} text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 min-h-[56px] shadow-lg transition-all active:scale-95`}
                    >
                        <Check size={24} />
                        Yes, This Is Correct
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full py-4 px-6 bg-white border-2 border-stone-200 text-stone-700 font-bold text-lg rounded-2xl flex items-center justify-center gap-2 min-h-[56px] hover:bg-stone-50 transition-all active:scale-95"
                    >
                        <X size={24} />
                        Cancel, Let Me Check
                    </button>
                </div>

                {/* Safety note */}
                <p className="text-xs text-stone-400 text-center mt-4">
                    If you're unsure, please verify your reading and try again.
                </p>
            </div>
        </div>
    );
};

export default ExtremeValueConfirmation;
