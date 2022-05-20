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
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import MultiSelectButtons from "../../elements/MultiSelectButtons";
import useSendEditOnClick from "../../../hooks/useSendEditOnClick";
import TextButton from "../../elements/TextButton";
import Input from "../../elements/Input";
import { useDebouncedEffect } from "../../../hooks/useDebouncedEffect";
import '../../../../css/taskpanes/SplitTextToColumns/SplitTextToColumns.css'
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";

interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[];
    startingColumnID?: ColumnID
}

type DelimiterObj = {
    included: boolean,
    delimiter: string
}

const defaultDelimitersObj: Record<string, DelimiterObj> = {
    'Comma': {
        included: false,
        delimiter: ','
    },
    'Dash': {
        included: false,
        delimiter: '-'
    },
    'Tab': {
        included: false,
        delimiter: '\t'
    },
    'Space': {
        included: false,
        delimiter: ' '
    },
    'Other': {
        included: false,
        delimiter: ''
    }
}

/* 
    This taskpane allows users to split a column into multiple columns 
    by separating on a delimeter
*/
const SplitTextToColumnsTaskpane = (props: SplitTextToColumnsTaskpaneProps): JSX.Element => {

    // Use the selected column, unless its the index column, then just use the first column
    const startingColumnIndex = props.gridState.selections[0].startingColumnIndex >= 0 ? props.gridState.selections[0].startingColumnIndex : 0

    // Make sure that there is data in the sheet before trying to access the column_id, so we don't crash the sheet
    const isSheetEmpty = props.sheetDataArray[props.gridState.sheetIndex] === undefined || props.sheetDataArray[props.gridState.sheetIndex].data[startingColumnIndex] === undefined
 
    // Get the starting column id
    let startingColumnID = undefined
    if (props.startingColumnID !== undefined) {
        startingColumnID = props.startingColumnID
    } else if (!isSheetEmpty) {
        startingColumnID = props.sheetDataArray[props.gridState.sheetIndex].data[startingColumnIndex].columnID
    } 

    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<SplitTextToColumnsParams, undefined>(
        {
            sheet_index: props.gridState.sheetIndex,
            column_id: startingColumnID,
            delimiters: [] // List of the delimiter characters
        },
        StepType.SplitTextToColumns, 
        props.mitoAPI,
        props.analysisData,
    )

    const [preview, setPreview] = useState<(string | number | boolean)[][] | undefined>([])
    const [loadingPreview, setLoadingPreview] = useState<boolean>(false)

    console.log(loadingPreview)

    async function loadSplitTextToColumnsPreview() {

        if (params !== undefined && params.column_id !== undefined) {
            setLoadingPreview(true);

            const _splitTextToColumnsPreviewArray = await props.mitoAPI.getSplitTextToColumnsPreview(params.sheet_index, params.column_id, params.delimiters)
            if (_splitTextToColumnsPreviewArray !== undefined) {
                setPreview(_splitTextToColumnsPreviewArray)
            } else {
                setPreview(undefined)
            }

            setLoadingPreview(false);
        } else {
            setPreview(undefined)
        }
    }

    // Keep track of the delimiters in this object so we don't need to messily convert back and forth between 
    // delimiter name and character. 
    const [delimiterObjs, setDelimiterObjs] = useState<Record<string, DelimiterObj>>(defaultDelimitersObj)

    // When the delimitersObj changes, update the delimiter param
    useDebouncedEffect(() => {
        setParams(prevParams => {
            return {
                ...prevParams,
                delimiters: getIncludedDelimiters()
            }
        })
    }, [delimiterObjs], 500)

    useEffect(() => {
        if (params !== undefined && params.delimiters.length > 0) {
            // If there is at least one delimiter, load the preview
            void loadSplitTextToColumnsPreview()
        } else {
            setPreview(undefined)
        }
    }, [params])

    // Returns a list of delimiter characters from the delimiter object
    const getIncludedDelimiters = (): string[] => {
        return Object.values(delimiterObjs).filter(delimiterObj => delimiterObj.included).map((delimiterObj) => delimiterObj.delimiter)
    }
    
    if (params === undefined || params.column_id === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState}/>)
    }

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Split Text to Column"
                setUIState={props.setUIState}            
            />
            <DefaultTaskpaneBody>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p className='text-header-3'>
                            Sheet
                        </p>
                    </Col>
                    <Col>
                        <Select
                            width='medium'
                            value={props.dfNames[params.sheet_index]}
                            // Safe to cast as dfNames are strings
                            onChange={(newSheet: string) => {
                                setParams(prevParams => {
                                    const newSheetIndex = props.dfNames.indexOf(newSheet)
                                    return {
                                        ...prevParams,
                                        sheet_index: newSheetIndex
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
                            width='medium'
                            value={getDisplayColumnHeader(params.column_id)}
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
                <Row>
                    <Col span={6}>
                        <p className='text-header-3'>
                            Delimiters
                        </p>
                    </Col>
                    <Col className="split-text-to-column-delimiters-container">
                        <MultiSelectButtons
                            values={Object.keys(delimiterObjs).filter(delimiterName => delimiterName !== 'Other')} 
                            selectedValues={Object.keys(delimiterObjs).filter(delimiterName => delimiterObjs[delimiterName].included)}
                            onChange={(toggledDelimiter) => {
                                setDelimiterObjs(prevDelimiterObjs => {
                                    const newDelimiterObjs = {...prevDelimiterObjs}
                                    newDelimiterObjs[toggledDelimiter].included = !newDelimiterObjs[toggledDelimiter].included
                                    return newDelimiterObjs
                                })
                            }}
                        />
                        <Input 
                            value={delimiterObjs['Other'].delimiter}
                            width='small'
                            placeholder="Custom"
                            className='mt-5px'
                            onChange={(e) => {
                                const newOtherDelimiter = e.target.value
                                setDelimiterObjs(prevDelimiterObjs => {
                                    const newDelimiters = {...prevDelimiterObjs}
                                    newDelimiters['Other'].included = newOtherDelimiter !== ''
                                    newDelimiters['Other'].delimiter = newOtherDelimiter
                                    return newDelimiters
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
                                            <tr key={idx}>
                                                {rowData.map((cellData, idx) => {
                                                    return (
                                                        <td key={idx}>{'' + cellData}</td>
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
                    onClick={edit}
                >
                    {!editApplied 
                        ? 'Split on delimiter'
                        : (loading 
                            ? 'Splitting column ...' 
                            : `Spit on delimiter`
                        )
                    }
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default SplitTextToColumnsTaskpane;