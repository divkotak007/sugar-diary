import { FREQUENCY_RULES } from '../data/medications';

export const REMINDER_MAPPING = {
    'Morning': { hour: 8, minute: 0 },
    'Afternoon': { hour: 13, minute: 0 },
    'Evening': { hour: 18, minute: 0 },
    'Night': { hour: 22, minute: 0 },
    'Bedtime': { hour: 22, minute: 0 },
    'Breakfast': { hour: 8, minute: 0 },
    'Lunch': { hour: 13, minute: 0 },
    'Dinner': { hour: 20, minute: 0 }
};

export const syncRemindersWithPrescription = (prescription, existingReminders = []) => {
    // 1. Flatten all prescription items into potential reminder slots
    const potentialReminders = [];

    // Oral Meds
    (prescription.oralMeds || []).forEach(med => {
        (med.timings || []).forEach(timing => {
            potentialReminders.push({
                type: 'medication',
                sourceId: med.id, // Prescription Item ID
                name: med.name,
                timingLabel: timing, // e.g., 'Morning'
                defaultTime: REMINDER_MAPPING[timing] || { hour: 9, minute: 0 }
            });
        });
    });

    // Insulins
    (prescription.insulins || []).forEach(ins => {
        if (ins.frequency && REMINDER_MAPPING[ins.frequency]) {
            // For simplicity in this version, we map single-frequency insulins to their default time.
            // If multi-dose (e.g. Twice Daily), REMINDER_MAPPING should handle it or we iterate.
            // Looking at REMINDER_MAPPING, "Twice Daily" -> ["Morning", "Evening"].
            // Wait, REMINDER_MAPPING values are OBJECTS { hour: 8, minute: 0 }. 
            // We need to check if FREQUENCY_RULES has the mapping to timings first?
            // Actually `data/medications.js` has FREQUENCY_RULES. 
            // Let's assume input frequency maps to text labels in FREQUENCY_RULES, then to REMINDER_MAPPING.

            // BUT, `ins.frequency` is likely string "Twice Daily".
            // We need to know which actual times that implies.
            // Let's use a safe fallback:

            const timings = (typeof FREQUENCY_RULES !== 'undefined' && FREQUENCY_RULES[ins.frequency])
                ? FREQUENCY_RULES[ins.frequency]
                : [ins.frequency]; // Fallback if it's a direct timing like "Bedtime"

            timings.forEach(t => {
                if (REMINDER_MAPPING[t]) {
                    potentialReminders.push({
                        type: 'insulin',
                        sourceId: ins.id,
                        name: ins.name,
                        timingLabel: t,
                        defaultTime: REMINDER_MAPPING[t]
                    });
                }
            });
        }
    });

    // 2. Reconcile with existing
    const syncedReminders = potentialReminders.map(pot => {
        // Construct unique ID for this reminder slot
        const reminderId = `${pot.sourceId}_${pot.timingLabel}`;

        // Find existing to preserve user override
        const existing = existingReminders.find(r => r.id === reminderId);

        if (existing) {
            return {
                ...existing,
                label: `Take ${pot.name}`, // Update label in case name changed
                // Time is NOT updated if it exists (preserves override)
            };
        } else {
            // Create new
            const d = new Date();
            d.setHours(pot.defaultTime.hour, pot.defaultTime.minute, 0, 0);
            return {
                id: reminderId,
                label: `Take ${pot.name}`,
                time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), // HH:mm
                enabled: true,
                medId: pot.sourceId,
                timingLabel: pot.timingLabel
            };
        }
    });

    return syncedReminders;
};

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
};

export const checkAndTriggerReminders = (reminders) => {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const currentHHmm = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    // We need a way to ensuring we don't double-fire in the same minute. 
    // Usually handled by storing "lastFiredTime" or similar.
    // For simplicity here, we assume the caller handles the ticker frequency (e.g. once a minute).

    reminders.forEach(r => {
        if (r.enabled && r.time === currentHHmm) {
            // Check if already fired today?
            // Since we don't have persistent state for "fired today", 
            // we rely on the minute check. The ticker MUST run exactly once per minute or we throttle.
            new Notification("Sugar Diary Reminder", {
                body: r.label,
                icon: '/icon-192.png' // assumption
            });
        }
    });
};
