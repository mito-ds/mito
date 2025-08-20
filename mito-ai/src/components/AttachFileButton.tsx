/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef } from 'react';
import IconButton from './IconButton';
import PaperClipIcon from '../icons/PaperClipIcon';
import { requestAPI } from '../restAPI/utils';

interface AttachFileButtonProps {
    onFileUploaded: (fileName: string) => void;
}

const AttachFileButton: React.FC<AttachFileButtonProps> = ({ onFileUploaded }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Constants for file handling
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
    const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks

    const handleClick = (): void => {
        // Trigger the hidden file input
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file) return;

        // Check file size and handle accordingly
        if (file.size > MAX_FILE_SIZE) {
            console.log(`File ${file.name} is larger than 100MB (${(file.size / (1024 * 1024)).toFixed(2)}MB). Splitting into chunks...`);
            void handleLargeFile(file);
        } else {
            // Upload file directly for files <= 100MB
            void uploadFile(file);
        }
    };

    const handleLargeFile = async (file: File): Promise<void> => {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        console.log(`Splitting file into ${totalChunks} chunks of ${(CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB each`);

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            
            console.log(`Chunk ${chunkIndex + 1}/${totalChunks}:`, {
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
        }

        console.log(`Finished processing ${totalChunks} chunks for file: ${file.name}`);
        
        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadFile = async (file: File): Promise<void> => {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);

        // Upload file to backend using FormData
        const resp = await requestAPI<{ success: boolean; filename: string; path: string }>('upload', {
            method: 'POST',
            body: formData
        });

        if (resp.error) {
            console.error('Upload failed:', resp.error.message);
        } else if (resp.data) {
            console.log('File uploaded successfully:', resp.data);

            // Notify the parent component that the file was uploaded, 
            // which will update the context manager.
            onFileUploaded(file.name);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="*"
            />

            {/* File upload button */}
            <IconButton
                icon={<PaperClipIcon />}
                title='Attach File'
                onClick={handleClick}
                className='icon-button-hover'
                style={{
                    height: 'var(--chat-context-button-height)'
                }}
            />
        </div>
    );
};

export default AttachFileButton; 