/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';
import '../../../style/GetCellOutputToolUI.css';

interface GetCellOutputProps {}

const GetCellOutputToolUI: React.FC<GetCellOutputProps> = ({}) => {

    return (
        <div className="get-cell-output-container">
            <div className="get-cell-output-content">
                <MagnifyingGlassIcon />
                <span>Taking a look at the cell output</span>
            </div>
        </div>
    )
}

export default GetCellOutputToolUI;