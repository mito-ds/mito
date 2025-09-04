/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// src/ContextManager.ts
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { fetchVariablesAndUpdateState, Variable } from './VariableInspector';
import { getFiles, File } from './FileInspector';
import { KernelMessage } from '@jupyterlab/services';

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
        
        return this.getNotebookContext(activeNotebook.id);
    }

    updateNotebookVariables(notebookID: string, variables: Variable[]): void {
        const context = this.notebookContexts.get(notebookID) || { variables: [], files: [] };
        context.variables = variables;

        this.notebookContexts.set(notebookID, context);
    }

    updateNotebookFiles(notebookID: string, files: File[]): void {
        const context = this.notebookContexts.get(notebookID) || { variables: [], files: [] };
        context.files = files;
        this.notebookContexts.set(notebookID, context);
    }

    private _startKernelListener = async (app: JupyterFrontEnd, notebookPanel: NotebookPanel | null): Promise<void> => {
        if (notebookPanel === null) {
            return;
        }
        
        // Initialize context for this notebook if it doesn't exist
        if (!this.notebookContexts.has(notebookPanel.id)) {
            this.notebookContexts.set(notebookPanel.id, { variables: [], files: [] });
        }

        // As soon as the notebook is opened, fetch the files since these are not related to the kernel, 
        // but to the notebook itself. This is useful so we can tell the agent which files are available 
        // or let the user select a file from the dropdown menu before the kernel is started.
        // We use the notebookPanel.id to identify the notebook because we might need to access
        // NotebookContext even before the kernel is started. For example, to figure out 
        // which files are available.
        const updatedFiles = await getFiles(app, notebookPanel);
        this.updateNotebookFiles(notebookPanel.id, updatedFiles);
    
        // Listen for kernel restart or shut down events and clear the variables for this notebook
        notebookPanel.context.sessionContext.statusChanged.connect((sender, status) => {
            if (status === 'restarting' || status === 'terminating' || status === 'unknown') {
                // Clear the variables for this specific notebook, but don't clear the files 
                // as they have not changed.
                this.updateNotebookVariables(notebookPanel.id, []); // Clear variables for this specific notebook
            }
        });
    
        // Listen to kernel messages
        notebookPanel.context.sessionContext.iopubMessage.connect(async (sender, msg: KernelMessage.IMessage) => {
    
            // Watch for execute_input messages, which indicate is a request to execute code. 
            // Previosuly, we watched for 'execute_result' messages, but these are only returned
            // from the kernel when a code cell prints a value to the output cell, which is not what we want.
            // TODO: Check if there is a race condition where we might end up fetching variables before the 
            // code is executed. I don't think this is the case because the kernel runs in one thread I believe.
            // TODO: Eventually we should create a document manager listener so if the user uploads a new file
            // to jupyter, we can update the available files even if they have not executed a kernel message.
            if (msg.header.msg_type === 'execute_input') {

                void fetchVariablesAndUpdateState(notebookPanel, this.updateNotebookVariables.bind(this, notebookPanel.id));

                const updatedFiles = await getFiles(app, notebookPanel);
                this.updateNotebookFiles(notebookPanel.id, updatedFiles);
            }
        });
    }

    // Setup kernel execution listener
    private setupKernelListener(app: JupyterFrontEnd, notebookTracker: INotebookTracker): void {

        // Start the kernel listener for the currently active notebook
        const notebookPanel = notebookTracker.currentWidget;
        void this._startKernelListener(app, notebookPanel);

        // Update the kernel listener whenever the active notebook changes
        notebookTracker.currentChanged.connect(async (_, notebookPanel) => {
            void this._startKernelListener(app, notebookPanel);
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