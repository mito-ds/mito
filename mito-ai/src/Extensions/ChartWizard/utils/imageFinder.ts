/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell } from '@jupyterlab/cells';
import { ChartWizardData } from '../ChartWizardPlugin';

export type FindImageResult =
    | { ok: true; dataUrl: string }
    | { ok: false; error: string };

/**
 * Finds the chart image data URL from the notebook cell output.
 */
export function findChartImageDataUrl(chartData: ChartWizardData): FindImageResult {
    const notebookPanel = chartData.notebookTracker.find(
        (panel) => panel.id === chartData.notebookPanelId
    );
    if (!notebookPanel) {
        return { ok: false, error: 'Could not find the notebook.' };
    }

    const cellWidget = notebookPanel.content.widgets.find(
        (cell) => cell.model.id === chartData.cellId
    );
    if (!(cellWidget instanceof CodeCell)) {
        return { ok: false, error: 'Could not find the chart cell.' };
    }

    const outputNode = cellWidget.outputArea.node;
    const img = outputNode.querySelector(
        '.jp-RenderedImage img[src^="data:image"]'
    ) as HTMLImageElement | null;

    if (!img || !img.src || !img.src.startsWith('data:image')) {
        return {
            ok: false,
            error: 'No chart image found. Re-run the chart cell and try again.'
        };
    }
    return { ok: true, dataUrl: img.src };
}
