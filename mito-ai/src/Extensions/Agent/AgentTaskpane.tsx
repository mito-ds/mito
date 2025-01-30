import React, { useEffect, useState } from 'react';
import { UUID } from '@lumino/coreutils';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {
    COMMAND_MITO_AI_SEND_CHAT_MESSAGE,
    COMMAND_MITO_AI_PREVIEW_LATEST_CODE,
    COMMAND_MITO_AI_APPLY_LATEST_CODE,
    COMMAND_MITO_AI_OPEN_CHAT,
} from '../../commands';

interface AgentComponentProps {
    websocketClient: CompletionWebsocketClient;
    app: JupyterFrontEnd;
}

const AgentComponent = ({ websocketClient, app }: AgentComponentProps): JSX.Element => {
    const [input, setInput] = useState<string | null>(null);
    const [actions, setActions] = useState<string[] | null>(null);
    const [columnSamples, setColumnSamples] = useState<Array<{ name: string, samples: string[] }>>([]);
    const [fileType, setFileType] = useState<string | null>(null);
    const fileTypes = [".csv"];

    const handleFileUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        // read the first 1024 bytes of the file
        const reader = new FileReader();
        const blob = file.slice(0, 1024);

        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').slice(0, 6); // Get header + 5 rows

            if (lines.length < 2) return; // Ensure we have at least headers and one row

            const headers = lines[0].split(',').map(h => h.trim());
            const dataRows = lines.slice(1);

            const newColumnSamples = headers.map((header, columnIndex) => ({
                name: header,
                samples: dataRows.map(row =>
                    row.split(',')[columnIndex]?.trim() || ''
                ).filter(Boolean)
            }));
            setColumnSamples(newColumnSamples);
            setFileType(file.name.split('.').pop() || null);
        };

        reader.readAsText(blob);
    }

    const handleSubmit = async () => {
        await websocketClient.ready;

        const response = await websocketClient.sendMessage({
            type: "agent",
            message_id: UUID.uuid4(),
            metadata: {
                columnSamples: columnSamples,
                input: input || "",
                fileType: fileType || ""
            },
            stream: false
        });

        // Extract actions from the response
        try {
            const content = JSON.parse(response.items[0].content);
            const actions = content.actions;
            setActions(actions);

            if (content.dependencies.length > 0) {
                // Make sure the first action is to install the dependencies
                setActions([`Install the following dependencies: ${content.dependencies.join(', ')}`, ...actions]);
            }
        } catch (error) {
            console.error('Error parsing response:', error);
        }
    }

    // const testMe = async () => {
    //     // First send the chat message
    //     await app.commands.execute(COMMAND_MITO_AI_SEND_CHAT_MESSAGE, {
    //         input: "create an array of numbers from 1 to 5"
    //     });

    //     // Wait a brief moment for the response to be processed.x
    //     // You need to have a notebook open for this to work.
    //     setTimeout(async () => {
    //         // Preview the code
    //         await app.commands.execute(COMMAND_MITO_AI_PREVIEW_LATEST_CODE);

    //         // Then apply the code
    //         await app.commands.execute(COMMAND_MITO_AI_APPLY_LATEST_CODE);
    //     }, 1000); // Adjust timeout as needed
    // }

    const executeActions = async () => {
        if (!actions) return;

        // TODO: 
        // 1. Clear the chat message histry (or start a new chat thread in the future).
        // 2. Remove the AgentTaskpane icon.

        // Open the chat taskpane
        await app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT);

        for (const action of actions) {
            // Send the action to the chat and wait for response
            const success = await app.commands.execute(COMMAND_MITO_AI_SEND_CHAT_MESSAGE, {
                input: action
            });

            if (!success) {
                console.error('Failed to send chat message:', action);
                break; // break out of the loop
            }

            // Wait for the response to be processed, then preview and apply
            await new Promise<void>((resolve) => {
                setTimeout(async () => {
                    // Preview the code
                    await app.commands.execute(COMMAND_MITO_AI_PREVIEW_LATEST_CODE);
                    // Then apply the code
                    await app.commands.execute(COMMAND_MITO_AI_APPLY_LATEST_CODE);
                    // Run the cell
                    await app.commands.execute("notebook:run-cell");
                    // Add new cell 
                    await app.commands.execute("notebook:insert-cell-below");
                    resolve();
                }, 1000);
            });
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
                    <button onClick={executeActions}>Execute Actions</button>
                </div>
            )}
        </div>
    );
};

export default AgentComponent;