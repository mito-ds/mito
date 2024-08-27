import OpenAI from "openai";

export interface IChatHistory {
    // The AI optimized chat history is what we actually send to the AI. It includes
    // things like: instructions on how to respond, the code context, etc. 
    // Much of this, we don't want to display to the user because its extra clutter. 
    aiOptimizedChatHistory: OpenAI.Chat.ChatCompletionMessageParam[]

    // The display optimized chat history is what we display to the user. Each message
    // is a subset of the corresponding message in aiOptimizedChatHistory. 
    displayOptimizedChatHistory: OpenAI.Chat.ChatCompletionMessageParam[]
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

    getDisplayOptimizedHistory(): OpenAI.Chat.ChatCompletionMessageParam[] {
        return this.history.displayOptimizedChatHistory;
    }

    addUserMessage(input: string, activeCellCode?: string): void {

        const displayMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `\`\`\`python
${activeCellCode}
\`\`\`

${input}`};

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `Your code:

\`\`\`python
${activeCellCode}
\`\`\`

Your task: ${input}

Update the code to complete the task and respond with the updated code. Decide the approach you want to take to complete the task and respond with just that code and a concise explanation of the code. Do not use the word "I".

Do not include multiple approaches in your response. If you need more context, ask for more context.`};

        this.history.displayOptimizedChatHistory.push(displayMessage);
        this.history.aiOptimizedChatHistory.push(aiMessage);
    }

    addAIMessage(message: OpenAI.Chat.Completions.ChatCompletionMessage): void {
        if (message.content === null) {
            return
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: message.content
        }
        this.history.displayOptimizedChatHistory.push(aiMessage);
        this.history.aiOptimizedChatHistory.push(aiMessage);
    }

    addSystemMessage(message: string): void {
        const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'system',
            content: message
        }
        this.history.displayOptimizedChatHistory.push(systemMessage);
        this.history.aiOptimizedChatHistory.push(systemMessage);
    }
}