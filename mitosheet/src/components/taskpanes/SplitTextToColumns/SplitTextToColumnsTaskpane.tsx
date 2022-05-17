import React from "react";
import MitoAPI from "../../../jupyter/api";
import useSyncedParams from "../../../hooks/useSyncedParams";
import { AnalysisData, GridState, SheetData, SplitTextToColumnsParams, StepType, UIState } from "../../../types"
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";



interface SplitTextToColumnsTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    gridState: GridState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
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
            delimeters: ['']

        },
        StepType.SplitTextToColumn, 
        props.mitoAPI,
        props.analysisData,
        50 // 50 ms debounce delay
    )
    
    if (params === undefined) {
        return (<DefaultEmptyTaskpane setUIState={props.setUIState}/>)
    }

    console.log(setParams)

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Split Text to Column"
                setUIState={props.setUIState}            
            />
            <DefaultTaskpaneBody>
                
            </DefaultTaskpaneBody>

        </DefaultTaskpane>
    )
}

export default SplitTextToColumnsTaskpane;