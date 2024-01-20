import React from "react";
import { AITransformationResult, ColumnHeader, SheetData } from "../../../types";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import { isDatetimeDtype, isNumberDtype, isStringDtype } from "../../../utils/dtypes";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import { AITransformationParams } from "./AITransformationTaskpane";

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


const getFirstColumnInSheet = (sheetDataArray: SheetData[], selectedSheetIndex: number): ColumnHeader | undefined => {
    return sheetDataArray.length === 0 ? undefined : sheetDataArray[selectedSheetIndex].data[0]?.columnHeader;
}

const getDateColumnThatIsString = (sheetDataArray: SheetData[], selectedSheetIndex: number): ColumnHeader | undefined => {
    return sheetDataArray.length === 0 ? undefined : sheetDataArray[selectedSheetIndex].data.find((column) => {
        return isStringDtype(column.columnDtype) && getDisplayColumnHeader(column.columnHeader).toLowerCase().includes('date');
    })?.columnHeader;
}

const getNumberColumnThatIsString = (sheetDataArray: SheetData[], selectedSheetIndex: number): ColumnHeader | undefined => {
    return sheetDataArray.length === 0 ? undefined : sheetDataArray[selectedSheetIndex].data.find((column) => {
        return isStringDtype(column.columnDtype) && getDisplayColumnHeader(column.columnHeader).toLowerCase().includes('number');
    })?.columnHeader;
}

const getFirstColumnThatIsString = (sheetDataArray: SheetData[], selectedSheetIndex: number): ColumnHeader | undefined => {
    return sheetDataArray.length === 0 ? undefined : sheetDataArray[selectedSheetIndex].data.find((column) => {
        return isStringDtype(column.columnDtype);
    })?.columnHeader;
}

const getFirstColumnThatIsNumber = (sheetDataArray: SheetData[], selectedSheetIndex: number): ColumnHeader | undefined => {
    return sheetDataArray.length === 0 ? undefined : sheetDataArray[selectedSheetIndex].data.find((column) => {
        return isNumberDtype(column.columnDtype);
    })?.columnHeader;
}

const getFirstColumnThatIsDate = (sheetDataArray: SheetData[], selectedSheetIndex: number): ColumnHeader | undefined => {
    return sheetDataArray.length === 0 ? undefined : sheetDataArray[selectedSheetIndex].data.find((column) => {
        return isDatetimeDtype(column.columnDtype)
    })?.columnHeader;
}


const AITransformationExamplesSection = (props: AITransformationExamplesSectionProps): JSX.Element => {

    // Some basic heuristics to find interesting transformations users might want (we could use AI for this!)

    const firstColumnInSheet = getFirstColumnInSheet(props.sheetDataArray, props.selectedSheetIndex);
    const firstDateColumnThatIsString = getDateColumnThatIsString(props.sheetDataArray, props.selectedSheetIndex);
    const firstNumberColumnThatIsString = getNumberColumnThatIsString(props.sheetDataArray, props.selectedSheetIndex);
    const firstColumnThatIsString = getFirstColumnThatIsString(props.sheetDataArray, props.selectedSheetIndex);
    const firstColumnThatIsNumber = getFirstColumnThatIsNumber(props.sheetDataArray, props.selectedSheetIndex);
    const firstColumnThatIsDate = getFirstColumnThatIsDate(props.sheetDataArray, props.selectedSheetIndex);
    

    const numDefinedExamples = [firstColumnInSheet, firstDateColumnThatIsString, firstNumberColumnThatIsString, firstColumnThatIsString, firstColumnThatIsNumber, firstColumnThatIsDate].filter((column) => column !== undefined).length;

    return (
        <>
            <div className='mito-blue-container'>
                <div className='text-header-3'>
                    Examples
                </div>
                {props.sheetDataArray.length === 0 
                    ? 
                    <>
                        {getExample('create a dataframe named df with sample data', props.setUserInput, props.chatInputRef)}
                        {getExample('import the most recent csv from the current folder', props.setUserInput, props.chatInputRef)}
                    </>
                    : 
                    <>
                        {firstColumnInSheet && getExample(`sort the column ${getDisplayColumnHeader(firstColumnInSheet)} in ascending order`, props.setUserInput, props.chatInputRef)}
                        {firstDateColumnThatIsString && getExample(`convert ${getDisplayColumnHeader(firstDateColumnThatIsString)} to a datetime`, props.setUserInput, props.chatInputRef)}
                        {firstNumberColumnThatIsString && getExample(`convert ${getDisplayColumnHeader(firstNumberColumnThatIsString)} to a number`, props.setUserInput, props.chatInputRef)}
                        {firstColumnThatIsString && getExample(`extract the first character from ${getDisplayColumnHeader(firstColumnThatIsString)}`, props.setUserInput, props.chatInputRef)}
                        {firstColumnThatIsNumber && getExample(`add 100 to ${getDisplayColumnHeader(firstColumnThatIsNumber)}`, props.setUserInput, props.chatInputRef)}
                        {firstColumnThatIsDate && getExample(`extract the month from ${getDisplayColumnHeader(firstColumnThatIsDate)}`, props.setUserInput, props.chatInputRef)}
                        {numDefinedExamples < 3 &&
                                <>
                                    {getExample('can you delete columns with any null values', props.setUserInput, props.chatInputRef)}
                                    {getExample('fully capitalize column headers', props.setUserInput, props.chatInputRef)}
                                </>

                        }
                    </>
                }
                <Row justify="center">
                    <p className="text-subtext-1">or send any message to Mito AI below.</p>
                </Row>
            </div>
            <Spacer px={10}/>
        </>
    )
}

export default AITransformationExamplesSection;