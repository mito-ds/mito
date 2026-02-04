/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell } from '@jupyterlab/cells';
import { ChartWizardData } from '../ChartWizardPlugin';

export type ExportChartResult = { success: true } | { success: false; error: string };

export type ExportImageFormat = 'png' | 'jpeg';

const SUGGESTED_NAMES: Record<ExportImageFormat, string> = {
    png: 'chart.png',
    jpeg: 'chart.jpg'
};

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

const JPEG_QUALITY = 1.0; // Max quality

function dataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = (): void => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
                'image/jpeg',
                JPEG_QUALITY
            );
        };
        img.onerror = (): void => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

async function fallbackDownload(dataUrl: string, format: ExportImageFormat): Promise<void> {
    const download = (url: string, filename: string): void => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };
    if (format === 'jpeg') {
        const blob = await dataUrlToJpegBlob(dataUrl);
        const url = URL.createObjectURL(blob);
        download(url, SUGGESTED_NAMES.jpeg);
        URL.revokeObjectURL(url);
    } else {
        download(dataUrl, SUGGESTED_NAMES.png);
    }
}

const FILE_PICKER_TYPES: Record<
    ExportImageFormat,
    Array<{ description: string; accept: Record<string, string[]> }>
> = {
    png: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }],
    jpeg: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }]
};

async function saveWithFilePicker(dataUrl: string, format: ExportImageFormat): Promise<void> {
    const handle = await (window as Window & {
        showSaveFilePicker?: (options: {
            suggestedName?: string;
            types?: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
        }) => Promise<FileSystemFileHandle>;
    }).showSaveFilePicker?.({
        suggestedName: SUGGESTED_NAMES[format],
        types: FILE_PICKER_TYPES[format]
    });
    if (!handle) return;
    const blob =
        format === 'jpeg'
            ? await dataUrlToJpegBlob(dataUrl)
            : await fetch(dataUrl).then((r) => r.blob());
    const writable = await (handle as FileSystemFileHandle & {
        createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
    }).createWritable();
    try {
        await writable.write(blob);
    } finally {
        await writable.close();
    }
}

/**
 * Exports the chart image to the user's disk. Uses File System Access API when available
 * so the user can choose the save location; otherwise triggers a download.
 *
 * @param chartData - Chart wizard data identifying the notebook panel and cell
 * @param format - Export format: 'png' or 'jpeg'
 * @returns Result indicating success or an error message for the UI to display
 */
export async function exportChartImage(
    chartData: ChartWizardData,
    format: ExportImageFormat = 'png'
): Promise<ExportChartResult> {
    const found = findChartImageDataUrl(chartData);
    if (!found.ok) return { success: false, error: found.error };

    const dataUrl = found.dataUrl;
    const fallback = (): Promise<void> => fallbackDownload(dataUrl, format);

    if (
        'showSaveFilePicker' in window &&
        typeof (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker ===
        'function'
    ) {
        try {
            await saveWithFilePicker(dataUrl, format);
        } catch (err) {
            if ((err as { name?: string }).name === 'AbortError') {
                return { success: true };
            }
            await fallback();
        }
    } else {
        await fallback();
    }

    return { success: true };
}
