/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import ShimmerWrapper from './ShimmerWrapper';
import AppIcon from '../../icons/AppIcon';
import '../../../style/AgentToolUIComponent.css';

interface CreateStreamlitAppToolUIProps {
    isRunning?: boolean;
}

const CreateStreamlitAppToolUI: React.FC<CreateStreamlitAppToolUIProps> = ({ isRunning = false }) => {

    return (
        <div className="agent-tool-ui-container">
            <ShimmerWrapper isActive={isRunning}>
                <div className="agent-tool-ui-content">
                    <AppIcon />
                    <span>Creating Streamlit app</span>
                </div>
            </ShimmerWrapper>
        </div>
    )
}

export default CreateStreamlitAppToolUI;
