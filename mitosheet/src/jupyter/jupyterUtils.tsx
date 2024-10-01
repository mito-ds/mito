/**
 * This file contains all the major utilities necessary for writing and
 * reading code to a notebook, whether that be a Jupyterlab notebook or
 * a classic Jupyter Notebook.
 * 
 * In the case of JupyterLab, we need to interact with the notebook through
 * commands defined on window.commands?.execute. This is because Lab forces
 * us to do this to access the cells of the notebook with a nice API.
 * 
 * In the case of the classic Notebook, things are easier. We can interact
 * with the cells through window.Jupyter.notebook, and so we do this directly
 * in this case.
 * 
 * These functions are wrappers over both of these, so that in Mito.tsx, we
 * only ever need to call one function and can keep things relatively clean.
 */


import {
    AnalysisData,
    MitoAPI,
    PublicInterfaceVersion, SheetData, UserProfile
} from "../mito";
import { isInJupyterLabOrNotebook } from "../mito/utils/location";


export const writeAnalysisToReplayToMitosheetCall = (analysisName: string, mitoAPI: MitoAPI): void => {
    if (isInJupyterLabOrNotebook()) {
        window.commands?.execute('mitosheet:write-analysis-to-replay-to-mitosheet-call', {
            analysisName: analysisName,
            mitoAPI: mitoAPI
        });
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}
export const overwriteAnalysisToReplayToMitosheetCall = (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI): void => {
    if (isInJupyterLabOrNotebook()) {
        window.commands?.execute('mitosheet:overwrite-analysis-to-replay-to-mitosheet-call', {
            oldAnalysisName: oldAnalysisName,
            newAnalysisName: newAnalysisName,
            mitoAPI: mitoAPI
        });
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}


export const writeGeneratedCodeToCell = (analysisName: string, inputCellExecutionCount: number | undefined, code: string[], telemetryEnabled: boolean, publicInterfaceVersion: PublicInterfaceVersion, triggerUserEditedCodeDialog: (codeWithoutUserEdits: string[], codeWithUserEdits: string[]) => void, oldCode: string[], overwriteIfUserEditedCode?: boolean): void => {
    if (isInJupyterLabOrNotebook()) {
        if (inputCellExecutionCount) {
            window.commands?.execute('mitosheet:write-generated-code-cell-by-execution-count', {
                analysisName: analysisName,
                inputCellExecutionCount: inputCellExecutionCount,
                code: code,
                telemetryEnabled: telemetryEnabled,
                publicInterfaceVersion: publicInterfaceVersion,
                oldCode: oldCode,
            });
        } else {
            window.commands?.execute('mitosheet:write-generated-code-cell', {
                analysisName: analysisName,
                code: code,
                telemetryEnabled: telemetryEnabled,
                publicInterfaceVersion: publicInterfaceVersion,
                oldCode: oldCode,
                overwriteIfUserEditedCode: overwriteIfUserEditedCode,
                triggerUserEditedCodeDialog: triggerUserEditedCodeDialog,
            });
        }
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}

export const writeCodeSnippetCell = (analysisName: string, code: string): void => {
    if (isInJupyterLabOrNotebook()) {
        window.commands?.execute('mitosheet:write-code-snippet-cell', {
            analysisName: analysisName,
            code: code,
        });
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}


export const getArgs = (analysisToReplayName: string | undefined, inputCellExecutionCount: number | undefined): Promise<string[]> => {
    return new Promise((resolve) => {
        if (isInJupyterLabOrNotebook()) {
            if (inputCellExecutionCount) {
                window.commands?.execute('mitosheet:get-args-by-execution-count', {inputCellExecutionCount: inputCellExecutionCount}).then(async (args: string[]) => {
                    return resolve(args);
                })
            } else {
                window.commands?.execute('mitosheet:get-args', {analysisToReplayName: analysisToReplayName}).then(async (args: string[]) => {
                    return resolve(args);
                })
            }
            return;
        } else {
            console.error("Not detected as in Jupyter Notebook or JupyterLab")
        }
        return resolve([]);
    })
}



export const getSheetDataArrayFromString = (sheet_data_json: string): SheetData[] => {
    if (sheet_data_json.length === 0) {
        return []
    }
    return JSON.parse(sheet_data_json);
}

export const getUserProfileFromString = (user_profile_json: string): UserProfile => {
    const userProfile = JSON.parse(user_profile_json)
    if (userProfile['usageTriggeredFeedbackID'] == '') {
        userProfile['usageTriggeredFeedbackID'] = undefined
    }
    return userProfile;
}
export const getAnalysisDataFromString = (analysis_data_json: string): AnalysisData =>  {
    return JSON.parse(analysis_data_json)
}
