import React from 'react';
import PythonCode from './PythonCode';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getNotebookName } from '../../../utils/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import '../../../../style/CodeBlock.css'
import { UnifiedDiffLine } from '../../../utils/codeDiff';
import { CodeReviewStatus } from '../ChatTaskpane';
import copyToClipboard from '../../../utils/copyToClipboard';


interface ICodeBlockProps {
    code: string,
    codeCellID: string | undefined,
    role: 'user' | 'assistant'
    renderMimeRegistry: IRenderMimeRegistry
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
    isLastAiMessage: boolean,
    operatingSystem: OperatingSystem,
    setDisplayCodeDiff: React.Dispatch<React.SetStateAction<UnifiedDiffLine[] | undefined>>;
    previewAICode: () => void,
    acceptAICode: (codeCellID: string) => void,
    rejectAICode: (codeCellID: string) => void,
    codeReviewStatus: CodeReviewStatus
}

const CodeBlock: React.FC<ICodeBlockProps> = ({
    code,
    codeCellID,
    role,
    renderMimeRegistry,
    notebookTracker,
    app,
    isLastAiMessage,
    operatingSystem,
    setDisplayCodeDiff,
    previewAICode,
    acceptAICode,
    rejectAICode,
    codeReviewStatus
}): JSX.Element => {
    const notebookName = getNotebookName(notebookTracker)

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
                    <div className='code-location'>
                        {notebookName}
                    </div>
                    {isLastAiMessage && codeCellID !== undefined && (
                        <>
                            {codeReviewStatus === 'codeCellPreview' && (
                                <>
                                    <button
                                        className='code-block-accept-button'
                                        onClick={() => { acceptAICode(codeCellID); }}
                                        title={`Accept code (${operatingSystem === 'mac' ? 'CMD+Y' : 'CTRL+Y'})`}
                                    >
                                        {operatingSystem === 'mac' ? 'Accept ⌘+Y' : 'Accept CTRL+Y'}
                                    </button>
                                    <button
                                        className='code-block-deny-button'
                                        onClick={() => { rejectAICode(codeCellID); }}
                                        title={`Deny code (${operatingSystem === 'mac' ? 'CMD+D' : 'CTRL+D'})`}
                                    >
                                        {operatingSystem === 'mac' ? 'Deny ⌘+D' : 'Deny CTRL+D'}
                                    </button>
                                </>
                            )} 
                            <button onClick={() => {copyToClipboard(code)}}>Copy</button>
                        </>
                    )}
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