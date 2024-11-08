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


interface ICodeBlockProps {
    code: string
    role: 'user' | 'assistant'
    rendermime: IRenderMimeRegistry
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
    isLastAiMessage: boolean,
    operatingSystem: OperatingSystem,
    setDisplayCodeDiff: React.Dispatch<React.SetStateAction<UnifiedDiffLine[] | undefined>>;
    acceptAICode: () => void,
    rejectAICode: () => void
}

const CodeBlock: React.FC<ICodeBlockProps> = ({
    code,
    role,
    rendermime,
    notebookTracker,
    app,
    code,
    role,
    rendermime,
    notebookTracker,
    app,
    isLastAiMessage,
    operatingSystem,
    setDisplayCodeDiff,
    acceptAICode,
    rejectAICode
}): JSX.Element => {

    console.log("Input >>>>>>>> \n", code);


    const notebookName = getNotebookName(notebookTracker)

    const copyCodeToClipboard = () => {
        const codeWithoutMarkdown = removeMarkdownCodeFormatting(code)
        navigator.clipboard.writeText(codeWithoutMarkdown)
    }

    if (role === 'user') {
        console.log("User code: ", code);
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
        console.log("Assitant code: ", code);
        return (
            <div className='code-message-part-container'>
                <div className='code-message-part-toolbar'>
                    <div className='code-location'>
                        {notebookName}
                    </div>
                    {isLastAiMessage && (
                        <>
                            <button onClick={() => { acceptAICode() }}>
                                Apply {operatingSystem === 'mac' ? 'CMD+Y' : 'CTRL+Y'}
                            </button>
                            <button onClick={() => { rejectAICode() }}>
                                Deny {operatingSystem === 'mac' ? 'CMD+D' : 'CTRL+D'}
                            </button>
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