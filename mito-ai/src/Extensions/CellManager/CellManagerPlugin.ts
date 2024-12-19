import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Signal } from '@lumino/signaling';
import { Token } from '@lumino/coreutils';

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
        console.log("CellManager constructor");
        this._notebookTracker = notebookTracker;
        console.log(1)
        notebookTracker.activeCellChanged.connect(this._onActiveCellChanged, this);
        console.log(2)
    }

    get activeCellID(): string | null {
        console.log("CellManager get activeCellID");
        console.log(9)
        return this._activeCellID;
        console.log(10)
    }

    private _onActiveCellChanged(): void {
        console.log("CellManager _onActiveCellChanged");
        const activeCell = this._notebookTracker.activeCell;
        console.log(3)
        const newActiveCellID = activeCell ? activeCell.model.id : null;
        console.log(4)
        if (newActiveCellID !== this._activeCellID) {
            console.log(5)
            this._activeCellID = newActiveCellID;
            console.log(6)
            this.activeCellChanged.emit(this._activeCellID);
            console.log(7)
        }
        console.log(8)
    }
}

export const CellManagerPlugin: JupyterFrontEndPlugin<ICellManager> = {
    id: 'mito-ai:cell-manager',
    autoStart: true,
    requires: [INotebookTracker],
    provides: ICellManagerTracker,
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker): ICellManager => {
        console.log("CellManagerPlugin activate");
        return new CellManager(notebookTracker);
    }
};

export default CellManagerPlugin;
