/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import PlayButtonIcon from '../../icons/PlayButtonIcon';
import '../../../style/RunAllCellsToolUI.css';


const RunAllCellsToolUI: React.FC = () => {

    return (
        <div className="run-all-cells-container">
            <div className="run-all-cells-content">
                <PlayButtonIcon />
                <span>Running all cells in the notebook</span>
            </div>
        </div>
    )
}

export default RunAllCellsToolUI;
