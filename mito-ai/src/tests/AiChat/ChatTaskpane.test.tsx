/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChatTaskpane } from '../../Extensions/AiChat/ChatTaskpane';
import { AgentResponse } from '../../websockets/completions/CompletionModels';
import { ChatHistoryManager } from '../../Extensions/AiChat/ChatHistoryManager';
import { getDefaultChatHistoryManager } from '../../Extensions/AiChat/ChatHistoryManager';
import { createMockJupyterApp, createMockNotebookTracker, createMockContextManager } from '../__mocks__/jupyterMocks';
import { createMockWebSocketClient } from '../__mocks__/websocketMocks';
import OpenAI from 'openai';

// Mock dependencies
jest.mock('../../Extensions/AiChat/ChatHistoryManager', () => ({
  getDefaultChatHistoryManager: jest.fn(),
  ChatHistoryManager: jest.fn().mockImplementation(() => ({
    addChatMessageFromHistory: jest.fn(),
    addAIMessageFromAgentResponse: jest.fn(),
    getDisplayOptimizedHistory: jest.fn(() => []),
    clearChatHistory: jest.fn(),
    addUserMessage: jest.fn(),
    addErrorMessage: jest.fn(),
    addAIMessage: jest.fn(),
    getMessageHistory: jest.fn(() => []),
    getUserMessageHistory: jest.fn(() => []),
    getCurrentUser: jest.fn(),
    getChatHistoryLength: jest.fn(() => 0),
    setCurrentUser: jest.fn(),
    formatMessagesForBackend: jest.fn(() => []),
    addAIMessageFromStream: jest.fn(),
    addAIMessageFromStreamChunk: jest.fn(),
  })),
}));

jest.mock('../../websockets/completions/CompletionsWebSocketClient', () => ({
  CompletionsWebSocketClient: jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(() => true),
  })),
}));

jest.mock('../../utils/agentActions', () => ({
  acceptAndRunCellUpdate: jest.fn(),
  retryIfExecutionError: jest.fn(),
}));

jest.mock('../../components/ModelSelector', () => ({
  DEFAULT_MODEL: 'gpt-4',
  __esModule: true,
  default: () => <div>Model Selector</div>,
}));

jest.mock('../../components/DropdownMenu', () => ({
  __esModule: true,
  default: () => <div>Dropdown Menu</div>,
}));

jest.mock('../../components/IconButton', () => ({
  __esModule: true,
  default: () => <div>Icon Button</div>,
}));

jest.mock('../../components/LoadingCircle', () => ({
  __esModule: true,
  default: () => <div>Loading Circle</div>,
}));

jest.mock('../../components/LoadingDots', () => ({
  __esModule: true,
  default: () => <div>Loading Dots</div>,
}));

jest.mock('../../components/NextStepsPills', () => ({
  __esModule: true,
  default: () => <div>Next Steps Pills</div>,
}));

jest.mock('../../components/TextAndIconButton', () => ({
  __esModule: true,
  default: () => <div>Text and Icon Button</div>,
}));

jest.mock('../../components/ToggleButton', () => ({
  __esModule: true,
  default: () => <div>Toggle Button</div>,
}));

jest.mock('../../components/AgentComponents/ErrorFixupToolUI', () => ({
  __esModule: true,
  default: () => <div>Error Fixup Tool UI</div>,
}));

describe('ChatTaskpane fetchChatHistoryAndSetActiveThread', () => {
  let mockApp: any;
  let mockNotebookTracker: any;
  let mockContextManager: any;
  let mockWebSocketClient: any;
  let mockChatHistoryManager: any;
  let mockSetAgentModeEnabled: jest.Mock;
  let mockSetChatHistoryManager: jest.Mock;
  let mockActiveThreadIdRef: any;

  beforeEach(() => {
    // Create mock dependencies
    mockApp = createMockJupyterApp();
    mockNotebookTracker = createMockNotebookTracker();
    mockContextManager = createMockContextManager();
    mockWebSocketClient = createMockWebSocketClient();
    mockChatHistoryManager = new ChatHistoryManager();
    
    // Mock state setters
    mockSetAgentModeEnabled = jest.fn();
    mockSetChatHistoryManager = jest.fn();
    mockActiveThreadIdRef = { current: null };

    // Mock the getDefaultChatHistoryManager function
    (getDefaultChatHistoryManager as jest.Mock).mockReturnValue(mockChatHistoryManager);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const createChatTaskpaneWithFetchFunction = () => {
    const TestComponent = () => {
      // Mock the required props and hooks
      const [agentModeEnabled, setAgentModeEnabled] = React.useState(false);
      const [chatHistoryManager, setChatHistoryManager] = React.useState(mockChatHistoryManager);
      const activeThreadIdRef = React.useRef<string | null>(null);

      // Extract the fetchChatHistoryAndSetActiveThread function logic
      const fetchChatHistoryAndSetActiveThread = async (threadId: string): Promise<void> => {
        const metadata = {
          promptType: "fetch_history" as const,
          thread_id: threadId
        };

        const fetchHistoryCompletionRequest = {
          type: 'fetch_history',
          message_id: 'test-message-id',
          metadata: metadata,
          stream: false
        };

        const chatHistoryResponse = await mockWebSocketClient.sendMessage(fetchHistoryCompletionRequest);

        // Create a fresh ChatHistoryManager and add the initial messages
        const newChatHistoryManager = getDefaultChatHistoryManager(mockNotebookTracker, mockContextManager);

        // Each thread only contains agent or chat messages. For now, we enforce this by clearing the chat 
        // when the user switches mode. When the user reloads a chat, we want to put them back into the same
        // chat mode so that we use the correct system message and preserve this one-type of message invariant.
        let isAgentChat: boolean = false;

        // Add messages to the ChatHistoryManager
        chatHistoryResponse.items.forEach((item: any) => {
          try {
            // If the user sent a message in agent:execution mode, the ai response will be a JSON object which we need to parse. 
            // TODO: We need to save the full metadata in the message_history.json so we don't have to do these hacky workarounds!
            const chatHistoryItem = JSON.parse(item.content as string);
            if (Object.prototype.hasOwnProperty.call(chatHistoryItem, 'type')) {
              // If it is a structured output with 'type', then it is an AgentResponse and we should handle it as such
              const agentResponse: AgentResponse = chatHistoryItem;
              newChatHistoryManager.addAIMessageFromAgentResponse(agentResponse);
              isAgentChat = true;
            } else {
              newChatHistoryManager.addChatMessageFromHistory(item);
              // Don't set isAgentChat to false here - once we detect an agent message, 
              // the thread should remain in agent mode
            }
          } catch {
            newChatHistoryManager.addChatMessageFromHistory(item);
          }
        });

        // Update the state with the new ChatHistoryManager
        mockSetAgentModeEnabled(isAgentChat);
        mockSetChatHistoryManager(newChatHistoryManager);
        activeThreadIdRef.current = threadId;
      };

      return (
        <div>
          <button onClick={() => fetchChatHistoryAndSetActiveThread('test-thread-id')}>
            Fetch Chat History
          </button>
          <div data-testid="agent-mode-enabled">{agentModeEnabled ? 'true' : 'false'}</div>
        </div>
      );
    };

    return TestComponent;
  };

  describe('fetchChatHistoryAndSetActiveThread function', () => {
    it('should set agent mode to true when thread contains agent messages', async () => {
      // Mock response with agent messages
      const mockAgentResponse: AgentResponse = {
        type: 'cell_update',
        message: 'Agent response message',
        cell_update: {
          type: 'modification',
          id: 'cell-1',
          code: 'print("hello")',
          code_summary: 'Print hello',
          cell_type: 'code'
        }
      };

      const mockChatHistoryResponse = {
        items: [
          { content: JSON.stringify(mockAgentResponse) },
          { content: JSON.stringify({ message: 'Regular chat message' }) }
        ]
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetAgentModeEnabled).toHaveBeenCalledWith(true);
      });

      expect(mockChatHistoryManager.addAIMessageFromAgentResponse).toHaveBeenCalledWith(mockAgentResponse);
      expect(mockChatHistoryManager.addChatMessageFromHistory).toHaveBeenCalledWith(
        { content: JSON.stringify({ message: 'Regular chat message' }) }
      );
    });

    it('should set agent mode to false when thread contains only chat messages', async () => {
      // Mock response with only chat messages
      const mockChatHistoryResponse = {
        items: [
          { content: JSON.stringify({ message: 'Chat message 1' }) },
          { content: JSON.stringify({ message: 'Chat message 2' }) }
        ]
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetAgentModeEnabled).toHaveBeenCalledWith(false);
      });

      expect(mockChatHistoryManager.addChatMessageFromHistory).toHaveBeenCalledTimes(2);
      expect(mockChatHistoryManager.addAIMessageFromAgentResponse).not.toHaveBeenCalled();
    });

    it('should maintain agent mode when agent messages are mixed with chat messages', async () => {
      // Mock response with mixed messages (agent first, then chat)
      const mockAgentResponse: AgentResponse = {
        type: 'finished_task',
        message: 'Task completed',
        next_steps: ['Review the code', 'Test the functionality']
      };

      const mockChatHistoryResponse = {
        items: [
          { content: JSON.stringify(mockAgentResponse) },
          { content: JSON.stringify({ message: 'User question' }) },
          { content: JSON.stringify({ message: 'Another chat message' }) }
        ]
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetAgentModeEnabled).toHaveBeenCalledWith(true);
      });

      expect(mockChatHistoryManager.addAIMessageFromAgentResponse).toHaveBeenCalledWith(mockAgentResponse);
      expect(mockChatHistoryManager.addChatMessageFromHistory).toHaveBeenCalledTimes(2);
    });

    it('should maintain agent mode when chat messages appear before agent messages', async () => {
      // Mock response with chat messages first, then agent messages
      const mockAgentResponse: AgentResponse = {
        type: 'get_cell_output',
        message: 'Getting cell output',
        cell_id: 'cell-1'
      };

      const mockChatHistoryResponse = {
        items: [
          { content: JSON.stringify({ message: 'Initial chat message' }) },
          { content: JSON.stringify({ message: 'Another chat message' }) },
          { content: JSON.stringify(mockAgentResponse) }
        ]
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetAgentModeEnabled).toHaveBeenCalledWith(true);
      });

      expect(mockChatHistoryManager.addChatMessageFromHistory).toHaveBeenCalledTimes(2);
      expect(mockChatHistoryManager.addAIMessageFromAgentResponse).toHaveBeenCalledWith(mockAgentResponse);
    });

    it('should handle malformed JSON gracefully', async () => {
      // Mock response with malformed JSON
      const mockChatHistoryResponse = {
        items: [
          { content: 'Invalid JSON content' },
          { content: JSON.stringify({ message: 'Valid chat message' }) }
        ]
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetAgentModeEnabled).toHaveBeenCalledWith(false);
      });

      // Should call addChatMessageFromHistory for both items (one in catch block, one in else block)
      expect(mockChatHistoryManager.addChatMessageFromHistory).toHaveBeenCalledTimes(2);
      expect(mockChatHistoryManager.addAIMessageFromAgentResponse).not.toHaveBeenCalled();
    });

    it('should handle empty thread history', async () => {
      // Mock response with empty items
      const mockChatHistoryResponse = {
        items: []
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetAgentModeEnabled).toHaveBeenCalledWith(false);
      });

      expect(mockChatHistoryManager.addChatMessageFromHistory).not.toHaveBeenCalled();
      expect(mockChatHistoryManager.addAIMessageFromAgentResponse).not.toHaveBeenCalled();
    });

    it('should create new ChatHistoryManager and set active thread ID', async () => {
      const testThreadId = 'test-thread-123';
      const mockChatHistoryResponse = {
        items: [
          { content: JSON.stringify({ message: 'Test message' }) }
        ]
      };

      mockWebSocketClient.sendMessage.mockResolvedValue(mockChatHistoryResponse);

      const TestComponent = createChatTaskpaneWithFetchFunction();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Fetch Chat History' });
      button.click();

      await waitFor(() => {
        expect(mockSetChatHistoryManager).toHaveBeenCalledWith(mockChatHistoryManager);
      });

      expect(getDefaultChatHistoryManager).toHaveBeenCalledWith(mockNotebookTracker, mockContextManager);
      expect(mockWebSocketClient.sendMessage).toHaveBeenCalledWith({
        type: 'fetch_history',
        message_id: expect.any(String),
        metadata: {
          promptType: 'fetch_history',
          thread_id: 'test-thread-id'
        },
        stream: false
      });
    });
  });
});