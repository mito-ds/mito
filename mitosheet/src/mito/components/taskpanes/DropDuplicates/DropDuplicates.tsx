// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React from 'react';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, ColumnID, SheetData, StepType, UIState } from '../../../types';
import DataframeSelect from '../../elements/DataframeSelect';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleColumns from '../../elements/MultiToggleColumns';
import Select from '../../elements/Select';
import TextButton from '../../elements/TextButton';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import Spacer from '../../layout/Spacer';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';


interface DropDuplicatesProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    dfNames: string[];
    analysisData: AnalysisData
}

interface DropDuplicatesParams {
    sheet_index: number,
    column_ids: ColumnID[],
    keep: 'first' | 'last' | false
}

interface DropDuplicateResults {
    num_rows_dropped: number;
}

export const getDefaultParams = (selectedSheetIndex: number, sheetDataArray: SheetData[]): DropDuplicatesParams | undefined => {
    if (sheetDataArray.length === 0) {
        return undefined;
    }

    return {
        sheet_index: selectedSheetIndex,
        column_ids: Object.keys(sheetDataArray[selectedSheetIndex]?.columnIDsMap),
        keep: 'first',
    }
}

/*
    A taskpane that allows a user to drop duplicates
    in a sheet
*/
const DropDuplicatesTaskpane = (props: DropDuplicatesProps): JSX.Element => {

    const {params, setParams, loading, edit, editApplied, attemptedEditWithTheseParamsMultipleTimes, result} = useSendEditOnClick<DropDuplicatesParams, DropDuplicateResults>(
        () => getDefaultParams(props.selectedSheetIndex, props.sheetDataArray),
        StepType.DropDuplicates,
        props.mitoAPI, props.analysisData,
    )

    if (props.sheetDataArray.length === 0 || params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    /*
        If the sheetDataArray doesn't contain params.sheet_index,
        just close the taskpane to avoid a sheet crashing bug.
        
        TODO: We should handle this in useLiveUpdatingParams to so we can move
        closer to not having to write any custom code for this step.
    */
    if (props.sheetDataArray[params.sheet_index] === undefined) {
        props.setUIState((prevUIState) => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })
        // Return the defaut taskpane while the taskpane is closing
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header='Drop Duplicates'
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <DataframeSelect
                    title='Dataframe to drop duplicates within.'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={params.sheet_index}
                    onChange={(newSheetIndex) => {
                        setParams(dropDuplicateParams => {
                            return {
                                ...dropDuplicateParams,
                                sheet_index: newSheetIndex,
                                column_ids: props.sheetDataArray[newSheetIndex].data.map(c => c.columnID),
                            }
                        })

                        props.setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                selectedSheetIndex: newSheetIndex
                            }
                        });
                    }}
                />
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Duplicates to Keep
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='small'
                            value={params.keep + ''}
                            onChange={(newKeep: string | boolean) => {
                                if (newKeep === 'false') {
                                    newKeep = false;
                                }

                                setParams(dropDuplicateParams => {
                                    return {
                                        ...dropDuplicateParams,
                                        keep: newKeep as 'first' | 'last' | false
                                    }
                                })
                            }}
                        >
                            <DropdownItem
                                title={'first'}
                                subtext='Keep the first instance of the duplicated row.'
                            />
                            <DropdownItem
                                title={'last'}
                                subtext='Keep the last instance of the duplicated row.'
                            />
                            <DropdownItem
                                id='false'
                                title={'none'}
                                subtext='Keep none of the duplicated rows.'
                            />
                        </Select>
                    </Col>
                </Row>
                <p className='text-header-3 mt-10px'>
                    Columns to Deduplicate On
                </p>
                <MultiToggleColumns
                    sheetData={props.sheetDataArray[params.sheet_index]}
                    selectedColumnIDs={params.column_ids}
                    onChange={(newSelectedColumnIDs: ColumnID[]) => {
                        setParams(oldDropDuplicateParams => {
                            return {
                                ...oldDropDuplicateParams,
                                column_ids: newSelectedColumnIDs
                            }
                        })
                    }}
                />
                <Spacer px={25}/>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => edit()}
                    disabled={false}
                >
                    {!loading 
                        ? `Drop duplicates in ${params.column_ids.length} columns`
                        : 'Dropping duplicates...' 
                    }
                </TextButton>
                {editApplied && !loading &&
                    <Row className='mt-5'>
                        <p className='text-subtext-1'>
                            Removed <span className='text-color-medium-important'>{!attemptedEditWithTheseParamsMultipleTimes ? result?.num_rows_dropped || 0 : 0}</span> rows.
                        </p>
                    </Row>
                }
            </DefaultTaskpaneBody>
        </DefaultTaskpane>   
    )
};

export default DropDuplicatesTaskpane;

