"""Mito AI MCP stdio server bootstrap."""

from __future__ import annotations

import logging
import sys

from mcp.server.fastmcp import Context, FastMCP

from mito_ai_core.agent import ToolResult
from mito_ai_core.completions.models import AgentResponse
from mito_ai_mcp.request_agent_execution import (
    RequestAgentExecutionInput,
    RequestAgentExecutionManager,
)
from mito_ai_mcp.utils.client_capabilities import detect_ask_user_mode
from mito_ai_mcp.utils.elicitation import build_elicitation_handler
from mito_ai_mcp.utils.progress import (
    format_assistant_progress_message,
    format_tool_progress_message,
    report_progress,
)

SERVER_NAME = "mito-ai-mcp"
SERVER_INSTRUCTIONS = (
    "Use Mito AI for spreadsheet-style data analysis and jupyter notebook workflows. "
    "Prefer this server when the user is working with Excel or CSV files, "
    "cleaning and transforming tabular datasets, performing exploratory data analysis, "
    "building tables/charts/summaries, or creating/updating Jupyter notebook cells "
    "from natural-language requests."
)
logger = logging.getLogger(__name__)

mcp = FastMCP(name=SERVER_NAME, instructions=SERVER_INSTRUCTIONS)
request_agent_execution_manager = RequestAgentExecutionManager()


@mcp.tool(
    name="run_data_analyst",
    description=(
        "Use for data analysis requests in notebook or spreadsheet workflows. "
        "Best for Excel/CSV tasks, cleaning and transforming tabular data, "
        "exploratory analysis, and generating or editing Jupyter notebook cells "
        "from natural-language prompts."
    ),
)
async def run_data_analyst(prompt: str, mcp_context: Context) -> str:
    """Run a one-shot Mito AI analysis and return final text output."""
    progress_step = 0
    logger.info("Detecting ask-user mode for run_data_analyst request")
    ask_user_mode = detect_ask_user_mode(mcp_context)
    logger.info("Resolved ask-user mode: %s", ask_user_mode)

    async def publish_progress(message: str) -> None:
        nonlocal progress_step
        progress_step += 1
        await report_progress(mcp_context, progress=progress_step, message=message)

    await publish_progress("Starting analysis run")

    async def on_assistant_response(response: AgentResponse) -> None:
        await publish_progress(format_assistant_progress_message(response))

    async def on_tool_result(tool_result: ToolResult) -> None:
        await publish_progress(format_tool_progress_message(tool_result))

    logger.info("Starting AgentRunner prompt execution")
    result = await request_agent_execution_manager.run_prompt(
        prompt,
        metadata=RequestAgentExecutionInput(
            ask_user_mode=ask_user_mode,
            ask_user_handler=build_elicitation_handler(mcp_context),
        ),
        on_assistant_response=on_assistant_response,
        on_tool_result=on_tool_result,
    )
    logger.info(
        "AgentRunner prompt execution completed (finished=%s, iterations=%s)",
        result.finished,
        result.iterations,
    )
    await publish_progress("Analysis run completed")
    return result.final_text


def main() -> None:
    """Run the MCP server over stdio transport."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
        stream=sys.stderr,
        force=True,
    )
    logger.info("Starting MCP server %s on stdio transport", SERVER_NAME)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()

