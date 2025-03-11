import OpenAI from "openai";
import { IContextManager } from "../ContextManager/ContextManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, getActiveCellID, getAIOptimizedCells, getCellCodeByID } from "../../utils/notebook";
import { AgentResponse, IAgentExecutionMetadata, IChatMessageMetadata, ICodeExplainMetadata, ISmartDebugMetadata } from "../../utils/websocket/models";
import { addMarkdownCodeFormatting } from "../../utils/strings";

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

    addChatInputMessage(input: string): IChatMessageMetadata {
        const activeCellCode = getActiveCellCode(this.notebookTracker)
        const activeCellID = getActiveCellID(this.notebookTracker)

        const chatMessageMetadata: IChatMessageMetadata = {
            promptType: 'chat',
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            activeCellCode: activeCellCode,
            input: input
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

    addAgentExecutionMessage(input: string): IAgentExecutionMetadata {

        const aiOptimizedCells = getAIOptimizedCells(this.notebookTracker)

        const agentExecutionMetatada: IAgentExecutionMetadata = {
            promptType: 'agent:execution',
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            aiOptimizedCells: aiOptimizedCells,
            input: input
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(input), 
                type: 'openai message',
                promptType: 'chat',
                codeCellID: undefined // The agent:execution is not tied to any specific code cell
            }
        )

        return agentExecutionMetatada
    }

    dropMessagesStartingAtIndex(index: number): void {
        this.displayOptimizedChatHistory.splice(index)
    }


    addDebugErrorMessage(errorMessage: string, promptType: PromptType): ISmartDebugMetadata {
    
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const smartDebugMetadata: ISmartDebugMetadata = {
            promptType: 'smartDebug',
            variables: this.contextManager.variables,
            files: this.contextManager.files,
            activeCellCode: activeCellCode,
            errorMessage: errorMessage
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(errorMessage, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID,
                promptType: promptType
            }
        );

        return smartDebugMetadata
    }

    addExplainCodeMessage(): ICodeExplainMetadata {

        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const codeExplainMetadata: ICodeExplainMetadata = {
            promptType: 'codeExplain',
            variables: this.contextManager.variables,
            activeCellCode
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

    addAIMessageFromAgentResponse(
        agentResponse: AgentResponse
    ): void {

        const code = agentResponse.cell_update?.code || ''
        const codeWithMarkdownFormatting = addMarkdownCodeFormatting(code)

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: codeWithMarkdownFormatting
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