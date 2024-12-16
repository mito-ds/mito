import OpenAI from "openai";
import { IVariableManager } from "../VariableManager/VariableManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, getActiveCellID, getCellCodeByID } from "../../utils/notebook";
import { createBasicPrompt } from "../../prompts/BasicPrompt";
import { createErrorPrompt, removeInnerThoughtsFromMessage } from "../../prompts/SmartDebugPrompt";
import { createExplainCodePrompt } from "../../prompts/ExplainCodePrompt";


export interface IDisplayOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    type: 'openai message' | 'connection error',
    codeCellID: string | undefined
}

export interface IAIOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    codeCellID: string | undefined
}

export interface IChatHistory {
    // The AI optimized chat history is what we actually send to the AI. It includes
    // things like: instructions on how to respond, the code context, etc. 
    // Much of this, we don't want to display to the user because its extra clutter. 
    aiOptimizedChatHistory: IAIOptimizedChatHistory[]

    // The display optimized chat history is what we display to the user. Each message
    // is a subset of the corresponding message in aiOptimizedChatHistory. Note that in the 
    // displayOptimizedChatHistory, we also include connection error messages so that we can 
    // display them in the chat interface. For example, if the user does not have an API key set, 
    // we add a message to the chat ui that tells them to set an API key.
    displayOptimizedChatHistory: IDisplayOptimizedChatHistory[]
}

/* 
    The ChatHistoryManager is responsible for managing the AI chat history.

    It keeps track of two types of messages:
    1. aiOptimizedChatHistory: Messages sent to the AI that include things like: instructions on how to respond, the code context, etc. 
    2. displayOptimizedChatHistory: Messages displayed in the chat interface that only display info the user wants to see, 
    like their original input.

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
            aiOptimizedChatHistory: [],
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

    getAIOptimizedHistory(): IAIOptimizedChatHistory[] {
        return this.history.aiOptimizedChatHistory;
    }

    getDisplayOptimizedHistory(): IDisplayOptimizedChatHistory[] {
        return this.history.displayOptimizedChatHistory;
    }

    addChatInputMessage(input: string): void {


        const variables = this.variableManager.variables
        const activeCellCode = getActiveCellCode(this.notebookTracker)
        const activeCellID = getActiveCellID(this.notebookTracker)

        const aiOptimizedMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: createBasicPrompt(variables, activeCellCode || '', input)
        };

        this.history.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(input, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID
            }
        );
        this.history.aiOptimizedChatHistory.push(
            {
                message: aiOptimizedMessage, 
                codeCellID: activeCellID
            }
        )
    }

    updateMessageAtIndex(index: number, newContent: string): void {
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const aiOptimizedMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: createBasicPrompt(this.variableManager.variables, activeCellCode || '', newContent)
        };

        // Update the message at the specified index
        this.history.aiOptimizedChatHistory[index] = {
            message: aiOptimizedMessage, 
            codeCellID: activeCellID
        };
        
        this.history.displayOptimizedChatHistory[index] = { 
            message: getDisplayedOptimizedUserMessage(newContent, activeCellCode),
            type: 'openai message',
            codeCellID: activeCellID
        }

        // Remove all messages after the index we're updating
        this.history.aiOptimizedChatHistory = this.history.aiOptimizedChatHistory.slice(0, index + 1);
        this.history.displayOptimizedChatHistory = this.history.displayOptimizedChatHistory.slice(0, index + 1);
    }

    addDebugErrorMessage(errorMessage: string): void {
    
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const aiOptimizedPrompt = createErrorPrompt(errorMessage, activeCellCode, this.variableManager.variables)

        this.history.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(errorMessage, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID
            }
        );
        this.history.aiOptimizedChatHistory.push(
            {
                message: {role: 'user', content: aiOptimizedPrompt}, 
                codeCellID: activeCellID
            }
        );
    }

    addExplainCodeMessage(): void {

        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const aiOptimizedPrompt = createExplainCodePrompt(activeCellCode || '')

        this.history.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage('Explain this code', activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID
            }
        );
        this.history.aiOptimizedChatHistory.push(
            {
                message: {role: 'user', content: aiOptimizedPrompt}, 
                codeCellID: activeCellID
            }
        );
    }

    addAIMessageFromResponse(
        messageContent: string | null, 
        inputLocation: 'sidebar' | 'smartDebug' | 'codeExplain', 
        mitoAIConnectionError: boolean=false
    ): void {
        if (messageContent === null) {
            return
        }

        if (inputLocation === 'smartDebug') {
            messageContent = removeInnerThoughtsFromMessage(messageContent)
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: messageContent
        }
        this._addAIMessage(aiMessage, mitoAIConnectionError)
    }

    _addAIMessage(aiMessage: OpenAI.Chat.ChatCompletionMessageParam, mitoAIConnectionError: boolean=false): void {
        const activeCellID = getActiveCellID(this.notebookTracker)

        this.history.displayOptimizedChatHistory.push(
            {
                message: aiMessage, 
                type: mitoAIConnectionError ? 'connection error' : 'openai message',
                codeCellID: activeCellID
            }
        );
        this.history.aiOptimizedChatHistory.push(
            {
                message: aiMessage, 
                codeCellID: activeCellID,
            }
        );
    }

    addSystemMessage(message: string): void {
        const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'system',
            content: message
        }
        this.history.displayOptimizedChatHistory.push({
            message: systemMessage, 
            type: 'openai message',
            codeCellID: undefined
        });
        this.history.aiOptimizedChatHistory.push({
            message: systemMessage, 
            codeCellID: undefined
        });
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

    getCodeCellIDOfMostRecentAIMessage = (): string | undefined => {
        const aiMessages = this.history.aiOptimizedChatHistory.filter(historyItem => historyItem.message.role === 'assistant')
        if (aiMessages.length === 0) {
            return undefined
        }
        return aiMessages[aiMessages.length - 1].codeCellID
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