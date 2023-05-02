import React from "react";
import { SheetData } from "../../../types";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import { AITransformationParams, AITransformationResult } from "./AITransformationTaskpane";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";

interface AITransformationExamplesSectionProps {
    previousParamsAndResults: {params: AITransformationParams, results: AITransformationResult}[]
    sheetDataArray: SheetData[]
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

    return (
        <>
            <div className='mito-blue-container'>
                <div className='text-header-3'>
                    Examples
                </div>
                {props.sheetDataArray.length === 0 
                    ? (
                        <>
                            {getExample('create a dataframe named df with sample data', props.setChatInput)}
                            {getExample('read in the most recent edited CSV from this folder', props.setChatInput)}
                        </>

                    )
                    : (
                        <>
                            {getExample('delete all columns with nan values', props.setChatInput)}
                            {getExample('capitalize column column headers', props.setChatInput)}
                            {getExample('delete column {TODO}', props.setChatInput)}
                        </>
                    ) 
                }
            </div>
            <Spacer px={10}/>
        </>
    )
}

export default AITransformationExamplesSection;