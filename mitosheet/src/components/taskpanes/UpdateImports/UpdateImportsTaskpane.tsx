import React, { useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types";
import { CSVImportParams } from "../../import/CSVImportScreen";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportScreen";
import { ImportState } from "../FileImport/FileImportTaskpane";
import UpdateCSVImportTaskpane from "./UpdateCSVImportTaskpane";
import UpdateDataframeImportTaskpane from "./UpdateDataframeImportTaskpane";
import UpdateFileBrowserTaskpane from "./UpdateFileBrowserTaskpane";
import UpdateImportsPostReplayTaskpane from "./UpdateImportsPostReplayTaskpane copy";
import UpdateImportsPreReplayTaskpane from "./UpdateImportsPreReplayTaskpane";
import UpdateXLSXImportsTaskpane from "./UpdateXLSXImportTaskpane";


interface UpdateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    sheetDataArray: SheetData[];
    selectedSheetIndex: number;

    failedReplayAnalysisOnImports: {
        analysisName: string,
        importData: StepImportData[],
        invalidImportIndexes: Record<number, string>
    } | undefined
}

export interface CSVImportData {
    step_type: 'simple_import',
    params: CSVImportParams
}
export interface ExcelImportData {
    step_type: 'excel_import',
    params: ExcelImportParams
}
export interface DataframeImportData {
    step_type: 'dataframe_import',
    params: DataframeImportParams
}

export type DataframeCreationData = CSVImportData | ExcelImportData | DataframeImportData;


export interface StepImportData {
    step_id: string,
    imports: DataframeCreationData[];
}

export interface ReplacingDataframeState {
    dataframeCreationIndex: number, 
    importState: ImportState,
    params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined
}

    

/* 
    This is the UpdateImportsTaskpane taskpane: TODO: talk about how it can be either
    pre or post update
*/
const UpdateImportsTaskpane = (props: UpdateImportsTaskpaneProps): JSX.Element => {

    const [updatedStepImportData, setUpdatedStepImportData] = useState<StepImportData[] | undefined>(() => {
        // TODO: explain how the default variable below matches with the onLoad
        const importData = props.failedReplayAnalysisOnImports?.importData;
        return importData === undefined ? undefined : JSON.parse(JSON.stringify(props.failedReplayAnalysisOnImports?.importData));
    });
    const [updatedIndexes, setUpdatedIndexes] = useState<number[]>([]);
    const [displayedImportCardDropdown, setDisplayedImportCardDropdown] = useState<number | undefined>(undefined);
    const [replacingDataframeState, setReplacingDataframeState] = useState<ReplacingDataframeState | undefined>(undefined);
    const [invalidImportMessages, setInvalidImportMessages] = useState<Record<number, string | undefined>>({});

    if (replacingDataframeState === undefined) {
        if (props.failedReplayAnalysisOnImports === undefined) {
            return (
                <UpdateImportsPostReplayTaskpane
                    mitoAPI={props.mitoAPI}
                    setUIState={props.setUIState}

                    updatedStepImportData={updatedStepImportData}
                    setUpdatedStepImportData={setUpdatedStepImportData}

                    updatedIndexes={updatedIndexes}
                    setUpdatedIndexes={setUpdatedIndexes}

                    displayedImportCardDropdown={displayedImportCardDropdown}
                    setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}

                    setReplacingDataframeState={setReplacingDataframeState}

                    invalidImportMessages={invalidImportMessages}
                    setInvalidImportMessages={setInvalidImportMessages}
                    
                />
            )
        } else {
            return (
                <UpdateImportsPreReplayTaskpane
                    mitoAPI={props.mitoAPI}
                    setUIState={props.setUIState}

                    updatedStepImportData={updatedStepImportData}
                    setUpdatedStepImportData={setUpdatedStepImportData}

                    updatedIndexes={updatedIndexes}
                    setUpdatedIndexes={setUpdatedIndexes}

                    displayedImportCardDropdown={displayedImportCardDropdown}
                    setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}

                    setReplacingDataframeState={setReplacingDataframeState}

                    invalidImportMessages={invalidImportMessages}
                    setInvalidImportMessages={setInvalidImportMessages}

                    failedReplayAnalysisOnImports={props.failedReplayAnalysisOnImports}
                />
            )
        }
    } else if (replacingDataframeState.importState.screen === 'file_browser') {
        return (
            <UpdateFileBrowserTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}

                currPathParts={props.currPathParts} 
                setCurrPathParts={props.setCurrPathParts}

                replacingDataframeState={replacingDataframeState}
                setReplacingDataframeState={setReplacingDataframeState}

                setUpdatedStepImportData={setUpdatedStepImportData}  
                setUpdatedIndexes={setUpdatedIndexes}
                setInvalidImportMessages={setInvalidImportMessages}
            />
        )
    } else if (replacingDataframeState.importState.screen === 'csv_import') {
        return (
            <UpdateCSVImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={replacingDataframeState.importState.fileName}
                filePath={replacingDataframeState.importState.filePath}
                        
                replacingDataframeState={replacingDataframeState}
                setReplacingDataframeState={setReplacingDataframeState}

                setUpdatedStepImportData={setUpdatedStepImportData}
                setUpdatedIndexes={setUpdatedIndexes}
                setInvalidImportMessages={setInvalidImportMessages}
            />
        )
    } else if (replacingDataframeState.importState.screen === 'xlsx_import') {
        return (
            <UpdateXLSXImportsTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={replacingDataframeState.importState.fileName}
                filePath={replacingDataframeState.importState.filePath}
                        
                replacingDataframeState={replacingDataframeState}
                setReplacingDataframeState={setReplacingDataframeState}

                setUpdatedStepImportData={setUpdatedStepImportData}
                setUpdatedIndexes={setUpdatedIndexes}
                setInvalidImportMessages={setInvalidImportMessages}
            />
        )
    } else {
        // Dataframe import
        return (
            <UpdateDataframeImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}
                        
                replacingDataframeState={replacingDataframeState}
                setReplacingDataframeState={setReplacingDataframeState}

                setUpdatedStepImportData={setUpdatedStepImportData}
                setUpdatedIndexes={setUpdatedIndexes}
                setInvalidImportMessages={setInvalidImportMessages}
            />
        )
    }
}

export default UpdateImportsTaskpane;

