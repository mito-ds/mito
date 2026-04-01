/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Bridge from mitosheet DataFrame viewer (mime renderer) → Mito AI chat additional context.
 * The Jupyter command dispatches here; ChatTaskpane registers the listener on mount.
 */
export interface DataframeViewerSelectionContextItem {
  type: 'dataframe_viewer_selection';
  value: string;
  display: string;
}

type Listener = (item: DataframeViewerSelectionContextItem) => void;

let listener: Listener | null = null;

export function registerDataframeViewerSelectionListener(
  fn: Listener
): () => void {
  listener = fn;
  return () => {
    listener = null;
  };
}

export function emitDataframeViewerSelection(
  item: DataframeViewerSelectionContextItem
): void {
  listener?.(item);
}
