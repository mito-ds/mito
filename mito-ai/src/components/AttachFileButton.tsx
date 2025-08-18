/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef } from 'react';
import IconButton from './IconButton';
import PaperClipIcon from '../icons/PaperClipIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { requestAPI } from '../restAPI/utils';

interface AttachFileButtonProps {
    app: JupyterFrontEnd;
}

interface FileInfo {
    name: string;
    size: number;
    type: string;
    content?: string;
}

const AttachFileButton: React.FC<AttachFileButtonProps> = ({ app }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = (): void => {
        // Trigger the hidden file input
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file) return;

        // Read and process the file
        readAndDisplayFile(file);
    };

    const readAndDisplayFile = (file: File): void => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const fileInfo: FileInfo = {
                name: file.name,
                size: file.size,
                type: file.type,
                content: content
            };

            console.log('File selected successfully:', {
                filename: fileInfo.name,
                size: formatFileSize(fileInfo.size),
                type: fileInfo.type,
                contentLength: fileInfo.content?.length || 0
            });

            // Prepare for upload (we'll implement this later)
            prepareForUpload(fileInfo);
        };

        reader.onerror = () => {
            console.error(`Error reading file "${file.name}"`);
        };

        // Read as base64 for now
        reader.readAsDataURL(file);
    };

    const prepareForUpload = async (fileInfo: FileInfo): Promise<void> => {
        // Upload file to backend
        const uploadData = {
            filename: fileInfo.name,
            content: fileInfo.content
        };

        const resp = await requestAPI<{ success: boolean; filename: string; path: string }>('upload', {
            method: 'POST',
            body: JSON.stringify(uploadData)
        });

        if (resp.error) {
            console.error('Upload failed:', resp.error.message);
        } else if (resp.data) {
            console.log('File uploaded successfully:', resp.data);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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