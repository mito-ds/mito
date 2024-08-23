import React, { useState } from 'react';
import OpenAI from 'openai';
import '../style/Chat.css';

// Load the OpenAI API key from .env file
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
console.log('OPENAI_API_KEY', OPENAI_API_KEY)

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<OpenAI.Chat.ChatCompletionMessageParam[]>([{ role: 'system', content: 'You are an expert Python programmer.' }]);
    const [input, setInput] = useState('');

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // Add this line
    });

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: OpenAI.Chat.ChatCompletionMessageParam = { role: 'user', content: input };
        setMessages([...messages, userMessage]);
        setInput('');

        try {
            console.log("getting ai response")

            const response = await openai.chat.completions.create({
                model: 'gpt-4-0125-preview', // Update this to a valid model
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
        <div className="chat-widget">
            <div className="chat-messages">
                {messages.map((message, index) => {
                    if (message.role === 'user') {
                        const text = message.content as string;
                        return <div key={index} className="message user">{text}</div>;
                    } else if (message.role === 'assistant') {
                        const text = message.content as string;
                        return <div key={index} className="message assistant">{text}</div>;
                    }
                    return null; // Handle system messages or other roles
                }).filter(message => message !== null)}
            </div>
            <div className="chat-input">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;