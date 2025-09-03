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
import { NotebookPanel } from '@jupyterlab/notebook';

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
        
        const notebookId = this.getNotebookId(activeNotebook);
        return this.getNotebookContext(notebookId);
    }

    updateNotebookVariables(notebookId: string, variables: Variable[]): void {
        const context = this.notebookContexts.get(notebookId) || { variables: [], files: [] };
        context.variables = variables;
        this.notebookContexts.set(notebookId, context);
    }

    updateNotebookFiles(notebookId: string, files: File[]): void {
        const context = this.notebookContexts.get(notebookId) || { variables: [], files: [] };
        context.files = files;
        this.notebookContexts.set(notebookId, context);
    }

    private getNotebookId(notebookPanel: NotebookPanel): string {
        // TODO: Figure out the correct id for this. 
        return notebookPanel.context.sessionContext.name || '';
    }

    // Setup kernel execution listener
    private setupKernelListener(app: JupyterFrontEnd, notebookTracker: INotebookTracker): void {
        notebookTracker.currentChanged.connect(async (tracker, notebookPanel) => {
            if (!notebookPanel) {
                return;
            }

            const notebookId = this.getNotebookId(notebookPanel);
            
            // Initialize context for this notebook if it doesn't exist
            if (!this.notebookContexts.has(notebookId)) {
                this.notebookContexts.set(notebookId, { variables: [], files: [] });
            }

            // Listen for kernel refresh events
            notebookPanel.context.sessionContext.statusChanged.connect((sender, status) => {
                if (status === 'restarting') {
                    this.updateNotebookVariables(notebookId, []); // Clear variables for this specific notebook
                }
            });

            // As soon as the notebook is opened, fetch the files so we don't have to wait for the first message.
            await fetchFilesAndUpdateState(app, notebookTracker, (files) => {
                this.updateNotebookFiles(notebookId, files);
            });

            // Listen to kernel messages
            notebookPanel.context.sessionContext.iopubMessage.connect(async (sender, msg: KernelMessage.IMessage) => {

                // Watch for execute_input messages, which indicate is a request to execute code. 
                // Previosuly, we watched for 'execute_result' messages, but these are only returned
                // from the kernel when a code cell prints a value to the output cell, which is not what we want.
                // TODO: Check if there is a race condition where we might end up fetching variables before the 
                // code is executed. I don't think this is the case because the kernel runs in one thread I believe.
                if (msg.header.msg_type === 'execute_input') {
                    await fetchVariablesAndUpdateState(notebookPanel, (variables) => {
                        this.updateNotebookVariables(notebookId, variables);
                    });
                    await fetchFilesAndUpdateState(app, notebookTracker, (files) => {
                        this.updateNotebookFiles(notebookId, files);
                    });
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