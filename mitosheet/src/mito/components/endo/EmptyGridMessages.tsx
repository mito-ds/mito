/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { MitoAPI } from '../../api/api';
import { SendFunctionStatus } from '../../api/send';
import { SheetData, UIState } from '../../types';
import { isInDashboard } from '../../utils/location';
import TextButton from '../elements/TextButton';
import { TaskpaneType } from '../taskpanes/taskpanes';


/**
 * 
 * A wrapper around divs to displayed centered in the grid
 * 
 * @param props - the children you want to display in the center of the grid
 */
const GridDataEmptyContainer = (props: {children: React.ReactNode}): JSX.Element => {
    return (
        <div className='endo-grid-empty-container'>
            <div className='endo-grid-empty-text-container'>
                {props.children}
            </div>
        </div>
    )
}

const EmptyGridMessages = (props: {
    sheetData: SheetData | undefined, 
    setUIState: React.Dispatch<React.SetStateAction<UIState>>, 
    mitoAPI: MitoAPI, uiState: UIState,
    sendFunctionStatus: SendFunctionStatus
}): JSX.Element => {

    return (
        <>
            {props.sheetData === undefined &&
                <GridDataEmptyContainer>
                    <div>
                        <TextButton 
                            variant='dark' 
                            width='medium'
                            onClick={() => {
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenTaskpane: {type: TaskpaneType.IMPORT_FILES}
                                    }
                                })

                                void props.mitoAPI.log('clicked_empty_grid_import_button');
                            }}
                            disabled={
                                props.uiState.currOpenTaskpane.type === TaskpaneType.IMPORT_FILES ||
                                props.uiState.currOpenTaskpane.type === TaskpaneType.EXCEL_RANGE_IMPORT ||
                                (props.uiState.currOpenTaskpane.type === TaskpaneType.UPDATEIMPORTS && props.uiState.currOpenTaskpane.failedReplayData !== undefined) ||
                                props.sendFunctionStatus !== 'finished'
                            }
                        >
                            Import Files
                        </TextButton>
                    </div>
                    {!isInDashboard() && 
                        <p className='mt-5px text-body-1' style={{textAlign: 'center'}}>
                            Or import dfs using the syntax <code>mitosheet.sheet(df1, df2)</code> in the code above.
                        </p>
                    }
                    
                </GridDataEmptyContainer>
            }
            {props.sheetData !== undefined && props.sheetData.numRows === 0 && props.sheetData.numColumns === 0 &&
                <GridDataEmptyContainer>
                    <p className='text-body-1' style={{textAlign: 'center'}}>
                        No data in dataframe.
                    </p>
                </GridDataEmptyContainer>
            }
            {props.sheetData !== undefined && props.sheetData.numRows > 0 && props.sheetData.numColumns === 0 &&
                <GridDataEmptyContainer>
                    <p className='text-body-1' style={{textAlign: 'center'}}>
                        No columns in dataframe.
                    </p>
                </GridDataEmptyContainer>
            }
            {props.sheetData !== undefined && props.sheetData.numRows === 0 && props.sheetData.numColumns > 0 &&
                <GridDataEmptyContainer>
                    <p className='text-body-1' style={{textAlign: 'center'}}>
                        No rows in dataframe.
                    </p>
                </GridDataEmptyContainer>
            }
        </>
    )
}


export default EmptyGridMessages;