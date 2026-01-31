/**
 * Sensory Feedback Utility
 * Handles Haptics (Vibration) and Sound (Web Audio API)
 * Zero-asset implementation for lightweight performance.
 */

// Simple Audio Context Cache
let audioCtx = null;

const initAudio = () => {
    if (!audioCtx && typeof window !== 'undefined' && window.AudioContext) {
        audioCtx = new window.AudioContext();
    }
};

export const feedback = {
    /**
     * Trigger Haptic Feedback
     * @param {boolean} enabled 
     * @param {string} type - 'selection', 'light', 'medium', 'heavy', 'success', 'error'
     */
    haptic: (enabled, type = 'medium') => {
        if (!enabled || typeof window === 'undefined' || !window.navigator?.vibrate) return;

        try {
            switch (type) {
                case 'selection': window.navigator.vibrate(5); break; // Very subtle for tiles
                case 'light': window.navigator.vibrate(10); break;
                case 'medium': window.navigator.vibrate(40); break;
                case 'heavy': window.navigator.vibrate([50, 50, 50]); break;
                case 'success': window.navigator.vibrate([10, 30, 10]); break;
                case 'error': window.navigator.vibrate([50, 100, 50, 100]); break;
                default: window.navigator.vibrate(20);
            }
        } catch (e) { /* ignore */ }
    },

    /**
     * Trigger Sound Feedback (Synthesized)
     * @param {boolean} enabled 
     * @param {string} type - 'click', 'tick', 'success'
     */
    sound: (enabled, type = 'click') => {
        if (!enabled || typeof window === 'undefined') return;

        try {
            initAudio();
            if (!audioCtx || audioCtx.state === 'suspended') {
                // Resume if suspended (browser autoplay policy)
                audioCtx?.resume().catch(() => { });
            }
            if (!audioCtx) return;

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'click') {
                // High pitch, short decay (UI Tap)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                gain.gain.setValueAtTime(0.05, now); // Quiet
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'tick') {
                // Lower pitch (Toggle/Switch)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === 'success') {
                // Ascending chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.warn("Sound Error", e);
        }
    },

    /**
     * Trigger standardized feedback (Haptic + Sound)
     * @param {boolean} hapticsEnabled 
     * @param {boolean} soundEnabled 
     * @param {string} type - 'selection'|'tick', 'light'|'click', 'success', 'medium'
     */
    trigger: (hapticsEnabled, soundEnabled, type = 'medium') => {
        const hapticType = type === 'tick' ? 'selection' : type;
        const soundType = type === 'tick' ? 'tick' : (type === 'success' ? 'success' : 'click');

        feedback.haptic(hapticsEnabled, hapticType);
        feedback.sound(soundEnabled, soundType);
    }
};
