import OpenAI from "openai";
import { IVariableManager } from "../VariableManager/VariableManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, getActiveCellID, getCellCodeByID } from "../../utils/notebook";
import { Variable } from "../VariableManager/VariableInspector";

type PromptType = 'chat' | 'smartDebug' | 'codeExplain' | 'system'

export interface IDisplayOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    type: 'openai message' | 'connection error',
    mitoAIConnectionErrorType?: string | null,
    codeCellID: string | undefined
}

export interface IChatMessageMetadata {
    variables?: Variable[];
    activeCellCode?: string;   
    input?: string;
    errorMessage?: string;     
    prefix?: string;
    suffix?: string;
}

/**
 * Outgoing message from the user to the AI,
 * specifying the promptType and the metadata
 * your backend will use to build a prompt.
 */
export interface IOutgoingMessage {
    promptType: 'chat' | 'smartDebug' | 'codeExplain' | 'system';
    metadata: IChatMessageMetadata;
  }

export interface IChatHistory {
    // The metadata store for outgoing messages. It will be built into prompt and sent to the AI on the backend.
    outgoingMessage: IOutgoingMessage | {};

    // The display optimized chat history is what we display to the user. Each message
    // is a subset of the corresponding message in aiOptimizedChatHistory. Note that in the 
    // displayOptimizedChatHistory, we also include connection error messages so that we can 
    // display them in the chat interface. For example, if the user does not have an API key set, 
    // we add a message to the chat ui that tells them to set an API key.
    displayOptimizedChatHistory: IDisplayOptimizedChatHistory[]
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
    private history: IChatHistory;
    private variableManager: IVariableManager;
    private notebookTracker: INotebookTracker;

    constructor(variableManager: IVariableManager, notebookTracker: INotebookTracker, initialHistory?: IChatHistory) {
        // Initialize the history
        this.history = initialHistory || {
            outgoingMessage: {},
            displayOptimizedChatHistory: []
        };

        // Save the variable manager
        this.variableManager = variableManager;

        // Save the notebook tracker
        this.notebookTracker = notebookTracker;
    }

    createDuplicateChatHistoryManager(): ChatHistoryManager {
        return new ChatHistoryManager(this.variableManager, this.notebookTracker, this.history);
    }

    getHistory(): IChatHistory {
        return { ...this.history };
    }

    getOutgoingMessage(): IOutgoingMessage | {}{
        return this.history.outgoingMessage;
    }

    getDisplayOptimizedHistory(): IDisplayOptimizedChatHistory[] {
        return this.history.displayOptimizedChatHistory;
    }

    addChatInputMessage(input: string): void {
        const variables = this.variableManager.variables
        const activeCellCode = getActiveCellCode(this.notebookTracker)
        const activeCellID = getActiveCellID(this.notebookTracker)

        const metadata: IChatMessageMetadata = {
            variables,
            activeCellCode,
            input
        }
        this.history.outgoingMessage = {
            promptType: 'chat',
            metadata,
        }

        this.history.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(input, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID
            }
        );
    }

    updateMessageAtIndex(index: number, newContent: string): void {
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const metadata: IChatMessageMetadata = {
            variables: this.variableManager.variables,
            activeCellCode,
            input: newContent
        }

        // Update the outgoing message
        this.history.outgoingMessage = {
            promptType: 'chat',
            metadata,
        }
        
        this.history.displayOptimizedChatHistory[index] = { 
            message: getDisplayedOptimizedUserMessage(newContent, activeCellCode),
            type: 'openai message',
            codeCellID: activeCellID
        }

        this.history.displayOptimizedChatHistory = this.history.displayOptimizedChatHistory.slice(0, index + 1);
    }

    addDebugErrorMessage(errorMessage: string): void {
    
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const metadata: IChatMessageMetadata = {
            variables: this.variableManager.variables,
            activeCellCode,
            errorMessage
        }
        this.history.outgoingMessage = {
            promptType: 'smartDebug',
            metadata,
        }

        this.history.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(errorMessage, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID
            }
        );
    }

    addExplainCodeMessage(): void {

        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        // const aiOptimizedPrompt = createExplainCodePrompt(activeCellCode || '')
        const metadata: IChatMessageMetadata = {
            variables: this.variableManager.variables,
            activeCellCode
        }
        this.history.outgoingMessage = {
            promptType: 'codeExplain',
            metadata,
        }

        this.history.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage('Explain this code', activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID
            }
        );
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

        if (promptType === 'smartDebug') {
            messageContent = removeInnerThoughtsFromMessage(messageContent)
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: messageContent
        }

        const activeCellID = getActiveCellID(this.notebookTracker)

        this.history.displayOptimizedChatHistory.push(
            {
                message: aiMessage, 
                type: mitoAIConnectionError ? 'connection error' : 'openai message',
                mitoAIConnectionErrorType: mitoAIConnectionErrorType,
                codeCellID: activeCellID
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

    getLastAIMessage = (): IDisplayOptimizedChatHistory | undefined=> {
        const lastAIMessagesIndex = this.getLastAIMessageIndex()
        if (!lastAIMessagesIndex) {
            return
        }

        const displayOptimizedChatHistory = this.getDisplayOptimizedHistory()
        return displayOptimizedChatHistory[lastAIMessagesIndex]
    }
}


const getDisplayedOptimizedUserMessage = (input: string, activeCellCode?: string): OpenAI.Chat.ChatCompletionMessageParam => {
    return {
        role: 'user',
        content: `\`\`\`python
${activeCellCode}
\`\`\`

${input}`};
}

const removeInnerThoughtsFromMessage = (messageContent: string) => {
    /* 
    The smart debug prompt thinks to itself before returning the solution. We don't need to save the inner thoughts. 
    We remove them before saving the message in the chat history
    */

    if (messageContent === null) {
        return ''
    }

    const SOLUTION_STRING = 'SOLUTION:'

    // Get the message after the SOLUTION section
    const solutionIndex = messageContent.indexOf(SOLUTION_STRING)
    if (solutionIndex === -1) {
        return messageContent
    }

    const solutionText = messageContent.split(SOLUTION_STRING)[1].trim()

    return solutionText
}