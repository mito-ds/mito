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


import MitoAPI from "./api"
import { getMetadataInNotebook, notebookGetArgs, notebookOverwriteAnalysisToReplayToMitosheetCall, notebookWriteAnalysisToReplayToMitosheetCall, notebookWriteGeneratedCodeToCell, setMetadataInNotebook } from "./notebook/pluginUtils"


/**
 * NOTE: the next two functions are key to the proper functioning of Mito in
 * these two environments. As such, anytime we are in JupyterLab, the 
 * isInJupyterLab MUST return true. We check a variety of these conditions
 * to see if this works (including in cases when mito is remote). 
 * 
 * If you change this code, make sure to test it with remove servers that 
 * have non-standard URL schemes.
 */

export const isInJupyterLab = (): boolean => {
    return window.location.pathname.startsWith('/lab') ||
        window.commands !== undefined ||
        (window as any)._JUPYTERLAB !== undefined
}
export const isInJupyterNotebook = (): boolean => {
    return window.location.pathname.startsWith('/notebooks') ||
        (window as any).Jupyter !== undefined
}

export const writeAnalysisToReplayToMitosheetCall = (analysisName: string, mitoAPI: MitoAPI): void => {
    if (isInJupyterLab()) {
        window.commands?.execute('write-analysis-to-replay-to-mitosheet-call', {
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
        window.commands?.execute('overwrite-analysis-to-replay-to-mitosheet-call', {
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


export const writeGeneratedCodeToCell = (analysisName: string, code: string[], telemetryEnabled: boolean): void => {
    if (isInJupyterLab()) {
        window.commands?.execute('write-generated-code-cell', {
            analysisName: analysisName,
            code: code,
            telemetryEnabled: telemetryEnabled,
        });
    } else if (isInJupyterNotebook()) {
        notebookWriteGeneratedCodeToCell(analysisName, code, telemetryEnabled);
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}


export const getArgs = (analysisToReplayName: string | undefined): Promise<string[]> => {
    return new Promise((resolve) => {
        if (isInJupyterLab()) {
            window.commands?.execute('get-args', {analysisToReplayName: analysisToReplayName}).then(async (args: string[]) => {
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

export const writeToNotebookMetadata = (key: string, value: string): void => {
    console.log("Writing", value, "to", key)
    if (isInJupyterLab()) {
        window.commands?.execute('set-metadata', {
            key: key,
            value: value
        });
    } else if (isInJupyterNotebook()) {
        setMetadataInNotebook(key, value);
    } else {
        console.error("Not detected as in Jupyter Notebook or JupyterLab")
    }
}

export const getNotebookMetadata = (key: string): Promise<void | string> => {
    console.log("getting value for", key)
    // TODO!
    return new Promise((resolve) => {
        if (isInJupyterLab()) {
            window.commands?.execute('get-metadata', {key: key}).then(async (value: string) => {
                return resolve(value);
            })
            return;
        } else if (isInJupyterNotebook()) {
            return resolve(getMetadataInNotebook(key));
        } else {
            console.error("Not detected as in Jupyter Notebook or JupyterLab")
        }
        return resolve();
    })
}