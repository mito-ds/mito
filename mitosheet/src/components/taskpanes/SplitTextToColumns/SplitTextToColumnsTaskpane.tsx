import React from "react";
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



interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[]
}

const delimiterNameToCharacter: Record<string, string> = {
    'Comma': "','",
    'Dash' : "'-'",
    'Slash': "'/'", 
    'Tab': "'\t'",
    'Space': "' '"
}

const delimterCharacterToName: Record<string, string> = {
    "','": 'Comma',
    "'-'": 'Dash',
    "'/'": 'Slash',
    "'\t'": 'Tab',
    "' '": 'Space'
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
            delimiters: []
        },
        StepType.SplitTextToColumns, 
        props.mitoAPI,
        props.analysisData,
    )
    
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
                            values={Object.keys(delimiterNameToCharacter)} 
                            selectedValues={params.delimiters.map(delimiter => delimterCharacterToName[delimiter])}
                            onChange={(toggledDelimiter) => {
                                setParams(prevParams => {
                                    const selectedDelimiters = [...prevParams.delimiters]
                                    if (selectedDelimiters.includes(delimiterNameToCharacter[toggledDelimiter])) {
                                        // If the delimiter is already in the list, remove it
                                        selectedDelimiters.splice(selectedDelimiters.indexOf(delimiterNameToCharacter[toggledDelimiter]), 1)
                                    } else {
                                        // If the delimiter is not in the list, add it
                                        selectedDelimiters.push(delimiterNameToCharacter[toggledDelimiter])
                                    }
                                    return {
                                        ...prevParams,
                                        delimiters: selectedDelimiters
                                    }
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