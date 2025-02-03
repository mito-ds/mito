import React, { useState } from 'react';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import { JupyterFrontEnd } from '@jupyterlab/application';
import AutoResizingTextArea from '../../components/AutoResizingTextArea';

interface AgentComponentProps {
    websocketClient: CompletionWebsocketClient;
    app: JupyterFrontEnd;
}

const AgentComponent = ({ websocketClient, app }: AgentComponentProps): JSX.Element => {
    const [, setInput] = useState<string | null>(null);

    return (
        <div>
            <h1>Agent</h1>
            <textarea id="prompt" placeholder="Enter your prompt here" onChange={(e) => setInput(e.target.value)}></textarea>
            <input placeholder="Enter your CSV file path" />
            <AutoResizingTextArea
                placeholder="Enter your CSV file path"
                onChange={(value) => setInput(value)}
            />
        </div>
    );
};

export default AgentComponent;