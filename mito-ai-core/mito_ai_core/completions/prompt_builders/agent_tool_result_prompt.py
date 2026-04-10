# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List

from mito_ai_core.agent import ToolResult
from mito_ai_core.agent.types import AgentContext
from mito_ai_core.completions.prompt_builders.prompt_section_registry import SG, Prompt
from mito_ai_core.completions.prompt_builders.prompt_section_registry.base import PromptSection


def format_tool_result(response_type: str, result: ToolResult) -> str:
    """Format a ``ToolResult`` into a human-readable string for the LLM."""
    tool_label = result.tool_name or response_type
    lines: list[str] = []
    
    if result.success:
        lines.append(f"Tool '{tool_label}' succeeded.")
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
        SG.Notebook(context.cells),
        SG.Task("Continue working on the user's task until you have finished"),
    ]

    prompt = Prompt(sections)
    return str(prompt)
