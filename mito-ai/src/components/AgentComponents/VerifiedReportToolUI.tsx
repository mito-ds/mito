/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useMemo, useState } from 'react';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { classNames } from '../../utils/classNames';
import { parseVerifiedReportContent } from '../../utils/parseVerifiedReportContent';
import PythonCode from '../../Extensions/AiChat/ChatMessage/PythonCode';
import '../../../style/AgentToolUIComponent.css';
import '../../../style/AgentComponentHeader.css';
import '../../../style/CodeBlock.css';
import AgentComponentHeader from './AgentComponentHeader';
import VerifiedShieldIcon from '../../icons/VerifiedShieldIcon';

interface VerifiedReportToolUIProps {
    verifiedReportName?: string | null;
    verifiedReportResult?: string;
    renderMimeRegistry: IRenderMimeRegistry;
}

const VerifiedReportToolUI: React.FC<VerifiedReportToolUIProps> = ({
    verifiedReportName,
    verifiedReportResult,
    renderMimeRegistry,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const parsedContent = useMemo(
        () => (verifiedReportResult ? parseVerifiedReportContent(verifiedReportResult) : null),
        [verifiedReportResult]
    );

    if (!verifiedReportName || verifiedReportName.trim() === '') {
        return null;
    }

    return (
        <div className={classNames('code-block-container', 'agent-mode', {
            'agent-mode-collapsed': !isExpanded,
        })}>
            <AgentComponentHeader
                icon={<VerifiedShieldIcon />}
                text={`Searching verified snippets for ${verifiedReportName}`}
                onClick={() => setIsExpanded(!isExpanded)}
                isExpanded={isExpanded}
                displayBorder={true}
            />
            {isExpanded && (
                <div className="verified-report-tool-content">
                    {!verifiedReportResult ? (
                        <p className="verified-report-tool-empty">Verified report contents not available for display</p>
                    ) : parsedContent?.rawFallback ? (
                        <pre className="verified-report-tool-fallback">{parsedContent.rawFallback}</pre>
                    ) : (
                        <>
                            {parsedContent?.description && (
                                <div className="verified-report-tool-section">
                                    <div className="verified-report-tool-section-label">Description</div>
                                    <p className="verified-report-tool-text">{parsedContent.description}</p>
                                </div>
                            )}
                            {parsedContent?.snippets.length === 0 && !parsedContent?.description && (
                                <p className="verified-report-tool-empty">No snippets in this report.</p>
                            )}
                            {parsedContent?.snippets.map((snippet) => (
                                <div key={snippet.id} className="verified-report-tool-snippet">
                                    <div className="verified-report-tool-snippet-header">
                                        Snippet {snippet.index}
                                    </div>
                                    {snippet.comment && (
                                        <div className="verified-report-tool-field">
                                            <div className="verified-report-tool-field-label">User comment</div>
                                            <p className="verified-report-tool-text">{snippet.comment}</p>
                                        </div>
                                    )}
                                    {snippet.aiContext && (
                                        <div className="verified-report-tool-field">
                                            <div className="verified-report-tool-field-label">Context</div>
                                            <p className="verified-report-tool-text">{snippet.aiContext}</p>
                                        </div>
                                    )}
                                    {snippet.code && (
                                        <div className="verified-report-tool-code">
                                            <PythonCode
                                                code={snippet.code}
                                                renderMimeRegistry={renderMimeRegistry}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerifiedReportToolUI;
