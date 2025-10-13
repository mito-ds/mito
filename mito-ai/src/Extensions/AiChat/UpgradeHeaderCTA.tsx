/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getUserKey } from '../../restAPI/RestAPI';
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

    return (
        <div>
            {usageCount}/150
        </div>
    );
};

export default UpgradeHeaderCTA;
