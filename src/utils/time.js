/**
 * Global Time Utilities for Sugar Diary
 * 
 * CORE PRINCIPLE:
 * All internal logic, storage, and comparisons use UTC Epoch Milliseconds (Number).
 * Strings are ONLY for UI display and input binding.
 * No timezone offsets are applied to business logic.
 */

// 1. Get Current Time (The Logical "Now")
export const getEpoch = () => Date.now();

// 2. Format for UI Input (datetime-local)
// Returns "YYYY-MM-DDTHH:mm" in LOCAL time (because input is local)
// This is purely for display binding. The value on change is converted back.
export const toInputString = (epochMs) => {
    if (!epochMs) return '';
    // Handle 0 or invalid
    const ms = safeEpoch(epochMs);
    if (!ms) return '';

    const d = new Date(ms);
    const pad = (n) => n.toString().padStart(2, '0');
    return (
        d.getFullYear() +
        '-' +
        pad(d.getMonth() + 1) +
        '-' +
        pad(d.getDate()) +
        'T' +
        pad(d.getHours()) +
        ':' +
        pad(d.getMinutes())
    );
};

// 3. Parse UI Input (datetime-local string -> Epoch MS)
// Takes "YYYY-MM-DDTHH:mm" and treats it as LOCAL time to get absolute epoch
export const fromInputString = (dateString) => {
    if (!dateString) return 0;
    const d = new Date(dateString);
    return d.getTime(); // Returns epoch MS
};

// 4. Format for Display (User Friendly)
export const formatDisplayDate = (epochMs, options = {}) => {
    if (!epochMs) return '-';
    const ts = safeEpoch(epochMs);
    return new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    });
};

// 5. Validation Helpers
export const isFuture = (epochMs) => safeEpoch(epochMs) > getEpoch();

// 6. Universal Timestamp Parser (Handles Number, Firestore Timestamp, String, Date)
export const safeEpoch = (ts) => {
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    if (ts.seconds) return ts.seconds * 1000; // Firestore Timestamp
    if (ts instanceof Date) return ts.getTime();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const minutesSince = (ts) => Math.floor((getEpoch() - safeEpoch(ts)) / 60000);

export const canEdit = (timestamp) => minutesSince(timestamp) <= 30;
// Deletion is ALWAYS allowed (internally), but UI must enforce confirmation.
// The "Lock" on deletion has been removed per V2 Governance.
export const canDelete = (timestamp) => true;
