"""Mito AI MCP stdio server bootstrap."""

from __future__ import annotations

import logging
import os
import sys
import uuid
from typing import Any

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
from mito_ai_mcp.utils.roots import McpRoot, list_client_roots

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
async def run_data_analyst(prompt: str, mcp_context: Context) -> dict[str, Any]:
    """Run a one-shot Mito AI analysis and return text plus artifact metadata."""
    progress_step = 0
    logger.info("Detecting ask-user mode for run_data_analyst request")
    ask_user_mode = detect_ask_user_mode(mcp_context)
    logger.info("Resolved ask-user mode: %s", ask_user_mode)
    roots = await list_client_roots(mcp_context)
    _log_discovered_roots(roots)
    prompt_files = _resolve_prompt_files_from_roots(roots)
    logger.info("Resolved %s files from MCP roots for prompt context", len(prompt_files))
    notebook_path = _resolve_notebook_output_path(roots)
    logger.info("Resolved notebook output path: %s", notebook_path)
    kernel_cwd = _resolve_kernel_cwd_from_roots(roots)
    logger.info("Resolved kernel cwd from roots: %s", kernel_cwd)

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
            notebook_path=notebook_path,
            kernel_cwd=kernel_cwd,
            files=prompt_files or None,
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
    final_text = _append_notebook_path_to_final_text(result.final_text, result.notebook_path)
    return {
        "final_text": final_text,
        "metadata": {
            "notebook_path": result.notebook_path,
            "artifact_paths": result.artifact_paths,
        },
    }


def _resolve_notebook_output_path(roots: list[McpRoot]) -> str:
    notebook_name = f"mito-{uuid.uuid4().hex}.ipynb"
    for root in roots:
        if root.path is None:
            continue
        if _is_writable_directory(root.path):
            return os.path.join(root.path, notebook_name)

    logger.info("No writable MCP roots detected; defaulting notebook path to current directory")
    return os.path.abspath(notebook_name)


def _resolve_kernel_cwd_from_roots(roots: list[McpRoot]) -> str | None:
    for root in roots:
        if root.path is None:
            continue
        absolute_path = os.path.abspath(root.path)
        if _is_writable_directory(absolute_path):
            return absolute_path
    return None


def _is_writable_directory(path: str) -> bool:
    return os.path.isdir(path) and os.access(path, os.W_OK | os.X_OK)


def _log_discovered_roots(roots: list[McpRoot]) -> None:
    if not roots:
        logger.info("MCP roots/list returned no roots")
        return

    logger.info("MCP roots/list returned %s root(s)", len(roots))
    for index, root in enumerate(roots):
        if not root.path:
            logger.info("MCP root[%s]: uri=%s path=<none>", index, root.uri)
            continue

        absolute_path = os.path.abspath(root.path)
        logger.info(
            "MCP root[%s]: uri=%s path=%s is_dir=%s readable=%s writable=%s",
            index,
            root.uri,
            absolute_path,
            os.path.isdir(absolute_path),
            os.access(absolute_path, os.R_OK | os.X_OK),
            os.access(absolute_path, os.W_OK | os.X_OK),
        )


def _resolve_prompt_files_from_roots(roots: list[McpRoot], *, max_files: int = 200) -> list[str]:
    files: list[str] = []
    seen_files: set[str] = set()

    def _add(value: str) -> None:
        if value in seen_files:
            return
        seen_files.add(value)
        files.append(value)

    for root in roots:
        if len(files) >= max_files:
            break

        path = root.path
        if not path:
            continue

        absolute_path = os.path.abspath(path)
        if os.path.isfile(absolute_path):
            _add(absolute_path)
            _add(os.path.basename(absolute_path))
            continue

        if not _is_readable_directory(absolute_path):
            continue

        try:
            for name in sorted(os.listdir(absolute_path)):
                child_path = os.path.join(absolute_path, name)
                if not os.path.isfile(child_path):
                    continue
                _add(os.path.abspath(child_path))
                _add(name)
                if len(files) >= max_files:
                    break
        except OSError as exc:
            logger.warning("Failed listing files for MCP root %s: %s", absolute_path, exc)

    return files


def _is_readable_directory(path: str) -> bool:
    return os.path.isdir(path) and os.access(path, os.R_OK | os.X_OK)


def _append_notebook_path_to_final_text(final_text: str, notebook_path: str | None) -> str:
    if not notebook_path:
        return final_text
    if notebook_path in final_text:
        return final_text
    return f"{final_text}\n\nNotebook saved to: {notebook_path}"


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

