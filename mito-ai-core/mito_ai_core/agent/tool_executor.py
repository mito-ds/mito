# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Protocol that every platform adapter must implement to execute agent tools.

The agent loop calls these methods; the concrete implementation lives in the
platform layer (e.g. JupyterLab extension, VS Code extension, CLI).  Because
this is a :class:`typing.Protocol`, there is no inheritance coupling — any
object whose methods match the signatures below satisfies the contract.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable

from mito_ai_core.agent.types import AgentContext, ToolResult
from mito_ai_core.completions.models import CellUpdate


@runtime_checkable
class ToolExecutor(Protocol):
    """Thin boundary between the platform-agnostic agent loop and a host
    environment that can actually mutate notebooks, run code, etc.

    Each method corresponds to one of the agent tools defined in
    ``agent_system_message.py`` (CELL_UPDATE, RUN_ALL_CELLS, GET_CELL_OUTPUT,
    SCRATCHPAD, ASK_USER_QUESTION, CREATE_STREAMLIT_APP, EDIT_STREAMLIT_APP).

    All methods are async because the real implementations will involve I/O
    (kernel execution, WebSocket messages, user prompts).
    """

    async def execute_cell_update(
        self,
        ctx: AgentContext,
        cell_update: CellUpdate,
        message: str,
    ) -> ToolResult:
        """Apply a CELL_UPDATE (modification or new cell) to the notebook.

        Parameters
        ----------
        ctx:
            Current agent context.
        cell_update:
            The cell payload (code, type, target id, etc.).
        message:
            The agent's reasoning / summary for this step.

        Returns
        -------
        ToolResult with updated *cells* and *variables* (``KernelVariable`` list) after execution.
        """
        ...

    async def run_all_cells(
        self,
        ctx: AgentContext,
        message: str,
    ) -> ToolResult:
        """Execute every cell in the notebook from top to bottom.

        Parameters
        ----------
        ctx:
            Current agent context.
        message:
            The agent's reasoning for triggering a full run.

        Returns
        -------
        ToolResult with refreshed *cells* and *variables* (``KernelVariable`` list).
        If any cell errors, *success* should be False and *error_message*
        should contain the traceback.
        """
        ...

    async def get_cell_output(
        self,
        ctx: AgentContext,
        cell_id: str,
        message: str,
    ) -> ToolResult:
        """Retrieve the rendered output of a single cell.

        Parameters
        ----------
        ctx:
            Current agent context.
        cell_id:
            The id of the cell whose output is requested.
        message:
            The agent's reasoning for requesting this output.

        Returns
        -------
        ToolResult with *output* containing the base64-encoded cell output.
        """
        ...

    async def execute_scratchpad(
        self,
        ctx: AgentContext,
        code: str,
        summary: str,
        message: str,
    ) -> ToolResult:
        """Run throwaway code in the kernel without modifying the notebook.

        Parameters
        ----------
        ctx:
            Current agent context.
        code:
            Python code to execute in the scratchpad.
        summary:
            Short "-ing" phrase describing what the code does.
        message:
            The agent's reasoning for running scratchpad code.

        Returns
        -------
        ToolResult with *output* containing captured stdout/stderr.
        """
        ...

    async def ask_user_question(
        self,
        ctx: AgentContext,
        question: str,
        message: str,
        answers: Optional[List[str]] = None,
    ) -> ToolResult:
        """Pause execution and prompt the user for input.

        Parameters
        ----------
        ctx:
            Current agent context.
        question:
            The question to display.
        message:
            Context about what has been tried so far.
        answers:
            Optional multiple-choice answers.

        Returns
        -------
        ToolResult with *output* containing the user's response text.
        """
        ...

    async def create_streamlit_app(
        self,
        ctx: AgentContext,
        message: str,
        streamlit_app_prompt: Optional[str] = None,
    ) -> ToolResult:
        """Create (or open) a Streamlit app preview for this notebook.

        Parameters
        ----------
        ctx:
            Current agent context.
        message:
            The agent's reasoning/context text for the action.
        streamlit_app_prompt:
            Optional high-level app specification for generation.
        """
        ...

    async def edit_streamlit_app(
        self,
        ctx: AgentContext,
        streamlit_app_prompt: str,
        message: str,
    ) -> ToolResult:
        """Edit the existing Streamlit app preview for this notebook.

        Parameters
        ----------
        ctx:
            Current agent context.
        streamlit_app_prompt:
            Required edit instruction describing the desired app changes.
        message:
            The agent's reasoning/context text for the action.
        """
        ...

    async def execute_mcp_tool(
        self,
        ctx: AgentContext,
        mcp_server_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        message: str,
    ) -> ToolResult:
        """Execute a configured MCP tool.

        Parameters
        ----------
        ctx:
            Current agent context.
        mcp_server_id:
            UUID of the configured MCP server in ``~/.mito/mcp/servers.json``.
        tool_name:
            MCP tool name exposed by that server.
        arguments:
            JSON arguments object to pass to the tool call.
        message:
            Agent's reasoning/context for the call.
        """
        ...
