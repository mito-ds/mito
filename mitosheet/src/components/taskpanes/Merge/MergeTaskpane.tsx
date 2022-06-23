// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { AnalysisData, ColumnID, SheetData, StepType, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import Select from '../../elements/Select';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import { getDtypeValue } from '../ControlPanel/SortDtypeTab/DtypeCard';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { getFirstSuggestedMergeKeys } from './mergeUtils';
import MergeSheetSection from './MergeSheetSelection';
import MergeKeysSelectionSection from './MergeKeysSelection';
import { addIfAbsent, removeIfPresent, toggleInArray } from '../../../utils/arrays';
import Spacer from '../../spacing/Spacer';


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
    sheet_index_two: number,
    merge_key_column_ids: [ColumnID, ColumnID][],
    selected_column_ids_one: ColumnID[],
    selected_column_ids_two: ColumnID[],
}


export type MergeTaskpaneProps = {
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    analysisData: AnalysisData;
};


export const getDefaultMergeParams = (sheetDataArray: SheetData[], _sheetIndexOne: number, _sheetIndexTwo?: number, previousParams?: MergeParams): MergeParams | undefined => {
    if (sheetDataArray.length < 2) {
        return undefined;
    }

    const sheetIndexOne = _sheetIndexOne;
    const sheetIndexTwo = _sheetIndexTwo !== undefined
        ? _sheetIndexTwo 
        : (sheetIndexOne + 1 <= sheetDataArray.length - 1
            ? sheetIndexOne + 1
            : (sheetIndexOne - 1 >= 0 ? sheetIndexOne - 1 : sheetIndexOne)
        )
    
    // If we didn't change the sheets, then the default params are just the params we had last
    if (previousParams && previousParams.sheet_index_one == sheetIndexOne && previousParams.sheet_index_two === sheetIndexTwo) {
        return previousParams;
    }

    const suggestedMergeKeys = getFirstSuggestedMergeKeys(sheetDataArray, sheetIndexOne, sheetIndexTwo);

    // We default to selecting _all_ columns, if we switched datasets. Otherwise, we keep the selected
    // params from the previous params
    let selectedColumnIDsOne: ColumnID[] = [];
    let selectedColumnIDsTwo: ColumnID[] = [];

    if (previousParams && previousParams.sheet_index_one == sheetIndexOne) {
        selectedColumnIDsOne = previousParams.selected_column_ids_one;
    } else {
        selectedColumnIDsOne = [...Object.keys(sheetDataArray[sheetIndexOne]?.columnIDsMap || {})]
    }
    if (previousParams && previousParams.sheet_index_two == sheetIndexTwo) {
        selectedColumnIDsTwo = previousParams.selected_column_ids_two;
    } else {
        selectedColumnIDsTwo = [...Object.keys(sheetDataArray[sheetIndexTwo]?.columnIDsMap || {})]
    }
    
    return {
        how: previousParams ? previousParams.how : 'lookup',
        sheet_index_one: sheetIndexOne,
        sheet_index_two: sheetIndexTwo,
        merge_key_column_ids: suggestedMergeKeys ? [suggestedMergeKeys] : [],
        selected_column_ids_one: selectedColumnIDsOne,
        selected_column_ids_two: selectedColumnIDsTwo,
    }
}


const MergeTaskpane = (props: MergeTaskpaneProps): JSX.Element => {

    const {params, setParams, error} = useLiveUpdatingParams<MergeParams>(
        () => getDefaultMergeParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.Merge,
        props.mitoAPI,
        props.analysisData,
        50 // 50 ms debounce delay
    )

    /*
        If the merge params are undefined, then display this error message.
    */
    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='You need two dataframes before you can merge them.'/>
    }

    const sheetDataOne: SheetData = props.sheetDataArray[params.sheet_index_one];
    const sheetDataTwo: SheetData = props.sheetDataArray[params.sheet_index_two];

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header="Merge Dataframes"
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' suppressTopBottomMargin>
                    <Col offsetRight={1}>
                        <p className='text-header-3'>
                            Merge Type
                        </p>
                    </Col>
                    <Col offsetRight={2}>
                        <Select 
                            value={params.how}
                            onChange={(mergeType: string) => {
                                const newMergeTypeEnum = mergeType as MergeType
                                setParams(prevParams => {
                                    return {
                                        ...prevParams,
                                        how: newMergeTypeEnum
                                    }
                                })
                            }}
                            width='medium-large'
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
                <Spacer px={20}/>
                <MergeSheetSection
                    params={params}
                    setParams={setParams}
                    sheetDataArray={props.sheetDataArray}
                />
                <Spacer px={20}/>
                <MergeKeysSelectionSection
                    params={params}
                    setParams={setParams}
                    sheetDataArray={props.sheetDataArray}
                    error={error}
                />
                <Spacer px={20}/>
                <p className='text-header-3'>
                    Columns to Keep from First Dataframe
                </p>
                {params.how !== MergeType.UNIQUE_IN_RIGHT &&
                    <MultiToggleBox
                        searchable
                        searchRightText
                        toggleAllIndexes={(indexesToToggle, newToggle) => {
                            const columnIDs = Object.keys(sheetDataOne?.columnDtypeMap || {})
                                .map((columnID) => {return columnID})
                                .filter((_, index) => {
                                    return indexesToToggle.includes(index);
                                });
                            
                            setParams(prevParams => {
                                const newSelectedColumnIDsOne = [...params.selected_column_ids_one];
                                if (newToggle) {
                                    columnIDs.forEach((columnID) => {
                                        addIfAbsent(newSelectedColumnIDsOne, columnID);
                                    })
                                } else {
                                    columnIDs.forEach((columnID) => {
                                        removeIfPresent(newSelectedColumnIDsOne, columnID);
                                    })
                                }

                                return {
                                    ...prevParams,
                                    selected_column_ids_one: newSelectedColumnIDsOne
                                }
                            })
                        }}
                        height='medium'
                    >
                        {Object.entries(sheetDataOne?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                            const columnHeader = sheetDataOne.columnIDsMap[columnID];
                            const toggled = params.selected_column_ids_one.includes(columnID); // TODO: make it true if merge key with OR
                            const isMergeKey = params.merge_key_column_ids.map(([mergeKeyOne, ]) => {return mergeKeyOne}).includes(columnID);
                            return (
                                <MultiToggleItem
                                    key={index}
                                    title={getDisplayColumnHeader(columnHeader)}
                                    rightText={getDtypeValue(columnDtype)}
                                    toggled={toggled || isMergeKey}
                                    disabled={isMergeKey}
                                    index={index}
                                    onToggle={() => {
                                        setParams(prevParams => {
                                            const newSelectedColumnIDsOne = [...params.selected_column_ids_one];
                                            toggleInArray(newSelectedColumnIDsOne, columnID);
                                            return {
                                                ...prevParams,
                                                selected_column_ids_one: newSelectedColumnIDsOne
                                            }
                                        })
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
                <Spacer px={20}/>
                <div>
                    <p className='text-header-3'>
                        Columns to Keep from Second Dataframe
                    </p>
                    {params.how !== MergeType.UNIQUE_IN_LEFT && 
                        <MultiToggleBox
                            searchable
                            searchRightText
                            toggleAllIndexes={(indexesToToggle, newToggle) => {
                                const columnIDs = Object.keys(sheetDataTwo?.columnDtypeMap || {})
                                    .map((columnID) => {return columnID})
                                    .filter((_, index) => {
                                        return indexesToToggle.includes(index);
                                    });
                            
                                setParams(prevParams => {
                                    const newSelectedColumnIDsTwo = [...params.selected_column_ids_two];
                                    if (newToggle) {
                                        columnIDs.forEach((columnID) => {
                                            addIfAbsent(newSelectedColumnIDsTwo, columnID);
                                        })
                                    } else {
                                        columnIDs.forEach((columnID) => {
                                            removeIfPresent(newSelectedColumnIDsTwo, columnID);
                                        })
                                    }

                                    return {
                                        ...prevParams,
                                        selected_column_ids_two: newSelectedColumnIDsTwo
                                    }
                                })
                            }}
                            height='medium'
                        >
                            {Object.entries(sheetDataTwo?.columnDtypeMap || {}).map(([columnID, columnDtype], index) => {
                                const columnHeader = sheetDataTwo.columnIDsMap[columnID];
                                const toggled = params.selected_column_ids_two.includes(columnID);
                                const isMergeKey = params.merge_key_column_ids.map(([, mergeKeyTwo]) => {return mergeKeyTwo}).includes(columnID);

                                return (
                                    <MultiToggleItem
                                        key={index}
                                        title={getDisplayColumnHeader(columnHeader)}
                                        rightText={getDtypeValue(columnDtype)}
                                        toggled={toggled || isMergeKey}
                                        disabled={isMergeKey}
                                        index={index}
                                        onToggle={() => {
                                            setParams(prevParams => {
                                                const newSelectedColumnIDsTwo = [...params.selected_column_ids_two];
                                                toggleInArray(newSelectedColumnIDsTwo, columnID);
                                                return {
                                                    ...prevParams,
                                                    selected_column_ids_two: newSelectedColumnIDsTwo
                                                }
                                            })
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