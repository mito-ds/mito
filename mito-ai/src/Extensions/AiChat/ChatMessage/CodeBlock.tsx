/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
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


interface ICodeBlockProps {
    code: string,
    isCodeComplete: boolean,
    role: 'user' | 'assistant'
    renderMimeRegistry: IRenderMimeRegistry
    previewAICode: () => void
    acceptAICode: () => void
    rejectAICode: () => void
    isLastAiMessage: boolean
    codeReviewStatus: CodeReviewStatus
}

const CodeBlock: React.FC<ICodeBlockProps> = ({
    code,
    isCodeComplete,
    role,
    renderMimeRegistry,
    previewAICode,
    acceptAICode,
    rejectAICode,
    isLastAiMessage,
    codeReviewStatus,
}): JSX.Element => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (role === 'user') {

        const numCodePreviewLines = 5;
        const isCodeExpandable = code.split('\n').length > numCodePreviewLines;
        const previewCode = code.split('\n').slice(0, numCodePreviewLines).join('\n')

        return (
            <div 
                className='code-block-container active-cell-code-block' 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{cursor: 'pointer'}}
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
        )
    }

    if (role === 'assistant') {
        return (
            <div className='code-block-container'>
                <>
                    {/* The code block toolbar for the last AI message */}
                    {isLastAiMessage && isCodeComplete && 
                        <div className='code-block-toolbar'>
                            {codeReviewStatus === 'chatPreview' && 
                                <IconButton 
                                    icon={<PlayButtonIcon />}
                                    title="Overwrite Active Cell"
                                    onClick={() => {previewAICode()}}
                                />
                            }
                            {codeReviewStatus === 'codeCellPreview' && 
                                <IconButton 
                                    icon={<AcceptIcon />}
                                    title="Accept AI Generated Code"
                                    onClick={() => {acceptAICode()}}
                                    style={{color: 'var(--green-700)'}}
                                />
                            }
                            {codeReviewStatus === 'codeCellPreview' && 
                                <IconButton 
                                    icon={<RejectIcon />}
                                    title="Reject AI Generated Code"
                                    onClick={() => {rejectAICode()}}
                                    style={{color: 'var(--red-700)'}}
                                />
                            }
                            {codeReviewStatus !== 'codeCellPreview' && 
                                <IconButton
                                    icon={<CopyIcon />}
                                    title="Copy"
                                    onClick={() => {void copyToClipboard(code)}}
                                />
                            }
                        </div>
                    }
                    {/* The code block toolbar for every other AI message */}
                    {!isLastAiMessage && 
                        <div className='code-block-toolbar'>
                            <IconButton
                                icon={<CopyIcon />}
                                title="Copy"
                                onClick={() => {void copyToClipboard(code)}}
                            />
                        </div>
                    }
                </>
                <PythonCode
                    code={code}
                    renderMimeRegistry={renderMimeRegistry}
                />
            </div>
        )
    }

    return <></>
}

export default CodeBlock