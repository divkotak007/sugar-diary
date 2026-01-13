/**
 * Device Integration Service
 * Placeholder interfaces for future CGM, glucometer, and health platform integrations
 */

// --- SUPPORTED DEVICE TYPES ---
export const DEVICE_TYPES = {
    CGM: 'cgm',
    GLUCOMETER: 'glucometer',
    APPLE_HEALTH: 'apple_health',
    GOOGLE_FIT: 'google_fit'
};

// --- DEVICE STATUS ---
export const DEVICE_STATUS = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    SYNCING: 'syncing',
    ERROR: 'error'
};

/**
 * Base Device Adapter class
 * Abstract interface for device integrations
 */
export class DeviceAdapter {
    constructor(deviceType, config = {}) {
        this.deviceType = deviceType;
        this.config = config;
        this.status = DEVICE_STATUS.DISCONNECTED;
        this.deviceId = null;
        this.lastSync = null;
        this.listeners = [];
    }

    /**
     * Connect to device
     * @returns {Promise<boolean>} Success status
     */
    async connect() {
        throw new Error('connect() must be implemented by subclass');
    }

    /**
     * Disconnect from device
     * @returns {Promise<void>}
     */
    async disconnect() {
        this.status = DEVICE_STATUS.DISCONNECTED;
        this.deviceId = null;
    }

    /**
     * Get latest reading from device
     * @returns {Promise<object>} Latest reading
     */
    async getLatestReading() {
        throw new Error('getLatestReading() must be implemented by subclass');
    }

    /**
     * Get historical readings
     * @param {Date} startDate - Start of date range
     * @param {Date} endDate - End of date range
     * @returns {Promise<Array>} Array of readings
     */
    async getReadings(startDate, endDate) {
        throw new Error('getReadings() must be implemented by subclass');
    }

    /**
     * Subscribe to real-time readings
     * @param {function} callback - Callback function for new readings
     * @returns {function} Unsubscribe function
     */
    onReading(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify listeners of new reading
     * @param {object} reading - New reading data
     */
    _notifyListeners(reading) {
        this.listeners.forEach(callback => {
            try {
                callback(reading);
            } catch (error) {
                console.error('Device listener error:', error);
            }
        });
    }

    /**
     * Get device status
     * @returns {string} Current status
     */
    getStatus() {
        return this.status;
    }

    /**
     * Get device info
     * @returns {object} Device information
     */
    getInfo() {
        return {
            type: this.deviceType,
            deviceId: this.deviceId,
            status: this.status,
            lastSync: this.lastSync
        };
    }
}

/**
 * CGM (Continuous Glucose Monitor) Adapter
 * Placeholder for CGM integrations (Dexcom, Libre, etc.)
 */
export class CGMAdapter extends DeviceAdapter {
    constructor(config = {}) {
        super(DEVICE_TYPES.CGM, config);
        this.manufacturer = config.manufacturer || 'generic';
    }

    async connect() {
        // Placeholder - would integrate with manufacturer SDK
        console.log('CGM integration not yet implemented');
        this.status = DEVICE_STATUS.ERROR;
        return false;
    }

    async getLatestReading() {
        // Placeholder
        return null;
    }

    async getReadings(startDate, endDate) {
        // Placeholder
        return [];
    }
}

/**
 * Bluetooth Glucometer Adapter
 * Placeholder for BLE glucometer integrations
 */
export class BluetoothGlucometerAdapter extends DeviceAdapter {
    constructor(config = {}) {
        super(DEVICE_TYPES.GLUCOMETER, config);
    }

    async connect() {
        // Check for Web Bluetooth API support
        if (!navigator.bluetooth) {
            console.warn('Web Bluetooth API not supported');
            this.status = DEVICE_STATUS.ERROR;
            return false;
        }

        try {
            this.status = DEVICE_STATUS.CONNECTING;

            // Placeholder - would request Bluetooth device
            // const device = await navigator.bluetooth.requestDevice({
            //   filters: [{ services: ['glucose'] }]
            // });

            console.log('Bluetooth glucometer integration not yet implemented');
            this.status = DEVICE_STATUS.ERROR;
            return false;
        } catch (error) {
            console.error('Bluetooth connection error:', error);
            this.status = DEVICE_STATUS.ERROR;
            return false;
        }
    }

    async getLatestReading() {
        // Placeholder
        return null;
    }

    async getReadings(startDate, endDate) {
        // Placeholder
        return [];
    }
}

/**
 * Apple Health Adapter
 * Placeholder for Apple HealthKit integration
 */
export class AppleHealthAdapter extends DeviceAdapter {
    constructor(config = {}) {
        super(DEVICE_TYPES.APPLE_HEALTH, config);
    }

    async connect() {
        // Would require native iOS integration
        console.log('Apple Health integration requires native iOS bridge');
        this.status = DEVICE_STATUS.ERROR;
        return false;
    }

    async getLatestReading() {
        return null;
    }

    async getReadings(startDate, endDate) {
        return [];
    }
}

/**
 * Google Fit Adapter
 * Placeholder for Google Fit integration
 */
export class GoogleFitAdapter extends DeviceAdapter {
    constructor(config = {}) {
        super(DEVICE_TYPES.GOOGLE_FIT, config);
    }

    async connect() {
        // Would integrate with Google Fit REST API
        console.log('Google Fit integration not yet implemented');
        this.status = DEVICE_STATUS.ERROR;
        return false;
    }

    async getLatestReading() {
        return null;
    }

    async getReadings(startDate, endDate) {
        return [];
    }
}

/**
 * Device Manager
 * Manages multiple device adapters
 */
export class DeviceManager {
    constructor() {
        this.adapters = new Map();
    }

    /**
     * Register a device adapter
     * @param {string} id - Unique identifier for the adapter
     * @param {DeviceAdapter} adapter - Device adapter instance
     */
    registerAdapter(id, adapter) {
        this.adapters.set(id, adapter);
    }

    /**
     * Get a registered adapter
     * @param {string} id - Adapter identifier
     * @returns {DeviceAdapter} Adapter instance
     */
    getAdapter(id) {
        return this.adapters.get(id);
    }

    /**
     * Get all registered adapters
     * @returns {Array} Array of adapter info
     */
    getAllAdapters() {
        const adapters = [];
        this.adapters.forEach((adapter, id) => {
            adapters.push({ id, ...adapter.getInfo() });
        });
        return adapters;
    }

    /**
     * Disconnect all adapters
     */
    async disconnectAll() {
        const promises = [];
        this.adapters.forEach(adapter => {
            promises.push(adapter.disconnect());
        });
        await Promise.all(promises);
    }
}

// Create singleton device manager
export const deviceManager = new DeviceManager();

export default {
    DEVICE_TYPES,
    DEVICE_STATUS,
    DeviceAdapter,
    CGMAdapter,
    BluetoothGlucometerAdapter,
    AppleHealthAdapter,
    GoogleFitAdapter,
    DeviceManager,
    deviceManager
};
