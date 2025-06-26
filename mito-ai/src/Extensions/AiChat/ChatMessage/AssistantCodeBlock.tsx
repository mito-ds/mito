/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useMemo, useCallback } from 'react';
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

const renderAgentModeToggle = (
    isCodeExpanded: boolean,
    lineCount: number,
    onToggle: () => void
): JSX.Element => {
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

const renderLastAiMessageToolbar = (
    codeReviewStatus: CodeReviewStatus,
    code: string,
    onPreview: () => void,
    onAccept: () => void,
    onReject: () => void
): JSX.Element => {
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

const renderOtherAiMessageToolbar = (code: string): JSX.Element => {
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

    // Memoize event handlers
    const handleToggleExpanded = useCallback(() => {
        setIsCodeExpanded(!isCodeExpanded);
    }, [isCodeExpanded]);

    const handlePreviewCode = useCallback(() => {
        previewAICode();
    }, [previewAICode]);

    const handleAcceptCode = useCallback(() => {
        acceptAICode();
    }, [acceptAICode]);

    const handleRejectCode = useCallback(() => {
        rejectAICode();
    }, [rejectAICode]);

    // Memoize conditional logic
    const shouldShowToolbar = isLastAiMessage || isCodeComplete;
    const shouldShowFullToolbar = isLastAiMessage && isCodeComplete;

    const toolbarElement = useMemo(() => {
        if (!shouldShowToolbar) {
            return null;
        }

        if (shouldShowFullToolbar) {
            return renderLastAiMessageToolbar(
                codeReviewStatus,
                code,
                handlePreviewCode,
                handleAcceptCode,
                handleRejectCode
            );
        }

        return renderOtherAiMessageToolbar(code);
    }, [
        shouldShowToolbar,
        shouldShowFullToolbar,
        codeReviewStatus,
        code,
        handlePreviewCode,
        handleAcceptCode,
        handleRejectCode
    ]);

    return (
        <div
            className={`code-block-container ${agentModeEnabled ? 'agent-mode' : ''} ${agentModeEnabled && !isCodeExpanded ? 'agent-mode-collapsed' : ''}`}
        >
            {agentModeEnabled && renderAgentModeToggle(isCodeExpanded, lineCount, handleToggleExpanded)}
            {(!agentModeEnabled || isCodeExpanded) && (
                <>
                    {toolbarElement}
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