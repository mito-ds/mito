# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Platform-agnostic agent loop.

Repeatedly calls the LLM via a :class:`CompletionProvider` and dispatches tool
calls to a :class:`ToolExecutor` until the agent declares ``finished_task``,
hits a non-dispatchable response type, or reaches *max_iterations*.

**History ownership** — the runner appends assistant and tool-result messages
to the *messages* working list so subsequent LLM calls see them, but it does
**not** touch ``GlobalMessageHistory``.  Callers persist messages via the
*on_assistant_response* / *on_tool_result* callbacks.
"""

from __future__ import annotations
import json
from typing import Awaitable, Callable, List, Optional
from pydantic import ValidationError
from openai.types.chat import ChatCompletionMessageParam
from mito_ai_core.agent.tool_executor import ToolExecutor
from mito_ai_core.agent.types import AgentContext, AgentRunResult, CompletionProvider, ToolResult
from mito_ai_core.agent.utils import normalize_agent_response, parse_agent_response
from mito_ai_core.completions.ai_optimized_message import create_ai_optimized_message, create_ai_optimized_tool_result_message
from mito_ai_core.completions.message_history import GlobalMessageHistory
from mito_ai_core.completions.models import (
    AgentResponse,
    MessageType,
    ResponseFormatInfo,
)
from mito_ai_core.agent.agent_runner_config import AgentRunnerConfig
from mito_ai_core.completions.models import AgentResponse, MessageType, ResponseFormatInfo
from mito_ai_core.utils.message_history_utils import append_agent_system_message
from mito_ai_core.completions.prompt_builders.agent_execution_prompt import create_agent_execution_prompt
from mito_ai_core.agent.utils import create_display_optimized_tool_result_message
from mito_ai_core.logger import get_logger

__all__ = ["AgentRunner", "AgentRunnerConfig"]

DEFAULT_MAX_ITERATIONS = 50

class AgentRunner:
    """Platform-agnostic agent loop.

    Calls a :class:`CompletionProvider` for LLM completions and dispatches tool
    calls to a :class:`ToolExecutor`.  Does **not** own message history.

    *message_history* is the global chat history handle; the runner stores it
    for future use and does not read or mutate it yet (callers persist via
    callbacks).
    """

    TOOL_TYPES: frozenset[str] = frozenset(
        {
            "cell_update",
            "run_all_cells",
            "get_cell_output",
            "scratchpad",
            "ask_user_question",
            "create_streamlit_app",
            "edit_streamlit_app",
        }
    )

    def __init__(
        self,
        provider: CompletionProvider,
        tool_executor: ToolExecutor,
        message_history: GlobalMessageHistory,
        max_iterations: int = DEFAULT_MAX_ITERATIONS,
        *,
        config: Optional[AgentRunnerConfig] = None,
    ) -> None:
        if max_iterations < 1:
            raise ValueError("max_iterations must be >= 1")
        self._provider = provider
        self._tool_executor = tool_executor
        self._message_history = message_history
        self._max_iterations = max_iterations
        self._config = config or AgentRunnerConfig()

    @staticmethod
    def _should_emit_tool_result_callback(tool_result: ToolResult) -> bool:
        """Decide whether a tool result should be forwarded to host UI callbacks.

        Failed ``cell_update`` results are intentionally suppressed here because
        host frontends may render ``on_tool_result`` payloads directly to users.
        We still append the tool result to AI-optimized history so the agent can
        recover and retry with corrected tool arguments.
        """
        return not (
            tool_result.tool_name == "cell_update"
            and not tool_result.success
            and tool_result.error_message is not None
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def run(
        self,
        ctx: AgentContext,
        user_input: str,
        *,
        on_assistant_response: Optional[Callable[[AgentResponse], Awaitable[None]]] = None,
        on_tool_result: Optional[Callable[[ToolResult], Awaitable[None]]] = None,
        message_type: MessageType = MessageType.AGENT_EXECUTION,
    ) -> AgentRunResult:
        """Execute the agent loop.

        Parameters
        ----------
        ctx:
            Mutable agent context — updated in-place after each tool call.
        user_input:
            The user's message text for this agent run.
        on_assistant_response:
            Async callback fired with the parsed ``AgentResponse`` after each
            LLM response.
        on_tool_result:
            Async callback fired with the ``ToolResult`` after each tool
            execution.
        message_type:
            ``MessageType`` forwarded to
            :meth:`CompletionProvider.request_completions`.
        """

        last_response: Optional[AgentResponse] = None

        # Append the agent system message to the message history if it doesn't already exist
        await append_agent_system_message(
            self._message_history,
            self._provider,
            ctx.thread_id,
            self._config.enable_get_cell_output,
        )

        prompt = create_agent_execution_prompt(ctx, user_input)
        
        ai_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": prompt}
        display_optimized_message: ChatCompletionMessageParam = {"role": "user", "content": user_input}

        await self._message_history.append_message(
            ai_optimized_message,
            display_optimized_message,
            self._provider,
            ctx.thread_id,
        )

        for iteration in range(1, self._max_iterations + 1):
            
            # ---- LLM call -----------------------------------------------
            messages = self._message_history.get_ai_optimized_history(ctx.thread_id)
            completion = await self._provider.request_completions(
                message_type=message_type,
                messages=messages,
                response_format_info=ResponseFormatInfo(
                    name="agent_response",
                    format=AgentResponse,
                ),
            )

            assistant_msg: ChatCompletionMessageParam = {
                "role": "assistant",
                "content": completion,
            }
            await self._message_history.append_message(
                assistant_msg, assistant_msg, self._provider, ctx.thread_id
            )

            completion = normalize_agent_response(completion)
            try:
                response = parse_agent_response(completion)
            except (json.JSONDecodeError, TypeError, ValidationError) as exc:
                await self._handle_malformed_response(
                    ctx=ctx,
                    completion=completion,
                    exception=exc,
                    on_tool_result=on_tool_result,
                )
                continue
            last_response = response

            if on_assistant_response is not None:
                await on_assistant_response(response)
            
            # ---- Check if finished_task message ----------------------------------
            # TODO: Should finished_task just be treated as a tool call?
            if response.type == "finished_task":
                return AgentRunResult(
                    final_response=response,
                    finished=True,
                    iterations=iteration,
                )

            if response.type not in self.TOOL_TYPES:
                return AgentRunResult(
                    final_response=response,
                    finished=False,
                    iterations=iteration,
                )

            # ---- Tool dispatch ------------------------------------------
            tool_result = await self._execute_tool(ctx, response)
            
            # Update mutable context from the tool result
            if tool_result.cells is not None:
                ctx.cells = tool_result.cells
            if tool_result.variables is not None:
                ctx.variables = tool_result.variables

            # Build tool-result message and add to message history
            ai_optimized_tool_msg = create_ai_optimized_tool_result_message(ctx, tool_result)
            display_optimized_tool_msg = create_display_optimized_tool_result_message(tool_result)
            await self._message_history.append_message(
                ai_optimized_tool_msg,
                display_optimized_tool_msg,
                self._provider,
                ctx.thread_id,
            )

            if (
                on_tool_result is not None
                and self._should_emit_tool_result_callback(tool_result)
            ):
                await on_tool_result(tool_result)

        # Max iterations exhausted. If every completion was malformed, return a
        # safe terminal response instead of crashing the session loop.
        if last_response is None:
            last_response = AgentResponse(
                type="finished_task",
                message="Agent stopped after repeated malformed responses.",
                cell_update=None,
                get_cell_output_cell_id=None,
                next_steps=None,
                analysis_assumptions=None,
                streamlit_app_prompt=None,
                question=None,
                answers=None,
                scratchpad_code=None,
                scratchpad_summary=None,
            )
        return AgentRunResult(
            final_response=last_response,
            finished=False,
            iterations=self._max_iterations,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _execute_tool(
        self, ctx: AgentContext, response: AgentResponse
    ) -> ToolResult:
        """Route an ``AgentResponse`` to the matching ``ToolExecutor`` method."""
        rtype = response.type

        if rtype == "cell_update":
            if response.cell_update is None:
                return ToolResult(
                    success=False,
                    tool_name=rtype,
                    error_message="Agent returned cell_update but cell_update payload is null.",
                )
            return await self._tool_executor.execute_cell_update(
                ctx, response.cell_update, response.message
            )

        if rtype == "run_all_cells":
            return await self._tool_executor.run_all_cells(
                ctx, response.message
            )

        if rtype == "get_cell_output":
            if not self._config.enable_get_cell_output:
                return ToolResult(
                    success=False,
                    tool_name=rtype,
                    error_message=(
                        "get_cell_output is not available in this environment."
                    ),
                )
            if response.get_cell_output_cell_id is None:
                return ToolResult(
                    success=False,
                    tool_name=rtype,
                    error_message="Agent returned get_cell_output but cell_id is null.",
                )
            return await self._tool_executor.get_cell_output(
                ctx, response.get_cell_output_cell_id, response.message
            )

        if rtype == "scratchpad":
            if response.scratchpad_code is None:
                return ToolResult(
                    success=False,
                    tool_name=rtype,
                    error_message="Agent returned scratchpad but scratchpad_code is null.",
                )
            return await self._tool_executor.execute_scratchpad(
                ctx,
                response.scratchpad_code,
                response.scratchpad_summary or "",
                response.message,
            )

        if rtype == "ask_user_question":
            if response.question is None:
                return ToolResult(
                    success=False,
                    tool_name=rtype,
                    error_message="Agent returned ask_user_question but question is null.",
                )
            return await self._tool_executor.ask_user_question(
                ctx,
                response.question,
                response.message,
                response.answers,
            )

        if rtype == "create_streamlit_app":
            return await self._tool_executor.create_streamlit_app(
                ctx,
                response.message,
                response.streamlit_app_prompt,
            )

        if rtype == "edit_streamlit_app":
            if response.streamlit_app_prompt is None:
                return ToolResult(
                    success=False,
                    tool_name=rtype,
                    error_message="Agent returned edit_streamlit_app but streamlit_app_prompt is null.",
                )
            return await self._tool_executor.edit_streamlit_app(
                ctx,
                response.streamlit_app_prompt,
                response.message,
            )

        # Unreachable when called from run() (DISPATCHABLE guard), but
        # protects against direct calls.
        raise ValueError(f"Cannot dispatch response type: {rtype!r}")

    async def _handle_malformed_response(
        self,
        *,
        ctx: AgentContext,
        completion: str,
        exception: Exception,
        on_tool_result: Optional[Callable[[ToolResult], Awaitable[None]]],
    ) -> None:
        """Convert malformed model payloads into recoverable tool-failure feedback."""
        get_logger().warning(
            "Malformed agent response; continuing with tool failure feedback. Error: %s",
            exception,
        )
        tool_result = ToolResult(
            success=False,
            tool_name="agent_response_validation",
            error_message=(
                "Agent returned a malformed response payload. "
                f"Parser error: {exception}"
            ),
        )
        ai_optimized_tool_msg = create_ai_optimized_tool_result_message(ctx, tool_result)
        display_optimized_tool_msg: ChatCompletionMessageParam = {
            "role": "user",
            "content": "",
        }
        await self._message_history.append_message(
            ai_optimized_tool_msg,
            display_optimized_tool_msg,
            self._provider,
            ctx.thread_id,
        )
        if on_tool_result is not None:
            await on_tool_result(tool_result)

