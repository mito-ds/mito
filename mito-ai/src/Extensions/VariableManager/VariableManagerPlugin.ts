// src/VariableManager.ts
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { setupKernelListener, Variable } from './VariableInspector';
import { listCurrentDirectoryFiles, File } from './FileInspector';

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
        setupKernelListener(notebookTracker, this.setVariables.bind(this));
        
        // Initialize with empty array and update once files are loaded
        this._files = [];
        listCurrentDirectoryFiles(app).then(files => this.setFiles(files));
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