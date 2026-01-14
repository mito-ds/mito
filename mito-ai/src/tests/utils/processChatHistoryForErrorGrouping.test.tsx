/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { processChatHistoryForErrorGrouping } from '../../utils/chatHistory';
import { IDisplayOptimizedChatItem } from '../../Extensions/AiChat/ChatHistoryManager';
import { OpenAI } from 'openai';

// Helper function to create mock chat items
// Note: This function is used for testing processChatHistoryForErrorGrouping, which only runs in agent mode.
// Therefore, the default promptType is 'agent:execution' instead of 'chat'.
const createMockChatItem = (
    role: 'user' | 'assistant',
    content: string,
    promptType: 'chat' | 'agent:execution' | 'agent:autoErrorFixup' | 'smartDebug' = 'agent:execution'
): IDisplayOptimizedChatItem => ({
    message: {
        role,
        content
    } as OpenAI.Chat.ChatCompletionMessageParam,
    type: 'openai message',
    promptType,
    codeCellID: undefined
});

// Helper function to create agent auto error fixup message
const createAgentAutoErrorFixupMessage = (content: string): IDisplayOptimizedChatItem => ({
    message: {
        role: 'user',
        content
    } as OpenAI.Chat.ChatCompletionMessageParam,
    type: 'openai message',
    promptType: 'agent:autoErrorFixup',
    codeCellID: undefined
});

// Helper function to create assistant message with specific agentResponse type
const createAssistantMessageWithAgentResponse = (
    content: string,
    agentResponseType: 'cell_update' | 'run_all_cells' | 'finished_task' | 'ask_user_question',
    agentResponse?: any
): IDisplayOptimizedChatItem => ({
    message: {
        role: 'assistant',
        content
    } as OpenAI.Chat.ChatCompletionMessageParam,
    type: 'openai message',
    promptType: 'agent:execution',
    codeCellID: undefined,
    agentResponse: agentResponse || {
        type: agentResponseType,
        message: content
    }
});

describe('processChatHistoryForErrorGrouping', () => {
    describe('basic functionality', () => {
        test('should handle empty chat history', () => {
            const result = processChatHistoryForErrorGrouping([]);
            expect(result).toEqual([]);
        });

        test('should handle agent execution with no errors', () => {
            // In agent mode, messages are agent execution messages with structured responses
            const userMessage = createMockChatItem('user', 'Import data from stocks.csv');
            const agentResponse = createAssistantMessageWithAgentResponse('I will import the data.', 'cell_update');
            
            const chatHistory = [userMessage, agentResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            // No errors, so no grouping - messages remain as-is
            expect(result).toEqual(chatHistory);
        });
    });

    describe('error fixup message grouping', () => {

        test('should group agent auto error fixup message with AI response', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('ValueError: invalid literal for int()');
            const aiResponse = createAssistantMessageWithAgentResponse('I found the issue and will fix it.', 'cell_update');
            
            const chatHistory = [errorMessage, aiResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([[errorMessage, aiResponse]]);
        });

        test('should handle error fixup message with caret pattern', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('SyntaxError: invalid syntax\n  x = 1 +\n        ^\nSyntaxError: message');
            const aiResponse = createAssistantMessageWithAgentResponse('I see the syntax error. Let me fix it.', 'cell_update');
            
            const chatHistory = [errorMessage, aiResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([[errorMessage, aiResponse]]);
        });
    });

    describe('edge cases', () => {
        test('should handle error fixup message when next message is another user message', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('TypeError: unsupported operand type -> line 3');
            const userMessage = createMockChatItem('user', 'Actually, can you try a different approach?');
            
            const chatHistory = [errorMessage, userMessage];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            // Error message should not get grouped with the user message
            expect(result).toEqual([[errorMessage], userMessage]);
        });

        test('should handle error fixup message with no following message', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('IndexError: list index out of range -> line 10');
            
            const chatHistory = [errorMessage];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([[errorMessage]]);
        });

        test('should handle back-to-back error messages', () => {
            const errorMessage1 = createAgentAutoErrorFixupMessage('NameError: name "df" is not defined -> line 1');
            const aiResponse1 = createAssistantMessageWithAgentResponse('I see the first error, let me fix it.', 'cell_update');
            const errorMessage2 = createAgentAutoErrorFixupMessage('KeyError: column not found -> line 10');
            const aiResponse2 = createAssistantMessageWithAgentResponse('Now I see another error, fixing that too.', 'cell_update');
            
            const chatHistory = [errorMessage1, aiResponse1, errorMessage2, aiResponse2];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            // All consecutive error-related messages should be grouped together
            expect(result).toEqual([[errorMessage1, aiResponse1, errorMessage2, aiResponse2]]);
        });

        test('should separate error groups when interrupted by agent execution messages', () => {
            // In agent mode, messages between errors would be agent execution messages, not regular chat
            const errorMessage1 = createAgentAutoErrorFixupMessage('TypeError: bad operand -> line 2');
            const aiResponse1 = createAssistantMessageWithAgentResponse('Fixed the first error.', 'cell_update');
            const userMessage = createMockChatItem('user', 'Great! Now can you add a plot?');
            const agentResponse = createAssistantMessageWithAgentResponse('Sure, I will add a plot.', 'cell_update');
            const errorMessage2 = createAgentAutoErrorFixupMessage('ImportError: module not found');
            const aiResponse2 = createAssistantMessageWithAgentResponse('I will fix this import error.', 'cell_update');
            
            const chatHistory = [errorMessage1, aiResponse1, userMessage, agentResponse, errorMessage2, aiResponse2];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([
                [errorMessage1, aiResponse1], // First error group
                userMessage,                   // User message (not grouped)
                agentResponse,                 // Agent response (not grouped, no error before it)
                [errorMessage2, aiResponse2]  // Second error group
            ]);
        });
    });

    describe('complex scenarios', () => {
        test('should handle agent execution with multiple error patterns', () => {
            // In agent mode, all messages are part of agent execution flow
            const userMessage1 = createMockChatItem('user', 'Can you help me analyze this data?');
            const agentResponse1 = createAssistantMessageWithAgentResponse('Of course! Let me start.', 'cell_update');
            const errorMessage1 = createAgentAutoErrorFixupMessage('ValueError: could not convert string to float -> line 5');
            const aiResponse1 = createAssistantMessageWithAgentResponse('I see the conversion error, fixing it now.', 'cell_update');
            const errorMessage2 = createAgentAutoErrorFixupMessage('AttributeError: DataFrame object has no attribute');
            const aiResponse2 = createAssistantMessageWithAgentResponse('Fixed the attribute error.', 'cell_update');
            const userMessage2 = createMockChatItem('user', 'Perfect! Can you also create a summary?');
            const agentResponse2 = createAssistantMessageWithAgentResponse('Here is your summary.', 'finished_task');
            
            const chatHistory = [
                userMessage1, agentResponse1, 
                errorMessage1, aiResponse1, errorMessage2, aiResponse2,
                userMessage2, agentResponse2
            ];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([
                userMessage1,
                agentResponse1,
                [errorMessage1, aiResponse1, errorMessage2, aiResponse2], // Grouped errors
                userMessage2,
                agentResponse2
            ]);
        });

        test('should handle agent execution ending with error messages', () => {
            const userMessage = createMockChatItem('user', 'Let me try this code');
            const agentResponse = createAssistantMessageWithAgentResponse('Good idea, let me help.', 'cell_update');
            const errorMessage1 = createAgentAutoErrorFixupMessage('ZeroDivisionError: division by zero -> line 8');
            const aiResponse1 = createAssistantMessageWithAgentResponse('I see the division error.', 'cell_update');
            const errorMessage2 = createAgentAutoErrorFixupMessage('RuntimeError: operation failed');
            
            const chatHistory = [userMessage, agentResponse, errorMessage1, aiResponse1, errorMessage2];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([
                userMessage,
                agentResponse,
                [errorMessage1, aiResponse1, errorMessage2] // Error messages at the end are grouped
            ]);
        });
    });

    describe('undefined or null handling', () => {
        test('should skip undefined items in chat history', () => {
            const userMessage = createMockChatItem('user', 'Hello');
            const errorMessage = createAgentAutoErrorFixupMessage('Error: something went wrong -> line 1');
            const aiResponse = createAssistantMessageWithAgentResponse('Fixed the error', 'cell_update');
            
            const chatHistory = [userMessage, undefined, errorMessage, aiResponse] as (IDisplayOptimizedChatItem | undefined)[];
            const result = processChatHistoryForErrorGrouping(chatHistory as IDisplayOptimizedChatItem[]);
            
            expect(result).toEqual([
                userMessage,
                [errorMessage, aiResponse]
            ]);
        });
    });

    describe('agent mode behavior simulation', () => {
        test('should demonstrate that this function only runs in agent mode', () => {
            // This test documents that processChatHistoryForErrorGrouping is only called when agentModeEnabled is true
            // In ChatTaskpane.tsx, when agentModeEnabled is false, this function is not called at all
            // All messages in agent mode should have structured agentResponse types
            
            const userMessage = createMockChatItem('user', 'Hello');
            const errorMessage = createAgentAutoErrorFixupMessage('NameError: name "x" is not defined');
            const aiResponse = createAssistantMessageWithAgentResponse('I see the error. Let me fix that.', 'cell_update');
            const followupMessage = createMockChatItem('user', 'Thanks!');
            
            const agentModeChatHistory = [userMessage, errorMessage, aiResponse, followupMessage];
            
            // When agent mode is enabled, error messages are grouped with their responses
            const resultWhenAgentModeEnabled = processChatHistoryForErrorGrouping(agentModeChatHistory);
            
            // Verify grouping behavior in agent mode
            expect(resultWhenAgentModeEnabled).toEqual([userMessage, [errorMessage, aiResponse], followupMessage]);
        });

        test('should handle consecutive error messages without assistant responses', () => {
            // In agent mode, error messages should always be followed by assistant responses.
            // However, if we encounter consecutive error messages (edge case - e.g., agent was stopped),
            // each should be treated as a standalone error group since there's no assistant response to group with.
            
            const errorMessage1 = createAgentAutoErrorFixupMessage('TypeError: unsupported operand -> line 3');
            const errorMessage2 = createAgentAutoErrorFixupMessage('ValueError: invalid literal -> line 8');
            const userMessage = createMockChatItem('user', 'Let me try a different approach');
            
            const chatHistory = [errorMessage1, errorMessage2, userMessage];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            // Each error message should be in its own group since there's no assistant response to group with
            expect(result).toEqual([[errorMessage1], [errorMessage2], userMessage]);
        });
    });

    describe('scratchpad result association', () => {
        // Helper function to create a scratchpad tool call message
        const createScratchpadMessage = (
            code: string
        ): IDisplayOptimizedChatItem => ({
            message: {
                role: 'assistant',
                content: `Executing scratchpad code: ${code}`
            } as OpenAI.Chat.ChatCompletionMessageParam,
            type: 'openai message',
            promptType: 'agent:execution',
            codeCellID: undefined,
            agentResponse: {
                type: 'scratchpad',
                message: 'Running scratchpad code',
                scratchpad_code: code
            }
        });

        // Helper function to create a user message with scratchpad result
        const createScratchpadResultMessage = (
            result: string
        ): IDisplayOptimizedChatItem => ({
            message: {
                role: 'user',
                content: `Scratchpad result: ${result}`
            } as OpenAI.Chat.ChatCompletionMessageParam,
            type: 'openai message',
            promptType: 'agent:scratchpad-result',
            codeCellID: undefined,
            scratchpadResult: result
        });

        test('should associate scratchpad result with scratchpad tool call', () => {
            const userMessage = createMockChatItem('user', 'Calculate the sum of column A');
            const scratchpadMessage = createScratchpadMessage('df["A"].sum()');
            const scratchpadResultMessage = createScratchpadResultMessage('150');
            const finishedTask = createAssistantMessageWithAgentResponse(
                'The sum is 150.',
                'finished_task'
            );

            const chatHistory = [userMessage, scratchpadMessage, scratchpadResultMessage, finishedTask];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Verify scratchpad message now has the scratchpadResult attached
            expect(result).toHaveLength(4);
            expect(result[0]).toEqual(userMessage);
            
            // The scratchpad message should have scratchpadResult copied from the next message
            const processedScratchpadMessage = result[1] as IDisplayOptimizedChatItem;
            expect(processedScratchpadMessage.scratchpadResult).toBe('150');
            expect(processedScratchpadMessage.agentResponse?.type).toBe('scratchpad');
            
            expect(result[2]).toEqual(scratchpadResultMessage);
            expect(result[3]).toEqual(finishedTask);
        });

        test('should not modify scratchpad message when no result follows', () => {
            const userMessage = createMockChatItem('user', 'Calculate something');
            const scratchpadMessage = createScratchpadMessage('df.shape');

            const chatHistory = [userMessage, scratchpadMessage];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Scratchpad message at end of history should not have scratchpadResult
            expect(result).toHaveLength(2);
            const processedScratchpadMessage = result[1] as IDisplayOptimizedChatItem;
            expect(processedScratchpadMessage.scratchpadResult).toBeUndefined();
        });

        test('should not associate result when next message is not a scratchpad result', () => {
            const userMessage = createMockChatItem('user', 'Calculate something');
            const scratchpadMessage = createScratchpadMessage('df.shape');
            const regularMessage = createMockChatItem('user', 'Thanks for the help!');

            const chatHistory = [userMessage, scratchpadMessage, regularMessage];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Scratchpad message should not have scratchpadResult when next message doesn't have one
            expect(result).toHaveLength(3);
            const processedScratchpadMessage = result[1] as IDisplayOptimizedChatItem;
            expect(processedScratchpadMessage.scratchpadResult).toBeUndefined();
        });

        test('should handle multiple scratchpad calls in sequence', () => {
            const userMessage = createMockChatItem('user', 'Analyze this data');
            const scratchpad1 = createScratchpadMessage('df.shape');
            const scratchpadResult1 = createScratchpadResultMessage('(100, 5)');
            const scratchpad2 = createScratchpadMessage('df.dtypes');
            const scratchpadResult2 = createScratchpadResultMessage('A: int64, B: float64');
            const finishedTask = createAssistantMessageWithAgentResponse(
                'Analysis complete.',
                'finished_task'
            );

            const chatHistory = [
                userMessage, 
                scratchpad1, scratchpadResult1, 
                scratchpad2, scratchpadResult2, 
                finishedTask
            ];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Both scratchpad messages should have their results associated
            expect(result).toHaveLength(6);
            
            const processedScratchpad1 = result[1] as IDisplayOptimizedChatItem;
            expect(processedScratchpad1.scratchpadResult).toBe('(100, 5)');
            
            const processedScratchpad2 = result[3] as IDisplayOptimizedChatItem;
            expect(processedScratchpad2.scratchpadResult).toBe('A: int64, B: float64');
        });

        test('should handle scratchpad followed by error fixup', () => {
            const userMessage = createMockChatItem('user', 'Process data');
            const scratchpadMessage = createScratchpadMessage('df["missing_col"]');
            const scratchpadResultMessage = createScratchpadResultMessage('KeyError: missing_col');
            const errorMessage = createAgentAutoErrorFixupMessage('KeyError: missing_col not found');
            const errorFixResponse = createAssistantMessageWithAgentResponse('Fixing the error', 'cell_update');

            const chatHistory = [
                userMessage, 
                scratchpadMessage, 
                scratchpadResultMessage, 
                errorMessage, 
                errorFixResponse
            ];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Scratchpad should have result, and error messages should be grouped
            expect(result).toHaveLength(4);
            expect(result[0]).toEqual(userMessage);
            
            const processedScratchpad = result[1] as IDisplayOptimizedChatItem;
            expect(processedScratchpad.scratchpadResult).toBe('KeyError: missing_col');
            
            expect(result[2]).toEqual(scratchpadResultMessage);
            
            // Error messages should be grouped together
            const errorGroup = result[3] as IDisplayOptimizedChatItem[];
            expect(Array.isArray(errorGroup)).toBe(true);
            expect(errorGroup).toHaveLength(2);
        });
    });

    describe('agent response type filtering', () => {
        test('should group error with cell_update response', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('FileNotFoundError: stocks.csv not found');
            const cellUpdateResponse = createAssistantMessageWithAgentResponse(
                'I will fix the file path issue.',
                'cell_update',
                {
                    type: 'cell_update',
                    message: 'I will fix the file path issue.',
                    cell_update: {
                        type: 'new',
                        after_cell_id: 'some-cell-id',
                        code: 'df = pd.read_csv("stocks.csv")',
                        code_summary: 'Loading stocks data',
                        cell_type: 'code'
                    }
                }
            );

            const chatHistory = [errorMessage, cellUpdateResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Error and cell_update should be grouped together
            expect(result).toEqual([[errorMessage, cellUpdateResponse]]);
        });

        test('should group multiple error/cell_update cycles', () => {
            const error1 = createAgentAutoErrorFixupMessage('FileNotFoundError: stocks.csv not found');
            const cellUpdate1 = createAssistantMessageWithAgentResponse('Fixing file path', 'cell_update');
            const error2 = createAgentAutoErrorFixupMessage('KeyError: column not found');
            const cellUpdate2 = createAssistantMessageWithAgentResponse('Fixing column name', 'cell_update');
            const error3 = createAgentAutoErrorFixupMessage('ValueError: invalid data type');
            const cellUpdate3 = createAssistantMessageWithAgentResponse('Fixing data type', 'cell_update');

            const chatHistory = [error1, cellUpdate1, error2, cellUpdate2, error3, cellUpdate3];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // All error/cell_update pairs should be grouped together
            expect(result).toEqual([[error1, cellUpdate1, error2, cellUpdate2, error3, cellUpdate3]]);
        });

        test('should NOT group error with finished_task response', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('FileNotFoundError: stocks.csv not found');
            const finishedTaskResponse = createAssistantMessageWithAgentResponse(
                'I cannot proceed without the file. Please provide the file path.',
                'finished_task',
                {
                    type: 'finished_task',
                    message: 'I cannot proceed without the file. Please provide the file path.',
                    next_steps: ['Provide the file path', 'Create sample data']
                }
            );

            const chatHistory = [errorMessage, finishedTaskResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Error should be standalone, finished_task should be separate (not grouped)
            expect(result).toEqual([[errorMessage], finishedTaskResponse]);
        });

        test('should NOT group error with ask_user_question response', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('FileNotFoundError: stocks.csv not found');
            const askUserQuestionResponse = createAssistantMessageWithAgentResponse(
                'I need to know how to proceed.',
                'ask_user_question',
                {
                    type: 'ask_user_question',
                    message: 'The file stocks.csv does not exist.',
                    question: 'Where is the stocks.csv file located, or would you like me to create sample stock data?',
                    answers: ['The file is in a different folder', 'Create sample stock data']
                }
            );

            const chatHistory = [errorMessage, askUserQuestionResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Error should be standalone, ask_user_question should be separate (not grouped)
            expect(result).toEqual([[errorMessage], askUserQuestionResponse]);
        });

        test('should group error with run_all_cells response', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('NameError: name "df" is not defined');
            const runAllCellsResponse = createAssistantMessageWithAgentResponse(
                'I will run all cells to bring variables into scope.',
                'run_all_cells',
                {
                    type: 'run_all_cells',
                    message: 'I will run all cells to bring variables into scope.'
                }
            );

            const chatHistory = [errorMessage, runAllCellsResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // Error and run_all_cells should be grouped together
            expect(result).toEqual([[errorMessage, runAllCellsResponse]]);
        });

        test('should handle mixed response types in error sequence', () => {
            const error1 = createAgentAutoErrorFixupMessage('FileNotFoundError: stocks.csv not found');
            const cellUpdate1 = createAssistantMessageWithAgentResponse('Fixing file path', 'cell_update');
            const error2 = createAgentAutoErrorFixupMessage('KeyError: column not found');
            const askUserQuestion = createAssistantMessageWithAgentResponse(
                'I need clarification.',
                'ask_user_question',
                {
                    type: 'ask_user_question',
                    message: 'I need to know which column to use.',
                    question: 'Which column should I use?',
                    answers: ['Column A', 'Column B']
                }
            );
            const error3 = createAgentAutoErrorFixupMessage('ValueError: invalid data');
            const finishedTask = createAssistantMessageWithAgentResponse(
                'Task completed.',
                'finished_task',
                {
                    type: 'finished_task',
                    message: 'Task completed.',
                    next_steps: []
                }
            );

            const chatHistory = [error1, cellUpdate1, error2, askUserQuestion, error3, finishedTask];
            const result = processChatHistoryForErrorGrouping(chatHistory);

            // All consecutive error messages and their cell_update responses are grouped together.
            // This keeps the error-fixing flow collapsed in the UI.
            // When a non-groupable response (ask_user_question, finished_task) appears,
            // it ends the group and displays separately with its dedicated UI component.
            expect(result).toEqual([
                [error1, cellUpdate1, error2],  // All error-fixing grouped together
                askUserQuestion,                 // Separate: ask_user_question with UI
                [error3],                        // Standalone: error (finished_task not grouped)
                finishedTask                     // Separate: finished_task with UI
            ]);
        });
    });
});
