// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React, { useState } from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import MitoAPI from '../../../api';
import { ColumnHeader, ColumnID, SheetData, UIState } from '../../../types';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import Select from '../../elements/Select';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import LoadingDots from '../../elements/LoadingDots';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';


// Millisecond delay between changing params, so that
// we don't load send too many drop duplicate messages when the user
// is just configuring. 
const SEND_MESSAGE_DELAY = 250;


interface DropDuplicatesProps {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    dfNames: string[];
}

interface DropDuplicatesParams {
    sheetIndex: number,
    columnIDs: ColumnID[],
    keep: 'first' | 'last' | false
}

/*
    A taskpane that allows a user to drop duplicates
    in a sheet
*/
const DropDuplicatesTaskpane = (props: DropDuplicatesProps): JSX.Element => {

    const [stepID, setStepID] = useState<string | undefined>(undefined);
    const [originalNumRows, setOriginalNumRows] = useState(props.sheetDataArray[props.selectedSheetIndex]?.numRows || 0);
    const [loading, setLoading] = useState(false);
    const [dropDuplicateParams, setDropDuplicateParams] = useState<DropDuplicatesParams>({
        sheetIndex: props.selectedSheetIndex,
        columnIDs: props.sheetDataArray[props.selectedSheetIndex]?.data?.map(c => c.columnID) || [],
        keep: 'first',
    })

    // Send a drop duplicates message if we change the params
    useDebouncedEffect(() => {
        void sendDropDuplicates(dropDuplicateParams);
    }, [dropDuplicateParams], SEND_MESSAGE_DELAY);

    
    if (props.sheetDataArray.length === 0) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const columnIDsAndHeaders: [ColumnID, ColumnHeader][] = props.sheetDataArray[dropDuplicateParams.sheetIndex].data.map(c => [c.columnID, c.columnHeader]);


    const sendDropDuplicates = async (params: DropDuplicatesParams) => {

        setLoading(true);
        
        const newStepID = await props.mitoAPI.editDropDuplicates(
            params.sheetIndex,
            params.columnIDs,
            params.keep,
            stepID
        )
        setStepID(newStepID);
        setLoading(false);
    }

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
                            Sheet to Deduplicate
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium'
                            value={props.sheetDataArray[dropDuplicateParams.sheetIndex].dfName}
                            onChange={(newDfName: string) => {
                                const newSheetIndex = props.dfNames.indexOf(newDfName);

                                setDropDuplicateParams(dropDuplicateParams => {
                                    return {
                                        ...dropDuplicateParams,
                                        sheetIndex: newSheetIndex,
                                        columnIDs: props.sheetDataArray[newSheetIndex].data.map(c => c.columnID),
                                    }
                                })

                                setOriginalNumRows(props.sheetDataArray[newSheetIndex].numRows);

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
                            value={dropDuplicateParams.keep + ''}
                            onChange={(newKeep: string | boolean) => {
                                if (newKeep === 'false') {
                                    newKeep = false;
                                }

                                setDropDuplicateParams(dropDuplicateParams => {
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
                    toggleAllIndexes={(indexesToToggle, newToggle) => {
                        const columnIDsToToggle = indexesToToggle.map(index => columnIDsAndHeaders[index][0]);
                        setDropDuplicateParams(oldDropDuplicateParams => {
                            const newSelectedColumnIDs = [...oldDropDuplicateParams.columnIDs];
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
                                columnIDs: newSelectedColumnIDs
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
                                toggled={dropDuplicateParams.columnIDs.includes(columnID)}
                                index={index}
                                onToggle={() => {
                                    setDropDuplicateParams(oldDropDuplicateParams => {
                                        const newSelectedColumnIDs = [...oldDropDuplicateParams.columnIDs];

                                        if (!newSelectedColumnIDs.includes(columnID)) {
                                            newSelectedColumnIDs.push(columnID);
                                        } else {
                                            newSelectedColumnIDs.splice(newSelectedColumnIDs.indexOf(columnID), 1);
                                        }
        
                                        return {
                                            ...oldDropDuplicateParams,
                                            columnIDs: newSelectedColumnIDs
                                        }
                                    })
                                }}
                            />
                        ) 
                    })}
                </MultiToggleBox>
                {loading &&
                    <Row className='mt-5'>
                        <p className='text-subtext-1'>
                            Deduplicating {<LoadingDots/>}
                        </p>
                    </Row>
                }
                {stepID !== undefined && !loading &&
                    <Row className='mt-5'>
                        <p className='text-subtext-1'>
                            Removed {originalNumRows - props.sheetDataArray[dropDuplicateParams.sheetIndex].numRows} rows
                        </p>
                    </Row>
                }
                
            </DefaultTaskpaneBody>
        </DefaultTaskpane>   
    )
};

export default DropDuplicatesTaskpane;

