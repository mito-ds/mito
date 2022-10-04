import React, { useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"
import TextButton from "../../elements/TextButton";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { CSVImportParams } from "../../import/CSVImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportScreen";
import ImportCard from "./UpdateImportCard";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import { getBaseOfPath, getOriginalAndUpdatedDataframeCreationDataPairs, isCSVImportParams, isExcelImportParams } from "./UpdateImportsUtils";
import { ImportScreen } from "../FileImport/FileImportTaskpane";
import UpdateDataframeImportTaskpane from "./UpdateDataframeImportTaskpane";
import UpdateXLSXImportsTaskpane from "./UpdateXLSXImportTaskpane";
import UpdateCSVImportTaskpane from "./UpdateCSVImportTaskpane";
import UpdateFileBrowserTaskpane from "./UpdateFileBrowserTaskpane";


interface updateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
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
    screen: ImportScreen | 'dataframe_import',
    params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined
}

    

/* 
    This is the updateImports taskpane.
*/
const UpdateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    const [updatedStepImportData, setUpdatedStepImportData] = useState<StepImportData[] | undefined>(undefined);
    const [displayedImportCardDropdown, setDisplayedImportCardDropdown] = useState<number | undefined>(undefined);
    const [replacingDataframeState, setReplacingDataframeState] = useState<ReplacingDataframeState | undefined>(undefined);

    const [originalStepImportData] = useStateFromAPIAsync(
        undefined,
        () => {return props.mitoAPI.getImportedFilesAndDataframes()},
        (loadedData) => {
            // On load, update the updated import data
            setUpdatedStepImportData(loadedData || [])
        }
    )

    // We create an import card for each of the dataframes created within the original imports
    const updateImportCards = getOriginalAndUpdatedDataframeCreationDataPairs(originalStepImportData, updatedStepImportData).map(([originalDfCreationData, updatedDfCreationData], index) => {
        return (
            <ImportCard 
                key={index}
                dataframeCreationIndex={index}
                dataframeCreationData={originalDfCreationData}
                updatedDataframeCreationData={updatedDfCreationData}
                displayedImportCardDropdown={displayedImportCardDropdown}
                setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}
                setReplacingDataframeState={setReplacingDataframeState}
            />
        )
    })


    if (replacingDataframeState === undefined) {
        return (
            <DefaultTaskpane>
                <DefaultTaskpaneHeader 
                    header="Update Imports"
                    setUIState={props.setUIState}           
                />
                <DefaultTaskpaneBody>
                    {updateImportCards}
                </DefaultTaskpaneBody>
                <DefaultTaskpaneFooter>
                    <TextButton 
                        variant="dark"
                        onClick={() => {
                            if (updatedStepImportData !== undefined) {
                                props.mitoAPI.updateExistingImports(updatedStepImportData)
                            }
                        }}
                        disabled={undefined } // TODO, disable this if there is an error
                    >
                        <p>
                            Update Imports
                        </p>
                    </TextButton>
                </DefaultTaskpaneFooter>
            </DefaultTaskpane>
        )
    } else if (replacingDataframeState.screen === 'file_browser') {
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
            />
        )
    } else if (replacingDataframeState.screen === 'csv_import' && isCSVImportParams(replacingDataframeState.params)) {
        return (
            <UpdateCSVImportTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={getBaseOfPath(replacingDataframeState.params.file_names[0])}
                filePath={replacingDataframeState.params.file_names[0]}
                        
                replacingDataframeState={replacingDataframeState}
                setReplacingDataframeState={setReplacingDataframeState}

                setUpdatedStepImportData={setUpdatedStepImportData}
            />
        )
    } else if (replacingDataframeState.screen === 'xlsx_import' && isExcelImportParams(replacingDataframeState.params)) {
        return (
            <UpdateXLSXImportsTaskpane
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}

                fileName={getBaseOfPath(replacingDataframeState.params.file_name)}
                filePath={replacingDataframeState.params.file_name}
                        
                replacingDataframeState={replacingDataframeState}
                setReplacingDataframeState={setReplacingDataframeState}

                setUpdatedStepImportData={setUpdatedStepImportData}
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
            />
        )
    }
}

export default UpdateImportsTaskpane;

