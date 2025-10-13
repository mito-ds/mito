/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getUserKey } from '../../restAPI/RestAPI';
import '../../../style/UsageBadge.css';
import { COMMAND_MITO_AI_SETTINGS_SUBSCRIPTION } from '../SettingsManager/SettingsManagerPlugin';

const MAX_FREE_USAGE = 150;
const SVG_SIZE = 16;
const CIRCLE_RADIUS = 5.5;
const CIRCLE_CENTER = SVG_SIZE / 2; // Center x and y coordinates

const USAGE_COLORS = {
    GREEN: 'var(--green-500)',
    ORANGE: 'var(--yellow-600)',
    RED: 'var(--red-500)',
};

interface UsageBadgeProps {
    app: JupyterFrontEnd;
}

const UsageBadge: React.FC<UsageBadgeProps> = ({ app }) => {
    const [usageCount, setUsageCount] = useState<number>(0);

    const getAiMitoApiNumUsages = async (): Promise<number> => {
        const usageCount = await getUserKey('ai_mito_api_num_usages');
        return usageCount ? parseInt(usageCount) : 0;
    };

    useEffect(() => {
        const fetchUsageCount = async () => {
            const count = await getAiMitoApiNumUsages();
            setUsageCount(count);
        };
        fetchUsageCount();
    }, []);

    // Calculate progress
    const percentage = (usageCount / MAX_FREE_USAGE) * 100;
    const circumference = 2 * Math.PI * CIRCLE_RADIUS;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Determine color based on usage - green to red
    const getColor = () => {
        if (percentage < 50) return USAGE_COLORS.GREEN;
        if (percentage < 80) return USAGE_COLORS.ORANGE;
        return USAGE_COLORS.RED;
    };

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
};

export default UsageBadge;
