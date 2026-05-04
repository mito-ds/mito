# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""Progress reporting and message formatting helpers."""

from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import Context

from mito_ai_core.agent import ToolResult
from mito_ai_core.completions.models import AgentResponse


async def report_progress(ctx: Context, *, progress: int, message: str) -> None:
    """Send progress updates with compatibility fallbacks for client SDK versions."""
    try:
        await ctx.report_progress(progress=progress, message=message)
        return
    except TypeError:
        try:
            await ctx.report_progress(progress, None, message)
            return
        except Exception:
            pass
    except Exception:
        pass

    info_fn = getattr(ctx, "info", None)
    if callable(info_fn):
        await _await_if_needed(info_fn(message))


def format_assistant_progress_message(response: AgentResponse) -> str:
    response_type = response.type.replace("_", " ")
    if response.message:
        return f"Assistant response ({response_type}): {response.message}"
    return f"Assistant response ({response_type})"


def format_tool_progress_message(tool_result: ToolResult) -> str:
    tool_name = tool_result.tool_name or "unknown tool"
    if tool_result.success:
        return f"Tool completed ({tool_name})"

    if tool_result.error_message:
        return f"Tool failed ({tool_name}): {tool_result.error_message}"
    return f"Tool failed ({tool_name})"


async def _await_if_needed(value: Any) -> None:
    if hasattr(value, "__await__"):
        await value
