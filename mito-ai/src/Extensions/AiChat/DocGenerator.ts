import { ServerError, TimeoutError, ConnectionError, UnknownError, OpenAIError } from '../../utils/errors';
import { INotebookTracker, NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';
import { getSelectedCodeCellIds } from '../../utils/notebook';
import { insertMarkdownBeforeCell, findCellIndexById, getCellCodeByID, writeToCell } from '../../utils/notebook';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import type OpenAI from 'openai';

const LOADING_MARKDOWN = '> *`⏳ Generating documentation... please wait`*';

function simpleDocGenPrompt(combinedCode: string): string {
    return `Please provide a concise markdown documentation for the following code. 
    Please use the markdown format as provided in the examples.

    If the provided code contains a function or a class, please use only the Approach 1. 

    If the provided code contains a variable, please use only the Approach 2. 

    If the provided code contains a logic, please use only the Approach 3. 

    If the provided code contains function calls, please use only the Approach 4. 


Approach 1: 
-----------   
    
Title of the documentation must be chosen depending on the code,  
If it is a function, just use the functon or a class please use the class name or 
function name as the title. And use the following format:

### Title
- Title of the documentation

### Overview
- Briefly describe what the code does.

### Parameters
- List and describe the parameters, if any.

### Returns
- Describe the return value, if any.

### Example
- Provide a simple example of how to use the code.

Approach 2:
-----------

Just use the variable name as the title.
Just explain what it is doing in a few words using markdown format.

Approach 3:
-----------

Just summarize the logic in a few words and pick a title depending on that summary using markdown format. 

Approach 4:
-----------

Please explain the logic, don't use separate sections for parameters and returns. Just output the 
overall logic in a few words using markdown format.

Input
-----

Here is the code to document:

\`\`\`typescript
${combinedCode}
\`\`\``;
}

// Function to get combined code from selected cells
export const getMarkdownDocumentation = async (notebookTracker: INotebookTracker, websocketClient: CompletionWebsocketClient): Promise<void> => {
    const selectedCellIndices = getSelectedCodeCellIds(notebookTracker);
    
    if (selectedCellIndices.length === 0) {
        return;
    }

    // Get the current notebook early
    const currentNotebook: NotebookPanel | null = notebookTracker.currentWidget;
    if (!currentNotebook) {
        console.error('No active notebook found.');
        return;
    }

    // Create loading cell first
    insertMarkdownBeforeCell(currentNotebook, selectedCellIndices[0], LOADING_MARKDOWN);
    // Store the ID of the newly created cell (it will be at targetIndex)
    const loadingCellIndex = findCellIndexById(currentNotebook.content, selectedCellIndices[0]) - 1;
    const loadingCell = currentNotebook.content.widgets[loadingCellIndex];
    
    let combinedCode = '';
    selectedCellIndices.forEach(cellIndex => {
        const cellCode = getCellCodeByID(notebookTracker, cellIndex);
        if (cellCode) {
            combinedCode += cellCode + '\n';
        }
    });
    
    try {

        await websocketClient.ready;

        console.log('Sending message to OpenAI API');

        const prompt = simpleDocGenPrompt(combinedCode);

        const openAIFormattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { "role": "user", "content": prompt },
          ]

        const aiResponse = await websocketClient.sendMessage({
            message_id: UUID.uuid4(),
            messages: openAIFormattedMessages,
            type: 'inline_completion',
            stream: false
        });

        console.log('Received response from OpenAI API');
        console.log(aiResponse);

        if (aiResponse.error) {
            console.error('Error calling OpenAI API:', aiResponse.error);
            throw new OpenAIError(aiResponse.error.hint ? aiResponse.error.hint : `${aiResponse.error.error_type}: ${aiResponse.error.title}`);
        } else {
            console.log('Successfully called OpenAI API:', aiResponse);
            const aiMessage = aiResponse.items[0].content || '';
            if (loadingCell) {
                writeToCell(loadingCell.model, aiMessage);
                NotebookActions.renderAllMarkdown(currentNotebook.content);
            }
        }

        // const apiResponse: any = await Promise.race([fetchPromise, timeoutPromise]);
        
    } catch (error: any) {
        console.error('Error calling API:', error);
        
        let errorMessage = new UnknownError().message;
        
        if (error instanceof TimeoutError) {
            errorMessage = new TimeoutError().message;
        } else if (error.response?.status === 500) {
            errorMessage = new ServerError().message;
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            errorMessage = new ConnectionError().message;
        } else if (error instanceof OpenAIError) {
            errorMessage = new OpenAIError().message;
        }

        const errorDetails = `\n\n<details><summary>Error Details</summary>\n\n\`\`\`\n${error.toString()}\n\`\`\`\n</details>`;

        if (loadingCell) {
            writeToCell(
                loadingCell.model, 
                errorMessage + errorDetails
            );
            NotebookActions.renderAllMarkdown(currentNotebook.content);
        }
    }
}