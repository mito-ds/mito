# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Completion / WebSocket models for the Jupyter extension.

Shared definitions live in :mod:`mito_ai_core.completions.models`; this module
re-exports them and adds Jupyter-only wire types (agent tool round-trip).
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional
from mito_ai_core.agent import ToolResult

from mito_ai_core.completions.models import (
    AICapabilities,
    AgentExecutionMetadata,
    AgentResponse,
    AgentSmartDebugMetadata,
    AIOptimizedCell,
    CellUpdate,
    ChatMessageMetadata,
    ChatThreadMetadata,
    CodeExplainMetadata,
    CompletionError,
    CompletionItem,
    CompletionItemError,
    CompletionReply,
    CompletionRequest,
    CompletionStreamChunk,
    DeleteThreadReply,
    ErrorMessage,
    FetchHistoryReply,
    FetchThreadsReply,
    GithubCopilotLoginStatusMessage,
    InlineCompleterMetadata,
    MessageType,
    ResponseFormatInfo,
    ScratchpadResultMetadata,
    SmartDebugMetadata,
    StartNewChatReply,
    ThreadID,
    UpdateModelConfigMetadata,
)

########################################################
# Jupyter / WebSocket-only (not in standalone core workflows)
########################################################


@dataclass
class RequestToolExecutionMessage:
    """Message sent from backend to frontend requesting tool execution.

    The backend agent loop sends these when the LLM returns a tool call
    (cell_update, run_all_cells, get_cell_output, scratchpad, ask_user_question).
    The frontend executes the tool and sends back a ToolResultMetadata.
    """

    # The AgentResponse from the LLM
    agent_response: AgentResponse

    # Thread this command belongs to
    thread_id: str

    # The agent's reasoning message for this step
    message: str

    type: Literal["request_tool_execution"] = "request_tool_execution"


@dataclass(frozen=True)
class ToolResultMetadata:
    """Metadata sent from frontend to backend with tool execution results."""

    promptType: Literal["tool_result"]
    threadId: ThreadID

    # Whether the tool execution was successful
    success: bool

    # Error message if the tool execution failed
    errorMessage: Optional[str] = None

    # Updated cells after tool execution
    cells: Optional[List[AIOptimizedCell]] = None

    # Updated variables after tool execution
    variables: Optional[List[str]] = None

    # Tool output (e.g., scratchpad stdout, cell output base64)
    output: Optional[str] = None

    # The tool type that was executed
    toolType: Optional[str] = None

    # Updated active cell ID
    activeCellId: Optional[str] = None

    # Whether this is a Chrome browser (for cell output)
    isChromeBrowser: bool = True


@dataclass
class AgentFinishedMessage:
    """Message sent from backend to frontend when the agent finishes."""

    # The final AgentResponse from the LLM
    agent_response: AgentResponse

    # Thread this message belongs to
    thread_id: str

    # Whether the agent completed its task
    finished: bool

    # Number of LLM iterations used
    iterations: int

    type: Literal["agent_finished"] = "agent_finished"


@dataclass
class AssistantResponseMessage:
    """Message sent from backend to frontend for each assistant agent step."""

    agent_response: AgentResponse
    thread_id: str
    type: Literal["assistant_response"] = "assistant_response"


@dataclass
class ToolResultMessage:
    """Message sent from backend to frontend with the ToolResult payload."""

    tool_result: ToolResult
    thread_id: str
    type: Literal["tool_result"] = "tool_result"


__all__ = [
    "AICapabilities",
    "AssistantResponseMessage",
    "AgentExecutionMetadata",
    "AgentFinishedMessage",
    "AgentResponse",
    "AgentSmartDebugMetadata",
    "AIOptimizedCell",
    "CellUpdate",
    "ChatMessageMetadata",
    "ChatThreadMetadata",
    "CodeExplainMetadata",
    "CompletionError",
    "CompletionItem",
    "CompletionItemError",
    "CompletionReply",
    "CompletionRequest",
    "CompletionStreamChunk",
    "DeleteThreadReply",
    "ErrorMessage",
    "FetchHistoryReply",
    "FetchThreadsReply",
    "GithubCopilotLoginStatusMessage",
    "InlineCompleterMetadata",
    "MessageType",
    "RequestToolExecutionMessage",
    "ResponseFormatInfo",
    "ScratchpadResultMetadata",
    "SmartDebugMetadata",
    "StartNewChatReply",
    "ThreadID",
    "ToolResultMessage",
    "ToolResultMetadata",
    "UpdateModelConfigMetadata",
]
