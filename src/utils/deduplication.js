/**
 * DEDUPLICATION UTILITIES
 * 
 * Tools for finding and removing duplicate log entries.
 * Safe, user-controlled cleanup with backup capability.
 * 
 * ZERO REGRESSION: Optional tools, user must trigger manually.
 */

import { collection, getDocs, writeBatch, doc, query, orderBy } from 'firebase/firestore';

// ===== DUPLICATE DETECTION =====

/**
 * Find duplicate logs based on timestamp and value similarity
 * 
 * @param {Array} logs - Array of log objects
 * @param {object} options - Detection options
 * @returns {object} Duplicate analysis results
 */
export const findDuplicates = (logs, options = {}) => {
    const {
        timeWindowMinutes = 5,      // Consider duplicates within this window
        valueTolerance = 0.1,        // Tolerance for value comparison
        strictMode = false           // Require exact matches
    } = options;

    const duplicateGroups = [];
    const seen = new Map();

    // Sort by timestamp
    const sortedLogs = [...logs].sort((a, b) => {
        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        return timeA - timeB;
    });

    sortedLogs.forEach((log, index) => {
        const timestamp = getTimestamp(log);
        const value = getValue(log);

        if (!timestamp || value === null) return;

        // Create time window key (rounded to nearest minute)
        const timeKey = Math.floor(timestamp / (60 * 1000));

        // Check for duplicates in time window
        for (let offset = -timeWindowMinutes; offset <= timeWindowMinutes; offset++) {
            const checkKey = timeKey + offset;
            const candidates = seen.get(checkKey) || [];

            for (const candidate of candidates) {
                const candidateValue = getValue(candidate.log);
                const timeDiff = Math.abs(timestamp - getTimestamp(candidate.log)) / (60 * 1000);

                // Check if it's a duplicate
                const isSameTime = timeDiff <= timeWindowMinutes;
                const isSameValue = strictMode
                    ? value === candidateValue
                    : Math.abs(value - candidateValue) <= valueTolerance;

                if (isSameTime && isSameValue) {
                    // Found a duplicate
                    const existingGroup = duplicateGroups.find(g =>
                        g.logs.some(l => l.id === candidate.log.id)
                    );

                    if (existingGroup) {
                        existingGroup.logs.push(log);
                    } else {
                        duplicateGroups.push({
                            timestamp: new Date(timestamp),
                            value,
                            logs: [candidate.log, log],
                            timeDiffMinutes: timeDiff
                        });
                    }
                }
            }
        }

        // Add to seen map
        if (!seen.has(timeKey)) {
            seen.set(timeKey, []);
        }
        seen.get(timeKey).push({ log, index });
    });

    return {
        totalLogs: logs.length,
        duplicateGroups: duplicateGroups.length,
        totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.logs.length - 1, 0),
        groups: duplicateGroups,
        uniqueLogs: logs.length - duplicateGroups.reduce((sum, g) => sum + g.logs.length - 1, 0)
    };
};

/**
 * Remove duplicate logs from Firestore
 * 
 * @param {object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} collectionName - Collection to clean
 * @param {Array} duplicateGroups - Groups from findDuplicates
 * @param {string} strategy - 'keep-first' or 'keep-last'
 * @returns {object} Cleanup results
 */
export const removeDuplicates = async (db, userId, collectionName, duplicateGroups, strategy = 'keep-first') => {
    const appId = 'sugar-diary-v1';
    const batch = writeBatch(db);
    let deletedCount = 0;
    const deletedIds = [];

    duplicateGroups.forEach(group => {
        // Sort logs in group by timestamp
        const sorted = [...group.logs].sort((a, b) => {
            const timeA = getTimestamp(a);
            const timeB = getTimestamp(b);
            return timeA - timeB;
        });

        // Determine which to keep
        const toKeep = strategy === 'keep-first' ? sorted[0] : sorted[sorted.length - 1];
        const toDelete = sorted.filter(log => log.id !== toKeep.id);

        // Add deletions to batch
        toDelete.forEach(log => {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, collectionName, log.id);
            batch.delete(docRef);
            deletedIds.push(log.id);
            deletedCount++;
        });
    });

    // Execute batch delete
    if (deletedCount > 0) {
        await batch.commit();
    }

    return {
        deletedCount,
        deletedIds,
        keptCount: duplicateGroups.length,
        strategy
    };
};

/**
 * Create backup of logs before cleanup
 * 
 * @param {Array} logs - Logs to backup
 * @returns {string} Backup data as JSON string
 */
export const createBackup = (logs) => {
    const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        count: logs.length,
        logs: logs.map(log => ({
            ...log,
            // Convert Firestore timestamps to ISO strings
            timestamp: log.timestamp?.toDate ? log.timestamp.toDate().toISOString() : log.timestamp
        }))
    };

    return JSON.stringify(backup, null, 2);
};

/**
 * Restore logs from backup
 * 
 * @param {string} backupJson - Backup JSON string
 * @returns {Array} Restored logs
 */
export const restoreFromBackup = (backupJson) => {
    try {
        const backup = JSON.parse(backupJson);

        if (!backup.logs || !Array.isArray(backup.logs)) {
            throw new Error('Invalid backup format');
        }

        return backup.logs.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp)
        }));
    } catch (error) {
        console.error('Restore failed:', error);
        throw new Error('Failed to restore from backup: ' + error.message);
    }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get timestamp from log object (handles different formats)
 */
const getTimestamp = (log) => {
    if (!log.timestamp) return null;

    if (log.timestamp instanceof Date) {
        return log.timestamp.getTime();
    }

    if (log.timestamp.seconds) {
        return log.timestamp.seconds * 1000;
    }

    if (typeof log.timestamp === 'number') {
        return log.timestamp;
    }

    return null;
};

/**
 * Get value from log object (handles different log types)
 */
const getValue = (log) => {
    // Sugar log
    if (log.hgt !== undefined) return parseFloat(log.hgt);

    // Insulin log
    if (log.units !== undefined) return parseFloat(log.units);
    if (log.insulinDoses) {
        const total = Object.values(log.insulinDoses).reduce((sum, val) => sum + parseFloat(val || 0), 0);
        return total;
    }

    // Meal log
    if (log.carbs !== undefined) return parseFloat(log.carbs);

    // Vital log
    if (log.value !== undefined) return parseFloat(log.value);

    return null;
};

// ===== DATA QUALITY ANALYSIS =====

/**
 * Analyze data quality issues
 * 
 * @param {Array} logs - Logs to analyze
 * @returns {object} Quality analysis report
 */
export const analyzeDataQuality = (logs) => {
    const issues = {
        missingTimestamp: [],
        missingValue: [],
        invalidValue: [],
        futureTimestamp: [],
        oldTimestamp: [],
        outliers: []
    };

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const values = [];

    logs.forEach(log => {
        const timestamp = getTimestamp(log);
        const value = getValue(log);

        // Check for missing data
        if (!timestamp) {
            issues.missingTimestamp.push(log);
        }

        if (value === null) {
            issues.missingValue.push(log);
        }

        // Check for invalid values
        if (value !== null) {
            if (isNaN(value) || value < 0) {
                issues.invalidValue.push(log);
            } else {
                values.push(value);
            }
        }

        // Check timestamp issues
        if (timestamp) {
            if (timestamp > now) {
                issues.futureTimestamp.push(log);
            }

            if (timestamp < sevenDaysAgo) {
                issues.oldTimestamp.push(log);
            }
        }
    });

    // Detect outliers (values > 3 standard deviations from mean)
    if (values.length > 10) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        logs.forEach(log => {
            const value = getValue(log);
            if (value !== null && Math.abs(value - mean) > 3 * stdDev) {
                issues.outliers.push({ log, value, mean, stdDev });
            }
        });
    }

    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

    return {
        totalLogs: logs.length,
        totalIssues,
        issueRate: (totalIssues / logs.length * 100).toFixed(1) + '%',
        issues,
        summary: {
            missingTimestamp: issues.missingTimestamp.length,
            missingValue: issues.missingValue.length,
            invalidValue: issues.invalidValue.length,
            futureTimestamp: issues.futureTimestamp.length,
            oldTimestamp: issues.oldTimestamp.length,
            outliers: issues.outliers.length
        }
    };
};

// ===== EXPORT =====

export default {
    findDuplicates,
    removeDuplicates,
    createBackup,
    restoreFromBackup,
    analyzeDataQuality
};
