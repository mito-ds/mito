import React, { useEffect, useState } from 'react';
import { UUID } from '@lumino/coreutils';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';

interface AgentComponentProps {
    websocketClient: CompletionWebsocketClient;
}

const AgentComponent = ({ websocketClient }: AgentComponentProps): JSX.Element => {
    // const [dataset, setDataset] = useState<string | null>(null);
    const [input, setInput] = useState<string | null>(null);
    const [actions, setActions] = useState<string[] | null>(null);
    const fileTypes = [".csv", ".xlsx", ".xls"];

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

        const response = await websocketClient.sendMessage({
            type: "agent",
            message_id: UUID.uuid4(),
            metadata: {
                input: input || ""
            },
            stream: false
        });

        // Extract actions from the response
        try {
            const content = JSON.parse(response.items[0].content);
            const actions = content.actions;
            setActions(actions);
        } catch (error) {
            console.error('Error parsing response:', error);
        }
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
            <h1>Agent</h1>
            <textarea id="prompt" placeholder="Enter your prompt here" onChange={(e) => setInput(e.target.value)}></textarea>
            <input type="file" id="fileInput" accept={fileTypes.join(',')} />
            <button onClick={handleSubmit}>Submit</button>
            
            {actions && (
                <div style={{ marginTop: '20px' }}>
                    {actions && (
                        <div>
                            <h3>Actions:</h3>
                            <ul>
                                {actions.map((action: string, index: number) => (
                                    <li key={index}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AgentComponent;