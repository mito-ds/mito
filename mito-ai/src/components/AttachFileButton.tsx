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

interface FileInfo {
    name: string;
    size: number;
    type: string;
    content?: string;
}

const AttachFileButton: React.FC<AttachFileButtonProps> = ({ onFileUploaded }) => {
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
        readFile(file);
    };

    const readFile = (file: File): void => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target?.result as string;
            const fileInfo: FileInfo = {
                name: file.name,
                size: file.size,
                type: file.type,
                content: content
            };
            uploadFile(fileInfo);
        };

        reader.onerror = () => {
            console.error(`Error reading file "${file.name}"`);
        };

        // Read as base64 for now
        reader.readAsDataURL(file);
    };

    const uploadFile = async (fileInfo: FileInfo): Promise<void> => {
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

            // Notify the parent component that the file was uploaded, 
            // which will update the context manager.
            onFileUploaded(fileInfo.name);
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