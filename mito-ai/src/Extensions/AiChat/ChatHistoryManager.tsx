import OpenAI from "openai";
import { IVariableManager } from "../VariableManager/VariableManagerPlugin";
import { INotebookTracker } from '@jupyterlab/notebook';
import { getActiveCellCode } from "../../utils/notebook";

export interface IDisplayOptimizedChatHistory {
    message: OpenAI.Chat.ChatCompletionMessageParam
    type: 'openai message' | 'connection error'
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

/* 
    The ChatHistoryManager is responsible for managing the AI chat history.

    It keeps track of two types of messages:
    1. aiOptimizedChatHistory: Messages sent to the AI that include things like: instructions on how to respond, the code context, etc. 
    2. displayOptimizedChatHistory: Messages displayed in the chat interface that only display info the user wants to see, 
    like their original input.

    TODO: In the future, we should make this its own extension that provides an interface for adding new messages to the chat history,
    creating new chats, etc. Doing so would allow us to easily append new messages from other extensions without having to do so 
    by calling commands with untyped arguments.

    Whenever, the chatHistoryManager is updated, it should automatically send a message to the AI. 
*/
export class ChatHistoryManager {
    private history: IChatHistory;
    private variableManager: IVariableManager;
    private notebookTracker: INotebookTracker;

    constructor(variableManager: IVariableManager, notebookTracker: INotebookTracker, initialHistory?: IChatHistory) {
        // Initialize the history
        this.history = initialHistory || {
            aiOptimizedChatHistory: [],
            displayOptimizedChatHistory: []
        };

        // Save the variable manager
        this.variableManager = variableManager;

        // Save the notebook tracker
        this.notebookTracker = notebookTracker;
    }

    createDuplicateChatHistoryManager(): ChatHistoryManager {
        return new ChatHistoryManager(this.variableManager, this.notebookTracker, this.history);
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

    addGenericUserPromptedMessage(input: string): void {


        const variables = this.variableManager.variables
        const activeCellCode = getActiveCellCode(this.notebookTracker)

        const aiOptimizedMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'user',
            content: `You have access to the following variables:

${variables?.map(variable => `${JSON.stringify(variable, null, 2)}\n`).join('')}

Complete the task below. Decide what variables to use and what changes you need to make to the active code cell. Only return the full new active code cell and a concise explanation of the changes you made.

<Reminders>
Do not: 
- Use the word "I"
- Include multiple approaches in your response
- Recreate variables that already exist

Do: 
- Use the variables that you have access to
- Keep as much of the original code as possible
- Ask for more context if you need it. 

</Reminders>

<Example>

Code in the active code cell:

\`\`\`python
import pandas as pd
loans_df = pd.read_csv('./loans.csv')
\`\`\`

Your task: convert the issue_date column to datetime.

Output:

\`\`\`python
import pandas as pd
loans_df = pd.read_csv('./loans.csv')
loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'])
\`\`\`

Use the pd.to_datetime function to convert the issue_date column to datetime.

</Example>

Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Your task: ${input}`};

        this.history.displayOptimizedChatHistory.push({message: getDisplayedOptimizedUserMessage(input, activeCellCode), type: 'openai message'});
        this.history.aiOptimizedChatHistory.push(aiOptimizedMessage);
    }

    addDebugErrorMessage(errorMessage: string): void {
    
        const activeCellCode = getActiveCellCode(this.notebookTracker)

        const aiOptimizedPrompt = `You just ran the active code cell and received an error. Return the full code cell with the error corrected and a short explanation of the error.
        
Remember that you are executing code inside a Jupyter notebook. That means you will have persistent state issues where variables from previous cells or previous code executions might still affect current code. When those errors occur, here are a few possible solutions:
1. Restarting the kernel to reset the environment if a function or variable has been unintentionally overwritten.
2. Identify which cell might need to be rerun to properly initialize the function or variable that is causing the issue.
        
For example, if an error occurs because the built-in function 'print' is overwritten by an integer, you should return the code cell with the modification to the print function removed and also return an explanation that tell the user to restart their kernel. Do not add new comments to the code cell, just return the code cell with the modification removed.
        
When a user hits an error because of a persistent state issue, tell them how to resolve it.

<Example>

Code in the active code cell:

\`\`\`python
print(y)
\`\`\`

Error Message: 
NameError: name 'y' is not defined

Output:

\`\`\`python
y = 10
print(y)
\`\`\`

The variable y has not yet been created.Define the variable y before printing it.
</Example>
        
Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Error Message: 

${errorMessage}

Output:
`

        this.history.displayOptimizedChatHistory.push({message: getDisplayedOptimizedUserMessage(errorMessage, activeCellCode), type: 'openai message'});
        this.history.aiOptimizedChatHistory.push({role: 'user', content: aiOptimizedPrompt});
    }

    addExplainCodeMessage(): void {
        const activeCellCode = getActiveCellCode(this.notebookTracker)

        const aiOptimizedPrompt = `Explain the code in the active code cell to me like I have a basic understanding of Python. Don't explain each line, but instead explain the overall logic of the code.

<Example>

Code in the active code cell:

\`\`\`python
def multiply(x, y):
    return x * y
\`\`\`

Output:

This code creates a function called \`multiply\` that takes two arguments \`x\` and \`y\`, and returns the product of \`x\` and \`y\`.

</Example>

Code in the active code cell:

\`\`\`python
${activeCellCode}
\`\`\`

Output: 
`

        this.history.displayOptimizedChatHistory.push({message: getDisplayedOptimizedUserMessage('Explain this code', activeCellCode), type: 'openai message'});
        this.history.aiOptimizedChatHistory.push({role: 'user', content: aiOptimizedPrompt});
    }



    addAIMessageFromResponse(message: OpenAI.Chat.Completions.ChatCompletionMessage, mitoAIConnectionError: boolean=false): void {
        if (message.content === null) {
            return
        }

        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: message.content
        }
        this._addAIMessage(aiMessage, mitoAIConnectionError)
    }

    addAIMessageFromMessageContent(message: string, mitoAIConnectionError: boolean=false): void {
        const aiMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'assistant',
            content: message
        }
        this._addAIMessage(aiMessage, mitoAIConnectionError)
    }

    _addAIMessage(aiMessage: OpenAI.Chat.ChatCompletionMessageParam, mitoAIConnectionError: boolean=false): void {
        this.history.displayOptimizedChatHistory.push({message: aiMessage, type: mitoAIConnectionError ? 'connection error' : 'openai message'});
        this.history.aiOptimizedChatHistory.push(aiMessage);
    }

    addSystemMessage(message: string): void {
        const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
            role: 'system',
            content: message
        }
        this.history.displayOptimizedChatHistory.push({message: systemMessage, type: 'openai message'});
        this.history.aiOptimizedChatHistory.push(systemMessage);
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


const getDisplayedOptimizedUserMessage = (input: string, activeCellCode?: string): OpenAI.Chat.ChatCompletionMessageParam => {
    return {
        role: 'user',
        content: `\`\`\`python
${activeCellCode}
\`\`\`

${input}`};
}