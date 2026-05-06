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
    private initializedNotebookPanels: WeakSet<NotebookPanel> = new WeakSet();
    private dirtyNotebooks: Set<string> = new Set();

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

        // Avoid registering duplicate listeners when the same notebook panel becomes active again.
        if (this.initializedNotebookPanels.has(notebookPanel)) {
            return;
        }
        this.initializedNotebookPanels.add(notebookPanel);
    
        // Listen for kernel status changes:
        //  - On restart/terminate/unknown: clear variables for this notebook
        //  - On idle: if the notebook has been marked dirty by a recent execute_input,
        //    refresh variables and files once and clear the dirty flag. This batches
        //    context refreshes so that "Run All" produces a single refresh after the
        //    execution queue drains, rather than one refresh per executed cell.
        notebookPanel.context.sessionContext.statusChanged.connect(async (sender, status) => {
            if (status === 'restarting' || status === 'terminating' || status === 'unknown') {
                // Clear the variables for this specific notebook, but don't clear the files
                // as they have not changed.
                this.updateNotebookVariables(notebookPanel.id, []); // Clear variables for this specific notebook
                this.dirtyNotebooks.delete(notebookPanel.id);
                return;
            }

            if (status === 'idle' && this.dirtyNotebooks.has(notebookPanel.id)) {
                // Clear the flag before fetching so concurrent execute_inputs that arrive
                // during the fetch will re-mark the notebook dirty and trigger another
                // refresh on the next idle.
                this.dirtyNotebooks.delete(notebookPanel.id);

                void fetchVariablesAndUpdateState(notebookPanel, this.updateNotebookVariables.bind(this, notebookPanel.id));

                const updatedFiles = await getFiles(app, notebookPanel);
                this.updateNotebookFiles(notebookPanel.id, updatedFiles);
            }
        });

        // Listen to kernel messages
        notebookPanel.context.sessionContext.iopubMessage.connect((sender, msg: KernelMessage.IMessage) => {
            // Watch for execute_input messages, which indicate a request to execute code.
            // Previously we fetched variables synchronously here, but that issued an extra
            // kernel.requestExecute per executed cell, inflating the kernel queue (e.g. "Run All"
            // on a 37-cell notebook produced ~74 executions). Instead, mark the notebook
            // context as dirty and defer the actual refresh until the kernel returns to idle
            // (handled in the statusChanged listener above).
            if (msg.header.msg_type === 'execute_input') {
                this.dirtyNotebooks.add(notebookPanel.id);
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
