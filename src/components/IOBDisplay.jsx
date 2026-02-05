/**
 * IOB DISPLAY WRAPPER
 * 
 * Simple wrapper to display IOB indicator in the app.
 * Drop this component anywhere in your UI.
 */

import React, { useMemo } from 'react';
import IOBIndicator from './IOBIndicator';
import { calculateIOB } from '../safety/clinical';
import { getLogTimestamp } from '../utils/timeUtils';

const IOBDisplay = ({ fullHistory, className = '' }) => {
    // Calculate current IOB from insulin logs
    const { iob, insulinLogs } = useMemo(() => {
        if (!fullHistory || fullHistory.length === 0) {
            return { iob: 0, insulinLogs: [] };
        }

        const logs = fullHistory
            .filter(l => !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0)
            .map(l => ({
                timestamp: getLogTimestamp(l.timestamp),
                insulinDoses: l.insulinDoses
            }));

        const currentIOB = calculateIOB(logs);

        return { iob: currentIOB, insulinLogs: logs };
    }, [fullHistory]);

    // Don't show if no insulin history
    if (insulinLogs.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <IOBIndicator
                insulinLogs={insulinLogs}
                currentIOB={iob}
            />
        </div>
    );
};

export default IOBDisplay;
