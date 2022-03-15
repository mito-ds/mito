// Copyright (c) Mito

import React, { useEffect, useRef, useState } from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import PivotTableKeySelection from './PivotTableKeySelection';
import PivotTableValueSelection from './PivotTableValueSelection';
import MitoAPI from '../../../api';
import usePrevious from '../../../hooks/usePrevious';
import Select from '../../elements/Select';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import { allDfNamesToSelectableDfNameToSheetIndex, valuesArrayToRecord, valuesRecordToArray } from './pivotUtils';
import { getDeduplicatedArray } from '../../../utils/arrays';
import { ColumnID, ColumnIDsMap, DataframeID, SheetData, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { dataframeIDToSheetIndex } from '../../../utils/dataframeID';


// NOTE: these aggregation functions need to be supported
// in mitosheet/steps/pivot.py as well
export enum AggregationType {
    SUM = 'sum',
    MEAN = 'mean',
    MEDIAN = 'median',
    STD = 'std',
    MIN = 'min',
    MAX = 'max', 
    COUNT = 'count', 
    COUNT_UNIQUE = 'count unique',
}

export interface PivotParams {
    sheet_index: number,
    pivot_rows_column_ids: string[],
    pivot_columns_column_ids: string[],
    values_column_ids_map: Record<string, AggregationType[]>,
    flatten_column_headers: boolean;
}

export type PivotTaskpaneProps = {
    dfNames: string[],
    sheetDataMap: Record<DataframeID, SheetData>,
    columnIDsMapArray: ColumnIDsMap[],

    /* 
        These props are only defined if we are editing a pivot table
        that already exists, and these are what we then default it to
    */
    existingPivotParams?: PivotParams;
    destinationSheetIndex?: number;

    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    // Useful so the pivot table can watch for an undo
    lastStepIndex: number,
    mitoAPI: MitoAPI,
};


const PivotTaskpane = (props: PivotTaskpaneProps): JSX.Element => {

    const [stepID, setStepID] = useState<string|undefined>(undefined);

    // We save the dataframe names upon creation of the pivot table
    // so that the user cannot switch to the pivot table they are editing
    const [selectableDfNameToSheetIndex] = useState<Record<string, number>>(
        allDfNamesToSelectableDfNameToSheetIndex(props.dfNames, props.destinationSheetIndex)
    );
    
    /* 
        If the pivot table is being opened with existing editing params, then 
        we set all the starting values to these parameters. Note that some of them
        may be invalid, but we display errors in the respective sections of the pivot
        table if this is the case.

        Furthermore, we take special care with the sheet index to make sure that it
        is not out of bounds. So, if it is, we default it to the final sheet. This 
        might lead to a wacky pivot, but that's better than crashing the sheet.

        NOTE: we use a single object for the entire state of the pivot table so that
        we can update the entire object at once, which is useful when we're refreshing
        the params to the pivot table on an update.

        ALSO NOTE: the type of the pivotValues is different between the backend and
        the frontend, due to it being easier to manipulate as an array on the frontend.
        We use the utils `valuesRecordToArray` and `valuesArraytoRecord` to convert 
        between these two formats.
    */
    const [pivotState, setPivotState] = useState({
        selectedSheetIndex: props.existingPivotParams === undefined 
            ? dataframeIDToSheetIndex(props.uiState.selectedDataframeID) 
            : Math.min(props.existingPivotParams.sheet_index, Object.keys(props.sheetDataMap).length - 1),
        pivotRowColumnIDs: props.existingPivotParams === undefined ? [] : props.existingPivotParams.pivot_rows_column_ids,
        pivotColumnsColumnIDs: props.existingPivotParams === undefined ? [] : props.existingPivotParams.pivot_columns_column_ids,
        pivotValuesColumnIDsArray: props.existingPivotParams === undefined ? [] : valuesRecordToArray(props.existingPivotParams.values_column_ids_map),
        flattenColumnHeaders: props.existingPivotParams === undefined ? false : props.existingPivotParams.flatten_column_headers
    })
    
    // Save the last step index, so that we can check if an undo occured
    const prevLastStepIndex = usePrevious(props.lastStepIndex);

    /*
        Completes the pivot operation by sending information for the pivoting
        to the backend, making so to respect the stepId
    */
    const sendPivotTableUpdateMessage = async(): Promise<void> => {
        const _stepID = await props.mitoAPI.editPivot(
            pivotState.selectedSheetIndex,
            // Deduplicate the rows and columns before sending them to the backend
            // as otherwise this generates errors if you have duplicated key
            getDeduplicatedArray(pivotState.pivotRowColumnIDs),
            getDeduplicatedArray(pivotState.pivotColumnsColumnIDs),
            // Convert pivotValues back to the state that the backend expects
            valuesArrayToRecord(pivotState.pivotValuesColumnIDsArray),
            true, // TODO: change to pivotState.flattenColumnHeaders,
            props.destinationSheetIndex,
            stepID
        )
        setStepID(_stepID);
    }

    /* 
        A callback used by the select data source Select Element so that it can 
        set the state of the Pivot Table Taskpane
    */ 
    const setSelectedSheet = (newSheetName: string): void => {
        const newSelectedSheetIndex = selectableDfNameToSheetIndex[newSheetName]

        // If you didn't select a new sheet, then don't do clear your selections
        if (newSelectedSheetIndex == pivotState.selectedSheetIndex) {
            return;
        }
        
        // Set the selected index, and clear the pivot table
        setPivotState({
            selectedSheetIndex: newSelectedSheetIndex,
            pivotRowColumnIDs: [],
            pivotColumnsColumnIDs: [],
            pivotValuesColumnIDsArray: [],
            flattenColumnHeaders: false
        })
    }

    const addPivotValueAggregation = (columnID: ColumnID): void => {
        const newPivotValuesIDs = [...pivotState.pivotValuesColumnIDsArray];
        newPivotValuesIDs.push([columnID, AggregationType.COUNT]);
        setPivotState({
            selectedSheetIndex: pivotState.selectedSheetIndex,
            pivotRowColumnIDs: pivotState.pivotRowColumnIDs,
            pivotColumnsColumnIDs: pivotState.pivotColumnsColumnIDs,
            pivotValuesColumnIDsArray: newPivotValuesIDs,
            flattenColumnHeaders: pivotState.flattenColumnHeaders
        })
    }

    const removePivotValueAggregation = (valueIndex: number): void => {
        const newPivotValuesIDs = [...pivotState.pivotValuesColumnIDsArray];
        newPivotValuesIDs.splice(valueIndex, 1);

        setPivotState({
            selectedSheetIndex: pivotState.selectedSheetIndex,
            pivotRowColumnIDs: pivotState.pivotRowColumnIDs,
            pivotColumnsColumnIDs: pivotState.pivotColumnsColumnIDs,
            pivotValuesColumnIDsArray: newPivotValuesIDs,
            flattenColumnHeaders: pivotState.flattenColumnHeaders
        })
    }

    const editPivotValueAggregation = (valueIndex: number, newAggregationType: AggregationType, newColumnID: ColumnID): void => {
        const newPivotValuesIDs = [...pivotState.pivotValuesColumnIDsArray];
        newPivotValuesIDs[valueIndex] = [newColumnID, newAggregationType];

        setPivotState({
            selectedSheetIndex: pivotState.selectedSheetIndex,
            pivotRowColumnIDs: pivotState.pivotRowColumnIDs,
            pivotColumnsColumnIDs: pivotState.pivotColumnsColumnIDs,
            pivotValuesColumnIDsArray: newPivotValuesIDs,
            flattenColumnHeaders: pivotState.flattenColumnHeaders
        })
    }

    const addKey = (rowOrColumn: 'row' | 'column', columnID: ColumnID): void => {
        let newColumnIDs: ColumnID[] = [];
        if (rowOrColumn === 'row') {
            newColumnIDs = [...pivotState.pivotRowColumnIDs]
        } else {
            newColumnIDs = [...pivotState.pivotColumnsColumnIDs]
        }

        newColumnIDs.push(columnID)
        
        if (rowOrColumn === 'row') {
            setPivotState({
                selectedSheetIndex: pivotState.selectedSheetIndex,
                pivotRowColumnIDs: newColumnIDs,
                pivotColumnsColumnIDs: pivotState.pivotColumnsColumnIDs,
                pivotValuesColumnIDsArray: pivotState.pivotValuesColumnIDsArray,
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        } else {
            setPivotState({
                selectedSheetIndex: pivotState.selectedSheetIndex,
                pivotRowColumnIDs: pivotState.pivotRowColumnIDs,
                pivotColumnsColumnIDs: newColumnIDs,
                pivotValuesColumnIDsArray: pivotState.pivotValuesColumnIDsArray,
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        }
    }

    const removeKey = (rowOrColumn: 'row' | 'column', keyIndex: number): void => {
        let newColumnIDs: ColumnID[] = [];
        if (rowOrColumn === 'row') {
            newColumnIDs = [...pivotState.pivotRowColumnIDs]
        } else {
            newColumnIDs = [...pivotState.pivotColumnsColumnIDs]
        }

        newColumnIDs.splice(keyIndex, 1);
        
        if (rowOrColumn === 'row') {
            setPivotState({
                selectedSheetIndex: pivotState.selectedSheetIndex,
                pivotRowColumnIDs: newColumnIDs,
                pivotColumnsColumnIDs: pivotState.pivotColumnsColumnIDs,
                pivotValuesColumnIDsArray: pivotState.pivotValuesColumnIDsArray,
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        } else {
            setPivotState({
                selectedSheetIndex: pivotState.selectedSheetIndex,
                pivotRowColumnIDs: pivotState.pivotRowColumnIDs,
                pivotColumnsColumnIDs: newColumnIDs,
                pivotValuesColumnIDsArray: pivotState.pivotValuesColumnIDsArray,
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        }
    }

    const editKey = (rowOrColumn: 'row' | 'column', keyIndex: number, newColumnID: ColumnID): void => {
        let newColumnIDs: ColumnID[] = [];
        if (rowOrColumn === 'row') {
            newColumnIDs = [...pivotState.pivotRowColumnIDs]
        } else {
            newColumnIDs = [...pivotState.pivotColumnsColumnIDs]
        }

        newColumnIDs[keyIndex] = newColumnID;
        
        if (rowOrColumn === 'row') {
            setPivotState({
                selectedSheetIndex: pivotState.selectedSheetIndex,
                pivotRowColumnIDs: newColumnIDs,
                pivotColumnsColumnIDs: pivotState.pivotColumnsColumnIDs,
                pivotValuesColumnIDsArray: pivotState.pivotValuesColumnIDsArray,
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        } else {
            setPivotState({
                selectedSheetIndex: pivotState.selectedSheetIndex,
                pivotRowColumnIDs: pivotState.pivotRowColumnIDs,
                pivotColumnsColumnIDs: newColumnIDs,
                pivotValuesColumnIDsArray: pivotState.pivotValuesColumnIDsArray,
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        }
    }

    /* 
        Taken from https://stackoverflow.com/questions/53253940/make-react-useeffect-hook-not-run-on-initial-render
        
        We make sure that if you are editing a pivot table, the first time
        that useEffect runs, it does not send a message to update the pivot
        table. 

        This means that opening a pivot table with edits on it does not
        automatically overwrite the edits that you made to that pivot 
        table. Insted, you need to begin editing the pivot table for it
        then to delete these edits to the pivot.
    */
    const ignoreNextUpdate = useRef(props.existingPivotParams !== undefined);
    useEffect(() => {
        if (ignoreNextUpdate.current) {
            ignoreNextUpdate.current = false;
            return;
        }

        // We do not send a pivot message if there is no actual
        // data in the sheet to pivot
        if (Object.keys(props.sheetDataMap).length > 0) {
            void sendPivotTableUpdateMessage()
        }
    }, [pivotState])


    const refreshParamsAfterUndoOrRedo = async (): Promise<void> => {
        // If there is a desintation index, then we are editing other that, otherwise
        // we are just editing the last sheet 
        const currentDestinationSheetIndex = props.destinationSheetIndex !== undefined 
            ? props.destinationSheetIndex
            : Object.keys(props.sheetDataMap).length - 1 
        const params = await props.mitoAPI.getPivotParams(currentDestinationSheetIndex)

        // If we get the params, set them to the params of this pivot table. 
        if (params !== undefined) {
            // We also set ignoreNextUpdate to true, so that these updates
            // don't cause a new message to get sent, as then we get trapped
            // in an infinite loop where an undo will cause a new pivot message
            // to get sent 
            ignoreNextUpdate.current = true;
            setPivotState({
                selectedSheetIndex: params.sheet_index,
                pivotRowColumnIDs: params.pivot_rows_column_ids,
                pivotColumnsColumnIDs: params.pivot_columns_column_ids,
                pivotValuesColumnIDsArray: valuesRecordToArray(params.values_column_ids_map),
                flattenColumnHeaders: pivotState.flattenColumnHeaders
            })
        }
    } 

    useEffect(() => {
        // If there has been an undo or redo, then we refresh the params to this pivot
        if (prevLastStepIndex && prevLastStepIndex !== props.lastStepIndex - 1) {
            void refreshParamsAfterUndoOrRedo()
        }
    }, [props.lastStepIndex])

    /*
        If there is no possible Pivot taskpane that can be displayed (e.g. the sheetJSON is empty),
        give an error message indicating so.
    */
    if (Object.keys(props.sheetDataMap).length === 0) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const columnIDsMap = props.columnIDsMapArray[pivotState.selectedSheetIndex];
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={props.destinationSheetIndex ? 
                    `Edit Pivot Table ${props.dfNames[props.destinationSheetIndex]}` 
                    : `Create Pivot Table ${props.dfNames[props.dfNames.length - 1]}`
                }
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Data Source
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium'
                            value={props.dfNames[pivotState.selectedSheetIndex]}
                            // Safe to cast as dfNames are strings
                            onChange={(newSheet: string) => setSelectedSheet(newSheet)}
                        >
                            {Object.keys(selectableDfNameToSheetIndex).map(dfName => {
                                return (
                                    <DropdownItem
                                        key={dfName}
                                        title={dfName}
                                    />
                                )
                            })}
                        </Select>
                    </Col>
                </Row>
                {/* TODO: put this back in when you want to not flatten column header*/}
                {false &&
                    <Row justify='space-between' align='center'>
                        <Col>
                            <p className='text-header-3'>
                                Flatten Column Headers
                            </p>
                        </Col>
                        <Col>
                            <Select
                                width='medium'
                                value={pivotState.flattenColumnHeaders ? 'Yes' : 'No'}
                                // Safe to cast as dfNames are strings
                                onChange={(newFlatten: string) => {
                                    setPivotState(pivotState => {
                                        return {
                                            ...pivotState,
                                            flattenColumnHeaders: newFlatten === 'Yes'
                                        }
                                    })
                                }}
                            >
                                <DropdownItem
                                    title={'No'}
                                />
                                <DropdownItem
                                    title={'Yes'}
                                />
                            </Select>
                        </Col>
                    </Row>
                }
                
                <div className = 'default-taskpane-body-section-div'>
                    <PivotTableKeySelection
                        sectionTitle='Rows'
                        columnIDsMap={columnIDsMap}
                        selectedColumnIDs={pivotState.pivotRowColumnIDs}
                        addKey={(columnID) => {addKey('row', columnID)}}
                        removeKey={(keyIndex) => {removeKey('row', keyIndex)}}
                        editKey={(keyIndex, newColumnID) => {editKey('row', keyIndex, newColumnID)}}
                        mitoAPI={props.mitoAPI}
                        rowOrColumn='row'
                    />
                </div>
                <div className = 'default-taskpane-body-section-div'>
                    <PivotTableKeySelection
                        sectionTitle='Columns'
                        columnIDsMap={columnIDsMap}
                        selectedColumnIDs={pivotState.pivotColumnsColumnIDs}
                        addKey={(columnID) => {addKey('column', columnID)}}
                        removeKey={(keyIndex) => {removeKey('column', keyIndex)}}
                        editKey={(keyIndex, newColumnID) => {editKey('column', keyIndex, newColumnID)}}
                        mitoAPI={props.mitoAPI}
                        rowOrColumn='column'
                    />
                </div>
                <div className='default-taskpane-body-section-div'>
                    <PivotTableValueSelection
                        columnIDsMap={columnIDsMap}
                        pivotValuesColumnIDsArray={pivotState.pivotValuesColumnIDsArray}
                        addPivotValueAggregation={addPivotValueAggregation}
                        removePivotValueAggregation={removePivotValueAggregation}
                        editPivotValueAggregation={editPivotValueAggregation}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane> 
    ); 
}

export default PivotTaskpane;