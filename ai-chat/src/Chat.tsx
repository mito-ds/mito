import React, { useState } from 'react';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './secrets'
import '../style/Chat.css';
import { classNames } from './utils/classNames';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode } from './utils/cell';
import ChatMessage from './ChatMessage/ChatMessage';

interface IChatProps {
    notebookTracker: INotebookTracker
}

// IMPORTANT: In order to improve the development experience, we allow you dispaly a 
// cached conversation as a starting point. Before deploying the ai-chat, we must 
// set USE_DEV_AI_CONVERSATION = false
// TODO: Write a test to ensure USE_DEV_AI_CONVERSATION is false
const USE_DEV_AI_CONVERSATION = true

const getDefaultAIConversation = (): OpenAI.Chat.ChatCompletionMessageParam[] => {

    if (USE_DEV_AI_CONVERSATION) {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: 'You are an expert Python programmer.' },
            { role: 'user', content: "```python x = 5\ny=10\nx+y``` update x to 10" },
            { role: 'assistant', content: "```python x = 10\ny=10\nx+y```" },
            { role: 'user', content: "```python x = 5\ny=10\nx+y``` Explain what this code does to me" },
            { role: 'assistant', content: "This code defines two variables, x and y. Variables are named buckets that store a value. ```python x = 5\ny=10``` It then adds them together ```python x+y``` Let me know if you want me to further explain any of those concepts"},
        ]
        return messages
    } else {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: 'You are an expert Python programmer.' }
        ]
        return messages
    }
}

const Chat: React.FC<IChatProps> = ({notebookTracker}) => {
    const [messages, setMessages] = useState<OpenAI.Chat.ChatCompletionMessageParam[]>(() => getDefaultAIConversation());
    const [input, setInput] = useState('');

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // TODO
    });

    const sendMessage = async () => {
        if (!input.trim()) return;

        const activeCellCode = getActiveCellCode(notebookTracker)
        const prompt = `You existing code is ${activeCellCode}\n\n${input}`
        const userMessage: OpenAI.Chat.ChatCompletionMessageParam = { role: 'user', content: prompt };

        setMessages([...messages, userMessage]);
        setInput('');

        try {
            console.log("getting ai response")

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [...messages, userMessage],
            });

            const aiMessage = response.choices[0].message;
            setMessages(prevMessages => [...prevMessages, aiMessage]);
            console.log("ai response", aiMessage)

        } catch (error) {
            console.error('Error calling OpenAI API:', error);
        }
    };

    return (
        <div className="chat-widget-container">
            <div className="chat-messages">
                {messages.map((message, index) => {
                    return (
                        <ChatMessage 
                            message={message}
                            messageIndex={index}
                        />
                    )
                    
                }).filter(message => message !== null)}
            </div>
            <input
                className={classNames("message", "message-user", 'chat-input')}
                type="text"
                placeholder={messages.length < 2 ? "Ask your personal Python expert anything!" : "Follow up on the conversation"}
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