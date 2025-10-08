/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import Pencil from '../../icons/Pencil';
import '../../../style/AgentToolUIComponent.css';

const EditStreamlitAppToolUI: React.FC = () => {

    return (
        <div className="agent-tool-ui-container">
            <div className="agent-tool-ui-content">
                <Pencil />
                <span>Editing Streamlit app</span>
            </div>
        </div>
    )
}

export default EditStreamlitAppToolUI;
