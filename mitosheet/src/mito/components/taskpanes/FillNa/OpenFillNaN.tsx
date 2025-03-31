/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { ColumnID, UIState } from '../../../types';
import { TaskpaneType } from '../taskpanes';


const OpenFillNaN = (props: {setUIState: React.Dispatch<React.SetStateAction<UIState>>, columnID: ColumnID}): JSX.Element => {
    return (
        <>
            &nbsp;
            <span 
                className='text-color-medium-important text-underline-on-hover'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.FILL_NA, startingColumnIDs: [props.columnID]},
                        }
                    })
                }}
            >
                (or Fill NaN Values)
            </span>
        </>
    )
}

export default OpenFillNaN;