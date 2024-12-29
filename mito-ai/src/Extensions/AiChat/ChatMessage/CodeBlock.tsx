import React from 'react';
import PythonCode from './PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '../../../../style/CodeBlock.css'
import copyToClipboard from '../../../utils/copyToClipboard';
import IconButton from '../../../components/IconButton';
import CopyIcon from '../../../icons/CopyIcon';
import PlayButtonIcon from '../../../icons/PlayButtonIcon';


interface ICodeBlockProps {
    code: string,
    role: 'user' | 'assistant'
    renderMimeRegistry: IRenderMimeRegistry
    previewAICode: () => void
    isLastAiMessage: boolean
}

const CodeBlock: React.FC<ICodeBlockProps> = ({
    code,
    role,
    renderMimeRegistry,
    previewAICode,
    isLastAiMessage
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
                <div className='code-block-toolbar'>
                    {isLastAiMessage && 
                        <IconButton 
                            icon={<PlayButtonIcon />}
                            title="Overwrite Active Cell"
                            onClick={() => {previewAICode()}}
                        />
                    }
                    <IconButton
                        icon={<CopyIcon />}
                        title="Copy"
                        onClick={() => {copyToClipboard(code)}}
                    />
                </div>
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