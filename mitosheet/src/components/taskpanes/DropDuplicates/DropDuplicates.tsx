// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React from 'react';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from '../../../jupyter/api';
import { AnalysisData, ColumnHeader, ColumnID, SheetData, StepType, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import Select from '../../elements/Select';
import TextButton from '../../elements/TextButton';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import Spacer from '../../spacing/Spacer';
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

    const columnIDsAndHeaders: [ColumnID, ColumnHeader][] = props.sheetDataArray[params.sheet_index]?.data.map(c => [c.columnID, c.columnHeader]) || [];

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Drop Duplicates'
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Dataframe
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium'
                            value={props.sheetDataArray[params.sheet_index].dfName}
                            onChange={(newDfName: string) => {
                                const newSheetIndex = props.dfNames.indexOf(newDfName);

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
                        >
                            {props.dfNames.map(dfName => {
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
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Duplicates to Keep
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium'
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
                <MultiToggleBox
                    searchable
                    searchRightText
                    toggleAllIndexes={(indexesToToggle, newToggle) => {
                        const columnIDsToToggle = indexesToToggle.map(index => columnIDsAndHeaders[index][0]);
                        setParams(oldDropDuplicateParams => {
                            const newSelectedColumnIDs = [...oldDropDuplicateParams.column_ids];
                            columnIDsToToggle.forEach(columnID => {
                                if (newToggle) {
                                    if (!newSelectedColumnIDs.includes(columnID)) {
                                        newSelectedColumnIDs.push(columnID);
                                    }
                                } else {
                                    if (newSelectedColumnIDs.includes(columnID)) {
                                        newSelectedColumnIDs.splice(newSelectedColumnIDs.indexOf(columnID), 1);
                                    }
                                }
                            })

                            return {
                                ...oldDropDuplicateParams,
                                column_ids: newSelectedColumnIDs
                            }
                        })
                    }}
                    height='large'
                >
                    {columnIDsAndHeaders.map(([columnID, columnHeader], index) => {
                        return (
                            <MultiToggleItem
                                key={index}
                                title={getDisplayColumnHeader(columnHeader)}
                                toggled={params.column_ids.includes(columnID)}
                                index={index}
                                onToggle={() => {
                                    setParams(oldDropDuplicateParams => {
                                        const newSelectedColumnIDs = [...oldDropDuplicateParams.column_ids];

                                        if (!newSelectedColumnIDs.includes(columnID)) {
                                            newSelectedColumnIDs.push(columnID);
                                        } else {
                                            newSelectedColumnIDs.splice(newSelectedColumnIDs.indexOf(columnID), 1);
                                        }
        
                                        return {
                                            ...oldDropDuplicateParams,
                                            column_ids: newSelectedColumnIDs
                                        }
                                    })
                                }}
                            />
                        ) 
                    })}
                </MultiToggleBox>
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
                            Removed <span className='text-color-gray-important'>{!attemptedEditWithTheseParamsMultipleTimes ? result?.num_rows_dropped || 0 : 0}</span> rows.
                        </p>
                    </Row>
                }
            </DefaultTaskpaneBody>
        </DefaultTaskpane>   
    )
};

export default DropDuplicatesTaskpane;

