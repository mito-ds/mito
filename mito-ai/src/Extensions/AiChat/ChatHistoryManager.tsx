/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import OpenAI from "openai";
import { IContextManager } from "../ContextManager/ContextManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, getActiveCellID, getAIOptimizedCells, getCellCodeByID } from "../../utils/notebook";
import { AgentResponse, IAgentExecutionMetadata, IAgentSmartDebugMetadata, IChatMessageMetadata, ICodeExplainMetadata, ISmartDebugMetadata } from "../../websockets/completions/CompletionModels";
import { addMarkdownCodeFormatting } from "../../utils/strings";
import { isChromeBasedBrowser } from "../../utils/user";

export type PromptType = 
    'chat' | 
    'smartDebug' | 
    'codeExplain' |  
    'agent:execution' | 
    'agent:autoErrorFixup' |
    'inline_completion' | 
    'fetch_history' |
    'start_new_chat' |
    'get_threads' |
    'delete_thread';

export type ChatMessageType = 'openai message' | 'connection error'

// The display optimized chat history is what we display to the user. Each message
// is a subset of the corresponding message in aiOptimizedChatHistory. Note that in the 
// displayOptimizedChatHistory, we also include connection error messages so that we can 
// display them in the chat interface. For example, if the user does not have an API key set, 
// we add a message to the chat ui that tells them to set an API key.
export interface IDisplayOptimizedChatItem {
    message: OpenAI.Chat.ChatCompletionMessageParam
    type: ChatMessageType,
    promptType: PromptType,
    mitoAIConnectionErrorType?: string | null,
    codeCellID?: string | undefined,
    agentResponse?: AgentResponse
}

/* 
    The ChatHistoryManager is responsible for managing the AI chat history.

    It keeps track of messages displayed in the chat interface that only display info the user wants to see, like their original input.

    TODO: In the future, we should make this its own extension that provides an interface for adding new messages to the chat history,
    creating new chats, etc. Doing so would allow us to easily append new messages from other extensions without having to do so 
    by calling commands with untyped arguments.

    Whenever, the chatHistoryManager is updated, it should automatically send a message to the AI. 
*/
export class ChatHistoryManager {
    private displayOptimizedChatHistory: IDisplayOptimizedChatItem[];
    private contextManager: IContextManager;
    private notebookTracker: INotebookTracker;

    constructor(contextManager: IContextManager, notebookTracker: INotebookTracker, initialHistory?: IDisplayOptimizedChatItem[]) {
        // Initialize the history
        this.displayOptimizedChatHistory = initialHistory || [];

        // Save the context manager
        this.contextManager = contextManager;

        // Save the notebook tracker
        this.notebookTracker = notebookTracker;
    }

    createDuplicateChatHistoryManager(): ChatHistoryManager {
        return new ChatHistoryManager(this.contextManager, this.notebookTracker, this.displayOptimizedChatHistory);
    }

    getDisplayOptimizedHistory(): IDisplayOptimizedChatItem[] {
        return this.displayOptimizedChatHistory;
    }

    addChatMessageFromHistory(message: OpenAI.Chat.ChatCompletionMessageParam): void {
        this.displayOptimizedChatHistory.push(
            {
                message: message, 
                type: 'openai message',
                codeCellID: undefined,
                promptType: 'chat'
            }
        );
    }

    async addChatInputMessage(input: string, activeThreadId: string, messageIndex?: number, selectedRules?: string[]): Promise<IChatMessageMetadata> {
        const activeCellCode = getActiveCellCode(this.notebookTracker) || ''
        const activeCellID = getActiveCellID(this.notebookTracker) || ''

        const chatMessageMetadata: IChatMessageMetadata = {
            promptType: 'chat',
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            activeCellCode: activeCellCode,
            activeCellId: activeCellID,
            input: input,
            threadId: activeThreadId,
            index: messageIndex,
            selectedRules: selectedRules
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(input, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID,
                promptType: 'chat'
            }
        );

        return chatMessageMetadata
    }

    addAgentExecutionMessage(activeThreadId: string, input?: string, selectedRules?: string[]): IAgentExecutionMetadata {

        const aiOptimizedCells = getAIOptimizedCells(this.notebookTracker)

        const agentExecutionMetadata: IAgentExecutionMetadata = {
            promptType: 'agent:execution',
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            aiOptimizedCells: aiOptimizedCells,
            input: input || '',
            threadId: activeThreadId,
            isChromeBrowser: isChromeBasedBrowser(),
            selectedRules: selectedRules
        }

        // We use this function in two ways: 
        // 1. When the user sends the original agent:execution message to start the agent
        // 2. When the agent sends itself information about the updated variables, etc. In this case, 
        // we don't want to pass an input. 
        let userMessage: OpenAI.Chat.ChatCompletionMessageParam
        if (input) {
            userMessage = getDisplayedOptimizedUserMessage(input)
        } else {
            userMessage = {
                role: 'user',
                content: ''
            }
        }

        this.displayOptimizedChatHistory.push(
            {
                message: userMessage,
                type: 'openai message',
                promptType: 'chat',
            }
        )

        return agentExecutionMetadata
    }

    dropMessagesStartingAtIndex(index: number): void {
        this.displayOptimizedChatHistory.splice(index)
    }


    addSmartDebugMessage(activeThreadId: string, errorMessage: string): ISmartDebugMetadata {
    
        const activeCellID = getActiveCellID(this.notebookTracker) || ''
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID) || ''

        const smartDebugMetadata: ISmartDebugMetadata = {
            promptType: 'smartDebug',
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            activeCellCode: activeCellCode,
            activeCellId: activeCellID,
            errorMessage: errorMessage,
            threadId: activeThreadId
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(errorMessage, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID,
                promptType: 'smartDebug'
            }
        );

        return smartDebugMetadata
    }

    addAgentSmartDebugMessage(activeThreadId: string, errorMessage: string): IAgentSmartDebugMetadata {

        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getActiveCellCode(this.notebookTracker)

        const agentSmartDebugMetadata: IAgentSmartDebugMetadata = {
            promptType: 'agent:autoErrorFixup',
            aiOptimizedCells: getAIOptimizedCells(this.notebookTracker),
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            errorMessage: errorMessage,
            error_message_producing_code_cell_id: activeCellID || '',
            threadId: activeThreadId,
            isChromeBrowser: isChromeBasedBrowser()
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(errorMessage, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID,
                promptType: 'agent:autoErrorFixup'
            }
        );

        return agentSmartDebugMetadata
    }

    addExplainCodeMessage(activeThreadId: string): ICodeExplainMetadata {

        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const codeExplainMetadata: ICodeExplainMetadata = {
            promptType: 'codeExplain',
            variables: this.contextManager.variables,
            activeCellCode,
            threadId: activeThreadId
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage('Explain this code', activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID,
                promptType: 'codeExplain'
            }
        );

        return codeExplainMetadata
    }

    addAIMessageFromResponse(
        messageContent: string | null, 
        promptType: PromptType, 
        mitoAIConnectionError: boolean=false,
        mitoAIConnectionErrorType: string | null = null
    ): void {
        if (messageContent === null) {
            return
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: messageContent
        }

        let type: IDisplayOptimizedChatItem['type'];
        if (mitoAIConnectionError) {
            type = 'connection error';
        } else {
            type = 'openai message';
        }

        const activeCellID = getActiveCellID(this.notebookTracker)

        this.displayOptimizedChatHistory.push(
            {
                message: aiMessage, 
                type: type,
                mitoAIConnectionErrorType: mitoAIConnectionErrorType,
                codeCellID: activeCellID,
                promptType: promptType
            }
        );
    }

    addStreamingAIMessage(
        messageContent: string,
        promptType: PromptType
    ): void {
        // Find the last AI message in the history
        const lastAIMessageIndex = this.getLastAIMessageIndex();
        
        if (
            lastAIMessageIndex === undefined || 
            this.displayOptimizedChatHistory.length !== lastAIMessageIndex + 1
        ) {
            // If no AI message exists, create a new one
            this.addAIMessageFromResponse(messageContent, promptType);
        } else {
            // Update the last AI message with the new content
            const lastMessage = this.displayOptimizedChatHistory[lastAIMessageIndex];
            if (lastMessage) {
                lastMessage.message.content = messageContent;
            }
        }
    }

    addAIMessageFromAgentResponse(agentResponse: AgentResponse): void {

        let content = agentResponse.message
        if (agentResponse.type === 'cell_update') {
            // For cell_update messages, we want to display the code the agent wrote along with 
            // the message it sent. For all other agent responses, we ignore all other fields
            // and just display the message.
            const code = agentResponse.cell_update?.code
            const codeWithMarkdownFormatting = addMarkdownCodeFormatting(code)

            if (codeWithMarkdownFormatting !== undefined) {
                content = content + '\n\n' + codeWithMarkdownFormatting
            }
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: content
        }

        this.displayOptimizedChatHistory.push(
            {
                message: aiMessage, 
                type: 'openai message',
                promptType: 'agent:execution',
                agentResponse: agentResponse
            }
        );
    }

    getLastAIMessageIndex = (): number | undefined => {
        // We assume that assistant messages are always separated by user messages.
        // This allows us to simply find the last assistant message in the history.
        // If this invariant changes (e.g., if we need to support consecutive assistant messages),
        // we should modify this to use message IDs instead.
        const displayOptimizedChatHistory = this.getDisplayOptimizedHistory()
        const aiMessageIndexes = displayOptimizedChatHistory.map((chatEntry, index) => {
            if (chatEntry.message.role === 'assistant') {
                return index
            }
            return undefined
        }).filter(index => index !== undefined)
        
        return aiMessageIndexes[aiMessageIndexes.length - 1]
    }

    getLastAIDisplayOptimizedChatItem = (): IDisplayOptimizedChatItem | undefined=> {
        const lastAIMessagesIndex = this.getLastAIMessageIndex()
        if (!lastAIMessagesIndex) {
            return
        }

        return this.displayOptimizedChatHistory[lastAIMessagesIndex]
    }
}


const getDisplayedOptimizedUserMessage = (
    input: string, 
    activeCellCode?: string, 
    messageToAgent: boolean = false
): OpenAI.Chat.ChatCompletionMessageParam => {

    // Don't include the active cell code if it is an agent planning message
    // or if the there is no active cell code provided, which occurs when
    // sending an agent:execution message which uses the entire notebook as context
    // instead of just the active cell
    let activeCellCodeBlock = ''
    if (!messageToAgent && activeCellCode) {
        activeCellCodeBlock = 
`\`\`\`python
${activeCellCode}
\`\`\``

    }

    return {
        role: 'user',
        content:
`${activeCellCodeBlock}
${input}`
    };
}
