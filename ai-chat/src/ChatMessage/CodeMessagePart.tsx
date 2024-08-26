import React from 'react';
import PythonCode from './PythonCode';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getNotebookName, writeCodeToActiveCell } from '../utils/notebook';
import '../../style/CodeMessagePart.css'


interface ICodeMessagePartProps {
    code: string
    role: 'user' | 'assistant'
    languageRegistry: IEditorLanguageRegistry
    notebookTracker: INotebookTracker
}

const CodeMessagePart: React.FC<ICodeMessagePartProps> = ({code, role, languageRegistry, notebookTracker}): JSX.Element => {
    
    const notebookName = getNotebookName(notebookTracker)

    const copyCodeToClipboard = () => {
        navigator.clipboard.writeText(code)
    }
    
    if (role === 'user') {
        return (
            <div className='code-message-part-container'>
                <PythonCode
                    code={code}
                    languageRegistry={languageRegistry}
                />
            </div>
        )
    }

    if (role === 'assistant') {
        return (
            <div className='code-message-part-container'>
                <div className='code-message-part-toolbar'>
                    <div className='code-location'>
                        {notebookName}
                    </div>
                    <button onClick={() => writeCodeToActiveCell(notebookTracker, code)}>Apply to cell</button>
                    <button onClick={copyCodeToClipboard}>Copy</button>
                </div>
                <PythonCode
                    code={code}
                    languageRegistry={languageRegistry}
                />
            </div>
        )
    }

    return <></>
}

export default CodeMessagePart