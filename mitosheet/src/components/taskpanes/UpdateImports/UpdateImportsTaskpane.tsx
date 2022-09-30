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
import { isCSVImportData, isExcelImportData } from "./UpdateImportsUtils";


interface updateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

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

export interface StepImportData {
    step_id: string,
    imports: (CSVImportData | ExcelImportData | DataframeImportData)[];
}
    

/* 
    This is the updateImports taskpane.
*/
const UpdateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    const [updatedImportData, setUpdatedImportData] = useState<StepImportData[]>([]);
    const [displayedImportCardDropdown, setDisplayedImportCardDropdown] = useState<{step_id: string, index: number} | undefined>(undefined);

    const [originalStepImportData] = useStateFromAPIAsync(
        undefined,
        () => {return props.mitoAPI.getImportedFilesAndDataframes()},
        (loadedData) => {
            // On load, update the updated import data
            setUpdatedImportData(loadedData || [])
        }
    )

    // We create an import card for each of the dataframes created within the original imports
    const updateImportCards = originalStepImportData?.map((stepImportData) => {
        return stepImportData.imports.map((_import) => {
            if (isCSVImportData(_import)) {
                return _import.params.file_names.map((fileName, index) => {
                    return (
                        <ImportCard 
                            key={stepImportData.step_id + index}
                            step_id={stepImportData.step_id}
                            index={index}
                            dataframeCreationData={{
                                step_type: 'simple_import',
                                file_name: fileName
                            }}
                            displayedImportCardDropdown={displayedImportCardDropdown}
                            setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}
                        />
                    )
                })
            } else if (isExcelImportData(_import)) {
                return _import.params.sheet_names.map((sheetName, index) => {
                    return (
                        <ImportCard 
                            key={stepImportData.step_id + index}
                            step_id={stepImportData.step_id}
                            index={index}
                            dataframeCreationData={{
                                step_type: 'excel_import',
                                file_name: _import.params.file_name,
                                sheet_name: sheetName
                            }}
                            displayedImportCardDropdown={displayedImportCardDropdown}
                            setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}
                        />
                    )
                })
            } else {
                return _import.params.df_names.map((dfName, index) => {
                    return (
                        <ImportCard 
                            key={stepImportData.step_id + index}
                            step_id={stepImportData.step_id}
                            index={index}
                            dataframeCreationData={{
                                step_type: 'dataframe_import',
                                df_name: dfName,
                            }}
                            displayedImportCardDropdown={displayedImportCardDropdown}
                            setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}
                        />
                    )
                })
            }
        })
    })

    


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
                    onClick={() => props.mitoAPI.updateExistingImports(updatedImportData)}
                    disabled={undefined } // TODO, disable this if there is an error
                >
                    <p>
                        Update Imports
                    </p>
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportsTaskpane;

