/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Simple event emitter for notebook changes.
 * Bridges JupyterLab notebook events to React components.
 */

type CellListChangedCallback = () => void;

class NotebookEventEmitter {
  private cellListChangedListeners: Set<CellListChangedCallback> = new Set();

  /**
   * Subscribe to cellListChanged events
   * Returns an unsubscribe function
   */
  onCellListChanged(callback: CellListChangedCallback): () => void {
    this.cellListChangedListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.cellListChangedListeners.delete(callback);
    };
  }

  /**
   * Emit cellListChanged event to all subscribers
   */
  emitCellListChanged(): void {
    this.cellListChangedListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cellListChanged listener:', error);
      }
    });
  }

  /**
   * Get the number of active listeners (useful for debugging)
   */
  getListenerCount(): number {
    return this.cellListChangedListeners.size;
  }
}

// Global singleton instance
export const notebookEventEmitter = new NotebookEventEmitter();