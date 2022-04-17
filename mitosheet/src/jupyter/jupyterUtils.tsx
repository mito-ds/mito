import { notebookGetArgs } from "./notebook/pluginUtils"


const isInJupyterLab = (): boolean => {
    return window.location.pathname.startsWith('/lab')
}

const isInJupyterNotebook = (): boolean => {
    return window.location.pathname.startsWith('/notebooks')
}


export const getArgs = (analysisToReplayName: string | undefined): Promise<string[]> => {
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