import React, { useEffect, useState } from 'react';
import { UUID } from '@lumino/coreutils';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';

interface ComposerComponentProps {
    websocketClient: CompletionWebsocketClient;
}

const ComposerComponent = ({ websocketClient }: ComposerComponentProps): JSX.Element => {
    // const [dataset, setDataset] = useState<string | null>(null);
    const [input, setInput] = useState<string | null>(null);

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

    const handleSubmit = async () => {
        await websocketClient.ready;

        const aiResponse = await websocketClient.sendMessage({
            type: "composer",
            message_id: UUID.uuid4(),
            metadata: {
                input: input || ""
            },
            stream: false
        });

        console.log(aiResponse);
    }

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
            <textarea id="prompt" placeholder="Enter your prompt here" onChange={(e) => setInput(e.target.value)}></textarea>
            <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
};

export default ComposerComponent;