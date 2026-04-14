"""One-shot bridge between MCP tool calls and ``AgentRunner``."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, List, Optional

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.agent import AgentContext, AgentRunResult, ToolResult
from mito_ai_core.agent.agent_runner import AgentRunner
from mito_ai_core.agent.agent_runner_config import AgentRunnerConfig
from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai_core.completions.models import AgentResponse, MessageType
from mito_ai_core.provider_manager import ProviderManager
from mito_ai_core.utils.create import initialize_user
from mito_ai_python_tool_executor import PythonToolExecutor


OnAssistantResponse = Callable[[AgentResponse], Awaitable[None]]
OnToolResult = Callable[[ToolResult], Awaitable[None]]


class ProviderAdapter:
    """Adapts ``ProviderManager`` to the runner completion protocol."""

    def __init__(self, provider_manager: ProviderManager) -> None:
        self._provider_manager = provider_manager

    async def request_completions(
        self,
        *,
        message_type: Any,
        messages: List[ChatCompletionMessageParam],
        response_format_info: Optional[Any] = None,
        **kwargs: Any,
    ) -> str:
        return await self._provider_manager.request_completions(
            message_type=message_type,
            messages=messages,
            response_format_info=response_format_info,
        )


@dataclass(frozen=True)
class RequestAgentExecutionInput:
    """Optional context used to seed each one-shot run."""

    notebook_id: str = "mcp-notebook"
    notebook_path: str = "mcp-notebook.ipynb"
    active_cell_id: str = ""
    files: Optional[List[str]] = None
    additional_context: Optional[List[dict[str, str]]] = None
    is_chrome_browser: bool = False


@dataclass(frozen=True)
class RequestAgentExecutionResult:
    """Bridge output consumed by the MCP server layer."""

    final_text: str
    finished: bool
    iterations: int
    thread_id: str
    final_response_type: str


@dataclass
class RequestAgentExecutionManager:
    """Creates a fresh one-shot ``AgentRunner`` for every prompt."""

    default_metadata: RequestAgentExecutionInput = field(
        default_factory=RequestAgentExecutionInput
    )

    async def run_prompt(
        self,
        prompt: str,
        *,
        metadata: Optional[RequestAgentExecutionInput] = None,
        on_assistant_response: Optional[OnAssistantResponse] = None,
        on_tool_result: Optional[OnToolResult] = None,
    ) -> RequestAgentExecutionResult:
        """Run one prompt in an isolated context and return plain text output."""
        cleaned_prompt = prompt.strip()
        if not cleaned_prompt:
            raise ValueError("Prompt must not be empty.")

        # Ensure ~/.mito bootstrap (including user.json) is present before any
        # provider/usage checks that depend on quota metadata.
        initialize_user()

        run_metadata = metadata or self.default_metadata
        message_history = GlobalMessageHistory()
        thread_id = str(message_history.create_new_thread())
        llm = ProviderManager()
        tool_executor = PythonToolExecutor()

        agent_runner = AgentRunner(
            provider=ProviderAdapter(llm),
            tool_executor=tool_executor,
            message_history=message_history,
            config=AgentRunnerConfig(enable_get_cell_output=run_metadata.is_chrome_browser),
        )
        ctx = AgentContext(
            thread_id=thread_id,
            notebook_id=run_metadata.notebook_id,
            notebook_path=run_metadata.notebook_path,
            cells=[],
            active_cell_id=run_metadata.active_cell_id,
            variables=None,
            files=run_metadata.files,
            is_chrome_browser=run_metadata.is_chrome_browser,
            additional_context=run_metadata.additional_context,
        )

        try:
            result: AgentRunResult = await agent_runner.run(
                ctx,
                cleaned_prompt,
                on_assistant_response=on_assistant_response,
                on_tool_result=on_tool_result,
                message_type=MessageType.AGENT_EXECUTION,
            )
        finally:
            tool_executor.shutdown()

        return RequestAgentExecutionResult(
            final_text=_agent_result_to_text(result),
            finished=result.finished,
            iterations=result.iterations,
            thread_id=thread_id,
            final_response_type=result.final_response.type,
        )


def _agent_result_to_text(result: AgentRunResult) -> str:
    """Render a deterministic plain-text result for MCP clients."""
    response = result.final_response
    message = (response.message or "").strip()
    next_steps = response.next_steps or []

    parts: list[str] = []
    if message:
        parts.append(message)

    if next_steps:
        steps = "\n".join(f"- {step}" for step in next_steps)
        parts.append(f"Suggested next steps:\n{steps}")

    if not parts:
        parts.append(
            f"Agent returned `{response.type}` without a text message."
        )

    if not result.finished:
        parts.append(
            "Run ended before `finished_task`; partial output may be incomplete."
        )

    return "\n\n".join(parts)

