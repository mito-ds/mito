/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import PythonCode from './PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '../../../../style/CodeBlock.css'
import ExpandIcon from '../../../icons/ExpandIcon';

interface IUserCodeBlockProps {
    code: string;
    renderMimeRegistry: IRenderMimeRegistry;
    agentModeEnabled: boolean;
}

const UserCodeBlock: React.FC<IUserCodeBlockProps> = ({
    code, renderMimeRegistry, agentModeEnabled
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const numCodePreviewLines = 5;
    const isCodeExpandable = code.split('\n').length > numCodePreviewLines;
    const previewCode = code.split('\n').slice(0, numCodePreviewLines).join('\n');

    return (
        <div
            className={`code-block-container active-cell-code-block ${agentModeEnabled ? 'agent-mode' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ cursor: 'pointer' }}
        >
            <PythonCode
                code={isExpanded ? code : previewCode}
                renderMimeRegistry={renderMimeRegistry}
            />
            {isCodeExpandable && (
                <div
                    className='code-block-expand-button'
                    title={isExpanded ? "Collapse" : "Expand"}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                >
                    <ExpandIcon isExpanded={isExpanded} />
                </div>
            )}
        </div>
    );
};

export default UserCodeBlock;