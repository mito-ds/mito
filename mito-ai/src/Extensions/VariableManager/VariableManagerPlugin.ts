// src/VariableManager.ts
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { fetchVariablesAndUpdateState, Variable } from './VariableInspector';
import { fetchFilesAndUpdateState, File } from './FileInspector';
import { KernelMessage } from '@jupyterlab/services';


// The provides field in JupyterLab's JupyterFrontEndPlugin expects a token 
// that can be used to look up the service in the dependency injection system,
// so we define a new token for the VariableManager
// TODO: Should this still be called mito-ai or something else? Do I need a new name for 
// each extension? I don't think so.
export const IContextManager = new Token<IContextManager>('mito-ai:IContextManager');

export interface IContextManager {
    variables: Variable[];
    setVariables: (newVars: Variable[]) => void;
    files: File[];
    setFiles: (newFiles: File[]) => void;
}

export class ContextManager implements IContextManager {
    private _variables: Variable[] = [];
    private _files: File[] = [];

    constructor(app: JupyterFrontEnd, notebookTracker: INotebookTracker) {
        // Initialize variables and files 

        // Setup the kernel listener to update context as kernel messages are received
        this.setupKernelListener(app, notebookTracker); 
    }

    get variables(): Variable[] {
        return this._variables;
    }

    setVariables(newVars: Variable[]) {
        this._variables = newVars;
        console.log("Variables updated", this._variables)
    }

    get files(): File[] {
        return this._files;
    }

    setFiles(newFiles: File[]) {
        this._files = newFiles;
        console.log("Files updated", this._files)
    }

    // Setup kernel execution listener
    private setupKernelListener(app: JupyterFrontEnd, notebookTracker: INotebookTracker): void {
        notebookTracker.currentChanged.connect((tracker, notebookPanel) => {
            if (!notebookPanel) {
                return;
            }

            // Listen to kernel messages
            notebookPanel.context.sessionContext.iopubMessage.connect((sender, msg: KernelMessage.IMessage) => {

                // Watch for execute_input messages, which indicate is a request to execute code. 
                // Previosuly, we watched for 'execute_result' messages, but these are only returned
                // from the kernel when a code cell prints a value to the output cell, which is not what we want.
                // TODO: Check if there is a race condition where we might end up fetching variables before the 
                // code is executed. I don't think this is the case because the kernel runs in one thread I believe.
                if (msg.header.msg_type === 'execute_input') {
                    fetchVariablesAndUpdateState(notebookPanel, this.setVariables.bind(this));
                    fetchFilesAndUpdateState(app, notebookTracker, this.setFiles.bind(this));
                }
            });
        });
    }
}


export const VariableManagerPlugin: JupyterFrontEndPlugin<IContextManager> = {
    id: 'mito-ai:variable-manager',
    autoStart: true,
    requires: [INotebookTracker],
    provides: IContextManager,
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker): IContextManager => {
        console.log("mito-ai: ContextManagerPlugin activated");
        return new ContextManager(app, notebookTracker);
    }
};

export default VariableManagerPlugin