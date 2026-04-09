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

from typing import Awaitable, Callable, List, Optional

from openai.types.chat import ChatCompletionMessageParam

from mito_ai_core.agent.tool_executor import ToolExecutor
from mito_ai_core.agent.types import AgentContext, AgentRunResult, CompletionProvider, ToolResult
from mito_ai_core.agent.utils import format_tool_result, normalize_agent_response, parse_agent_response
from mito_ai_core.completions.models import (
    AgentResponse,
    MessageType,
    ResponseFormatInfo,
)

__all__ = ["AgentRunner"]

DEFAULT_MAX_ITERATIONS = 50


class AgentRunner:
    """Platform-agnostic agent loop.

    Calls a :class:`CompletionProvider` for LLM completions and dispatches tool
    calls to a :class:`ToolExecutor`.  Does **not** own message history.
    """

    TOOL_TYPES: frozenset[str] = frozenset(
        {
            "cell_update",
            "run_all_cells",
            "get_cell_output",
            "scratchpad",
            "ask_user_question",
        }
    )

    def __init__(
        self,
        provider: CompletionProvider,
        tool_executor: ToolExecutor,
        max_iterations: int = DEFAULT_MAX_ITERATIONS,
    ) -> None:
        if max_iterations < 1:
            raise ValueError("max_iterations must be >= 1")
        self._provider = provider
        self._tool_executor = tool_executor
        self._max_iterations = max_iterations

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def run(
        self,
        ctx: AgentContext,
        messages: List[ChatCompletionMessageParam],
        *,
        on_assistant_response: Optional[Callable[[str], Awaitable[None]]] = None,
        on_tool_result: Optional[Callable[[ChatCompletionMessageParam], Awaitable[None]]] = None,
        message_type: MessageType = MessageType.AGENT_EXECUTION,
    ) -> AgentRunResult:
        """Execute the agent loop.

        Parameters
        ----------
        ctx:
            Mutable agent context — updated in-place after each tool call.
        messages:
            Working conversation history.  The runner **appends** assistant
            and tool-result messages here so the next LLM call includes them.
        on_assistant_response:
            Async callback fired with the raw completion string after each
            LLM response.  Use this to persist the assistant message in
            ``GlobalMessageHistory``.
        on_tool_result:
            Async callback fired with the tool-result ``user`` message after
            each tool execution.  Use this to persist the tool result.
        message_type:
            ``MessageType`` forwarded to
            :meth:`CompletionProvider.request_completions`.
        """
        last_response: Optional[AgentResponse] = None

        for iteration in range(1, self._max_iterations + 1):
            # ---- LLM call -----------------------------------------------
            completion = await self._provider.request_completions(
                message_type=message_type,
                messages=messages,
                response_format_info=ResponseFormatInfo(
                    name="agent_response",
                    format=AgentResponse,
                ),
            )
            completion = normalize_agent_response(completion)
            response = parse_agent_response(completion)
            last_response = response

            # Append assistant message to working history
            assistant_msg: ChatCompletionMessageParam = {
                "role": "assistant",
                "content": completion,
            }
            messages.append(assistant_msg)

            if on_assistant_response is not None:
                await on_assistant_response(completion)

            # ---- Check if finished_task message --------------------------
            if response.type not in self.TOOL_TYPES:
                return AgentRunResult(
                    final_response=response,
                    finished=(response.type == "finished_task"),
                    iterations=iteration,
                )

            # ---- Tool dispatch ------------------------------------------
            tool_result = await self._execute_tool(ctx, response)

            # Update mutable context from the tool result
            if tool_result.cells is not None:
                ctx.cells = tool_result.cells
            if tool_result.variables is not None:
                ctx.variables = tool_result.variables

            # Build tool-result message and add to working history
            tool_msg: ChatCompletionMessageParam = {
                "role": "user",
                "content": format_tool_result(response.type, tool_result),
            }
            messages.append(tool_msg)

            if on_tool_result is not None:
                await on_tool_result(tool_msg)

        # Max iterations exhausted
        assert last_response is not None  # guaranteed: max_iterations >= 1
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
        print("Calling _execute_tool with response:", response)
        """Route an ``AgentResponse`` to the matching ``ToolExecutor`` method."""
        rtype = response.type

        if rtype == "cell_update":
            if response.cell_update is None:
                return ToolResult(
                    success=False,
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
            if response.get_cell_output_cell_id is None:
                return ToolResult(
                    success=False,
                    error_message="Agent returned get_cell_output but cell_id is null.",
                )
            return await self._tool_executor.get_cell_output(
                ctx, response.get_cell_output_cell_id, response.message
            )

        if rtype == "scratchpad":
            if response.scratchpad_code is None:
                return ToolResult(
                    success=False,
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
                    error_message="Agent returned ask_user_question but question is null.",
                )
            return await self._tool_executor.ask_user_question(
                ctx,
                response.question,
                response.message,
                response.answers,
            )

        # Unreachable when called from run() (DISPATCHABLE guard), but
        # protects against direct calls.
        raise ValueError(f"Cannot dispatch response type: {rtype!r}")
