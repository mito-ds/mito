import OpenAI from "openai";
import { Variable } from "../VariableManager/VariableInspector";

export interface IDisplayOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    error: boolean
}

export interface IChatHistory {
    // The AI optimized chat history is what we actually send to the AI. It includes
    // things like: instructions on how to respond, the code context, etc. 
    // Much of this, we don't want to display to the user because its extra clutter. 
    aiOptimizedChatHistory: OpenAI.Chat.ChatCompletionMessageParam[]

    // The display optimized chat history is what we display to the user. Each message
    // is a subset of the corresponding message in aiOptimizedChatHistory. 
    displayOptimizedChatHistory: IDisplayOptimizedChatHistory[]
}


export class ChatHistoryManager {
    private history: IChatHistory;

    constructor(initialHistory?: IChatHistory) {
        this.history = initialHistory || {
            aiOptimizedChatHistory: [],
            displayOptimizedChatHistory: []
        };
    }

    getHistory(): IChatHistory {
        return { ...this.history };
    }

    getAIOptimizedHistory(): OpenAI.Chat.ChatCompletionMessageParam[] {
        return this.history.aiOptimizedChatHistory;
    }

    getDisplayOptimizedHistory(): IDisplayOptimizedChatHistory[] {
        return this.history.displayOptimizedChatHistory;
    }

    addUserMessage(input: string, activeCellCode?: string, variables?: Variable[]): void {

        const displayMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `\`\`\`python
${activeCellCode}
\`\`\`

${input}`};

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `You have access to the following variables:

${variables?.map(variable => `${JSON.stringify(variable, null, 2)}\n`).join('')}
            
Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Complete the task below. Decide what variables to use and what changes you need to make to the active code cell. Only return the full new active code cell and a concise explanation of the changes you made.

Do not: 
- Use the word "I"
- Include multiple approaches in your response
- Recreate variables that already exist

Do: 
- Use the variables that you have access to
- Keep as much of the original code as possible
- Ask for more context if you need it. 

Your task: ${input}`};

        this.history.displayOptimizedChatHistory.push({message: displayMessage, error: false});
        this.history.aiOptimizedChatHistory.push(aiMessage);
    }

    addAIMessageFromResponse(message: OpenAI.Chat.Completions.ChatCompletionMessage, error: boolean=false): void {
        if (message.content === null) {
            return
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: message.content
        }
        this._addAIMessage(aiMessage, error)
    }

    addAIMessageFromMessageContent(message: string, error: boolean=false): void {
        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: message
        }
        this._addAIMessage(aiMessage, error)
    }

    _addAIMessage(aiMessage: OpenAI.Chat.ChatCompletionMessageParam, error: boolean=false): void {
        this.history.displayOptimizedChatHistory.push({message: aiMessage, error: error});
        this.history.aiOptimizedChatHistory.push(aiMessage);
    }

    addSystemMessage(message: string): void {
        const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'system',
            content: message
        }
        this.history.displayOptimizedChatHistory.push({message: systemMessage, error: false});
        this.history.aiOptimizedChatHistory.push(systemMessage);
    }
}