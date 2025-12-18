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
import CodeBlockToolbar from './CodeBlockToolbar';
import AgentComponentHeader from '../../../components/AgentComponents/AgentComponentHeader';
import GoToCellIcon from '../../../icons/GoToCellIcon';
import { NotebookPanel } from '@jupyterlab/notebook';
import { scrollToCell, setActiveCellByIDInNotebookPanel } from '../../../utils/notebook';

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
    cellId?: string;
    notebookPanel?: NotebookPanel | null;
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
    cellId,
    notebookPanel,
}) => {
    const [isCodeExpanded, setIsCodeExpanded] = useState(false);
    const shouldShowToolbar = isLastAiMessage || isCodeComplete;

    const handleGoToCell = (e: React.MouseEvent): void => {
        e.stopPropagation();
        if (cellId && notebookPanel) {
            setActiveCellByIDInNotebookPanel(notebookPanel, cellId);
            scrollToCell(notebookPanel, cellId, undefined, 'center');
        }
    };

    const renderActionButtons = (): React.ReactNode => {
        if (!cellId || !notebookPanel) {
            return null;
        }
        return (
            <button
                className="agent-component-header-action-button"
                onClick={handleGoToCell}
                title="Go to cell"
            >
                <GoToCellIcon />
            </button>
        );
    };

    if (agentModeEnabled) {

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
                    actionButtons={renderActionButtons()}
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