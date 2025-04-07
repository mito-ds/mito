/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

interface GetCellOutputProps {}

const GetCellOutputToolUI: React.FC<GetCellOutputProps> = ({}) => {

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            margin: '10px 0'
        }}>
            Taking a look at the cell output
        </div>
    )
}

export default GetCellOutputToolUI;