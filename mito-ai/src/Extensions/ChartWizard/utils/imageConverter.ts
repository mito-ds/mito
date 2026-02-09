/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ExportImageFormat } from './types';

const JPEG_QUALITY = 1.0;

/**
 * Converts a data URL image to a JPEG blob.
 */
export function dataUrlToJpegBlob(dataUrl: string): Promise<Blob> {
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

/**
 * Converts a data URL to a blob in the specified format.
 */
export async function dataUrlToBlob(
    dataUrl: string,
    format: ExportImageFormat
): Promise<Blob> {
    if (format === 'jpeg') {
        return dataUrlToJpegBlob(dataUrl);
    }
    return fetch(dataUrl).then((r) => r.blob());
}
