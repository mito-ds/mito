import React from 'react';
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


interface ICodeBlockProps {
    code: string,
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
    role,
    renderMimeRegistry,
    previewAICode,
    acceptAICode,
    rejectAICode,
    isLastAiMessage,
    codeReviewStatus,
}): JSX.Element => {

    if (role === 'user') {
        return (
            <div className='code-block-container'>
                <PythonCode
                    code={code}
                    renderMimeRegistry={renderMimeRegistry}
                />
            </div>
        )
    }

    if (role === 'assistant') {
        return (
            <div className='code-block-container'>
                <>
                    {/* The code block toolbar for the last AI message */}
                    {isLastAiMessage && 
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
                                    onClick={() => {copyToClipboard(code)}}
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
                                onClick={() => {copyToClipboard(code)}}
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