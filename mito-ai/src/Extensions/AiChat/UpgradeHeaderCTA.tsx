/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getUserKey } from '../../restAPI/RestAPI';
import '../../../style/UpgradeCTAHeader.css';
// import { COMMAND_MITO_AI_SETTINGS } from '../SettingsManager/SettingsManagerPlugin';

interface UpgradeHeaderCTAProps {
    app: JupyterFrontEnd;
}

const UpgradeHeaderCTA: React.FC<UpgradeHeaderCTAProps> = ({ app }) => {
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

    const maxUsage = 150;
    const percentage = (usageCount / maxUsage) * 100;
    const radius = 6.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Color changes based on usage - green to red
    const getColor = () => {
        if (percentage < 50) return '#5CB85C'; // Green
        if (percentage < 80) return '#FFA500'; // Orange/Yellow
        return '#DC3545'; // Red
    };

    return (
        <div className="upgrade-header-cta-container">
            <svg className="upgrade-header-cta-svg" width="18" height="18">
                {/* Background circle */}
                <circle
                    className="upgrade-header-cta-circle-background"
                    cx="9"
                    cy="9"
                    r={radius}
                />
                {/* Progress circle */}
                <circle
                    className="upgrade-header-cta-circle-progress"
                    style={{
                        stroke: getColor(),
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                    }}
                    cx="9"
                    cy="9"
                    r={radius}
                />
            </svg>
        </div>
    );
};

export default UpgradeHeaderCTA;
