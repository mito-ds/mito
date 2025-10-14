/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getUserKey } from '../../restAPI/RestAPI';
import '../../../style/UsageBadge.css';
import { COMMAND_MITO_AI_SETTINGS_SUBSCRIPTION } from '../SettingsManager/SettingsManagerPlugin';

const MAX_FREE_USAGE = 150;
const SVG_SIZE = 16;
const CIRCLE_RADIUS = 5.5;
const CIRCLE_CENTER = SVG_SIZE / 2; // Center x and y coordinates

interface UsageBadgeProps {
    app: JupyterFrontEnd;
}

export interface UsageBadgeRef {
    refresh: () => Promise<void>;
}

const UsageBadge = forwardRef<UsageBadgeRef, UsageBadgeProps>(({ app }, ref) => {
    const [isPro, setIsPro] = useState<boolean>(false);
    const [usageCount, setUsageCount] = useState<number>(0);

    const getAiMitoApiNumUsages = async (): Promise<number> => {
        const usageCount = await getUserKey('ai_mito_api_num_usages');
        return usageCount ? parseInt(usageCount) : 0;
    };

    const fetchIsPro = async (): Promise<void> => {
        const isPro = await getUserKey('is_pro');
        setIsPro(isPro === 'True');
    };

    const fetchUsageCount = async (): Promise<void> => {
        const count = await getAiMitoApiNumUsages();
        setUsageCount(count);
    };

    // Expose refresh method to parent component
    useImperativeHandle(ref, () => ({
        refresh: async () => {
            await Promise.all([fetchIsPro(), fetchUsageCount()]);
        }
    }));

    useEffect(() => {
        void fetchIsPro();
        void fetchUsageCount();
    }, []);

    // Calculate progress
    const percentage = Math.min((usageCount / MAX_FREE_USAGE) * 100, 100);
    const circumference = 2 * Math.PI * CIRCLE_RADIUS;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Determine color based on usage - green to red
    const getColor = (): string => {
        if (percentage < 50) return 'var(--green-600)';
        if (percentage < 80) return 'var(--yellow-600)';
        return 'var(--red-500)';
    };

    if (isPro) {
        // If the user is pro, don't show the usage badge
        return null;
    }

    return (
        <div
            className="usage-badge"
            onClick={() => {
                void app.commands.execute(COMMAND_MITO_AI_SETTINGS_SUBSCRIPTION);
            }}
            title={`${usageCount}/${MAX_FREE_USAGE} free AI messages used`}
        >
            <svg className="usage-badge-svg" width={SVG_SIZE} height={SVG_SIZE}>
                {/* Background circle */}
                <circle
                    className="usage-badge-circle-background"
                    cx={CIRCLE_CENTER}
                    cy={CIRCLE_CENTER}
                    r={CIRCLE_RADIUS}
                />
                {/* Progress circle */}
                <circle
                    className="usage-badge-circle-progress"
                    style={{
                        stroke: getColor(),
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                    }}
                    cx={CIRCLE_CENTER}
                    cy={CIRCLE_CENTER}
                    r={CIRCLE_RADIUS}
                />
            </svg>
            <span className="usage-badge-text">
                {usageCount >= MAX_FREE_USAGE
                    ? 'Upgrade to Pro'
                    : `${usageCount}/${MAX_FREE_USAGE}`
                }
            </span>
        </div>
    );
});

UsageBadge.displayName = 'UsageBadge';

export default UsageBadge;
