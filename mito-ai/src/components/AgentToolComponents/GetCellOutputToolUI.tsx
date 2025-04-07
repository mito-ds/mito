/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import MagnifyingGlassIcon from '../../icons/MagnifyingGlassIcon';

interface GetCellOutputProps {}

const GetCellOutputToolUI: React.FC<GetCellOutputProps> = ({}) => {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'start',
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            margin: '10px 0',
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '10px',
                marginLeft: '5px'
            }}>
                <MagnifyingGlassIcon />
                <span>Taking a look at the cell output</span>
            </div>
        </div>
    )
}

export default GetCellOutputToolUI;