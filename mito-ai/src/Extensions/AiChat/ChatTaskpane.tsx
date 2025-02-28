import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ReadonlyPartialJSONObject, UUID } from '@lumino/coreutils';
import { Compartment, StateEffect } from '@codemirror/state';
import OpenAI from "openai";
import React, { useEffect, useRef, useState } from 'react';

import '../../../style/button.css';
import '../../../style/ChatTaskpane.css';
import '../../../style/TextButton.css';
import ResetIcon from '../../icons/ResetIcon';
import SupportIcon from '../../icons/SupportIcon';
import ChatInput from './ChatMessage/ChatInput';
import ChatMessage from './ChatMessage/ChatMessage';
import {
    ChatHistoryManager,
    IDisplayOptimizedChatItem,
    PromptType 
} from './ChatHistoryManager';
import { codeDiffStripesExtension } from './CodeDiffDisplay';
import ToggleButton from '../../components/ToggleButton';
import IconButton from '../../components/IconButton';
import LoadingDots from '../../components/LoadingDots';
import {
    COMMAND_MITO_AI_APPLY_LATEST_CODE,
    COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE,
    COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE,
    COMMAND_MITO_AI_PREVIEW_LATEST_CODE,
    COMMAND_MITO_AI_REJECT_LATEST_CODE,
    COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE,
    COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE,
} from '../../commands';
import { getCodeDiffsAndUnifiedCodeString, UnifiedDiffLine } from '../../utils/codeDiff';
import { getActiveCellID, getCellByID, getCellCodeByID, highlightCodeCell, setActiveCellByID, writeCodeToCellByID } from '../../utils/notebook';
import { getCodeBlockFromMessage, removeMarkdownCodeFormatting } from '../../utils/strings';
import { OperatingSystem } from '../../utils/user';
import type { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import { CellUpdate, IAgentAutoErrorFixupCompletionRequest, IAgentExecutionCompletionRequest, IAgentPlanningCompletionRequest, IChatCompletionRequest, IChatMessageMetadata, ICodeExplainCompletionRequest, ICompletionRequest, IFetchHistoryCompletionRequest, ISmartDebugCompletionRequest } from '../../utils/websocket/models';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { acceptAndRunCode, retryIfExecutionError } from '../../utils/agentActions';
import { scrollToDiv } from '../../utils/scroll';
import LoadingCircle from '../../components/LoadingCircle';
import { checkForBlacklistedWords } from '../../utils/blacklistedWords';

const getDefaultChatHistoryManager = (notebookTracker: INotebookTracker, contextManager: IContextManager): ChatHistoryManager => {
    const chatHistoryManager = new ChatHistoryManager(contextManager, notebookTracker)
    chatHistoryManager.addSystemMessage('You are an expert Python programmer.')
    return chatHistoryManager
}

interface IChatTaskpaneProps {
    notebookTracker: INotebookTracker
    renderMimeRegistry: IRenderMimeRegistry
    contextManager: IContextManager
    app: JupyterFrontEnd
    operatingSystem: OperatingSystem
    websocketClient: CompletionWebsocketClient;
}

interface ICellStateBeforeDiff {
    codeCellID: string
    code: string
}

export type CodeReviewStatus = 'chatPreview' | 'codeCellPreview' | 'applied'

const ChatTaskpane: React.FC<IChatTaskpaneProps> = ({
    notebookTracker,
    renderMimeRegistry,
    contextManager,
    app,
    operatingSystem,
    websocketClient
}) => {
    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(() => getDefaultChatHistoryManager(notebookTracker, contextManager));
    const chatHistoryManagerRef = useRef<ChatHistoryManager>(chatHistoryManager);

    const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false)

    // Store the original cell before diff so that we can revert to it if the user rejects the AI's code
    const cellStateBeforeDiff = useRef<ICellStateBeforeDiff | undefined>(undefined)

    // Three possible states:
    // 1. chatPreview: state where the user has not yet pressed the apply button.
    // 2. codeCellPreview: state where the user is seeing the code diffs and deciding how they want to respond.
    // 3. applied: state where the user has applied the code to the code cell
    const [codeReviewStatus, setCodeReviewStatus] = useState<CodeReviewStatus>('chatPreview')

    // Add this ref for the chat messages container
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    const [agentModeEnabled, setAgentModeEnabled] = useState<boolean>(false)

    /* 
        Three possible states:
        1. working: the agent is working on the task
        2. stopping: the agent is stopping after it has received ai response it is waiting on
        3. idle: the agent is idle
    */
    const [agentExecutionStatus, setAgentExecutionStatus] = useState<'working' | 'stopping' | 'idle'>('idle')
    
    // We use a ref to always access the most up-to-date value during a function's execution. Refs immediately reflect changes, 
    // unlike state variables, which are captured at the beginning of a function and may not reflect updates made during execution.
    const shouldContinueAgentExecution = useRef<boolean>(true);

    const fetchInitialChatHistory = async (): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> => {
        await websocketClient.ready;

        const fetchHistoryCompletionRequest: IFetchHistoryCompletionRequest = {
            type: 'fetch_history',
            message_id: UUID.uuid4(),
            metadata: {
                promptType: 'fetch_history'
            },
            stream: false
        }
        
        const chatHistoryResponse = await websocketClient.sendMessage(fetchHistoryCompletionRequest);

        return chatHistoryResponse.items.map((item: any) => ({
            role: item.role,
            content: item.content
        }));
    };

    useEffect(() => {
        const initializeChatHistory = async () => {
            try {
                // 1. Check that the websocket client is ready
                await websocketClient.ready;

                // 2. Fetch or load the initial chat history
                const history = await fetchInitialChatHistory();

                // 3. Create a fresh ChatHistoryManager and add the initial messages
                const newChatHistoryManager = getDefaultChatHistoryManager(
                    notebookTracker,
                    contextManager
                );

                // 4. Add messages to the ChatHistoryManager
                history.forEach(item => {
                    try {
                        // If the user sent a message in agent:planning mode, the ai response will be a JSON object
                        // which we need to parse. 
                        // TODO: We need to save the full metadata in the message_history.json so we don't have to do these hacky workarounds!
                        const agentResponse = JSON.parse(item.content as string);
                        if (agentResponse.hasOwnProperty('id') && agentResponse.hasOwnProperty('code')) {
                            // If it has the cellUpdate keys then it is a cell update and we should handle it as such
                            const cellUpdate: CellUpdate = agentResponse
                            newChatHistoryManager.addAIMessageFromCellUpdate(cellUpdate)
                        } else if (agentResponse.hasOwnProperty('actions') && agentResponse.hasOwnProperty('dependencies')) {
                            handleAgentResponse(agentResponse, newChatHistoryManager);
                        } else {
                            newChatHistoryManager.addChatMessageFromHistory(item); 
                        }
                    } catch {
                        newChatHistoryManager.addChatMessageFromHistory(item);
                    }
                });

                // 5. Update the state with the new ChatHistoryManager
                setChatHistoryManager(newChatHistoryManager);
            } catch (error) {
                const newChatHistoryManager = getDefaultChatHistoryManager(
                    notebookTracker,
                    contextManager
                );
                addAIMessageFromResponseAndUpdateState(
                    (error as any).hint ? (error as any).hint : `${error}`,
                    'chat',
                    newChatHistoryManager,
                    true
                );
            }
        };

        initializeChatHistory();
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

    // Scroll to bottom whenever chat history updates
    useEffect(() => {
        scrollToDiv(chatMessagesRef);
    }, [chatHistoryManager.getDisplayOptimizedHistory().length]);


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
    const sendDebugErrorMessage = async (errorMessage: string, agent?: boolean): Promise<void> => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        const promptType = agent ? 'agent:autoErrorFixup' : 'smartDebug'

        // Step 1: Add the error message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        const smartDebugMetadata = newChatHistoryManager.addDebugErrorMessage(errorMessage, promptType)
        setChatHistoryManager(newChatHistoryManager)

        // Step 2: Send the message to the AI
        const smartDebugCompletionRequest: ISmartDebugCompletionRequest | IAgentAutoErrorFixupCompletionRequest = {
            type: promptType,
            message_id: UUID.uuid4(),
            metadata: smartDebugMetadata,
            stream: false
        }
        await _sendMessageAndSaveResponse(smartDebugCompletionRequest, newChatHistoryManager)
    }

    const sendExplainCodeMessage = async (): Promise<void> => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Clear the chat history, and add the explain code message
        const newChatHistoryManager = clearChatHistory()
        const explainCodeMetadata = newChatHistoryManager.addExplainCodeMessage()
        setChatHistoryManager(newChatHistoryManager)

        // Step 2: Send the message to the AI
        const explainCompletionRequest: ICodeExplainCompletionRequest = {
            type: 'codeExplain',
            message_id: UUID.uuid4(),
            metadata: explainCodeMetadata,
            stream: false
        }
        await _sendMessageAndSaveResponse(explainCompletionRequest, newChatHistoryManager)

        // Step 3: No post processing step needed for explaining code. 
    }

    const sendAgentExecutionMessage = async (input: string): Promise<void> => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Add the user's message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        const agentExecutionMetatada = newChatHistoryManager.addAgentExecutionMessage(input)
        setChatHistoryManager(newChatHistoryManager)


        // Step 2: Send the message to the AI
        const completionRequest: IAgentExecutionCompletionRequest = {
            type: 'agent:execution',
            message_id: UUID.uuid4(),
            metadata: agentExecutionMetatada,
            stream: false
        }
        await _sendMessageAndSaveResponse(completionRequest, newChatHistoryManager)
    }

    /* 
        Send whatever message is currently in the chat input
    */
    const sendChatInputMessage = async (input: string, messageIndex?: number): Promise<void> => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Add the user's message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        var chatMessageMetadata: IChatMessageMetadata;
        if (messageIndex !== undefined) {
            chatMessageMetadata = newChatHistoryManager.updateMessageAtIndex(messageIndex, input)
        } else {
            chatMessageMetadata = newChatHistoryManager.addChatInputMessage(input)
        }
        setChatHistoryManager(newChatHistoryManager)

        const completionRequest: IChatCompletionRequest = {
            type: 'chat',
            message_id: UUID.uuid4(),
            metadata: chatMessageMetadata,
            stream: false
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
        await _sendMessageAndSaveResponse(completionRequest, newChatHistoryManager)

        // Step 4: Scroll to the bottom of the chat smoothly
        setTimeout(() => {
            const chatContainer = chatMessagesRef.current;
            if (chatContainer) {
                chatContainer.scrollTo({
                    top: chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }

    const handleUpdateMessage = async (
        messageIndex: number,
        newContent: string,
        messageType: IDisplayOptimizedChatItem['type']
    ): Promise<void> => {
        if (messageType === 'openai message:agent:planning' && messageIndex !== 1) {
            // In agent planning mode we only update the message locally without sending it to the AI
            // because the user has not yet confirmed that they want the AI to process these messages 
            // until they hit the submit button.
            const newChatHistoryManager = getDuplicateChatHistoryManager()
            newChatHistoryManager.updateMessageAtIndex(messageIndex, newContent, true)
            setChatHistoryManager(newChatHistoryManager)
        } else if (agentModeEnabled && messageIndex === 1) {
            // If editing the original agent message, send it as a new agent message.
            await sendAgentPlanningMessage(newContent)
        } else {
            await sendChatInputMessage(newContent, messageIndex)
        }
    };

    const handleDeleteMessage = (messageIndex: number) => {
        // Get a new chat history manager
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        
        // Remove the message at the specified index
        newChatHistoryManager.removeMessageAtIndex(messageIndex)
        
        // Update the state with the new chat history
        setChatHistoryManager(newChatHistoryManager)
    }

    const sendAgentPlanningMessage = async (message: string, messageIndex?: number): Promise<void> => {
        // Step 0: Reject the previous Ai generated code if they did not accept it
        rejectAICode()

        // Step 1: Add user message to chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager()
        const agentPlanningMetadata = newChatHistoryManager.addAgentMessage(message, messageIndex)
        setChatHistoryManager(newChatHistoryManager)

        // Step 2: Send the message to the AI
        const agentPlanningCompletionRequest: IAgentPlanningCompletionRequest = {
            type: 'agent:planning',
            message_id: UUID.uuid4(),
            metadata: agentPlanningMetadata,
            stream: false
        }
        await _sendMessageAndSaveResponse(agentPlanningCompletionRequest, newChatHistoryManager)
    }

    const _sendMessageAndSaveResponse = async (completionRequest: ICompletionRequest, newChatHistoryManager: ChatHistoryManager): Promise<boolean> => {
        setLoadingAIResponse(true)

        try {
            await websocketClient.ready;

            const aiResponse = await websocketClient.sendMessage(completionRequest);

            if (aiResponse.error) {
                console.error('Error calling OpenAI API:', aiResponse.error);
                addAIMessageFromResponseAndUpdateState(
                    aiResponse.error.hint
                        ? aiResponse.error.hint
                        : `${aiResponse.error.error_type}: ${aiResponse.error.title}`,
                    completionRequest.metadata.promptType, // #TODO: Why are we storing the prompt type in the AI response?
                    newChatHistoryManager,
                    true,
                    aiResponse.error.title
                );
            } else {
                const content = aiResponse.items[0].content || '';

                if (completionRequest.metadata.promptType === 'agent:planning') {
                    // If the user is in agent mode, the ai response is a JSON object
                    // which we need to parse. 
                    const agentResponse = JSON.parse(content);
                    handleAgentResponse(agentResponse, newChatHistoryManager);
                } else if (completionRequest.metadata.promptType === 'agent:execution') {
                    // Agent:Execution prompts return a CellUpdate object that we need to parse
                    const cellUpdate: CellUpdate = JSON.parse(content)
                    newChatHistoryManager.addAIMessageFromCellUpdate(cellUpdate)
                } else {
                    // For all other prompt types, we can just add the content to the chat history
                    aiResponse.items.forEach((item: any) => {
                        newChatHistoryManager.addAIMessageFromResponse(
                            item.content || '',
                            completionRequest.metadata.promptType
                        );
                    });
                    setChatHistoryManager(newChatHistoryManager);
                }
            }
        } catch (error) {
            addAIMessageFromResponseAndUpdateState(
                (error as any).hint ? (error as any).hint : `${error}`,
                completionRequest.metadata.promptType,
                newChatHistoryManager,
                true
            )
        } finally {
            // Reset states to allow future messages to show the "Apply" button
            setCodeReviewStatus('chatPreview');

            setLoadingAIResponse(false);
        }

        return true
    }

    const addAIMessageFromResponseAndUpdateState = (
        messageContent: string,
        promptType: PromptType,
        chatHistoryManager: ChatHistoryManager,
        mitoAIConnectionError: boolean = false,
        mitoAIConnectionErrorType: string | null = null
    ) => {
        /* 
        Adds a new message to the chat history and updates the state. If we don't update the state 
        then the chat history does not update in the UI. 
        */
        chatHistoryManager.addAIMessageFromResponse(messageContent, promptType, mitoAIConnectionError, mitoAIConnectionErrorType)
        setChatHistoryManager(chatHistoryManager)
    }

    const handleAgentResponse = (
        agentResponse: { actions: string[], dependencies: string[] }, newChatHistoryManager: ChatHistoryManager
    ) => {

        addAIMessageFromResponseAndUpdateState(
            "Based on your request, I've outlined a step-by-step plan. Please review each step carefully. If you'd like to add details or make any changes, you can edit each step directly. Once everything looks good, press Go at the bottom of the task pane to proceed.",
            'chat',
            newChatHistoryManager
        )

        // If there are dependencies, we need to add them to the top of the chat history 
        if (agentResponse.dependencies.length > 0) {
            addAIMessageFromResponseAndUpdateState(
                `Install the following dependencies: ${agentResponse.dependencies.join(', ')}`,
                'agent:planning',
                newChatHistoryManager
            )
        }

        // Loop through each action in the agent response 
        // and add it to the chat history.
        agentResponse.actions.forEach((action: string, index: number) => {
            addAIMessageFromResponseAndUpdateState(
                `Step ${index + 1}: ${action}`,
                'agent:planning',
                newChatHistoryManager
            );
        });

        addAIMessageFromResponseAndUpdateState(
            "If everything looks good, use the start button at the bottom of the task pane to proceed. By doing so, you grant Mito AI permission to execute the code in this notebook.",
            'chat',
            newChatHistoryManager
        )
    }

    const markAgentForStopping = () => {
        // Signal that the agent should stop after current task
        shouldContinueAgentExecution.current = false;
        // Update UI to show stopping state
        setAgentExecutionStatus('stopping');
    }

    const finalizeAgentStop = () => {
        // Notify user that agent has been stopped
        shouldContinueAgentExecution.current = false;
        const newChatHistoryManager = getDuplicateChatHistoryManager();
        addAIMessageFromResponseAndUpdateState(
            "Agent execution stopped. You can continue the conversation or start a new one.",
            'chat',
            newChatHistoryManager
        );
        // Reset agent to idle state
        setAgentExecutionStatus('idle');
    }

    const executeAgentPlan = async () => {
        setAgentModeEnabled(false)
        setAgentExecutionStatus('working')
        // Reset the execution flag at the start of a new plan
        shouldContinueAgentExecution.current = true;

        // Get the plan from the chat history
        const plan = chatHistoryManager.getDisplayOptimizedHistory().filter(message => message.type === 'openai message:agent:planning')

        // Loop through each message in the plan and send it to the AI
        for (const agentMessage of plan) {
            // Check if we should continue execution
            if (!shouldContinueAgentExecution.current) {
                finalizeAgentStop()
                break;
            }
            
            const messageContent = agentMessage.message.content

            if (typeof messageContent !== 'string') {
                // If the message content is not a string, then we skip this message. 
                // This can happen if the agent response is a refusal.
                continue
            }

            // Send the message to the AI 
            await sendAgentExecutionMessage(messageContent)

            // Check the code generated by the AI for blacklisted words before running it
            const aiDisplayOptimizedChatItem = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem();
            if (aiDisplayOptimizedChatItem) {
                const aiGeneratedCode = getCodeBlockFromMessage(aiDisplayOptimizedChatItem.message);
                if (aiGeneratedCode) {
                    const securityCheck = checkForBlacklistedWords(aiGeneratedCode);
                    if (!securityCheck.safe) {
                        console.error('Security Warning:', securityCheck.reason);
                        addAIMessageFromResponseAndUpdateState(
                            `I cannot execute this code without your approval because this code did not pass my security checks. ${securityCheck.reason}. For your safety, I am stopping execution of this plan.`,
                            'agent:execution',
                            chatHistoryManager
                        );
                        finalizeAgentStop()
                        break;
                    }
                }
            }

            // Run the code and handle any errors
            await acceptAndRunCode(app, previewAICode, acceptAICode)
            const status = await retryIfExecutionError(
                notebookTracker,
                app,
                getDuplicateChatHistoryManager,
                addAIMessageFromResponseAndUpdateState,
                sendDebugErrorMessage,
                previewAICode,
                acceptAICode,
                shouldContinueAgentExecution,
                finalizeAgentStop
            )

            if (status === 'interupted') {
                break;
            }

            // If we were not able to run the code, break out of the loop 
            // so we don't continue to execute the plan. Instead, we encourage
            // the user to update the plan and try again. 
            // TODO: Save this message in backend also even if there is not another message sent. 
            if (status === 'failure') {
                addAIMessageFromResponseAndUpdateState(
                    "I apologize, but I was unable to fix the error after 3 attempts. You may want to try rephrasing your request or providing more context.",
                    'agent:execution',
                    chatHistoryManager
                )
                break;
            }
        }

        setAgentExecutionStatus('idle')
    }

    const updateCodeDiffStripes = (aiMessage: OpenAI.ChatCompletionMessageParam | undefined, updateCellID?: string) => {
        if (!aiMessage) {
            return
        }

        const targetCellID = updateCellID ? updateCellID : getActiveCellID(notebookTracker)
        const targetCellCode = getCellCodeByID(notebookTracker, targetCellID)

        if (targetCellID === undefined || targetCellCode === undefined) {
            return
        }

        // Extract the code from the AI's message and then calculate the code diffs
        const aiGeneratedCode = getCodeBlockFromMessage(aiMessage);
        const aiGeneratedCodeCleaned = removeMarkdownCodeFormatting(aiGeneratedCode || '');
        const { unifiedCodeString, unifiedDiffs } = getCodeDiffsAndUnifiedCodeString(targetCellCode, aiGeneratedCodeCleaned)


        // Store the code cell ID where we write the code diffs so that we can
        // accept or reject the code diffs to the correct cell
        cellStateBeforeDiff.current = { codeCellID: targetCellID, code: targetCellCode }

        // Temporarily write the unified code string to the active cell so we can display
        // the code diffs to the user
        writeCodeToCellByID(notebookTracker, unifiedCodeString, targetCellID)
        updateCodeCellsExtensions(unifiedDiffs)

        // Briefly highlight the code cell to draw the user's attention to it
        highlightCodeCell(notebookTracker, targetCellID)
    }

    const displayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()

    const previewAICode = () => {
        setCodeReviewStatus('codeCellPreview')

        const lastAIDisplayMessage = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem()
        const targetCellID = lastAIDisplayMessage?.promptType === 'agent:execution' ? lastAIDisplayMessage.codeCellID : undefined

        updateCodeDiffStripes(lastAIDisplayMessage?.message, targetCellID)
        updateCellToolbarButtons()
    }

    const acceptAICode = () => {
        const latestChatHistoryManager = chatHistoryManagerRef.current;
        const lastAIMessage = latestChatHistoryManager.getLastAIDisplayOptimizedChatItem()

        if (!lastAIMessage || !cellStateBeforeDiff.current) {
            return
        }

        const aiGeneratedCode = getCodeBlockFromMessage(lastAIMessage.message);
        if (!aiGeneratedCode) {
            return
        }

        setCodeReviewStatus('applied')

        const targetCellID = cellStateBeforeDiff.current.codeCellID
        // Write to the cell that has the code diffs
        writeCodeToCellAndTurnOffDiffs(aiGeneratedCode, targetCellID)

        // Focus on the active cell after the code is written
        const targetCell = getCellByID(notebookTracker, targetCellID)
        if (targetCell) {
            // Make the target cell the active cell
            setActiveCellByID(notebookTracker, targetCellID)
            // Focus on the active cell
            targetCell.activate();
        }
    }

    const rejectAICode = () => {
        if (cellStateBeforeDiff.current === undefined) {
            return
        }

        setCodeReviewStatus('chatPreview')
        writeCodeToCellAndTurnOffDiffs(cellStateBeforeDiff.current.code, cellStateBeforeDiff.current.codeCellID)
    }

    const writeCodeToCellAndTurnOffDiffs = (code: string, codeCellID: string | undefined) => {
        updateCodeCellsExtensions(undefined)
        cellStateBeforeDiff.current = undefined

        if (codeCellID !== undefined) {
            writeCodeToCellByID(notebookTracker, code, codeCellID)
            updateCellToolbarButtons()
        }
    }

    const clearChatHistory = () => {
        // Reset frontend chat history
        const newChatHistoryManager = getDefaultChatHistoryManager(notebookTracker, contextManager)
        setChatHistoryManager(newChatHistoryManager);

        // Notify the backend to clear the prompt history
        websocketClient.sendMessage({
            type: 'clear_history',
            message_id: UUID.uuid4(),
            metadata: {
                promptType: 'clear_history'
            },
            stream: false,
        });

        return newChatHistoryManager
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


        /* 
            Register the code cell toolbar buttons for accepting and rejecting code.
        */
        app.commands.addCommand(COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE, {
            label: `Accept ${operatingSystem === 'mac' ? '⌘Y' : 'Ctrl+Y'}`,
            className: 'text-button-mito-ai button-base button-green',
            caption: 'Accept Code',
            execute: () => { acceptAICode() },
            // We use the cellStateBeforeDiff because it contains the code cell ID that we want to write to
            // and it will only be set when the codeReviewStatus is 'codeCellPreview'
            isVisible: () => {
                try {
                    return notebookTracker.activeCell?.model.id === cellStateBeforeDiff.current?.codeCellID
                } catch (error) {
                    return false;
                }
            }
        });

        app.commands.addCommand(COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE, {
            label: `Reject ${operatingSystem === 'mac' ? '⌘U' : 'Ctrl+U'}`,
            className: 'text-button-mito-ai button-base button-red',
            caption: 'Reject Code',
            execute: () => { rejectAICode() },
            isVisible: () => {
                try {
                    return notebookTracker.activeCell?.model.id === cellStateBeforeDiff.current?.codeCellID
                } catch (error) {
                    return false;
                }
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
            keys: ['Accel U'],
            selector: 'body',
            preventDefault: true,
        });


        // Clean up the key bindings when the component unmounts or when codeReviewStatus changes
        // This prevents keyboard shortcuts from persisting when they shouldn't.
        return () => {
            accelYDisposable.dispose();
            accelDDisposable.dispose();
        };
    }, [codeReviewStatus]);

    const updateCellToolbarButtons = () => {
        // Tell Jupyter to re-evaluate if the toolbar buttons should be visible.
        // Without this, the user needs to take some action, like switching to a different cell 
        // and then switching back in order for the Jupyter to re-evaluate if it should
        // show the toolbar buttons.
        app.commands.notifyCommandChanged(COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE);
        app.commands.notifyCommandChanged(COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE);
    }

    // Create a WeakMap to store compartments per code cell
    const codeDiffStripesCompartments = React.useRef(new WeakMap<CodeCell, Compartment>());

    // Function to update the extensions of code cells
    const updateCodeCellsExtensions = ((unifiedDiffLines: UnifiedDiffLine[] | undefined) => {
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
                                compartment.of(unifiedDiffLines !== undefined && isActiveCodeCell ? codeDiffStripesExtension({ unifiedDiffLines: unifiedDiffLines }) : [])
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
    });

    const lastAIMessagesIndex = chatHistoryManager.getLastAIMessageIndex()

    return (
        <div className="chat-taskpane">
            <div className="chat-taskpane-header">
                <div className="chat-taskpane-header-buttons">
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
                        onClick={() => { clearChatHistory() }}
                    />
                </div>
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
                            promptType={displayOptimizedChat.promptType}
                            messageType={displayOptimizedChat.type}
                            codeCellID={displayOptimizedChat.codeCellID}
                            mitoAIConnectionError={displayOptimizedChat.type === 'connection error'}
                            mitoAIConnectionErrorType={displayOptimizedChat.mitoAIConnectionErrorType || null}
                            messageIndex={index}
                            notebookTracker={notebookTracker}
                            renderMimeRegistry={renderMimeRegistry}
                            app={app}
                            isLastAiMessage={index === lastAIMessagesIndex}
                            operatingSystem={operatingSystem}
                            previewAICode={previewAICode}
                            acceptAICode={acceptAICode}
                            rejectAICode={rejectAICode}
                            onUpdateMessage={handleUpdateMessage}
                            onDeleteMessage={handleDeleteMessage}
                            contextManager={contextManager}
                            codeReviewStatus={codeReviewStatus}
                        />
                    )
                }).filter(message => message !== null)}
                {loadingAIResponse &&
                    <div className="chat-loading-message">
                        Thinking <LoadingDots />
                    </div>
                }
            </div>
            {agentModeEnabled && displayOptimizedChatHistory.some(msg =>
                msg.type === 'openai message:agent:planning'
            ) ? (
                <div className="agent-controls">
                    <button
                        className="button-base button-purple agent-start-button"
                        onClick={executeAgentPlan}
                    >
                        Let's go!
                    </button>
                    <button
                        className="button-base button-red agent-cancel-button"
                        onClick={() => {
                            clearChatHistory();
                            setAgentModeEnabled(false);
                        }}
                    >
                        ✖
                    </button>
                </div>
            ) : (
                <>
                    <ChatInput
                        initialContent={''}
                        placeholder={
                            agentExecutionStatus === 'working' ? 'Agent is working...' :
                            agentExecutionStatus === 'stopping' ? 'Agent is stopping...' :
                            agentModeEnabled ? 'Ask agent to do anything' : 
                            displayOptimizedChatHistory.length < 2 ? `Ask question (${operatingSystem === 'mac' ? '⌘' : 'Ctrl'}E), @ to mention` 
                            : `Ask followup (${operatingSystem === 'mac' ? '⌘' : 'Ctrl'}E), @ to mention`
                        }
                        onSave={agentModeEnabled ? sendAgentPlanningMessage : sendChatInputMessage}
                        onCancel={undefined}
                        isEditing={false}
                        contextManager={contextManager}
                        notebookTracker={notebookTracker}
                        renderMimeRegistry={renderMimeRegistry}
                        agentModeEnabled={agentModeEnabled}
                    />
                    {agentExecutionStatus !== 'working' && agentExecutionStatus !== 'stopping' && (
                        <div className="chat-controls">
                            <ToggleButton
                                leftText="Chat"
                                rightText="Agent"
                                isLeftSelected={!agentModeEnabled}
                                onChange={(isLeftSelected) => {
                                    clearChatHistory();
                                    setAgentModeEnabled(!isLeftSelected);
                                    // Focus the chat input directly
                                    const chatInput = document.querySelector('.chat-input') as HTMLTextAreaElement;
                                    if (chatInput) {
                                        chatInput.focus();
                                    }
                                }}
                                title="Agent can create plans and run code."
                            />
                            <button
                                className="button-base submit-button"
                                onClick={() => {
                                    const chatInput = document.querySelector('.chat-input') as HTMLTextAreaElement;
                                    if (chatInput && chatInput.value) {
                                        // Simulate an Enter keypress
                                        // This triggers the existing submission logic in ChatInput.tsx
                                        const enterEvent = new KeyboardEvent('keydown', {
                                            key: 'Enter',
                                            code: 'Enter',
                                            keyCode: 13,
                                            which: 13,
                                            bubbles: true,
                                            cancelable: true
                                        });
                                        chatInput.dispatchEvent(enterEvent);
                                    }
                                }}
                            >
                                Submit ⏎
                            </button>
                        </div>
                    )}
                    {(agentExecutionStatus === 'working' || agentExecutionStatus === 'stopping') && (
                        <button 
                            className="button-base button-red stop-agent-button" 
                            onClick={markAgentForStopping}
                            disabled={agentExecutionStatus === 'stopping'}
                        >
                            {agentExecutionStatus === 'stopping' ? (
                                <div className="stop-agent-button-content">Stopping<LoadingCircle /> </div>
                            ) : (
                                'Stop Agent'
                            )}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default ChatTaskpane;