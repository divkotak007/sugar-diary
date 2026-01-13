/**
 * Export Service
 * Handles data export to JSON and CSV formats
 * GDPR-compliant data export and organization
 */

/**
 * Export user data to JSON format
 * @param {object} userData - User data object containing profile, prescription, logs
 * @param {object} options - Export options
 * @returns {string} JSON string
 */
export const exportToJSON = (userData, options = {}) => {
    const { pretty = true, includeMetadata = true } = options;

    const exportData = {
        ...userData,
        exportedAt: new Date().toISOString(),
        exportVersion: '2.0',
        appName: 'Sugar Diary'
    };

    if (!includeMetadata) {
        delete exportData.exportedAt;
        delete exportData.exportVersion;
        delete exportData.appName;
    }

    return pretty
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);
};

/**
 * Export logs to CSV format
 * @param {Array} logs - Array of log entries
 * @param {object} options - Export options
 * @returns {string} CSV string
 */
export const exportToCSV = (logs, options = {}) => {
    const { includeHeaders = true } = options;

    if (!logs || logs.length === 0) {
        return includeHeaders ? 'No data to export' : '';
    }

    // Define CSV columns
    const columns = [
        { key: 'timestamp', header: 'Date/Time', formatter: formatTimestamp },
        { key: 'hgt', header: 'Blood Sugar (mg/dL)' },
        { key: 'mealStatus', header: 'Meal Status' },
        { key: 'insulinDoses', header: 'Insulin Doses', formatter: formatInsulinDoses },
        { key: 'medsTaken', header: 'Medications Taken', formatter: formatMedsTaken },
        { key: 'tags', header: 'Tags', formatter: formatTags },
        { key: 'type', header: 'Entry Type' }
    ];

    // Build CSV content
    const rows = [];

    if (includeHeaders) {
        rows.push(columns.map(col => col.header).join(','));
    }

    logs.forEach(log => {
        const row = columns.map(col => {
            let value = log[col.key];
            if (col.formatter) {
                value = col.formatter(value, log);
            }
            return escapeCSV(value);
        });
        rows.push(row.join(','));
    });

    return rows.join('\n');
};

/**
 * Organize logs by date
 * @param {Array} logs - Array of log entries
 * @returns {object} Logs organized by date
 */
export const organizeByDate = (logs) => {
    const organized = {};

    logs.forEach(log => {
        const date = formatDate(log.timestamp);
        if (!organized[date]) {
            organized[date] = [];
        }
        organized[date].push(log);
    });

    // Sort dates in descending order
    const sortedDates = Object.keys(organized).sort((a, b) => new Date(b) - new Date(a));
    const result = {};
    sortedDates.forEach(date => {
        result[date] = organized[date];
    });

    return result;
};

/**
 * Organize logs by type
 * @param {Array} logs - Array of log entries
 * @returns {object} Logs organized by type
 */
export const organizeByType = (logs) => {
    const organized = {
        glucose_readings: [],
        vital_updates: [],
        prescription_updates: [],
        other: []
    };

    logs.forEach(log => {
        if (log.hgt !== undefined) {
            organized.glucose_readings.push(log);
        } else if (log.type === 'vital_update') {
            organized.vital_updates.push(log);
        } else if (log.type === 'prescription_update') {
            organized.prescription_updates.push(log);
        } else {
            organized.other.push(log);
        }
    });

    return organized;
};

/**
 * Download data as a file
 * @param {string} content - File content
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type of the file
 */
export const downloadFile = (content, filename, mimeType = 'application/json') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

/**
 * Export all user data as JSON file
 * @param {object} userData - Complete user data
 * @param {string} userName - User's name for filename
 */
export const downloadAllDataAsJSON = (userData, userName = 'User') => {
    const content = exportToJSON(userData);
    const date = new Date().toISOString().split('T')[0];
    const filename = `SugarDiary_${userName.replace(/\s+/g, '_')}_${date}.json`;
    downloadFile(content, filename, 'application/json');
};

/**
 * Export logs as CSV file
 * @param {Array} logs - Log entries to export
 * @param {string} userName - User's name for filename
 * @param {string} dateRange - Optional date range for filename
 */
export const downloadLogsAsCSV = (logs, userName = 'User', dateRange = '') => {
    const content = exportToCSV(logs);
    const date = new Date().toISOString().split('T')[0];
    const rangeText = dateRange ? `_${dateRange}` : '';
    const filename = `SugarDiary_Logs_${userName.replace(/\s+/g, '_')}${rangeText}_${date}.csv`;
    downloadFile(content, filename, 'text/csv');
};

/**
 * Generate a summary report
 * @param {object} userData - Complete user data
 * @returns {object} Summary statistics
 */
export const generateSummaryReport = (userData) => {
    const { profile, prescription, logs } = userData;

    // Filter glucose readings
    const glucoseReadings = logs.filter(log => log.hgt !== undefined);
    const glucoseValues = glucoseReadings.map(log => parseFloat(log.hgt));

    // Calculate statistics
    const stats = {
        totalEntries: logs.length,
        glucoseReadings: glucoseReadings.length,
        dateRange: {
            start: logs.length > 0 ? formatDate(logs[logs.length - 1].timestamp) : null,
            end: logs.length > 0 ? formatDate(logs[0].timestamp) : null
        }
    };

    if (glucoseValues.length > 0) {
        stats.glucose = {
            average: (glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length).toFixed(1),
            min: Math.min(...glucoseValues),
            max: Math.max(...glucoseValues),
            inRange: glucoseValues.filter(v => v >= 70 && v <= 180).length,
            belowRange: glucoseValues.filter(v => v < 70).length,
            aboveRange: glucoseValues.filter(v => v > 180).length
        };
        stats.glucose.timeInRange = ((stats.glucose.inRange / glucoseValues.length) * 100).toFixed(1);
    }

    stats.profile = {
        currentWeight: profile?.weight,
        currentHbA1c: profile?.hba1c,
        currentCreatinine: profile?.creatinine
    };

    stats.medications = {
        insulinCount: prescription?.insulins?.length || 0,
        oralMedCount: prescription?.oralMeds?.length || 0
    };

    return stats;
};

// --- HELPER FUNCTIONS ---

const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleString();
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toISOString().split('T')[0];
};

const formatInsulinDoses = (doses, log) => {
    if (!doses || Object.keys(doses).length === 0) return '';

    const parts = Object.entries(doses).map(([id, dose]) => {
        const insulin = log.snapshot?.prescription?.insulins?.find(i => i.id === id);
        const name = insulin?.name || 'Insulin';
        return `${name}: ${dose}u`;
    });

    return parts.join('; ');
};

const formatMedsTaken = (meds) => {
    if (!meds || meds.length === 0) return '';
    return meds.join('; ');
};

const formatTags = (tags) => {
    if (!tags || tags.length === 0) return '';
    return tags.join('; ');
};

const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export default {
    exportToJSON,
    exportToCSV,
    organizeByDate,
    organizeByType,
    downloadFile,
    downloadAllDataAsJSON,
    downloadLogsAsCSV,
    generateSummaryReport
};
