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
import Input from "../../elements/Input";

interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[]
}

const delimiterNameToCharacter: Record<string, string> = {
    'Comma': ',',
    'Dash' : '-',
    'Slash': '/', 
    'Tab': '\t',
    'Space': ' '
}

const delimterCharacterToName: Record<string, string> = {
    ',': 'Comma',
    '-': 'Dash',
    '/': 'Slash',
    '\t': 'Tab',
    ' ': 'Space'
}

/*
    TODO: Refactor the delimiters to be a dictionary of all the delimiters with an other record too. 
    And then just turn them on and off easily without having to look for whether they are included in the 
    dictionary, which is complicated.
    
    The only tricky thing here is that we would prefer to not send it to the backend as a dictionary. Instead, 
    we just want a list of the delimiters that are included, so instead of setting the params directly, we need to set something else, 
    then watch for the that to change, and turn the dict into a list of only the included ones for the params delimiters. 
*/

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

    const getOtherDelimiter = (): string => {
        return params?.delimiters.filter(x => !Object.keys(delimiterNameToCharacter).includes(x))[0] || '';
    }
    
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
                        <Input 
                            value={getOtherDelimiter()}
                            width='small'
                            placeholder="Custom Delimiter"
                            onChange={(e) => {
                                const newDelimiter = e.target.value
                                setParams(prevParams => {
                                    const selectedDelimiters = [...prevParams.delimiters]
                                    // Remove the 'other' delimiter if it exists
                                    const otherDelimiter = getOtherDelimiter()
                                    if (otherDelimiter !== '') {
                                        selectedDelimiters.splice(selectedDelimiters.indexOf(otherDelimiter), 1)
                                    }
                                    // Add the new 'other' delimiter 
                                    if (newDelimiter !== '') {
                                        selectedDelimiters.push(newDelimiter)
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