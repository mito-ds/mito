/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef } from 'react';
import IconButton from './IconButton';
import DatabaseOutlineIcon from '../icons/DatabaseOutlineIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';

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

    const prepareForUpload = (fileInfo: FileInfo): void => {
        // For now, just log the file info
        // This is where we would prepare the data for the upload endpoint
        console.log('File prepared for upload:', {
            filename: fileInfo.name,
            size: fileInfo.size,
            type: fileInfo.type,
            contentLength: fileInfo.content?.length || 0
        });

        // TODO: Implement actual upload logic here
        // uploadFile(fileInfo);
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
                icon={<DatabaseOutlineIcon />}
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