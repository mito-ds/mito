import OpenAI from "openai";
import { IVariableManager } from "../VariableManager/VariableManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, getActiveCellID, getCellCodeByID } from "../../utils/notebook";
import { Variable } from "../VariableManager/VariableInspector";

export type PromptType = 
    'chat' | 
    'smartDebug' | 
    'codeExplain' | 
    'agent:planning' | 
    'agent:execution' | 
    'agent:autoErrorFixup';

// The display optimized chat history is what we display to the user. Each message
// is a subset of the corresponding message in aiOptimizedChatHistory. Note that in the 
// displayOptimizedChatHistory, we also include connection error messages so that we can 
// display them in the chat interface. For example, if the user does not have an API key set, 
// we add a message to the chat ui that tells them to set an API key.
export interface IDisplayOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    type: 'openai message' | 'openai message:agent:planning' | 'connection error',
    promptType: PromptType,
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
    index?: number;
}

/**
 * Outgoing message from the user to the AI,
 * specifying the promptType and the metadata
 * your backend will use to build a prompt.
 */
export interface IOutgoingMessage {
    promptType: PromptType
    metadata: IChatMessageMetadata;
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
    private displayOptimizedChatHistory: IDisplayOptimizedChatHistory[];
    private variableManager: IVariableManager;
    private notebookTracker: INotebookTracker;

    constructor(variableManager: IVariableManager, notebookTracker: INotebookTracker, initialHistory?: IDisplayOptimizedChatHistory[]) {
        // Initialize the history
        this.displayOptimizedChatHistory = initialHistory || [];

        // Save the variable manager
        this.variableManager = variableManager;

        // Save the notebook tracker
        this.notebookTracker = notebookTracker;
    }

    createDuplicateChatHistoryManager(): ChatHistoryManager {
        return new ChatHistoryManager(this.variableManager, this.notebookTracker, this.displayOptimizedChatHistory);
    }

    getDisplayOptimizedHistory(): IDisplayOptimizedChatHistory[] {
        return this.displayOptimizedChatHistory;
    }

    addChatMessageFromHistory(message: OpenAI.Chat.ChatCompletionMessageParam) {
        this.displayOptimizedChatHistory.push(
            {
                message: message, 
                type: 'openai message',
                codeCellID: undefined,
                promptType: 'chat'
            }
        );
    }

    addChatInputMessage(input: string): IOutgoingMessage {
        const variables = this.variableManager.variables
        const activeCellCode = getActiveCellCode(this.notebookTracker)
        const activeCellID = getActiveCellID(this.notebookTracker)

        const metadata: IChatMessageMetadata = {
            variables,
            activeCellCode,
            input
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(input, activeCellCode), 
                type: 'openai message',
                codeCellID: activeCellID,
                promptType: 'chat'
            }
        );

        return {
            promptType: 'chat',
            metadata: metadata,
        }
    }

    updateMessageAtIndex(index: number, newContent: string, isAgentMessage: boolean = false): IOutgoingMessage {
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = isAgentMessage ? undefined : getCellCodeByID(this.notebookTracker, activeCellID)

        const metadata: IChatMessageMetadata = {
            variables: this.variableManager.variables,
            activeCellCode: activeCellCode,
            input: newContent,
            index: index
        }
        
        this.displayOptimizedChatHistory[index] = { 
            message: getDisplayedOptimizedUserMessage(
                newContent, 
                activeCellCode,
                isAgentMessage
            ),
            type: isAgentMessage ? 'openai message:agent:planning' : 'openai message',
            codeCellID: activeCellID,
            promptType: isAgentMessage ? 'agent:planning' : 'chat'
        }

        // Only slice the history if it's not an agent message
        if (!isAgentMessage) {
            this.displayOptimizedChatHistory = this.displayOptimizedChatHistory.slice(0, index + 1);
        }

        return {
            promptType: 'chat',
            metadata: metadata,
        }
    }

    addAgentMessage(message: string): IOutgoingMessage {
        const variables = this.variableManager.variables

        const metadata: IChatMessageMetadata = {
            variables,
            input: message
        }

        this.displayOptimizedChatHistory.push(
            {
                message: getDisplayedOptimizedUserMessage(message, undefined),
                type: 'openai message',
                codeCellID: undefined,
                promptType: 'agent:planning'
            }
        )

        return {
            promptType: 'agent:planning',
            metadata: metadata,
        }
    }

    addDebugErrorMessage(errorMessage: string, promptType: PromptType): IOutgoingMessage {
    
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const metadata: IChatMessageMetadata = {
            variables: this.variableManager.variables,
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

        return {
            promptType: promptType,
            metadata,
        }
    }

    addExplainCodeMessage(): IOutgoingMessage {

        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const metadata: IChatMessageMetadata = {
            variables: this.variableManager.variables,
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

        return {
            promptType: 'codeExplain',
            metadata,
        }
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

        let type: IDisplayOptimizedChatHistory['type'];
        if (mitoAIConnectionError) {
            type = 'connection error';
        } else if (promptType === 'agent:planning') {
            type = 'openai message:agent:planning';
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

    addSystemMessage(message: string): void {
        const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'system',
            content: message
        }
        this.displayOptimizedChatHistory.push({
            message: systemMessage, 
            type: 'openai message',
            codeCellID: undefined,
            promptType: 'chat'
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
}


const getDisplayedOptimizedUserMessage = (
    input: string, 
    activeCellCode?: string, 
    isAgentPlanning: boolean = false
): OpenAI.Chat.ChatCompletionMessageParam => {
    return {
        role: 'user',
        content: (!isAgentPlanning && activeCellCode) ? 
`\`\`\`python
${activeCellCode}
\`\`\`

${input}` : input
    };
}