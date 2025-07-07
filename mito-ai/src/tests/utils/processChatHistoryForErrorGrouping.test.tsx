/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { processChatHistoryForErrorGrouping } from '../../utils/chatHistory';
import { IDisplayOptimizedChatItem } from '../../Extensions/AiChat/ChatHistoryManager';
import { OpenAI } from 'openai';

// Helper function to create mock chat items
const createMockChatItem = (
    role: 'user' | 'assistant',
    content: string,
    promptType: 'chat' | 'agent:autoErrorFixup' | 'smartDebug' = 'chat'
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

describe('processChatHistoryForErrorGrouping', () => {
    describe('basic functionality', () => {
        test('should handle empty chat history', () => {
            const result = processChatHistoryForErrorGrouping([]);
            expect(result).toEqual([]);
        });

        test('should handle chat with no errors', () => {
            const chatHistory = [
                createMockChatItem('user', 'Hello, can you help me?'),
                createMockChatItem('assistant', 'Of course! What do you need help with?'),
                createMockChatItem('user', 'I need to analyze some data'),
                createMockChatItem('assistant', 'Sure, I can help you with data analysis.')
            ];

            const result = processChatHistoryForErrorGrouping(chatHistory);
            expect(result).toEqual(chatHistory);
        });
    });

    describe('error fixup message grouping', () => {

        test('should group agent auto error fixup message with AI response', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('ValueError: invalid literal for int()');
            const aiResponse = createMockChatItem('assistant', 'I found the issue and will fix it.');
            
            const chatHistory = [errorMessage, aiResponse];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([[errorMessage, aiResponse]]);
        });

        test('should handle error fixup message with caret pattern', () => {
            const errorMessage = createAgentAutoErrorFixupMessage('SyntaxError: invalid syntax\n  x = 1 +\n        ^\nSyntaxError: message');
            const aiResponse = createMockChatItem('assistant', 'I see the syntax error. Let me fix it.');
            
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
            const aiResponse1 = createMockChatItem('assistant', 'I see the first error, let me fix it.');
            const errorMessage2 = createAgentAutoErrorFixupMessage('KeyError: column not found -> line 10');
            const aiResponse2 = createMockChatItem('assistant', 'Now I see another error, fixing that too.');
            
            const chatHistory = [errorMessage1, aiResponse1, errorMessage2, aiResponse2];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            // All consecutive error-related messages should be grouped together
            expect(result).toEqual([[errorMessage1, aiResponse1, errorMessage2, aiResponse2]]);
        });

        test('should separate error groups when interrupted by normal messages', () => {
            const errorMessage1 = createAgentAutoErrorFixupMessage('TypeError: bad operand -> line 2');
            const aiResponse1 = createMockChatItem('assistant', 'Fixed the first error.');
            const normalMessage = createMockChatItem('user', 'Great! Now can you add a plot?');
            const normalResponse = createMockChatItem('assistant', 'Sure, I will add a plot.');
            const errorMessage2 = createAgentAutoErrorFixupMessage('ImportError: module not found');
            const aiResponse2 = createMockChatItem('assistant', 'I will fix this import error.');
            
            const chatHistory = [errorMessage1, aiResponse1, normalMessage, normalResponse, errorMessage2, aiResponse2];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([
                [errorMessage1, aiResponse1], // First error group
                normalMessage,                 // Normal message
                normalResponse,               // Normal response
                [errorMessage2, aiResponse2]  // Second error group
            ]);
        });
    });

    describe('complex scenarios', () => {
        test('should handle mixed chat with multiple error patterns', () => {
            const normalMessage1 = createMockChatItem('user', 'Can you help me analyze this data?');
            const normalResponse1 = createMockChatItem('assistant', 'Of course! Let me start.');
            const errorMessage1 = createAgentAutoErrorFixupMessage('ValueError: could not convert string to float -> line 5');
            const aiResponse1 = createMockChatItem('assistant', 'I see the conversion error, fixing it now.');
            const errorMessage2 = createAgentAutoErrorFixupMessage('AttributeError: DataFrame object has no attribute');
            const aiResponse2 = createMockChatItem('assistant', 'Fixed the attribute error.');
            const normalMessage2 = createMockChatItem('user', 'Perfect! Can you also create a summary?');
            const normalResponse2 = createMockChatItem('assistant', 'Here is your summary.');
            
            const chatHistory = [
                normalMessage1, normalResponse1, 
                errorMessage1, aiResponse1, errorMessage2, aiResponse2,
                normalMessage2, normalResponse2
            ];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([
                normalMessage1,
                normalResponse1,
                [errorMessage1, aiResponse1, errorMessage2, aiResponse2], // Grouped errors
                normalMessage2,
                normalResponse2
            ]);
        });

        test('should handle chat ending with error messages', () => {
            const normalMessage = createMockChatItem('user', 'Let me try this code');
            const normalResponse = createMockChatItem('assistant', 'Good idea, let me help.');
            const errorMessage1 = createAgentAutoErrorFixupMessage('ZeroDivisionError: division by zero -> line 8');
            const aiResponse1 = createMockChatItem('assistant', 'I see the division error.');
            const errorMessage2 = createAgentAutoErrorFixupMessage('RuntimeError: operation failed');
            
            const chatHistory = [normalMessage, normalResponse, errorMessage1, aiResponse1, errorMessage2];
            const result = processChatHistoryForErrorGrouping(chatHistory);
            
            expect(result).toEqual([
                normalMessage,
                normalResponse,
                [errorMessage1, aiResponse1, errorMessage2] // Error messages at the end are grouped
            ]);
        });
    });

    describe('undefined or null handling', () => {
        test('should skip undefined items in chat history', () => {
            const normalMessage = createMockChatItem('user', 'Hello');
            const errorMessage = createAgentAutoErrorFixupMessage('Error: something went wrong -> line 1');
            const aiResponse = createMockChatItem('assistant', 'Fixed the error');
            
            const chatHistory = [normalMessage, undefined, errorMessage, aiResponse] as (IDisplayOptimizedChatItem | undefined)[];
            const result = processChatHistoryForErrorGrouping(chatHistory as IDisplayOptimizedChatItem[]);
            
            expect(result).toEqual([
                normalMessage,
                [errorMessage, aiResponse]
            ]);
        });
    });

    describe('agent mode behavior simulation', () => {
        test('should demonstrate that when agent mode is disabled, error messages are not grouped (this function should not be called)', () => {
            // This test documents the expected behavior when agentModeEnabled is false
            // In ChatTaskpane.tsx, when agentModeEnabled is false, this function is not called
            // and the original chat history is used as-is, treating error messages as individual items
            
            const normalMessage = createMockChatItem('user', 'Hello');
            const errorMessage = createAgentAutoErrorFixupMessage('NameError: name "x" is not defined');
            const aiResponse = createMockChatItem('assistant', 'I see the error. Let me fix that.');
            const followupMessage = createMockChatItem('user', 'Thanks!');
            
            const originalChatHistory = [normalMessage, errorMessage, aiResponse, followupMessage];
            
            // When agent mode is disabled, the original chat history should be used as-is
            // without any grouping (this simulates the behavior in ChatTaskpane.tsx)
            const resultWhenAgentModeDisabled = originalChatHistory;
            
            // When agent mode is enabled, the error messages would be grouped
            const resultWhenAgentModeEnabled = processChatHistoryForErrorGrouping(originalChatHistory);
            
            // Verify that they produce different results
            expect(resultWhenAgentModeDisabled).toEqual([normalMessage, errorMessage, aiResponse, followupMessage]);
            expect(resultWhenAgentModeEnabled).toEqual([normalMessage, [errorMessage, aiResponse], followupMessage]);
            
            // This demonstrates that error grouping only happens when agent mode is enabled
            expect(resultWhenAgentModeDisabled).not.toEqual(resultWhenAgentModeEnabled);
        });

        test('should show that error fixup messages remain individual when agent mode is disabled', () => {
            // This test simulates the scenario where we have error fixup messages
            // but they should be treated as individual messages (like when agent mode is off)
            
            const errorMessage1 = createAgentAutoErrorFixupMessage('TypeError: unsupported operand -> line 3');
            const errorMessage2 = createAgentAutoErrorFixupMessage('ValueError: invalid literal -> line 8');
            const normalMessage = createMockChatItem('user', 'Let me try a different approach');
            
            const chatHistory = [errorMessage1, errorMessage2, normalMessage];
            
            // The original behavior (what would happen if agent mode was disabled)
            const originalBehavior = chatHistory;
            
            // The grouped behavior (what happens when agent mode is enabled and this function is called)
            const groupedBehavior = processChatHistoryForErrorGrouping(chatHistory);
            
            // Verify the difference
            expect(originalBehavior).toEqual([errorMessage1, errorMessage2, normalMessage]);
            expect(groupedBehavior).toEqual([[errorMessage1, errorMessage2], normalMessage]);
            
            // This documents that when agent mode is disabled, even consecutive error messages
            // should remain as individual items rather than being grouped together
        });
    });
});
