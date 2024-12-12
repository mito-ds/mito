import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../../../style/ChatTaskpane.css';
import { INotebookTracker } from '@jupyterlab/notebook';
import { writeCodeToCellByID, getCellCodeByID, highlightCodeCell } from '../../utils/notebook';
import ChatMessage from './ChatMessage/ChatMessage';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ChatHistoryManager } from './ChatHistoryManager';
import { IVariableManager } from '../VariableManager/VariableManagerPlugin';
import LoadingDots from '../../components/LoadingDots';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getCodeBlockFromMessage, removeMarkdownCodeFormatting } from '../../utils/strings';
import { 
    COMMAND_MITO_AI_PREVIEW_LATEST_CODE, 
    COMMAND_MITO_AI_APPLY_LATEST_CODE, 
    COMMAND_MITO_AI_REJECT_LATEST_CODE, 
    COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE, 
    COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE 
} from '../../commands';
import { ReadonlyPartialJSONObject, UUID } from '@lumino/coreutils';
import ResetIcon from '../../icons/ResetIcon';
import IconButton from '../../components/IconButton';
import { OperatingSystem } from '../../utils/user';
import { getCodeDiffsAndUnifiedCodeString, UnifiedDiffLine } from '../../utils/codeDiff';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeCell } from '@jupyterlab/cells';
import { StateEffect, Compartment } from '@codemirror/state';
import { codeDiffStripesExtension } from './CodeDiffDisplay';
import OpenAI from "openai";
import ChatInput from './ChatMessage/ChatInput';
import SupportIcon from '../../icons/SupportIcon';
import type { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';

const getDefaultChatHistoryManager = (notebookTracker: INotebookTracker, variableManager: IVariableManager): ChatHistoryManager => {

    const chatHistoryManager = new ChatHistoryManager(variableManager, notebookTracker)
    chatHistoryManager.addSystemMessage('You are an expert Python programmer.')
    return chatHistoryManager
}

interface IChatTaskpaneProps {
    notebookTracker: INotebookTracker
    rendermime: IRenderMimeRegistry
    variableManager: IVariableManager
    app: JupyterFrontEnd
    operatingSystem: OperatingSystem
    websocketClient: CompletionWebsocketClient;
}

export type CodeReviewStatus = 'chatPreview' | 'codeCellPreview' | 'applied'

const ChatTaskpane: React.FC<IChatTaskpaneProps> = ({
    notebookTracker,
    rendermime,
    variableManager,
    app,
    operatingSystem,
    websocketClient
}) => {
    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(() => getDefaultChatHistoryManager(notebookTracker, variableManager));
    const chatHistoryManagerRef = useRef<ChatHistoryManager>(chatHistoryManager);

    const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false)

    const [unifiedDiffLines, setUnifiedDiffLines] = useState<UnifiedDiffLine[] | undefined>(undefined)
    const originalCodeBeforeDiff = useRef<string | undefined>(undefined)

    // Three possible states:
    // 1. chatPreview: state where the user has not yet pressed the apply button.
    // 2. codeCellPreview: state where the user is seeing the code diffs and deciding how they want to respond.
    // 3. applied: state where the user has applied the code to the code cell
    const [codeReviewStatus, setCodeReviewStatus] = useState<CodeReviewStatus>('chatPreview')

    // Add this ref for the chat messages container
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Check that the websocket client is ready
      // and display the error if it is not.
      websocketClient.ready.catch(error => {
        const newChatHistoryManager = getDefaultChatHistoryManager(
          notebookTracker,
          variableManager
        );
        newChatHistoryManager.addAIMessageFromResponse(
          (error as any).hint ? (error as any).hint : `${error}`,
          'chat',
          true
        );
        setChatHistoryManager(newChatHistoryManager);
      });
    }, [websocketClient]);

    useEffect(() => {
        /* 
            Why we use a ref (chatHistoryManagerRef) instead of directly accessing the state (chatHistoryManager):

            The reason we use a ref here is because the function `applyLatestCode` is registered once 
            when the component mounts via `app.commands.addCommand`. If we directly used `chatHistoryManager`
            in the command's execute function, it would "freeze" the state at the time of the registration 
            and wouldn't update as the state changes over time.

            React's state (`useState`) is asynchronous, and the registered command won't automatically pick up the 
            updated state unless the command is re-registered every time the state changes, which would require 
            unregistering and re-registering the command, causing unnecessary complexity.

            By using a ref (`chatHistoryManagerRef`), we are able to keep a persistent reference to the 
            latest version of `chatHistoryManager`, which is updated in this effect whenever the state 
            changes. This allows us to always access the most recent state of `chatHistoryManager` in the 
            `applyLatestCode` function, without needing to re-register the command or cause unnecessary re-renders.

            We still use `useState` for `chatHistoryManager` so that we can trigger a re-render of the chat
            when the state changes.
        */
        chatHistoryManagerRef.current = chatHistoryManager;
    }, [chatHistoryManager]);
    

    const getDuplicateChatHistoryManager = () => {

        /*
            We use getDuplicateChatHistoryManager() instead of directly accessing the state variable because 
            the COMMAND_MITO_AI_SEND_MESSAGE is registered in a useEffect on initial render, which
            would otherwise always use the initial state values. By using a function, we ensure we always
            get the most recent chat history, even when the command is executed later.        
        */
        return chatHistoryManagerRef.current.createDuplicateChatHistoryManager()
    }

    /* 
        Send a message with a specific input, clearing what is currently in the chat input.
        This is useful when we want to send the error message from the MIME renderer directly
        to the AI chat.
    */
    const sendDebugErrorMessage = async (errorMessage: string) => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Clear the chat history, and add the new error message
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, variableManager)
        newChatHistoryManager.addDebugErrorMessage(errorMessage)
        setChatHistoryManager(newChatHistoryManager)

        // Step 2: Send the message to the AI
        await _sendMessageAndSaveResponse(newChatHistoryManager)
    }

    const sendExplainCodeMessage = async () => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Clear the chat history, and add the explain code message
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, variableManager)
        newChatHistoryManager.addExplainCodeMessage()
        setChatHistoryManager(newChatHistoryManager)
        
        // Step 2: Send the message to the AI
        await _sendMessageAndSaveResponse(newChatHistoryManager)

        // Step 3: No post processing step needed for explaining code. 
    }

    /* 
        Send whatever message is currently in the chat input
    */
    const sendChatInputMessage = async (input: string, messageIndex?: number) => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Add the user's message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        if (messageIndex !== undefined) {
            newChatHistoryManager.updateMessageAtIndex(messageIndex, input)
        } else {
            newChatHistoryManager.addChatInputMessage(input)
        }

        // Step 2: Scroll to the bottom of the chat messages container
        // Add a small delay to ensure the new message is rendered
        setTimeout(() => {
            chatMessagesRef.current?.scrollTo({
                top: chatMessagesRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);

        // Step 3: Send the message to the AI
        await _sendMessageAndSaveResponse(newChatHistoryManager)

        // Step 4: Scroll so that the top of the last AI message is visible
        setTimeout(() => {
            const aiMessages = chatMessagesRef.current?.getElementsByClassName('message message-assistant');
            if (aiMessages && aiMessages.length > 0) {
                const lastAiMessage = aiMessages[aiMessages.length - 1];
                lastAiMessage.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    const handleUpdateMessage = async (messageIndex: number, newContent: string) => {
        sendChatInputMessage(newContent, messageIndex)
    };

    const _sendMessageAndSaveResponse = async (newChatHistoryManager: ChatHistoryManager) => {
        setLoadingAIResponse(true)

        const aiOptimizedHistory = newChatHistoryManager.getAIOptimizedHistory()
        const promptType = aiOptimizedHistory[aiOptimizedHistory.length - 1]?.promptType

        try {
            await websocketClient.ready;

            const aiResponse = await websocketClient.sendMessage({
              message_id: UUID.uuid4(),
              messages: newChatHistoryManager
                .getAIOptimizedHistory()
                .map(historyItem => historyItem.message),
              type: promptType,
              stream: false
            });

            if (aiResponse.error) {
              console.error('Error calling OpenAI API:', aiResponse.error);
              newChatHistoryManager.addAIMessageFromResponse(
                aiResponse.error.hint
                  ? aiResponse.error.hint
                  : `${aiResponse.error.error_type}: ${aiResponse.error.title}`,
                promptType,
                true
              );
              setChatHistoryManager(newChatHistoryManager);
            } else {
              newChatHistoryManager.addAIMessageFromResponse(
                aiResponse.items[0].content || '',
                promptType
              );
              setChatHistoryManager(newChatHistoryManager);
            }      
        } catch (error) {
            newChatHistoryManager.addAIMessageFromResponse(
              (error as any).hint ? (error as any).hint : `${error}`,
              promptType,
              true
            );
            setChatHistoryManager(newChatHistoryManager);
            console.error('Error calling OpenAI API:', error);
        } finally {
            // Reset states to allow future messages to show the "Apply" button
            setCodeReviewStatus('chatPreview');
    
            setLoadingAIResponse(false);
        }
    }
    

    const updateCodeDiffStripes = (aiMessage: OpenAI.ChatCompletionMessageParam | undefined) => {
        if (!aiMessage) {
            return
        }

        const codeCellID = chatHistoryManager.getCodeCellIDOfMostRecentAIMessage() || ''
        const originalCellCode = getCellCodeByID(notebookTracker, codeCellID) || ''

        // Extract the code from the AI's message and then calculate the code diffs
        const aiGeneratedCode = getCodeBlockFromMessage(aiMessage);
        const aiGeneratedCodeCleaned = removeMarkdownCodeFormatting(aiGeneratedCode || '');
        const { unifiedCodeString, unifiedDiffs } = getCodeDiffsAndUnifiedCodeString(originalCellCode, aiGeneratedCodeCleaned)

        // Store the original code so that we can revert to it if the user rejects the AI's code
        originalCodeBeforeDiff.current = originalCellCode

        // Temporarily write the unified code string to the active cell so we can display
        // the code diffs to the user
        writeCodeToCellByID(notebookTracker, unifiedCodeString, codeCellID, true)
        setUnifiedDiffLines(unifiedDiffs)

        // Briefly highlight the code cell to draw the user's attention to it
        highlightCodeCell(notebookTracker, codeCellID)
    }

    const displayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()

    const previewAICode = () => {
        setCodeReviewStatus('codeCellPreview')
        updateCodeDiffStripes(chatHistoryManager.getLastAIMessage()?.message)
    }

    const acceptAICode = () => {
        const latestChatHistoryManager = chatHistoryManagerRef.current;
        const lastAIMessage = latestChatHistoryManager.getLastAIMessage()

        if (!lastAIMessage) {
            return
        }

        const aiGeneratedCode = getCodeBlockFromMessage(lastAIMessage.message);
        if (!aiGeneratedCode) {
            return
        }

        setCodeReviewStatus('applied')

        // Use the codeCellID to accept the code so the code is applied to the correct cell
        // even if the user switches cells.
        writeCodeToCellAndTurnOffDiffs(aiGeneratedCode, lastAIMessage.codeCellID)

        // Do not reset `isApplyingCode` or `codeWasAccepted` here. Once accepted, there is no need to
        // show the "Apply" button again since users can only accept the code once.
        // These states are reset in `_sendMessageAndSaveResponse`.
    }

    const rejectAICode = (focusOnCell?: boolean) => {
        const latestChatHistoryManager = chatHistoryManagerRef.current;
        const lastAIMessage = latestChatHistoryManager.getLastAIMessage()

        if (!lastAIMessage) {
            return
        }

        const originalDiffedCode = originalCodeBeforeDiff.current
        if (originalDiffedCode === undefined) {
            return
        }

        setCodeReviewStatus('chatPreview')

        writeCodeToCellAndTurnOffDiffs(originalDiffedCode, lastAIMessage.codeCellID, focusOnCell)
    }

    const writeCodeToCellAndTurnOffDiffs = (code: string, codeCellID: string | undefined, focusOnCell?: boolean) => {
        setUnifiedDiffLines(undefined)
        originalCodeBeforeDiff.current = undefined

        if (codeCellID !== undefined) {
            writeCodeToCellByID(notebookTracker, code, codeCellID, focusOnCell)
        }
    }

    const clearChatHistory = () => {
        setChatHistoryManager(getDefaultChatHistoryManager(notebookTracker, variableManager))
    }

    useEffect(() => {
        /* 
            Add a new command to the JupyterLab command registry that applies the latest AI generated code
            to the active code cell. Do this inside of the useEffect so that we only register the command
            the first time we create the chat. Registering the command when it is already created causes
            errors.
        */        
        app.commands.addCommand(COMMAND_MITO_AI_PREVIEW_LATEST_CODE, {
            execute: () => {
                previewAICode()
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_APPLY_LATEST_CODE, {
            execute: () => {
                acceptAICode()
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_REJECT_LATEST_CODE, {
            execute: () => {
                rejectAICode()
            }
        });

        /* 
            Add a new command to the JupyterLab command registry that sends the current chat message.
            We use this to automatically send the message when the user adds an error to the chat. 
        */
        app.commands.addCommand(COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE, {
            execute: (args?: ReadonlyPartialJSONObject) => {
                if (args?.input) {
                    sendDebugErrorMessage(args.input.toString())
                }
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE, {
            execute: () => {
                sendExplainCodeMessage()
            }
        });
    }, []);

    useEffect(() => {
        // Register keyboard shortcuts 
        const accelYDisposable = app.commands.addKeyBinding({
            command: codeReviewStatus === 'chatPreview' ? 
                COMMAND_MITO_AI_PREVIEW_LATEST_CODE : 
                COMMAND_MITO_AI_APPLY_LATEST_CODE,
            keys: ['Accel Y'],
            selector: 'body',
        });

        const accelDDisposable = app.commands.addKeyBinding({
            command: COMMAND_MITO_AI_REJECT_LATEST_CODE,
            keys: ['Accel D'],
            selector: 'body',
        });

        // Clean up the key bindings when the component unmounts or when codeReviewStatus changes
        // This prevents keyboard shortcuts from persisting when they shouldn't.
        return () => {
            accelYDisposable.dispose();
            accelDDisposable.dispose();
        };
    }, [codeReviewStatus]);

    // Create a WeakMap to store compartments per code cell
    const codeDiffStripesCompartments = React.useRef(new WeakMap<CodeCell, Compartment>());

    // Function to update the extensions of code cells
    const updateCodeCellsExtensions = useCallback(() => {
        const notebook = notebookTracker.currentWidget?.content;
        if (!notebook) {
            return;
        }

        const activeCellIndex = notebook.activeCellIndex

        notebook.widgets.forEach((cell, index) => {
            if (cell.model.type === 'code') {
                const isActiveCodeCell = activeCellIndex === index
                const codeCell = cell as CodeCell;
                const cmEditor = codeCell.editor as CodeMirrorEditor;
                const editorView = cmEditor?.editor;

                if (editorView) {
                    let compartment = codeDiffStripesCompartments.current.get(codeCell);

                    if (!compartment) {
                        // Create a new compartment and store it
                        compartment = new Compartment();
                        codeDiffStripesCompartments.current.set(codeCell, compartment);

                        // Apply the initial configuration
                        editorView.dispatch({
                            effects: StateEffect.appendConfig.of(
                                compartment.of(unifiedDiffLines !== undefined && isActiveCodeCell? codeDiffStripesExtension({ unifiedDiffLines: unifiedDiffLines }) : [])
                            ),
                        });
                    } else {
                        // Reconfigure the compartment
                        editorView.dispatch({
                            effects: compartment.reconfigure(
                                unifiedDiffLines !== undefined && isActiveCodeCell ? codeDiffStripesExtension({ unifiedDiffLines: unifiedDiffLines }) : []
                            ),
                        });
                    }
                } else {
                    console.log('Mito AI: editor view not found when applying code diff stripes')
                }
            }
        });
    }, [unifiedDiffLines, notebookTracker]);


    useEffect(() => {
        updateCodeCellsExtensions();
    }, [unifiedDiffLines, updateCodeCellsExtensions]);


    const lastAIMessagesIndex = chatHistoryManager.getLastAIMessageIndex()    

    return (
        <div className="chat-taskpane">
            <div className="chat-taskpane-header">
                <IconButton
                    icon={<SupportIcon />}
                    title="Get Help"
                    onClick={() => {
                        window.open('mailto:founders@sagacollab.com?subject=Mito AI Chat Support', '_blank');
                    }}
                />
                <IconButton
                    icon={<ResetIcon />}
                    title="Clear the chat history"
                    onClick={() => {clearChatHistory()}}
                />
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
                {displayOptimizedChatHistory.length <= 1 &&
                    <div className="chat-empty-message">
                        <p className="long-message">
                            Ask your personal Python expert anything! 
                            <br />
                            Hint: 
                            {[
                                " Use @ to reference variables.",
                                ` Use ${operatingSystem === 'mac' ? '⌘' : 'CTRL'} + E to chat with Mito AI.`,
                                ` Use ${operatingSystem === 'mac' ? '⌘' : 'CTRL'} + Y to preview code suggestions.`
                            ][Math.floor(Math.random() * 3)]}
                        </p>
                        <p className="short-message">
                            Ask me anything!
                        </p>
                    </div>
                }
                {displayOptimizedChatHistory.map((displayOptimizedChat, index) => {
                    return (
                        <ChatMessage
                            message={displayOptimizedChat.message}
                            codeCellID={displayOptimizedChat.codeCellID}
                            mitoAIConnectionError={displayOptimizedChat.type === 'connection error'}
                            messageIndex={index}
                            notebookTracker={notebookTracker}
                            rendermime={rendermime}
                            app={app}
                            isLastAiMessage={index === lastAIMessagesIndex}
                            operatingSystem={operatingSystem}
                            setDisplayCodeDiff={setUnifiedDiffLines}
                            previewAICode={previewAICode}
                            acceptAICode={acceptAICode}
                            rejectAICode={rejectAICode}
                            onUpdateMessage={handleUpdateMessage}
                            variableManager={variableManager}
                            codeReviewStatus={codeReviewStatus}
                        />
                    )
                }).filter(message => message !== null)}
                {loadingAIResponse &&
                    <div className="chat-loading-message">
                        Loading AI Response <LoadingDots />
                    </div>
                }
            </div>
            <div className="chat-input-container">
                <ChatInput
                    initialContent={''}
                    placeholder={displayOptimizedChatHistory.length < 2 ? "What can I help you with?" : "Follow up on the conversation"}
                    onSave={sendChatInputMessage}
                    onCancel={undefined}
                    isEditing={false}
                    variableManager={variableManager}
                />
            </div>
        </div>
    );
};

export default ChatTaskpane;