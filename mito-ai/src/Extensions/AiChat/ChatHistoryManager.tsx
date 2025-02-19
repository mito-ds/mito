import OpenAI from "openai";
import { IContextManager } from "../VariableManager/VariableManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, getActiveCellID, getCellCodeByID } from "../../utils/notebook";
import { IAgentPlanningMetadata, IChatMessageMetadata, ICodeExplainMetadata, ISmartDebugMetadata } from "../../utils/websocket/models";

export type PromptType = 
    'chat' | 
    'smartDebug' | 
    'codeExplain' | 
    'agent:planning' | 
    'agent:execution' | 
    'agent:autoErrorFixup' |
    'inline_completion' | 
    'clear_history' | 
    'fetch_history'

export type ChatMessageType = 'openai message' | 'openai message:agent:planning' | 'connection error'

// The display optimized chat history is what we display to the user. Each message
// is a subset of the corresponding message in aiOptimizedChatHistory. Note that in the 
// displayOptimizedChatHistory, we also include connection error messages so that we can 
// display them in the chat interface. For example, if the user does not have an API key set, 
// we add a message to the chat ui that tells them to set an API key.
export interface IDisplayOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    type: ChatMessageType,
    promptType: PromptType,
    mitoAIConnectionErrorType?: string | null,
    codeCellID: string | undefined
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
    private contextManager: IContextManager;
    private notebookTracker: INotebookTracker;

    constructor(contextManager: IContextManager, notebookTracker: INotebookTracker, initialHistory?: IDisplayOptimizedChatHistory[]) {
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

    addChatInputMessage(input: string): IChatMessageMetadata {
        const activeCellCode = getActiveCellCode(this.notebookTracker)
        const activeCellID = getActiveCellID(this.notebookTracker)

        const chatMessageMetadata: IChatMessageMetadata = {
            promptType: 'chat',
            variables: this.contextManager.variables,
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

    updateMessageAtIndex(index: number, newContent: string, isAgentMessage: boolean = false): IChatMessageMetadata {
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = isAgentMessage ? undefined : getCellCodeByID(this.notebookTracker, activeCellID)

        const chatMessageMetadata: IChatMessageMetadata = {
            promptType: 'chat',
                variables: this.contextManager.variables,
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

        return chatMessageMetadata
    }

    addAgentMessage(message: string, index?: number): IAgentPlanningMetadata {

        const agentPlanningMetadata: IAgentPlanningMetadata = {
            promptType: "agent:planning",
            variables: this.contextManager.variables,
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

        // If editing the first agent message, the user will want a new plan.
        // So we drop all steps in the agent's previous plan.
        if (index === 1) {
            this.displayOptimizedChatHistory = this.displayOptimizedChatHistory.slice(0, index + 1);
        }

        return agentPlanningMetadata
    }

    addDebugErrorMessage(errorMessage: string, promptType: PromptType): ISmartDebugMetadata {
    
        const activeCellID = getActiveCellID(this.notebookTracker)
        const activeCellCode = getCellCodeByID(this.notebookTracker, activeCellID)

        const smartDebugMetadata: ISmartDebugMetadata = {
            promptType: 'smartDebug',
            variables: this.contextManager.variables,
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