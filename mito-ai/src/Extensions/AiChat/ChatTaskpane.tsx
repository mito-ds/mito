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
import { OperatingSystem } from '../../utils/user';


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
    operatingSystem: OperatingSystem
}

const ChatTaskpane: React.FC<IChatTaskpaneProps> = ({
    notebookTracker, 
    rendermime, 
    variableManager, 
    app,
    operatingSystem
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [chatHistoryManager, setChatHistoryManager] = useState<ChatHistoryManager>(() => getDefaultChatHistoryManager());
    const [input, setInput] = useState('');
    const [loadingAIResponse, setLoadingAIResponse] = useState<boolean>(false)
    const chatHistoryManagerRef = useRef<ChatHistoryManager>(chatHistoryManager);

    useEffect(() => {
        /* 
            Why we use a ref (chatHistoryManagerRef) instead of directly accessing the state (chatHistoryManager):

            The reason we use a ref here is because the function `applyLatestCode` is registered once 
            when the component mounts via `app.commands.addCommand`. If we directly used `chatHistoryManager`
            in the command's execute function, it would "freeze" the state at the time of the registration 
            and wouldn't update as the state changes over time.

            React's state (`useState`) is asynchronous, and the registered command won't automatically pick up the 
            updated state unless the command is re-registered every time the state changes, which would require 
            unregistering and re-registering the command, causing unnecessary complexity.

            By using a ref (`chatHistoryManagerRef`), we are able to keep a persistent reference to the 
            latest version of `chatHistoryManager`, which is updated in this effect whenever the state 
            changes. This allows us to always access the most recent state of `chatHistoryManager` in the 
            `applyLatestCode` function, without needing to re-register the command or cause unnecessary re-renders.

            We still use `useState` for `chatHistoryManager` so that we can trigger a re-render of the chat
            when the state changes.
        */
        chatHistoryManagerRef.current = chatHistoryManager;
    }, [chatHistoryManager]);

    // TextAreas cannot automatically adjust their height based on the content that they contain, 
    // so instead we re-adjust the height as the content changes here. 
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return
        }
        textarea.style.height = 'auto';

        // The height should be 20 at minimum to support the placeholder
        const height = textarea.scrollHeight < 20 ? 20 : textarea.scrollHeight
        textarea.style.height = `${height}px`;
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

    const applyLatestCode = () => {
        const latestChatHistoryManager = chatHistoryManagerRef.current;
        const lastAIMessage = latestChatHistoryManager.getLastAIMessage()
        
        if (!lastAIMessage) {
            return
        }

        const code = getCodeBlockFromMessage(lastAIMessage.message);
        writeCodeToActiveCell(notebookTracker, code, true)
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

    const lastAIMessagesIndex = chatHistoryManager.getLastAIMessageIndex()

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
                            operatingSystem={operatingSystem}
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
                    // Enter key sends the message, but we still want to allow 
                    // shift + enter to add a new line.
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessageFromChat();
                    } 
                }}
            />
        </div>
    );
};

export default ChatTaskpane;