// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../../jupyter/api';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { AnalysisData, ColumnID, ColumnIDsMap, SheetData, StepType, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import Select from '../../elements/Select';
import XIcon from '../../icons/XIcon';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import { getDtypeValue } from '../ControlPanel/FilterAndSortTab/DtypeCard';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';
import MergeSheetAndKeySelection from './MergeSheetAndKeySelection';
import { getSuggestedKeysColumnID } from './mergeUtils';


// Enum to allow you to refer to the first or second sheet by name, for clarity
export enum MergeSheet {
    First = 0,
    Second = 1
}

/*
    Each entry of this enum is a merge type that the user can choose. 
    In all cases, except lookup, these values are passed directly to 
    the pandas merge function. 
*/
export enum MergeType {
    LOOKUP = 'lookup',
    LEFT = 'left',
    RIGHT = 'right',
    INNER = 'inner',
    OUTER = 'outer',
    UNIQUE_IN_LEFT = 'unique in left',
    UNIQUE_IN_RIGHT = 'unique in right'
}

export interface MergeParams {
    how: string,
    sheet_index_one: number,
    merge_key_column_id_one: ColumnID,
    selected_column_ids_one: ColumnID[],
    sheet_index_two: number,
    merge_key_column_id_two: ColumnID,
    selected_column_ids_two: ColumnID[],
}


export type MergeTaskpaneProps = {
    dfNames: string[],
    columnIDsMapArray: ColumnIDsMap[],
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    analysisData: AnalysisData;
};

const getDefaultMergeParams = (sheetDataArray: SheetData[], selectedSheetIndex: number): MergeParams | undefined => {
    if (sheetDataArray.length < 2) {
        return undefined;
    } else {
        
        // We default the merge modal to select the selected sheet index as the first sheet
        const sheetOneIndex = selectedSheetIndex;
        // The second sheet is either: the sheet to the right, if it exists and contains columns,
        // or the one to the left, it exists. If neither exist, then it is just
        // the same as sheet one index, as there is only one sheet
        const sheetTwoIndex = sheetOneIndex + 1 <= sheetDataArray.length - 1 && sheetDataArray[sheetOneIndex + 1].numColumns > 0
            ? sheetOneIndex + 1
            : (sheetOneIndex - 1 >= 0 ? sheetOneIndex - 1 : sheetOneIndex)

        const suggestedKeys = getSuggestedKeysColumnID(sheetDataArray, sheetOneIndex, sheetTwoIndex);

        // If there are no suggested keys, then we don't have any columns in one datasets, so we bail with undefined params
        if (suggestedKeys === undefined) {
            return undefined;
        }

        // We default to selecting _all_ columns
        const selectedColumnIDsOne = [...Object.keys(sheetDataArray[sheetOneIndex]?.columnIDsMap || {})]
        const selectedColumnIDsTwo = [...Object.keys(sheetDataArray[sheetTwoIndex]?.columnIDsMap || {})]
        
        return {
            how: 'lookup',
            sheet_index_one: sheetOneIndex,
            merge_key_column_id_one: suggestedKeys.merge_key_column_id_one,
            selected_column_ids_one: selectedColumnIDsOne,
            sheet_index_two: sheetTwoIndex,
            merge_key_column_id_two: suggestedKeys.merge_key_column_id_two,
            selected_column_ids_two: selectedColumnIDsTwo,
        }
    }
}


const MergeTaskpane = (props: MergeTaskpaneProps): JSX.Element => {

    const {params, setParams, error} = useLiveUpdatingParams(
        getDefaultMergeParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.Merge,
        props.mitoAPI,
        props.analysisData,
        50 // 50 ms debounce delay
    )
    const [originalDfNames] = useState(props.sheetDataArray.map(sheetData => sheetData.dfName))

    /*
        Helper function for updating the merge type in state and 
        sending the merge message to the backend. 
    */
    const setNewMergeType = (newMergeType: MergeType): void => {
        setParams(prevParams => {
            return {
                ...prevParams,
                how: newMergeType
            }
        })
    }

    const setNewSheetIndex = (sheetNumber: MergeSheet, newSheetIndex: number): void => {
        const indexName = sheetNumber == MergeSheet.First ? 'sheet_index_one' : 'sheet_index_two'
        const selectedColumnsName = sheetNumber == MergeSheet.First ? 'selected_column_ids_one' : 'selected_column_ids_two';

        const newSelectedColumnIDs = props.sheetDataArray[newSheetIndex].data.map(c => c.columnID);

        setParams(prevMergeParams => {
            // Return if we're not changing anything!
            if (prevMergeParams[indexName] == newSheetIndex) {
                return prevMergeParams;
            }
            
            const newSuggestedKeys = getSuggestedKeysColumnID(
                props.sheetDataArray, 
                sheetNumber === MergeSheet.First ? newSheetIndex : prevMergeParams.sheet_index_one, 
                sheetNumber === MergeSheet.Second ? newSheetIndex : prevMergeParams.sheet_index_two
            );

            if (newSuggestedKeys === undefined) {
                return prevMergeParams;
            }

            return {
                ...prevMergeParams,
                [indexName]: newSheetIndex,
                [selectedColumnsName]: newSelectedColumnIDs,
                merge_key_column_id_one: newSuggestedKeys.merge_key_column_id_one,
                merge_key_column_id_two: newSuggestedKeys.merge_key_column_id_two
            }
        })
    }

    /*
        Sets a new merge key for one of the merge sheets
    */
    const setNewMergeKeyColumnID = (sheetNumber: MergeSheet, newMergeKeyColumnID: ColumnID): void => {
        const mergeKeyIDName = sheetNumber === MergeSheet.First ? 'merge_key_column_id_one' : 'merge_key_column_id_two';

        setParams(prevParams => {
            return {
                ...prevParams,
                [mergeKeyIDName]: newMergeKeyColumnID
            }
        })
    }

    /*
        Toggles if we should keep a specific column from one of the sheets in the new
        merged sheet.
    */
    const toggleKeepColumnIDs = (sheetNumber: MergeSheet, columnIDs: ColumnID[], newToggle: boolean): void => {
        const selectedColumnIDsName = sheetNumber == MergeSheet.First ? 'selected_column_ids_one' : 'selected_column_ids_two'
        const mergeKeyIDName = sheetNumber == MergeSheet.First ? 'merge_key_column_id_one' : 'merge_key_column_id_two'

        setParams(prevParams => {
            const newSelectedColumnIDs = [...prevParams[selectedColumnIDsName]]

            for (let i = 0; i < columnIDs.length; i++) {
                const columnID = columnIDs[i];

                // We the don't let you toggle the merge key!
                if (prevParams[mergeKeyIDName] === columnID) {
                    return prevParams;
                }

                if (newToggle) {
                    if (!newSelectedColumnIDs.includes(columnID)) {
                        newSelectedColumnIDs.push(columnID)
                    }
                } else {
                    if (newSelectedColumnIDs.includes(columnID)) {
                        newSelectedColumnIDs.splice(newSelectedColumnIDs.indexOf(columnID), 1)
                    }
                }
            }
            
            return {
                ...prevParams,
                [selectedColumnIDsName]: newSelectedColumnIDs
            }
        })
    }

    /*
        If the merge params are undefined, then display this error message.
    */
    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='You need two dataframes before you can merge them.'/>
    }

    /*
        We don't let you select or unselect the sheet merge key, and note that we must account
        for the shift in the indexes that this causes when updating if the state of an item is 
        toggled.

        Thus, we filter out the merge keys from both the list of columns, as well as the 
        toggles for these columns.

        Furthermore, we keep the dtypes with these column ids, so that we can display them
        as right text so the user gets more information about the columns that they are 
        taking.
    */

    const sheetOneOriginalColumnIDsAndDtypes: [ColumnID, string][] = props.sheetDataArray[params.sheet_index_one] ? props.sheetDataArray[params.sheet_index_one].data.map(c => [c.columnID, c.columnDtype]) : [];
    const sheetTwoOriginalColumnIDsAndDtypes: [ColumnID, string][] = props.sheetDataArray[params.sheet_index_two] ? props.sheetDataArray[params.sheet_index_two].data.map(c => [c.columnID, c.columnDtype]) : [];

    const sheetOneColumnIDsAndDtypesListWithoutMergeKey = sheetOneOriginalColumnIDsAndDtypes.filter(([columnID, ]) => columnID !== params.merge_key_column_id_one)
    const sheetTwoColumnIDsAndDtypesListWithoutMergeKey = sheetTwoOriginalColumnIDsAndDtypes.filter(([columnID, ]) => columnID !== params.merge_key_column_id_two)

    const sheetOneToggles = sheetOneColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, ]) => params.selected_column_ids_one.includes(columnID))
    const sheetTwoToggles = sheetTwoColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, ]) => params.selected_column_ids_two.includes(columnID))

    const sheetOneColumnIDsMap = props.columnIDsMapArray[params.sheet_index_one];
    const sheetTwoColumnIDsMap = props.columnIDsMapArray[params.sheet_index_two];

    // Display an error in the header, if there is an error
    const header = (
        <div className='flexbox-row flexbox-space-between element-width-block'>
            {error === undefined && 
                <p className='text-header-2'>
                    Merge Sheets Together
                </p>
            }
            {error !== undefined && 
                <p className='text-color-error' style={{width: '85%'}}>
                    {error}
                </p>
            }
            <XIcon onClick={() => props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {type: TaskpaneType.NONE} 
                }
            })}/>
        </div>
    )

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header={header}
                headerOutsideRow
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' suppressTopBottomMargin>
                    <Col offsetRight={1}>
                        <p className='text-header-3'>
                            Merge Type
                        </p>
                    </Col>
                    <Col>
                        <Select 
                            value={params.how}
                            onChange={(mergeType: string) => {
                                const newMergeTypeEnum = mergeType as MergeType
                                setNewMergeType(newMergeTypeEnum)
                            }}
                            width='medium'
                        >
                            <DropdownItem
                                title={MergeType.LOOKUP}
                                subtext="Includes all rows from the first sheet and only matching rows from the second sheet. If there are mulitple matches in the second sheet, only takes the first."
                            />
                            <DropdownItem
                                title={MergeType.LEFT}
                                subtext="Includes all rows from the first sheet and only matching rows from the second sheet. Includes all matches."
                            />
                            <DropdownItem
                                title={MergeType.RIGHT}
                                subtext="Includes all rows from the second sheet and only matching rows from the  first sheet. Includes all matches."
                            />
                            <DropdownItem
                                title={MergeType.INNER}
                                subtext="Only includes rows that have matches in both sheets."
                            />
                            <DropdownItem
                                title={MergeType.OUTER}
                                subtext="Includes all rows from both sheets, regardless of whether there is a match in the other sheet."
                            />
                            <DropdownItem
                                title={MergeType.UNIQUE_IN_LEFT}
                                subtext="Includes each row from the first sheet that doesn't have a match in the second sheet."
                            />
                            <DropdownItem
                                title={MergeType.UNIQUE_IN_RIGHT}
                                subtext="Includes each row from second sheet that doesn't have a match in the first sheet."
                            />
                        </Select>
                    </Col>
                </Row>
                <MergeSheetAndKeySelection
                    dfNames={originalDfNames}
                    columnIDsMap={sheetOneColumnIDsMap}
                    sheetNum={MergeSheet.First}
                    sheetIndex={params.sheet_index_one}
                    mergeKeyColumnID={params.merge_key_column_id_one}
                    otherSheetIndex={params.sheet_index_two}
                    sheetDataArray={props.sheetDataArray}
                    setNewSheetIndex={(newSheetIndex) => {setNewSheetIndex(MergeSheet.First, newSheetIndex)}}
                    setNewMergeKeyColumnID={(newMergeKeyColumnID) => setNewMergeKeyColumnID(MergeSheet.First, newMergeKeyColumnID)}
                />
                <p className='text-header-3'>
                    Columns to Keep
                </p>
                {params.how !== MergeType.UNIQUE_IN_RIGHT &&
                    <MultiToggleBox
                        searchable
                        toggleAllIndexes={(indexesToToggle, newToggle) => {
                            const columnIDs = indexesToToggle.map(index => sheetOneColumnIDsAndDtypesListWithoutMergeKey[index][0]);
                            toggleKeepColumnIDs(MergeSheet.First, columnIDs, newToggle);
                        }}
                        height='medium'
                    >
                        {sheetOneColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, columnDtype], index) => {
                            const columnHeader = sheetOneColumnIDsMap[columnID];
                            return (
                                <MultiToggleItem
                                    key={index}
                                    title={getDisplayColumnHeader(columnHeader)}
                                    rightText={getDtypeValue(columnDtype)}
                                    toggled={sheetOneToggles[index]}
                                    index={index}
                                    onToggle={() => {
                                        toggleKeepColumnIDs(MergeSheet.First, [columnID], !sheetOneToggles[index])
                                    }}
                                />
                            ) 
                        })}
                    </MultiToggleBox>
                }
                {params.how === MergeType.UNIQUE_IN_RIGHT &&
                    <p>
                        Finding the unique values in the second sheet doesn&apos;t keep any columns from the first sheet.
                    </p>
                }
                <MergeSheetAndKeySelection
                    dfNames={originalDfNames}
                    columnIDsMap={sheetTwoColumnIDsMap}
                    sheetNum={MergeSheet.Second}
                    mergeKeyColumnID={params.merge_key_column_id_two}
                    sheetIndex={params.sheet_index_two}
                    otherSheetIndex={params.sheet_index_one}
                    sheetDataArray={props.sheetDataArray}
                    setNewSheetIndex={(newSheetIndex) => {setNewSheetIndex(MergeSheet.Second, newSheetIndex)}}
                    setNewMergeKeyColumnID={(newMergeKeyColumnID) => setNewMergeKeyColumnID(MergeSheet.Second, newMergeKeyColumnID)}
                />
                <div>
                    <p className='text-header-3'>
                        Columns to Keep
                    </p>
                    {params.how !== MergeType.UNIQUE_IN_LEFT && 
                        <MultiToggleBox
                            searchable
                            toggleAllIndexes={(indexesToToggle, newToggle) => {
                                const columnIDs = indexesToToggle.map(index => sheetTwoColumnIDsAndDtypesListWithoutMergeKey[index][0]);
                                toggleKeepColumnIDs(MergeSheet.Second, columnIDs, newToggle);
                            }}
                            height='medium'
                        >
                            {sheetTwoColumnIDsAndDtypesListWithoutMergeKey.map(([columnID, columnDtype], index) => {
                                const columnHeader = sheetTwoColumnIDsMap[columnID];
                                return (
                                    <MultiToggleItem
                                        key={index}
                                        title={getDisplayColumnHeader(columnHeader)}
                                        rightText={getDtypeValue(columnDtype)}
                                        toggled={sheetTwoToggles[index]}
                                        index={index}
                                        onToggle={() => {
                                            toggleKeepColumnIDs(MergeSheet.Second, [columnID], !sheetTwoToggles[index])
                                        }}
                                    />
                                ) 
                            })}
                        </MultiToggleBox>
                    }
                    {params.how === MergeType.UNIQUE_IN_LEFT &&
                        <p>
                            Finding the unique values in the first sheet doesn&apos;t keep any columns from the second sheet.
                        </p>
                    }
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}


export default MergeTaskpane;