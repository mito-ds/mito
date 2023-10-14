import React, { useEffect, useState } from "react";
import { MitoAPI } from "../../../api/api";
import { SendFunctionErrorReturnType } from "../../../api/send";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types";
import CSVImportConfigScreen, { CSVImportParams } from "../../import/CSVImportConfigScreen";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import FileBrowser from "../../import/FileBrowser/FileBrowser";
import XLSXImportConfigScreen, { ExcelImportParams } from "../../import/XLSXImportConfigScreen";
import { ExcelRangeImportParams } from "../ExcelRangeImport/ExcelRangeImportTaskpane";
import { getDefaultCSVParams } from "../FileImport/CSVImportConfigTaskpane";
import { FileElement, ImportState } from "../FileImport/FileImportTaskpane";
import { getDefaultXLSXParams } from "../FileImport/XLSXImportConfigTaskpane";
import { SnowflakeImportParams } from "../SnowflakeImport/SnowflakeImportTaskpane";
import { UserDefinedImportParams } from "../UserDefinedImport/UserDefinedImportTaskpane";
import UpdateDataframeImportScreen from "./UpdateDataframeImportTaskpane";
import UpdateImportsPostReplayTaskpane from "./UpdateImportsPostReplayTaskpane";
import UpdateImportsPreReplayTaskpane, { ImportDataAndImportErrors, PRE_REPLAY_IMPORT_ERROR_TEXT } from "./UpdateImportsPreReplayTaskpane";
import UpdateSnowflakeCredentialsScreen from "./UpdateSnowflakeCredentialsScreen";
import UserDefinedImportScreen from "./UserDefinedImportScreen";
import { getErrorTextFromToFix, isCSVImportParams, isDataframeImportParams, isExcelImportParams, updateAllSnowflakeImports, updateDataframeCreation } from "./updateImportsUtils";


interface UpdateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    sheetDataArray: SheetData[],
    userProfile: UserProfile;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    currPathParts: string[];
    setCurrPathParts: (newCurrPathParts: string[]) => void;

    failedReplayData: FailedReplayData | undefined;

    overwriteAnalysisToReplayToMitosheetCall?: (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI) => void
}

export type DataframeCreationData = {
    step_type: 'simple_import',
    params: CSVImportParams
} | {
    step_type: 'excel_import',
    params: ExcelImportParams
} | {
    step_type: 'dataframe_import',
    params: DataframeImportParams
} | {
    step_type: 'excel_range_import',
    params: ExcelRangeImportParams
} | {
    step_type: 'snowflake_import',
    params: SnowflakeImportParams
} | {
    step_type: 'user_defined_import',
    params: UserDefinedImportParams | undefined
} 


export interface StepImportData {
    step_id: string,
    imports: DataframeCreationData[];
}

export interface ReplacingDataframeState {
    dataframeCreationIndex: number, 
    importState: ImportState,
    params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined
}

export interface FailedReplayData {
    analysisName: string,
    error: SendFunctionErrorReturnType,
    args: string[]
}
    

/* 
    This is the UpdateImportsTaskpane taskpane. It allows a user to change
    the files and dataframes that are imported in this analysis. 

    There are two specific times that a user might be updating imports:
    1.  After an analysis fails to replay, due to changed imports. In this case
        the user sees the UpdateImportsPreReplayTaskpane.
    2.  In the middle of a valid analysis. In this case, the user sees the 
        UpdateImportsPostReplayTaskpane.

    The user can then select a specific import to replace, which either opens
    the file import or dataframe import screens respectively.
*/
const UpdateImportsTaskpane = (props: UpdateImportsTaskpaneProps): JSX.Element => {

    const failedReplayData = props.failedReplayData;
    const updatePreReplay = failedReplayData !== undefined;
    
    const [updatedStepImportData, setUpdatedStepImportData] = useState<StepImportData[] | undefined>(undefined);
    const [updatedIndexes, setUpdatedIndexes] = useState<number[]>([]);
    const [displayedImportCardDropdown, setDisplayedImportCardDropdown] = useState<number | undefined>(undefined);
    const [replacingDataframeState, setReplacingDataframeState] = useState<ReplacingDataframeState | undefined>(undefined);
    const [postUpdateInvalidImportMessages, setPostUpdateInvalidImportMessages] = useState<Record<number, string | undefined>>({});

    // We load data in this taskpane, rather than in the subtaskpanes as they are
    // killed and recreated when we switch screens, meaning this data would have to be reloaded
    const [importDataAndErrors] = useStateFromAPIAsync<ImportDataAndImportErrors | undefined, undefined>(
        undefined,
        async () => {
            let importData: StepImportData[] | undefined = undefined;
            let invalidImportIndexes: Record<number, string> | undefined = undefined;

            if (failedReplayData !== undefined) {
                const response = await props.mitoAPI.getImportedFilesAndDataframesFromAnalysisName(failedReplayData.analysisName, failedReplayData.args);
                importData = 'error' in response ? undefined : response.result;

                const invalidImportIndexesResponse = await props.mitoAPI.getTestImports(importData || []);
                invalidImportIndexes = 'error' in invalidImportIndexesResponse ? {} : invalidImportIndexesResponse.result;
            } else {
                const response = await props.mitoAPI.getImportedFilesAndDataframesFromCurrentSteps();
                importData = 'error' in response ? undefined : response.result;
                invalidImportIndexes = {};
            }

            if (importData !== undefined && invalidImportIndexes !== undefined) {
                return {
                    importData: importData,
                    invalidImportMessages: invalidImportIndexes
                }
            }
            return undefined;
        },
        (loadedData) => {
            if (loadedData === undefined) {
                return;
            }

            setUpdatedStepImportData(prevUpdatedStepImportData => {
                if (prevUpdatedStepImportData === undefined) {
                    return window.structuredClone(loadedData.importData);
                }
                return prevUpdatedStepImportData;
            })

            // If we're in the pre-replay state, then we want to default to having an error
            if (failedReplayData !== undefined) {
                // If there are some invalid imported dataframes, then we display this as the error message
                if (Object.keys(loadedData.invalidImportMessages).length > 0) {
                    setInvalidReplayError(PRE_REPLAY_IMPORT_ERROR_TEXT);
                } else {
                    // Otherwise, display the error that occured when replaying the analysis 
                    setInvalidReplayError(getErrorTextFromToFix(failedReplayData.error.error));
                }
            }
        },
        []
    )

    const [invalidReplayError, setInvalidReplayError] = useState<string | undefined>(undefined);

    useEffect(() => {
        void props.mitoAPI.log('opened_update_imports_taskpane', {
            'open_due_to_replay_error': updatePreReplay,
            'num_invalid_imports': importDataAndErrors?.invalidImportMessages === undefined ? 0 : Object.keys(importDataAndErrors.invalidImportMessages).length,
            'num_total_imports': importDataAndErrors?.importData === undefined ? 0 : importDataAndErrors?.importData.length
        });
    }, [importDataAndErrors])


    if (replacingDataframeState === undefined) {
        if (props.failedReplayData !== undefined) {
            return (
                <UpdateImportsPreReplayTaskpane
                    mitoAPI={props.mitoAPI}
                    analysisData={props.analysisData}
                    userProfile={props.userProfile}
                    setUIState={props.setUIState}

                    updatedStepImportData={updatedStepImportData}
                    setUpdatedStepImportData={setUpdatedStepImportData}

                    updatedIndexes={updatedIndexes}
                    setUpdatedIndexes={setUpdatedIndexes}

                    displayedImportCardDropdown={displayedImportCardDropdown}
                    setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}

                    setReplacingDataframeState={setReplacingDataframeState}

                    postUpdateInvalidImportMessages={postUpdateInvalidImportMessages}
                    setPostUpdateInvalidImportMessages={setPostUpdateInvalidImportMessages}

                    failedReplayData={props.failedReplayData}
                    importDataAndErrors={importDataAndErrors}

                    invalidReplayError={invalidReplayError}
                    setInvalidReplayError={setInvalidReplayError}

                    overwriteAnalysisToReplayToMitosheetCall={props.overwriteAnalysisToReplayToMitosheetCall}
                />
            )
        } else {
            return (
                <UpdateImportsPostReplayTaskpane
                    mitoAPI={props.mitoAPI}
                    sheetDataArray={props.sheetDataArray}
                    analysisData={props.analysisData}
                    userProfile={props.userProfile}
                    setUIState={props.setUIState}

                    updatedStepImportData={updatedStepImportData}
                    setUpdatedStepImportData={setUpdatedStepImportData}

                    updatedIndexes={updatedIndexes}
                    setUpdatedIndexes={setUpdatedIndexes}

                    displayedImportCardDropdown={displayedImportCardDropdown}
                    setDisplayedImportCardDropdown={setDisplayedImportCardDropdown}

                    setReplacingDataframeState={setReplacingDataframeState}

                    invalidImportMessages={postUpdateInvalidImportMessages}
                    setInvalidImportMessages={setPostUpdateInvalidImportMessages}

                    importDataAndErrors={importDataAndErrors}

                    invalidReplayError={invalidReplayError}
                    setInvalidReplayError={setInvalidReplayError}
                    
                />
            )
        }
    } 

    const importState = replacingDataframeState.importState;    
    if (importState.screen === 'file_browser') {
        return (
            <FileBrowser
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
                isUpdate={true}
            
                currPathParts={props.currPathParts}
                setCurrPathParts={props.setCurrPathParts}

                setImportState={(newImportState) => {
                    setReplacingDataframeState({
                        'importState': newImportState,
                        'params': undefined,
                        'dataframeCreationIndex': replacingDataframeState.dataframeCreationIndex
                    })
                }}
                importCSVFile={async (file: FileElement) => {
                    const fullPath = [...props.currPathParts]
                    fullPath.push(file.name);
                    const pathJoinResponse = await props.mitoAPI.getPathJoined(fullPath);
                    const filePath = 'error' in pathJoinResponse ? undefined : pathJoinResponse.result;


                    if (filePath === undefined) {
                        return
                    }

                    const dataframeCreationData: DataframeCreationData = {
                        'step_type': 'simple_import',
                        'params': {
                            file_names: [filePath],
                        }
                    }

                    // First, check that this is a valid import, and if it is, then update this
                    const response = await props.mitoAPI.getTestImports([{
                        'step_id': 'fake_id',
                        'imports': [dataframeCreationData]
                    }])
                    const indexToErrorMap = 'error' in response ? undefined : response.result;

                    // if it's not a valid import, then we send the user to the CSV config screen
                    if (indexToErrorMap === undefined || Object.keys(indexToErrorMap).length > 0) {
                        setReplacingDataframeState({
                            'importState': {
                                'screen': 'csv_import_config',
                                'fileName': file.name,
                                'filePath': filePath,
                                'error': indexToErrorMap !== undefined ? indexToErrorMap[0] : undefined
                            },
                            'params': undefined,
                            'dataframeCreationIndex': replacingDataframeState.dataframeCreationIndex
                        })
                        return;
                    }

                    updateDataframeCreation(
                        replacingDataframeState.dataframeCreationIndex,
                        dataframeCreationData,
                        setUpdatedStepImportData,
                        setUpdatedIndexes,
                        setPostUpdateInvalidImportMessages,
                        setReplacingDataframeState
                    )
                }}
                backCallback={() => {
                    setReplacingDataframeState(undefined);
                }}
                notCloseable={updatePreReplay}
            />
        )
    } else if (importState.screen === 'csv_import_config') {
        const params = isCSVImportParams(replacingDataframeState.params)
            ? replacingDataframeState.params
            : getDefaultCSVParams(importState.filePath)

        return (
            <CSVImportConfigScreen
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}
                isUpdate={true}
            
                fileName={importState.fileName}
                filePath={importState.filePath}
            
                params={params}
                setParams={(updater) => {
                    setReplacingDataframeState(prevReplacingDataframeState => {
                        if (prevReplacingDataframeState === undefined) {
                            return undefined;
                        }

                        return {
                            ...prevReplacingDataframeState,
                            params: updater(params)
                        }
                    })
                }}
                edit={async () => {
                    // First, check that this is valid
                    const dataframeCreationData: DataframeCreationData = {
                        'step_type': 'simple_import',
                        'params': params
                    }

                    // First, check that this is a valid import
                    const response = await props.mitoAPI.getTestImports([{
                        'step_id': 'fake_id',
                        'imports': [dataframeCreationData]
                    }])
                    const indexToErrorMap = 'error' in response ? undefined : response.result;

                    // if it's not a valid import, then we send the user to the CSV config screen
                    if (indexToErrorMap === undefined || Object.keys(indexToErrorMap).length > 0) {
                        // Get the new error message. So that the user is always reminded if this is
                        // invalid, we keep appending "Still invalid." to the end of the error so that the user
                        // knows this is still invalid. This is kinda silly, but an ok hack for now.
                        const newError = indexToErrorMap !== undefined ? indexToErrorMap[0] : undefined;
                        const finalError = newError && importState.error?.startsWith(newError)  ? `${importState.error} Still invalid.` : newError;

                        setReplacingDataframeState({
                            'importState': {
                                ...importState,
                                error: finalError
                            },
                            'params': undefined,
                            'dataframeCreationIndex': replacingDataframeState.dataframeCreationIndex
                        })
                        return;
                    }


                    updateDataframeCreation(
                        replacingDataframeState.dataframeCreationIndex,
                        {
                            'step_type': 'simple_import',
                            'params': params
                        },
                        setUpdatedStepImportData,
                        setUpdatedIndexes,
                        setPostUpdateInvalidImportMessages,
                        setReplacingDataframeState
                    )
                }}
                editApplied={false}
                loading={false}
                error={importState.error}
            
                backCallback={() => {
                    setReplacingDataframeState(undefined);
                }}
                notCloseable={updatePreReplay}
            />
        )
    } else if (replacingDataframeState.importState.screen === 'xlsx_import_config') {
        const params = isExcelImportParams(replacingDataframeState.params)
            ? replacingDataframeState.params
            : getDefaultXLSXParams(replacingDataframeState.importState.filePath)

        return (
            <XLSXImportConfigScreen
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                setUIState={props.setUIState}
                isUpdate={true}
            
                fileName={replacingDataframeState.importState.fileName}
                filePath={replacingDataframeState.importState.filePath}
            
                params={params}
                setParams={(updater) => {
                    setReplacingDataframeState(prevReplacingDataframeState => {
                        if (prevReplacingDataframeState === undefined) {
                            return undefined;
                        }

                        return {
                            ...prevReplacingDataframeState,
                            params: updater(params)
                        }
                    })
                }}
                edit={() => {
                    updateDataframeCreation(
                        replacingDataframeState.dataframeCreationIndex,
                        {
                            'step_type': 'excel_import',
                            'params': params
                        },
                        setUpdatedStepImportData,
                        setUpdatedIndexes,
                        setPostUpdateInvalidImportMessages,
                        setReplacingDataframeState
                    )
                }}
                editApplied={false}
                loading={false}
            
                backCallback={() => {
                    setReplacingDataframeState(undefined);
                }}
                notCloseable={updatePreReplay}
            />
        )
    } else if (replacingDataframeState.importState.screen === 'authenticate_to_snowflake') {
        return (
            <UpdateSnowflakeCredentialsScreen
                mitoAPI={props.mitoAPI}
                setUIState={props.setUIState}
                edit={() => {
                    // Once the user validates their snowflake credentials once, we assume they are going
                    // to use the same credentials for all other snowflake imports in this analysis, so we mark
                    // them all as resolved. 
                    updateAllSnowflakeImports(
                        updatedStepImportData,
                        setUpdatedStepImportData,
                        setUpdatedIndexes,
                        setPostUpdateInvalidImportMessages,
                        setReplacingDataframeState
                    )
                }}

                backCallback={() => {
                    setReplacingDataframeState(undefined);
                }}
                notCloseable={updatePreReplay}
            />
        )
    } else if (replacingDataframeState.importState.screen === 'user_defined_import') {
        return (
            <UserDefinedImportScreen 
                mitoAPI={props.mitoAPI}
                setUIState={props.setUIState}
                edit={(params: UserDefinedImportParams | undefined) => {
                    updateDataframeCreation(
                        replacingDataframeState.dataframeCreationIndex,
                        {
                            'step_type': 'user_defined_import',
                            'params': params
                        },
                        setUpdatedStepImportData,
                        setUpdatedIndexes,
                        setPostUpdateInvalidImportMessages,
                        setReplacingDataframeState
                    )
                }}
                backCallback={() => {
                    setReplacingDataframeState(undefined);
                }}
                notCloseable={updatePreReplay}
                analysisData={props.analysisData}
                userProfile={props.userProfile}
                sheetDataArray={props.sheetDataArray}
                importer_name={replacingDataframeState.importState.importer_name}
            />
        )
    } else {
        // Dataframe import

        const params = isDataframeImportParams(replacingDataframeState.params)
            ? replacingDataframeState.params
            : {df_names: []}
            
        return (
            <UpdateDataframeImportScreen
                mitoAPI={props.mitoAPI}
                analysisData={props.analysisData}
                setUIState={props.setUIState}
                isUpdate={true}
                    
                params={params}
                setParams={(updater) => {
                    setReplacingDataframeState(prevReplacingDataframeState => {

                        if (prevReplacingDataframeState === undefined) {
                            return undefined;
                        }

                        return {
                            ...prevReplacingDataframeState,
                            params: updater(params)
                        }
                    })
                }}
                edit={() => {
                    updateDataframeCreation(
                        replacingDataframeState.dataframeCreationIndex,
                        {
                            'step_type': 'dataframe_import',
                            'params': params
                        },
                        setUpdatedStepImportData,
                        setUpdatedIndexes,
                        setPostUpdateInvalidImportMessages,
                        setReplacingDataframeState
                    )
                }}
            
                backCallback={() => {
                    setReplacingDataframeState(undefined);
                }}
                notCloseable={updatePreReplay}
            />
        )
    }
}

export default UpdateImportsTaskpane;

