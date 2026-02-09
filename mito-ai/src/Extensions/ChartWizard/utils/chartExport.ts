/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ChartWizardData } from '../ChartWizardPlugin';
import { findChartImageDataUrl } from './imageFinder';
import { saveWithFilePicker, isFileSystemAccessAvailable } from './fileSaver';
import { downloadImage } from './download';
import { ExportImageFormat } from './types';

export type ExportChartResult = { success: true } | { success: false; error: string };

export type { ExportImageFormat };

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

    if (isFileSystemAccessAvailable()) {
        try {
            await saveWithFilePicker(found.dataUrl, format);
        } catch (err) {
            if ((err as { name?: string }).name === 'AbortError') {
                return { success: true };
            }
            await downloadImage(found.dataUrl, format);
        }
    } else {
        await downloadImage(found.dataUrl, format);
    }

    return { success: true };
}
