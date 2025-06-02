/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// src/ContextManager.ts
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { fetchVariablesAndUpdateState, Variable } from './VariableInspector';
import { fetchFilesAndUpdateState, File } from './FileInspector';
import { KernelMessage } from '@jupyterlab/services';


// The provides field in JupyterLab's JupyterFrontEndPlugin expects a token 
// that can be used to look up the service in the dependency injection system,
// so we define a new token for the ContextManager
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
        // Setup the kernel listener to update context as kernel messages are received
        this.setupKernelListener(app, notebookTracker); 
    }

    get variables(): Variable[] {
        return this._variables;
    }

    setVariables(newVars: Variable[]): void {
        this._variables = newVars;
    }

    get files(): File[] {
        return this._files;
    }

    setFiles(newFiles: File[]): void {
        this._files = newFiles;
    }

    // Setup kernel execution listener
    private setupKernelListener(app: JupyterFrontEnd, notebookTracker: INotebookTracker): void {
        notebookTracker.currentChanged.connect(async (tracker, notebookPanel) => {
            if (!notebookPanel) {
                return;
            }

            // Listen for kernel refresh events
            notebookPanel.context.sessionContext.statusChanged.connect((sender, status) => {
                if (status === 'restarting') {
                    this.setVariables([]); // Clear variables on kernel refresh
                }
            });

            // As soon as the notebook is opened, fetch the files so we don't have to wait for the first message.
            await fetchFilesAndUpdateState(app, notebookTracker, this.setFiles.bind(this));

            // Listen to kernel messages
            notebookPanel.context.sessionContext.iopubMessage.connect(async (sender, msg: KernelMessage.IMessage) => {

                // Watch for execute_input messages, which indicate is a request to execute code. 
                // Previosuly, we watched for 'execute_result' messages, but these are only returned
                // from the kernel when a code cell prints a value to the output cell, which is not what we want.
                // TODO: Check if there is a race condition where we might end up fetching variables before the 
                // code is executed. I don't think this is the case because the kernel runs in one thread I believe.
                if (msg.header.msg_type === 'execute_input') {
                    await fetchVariablesAndUpdateState(notebookPanel, this.setVariables.bind(this));
                    await fetchFilesAndUpdateState(app, notebookTracker, this.setFiles.bind(this));
                }
            });
        });
    }
}


export const ContextManagerPlugin: JupyterFrontEndPlugin<IContextManager> = {
    id: 'mito-ai:context-manager',
    autoStart: true,
    requires: [INotebookTracker],
    provides: IContextManager,
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker): IContextManager => {
        console.log("mito-ai: ContextManagerPlugin activated");
        return new ContextManager(app, notebookTracker);
    }
};

export default ContextManagerPlugin