/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef, useState } from 'react';
import IconButton from './IconButton';
import PaperClipIcon from '../icons/PaperClipIcon';
import { INotebookTracker } from '@jupyterlab/notebook';
import { uploadFileToBackend } from '../utils/fileUpload';

interface AttachFileButtonProps {
    onFileUploaded: (file: File) => void;
    notebookTracker: INotebookTracker;
}

const AttachFileButton: React.FC<AttachFileButtonProps> = ({ onFileUploaded, notebookTracker }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);


    const handleClick = (): void => {
        // Don't allow clicks if uploading
        if (isUploading) return;

        // Trigger the hidden file input
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file) return;

        // Don't allow new uploads if already uploading
        if (isUploading) return;

        setIsUploading(true);

        try {
            // Use the shared upload utility
            await uploadFileToBackend(file, notebookTracker, onFileUploaded);
        } catch (error) {
            // Error handling is already done in the utility function
        } finally {
            setIsUploading(false);
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                title={isUploading ? 'Uploading...' : 'Attach File'}
                onClick={handleClick}
                className='icon-button-hover'
                disabled={isUploading}
                style={{
                    ...(isUploading && { opacity: 0.5 }),
                    cursor: isUploading ? 'not-allowed' : 'pointer'
                }}
            />
        </div>
    );
};

export default AttachFileButton; 