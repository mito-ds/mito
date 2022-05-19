import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, GridState, SheetData, SplitTextToColumnsParams, StepType, UIState } from "../../../types"
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

interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[]
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
    'Slash': {
        included: false,
        delimiter: '/'
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
 
    const {params, setParams, loading, edit, editApplied} = useSendEditOnClick<SplitTextToColumnsParams, undefined>(
        {
            sheet_index: props.gridState.sheetIndex,
            column_id: props.sheetDataArray[props.gridState.sheetIndex].data[startingColumnIndex].columnID,
            delimiters: [] // List of the delimiter characters
        },
        StepType.SplitTextToColumns, 
        props.mitoAPI,
        props.analysisData,
    )

    // Keep track of the delimiters in this object so we don't need to messily convert back and forth between 
    // delimiter name and character. 
    const [delimiterObjs, setDelimiterObjs] = useState<Record<string, DelimiterObj>>(defaultDelimitersObj)

    // When the delimitersObj changes, update the delimiter param
    useEffect(() => {
        const includedDelimiters = Object.values(delimiterObjs).filter(delimiterObj => delimiterObj.included).map((delimiterObj) => delimiterObj.delimiter)
        setParams(prevParams => {
            return {
                ...prevParams,
                delimiters: includedDelimiters
            }
        })
    }, [delimiterObjs])
    
    if (params === undefined) {
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
                    <Col>
                        <p className='text-header-3'>
                            Delimiters
                        </p>
                    </Col>
                    <Col>
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
                            placeholder="Custom Delimiter"
                            onChange={(e) => {
                                const newOtherDelimiter = e.target.value
                                setDelimiterObjs(prevDelimiterObjs => {
                                    const newDelimiters = {...prevDelimiterObjs}
                                    newDelimiters['Other'].included = !newDelimiters['Other'].included
                                    newDelimiters['Other'].delimiter = newOtherDelimiter
                                    return newDelimiters
                                })
                            }}
                        />
                    </Col>
                </Row>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={edit}
                    disabled={false}
                >
                    {!editApplied 
                        ? 'Split on delimiter'
                        : (loading 
                            ? 'Splitting column ...' 
                            : `Spit on delimiter`
                        )
                    }
                </TextButton>
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
}

export default SplitTextToColumnsTaskpane;