// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import MitoAPI from '../../../jupyter/api';

// Import 
import { AnalysisData, ColumnHeader, ColumnID, SheetData, StepType, UIState } from '../../../types';

import '../../../../css/taskpanes/Download/DownloadTaskpane.css'
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import Select from '../../elements/Select';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import DropdownItem from '../../elements/DropdownItem';
import MultiToggleBox from '../../elements/MultiToggleBox';
import MultiToggleItem from '../../elements/MultiToggleItem';
import { getDisplayColumnHeader, getFirstCharactersOfColumnHeaders } from '../../../utils/columnHeaders';
import { getDtypeValue } from '../ControlPanel/FilterAndSortTab/DtypeCard';
import { addIfAbsent, removeIfPresent } from '../../../utils/arrays';
import Spacer from '../../spacing/Spacer';
import Input from '../../elements/Input';
import { isNumberDtype } from '../../../utils/dtypes';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import TextButton from '../../elements/TextButton';
import { endsInZeroDecimals, isOnlyNumberString } from '../../../utils/numbers';


interface FillNaTaskpaneProps {
    uiState: UIState
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    analysisData: AnalysisData
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


const getDefaultParams = (sheetDataArray: SheetData[], selectedSheetIndex: number): FillNaParams | undefined => {
    if (sheetDataArray.length === 0 || sheetDataArray[selectedSheetIndex] === undefined) {
        return undefined;
    }

    const sheetData = sheetDataArray[selectedSheetIndex];

    return {
        sheet_index: selectedSheetIndex,
        column_ids: Object.keys(sheetData.columnIDsMap),
        fill_method: {type: 'value', 'value': 0}
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
        return (<p>Filled NaNs in <span className='text-color-gray-important'>{columnHeadersString}</span>.</p>)
    } else {
        return (<p>Filled NaNs in <span className='text-color-gray-important'>{columnHeadersString}</span> and <span className='text-color-gray-important'>{numOtherColumnHeaders}</span> other columns.</p>)
    }
}

/*
    A taskpane that allows users to fill NaN values in the sheet
*/
const FillNaTaskpane = (props: FillNaTaskpaneProps): JSX.Element => {

    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<FillNaParams, undefined>(
        getDefaultParams(props.sheetDataArray, props.selectedSheetIndex),
        StepType.FillNa, 
        props.mitoAPI,
        props.analysisData,
    )

    if (params === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState} message="Import a dataset before filling NaN values."/>)
    }

    const sheetData: SheetData | undefined = props.sheetDataArray[params.sheet_index];
    const columnIDsMap = sheetData?.columnIDsMap || {};
    const columnDtypeMap = sheetData?.columnDtypeMap || {};
    const onlyNumberColumnSelected = params.column_ids.length === 0 || params.column_ids
        .map(columnID => columnDtypeMap[columnID])
        .filter(columnDtype => columnDtype !== undefined)
        .map(columnDtype => isNumberDtype(columnDtype))
        .every(isNumber => isNumber === true)

    const toggleIndexes = (indexes: number[], newToggle: boolean): void => {
        const columnIds = Object.keys(props.sheetDataArray[params.sheet_index]?.columnIDsMap) || [];
        const columnIdsToToggle = indexes.map(index => columnIds[index]);

        const newColumnIds = [...params.column_ids];

        columnIdsToToggle.forEach(columnID => {
            if (newToggle) {
                addIfAbsent(newColumnIds, columnID);
            } else {
                removeIfPresent(newColumnIds, columnID);
            }
        })

        setParams(prevParams => {
            return {
                ...prevParams,
                column_ids: newColumnIds
            }
        })
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Fill NaN Values'
                setUIState={props.setUIState}   
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center' title='Select the dataframe to fill nan values in.'>
                    <Col>
                        <p className='text-header-3'>
                            Dataframe
                        </p>
                    </Col>
                    <Col>
                        <Select
                            value={props.sheetDataArray[params.sheet_index]?.dfName}
                            onChange={(newDfName: string) => {
                                const newSheetIndex = props.sheetDataArray.findIndex((sheetData) => {
                                    return sheetData.dfName == newDfName;
                                })
                                
                                if (newSheetIndex >= 0) {
                                    setParams(prevParams => {
                                        return {
                                            ...prevParams,
                                            sheet_index: newSheetIndex
                                        }
                                    })
                                }

                            }}
                            width='medium'
                        >
                            {props.sheetDataArray.map(sheetData => {
                                return (
                                    <DropdownItem
                                        key={sheetData.dfName}
                                        title={sheetData.dfName}
                                    />
                                )
                            })}
                        </Select>
                    </Col>
                </Row>
                <Spacer px={15}/>
                <Row justify='space-between' align='center' title='Select the dataframe to fill nan values in.'>
                    <Col>
                        <p className='text-header-3'>
                            Columns to Fill NaN Values In
                        </p>
                    </Col>
                </Row>
                <MultiToggleBox
                    searchable
                    toggleAllIndexes={toggleIndexes}
                    height='medium'
                >
                    {Object.entries(columnDtypeMap).map(([columnID, columnDtype], index) => {
                        const columnHeader = columnIDsMap[columnID];
                        const toggle = params.column_ids.includes(columnID);
                        const disabled = (params.fill_method.type === 'mean' || params.fill_method.type === 'median') && 
                            (!isNumberDtype(columnDtype));

                        return (
                            <MultiToggleItem
                                key={index}
                                index={index}
                                disabled={disabled}
                                title={getDisplayColumnHeader(columnHeader)}
                                rightText={getDtypeValue(columnDtype)}
                                toggled={toggle}
                                onToggle={() => {
                                    toggleIndexes([index], !toggle)
                                }}
                            />
                        ) 
                    })}
                </MultiToggleBox>
                <Spacer px={15}/>
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
                                subtext="Replaces NaN values with the value above in the dataframe."
                            />
                            <DropdownItem
                                id='bfill'
                                title="Back Fill"
                                subtext="Replaces NaN values with the value below in the dataframe."
                            />
                            <DropdownItem
                                id='mean'
                                title="Column Mean"
                                subtext={
                                    !onlyNumberColumnSelected 
                                        ? "Select only number columns to fill them with the average of those columns."
                                        : "Replaces NaN values in number columns with the average of the column."
                                }
                                disabled={!onlyNumberColumnSelected}
                            />
                            <DropdownItem
                                id='median'
                                title="Column Median"
                                subtext={
                                    !onlyNumberColumnSelected 
                                        ? "Select only number columns to fill them with the median of those columns."
                                        : "Replaces NaN values in number columns with the median of the column."
                                }
                                disabled={!onlyNumberColumnSelected}
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
                                    let finalValue: string | boolean | number = newValue;

                                    if (BOOLEAN_STRINGS.includes(newValue)) {
                                        finalValue = newValue.toLowerCase().startsWith('t') ? true : false;
                                    } else if (newValue !== '' && isOnlyNumberString(newValue) && !endsInZeroDecimals(newValue)) {
                                        finalValue = parseFloat(newValue);
                                    }
                                    // TODO: there is a bug in the above logic, where we do not always turn number values
                                    // to numbers. Specifically, if a user enters a number ending in a "." as they are typing
                                    // a decimal, then we keep this as a string. This allows them to keep entering a decimal,
                                    // which is most likely what they want. However, if they apply the fill nan with this 
                                    // decimal point at the end, it might fill with a string, which is not what they want
                                    
                                    setParams(prevParams => {
                                        return {
                                            ...prevParams,
                                            fill_method: {
                                                type: 'value',
                                                value: finalValue
                                            }
                                        }
                                    })
                                }}
                            />
                        </Col>
                    </Row>
                }
                <Spacer px={10 + (params.fill_method.type === 'value' ? 0 : 38)}/>
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
                    disabled={false}
                >
                    {!loading 
                        ? `Fill NaN values in ${params.column_ids.length} columns`
                        : 'Filling NaN values...' 
                    }
                </TextButton>
                {editApplied && !loading &&
                     <Row className='mt-5'>
                         <p className='text-subtext-1'>
                             {getSuccessMessage(sheetData, params.column_ids)} 
                         </p>
                     </Row>
                }
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
};

export default FillNaTaskpane;