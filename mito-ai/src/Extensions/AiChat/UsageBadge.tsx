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

interface UsageBadgeProps {
    app: JupyterFrontEnd;
}

const UsageBadge: React.FC<UsageBadgeProps> = ({ app }) => {
    const [isPro, setIsPro] = useState<boolean>(false);
    const [usageCount, setUsageCount] = useState<number>(0);

    const getAiMitoApiNumUsages = async (): Promise<number> => {
        const usageCount = await getUserKey('ai_mito_api_num_usages');
        return usageCount ? parseInt(usageCount) : 0;
    };

    useEffect(() => {
        const fetchIsPro = async (): Promise<void> => {
            const isPro = await getUserKey('is_pro');
            setIsPro(isPro === 'True');
        };
        void fetchIsPro();

        const fetchUsageCount = async (): Promise<void> => {
            const count = await getAiMitoApiNumUsages();
            setUsageCount(count);
        };
        void fetchUsageCount();
    }, []);

    // Calculate progress
    const percentage = (usageCount / MAX_FREE_USAGE) * 100;
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
};

export default UsageBadge;
