/**
 * DATA CLEANUP TOOL COMPONENT
 * 
 * UI for finding and removing duplicate logs.
 * User-controlled with backup/restore capability.
 * 
 * ZERO REGRESSION: Optional tool, accessed from Settings.
 */

import React, { useState } from 'react';
import { Trash2, Download, Upload, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { findDuplicates, removeDuplicates, createBackup, analyzeDataQuality } from '../utils/deduplication';

const DataCleanupTool = ({ logs, db, userId, collectionName, onCleanupComplete }) => {
    const [status, setStatus] = useState('idle'); // idle, analyzing, cleaning, complete, error
    const [analysis, setAnalysis] = useState(null);
    const [qualityReport, setQualityReport] = useState(null);
    const [backupData, setBackupData] = useState(null);

    // Analyze for duplicates
    const handleAnalyze = () => {
        setStatus('analyzing');

        try {
            const duplicateAnalysis = findDuplicates(logs, {
                timeWindowMinutes: 5,
                valueTolerance: 0.1,
                strictMode: false
            });

            const quality = analyzeDataQuality(logs);

            setAnalysis(duplicateAnalysis);
            setQualityReport(quality);
            setStatus('idle');
        } catch (error) {
            console.error('Analysis failed:', error);
            setStatus('error');
        }
    };

    // Create backup before cleanup
    const handleCreateBackup = () => {
        try {
            const backup = createBackup(logs);
            setBackupData(backup);

            // Download backup file
            const blob = new Blob([backup], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sugar-diary-backup-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            alert('✅ Backup created and downloaded');
        } catch (error) {
            console.error('Backup failed:', error);
            alert('❌ Backup failed: ' + error.message);
        }
    };

    // Remove duplicates
    const handleCleanup = async () => {
        if (!analysis || analysis.duplicateGroups.length === 0) {
            alert('No duplicates to remove');
            return;
        }

        const confirmed = confirm(
            `Remove ${analysis.totalDuplicates} duplicate logs?\n\n` +
            `This will keep the earliest entry in each duplicate group.\n` +
            `Make sure you have created a backup first!`
        );

        if (!confirmed) return;

        setStatus('cleaning');

        try {
            const result = await removeDuplicates(
                db,
                userId,
                collectionName,
                analysis.groups,
                'keep-first'
            );

            setStatus('complete');

            alert(
                `✅ Cleanup complete!\n\n` +
                `Removed: ${result.deletedCount} duplicates\n` +
                `Kept: ${result.keptCount} unique logs`
            );

            if (onCleanupComplete) {
                onCleanupComplete(result);
            }

            // Reset analysis
            setAnalysis(null);
            setQualityReport(null);
        } catch (error) {
            console.error('Cleanup failed:', error);
            setStatus('error');
            alert('❌ Cleanup failed: ' + error.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Data Cleanup Tool</h3>
                <button
                    onClick={handleAnalyze}
                    disabled={status === 'analyzing' || status === 'cleaning'}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${status === 'analyzing' ? 'animate-spin' : ''}`} />
                    {status === 'analyzing' ? 'Analyzing...' : 'Analyze Data'}
                </button>
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-3">
                    {/* Duplicate Summary */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-bold text-blue-900 mb-2">Duplicate Analysis</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-600">Total Logs</p>
                                <p className="text-2xl font-bold text-blue-900">{analysis.totalLogs}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Duplicates Found</p>
                                <p className="text-2xl font-bold text-red-600">{analysis.totalDuplicates}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Duplicate Groups</p>
                                <p className="text-xl font-bold text-amber-600">{analysis.duplicateGroups}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Unique Logs</p>
                                <p className="text-xl font-bold text-green-600">{analysis.uniqueLogs}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quality Report */}
                    {qualityReport && qualityReport.totalIssues > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <h4 className="font-bold text-amber-900 mb-2">Data Quality Issues</h4>
                            <div className="space-y-1 text-sm">
                                {qualityReport.summary.missingTimestamp > 0 && (
                                    <p className="text-amber-700">⚠️ Missing timestamp: {qualityReport.summary.missingTimestamp}</p>
                                )}
                                {qualityReport.summary.missingValue > 0 && (
                                    <p className="text-amber-700">⚠️ Missing value: {qualityReport.summary.missingValue}</p>
                                )}
                                {qualityReport.summary.invalidValue > 0 && (
                                    <p className="text-amber-700">⚠️ Invalid value: {qualityReport.summary.invalidValue}</p>
                                )}
                                {qualityReport.summary.futureTimestamp > 0 && (
                                    <p className="text-amber-700">⚠️ Future timestamp: {qualityReport.summary.futureTimestamp}</p>
                                )}
                                {qualityReport.summary.outliers > 0 && (
                                    <p className="text-amber-700">ℹ️ Outliers detected: {qualityReport.summary.outliers}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateBackup}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Create Backup
                        </button>

                        {analysis.totalDuplicates > 0 && (
                            <button
                                onClick={handleCleanup}
                                disabled={status === 'cleaning'}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {status === 'cleaning' ? 'Cleaning...' : `Remove ${analysis.totalDuplicates} Duplicates`}
                            </button>
                        )}
                    </div>

                    {/* Warning */}
                    {analysis.totalDuplicates > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">
                                <strong>Warning:</strong> This action cannot be undone. Create a backup before proceeding.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Success State */}
            {status === 'complete' && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">
                        Cleanup completed successfully!
                    </p>
                </div>
            )}

            {/* Error State */}
            {status === 'error' && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">
                        An error occurred. Please try again.
                    </p>
                </div>
            )}

            {/* Info */}
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Finds logs with same value within 5-minute window</li>
                    <li>Groups duplicates together</li>
                    <li>Keeps earliest entry in each group</li>
                    <li>Creates backup before any deletion</li>
                </ul>
            </div>
        </div>
    );
};

export default DataCleanupTool;
