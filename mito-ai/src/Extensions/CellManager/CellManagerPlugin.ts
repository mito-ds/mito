import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Signal } from '@lumino/signaling';
import { Token } from '@lumino/coreutils';

/*
    The Cell Manager is a singleton that tracks the active cell in the notebook. 

    Because we want other components to respond to changes in the active cell, we use a signal to
    broadcast a change in the active cell ID. We use a signal because the CellManager does not share the same React
    context as the other plugins, we cannot simply use a UseEffect hook to wait for updates to the 
    active cell. 
*/

export const ICellManagerTracker = new Token<ICellManager>('mito-ai/ICellManagerTracker');

export interface ICellManager {
    activeCellID: string | null;
    activeCellChanged: Signal<ICellManager, string | null>;
}

export class CellManager implements ICellManager {
    private _activeCellID: string | null = null;
    readonly activeCellChanged: Signal<ICellManager, string | null> = new Signal<ICellManager, string | null>(this);
    private _notebookTracker: INotebookTracker;

    constructor(notebookTracker: INotebookTracker) {
        this._notebookTracker = notebookTracker;

        // When the active cell changes, call the _onActiveCellChanged function
        // to update the state of the CellManager. 
        notebookTracker.activeCellChanged.connect(this._onActiveCellChanged, this);
    }

    get activeCellID(): string | null {
        return this._activeCellID;
    }

    private _onActiveCellChanged(): void {
        const activeCell = this._notebookTracker.activeCell;
        const newActiveCellID = activeCell ? activeCell.model.id : null;
        if (newActiveCellID !== this._activeCellID) {
            this._activeCellID = newActiveCellID;
            this.activeCellChanged.emit(this._activeCellID);
        }
    }
}

export const CellManagerPlugin: JupyterFrontEndPlugin<ICellManager> = {
    id: 'mito-ai:cell-manager',
    autoStart: true,
    requires: [INotebookTracker],
    provides: ICellManagerTracker,
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker): ICellManager => {
        console.log("mito-ai: CellManagerPlugin activate");
        return new CellManager(notebookTracker);
    }
};

export default CellManagerPlugin;
