import React from "react";
import { ColumnHeader, SheetData } from "../../../types";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import { AITransformationParams, AITransformationResult } from "./AITransformationTaskpane";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import { isStringDtype } from "../../../utils/dtypes";

interface AITransformationExamplesSectionProps {
    previousParamsAndResults: {params: AITransformationParams, results: AITransformationResult}[]
    sheetDataArray: SheetData[]
    selectedSheetIndex: number,
    setChatInput: React.Dispatch<React.SetStateAction<string>>
}



const getExample = (userInput: string, setChatInput: React.Dispatch<React.SetStateAction<string>>): JSX.Element => {
    return (
        <Row 
            onClick={() => {
                setChatInput(userInput);
            }} 
            justify="center" align="center" className="ai-transformation-example"
        >
            <p>{userInput}</p>
        </Row>
    )
}

const AITransformationExamplesSection = (props: AITransformationExamplesSectionProps): JSX.Element => {

    // Some basic heuristics to find interesting transformations users might want (we could use AI for this!)

    const firstColumnInSheet: ColumnHeader | undefined = props.sheetDataArray.length === 0 ? undefined : props.sheetDataArray[props.selectedSheetIndex].data[0]?.columnHeader;

    const dateColumnThatIsString: ColumnHeader | undefined = props.sheetDataArray.length === 0 ? undefined : props.sheetDataArray[props.selectedSheetIndex].data.find((column) => {
        return isStringDtype(column.columnDtype) && getDisplayColumnHeader(column.columnHeader).toLowerCase().includes('date');
    })?.columnHeader;

    return (
        <>
            <div className='mito-blue-container'>
                <div className='text-header-3'>
                    Examples
                </div>
                {props.sheetDataArray.length === 0 &&
                    getExample('create a dataframe named df with sample data', props.setChatInput)
                }
                {getExample('delete all columns with nan values', props.setChatInput)}
                {getExample('fully capitalize column headers', props.setChatInput)}
                {firstColumnInSheet && getExample(`sort column ${getDisplayColumnHeader(firstColumnInSheet)} by values`, props.setChatInput)}
                {dateColumnThatIsString && getExample(`convert column ${getDisplayColumnHeader(dateColumnThatIsString)} to datetime`, props.setChatInput)}
            </div>
            <Spacer px={10}/>
        </>
    )
}

export default AITransformationExamplesSection;