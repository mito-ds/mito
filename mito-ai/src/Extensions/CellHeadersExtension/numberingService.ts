/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { Signal, ISignal } from '@lumino/signaling';

/**
 * Simplified numbering service for CSS-based cell headers.
 * CSS counters handle all the numbering automatically!
 */
export class CellNumberingService {
  private _notebooks = new Map<NotebookPanel, boolean>();
  private _updateRequested = new Signal<this, NotebookPanel>(this);

  get updateRequested(): ISignal<this, NotebookPanel> {
    return this._updateRequested;
  }

  public registerNotebook(notebook: NotebookPanel): void {
    try {
      if (this._notebooks.has(notebook)) return;

      // Track the notebook
      this._notebooks.set(notebook, true);

      // CSS handles all numbering, but we can still listen for changes
      // in case we need to do other things in the future
      const content = notebook.content;
      if (content?.model?.cells) {
        content.model.cells.changed.connect(this._onCellsChanged, this);
      }

      console.log('CSS-based cell numbering registered for notebook');
    } catch (error) {
      console.warn('Failed to register notebook with numbering service:', error);
    }
  }

  public unregisterNotebook(notebook: NotebookPanel): void {
    try {
      if (!this._notebooks.has(notebook)) return;

      this._notebooks.delete(notebook);
      
      const content = notebook.content;
      if (content?.model?.cells) {
        content.model.cells.changed.disconnect(this._onCellsChanged, this);
      }
    } catch (error) {
      console.warn('Failed to unregister notebook from numbering service:', error);
    }
  }

  public updateCellNumbers(notebook: NotebookPanel): void {
    try {
      // CSS counters handle numbering automatically!
      // This method exists for API compatibility but doesn't need to do anything
      this._updateRequested.emit(notebook);
    } catch (error) {
      console.warn('CSS numbering update requested:', error);
    }
  }

  private _onCellsChanged = (): void => {
    // CSS counters automatically update when cells are added/removed/reordered
    // No manual intervention needed!
  };

  private _clearAllNumbers(notebook: NotebookPanel): void {
    // CSS counters handle clearing automatically
    // This method exists for API compatibility
  }
}