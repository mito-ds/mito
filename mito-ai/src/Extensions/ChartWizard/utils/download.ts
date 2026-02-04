/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ExportImageFormat } from './types';
import { dataUrlToBlob } from './imageConverter';

const SUGGESTED_NAMES: Record<ExportImageFormat, string> = {
    png: 'chart.png',
    jpeg: 'chart.jpg'
};

/**
 * Triggers a browser download of a URL.
 */
function triggerDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

/**
 * Downloads an image using the browser's fallback download mechanism.
 */
export async function downloadImage(
    dataUrl: string,
    format: ExportImageFormat
): Promise<void> {
    if (format === 'jpeg') {
        const blob = await dataUrlToBlob(dataUrl, format);
        const url = URL.createObjectURL(blob);
        triggerDownload(url, SUGGESTED_NAMES.jpeg);
        URL.revokeObjectURL(url);
    } else {
        triggerDownload(dataUrl, SUGGESTED_NAMES.png);
    }
}
