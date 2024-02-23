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
    PublicInterfaceVersion, SheetData, UserProfile,
    isInJupyterLab, isInJupyterNotebook
} from "../mito";
import { notebookGetArgs, notebookOverwriteAnalysisToReplayToMitosheetCall, notebookWriteAnalysisToReplayToMitosheetCall, notebookWriteCodeSnippetCell, notebookWriteGeneratedCodeToCell } from "./notebook/extensionUtils";


export const writeAnalysisToReplayToMitosheetCall = (analysisName: string, mitoAPI: MitoAPI): void => {
    if (isInJupyterLab()) {
        window.commands?.execute('mitosheet:write-analysis-to-replay-to-mitosheet-call', {
            analysisName: analysisName,
            mitoAPI: mitoAPI
        });
    } else if (isInJupyterNotebook()) {
        notebookWriteAnalysisToReplayToMitosheetCall(analysisName, mitoAPI);
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}
export const overwriteAnalysisToReplayToMitosheetCall = (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI): void => {
    if (isInJupyterLab()) {
        window.commands?.execute('mitosheet:overwrite-analysis-to-replay-to-mitosheet-call', {
            oldAnalysisName: oldAnalysisName,
            newAnalysisName: newAnalysisName,
            mitoAPI: mitoAPI
        });
    } else if (isInJupyterNotebook()) {
        notebookOverwriteAnalysisToReplayToMitosheetCall(oldAnalysisName, newAnalysisName, mitoAPI);
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}


export const writeGeneratedCodeToCell = (analysisName: string, code: string[], telemetryEnabled: boolean, publicInterfaceVersion: PublicInterfaceVersion, triggerUserEditedCodeDialog: () => void, mitoAPI: MitoAPI, oldCode: string[], overwriteIfUserEditedCode?: boolean): void => {
    if (isInJupyterLab()) {
        window.commands?.execute('mitosheet:write-generated-code-cell', {
            analysisName: analysisName,
            code: code,
            telemetryEnabled: telemetryEnabled,
            publicInterfaceVersion: publicInterfaceVersion,
            oldCode: oldCode,
            overwriteIfUserEditedCode: overwriteIfUserEditedCode,
            triggerUserEditedCodeDialog: triggerUserEditedCodeDialog,
            mitoAPI: mitoAPI
        });
    } else if (isInJupyterNotebook()) {
        notebookWriteGeneratedCodeToCell(analysisName, code, telemetryEnabled, publicInterfaceVersion, mitoAPI, oldCode, triggerUserEditedCodeDialog, overwriteIfUserEditedCode);
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}



export const writeCodeSnippetCell = (analysisName: string, code: string): void => {
    if (isInJupyterLab()) {
        window.commands?.execute('mitosheet:write-code-snippet-cell', {
            analysisName: analysisName,
            code: code,
        });
    } else if (isInJupyterNotebook()) {
        notebookWriteCodeSnippetCell(analysisName, code);
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}


export const getArgs = (analysisToReplayName: string | undefined): Promise<string[]> => {
    return new Promise((resolve) => {
        if (isInJupyterLab()) {
            window.commands?.execute('mitosheet:get-args', {analysisToReplayName: analysisToReplayName}).then(async (args: string[]) => {
                return resolve(args);
            })
            return;
        } else if (isInJupyterNotebook()) {
            return resolve(notebookGetArgs(analysisToReplayName));
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
