import React, { useState } from 'react';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './secrets'
import '../style/Chat.css';
import { classNames } from './utils/classNames';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<OpenAI.Chat.ChatCompletionMessageParam[]>([{ role: 'system', content: 'You are an expert Python programmer.' }]);
    const [input, setInput] = useState('');

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // TODO
    });

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: OpenAI.Chat.ChatCompletionMessageParam = { role: 'user', content: input };
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

    console.log("messages", messages)

    return (
        <div className="chat-widget-container">
            <div className="chat-messages">
                {messages.map((message, index) => {
                    if (message.role === 'user') {
                        const text = message.content as string;
                        return <div key={index} className={classNames("message", "message-user")}>{text}</div>;
                    } else if (message.role === 'assistant') {
                        const text = message.content as string;
                        return <div key={index} className={classNames("message", "message-assistant")}>{text}</div>;
                    }
                    return null; // Handle system messages or other roles
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