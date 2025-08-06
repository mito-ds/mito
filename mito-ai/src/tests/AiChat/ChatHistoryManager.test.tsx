/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ChatHistoryManager, IDisplayOptimizedChatItem } from '../../Extensions/AiChat/ChatHistoryManager';
import { IContextManager } from '../../Extensions/ContextManager/ContextManagerPlugin';
import { INotebookTracker } from '@jupyterlab/notebook';

// Mock the notebook utilities
jest.mock('../../utils/notebook', () => ({
    getActiveCellCode: jest.fn(() => 'test code'),
    getActiveCellID: jest.fn(() => 'test-cell-id'),
    getAIOptimizedCells: jest.fn(() => []),
    getCellCodeByID: jest.fn(() => 'test code')
}));

// Mock the user utilities
jest.mock('../../utils/user', () => ({
    isChromeBasedBrowser: jest.fn(() => true)
}));

describe('ChatHistoryManager', () => {
    let mockContextManager: IContextManager;
    let mockNotebookTracker: INotebookTracker;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock context manager
        mockContextManager = {
            variables: [],
            files: [],
            setVariables: jest.fn(),
            setFiles: jest.fn()
        } as IContextManager;

        // Create mock notebook tracker
        mockNotebookTracker = {} as INotebookTracker;
    });

    describe('Constructor and Basic Functionality', () => {
        it('should initialize with empty history when no initial history is provided', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            expect(history).toEqual([]);
        });

        it('should initialize with provided history when initial history is provided', () => {
            const initialHistory: IDisplayOptimizedChatItem[] = [
                {
                    message: { role: 'user', content: 'Hello' },
                    type: 'openai message',
                    promptType: 'chat'
                }
            ];

            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker,
                initialHistory
            );

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            expect(history).toEqual(initialHistory);
        });

        it('should initialize assumptions from existing history with agent responses', () => {
            const initialHistory: IDisplayOptimizedChatItem[] = [
                {
                    message: { role: 'assistant', content: 'Response with assumptions' },
                    type: 'openai message',
                    promptType: 'agent:execution',
                    agentResponse: {
                        type: 'finished_task',
                        message: 'Test response',
                        analysis_assumptions: ['assumption1', 'assumption2']
                    }
                }
            ];

            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker,
                initialHistory
            );

            // Test that assumptions are properly initialized by adding a duplicate assumption
            const duplicateResponse = {
                type: 'finished_task' as const,
                message: 'Another response',
                analysis_assumptions: ['assumption1', 'assumption3'] // assumption1 is duplicate
            };

            chatHistoryManager.addAIMessageFromAgentResponse(duplicateResponse);

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            const lastMessage = history[history.length - 1];

            // Should only include the new assumption (assumption3), not the duplicate (assumption1)
            expect(lastMessage?.agentResponse?.analysis_assumptions).toEqual(['assumption3']);
        });
    });

    describe('Low-Level Message Utilities', () => {
        it('should add chat message from history', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            const message = { role: 'user' as const, content: 'Test message' };
            chatHistoryManager.addChatMessageFromHistory(message);

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            expect(history).toHaveLength(1);
            expect(history[0]?.message).toEqual(message);
            expect(history[0]?.type).toBe('openai message');
            expect(history[0]?.promptType).toBe('chat');
        });

        it('should add AI message from response', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            chatHistoryManager.addAIMessageFromResponse('AI response content', 'chat');

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            expect(history).toHaveLength(1);
            expect(history[0]?.message).toEqual({
                role: 'assistant',
                content: 'AI response content'
            });
            expect(history[0]?.type).toBe('openai message');
            expect(history[0]?.promptType).toBe('chat');
        });

        it('should handle null message content gracefully', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            chatHistoryManager.addAIMessageFromResponse(null, 'chat');

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            expect(history).toHaveLength(0); // Should not add null message
        });

        it('should drop messages starting at specified index', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            // Add some messages
            chatHistoryManager.addChatMessageFromHistory({ role: 'user', content: 'Message 1' });
            chatHistoryManager.addChatMessageFromHistory({ role: 'user', content: 'Message 2' });
            chatHistoryManager.addChatMessageFromHistory({ role: 'user', content: 'Message 3' });

            // Drop messages starting at index 1
            chatHistoryManager.dropMessagesStartingAtIndex(1);

            const history = chatHistoryManager.getDisplayOptimizedHistory();
            expect(history).toHaveLength(1);
            expect(history[0]?.message.content).toBe('Message 1');
        });

        it('should create duplicate chat history manager with same state', () => {
            const initialHistory: IDisplayOptimizedChatItem[] = [
                {
                    message: { role: 'user', content: 'Original message' },
                    type: 'openai message',
                    promptType: 'chat'
                }
            ];

            const originalManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker,
                initialHistory
            );

            const duplicateManager = originalManager.createDuplicateChatHistoryManager();

            const originalHistory = originalManager.getDisplayOptimizedHistory();
            const duplicateHistory = duplicateManager.getDisplayOptimizedHistory();

            expect(duplicateHistory).toEqual(originalHistory);
        });
    });

    describe('High-Level Chat Workflows', () => {
        it('should add chat input message with metadata', async () => {
            const manager = new ChatHistoryManager(mockContextManager, mockNotebookTracker);

            const metadata = await manager.addChatInputMessage('Test input', 'thread-123');

            expect(metadata.promptType).toBe('chat');
            expect(metadata.input).toBe('Test input');
            expect(metadata.threadId).toBe('thread-123');

            const history = manager.getDisplayOptimizedHistory();
            expect(history).toHaveLength(1);
            expect(history[0]?.message.content).toContain('Test input');
        });

        it('should add agent execution message', () => {
            const manager = new ChatHistoryManager(mockContextManager, mockNotebookTracker);

            const metadata = manager.addAgentExecutionMessage('thread-123', 'Execute this');

            expect(metadata.promptType).toBe('agent:execution');
            expect(metadata.input).toBe('Execute this');
            expect(metadata.threadId).toBe('thread-123');
        });

        it('should add smart debug message', () => {
            const manager = new ChatHistoryManager(mockContextManager, mockNotebookTracker);

            const metadata = manager.addSmartDebugMessage('thread-123', 'Error message');

            expect(metadata.promptType).toBe('smartDebug');
            expect(metadata.errorMessage).toBe('Error message');
        });

        it('should add agent smart debug message', () => {
            const manager = new ChatHistoryManager(mockContextManager, mockNotebookTracker);

            const metadata = manager.addAgentSmartDebugMessage('thread-123', 'Agent error');

            expect(metadata.promptType).toBe('agent:autoErrorFixup');
            expect(metadata.errorMessage).toBe('Agent error');
        });

        it('should add explain code message', () => {
            const manager = new ChatHistoryManager(mockContextManager, mockNotebookTracker);

            const metadata = manager.addExplainCodeMessage('thread-123');

            expect(metadata.promptType).toBe('codeExplain');
            expect(metadata.threadId).toBe('thread-123');
        });
    });

    describe('Assumption Deduplication', () => {
        it('should preserve assumptions when creating duplicate chat history manager', () => {
            // Create initial history with agent responses containing assumptions
            const initialHistory: IDisplayOptimizedChatItem[] = [
                {
                    message: { role: 'assistant', content: 'First response' },
                    type: 'openai message',
                    promptType: 'agent:execution',
                    agentResponse: {
                        type: 'finished_task' as const,
                        message: 'First response',
                        analysis_assumptions: ['assumption1', 'assumption2']
                    }
                },
                {
                    message: { role: 'assistant', content: 'Second response' },
                    type: 'openai message',
                    promptType: 'agent:execution',
                    agentResponse: {
                        type: 'finished_task' as const,
                        message: 'Second response',
                        analysis_assumptions: ['assumption3', 'assumption4']
                    }
                }
            ];

            const originalManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker,
                initialHistory
            );

            // Create duplicate manager
            const duplicateManager = originalManager.createDuplicateChatHistoryManager();

            // Add a new agent response with duplicate assumptions to the duplicate manager
            const newResponse = {
                type: 'finished_task' as const,
                message: 'New response',
                analysis_assumptions: ['assumption1', 'assumption5'] // assumption1 is duplicate
            };

            duplicateManager.addAIMessageFromAgentResponse(newResponse);

            // Get the history from duplicate manager
            const duplicateHistory = duplicateManager.getDisplayOptimizedHistory();
            const lastMessage = duplicateHistory[duplicateHistory.length - 1];

            // Should only include the new assumption (assumption5), not the duplicate (assumption1)
            expect(lastMessage?.agentResponse?.analysis_assumptions).toEqual(['assumption5']);
        });

        it('should correctly deduplicate assumptions across multiple agent responses', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            // Add first agent response with assumptions
            const firstResponse = {
                type: 'finished_task' as const,
                message: 'First response',
                analysis_assumptions: ['assumption1', 'assumption2', 'assumption3']
            };
            chatHistoryManager.addAIMessageFromAgentResponse(firstResponse);

            // Add second agent response with some duplicate assumptions
            const secondResponse = {
                type: 'finished_task' as const,
                message: 'Second response',
                analysis_assumptions: ['assumption2', 'assumption4', 'assumption5'] // assumption2 is duplicate
            };
            chatHistoryManager.addAIMessageFromAgentResponse(secondResponse);

            // Add third agent response with more duplicates
            const thirdResponse = {
                type: 'finished_task' as const,
                message: 'Third response',
                analysis_assumptions: ['assumption1', 'assumption3', 'assumption6'] // assumption1 and assumption3 are duplicates
            };
            chatHistoryManager.addAIMessageFromAgentResponse(thirdResponse);

            const history = chatHistoryManager.getDisplayOptimizedHistory();

            // Check that each response only contains new assumptions
            expect(history[0]?.agentResponse?.analysis_assumptions).toEqual(['assumption1', 'assumption2', 'assumption3']);
            expect(history[1]?.agentResponse?.analysis_assumptions).toEqual(['assumption4', 'assumption5']);
            expect(history[2]?.agentResponse?.analysis_assumptions).toEqual(['assumption6']);
        });

        it('should handle agent responses without assumptions correctly', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            // Add first response with assumptions
            const firstResponse = {
                type: 'finished_task' as const,
                message: 'First response',
                analysis_assumptions: ['assumption1', 'assumption2']
            };
            chatHistoryManager.addAIMessageFromAgentResponse(firstResponse);

            // Add second response without assumptions
            const secondResponse = {
                type: 'finished_task' as const,
                message: 'Second response'
                // No analysis_assumptions field
            };
            chatHistoryManager.addAIMessageFromAgentResponse(secondResponse);

            // Add third response with new assumptions
            const thirdResponse = {
                type: 'finished_task' as const,
                message: 'Third response',
                analysis_assumptions: ['assumption1', 'assumption3'] // assumption1 is duplicate
            };
            chatHistoryManager.addAIMessageFromAgentResponse(thirdResponse);

            const history = chatHistoryManager.getDisplayOptimizedHistory();

            // Check that responses are handled correctly
            expect(history[0]?.agentResponse?.analysis_assumptions).toEqual(['assumption1', 'assumption2']);
            expect(history[1]?.agentResponse?.analysis_assumptions).toBeUndefined();
            expect(history[2]?.agentResponse?.analysis_assumptions).toEqual(['assumption3']);
        });

        it('should handle empty assumptions array correctly', () => {
            const chatHistoryManager = new ChatHistoryManager(
                mockContextManager,
                mockNotebookTracker
            );

            // Add first response with assumptions
            const firstResponse = {
                type: 'finished_task' as const,
                message: 'First response',
                analysis_assumptions: ['assumption1']
            };
            chatHistoryManager.addAIMessageFromAgentResponse(firstResponse);

            // Add second response with empty assumptions array
            const secondResponse = {
                type: 'finished_task' as const,
                message: 'Second response',
                analysis_assumptions: []
            };
            chatHistoryManager.addAIMessageFromAgentResponse(secondResponse);

            // Add third response with new assumptions
            const thirdResponse = {
                type: 'finished_task' as const,
                message: 'Third response',
                analysis_assumptions: ['assumption1', 'assumption2'] // assumption1 is duplicate
            };
            chatHistoryManager.addAIMessageFromAgentResponse(thirdResponse);

            const history = chatHistoryManager.getDisplayOptimizedHistory();

            // Check that responses are handled correctly
            expect(history[0]?.agentResponse?.analysis_assumptions).toEqual(['assumption1']);
            expect(history[1]?.agentResponse?.analysis_assumptions).toEqual(undefined);
            expect(history[2]?.agentResponse?.analysis_assumptions).toEqual(['assumption2']);
        });
    });

}); 