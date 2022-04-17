import MitoAPI from "../api"
import { notebookGetArgs, notebookOverwriteAnalysisToReplayToMitosheetCall, notebookWriteAnalysisToReplayToMitosheetCall, notebookWriteGeneratedCodeToCell } from "./notebook/pluginUtils"


export const isInJupyterLab = (): boolean => {
    return window.location.pathname.startsWith('/lab')
}

export const isInJupyterNotebook = (): boolean => {
    return window.location.pathname.startsWith('/notebooks')
}

export const writeAnalysisToReplayToMitosheetCall = (analysisName: string, mitoAPI: MitoAPI) => {
    if (isInJupyterLab()) {
        window.commands?.execute('write-analysis-to-replay-to-mitosheet-call', {
            analysisName: analysisName,
            mitoAPI: mitoAPI
        });
    } else if (isInJupyterNotebook()) {
        notebookWriteAnalysisToReplayToMitosheetCall(analysisName, mitoAPI);
    }
}
export const overwriteAnalysisToReplayToMitosheetCall = (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI) => {
    if (isInJupyterLab()) {
        window.commands?.execute('overwrite-analysis-to-replay-to-mitosheet-call', {
            oldAnalysisName: oldAnalysisName,
            newAnalysisName: newAnalysisName,
            mitoAPI: mitoAPI
        });
    } else if (isInJupyterNotebook()) {
        notebookOverwriteAnalysisToReplayToMitosheetCall(oldAnalysisName, newAnalysisName, mitoAPI);
    }
}


export const writeGeneratedCodeToCell = (analysisName: string, code: string[], telemetryEnabled: boolean) => {
    if (isInJupyterLab()) {
        window.commands?.execute('write-generated-code-cell', {
            analysisName: analysisName,
            code: code,
            telemetryEnabled: telemetryEnabled,
        });
    } else if (isInJupyterNotebook()) {
        notebookWriteGeneratedCodeToCell(analysisName, code, telemetryEnabled);
    }
}


export const getArgs = (analysisToReplayName: string | undefined): Promise<string[]> => {
    console.log("ANALSIS NAME TO REPLAY", analysisToReplayName);
    return new Promise((resolve, reject) => {
        if (isInJupyterLab()) {
            window.commands?.execute('get-args', {analysisToReplayName: analysisToReplayName}).then(async (args: string[]) => {
                return resolve(args);
            })
            return;
        } else if (isInJupyterNotebook()) {
            return resolve(notebookGetArgs(analysisToReplayName));
        }
        return resolve([]);
    })
}