/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import PlayButtonIcon from '../../icons/PlayButtonIcon';
import '../../../style/AgentToolUIComponent.css';
import { classNames } from '../../utils/classNames';


const RunAllCellsToolUI: React.FC<{inErrorFixup?: boolean}> = ({inErrorFixup}) => {

    return (
        <div className={classNames('agent-tool-ui-container', {
            'agent-tool-ui-error-fixup': inErrorFixup,
        })}>
            <div className="agent-tool-ui-content">
                <PlayButtonIcon />
                <span>Running all cells</span>
            </div>
        </div>
    )
}

export default RunAllCellsToolUI;