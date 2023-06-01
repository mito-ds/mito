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
    setUserInput: React.Dispatch<React.SetStateAction<string>>
    chatInputRef: React.MutableRefObject<HTMLTextAreaElement | null>
}



const getExample = (userInput: string, setUserInput: React.Dispatch<React.SetStateAction<string>>, chatInputRef: React.MutableRefObject<HTMLTextAreaElement | null>): JSX.Element => {
    return (
        <Row 
            onClick={() => {
                setUserInput(userInput);
                chatInputRef.current?.focus();
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
                    getExample('create a dataframe named df with sample data', props.setUserInput, props.chatInputRef)
                }
                {getExample('delete all columns with nan values', props.setUserInput, props.chatInputRef)}
                {getExample('fully capitalize column headers', props.setUserInput, props.chatInputRef)}
                {firstColumnInSheet && getExample(`sort column ${getDisplayColumnHeader(firstColumnInSheet)} by values`, props.setUserInput, props.chatInputRef)}
                {dateColumnThatIsString && getExample(`convert column ${getDisplayColumnHeader(dateColumnThatIsString)} to datetime`, props.setUserInput, props.chatInputRef)}
            </div>
            <Spacer px={10}/>
        </>
    )
}

export default AITransformationExamplesSection;