import React from "react";
import MitoAPI from "../../../jupyter/api";
import useSyncedParams from "../../../hooks/useSyncedParams";
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



interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    dfNames: string[]
}

/* 
    This taskpane allows users to split a column into multiple columns 
    by separating on a delimeter
*/
const SplitTextToColumnsTaskpane = (props: SplitTextToColumnsTaskpaneProps): JSX.Element => {

    // Use the selected column, unless its the index column, then just use the first column
    const startingColumnIndex = props.gridState.selections[0].startingColumnIndex >= 0 ? props.gridState.selections[0].startingColumnIndex : 0
 
    const {params, setParams} = useSyncedParams<SplitTextToColumnsParams>(
        {
            sheet_index: props.gridState.sheetIndex,
            column_id: props.sheetDataArray[props.gridState.sheetIndex].data[startingColumnIndex].columnID,
            delimiters: [',']
        },
        StepType.SplitTextToColumns, 
        props.mitoAPI,
        props.analysisData,
        50 // 50 ms debounce delay
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
                            values={['Comma', 'Dash', 'Slash', 'Tab', 'Space']} 
                            selectedValues={params.delimiters}
                            onChange={(toggledDelimiter) => {
                                setParams(prevParams => {
                                    const selectedDelimiters = [...prevParams.delimiters]
                                    if (selectedDelimiters.includes(toggledDelimiter)) {
                                        // If the delimiter is already in the list, remove it
                                        selectedDelimiters.splice(selectedDelimiters.indexOf(toggledDelimiter), 1)
                                    } else {
                                        // If the delimiter is not in the list, add it
                                        selectedDelimiters.push(toggledDelimiter)
                                    }
                                    console.log('selected delimiters: ', selectedDelimiters)
                                    return {
                                        ...prevParams,
                                        delimeters: selectedDelimiters
                                    }
                                })
                            }}
                        />
                    </Col>
                </Row>
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
}

export default SplitTextToColumnsTaskpane;