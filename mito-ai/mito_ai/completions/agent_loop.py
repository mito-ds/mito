# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Agent loop entry-point.

Builds the mito-ai-core ``AgentRunner``, wires up a
``JupyterLabToolExecutor`` for WebSocket-based tool execution, and runs
the loop until the agent finishes or is interrupted.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, List, Optional

from openai.types.chat import ChatCompletionMessageParam

from mito_ai.completions.completion_handlers.utils import (
    append_agent_system_message,
    create_ai_optimized_message,
)
from mito_ai.completions.jupyter_lab_tool_executor import JupyterLabToolExecutor
from mito_ai.completions.message_history import GlobalMessageHistory
from mito_ai.completions.models import (
    AgentExecutionMetadata,
    AgentFinishedMessage,
    CompletionError,
)
from mito_ai.completions.prompt_builders.agent_execution_prompt import (
    create_agent_execution_prompt,
)
from mito_ai.logger import get_logger
from mito_ai.provider_manager import ProviderManager
from mito_ai_core.agent import AgentContext, AgentRunner, AgentRunResult
from mito_ai_core.agent.utils import serialize_agent_response
from mito_ai_core.completions.models import AIOptimizedCell as CoreAIOptimizedCell


class ProviderAdapter:
    """Adapts :class:`ProviderManager` to the keyword-only
    :class:`mito_ai_core.agent.types.CompletionProvider` protocol.
    """

    def __init__(self, pm: ProviderManager) -> None:
        self._pm = pm

    async def request_completions(
        self,
        *,
        message_type: Any,
        messages: List[ChatCompletionMessageParam],
        response_format_info: Optional[Any] = None,
        **kwargs: Any,
    ) -> str:
        return await self._pm.request_completions(
            message_type=message_type,
            messages=messages,
            response_format_info=response_format_info,
        )


def _convert_cells(raw_cells: list) -> list[CoreAIOptimizedCell]:
    """Convert mito_ai ``AIOptimizedCell`` objects (or dicts) to
    mito_ai_core ``AIOptimizedCell`` instances."""
    core_cells: list[CoreAIOptimizedCell] = []
    for c in raw_cells:
        if isinstance(c, dict):
            core_cells.append(CoreAIOptimizedCell(**c))
        elif hasattr(c, "cell_type") and hasattr(c, "id") and hasattr(c, "code"):
            core_cells.append(
                CoreAIOptimizedCell(cell_type=c.cell_type, id=c.id, code=c.code)
            )
        else:
            core_cells.append(c)
    return core_cells


async def start_agent_loop(
    metadata: AgentExecutionMetadata,
    llm: ProviderManager,
    message_history: GlobalMessageHistory,
    reply_fn: Callable[[Any], None],
    send_error_fn: Callable[[dict], None],
    register_tool_executor: Callable[[Optional[JupyterLabToolExecutor]], None],
) -> None:
    """Launch the mito-ai-core ``AgentRunner``.

    Sends ``request_tool_execution`` messages to the frontend via *reply_fn* and
    awaits ``tool_result`` responses that are resolved on the returned
    :class:`JupyterLabToolExecutor`.

    Parameters
    ----------
    metadata:
        The ``agent:execution`` metadata from the frontend.
    llm:
        The active :class:`ProviderManager`.
    message_history:
        Global message-history singleton.
    reply_fn:
        Callable that serialises a dataclass and writes it to the
        WebSocket (typically ``CompletionHandler.reply``).
    send_error_fn:
        Callable that sends an error message over the WebSocket
        (typically ``CompletionHandler._send_error``).
    register_tool_executor:
        Callback so the caller can track (and later clear) the active
        :class:`JupyterLabToolExecutor`.
    """
    log = get_logger()
    thread_id = metadata.threadId

    # --- prepare message history (mirrors existing AgentExecutionHandler) ---
    if metadata.index is not None:
        message_history.truncate_histories(
            thread_id=thread_id,
            index=metadata.index,
        )

    await append_agent_system_message(
        message_history,
        llm,
        thread_id,
        metadata.isChromeBrowser,
    )

    prompt = create_agent_execution_prompt(metadata)
    display_prompt = metadata.input

    new_ai_optimized_message = create_ai_optimized_message(
        prompt,
        metadata.base64EncodedActiveCellOutput,
        metadata.additionalContext,
    )
    new_display_optimized_message: ChatCompletionMessageParam = {
        "role": "user",
        "content": display_prompt,
    }
    await message_history.append_message(
        new_ai_optimized_message,
        new_display_optimized_message,
        llm,
        thread_id,
    )

    # --- build the AgentRunner components ---
    tool_executor = JupyterLabToolExecutor(
        reply_fn=reply_fn,
        thread_id=thread_id,
    )
    register_tool_executor(tool_executor)

    provider_adapter = ProviderAdapter(llm)
    runner = AgentRunner(
        provider=provider_adapter,
        tool_executor=tool_executor,
    )

    ctx = AgentContext(
        thread_id=thread_id,
        notebook_id=metadata.notebookID,
        notebook_path=metadata.notebookPath,
        cells=_convert_cells(metadata.aiOptimizedCells or []),
        active_cell_id=metadata.activeCellId,
        variables=metadata.variables,
        files=metadata.files,
        is_chrome_browser=metadata.isChromeBrowser,
    )

    messages = message_history.get_ai_optimized_history(thread_id)

    # --- callbacks to persist messages ---
    async def on_assistant_response(completion: str) -> None:
        msg: ChatCompletionMessageParam = {
            "role": "assistant",
            "content": completion,
        }
        await message_history.append_message(msg, msg, llm, thread_id)

    async def on_tool_result(tool_msg: ChatCompletionMessageParam) -> None:
        await message_history.append_message(tool_msg, tool_msg, llm, thread_id)

    # --- run the agent loop ---
    try:
        result: AgentRunResult = await runner.run(
            ctx,
            messages,
            on_assistant_response=on_assistant_response,
            on_tool_result=on_tool_result,
        )

        # Send agent_finished message to the frontend
        final_response_dict = serialize_agent_response(result.final_response)
        reply_fn(
            AgentFinishedMessage(
                agent_response=final_response_dict,
                thread_id=thread_id,
                finished=result.finished,
                iterations=result.iterations,
            )
        )
    except Exception as e:
        log.error(f"Agent loop error: {e}", exc_info=True)
        error = CompletionError.from_exception(e)
        send_error_fn({"new": error})
    finally:
        register_tool_executor(None)
