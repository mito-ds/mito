import React, { useState } from 'react';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import { JupyterFrontEnd } from '@jupyterlab/application';

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
        </div>
    );
};

export default AgentComponent;