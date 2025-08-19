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

    const handleClick = (): void => {
        // Trigger the hidden file input
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file) return;

        // Upload file directly
        void uploadFile(file);
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