import React from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import DataframeImportScreen from "../../import/DataframeImportScreen";


interface DataframeImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}


/* 
    This is the DataframeImport taskpane, allows users to import a specific dataframe
*/
const DataframeImportTaskpane = (props: DataframeImportTaskpaneProps): JSX.Element => {

    const {params, setParams, edit} = useSendEditOnClick<{df_names: string[]}, {df_names: string[]}>(
        () => {return {df_names: []}}, 
        StepType.DataframeImport, 
        props.mitoAPI, 
        props.analysisData, 
        {allowSameParamsToReapplyTwice: true}, 
    )

    return (
        <DataframeImportScreen
            mitoAPI={props.mitoAPI}
            analysisData={props.analysisData}
            setUIState={props.setUIState}
            isUpdate={false}
        
            params={params}
            setParams={setParams}
            edit={edit}
        />
    )
}

export default DataframeImportTaskpane;