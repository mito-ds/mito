/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import Pencil from '../../icons/Pencil';
import ShimmerWrapper from './ShimmerWrapper';
import '../../../style/AgentToolUIComponent.css';

interface EditStreamlitAppToolUIProps {
    isRunning?: boolean;
}

const EditStreamlitAppToolUI: React.FC<EditStreamlitAppToolUIProps> = ({ isRunning = false }) => {

    return (
        <div className="agent-tool-ui-container">
            <ShimmerWrapper isActive={isRunning}>
                <div className="agent-tool-ui-content">
                    <Pencil />
                    <span>Editing Streamlit app</span>
                </div>
            </ShimmerWrapper>
        </div>
    )
}

export default EditStreamlitAppToolUI;
