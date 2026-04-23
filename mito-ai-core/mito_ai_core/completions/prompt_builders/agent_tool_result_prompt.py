# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List

from mito_ai_core.agent import ToolResult
from mito_ai_core.agent.types import AgentContext
from mito_ai_core.completions.prompt_builders.mcp_tools import format_available_mcp_tools
from mito_ai_core.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection


def format_tool_result(response_type: str, result: ToolResult) -> str:
    """Format a ``ToolResult`` into a human-readable string for the LLM."""
    tool_label = result.tool_name or response_type
    lines: list[str] = []
    
    if result.success:
        lines.append(f"Tool '{tool_label}' succeeded.")
        # --- get_cell_output: technical debt (see also ToolResult, ai_optimized_message) ---
        # Jupyter path: output is base64 PNG; the LLM sees it as an image via
        # create_ai_optimized_tool_result_message, so we skip duplicating output in
        # the text block below (line with response_type != "get_cell_output").
        # CLI / headless path: only plain text exists. Putting that in *output*
        # would still route through the image URL branch (wrong MIME / not a PNG).
        # Executors therefore set output=None and carry plain text in *error_message*
        # even when success=True — overloading a field meant for failures.
        # Cleanup: dedicated fields (e.g. output_plain_text vs output_image_base64)
        # or a typed payload per tool, and branch multimodal vs text in one place.
        if result.tool_name == "get_cell_output" and result.error_message:
            lines.append(result.error_message)
    else:
        lines.append(
            f"Tool '{tool_label}' failed: "
            f"{result.error_message or 'unknown error'}"
        )
        
    if result.output and response_type != "get_cell_output":
        lines.append(f"Output:\n{result.output}")
        
    return "\n".join(lines)


def create_agent_tool_result_prompt(context: AgentContext, tool_result: ToolResult) -> str:
    response_type = tool_result.tool_name or ""
    formatted_tool_result = format_tool_result(response_type, tool_result)
    
    sections: List[PromptSection] = [
        SG.Generic("Tool Result", formatted_tool_result),
        SG.Rules(context.additional_context),
        SG.Files(context.files),
        SG.Variables(context.variables),
        SG.Generic(
            "Available MCP Tools",
            format_available_mcp_tools(context.mcp_tools),
        ),
        SG.Notebook(context.cells),
        SG.Task("Continue working on the user's task until you have finished"),
    ]

    prompt = Prompt(sections)
    return str(prompt)
