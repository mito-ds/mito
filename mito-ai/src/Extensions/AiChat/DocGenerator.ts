import { ServerError, TimeoutError, ConnectionError, UnknownError, OpenAIError } from '../../utils/errors';
import { INotebookTracker, NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { UUID } from '@lumino/coreutils';
import { getSelectedCodeCellIds } from '../../utils/notebook';
import { insertMarkdownBeforeCell, findCellIndexById, getCellCodeByID, writeToCell } from '../../utils/notebook';
import { CompletionWebsocketClient } from '../../utils/websocket/websocketClient';
import type OpenAI from 'openai';

const LOADING_MARKDOWN = '> *`⏳ Generating documentation... please wait`*';

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

        const prompt = "Write markdown documentation for the following code:\n" + combinedCode;

        const openAIFormattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { "role": "user", "content": prompt },
          ]

        const aiResponse = await websocketClient.sendMessage({
            message_id: UUID.uuid4(),
            messages: openAIFormattedMessages,
            type: 'inline_completion',
            stream: true
        });

        console.log('Received response from OpenAI API');
        console.log(aiResponse);

        const errorMessage = aiResponse.error?.hint ? aiResponse.error.hint : `${aiResponse.error?.error_type}: ${aiResponse.error?.title}`;
        if (errorMessage) {
            console.error('Error calling OpenAI API:', aiResponse.error);
            throw new OpenAIError(errorMessage);
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

        // Add error details for debugging (only in development)
        const errorDetails = process.env.NODE_ENV === 'development' 
            ? `\n\n<details><summary>Error Details</summary>\n\n\`\`\`\n${error.toString()}\n\`\`\`\n</details>`
            : '';

        if (loadingCell) {
            writeToCell(
                loadingCell.model, 
                errorMessage + errorDetails
            );
            NotebookActions.renderAllMarkdown(currentNotebook.content);
        }
    }
}