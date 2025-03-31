/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, ColumnID, SheetData, StepType, UIState } from "../../../types"
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import Select from "../../elements/Select";
import DropdownItem from "../../elements/DropdownItem";
import { getDisplayColumnHeader, getNewColumnHeader } from "../../../utils/columnHeaders";
import useSendEditOnClick from "../../../hooks/useSendEditOnClick";
import TextButton from "../../elements/TextButton";
import Input from "../../elements/Input";
import '../../../../../css/taskpanes/SplitTextToColumns/SplitTextToColumns.css'
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import MultiSelectButtonItem from "../../elements/MulitSelectButtonItem";
import { toggleInArray } from "../../../utils/arrays";
import Spacer from "../../layout/Spacer";
import DataframeSelect from "../../elements/DataframeSelect";

interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[];
    startingColumnID: ColumnID | undefined
}

export interface SplitTextToColumnsParams {
    sheet_index: number,
    column_id: ColumnID | undefined,
    delimiters: string[],
    // Note: We create the new_column_header_suffix on the frontend so that it is saved in the step parameters, 
    // which allows us to replay the analysis and generate the same columns. 
    new_column_header_suffix: string 
}

interface SplitTextToColumnsResult {
    num_cols_created: number;
}

const delimiters = {',': 'Comma', '-': 'Dash', '\t': 'Tab', ' ': 'Space'}

const getDefaultParams  = (startingColumnID: ColumnID | undefined, sheetDataArray: SheetData[], sheetIndex: number): SplitTextToColumnsParams | undefined => {
    if (sheetDataArray.length === 0 || sheetDataArray[sheetIndex] === undefined) {
        return undefined;
    }

    let columnID = undefined
    if (startingColumnID !== undefined && Object.keys(sheetDataArray[sheetIndex].columnIDsMap).includes(startingColumnID)) {
        // If the startingColumnID exists in the sheet, then use it. 
        columnID = startingColumnID
    } else {
        // Otherwise use the first column if there is a column. Otherwise, undefined
        columnID = Object.keys(sheetDataArray[sheetIndex]?.columnIDsMap || {})[0]
    }

    return {
        sheet_index: sheetIndex,
        column_id: columnID,
        delimiters: [], 
        new_column_header_suffix: getNewColumnHeader()
    }
}

/* 
    This taskpane allows users to split a column into multiple columns 
    by separating on a delimeter
*/
const SplitTextToColumnsTaskpane = (props: SplitTextToColumnsTaskpaneProps): JSX.Element => {

    const {params, setParams, loading, edit, editApplied, result} = useSendEditOnClick<SplitTextToColumnsParams, SplitTextToColumnsResult>(
        () => getDefaultParams(props.startingColumnID, props.sheetDataArray, props.selectedSheetIndex),
        StepType.SplitTextToColumns, 
        props.mitoAPI,
        props.analysisData,
    )

    const [preview, setPreview] = useState<(string | number | boolean)[][]>([])
    
    // When the startingColumnID is updated outside of the taskpane, set it as the column getting split
    useEffect(() => {
        setParams(prevParams => {
            const newParams = getDefaultParams(props.startingColumnID, props.sheetDataArray, props.selectedSheetIndex);
            if (newParams) {
                return newParams;
            }
            return prevParams;
        });
    }, [props.startingColumnID])

    useEffect(() => {
        void loadSplitTextToColumnsPreview()
    }, [params])
    

    async function loadSplitTextToColumnsPreview() {

        if (params !== undefined && params.column_id !== undefined && params.delimiters.length > 0) {
            const response = await props.mitoAPI.getSplitTextToColumnsPreview(params);
            const _splitTextToColumnsPreviewArray = 'error' in response ? undefined : response.result;
            if (_splitTextToColumnsPreviewArray !== undefined) {
                setPreview(_splitTextToColumnsPreviewArray.dfPreviewRowDataArray)
            } else {
                setPreview([])
            }
        } else {
            setPreview([])
        }
    }

    if (params === undefined || params.column_id === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState}/>)
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header="Split Text to Columns"
                setUIState={props.setUIState}            
            />
            <DefaultTaskpaneBody>
                <DataframeSelect
                    title='Dataframe to select a column to split text within'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={params.sheet_index}
                    onChange={(newSheetIndex) => {
                        setParams(prevParams => {
                            const newParams = getDefaultParams(undefined, props.sheetDataArray, newSheetIndex);
                            if (newParams) {
                                return newParams;
                            }
                            return {
                                ...prevParams,
                                sheet_index: newSheetIndex
                            }
                        })
                    }}
                />
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Column
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium'
                            // When undoing right after adding a column, the params.column_id has not yet updated yet, but the sheetData has updated,
                            // so we add a placeholder that is displayed for the fraction of a second before the column_id updates. This avoids a 
                            // sheet crashing bug!
                            value={getDisplayColumnHeader(props.sheetDataArray[params.sheet_index]?.columnIDsMap[params.column_id] || 'select a column')}
                            searchable
                        >
                            {Object.entries(props.sheetDataArray[params.sheet_index]?.columnIDsMap || {}).map(([columnID, columnHeader]) => {
                                return (
                                    <DropdownItem
                                        key={columnID}
                                        title={getDisplayColumnHeader(columnHeader)}
                                        onClick={() => {
                                            setParams(prevParams => {
                                                return {
                                                    ...prevParams,
                                                    column_id: columnID
                                                }
                                            })
                                        }}
                                    />
                                )
                            })}
                        </Select>
                    </Col>
                </Row>
                <Row justify="space-between">
                    <Col span={6}>
                        <p className='text-header-3'>
                            Delimiters
                        </p>
                    </Col>
                    <Col className="expandable-content-card element-width-medium">
                        {Object.entries(delimiters).map(([delimiter, delimiterTitle]) => {
                            return (
                                <MultiSelectButtonItem
                                    key={delimiterTitle}
                                    id={delimiter}
                                    title={delimiterTitle}
                                    checked={params.delimiters.includes(delimiter)}
                                    onToggle={(delimiter: string) => {
                                        setParams(prevParams => {
                                            const newDelimiters = [...prevParams.delimiters]
                                            toggleInArray(newDelimiters, delimiter)
                                            return {
                                                ...prevParams,
                                                delimiters: newDelimiters
                                            }
                                        })
                                    }}
                                />
                            )
                        })}
                        <Input 
                            value={params.delimiters.filter(params_delimiter => !Object.keys(delimiters).includes(params_delimiter))[0]}
                            placeholder="Custom Delimiter" 
                            className='mt-5px'
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setParams(prevParams => {
                                    const newDelimiters = [...prevParams.delimiters].filter(delimiter => Object.keys(delimiters).includes(delimiter));
                                    if (newValue !== '') {
                                        newDelimiters.push(newValue);
                                    }
                                    return {
                                        ...prevParams,
                                        delimiters: newDelimiters
                                    }
                                })
                            }}
                        />
                    </Col>
                </Row>
                <div>
                    <Row>
                        <p className='text-header-3'>
                            Columns Preview
                        </p>
                    </Row>
                    {preview.length > 0 &&
                        <Row style={{width: '100%', overflowX: 'auto'}} suppressTopBottomMargin>
                            <table className="preview-table" cellSpacing="0">
                                <tbody>
                                    {preview.map((rowData, idx) => {
                                        return (
                                            <tr className='preview-table-table-row' key={idx}>
                                                {rowData.map((cellData, idx) => {
                                                    return (
                                                        <td className='preview-table-table-data' key={idx}>{'' + cellData}</td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </Row>
                    }
                    {preview.length === 0 && 
                        <Row style={{width: '100%'}} justify='center'>
                            <p className='mt-10px'>
                                Select a delimiter to preview the split
                            </p>
                        </Row>
                    }
                </div>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => edit(prevParams => {
                        return {
                            ...prevParams, 
                            // Prepare for the user splitting again by creating a new column suffix,
                            // so that the column headers don't overlap
                            new_column_header_suffix: getNewColumnHeader()
                        }
                    })}
                    disabled={params.delimiters.length === 0}
                    disabledTooltip="Select at least one delimiter"
                >
                    {!editApplied 
                        ? `Split on delimiter${params.delimiters.length > 1 ? 's' : ''}`
                        : (loading 
                            ? 'Splitting column ...' 
                            : `Split on delimiter${params.delimiters.length > 1 ? 's' : ''}`
                        )
                    }
                </TextButton>
                {editApplied && 
                    <p className='text-subtext-1'>
                        Created {result?.num_cols_created} new columns
                    </p>
                } 
                {!editApplied && 
                    <Spacer px={18}/>
                } 
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default SplitTextToColumnsTaskpane;