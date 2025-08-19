/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import PythonCode from './PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classNames } from '../../../utils/classNames';
import '../../../../style/CodeBlock.css'
import '../../../../style/AgentComponentHeader.css'
import { CodeReviewStatus } from '../ChatTaskpane';
import CodeIcon from '../../../icons/CodeIcon';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';
import CodeBlockToolbar from './CodeBlockToolbar';
import AgentComponentHeader from '../../../components/AgentComponents/AgentComponentHeader';

interface IAssistantCodeBlockProps {
    code: string;
    codeSummary: string | undefined;
    isCodeComplete: boolean;
    renderMimeRegistry: IRenderMimeRegistry;
    previewAICode: () => void;
    acceptAICode: () => void;
    rejectAICode: () => void;
    isLastAiMessage: boolean;
    codeReviewStatus: CodeReviewStatus;
    agentModeEnabled: boolean;
    isErrorFixup?: boolean;
    isRunAllCells?: boolean;
}

const AssistantCodeBlock: React.FC<IAssistantCodeBlockProps> = ({
    code,
    codeSummary,
    isCodeComplete,
    renderMimeRegistry,
    previewAICode,
    acceptAICode,
    rejectAICode,
    isLastAiMessage,
    codeReviewStatus,
    agentModeEnabled,
    isErrorFixup,
    isRunAllCells
}) => {
    const [isCodeExpanded, setIsCodeExpanded] = useState(false);
    const shouldShowToolbar = isLastAiMessage || isCodeComplete;

    if (agentModeEnabled) {
        // Handle run_all_cells display
        if (isRunAllCells) {
            return (
                <div className={classNames('code-block-container', 'agent-mode')}>
                    <AgentComponentHeader
                        icon={<PlayButtonIcon />}
                        text={codeSummary ?? 'Running all cells in the notebook'}
                        onClick={() => {}} // No expand/collapse for run_all_cells
                        isExpanded={false}
                        displayBorder={!isErrorFixup}
                        className={isErrorFixup ? 'error-fixup' : undefined}
                    />
                </div>
            );
        }

        // Handle regular code blocks
        return (
            <div className={classNames('code-block-container', 'agent-mode', {
                'agent-mode-collapsed': !isCodeExpanded,
            })}>
                <AgentComponentHeader
                    icon={<CodeIcon />}
                    text={codeSummary ?? 'Generated code'}
                    onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                    isExpanded={isCodeExpanded}
                    displayBorder={!isErrorFixup}
                    className={isErrorFixup ? 'error-fixup' : undefined}
                />
                {isCodeExpanded && (
                    <PythonCode
                        code={code}
                        renderMimeRegistry={renderMimeRegistry}
                    />
                )}
            </div>
        );
    } else {
        return (
            <div className="code-block-container">
                {shouldShowToolbar && (
                    <CodeBlockToolbar
                        code={code}
                        isLastAiMessage={isLastAiMessage}
                        codeReviewStatus={codeReviewStatus}
                        onPreview={previewAICode}
                        onAccept={acceptAICode}
                        onReject={rejectAICode}
                    />
                )}
                <PythonCode
                    code={code}
                    renderMimeRegistry={renderMimeRegistry}
                />
            </div>
        );
    }
};

export default AssistantCodeBlock;