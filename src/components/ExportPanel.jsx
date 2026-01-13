/**
 * ExportPanel Component
 * One-click data export with format selection and preview
 */

import React, { useState } from 'react';
import { Download, FileText, FileJson, Calendar, Check, Loader } from 'lucide-react';
import {
    downloadAllDataAsJSON,
    downloadLogsAsCSV,
    generateSummaryReport
} from '../services/exportService.js';

/**
 * ExportPanel - Data export interface
 * @param {object} userData - User data to export
 * @param {Array} logs - Log entries
 * @param {string} userName - User's display name
 * @param {function} onExportComplete - Callback after export
 */
const ExportPanel = ({
    userData,
    logs,
    userName = 'User',
    onExportComplete
}) => {
    const [exporting, setExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Generate summary for preview
    const summary = userData ? generateSummaryReport(userData) : null;

    // Filter logs by date range
    const getFilteredLogs = () => {
        if (!logs) return [];

        return logs.filter(log => {
            if (!startDate && !endDate) return true;

            const logDate = new Date(log.timestamp?.seconds * 1000);

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (logDate < start) return false;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) return false;
            }

            return true;
        });
    };

    // Handle export
    const handleExport = async (format) => {
        setExporting(true);
        setExportFormat(format);

        try {
            if (format === 'json') {
                downloadAllDataAsJSON(userData, userName);
            } else if (format === 'csv') {
                const filteredLogs = getFilteredLogs();
                const dateRange = startDate || endDate
                    ? `${startDate || 'start'}_to_${endDate || 'now'}`
                    : '';
                downloadLogsAsCSV(filteredLogs, userName, dateRange);
            }

            if (onExportComplete) {
                onExportComplete(format, getFilteredLogs().length);
            }

            // Show success briefly
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
            setExportFormat(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
                <Download size={20} className="text-emerald-600" />
                Export Your Data
            </h3>

            {/* Date Range Selection */}
            <div className="mb-6">
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 flex items-center gap-1">
                    <Calendar size={12} />
                    Date Range (Optional)
                </label>
                <div className="flex gap-2 items-center">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1 p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm min-h-[48px]"
                        aria-label="Start date"
                    />
                    <span className="text-stone-300 font-bold">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm min-h-[48px]"
                        aria-label="End date"
                    />
                </div>
                <p className="text-xs text-stone-400 mt-1">
                    Leave empty to export all data
                </p>
            </div>

            {/* Preview Toggle */}
            {summary && (
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-emerald-600 font-medium mb-4 hover:underline"
                >
                    {showPreview ? 'Hide Preview' : 'Show Data Preview'}
                </button>
            )}

            {/* Data Preview */}
            {showPreview && summary && (
                <div className="mb-6 p-4 bg-stone-50 rounded-xl text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-stone-400">Total Entries:</span>
                            <span className="font-bold ml-2">{summary.totalEntries}</span>
                        </div>
                        <div>
                            <span className="text-stone-400">Glucose Readings:</span>
                            <span className="font-bold ml-2">{summary.glucoseReadings}</span>
                        </div>
                        {summary.glucose && (
                            <>
                                <div>
                                    <span className="text-stone-400">Avg Glucose:</span>
                                    <span className="font-bold ml-2">{summary.glucose.average} mg/dL</span>
                                </div>
                                <div>
                                    <span className="text-stone-400">Time in Range:</span>
                                    <span className="font-bold ml-2">{summary.glucose.timeInRange}%</span>
                                </div>
                            </>
                        )}
                        {summary.dateRange.start && (
                            <div className="col-span-2">
                                <span className="text-stone-400">Date Range:</span>
                                <span className="font-bold ml-2">
                                    {summary.dateRange.start} to {summary.dateRange.end}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Export Buttons */}
            <div className="space-y-3">
                {/* JSON Export - Complete data */}
                <button
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors min-h-[64px] disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <FileJson size={24} className="text-blue-600" />
                        <div className="text-left">
                            <div className="font-bold text-blue-800">Export as JSON</div>
                            <div className="text-xs text-blue-600">Complete data backup (all fields)</div>
                        </div>
                    </div>
                    {exporting && exportFormat === 'json' ? (
                        <Loader size={20} className="text-blue-600 animate-spin" />
                    ) : (
                        <Check size={20} className="text-blue-400" />
                    )}
                </button>

                {/* CSV Export - Logs only */}
                <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors min-h-[64px] disabled:opacity-50"
                >
                    <div className="flex items-center gap-3">
                        <FileText size={24} className="text-emerald-600" />
                        <div className="text-left">
                            <div className="font-bold text-emerald-800">Export as CSV</div>
                            <div className="text-xs text-emerald-600">
                                Spreadsheet format ({getFilteredLogs().length} logs)
                            </div>
                        </div>
                    </div>
                    {exporting && exportFormat === 'csv' ? (
                        <Loader size={20} className="text-emerald-600 animate-spin" />
                    ) : (
                        <Check size={20} className="text-emerald-400" />
                    )}
                </button>
            </div>

            {/* GDPR Notice */}
            <p className="text-xs text-stone-400 mt-4 text-center">
                Your data is yours. Export anytime for your records or to share with your healthcare provider.
            </p>
        </div>
    );
};

export default ExportPanel;
