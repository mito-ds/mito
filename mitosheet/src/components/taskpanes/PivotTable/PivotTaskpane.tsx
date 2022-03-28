// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import PivotTableKeySelection from './PivotTableKeySelection';
import PivotTableValueSelection from './PivotTableValueSelection';
import MitoAPI from '../../../api';
import Select from '../../elements/Select';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import { allDfNamesToSelectableDfNameToSheetIndex, backendParamsToFrontendParams, getDefaultPivotParams } from './pivotUtils';
import { AggregationType, AnalysisData, BackendPivotParams, ColumnID, ColumnIDsMap, SheetData, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { useEffectOnUpdateEvent } from '../../../hooks/useEffectOnUpdateEvent';


export type PivotTaskpaneProps = {
    dfNames: string[],
    sheetDataArray: SheetData[],
    columnIDsMapArray: ColumnIDsMap[],
    selectedSheetIndex: number,

    /* 
        These props are only defined if we are editing a pivot table
        that already exists, and these are what we then default it to
    */
    existingPivotParams?: BackendPivotParams;
    destinationSheetIndex?: number;

    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI;
    analysisData: AnalysisData,
};


const PivotTaskpane = (props: PivotTaskpaneProps): JSX.Element => {

    const [pivotParams, setPivotParams] = useState(() => getDefaultPivotParams(props.sheetDataArray, props.selectedSheetIndex, props.existingPivotParams))
    const [pivotUpdateNumber, setPivotUpdateNumber] = useState(0);

    const [stepID, setStepID] = useState<string|undefined>(undefined);

    // We save the dataframe names upon creation of the pivot table
    // so that the user cannot switch to the pivot table they are editing
    const [selectableDfNameToSheetIndex] = useState<Record<string, number>>(
        allDfNamesToSelectableDfNameToSheetIndex(props.dfNames, props.destinationSheetIndex)
    );

    useEffect(() => {
        // We do not send a pivot message if there is no data
        if (props.sheetDataArray.length === 0) {
            return;
        }

        // We don't send the first update if the pivot table already exists, to avoid
        // double undo bugs that occur in graphing, and so that we don't overwrite
        // all the edits you made to the pivot table.
        if (pivotUpdateNumber === 0 && props.existingPivotParams !== undefined) {
            return;
        }

        void sendPivotEdit()

    }, [pivotUpdateNumber])


    useEffectOnUpdateEvent(() => {
        void refreshParamsAfterUndoOrRedo();
    }, props.analysisData)


    const sendPivotEdit = async(): Promise<void> => {
        const _stepID = await props.mitoAPI.editPivot(
            pivotParams,
            props.destinationSheetIndex,
            stepID
        )
        setStepID(_stepID);
    }


    const refreshParamsAfterUndoOrRedo = async (): Promise<void> => {
        
        // If there is a desintation index, then we are editing other that, otherwise
        // we are just editing the last sheet 
        const currentDestinationSheetIndex = props.destinationSheetIndex !== undefined 
            ? props.destinationSheetIndex
            : props.sheetDataArray.length - 1 
        const params = await props.mitoAPI.getPivotParams(currentDestinationSheetIndex)

        // If we get the params, set them to the params of this pivot table. 
        if (params !== undefined) {
            setPivotParams(backendParamsToFrontendParams(params, props.sheetDataArray))
            // NOTE: don't increment the updated number, so we don't send a message
        }
    } 


    /* 
        A callback used by the select data source Select Element so that it can 
        set the state of the Pivot Table Taskpane
    */ 
    const setSelectedSheet = (newSheetName: string): void => {
        const newSelectedSheetIndex = selectableDfNameToSheetIndex[newSheetName]

        // If you didn't select a new sheet, then don't do clear your selections
        if (newSelectedSheetIndex == pivotParams.selectedSheetIndex) {
            return;
        }
        
        // Set the selected index, and reset to the default params (taking no existing params)
        setPivotParams(getDefaultPivotParams(props.sheetDataArray, newSelectedSheetIndex, undefined))
        setPivotUpdateNumber(old => old + 1);
    }

    const addPivotValueAggregation = (columnID: ColumnID): void => {
        setPivotParams(oldPivotParams => {
            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
            newPivotValuesIDs.push([columnID, AggregationType.COUNT]);
            return {
                ...oldPivotParams,
                pivotValuesColumnIDsArray: newPivotValuesIDs,
            }
        })
        setPivotUpdateNumber(old => old + 1);
    }

    const removePivotValueAggregation = (valueIndex: number): void => {
        setPivotParams(oldPivotParams => {
            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
            newPivotValuesIDs.splice(valueIndex, 1);

            return {
                ...oldPivotParams,
                pivotValuesColumnIDsArray: newPivotValuesIDs,
            }
        })
        setPivotUpdateNumber(old => old + 1);
    }

    const editPivotValueAggregation = (valueIndex: number, newAggregationType: AggregationType, newColumnID: ColumnID): void => {
        setPivotParams(oldPivotParams => {
            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
            newPivotValuesIDs[valueIndex] = [newColumnID, newAggregationType];

            return {
                ...oldPivotParams,
                pivotValuesColumnIDsArray: newPivotValuesIDs,
            }
        })
        setPivotUpdateNumber(old => old + 1);
    }

    const addKey = (rowOrColumn: 'row' | 'column', columnID: ColumnID): void => {
        setPivotParams(oldPivotParams => {
            const newColumnIDs: ColumnID[] = rowOrColumn === 'row' ? [...pivotParams.pivotRowColumnIDs] : [...pivotParams.pivotColumnsColumnIDs];
            const key = rowOrColumn === 'row' ? 'pivotRowColumnIDs' : 'pivotColumnsColumnIDs';
            
            newColumnIDs.push(columnID)
    
            return {
                ...oldPivotParams,
                [key]: newColumnIDs,
            }
        })
        setPivotUpdateNumber(old => old + 1);
    }

    const removeKey = (rowOrColumn: 'row' | 'column', keyIndex: number): void => {
        setPivotParams(oldPivotParams => {
            const newColumnIDs: ColumnID[] = rowOrColumn === 'row' ? [...pivotParams.pivotRowColumnIDs] : [...pivotParams.pivotColumnsColumnIDs];
            const key = rowOrColumn === 'row' ? 'pivotRowColumnIDs' : 'pivotColumnsColumnIDs';
            
            newColumnIDs.splice(keyIndex, 1);
    
            return {
                ...oldPivotParams,
                [key]: newColumnIDs,
            }
        })
        setPivotUpdateNumber(old => old + 1);
    }

    const editKey = (rowOrColumn: 'row' | 'column', keyIndex: number, newColumnID: ColumnID): void => {
        setPivotParams(oldPivotParams => {
            const newColumnIDs: ColumnID[] = rowOrColumn === 'row' ? [...pivotParams.pivotRowColumnIDs] : [...pivotParams.pivotColumnsColumnIDs];
            const key = rowOrColumn === 'row' ? 'pivotRowColumnIDs' : 'pivotColumnsColumnIDs';
            
            newColumnIDs[keyIndex] = newColumnID;
    
            return {
                ...oldPivotParams,
                [key]: newColumnIDs,
            }
        })
        setPivotUpdateNumber(old => old + 1);
    }

    /*
        If there is no possible Pivot taskpane that can be displayed (e.g. the sheetJSON is empty),
        give an error message indicating so.
    */
    if (props.sheetDataArray.length === 0) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const sheetData: SheetData | undefined = props.sheetDataArray[pivotParams.selectedSheetIndex];
    const columnIDsMap = props.columnIDsMapArray[pivotParams.selectedSheetIndex] || {}; // Make sure it's not undefined
    
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
                            value={props.dfNames[pivotParams.selectedSheetIndex]}
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
                                value={pivotParams.flattenColumnHeaders ? 'Yes' : 'No'}
                                // Safe to cast as dfNames are strings
                                onChange={(newFlatten: string) => {
                                    setPivotParams(pivotState => {
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
                        selectedColumnIDs={pivotParams.pivotRowColumnIDs}
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
                        selectedColumnIDs={pivotParams.pivotColumnsColumnIDs}
                        addKey={(columnID) => {addKey('column', columnID)}}
                        removeKey={(keyIndex) => {removeKey('column', keyIndex)}}
                        editKey={(keyIndex, newColumnID) => {editKey('column', keyIndex, newColumnID)}}
                        mitoAPI={props.mitoAPI}
                        rowOrColumn='column'
                    />
                </div>
                <div className='default-taskpane-body-section-div'>
                    <PivotTableValueSelection
                        sheetData={sheetData}
                        columnIDsMap={columnIDsMap}
                        pivotValuesColumnIDsArray={pivotParams.pivotValuesColumnIDsArray}
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