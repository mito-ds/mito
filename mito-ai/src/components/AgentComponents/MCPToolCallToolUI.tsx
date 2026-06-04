/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AgentComponentHeader.css';
import '../../../style/CodeBlock.css';
import '../../../style/MCPToolCall.css';
import AgentComponentHeader from './AgentComponentHeader';
import WrenchAndScrewdriverIcon from '../../icons/WrenchAndScrewdriverIcon';
import { MCPToolCall } from '../../websockets/completions/CompletionModels';

interface MCPToolCallToolUIProps {
    mcpToolCall: MCPToolCall;
    mcpToolResult?: string;
    mcpToolError?: string;
}

/**
 * Pretty-print a JSON-encoded string. Falls back to the raw string when it
 * isn't valid JSON (e.g. plain-text tool responses).
 */
const formatJSON = (raw: string | undefined, fallback: string): string => {
    if (!raw || raw.trim() === '') {
        return fallback;
    }
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw;
    }
};

const MCPToolCallToolUI: React.FC<MCPToolCallToolUIProps> = ({
    mcpToolCall,
    mcpToolResult,
    mcpToolError,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const formattedArgs = formatJSON(mcpToolCall.arguments, '{}');
    const formattedResult = mcpToolResult !== undefined
        ? formatJSON(mcpToolResult, mcpToolResult)
        : undefined;
    const headerText = mcpToolCall.tool_name;
    const isPending = mcpToolResult === undefined && mcpToolError === undefined;

    return (
        <div className={classNames('code-block-container', 'agent-mode', {
            'agent-mode-collapsed': !isExpanded,
        })}>
            <AgentComponentHeader
                icon={<WrenchAndScrewdriverIcon />}
                text={headerText}
                onClick={() => setIsExpanded(!isExpanded)}
                isExpanded={isExpanded}
                displayBorder={true}
            />
            {isExpanded && (
                <div className="mcp-tool-call-body">
                    <div className="mcp-tool-call-section">
                        <div className="mcp-tool-call-section-label">Request</div>
                        <pre className="mcp-tool-call-block">{formattedArgs}</pre>
                    </div>
                    <div className="mcp-tool-call-section">
                        <div className="mcp-tool-call-section-label">Response</div>
                        {mcpToolError ? (
                            <pre className="mcp-tool-call-block mcp-tool-call-error">{mcpToolError}</pre>
                        ) : formattedResult !== undefined ? (
                            <pre className="mcp-tool-call-block">{formattedResult}</pre>
                        ) : (
                            <pre className="mcp-tool-call-block mcp-tool-call-pending">
                                {isPending ? 'Waiting for response…' : 'No response returned.'}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MCPToolCallToolUI;
