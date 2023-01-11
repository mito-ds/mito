import React from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types"
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';


import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";


interface ExcelRangeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    file_name: string;
    sheet_name: string;
}

interface ExcelRangeImportParams {
    file_name: string,
    sheet_name: string,
    range_imports: Record<string, {type: 'range', range: string}>,
}
const getDefaultParams = (
    file_name: string,
    sheet_name: string
): ExcelRangeImportParams | undefined => {

    return {
        file_name: file_name,
        sheet_name: sheet_name,
        range_imports: {},
    }
}


/* 
    This is the Excel Range Import taskpane.
*/
const ExcelRangeImportTaskpane = (props: ExcelRangeImportTaskpaneProps): JSX.Element => {

    const {params} = useSendEditOnClick<ExcelRangeImportParams, undefined>(
            () => getDefaultParams(props.file_name, props.sheet_name),
            StepType.ExcelRangeImport, 
            props.mitoAPI,
            props.analysisData,
        )

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }
    

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Excel Range Import"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                
                {/* TODO: add the user input for range_imports of type Any */}

            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default ExcelRangeImportTaskpane;