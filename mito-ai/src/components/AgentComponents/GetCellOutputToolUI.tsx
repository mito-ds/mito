/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';
import '../../../style/AgentToolUIComponent.css';


const GetCellOutputToolUI: React.FC = () => {

    return (
        <div className="agent-tool-ui-container">
            <div className="agent-tool-ui-content">
                <MagnifyingGlassIcon />
                <span>Taking a look at the cell output</span>
            </div>
        </div>
    )
}

export default GetCellOutputToolUI;