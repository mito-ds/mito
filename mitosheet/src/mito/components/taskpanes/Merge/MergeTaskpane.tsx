// Copyright (c) Mito

import React from 'react';
import useLiveUpdatingParams from '../../../hooks/useLiveUpdatingParams';
import { MitoAPI } from '../../../api/api';
import { AnalysisData, MergeParams, ColumnID, SheetData, StepType, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleColumns from '../../elements/MultiToggleColumns';
import Select from '../../elements/Select';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import Spacer from '../../layout/Spacer';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import MergeKeysSelectionSection from './MergeKeysSelection';
import MergeSheetSection from './MergeSheetSelection';
import { getFirstSuggestedMergeKeys } from './mergeUtils';


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


export type MergeTaskpaneProps = {
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    existingParams?: MergeParams,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    analysisData: AnalysisData;
    defaultMergeType?: MergeType;
};


export const getDefaultMergeParams = (sheetDataArray: SheetData[], _sheetIndexOne: number, _sheetIndexTwo?: number, previousParams?: MergeParams, defaultMergeType?: MergeType): MergeParams | undefined => {
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
        how: previousParams ? previousParams.how : (defaultMergeType ?? 'lookup'),
        sheet_index_one: sheetIndexOne,
        sheet_index_two: sheetIndexTwo,
        merge_key_column_ids: suggestedMergeKeys ? [suggestedMergeKeys] : [],
        selected_column_ids_one: selectedColumnIDsOne,
        selected_column_ids_two: selectedColumnIDsTwo,
    }
}

const getValidMergeParams = (params: MergeParams, sheetDataArray: SheetData[]): MergeParams => {
    const {
        merge_key_column_ids,
        selected_column_ids_one,
        selected_column_ids_two 
    } = params;

    const sheetDataOne = sheetDataArray[params.sheet_index_one];
    const sheetDataTwo = sheetDataArray[params.sheet_index_two];

    const validMergeKeyColumnIDs = merge_key_column_ids.filter(([mergeKeyColumnIDOne, mergeKeyColumnIDTwo]) => {
        return sheetDataOne.columnIDsMap[mergeKeyColumnIDOne] !== undefined && sheetDataTwo.columnIDsMap[mergeKeyColumnIDTwo] !== undefined
    });

    const validSelectedColumnIDsOne = selected_column_ids_one.filter((columnID) => {
        return sheetDataOne.columnIDsMap[columnID] !== undefined
    });

    const validSelectedColumnIDsTwo = selected_column_ids_two.filter((columnID) => {
        return sheetDataTwo.columnIDsMap[columnID] !== undefined
    });

    return {
        ...params,
        merge_key_column_ids: validMergeKeyColumnIDs,
        selected_column_ids_one: validSelectedColumnIDsOne,
        selected_column_ids_two: validSelectedColumnIDsTwo
    }
}

const getEditMergeWarnings = (params: MergeParams, sheetDataOne: SheetData, sheetDataTwo: SheetData): {
    mergeKeyWarnings?: string[],
    selectedColumnsOneWarnings?: string,
    selectedColumnsTwoWarnings?: string,
} => {
    const {
        merge_key_column_ids,
        selected_column_ids_one,
        selected_column_ids_two 
    } = params;

    const invalidMergeKeys = merge_key_column_ids.filter(([mergeKeyColumnIDOne, mergeKeyColumnIDTwo]) => {
        return sheetDataOne.columnIDsMap[mergeKeyColumnIDOne] === undefined || sheetDataTwo.columnIDsMap[mergeKeyColumnIDTwo] === undefined
    });
    const mergeKeyWarnings = invalidMergeKeys.map(([mergeKeyColumnIDOne, mergeKeyColumnIDTwo]) => {
        const sheetOneColumnHeader = sheetDataOne.columnIDsMap[mergeKeyColumnIDOne];
        const sheetTwoColumnHeader = sheetDataTwo.columnIDsMap[mergeKeyColumnIDTwo];
        if (sheetOneColumnHeader === undefined && sheetTwoColumnHeader === undefined) {
            return `The merge keys ${mergeKeyColumnIDOne} and “${mergeKeyColumnIDTwo}” were removed because they no longer exist in “${sheetDataOne.dfName}” and “${sheetDataTwo.dfName}”.`
        } else if (sheetOneColumnHeader === undefined) {
            return `The merge key pairing “${mergeKeyColumnIDOne}” and “${mergeKeyColumnIDTwo}” was removed because “${mergeKeyColumnIDOne}” no longer exists in “${sheetDataOne.dfName}”.`
        } else {
            return `The merge key pairing “${mergeKeyColumnIDOne}” and “${mergeKeyColumnIDTwo}” was removed because “${mergeKeyColumnIDTwo}” no longer exists in “${sheetDataTwo.dfName}”.`
        }
    });

    const getSelectedColumnWarningString = (invalidSelectedColumns: ColumnID[], sheetData: SheetData): string | undefined => {
        if (invalidSelectedColumns.length === 1) {
            return `The column “${invalidSelectedColumns[0]}” was removed because it no longer exists in “${sheetData.dfName}”.`
        } else if (invalidSelectedColumns.length > 1) {
            return `The columns “${invalidSelectedColumns.join(', ')}” were removed because they no longer exist in “${sheetData.dfName}”.`
        } else {
            return undefined;
        }
    }

    const invalidSelectedColumnsOne = selected_column_ids_one.filter((columnID) => {
        return sheetDataOne.columnIDsMap[columnID] === undefined
    });
    const selectedColumnsOneWarning = getSelectedColumnWarningString(invalidSelectedColumnsOne, sheetDataOne);

    const invalidSelectedColumnsTwo = selected_column_ids_two.filter((columnID) => {
        return sheetDataTwo.columnIDsMap[columnID] === undefined
    });
    const selectedColumnsTwoWarning = getSelectedColumnWarningString(invalidSelectedColumnsTwo, sheetDataTwo);

    return {
        mergeKeyWarnings: mergeKeyWarnings,
        selectedColumnsOneWarnings: selectedColumnsOneWarning,
        selectedColumnsTwoWarnings: selectedColumnsTwoWarning
    }
}


const MergeTaskpane = (props: MergeTaskpaneProps): JSX.Element => {
    const {params, setParams, error} = useLiveUpdatingParams<MergeParams, MergeParams>(
        () => props.existingParams ? getValidMergeParams(props.existingParams, props.sheetDataArray) : getDefaultMergeParams(props.sheetDataArray, props.selectedSheetIndex, undefined, undefined, props.defaultMergeType),
        StepType.Merge,
        props.mitoAPI,
        props.analysisData,
        50, // 50 ms debounce delay
        undefined,
        {
            // If we have a destination sheet index, we make sure to not overwrite the pivot
            // that is there by default
            doNotSendDefaultParams: props.existingParams?.destination_sheet_index !== undefined,
        }
    )

    /*
        If the merge params are undefined, then display this error message.
    */
    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message='You need two dataframes before you can merge them.'/>
    }

    const sheetDataOne: SheetData = props.sheetDataArray[params.sheet_index_one];
    const sheetDataTwo: SheetData = props.sheetDataArray[params.sheet_index_two];

    const editMergeWarnings = props.existingParams !== undefined ? getEditMergeWarnings(props.existingParams, sheetDataOne, sheetDataTwo) : undefined;

    const mergeKeyColumnIDsOne = params.merge_key_column_ids.map(([one, ]) => {return one});
    const mergeKeyColumnIDsTwo = params.merge_key_column_ids.map(([, two]) => {return two});

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header="Merge Dataframes"
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' suppressTopBottomMargin>
                    <Col offsetRight={1} span={7}>
                        <p className='text-header-3'>
                            Merge Type
                        </p>
                    </Col>
                    <Col span={14}>
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
                            width='block'
                        >
                            <DropdownItem
                                title={MergeType.LOOKUP}
                                subtext="Includes all rows from the first sheet and only matching rows from the second sheet. If there are multiple matches in the second sheet, only takes the first."
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
                    warnings={editMergeWarnings?.mergeKeyWarnings}
                />
                <Spacer px={20}/>
                <p className='text-header-3'>
                    Columns to Keep from First Dataframe
                </p>
                {params.how !== MergeType.UNIQUE_IN_RIGHT &&
                    <MultiToggleColumns
                        sheetData={sheetDataOne}
                        selectedColumnIDs={params.selected_column_ids_one}
                        disabledColumnIDs={mergeKeyColumnIDsOne}
                        onChange={(newSelectedColumnIDs: ColumnID[]) => {
                            setParams(oldDropDuplicateParams => {
                                return {
                                    ...oldDropDuplicateParams,
                                    selected_column_ids_one: newSelectedColumnIDs
                                }
                            })
                        }}
                        warning={editMergeWarnings?.selectedColumnsOneWarnings}
                    />
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
                        <MultiToggleColumns
                            sheetData={sheetDataTwo}
                            selectedColumnIDs={params.selected_column_ids_two}
                            disabledColumnIDs={mergeKeyColumnIDsTwo}
                            onChange={(newSelectedColumnIDs: ColumnID[]) => {
                                setParams(oldDropDuplicateParams => {
                                    return {
                                        ...oldDropDuplicateParams,
                                        selected_column_ids_two: newSelectedColumnIDs
                                    }
                                })
                            }}
                            warning={editMergeWarnings?.selectedColumnsTwoWarnings}
                        />
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