// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../../api/api';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { AnalysisData, ColumnHeader, ColumnID, SheetData, StepType, UIState } from '../../../types';
import { intersection } from '../../../utils/arrays';
import { getFirstCharactersOfColumnHeaders } from '../../../utils/columnHeaders';
import { isDatetimeDtype, isNumberDtype, isTimedeltaDtype } from '../../../utils/dtypes';
import { isOnlyNumberString } from '../../../utils/numbers';
import DataframeSelect from '../../elements/DataframeSelect';
import DropdownItem from '../../elements/DropdownItem';
import Input from '../../elements/Input';
import MultiToggleColumns from '../../elements/MultiToggleColumns';
import Select from '../../elements/Select';
import TextButton from '../../elements/TextButton';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';


interface FillNaTaskpaneProps {
    uiState: UIState
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    analysisData: AnalysisData;
    startingColumnIDs?: ColumnID[];
}


type FillMethod = {'type': 'value', 'value': string | boolean | number} 
| {'type': 'ffill'}
| {'type': 'bfill'}
| {'type': 'mean'}
| {'type': 'median'}

interface FillNaParams {
    sheet_index: number,
    column_ids: ColumnID[],
    fill_method: FillMethod
}

// If the user inputs these, we cast them as booleans
const BOOLEAN_STRINGS = ['True', 'true', 'False', 'false'];


const getDefaultParams = (
    sheetDataArray: SheetData[], 
    sheetIndex: number, defaultFillMethod?: FillMethod,
    startingColumnIDs?: ColumnID[]
): FillNaParams | undefined => {

    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    const sheetData = sheetDataArray[sheetIndex];

    let finalFillMethod: FillMethod = defaultFillMethod || {type: 'value', 'value': 0};
    // We make sure that the default fill method is valid for the new dataframe we're selecting
    // which is only an issue if these are mean or median values
    if (finalFillMethod.type === 'mean' || finalFillMethod.type === 'median') {
        const onlyMeanAndMedianColumnSelected = Object.values(sheetData.columnDtypeMap)
            .map(columnDtype => isNumberDtype(columnDtype) || isDatetimeDtype(columnDtype) || isTimedeltaDtype(columnDtype))
            .every(hasDefinedMeanAndMedian => hasDefinedMeanAndMedian === true)
        
        if (!onlyMeanAndMedianColumnSelected) {
            finalFillMethod = {type: 'value', 'value': 0};
        }
    }

    const columnIDs = startingColumnIDs === undefined ? Object.keys(sheetData.columnIDsMap) : intersection(Object.keys(sheetData.columnIDsMap), startingColumnIDs);

    return {
        sheet_index: sheetIndex,
        column_ids: columnIDs,
        fill_method: finalFillMethod
    }
}

/* 
    Constructs a message in the case an edit is applied telling users 
    fill na was successful on some columns
*/
const getButtonMessage = (sheetData: SheetData | undefined, columnIDs: ColumnID[]): string => {
    if (columnIDs.length === 0) {
        return 'Select columns to fill NaN values';
    }

    const columnHeaders: ColumnHeader[] = columnIDs.map(columnID => sheetData?.columnIDsMap[columnID]).filter(columnHeader => columnHeader !== undefined) as ColumnHeader[];
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(columnHeaders, 25)
    
    if (numOtherColumnHeaders === 0) {
        return `Fill NaNs in ${columnHeadersString}`
    } else {
        return `Fill NaNs in ${columnHeadersString} and ${numOtherColumnHeaders} others`
    }
}

/* 
    Constructs a message in the case an edit is applied telling users 
    fill na was successful on some columns
*/
const getSuccessMessage = (sheetData: SheetData | undefined, columnIDs: ColumnID[]): JSX.Element => {
    const columnHeaders: ColumnHeader[] = columnIDs.map(columnID => sheetData?.columnIDsMap[columnID]).filter(columnHeader => columnHeader !== undefined) as ColumnHeader[];
    const [columnHeadersString, numOtherColumnHeaders] = getFirstCharactersOfColumnHeaders(columnHeaders, 25)
    
    if (numOtherColumnHeaders === 0) {
        return (<p>Filled NaNs in <span className='text-color-medium-important'>{columnHeadersString}</span>.</p>)
    } else {
        return (<p>Filled NaNs in <span className='text-color-medium-important'>{columnHeadersString}</span> and <span className='tetext-color-medium-important'>{numOtherColumnHeaders}</span> other columns.</p>)
    }
}

/*
    A taskpane that allows users to fill NaN values in the sheet
*/
const FillNaTaskpane = (props: FillNaTaskpaneProps): JSX.Element => {

    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<FillNaParams, undefined>(
        () => getDefaultParams(props.sheetDataArray, props.selectedSheetIndex, undefined, props.startingColumnIDs),
        StepType.FillNa, 
        props.mitoAPI,
        props.analysisData,
    )

    // If we change the starting column ids from outside the taskpane, then we 
    // update which columns are selected to fill nan in
    useEffect(() => {
        setParams(prevParams => {
            const newParams = getDefaultParams(props.sheetDataArray, props.selectedSheetIndex, prevParams.fill_method, props.startingColumnIDs);
            if (newParams) {
                return newParams;
            }
            return prevParams;
        });
    }, [props.startingColumnIDs])

    if (params === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState} message="Import a dataset before filling NaN values."/>)
    }

    const sheetData: SheetData | undefined = props.sheetDataArray[params.sheet_index];
    const columnDtypeMap = sheetData?.columnDtypeMap || {};
    const onlyMeanAndMedianColumnSelected = params.column_ids.length === 0 || params.column_ids
        .map(columnID => columnDtypeMap[columnID])
        .filter(columnDtype => columnDtype !== undefined)
        .map(columnDtype => isNumberDtype(columnDtype) || isDatetimeDtype(columnDtype) || isTimedeltaDtype(columnDtype))
        .every(hasDefinedMeanAndMedian => hasDefinedMeanAndMedian === true)

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Fill NaN Values'
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <DataframeSelect
                    title='Select the dataframe to fill nan values in.'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={params.sheet_index}
                    onChange={(newSheetIndex: number) => {
                        setParams(prevParams => {
                            const newParams = getDefaultParams(props.sheetDataArray, newSheetIndex, prevParams.fill_method);
                            if (newParams) {
                                return newParams;
                            }
                            return {
                                ...prevParams,
                                sheet_index: newSheetIndex
                            }
                        });
                    }}
                />
                <Row justify='space-between' align='center' title='Select the columns to fill nan values in.'>
                    <Col>
                        <p className='text-header-3'>
                            Columns to Fill NaN Values In
                        </p>
                    </Col>
                </Row>
                <MultiToggleColumns
                    sheetData={sheetData}
                    selectedColumnIDs={params.column_ids}
                    getIsDisabledColumnID={(columnID, columnHeader, columnDtype) => {
                        const disabled = (params.fill_method.type === 'mean' || params.fill_method.type === 'median') && 
                            !(isNumberDtype(columnDtype) || isTimedeltaDtype(columnDtype) || isDatetimeDtype(columnDtype));
                        return disabled;
                    }}
                    onChange={(newSelectedColumnIDs: ColumnID[]) => {
                        setParams(oldDropDuplicateParams => {
                            return {
                                ...oldDropDuplicateParams,
                                column_ids: newSelectedColumnIDs
                            }
                        })
                    }}
                />
                <Row justify='space-between' align='center' title='Select the method for filling nan values'>
                    <Col>
                        <p className='text-header-3'>
                            Fill Method
                        </p>
                    </Col>
                    <Col>
                        <Select 
                            value={params.fill_method.type}
                            onChange={(newFillMethodType: string) => {
                                setParams(prevConcatParams => {
                                    let newFillMethod: FillMethod = {type: 'bfill'}
                                    if (newFillMethodType === 'value') {
                                        newFillMethod = {type: 'value', value: 0};
                                    } else {
                                        newFillMethod = {type: newFillMethodType} as FillMethod;
                                    }

                                    return {
                                        ...prevConcatParams,
                                        fill_method: newFillMethod
                                    }
                                })
                            }}
                            width='medium'
                        >
                            <DropdownItem
                                id='value'
                                title='Value'
                                subtext="Replaces NaN values with a specific value that you input."
                            />
                            <DropdownItem
                                id='ffill'
                                title="Forward Fill"
                                subtext="Replaces NaNs in the column with the value in the row before."
                            />
                            <DropdownItem
                                id='bfill'
                                title="Back Fill"
                                subtext="Replaces NaNs in the column with the value in the row after."
                            />
                            <DropdownItem
                                id='mean'
                                title="Column Mean"
                                subtext={
                                    !onlyMeanAndMedianColumnSelected 
                                        ? "Only number, datetime, and timedetla columns support fill with mean."
                                        : "Replaces NaN values in number columns with the average of the column."
                                }
                                disabled={!onlyMeanAndMedianColumnSelected}
                            />
                            <DropdownItem
                                id='median'
                                title="Column Median"
                                subtext={
                                    !onlyMeanAndMedianColumnSelected 
                                        ? "Only number, datetime, and timedetla columns support fill with median."
                                        : "Replaces NaN values in number columns with the median of the column."
                                }
                                disabled={!onlyMeanAndMedianColumnSelected}
                            />
                        </Select>
                    </Col>
                </Row>
                {params.fill_method.type === 'value' &&
                    <Row justify='space-between' align='center' title='Select the dataframe to fill nan values in.'>
                        <Col>
                            <p className='text-header-3'>
                                Fill Value
                            </p>
                        </Col>
                        <Col>
                            <Input
                                autoFocus
                                width='medium'
                                value={'' + params.fill_method.value}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    
                                    setParams(prevParams => {
                                        return {
                                            ...prevParams,
                                            fill_method: {
                                                type: 'value',
                                                value: newValue
                                            }
                                        }
                                    })
                                }}
                            />
                        </Col>
                    </Row>
                }
                {editApplied && !loading &&
                    <Row className='mt-5'>
                        <p className='text-subtext-1'>
                            {getSuccessMessage(sheetData, params.column_ids)} 
                        </p>
                    </Row>
                }
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => {
                        // We check if the params have a string stored in them that could be a number,
                        // and if so we parse it to a number. This is a final tranform before the edit
                        edit((prevParams) => {
                            if (prevParams.fill_method.type === 'value' && typeof prevParams.fill_method.value === 'string') {
                                let finalValue: string | boolean | number = prevParams.fill_method.value;

                                if (BOOLEAN_STRINGS.includes(finalValue)) {
                                    finalValue = finalValue.toLowerCase().startsWith('t') ? true : false;
                                } else if (isOnlyNumberString(prevParams.fill_method.value)) {
                                    finalValue = parseFloat(prevParams.fill_method.value);
                                }

                                return {
                                    ...prevParams,
                                    fill_method: {type: 'value', value: finalValue}
                                }
                            }
                            return prevParams
                        });

                    }}
                    disabled={params.column_ids.length === 0}
                    disabledTooltip={"Select at least one column to fill NaN values in"}
                >
                    {getButtonMessage(sheetData, params.column_ids)}
                </TextButton>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
};

export default FillNaTaskpane;