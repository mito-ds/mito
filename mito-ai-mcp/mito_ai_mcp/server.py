"""Mito AI MCP stdio server bootstrap."""

from __future__ import annotations

from typing import Any

from mcp.server.fastmcp import Context, FastMCP

from mito_ai_core.agent import ToolResult
from mito_ai_core.completions.models import AgentResponse
from mito_ai_mcp.request_agent_execution import RequestAgentExecutionManager

SERVER_NAME = "mito-ai-mcp"

mcp = FastMCP(name=SERVER_NAME)
request_agent_execution_manager = RequestAgentExecutionManager()


@mcp.tool(
    name="run_data_analyst",
    description="Run a natural language data analyst request with Mito AI.",
)
async def run_data_analyst(prompt: str, ctx: Context) -> str:
    """Run a one-shot Mito AI analysis and return final text output."""
    progress_step = 0

    async def publish_progress(message: str) -> None:
        nonlocal progress_step
        progress_step += 1
        await _report_progress(ctx, progress=progress_step, message=message)

    await publish_progress("Starting analysis run")

    async def on_assistant_response(response: AgentResponse) -> None:
        await publish_progress(_format_assistant_progress_message(response))

    async def on_tool_result(tool_result: ToolResult) -> None:
        await publish_progress(_format_tool_progress_message(tool_result))

    result = await request_agent_execution_manager.run_prompt(
        prompt,
        on_assistant_response=on_assistant_response,
        on_tool_result=on_tool_result,
    )
    await publish_progress("Analysis run completed")
    return result.final_text


async def _report_progress(ctx: Context, *, progress: int, message: str) -> None:
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


def _format_assistant_progress_message(response: AgentResponse) -> str:
    response_type = response.type.replace("_", " ")
    summary = _truncate_single_line(response.message)
    if summary:
        return f"Assistant response ({response_type}): {summary}"
    return f"Assistant response ({response_type})"


def _format_tool_progress_message(tool_result: ToolResult) -> str:
    tool_name = tool_result.tool_name or "unknown tool"
    if tool_result.success:
        return f"Tool completed ({tool_name})"

    error_message = _truncate_single_line(tool_result.error_message)
    if error_message:
        return f"Tool failed ({tool_name}): {error_message}"
    return f"Tool failed ({tool_name})"


def _truncate_single_line(text: str | None, max_chars: int = 140) -> str:
    if not text:
        return ""

    compact = " ".join(text.strip().split())
    if len(compact) <= max_chars:
        return compact
    return f"{compact[: max_chars - 3]}..."


async def _await_if_needed(value: Any) -> None:
    if hasattr(value, "__await__"):
        await value


def main() -> None:
    """Run the MCP server over stdio transport."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

