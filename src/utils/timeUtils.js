/**
 * Time Utilities for Strict Chronological Ordering
 */

/**
 * safely extracts milliseconds from various timestamp formats
 * @param {object|string|number} timestamp - The timestamp to parse
 * @returns {number} epoch milliseconds or 0 if invalid
 */
export const getLogTimestamp = (timestamp) => {
    if (!timestamp) return 0;

    // Firestore Timestamp object { seconds, nanoseconds }
    if (typeof timestamp === 'object' && timestamp.seconds) {
        return timestamp.seconds * 1000;
    }

    // JS Date object
    if (timestamp instanceof Date) {
        return timestamp.getTime();
    }

    // ISO String or other string dates
    if (typeof timestamp === 'string') {
        const t = new Date(timestamp).getTime();
        return isNaN(t) ? 0 : t;
    }

    // Already a number (milliseconds)
    if (typeof timestamp === 'number') {
        return timestamp;
    }

    return 0;
};

/**
 * Sorts logs in COMPULSORY DESCENDING order (Newest first)
 * Primary Sort: Timestamp (desc)
 * Tie-Breaker: ID (desc) for stability
 * @param {Array} logs - Array of log objects
 * @returns {Array} New sorted array
 */
export const sortLogsDes = (logs) => {
    if (!logs || !Array.isArray(logs)) return [];

    return [...logs].sort((a, b) => {
        const timeA = getLogTimestamp(a.timestamp);
        const timeB = getLogTimestamp(b.timestamp);

        // Primary: Time Descending
        if (timeB !== timeA) {
            return timeB - timeA;
        }

        // Secondary: Stable Tie-Breaker (ID String Descending)
        // Ensures newly created items (often higher IDs or just deterministic) don't jump around
        const idA = a.id || '';
        const idB = b.id || '';
        if (idA < idB) return 1;
        if (idA > idB) return -1;
        return 0;
    });
};
