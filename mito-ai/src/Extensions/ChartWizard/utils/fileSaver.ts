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

const FILE_PICKER_TYPES: Record<
    ExportImageFormat,
    Array<{ description: string; accept: Record<string, string[]> }>
> = {
    png: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }],
    jpeg: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }]
};

/**
 * Checks if the File System Access API is available.
 */
export function isFileSystemAccessAvailable(): boolean {
    return (
        'showSaveFilePicker' in window &&
        typeof (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker ===
            'function'
    );
}

/**
 * Saves a blob to disk using the File System Access API.
 */
async function writeBlobToFile(blob: Blob, handle: FileSystemFileHandle): Promise<void> {
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
 * Saves an image to disk using the File System Access API.
 */
export async function saveWithFilePicker(
    dataUrl: string,
    format: ExportImageFormat
): Promise<void> {
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

    const blob = await dataUrlToBlob(dataUrl, format);
    await writeBlobToFile(blob, handle);
}
