/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useMemo } from 'react';
import PythonCode from './PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classNames } from '../../../utils/classNames';
import '../../../../style/CodeBlock.css'
import { CodeReviewStatus } from '../ChatTaskpane';
import ExpandIcon from '../../../icons/ExpandIcon';
import CodeIcon from '../../../icons/CodeIcon';
import CodeBlockToolbar from './CodeBlockToolbar';

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
    isErrorFixup?: boolean;
}

const AssistantCodeBlock: React.FC<IAssistantCodeBlockProps> = ({
    code,
    isCodeComplete,
    renderMimeRegistry,
    previewAICode,
    acceptAICode,
    rejectAICode,
    isLastAiMessage,
    codeReviewStatus,
    agentModeEnabled,
    isErrorFixup
}) => {
    const [isCodeExpanded, setIsCodeExpanded] = useState(false);

    // Memoize calculations
    const lineCount = useMemo(() => code.split('\n').length, [code]);

    const shouldShowToolbar = isLastAiMessage || isCodeComplete;

    if (agentModeEnabled) {
        return (
            <div className={classNames('code-block-container', {
                'agent-mode': true,
                'agent-mode-collapsed': !isCodeExpanded,
            })}>
                <div
                    onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                    className={classNames('agent-mode-toggle', {
                        expanded: isCodeExpanded,
                        'error-fixup': isErrorFixup
                    })}
                >
                    <span className="agent-mode-toggle-content">
                        <CodeIcon />
                        Generated {lineCount} lines of code
                    </span>
                    <ExpandIcon isExpanded={isCodeExpanded} />
                </div>
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