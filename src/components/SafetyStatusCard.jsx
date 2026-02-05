/**
 * SAFETY STATUS CARD
 * 
 * Shows current safety status and active features.
 * Can be placed in Settings or Dashboard.
 */

import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, Activity, Clock } from 'lucide-react';

const SafetyStatusCard = ({
    featureFlags,
    currentIOB = 0,
    lastInsulinDose = null,
    className = ''
}) => {
    const features = [
        {
            name: 'Safety Checks',
            enabled: featureFlags.ENABLE_SAFETY_CHECKS,
            description: 'IOB calculation, hypo blocks, dose limits',
            icon: Shield
        },
        {
            name: 'Input Validation',
            enabled: featureFlags.ENABLE_VALIDATION,
            description: 'Range checks, duplicate detection',
            icon: CheckCircle2
        },
        {
            name: 'IOB Indicator',
            enabled: featureFlags.SHOW_IOB_INDICATOR,
            description: 'Visual active insulin display',
            icon: Activity
        },
        {
            name: 'Data Cleanup',
            enabled: featureFlags.ENABLE_CLEANUP_TOOL,
            description: 'Duplicate removal tool',
            icon: AlertTriangle
        }
    ];

    const activeCount = features.filter(f => f.enabled).length;

    return (
        <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">Safety Status</h3>
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs font-bold rounded-full">
                    {activeCount}/{features.length} Active
                </span>
            </div>

            {/* Current IOB */}
            {featureFlags.ENABLE_SAFETY_CHECKS && currentIOB > 0 && (
                <div className="mb-4 p-3 bg-white/60 dark:bg-stone-800/60 rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600 dark:text-stone-400">Active Insulin (IOB)</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {currentIOB.toFixed(1)}u
                        </span>
                    </div>
                    {lastInsulinDose && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-stone-500 dark:text-stone-400">
                            <Clock className="w-3 h-3" />
                            Last dose: {lastInsulinDose.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}

            {/* Feature List */}
            <div className="space-y-2">
                {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <div
                            key={idx}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${feature.enabled
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50'
                                    : 'bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 opacity-60'
                                }`}
                        >
                            <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${feature.enabled ? 'text-green-600 dark:text-green-400' : 'text-stone-400'
                                }`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium ${feature.enabled ? 'text-green-900 dark:text-green-100' : 'text-stone-600 dark:text-stone-400'
                                        }`}>
                                        {feature.name}
                                    </p>
                                    {feature.enabled && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 text-[10px] font-bold rounded-full">
                                            ON
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Emergency Protection Notice */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/50 rounded-xl">
                <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>
                        <strong>Emergency Protection:</strong> Critical safety checks (>50u dose block) are ALWAYS active, regardless of settings.
                    </span>
                </p>
            </div>
        </div>
    );
};

export default SafetyStatusCard;
