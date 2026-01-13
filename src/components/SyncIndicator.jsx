/**
 * SyncIndicator Component
 * Shows online/offline status and pending sync count
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

/**
 * SyncIndicator - Visual indicator for sync status
 * @param {boolean} isOnline - Whether device is online
 * @param {number} pendingCount - Number of items pending sync
 * @param {boolean} isSyncing - Whether sync is in progress
 * @param {Date} lastSyncTime - Last successful sync timestamp
 * @param {function} onSync - Manual sync trigger
 * @param {boolean} compact - Whether to show compact version
 */
const SyncIndicator = ({
    isOnline,
    pendingCount = 0,
    isSyncing = false,
    lastSyncTime,
    onSync,
    compact = false
}) => {
    // Determine status
    const getStatus = () => {
        if (!isOnline) return 'offline';
        if (isSyncing) return 'syncing';
        if (pendingCount > 0) return 'pending';
        return 'synced';
    };

    const status = getStatus();

    // Status configurations
    const statusConfig = {
        offline: {
            icon: WifiOff,
            text: 'Offline',
            color: 'text-red-500',
            bg: 'bg-red-50',
            border: 'border-red-200'
        },
        syncing: {
            icon: RefreshCw,
            text: 'Syncing...',
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            animate: true
        },
        pending: {
            icon: AlertCircle,
            text: `${pendingCount} pending`,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-200'
        },
        synced: {
            icon: Check,
            text: 'Synced',
            color: 'text-green-500',
            bg: 'bg-green-50',
            border: 'border-green-200'
        }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    if (compact) {
        return (
            <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} ${config.border} border`}
                title={config.text}
            >
                <Icon
                    size={12}
                    className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}
                />
                {pendingCount > 0 && !isSyncing && (
                    <span className={`text-xs font-bold ${config.color}`}>
                        {pendingCount}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-between p-3 rounded-xl ${config.bg} ${config.border} border`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-white ${config.border} border`}>
                    <Icon
                        size={18}
                        className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}
                    />
                </div>
                <div>
                    <div className={`font-bold text-sm ${config.color}`}>
                        {config.text}
                    </div>
                    {lastSyncTime && status === 'synced' && (
                        <div className="text-xs text-stone-400">
                            Last sync: {formatTimeAgo(lastSyncTime)}
                        </div>
                    )}
                </div>
            </div>

            {/* Manual sync button */}
            {isOnline && pendingCount > 0 && !isSyncing && onSync && (
                <button
                    onClick={onSync}
                    className="px-4 py-2 bg-white rounded-lg border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors min-h-[44px]"
                    aria-label="Sync now"
                >
                    Sync Now
                </button>
            )}
        </div>
    );
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
    if (!date) return '';

    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return then.toLocaleDateString();
};

export default SyncIndicator;
