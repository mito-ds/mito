/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell } from '@jupyterlab/cells';
import { Notebook } from '@jupyterlab/notebook';
import * as nbformat from '@jupyterlab/nbformat';

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
 * Returns the notebook index of the code cell whose persisted outputs include
 * a Jupyter widget view with the given model_id (ipywidgets uses the same id
 * as the shell comm channel's comm_id for that widget).
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
    if (outputListMentionsModelId(outputs, modelId)) {
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
