import React from 'react';
import PythonCode from './PythonCode';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellEditor, getNotebookName, writeCodeToActiveCell } from '../utils/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import '../../style/CodeMessagePart.css'
import { JupyterFrontEnd } from '@jupyterlab/application';


interface ICodeMessagePartProps {
    code: string
    role: 'user' | 'assistant'
    app: JupyterFrontEnd
    rendermime: IRenderMimeRegistry
    notebookTracker: INotebookTracker
}

const toggleDataDiff = (app: JupyterFrontEnd, notebookTracker: INotebookTracker, code: string) => {
    const activeCellEditor = getActiveCellEditor(notebookTracker)
    
    if (activeCellEditor) {
        app.commands.execute('code-diff:on', {
            activeCellEditor: activeCellEditor as any, // Cast to any to bypass type issue
            code: code
        });
    }
}

const CodeMessagePart: React.FC<ICodeMessagePartProps> = ({code, role, app, rendermime, notebookTracker}): JSX.Element => {
    
    const notebookName = getNotebookName(notebookTracker)

    const copyCodeToClipboard = () => {
        navigator.clipboard.writeText(code)
    }
    
    if (role === 'user') {
        return (
            <div className='code-message-part-container'>
                <PythonCode
                    code={code}
                    rendermime={rendermime}
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
                    <button onClick={() => toggleDataDiff(app, notebookTracker, code)}>Toggle Data Diff</button>
                </div>
                <PythonCode
                    code={code}
                    rendermime={rendermime}
                />
            </div>
        )
    }

    return <></>
}

export default CodeMessagePart