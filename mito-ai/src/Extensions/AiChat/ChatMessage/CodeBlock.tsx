import React from 'react';
import PythonCode from './PythonCode';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getNotebookName } from '../../../utils/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { removeMarkdownCodeFormatting } from '../../../utils/strings';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import '../../../../style/CodeMessagePart.css'
import { UnifiedDiffLine } from '../../../utils/codeDiff';
import { CodeReviewStatus } from '../ChatTaskpane';


interface ICodeBlockProps {
    code: string,
    codeCellID: string | undefined,
    role: 'user' | 'assistant'
    rendermime: IRenderMimeRegistry
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
    rendermime,
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

    const copyCodeToClipboard = () => {
        const codeWithoutMarkdown = removeMarkdownCodeFormatting(code)
        navigator.clipboard.writeText(codeWithoutMarkdown)
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
                    {isLastAiMessage && codeCellID !== undefined && (
                        <>
                            {codeReviewStatus === 'chatPreview' && (
                                <button onClick={() => { previewAICode() }}>Preview Code in Notebook</button>
                            )}

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
                        </>
                    )}
                    <button onClick={copyCodeToClipboard}>Copy</button>
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

export default CodeBlock