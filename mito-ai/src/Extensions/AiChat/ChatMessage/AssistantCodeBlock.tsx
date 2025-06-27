/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useMemo } from 'react';
import PythonCode from './PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '../../../../style/CodeBlock.css'
import copyToClipboard from '../../../utils/copyToClipboard';
import IconButton from '../../../components/IconButton';
import CopyIcon from '../../../icons/CopyIcon';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';
import { CodeReviewStatus } from '../ChatTaskpane';
import AcceptIcon from '../../../icons/AcceptIcon';
import RejectIcon from '../../../icons/RejectIcon';
import ExpandIcon from '../../../icons/ExpandIcon';
import CodeIcon from '../../../icons/CodeIcon';

interface IAssistantCodeBlockProps {
    code: string;
    isCodeComplete: boolean;
    renderMimeRegistry: IRenderMimeRegistry;
    previewAICode: () => void;
    acceptAICode: () => void;
    rejectAICode: () => void;
    isLastAiMessage: boolean;
    codeReviewStatus: CodeReviewStatus;
    agentModeEnabled: boolean;
}

interface IAgentModeToggleProps {
    isCodeExpanded: boolean;
    lineCount: number;
    onToggle: () => void;
}

interface ILastAiMessageToolbarProps {
    codeReviewStatus: CodeReviewStatus;
    code: string;
    onPreview: () => void;
    onAccept: () => void;
    onReject: () => void;
}

interface IOtherAiMessageToolbarProps {
    code: string;
}

const AgentModeToggle: React.FC<IAgentModeToggleProps> = ({
    isCodeExpanded,
    lineCount,
    onToggle
}) => {
    return (
        <div
            onClick={onToggle}
            className={`agent-mode-toggle ${isCodeExpanded ? 'expanded' : ''}`}
        >
            <span className="agent-mode-toggle-content">
                <CodeIcon />
                Generated {lineCount} lines of code
            </span>
            <ExpandIcon isExpanded={isCodeExpanded} />
        </div>
    );
};

const LastAiMessageToolbar: React.FC<ILastAiMessageToolbarProps> = ({
    codeReviewStatus,
    code,
    onPreview,
    onAccept,
    onReject
}) => {
    return (
        <div className='code-block-toolbar'>
            {codeReviewStatus === 'chatPreview' && (
                <IconButton
                    icon={<PlayButtonIcon />}
                    title="Overwrite Active Cell"
                    onClick={onPreview}
                />
            )}
            {codeReviewStatus === 'codeCellPreview' && (
                <>
                    <IconButton
                        icon={<AcceptIcon />}
                        title="Accept AI Generated Code"
                        onClick={onAccept}
                        style={{ color: 'var(--green-700)' }}
                    />
                    <IconButton
                        icon={<RejectIcon />}
                        title="Reject AI Generated Code"
                        onClick={onReject}
                        style={{ color: 'var(--red-700)' }}
                    />
                </>
            )}
            {codeReviewStatus !== 'codeCellPreview' && (
                <IconButton
                    icon={<CopyIcon />}
                    title="Copy"
                    onClick={() => { void copyToClipboard(code) }}
                />
            )}
        </div>
    );
};

const OtherAiMessageToolbar: React.FC<IOtherAiMessageToolbarProps> = ({ code }) => {
    return (
        <div className='code-block-toolbar'>
            <IconButton
                icon={<CopyIcon />}
                title="Copy"
                onClick={() => { void copyToClipboard(code) }}
            />
        </div>
    );
};

const AssistantCodeBlock: React.FC<IAssistantCodeBlockProps> = ({
    code,
    isCodeComplete,
    renderMimeRegistry,
    previewAICode,
    acceptAICode,
    rejectAICode,
    isLastAiMessage,
    codeReviewStatus,
    agentModeEnabled
}) => {
    const [isCodeExpanded, setIsCodeExpanded] = useState(false);

    // Memoize calculations
    const lineCount = useMemo(() => code.split('\n').length, [code]);

    const shouldShowToolbar = isLastAiMessage || isCodeComplete;
    const shouldShowFullToolbar = isLastAiMessage && isCodeComplete;

    return (
        <div
            className={`code-block-container ${agentModeEnabled ? 'agent-mode' : ''} ${agentModeEnabled && !isCodeExpanded ? 'agent-mode-collapsed' : ''}`}
        >
            {agentModeEnabled && (
                <AgentModeToggle
                    isCodeExpanded={isCodeExpanded}
                    lineCount={lineCount}
                    onToggle={() => setIsCodeExpanded(!isCodeExpanded)}
                />
            )}
            {(!agentModeEnabled || isCodeExpanded) && (
                <>
                    {shouldShowFullToolbar && (
                        <LastAiMessageToolbar
                            codeReviewStatus={codeReviewStatus}
                            code={code}
                            onPreview={previewAICode}
                            onAccept={acceptAICode}
                            onReject={rejectAICode}
                        />
                    )}
                    {shouldShowToolbar && !shouldShowFullToolbar && (
                        <OtherAiMessageToolbar code={code} />
                    )}
                    <PythonCode
                        code={code}
                        renderMimeRegistry={renderMimeRegistry}
                    />
                </>
            )}
        </div>
    );
};

export default AssistantCodeBlock;