/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell } from '@jupyterlab/cells';
import { ChartWizardData } from '../ChartWizardPlugin';

export type ExportChartResult = { success: true } | { success: false; error: string };

const SUGGESTED_NAME = 'chart.png';

type FindImageResult =
    | { ok: true; dataUrl: string }
    | { ok: false; error: string };

function findChartImageDataUrl(chartData: ChartWizardData): FindImageResult {
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

function fallbackDownload(dataUrl: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = SUGGESTED_NAME;
    a.click();
}

async function saveWithFilePicker(dataUrl: string): Promise<void> {
    const handle = await (window as Window & {
        showSaveFilePicker?: (options: {
            suggestedName?: string;
            types?: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
        }) => Promise<FileSystemFileHandle>;
    }).showSaveFilePicker?.({
        suggestedName: SUGGESTED_NAME,
        types: [
            {
                description: 'PNG Image',
                accept: { 'image/png': ['.png'] }
            }
        ]
    });
    if (!handle) return;
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const writable = await (handle as FileSystemFileHandle & {
        createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
    }).createWritable();
    await writable.write(blob);
    await writable.close();
}

/**
 * Exports the chart image to the user's disk. Uses File System Access API when available
 * so the user can choose the save location; otherwise triggers a download.
 *
 * @param chartData - Chart wizard data identifying the notebook panel and cell
 * @returns Result indicating success or an error message for the UI to display
 */
export async function exportChartImage(chartData: ChartWizardData): Promise<ExportChartResult> {
    const found = findChartImageDataUrl(chartData);
    if (!found.ok) return { success: false, error: found.error };

    const dataUrl = found.dataUrl;
    const fallback = (): void => fallbackDownload(dataUrl);

    if (
        'showSaveFilePicker' in window &&
        typeof (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker ===
            'function'
    ) {
        try {
            await saveWithFilePicker(dataUrl);
        } catch (err) {
            if ((err as { name?: string }).name === 'AbortError') {
                return { success: true };
            }
            fallback();
        }
    } else {
        fallback();
    }

    return { success: true };
}
