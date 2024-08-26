import React, { useState } from 'react';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './secrets'
import '../style/Chat.css';
import { classNames } from './utils/classNames';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode } from './utils/notebook';
import ChatMessage from './ChatMessage/ChatMessage';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';

interface IChatProps {
    notebookTracker: INotebookTracker
    languageRegistry: IEditorLanguageRegistry
}

interface IChatHistory {
    // The AI optimized chat history is what we actually send to the AI. It includes
    // things like: instructions on how to respond, the code context, etc. 
    // Much of this, we don't want to display to the user because its extra clutter. 
    aiOptimizedChatHistory: OpenAI.Chat.ChatCompletionMessageParam[]

    // The display optimized chat history is what we display to the user. Each message
    // is a subset of the corresponding message in aiOptimizedChatHistory. 
    displayOptimizedChatHistory: OpenAI.Chat.ChatCompletionMessageParam[]
}


class ChatHistoryManager {
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

        console.log("adding user message", input)

        const displayMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `\`\`\`python${activeCellCode}\`\`\`
${input}`
        };

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `Your code:

\`\`\`python
${activeCellCode}
\`\`\`

Your task: ${input}

Update the code to complete the task and respond with the updated code. Decide the approach you want to take to complete the task and respond with just that code and a concise explanation of the code. Do not use the word "I".

Do not include multiple approaches in your response. If you need more context, ask for more context.
`
        };

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

// IMPORTANT: In order to improve the development experience, we allow you dispaly a 
// cached conversation as a starting point. Before deploying the ai-chat, we must 
// set USE_DEV_AI_CONVERSATION = false
// TODO: Write a test to ensure USE_DEV_AI_CONVERSATION is false
const USE_DEV_AI_CONVERSATION = false

const getDefaultChatHistoryManager = (): ChatHistoryManager => {

    if (USE_DEV_AI_CONVERSATION) {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {role: 'system', content: 'You are an expert Python programmer.'},
            {role: 'user', content: "```python x = 5\ny=10\nx+y``` update x to 10"},
            {role: 'assistant', content: "```python x = 10\ny=10\nx+y```"},
            {role: 'user', content: "```python x = 5\ny=10\nx+y``` Explain what this code does to me"},
            {role: 'assistant', content: "This code defines two variables, x and y. Variables are named buckets that store a value. ```python x = 5\ny=10``` It then adds them together ```python x+y``` Let me know if you want me to further explain any of those concepts"}
        ]

        const chatHistory: IChatHistory = {
            aiOptimizedChatHistory: messages,
            displayOptimizedChatHistory: messages
        }

        return new ChatHistoryManager(chatHistory)


    } else {
        const chatHistoryManager = new ChatHistoryManager()
        chatHistoryManager.addSystemMessage('You are an expert Python programmer.')
        return chatHistoryManager
    }

}

const Chat: React.FC<IChatProps> = ({notebookTracker, languageRegistry}) => {
    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(() => getDefaultChatHistoryManager());
    const [input, setInput] = useState('');

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // TODO
    });

    const sendMessage = async () => {
        if (!input.trim()) return;

        const activeCellCode = getActiveCellCode(notebookTracker)

        // Create a new chat history manager so we can trigger a re-render of the chat
        const updatedManager = new ChatHistoryManager(chatHistoryManager.getHistory());
        updatedManager.addUserMessage(input, activeCellCode)

        setInput('');

        try {
            console.log("getting ai response")

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: updatedManager.getAIOptimizedHistory(),
            });

            const aiMessage = response.choices[0].message;
            updatedManager.addAIMessage(aiMessage)
            setChatHistoryManager(updatedManager);

        } catch (error) {
            console.error('Error calling OpenAI API:', error);
        }
    };

    const displayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()

    return (
        <div className="chat-widget-container">
            <div className="chat-messages">
                {displayOptimizedChatHistory.map((message, index) => {
                    return (
                        <ChatMessage 
                            message={message}
                            messageIndex={index}
                            notebookTracker={notebookTracker}
                            languageRegistry={languageRegistry}
                        />
                    )
                    
                }).filter(message => message !== null)}
            </div>
            <input
                className={classNames("message", "message-user", 'chat-input')}
                type="text"
                placeholder={displayOptimizedChatHistory.length < 2 ? "Ask your personal Python expert anything!" : "Follow up on the conversation"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
            />
        </div>
    );
};

export default Chat;