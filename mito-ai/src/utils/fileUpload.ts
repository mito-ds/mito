/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { requestAPI } from '../restAPI/utils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { Notification } from '@jupyterlab/apputils';

const CHUNKED_UPLOAD_SIZE_CUTOFF = 25 * 1024 * 1024; // 25MB cutoff for chunked uploads
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

const getNotebookDirectory = (notebookPath: string): string => {
    const lastSlashIndex = notebookPath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
        // No directory, just filename (root directory)
        return '.';
    }
    return notebookPath.substring(0, lastSlashIndex);
};

const uploadChunk = async (chunk: Blob, filename: string, chunkNumber: number, totalChunks: number, notebookDir: string): Promise<boolean> => {
    try {
        // Create FormData for chunk upload
        const formData = new FormData();
        formData.append('file', chunk, filename);
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('total_chunks', totalChunks.toString());
        formData.append('notebook_dir', notebookDir);

        // Upload chunk to backend
        const resp = await requestAPI<{
            success: boolean;
            filename?: string;
            path?: string;
            chunk_received?: boolean;
            chunk_complete?: boolean;
            chunk_number?: number;
            total_chunks?: number;
        }>('upload', {
            method: 'POST',
            body: formData
        });

        if (resp.error) {
            Notification.emit(`Upload failed: ${resp.error.message}`, "error", {
                autoClose: 5 * 1000 // 5 seconds
            });
            console.error(`Chunk ${chunkNumber} upload failed:`, resp.error.message);
            return false;
        } else if (resp.data) {
            if (resp.data.chunk_complete) {
                console.log(`All chunks uploaded successfully. File reconstructed: ${resp.data.filename}`);
            } else if (resp.data.chunk_received) {
                console.log(`Chunk ${resp.data.chunk_number}/${resp.data.total_chunks} uploaded successfully`);
            }
            return true;
        }
        return false;
    } catch (error) {
        Notification.emit(`Upload failed: ${error}`, "error", {
            autoClose: 5 * 1000 // 5 seconds
        });
        console.error(`Error uploading chunk ${chunkNumber}:`, error);
        return false;
    }
};

const handleLargeFile = async (file: File, notebookTracker: INotebookTracker, onFileUploaded: (file: File) => void): Promise<void> => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    console.log(`Splitting file into ${totalChunks} chunks of ${(CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB each`);

    // Get notebook directory path
    const notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
        console.error('No notebook is currently active');
        throw new Error('No notebook is currently active');
    }

    const notebookPath = notebookPanel.context.path;
    const notebookDir = getNotebookDirectory(notebookPath);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks}:`, {
            chunkNumber: chunkIndex + 1,
            totalChunks: totalChunks,
            chunkSize: chunk.size,
            chunkSizeMB: (chunk.size / (1024 * 1024)).toFixed(2),
            startByte: start,
            endByte: end,
            fileName: file.name,
            originalFileSize: file.size,
            originalFileSizeMB: (file.size / (1024 * 1024)).toFixed(2)
        });

        // Upload chunk to backend
        const success = await uploadChunk(
            chunk, file.name, chunkIndex + 1, totalChunks, notebookDir
        );
        if (!success) {
            console.error(`Failed to upload chunk ${chunkIndex + 1}`);
            throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
        }
    }

    console.log(`Successfully uploaded all ${totalChunks} chunks for file: ${file.name}`);

    // Notify the parent component that the file was uploaded
    onFileUploaded(file);
};

const uploadFile = async (file: File, notebookTracker: INotebookTracker, onFileUploaded: (file: File) => void): Promise<void> => {
    // Get notebook directory path
    const notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
        console.error('No notebook is currently active');
        throw new Error('No notebook is currently active');
    }

    const notebookPath = notebookPanel.context.path;
    const notebookDir = getNotebookDirectory(notebookPath);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('notebook_dir', notebookDir);

    // Upload file to backend using FormData
    const resp = await requestAPI<{ success: boolean; filename: string; path: string }>('upload', {
        method: 'POST',
        body: formData
    });

    if (resp.error) {
        Notification.emit(`Upload failed: ${resp.error.message}`, "error", {
            autoClose: 5 * 1000 // 5 seconds
        });
        console.error('Upload failed:', resp.error.message);
    } else if (resp.data) {
        console.log('File uploaded successfully:', resp.data);

        // Notify the parent component that the file was uploaded, 
        // which will update the context manager.
        onFileUploaded(file);
    }
};

export const uploadFileToBackend = async (file: File, notebookTracker: INotebookTracker, onFileUploaded: (file: File) => void): Promise<void> => {
    try {
        // Check file size and handle accordingly
        if (file.size > CHUNKED_UPLOAD_SIZE_CUTOFF) {
            console.log(`File ${file.name} is larger than 25MB (${(file.size / (1024 * 1024)).toFixed(2)}MB). Splitting into chunks...`);
            await handleLargeFile(file, notebookTracker, onFileUploaded);
        } else {
            // Upload file directly for files <= 25MB
            await uploadFile(file, notebookTracker, onFileUploaded);
        }
    } catch (error) {
        Notification.emit(`Upload failed: ${error}`, "error", {
            autoClose: 5 * 1000 // 5 seconds
        });
        console.error('Error during file upload:', error);
        throw error;
    }
};
