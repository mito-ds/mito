/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { classNames } from '../../utils/classNames';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AgentComponentHeader.css';
import '../../../style/CodeBlock.css';
import AgentComponentHeader from './AgentComponentHeader';
import NotepadIcon from '../../icons/NotepadIcon';
import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

interface ScratchpadToolUIProps {
    scratchpadCode?: string | null;
    scratchpadSummary?: string | null;
    scratchpadResult?: string;
    renderMimeRegistry: IRenderMimeRegistry;
}

const ScratchpadToolUI: React.FC<ScratchpadToolUIProps> = ({
    scratchpadCode,
    scratchpadSummary,
    scratchpadResult,
    renderMimeRegistry,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!scratchpadCode || scratchpadCode.trim() === '') {
        return null;
    }

    return (
        <div className={classNames('code-block-container', 'agent-mode', {
            'agent-mode-collapsed': !isExpanded,
        })}>
            <AgentComponentHeader
                icon={<NotepadIcon />}
                text={scratchpadSummary || "Exploration code"}
                onClick={() => setIsExpanded(!isExpanded)}
                isExpanded={isExpanded}
                displayBorder={true}
            />
            {isExpanded && (
                <>
                    <PythonCode
                        code={scratchpadCode}
                        renderMimeRegistry={renderMimeRegistry}
                    />
                    <div className="scratchpad-result">
                        {scratchpadResult ? (
                            <pre>{scratchpadResult}</pre>
                        ) : (
                            <pre className="scratchpad-result-warning">Scratchpad results not available for display</pre>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default ScratchpadToolUI;
