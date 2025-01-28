import React, { useEffect } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';

const ComposerComponent = (): JSX.Element => {
    const handleFileUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/mito-ai/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.file_path) {
                    console.log(data.file_path);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    useEffect(() => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
            return () => fileInput.removeEventListener('change', handleFileUpload);
        }
    }, []);

    return (
        <div>
            <h1>Composer</h1>
            <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" />
        </div>
    );
};

class ComposerWidget extends ReactWidget {
    constructor() {
        super();
        this.addClass('mito-composer');
    }

    render(): JSX.Element {
        return <ComposerComponent />;
    }
}

export default ComposerWidget;