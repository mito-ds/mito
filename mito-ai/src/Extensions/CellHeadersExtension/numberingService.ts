/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { Signal, ISignal } from '@lumino/signaling';
import { isEnhancedCell } from './cellFactories';

export class CellNumberingService {
  private _notebooks = new Map<NotebookPanel, boolean>();
  private _updateRequested = new Signal<this, NotebookPanel>(this);

  get updateRequested(): ISignal<this, NotebookPanel> {
    return this._updateRequested;
  }

  public registerNotebook(notebook: NotebookPanel): void {
    try {
      if (this._notebooks.has(notebook)) return;

      this._notebooks.set(notebook, true);

      // Listen for cell model changes
      if (notebook.content?.model?.cells) {
        notebook.content.model.cells.changed.connect(() => {
          this._scheduleUpdate(notebook);
        });
      }

      // Listen for notebook disposal
      notebook.disposed.connect(() => {
        this._notebooks.delete(notebook);
      });

      // Initial numbering
      this._scheduleUpdate(notebook);
    } catch (error) {
      console.warn('Failed to register notebook for cell numbering:', error);
    }
  }

  private _scheduleUpdate(notebook: NotebookPanel): void {
    try {
      // Debounce updates to avoid excessive recalculation
      setTimeout(() => {
        this.updateCellNumbers(notebook);
      }, 10);
    } catch (error) {
      console.warn('Failed to schedule cell numbering update:', error);
    }
  }

  public updateCellNumbers(notebook: NotebookPanel): void {
    try {
      if (!notebook.content?.widgets) return;

      let cellNumber = 1;
      
      // Iterate through all cells and update numbers
      for (const cell of notebook.content.widgets) {
        if (isEnhancedCell(cell)) {
          (cell as any).setCellNumber(cellNumber);
          cellNumber++;
        }
      }

      this._updateRequested.emit(notebook);
    } catch (error) {
      console.warn('Failed to update cell numbers:', error);
      // Try to clear all numbers to avoid inconsistent state
      this._clearAllNumbers(notebook);
    }
  }

  private _clearAllNumbers(notebook: NotebookPanel): void {
    try {
      if (!notebook.content?.widgets) return;
      
      for (const cell of notebook.content.widgets) {
        if (isEnhancedCell(cell)) {
          (cell as any).setCellNumber(0); // 0 means no number displayed
        }
      }
    } catch (error) {
      console.warn('Failed to clear cell numbers:', error);
    }
  }
}