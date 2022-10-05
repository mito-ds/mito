import React, { useState } from "react";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types";
import TextButton from "../../elements/TextButton";
import { CSVImportParams } from "../../import/CSVImportScreen";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportScreen";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { ImportState } from "../FileImport/FileImportTaskpane";
import UpdateCSVImportTaskpane from "./UpdateCSVImportTaskpane";
import UpdateDataframeImportTaskpane from "./UpdateDataframeImportTaskpane";
import UpdateFileBrowserTaskpane from "./UpdateFileBrowserTaskpane";
import ImportCard from "./UpdateImportCard";
import { getOriginalAndUpdatedDataframeCreationDataPairs, isUpdatedDfCreationData } from "./UpdateImportsUtils";
import UpdateXLSXImportsTaskpane from "./UpdateXLSXImportTaskpane";


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
    importState: ImportState,
    params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined
}

    

/* 
    This is the updateImports taskpane.
*/
const UpdateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    const [updatedStepImportData, setUpdatedStepImportData] = useState<StepImportData[] | undefined>(undefined);
    const [displayedImportCardDropdown, setDisplayedImportCardDropdown] = useState<number | undefined>(undefined);
    const [replacingDataframeState, setReplacingDataframeState] = useState<ReplacingDataframeState | undefined>(undefined);

    const [invalidImportMessages, setInvalidImportMessages] = useState<Record<number, string | undefined>>({});

    const [originalStepImportData] = useStateFromAPIAsync(
        undefined,
        () => {return props.mitoAPI.getImportedFilesAndDataframes()},
        (loadedData) => {
            console.log("Loaded", loadedData)
            // On load, update the updated import data
            setUpdatedStepImportData(loadedData || [])
        },
        []
    )

    // We create an import card for each of the dataframes created within the original imports
    const originalAndUpdatedDataframeCreationPairs = getOriginalAndUpdatedDataframeCreationDataPairs(originalStepImportData, updatedStepImportData);
    const updateImportCards = originalAndUpdatedDataframeCreationPairs.map(([originalDfCreationData, updatedDfCreationData], index) => {
        return (
            <ImportCard 
                key={index}
                dataframeCreationIndex={index}
                dataframeCreationData={originalDfCreationData}
                updatedDataframeCreationData={updatedDfCreationData}
                displayedImportCardDropdown={displayedImportCardDropdown}
                setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}
                setReplacingDataframeState={setReplacingDataframeState}
                postUpdateInvalidImportMessage={invalidImportMessages[index]}
            />
        )
    })

    const updated = originalAndUpdatedDataframeCreationPairs.map(([originalDfCreationData, updatedDfCreationData]) => {
        return isUpdatedDfCreationData(originalDfCreationData, updatedDfCreationData);
    }).reduce((prevValue, newValue) => {return prevValue || newValue}, false);

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
                        onClick={async () => {
                            if (updatedStepImportData === undefined) {
                                return
                            }
                            const _invalidImportIndexes = await props.mitoAPI.getTestImports(updatedStepImportData);
                            console.log(_invalidImportIndexes);
                            if (_invalidImportIndexes === undefined) {
                                return;
                            }
                            setInvalidImportMessages(_invalidImportIndexes);

                            // If there are no invalid indexes, then we can update
                            if (Object.keys(_invalidImportIndexes).length === 0) {
                                void props.mitoAPI.updateExistingImports(updatedStepImportData);
                            }
                        }}
                        disabled={!updated} // TODO, disable this if there is an error
                    >
                        <p>
                            Update Imports
                        </p>
                    </TextButton>
                </DefaultTaskpaneFooter>
            </DefaultTaskpane>
        )
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

