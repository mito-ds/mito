# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""JupyterLab ToolExecutor implementation.

Implements the ``ToolExecutor`` protocol from ``mito_ai_core`` by sending
``request_tool_execution`` messages over the WebSocket to the JupyterLab
frontend, then waiting for the frontend to respond with a ``tool_result``.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import replace
from typing import Any, Callable, List, Literal, Optional

from mito_ai_core.agent.tool_executor import ToolExecutor
from mito_ai_core.agent.types import AgentContext, ToolResult
from mito_ai_core.completions.models import AIOptimizedCell, AgentResponse, CellUpdate

from mito_ai.completions.models import RequestToolExecutionMessage
from mito_ai.logger import get_logger

__all__ = ["JupyterLabToolExecutor"]


class JupyterLabToolExecutor:
    """``ToolExecutor`` that delegates to the JupyterLab frontend via WebSocket.

    The backend sends a ``request_tool_execution`` message describing *what* to do, and
    the frontend executes it (e.g. inserts/runs a cell, collects output) and
    responds with a ``tool_result`` message whose payload is converted into a
    :class:`ToolResult`.

    Parameters
    ----------
    reply_fn:
        Callable that serialises a dataclass and writes it to the WebSocket.
        Typically ``CompletionHandler.reply``.
    thread_id:
        The conversation thread this executor belongs to.
    timeout:
        Maximum seconds to wait for the frontend to respond to a single
        tool command.  ``0`` means wait forever.
    """

    def __init__(
        self,
        reply_fn: Callable[[Any], None],
        thread_id: str,
        timeout: float = 120.0,
    ) -> None:
        self._reply_fn = reply_fn
        self._thread_id = thread_id
        self._timeout = timeout
        # Signalled by the WebSocket handler when a tool_result arrives
        self._pending_result: asyncio.Future[ToolResult] = asyncio.get_event_loop().create_future()
        self._log = get_logger()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _send_request_tool_execution_message(
        self,
        agent_response: AgentResponse,
        message: str,
    ) -> None:
        """Push a ``request_tool_execution`` message to the frontend."""
        cmd = RequestToolExecutionMessage(
            agent_response=agent_response,
            thread_id=self._thread_id,
            message=message,
        )
        self._reply_fn(cmd)

    async def _wait_for_result(self) -> ToolResult:
        """Block until the frontend posts back a ``tool_result``."""
        if self._timeout > 0:
            return await asyncio.wait_for(self._pending_result, timeout=self._timeout)
        return await self._pending_result

    async def _execute_via_frontend(
        self,
        agent_response: AgentResponse,
        message: str,
    ) -> ToolResult:
        """Send a command and wait for the frontend's result."""
        # Create a fresh future for this round-trip
        loop = asyncio.get_event_loop()
        self._pending_result = loop.create_future()

        self._send_request_tool_execution_message(agent_response, message)
        result = await self._wait_for_result()
        tool_type = agent_response.type
        if tool_type is not None and result.tool_name is None:
            return replace(result, tool_name=str(tool_type))
        return result

    def _build_agent_response(
        self,
        type: Literal[
            "cell_update",
            "get_cell_output",
            "run_all_cells",
            "finished_task",
            "create_streamlit_app",
            "edit_streamlit_app",
            "ask_user_question",
            "scratchpad",
        ],
        message: str,
        *,
        cell_update: Optional[CellUpdate] = None,
        get_cell_output_cell_id: Optional[str] = None,
        question: Optional[str] = None,
        answers: Optional[List[str]] = None,
        scratchpad_code: Optional[str] = None,
        scratchpad_summary: Optional[str] = None,
        streamlit_app_prompt: Optional[str] = None,
    ) -> AgentResponse:
        return AgentResponse(
            type=type,
            message=message,
            cell_update=cell_update,
            get_cell_output_cell_id=get_cell_output_cell_id,
            next_steps=None,
            analysis_assumptions=None,
            streamlit_app_prompt=streamlit_app_prompt,
            question=question,
            answers=answers,
            scratchpad_code=scratchpad_code,
            scratchpad_summary=scratchpad_summary,
        )

    # ------------------------------------------------------------------
    # Called by the WebSocket handler when a tool_result message arrives
    # ------------------------------------------------------------------

    def resolve_tool_result(self, result: ToolResult) -> None:
        """Resolve the pending future with a ``ToolResult``.

        Called from :meth:`CompletionHandler.on_message` when a
        ``tool_result`` message arrives from the frontend.
        """
        if not self._pending_result.done():
            self._pending_result.set_result(result)
        else:
            self._log.warning("tool_result arrived but no future was pending")

    def reject_tool_result(self, error: Exception) -> None:
        """Reject the pending future with an exception."""
        if not self._pending_result.done():
            self._pending_result.set_exception(error)

    # ------------------------------------------------------------------
    # ToolExecutor protocol
    # ------------------------------------------------------------------

    async def execute_cell_update(
        self,
        ctx: AgentContext,
        cell_update: CellUpdate,
        message: str,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="cell_update",
            message=message,
            cell_update=cell_update,
        )
        return await self._execute_via_frontend(agent_resp, message)

    async def run_all_cells(
        self,
        ctx: AgentContext,
        message: str,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="run_all_cells",
            message=message,
        )
        return await self._execute_via_frontend(agent_resp, message)

    async def get_cell_output(
        self,
        ctx: AgentContext,
        cell_id: str,
        message: str,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="get_cell_output",
            message=message,
            get_cell_output_cell_id=cell_id,
        )
        return await self._execute_via_frontend(agent_resp, message)

    async def execute_scratchpad(
        self,
        ctx: AgentContext,
        code: str,
        summary: str,
        message: str,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="scratchpad",
            message=message,
            scratchpad_code=code,
            scratchpad_summary=summary,
        )
        return await self._execute_via_frontend(agent_resp, message)

    async def ask_user_question(
        self,
        ctx: AgentContext,
        question: str,
        message: str,
        answers: Optional[List[str]] = None,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="ask_user_question",
            message=message,
            question=question,
            answers=answers,
        )
        return await self._execute_via_frontend(agent_resp, message)

    async def create_streamlit_app(
        self,
        ctx: AgentContext,
        message: str,
        streamlit_app_prompt: Optional[str] = None,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="create_streamlit_app",
            message=message,
            streamlit_app_prompt=streamlit_app_prompt,
        )
        return await self._execute_via_frontend(agent_resp, message)

    async def edit_streamlit_app(
        self,
        ctx: AgentContext,
        streamlit_app_prompt: str,
        message: str,
    ) -> ToolResult:
        agent_resp = self._build_agent_response(
            type="edit_streamlit_app",
            message=message,
            streamlit_app_prompt=streamlit_app_prompt,
        )
        return await self._execute_via_frontend(agent_resp, message)
