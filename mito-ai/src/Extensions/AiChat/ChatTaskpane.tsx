import React, { useEffect, useRef, useState } from 'react';
import OpenAI from 'openai';
import '../../../style/ChatTaskpane.css';
import { classNames } from '../../utils/classNames';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode, writeCodeToActiveCell } from '../../utils/notebook';
import ChatMessage from './ChatMessage/ChatMessage';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ChatHistoryManager, IChatHistory } from './ChatHistoryManager';
import { requestAPI } from '../../utils/handler';
import { IVariableManager } from '../VariableManager/VariableManagerPlugin';
import LoadingDots from '../../components/LoadingDots';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getCodeBlockFromMessage } from '../../utils/strings';
import { COMMAND_MITO_AI_APPLY_LATEST_CODE, COMMAND_MITO_AI_SEND_MESSAGE } from '../../commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import ResetIcon from '../../icons/ResetIcon';
import IconButton from '../../components/IconButton';


// IMPORTANT: In order to improve the development experience, we allow you dispaly a 
// cached conversation as a starting point. Before deploying the mito-ai, we must 
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
            aiOptimizedChatHistory: [...messages],
            displayOptimizedChatHistory: [...messages].map(message => ({message: message, error: false}))
        }

        return new ChatHistoryManager(chatHistory)

    } else {
        const chatHistoryManager = new ChatHistoryManager()
        chatHistoryManager.addSystemMessage('You are an expert Python programmer.')
        return chatHistoryManager
    }
}

interface IChatTaskpaneProps {
    notebookTracker: INotebookTracker
    rendermime: IRenderMimeRegistry
    variableManager: IVariableManager
    app: JupyterFrontEnd
}

const ChatTaskpane: React.FC<IChatTaskpaneProps> = ({notebookTracker, rendermime, variableManager, app}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(() => getDefaultChatHistoryManager());
    const [input, setInput] = useState('');
    const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false)

    // TextAreas cannot automatically adjust their height based on the content that they contain, 
    // so instead we re-adjust the height as the content changes here. 
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return
        }
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    /* 
        Send a message with a specific input, clearing what is currently in the chat input.
        This is useful when we want to send the error message from the MIME renderer directly
        to the AI chat.
    */
    const sendMessageWithInput = async (input: string) => {
        _sendMessage(input)
    }

    /* 
        Send a message with the text currently in the chat input.
    */
    const sendMessageFromChat = async () => {
        _sendMessage(input)
    }

    const _sendMessage = async (input: string) => {

        const variables = variableManager.variables
        const activeCellCode = getActiveCellCode(notebookTracker)

        // Create a new chat history manager so we can trigger a re-render of the chat
        const updatedManager = new ChatHistoryManager(chatHistoryManager.getHistory());
        updatedManager.addUserMessage(input, activeCellCode, variables)

        setInput('');
        setLoadingAIResponse(true)

        try {
            const apiResponse = await requestAPI('mito_ai/completion', {
                method: 'POST',
                body: JSON.stringify({
                    messages: updatedManager.getAIOptimizedHistory()
                })
            });

            if (apiResponse.type === 'success') {
                const response = apiResponse.response;
                const aiMessage = response.choices[0].message;
                updatedManager.addAIMessageFromResponse(aiMessage);
                setChatHistoryManager(updatedManager);
            } else {
                updatedManager.addAIMessageFromMessageContent(apiResponse.errorMessage, true)
                setChatHistoryManager(updatedManager);
            }

            setLoadingAIResponse(false)
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
        }

    };

    const displayOptimizedChatHistory = chatHistoryManager.getDisplayOptimizedHistory()

    const getLastAIMessageIndex = (): number | undefined => {
        const aiMessageIndexes = displayOptimizedChatHistory.map((chatEntry, index) => {
            if (chatEntry.message.role === 'assistant') {
                return index
            }
            return undefined
        }).filter(index => index !== undefined)
        
        return aiMessageIndexes[aiMessageIndexes.length - 1]
    }

    
    const applyLatestCode = () => {
        const lastAIMessagesIndex = getLastAIMessageIndex()

        if (!lastAIMessagesIndex) {
            return
        }

        const lastAIMessage = displayOptimizedChatHistory[lastAIMessagesIndex]
        const code = getCodeBlockFromMessage(lastAIMessage.message)
        writeCodeToActiveCell(notebookTracker, code)
    }

    useEffect(() => {   
        /* 
            Add a new command to the JupyterLab command registry that applies the latest AI generated code
            to the active code cell. Do this inside of the useEffect so that we only register the command
            the first time we create the chat. Registering the command when it is already created causes
            errors.
        */
        app.commands.addCommand(COMMAND_MITO_AI_APPLY_LATEST_CODE, {
            execute: () => {
                console.log('Applying latest code!')
                applyLatestCode()
            }
        })

        app.commands.addKeyBinding({
            command: COMMAND_MITO_AI_APPLY_LATEST_CODE,
            keys: ['Accel Y'],
            selector: 'body',
        });

        /* 
            Add a new command to the JupyterLab command registry that sends the current chat message.
            We use this to automatically send the message when the user adds an error to the chat. 
        */
        app.commands.addCommand(COMMAND_MITO_AI_SEND_MESSAGE, {
            execute: (args?: ReadonlyPartialJSONObject) => {
                if (args?.input) {
                    sendMessageWithInput(args.input.toString())
                }
            }
        })
    }, [])

    const lastAIMessagesIndex = getLastAIMessageIndex()

    return (
        <div className="chat-taskpane">
            <div className="chat-taskpane-header">
                <p className="chat-taskpane-header-title"></p>
                <IconButton 
                    icon={<ResetIcon />}
                    title="Clear the chat history"
                    onClick={() => {
                        setChatHistoryManager(getDefaultChatHistoryManager())
                    }}
                />
            </div>
            <div className="chat-messages">
                {displayOptimizedChatHistory.map((displayOptimizedChat, index) => {
                    return (
                        <ChatMessage 
                            message={displayOptimizedChat.message}
                            error={displayOptimizedChat.error || false}
                            messageIndex={index}
                            notebookTracker={notebookTracker}
                            rendermime={rendermime}
                            app={app}
                            isLastAiMessage={index === lastAIMessagesIndex}
                        />
                    )
                }).filter(message => message !== null)}
            </div>
            {loadingAIResponse && 
                <div className="chat-loading-message">
                    Loading AI Response <LoadingDots />
                </div>
            }
            <textarea
                ref={textareaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={displayOptimizedChatHistory.length < 2 ? "Ask your personal Python expert anything!" : "Follow up on the conversation"}
                value={input}
                onChange={(e) => {setInput(e.target.value)}}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessageFromChat();
                    }
                }}
            />
        </div>
    );
};

export default ChatTaskpane;