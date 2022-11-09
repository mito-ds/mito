// Copyright (c) Mito

import React from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import PivotTableKeySelection from './PivotTableKeySelection';
import PivotTableValueSelection from './PivotTableValueSelection';
import MitoAPI from '../../../jupyter/api';
import { getPivotFrontendParamsFromBackendParams, getPivotBackendParamsFromFrontendParams, getDefaultPivotParams } from './pivotUtils';
import { AggregationType, AnalysisData, BackendPivotParams, ColumnID, ColumnIDsMap, SheetData, StepType, UIState } from '../../../types';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DataframeSelect from '../../elements/DataframeSelect';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import PivotTableFilterSection from './PivotTableFilterSection';


export type PivotTaskpaneProps = {
    dfNames: string[],
    sheetDataArray: SheetData[],
    columnIDsMapArray: ColumnIDsMap[],
    sourceSheetIndex: number,

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

    const {params, setParams} = useLiveUpdatingParams(
        () => getDefaultPivotParams(props.sheetDataArray, props.sourceSheetIndex, props.existingPivotParams),
        StepType.Pivot,
        props.mitoAPI, props.analysisData, 0, 
        {
            getBackendFromFrontend: getPivotBackendParamsFromFrontendParams,
            getFrontendFromBackend: getPivotFrontendParamsFromBackendParams
        },
        {
            // If we have a destination sheet index, we make sure to not overwrite the pivot
            // that is there by default
            doNotSendDefaultParams: props.destinationSheetIndex !== undefined,
        }
    )


    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }


    const addPivotValueAggregation = (columnID: ColumnID): void => {
        setParams(oldPivotParams => {
            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
            newPivotValuesIDs.push([columnID, AggregationType.COUNT]);
            return {
                ...oldPivotParams,
                pivotValuesColumnIDsArray: newPivotValuesIDs,
            }
        })
    }

    const removePivotValueAggregation = (valueIndex: number): void => {
        setParams(oldPivotParams => {
            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
            newPivotValuesIDs.splice(valueIndex, 1);

            return {
                ...oldPivotParams,
                pivotValuesColumnIDsArray: newPivotValuesIDs,
            }
        })
    }

    const editPivotValueAggregation = (valueIndex: number, newAggregationType: AggregationType, newColumnID: ColumnID): void => {
        setParams(oldPivotParams => {
            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
            newPivotValuesIDs[valueIndex] = [newColumnID, newAggregationType];

            return {
                ...oldPivotParams,
                pivotValuesColumnIDsArray: newPivotValuesIDs,
            }
        })
    }

    const addKey = (rowOrColumn: 'row' | 'column', columnID: ColumnID): void => {
        setParams(oldPivotParams => {
            const newColumnIDs: ColumnID[] = rowOrColumn === 'row' ? [...params.pivotRowColumnIDs] : [...params.pivotColumnsColumnIDs];
            const key = rowOrColumn === 'row' ? 'pivotRowColumnIDs' : 'pivotColumnsColumnIDs';
            
            newColumnIDs.push(columnID)
    
            return {
                ...oldPivotParams,
                [key]: newColumnIDs,
            }
        })
    }

    const removeKey = (rowOrColumn: 'row' | 'column', keyIndex: number): void => {
        setParams(oldPivotParams => {
            const newColumnIDs: ColumnID[] = rowOrColumn === 'row' ? [...params.pivotRowColumnIDs] : [...params.pivotColumnsColumnIDs];
            const key = rowOrColumn === 'row' ? 'pivotRowColumnIDs' : 'pivotColumnsColumnIDs';
            
            newColumnIDs.splice(keyIndex, 1);
    
            return {
                ...oldPivotParams,
                [key]: newColumnIDs,
            }
        })
    }

    const editKey = (rowOrColumn: 'row' | 'column', keyIndex: number, newColumnID: ColumnID): void => {
        setParams(oldPivotParams => {
            const newColumnIDs: ColumnID[] = rowOrColumn === 'row' ? [...params.pivotRowColumnIDs] : [...params.pivotColumnsColumnIDs];
            const key = rowOrColumn === 'row' ? 'pivotRowColumnIDs' : 'pivotColumnsColumnIDs';
            
            newColumnIDs[keyIndex] = newColumnID;
    
            return {
                ...oldPivotParams,
                [key]: newColumnIDs,
            }
        })
    }

    const sheetData: SheetData | undefined = props.sheetDataArray[params.sourceSheetIndex];
    const columnIDsMap = props.columnIDsMapArray[params.sourceSheetIndex] || {}; // Make sure it's not undefined
    
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
                <DataframeSelect
                    title='Dataframe to pivot'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={params.sourceSheetIndex}
                    onChange={(newSheetIndex) => {
                        // Set the selected index, and reset to the default params (taking no existing params)
                        const newParams = getDefaultPivotParams(props.sheetDataArray, newSheetIndex, undefined);
                        setParams(prevParams => {
                            return newParams || prevParams;
                        })
                    }}
                    sheetIndexToIgnore={props.destinationSheetIndex}
                />
                <div className = 'default-taskpane-body-section-div'>
                    <PivotTableKeySelection
                        sectionTitle='Rows'
                        columnIDsMap={columnIDsMap}
                        selectedColumnIDs={params.pivotRowColumnIDs}
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
                        sectionSubtext={'For best performance, select columns with a small number of unique values.'}
                        columnIDsMap={columnIDsMap}
                        selectedColumnIDs={params.pivotColumnsColumnIDs}
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
                        pivotValuesColumnIDsArray={params.pivotValuesColumnIDsArray}
                        addPivotValueAggregation={addPivotValueAggregation}
                        removePivotValueAggregation={removePivotValueAggregation}
                        editPivotValueAggregation={editPivotValueAggregation}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
                <div className='default-taskpane-body-section-div'>
                    <PivotTableFilterSection
                        sheetData={sheetData}
                        params={params}
                        setParams={setParams}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane> 
    ); 
}

export default PivotTaskpane;