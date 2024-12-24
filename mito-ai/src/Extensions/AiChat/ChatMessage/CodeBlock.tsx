import React from 'react';
import PythonCode from './PythonCode';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '../../../../style/CodeBlock.css'
import copyToClipboard from '../../../utils/copyToClipboard';


interface ICodeBlockProps {
    code: string,
    role: 'user' | 'assistant'
    renderMimeRegistry: IRenderMimeRegistry
}

const CodeBlock: React.FC<ICodeBlockProps> = ({
    code,
    role,
    renderMimeRegistry,
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
                    <button onClick={() => {copyToClipboard(code)}}>Copy</button>
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