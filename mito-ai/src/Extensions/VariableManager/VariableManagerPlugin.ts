// src/VariableManager.ts
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Token } from '@lumino/coreutils';
import { setupKernelListener, Variable } from './VariableInspector';
import { Signal } from '@lumino/signaling';

// The provides field in JupyterLab’s JupyterFrontEndPlugin expects a token 
// that can be used to look up the service in the dependency injection system,
// so we define a new token for the VariableManager
// TODO: Should this still be called mito-ai or something else? Do I need a new name for 
// each extension? I don't think so.
export const IVariableManager = new Token<IVariableManager>('mito-ai:IVariableManager');

export interface IVariableManager {
    variables: Variable[];
    setVariables: (newVars: Variable[]) => void;
    variablesChanged: Signal<IVariableManager, Variable[]>;
}

export class VariableManager implements IVariableManager {
    private _variables: Variable[] = [];
    readonly variablesChanged: Signal<IVariableManager, Variable[]> = new Signal<IVariableManager, Variable[]>(this);

    constructor(notebookTracker: INotebookTracker) {
        setupKernelListener(notebookTracker, this.setVariables.bind(this));
    }

    get variables(): Variable[] {
        return this._variables;
    }

    setVariables(newVars: Variable[]) {
        this._variables = newVars;
        // Emit the change event
        this.variablesChanged.emit(newVars);
    }
}

export const VariableManagerPlugin: JupyterFrontEndPlugin<IVariableManager> = {
    id: 'mito-ai:variable-manager',
    autoStart: true,
    requires: [INotebookTracker],
    provides: IVariableManager,
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker): IVariableManager => {
        return new VariableManager(notebookTracker);
    }
};

export default VariableManagerPlugin
