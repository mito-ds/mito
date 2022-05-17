// Copyright (c) Mito
// Distributed under the terms of the Modified BSD License.

import React from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import MitoAPI from '../../../jupyter/api';

// Import 
import { AnalysisData, FillMethod, FillNaParams, SheetData, StepType, UIState } from '../../../types';

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
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { getDtypeValue } from '../ControlPanel/FilterAndSortTab/DtypeCard';
import { addIfAbsent, removeIfPresent } from '../../../utils/arrays';
import Spacer from '../../spacing/Spacer';
import Input from '../../elements/Input';
import { isNumberDtype } from '../../../utils/dtypes';
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import TextButton from '../../elements/TextButton';


interface FillNaTaskpaneProps {
    uiState: UIState
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    analysisData: AnalysisData
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
        return (<DefaultEmptyTaskpane setUIState={props.setUIState} message="Import a dataset datasets before filling NaN values."/>)
    }

    const columnIDsMap = props.sheetDataArray[params.sheet_index]?.columnIDsMap || {};
    const columnDtypeMap = props.sheetDataArray[params.sheet_index]?.columnDtypeMap || {};
    const nonNumberColumnSelected = params.column_ids.length > 0 && params.column_ids
        .map(columnID => columnDtypeMap[columnID])
        .map(columnDtype => isNumberDtype(columnDtype))
        .reduce((prevValue, currValue) => !prevValue || !currValue, true) 

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
                            width='small'
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
                <Row justify='space-between' align='center' title='Select the dataframe to fill nan values in.'>
                    <Col>
                        <p className='text-header-3'>
                            Columns to Fill NaN Values In
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
                                subtext="Replaces NaN values with the value in the row above."
                            />
                            <DropdownItem
                                id='bfill'
                                title="Back Fill"
                                subtext="Replaces NaN values with the value in the row below."
                            />
                            <DropdownItem
                                id='mean'
                                title="Column Mean"
                                subtext={
                                    nonNumberColumnSelected 
                                        ? "Select only number columns to fill them with the average of those columns."
                                        : "Replaces NaN values in number columns with the average of the column."
                                }
                                disabled={nonNumberColumnSelected}
                            />
                            <DropdownItem
                                id='median'
                                title="Column Median"
                                subtext={
                                    nonNumberColumnSelected 
                                        ? "Select only number columns to fill them with the median of those columns."
                                        : "Replaces NaN values in number columns with the median of the column."
                                }
                                disabled={nonNumberColumnSelected}
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
                                value={'' + params.fill_method.value}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    let finalValue: string | boolean | number = newValue;

                                    if (BOOLEAN_STRINGS.includes(newValue)) {
                                        finalValue = newValue.toLowerCase().startsWith('t') ? true : false;
                                    } else if (newValue !== '' && !isNaN(parseFloat(newValue))) {
                                        finalValue = parseFloat(newValue);
                                    }

                                    console.log(newValue, finalValue, typeof finalValue)

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
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={edit}
                    disabled={false}
                >
                    {!editApplied 
                        ? `Fill NaN values in ${params.column_ids.length} columns` 
                        : (loading 
                            ? 'Filling NaN values...' 
                            : `Filled NaN values`
                        )
                    }
                </TextButton>
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
};

export default FillNaTaskpane;