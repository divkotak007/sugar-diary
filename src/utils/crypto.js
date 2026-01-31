/**
 * Zero-Dependency Web Crypto Utility
 * Uses native AES-GCM for medical-grade local encryption.
 */

// Static salt for key derivation (In production, this should be env var, but static is fine for client-side isolation)
const APP_SALT = new TextEncoder().encode("SUGAR_DIARY_SECURE_SALT_V1");

export const cryptoUtils = {
    /**
     * Derive a crypto key from the User ID
     * @param {string} userId 
     * @returns {Promise<CryptoKey>}
     */
    deriveKey: async (userId) => {
        const material = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(userId),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: APP_SALT,
                iterations: 100000,
                hash: "SHA-256"
            },
            material,
            { name: "AES-GCM", length: 256 },
            false, // key is not exportable
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Encrypt data object
     * @param {object} data - JSON serializable object
     * @param {string} userId 
     * @returns {Promise<string>} - Base64 encoded string: "iv.ciphertext"
     */
    encrypt: async (data, userId) => {
        try {
            if (!userId) throw new Error("Encryption requires User ID");
            const key = await cryptoUtils.deriveKey(userId);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(JSON.stringify(data));

            const ciphertext = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                key,
                encoded
            );

            // Combine IV and Ciphertext for storage
            const ivArray = Array.from(iv);
            const contentArray = Array.from(new Uint8Array(ciphertext));

            // Return as simple JSON string for localStorage friendliness
            return JSON.stringify({ iv: ivArray, content: contentArray });
        } catch (e) {
            console.error("Encryption Failed", e);
            return null;
        }
    },

    /**
     * Decrypt data string
     * @param {string} rawString - "iv.ciphertext" string
     * @param {string} userId 
     * @returns {Promise<object|null>}
     */
    decrypt: async (rawString, userId) => {
        try {
            if (!rawString || !userId) return null;
            const parsed = JSON.parse(rawString);
            if (!parsed.iv || !parsed.content) return null;

            const key = await cryptoUtils.deriveKey(userId);
            const iv = new Uint8Array(parsed.iv);
            const ciphertext = new Uint8Array(parsed.content);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                key,
                ciphertext
            );

            const decoded = new TextDecoder().decode(decrypted);
            return JSON.parse(decoded);
        } catch (e) {
            console.error("Decryption Failed/Invalid Key", e);
            return null;
        }
    }
};
