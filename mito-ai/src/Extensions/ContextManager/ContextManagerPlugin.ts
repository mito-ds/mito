/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// src/ContextManager.ts
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { fetchVariablesAndUpdateState, Variable } from './VariableInspector';
import { fetchFilesAndUpdateState, File } from './FileInspector';
import { KernelMessage } from '@jupyterlab/services';
import { getKernelID } from '../../utils/kernel';

// The provides field in JupyterLab's JupyterFrontEndPlugin expects a token 
// that can be used to look up the service in the dependency injection system,
// so we define a new token for the ContextManager
export const IContextManager = new Token<IContextManager>('mito-ai:IContextManager');

export interface NotebookContext {
    variables: Variable[];
    files: File[];
}

export interface IContextManager {
    // Get context for a specific notebook
    getNotebookContext(notebookId: string): NotebookContext | undefined;
    
    // Get context for the currently active notebook
    getActiveNotebookContext(): NotebookContext | undefined;
    
    // Update variables for a specific notebook
    updateNotebookVariables(notebookId: string, variables: Variable[]): void;
    
    // Update files for a specific notebook
    updateNotebookFiles(notebookId: string, files: File[]): void;
}

export class ContextManager implements IContextManager {
    private notebookContexts: Map<string, NotebookContext> = new Map();
    private notebookTracker: INotebookTracker;

    constructor(app: JupyterFrontEnd, notebookTracker: INotebookTracker) {
        this.notebookTracker = notebookTracker;
        
        // Setup the kernel listener to update context as kernel messages are received
        this.setupKernelListener(app, notebookTracker); 
    }

    getNotebookContext(notebookId: string): NotebookContext | undefined {
        return this.notebookContexts.get(notebookId);
    }

    getActiveNotebookContext(): NotebookContext | undefined {
        const activeNotebook = this.notebookTracker.currentWidget;
        if (!activeNotebook) return undefined;
        
        const kernelID = getKernelID(activeNotebook);
        return this.getNotebookContext(kernelID);
    }

    updateNotebookVariables(kernelID: string, variables: Variable[]): void {
        const context = this.notebookContexts.get(kernelID) || { variables: [], files: [] };
        context.variables = variables;

        this.notebookContexts.set(kernelID, context);
    }

    updateNotebookFiles(kernelID: string, files: File[]): void {
        const context = this.notebookContexts.get(kernelID) || { variables: [], files: [] };
        context.files = files;
        this.notebookContexts.set(kernelID, context);
    }

    private _startKernelListener = async (app: JupyterFrontEnd, notebookTracker: INotebookTracker, notebookPanel: NotebookPanel | null) => {
        if (notebookPanel === null) {
            return;
        }
    
        const kernelID = getKernelID(notebookPanel);
        
        // Initialize context for this notebook if it doesn't exist
        if (!this.notebookContexts.has(kernelID)) {
            this.notebookContexts.set(kernelID, { variables: [], files: [] });
        }
    
        // Listen for kernel refresh events
        notebookPanel.context.sessionContext.statusChanged.connect((sender, status) => {
            if (status === 'restarting') {
                this.updateNotebookVariables(kernelID, []); // Clear variables for this specific notebook
            }
        });
    
        // As soon as the notebook is opened, fetch the files so we don't have to wait for the first message.
        // TODO: There is a bug here where the files are not attatched on the first load of the notebook because 
        // the kernelID is not set yet.
        await fetchFilesAndUpdateState(app, notebookTracker, (files) => {
            this.updateNotebookFiles(kernelID, files);
        });
    
        // Listen to kernel messages
        notebookPanel.context.sessionContext.iopubMessage.connect(async (sender, msg: KernelMessage.IMessage) => {
    
            // Watch for execute_input messages, which indicate is a request to execute code. 
            // Previosuly, we watched for 'execute_result' messages, but these are only returned
            // from the kernel when a code cell prints a value to the output cell, which is not what we want.
            // TODO: Check if there is a race condition where we might end up fetching variables before the 
            // code is executed. I don't think this is the case because the kernel runs in one thread I believe.
            if (msg.header.msg_type === 'execute_input') {
                console.log('msg: ', msg)
                const kernelID = getKernelID(notebookPanel);

                await fetchVariablesAndUpdateState(notebookPanel, (variables) => {
                    this.updateNotebookVariables(kernelID, variables);
                });
                await fetchFilesAndUpdateState(app, notebookTracker, (files) => {
                    this.updateNotebookFiles(kernelID, files);
                });
            }
        });
    }

    // Setup kernel execution listener
    private setupKernelListener(app: JupyterFrontEnd, notebookTracker: INotebookTracker): void {

        // Start the kernel listener for the currently active notebook
        const notebookPanel = notebookTracker.currentWidget;
        this._startKernelListener(app, notebookTracker, notebookPanel);

        // Update the kernel listener whenever the active notebook changes
        notebookTracker.currentChanged.connect(async (_, notebookPanel) => {
            this._startKernelListener(app, notebookTracker, notebookPanel);
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