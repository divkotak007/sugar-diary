/**
 * DataManagement Component
 * GDPR-compliant data management with export and deletion options
 */

import React, { useState } from 'react';
import { Database, Download, Trash2, AlertTriangle, Check, X, Loader } from 'lucide-react';

/**
 * DataManagement - User data management interface
 * @param {function} onExportAll - Callback to export all data
 * @param {function} onDeleteAll - Callback to delete all data
 * @param {object} dataSummary - Summary of stored data
 */
const DataManagement = ({
    onExportAll,
    onDeleteAll,
    dataSummary = {}
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteStep, setDeleteStep] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Reset delete flow
    const resetDeleteFlow = () => {
        setShowDeleteConfirm(false);
        setDeleteStep(0);
        setConfirmText('');
        setIsDeleting(false);
    };

    // Handle delete confirmation
    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;

        setIsDeleting(true);
        try {
            await onDeleteAll();
            resetDeleteFlow();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete data. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
                <Database size={20} className="text-stone-600" />
                Manage Your Data
            </h3>

            {/* Data Summary */}
            <div className="mb-6 p-4 bg-stone-50 rounded-xl">
                <h4 className="text-xs font-bold text-stone-400 uppercase mb-3">
                    Your Stored Data
                </h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-stone-500">Profile Information</span>
                        <span className="font-medium text-stone-700">✓ Stored</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-500">Prescription Data</span>
                        <span className="font-medium text-stone-700">
                            {dataSummary.insulinCount || 0} insulins, {dataSummary.oralMedCount || 0} oral meds
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-500">Log Entries</span>
                        <span className="font-medium text-stone-700">
                            {dataSummary.logCount || 0} entries
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-stone-500">Date Range</span>
                        <span className="font-medium text-stone-700">
                            {dataSummary.dateRange || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Export Button */}
            <button
                onClick={onExportAll}
                className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mb-4 transition-colors min-h-[56px]"
            >
                <Download size={20} />
                Download All My Data
            </button>

            {/* Delete Section */}
            {!showDeleteConfirm ? (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-white hover:bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-xl transition-colors min-h-[56px]"
                >
                    <Trash2 size={20} />
                    Delete All My Data
                </button>
            ) : (
                <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
                    {/* Step 1: Warning */}
                    {deleteStep === 0 && (
                        <>
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-bold text-red-800 mb-1">Are you sure?</h4>
                                    <p className="text-red-700 text-sm">
                                        This will permanently delete all your data including:
                                    </p>
                                    <ul className="text-red-700 text-sm mt-2 list-disc pl-4">
                                        <li>Your profile and health information</li>
                                        <li>All prescription records</li>
                                        <li>All glucose logs and history</li>
                                        <li>All trend data and insights</li>
                                    </ul>
                                    <p className="text-red-800 font-bold mt-3 text-sm">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDeleteStep(1)}
                                    className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl min-h-[48px] transition-colors"
                                >
                                    Continue
                                </button>
                                <button
                                    onClick={resetDeleteFlow}
                                    className="flex-1 p-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl min-h-[48px] transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 2: Final Confirmation */}
                    {deleteStep === 1 && (
                        <>
                            <div className="mb-4">
                                <h4 className="font-bold text-red-800 mb-2">Final Confirmation</h4>
                                <p className="text-red-700 text-sm mb-3">
                                    Type <strong>DELETE</strong> below to confirm permanent deletion:
                                </p>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                    placeholder="Type DELETE to confirm"
                                    className="w-full p-3 border-2 border-red-300 rounded-xl text-center font-bold text-lg focus:border-red-500 focus:outline-none min-h-[48px]"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={confirmText !== 'DELETE' || isDeleting}
                                    className={`flex-1 p-3 font-bold rounded-xl min-h-[48px] flex items-center justify-center gap-2 transition-colors ${confirmText === 'DELETE' && !isDeleting
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader size={18} className="animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Delete Forever
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={resetDeleteFlow}
                                    disabled={isDeleting}
                                    className="flex-1 p-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl min-h-[48px] transition-colors"
                                >
                                    <X size={18} className="inline mr-1" />
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Privacy Notice */}
            <p className="text-xs text-stone-400 mt-4 text-center">
                Under GDPR and data protection laws, you have the right to access, export, and delete your personal data at any time.
            </p>
        </div>
    );
};

export default DataManagement;
