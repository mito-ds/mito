import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, ColumnID, GridState, SheetData, SplitTextToColumnsParams, StepType, UIState } from "../../../types"
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import Row from "../../spacing/Row";
import Col from "../../spacing/Col";
import Select from "../../elements/Select";
import DropdownItem from "../../elements/DropdownItem";
import { getDisplayColumnHeader, getNewColumnHeader } from "../../../utils/columnHeaders";
import useSendEditOnClick from "../../../hooks/useSendEditOnClick";
import TextButton from "../../elements/TextButton";
import Input from "../../elements/Input";
import '../../../../css/taskpanes/SplitTextToColumns/SplitTextToColumns.css'
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import MultiSelectButtonItem from "../../elements/MulitSelectButtonItem";
import { toggleInArray } from "../../../utils/arrays";
import Spacer from "../../spacing/Spacer";

interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[];
    startingColumnID: ColumnID | undefined
}

interface SplitTextToColumnsResult {
    num_cols_created: number;
}

const delimiters = {',': 'Comma', '-': 'Dash', '\t': 'Tab', ' ': 'Space'}

const getColumnID = (startingColumnID: ColumnID | undefined, sheetDataArray: SheetData[], sheetIndex: number): ColumnID | undefined => {
    // If the startingColumnID exists in the sheet, then use it. 
    if (startingColumnID !== undefined && Object.keys(sheetDataArray[sheetIndex]?.columnIDsMap).includes(startingColumnID)) {
        return startingColumnID
    } 

    // Otherwise use the first column if there is a column. Otherwise, undefined
    return Object.keys(sheetDataArray[sheetIndex]?.columnIDsMap || {})[0]
}

/* 
    This taskpane allows users to split a column into multiple columns 
    by separating on a delimeter
*/
const SplitTextToColumnsTaskpane = (props: SplitTextToColumnsTaskpaneProps): JSX.Element => {

    const {params, setParams, loading, edit, editApplied, result} = useSendEditOnClick<SplitTextToColumnsParams, SplitTextToColumnsResult>(
        {
            sheet_index: props.gridState.sheetIndex,
            column_id: getColumnID(props.startingColumnID, props.sheetDataArray, props.gridState.sheetIndex),
            delimiters: [], 
            new_column_header_suffix: getNewColumnHeader()
        },
        StepType.SplitTextToColumns, 
        props.mitoAPI,
        props.analysisData,
    )

    const [preview, setPreview] = useState<(string | number | boolean)[][] | undefined>([])

    // When the startingColumnID is updated outside of the taskpane, set it as the column getting split
    useEffect(() => {
        setParams(prevParams => {
            return {
                ...prevParams,
                column_id: getColumnID(props.startingColumnID, props.sheetDataArray, props.gridState.sheetIndex),
                sheet_index: props.gridState.sheetIndex
            }
        });
    }, [props.startingColumnID])

    async function loadSplitTextToColumnsPreview() {

        if (params !== undefined && params.column_id !== undefined) {

            const _splitTextToColumnsPreviewArray = await props.mitoAPI.getSplitTextToColumnsPreview(params)
            if (_splitTextToColumnsPreviewArray !== undefined) {
                setPreview(_splitTextToColumnsPreviewArray)
            } else {
                setPreview(undefined)
            }

        } else {
            setPreview(undefined)
        }
    }

    useEffect(() => {
        if (params !== undefined && params.delimiters.length > 0) {
            // If there is at least one delimiter, load the preview
            void loadSplitTextToColumnsPreview()
        } else {
            setPreview(undefined)
        }
    }, [params])
    
    if (params === undefined || params.column_id === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState}/>)
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Split Text to Columns"
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
                            width='medium-large'
                            value={props.dfNames[params.sheet_index]}
                            // Safe to cast as dfNames are strings
                            onChange={(newSheet: string) => {
                                setParams(prevParams => {
                                    const newSheetIndex = props.dfNames.indexOf(newSheet)
                                    return {
                                        ...prevParams,
                                        sheet_index: newSheetIndex,
                                        // Default to the first column in the new sheet
                                        column_id: getColumnID(undefined, props.sheetDataArray, newSheetIndex)
                                    }
                                })
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
                            Column
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium-large'
                            value={getDisplayColumnHeader(props.sheetDataArray[params.sheet_index].columnIDsMap[params.column_id])}
                            searchable
                        >
                            {Object.entries(props.sheetDataArray[params.sheet_index].columnIDsMap).map(([columnID, columnHeader]) => {
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
                    <Col className="split-text-to-column-delimiters-container element-width-medium-large">
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
                            Column Preview
                        </p>
                    </Row>
                    {preview !== undefined &&
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
                    {preview === undefined && 
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
                        ? 'Split on delimiter'
                        : (loading 
                            ? 'Splitting column ...' 
                            : `Spit on delimiter`
                        )
                    }
                </TextButton>
                {editApplied && 
                    <p>
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