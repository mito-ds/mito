# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Value types shared across the agent layer."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.completions.models import (
    AIOptimizedCell,
    AgentResponse,
    CellUpdate,
    KernelVariable,
    MessageType,
    ResponseFormatInfo,
    ThreadID,
)


@dataclass(frozen=True)
class ToolResult:
    """Outcome of a single tool execution.

    Every ToolExecutor method returns one of these so callers have a uniform
    way to inspect success/failure and any payload that came back.
    """

    success: bool
    """Whether the tool executed without errors."""

    tool_name: Optional[str] = None
    """Which tool was run (e.g. ``cell_update``, ``scratchpad``), when known."""

    error_message: Optional[str] = None
    """Human-readable error string when *success* is False.

    Exception: ``get_cell_output`` from headless executors may set this to plain
    text when *success* is True (see ``format_tool_result``) because *output*
    is reserved for base64 PNG in the Jupyter UI path — a known model mismatch.
    """

    cells: Optional[List[AIOptimizedCell]] = None
    """Snapshot of notebook cells after execution, if available."""

    variables: Optional[List[KernelVariable]] = None
    """Variables defined in the kernel after execution, if available."""

    output: Optional[str] = None
    """Captured stdout / rendered output (e.g. scratchpad print output,
    cell output text, base64-encoded image)."""

    extra: Dict[str, Any] = field(default_factory=dict)
    """Arbitrary payload a concrete executor may attach (e.g. new cell id)."""


@dataclass
class AgentContext:
    """Mutable snapshot of state the agent loop carries between turns.

    Platform adapters populate this before each LLM call so prompt builders
    and the tool executor share the same view of the world.
    """

    thread_id: ThreadID
    """Unique conversation thread identifier."""

    notebook_id: str
    """Opaque notebook / document identifier supplied by the platform."""

    notebook_path: str
    """File-system path (or URI) for the active notebook."""

    cells: List[AIOptimizedCell] = field(default_factory=list)
    """Current notebook cells (code + markdown)."""

    active_cell_id: str = ""
    """Cell the user's cursor is in."""

    variables: Optional[List[KernelVariable]] = None
    """Variables currently defined in the kernel."""

    files: Optional[List[str]] = None
    """File names in the working directory."""

    is_chrome_browser: bool = True
    """Whether the client reports a Chrome-based browser (mirrors frontend metadata).

    Use the same value for ``AgentRunnerConfig.enable_get_cell_output`` when
    constructing :class:`~mito_ai_core.agent.agent_runner.AgentRunner`.
    """

    additional_context: Optional[List[Dict[str, str]]] = None
    """Extra structured context (e.g. selections, images) from the client."""


@runtime_checkable
class CompletionProvider(Protocol):
    """Minimal interface the agent loop needs from a provider.

    :class:`ProviderManager` satisfies this protocol.  Tests can supply a
    lightweight fake instead without pulling in every LLM SDK.
    """

    async def request_completions(
        self,
        message_type: MessageType,
        messages: List[ChatCompletionMessageParam],
        response_format_info: Optional[ResponseFormatInfo] = None,
        user_input: Optional[str] = None,
        thread_id: Optional[str] = None,
        max_retries: int = 3,
        use_fast_model: bool = False,
        use_smartest_model: bool = False,
    ) -> str:
        ...


@dataclass(frozen=True)
class AgentRunResult:
    """Outcome of a complete agent run."""

    final_response: AgentResponse
    """The last ``AgentResponse`` returned by the LLM."""

    finished: bool
    """``True`` when the agent declared ``finished_task``."""

    iterations: int
    """Number of LLM calls made."""
