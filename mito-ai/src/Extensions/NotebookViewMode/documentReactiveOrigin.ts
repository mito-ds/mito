/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * “Origin” for a widget interaction is the **code cell** whose output is the home of
 * the UI (the cell that `display`’d / returned the `VBox` / slider, etc.). Child
 * widgets have their own `comm_id` but must still map to **that same cell** so the
 * runner skips only the defining cell while refreshing below. Resolution: serialized
 * outputs first, then a live Lumino walk under each cell’s `OutputArea` — ipywidgets
 * expose `model_id` on the Backbone view attached as `_view`, not on the bare Lumino
 * widget (see `luminoWidgetBoundModelId`).
 */

import { CodeCell } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';
import * as nbformat from '@jupyterlab/nbformat';
import { PanelLayout, Widget } from '@lumino/widgets';

const WIDGET_VIEW_MIME = 'application/vnd.jupyter.widget-view+json';

function outputListMentionsModelId(
  outputs: nbformat.IOutput[],
  modelId: string
): boolean {
  for (const output of outputs) {
    if (
      output.output_type !== 'display_data' &&
      output.output_type !== 'execute_result'
    ) {
      continue;
    }
    const data = output.data as Record<string, unknown> | undefined;
    if (!data) {
      continue;
    }
    const view = data[WIDGET_VIEW_MIME];
    if (
      view &&
      typeof view === 'object' &&
      (view as { model_id?: string }).model_id === modelId
    ) {
      return true;
    }
  }
  return false;
}

/**
 * True if `modelId` appears anywhere in serialized output payloads (e.g. nested
 * models inside `application/vnd.jupyter.widget-state+json` when the root is a
 * VBox). Child widgets' comm_ids match these ids even though they are not the
 * top-level `widget-view+json` model_id.
 */
function outputDataBlobMentionsModelId(
  outputs: nbformat.IOutput[],
  modelId: string
): boolean {
  for (const output of outputs) {
    if (
      output.output_type !== 'display_data' &&
      output.output_type !== 'execute_result'
    ) {
      continue;
    }
    const data = output.data as Record<string, unknown> | undefined;
    if (!data) {
      continue;
    }
    for (const [key, value] of Object.entries(data)) {
      if (!key.includes('widget') && !key.includes('jupyter')) {
        continue;
      }
      try {
        if (typeof value === 'string' && value.includes(modelId)) {
          return true;
        }
        if (value !== undefined && JSON.stringify(value).includes(modelId)) {
          return true;
        }
      } catch {
        // Skip non-serializable blobs
      }
    }
  }
  return false;
}

function cellSerializedOutputsMentionModelId(
  outputs: nbformat.IOutput[],
  modelId: string
): boolean {
  return (
    outputListMentionsModelId(outputs, modelId) ||
    outputDataBlobMentionsModelId(outputs, modelId)
  );
}

/**
 * Best-effort widget model id on a live Lumino `Widget` under an `OutputArea`.
 * - ipywidgets: `JupyterLuminoWidget` / `JupyterLuminoPanelWidget` expose the Backbone
 *   view as `_view`; `model_id` is on `_view.model` (not on `Widget.model`).
 * - `model` on the Lumino widget is a rare fallback for other renderers / tests.
 */
function luminoWidgetBoundModelId(widget: Widget): string | undefined {
  const w = widget as unknown as {
    _view?: { model?: { model_id?: string } };
    model?: { model_id?: string };
  };
  return w._view?.model?.model_id ?? w.model?.model_id;
}

/**
 * Depth-first walk: nested controls (e.g. `IntSlider` inside `VBox`) live under a
 * root output widget with `PanelLayout` children; the root’s `comm_id` is not the
 * child’s, so we must recurse — a flat single-widget check is not enough.
 */
function luminoSubtreeMentionsWidgetModelId(widget: Widget, modelId: string): boolean {
  if (luminoWidgetBoundModelId(widget) === modelId) {
    return true;
  }
  const layout = widget.layout;
  if (layout instanceof PanelLayout) {
    for (const child of layout.widgets) {
      if (luminoSubtreeMentionsWidgetModelId(child, modelId)) {
        return true;
      }
    }
  }
  return false;
}

function liveCodeCellOutputMentionsModelId(
  cell: CodeCell,
  modelId: string
): boolean {
  const outputArea = cell.outputArea;
  if (!outputArea || outputArea.isDisposed) {
    return false;
  }
  for (const w of outputArea.widgets) {
    if (luminoSubtreeMentionsWidgetModelId(w, modelId)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the notebook index of the code cell that "owns" the widget model `modelId`:
 * - top-level match on `application/vnd.jupyter.widget-view+json`, or
 * - nested models referenced in widget-related output MIME data (e.g. VBox children in
 *   `application/vnd.jupyter.widget-state+json`), or
 * - a live walk of rendered output widgets (ipywidgets `model.model_id` on the view
 *   bridged by `JupyterLuminoWidget` as `_view.model`).
 *
 * ipywidgets uses the same id as the shell comm channel's `comm_id` for that widget.
 */
export function findCodeCellIndexForWidgetModelId(
  notebook: Notebook,
  modelId: string
): number | null {
  for (let i = 0; i < notebook.widgets.length; i++) {
    const cell = notebook.widgets[i];
    if (!cell || cell.model.type !== 'code') {
      continue;
    }
    const outputs = (cell as CodeCell).model.outputs.toJSON();
    if (cellSerializedOutputsMentionModelId(outputs, modelId)) {
      return i;
    }
  }
  for (let i = 0; i < notebook.widgets.length; i++) {
    const cell = notebook.widgets[i];
    if (!cell || cell.model.type !== 'code') {
      continue;
    }
    if (liveCodeCellOutputMentionsModelId(cell as CodeCell, modelId)) {
      return i;
    }
  }
  return null;
}

/**
 * Returns the index of the notebook cell widget whose DOM node contains `target`.
 */
export function findNotebookCellIndexContainingDomNode(
  notebook: Notebook,
  target: EventTarget | null
): number | null {
  if (!target || !(target as Node).nodeType) {
    return null;
  }
  const node = target as Node;
  const cell = notebook.widgets.find((w) => w.node.contains(node));
  if (!cell) {
    return null;
  }
  return notebook.widgets.indexOf(cell);
}
